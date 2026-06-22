import { readFile, stat } from "node:fs/promises";
import { basename } from "node:path";
import type { Config } from "../config.js";
import type { Transcript, VideoAsset } from "../types.js";
import { log } from "../logger.js";

/**
 * Tella integration.
 *
 * Tella (https://www.tella.tv) records the base video and produces a transcript.
 * Per the project brief it exposes a CLI and an MCP server that can hand the
 * video + transcript directly to Claude Code.
 *
 * NOTE: Tella is NOT connected as a CLI/MCP in this environment, so this module
 * does not call Tella directly. Instead it loads a video + transcript that you
 * already have on disk (e.g. exported from Tella) via TELLA_VIDEO_PATH /
 * TELLA_TRANSCRIPT_PATH. When the Tella CLI/MCP becomes available, replace the
 * body of `recordWithTella()` with the real call.
 */

const isUrl = (s: string): boolean => /^https?:\/\//i.test(s);

/** Parse a transcript file. Supports plain .txt and Tella/Whisper-style JSON. */
function parseTranscript(raw: string, filename: string): Transcript {
  if (filename.endsWith(".json")) {
    const data = JSON.parse(raw) as {
      text?: string;
      language?: string;
      segments?: { start: number; end: number; text: string }[];
    };
    const segments = data.segments?.map((s) => ({ start: s.start, end: s.end, text: s.text.trim() }));
    const text = data.text?.trim() ?? segments?.map((s) => s.text).join(" ") ?? "";
    if (!text) throw new Error(`Transcript JSON ${filename} has no usable text`);
    return { text, segments, language: data.language };
  }
  // Plain text fallback.
  const text = raw.trim();
  if (!text) throw new Error(`Transcript file ${filename} is empty`);
  return { text };
}

/**
 * Load the base video + transcript that Tella produced.
 * Reads from the configured paths (or the provided overrides).
 */
export async function loadFromTella(
  config: Config,
  overrides?: { videoPath?: string; transcriptPath?: string; title?: string },
): Promise<VideoAsset> {
  const videoPath = overrides?.videoPath ?? config.TELLA_VIDEO_PATH;
  const transcriptPath = overrides?.transcriptPath ?? config.TELLA_TRANSCRIPT_PATH;

  if (!videoPath) {
    throw new Error(
      "No video source. Set TELLA_VIDEO_PATH (local file or URL) or pass --video. " +
        "Tella CLI/MCP is not wired up in this environment yet.",
    );
  }
  if (!transcriptPath) {
    throw new Error("No transcript. Set TELLA_TRANSCRIPT_PATH or pass --transcript.");
  }

  const transcriptRaw = await readFile(transcriptPath, "utf8");
  const transcript = parseTranscript(transcriptRaw, basename(transcriptPath));

  let durationSeconds: number | undefined;
  if (!isUrl(videoPath)) {
    const info = await stat(videoPath); // throws clearly if the file is missing
    log.debug("Loaded local video", { videoPath, bytes: info.size });
  }

  return {
    source: videoPath,
    isUrl: isUrl(videoPath),
    title: overrides?.title ?? basename(videoPath),
    durationSeconds,
    transcript,
  };
}

/**
 * Placeholder for driving Tella to record a fresh video.
 *
 * Replace this with the real Tella CLI/MCP invocation once available, e.g.:
 *   const { videoUrl, transcript } = await tellaMcp.record({ ... });
 */
export async function recordWithTella(): Promise<VideoAsset> {
  throw new Error(
    "recordWithTella() is not implemented: Tella CLI/MCP is not connected in this environment. " +
      "Record in Tella, export the video + transcript, then use loadFromTella().",
  );
}
