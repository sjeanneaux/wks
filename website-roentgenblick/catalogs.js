// catalogs.js
// Zwei Bewertungskataloge mit je 14 Bausteinen.
// Grundlage: Verkaufspsychologie & Studien (z. B. Baymard Institute, Harvard Business Review).
// Jeder Baustein wird von der KI bewertet mit: score (0-100), zitate, empfehlung, beispiel.

export const KATALOGE = {
  corporate: {
    label: "Corporate Website (Unternehmensseite)",
    bausteine: [
      {
        id: "nutzenversprechen",
        name: "Nutzenversprechen & Klarheit",
        beschreibung:
          "Versteht der Besucher in den ersten Sekunden, was angeboten wird und welchen Nutzen er hat? Ist die Kernbotschaft above the fold klar?",
      },
      {
        id: "zielgruppe",
        name: "Zielgruppenansprache",
        beschreibung:
          "Werden die richtigen Informationen für die definierte Zielgruppe geliefert? Spricht die Seite die Sprache und Bedürfnisse der Wunschkunden?",
      },
      {
        id: "einwandbehandlung",
        name: "Einwandbehandlung",
        beschreibung:
          "Werden typische Bedenken, Fragen und Kaufhürden der Zielgruppe proaktiv aufgegriffen und entkräftet (FAQ, Vergleiche, Erklärungen)?",
      },
      {
        id: "vertrauen",
        name: "Vertrauen & Social Proof",
        beschreibung:
          "Gibt es Vertrauenselemente: Referenzen, Testimonials, Logos von Kunden/Partnern, Zertifikate, Auszeichnungen, Fallstudien?",
      },
      {
        id: "reaktionszeit",
        name: "Reaktionszeit & Verbindlichkeit",
        beschreibung:
          "Wird kommuniziert, wie schnell der Kunde mit einer Antwort rechnen kann (z. B. 'Antwort innerhalb von 24 Stunden')? Schafft das Verbindlichkeit?",
      },
      {
        id: "cta",
        name: "Call-to-Action & Conversion",
        beschreibung:
          "Gibt es klare, gut platzierte Handlungsaufforderungen? Ist der nächste Schritt für den Besucher eindeutig und niedrigschwellig?",
      },
      {
        id: "kontakt",
        name: "Kontakt & Erreichbarkeit",
        beschreibung:
          "Sind Kontaktwege leicht auffindbar (Telefon, E-Mail, Formular, Adresse)? Wird Erreichbarkeit und Ansprechpartner transparent gemacht?",
      },
      {
        id: "kompetenz",
        name: "Kompetenznachweis & Über uns",
        beschreibung:
          "Wird Kompetenz und Glaubwürdigkeit belegt (Team, Erfahrung, Qualifikationen, Geschichte)? Wirkt das Unternehmen greifbar und seriös?",
      },
      {
        id: "angebot",
        name: "Angebots- & Leistungsklarheit",
        beschreibung:
          "Sind Leistungen/Produkte verständlich und vollständig beschrieben? Versteht der Kunde Umfang und Abgrenzung der Angebote?",
      },
      {
        id: "differenzierung",
        name: "Differenzierung & USP",
        beschreibung:
          "Wird klar, warum man genau dieses Unternehmen wählen sollte? Hebt sich die Seite vom Wettbewerb ab (Alleinstellungsmerkmale)?",
      },
      {
        id: "sprache",
        name: "Verständlichkeit der Sprache",
        beschreibung:
          "Ist der Text verständlich, konkret und frei von leeren Floskeln/Fachjargon? Spricht die Seite Nutzen statt nur Merkmale an?",
      },
      {
        id: "emotion",
        name: "Storytelling & Emotion",
        beschreibung:
          "Werden Emotionen und eine nachvollziehbare Geschichte genutzt, um Bindung aufzubauen? Bleibt die Marke im Gedächtnis?",
      },
      {
        id: "mobile_tempo",
        name: "Mobile Nutzbarkeit & Ladetempo (Wahrnehmung)",
        beschreibung:
          "Wirkt die Seite inhaltlich fokussiert und nicht überladen? Unterstützen Struktur und Textmenge eine schnelle, mobile Erfassung? (Wichtig auch für Google.)",
      },
      {
        id: "aktualitaet",
        name: "Aktualität & Pflege",
        beschreibung:
          "Wirkt die Seite gepflegt und aktuell (Datumsangaben, News, keine veralteten Inhalte)? Signalisiert sie ein aktives Unternehmen?",
      },
    ],
  },

  shop: {
    label: "Onlineshop",
    bausteine: [
      {
        id: "nutzenversprechen",
        name: "Nutzenversprechen & Klarheit",
        beschreibung:
          "Versteht der Besucher sofort, was verkauft wird und für wen es geeignet ist? Ist das Sortiment/Angebot above the fold erfassbar?",
      },
      {
        id: "produktinfo",
        name: "Produktinformation & Beschreibung",
        beschreibung:
          "Sind Produkte ausreichend beschrieben (Eigenschaften, Maße, Material, Anwendung)? Bekommt der Kunde alle kaufentscheidenden Infos?",
      },
      {
        id: "kosten_versand",
        name: "Kosten- & Versandtransparenz",
        beschreibung:
          "Werden Versandkosten, Lieferzeiten und Gesamtkosten früh und klar kommuniziert? Werden unerwartete Kosten im Checkout vermieden (Baymard: häufigster Abbruchgrund)?",
      },
      {
        id: "vertrauen",
        name: "Vertrauen & Gütesiegel",
        beschreibung:
          "Gibt es Trust-Elemente: Gütesiegel (z. B. Trusted Shops), SSL-Hinweis, Käuferschutz, transparente Anbieterinfos?",
      },
      {
        id: "bewertungen",
        name: "Bewertungen & Social Proof",
        beschreibung:
          "Werden Kundenbewertungen, Sterne, Rezensionen oder Verkaufszahlen gezeigt? Stützen sie die Kaufentscheidung glaubwürdig?",
      },
      {
        id: "checkout",
        name: "Checkout-Klarheit",
        beschreibung:
          "Ist der Bestellprozess klar, kurz und ohne Überraschungen? Werden alle Kosten vor dem Kaufabschluss klar kommuniziert? Gibt es Gast-Bestellung?",
      },
      {
        id: "zahlungsarten",
        name: "Zahlungsarten",
        beschreibung:
          "Werden gängige und vertrauenswürdige Zahlungsarten angeboten und sichtbar kommuniziert (PayPal, Rechnung, Kreditkarte etc.)?",
      },
      {
        id: "retoure_garantie",
        name: "Retouren & Garantie",
        beschreibung:
          "Sind Rückgabe-, Widerrufs- und Garantiebedingungen leicht auffindbar und kundenfreundlich formuliert? Senkt das die Kaufangst?",
      },
      {
        id: "cta",
        name: "Call-to-Action",
        beschreibung:
          "Sind 'In den Warenkorb'/'Kaufen'-Buttons eindeutig, gut sichtbar und handlungsauffordernd platziert?",
      },
      {
        id: "navigation",
        name: "Suche & Navigation",
        beschreibung:
          "Findet der Kunde Produkte schnell über Suche, Filter und Kategorien? Ist die Orientierung im Sortiment einfach?",
      },
      {
        id: "verfuegbarkeit",
        name: "Verfügbarkeit & Lieferzeit",
        beschreibung:
          "Werden Lagerbestand/Verfügbarkeit und konkrete Lieferzeiten transparent angezeigt (z. B. 'Lieferung in 2-3 Tagen')?",
      },
      {
        id: "zielgruppe",
        name: "Zielgruppenansprache",
        beschreibung:
          "Werden Ansprache, Bildsprache und Argumente passend zur Zielgruppe gewählt? Fühlt sich der Wunschkunde abgeholt?",
      },
      {
        id: "dringlichkeit",
        name: "Dringlichkeit & Verknappung",
        beschreibung:
          "Werden seriöse Dringlichkeits-/Verknappungssignale genutzt (begrenzte Stückzahl, Aktionsende) – ohne unglaubwürdigen Druck?",
      },
      {
        id: "mobile_tempo",
        name: "Mobile Nutzbarkeit & Ladetempo (Wahrnehmung)",
        beschreibung:
          "Wirkt der Shop fokussiert und nicht überladen? Unterstützt die Struktur schnelles, mobiles Einkaufen? (Wichtig auch für Google.)",
      },
    ],
  },
};

// JSON-Schema, in das die KI gezwungen wird (Structured Outputs).
export function buildSchema(bausteinIds) {
  return {
    type: "object",
    properties: {
      bausteine: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", enum: bausteinIds },
            score: { type: "integer" },
            zitate: { type: "array", items: { type: "string" } },
            empfehlung: { type: "string" },
            beispiel: { type: "string" },
          },
          required: ["id", "score", "zitate", "empfehlung", "beispiel"],
          additionalProperties: false,
        },
      },
    },
    required: ["bausteine"],
    additionalProperties: false,
  };
}
