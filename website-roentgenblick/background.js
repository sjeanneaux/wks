// background.js  (Service Worker, type: module)
// Stufe 3 (Verstehen): schickt Seitentext + Bewertungskatalog an Claude
// und zwingt die KI per Structured Output in ein festes Antwortformat.

import { KATALOGE, buildSchema } from "./catalogs.js";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-4-8";

const SYSTEM_PROMPT = `Du bist ein Experte für Verkaufspsychologie, Conversion-Optimierung und Website-Analyse.
Deine Bewertung beruht ausschließlich auf etablierten Prinzipien und wissenschaftlichen Studien
(z. B. Baymard Institute zu Checkout/Usability, Harvard Business Review zu Reaktionszeiten und Vertrauen),
nicht auf subjektiven Geschmacksurteilen.

Du bewertest die gelieferte Webseite Baustein für Baustein. Für JEDEN Baustein lieferst du:
- score: eine ganze Zahl von 0 bis 100 (0 = Baustein fehlt/sehr schwach, 100 = vorbildlich umgesetzt).
- zitate: ein Array mit 0 bis 3 WÖRTLICHEN Zitaten von der Seite, die deine Bewertung belegen.
  Zitiere exakt den vorhandenen Text. Wenn es keinen passenden Beleg gibt, gib ein leeres Array zurück.
- empfehlung: eine konkrete, umsetzbare Handlungsempfehlung (1-3 Sätze, kein Allgemeinplatz).
- beispiel: ein fertig formuliertes, einsetzbares Textbeispiel, das der Betreiber direkt übernehmen könnte.

Sei ehrlich und differenziert. Erfinde keine Inhalte, die nicht auf der Seite stehen.
Antworte ausschließlich im vorgegebenen JSON-Format. Sprache: Deutsch.`;

async function analysiere({ pageData, typ }) {
  const { anthropicApiKey } = await chrome.storage.local.get("anthropicApiKey");
  if (!anthropicApiKey) {
    throw new Error("Kein API-Key hinterlegt. Bitte in den Einstellungen einen Anthropic-API-Key eintragen.");
  }

  const katalog = KATALOGE[typ] || KATALOGE.corporate;
  const bausteinIds = katalog.bausteine.map((b) => b.id);
  const schema = buildSchema(bausteinIds);

  const katalogText = katalog.bausteine
    .map((b, i) => `${i + 1}. [${b.id}] ${b.name}\n   ${b.beschreibung}`)
    .join("\n");

  const userContent = `BEWERTUNGSKATALOG (${katalog.label}) – bewerte exakt diese ${katalog.bausteine.length} Bausteine:
${katalogText}

---
ZU BEWERTENDE SEITE
URL: ${pageData.url}
Titel: ${pageData.title}
Meta-Description: ${pageData.metaDescription || "(keine)"}
Gemessene Ladezeit: ${pageData.loadTimeMs != null ? pageData.loadTimeMs + " ms" : "unbekannt"}

ÜBERSCHRIFTEN:
${pageData.headings.map((h) => `${h.tag}: ${h.text}`).join("\n") || "(keine)"}

BUTTONS / HANDLUNGSAUFFORDERUNGEN:
${pageData.buttons.join(" | ") || "(keine erkannt)"}

SICHTBARER SEITENTEXT${pageData.textTruncated ? " (gekürzt)" : ""}:
${pageData.visibleText}

---
Liefere für jeden der ${katalog.bausteine.length} Bausteine genau ein Ergebnis-Objekt zurück.`;

  const body = {
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
    output_config: { format: { type: "json_schema", schema } },
  };

  const resp = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    let msg = `API-Fehler ${resp.status}`;
    try {
      const err = await resp.json();
      if (err?.error?.message) msg += `: ${err.error.message}`;
    } catch (e) {
      /* ignore */
    }
    throw new Error(msg);
  }

  const data = await resp.json();

  if (data.stop_reason === "refusal") {
    throw new Error("Die Analyse wurde aus Sicherheitsgründen abgelehnt.");
  }

  const textBlock = (data.content || []).find((b) => b.type === "text");
  if (!textBlock) throw new Error("Keine verwertbare Antwort von der KI erhalten.");

  let parsed;
  try {
    parsed = JSON.parse(textBlock.text);
  } catch (e) {
    throw new Error("Antwort der KI konnte nicht als JSON gelesen werden.");
  }

  return {
    typ,
    katalogLabel: katalog.label,
    bausteine: katalog.bausteine,
    ergebnisse: parsed.bausteine || [],
    usage: data.usage || null,
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "ANALYZE") {
    analysiere(message.payload)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((err) => sendResponse({ ok: false, error: err.message || String(err) }));
    return true; // asynchrone Antwort
  }
});
