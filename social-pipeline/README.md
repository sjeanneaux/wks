# social-pipeline

Automatisierte Video-zu-Social-Pipeline:

1. **Aufnahme** mit [Tella](https://www.tella.tv) → Video + Transkript
2. **Texterstellung** durch Claude (Anthropic API) → plattformspezifische Captions, optional Blogbeitrag
3. **Veröffentlichung** über [Zernio](https://zernio.com) → ein API-Call postet gleichzeitig auf Instagram Reels, TikTok, YouTube Shorts, Facebook, LinkedIn, Google Business u.a.
4. **Engagement** → Webhook-Server überwacht Kommentare/DMs und antwortet bei Stichwörtern automatisch mit dem passenden Link (ersetzt ManyChat & Co.)

## Architektur

```
            ┌────────────┐   Video + Transkript
   Tella ──▶│ tella.ts   │──────────────────────────┐
 (CLI/MCP)  └────────────┘                           ▼
                                          ┌────────────────────┐
                                          │ captions/generate  │  ── plattformspezifische
                                          │ blog/generate      │     Captions + Blogpost (Claude)
                                          └─────────┬──────────┘
                                                    ▼
                                          ┌────────────────────┐
                                          │ publish/zernio.ts  │  ── presign → upload → /v1/posts
                                          └─────────┬──────────┘
                                                    ▼
                            Instagram · TikTok · YouTube · Facebook · LinkedIn · Google Business …
                                                    │
                              Kommentare / DMs ◀────┘
                                     │
                            ┌────────▼─────────┐
                            │ engage/monitor   │  ── Keyword → Auto-DM mit Link
                            └──────────────────┘
```

## Setup

```bash
cd social-pipeline
npm install
cp .env.example .env   # Schlüssel eintragen
npm run build          # oder: npm run dev -- <command>  (ohne Build, via tsx)
```

Benötigte Schlüssel in `.env`:

| Variable | Wofür |
|---|---|
| `ANTHROPIC_API_KEY` | Caption-/Blog-Generierung |
| `ZERNIO_API_KEY` | Multi-Plattform-Veröffentlichung |
| `TARGET_PLATFORMS` | Zielplattformen (Default: instagram,tiktok,youtube,facebook,linkedin,google_business) |
| `ENGAGE_KEYWORD_LINKS` | JSON: `{"INFO":"https://…"}` für Auto-DM |

## Nutzung

Video veröffentlichen (Transkript → Captions → alle Plattformen):

```bash
npm run dev -- publish \
  --video ./media/clip.mp4 \
  --transcript ./media/clip.json \
  --title "Mein Reel" \
  --with-blog
```

Nur Captions/Blog generieren, ohne zu posten:

```bash
npm run dev -- publish --video ./media/clip.mp4 --transcript ./media/clip.txt --dry-run
```

Nur Blogbeitrag:

```bash
npm run dev -- blog --transcript ./media/clip.json --words 800
```

Status eines Posts prüfen:

```bash
npm run dev -- status <postId>
```

Engagement-Bot (Kommentar-/DM-Auto-Reply) starten:

```bash
ENGAGE_KEYWORD_LINKS='{"INFO":"https://example.com/lp"}' npm run dev -- engage
# Webhook: POST http://localhost:8787/webhook   Health: GET /health
```

## Integrationsstatus / TODO

Dieses Repo ist das **Orchestrierungs-Gerüst**. Diese Stellen brauchen echte Zugänge/Verifikation:

- **Tella** (`src/tella/tella.ts`): In dieser Umgebung ist **kein** Tella-CLI/MCP verbunden. `recordWithTella()` ist ein Stub; aktuell wird Video+Transkript aus Dateien geladen (`loadFromTella`). Sobald CLI/MCP verfügbar ist, dort den echten Aufruf einsetzen.
- **Zernio** (`src/publish/zernio.ts`): Endpunkte (`/v1/media/presign`, `/v1/posts`, `/v1/posts/{id}`) folgen der dokumentierten API. Einige optionale Feldnamen (z.B. `mediaItems[].type`, `platformSpecificData`) sind zentralisiert und ggf. an die exakte API anzupassen. Mit echtem `ZERNIO_API_KEY` testen.
- **Engagement-DM** (`src/engage/monitor.ts`): `sendDirectMessage()` loggt aktuell nur die Aktion. Der eigentliche Versand wird an den Provider-Endpoint angebunden, sobald bestätigt. Die Keyword-Matching-Logik (`decideReply`) ist vollständig funktionsfähig und testbar.

## Projektstruktur

```
src/
├── cli.ts                 # CLI-Einstieg (publish | blog | status | engage)
├── config.ts              # .env laden + validieren (zod)
├── pipeline.ts            # Orchestrierung des Veröffentlichungs-Flows
├── types.ts               # gemeinsame Typen
├── logger.ts              # schlanker Logger
├── tella/tella.ts         # Aufnahme-Quelle (Adapter/Stub)
├── captions/generate.ts   # plattformspezifische Captions (Claude)
├── blog/generate.ts       # Blogbeitrag (Claude)
├── publish/
│   ├── zernio.ts          # Zernio-API-Client
│   └── platforms.ts       # Plattform-IDs, Limits, Caption-Komposition
└── engage/monitor.ts      # Kommentar-/DM-Webhook + Keyword-Auto-Reply
```
