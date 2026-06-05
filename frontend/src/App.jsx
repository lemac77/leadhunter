import { useState, useEffect, useCallback } from "react";

const API = "https://leadhunter-qpvs.onrender.com";
let APP_PW = sessionStorage.getItem("lh_pw") || "";
function authHeaders(extra = {}) { return { ...extra, "x-app-password": APP_PW }; }

const Y = "#DFFF00", BK = "#000000", AN = "#1A1A1A", AN2 = "#222222", AN3 = "#2a2a2a";
const BD = "#2e2e2e", BD2 = "#3a3a3a", TX = "#f0f0f0", MU = "#888888", MU2 = "#555555";
const LUCEZ_COL = "#7B6FFF";
const NICO_COL  = "#FF6B6B";

const STATI = ["da inviare", "inviata", "ha risposto", "cliente"];
const statoStyle = (st) => {
  if (st === "inviata")     return { bg:"#0a1f00", col:"#97C459", bd:"#1d3d00" };
  if (st === "ha risposto") return { bg:"#1f1400", col:"#EF9F27", bd:"#3d2c00" };
  if (st === "cliente")     return { bg:"#0d1a00", col:Y,         bd:"#3a4f00" };
  return                           { bg:AN2,       col:MU,        bd:BD };
};

function StatoDropdown({ lead, onChange }) {
  const st = lead.email_stato || "da inviare";
  const { bg, col, bd } = statoStyle(st);
  return (
    <select value={st} onChange={(e) => onChange(lead, e.target.value)} onClick={(e) => e.stopPropagation()}
      style={{ background:bg, color:col, border:`1px solid ${bd}`, borderRadius:4, padding:"5px 8px", fontSize:11, cursor:"pointer", outline:"none", fontWeight:500 }}>
      {STATI.map((s) => <option key={s} value={s} style={{ background:AN, color:TX }}>{s}</option>)}
    </select>
  );
}

const scorePill = (sc) => {
  const base = { display:"inline-flex", alignItems:"center", justifyContent:"center", width:30, height:30, borderRadius:6, fontSize:13, fontWeight:600, flexShrink:0 };
  if (!sc) return { ...base, background:AN3, color:MU, border:`1px solid ${BD2}` };
  if (sc >= 5) return { ...base, background:"#1a2600", color:Y,         border:"1px solid #3a4f00" };
  if (sc >= 3) return { ...base, background:"#201600", color:"#EF9F27", border:"1px solid #3d2c00" };
  return             { ...base, background:"#200000", color:"#F09595", border:"1px solid #3d0000" };
};

const btn = {
  y:     { background:Y, color:BK, border:"none", padding:"10px 20px", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer", letterSpacing:"1px", textTransform:"uppercase" },
  ghost: { background:"transparent", border:`1px solid ${BD2}`, borderRadius:6, padding:"10px 14px", fontSize:11, letterSpacing:"1px", textTransform:"uppercase", color:MU, cursor:"pointer" },
  sm:    { background:"transparent", border:`1px solid ${BD2}`, borderRadius:5, padding:"6px 12px", fontSize:11, cursor:"pointer", color:MU },
  gen:   { background:Y, border:"none", borderRadius:5, padding:"6px 12px", fontSize:11, cursor:"pointer", color:BK, fontWeight:600 },
  del:   { background:"transparent", border:"1px solid #4d0000", borderRadius:5, padding:"6px 12px", fontSize:11, cursor:"pointer", color:"#F09595" },
  lucez: { background:"#1a1740", border:`1px solid ${LUCEZ_COL}`, borderRadius:5, padding:"6px 14px", fontSize:11, cursor:"pointer", color:LUCEZ_COL, fontWeight:600 },
  nico:  { background:"#2a1515", border:`1px solid ${NICO_COL}`,  borderRadius:5, padding:"6px 14px", fontSize:11, cursor:"pointer", color:NICO_COL,  fontWeight:600 },
};

const CRIT_LABELS = { mobile:"Mobile", velocita:"Velocita", cta:"CTA", seo:"SEO", design:"Design", social:"Social", contatti:"Contatti" };
function parseCriteri(str) { try { return JSON.parse(str); } catch { return null; } }

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true); setErr("");
    try {
      const r = await fetch(`${API}/api/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ password:pw }) });
      if (r.ok) { APP_PW = pw; sessionStorage.setItem("lh_pw", pw); onLogin(); }
      else setErr("Password errata");
    } catch { setErr("Errore connessione"); }
    setLoading(false);
  };
  return (
    <div style={{ background:BK, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"system-ui,sans-serif", padding:16 }}>
      <div style={{ background:AN, border:`1px solid ${BD}`, borderRadius:12, padding:"32px 28px", width:"100%", maxWidth:340, textAlign:"center" }}>
        <div style={{ width:44, height:44, borderRadius:"50%", border:`1.5px solid ${Y}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:600, color:Y, margin:"0 auto 16px" }}>SB</div>
        <div style={{ fontSize:15, fontWeight:600, color:TX, letterSpacing:"2px", textTransform:"uppercase", marginBottom:4 }}>Lead Hunter</div>
        <div style={{ fontSize:10, color:MU, letterSpacing:"1px", textTransform:"uppercase", marginBottom:24 }}>Studio Brillo</div>
        <input type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key==="Enter" && submit()}
          style={{ background:AN3, border:`1px solid ${BD2}`, borderRadius:6, padding:"12px 14px", fontSize:16, color:TX, outline:"none", width:"100%", marginBottom:12, textAlign:"center", boxSizing:"border-box" }} />
        {err && <div style={{ color:"#F09595", fontSize:12, marginBottom:12 }}>{err}</div>}
        <button onClick={submit} disabled={loading} style={{ ...btn.y, width:"100%", padding:"12px 0", fontSize:14 }}>{loading ? "Verifica..." : "Entra"}</button>
      </div>
    </div>
  );
}

// ─── ASSEGNA MODAL ────────────────────────────────────────────────────────────
function AssegnaModal({ lead, onAssegna, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:16 }} onClick={onClose}>
      <div style={{ background:AN, border:`1px solid ${BD}`, borderRadius:12, padding:28, width:"100%", maxWidth:320, textAlign:"center" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize:13, fontWeight:500, color:TX, marginBottom:6 }}>{lead.name}</div>
        <div style={{ fontSize:11, color:MU, marginBottom:24 }}>Assegna a chi?</div>
        <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
          <button style={{ ...btn.lucez, padding:"12px 24px", fontSize:13 }} onClick={() => onAssegna(lead, "Lucez")}>Lucez</button>
          <button style={{ ...btn.nico,  padding:"12px 24px", fontSize:13 }} onClick={() => onAssegna(lead, "Nico")}>Nico</button>
        </div>
        <button style={{ ...btn.ghost, marginTop:16, fontSize:11 }} onClick={onClose}>Annulla</button>
      </div>
    </div>
  );
}

// ─── OVERVIEW ────────────────────────────────────────────────────────────────
function Overview({ leads, runs, setTab }) {
  const attivi     = leads.filter((l) => l.fb !== "scartato").length;
  const approvati  = leads.filter((l) => l.fb === "ok").length;
  const contattati = leads.filter((l) => ["inviata","ha risposto","cliente"].includes(l.email_stato)).length;
  const attesa     = leads.filter((l) => l.email_stato === "inviata").length;
  const clienti    = leads.filter((l) => l.email_stato === "cliente").length;
  const emailGen   = leads.filter((l) => l.email_body).length;

  const metrics = [
    { label:"Lead attivi",    value:attivi },
    { label:"Approvati",      value:approvati },
    { label:"Contattati",     value:contattati },
    { label:"In attesa",      value:attesa },
    { label:"Clienti",        value:clienti },
    { label:"Email generate", value:emailGen },
  ];

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ background:AN, border:`1px solid ${BD}`, borderRadius:10, padding:"14px 16px" }}>
            <div style={{ fontSize:10, letterSpacing:"1px", textTransform:"uppercase", color:MU, marginBottom:6 }}>{m.label}</div>
            <div style={{ fontSize:26, fontWeight:600, color:Y }}>{m.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background:AN, border:`1px solid ${BD}`, borderRadius:10, padding:"18px 16px" }}>
        <div style={{ fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color:MU, marginBottom:16 }}>Run recenti</div>
        {runs.length === 0 && <div style={{ fontSize:13, color:MU }}>Nessun run. Vai su Pipeline.</div>}
        {runs.slice(0,6).map((r,i) => (
          <div key={r.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom: i < Math.min(runs.length,6)-1 ? `1px solid ${BD}` : "none" }}>
            <div>
              <div style={{ fontSize:13, color:TX, fontWeight:500 }}>{r.zona} — {r.settore}</div>
              <div style={{ fontSize:11, color:MU, marginTop:2 }}>{r.date}</div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ background:"#0d1a00", color:Y, border:"1px solid #2a4000", borderRadius:4, padding:"2px 8px", fontSize:11 }}>{r.leads}</span>
              <button style={btn.sm} onClick={() => setTab("leads")}>Vedi</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PIPELINE ────────────────────────────────────────────────────────────────
function Pipeline({ onRunComplete }) {
  const [form, setForm] = useState({ zona:"Vicenza", settore:"dentisti", maxResults:30, raggio:10 });
  const [runState, setRunState] = useState(null);
  const [stepIdx, setStepIdx] = useState(-1);
  const [pct, setPct] = useState(0);
  const [lbl, setLbl] = useState("");

  const startRun = () => {
    setRunState("running"); setStepIdx(0); setPct(5); setLbl("Avvio...");
    fetch(`${API}/api/run`, { method:"POST", headers:authHeaders({"Content-Type":"application/json"}), body:JSON.stringify(form) })
      .then(async (res) => {
        const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = "";
        while (true) {
          const { done, value } = await reader.read(); if (done) break;
          buf += dec.decode(value);
          const lines = buf.split("\n"); buf = lines.pop();
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const d = JSON.parse(line.slice(6));
              if (d.step === "done")       { setRunState("done"); setLbl(d.label); setPct(100); setStepIdx(4); onRunComplete?.(); }
              else if (d.step === "error") { setRunState("error"); setLbl("Errore: " + d.label); }
              else                         { setStepIdx(Number(d.step)-1); setLbl(d.label); setPct(Number(d.step)*22); }
            } catch {}
          }
        }
      }).catch(() => { setRunState("error"); setLbl("Errore connessione"); });
  };

  const stepState = (i) => { if (runState==="done") return "done"; if (i<stepIdx) return "done"; if (i===stepIdx && runState==="running") return "active"; return "idle"; };
  const stepStyle = (st) => ({ background:st==="active"?"#0d1a00":st==="done"?"#0a1400":AN2, border:st==="active"?"1px solid #3a4f00":st==="done"?"1px solid #2a3800":`1px solid ${BD}`, borderRadius:8, padding:"12px 8px", textAlign:"center", fontSize:10, letterSpacing:"1px", textTransform:"uppercase", color:st==="active"?Y:st==="done"?"#97C459":MU2 });

  const field = (label, key, type="text") => (
    <div>
      <label style={{ fontSize:10, letterSpacing:"1px", textTransform:"uppercase", color:MU, marginBottom:6, display:"block" }}>{label}</label>
      <input type={type} value={form[key]} onChange={(e) => setForm({...form, [key]: type==="number" ? parseInt(e.target.value)||0 : e.target.value})}
        style={{ background:AN3, border:`1px solid ${BD2}`, borderRadius:6, padding:"11px 13px", fontSize:15, color:TX, outline:"none", width:"100%", boxSizing:"border-box" }} />
    </div>
  );

  return (
    <div>
      <div style={{ background:AN, border:`1px solid ${BD}`, borderRadius:10, padding:"18px 16px", marginBottom:16 }}>
        <div style={{ fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color:MU, marginBottom:16 }}>Configura run</div>
        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:16 }}>
          {field("Zona / CAP","zona")}
          {field("Settore","settore")}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {field("Max risultati","maxResults","number")}
            {field("Raggio km","raggio","number")}
          </div>
        </div>
        <button style={{ ...btn.y, width:"100%", padding:"12px 0", fontSize:13 }} onClick={startRun} disabled={runState==="running"}>
          {runState==="running" ? "In esecuzione..." : "Lancia pipeline"}
        </button>
      </div>
      {runState && (
        <div style={{ background:AN, border:`1px solid ${BD}`, borderRadius:10, padding:"18px 16px" }}>
          <div style={{ background:AN2, borderRadius:8, padding:"12px 14px", display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:runState==="done"?"#639922":runState==="error"?"#E24B4A":Y, flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, color:TX, marginBottom:6 }}>{lbl}</div>
              <div style={{ height:4, background:BD, borderRadius:2 }}><div style={{ width:`${pct}%`, height:4, background:Y, borderRadius:2, transition:"width 0.5s" }} /></div>
            </div>
            <span style={{ fontSize:11, color:MU }}>{pct}%</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
            {["Maps","Crawl","Score","Salva"].map((n,i) => <div key={i} style={stepStyle(stepState(i))}>{n}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LEAD CARD (espandibile) ──────────────────────────────────────────────────
function LeadCard({ lead, onApprove, onScarta, onDelete, onGen, onStato, generating }) {
  const [open, setOpen] = useState(false);
  const crit = parseCriteri(lead.criteri);
  const hasCrit = crit && Object.values(crit).some((v) => Number(v) > 0);
  const issues = (lead.issues||"").split(" | ").filter(Boolean);
  const forti  = (lead.punti_forti||"").split(" | ").filter(Boolean);
  const isApproved = lead.fb === "ok";
  const assignedCol = lead.assegnato==="Lucez" ? LUCEZ_COL : lead.assegnato==="Nico" ? NICO_COL : null;

  return (
    <div style={{ background:AN2, border:`1px solid ${assignedCol || BD}`, borderLeft:`3px solid ${assignedCol || BD}`, borderRadius:9, marginBottom:8, overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", cursor:"pointer" }} onClick={() => setOpen(!open)}>
        <span style={scorePill(lead.score)}>{lead.score || "n/d"}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:500, color:TX, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{lead.name}</div>
          <div style={{ fontSize:11, color:MU, marginTop:2 }}>
            {lead.city}
            {lead.rating > 0 && <span style={{ marginLeft:8, color:"#EF9F27" }}>★ {lead.rating}</span>}
          </div>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
          {isApproved && <span style={{ fontSize:10, color:assignedCol||Y, background:assignedCol?"rgba(123,111,255,0.1)":"#0d1a00", border:`1px solid ${assignedCol||"#3a4f00"}`, borderRadius:4, padding:"2px 7px", textTransform:"uppercase", letterSpacing:"0.5px" }}>{lead.assegnato || "ok"}</span>}
          <span style={{ color:MU, fontSize:14 }}>{open ? "▴" : "▾"}</span>
        </div>
      </div>

      {open && (
        <div style={{ padding:"0 14px 14px", borderTop:`1px solid ${BD}` }}>
          {hasCrit ? (
            <div style={{ display:"flex", flexDirection:"column", gap:6, margin:"12px 0" }}>
              {Object.keys(CRIT_LABELS).map((k) => (
                <div key={k} style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:11, color:MU, width:60, flexShrink:0 }}>{CRIT_LABELS[k]}</span>
                  <div style={{ flex:1, height:5, background:BD, borderRadius:3 }}><div style={{ height:5, borderRadius:3, background:crit[k]>=7?"#639922":crit[k]>=4?"#EF9F27":"#E24B4A", width:`${(crit[k]||0)*10}%` }} /></div>
                  <span style={{ fontSize:11, color:TX, width:20, textAlign:"right" }}>{crit[k]||0}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ margin:"12px 0", padding:"10px 12px", background:AN, border:`1px solid ${BD}`, borderRadius:7, fontSize:12, color:MU }}>Sito non analizzato. Controllalo a mano.</div>
          )}
          {issues.length > 0 && <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, letterSpacing:"1px", textTransform:"uppercase", color:"#F09595", marginBottom:5 }}>Punti deboli</div>
            {issues.map((x,i) => <div key={i} style={{ fontSize:12, color:TX, marginBottom:3 }}>· {x}</div>)}
          </div>}
          {forti.length > 0 && <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, letterSpacing:"1px", textTransform:"uppercase", color:"#97C459", marginBottom:5 }}>Punti di forza</div>
            {forti.map((x,i) => <div key={i} style={{ fontSize:12, color:TX, marginBottom:3 }}>· {x}</div>)}
          </div>}
          <div style={{ fontSize:12, color:MU, marginBottom:12 }}>
            {lead.sito && <div><a href={lead.sito} target="_blank" rel="noreferrer" style={{ color:Y }}>{lead.sito}</a></div>}
            {lead.email_addr && <div style={{ marginTop:3 }}>✉ {lead.email_addr}</div>}
            {lead.telefono && <div style={{ marginTop:3 }}><a href={`tel:${lead.telefono.replace(/\s/g,"")}`} style={{ color:Y, textDecoration:"none" }}>📞 {lead.telefono}</a></div>}
          </div>
          {lead.email_body && <div style={{ fontSize:12, color:TX, lineHeight:1.7, background:AN, border:`1px solid ${BD}`, borderRadius:7, padding:"12px", marginBottom:12, whiteSpace:"pre-wrap" }}>{lead.email_body}</div>}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {!isApproved && <button style={{ ...btn.y, padding:"8px 16px", fontSize:11 }} onClick={() => onApprove(lead)}>Approva</button>}
            {isApproved && !lead.email_body && <button style={btn.gen} onClick={() => onGen(lead)} disabled={generating}>{generating?"...":"Genera email"}</button>}
            {isApproved && lead.email_body && <>
              <button style={btn.sm} onClick={() => navigator.clipboard.writeText(lead.email_body)}>Copia</button>
              {lead.email_addr && <button style={btn.gen} onClick={() => { window.open(`mailto:${lead.email_addr}?body=${encodeURIComponent(lead.email_body)}`); if (!lead.email_stato||lead.email_stato==="da inviare") onStato(lead,"inviata"); }}>Apri mail</button>}
              <StatoDropdown lead={lead} onChange={onStato} />
              <button style={btn.sm} onClick={() => onGen(lead)} disabled={generating}>Rigenera</button>
            </>}
            <div style={{ flex:1 }} />
            {lead.fb !== "scartato" && <button style={btn.sm} onClick={() => onScarta(lead)}>Scarta</button>}
            <button style={btn.del} onClick={() => onDelete(lead)}>Elimina</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── COLD CARD (compatta) ─────────────────────────────────────────────────────
function ColdCard({ lead, onScarta, onDelete, onGen, onStato, generating }) {
  const [showEmail, setShowEmail] = useState(false);
  const assignedCol = lead.assegnato==="Lucez" ? LUCEZ_COL : NICO_COL;

  return (
    <div style={{ background:AN2, border:`1px solid ${assignedCol}`, borderLeft:`4px solid ${assignedCol}`, borderRadius:10, marginBottom:10, overflow:"hidden" }}>
      <div style={{ padding:"14px 16px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:10 }}>
          <span style={scorePill(lead.score)}>{lead.score || "n/d"}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <div style={{ fontSize:14, fontWeight:500, color:TX }}>{lead.name}</div>
              <span style={{ fontSize:10, color:assignedCol, background:lead.assegnato==="Lucez"?"rgba(123,111,255,0.15)":"rgba(255,107,107,0.15)", border:`1px solid ${assignedCol}`, borderRadius:4, padding:"2px 8px", textTransform:"uppercase", letterSpacing:"0.5px", flexShrink:0 }}>{lead.assegnato}</span>
            </div>
            <div style={{ fontSize:11, color:MU, marginTop:3, display:"flex", flexWrap:"wrap", gap:8, alignItems:"center" }}>
              <span>{lead.city}</span>
              {lead.rating > 0 && <span style={{ color:"#EF9F27" }}>★ {lead.rating}</span>}
              {lead.telefono && <a href={`tel:${lead.telefono.replace(/\s/g,"")}`} style={{ color:Y, textDecoration:"none" }}>📞 {lead.telefono}</a>}
            </div>
            {lead.email_addr && (
              <div style={{ fontSize:11, color:MU, marginTop:2, display:"flex", alignItems:"center", gap:6 }}>
                <span>✉ {lead.email_addr}</span>
                <button style={{ background:"transparent", border:`1px solid ${BD2}`, borderRadius:3, padding:"1px 7px", fontSize:10, color:MU, cursor:"pointer" }}
                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(lead.email_addr); }}>Copia</button>
              </div>
            )}
            {lead.sito && <a href={lead.sito} target="_blank" rel="noreferrer" style={{ fontSize:11, color:Y, display:"block", marginTop:2 }}>{lead.sito}</a>}
          </div>
          <StatoDropdown lead={lead} onChange={onStato} />
        </div>

        {(lead.issues||"").split(" | ").filter(Boolean).length > 0 && (
          <div style={{ fontSize:11, color:"#F09595", marginBottom:10 }}>
            {(lead.issues||"").split(" | ").filter(Boolean).map((x,i) => <span key={i} style={{ marginRight:10 }}>· {x}</span>)}
          </div>
        )}

        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          {!lead.email_body ? (
            <button style={{ ...btn.gen, padding:"8px 16px" }} onClick={() => onGen(lead)} disabled={generating}>{generating?"Generazione...":"Genera email"}</button>
          ) : (
            <>
              <button style={{ ...btn.sm, color:showEmail?Y:MU, borderColor:showEmail?"#3a4f00":BD2 }} onClick={() => setShowEmail(!showEmail)}>
                {showEmail ? "Nascondi" : "Vedi email"}
              </button>
              <button style={btn.sm} onClick={() => navigator.clipboard.writeText(lead.email_body)}>Copia</button>
              {lead.email_addr && (
                <button style={btn.gen} onClick={() => { window.open(`mailto:${lead.email_addr}?body=${encodeURIComponent(lead.email_body)}`); if (!lead.email_stato||lead.email_stato==="da inviare") onStato(lead,"inviata"); }}>
                  Apri mail
                </button>
              )}
              <button style={btn.sm} onClick={() => onGen(lead)} disabled={generating}>Rigenera</button>
            </>
          )}
          <div style={{ flex:1 }} />
          <button style={btn.sm} onClick={() => onScarta(lead)}>Scarta</button>
          <button style={btn.del} onClick={() => onDelete(lead)}>Elimina</button>
        </div>
      </div>

      {showEmail && lead.email_body && (
        <div style={{ borderTop:`1px solid ${BD}`, padding:"14px 16px", fontSize:12, color:TX, lineHeight:1.75, whiteSpace:"pre-wrap", background:AN }}>
          {lead.email_body}
        </div>
      )}
    </div>
  );
}

// ─── COLLAPSIBLE RUN GROUPS ───────────────────────────────────────────────────
function CollapsibleRunGroups({ runGroups, runs, search, genId, onApprove, onScarta, onDelete, onGen, onStato, onDeleteRun }) {
  const [openGroups, setOpenGroups] = useState(() => {
    const first = runGroups[0]?.runId;
    return first ? { [first]: true } : {};
  });
  const toggle = (runId) => setOpenGroups((prev) => ({ ...prev, [runId]: !prev[runId] }));

  return (
    <div>
      {runGroups.map(({ runId, items }) => {
        const filtered = search ? items.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()) || l.city.toLowerCase().includes(search.toLowerCase())) : items;
        const run = runs.find((r) => r.runId === runId);
        const isOpen = !!openGroups[runId];
        const approvati = filtered.filter((l) => l.fb === "ok").length;
        return (
          <div key={runId} style={{ marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:AN, border:`1px solid ${BD}`, borderRadius: isOpen ? "9px 9px 0 0" : 9, cursor:"pointer" }}
              onClick={() => toggle(runId)}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:14, color:isOpen?TX:MU }}>{isOpen ? "▾" : "▸"}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:TX }}>{run ? `${run.zona} — ${run.settore}` : runId}</div>
                  <div style={{ fontSize:11, color:MU, marginTop:2 }}>
                    {run?.date} · {filtered.length} lead
                    {approvati > 0 && <span style={{ marginLeft:8, color:Y }}>· {approvati} approvati</span>}
                  </div>
                </div>
              </div>
              <button style={btn.del} onClick={(e) => { e.stopPropagation(); onDeleteRun(runId); }}>Elimina</button>
            </div>
            {isOpen && (
              <div style={{ border:`1px solid ${BD}`, borderTop:"none", borderRadius:"0 0 9px 9px", padding:"12px 12px 4px" }}>
                {filtered.length === 0
                  ? <div style={{ fontSize:13, color:MU, padding:"8px 4px" }}>Nessun lead.</div>
                  : filtered.map((l) => <LeadCard key={l.id} lead={l} onApprove={onApprove} onScarta={onScarta} onDelete={onDelete} onGen={onGen} onStato={onStato} generating={genId===l.id} />)
                }
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── LEADS TAB ────────────────────────────────────────────────────────────────
function Leads({ leads, setLeads, runs }) {
  const [selectedRun, setSelectedRun] = useState("tutti");
  const [search, setSearch] = useState("");
  const [genId, setGenId] = useState(null);
  const [assegnaModal, setAssegnaModal] = useState(null);

  const onApprove = (lead) => setAssegnaModal(lead);
  const onAssegna = async (lead, persona) => {
    await fetch(`${API}/api/feedback`, { method:"POST", headers:authHeaders({"Content-Type":"application/json"}), body:JSON.stringify({ id:lead.id, feedback:"ok" }) });
    await fetch(`${API}/api/assegna`,  { method:"POST", headers:authHeaders({"Content-Type":"application/json"}), body:JSON.stringify({ id:lead.id, assegnato:persona }) });
    setLeads((p) => p.map((l) => l.id===lead.id ? {...l, fb:"ok", assegnato:persona} : l));
    setAssegnaModal(null);
  };
  const onScarta = async (lead) => {
    await fetch(`${API}/api/scarta`, { method:"POST", headers:authHeaders({"Content-Type":"application/json"}), body:JSON.stringify({ id:lead.id }) });
    setLeads((p) => p.map((l) => l.id===lead.id ? {...l, fb:"scartato"} : l));
  };
  const onDelete = async (lead) => {
    if (!window.confirm(`Eliminare definitivamente ${lead.name}? Questa operazione non si puo annullare.`)) return;
    await fetch(`${API}/api/delete-lead`, { method:"POST", headers:authHeaders({"Content-Type":"application/json"}), body:JSON.stringify({ id:lead.id }) });
    setLeads((p) => p.filter((l) => l.id!==lead.id));
  };
  const onGen = async (lead) => {
    setGenId(lead.id);
    try {
      const r = await fetch(`${API}/api/genera-email`, { method:"POST", headers:authHeaders({"Content-Type":"application/json"}), body:JSON.stringify({ id:lead.id }) });
      const d = await r.json();
      if (d.email_body) setLeads((p) => p.map((l) => l.id===lead.id ? {...l, email_body:d.email_body, email_stato:"da inviare"} : l));
    } catch {}
    setGenId(null);
  };
  const onStato = async (lead, stato) => {
    await fetch(`${API}/api/email-stato`, { method:"POST", headers:authHeaders({"Content-Type":"application/json"}), body:JSON.stringify({ id:lead.id, stato }) });
    setLeads((p) => p.map((l) => l.id===lead.id ? {...l, email_stato:stato} : l));
  };
  const onDeleteRun = async (runId) => {
    if (!window.confirm("ATTENZIONE: questa operazione elimina definitivamente tutti i lead di questo run. Sei sicuro?")) return;
    await fetch(`${API}/api/delete-run`, { method:"POST", headers:authHeaders({"Content-Type":"application/json"}), body:JSON.stringify({ runId }) });
    setLeads((p) => p.filter((l) => l.runId!==runId));
    if (selectedRun===runId) setSelectedRun("tutti");
  };

  const allVisible = leads.filter((l) => l.fb!=="scartato");
  const runGroups = (() => {
    const rids = selectedRun==="tutti"
      ? [...new Set(allVisible.map((l) => l.runId||"senza-run"))]
      : [selectedRun];
    // Ordina per posizione nel array runs (runs e gia ordinato desc per data)
    rids.sort((a, b) => {
      const ia = runs.findIndex((r) => r.runId===a);
      const ib = runs.findIndex((r) => r.runId===b);
      return (ia===-1?999:ia) - (ib===-1?999:ib);
    });
    return rids.map((rid) => ({ runId:rid, items:allVisible.filter((l) => (l.runId||"senza-run")===rid) }));
  })();

  return (
    <div>
      {assegnaModal && <AssegnaModal lead={assegnaModal} onAssegna={onAssegna} onClose={() => setAssegnaModal(null)} />}
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
        <select style={{ background:AN3, border:`1px solid ${BD2}`, borderRadius:6, padding:"11px 13px", fontSize:14, color:TX, outline:"none", width:"100%" }}
          value={selectedRun} onChange={(e) => setSelectedRun(e.target.value)}>
          <option value="tutti">Tutti i run</option>
          {runs.map((r) => <option key={r.runId} value={r.runId}>{r.zona} — {r.settore} ({r.date})</option>)}
        </select>
        <input style={{ background:AN3, border:`1px solid ${BD2}`, borderRadius:6, padding:"11px 13px", fontSize:14, color:TX, outline:"none", width:"100%", boxSizing:"border-box" }}
          placeholder="Cerca..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <CollapsibleRunGroups runGroups={runGroups} runs={runs} search={search} genId={genId}
        onApprove={onApprove} onScarta={onScarta} onDelete={onDelete} onGen={onGen} onStato={onStato} onDeleteRun={onDeleteRun} />
    </div>
  );
}

// ─── COLD LEADS TAB ───────────────────────────────────────────────────────────
function ColdLeads({ leads, setLeads }) {
  const [genId, setGenId] = useState(null);
  const [slotFilter, setSlotFilter] = useState("tutti");
  const [statoFilter, setStatoFilter] = useState("tutti");

  const approved = leads.filter((l) => l.fb==="ok");
  const onScarta = async (lead) => {
    await fetch(`${API}/api/scarta`, { method:"POST", headers:authHeaders({"Content-Type":"application/json"}), body:JSON.stringify({ id:lead.id }) });
    setLeads((p) => p.map((l) => l.id===lead.id ? {...l, fb:"scartato"} : l));
  };
  const onDelete = async (lead) => {
    if (!window.confirm(`Eliminare definitivamente ${lead.name}? Questa operazione non si puo annullare.`)) return;
    await fetch(`${API}/api/delete-lead`, { method:"POST", headers:authHeaders({"Content-Type":"application/json"}), body:JSON.stringify({ id:lead.id }) });
    setLeads((p) => p.filter((l) => l.id!==lead.id));
  };
  const onGen = async (lead) => {
    setGenId(lead.id);
    try {
      const r = await fetch(`${API}/api/genera-email`, { method:"POST", headers:authHeaders({"Content-Type":"application/json"}), body:JSON.stringify({ id:lead.id }) });
      const d = await r.json();
      if (d.email_body) setLeads((p) => p.map((l) => l.id===lead.id ? {...l, email_body:d.email_body, email_stato:"da inviare"} : l));
    } catch {}
    setGenId(null);
  };
  const onStato = async (lead, stato) => {
    await fetch(`${API}/api/email-stato`, { method:"POST", headers:authHeaders({"Content-Type":"application/json"}), body:JSON.stringify({ id:lead.id, stato }) });
    setLeads((p) => p.map((l) => l.id===lead.id ? {...l, email_stato:stato} : l));
  };

  const lucez = approved.filter((l) => l.assegnato==="Lucez");
  const nico  = approved.filter((l) => l.assegnato==="Nico");
  const slots = [
    { name:"Lucez", col:LUCEZ_COL, bg:"rgba(123,111,255,0.08)", leads:lucez, clienti:lucez.filter((l) => l.email_stato==="cliente").length },
    { name:"Nico",  col:NICO_COL,  bg:"rgba(255,107,107,0.08)", leads:nico,  clienti:nico.filter((l) => l.email_stato==="cliente").length },
  ];

  if (approved.length===0) return (
    <div style={{ background:AN, border:`1px solid ${BD}`, borderRadius:10, padding:32, textAlign:"center" }}>
      <div style={{ fontSize:13, color:MU, marginBottom:6 }}>Nessun lead approvato.</div>
      <div style={{ fontSize:12, color:MU2 }}>Vai su Leads e clicca "Approva" su un contatto.</div>
    </div>
  );

  const STATO_ORDER = {"da inviare":0, "inviata":1, "ha risposto":2, "cliente":3};
  let filtered = [...approved].sort((a, b) => {
    const sa = STATO_ORDER[a.email_stato||"da inviare"] ?? 0;
    const sb = STATO_ORDER[b.email_stato||"da inviare"] ?? 0;
    return sa - sb;
  });
  if (slotFilter !== "tutti") filtered = filtered.filter((l) => l.assegnato===slotFilter);
  if (statoFilter !== "tutti") filtered = filtered.filter((l) => (l.email_stato||"da inviare")===statoFilter);

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
        {slots.map((sl) => (
          <div key={sl.name} style={{ background:sl.bg, border:`1px solid ${sl.col}`, borderRadius:10, padding:"16px 14px" }}>
            <div style={{ fontSize:12, fontWeight:600, color:sl.col, letterSpacing:"1px", textTransform:"uppercase", marginBottom:10 }}>{sl.name}</div>
            <div style={{ display:"flex", gap:16 }}>
              <div><div style={{ fontSize:22, fontWeight:600, color:TX }}>{sl.leads.length}</div><div style={{ fontSize:10, color:MU, textTransform:"uppercase", letterSpacing:"1px" }}>Lead</div></div>
              <div><div style={{ fontSize:22, fontWeight:600, color:Y }}>{sl.clienti}</div><div style={{ fontSize:10, color:MU, textTransform:"uppercase", letterSpacing:"1px" }}>Clienti</div></div>
              <div><div style={{ fontSize:22, fontWeight:600, color:"#97C459" }}>{sl.leads.filter((l) => ["inviata","ha risposto","cliente"].includes(l.email_stato)).length}</div><div style={{ fontSize:10, color:MU, textTransform:"uppercase", letterSpacing:"1px" }}>Contattati</div></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
        {[["tutti","Tutti"],["Lucez","Lucez"],["Nico","Nico"]].map(([v,l]) => (
          <button key={v} style={{ ...btn.sm, color:slotFilter===v?Y:MU, borderColor:slotFilter===v?"#3a4f00":BD2, background:slotFilter===v?"#0d1a00":"transparent" }} onClick={() => setSlotFilter(v)}>{l}</button>
        ))}
        <div style={{ flex:1 }} />
        <select style={{ background:AN3, border:`1px solid ${BD2}`, borderRadius:5, padding:"5px 10px", fontSize:11, color:TX, outline:"none" }}
          value={statoFilter} onChange={(e) => setStatoFilter(e.target.value)}>
          <option value="tutti">Tutti gli stati</option>
          {STATI.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length===0
        ? <div style={{ fontSize:13, color:MU }}>Nessun lead in questa categoria.</div>
        : filtered.map((l) => <ColdCard key={l.id} lead={l} onScarta={onScarta} onDelete={onDelete} onGen={onGen} onStato={onStato} generating={genId===l.id} />)
      }
    </div>
  );
}

// ─── MERCATO TAB ──────────────────────────────────────────────────────────────
const MERCATO_DATA = [
  {
    tier:"S", colBg:"#200800", colBd:"#5a2000", colTx:"#EF9F27",
    items:[
      { name:"Studi dentistici",       desc:"Margini 60-80% su procedure estetiche. Il titolare e troppo impegnato per curarsi del digitale.", margine:85, sito:15 },
      { name:"Centri estetici / laser", desc:"Filler, laser, epilazione. Siti del 2014 con musica autoplay.", margine:80, sito:20 },
      { name:"Agenzie assicurative",   desc:"Provvigioni ricorrenti, clienti fedeli da anni. Nessun incentivo online finche non arriva un competitor.", margine:75, sito:10 },
      { name:"Avvocati / notai",       desc:"Tariffari alti, cliente acquisito per referral. Sito fatto dal nipote nel 2011.", margine:78, sito:8 },
    ],
  },
  {
    tier:"A", colBg:"#1a1a00", colBd:"#4a4a00", colTx:Y,
    items:[
      { name:"Fisioterapisti / osteopati",      desc:"60-120 euro/seduta, agenda sempre piena. Nessun SEO locale, zero Google Ads.", margine:68, sito:25 },
      { name:"Imprese edili / serramentisti",   desc:"Lavori da 5k-100k euro. Vivono di passaparola, ma la prima pagina Google vale oro.", margine:60, sito:22 },
      { name:"Commercialisti / consulenti",     desc:"Ricavi annui per cliente altissimi, retention ottima. Sito istituzionale fermo al 2016.", margine:70, sito:18 },
      { name:"Scuole guida",                    desc:"Ticket medio 1.000-2.000 euro per patente. Prenotazioni ancora al telefono.", margine:55, sito:20 },
    ],
  },
  {
    tier:"B", colBg:"#001a08", colBd:"#004020", colTx:"#97C459",
    items:[
      { name:"Parrucchieri / barbieri premium", desc:"Margine alto sul servizio, clientela fidelizzata. Instagram ok ma sito inesistente.", margine:50, sito:30 },
      { name:"Palestre / personal trainer",     desc:"Abbonamenti ricorrenti, buona LTV. Sito spesso con un template gratuito.", margine:48, sito:35 },
    ],
  },
];

function MercatoBar({ value, type }) {
  const color = type === "margine" ? "#639922" : "#E24B4A";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <span style={{ fontSize:10, color:MU, width:52, flexShrink:0, textTransform:"uppercase", letterSpacing:"0.5px" }}>{type}</span>
      <div style={{ flex:1, height:5, background:BD, borderRadius:3 }}>
        <div style={{ height:5, borderRadius:3, background:color, width:`${value}%` }} />
      </div>
      <span style={{ fontSize:10, color:TX, width:28, textAlign:"right" }}>{value}%</span>
    </div>
  );
}

function Mercato({ setTab }) {
  const [activeTier, setActiveTier] = useState("tutti");
  const visible = activeTier==="tutti" ? MERCATO_DATA : MERCATO_DATA.filter((g) => g.tier===activeTier);

  return (
    <div>
      <div style={{ background:AN, border:`1px solid ${BD}`, borderRadius:10, padding:"16px 16px", marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color:MU, marginBottom:4 }}>Analisi mercato locale</div>
          <div style={{ fontSize:13, color:TX }}>Business con alto margine e siti pessimi — Vicenza / Veneto</div>
        </div>
        <button style={{ ...btn.y, padding:"8px 16px", fontSize:11 }} onClick={() => setTab("pipeline")}>Lancia run</button>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {["tutti","S","A","B"].map((t) => (
          <button key={t} style={{ ...btn.sm, color:activeTier===t?Y:MU, borderColor:activeTier===t?"#3a4f00":BD2, background:activeTier===t?"#0d1a00":"transparent", fontWeight:activeTier===t?600:400 }}
            onClick={() => setActiveTier(t)}>
            {t==="tutti" ? "Tutti" : `Tier ${t}`}
          </button>
        ))}
      </div>

      {visible.map((group) => (
        <div key={group.tier} style={{ marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <span style={{ background:group.colBg, border:`1px solid ${group.colBd}`, color:group.colTx, borderRadius:6, padding:"4px 12px", fontSize:11, fontWeight:600, letterSpacing:"2px", textTransform:"uppercase" }}>
              Tier {group.tier}
            </span>
            <div style={{ flex:1, height:1, background:BD }} />
            <span style={{ fontSize:11, color:MU }}>{group.items.length} categorie</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {group.items.map((item) => (
              <div key={item.name} style={{ background:AN2, border:`1px solid ${group.colBd}`, borderLeft:`3px solid ${group.colTx}`, borderRadius:9, padding:"14px 16px" }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:500, color:TX, marginBottom:4 }}>{item.name}</div>
                    <div style={{ fontSize:12, color:MU, lineHeight:1.5 }}>{item.desc}</div>
                  </div>
                  <button style={{ ...btn.sm, flexShrink:0, fontSize:10, padding:"5px 10px", color:group.colTx, borderColor:group.colBd }} onClick={() => setTab("pipeline")}>Run</button>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  <MercatoBar value={item.margine} type="margine" />
                  <MercatoBar value={item.sito}    type="sito" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ background:AN, border:`1px solid ${BD}`, borderRadius:9, padding:"12px 16px", marginTop:8 }}>
        <div style={{ fontSize:10, letterSpacing:"1px", textTransform:"uppercase", color:MU, marginBottom:10 }}>Legenda barre</div>
        <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:28, height:5, background:"#639922", borderRadius:3 }} /><span style={{ fontSize:12, color:MU }}>Margine stimato</span></div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:28, height:5, background:"#E24B4A", borderRadius:3 }} /><span style={{ fontSize:12, color:MU }}>Qualita sito attuale</span></div>
          <div style={{ fontSize:12, color:MU2, marginTop:2, width:"100%" }}>Gap tra le due barre = opportunita. Piu e largo, meglio e.</div>
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
const TABS = ["overview","pipeline","leads","cold leads","mercato"];

export default function App() {
  const [authed,   setAuthed]   = useState(!!sessionStorage.getItem("lh_pw"));
  const [tab,      setTab]      = useState("overview");
  const [leads,    setLeads]    = useState([]);
  const [runs,     setRuns]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [wiping,   setWiping]   = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [lr, rr] = await Promise.all([
        fetch(`${API}/api/leads`, { headers:authHeaders() }).then((r) => r.json()),
        fetch(`${API}/api/runs`,  { headers:authHeaders() }).then((r) => r.json()),
      ]);
      setLeads(Array.isArray(lr) ? lr : []);
      setRuns( Array.isArray(rr) ? rr : []);
    } catch { setLeads([]); setRuns([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authed) fetchData(); }, [authed]);

  const wipeAll = async () => {
    if (!window.confirm("ATTENZIONE: questa operazione cancella TUTTI i lead e run da Airtable. Operazione irreversibile. Sei sicuro?")) return;
    setWiping(true);
    try { await fetch(`${API}/api/wipe-all`, { method:"POST", headers:authHeaders({"Content-Type":"application/json"}), body:"{}" }); await fetchData(); } catch {}
    setWiping(false);
  };

  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  const activeCount = leads.filter((l) => l.fb!=="scartato").length;
  const coldCount   = leads.filter((l) => l.fb==="ok").length;

  return (
    <div style={{ background:BK, fontFamily:"system-ui,sans-serif", minHeight:"100vh" }}>
      <div style={{ background:AN, borderBottom:`1px solid ${BD}`, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:"50%", border:`1.5px solid ${Y}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600, color:Y }}>SB</div>
          <div style={{ fontSize:13, fontWeight:600, color:TX, letterSpacing:"2px", textTransform:"uppercase" }}>Lead Hunter</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button style={btn.y} onClick={() => setTab("pipeline")}>+ Run</button>
          <button style={btn.ghost} onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        </div>
      </div>

      {menuOpen && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:50 }} onClick={() => setMenuOpen(false)}>
          <div style={{ position:"absolute", top:0, right:0, width:220, height:"100%", background:AN, borderLeft:`1px solid ${BD}`, padding:24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize:11, color:MU, letterSpacing:"1px", textTransform:"uppercase", marginBottom:20 }}>Menu</div>
            <button style={{ ...btn.ghost, width:"100%", marginBottom:10, color:"#F09595", borderColor:"#4d0000" }} onClick={() => { setMenuOpen(false); wipeAll(); }} disabled={wiping}>{wiping?"Pulizia...":"Pulisci tutto"}</button>
            <button style={{ ...btn.ghost, width:"100%" }} onClick={() => { sessionStorage.removeItem("lh_pw"); APP_PW=""; setAuthed(false); setMenuOpen(false); }}>Esci</button>
          </div>
        </div>
      )}

      <div style={{ background:AN, borderBottom:`1px solid ${BD}`, display:"flex", overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
        {TABS.map((t) => (
          <button key={t} style={{ padding:"12px 14px", fontSize:11, fontWeight:500, letterSpacing:"1px", textTransform:"uppercase", color:tab===t?Y:MU, background:"transparent", border:"none", cursor:"pointer", borderBottom:tab===t?`2px solid ${Y}`:"2px solid transparent", whiteSpace:"nowrap", flexShrink:0 }} onClick={() => setTab(t)}>
            {t}
            {t==="leads"      && activeCount>0 && <span style={{ background:"#0d1a00", color:Y, border:"1px solid #2a4000", borderRadius:4, padding:"1px 5px", fontSize:9, marginLeft:4 }}>{activeCount}</span>}
            {t==="cold leads" && coldCount>0   && <span style={{ background:"#0d1a00", color:Y, border:"1px solid #2a4000", borderRadius:4, padding:"1px 5px", fontSize:9, marginLeft:4 }}>{coldCount}</span>}
          </button>
        ))}
      </div>

      <div style={{ padding:"20px 16px", maxWidth:800, margin:"0 auto" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:60, color:MU, fontSize:13 }}>Caricamento...</div>
        ) : (
          <>
            {tab==="overview"   && <Overview   leads={leads} runs={runs} setTab={setTab} />}
            {tab==="pipeline"   && <Pipeline   onRunComplete={fetchData} />}
            {tab==="leads"      && <Leads      leads={leads} setLeads={setLeads} runs={runs} />}
            {tab==="cold leads" && <ColdLeads  leads={leads} setLeads={setLeads} />}
            {tab==="mercato"    && <Mercato    setTab={setTab} />}
          </>
        )}
      </div>
    </div>
  );
}
