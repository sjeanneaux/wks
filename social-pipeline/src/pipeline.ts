import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Config } from "./config.js";
import type { Platform, PublishResult, VideoAsset } from "./types.js";
import { generateCaptions } from "./captions/generate.js";
import { generateBlogPost } from "./blog/generate.js";
import { ZernioClient } from "./publish/zernio.js";
import { composeCaption } from "./publish/platforms.js";
import { log } from "./logger.js";

export interface PublishOptions {
  platforms: Platform[];
  scheduledAt?: Date;
  brandVoice?: string;
  /** When true, generate + save a blog post too. */
  withBlog?: boolean;
  /** Directory for generated artifacts (captions.json, blog.md). */
  outDir?: string;
  /** Skip the actual Zernio publish — just generate and save captions. */
  dryRun?: boolean;
}

/**
 * Full flow: transcript -> tailored captions (+ optional blog) -> upload -> publish.
 */
export async function runPublishPipeline(
  config: Config,
  asset: VideoAsset,
  options: PublishOptions,
): Promise<PublishResult | null> {
  const outDir = options.outDir ?? "out";
  await mkdir(outDir, { recursive: true });

  // 1. Tailored captions per platform.
  const captions = await generateCaptions(config, asset.transcript, options.platforms, {
    title: asset.title,
    brandVoice: options.brandVoice,
  });
  await writeFile(join(outDir, "captions.json"), JSON.stringify(captions, null, 2));
  log.info("Saved captions", { file: join(outDir, "captions.json") });

  // 2. Optional blog post from the same transcript.
  if (options.withBlog) {
    const blog = await generateBlogPost(config, asset.transcript, {
      title: asset.title,
      brandVoice: options.brandVoice,
    });
    await writeFile(join(outDir, "blog.md"), blog.markdown);
    log.info("Saved blog post", { file: join(outDir, "blog.md"), title: blog.title });
  }

  if (options.dryRun) {
    log.info("Dry run — skipping publish. Review artifacts in", outDir);
    return null;
  }

  // 3. Upload media + publish to all platforms in one Zernio call.
  const zernio = new ZernioClient(config);
  const mediaUrl = await zernio.uploadMedia(asset);

  const defaultCaption = composeCaption(
    captions[0]?.caption ?? asset.transcript.text.slice(0, 200),
    captions[0]?.hashtags ?? [],
    captions[0]?.platform ?? options.platforms[0],
  );

  const result = await zernio.createPost({
    mediaUrl,
    captions,
    defaultCaption,
    scheduledAt: options.scheduledAt,
  });

  log.info("Published", { postId: result.postId, status: result.status, platforms: result.platforms });
  return result;
}
