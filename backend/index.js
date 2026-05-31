import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import { google } from "googleapis";

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

const PORT = process.env.PORT || 3001;

const getSheets = async () => {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
};

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = "Leads";

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.get("/api/runs", async (req, res) => {
  try {
    const sheets = await getSheets();
    const r = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Runs!A2:F100",
    });
    const rows = (r.data.values || []).map((row) => ({
      id: row[0],
      date: row[1],
      zona: row[2],
      settore: row[3],
      leads: parseInt(row[4]) || 0,
      email: parseInt(row[5]) || 0,
    }));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/leads", async (req, res) => {
  try {
    const sheets = await getSheets();
    const r = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:J500`,
    });
    const rows = (r.data.values || []).map((row, i) => ({
      rowIndex: i + 2,
      name: row[0] || "",
      city: row[1] || "",
      score: parseInt(row[2]) || 0,
      email_addr: row[3] || "",
      sito: row[4] || "",
      email_stato: row[5] || "da inviare",
      email_body: row[6] || "",
      fb: row[7] || null,
      zona: row[8] || "",
      settore: row[9] || "",
    }));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/feedback", async (req, res) => {
  try {
    const { rowIndex, feedback } = req.body;
    const sheets = await getSheets();
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!H${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [[feedback]] },
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/email-stato", async (req, res) => {
  try {
    const { rowIndex, stato } = req.body;
    const sheets = await getSheets();
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!F${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [[stato]] },
    });
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
      `https://api.apify.com/v2/acts/compass~crawler-google-places/runs`,
      {
        searchStringsArray: [`${settore} ${zona}`],
        maxCrawledPlaces: maxResults || 30,
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
      `https://api.apify.com/v2/acts/compass~crawler-google-places/runs/${runId}/dataset/items`,
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
              {
                headers: { Authorization: `Bearer ${process.env.APIFY_TOKEN}` },
                params: { waitForFinish: 60 },
              }
            );
            const cId = crawl.data.data.id;
            const cRes = await axios.get(
              `https://api.apify.com/v2/acts/apify~website-content-crawler/runs/${cId}/dataset/items`,
              { headers: { Authorization: `Bearer ${process.env.APIFY_TOKEN}` } }
            );
            content = cRes.data[0]?.text?.slice(0, 2000) || "";
          } catch {}
        }
        return { name: p.title, city: p.city || zona, email_addr: p.email || "", sito, content };
      })
    );

    send({ step: 3, label: "Analisi UX con Claude..." });

    const calibRaw = process.env.CALIBRATION_WEIGHTS || "{}";
    const calibWeights = JSON.parse(calibRaw);

    const scored = await Promise.all(
      leadsWithSites.map(async (lead) => {
        if (!lead.sito) return { ...lead, score: 0, email_body: "" };
        try {
          const prompt = `Analizza questo sito web di ${lead.name} (${lead.sito}) e valuta su 7 criteri. Pesi calibrazione: ${JSON.stringify(calibWeights)}.

Contenuto sito:
${lead.content}

Rispondi SOLO in JSON:
{"score": <1-7>, "issues": ["problema1", "problema2"], "positivi": ["punto1"]}`;

          const resp = await axios.post(
            "https://api.anthropic.com/v1/messages",
            {
              model: "claude-haiku-4-5-20251001",
              max_tokens: 300,
              messages: [{ role: "user", content: prompt }],
            },
            {
              headers: {
                "x-api-key": process.env.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
              },
            }
          );
          const txt = resp.data.content[0].text;
          const parsed = JSON.parse(txt.match(/\{[\s\S]*\}/)[0]);
          return { ...lead, score: parsed.score, issues: parsed.issues, email_body: "" };
        } catch {
          return { ...lead, score: 0, email_body: "" };
        }
      })
    );

    const filtered = scored.filter((l) => l.score > 0 && l.score <= (scoreMin || 4));

    send({ step: 4, label: `Generazione ${filtered.length} email personalizzate...` });

    const withEmails = await Promise.all(
      filtered.map(async (lead) => {
        try {
          const resp = await axios.post(
            "https://api.anthropic.com/v1/messages",
            {
              model: "claude-haiku-4-5-20251001",
              max_tokens: 400,
              messages: [
                {
                  role: "user",
                  content: `Scrivi una email fredda breve e personale da Nicolò di Studio Brillo a ${lead.name} (${lead.sito}). 
Problemi rilevati: ${(lead.issues || []).join(", ")}.
Tono: curioso e genuino, non implica mai che abbiano un problema, parte da un complimento reale. 
Max 5 righe. Solo il corpo dell'email, niente oggetto.`,
                },
              ],
            },
            {
              headers: {
                "x-api-key": process.env.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
              },
            }
          );
          return { ...lead, email_body: resp.data.content[0].text };
        } catch {
          return lead;
        }
      })
    );

    const sheets = await getSheets();
    const runDate = new Date().toLocaleDateString("it-IT");
    const runId2 = Date.now().toString();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Runs!A:F",
      valueInputOption: "RAW",
      requestBody: {
        values: [[runId2, runDate, zona, settore, withEmails.length, withEmails.filter((l) => l.email_body).length]],
      },
    });

    const rows = withEmails.map((l) => [
      l.name, l.city, l.score, l.email_addr, l.sito,
      "da inviare", l.email_body, "", zona, settore,
    ]);

    if (rows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A:J`,
        valueInputOption: "RAW",
        requestBody: { values: rows },
      });
    }

    send({ step: "done", label: `Completato — ${withEmails.length} lead, ${withEmails.filter((l) => l.email_body).length} email`, leads: withEmails });
    res.end();
  } catch (e) {
    send({ step: "error", label: e.message });
    res.end();
  }
});

app.listen(PORT, () => console.log(`Backend su http://localhost:${PORT}`));
