import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { Config } from "../config.js";
import { requireKeys } from "../config.js";
import type { Platform, PlatformCaption, PublishResult, VideoAsset } from "../types.js";
import { ZERNIO_PLATFORM_ID, composeCaption } from "./platforms.js";
import { log } from "../logger.js";

/**
 * Minimal client for the Zernio social publishing API.
 * Docs: https://docs.zernio.com  (base URL: https://zernio.com/api)
 *
 * Flow:
 *   1. POST /v1/media/presign        -> { uploadUrl, publicUrl }
 *   2. PUT uploadUrl (raw bytes)     -> uploads the file to storage
 *   3. POST /v1/posts                -> creates one post fanned out to N platforms
 *   4. GET  /v1/posts/{id}           -> poll status
 *
 * Field names follow Zernio's documented shapes; a few optional ones are best-effort
 * and centralised here so they are trivial to adjust if the API differs.
 */
export class ZernioClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(config: Config) {
    requireKeys(config, ["ZERNIO_API_KEY"]);
    this.baseUrl = config.ZERNIO_BASE_URL.replace(/\/$/, "");
    this.apiKey = config.ZERNIO_API_KEY!;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers ?? {}),
      },
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Zernio ${init.method ?? "GET"} ${path} failed: ${res.status} ${res.statusText} — ${text}`);
    }
    return (text ? JSON.parse(text) : {}) as T;
  }

  /** Step 1+2: get a presigned URL and upload the video bytes. Returns the public URL. */
  async uploadMedia(asset: VideoAsset): Promise<string> {
    // If the video is already a public URL, Zernio can ingest it directly.
    if (asset.isUrl) {
      log.info("Using remote video URL directly (no upload needed)", { url: asset.source });
      return asset.source;
    }

    const filename = basename(asset.source);
    const bytes = await readFile(asset.source);

    const presign = await this.request<{ uploadUrl: string; publicUrl: string }>("/v1/media/presign", {
      method: "POST",
      body: JSON.stringify({ filename, contentType: "video/mp4", size: bytes.byteLength }),
    });

    log.info("Uploading video to Zernio storage", { filename, bytes: bytes.byteLength });
    const put = await fetch(presign.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "video/mp4" },
      body: bytes,
    });
    if (!put.ok) {
      throw new Error(`Media PUT upload failed: ${put.status} ${put.statusText}`);
    }
    return presign.publicUrl;
  }

  /** Step 3: create a single post that publishes to every requested platform. */
  async createPost(params: {
    mediaUrl: string;
    captions: PlatformCaption[];
    /** Caption used for platforms without a tailored one. */
    defaultCaption: string;
    scheduledAt?: Date;
  }): Promise<PublishResult> {
    const captionByPlatform = new Map<Platform, PlatformCaption>();
    for (const c of params.captions) captionByPlatform.set(c.platform, c);

    const platforms = params.captions.map((c) => {
      const text = composeCaption(c.caption, c.hashtags, c.platform);
      const platformSpecificData: Record<string, unknown> = { caption: text };
      // YouTube wants a distinct title; reuse the generated one when present.
      if (c.platform === "youtube" && c.title) platformSpecificData.title = c.title;
      return { platform: ZERNIO_PLATFORM_ID[c.platform], platformSpecificData };
    });

    const body = {
      content: params.defaultCaption,
      mediaItems: [{ type: "video", url: params.mediaUrl }],
      platforms,
      ...(params.scheduledAt ? { scheduledAt: params.scheduledAt.toISOString() } : {}),
    };

    log.info("Creating Zernio post", { platforms: params.captions.map((c) => c.platform) });
    const res = await this.request<{ id?: string; postId?: string; status?: string }>("/v1/posts", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const postId = res.id ?? res.postId;
    if (!postId) throw new Error(`Zernio did not return a post id: ${JSON.stringify(res)}`);

    return {
      postId,
      status: res.status ?? "submitted",
      platforms: params.captions.map((c) => c.platform),
      raw: res,
    };
  }

  /** Step 4: fetch current status of a post. */
  async getPost(postId: string): Promise<{ status: string; raw: unknown }> {
    const res = await this.request<{ status?: string }>(`/v1/posts/${encodeURIComponent(postId)}`);
    return { status: res.status ?? "unknown", raw: res };
  }
}
