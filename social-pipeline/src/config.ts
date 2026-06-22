import "dotenv/config";
import { z } from "zod";
import type { Platform } from "./types.js";

const ALL_PLATFORMS: Platform[] = [
  "instagram",
  "tiktok",
  "youtube",
  "facebook",
  "linkedin",
  "google_business",
  "twitter",
  "pinterest",
  "reddit",
  "threads",
  "bluesky",
  "telegram",
  "whatsapp",
  "snapchat",
  "discord",
];

const platformList = z
  .string()
  .default("instagram,tiktok,youtube,facebook,linkedin,google_business")
  .transform((s) =>
    s
      .split(",")
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean),
  )
  .pipe(z.array(z.enum(ALL_PLATFORMS as [Platform, ...Platform[]])));

const keywordLinks = z
  .string()
  .default("{}")
  .transform((s, ctx) => {
    try {
      const parsed = JSON.parse(s) as Record<string, string>;
      return parsed;
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ENGAGE_KEYWORD_LINKS must be valid JSON" });
      return z.NEVER;
    }
  });

const schema = z.object({
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-6"),

  ZERNIO_API_KEY: z.string().optional(),
  ZERNIO_BASE_URL: z.string().url().default("https://zernio.com/api"),
  TARGET_PLATFORMS: platformList,

  TELLA_VIDEO_PATH: z.string().optional(),
  TELLA_TRANSCRIPT_PATH: z.string().optional(),

  ENGAGE_KEYWORD_LINKS: keywordLinks,
  ENGAGE_WEBHOOK_PORT: z.coerce.number().int().positive().default(8787),
});

export type Config = z.infer<typeof schema>;

let cached: Config | null = null;

export function loadConfig(): Config {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** Throws a friendly error if a required secret for a given feature is missing. */
export function requireKeys(config: Config, keys: (keyof Config)[]): void {
  const missing = keys.filter((k) => !config[k]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        `Copy .env.example to .env and fill them in.`,
    );
  }
}
