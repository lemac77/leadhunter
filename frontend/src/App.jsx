import { useState, useEffect, useCallback } from "react";

const API = "https://leadhunter-qpvs.onrender.com";

let APP_PW = sessionStorage.getItem("lh_pw") || "";
function authHeaders(extra = {}) { return { ...extra, "x-app-password": APP_PW }; }

const Y = "#DFFF00", BK = "#000000", AN = "#1A1A1A", AN2 = "#222222", AN3 = "#2a2a2a";
const BD = "#2e2e2e", BD2 = "#3a3a3a", TX = "#f0f0f0", MU = "#888888", MU2 = "#555555";

const css = {
  wrap: { background: BK, fontFamily: "system-ui,sans-serif", minHeight: "100vh" },
  header: { background: AN, borderBottom: `1px solid ${BD}`, padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 },
  logoSeal: { width: 34, height: 34, borderRadius: "50%", border: `1.5px solid ${Y}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: Y, flexShrink: 0 },
  logoText: { fontSize: 13, fontWeight: 600, color: TX, letterSpacing: "2.5px", textTransform: "uppercase" },
  logoSub: { fontSize: 10, color: MU, letterSpacing: "1.5px", textTransform: "uppercase", marginTop: 2 },
  btnY: { background: Y, color: BK, border: "none", padding: "9px 20px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", letterSpacing: "1px", textTransform: "uppercase" },
  btnGhost: { background: "transparent", border: `1px solid ${BD2}`, borderRadius: 6, padding: "9px 14px", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: MU, cursor: "pointer" },
  btnSm: { background: "transparent", border: `1px solid ${BD2}`, borderRadius: 5, padding: "6px 13px", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: MU, cursor: "pointer" },
  btnGen: { background: Y, border: "none", borderRadius: 5, padding: "6px 14px", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: BK, cursor: "pointer", fontWeight: 600 },
  btnApprove: { background: "#0d1a00", border: `1px solid #3a4f00`, borderRadius: 5, padding: "6px 14px", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: Y, cursor: "pointer", fontWeight: 600 },
  btnDel: { background: "transparent", border: "1px solid #4d0000", borderRadius: 5, padding: "6px 13px", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: "#F09595", cursor: "pointer" },
  nav: { background: AN, borderBottom: `1px solid ${BD}`, padding: "0 32px", display: "flex" },
  navBtn: (a) => ({ padding: "13px 18px", fontSize: 11, fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase", color: a ? Y : MU, background: "transparent", border: "none", cursor: "pointer", borderBottom: a ? `2px solid ${Y}` : "2px solid transparent" }),
  body: { padding: "28px 32px", maxWidth: 1200, margin: "0 auto" },
  metricsGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 },
  metric: { background: AN, border: `1px solid ${BD}`, borderRadius: 10, padding: "18px 20px" },
  mLabel: { fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: MU, marginBottom: 8 },
  mValue: { fontSize: 30, fontWeight: 600, color: Y, lineHeight: 1 },
  mSub: { fontSize: 11, color: MU2, marginTop: 6 },
  card: { background: AN, border: `1px solid ${BD}`, borderRadius: 10, padding: 22, marginBottom: 18 },
  cardTitle: { fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: MU, marginBottom: 18, display: "flex", alignItems: "center", gap: 10 },
  cardLine: { flex: 1, height: 1, background: BD },
  scorePill: (sc) => ({ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 6, fontSize: 13, fontWeight: 600, ...(!sc ? { background: AN3, color: MU, border: `1px solid ${BD2}` } : sc >= 5 ? { background: "#1a2600", color: Y, border: "1px solid #3a4f00" } : sc >= 3 ? { background: "#201600", color: "#EF9F27", border: "1px solid #3d2c00" } : { background: "#200000", color: "#F09595", border: "1px solid #3d0000" }) }),
  badge: (t) => ({ display: "inline-block", padding: "3px 9px", borderRadius: 4, fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", fontWeight: 500, ...(t === "da inviare" ? { background: "#0d1a00", color: Y, border: "1px solid #2a4000" } : t === "inviata" ? { background: "#0a1f00", color: "#97C459", border: "1px solid #1d3d00" } : t === "approvato" ? { background: "#0d1a00", color: Y, border: "1px solid #3a4f00" } : { background: AN3, color: MU, border: `1px solid ${BD}` }) }),
  input: { background: AN3, border: `1px solid ${BD2}`, borderRadius: 6, padding: "10px 13px", fontSize: 13, color: TX, outline: "none", width: "100%" },
  select: { background: AN3, border: `1px solid ${BD2}`, borderRadius: 6, padding: "10px 13px", fontSize: 13, color: TX, outline: "none" },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 },
  fieldLabel: { fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: MU, marginBottom: 7, display: "block" },
  stepGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 14 },
  step: (st) => ({ background: st === "active" ? "#0d1a00" : st === "done" ? "#0a1400" : AN2, border: st === "active" ? "1px solid #3a4f00" : st === "done" ? "1px solid #2a3800" : `1px solid ${BD}`, borderRadius: 8, padding: "14px 10px", textAlign: "center", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: st === "active" ? Y : st === "done" ? "#97C459" : MU2 }),
  barWrap: { height: 4, background: BD, borderRadius: 2, overflow: "hidden" },
  leadRow: { background: AN2, border: `1px solid ${BD}`, borderRadius: 9, marginBottom: 8, overflow: "hidden" },
  leadHead: { display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", cursor: "pointer" },
  leadDetail: { padding: "0 16px 16px 16px", borderTop: `1px solid ${BD}` },
  critBar: (v) => ({ height: 5, borderRadius: 3, background: v >= 7 ? "#639922" : v >= 4 ? "#EF9F27" : "#E24B4A", width: `${v * 10}%` }),
  runGroup: { marginBottom: 28 },
  runGroupHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${BD}` },
  emailCard: { background: AN2, border: `1px solid ${BD}`, borderRadius: 10, padding: "18px 20px", marginBottom: 12 },
};

const CRIT_LABELS = { mobile: "Mobile", velocita: "Velocita", cta: "CTA", seo: "SEO", design: "Design", social: "Social", contatti: "Contatti" };
const STATI = ["da inviare", "inviata", "ha risposto", "cliente"];
const statoColor = (st) => {
  if (st === "inviata") return { bg: "#0a1f00", col: "#97C459", bd: "#1d3d00" };
  if (st === "ha risposto") return { bg: "#1a1400", col: "#EF9F27", bd: "#3d2c00" };
  if (st === "cliente") return { bg: "#0d1a00", col: Y, bd: "#3a4f00" };
  return { bg: "#0d1a00", col: Y, bd: "#2a4000" };
};

function parseCriteri(str) { try { return JSON.parse(str); } catch { return null; } }

function Login({ onLogin }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true); setErr("");
    try {
      const r = await fetch(`${API}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
      if (r.ok) { APP_PW = pw; sessionStorage.setItem("lh_pw", pw); onLogin(); }
      else setErr("Password errata");
    } catch { setErr("Errore di connessione"); }
    setLoading(false);
  };

  return (
    <div style={{ background: BK, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: AN, border: `1px solid ${BD}`, borderRadius: 12, padding: 40, width: 340, textAlign: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: `1.5px solid ${Y}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: Y, margin: "0 auto 18px" }}>SB</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: TX, letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 4 }}>Lead Hunter</div>
        <div style={{ fontSize: 10, color: MU, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 28 }}>Studio Brillo</div>
        <input type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} style={{ background: AN3, border: `1px solid ${BD2}`, borderRadius: 6, padding: "11px 14px", fontSize: 14, color: TX, outline: "none", width: "100%", marginBottom: 12, textAlign: "center", boxSizing: "border-box" }} />
        {err && <div style={{ color: "#F09595", fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <button onClick={submit} disabled={loading} style={{ background: Y, color: BK, border: "none", padding: "11px 24px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", letterSpacing: "1px", textTransform: "uppercase", width: "100%" }}>
          {loading ? "Verifica..." : "Entra"}
        </button>
      </div>
    </div>
  );
}

function LeadCard({ lead, onApprove, onScarta, onDelete, onGen, onStato, generating, showApprove }) {
  const [open, setOpen] = useState(false);
  const crit = parseCriteri(lead.criteri);
  const hasCrit = crit && Object.values(crit).some((v) => Number(v) > 0);
  const issues = (lead.issues || "").split(" | ").filter(Boolean);
  const forti = (lead.punti_forti || "").split(" | ").filter(Boolean);
  const isApproved = lead.fb === "ok";

  return (
    <div style={css.leadRow}>
      <div style={css.leadHead} onClick={() => setOpen(!open)}>
        <span style={{ ...css.scorePill(lead.score), fontSize: lead.score ? 13 : 10 }}>{lead.score || "n/d"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: TX }}>{lead.name}</div>
          <div style={{ fontSize: 11, color: MU, marginTop: 2 }}>{lead.city}{lead.telefono ? ` · ${lead.telefono}` : ""}</div>
        </div>
        {isApproved && <span style={css.badge("approvato")}>Approvato</span>}
        {lead.email_body && (() => { const sc = statoColor(lead.email_stato || "da inviare"); return <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 4, fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", fontWeight: 500, background: sc.bg, color: sc.col, border: `1px solid ${sc.bd}` }}>{lead.email_stato || "da inviare"}</span>; })()}
        {lead.fb === "scartato" && <span style={css.badge("skip")}>Scartato</span>}
        <span style={{ color: MU, fontSize: 14 }}>{open ? "▴" : "▾"}</span>
      </div>

      {open && (
        <div style={css.leadDetail}>
          {hasCrit ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", margin: "14px 0" }}>
              {Object.keys(CRIT_LABELS).map((k) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, color: MU, width: 70 }}>{CRIT_LABELS[k]}</span>
                  <div style={{ flex: 1, height: 5, background: BD, borderRadius: 3 }}><div style={css.critBar(crit[k] || 0)} /></div>
                  <span style={{ fontSize: 11, color: TX, width: 24, textAlign: "right" }}>{crit[k] || 0}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ margin: "14px 0", padding: "10px 12px", background: AN, border: `1px solid ${BD}`, borderRadius: 7, fontSize: 12, color: MU }}>
              Sito non analizzato automaticamente. Controllalo a mano per valutarlo.
            </div>
          )}
          {issues.length > 0 && <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: "#F09595", marginBottom: 6 }}>Punti deboli</div>
            {issues.map((x, i) => <div key={i} style={{ fontSize: 12, color: TX, marginBottom: 3 }}>· {x}</div>)}
          </div>}
          {forti.length > 0 && <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: "#97C459", marginBottom: 6 }}>Punti di forza</div>
            {forti.map((x, i) => <div key={i} style={{ fontSize: 12, color: TX, marginBottom: 3 }}>· {x}</div>)}
          </div>}
          <div style={{ fontSize: 12, color: MU, marginBottom: 12 }}>
            {lead.sito && <span>Sito: <a href={lead.sito} target="_blank" rel="noreferrer" style={{ color: Y }}>{lead.sito}</a></span>}
            {lead.email_addr && <span style={{ marginLeft: 16 }}>Email: {lead.email_addr}</span>}
          </div>
          {lead.email_body && (
            <div style={{ fontSize: 12, color: TX, lineHeight: 1.7, background: AN, border: `1px solid ${BD}`, borderRadius: 7, padding: "12px 14px", marginBottom: 12, whiteSpace: "pre-wrap" }}>{lead.email_body}</div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {showApprove && !isApproved && (
              <button style={css.btnApprove} onClick={() => onApprove(lead)}>Approva lead</button>
            )}
            {isApproved && !lead.email_body && (
              <button style={css.btnGen} onClick={() => onGen(lead)} disabled={generating}>{generating ? "Generazione..." : "Genera email"}</button>
            )}
            {isApproved && lead.email_body && (
              <>
                <button style={css.btnSm} onClick={() => navigator.clipboard.writeText(lead.email_body)}>Copia</button>
                {lead.email_addr && <button style={css.btnGen} onClick={() => { window.open(`mailto:${lead.email_addr}?subject=${encodeURIComponent("Studio Brillo")}&body=${encodeURIComponent(lead.email_body)}`); if ((lead.email_stato || "da inviare") === "da inviare") onStato(lead, "inviata"); }}>Apri mail</button>}
                {(lead.email_stato || "da inviare") === "da inviare" && <button style={css.btnSm} onClick={() => onStato(lead, "inviata")}>Segna inviata</button>}
                {lead.email_stato === "inviata" && <button style={css.btnSm} onClick={() => onStato(lead, "ha risposto")}>Ha risposto</button>}
                {lead.email_stato === "ha risposto" && <button style={css.btnApprove} onClick={() => onStato(lead, "cliente")}>Diventa cliente</button>}
                <button style={css.btnSm} onClick={() => onGen(lead)} disabled={generating}>Rigenera</button>
              </>
            )}
            <div style={{ flex: 1 }} />
            {lead.fb !== "scartato" && <button style={css.btnSm} onClick={() => onScarta(lead)}>Scarta</button>}
            <button style={css.btnDel} onClick={() => onDelete(lead)}>Elimina</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Overview({ leads, runs, setTab }) {
  const active = leads.filter((l) => l.fb !== "scartato");
  const approved = leads.filter((l) => l.fb === "ok");
  const emailGen = leads.filter((l) => l.email_body).length;
  const avg = active.length ? (active.reduce((s, l) => s + l.score, 0) / active.length).toFixed(1) : 0;

  return (
    <div>
      <div style={css.metricsGrid}>
        {[
          { label: "Lead attivi", value: active.length, sub: `${leads.filter((l) => l.fb === "scartato").length} scartati` },
          { label: "Approvati", value: approved.length, sub: "in cold leads" },
          { label: "Email generate", value: emailGen, sub: "pronte da inviare" },
          { label: "Score medio", value: avg, sub: "su 7 criteri", suffix: "/7" },
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
        {runs.length === 0 && <div style={{ fontSize: 13, color: MU }}>Nessun run. Vai su Pipeline per iniziare.</div>}
        {runs.slice(0, 8).map((r, i) => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: i < Math.min(runs.length, 8) - 1 ? `1px solid ${BD}` : "none" }}>
            <div>
              <div style={{ fontSize: 13, color: TX, fontWeight: 500 }}>{r.zona} — {r.settore}</div>
              <div style={{ fontSize: 11, color: MU, marginTop: 2 }}>{r.date}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: "#0d1a00", color: Y, border: "1px solid #2a4000", borderRadius: 4, padding: "2px 9px", fontSize: 11 }}>{r.leads} lead</span>
              <button style={{ ...css.btnSm, fontSize: 10 }} onClick={() => setTab("leads")}>Vedi</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Pipeline({ onRunComplete }) {
  const [form, setForm] = useState({ zona: "Vicenza", settore: "dentisti", maxResults: 30, raggio: 10 });
  const [runState, setRunState] = useState(null);
  const [stepIdx, setStepIdx] = useState(-1);
  const [pct, setPct] = useState(0);
  const [lbl, setLbl] = useState("");

  const startRun = () => {
    setRunState("running"); setStepIdx(0); setPct(5); setLbl("Avvio...");
    fetch(`${API}/api/run`, { method: "POST", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify(form) })
      .then(async (res) => {
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
            if (!line.startsWith("data: ")) continue;
            try {
              const d = JSON.parse(line.slice(6));
              if (d.step === "done") { setRunState("done"); setLbl(d.label); setPct(100); setStepIdx(4); onRunComplete && onRunComplete(); }
              else if (d.step === "error") { setRunState("error"); setLbl("Errore: " + d.label); }
              else { setStepIdx(Number(d.step) - 1); setLbl(d.label); setPct(Number(d.step) * 22); }
            } catch {}
          }
        }
      }).catch(() => { setRunState("error"); setLbl("Errore connessione backend"); });
  };

  const stepState = (i) => {
    if (runState === "done") return "done";
    if (i < stepIdx) return "done";
    if (i === stepIdx && runState === "running") return "active";
    return "idle";
  };

  return (
    <div>
      <div style={css.card}>
        <div style={css.cardTitle}>Configura run <div style={css.cardLine} /></div>
        <div style={css.formRow}>
          <div><label style={css.fieldLabel}>Zona / CAP</label><input style={css.input} value={form.zona} onChange={(e) => setForm({ ...form, zona: e.target.value })} /></div>
          <div><label style={css.fieldLabel}>Settore</label><input style={css.input} value={form.settore} onChange={(e) => setForm({ ...form, settore: e.target.value })} /></div>
        </div>
        <div style={css.formRow}>
          <div><label style={css.fieldLabel}>Max risultati Maps</label><input style={css.input} type="number" value={form.maxResults} onChange={(e) => setForm({ ...form, maxResults: parseInt(e.target.value) })} /></div>
          <div><label style={css.fieldLabel}>Raggio km (0 = tutta la provincia)</label><input style={css.input} type="number" min="0" value={form.raggio} onChange={(e) => setForm({ ...form, raggio: parseInt(e.target.value) || 0 })} /></div>
        </div>
        <div style={{ fontSize: 11, color: MU, marginBottom: 14 }}>Il pipeline analizza tutti i lead. Vai su Cold Leads per approvarli e generare le email.</div>
        <button style={{ ...css.btnY, padding: "11px 26px" }} onClick={startRun} disabled={runState === "running"}>
          {runState === "running" ? "In esecuzione..." : "Lancia pipeline"}
        </button>
      </div>
      {runState && (
        <div style={css.card}>
          <div style={css.cardTitle}>Stato run <div style={css.cardLine} /></div>
          <div style={{ background: AN2, border: `1px solid ${BD}`, borderRadius: 8, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: runState === "done" ? "#639922" : runState === "error" ? "#E24B4A" : Y, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: TX, marginBottom: 7 }}>{lbl}</div>
              <div style={css.barWrap}><div style={{ width: `${pct}%`, height: 4, background: Y, borderRadius: 2, transition: "width 0.5s" }} /></div>
            </div>
            <span style={{ fontSize: 11, color: MU }}>{pct}%</span>
          </div>
          <div style={css.stepGrid}>
            {["Localizza", "Scrape Maps", "Analisi UX", "Salva"].map((n, i) => (
              <div key={i} style={css.step(stepState(i))}>{n}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Leads({ leads, setLeads, runs }) {
  const [selectedRun, setSelectedRun] = useState("tutti");
  const [search, setSearch] = useState("");
  const [genId, setGenId] = useState(null);

  const onApprove = async (lead) => {
    await fetch(`${API}/api/feedback`, { method: "POST", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ id: lead.id, feedback: "ok" }) });
    setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, fb: "ok" } : l));
  };
  const onScarta = async (lead) => {
    await fetch(`${API}/api/scarta`, { method: "POST", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ id: lead.id }) });
    setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, fb: "scartato" } : l));
  };
  const onDelete = async (lead) => {
    if (!window.confirm(`Eliminare ${lead.name}?`)) return;
    await fetch(`${API}/api/delete-lead`, { method: "POST", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ id: lead.id }) });
    setLeads((prev) => prev.filter((l) => l.id !== lead.id));
  };
  const onGen = async (lead) => {
    setGenId(lead.id);
    try {
      const r = await fetch(`${API}/api/genera-email`, { method: "POST", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ id: lead.id }) });
      const d = await r.json();
      if (d.email_body) setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, email_body: d.email_body, email_stato: "da inviare" } : l));
    } catch {}
    setGenId(null);
  };
  const onStato = async (lead, stato) => {
    await fetch(`${API}/api/email-stato`, { method: "POST", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ id: lead.id, stato }) });
    setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, email_stato: stato } : l));
  };

  const onDeleteRun = async (runId) => {
    if (!window.confirm("Eliminare tutti i lead di questo run?")) return;
    await fetch(`${API}/api/delete-run`, { method: "POST", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ runId }) });
    setLeads((prev) => prev.filter((l) => l.runId !== runId));
    if (selectedRun === runId) setSelectedRun("tutti");
  };

  const allVisible = leads.filter((l) => l.fb !== "scartato");
  const runGroups = selectedRun === "tutti"
    ? [...new Set(allVisible.map((l) => l.runId || "senza-run"))].map((rid) => ({ runId: rid, items: allVisible.filter((l) => (l.runId || "senza-run") === rid) }))
    : [{ runId: selectedRun, items: allVisible.filter((l) => l.runId === selectedRun) }];

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center" }}>
        <select style={css.select} value={selectedRun} onChange={(e) => setSelectedRun(e.target.value)}>
          <option value="tutti">Tutti i run</option>
          {runs.map((r) => <option key={r.runId} value={r.runId}>{r.zona} — {r.settore} ({r.date})</option>)}
        </select>
        <input style={{ ...css.input, maxWidth: 220 }} placeholder="Cerca..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: MU }}>{allVisible.length} attivi</span>
      </div>

      {runGroups.map(({ runId, items }) => {
        const filtered = search ? items.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()) || l.city.toLowerCase().includes(search.toLowerCase())) : items;
        const run = runs.find((r) => r.runId === runId);
        return (
          <div key={runId} style={css.runGroup}>
            <div style={css.runGroupHeader}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: TX }}>{run ? `${run.zona} — ${run.settore}` : runId}</div>
                <div style={{ fontSize: 11, color: MU, marginTop: 2 }}>{run?.date} · {filtered.length} lead</div>
              </div>
              <button style={css.btnDel} onClick={() => onDeleteRun(runId)}>Elimina run</button>
            </div>
            {filtered.length === 0 ? (
              <div style={{ fontSize: 13, color: MU, padding: "12px 0" }}>Nessun lead in questo run.</div>
            ) : (
              filtered.map((l) => (
                <LeadCard key={l.id} lead={l} onApprove={onApprove} onScarta={onScarta} onDelete={onDelete} onGen={onGen} onStato={onStato} generating={genId === l.id} showApprove={true} />
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}

function ColdLeads({ leads, setLeads }) {
  const [genId, setGenId] = useState(null);
  const approved = leads.filter((l) => l.fb === "ok");

  const onScarta = async (lead) => {
    await fetch(`${API}/api/scarta`, { method: "POST", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ id: lead.id }) });
    setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, fb: "scartato" } : l));
  };
  const onDelete = async (lead) => {
    if (!window.confirm(`Eliminare ${lead.name}?`)) return;
    await fetch(`${API}/api/delete-lead`, { method: "POST", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ id: lead.id }) });
    setLeads((prev) => prev.filter((l) => l.id !== lead.id));
  };
  const onGen = async (lead) => {
    setGenId(lead.id);
    try {
      const r = await fetch(`${API}/api/genera-email`, { method: "POST", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ id: lead.id }) });
      const d = await r.json();
      if (d.email_body) setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, email_body: d.email_body, email_stato: "da inviare" } : l));
    } catch {}
    setGenId(null);
  };
  const onStato = async (lead, stato) => {
    await fetch(`${API}/api/email-stato`, { method: "POST", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ id: lead.id, stato }) });
    setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, email_stato: stato } : l));
  };

  const withEmail = approved.filter((l) => l.email_body);
  const withoutEmail = approved.filter((l) => !l.email_body);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div style={css.metric}>
          <div style={css.mLabel}>Approvati</div>
          <div style={css.mValue}>{approved.length}</div>
          <div style={css.mSub}>lead selezionati</div>
        </div>
        <div style={css.metric}>
          <div style={css.mLabel}>Email generate</div>
          <div style={css.mValue}>{withEmail.length}</div>
          <div style={css.mSub}>pronte da inviare</div>
        </div>
        <div style={css.metric}>
          <div style={css.mLabel}>Da completare</div>
          <div style={css.mValue}>{withoutEmail.length}</div>
          <div style={css.mSub}>senza email</div>
        </div>
      </div>

      {approved.length === 0 && (
        <div style={{ ...css.card, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 13, color: MU, marginBottom: 8 }}>Nessun lead approvato.</div>
          <div style={{ fontSize: 12, color: MU2 }}>Vai su Leads, espandi un contatto e clicca "Approva lead".</div>
        </div>
      )}

      {withoutEmail.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...css.cardTitle, marginBottom: 12 }}>Da completare <div style={css.cardLine} /></div>
          {withoutEmail.map((l) => (
            <LeadCard key={l.id} lead={l} onApprove={() => {}} onScarta={onScarta} onDelete={onDelete} onGen={onGen} onStato={onStato} generating={genId === l.id} showApprove={false} />
          ))}
        </div>
      )}

      {withEmail.length > 0 && (
        <div>
          <div style={{ ...css.cardTitle, marginBottom: 12 }}>Email pronte <div style={css.cardLine} /></div>
          {withEmail.map((l) => (
            <LeadCard key={l.id} lead={l} onApprove={() => {}} onScarta={onScarta} onDelete={onDelete} onGen={onGen} onStato={onStato} generating={genId === l.id} showApprove={false} />
          ))}
        </div>
      )}
    </div>
  );
}

const TABS = ["overview", "pipeline", "leads", "cold leads"];

export default function App() {
  const [authed, setAuthed] = useState(!!sessionStorage.getItem("lh_pw"));
  const [tab, setTab] = useState("overview");
  const [leads, setLeads] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wiping, setWiping] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [lr, rr] = await Promise.all([
        fetch(`${API}/api/leads`, { headers: authHeaders() }).then((r) => r.json()),
        fetch(`${API}/api/runs`, { headers: authHeaders() }).then((r) => r.json()),
      ]);
      setLeads(Array.isArray(lr) ? lr : []);
      setRuns(Array.isArray(rr) ? rr : []);
    } catch { setLeads([]); setRuns([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authed) fetchData(); }, [authed]);

  const wipeAll = async () => {
    if (!window.confirm("Cancellare TUTTO da Airtable? Operazione irreversibile.")) return;
    setWiping(true);
    try { await fetch(`${API}/api/wipe-all`, { method: "POST", headers: authHeaders({ "Content-Type": "application/json" }), body: "{}" }); await fetchData(); } catch {}
    setWiping(false);
  };

  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  const activeCount = leads.filter((l) => l.fb !== "scartato").length;
  const coldCount = leads.filter((l) => l.fb === "ok").length;

  return (
    <div style={css.wrap}>
      <div style={css.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={css.logoSeal}>SB</div>
          <div>
            <div style={css.logoText}>Lead Hunter</div>
            <div style={css.logoSub}>Studio Brillo</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button style={{ ...css.btnGhost, color: "#F09595", borderColor: "#4d0000" }} onClick={wipeAll} disabled={wiping}>{wiping ? "Pulizia..." : "Pulisci tutto"}</button>
          <button style={css.btnY} onClick={() => setTab("pipeline")}>Nuovo run</button>
          <button style={css.btnGhost} onClick={() => { sessionStorage.removeItem("lh_pw"); APP_PW = ""; setAuthed(false); }}>Esci</button>
        </div>
      </div>

      <div style={css.nav}>
        {TABS.map((t) => (
          <button key={t} style={css.navBtn(tab === t)} onClick={() => setTab(t)}>
            {t}
            {t === "leads" && activeCount > 0 && <span style={{ background: "#0d1a00", color: Y, border: "1px solid #2a4000", borderRadius: 4, padding: "1px 6px", fontSize: 10, marginLeft: 4 }}>{activeCount}</span>}
            {t === "cold leads" && coldCount > 0 && <span style={{ background: "#0d1a00", color: Y, border: "1px solid #2a4000", borderRadius: 4, padding: "1px 6px", fontSize: 10, marginLeft: 4 }}>{coldCount}</span>}
          </button>
        ))}
      </div>

      <div style={css.body}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: MU, fontSize: 13 }}>Caricamento...</div>
        ) : (
          <>
            {tab === "overview" && <Overview leads={leads} runs={runs} setTab={setTab} />}
            {tab === "pipeline" && <Pipeline onRunComplete={fetchData} />}
            {tab === "leads" && <Leads leads={leads} setLeads={setLeads} runs={runs} />}
            {tab === "cold leads" && <ColdLeads leads={leads} setLeads={setLeads} />}
          </>
        )}
      </div>
    </div>
  );
}
