// content.js
// Stufe 1 (Lesen) + Stufe 2 (Prüfen).
// Wird per chrome.scripting.executeScript in die aktive Seite injiziert.
// Der Rückgabewert dieser IIFE landet in injectionResult.result.

(() => {
  const MAX_TEXT = 16000;

  // ---------- Stufe 1: LESEN ----------
  const title = document.title || "";
  const metaDescription =
    document.querySelector('meta[name="description"]')?.content?.trim() || "";

  const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")]
    .map((h) => ({ tag: h.tagName.toLowerCase(), text: h.innerText.trim() }))
    .filter((h) => h.text)
    .slice(0, 80);

  const buttons = [...document.querySelectorAll('button, [role="button"], input[type="submit"], a.btn, .button')]
    .map((b) => (b.innerText || b.value || "").trim())
    .filter(Boolean)
    .slice(0, 60);

  const links = [...document.querySelectorAll("a[href]")]
    .map((a) => ({ text: (a.innerText || "").trim(), href: a.getAttribute("href") || "" }))
    .filter((l) => l.text || l.href);

  // Sichtbarer Text der Seite (gekürzt)
  let visibleText = (document.body?.innerText || "").replace(/\n{3,}/g, "\n\n").trim();
  const textTruncated = visibleText.length > MAX_TEXT;
  if (textTruncated) visibleText = visibleText.slice(0, MAX_TEXT);

  // Geladene Ressourcen + echte Ladezeit (Navigation Timing)
  const resourceEntries = performance.getEntriesByType("resource");
  const resourceDomains = {};
  for (const r of resourceEntries) {
    try {
      const host = new URL(r.name).hostname;
      resourceDomains[host] = (resourceDomains[host] || 0) + 1;
    } catch (e) {
      /* ignore */
    }
  }
  const nav = performance.getEntriesByType("navigation")[0];
  const loadTimeMs = nav ? Math.round(nav.loadEventEnd || nav.domComplete || 0) : null;
  const domContentLoadedMs = nav ? Math.round(nav.domContentLoadedEventEnd || 0) : null;

  // ---------- Stufe 2: PRÜFEN (feste Regeln, lokal) ----------
  const lower = (s) => (s || "").toLowerCase();
  const hasLinkMatching = (re) =>
    links.some((l) => re.test(lower(l.text)) || re.test(lower(l.href)));

  // Google Fonts direkt von Google-Servern?
  const googleFontHosts = ["fonts.googleapis.com", "fonts.gstatic.com"];
  const googleFontsResource = googleFontHosts.some((h) => resourceDomains[h]);
  const googleFontsLink = [...document.querySelectorAll('link[href], style')].some((el) => {
    const v = lower(el.getAttribute?.("href") || el.textContent || "");
    return v.includes("fonts.googleapis.com") || v.includes("fonts.gstatic.com");
  });
  const usesGoogleFonts = googleFontsResource || googleFontsLink;

  const isHttps = location.protocol === "https:";
  const hasViewport = !!document.querySelector('meta[name="viewport"]');
  const langAttr = document.documentElement.getAttribute("lang") || "";
  const h1Count = document.querySelectorAll("h1").length;

  const images = [...document.querySelectorAll("img")];
  const imagesWithAlt = images.filter((i) => (i.getAttribute("alt") || "").trim()).length;
  const altRatio = images.length ? imagesWithAlt / images.length : 1;

  const hasJsonLd = !!document.querySelector('script[type="application/ld+json"]');
  const robotsMeta = lower(document.querySelector('meta[name="robots"]')?.content || "");
  const blocksIndex = robotsMeta.includes("noindex");
  const hasSemantic =
    !!document.querySelector("main, article, section, header, footer, nav");
  const wordCount = visibleText.split(/\s+/).filter(Boolean).length;

  const hasImpressum = hasLinkMatching(/impressum|imprint/);
  const hasDatenschutz = hasLinkMatching(/datenschutz|privacy|privacy-policy/);

  const titleLen = title.length;
  const descLen = metaDescription.length;

  const checks = [
    {
      id: "https",
      label: "Verschlüsselung (HTTPS)",
      gruppe: "DSGVO",
      status: isHttps ? "pass" : "fail",
      detail: isHttps ? "Seite wird über HTTPS ausgeliefert." : "Keine HTTPS-Verschlüsselung erkannt.",
    },
    {
      id: "google_fonts",
      label: "Google Fonts (DSGVO-Risiko)",
      gruppe: "DSGVO",
      status: usesGoogleFonts ? "fail" : "pass",
      detail: usesGoogleFonts
        ? "Schriften werden direkt von Google-Servern geladen – DSGVO-kritisch (IP-Übertragung in die USA). Besser: Fonts lokal einbinden."
        : "Keine direkte Einbindung von Google-Fonts-Servern erkannt.",
    },
    {
      id: "impressum",
      label: "Impressum verlinkt",
      gruppe: "DSGVO",
      status: hasImpressum ? "pass" : "fail",
      detail: hasImpressum ? "Impressum-Link gefunden." : "Kein Impressum-Link gefunden (Pflicht in DE).",
    },
    {
      id: "datenschutz",
      label: "Datenschutzerklärung verlinkt",
      gruppe: "DSGVO",
      status: hasDatenschutz ? "pass" : "fail",
      detail: hasDatenschutz ? "Datenschutz-Link gefunden." : "Kein Datenschutz-Link gefunden (Pflicht in DE).",
    },
    {
      id: "title",
      label: "Seitentitel (Title)",
      gruppe: "SEO",
      status: titleLen >= 30 && titleLen <= 65 ? "pass" : titleLen > 0 ? "warn" : "fail",
      detail: titleLen
        ? `Title vorhanden (${titleLen} Zeichen, ideal 30–65).`
        : "Kein Seitentitel gesetzt.",
    },
    {
      id: "meta_description",
      label: "Meta-Description",
      gruppe: "SEO",
      status: descLen >= 70 && descLen <= 160 ? "pass" : descLen > 0 ? "warn" : "fail",
      detail: descLen
        ? `Description vorhanden (${descLen} Zeichen, ideal 70–160).`
        : "Keine Meta-Description gepflegt.",
    },
    {
      id: "h1",
      label: "H1-Überschrift",
      gruppe: "SEO",
      status: h1Count === 1 ? "pass" : h1Count === 0 ? "fail" : "warn",
      detail:
        h1Count === 1
          ? "Genau eine H1 vorhanden."
          : h1Count === 0
          ? "Keine H1-Überschrift gefunden."
          : `${h1Count} H1-Überschriften – idealerweise nur eine.`,
    },
    {
      id: "viewport",
      label: "Mobile Optimierung (Viewport)",
      gruppe: "SEO",
      status: hasViewport ? "pass" : "fail",
      detail: hasViewport ? "Viewport-Meta-Tag gesetzt." : "Kein Viewport-Tag – mobile Darstellung gefährdet.",
    },
    {
      id: "lang",
      label: "Sprachauszeichnung (lang)",
      gruppe: "SEO",
      status: langAttr ? "pass" : "warn",
      detail: langAttr ? `lang="${langAttr}" gesetzt.` : "Kein lang-Attribut am <html>-Tag.",
    },
    {
      id: "alt",
      label: "Alt-Texte für Bilder",
      gruppe: "SEO",
      status: altRatio >= 0.8 ? "pass" : altRatio >= 0.4 ? "warn" : "fail",
      detail: `${imagesWithAlt}/${images.length} Bilder mit Alt-Text (${Math.round(altRatio * 100)}%).`,
    },
    {
      id: "ladezeit",
      label: "Gemessene Ladezeit",
      gruppe: "Performance",
      status: loadTimeMs == null ? "warn" : loadTimeMs < 2500 ? "pass" : loadTimeMs < 5000 ? "warn" : "fail",
      detail:
        loadTimeMs == null
          ? "Ladezeit nicht messbar."
          : `Vollständig geladen nach ${loadTimeMs} ms (DOM bereit nach ${domContentLoadedMs} ms).`,
    },
    {
      id: "ressourcen",
      label: "Anzahl Ressourcen",
      gruppe: "Performance",
      status: resourceEntries.length < 60 ? "pass" : resourceEntries.length < 120 ? "warn" : "fail",
      detail: `${resourceEntries.length} Ressourcen von ${Object.keys(resourceDomains).length} Domains geladen.`,
    },
    {
      id: "ki_lesbar",
      label: "Lesbarkeit für KI-Suchmaschinen",
      gruppe: "KI-Readiness",
      status: !blocksIndex && hasSemantic && wordCount > 150 ? "pass" : blocksIndex ? "fail" : "warn",
      detail: blocksIndex
        ? "Seite ist auf noindex gestellt – für KI-/Suchmaschinen unsichtbar."
        : `Semantisches HTML: ${hasSemantic ? "ja" : "nein"}, ${wordCount} Wörter Textinhalt. KI-Crawler können ${
            hasSemantic && wordCount > 150 ? "den Inhalt gut erfassen" : "den Inhalt nur eingeschränkt erfassen"
          }.`,
    },
    {
      id: "structured_data",
      label: "Strukturierte Daten (Schema.org)",
      gruppe: "KI-Readiness",
      status: hasJsonLd ? "pass" : "warn",
      detail: hasJsonLd
        ? "JSON-LD strukturierte Daten gefunden – hilft KI & Suchmaschinen beim Verstehen."
        : "Keine strukturierten Daten (JSON-LD) gefunden.",
    },
  ];

  // ---------- Shop-Erkennung (Heuristik) ----------
  const shopSignals = [
    /warenkorb|in den warenkorb|add to cart|zum warenkorb/,
    /checkout|kasse|zur kasse/,
    /versandkosten|lieferzeit/,
  ];
  const hayBtn = lower(buttons.join(" "));
  const hayText = lower(visibleText);
  const hayLinks = lower(links.map((l) => l.text + " " + l.href).join(" "));
  const hay = hayBtn + " " + hayText + " " + hayLinks;
  const shopHits = shopSignals.filter((re) => re.test(hay)).length;
  const productSchema = (() => {
    try {
      return [...document.querySelectorAll('script[type="application/ld+json"]')].some((s) =>
        lower(s.textContent).includes('"product"')
      );
    } catch (e) {
      return false;
    }
  })();
  const vermuteterTyp = shopHits >= 2 || productSchema ? "shop" : "corporate";

  return {
    url: location.href,
    title,
    metaDescription,
    headings,
    buttons,
    visibleText,
    textTruncated,
    wordCount,
    loadTimeMs,
    domContentLoadedMs,
    resourceCount: resourceEntries.length,
    resourceDomains,
    checks,
    vermuteterTyp,
  };
})();
