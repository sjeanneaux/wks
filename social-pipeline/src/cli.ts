#!/usr/bin/env node
import { Command } from "commander";
import { loadConfig } from "./config.js";
import { loadFromTella } from "./tella/tella.js";
import { runPublishPipeline } from "./pipeline.js";
import { generateBlogPost } from "./blog/generate.js";
import { ZernioClient } from "./publish/zernio.js";
import { startEngagementServer } from "./engage/monitor.js";
import { log } from "./logger.js";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const program = new Command();
program
  .name("social-pipeline")
  .description("Record (Tella) -> AI captions/blog -> Zernio multi-platform publish -> comment/DM auto-reply")
  .version("0.1.0");

program
  .command("publish")
  .description("Generate tailored captions and publish the video to all target platforms")
  .option("--video <path>", "Local video file or public URL (overrides TELLA_VIDEO_PATH)")
  .option("--transcript <path>", "Transcript file .txt/.json (overrides TELLA_TRANSCRIPT_PATH)")
  .option("--title <title>", "Video title")
  .option("--platforms <list>", "Comma-separated platforms (overrides TARGET_PLATFORMS)")
  .option("--brand-voice <text>", "Brand voice / tone guidance for the copywriter")
  .option("--with-blog", "Also generate a blog post from the transcript", false)
  .option("--schedule <iso>", "Schedule publish time (ISO 8601) instead of posting now")
  .option("--out <dir>", "Output directory for artifacts", "out")
  .option("--dry-run", "Generate captions/blog only; do not publish", false)
  .action(async (opts) => {
    const config = loadConfig();
    const platforms = opts.platforms
      ? (String(opts.platforms).split(",").map((p: string) => p.trim().toLowerCase()) as typeof config.TARGET_PLATFORMS)
      : config.TARGET_PLATFORMS;

    const asset = await loadFromTella(config, {
      videoPath: opts.video,
      transcriptPath: opts.transcript,
      title: opts.title,
    });

    await runPublishPipeline(config, asset, {
      platforms,
      scheduledAt: opts.schedule ? new Date(opts.schedule) : undefined,
      brandVoice: opts.brandVoice,
      withBlog: Boolean(opts.withBlog),
      outDir: opts.out,
      dryRun: Boolean(opts.dryRun),
    });
  });

program
  .command("blog")
  .description("Generate a blog post from a transcript")
  .option("--transcript <path>", "Transcript file .txt/.json (overrides TELLA_TRANSCRIPT_PATH)")
  .option("--title <title>", "Suggested title")
  .option("--words <n>", "Target word count", "700")
  .option("--out <dir>", "Output directory", "out")
  .action(async (opts) => {
    const config = loadConfig();
    const asset = await loadFromTella(config, { transcriptPath: opts.transcript, title: opts.title });
    const blog = await generateBlogPost(config, asset.transcript, {
      title: opts.title,
      targetWords: Number(opts.words),
    });
    await mkdir(opts.out, { recursive: true });
    const file = join(opts.out, "blog.md");
    await writeFile(file, blog.markdown);
    log.info("Blog post written", { file, title: blog.title });
  });

program
  .command("status")
  .description("Check the status of a published post")
  .argument("<postId>", "Zernio post id")
  .action(async (postId: string) => {
    const config = loadConfig();
    const client = new ZernioClient(config);
    const { status, raw } = await client.getPost(postId);
    log.info("Post status", { postId, status });
    console.log(JSON.stringify(raw, null, 2));
  });

program
  .command("engage")
  .description("Start the comment/DM webhook server with keyword auto-reply")
  .action(async () => {
    const config = loadConfig();
    const server = startEngagementServer(config);
    process.on("SIGINT", () => {
      log.info("Shutting down engagement server");
      server.close();
      process.exit(0);
    });
  });

program.parseAsync().catch((err) => {
  log.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
