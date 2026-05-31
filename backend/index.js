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

const at = axios.create({
  baseURL: AT_URL,
  headers: { Authorization: `Bearer ${AT_TOKEN}` },
});

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
      sito: rec.fields["Sito"] || "",
      email_stato: rec.fields["Email stato"] || "da inviare",
      email_body: rec.fields["Email body"] || "",
      fb: rec.fields["Feedback"] || null,
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

app.post("/api/email-stato", async (req, res) => {
  try {
    const { id, stato } = req.body;
    await at.patch(`/Leads/${id}`, { fields: { "Email stato": stato } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/run", async (req, res) => {
  const { zona, settore, maxResults, scoreMin } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    send({ step: 1, label: "Scraping Google Maps con Apify..." });

    const apifyRun = await axios.post(
      `https://api.apify.com/v2/acts/nwua9Gu5YrADL7ZDj/runs`,
      {
        searchStringsArray: [`${settore} ${zona}`],
        maxCrawledPlacesPerSearch: maxResults || 30,
        language: "it",
        countryCode: "IT",
      },
      {
        headers: { Authorization: `Bearer ${process.env.APIFY_TOKEN}` },
        params: { waitForFinish: 120 },
      }
    );

    const runId = apifyRun.data.data.id;
    const resultsResp = await axios.get(
      `https://api.apify.com/v2/acts/nwua9Gu5YrADL7ZDj/runs/${runId}/dataset/items`,
      { headers: { Authorization: `Bearer ${process.env.APIFY_TOKEN}` } }
    );
    const places = resultsResp.data.slice(0, maxResults || 30);
    send({ step: 2, label: `Trovati ${places.length} posti. Crawling siti web...` });

    const leadsWithSites = await Promise.all(
      places.map(async (p) => {
        let sito = p.website || "";
        let content = "";
        if (sito) {
          try {
            const crawl = await axios.post(
              "https://api.apify.com/v2/acts/apify~website-content-crawler/runs",
              { startUrls: [{ url: sito }], maxCrawlPages: 1 },
              { headers: { Authorization: `Bearer ${process.env.APIFY_TOKEN}` }, params: { waitForFinish: 60 } }
            );
            const cRes = await axios.get(
              `https://api.apify.com/v2/acts/apify~website-content-crawler/runs/${crawl.data.data.id}/dataset/items`,
              { headers: { Authorization: `Bearer ${process.env.APIFY_TOKEN}` } }
            );
            content = cRes.data[0]?.text?.slice(0, 2000) || "";
          } catch {}
        }
        return { name: p.title, city: p.city || zona, email_addr: p.email || "", sito, content };
      })
    );

    send({ step: 3, label: "Analisi UX con Claude..." });

    const scored = await Promise.all(
      leadsWithSites.map(async (lead) => {
        if (!lead.sito) return { ...lead, score: 0, issues: [] };
        try {
          const resp = await axios.post(
            "https://api.anthropic.com/v1/messages",
            {
              model: "claude-haiku-4-5-20251001",
              max_tokens: 300,
              messages: [{ role: "user", content: `Analizza il sito ${lead.sito} di ${lead.name}. Contenuto: ${lead.content}. Rispondi SOLO in JSON: {"score": <1-7>, "issues": ["problema1"]}` }],
            },
            { headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" } }
          );
          const parsed = JSON.parse(resp.data.content[0].text.match(/\{[\s\S]*\}/)[0]);
          return { ...lead, score: parsed.score, issues: parsed.issues };
        } catch {
          return { ...lead, score: 0, issues: [] };
        }
      })
    );

    const filtered = scored.filter((l) => l.score > 0 && l.score <= (scoreMin || 4));
    send({ step: 4, label: `Generazione ${filtered.length} email...` });

    const withEmails = await Promise.all(
      filtered.map(async (lead) => {
        try {
          const resp = await axios.post(
            "https://api.anthropic.com/v1/messages",
            {
              model: "claude-haiku-4-5-20251001",
              max_tokens: 400,
              messages: [{ role: "user", content: `Scrivi una email fredda breve da Nicolò di Studio Brillo a ${lead.name} (${lead.sito}). Problemi: ${lead.issues?.join(", ")}. Tono curioso e genuino, parti da un complimento. Max 5 righe. Solo il corpo.` }],
            },
            { headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" } }
          );
          return { ...lead, email_body: resp.data.content[0].text };
        } catch {
          return { ...lead, email_body: "" };
        }
      })
    );

    const runDate = new Date().toLocaleDateString("it-IT");
    await at.post("/Runs", {
      fields: { Data: runDate, Zona: zona, Settore: settore, Lead: withEmails.length, Email: withEmails.filter((l) => l.email_body).length },
    });

    if (withEmails.length > 0) {
      const chunks = [];
      for (let i = 0; i < withEmails.length; i += 10) chunks.push(withEmails.slice(i, i + 10));
      for (const chunk of chunks) {
        await at.post("/Leads", {
          records: chunk.map((l) => ({
            fields: {
              Name: l.name, City: l.city, Score: l.score, Email: l.email_addr,
              Sito: l.sito, "Email stato": "da inviare", "Email body": l.email_body,
              Feedback: "", Zona: zona, Settore: settore,
            },
          })),
        });
      }
    }

    send({ step: "done", label: `Completato — ${withEmails.length} lead, ${withEmails.filter((l) => l.email_body).length} email` });
    res.end();
  } catch (e) {
    send({ step: "error", label: e.message });
    res.end();
  }
});

app.listen(PORT, () => console.log(`Backend su http://localhost:${PORT}`));
