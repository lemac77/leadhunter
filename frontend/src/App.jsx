import { useState, useEffect } from "react";

const API = "https://leadhunter-qpvs.onrender.com";

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
  scorePill: (sc) => ({ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 6, fontSize: 14, fontWeight: 600, ...(sc >= 5 ? { background: "#1a2600", color: Y, border: "1px solid #3a4f00" } : sc >= 3 ? { background: "#201600", color: "#EF9F27", border: "1px solid #3d2c00" } : { background: "#200000", color: "#F09595", border: "1px solid #3d0000" }) }),
  badge: (t) => ({ display: "inline-block", padding: "3px 9px", borderRadius: 4, fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", fontWeight: 500, ...(t === "da inviare" ? { background: "#0d1a00", color: Y, border: "1px solid #2a4000" } : t === "inviata" ? { background: "#0a1f00", color: "#97C459", border: "1px solid #1d3d00" } : { background: AN3, color: MU, border: `1px solid ${BD}` }) }),
  input: { background: AN3, border: `1px solid ${BD2}`, borderRadius: 6, padding: "10px 13px", fontSize: 13, color: TX, outline: "none", width: "100%" },
  select: { background: AN3, border: `1px solid ${BD2}`, borderRadius: 6, padding: "10px 13px", fontSize: 13, color: TX, outline: "none" },
  btnGhost: { background: "transparent", border: `1px solid ${BD2}`, borderRadius: 6, padding: "10px 18px", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: MU, cursor: "pointer" },
  btnSm: { background: "transparent", border: `1px solid ${BD2}`, borderRadius: 5, padding: "6px 13px", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: MU, cursor: "pointer" },
  btnGen: { background: Y, border: "none", borderRadius: 5, padding: "6px 14px", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: BK, cursor: "pointer", fontWeight: 600 },
  btnDel: { background: "transparent", border: "1px solid #4d0000", borderRadius: 5, padding: "6px 13px", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: "#F09595", cursor: "pointer" },
  fieldLabel: { fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: MU, marginBottom: 7, display: "block" },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 },
  step: (st) => ({ background: st === "active" ? "#0d1a00" : st === "done" ? "#0a1400" : AN2, border: st === "active" ? "1px solid #3a4f00" : st === "done" ? "1px solid #2a3800" : `1px solid ${BD}`, borderRadius: 8, padding: "14px 10px", textAlign: "center", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: st === "active" ? Y : st === "done" ? "#97C459" : MU2 }),
  stepGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 14 },
  barWrap: { height: 4, background: BD, borderRadius: 2, overflow: "hidden" },
  emailCard: { background: AN2, border: `1px solid ${BD}`, borderRadius: 10, padding: "18px 20px", marginBottom: 12 },
  histRow: (last) => ({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: last ? "none" : `1px solid ${BD}` }),
  histBadge: { background: "#0d1a00", color: Y, border: "1px solid #2a4000", borderRadius: 4, padding: "2px 9px", fontSize: 11, letterSpacing: "1px" },
  linkBtn: { background: "transparent", border: "none", color: MU, cursor: "pointer", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", padding: "5px 8px" },
  leadRow: { background: AN2, border: `1px solid ${BD}`, borderRadius: 9, marginBottom: 8, overflow: "hidden" },
  leadHead: { display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", cursor: "pointer" },
  leadDetail: { padding: "0 16px 16px 16px", borderTop: `1px solid ${BD}` },
  critBar: (v) => ({ height: 5, borderRadius: 3, background: v >= 7 ? "#639922" : v >= 4 ? "#EF9F27" : "#E24B4A", width: `${v * 10}%` }),
};

function parseCriteri(str) {
  try { return JSON.parse(str); } catch { return null; }
}

const CRIT_LABELS = { mobile: "Mobile", velocita: "Velocita", cta: "CTA", seo: "SEO", design: "Design", social: "Social", contatti: "Contatti" };

function Overview({ leads, runs, setTab }) {
  const active = leads.filter((l) => l.fb !== "scartato");
  const avg = active.length ? (active.reduce((s, l) => s + l.score, 0) / active.length).toFixed(1) : 0;
  const emailGen = leads.filter((l) => l.email_body).length;
  const scartati = leads.filter((l) => l.fb === "scartato").length;

  return (
    <div>
      <div style={css.metricsGrid}>
        {[
          { label: "Lead attivi", value: active.length, sub: `${scartati} scartati` },
          { label: "Score medio", value: avg, sub: "su 7 criteri", suffix: "/7" },
          { label: "Email generate", value: emailGen, sub: "pronte da inviare" },
          { label: "Run totali", value: runs.length, sub: "sessioni" },
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
              <div style={{ fontSize: 14, color: TX, fontWeight: 500 }}>{r.zona} - {r.settore}</div>
              <div style={{ fontSize: 11, color: MU, letterSpacing: "1px", marginTop: 3 }}>{r.date}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={css.histBadge}>{r.leads} lead</span>
              <button style={css.linkBtn} onClick={() => setTab("leads")}>Vedi</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Pipeline({ onRunComplete }) {
  const [form, setForm] = useState({ zona: "Vicenza", settore: "dentisti", maxResults: 30 });
  const [runState, setRunState] = useState(null);
  const [stepIdx, setStepIdx] = useState(-1);
  const [pct, setPct] = useState(0);
  const [lbl, setLbl] = useState("");

  const startRun = () => {
    setRunState("running"); setStepIdx(0); setPct(0); setLbl("Avvio pipeline...");
    fetch(`${API}/api/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
              if (d.step === "done") { setRunState("done"); setLbl(d.label); setPct(100); setStepIdx(4); onRunComplete && onRunComplete(); }
              else if (d.step === "error") { setRunState("error"); setLbl("Errore: " + d.label); }
              else { setStepIdx(d.step - 1); setLbl(d.label); setPct(d.step * 22); }
            } catch {}
          }
        }
      }
    }).catch(() => { setRunState("error"); setLbl("Errore di connessione al backend"); });
  };

  const stepState = (i) => {
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
          <div><label style={css.fieldLabel}>Zona / Citta</label><input style={css.input} value={form.zona} onChange={(e) => setForm({ ...form, zona: e.target.value })} /></div>
          <div><label style={css.fieldLabel}>Settore</label><input style={css.input} value={form.settore} onChange={(e) => setForm({ ...form, settore: e.target.value })} /></div>
        </div>
        <div style={css.formRow}>
          <div><label style={css.fieldLabel}>Max risultati Maps</label><input style={css.input} type="number" value={form.maxResults} onChange={(e) => setForm({ ...form, maxResults: parseInt(e.target.value) })} /></div>
          <div />
        </div>
        <div style={{ fontSize: 11, color: MU, marginBottom: 14, lineHeight: 1.6 }}>
          Il pipeline trova e analizza tutti i lead. Le email le generi tu manualmente dalla sezione Leads, lead per lead.
        </div>
        <button style={{ ...css.btnY, padding: "11px 26px" }} onClick={startRun} disabled={runState === "running"}>
          {runState === "running" ? "In esecuzione..." : "Lancia pipeline"}
        </button>
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
            {[{ i: 0, n: "Scrape Maps" }, { i: 1, n: "Crawl siti" }, { i: 2, n: "Score UX" }, { i: 3, n: "Salva lead" }].map((st) => (
              <div key={st.i} style={css.step(stepState(st.i))}>{st.n}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LeadCard({ lead, onFb, onGen, onScarta, generating }) {
  const [open, setOpen] = useState(false);
  const crit = parseCriteri(lead.criteri);
  const issues = (lead.issues || "").split(" | ").filter(Boolean);
  const forti = (lead.punti_forti || "").split(" | ").filter(Boolean);

  return (
    <div style={css.leadRow}>
      <div style={css.leadHead} onClick={() => setOpen(!open)}>
        <span style={css.scorePill(lead.score)}>{lead.score}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: TX }}>{lead.name}</div>
          <div style={{ fontSize: 11, color: MU, marginTop: 2 }}>{lead.city}{lead.telefono ? ` - ${lead.telefono}` : ""}</div>
        </div>
        {lead.email_body && <span style={css.badge(lead.email_stato || "da inviare")}>{lead.email_stato || "da inviare"}</span>}
        {lead.fb === "scartato" && <span style={css.badge("skip")}>scartato</span>}
        <span style={{ color: MU, fontSize: 16 }}>{open ? "\u25B4" : "\u25BE"}</span>
      </div>

      {open && (
        <div style={css.leadDetail}>
          {crit && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", margin: "14px 0" }}>
              {Object.keys(CRIT_LABELS).map((k) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, color: MU, width: 70 }}>{CRIT_LABELS[k]}</span>
                  <div style={{ flex: 1, height: 5, background: BD, borderRadius: 3 }}><div style={css.critBar(crit[k] || 0)} /></div>
                  <span style={{ fontSize: 11, color: TX, width: 24, textAlign: "right" }}>{crit[k] || 0}</span>
                </div>
              ))}
            </div>
          )}

          {issues.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: "#F09595", marginBottom: 6 }}>Punti deboli</div>
              {issues.map((x, i) => <div key={i} style={{ fontSize: 12, color: TX, marginBottom: 3 }}>- {x}</div>)}
            </div>
          )}
          {forti.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: "#97C459", marginBottom: 6 }}>Punti di forza</div>
              {forti.map((x, i) => <div key={i} style={{ fontSize: 12, color: TX, marginBottom: 3 }}>- {x}</div>)}
            </div>
          )}

          <div style={{ fontSize: 12, color: MU, marginBottom: 12 }}>
            {lead.sito && <span>Sito: <a href={lead.sito} target="_blank" rel="noreferrer" style={{ color: Y }}>{lead.sito}</a></span>}
            {lead.email_addr && <span style={{ marginLeft: 16 }}>Email: {lead.email_addr}</span>}
          </div>

          {lead.email_body && (
            <div style={{ fontSize: 12, color: TX, lineHeight: 1.7, background: AN, border: `1px solid ${BD}`, borderRadius: 7, padding: "12px 14px", marginBottom: 12, whiteSpace: "pre-wrap" }}>{lead.email_body}</div>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {!lead.email_body ? (
              <button style={css.btnGen} onClick={() => onGen(lead)} disabled={generating}>
                {generating ? "Generazione..." : "Genera email"}
              </button>
            ) : (
              <>
                <button style={css.btnSm} onClick={() => navigator.clipboard.writeText(lead.email_body)}>Copia</button>
                {lead.email_addr && <button style={css.btnSm} onClick={() => window.open(`mailto:${lead.email_addr}?body=${encodeURIComponent(lead.email_body)}`)}>Apri mail</button>}
                <button style={css.btnSm} onClick={() => onGen(lead)} disabled={generating}>Rigenera</button>
              </>
            )}
            <button style={css.btnSm} onClick={() => onFb(lead, "ok")}>{lead.fb === "ok" ? "Approvato" : "Approva"}</button>
            <div style={{ flex: 1 }} />
            <button style={css.btnDel} onClick={() => onScarta(lead)}>Cestina</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Leads({ leads, setLeads }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("attivi");
  const [genId, setGenId] = useState(null);

  const onFb = async (lead, val) => {
    const newFb = lead.fb === val ? null : val;
    await fetch(`${API}/api/feedback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: lead.id, feedback: newFb || "" }) });
    setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, fb: newFb } : l));
  };

  const onScarta = async (lead) => {
    await fetch(`${API}/api/scarta`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: lead.id }) });
    setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, fb: "scartato" } : l));
  };

  const onGen = async (lead) => {
    setGenId(lead.id);
    try {
      const r = await fetch(`${API}/api/genera-email`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: lead.id }) });
      const d = await r.json();
      if (d.email_body) setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, email_body: d.email_body, email_stato: "da inviare" } : l));
    } catch {}
    setGenId(null);
  };

  const filtered = leads.filter((l) => {
    const ms = l.name.toLowerCase().includes(search.toLowerCase()) || l.city.toLowerCase().includes(search.toLowerCase());
    const mf = filter === "tutti" || (filter === "attivi" && l.fb !== "scartato") || (filter === "scartati" && l.fb === "scartato") || (filter === "conemail" && l.email_body);
    return ms && mf;
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center" }}>
        <input style={{ ...css.input, maxWidth: 260 }} placeholder="Cerca azienda, citta..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select style={css.select} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="attivi">Attivi</option>
          <option value="tutti">Tutti</option>
          <option value="conemail">Con email generata</option>
          <option value="scartati">Scartati</option>
        </select>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: MU }}>{filtered.length} lead</span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ ...css.card, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 13, color: MU }}>Nessun lead. Lancia il pipeline per iniziare.</div>
        </div>
      ) : (
        filtered.map((l) => (
          <LeadCard key={l.id} lead={l} onFb={onFb} onGen={onGen} onScarta={onScarta} generating={genId === l.id} />
        ))
      )}
    </div>
  );
}

function Emails({ leads }) {
  const withEmail = leads.filter((l) => l.email_body);
  return (
    <div>
      <div style={{ fontSize: 12, color: MU, marginBottom: 18 }}>{withEmail.length} email generate</div>
      {withEmail.length === 0 && (
        <div style={{ ...css.card, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 13, color: MU }}>Nessuna email generata. Vai su Leads e generale dai singoli contatti.</div>
        </div>
      )}
      {withEmail.map((l) => (
        <div key={l.id} style={css.emailCard}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: TX }}>{l.name}</div>
              <div style={{ fontSize: 11, color: MU, marginTop: 2 }}>{l.email_addr || "email non trovata"}</div>
            </div>
            <span style={css.scorePill(l.score)}>{l.score}</span>
          </div>
          <div style={{ fontSize: 13, color: MU, lineHeight: 1.75, borderLeft: `2px solid ${BD2}`, paddingLeft: 14, marginBottom: 14, whiteSpace: "pre-wrap" }}>{l.email_body}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={css.btnSm} onClick={() => navigator.clipboard.writeText(l.email_body)}>Copia</button>
            {l.email_addr && <button style={css.btnSm} onClick={() => window.open(`mailto:${l.email_addr}?body=${encodeURIComponent(l.email_body)}`)}>Apri mail</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

const TABS = ["overview", "pipeline", "leads", "emails"];

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
    } catch { setLeads([]); setRuns([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const activeCount = leads.filter((l) => l.fb !== "scartato").length;

  return (
    <div style={css.wrap}>
      <div style={css.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={css.logoSeal}>SB</div>
          <div>
            <div style={css.logoText}>Lead Hunter</div>
            <div style={css.logoSub}>Studio Brillo - pipeline</div>
          </div>
        </div>
        <button style={css.btnY} onClick={() => setTab("pipeline")}>Nuovo run</button>
      </div>

      <div style={css.nav} role="tablist">
        {TABS.map((t) => (
          <button key={t} style={css.navBtn(tab === t)} onClick={() => setTab(t)} role="tab">
            {t}
            {t === "leads" && activeCount > 0 && (
              <span style={{ background: "#0d1a00", color: Y, border: "1px solid #2a4000", borderRadius: 4, padding: "1px 6px", fontSize: 10, marginLeft: 4 }}>{activeCount}</span>
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
            {tab === "leads" && <Leads leads={leads} setLeads={setLeads} />}
            {tab === "emails" && <Emails leads={leads} />}
          </>
        )}
      </div>
    </div>
  );
}
