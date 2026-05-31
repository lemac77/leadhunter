import { useState, useEffect, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

const Y = "#DFFF00";
const BK = "#000000";
const AN = "#1A1A1A";
const AN2 = "#222222";
const AN3 = "#2a2a2a";
const BD = "#2e2e2e";
const BD2 = "#3a3a3a";
const TX = "#f0f0f0";
const MU = "#888888";
const MU2 = "#555555";

const css = {
  wrap: { background: BK, fontFamily: "system-ui,sans-serif", minHeight: "100vh" },
  header: { background: AN, borderBottom: `1px solid ${BD}`, padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 },
  logoSeal: { width: 34, height: 34, borderRadius: "50%", border: `1.5px solid ${Y}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: Y, letterSpacing: "0.5px", flexShrink: 0 },
  logoText: { fontSize: 13, fontWeight: 600, color: TX, letterSpacing: "2.5px", textTransform: "uppercase" },
  logoSub: { fontSize: 10, color: MU, letterSpacing: "1.5px", textTransform: "uppercase", marginTop: 2 },
  btnY: { background: Y, color: BK, border: "none", padding: "9px 20px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", letterSpacing: "1px", textTransform: "uppercase" },
  nav: { background: AN, borderBottom: `1px solid ${BD}`, padding: "0 32px", display: "flex", gap: 0 },
  navBtn: (a) => ({ padding: "13px 18px", fontSize: 11, fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase", color: a ? Y : MU, background: "transparent", border: "none", cursor: "pointer", borderBottom: a ? `2px solid ${Y}` : "2px solid transparent" }),
  body: { padding: "28px 32px", maxWidth: 1100, margin: "0 auto" },
  metricsGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 },
  metric: { background: AN, border: `1px solid ${BD}`, borderRadius: 10, padding: "18px 20px" },
  mLabel: { fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: MU, marginBottom: 8 },
  mValue: { fontSize: 30, fontWeight: 600, color: Y, lineHeight: 1 },
  mSub: { fontSize: 11, color: MU2, marginTop: 6 },
  card: { background: AN, border: `1px solid ${BD}`, borderRadius: 10, padding: 22, marginBottom: 18 },
  cardTitle: { fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: MU, marginBottom: 18, display: "flex", alignItems: "center", gap: 10 },
  cardLine: { flex: 1, height: 1, background: BD },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13, tableLayout: "fixed" },
  th: { textAlign: "left", padding: "9px 12px", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: MU2, borderBottom: `1px solid ${BD}`, fontWeight: 500 },
  td: (hov) => ({ padding: "12px 12px", borderBottom: `1px solid ${BD}`, color: TX, verticalAlign: "middle", background: hov ? AN2 : "transparent", transition: "background 0.15s" }),
  scorePill: (sc) => ({ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, fontSize: 13, fontWeight: 600, ...(sc >= 5 ? { background: "#1a2600", color: Y, border: "1px solid #3a4f00" } : sc >= 3 ? { background: "#201600", color: "#EF9F27", border: "1px solid #3d2c00" } : { background: "#200000", color: "#F09595", border: "1px solid #3d0000" }) }),
  badge: (t) => ({ display: "inline-block", padding: "3px 9px", borderRadius: 4, fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", fontWeight: 500, ...(t === "da inviare" ? { background: "#0d1a00", color: Y, border: "1px solid #2a4000" } : t === "inviata" ? { background: "#0a1f00", color: "#97C459", border: "1px solid #1d3d00" } : { background: AN3, color: MU, border: `1px solid ${BD}` }) }),
  fbBtn: (on, type) => ({ width: 28, height: 28, borderRadius: 5, border: on ? (type === "ok" ? "1px solid #3a4f00" : "1px solid #4d0000") : `1px solid ${BD}`, background: on ? (type === "ok" ? "#0d1a00" : "#1f0000") : "transparent", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }),
  input: { background: AN3, border: `1px solid ${BD2}`, borderRadius: 6, padding: "10px 13px", fontSize: 13, color: TX, outline: "none", width: "100%" },
  select: { background: AN3, border: `1px solid ${BD2}`, borderRadius: 6, padding: "10px 13px", fontSize: 13, color: TX, outline: "none" },
  btnGhost: { background: "transparent", border: `1px solid ${BD2}`, borderRadius: 6, padding: "10px 18px", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: MU, cursor: "pointer" },
  btnSm: { background: "transparent", border: `1px solid ${BD2}`, borderRadius: 5, padding: "6px 13px", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: MU, cursor: "pointer" },
  btnSend: { background: "transparent", border: "1px solid #2a4000", borderRadius: 5, padding: "6px 13px", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: "#97C459", cursor: "pointer" },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 },
  fieldLabel: { fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: MU, marginBottom: 7, display: "block" },
  stepGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 14 },
  step: (st) => ({ background: st === "active" ? "#0d1a00" : st === "done" ? "#0a1400" : AN2, border: st === "active" ? "1px solid #3a4f00" : st === "done" ? "1px solid #2a3800" : `1px solid ${BD}`, borderRadius: 8, padding: "14px 10px", textAlign: "center", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: st === "active" ? Y : st === "done" ? "#97C459" : MU2 }),
  emailCard: { background: AN2, border: `1px solid ${BD}`, borderRadius: 10, padding: "18px 20px", marginBottom: 12 },
  barWrap: { height: 4, background: BD, borderRadius: 2, overflow: "hidden" },
  criteriaRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: AN2, border: `1px solid ${BD}`, borderRadius: 7, marginBottom: 7 },
  calibDot: (t) => ({ width: 8, height: 8, borderRadius: "50%", background: t === "pos" ? Y : t === "neg" ? "#E24B4A" : BD2 }),
  histRow: (last) => ({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: last ? "none" : `1px solid ${BD}` }),
  histBadge: { background: "#0d1a00", color: Y, border: "1px solid #2a4000", borderRadius: 4, padding: "2px 9px", fontSize: 11, letterSpacing: "1px" },
  linkBtn: { background: "transparent", border: "none", color: MU, cursor: "pointer", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", padding: "5px 8px" },
};

const CRITERIA = [
  { name: "Mobile responsive", peso: "1.4x", calib: "pos" },
  { name: "Velocità caricamento", peso: "1.2x", calib: "pos" },
  { name: "CTA chiara", peso: "1.0x", calib: "neu" },
  { name: "SEO on-page", peso: "0.9x", calib: "neg" },
  { name: "Design moderno", peso: "1.1x", calib: "neu" },
  { name: "Presenza social", peso: "0.8x", calib: "neg" },
  { name: "Contatti visibili", peso: "1.0x", calib: "neu" },
];

function Overview({ leads, runs, setTab }) {
  const avg = leads.length ? (leads.reduce((s, l) => s + l.score, 0) / leads.length).toFixed(1) : 0;
  const emailGen = leads.filter((l) => l.email_body).length;
  const fbOk = leads.filter((l) => l.fb === "ok").length;
  const fbTot = leads.filter((l) => l.fb).length;
  const calibPct = fbTot ? Math.round((fbOk / fbTot) * 100) : 0;
  const scoreHi = leads.filter((l) => l.score >= 5).length;
  const scoreMid = leads.filter((l) => l.score >= 3 && l.score < 5).length;
  const scoreLo = leads.filter((l) => l.score < 3 && l.score > 0).length;
  const tot = scoreHi + scoreMid + scoreLo || 1;

  return (
    <div>
      <div style={css.metricsGrid}>
        {[
          { label: "Lead totali", value: leads.length, sub: "nel foglio corrente" },
          { label: "Score UX medio", value: avg, sub: "su 7 criteri", suffix: "/7" },
          { label: "Email generate", value: emailGen, sub: `${leads.length - emailGen} skip` },
          { label: "Calibrazione", value: calibPct, sub: `${fbOk}/${fbTot} feedback ok`, suffix: "%" },
        ].map((m) => (
          <div key={m.label} style={css.metric}>
            <div style={css.mLabel}>{m.label}</div>
            <div style={css.mValue}>{m.value}{m.suffix && <span style={{ fontSize: 16, color: MU }}>{m.suffix}</span>}</div>
            <div style={css.mSub}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={css.card}>
        <div style={css.cardTitle}>Run recenti <div style={css.cardLine} /></div>
        {runs.length === 0 && <div style={{ fontSize: 13, color: MU }}>Nessun run ancora. Vai su Pipeline per iniziare.</div>}
        {runs.map((r, i) => (
          <div key={r.id} style={css.histRow(i === runs.length - 1)}>
            <div>
              <div style={{ fontSize: 14, color: TX, fontWeight: 500 }}>{r.zona} — {r.settore}</div>
              <div style={{ fontSize: 11, color: MU, letterSpacing: "1px", marginTop: 3 }}>{r.date}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={css.histBadge}>{r.leads} lead</span>
              <button style={css.linkBtn} onClick={() => setTab("leads")}>Vedi</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={css.card}>
          <div style={css.cardTitle}>Distribuzione score UX <div style={css.cardLine} /></div>
          {[
            { range: "5–7", count: scoreHi, pct: Math.round((scoreHi / tot) * 100), color: Y },
            { range: "3–4", count: scoreMid, pct: Math.round((scoreMid / tot) * 100), color: "#EF9F27" },
            { range: "1–2", count: scoreLo, pct: Math.round((scoreLo / tot) * 100), color: "#E24B4A" },
          ].map((r) => (
            <div key={r.range} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: MU, width: 36 }}>{r.range}</span>
              <div style={{ flex: 1, ...css.barWrap }}>
                <div style={{ width: `${r.pct}%`, height: 4, background: r.color, borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 12, color: TX, width: 24, textAlign: "right" }}>{r.count}</span>
            </div>
          ))}
        </div>
        <div style={css.card}>
          <div style={css.cardTitle}>Feedback calibrazione <div style={css.cardLine} /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 8 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 600, color: Y }}>{fbOk}</div>
              <div style={{ fontSize: 10, letterSpacing: "1px", color: MU, textTransform: "uppercase" }}>approvati</div>
            </div>
            <div style={{ flex: 1, ...css.barWrap }}>
              <div style={{ width: `${calibPct}%`, height: 4, background: Y, borderRadius: 2 }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 600, color: "#E24B4A" }}>{fbTot - fbOk}</div>
              <div style={{ fontSize: 10, letterSpacing: "1px", color: MU, textTransform: "uppercase" }}>scartati</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pipeline({ onRunComplete }) {
  const [form, setForm] = useState({ zona: "Vicenza", settore: "dentisti", maxResults: 30, scoreMin: 4 });
  const [runState, setRunState] = useState(null);
  const [stepIdx, setStepIdx] = useState(-1);
  const [pct, setPct] = useState(0);
  const [lbl, setLbl] = useState("");
  const esRef = useRef(null);

  const startRun = () => {
    setRunState("running");
    setStepIdx(0);
    setPct(0);
    setLbl("Avvio pipeline...");

    const url = `${API}/api/run`;
    const ctrl = new AbortController();

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
      signal: ctrl.signal,
    }).then(async (res) => {
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value);
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const d = JSON.parse(line.slice(6));
              if (d.step === "done") {
                setRunState("done");
                setLbl(d.label);
                setPct(100);
                setStepIdx(4);
                if (onRunComplete) onRunComplete();
              } else if (d.step === "error") {
                setRunState("error");
                setLbl("Errore: " + d.label);
              } else {
                setStepIdx(d.step - 1);
                setLbl(d.label);
                setPct(d.step * 22);
              }
            } catch {}
          }
        }
      }
    }).catch(() => {
      setRunState("error");
      setLbl("Errore di connessione al backend");
    });

    esRef.current = ctrl;
  };

  const getStepState = (i) => {
    if (runState === "done") return "done";
    if (stepIdx < 0) return "idle";
    if (i < stepIdx) return "done";
    if (i === stepIdx && runState === "running") return "active";
    return "idle";
  };

  return (
    <div>
      <div style={css.card}>
        <div style={css.cardTitle}>Configura run <div style={css.cardLine} /></div>
        <div style={css.formRow}>
          <div><label style={css.fieldLabel}>Zona / Città</label><input style={css.input} value={form.zona} onChange={(e) => setForm({ ...form, zona: e.target.value })} /></div>
          <div><label style={css.fieldLabel}>Settore</label><input style={css.input} value={form.settore} onChange={(e) => setForm({ ...form, settore: e.target.value })} /></div>
        </div>
        <div style={css.formRow}>
          <div><label style={css.fieldLabel}>Max risultati Maps</label><input style={css.input} type="number" value={form.maxResults} onChange={(e) => setForm({ ...form, maxResults: parseInt(e.target.value) })} /></div>
          <div>
            <label style={css.fieldLabel}>Score max per email</label>
            <select style={{ ...css.select, width: "100%" }} value={form.scoreMin} onChange={(e) => setForm({ ...form, scoreMin: parseInt(e.target.value) })}>
              <option value={7}>tutti i lead</option>
              <option value={4}>max 4/7 — consigliato</option>
              <option value={3}>max 3/7 — solo i peggiori</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          <button style={{ ...css.btnY, padding: "11px 26px", fontSize: 12 }} onClick={startRun} disabled={runState === "running"}>
            ▶ {runState === "running" ? "In esecuzione..." : "Lancia pipeline"}
          </button>
        </div>
      </div>

      {runState && (
        <div style={css.card}>
          <div style={css.cardTitle}>Stato run <div style={css.cardLine} /></div>
          <div style={{ background: AN2, border: `1px solid ${BD}`, borderRadius: 8, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: runState === "done" ? "#639922" : runState === "error" ? "#E24B4A" : Y, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: TX, marginBottom: 7 }}>{lbl}</div>
              <div style={css.barWrap}><div style={{ width: `${pct}%`, height: 4, background: Y, borderRadius: 2, transition: "width 0.5s" }} /></div>
            </div>
            <span style={{ fontSize: 11, color: MU, letterSpacing: "1px" }}>{pct}%</span>
          </div>
          <div style={css.stepGrid}>
            {[
              { i: 0, icon: "📍", name: "Scrape Maps" },
              { i: 1, icon: "🌐", name: "Crawl siti" },
              { i: 2, icon: "🧠", name: "Score UX" },
              { i: 3, icon: "✉", name: "Genera email" },
            ].map((st) => (
              <div key={st.i} style={css.step(getStepState(st.i))}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{st.icon}</div>
                {st.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Leads({ leads, setLeads, setTab }) {
  const [hover, setHover] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("tutti");
  const [fbFilter, setFbFilter] = useState("tutti");

  const setFb = async (lead, val) => {
    const newFb = lead.fb === val ? null : val;
    try {
      await fetch(`${API}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowIndex: lead.rowIndex, feedback: newFb || "" }),
      });
      setLeads((prev) => prev.map((l) => l.rowIndex === lead.rowIndex ? { ...l, fb: newFb } : l));
    } catch {}
  };

  const filtered = leads.filter((l) => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.city.toLowerCase().includes(search.toLowerCase());
    const matchScore = filter === "tutti" || (filter === "alti" && l.score >= 5) || (filter === "medi" && l.score >= 3 && l.score < 5) || (filter === "bassi" && l.score < 3);
    const matchFb = fbFilter === "tutti" || (fbFilter === "ok" && l.fb === "ok") || (fbFilter === "no" && l.fb === "no") || (fbFilter === "none" && !l.fb);
    return matchSearch && matchScore && matchFb;
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center" }}>
        <input style={{ ...css.input, maxWidth: 260 }} placeholder="Cerca azienda, città..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select style={css.select} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="tutti">Tutti gli score</option>
          <option value="alti">Alti 5–7</option>
          <option value="medi">Medi 3–4</option>
          <option value="bassi">Bassi 1–2</option>
        </select>
        <select style={css.select} value={fbFilter} onChange={(e) => setFbFilter(e.target.value)}>
          <option value="tutti">Tutti i feedback</option>
          <option value="ok">Approvati</option>
          <option value="no">Scartati</option>
          <option value="none">Senza feedback</option>
        </select>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: MU }}>{filtered.length} lead</span>
      </div>

      {leads.length === 0 ? (
        <div style={{ ...css.card, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 13, color: MU }}>Nessun lead ancora. Lancia il pipeline per iniziare.</div>
          <button style={{ ...css.btnY, marginTop: 16 }} onClick={() => setTab("pipeline")}>▶ Vai al pipeline</button>
        </div>
      ) : (
        <div style={{ ...css.card, padding: 0, overflow: "hidden" }}>
          <table style={css.table}>
            <thead>
              <tr>
                <th style={{ ...css.th, paddingLeft: 18, width: "28%" }}>Azienda</th>
                <th style={{ ...css.th, width: "14%" }}>Città</th>
                <th style={{ ...css.th, width: "10%", textAlign: "center" }}>Score</th>
                <th style={{ ...css.th, width: "16%" }}>Stato email</th>
                <th style={{ ...css.th, width: "18%", textAlign: "center" }}>Feedback</th>
                <th style={{ ...css.th, width: "14%", textAlign: "right", paddingRight: 18 }}>Sito</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  <td style={{ ...css.td(hover === i), paddingLeft: 18, fontWeight: 500 }}>{l.name}</td>
                  <td style={{ ...css.td(hover === i), color: MU }}>{l.city}</td>
                  <td style={{ ...css.td(hover === i), textAlign: "center" }}><span style={css.scorePill(l.score)}>{l.score}</span></td>
                  <td style={css.td(hover === i)}><span style={css.badge(l.email_stato)}>{l.email_stato}</span></td>
                  <td style={css.td(hover === i)}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <button style={css.fbBtn(l.fb === "ok", "ok")} onClick={() => setFb(l, "ok")}>✅</button>
                      <button style={css.fbBtn(l.fb === "no", "no")} onClick={() => setFb(l, "no")}>❌</button>
                    </div>
                  </td>
                  <td style={{ ...css.td(hover === i), textAlign: "right", paddingRight: 18 }}>
                    {l.sito ? <a href={l.sito} target="_blank" rel="noreferrer" style={{ color: Y, fontSize: 11, letterSpacing: "1px" }}>Apri</a> : <span style={{ color: MU2 }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Emails({ leads, setLeads }) {
  const withEmail = leads.filter((l) => l.email_body);
  const [filter, setFilter] = useState("tutte");

  const markSent = async (lead) => {
    try {
      await fetch(`${API}/api/email-stato`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowIndex: lead.rowIndex, stato: "inviata" }),
      });
      setLeads((prev) => prev.map((l) => l.rowIndex === lead.rowIndex ? { ...l, email_stato: "inviata" } : l));
    } catch {}
  };

  const copy = (text) => navigator.clipboard.writeText(text);

  const filtered = withEmail.filter((l) => filter === "tutte" || l.email_stato === filter);

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <select style={css.select} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="tutte">Tutte</option>
          <option value="da inviare">Da inviare</option>
          <option value="inviata">Inviate</option>
        </select>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: MU, alignSelf: "center" }}>{filtered.length} email</span>
      </div>

      {filtered.length === 0 && (
        <div style={{ ...css.card, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 13, color: MU }}>Nessuna email generata ancora.</div>
        </div>
      )}

      {filtered.map((l, i) => (
        <div key={i} style={css.emailCard}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: TX }}>{l.name}</div>
              <div style={{ fontSize: 11, color: MU, marginTop: 2 }}>{l.email_addr || "email non trovata"}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={css.badge(l.email_stato)}>{l.email_stato}</span>
              <span style={css.scorePill(l.score)}>{l.score}</span>
            </div>
          </div>
          <div style={{ fontSize: 13, color: MU, lineHeight: 1.75, borderLeft: `2px solid ${BD2}`, paddingLeft: 14, marginBottom: 14, whiteSpace: "pre-wrap" }}>{l.email_body}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={css.btnSm} onClick={() => copy(l.email_body)}>⎘ Copia</button>
            {l.email_addr && <button style={css.btnSm} onClick={() => window.open(`mailto:${l.email_addr}?body=${encodeURIComponent(l.email_body)}`)}>✉ Apri mail</button>}
            {l.email_stato === "da inviare" && <button style={css.btnSend} onClick={() => markSent(l)}>✓ Segna inviata</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

function Settings() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={css.card}>
        <div style={css.cardTitle}>Variabili d'ambiente backend <div style={css.cardLine} /></div>
        <div style={{ fontSize: 12, color: MU, lineHeight: 2 }}>
          {["APIFY_TOKEN", "ANTHROPIC_API_KEY", "GOOGLE_SHEET_ID", "GOOGLE_SERVICE_ACCOUNT_JSON", "FRONTEND_URL"].map((k) => (
            <div key={k} style={{ fontFamily: "monospace", fontSize: 11, color: TX, background: AN2, border: `1px solid ${BD}`, borderRadius: 5, padding: "6px 10px", marginBottom: 7 }}>{k}</div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: MU, marginTop: 8 }}>Configurate su Railway come env vars. Non editabili da UI per sicurezza.</div>
      </div>
      <div style={css.card}>
        <div style={css.cardTitle}>Criteri UX — pesi calibrazione <div style={css.cardLine} /></div>
        {CRITERIA.map((c) => (
          <div key={c.name} style={css.criteriaRow}>
            <span style={{ fontSize: 13, color: TX }}>{c.name}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 10, letterSpacing: "1px", color: MU }}>{c.peso}</span>
              <div style={css.calibDot(c.calib)} />
            </div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 10, color: MU, letterSpacing: "1px" }}>
          {[["pos", "positivo"], ["neg", "negativo"], ["neu", "neutro"]].map(([t, l]) => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ ...css.calibDot(t), width: 7, height: 7 }} />{l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const TABS = ["overview", "pipeline", "leads", "emails", "settings"];

export default function App() {
  const [tab, setTab] = useState("overview");
  const [leads, setLeads] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [lr, rr] = await Promise.all([
        fetch(`${API}/api/leads`).then((r) => r.json()),
        fetch(`${API}/api/runs`).then((r) => r.json()),
      ]);
      setLeads(Array.isArray(lr) ? lr : []);
      setRuns(Array.isArray(rr) ? rr : []);
    } catch {
      setLeads([]);
      setRuns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div style={css.wrap}>
      <div style={css.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={css.logoSeal}>SB</div>
          <div>
            <div style={css.logoText}>Lead Hunter</div>
            <div style={css.logoSub}>Studio Brillo — pipeline</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {runs[0] && <span style={{ fontSize: 11, color: MU, letterSpacing: "1px" }}>ULTIMO RUN: {runs[0].date?.toUpperCase()}</span>}
          <button style={css.btnY} onClick={() => setTab("pipeline")}>▶ Nuovo run</button>
        </div>
      </div>

      <div style={css.nav} role="tablist">
        {TABS.map((t) => (
          <button key={t} style={css.navBtn(tab === t)} onClick={() => setTab(t)} role="tab">
            {t}
            {t === "leads" && leads.length > 0 && (
              <span style={{ background: "#0d1a00", color: Y, border: "1px solid #2a4000", borderRadius: 4, padding: "1px 6px", fontSize: 10, marginLeft: 4 }}>{leads.length}</span>
            )}
          </button>
        ))}
      </div>

      <div style={css.body}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: MU, fontSize: 13, letterSpacing: "1px" }}>Caricamento dati...</div>
        ) : (
          <>
            {tab === "overview" && <Overview leads={leads} runs={runs} setTab={setTab} />}
            {tab === "pipeline" && <Pipeline onRunComplete={fetchData} />}
            {tab === "leads" && <Leads leads={leads} setLeads={setLeads} setTab={setTab} />}
            {tab === "emails" && <Emails leads={leads} setLeads={setLeads} />}
            {tab === "settings" && <Settings />}
          </>
        )}
      </div>
    </div>
  );
}
