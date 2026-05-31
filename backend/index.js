import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

const PORT = process.env.PORT || 3001;
const AT_TOKEN = process.env.AIRTABLE_TOKEN;
const AT_BASE = process.env.AIRTABLE_BASE_ID;
const AT_URL = `https://api.airtable.com/v0/${AT_BASE}`;
const APIFY = process.env.APIFY_TOKEN;
const ANTHROPIC = process.env.ANTHROPIC_API_KEY;
const GMAPS_ACTOR = "nwua9Gu5YrADL7ZDj";
const CRAWLER_ACTOR = "apify~website-content-crawler";

const at = axios.create({
  baseURL: AT_URL,
  headers: { Authorization: `Bearer ${AT_TOKEN}` },
});

const CRITERI = `Valuta il sito su questi 7 criteri (ognuno 1-10) e poi calcola un punteggio finale 1-7 dove 1 = sito pessimo / grande opportunita di vendita, 7 = sito gia ottimo / poca opportunita.

Criteri e pesi:
1. Mobile responsive (peso 1.4) - il sito si adatta bene a smartphone?
2. Velocita caricamento (peso 1.2) - sembra veloce e leggero o pesante e lento?
3. CTA chiara (peso 1.0) - ci sono call to action evidenti (prenota, contatta, chiama)?
4. SEO on-page (peso 0.9) - titoli, meta, struttura, testi ottimizzati?
5. Design moderno (peso 1.1) - estetica aggiornata o datata (pre-2015)?
6. Presenza social (peso 0.8) - link e integrazione social attivi?
7. Contatti visibili (peso 1.0) - telefono, email, indirizzo facili da trovare?

IMPORTANTE: un punteggio finale BASSO significa sito debole = ottimo lead da contattare. Un punteggio ALTO significa sito gia ben fatto = lead poco interessante.`;

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.get("/api/leads", async (req, res) => {
  try {
    const r = await at.get("/Leads?maxRecords=500&sort[0][field]=Score&sort[0][direction]=asc");
    const leads = r.data.records.map((rec) => ({
      id: rec.id,
      name: rec.fields["Name"] || "",
      city: rec.fields["City"] || "",
      score: parseInt(rec.fields["Score"]) || 0,
      email_addr: rec.fields["Email"] || "",
      telefono: rec.fields["Telefono"] || "",
      sito: rec.fields["Sito"] || "",
      email_stato: rec.fields["Email stato"] || "",
      email_body: rec.fields["Email body"] || "",
      fb: rec.fields["Feedback"] || null,
      criteri: rec.fields["Criteri"] || "",
      issues: rec.fields["Issues"] || "",
      punti_forti: rec.fields["Punti forti"] || "",
      zona: rec.fields["Zona"] || "",
      settore: rec.fields["Settore"] || "",
    }));
    res.json(leads);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/runs", async (req, res) => {
  try {
    const r = await at.get("/Runs?maxRecords=20&sort[0][field]=Data&sort[0][direction]=desc");
    const runs = r.data.records.map((rec) => ({
      id: rec.id,
      date: rec.fields["Data"] || "",
      zona: rec.fields["Zona"] || "",
      settore: rec.fields["Settore"] || "",
      leads: parseInt(rec.fields["Lead"]) || 0,
      email: parseInt(rec.fields["Email"]) || 0,
    }));
    res.json(runs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/feedback", async (req, res) => {
  try {
    const { id, feedback } = req.body;
    await at.patch(`/Leads/${id}`, { fields: { Feedback: feedback } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/scarta", async (req, res) => {
  try {
    const { id } = req.body;
    await at.patch(`/Leads/${id}`, { fields: { Feedback: "scartato" } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/delete-lead", async (req, res) => {
  try {
    const { id } = req.body;
    await at.delete(`/Leads/${id}`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

async function wipeTable(table) {
  let deleted = 0;
  while (true) {
    const r = await at.get(`/${table}?maxRecords=100`);
    const ids = r.data.records.map((rec) => rec.id);
    if (ids.length === 0) break;
    for (let i = 0; i < ids.length; i += 10) {
      const chunk = ids.slice(i, i + 10);
      const params = chunk.map((id) => `records[]=${id}`).join("&");
      await at.delete(`/${table}?${params}`);
      deleted += chunk.length;
    }
  }
  return deleted;
}

app.post("/api/wipe-all", async (req, res) => {
  try {
    const leadsDeleted = await wipeTable("Leads");
    const runsDeleted = await wipeTable("Runs");
    res.json({ ok: true, leadsDeleted, runsDeleted });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/email-stato", async (req, res) => {
  try {
    const { id, stato } = req.body;
    await at.patch(`/Leads/${id}`, { fields: { "Email stato": stato } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/genera-email", async (req, res) => {
  try {
    const { id } = req.body;
    const rec = await at.get(`/Leads/${id}`);
    const f = rec.data.fields;
    const resp = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [{
          role: "user",
          content: `Scrivi una email a freddo per Nicolò di Studio Brillo (studio creativo digitale di Vicenza) da inviare a ${f["Name"]}, attivita di tipo "${f["Settore"]}" a ${f["City"]}.

Sito: ${f["Sito"]}
Punti deboli rilevati: ${f["Issues"] || "n/d"}
Punti di forza: ${f["Punti forti"] || "n/d"}

REGOLE FERREE sul tono:
- NON implicare mai che abbiano un problema o che il loro sito faccia schifo
- Parti da una curiosita genuina o un complimento reale e specifico su di loro
- Tono umano, diretto, da persona vera, non da venditore
- Niente em dash, niente trattini lunghi
- Max 5-6 righe
- Chiudi con una domanda leggera o un aggancio soft, non con una proposta aggressiva

Scrivi SOLO il corpo della mail, niente oggetto, niente firma.`,
        }],
      },
      { headers: { "x-api-key": ANTHROPIC, "anthropic-version": "2023-06-01" } }
    );
    const body = resp.data.content[0].text.trim();
    await at.patch(`/Leads/${id}`, { fields: { "Email body": body, "Email stato": "da inviare" } });
    res.json({ ok: true, email_body: body });
  } catch (e) {
    const detail = e.response?.data ? JSON.stringify(e.response.data) : e.message;
    res.status(500).json({ error: detail });
  }
});

async function getCalibration() {
  try {
    const r = await at.get("/Leads?maxRecords=200&filterByFormula=NOT({Feedback}=\"\")");
    const ok = [], no = [];
    r.data.records.forEach((rec) => {
      const fb = rec.fields["Feedback"];
      const score = rec.fields["Score"];
      if (fb === "ok") ok.push(score);
      else if (fb === "no" || fb === "scartato") no.push(score);
    });
    return { ok, no };
  } catch {
    return { ok: [], no: [] };
  }
}

app.post("/api/run", async (req, res) => {
  const { zona, settore, maxResults } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    send({ step: 1, label: "Scraping Google Maps con Apify..." });

    let places = [];
    try {
      const r = await axios.post(
        `https://api.apify.com/v2/acts/${GMAPS_ACTOR}/run-sync-get-dataset-items?token=${APIFY}`,
        {
          searchStringsArray: [settore],
          locationQuery: `${zona}, Italia`,
          maxCrawledPlacesPerSearch: maxResults || 30,
          language: "it",
          scrapeContacts: true,
        },
        { headers: { "Content-Type": "application/json" }, timeout: 300000 }
      );
      places = Array.isArray(r.data) ? r.data.slice(0, maxResults || 30) : [];
    } catch (err) {
      const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      console.error("APIFY GMAPS ERROR:", detail);
      send({ step: "error", label: `Apify Maps: ${detail}` });
      return res.end();
    }

    send({ step: 2, label: `Trovati ${places.length} posti. Crawling siti web...` });

    const leadsWithSites = await Promise.all(
      places.map(async (p) => {
        let sito = p.website || "";
        let content = "";
        if (sito) {
          try {
            const cr = await axios.post(
              `https://api.apify.com/v2/acts/${CRAWLER_ACTOR}/run-sync-get-dataset-items?token=${APIFY}`,
              { startUrls: [{ url: sito }], maxCrawlPages: 1 },
              { headers: { "Content-Type": "application/json" }, timeout: 120000 }
            );
            content = cr.data[0]?.text?.slice(0, 3000) || "";
          } catch {}
        }
        return {
          name: p.title || p.name || "",
          city: p.city || zona,
          email_addr: (p.emails && p.emails[0]) || p.email || "",
          telefono: p.phone || "",
          sito,
          content,
        };
      })
    );

    send({ step: 3, label: "Analisi UX con Claude (7 criteri)..." });

    const calib = await getCalibration();
    let calibNote = "";
    if (calib.ok.length || calib.no.length) {
      const avg = (arr) => arr.length ? (arr.reduce((s, x) => s + (x || 0), 0) / arr.length).toFixed(1) : "n/d";
      calibNote = `\n\nCALIBRAZIONE da feedback passati: lead buoni avevano score medio ${avg(calib.ok)}, lead scartati score medio ${avg(calib.no)}. Tieni conto di questo pattern.`;
    }

    const scored = await Promise.all(
      leadsWithSites.map(async (lead) => {
        if (!lead.sito || !lead.content) return { ...lead, score: 0, issues: ["sito assente o non raggiungibile"], punti_forti: [], criteri: {} };
        try {
          const resp = await axios.post(
            "https://api.anthropic.com/v1/messages",
            {
              model: "claude-haiku-4-5-20251001",
              max_tokens: 600,
              messages: [{
                role: "user",
                content: `${CRITERI}${calibNote}

Sito da analizzare: ${lead.sito} (${lead.name})
Contenuto estratto:
${lead.content}

Rispondi SOLO in JSON valido, niente altro:
{"criteri": {"mobile": <1-10>, "velocita": <1-10>, "cta": <1-10>, "seo": <1-10>, "design": <1-10>, "social": <1-10>, "contatti": <1-10>}, "score": <1-7>, "issues": ["problema concreto 1", "problema concreto 2"], "punti_forti": ["punto 1"]}`,
              }],
            },
            { headers: { "x-api-key": ANTHROPIC, "anthropic-version": "2023-06-01" } }
          );
          const parsed = JSON.parse(resp.data.content[0].text.match(/\{[\s\S]*\}/)[0]);
          return { ...lead, score: parsed.score, issues: parsed.issues || [], punti_forti: parsed.punti_forti || [], criteri: parsed.criteri || {} };
        } catch (err) {
          console.error("SCORING ERROR:", lead.name, err.message);
          return { ...lead, score: 0, issues: ["errore analisi"], punti_forti: [], criteri: {} };
        }
      })
    );

    send({ step: 4, label: `Salvataggio ${scored.length} lead su Airtable...` });

    const runDate = new Date().toLocaleDateString("it-IT");
    await at.post("/Runs", {
      fields: { Data: runDate, Zona: zona, Settore: settore, Lead: Math.round(scored.length), Email: 0 },
    });

    if (scored.length > 0) {
      const chunks = [];
      for (let i = 0; i < scored.length; i += 10) chunks.push(scored.slice(i, i + 10));
      for (const chunk of chunks) {
        await at.post("/Leads", {
          records: chunk.map((l) => ({
            fields: {
              Name: l.name,
              City: l.city,
              Score: Math.round(Number(l.score)) || 0,
              Email: l.email_addr,
              Telefono: l.telefono || "",
              Sito: l.sito,
              "Email stato": "",
              "Email body": "",
              Feedback: "",
              Criteri: typeof l.criteri === "object" ? JSON.stringify(l.criteri) : String(l.criteri || ""),
              Issues: (l.issues || []).join(" | "),
              "Punti forti": (l.punti_forti || []).join(" | "),
              Zona: zona,
              Settore: settore,
            },
          })),
        });
      }
    }

    send({ step: "done", label: `Completato — ${scored.length} lead analizzati e salvati` });
    res.end();
  } catch (e) {
    const errDetail = e.response?.data ? JSON.stringify(e.response.data) : e.message;
    console.error("PIPELINE ERROR:", errDetail);
    send({ step: "error", label: errDetail });
    res.end();
  }
});

app.listen(PORT, () => console.log(`Backend su http://localhost:${PORT}`));
