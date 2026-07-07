import type { Platform } from "../types.js";

/**
 * Maps our canonical platform ids to the identifiers Zernio expects in the
 * `platforms[].platform` field, plus a couple of per-platform hints.
 *
 * If Zernio uses different string ids, change them here only.
 */
export const ZERNIO_PLATFORM_ID: Record<Platform, string> = {
  instagram: "instagram",
  tiktok: "tiktok",
  youtube: "youtube",
  facebook: "facebook",
  linkedin: "linkedin",
  google_business: "google_business",
  twitter: "twitter",
  pinterest: "pinterest",
  reddit: "reddit",
  threads: "threads",
  bluesky: "bluesky",
  telegram: "telegram",
  whatsapp: "whatsapp",
  snapchat: "snapchat",
  discord: "discord",
};

/** Soft caption length limits used to trim before sending. */
export const CAPTION_LIMIT: Record<Platform, number> = {
  instagram: 2200,
  tiktok: 2200,
  youtube: 5000,
  facebook: 63206,
  linkedin: 3000,
  google_business: 1500,
  twitter: 280,
  pinterest: 500,
  reddit: 40000,
  threads: 500,
  bluesky: 300,
  telegram: 4096,
  whatsapp: 1024,
  snapchat: 250,
  discord: 2000,
};

/** Join a caption with its hashtags and trim to the platform limit. */
export function composeCaption(caption: string, hashtags: string[], platform: Platform): string {
  const tags = hashtags.length ? "\n\n" + hashtags.map((h) => `#${h}`).join(" ") : "";
  const full = `${caption}${tags}`.trim();
  const limit = CAPTION_LIMIT[platform];
  return full.length <= limit ? full : full.slice(0, limit - 1).trimEnd() + "…";
}
