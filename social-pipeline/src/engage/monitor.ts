import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { Config } from "../config.js";
import { log } from "../logger.js";

/**
 * Comment / DM engagement bot.
 *
 * The brief: after publishing, watch incoming comments and DMs and auto-reply.
 * When a user comments a keyword, send them the matching link by DM — replacing
 * paid tools like ManyChat.
 *
 * Delivery model: Zernio (or the platforms' own webhooks) POSTs engagement
 * events to this server. We match the comment text against ENGAGE_KEYWORD_LINKS
 * and emit the reply/DM action. The actual "send DM" call is delegated to
 * `sendDirectMessage`, which is wired to the publishing provider.
 */

export interface EngagementEvent {
  type: "comment" | "dm";
  platform: string;
  postId?: string;
  userId: string;
  username?: string;
  text: string;
}

export interface ReplyAction {
  kind: "dm" | "comment_reply";
  platform: string;
  userId: string;
  message: string;
}

/** Decide how to respond to one engagement event. Returns null when nothing matches. */
export function decideReply(event: EngagementEvent, keywordLinks: Record<string, string>): ReplyAction | null {
  const text = event.text.toLowerCase();
  for (const [keyword, link] of Object.entries(keywordLinks)) {
    if (text.includes(keyword.toLowerCase())) {
      return {
        kind: "dm",
        platform: event.platform,
        userId: event.userId,
        message: `Hi${event.username ? " @" + event.username : ""}! Hier ist dein Link: ${link}`,
      };
    }
  }
  return null;
}

/**
 * Send a direct message / reply via the publishing provider.
 *
 * Stub: Zernio's engagement/DM endpoints (if used) plug in here. Until then we
 * log the intended action so the matching logic can be tested end-to-end.
 */
export async function sendDirectMessage(action: ReplyAction, _config: Config): Promise<void> {
  // TODO: replace with the real DM/reply API call once the provider endpoint is confirmed.
  log.info("DM action (not yet sent — provider endpoint stubbed)", action);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

/** Start the webhook server that listens for comment/DM events. */
export function startEngagementServer(config: Config): { close: () => void } {
  const keywordLinks = config.ENGAGE_KEYWORD_LINKS;
  if (Object.keys(keywordLinks).length === 0) {
    log.warn("ENGAGE_KEYWORD_LINKS is empty — the bot will match nothing until you configure it.");
  }

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200).end("ok");
      return;
    }
    if (req.method !== "POST" || req.url !== "/webhook") {
      res.writeHead(404).end("not found");
      return;
    }

    try {
      const event = JSON.parse(await readBody(req)) as EngagementEvent;
      log.info("Engagement event", { type: event.type, platform: event.platform, user: event.username });

      const action = decideReply(event, keywordLinks);
      if (action) {
        await sendDirectMessage(action, config);
        res.writeHead(200).end(JSON.stringify({ handled: true, action: action.kind }));
      } else {
        res.writeHead(200).end(JSON.stringify({ handled: false }));
      }
    } catch (err) {
      log.error("Failed to handle engagement event", String(err));
      res.writeHead(400).end(JSON.stringify({ error: "bad request" }));
    }
  });

  server.listen(config.ENGAGE_WEBHOOK_PORT, () => {
    log.info(`Engagement webhook listening on :${config.ENGAGE_WEBHOOK_PORT} (POST /webhook)`);
  });

  return { close: () => server.close() };
}
