// popup.js  (type: module)
import { KATALOGE } from "./catalogs.js";

const $ = (id) => document.getElementById(id);

const els = {
  settings: $("settings"),
  settingsToggle: $("settingsToggle"),
  apiKey: $("apiKey"),
  saveKey: $("saveKey"),
  keyStatus: $("keyStatus"),
  siteType: $("siteType"),
  analyze: $("analyze"),
  status: $("status"),
  results: $("results"),
  verdict: $("verdict"),
  techChecks: $("techChecks"),
  kiResults: $("kiResults"),
};

// ---------- Initialisierung ----------
init();

async function init() {
  const { anthropicApiKey } = await chrome.storage.local.get("anthropicApiKey");
  if (anthropicApiKey) {
    els.apiKey.value = anthropicApiKey;
  } else {
    els.settings.classList.remove("hidden");
    setStatus("Bitte zuerst einen API-Key in den Einstellungen hinterlegen.", "");
  }
}

els.settingsToggle.addEventListener("click", () => {
  els.settings.classList.toggle("hidden");
});

els.saveKey.addEventListener("click", async () => {
  const key = els.apiKey.value.trim();
  if (!key) {
    els.keyStatus.textContent = "Bitte einen Key eingeben.";
    els.keyStatus.className = "status err";
    return;
  }
  await chrome.storage.local.set({ anthropicApiKey: key });
  els.keyStatus.textContent = "Gespeichert ✓";
  els.keyStatus.className = "status ok";
  setTimeout(() => els.settings.classList.add("hidden"), 700);
});

els.analyze.addEventListener("click", runAnalysis);

// ---------- Ablauf ----------
async function runAnalysis() {
  const { anthropicApiKey } = await chrome.storage.local.get("anthropicApiKey");
  if (!anthropicApiKey) {
    els.settings.classList.remove("hidden");
    setStatus("Kein API-Key hinterlegt.", "err");
    return;
  }

  els.analyze.disabled = true;
  els.results.classList.add("hidden");
  setStatus('<span class="spinner"></span>Stufe 1+2: Seite lesen & Technik prüfen …', "");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !/^https?:/.test(tab.url || "")) {
      throw new Error("Diese Seite kann nicht analysiert werden (nur http/https).");
    }

    const injection = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
    const pageData = injection?.[0]?.result;
    if (!pageData) throw new Error("Seiteninhalt konnte nicht gelesen werden.");

    // Technik-Check sofort anzeigen
    renderTech(pageData.checks);
    els.results.classList.remove("hidden");

    // Typ bestimmen
    let typ = els.siteType.value;
    if (typ === "auto") typ = pageData.vermuteterTyp;

    setStatus(
      `<span class="spinner"></span>Stufe 3: KI-Bewertung (${KATALOGE[typ].label}) läuft …`,
      ""
    );

    const resp = await chrome.runtime.sendMessage({
      type: "ANALYZE",
      payload: { pageData, typ },
    });

    if (!resp?.ok) throw new Error(resp?.error || "Unbekannter Fehler bei der Analyse.");

    renderKI(resp.result);
    renderVerdict(resp.result, pageData.checks);
    setStatus(autoHint(typ, els.siteType.value), "ok");
  } catch (err) {
    setStatus("Fehler: " + (err.message || err), "err");
  } finally {
    els.analyze.disabled = false;
  }
}

function autoHint(typ, selected) {
  if (selected === "auto") return `Fertig ✓ (automatisch erkannt als: ${KATALOGE[typ].label})`;
  return "Fertig ✓";
}

// ---------- Rendering ----------
function setStatus(html, cls) {
  els.status.innerHTML = html;
  els.status.className = "status-line " + (cls || "");
}

function scoreColor(score) {
  if (score >= 75) return "var(--green)";
  if (score >= 50) return "var(--orange)";
  return "var(--red)";
}

function badgeFor(status) {
  if (status === "pass") return "✅";
  if (status === "warn") return "⚠️";
  return "❌";
}

function renderTech(checks) {
  els.techChecks.innerHTML = checks
    .map(
      (c) => `
      <div class="check">
        <div class="badge">${badgeFor(c.status)}</div>
        <div class="c-body">
          <div class="c-group">${c.gruppe}</div>
          <div class="c-label">${escapeHtml(c.label)}</div>
          <div class="c-detail">${escapeHtml(c.detail)}</div>
        </div>
      </div>`
    )
    .join("");
}

function renderKI(result) {
  const byId = Object.fromEntries(result.ergebnisse.map((e) => [e.id, e]));
  els.kiResults.innerHTML = result.bausteine
    .map((b) => {
      const e = byId[b.id] || { score: 0, zitate: [], empfehlung: "Keine Bewertung erhalten.", beispiel: "" };
      const color = scoreColor(e.score);
      const quotes = (e.zitate || [])
        .map((q) => `<div class="b-quote">„${escapeHtml(q)}“</div>`)
        .join("");
      return `
        <div class="baustein">
          <div class="b-head">
            <span class="b-name">${escapeHtml(b.name)}</span>
            <div class="b-bar"><span style="width:${clamp(e.score)}%;background:${color}"></span></div>
            <span class="b-score" style="color:${color}">${clamp(e.score)}</span>
          </div>
          <div class="b-detail">
            ${quotes}
            <div><span class="lbl">Empfehlung:</span> ${escapeHtml(e.empfehlung || "")}</div>
            ${
              e.beispiel
                ? `<div><span class="lbl">Beispiel:</span><div class="b-example">${escapeHtml(e.beispiel)}</div></div>`
                : ""
            }
          </div>
        </div>`;
    })
    .join("");
}

function renderVerdict(result, checks) {
  const scores = result.ergebnisse.map((e) => clamp(e.score));
  const gesamt = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const techFails = checks.filter((c) => c.status === "fail").length;
  const color = scoreColor(gesamt);
  const dot = gesamt >= 75 ? "dot-green" : gesamt >= 50 ? "dot-orange" : "dot-red";
  const label = gesamt >= 75 ? "Grün – starke Seite" : gesamt >= 50 ? "Orange – Luft nach oben" : "Rot – dringender Handlungsbedarf";

  els.verdict.innerHTML = `
    <div class="score-circle ${dot}">${gesamt}</div>
    <div class="vtext">
      <h3>${label}</h3>
      <p>Inhaltlicher Gesamtscore über ${scores.length} Bausteine (${escapeHtml(result.katalogLabel)}).
      ${techFails ? `Technik: ${techFails} kritische Punkte.` : "Technik: keine kritischen Punkte."}</p>
    </div>`;
  els.verdict.style.borderColor = color;
}

// ---------- Helpers ----------
function clamp(n) {
  n = Number(n) || 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
