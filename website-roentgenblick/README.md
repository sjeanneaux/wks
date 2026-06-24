# Website-Röntgenblick

Eine Chrome-Erweiterung (Manifest V3), die die aktuell geöffnete Webseite auf Knopfdruck analysiert –
mit einem lokalen Technik-Schnellcheck und einer KI-Bewertung nach Verkaufspsychologie.
Die KI-Analyse läuft über die Anthropic-API (Claude) mit einem **eigenen API-Key**; jede Analyse kostet nur wenige Cent.

## Der Analyseprozess in drei Stufen

1. **Lesen** (`content.js`) – Beim Klick sammelt ein Skript auf der geöffneten Seite alle sichtbaren Texte,
   Überschriften, Buttons, die geladenen Ressourcen sowie die **echt gemessene Ladezeit** (Navigation Timing API) ein.
2. **Prüfen** (`content.js`) – Feste Regeln prüfen die Technik lokal im Browser:
   Google-Fonts-Einbindung (DSGVO), Title & Meta-Description, Impressum/Datenschutz-Links,
   HTTPS, Viewport, Alt-Texte, Ladezeit/Ressourcen und die **Lesbarkeit für KI-Suchmaschinen**
   (semantisches HTML, `noindex`, strukturierte Daten). Liefert Hinweise zu **DSGVO-Konformität**,
   **SEO** und **KI-Readiness**.
3. **Verstehen** (`background.js`) – Der gesammelte Seitentext wird zusammen mit einem festen
   Bewertungskatalog an Claude (`claude-opus-4-8`) gesendet. Die KI wird per **Structured Output**
   (`output_config.format`) in ein festes Antwortformat gezwungen und liefert pro Baustein einen
   **Score**, **wörtliche Zitate**, eine **Handlungsempfehlung** und ein **fertiges Beispiel**.
   Daraus errechnet die Erweiterung einen Gesamtscore und ein **Ampelurteil** (rot / orange / grün).

## Zwei Bewertungskataloge (je 14 Bausteine)

`catalogs.js` enthält zwei Kataloge, sodass zwischen **Onlineshops** und **Unternehmensseiten**
unterschieden werden kann (auto-erkannt oder manuell wählbar). Grundlage sind Verkaufspsychologie
und Studien (z. B. Baymard Institute, Harvard Business Review) – u. a. Nutzenversprechen & Klarheit,
Einwandbehandlung, Zielgruppenansprache, Reaktionszeit & Verbindlichkeit, mobile Nutzbarkeit/Ladetempo
und – speziell für Shops – Kosten- & Versandtransparenz sowie Checkout-Klarheit.

## Installation

1. `chrome://extensions` öffnen, **Entwicklermodus** aktivieren.
2. **„Entpackte Erweiterung laden"** → diesen Ordner (`website-roentgenblick/`) auswählen.
3. Auf das Icon klicken → ⚙️ Einstellungen → **Anthropic API-Key** eintragen und speichern.
   (Key wird ausschließlich lokal via `chrome.storage.local` gespeichert.)
4. Beliebige Webseite öffnen → Icon klicken → **„Seite analysieren"**.

## Dateien

| Datei | Aufgabe |
|------|---------|
| `manifest.json` | MV3-Konfiguration, Permissions (`activeTab`, `scripting`, `storage`), Host für `api.anthropic.com` |
| `content.js` | Stufe 1 (Lesen) + Stufe 2 (Prüfen) – wird in die Seite injiziert |
| `background.js` | Stufe 3 (Verstehen) – Service Worker, ruft die Claude-API auf |
| `catalogs.js` | Die zwei Bewertungskataloge + JSON-Schema für Structured Output |
| `popup.html/.css/.js` | Bedienoberfläche, Anzeige von Technik-Check + KI-Bewertung + Ampel |
| `icons/` | Erweiterungs-Icons (per `generate_icons.py` erzeugt) |

## Hinweise

- Der API-Key wird nur an `api.anthropic.com` gesendet. Der Aufruf nutzt den Header
  `anthropic-dangerous-direct-browser-access: true`, der CORS-Zugriffe aus dem Browser erlaubt.
- `chrome://`-Seiten und der Web Store können technisch nicht analysiert werden (nur `http`/`https`).
