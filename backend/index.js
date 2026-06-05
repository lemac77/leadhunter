import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";

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
const APP_PASSWORD = process.env.APP_PASSWORD || "";

const at = axios.create({
  baseURL: AT_URL,
  headers: { Authorization: `Bearer ${AT_TOKEN}` },
});

app.post("/api/login", (req, res) => {
  const { password } = req.body;
  if (!APP_PASSWORD) return res.json({ ok: true });
  if (password === APP_PASSWORD) return res.json({ ok: true });
  res.status(401).json({ ok: false, error: "Password errata" });
});

app.use("/api", (req, res, next) => {
  if (req.path === "/health" || req.path === "/login") return next();
  if (!APP_PASSWORD) return next();
  const pw = req.headers["x-app-password"] || "";
  if (pw === APP_PASSWORD) return next();
  return res.status(401).json({ error: "Non autorizzato" });
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

const CRITERI = `Valuta il sito su questi 7 criteri (ognuno 1-10) e calcola un punteggio finale 1-7 dove 1 = sito pessimo / grande opportunita, 7 = sito ottimo / poca opportunita.
Criteri e pesi:
1. Mobile responsive (1.4) - si adatta a smartphone?
2. Velocita caricamento (1.2) - sembra veloce o pesante?
3. CTA chiara (1.0) - call to action evidenti?
4. SEO on-page (0.9) - titoli, meta, struttura?
5. Design moderno (1.1) - estetica aggiornata?
6. Presenza social (0.8) - social integrati?
7. Contatti visibili (1.0) - telefono, email, indirizzo?
IMPORTANTE: punteggio BASSO = sito debole = ottimo lead. punteggio ALTO = sito gia fatto bene.`;

const SOCIAL_HOSTS = ["facebook.com","fb.com","instagram.com","linkedin.com","twitter.com","x.com","tiktok.com","youtube.com","wa.me","business.site","maps.google","google.com/maps"];

function isSocialOrInvalid(url) {
  if (!url) return true;
  const u = url.toLowerCase();
  return SOCIAL_HOSTS.some((h) => u.includes(h));
}

const VENETO_COORDS = {
  "vicenza":   { lat: 45.5455, lon: 11.5354 },
  "padova":    { lat: 45.4064, lon: 11.8768 },
  "verona":    { lat: 45.4384, lon: 10.9916 },
  "venezia":   { lat: 45.4408, lon: 12.3155 },
  "treviso":   { lat: 45.6669, lon: 12.2429 },
  "bassano":   { lat: 45.7671, lon: 11.7344 },
  "thiene":    { lat: 45.7063, lon: 11.4786 },
  "schio":     { lat: 45.7148, lon: 11.3557 },
  "valdagno":  { lat: 45.6473, lon: 11.3003 },
  "arzignano": { lat: 45.5234, lon: 11.3399 },
  "lonigo":    { lat: 45.3857, lon: 11.3829 },
  "montecchio":{ lat: 45.5088, lon: 11.4054 },
  "asiago":    { lat: 45.8726, lon: 11.5113 },
  "marostica": { lat: 45.7486, lon: 11.6565 },
  "cittadella":{ lat: 45.6477, lon: 11.7884 },
};

async function geocode(query) {
  try {
    const key = query.trim().toLowerCase().replace(/[^a-z]/g, "");
    for (const [k, v] of Object.entries(VENETO_COORDS)) {
      if (key.includes(k) || k.includes(key)) return v;
    }
    const isCAP = /^\d{5}$/.test(query.trim());
    const params = isCAP
      ? { postalcode: query.trim(), country: "it", format: "json", limit: 1, addressdetails: 1 }
      : { city: query.trim(), country: "it", format: "json", limit: 3, addressdetails: 1 };
    const r = await axios.get("https://nominatim.openstreetmap.org/search", {
      params,
      headers: { "User-Agent": "LeadHunter-StudioBrillo/1.0" },
      timeout: 10000,
    });
    if (r.data && r.data.length > 0) {
      const city = r.data.find((x) => x.type === "city" || x.type === "administrative" || x.class === "place") || r.data[0];
      return { lat: parseFloat(city.lat), lon: parseFloat(city.lon) };
    }
    return null;
  } catch { return null; }
}

async function fetchHomepage(url) {
  const target = url.startsWith("http") ? url : `https://${url}`;
  const headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
    "Upgrade-Insecure-Requests": "1",
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await axios.get(target, { timeout: 15000, maxRedirects: 5, headers, validateStatus: () => true });
      if (r.status === 403 || r.status === 401 || r.status === 429) {
        if (attempt === 0) { await new Promise((res) => setTimeout(res, 1200)); continue; }
        return { reachable: false, blocked: true, text: "", signals: {} };
      }
      if (r.status >= 400) return { reachable: false, blocked: false, text: "", signals: {} };
      const html = typeof r.data === "string" ? r.data : "";
      if (!html) return { reachable: false, blocked: false, text: "", signals: {} };
      const $ = cheerio.load(html);
      const signals = {
        hasViewport: $('meta[name="viewport"]').length > 0,
        title: $("title").first().text().trim(),
        metaDesc: $('meta[name="description"]').attr("content") || "",
        h1count: $("h1").length,
        hasTel: /tel:|telefono|chiamaci/i.test(html),
        hasMail: /mailto:|@/.test(html),
        social: ["facebook.com","instagram.com","linkedin.com","tiktok.com"].filter((s) => html.includes(s)),
        ctaWords: (html.match(/prenota|contatt|chiama|preventivo|richiedi|book|scopri/gi) || []).length,
        htmlSize: html.length,
      };
      $("script, style, noscript, svg").remove();
      const text = $("body").text().replace(/\s+/g, " ").trim().slice(0, 2500);
      return { reachable: true, blocked: false, text, signals };
    } catch {
      if (attempt === 0) { await new Promise((res) => setTimeout(res, 1000)); continue; }
      return { reachable: false, blocked: false, text: "", signals: {} };
    }
  }
  return { reachable: false, blocked: false, text: "", signals: {} };
}

async function runApifyAndWait(input, timeoutMs = 300000) {
  const startResp = await axios.post(
    `https://api.apify.com/v2/acts/${GMAPS_ACTOR}/runs?token=${APIFY}`,
    input,
    { headers: { "Content-Type": "application/json" }, timeout: 30000 }
  );
  const runId = startResp.data.data.id;
  const datasetId = startResp.data.data.defaultDatasetId;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    await new Promise((res) => setTimeout(res, 5000));
    const statusResp = await axios.get(
      `https://api.apify.com/v2/acts/${GMAPS_ACTOR}/runs/${runId}?token=${APIFY}`,
      { timeout: 10000 }
    );
    const status = statusResp.data.data.status;
    if (status === "SUCCEEDED") {
      const itemsResp = await axios.get(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY}`,
        { timeout: 30000 }
      );
      return Array.isArray(itemsResp.data) ? itemsResp.data : [];
    }
    if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
      throw new Error(`Apify run ${status}`);
    }
  }
  throw new Error("Timeout polling Apify run");
}

async function crawlWithApify(url, timeoutMs = 90000) {
  try {
    const startResp = await axios.post(
      `https://api.apify.com/v2/acts/apify~website-content-crawler/runs?token=${APIFY}`,
      {
        startUrls: [{ url }],
        maxCrawlPages: 1,
        maxCrawlDepth: 0,
        crawlerType: "cheerio",
        initialConcurrency: 1,
      },
      { headers: { "Content-Type": "application/json" }, timeout: 20000 }
    );
    const runId = startResp.data.data.id;
    const datasetId = startResp.data.data.defaultDatasetId;
    const started = Date.now();

    while (Date.now() - started < timeoutMs) {
      await new Promise((res) => setTimeout(res, 4000));
      const statusResp = await axios.get(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY}`,
        { timeout: 10000 }
      );
      const status = statusResp.data.data.status;
      if (status === "SUCCEEDED") {
        const itemsResp = await axios.get(
          `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY}`,
          { timeout: 20000 }
        );
        const item = itemsResp.data[0];
        if (!item) return { text: "", html: "" };
        return {
          text: (item.text || item.markdown || "").slice(0, 4000),
          html: (item.html || "").slice(0, 8000),
        };
      }
      if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") return { text: "", html: "" };
    }
    return { text: "", html: "" };
  } catch { return { text: "", html: "" }; }
}

app.get("/api/leads", async (req, res) => {
  try {
    const { runId } = req.query;
    let url = `/Leads?maxRecords=500&sort[0][field]=Score&sort[0][direction]=asc`;
    if (runId) url += `&filterByFormula={RunId}="${runId}"`;
    const r = await at.get(url);
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
      runId: rec.fields["RunId"] || "",
      assegnato: rec.fields["Assegnato"] || "",
      rating: parseFloat(rec.fields["Rating"]) || 0,
      hook_mail: rec.fields["Hook mail"] || "",
    }));
    res.json(leads);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/runs", async (req, res) => {
  try {
    const r = await at.get("/Runs?maxRecords=50&sort[0][field]=Data&sort[0][direction]=desc");
    const runs = r.data.records.map((rec) => ({
      id: rec.id,
      runId: rec.fields["RunId"] || rec.id,
      date: rec.fields["Data"] || "",
      zona: rec.fields["Zona"] || "",
      settore: rec.fields["Settore"] || "",
      leads: parseInt(rec.fields["Lead"]) || 0,
      email: parseInt(rec.fields["Email"]) || 0,
    }));
    res.json(runs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/feedback", async (req, res) => {
  try {
    const { id, feedback } = req.body;
    await at.patch(`/Leads/${id}`, { fields: { Feedback: feedback } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/assegna", async (req, res) => {
  try {
    const { id, assegnato } = req.body;
    await at.patch(`/Leads/${id}`, { fields: { Assegnato: assegnato } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/scarta", async (req, res) => {
  try {
    const { id } = req.body;
    await at.patch(`/Leads/${id}`, { fields: { Feedback: "scartato" } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/delete-lead", async (req, res) => {
  try {
    const { id } = req.body;
    await at.delete(`/Leads/${id}`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/delete-run", async (req, res) => {
  try {
    const { runId } = req.body;
    const r = await at.get(`/Leads?maxRecords=500&filterByFormula={RunId}="${runId}"`);
    const ids = r.data.records.map((rec) => rec.id);
    for (let i = 0; i < ids.length; i += 10) {
      const chunk = ids.slice(i, i + 10);
      const params = chunk.map((id) => `records[]=${id}`).join("&");
      await at.delete(`/Leads?${params}`);
    }
    const runs = await at.get(`/Runs?maxRecords=10&filterByFormula={RunId}="${runId}"`);
    for (const rec of runs.data.records) await at.delete(`/Runs/${rec.id}`);
    res.json({ ok: true, deleted: ids.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
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
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/email-stato", async (req, res) => {
  try {
    const { id, stato } = req.body;
    await at.patch(`/Leads/${id}`, { fields: { "Email stato": stato } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/genera-email", async (req, res) => {
  try {
    const { id } = req.body;
    const rec = await at.get(`/Leads/${id}`);
    const f = rec.data.fields;

    const sito = f["Sito"] || "";
    const issues = (f["Issues"] || "").split(" | ").filter(Boolean);
    const forti = (f["Punti forti"] || "").split(" | ").filter(Boolean);
    const rating = f["Rating"] ? `${f["Rating"]}/5 su Google` : null;
    const hookMail = f["Hook mail"] || "";
    const sitoBloccato = issues.some((x) => x.toLowerCase().includes("anti-bot") || x.toLowerCase().includes("non raggiungibile") || x.toLowerCase().includes("non analizzato"));

    const sitoContext = sitoBloccato
      ? `Il sito esiste (${sito}) ma non e stato possibile analizzarlo. Non fare affermazioni specifiche sul sito.`
      : `Sito analizzato: ${sito}
Punti deboli: ${issues.join(", ") || "nessuno specifico"}
Punti di forza: ${forti.join(", ") || "nessuno specifico"}
${hookMail ? `Hook apertura (usa questo come spunto per aprire la mail in modo specifico e personale): ${hookMail}` : ""}`;

    const resp = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 700,
        messages: [{
          role: "user",
          content: `Sei Nicolo, fondatore di Studio Brillo (studio creativo digitale, Vicenza). Scrivi una email a freddo professionale e personale.

DESTINATARIO: "${f["Name"]}", ${f["Settore"] || "attivita locale"} a ${f["City"] || "Vicenza"}.
${rating ? `Rating Google: ${rating}` : ""}
${sitoContext}

ESEMPIO DI EMAIL BEN SCRITTA (segui questa struttura e questo tono esatto):
---
Oggetto: Un'officina cosi apprezzata merita un sito che la rappresenti davvero

Buonasera,
ho scoperto Autofficina King cercando officine specializzate in provincia di Vicenza.
Piu di 100 recensioni Google, una valutazione molto alta, servizi specialistici che vanno dalla meccatronica alle auto ibride ed elettriche. Si capisce subito che dietro c'e una realta competente e aggiornata.

Poi ho visitato il sito.
Le informazioni ci sono, ma l'immagine che trasmette online non rende giustizia al livello dell'officina. Grafica datata, struttura poco immediata e contenuti che rischiano di far percepire un'azienda diversa da quella che i clienti trovano realmente.

Ed e un peccato, perche oggi molti clienti si fanno un'idea della professionalita di un'attivita gia nei primi 10 secondi sul sito.

Lavoro con Studio Brillo e realizzo siti web per attivita locali che vogliono una presenza online all'altezza del servizio che offrono ogni giorno.

Se vi fa piacere, posso prepararvi gratuitamente una bozza grafica di come potrebbe apparire oggi il sito, senza alcun impegno. Se vi piace ne parliamo, altrimenti nessun problema.

Resto a disposizione e vi auguro buon lavoro.
Nicolo
Studio Brillo
studiobrillo.com
---

REGOLE FERREE:
- Usa l'hook di apertura fornito se disponibile, adattandolo in modo naturale
- Stessa struttura: apertura specifica e personale, osservazione sul sito, conseguenza pratica, proposta soft
- MAI dire che il sito non si apre se non sei certo
- MAI inventare dati non forniti
- MAI tono da venditore o formule burocratiche
- Oggetto specifico per questa attivita
- Firma: Nicolo / Studio Brillo / studiobrillo.com
- Niente em dash, lunghezza simile all'esempio

Scrivi l'email completa con oggetto, corpo e firma.`,
        }],
      },
      { headers: { "x-api-key": ANTHROPIC, "anthropic-version": "2023-06-01" } }
    );
    const body = resp.data.content[0].text.trim();
    await at.patch(`/Leads/${id}`, { fields: { "Email body": body, "Email stato": "da inviare" } });
    res.json({ ok: true, email_body: body });
  } catch (e) { res.status(500).json({ error: e.response?.data ? JSON.stringify(e.response.data) : e.message }); }
});

app.post("/api/run", async (req, res) => {
  const { zona, settore, maxResults, raggio } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    send({ step: 1, label: "Localizzazione zona..." });

    const geo = await geocode(zona);
    const apifyInput = { maxCrawledPlacesPerSearch: maxResults || 30, language: "it", scrapeContacts: true, searchStringsArray: [settore] };

    if (geo && raggio && Number(raggio) > 0) {
      apifyInput.customGeolocation = { type: "Point", coordinates: [geo.lon, geo.lat], radiusKm: Number(raggio) };
      send({ step: 1, label: `${zona} trovata, raggio ${raggio}km. Avvio scraping...` });
    } else {
      apifyInput.locationQuery = `${zona}, Italia`;
      send({ step: 1, label: "Avvio scraping Google Maps..." });
    }

    let places = [];
    try {
      send({ step: 1, label: "Scraping Google Maps (attendi, puo richiedere 1-2 min)..." });
      places = await runApifyAndWait(apifyInput, 360000);
      places = places.slice(0, maxResults || 30);
    } catch (err) {
      console.error("APIFY ERROR:", err.message);
      send({ step: "error", label: `Apify: ${err.message}` });
      return res.end();
    }

    send({ step: 2, label: `Trovati ${places.length} posti. Crawling siti con Apify...` });

    const leadsWithSites = await Promise.all(
      places.map(async (p) => {
        const rawSite = p.website || "";
        const sitoValido = rawSite && !isSocialOrInvalid(rawSite);
        let content = "", signals = {}, reachable = false, blocked = false;
        if (sitoValido) {
          // Prima prova il crawler Apify, fallback sul fetch diretto
          const crawled = await crawlWithApify(rawSite);
          if (crawled.text) {
            content = crawled.text;
            reachable = true;
            // Estrai segnali tecnici dall'HTML se disponibile
            if (crawled.html) {
              try {
                const $ = cheerio.load(crawled.html);
                signals = {
                  hasViewport: $('meta[name="viewport"]').length > 0,
                  title: $("title").first().text().trim(),
                  metaDesc: $('meta[name="description"]').attr("content") || "",
                  h1count: $("h1").length,
                  hasTel: /tel:|telefono|chiamaci/i.test(crawled.html),
                  hasMail: /mailto:|@/.test(crawled.html),
                  social: ["facebook.com","instagram.com","linkedin.com","tiktok.com"].filter((s) => crawled.html.includes(s)),
                  ctaWords: (crawled.html.match(/prenota|contatt|chiama|preventivo|richiedi|book|scopri/gi) || []).length,
                  htmlSize: crawled.html.length,
                };
              } catch {}
            }
          } else {
            // Fallback: fetch diretto
            const hp = await fetchHomepage(rawSite);
            content = hp.text; signals = hp.signals; reachable = hp.reachable; blocked = hp.blocked;
          }
        }
        return {
          name: p.title || p.name || "",
          city: p.city || zona,
          email_addr: (p.emails && p.emails[0]) || p.email || "",
          telefono: p.phone || "",
          rating: p.totalScore || p.rating || 0,
          reviewsCount: p.reviewsCount || 0,
          sito: sitoValido ? rawSite : "",
          social_only: rawSite && !sitoValido ? rawSite : "",
          content, signals, reachable, blocked,
        };
      })
    );

    send({ step: 3, label: "Analisi UX con Claude (7 criteri)..." });

    const calib = await (async () => {
      try {
        const r = await at.get("/Leads?maxRecords=200&filterByFormula=NOT({Feedback}=\"\")");
        const ok = [], no = [];
        r.data.records.forEach((rec) => {
          const fb = rec.fields["Feedback"], score = rec.fields["Score"];
          if (fb === "ok") ok.push(score);
          else if (fb === "no" || fb === "scartato") no.push(score);
        });
        return { ok, no };
      } catch { return { ok: [], no: [] }; }
    })();

    const avg = (arr) => arr.length ? (arr.reduce((s, x) => s + (x || 0), 0) / arr.length).toFixed(1) : "n/d";
    const calibNote = (calib.ok.length || calib.no.length)
      ? `\nCALIBRAZIONE: lead buoni score medio ${avg(calib.ok)}, scartati score medio ${avg(calib.no)}.`
      : "";

    const scored = await Promise.all(
      leadsWithSites.map(async (lead) => {
        if (lead.social_only) return { ...lead, score: 1, issues: ["solo pagina social, nessun sito web"], punti_forti: [], criteri: {} };
        if (!lead.sito) return { ...lead, score: 1, issues: ["nessun sito web"], punti_forti: [], criteri: {} };
        if (lead.blocked) return { ...lead, score: 0, issues: ["sito protetto anti-bot, analisi non possibile"], punti_forti: [], criteri: {} };
        if (!lead.reachable || !lead.content) return { ...lead, score: 0, issues: ["sito non raggiungibile"], punti_forti: [], criteri: {} };
        try {
          const s = lead.signals || {};
          const segnali = `Segnali tecnici:
- Meta viewport (mobile): ${s.hasViewport ? "si" : "NO"}
- Title: ${s.title ? `"${s.title.slice(0, 50)}"` : "NO"}
- Meta description: ${s.metaDesc ? "si" : "NO"}
- H1: ${s.h1count}
- Telefono: ${s.hasTel ? "si" : "NO"}
- Email: ${s.hasMail ? "si" : "NO"}
- Social: ${s.social?.length ? s.social.join(", ") : "nessuno"}
- CTA words: ${s.ctaWords}`;

          const resp = await axios.post(
            "https://api.anthropic.com/v1/messages",
            {
              model: "claude-haiku-4-5-20251001",
              max_tokens: 800,
              messages: [{
                role: "user",
                content: `${CRITERI}${calibNote}\n\n${segnali}\n\nTesto homepage:\n${lead.content}\n\nRispondi SOLO in JSON valido:\n{"criteri":{"mobile":<1-10>,"velocita":<1-10>,"cta":<1-10>,"seo":<1-10>,"design":<1-10>,"social":<1-10>,"contatti":<1-10>},"score":<1-7>,"issues":["prob1","prob2"],"punti_forti":["punto1"],"hook_mail":"Una frase di apertura personalizzata per una cold email, basata su qualcosa di SPECIFICO e reale trovato sul sito (un servizio particolare, una frase del sito, un dettaglio unico). Deve sembrare scritta da un essere umano che ha visitato davvero il sito. Max 2 righe."}`,
              }],
            },
            { headers: { "x-api-key": ANTHROPIC, "anthropic-version": "2023-06-01" } }
          );
          const parsed = JSON.parse(resp.data.content[0].text.match(/\{[\s\S]*\}/)[0]);
          return { ...lead, score: parsed.score, issues: parsed.issues || [], punti_forti: parsed.punti_forti || [], criteri: parsed.criteri || {}, hook_mail: parsed.hook_mail || "" };
        } catch (err) {
          console.error("SCORING ERROR:", lead.name, err.message);
          return { ...lead, score: 0, issues: ["errore analisi"], punti_forti: [], criteri: {} };
        }
      })
    );

    send({ step: 4, label: `Salvataggio ${scored.length} lead su Airtable...` });

    const runId = `run_${Date.now()}`;
    const runDate = new Date().toLocaleDateString("it-IT");

    await at.post("/Runs", {
      fields: { RunId: runId, Data: runDate, Zona: zona, Settore: settore, Lead: Math.round(scored.length), Email: 0 },
    });

    if (scored.length > 0) {
      const chunks = [];
      for (let i = 0; i < scored.length; i += 10) chunks.push(scored.slice(i, i + 10));
      for (const chunk of chunks) {
        await at.post("/Leads", {
          records: chunk.map((l) => ({
            fields: {
              Name: l.name, City: l.city, Score: Math.round(Number(l.score)) || 0,
              Email: l.email_addr, Telefono: l.telefono || "", Sito: l.sito,
              Rating: l.rating ? parseFloat(l.rating.toFixed(1)) : 0,
              "Email stato": "", "Email body": "", Feedback: "",
              Criteri: typeof l.criteri === "object" ? JSON.stringify(l.criteri) : "",
              Issues: (l.issues || []).join(" | "),
              "Punti forti": (l.punti_forti || []).join(" | "),
              "Hook mail": l.hook_mail || "",
              Zona: zona, Settore: settore, RunId: runId,
            },
          })),
        });
      }
    }

    send({ step: "done", label: `Completato — ${scored.length} lead analizzati`, runId });
    res.end();
  } catch (e) {
    const errDetail = e.response?.data ? JSON.stringify(e.response.data) : e.message;
    console.error("PIPELINE ERROR:", errDetail);
    send({ step: "error", label: errDetail });
    res.end();
  }
});

app.listen(PORT, () => console.log(`Backend su http://localhost:${PORT}`));
