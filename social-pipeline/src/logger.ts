/** Tiny structured logger — no dependency, timestamped, level-tagged. */

type Level = "info" | "warn" | "error" | "debug";

function emit(level: Level, msg: string, meta?: unknown): void {
  const ts = new Date().toISOString();
  const tag = level.toUpperCase().padEnd(5);
  const line = `${ts} ${tag} ${msg}`;
  const stream = level === "error" || level === "warn" ? console.error : console.log;
  if (meta !== undefined) {
    stream(line, typeof meta === "string" ? meta : JSON.stringify(meta));
  } else {
    stream(line);
  }
}

export const log = {
  info: (msg: string, meta?: unknown) => emit("info", msg, meta),
  warn: (msg: string, meta?: unknown) => emit("warn", msg, meta),
  error: (msg: string, meta?: unknown) => emit("error", msg, meta),
  debug: (msg: string, meta?: unknown) => {
    if (process.env.DEBUG) emit("debug", msg, meta);
  },
};
