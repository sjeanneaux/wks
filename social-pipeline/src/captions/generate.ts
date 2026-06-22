import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { Config } from "../config.js";
import { requireKeys } from "../config.js";
import type { Platform, PlatformCaption, Transcript } from "../types.js";
import { log } from "../logger.js";

/**
 * Per-platform guidance so each post reads native to its network instead of
 * being copy-pasted identically everywhere.
 */
const PLATFORM_GUIDE: Record<Platform, string> = {
  instagram: "Instagram Reels: warm, visual hook in line 1, 3-6 relevant hashtags, emojis ok, max ~2200 chars.",
  tiktok: "TikTok: punchy, trend-aware, casual, 2-4 hashtags, strong hook, short.",
  youtube: "YouTube Shorts: include a clear searchable title; description with keywords; up to 3 hashtags.",
  facebook: "Facebook: conversational, slightly longer, 1-2 hashtags max, encourage comments.",
  linkedin: "LinkedIn: professional, insight-led, no emojis spam, 3-5 niche hashtags, value-first.",
  google_business: "Google Business Profile: concise, local, informative, a clear call to action, no hashtags.",
  twitter: "X/Twitter: under 280 chars, sharp, 1-2 hashtags.",
  pinterest: "Pinterest: keyword-rich, descriptive, helpful, 3-5 hashtags.",
  reddit: "Reddit: no hashtags, no marketing tone, authentic and community-appropriate.",
  threads: "Threads: casual and conversational, light hashtag use.",
  bluesky: "Bluesky: concise and casual, minimal hashtags.",
  telegram: "Telegram: informative broadcast tone, link-friendly, no hashtags needed.",
  whatsapp: "WhatsApp: short, personal, direct, no hashtags.",
  snapchat: "Snapchat: very short, playful, no hashtags.",
  discord: "Discord: community tone, casual, no hashtags.",
};

const captionSchema = z.object({
  captions: z.array(
    z.object({
      platform: z.string(),
      title: z.string().optional(),
      caption: z.string(),
      hashtags: z.array(z.string()).default([]),
    }),
  ),
});

/** Strip a leading '#' and whitespace from a hashtag. */
const cleanTag = (t: string): string => t.replace(/^#+/, "").trim();

/**
 * Generate one tailored caption per target platform from the video transcript.
 */
export async function generateCaptions(
  config: Config,
  transcript: Transcript,
  platforms: Platform[],
  context?: { title?: string; brandVoice?: string },
): Promise<PlatformCaption[]> {
  requireKeys(config, ["ANTHROPIC_API_KEY"]);
  const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

  const guides = platforms.map((p) => `- ${p}: ${PLATFORM_GUIDE[p]}`).join("\n");

  const system =
    "You are a senior social media copywriter. You write captions that feel native to each platform. " +
    "You never reuse the exact same wording across platforms. You match the language of the transcript. " +
    (context?.brandVoice ? `Brand voice: ${context.brandVoice}. ` : "") +
    "Return ONLY valid JSON matching the requested shape, no prose, no markdown fences.";

  const user = [
    context?.title ? `Video title: ${context.title}` : null,
    "Transcript of the video:",
    '"""',
    transcript.text,
    '"""',
    "",
    "Write one caption per platform below. Tailor tone, length and hashtags to each:",
    guides,
    "",
    'Respond as JSON: {"captions":[{"platform","title?","caption","hashtags":[...]}]} ' +
      "where hashtags are words WITHOUT the # symbol.",
  ]
    .filter(Boolean)
    .join("\n");

  log.info("Generating platform captions", { platforms, model: config.ANTHROPIC_MODEL });

  const res = await client.messages.create({
    model: config.ANTHROPIC_MODEL,
    max_tokens: 2048,
    system,
    messages: [{ role: "user", content: user }],
  });

  const textBlock = res.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock) throw new Error("Model returned no text content");

  const json = extractJson(textBlock.text);
  const parsed = captionSchema.parse(JSON.parse(json));

  const byPlatform = new Map<string, (typeof parsed.captions)[number]>();
  for (const c of parsed.captions) byPlatform.set(c.platform.toLowerCase(), c);

  // Keep order/coverage aligned to the requested platforms.
  return platforms.map((platform) => {
    const c = byPlatform.get(platform);
    if (!c) {
      log.warn(`No caption returned for ${platform}; using transcript fallback`);
      return { platform, caption: transcript.text.slice(0, 200), hashtags: [] };
    }
    return {
      platform,
      title: c.title,
      caption: c.caption.trim(),
      hashtags: [...new Set(c.hashtags.map(cleanTag).filter(Boolean))],
    };
  });
}

/** Pull the first JSON object out of a model response, tolerating stray fences. */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1);
  return text.trim();
}
