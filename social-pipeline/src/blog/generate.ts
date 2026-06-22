import Anthropic from "@anthropic-ai/sdk";
import type { Config } from "../config.js";
import { requireKeys } from "../config.js";
import type { Transcript } from "../types.js";
import { log } from "../logger.js";

export interface BlogPost {
  title: string;
  markdown: string;
}

/**
 * Turn the video transcript into a standalone blog post.
 *
 * The brief notes Claude Code can "do its own research" from the transcript.
 * Real web research would require a search tool/MCP; this function writes a
 * well-structured post grounded in the transcript and flags where external
 * facts should be verified, rather than inventing sources.
 */
export async function generateBlogPost(
  config: Config,
  transcript: Transcript,
  context?: { title?: string; targetWords?: number; brandVoice?: string },
): Promise<BlogPost> {
  requireKeys(config, ["ANTHROPIC_API_KEY"]);
  const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

  const targetWords = context?.targetWords ?? 700;
  const system =
    "You are an expert content writer. You expand a video transcript into a clear, original blog post " +
    "in the same language as the transcript. You do not fabricate statistics, quotes or sources; " +
    "if a factual claim would benefit from a citation, insert a `[verify]` marker instead of inventing one. " +
    (context?.brandVoice ? `Brand voice: ${context.brandVoice}. ` : "") +
    "Output GitHub-flavored Markdown only.";

  const user = [
    context?.title ? `Suggested title: ${context.title}` : null,
    `Target length: roughly ${targetWords} words.`,
    "Structure: H1 title, a short intro, 3-5 H2 sections, and a closing call to action.",
    "",
    "Transcript:",
    '"""',
    transcript.text,
    '"""',
  ]
    .filter(Boolean)
    .join("\n");

  log.info("Generating blog post", { targetWords, model: config.ANTHROPIC_MODEL });

  const res = await client.messages.create({
    model: config.ANTHROPIC_MODEL,
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: user }],
  });

  const textBlock = res.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock) throw new Error("Model returned no text content");

  const markdown = textBlock.text.trim();
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1]?.trim() ?? context?.title ?? "Untitled";
  return { title, markdown };
}
