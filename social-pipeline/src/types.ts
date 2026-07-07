/** Shared domain types for the video-to-social pipeline. */

/** A single timed segment of a transcript. */
export interface TranscriptSegment {
  start: number; // seconds
  end: number; // seconds
  text: string;
}

/** The full transcript of a recording, plus the joined plain text for convenience. */
export interface Transcript {
  text: string;
  segments?: TranscriptSegment[];
  language?: string;
}

/** A recorded video plus its transcript, as handed over from Tella. */
export interface VideoAsset {
  /** Local file path OR a publicly reachable URL to the video file. */
  source: string;
  /** True when `source` is an http(s) URL rather than a local path. */
  isUrl: boolean;
  title?: string;
  durationSeconds?: number;
  transcript: Transcript;
}

/** Canonical platform identifiers understood by the Zernio client. */
export type Platform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "facebook"
  | "linkedin"
  | "google_business"
  | "twitter"
  | "pinterest"
  | "reddit"
  | "threads"
  | "bluesky"
  | "telegram"
  | "whatsapp"
  | "snapchat"
  | "discord";

/** A caption tailored to one specific platform. */
export interface PlatformCaption {
  platform: Platform;
  /** Main caption / description text. */
  caption: string;
  /** Hashtags without the leading '#', already de-duplicated. */
  hashtags: string[];
  /** Optional short title (used by YouTube). */
  title?: string;
}

/** Result of a publish attempt for one post (which may fan out to many platforms). */
export interface PublishResult {
  postId: string;
  status: string;
  platforms: Platform[];
  raw: unknown;
}
