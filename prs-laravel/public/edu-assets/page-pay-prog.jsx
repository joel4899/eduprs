// Deep pages — pay & progression cluster
// Increments, Progressions (7 workspaces), Qualification Allowance, Tax/FS4
(function(){
const { useState, useMemo } = React;
const D = window.HR_DATA;
const P = window.PRS_DATA;
const X = window.DEEP_DATA;
const ApprovalPill = window.ApprovalPill;
const { useApp } = window.Shell;

// ─────────────────────────────────────────────────────────────────
// INCREMENTS — full schema: Increment_data, First_half, Second_half,
//              Granted, Un_granted, Dakar_Increment_data, Not_in_Dakar
// ─────────────────────────────────────────────────────────────────
function IncrementsDeep() {
  const [mode, setMode]           = useState("menu");
  const { setView } = useApp();
  const [localInc, setLocalInc]   = useState(X?.INCREMENT_DATA || []);
  const [searchId, setSearchId]   = useState("");
  const [cycleDate, setCycleDate] = useState("2026-04-01");
  const [offFilter, setOffFilter] = useState("all");
  const [preFilter, setPreFilter] = useState("all");
  const [importLog, setImportLog] = useState([]);

  const CYCLES   = ["2026-01-01","2026-04-01","2026-07-01","2026-10-01"];
  const OFFICERS = ["all","Carnemolla","Friggieri","Molla/Ghirxi","MZ","SZ"];
  const GRANTED_DB = 10666; const UNGRANTED_DB = 37; const OTHER_DB = 217;

  const lookup = (ic) => D.PEOPLE.find(p => p.idCard.toLowerCase() === ic.toLowerCase().trim()) || null;
  const backBtn = (label="← Increments", target="menu") => (
    <button className="btn ghost" style={{marginBottom:14}} onClick={()=>setMode(target)}>{label}</button>
  );

  // ── MENU (dashboard) ─────────────────────────────────────────────
  if (mode === "menu") {
    const notInPRS = 0; const toSalaries = 0;
    const ACTIONS = [
      {id:"view-prs",         icon:"▤", label:"View PRS",                     desc:"Browse personnel record sheets feeding into Increments"},
      {id:"view-person",      icon:"⌕", label:"View Person Details",          desc:"Look up an individual and review their increment history"},
      {id:"no-sts",           icon:"⚠", label:"Persons without STS Placing",  desc:"Records missing a salary-track placement"},
      {id:"not-in-prs",       icon:"✕", label:`Persons not in PRS (${notInPRS})`, desc:"Imported records that have no matching PRS entry"},
      {id:"import-export",    icon:"⇄", label:"Import / Export Excel",         desc:"Bring in a batch from Excel or push the cycle out"},
      {id:"reports",          icon:"▦", label:"Reports",                       desc:"Per-cycle, per-officer and per-school reports"},
      {id:"pre-increments",   icon:"₪", label:"Pre-Increments",                desc:"Bucketed candidate review before granting"},
      {id:"send-salaries",    icon:"▶", label:`Send to Salaries (${toSalaries})`, desc:"Dispatch the granted batch to the Salaries section"},
      {id:"maintenance",      icon:"⚙", label:"Maintenance",                   desc:"Lookups, version reset, cleanup"},
      {id:"prs-maintenance",  icon:"★", label:"PRS Maintenance",               desc:"Direct edits to PRS records used by Increments"},
    ];
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <div className="crumbs">Salaries · Increments</div>
            <h1>Increments</h1>
            <p className="page-sub">Annual step rises by cycle. Version 107 · {GRANTED_DB.toLocaleString()} granted historically · {UNGRANTED_DB} ungranted · {OTHER_DB} other · Malta 49 / Gozo 59 paypoints.</p>
          </div>
          <div className="page-actions">
            <button className="btn">Export</button>
            <button className="btn primary" onClick={()=>setMode("pre-increments")}>Open current cycle</button>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Actions</h2></div>
          <div className="card-body" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:10}}>
            {ACTIONS.map(a => (
              <button key={a.id} className="action-card" onClick={()=>{ if(a.id==="view-prs"||a.id==="view-prs-main"){ setView("prs-view"); } else { setMode(a.id); } }}>
                <span className="ac-ico">{a.icon}</span>
                <span className="ac-content">
                  <span className="ac-title">{a.label}</span>
                  <span className="ac-desc">{a.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── VIEW PRS ──────────────────────────────────────────────────────
  if (mode === "view-prs") {
    return (
      <div>
        {backBtn()}
        <div className="card">
          <div className="card-head"><h2>View PRS</h2><div className="right"><span className="tag green">{D.PEOPLE.length} records</span></div></div>
          <div className="table-scroll">
            <table className="table compact">
              <thead><tr><th>ID Card</th><th>Surname</th><th>Name</th><th>Grade</th><th>Scale</th><th className="right">Salary</th><th>Paypoint</th><th>STS</th></tr></thead>
              <tbody>{D.PEOPLE.slice(0,30).map((p,i)=>(
                <tr key={i}>
                  <td className="id">{p.idCard}</td><td>{p.surname}</td><td>{p.name}</td>
                  <td className="muted xs">{p.gradeDesc}</td><td className="mono">{p.salScale}</td>
                  <td className="num right mono">€{p.presentSalary?.toLocaleString()}</td>
                  <td className="muted xs">{p.paypointDesc}</td>
                  <td><span className="tag green">✓</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="card-foot muted xs">First 30 of {D.PEOPLE.length} PRS records.</div>
        </div>
      </div>
    );
  }

  // ── VIEW PERSON DETAILS ──────────────────────────────────────────
  if (mode === "view-person") {
    const found = searchId.length >= 6 ? lookup(searchId) : null;
    const incRecs = found ? localInc.filter(r => r.idCard === found.idCard) : [];
    return (
      <div>
        {backBtn()}
        <div className="card" style={{maxWidth:720}}>
          <div className="card-head">
            <h2>View Person Details</h2>
            <div className="right" style={{display:"flex",gap:8}}>
              <input className="input sm" style={{width:170}} placeholder="ID Card No."
                value={searchId} onChange={e=>setSearchId(e.target.value)}/>
            </div>
          </div>
          {found && (
            <div style={{padding:"10px 14px",background:"var(--surface-2)",borderBottom:"1px solid var(--line-2)",fontSize:13,display:"flex",gap:20,flexWrap:"wrap"}}>
              <span><span className="muted">Name: </span><strong>{found.name} {found.surname}</strong></span>
              <span><span className="muted">Grade: </span>{found.gradeDesc}</span>
              <span><span className="muted">Scale: </span><span className="mono">{found.salScale}</span></span>
              <span><span className="muted">Salary: </span>€{found.presentSalary?.toLocaleString()}</span>
              <span><span className="muted">Paypoint: </span>{found.paypointDesc}</span>
            </div>
          )}
          {!found && searchId.length >= 6 && <div className="muted xs" style={{padding:"10px 14px"}}>Person not found.</div>}
          {incRecs.length > 0 && (
            <div className="table-scroll">
              <table className="table compact">
                <thead><tr><th>#</th><th>WEF</th><th>From scale</th><th>→</th><th className="right">Salary</th><th>Half</th><th>Granted</th><th>DAKAR</th><th>SRS</th><th>Status</th></tr></thead>
                <tbody>{incRecs.map((r,i)=>(
                  <tr key={i}>
                    <td className="mono muted">{r.autoId||i+1}</td>
                    <td className="num">{r.fromDate}</td>
                    <td className="mono">{r.salScale}</td>
                    <td className="mono">{r.newSalScale}</td>
                    <td className="num right mono">€{r.newSalary?.toLocaleString()}</td>
                    <td><span className="tag gray">{r.half}</span></td>
                    <td>{r.incGranted?<span className="check">✓</span>:<span className="muted">—</span>}</td>
                    <td>{r.sentToDakar?<span className="check">✓</span>:<span className="muted">—</span>}</td>
                    <td>{r.sentToSRS?<span className="check">✓</span>:<span className="muted">—</span>}</td>
                    <td><ApprovalPill compact sent={r.sentToOfficer} approved={r.approvedIncrements} uploaded={r.uploaded}/></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {found && incRecs.length === 0 && <div className="muted xs" style={{padding:"14px"}}>No increment records for this person.</div>}
          {!found && searchId.length < 6 && (
            <div className="muted xs" style={{padding:"14px"}}>Enter an ID Card number (min 6 characters) to search.</div>
          )}
        </div>
      </div>
    );
  }

  // ── PERSONS WITHOUT STS PLACING ──────────────────────────────────
  if (mode === "no-sts") {
    const noSTS = D.PEOPLE.filter(p => !p.salScale || p.salScale === "").slice(0,15);
    return (
      <div>
        {backBtn()}
        <div className="card">
          <div className="card-head"><h2>Persons without STS Placing</h2><div className="right"><span className={"tag "+(noSTS.length>0?"amber":"green")}>{noSTS.length}</span></div></div>
          <div className="muted xs" style={{padding:"6px 12px",borderBottom:"1px solid var(--line-2)"}}>
            Employees in PRS without a Service Target Scale placing. Must be reconciled before increment calculations can proceed.
          </div>
          <div className="table-scroll">
            <table className="table compact">
              <thead><tr><th>ID Card</th><th>Name</th><th>Grade</th><th>Paypoint</th><th>Reason</th><th></th></tr></thead>
              <tbody>
                {noSTS.length > 0 ? noSTS.map((p,i)=>(
                  <tr key={i}>
                    <td className="id">{p.idCard}</td><td>{p.name} {p.surname}</td>
                    <td className="muted xs">{p.gradeDesc}</td><td className="muted xs">{p.paypointDesc}</td>
                    <td className="muted xs">Not placed in STS</td>
                    <td><button className="btn xs">Place in STS</button></td>
                  </tr>
                )) : (
                  <tr><td colSpan={6}><div style={{padding:"20px",textAlign:"center",color:"var(--ink-3)",fontSize:13}}>All employees have STS placing — no action required.</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ── PERSONS NOT IN PRS ────────────────────────────────────────────
  if (mode === "not-in-prs") {
    return (
      <div>
        {backBtn()}
        <div className="card" style={{maxWidth:600}}>
          <div className="card-head"><h2>Persons not in PRS</h2><div className="right"><span className="tag green">0</span></div></div>
          <div style={{padding:"36px 16px",textAlign:"center",color:"var(--ink-3)",fontSize:13}}>
            <div style={{fontSize:28,marginBottom:10}}>✓</div>
            All employees in the increment cycle are matched in PRS.<br/>No outstanding records.
          </div>
        </div>
      </div>
    );
  }

  // ── IMPORT / EXPORT EXCEL MENU ────────────────────────────────────
  if (mode === "import-export") {
    return (
      <div>
        {backBtn()}
        <div className="card" style={{maxWidth:620}}>
          <div className="card-head"><h2>Import / Export Excel Menu</h2></div>
          <div style={{padding:16,display:"flex",flexDirection:"column",gap:10}}>
            <div style={{fontWeight:600,fontSize:13,borderBottom:"1px solid var(--line-2)",paddingBottom:8,marginBottom:4}}>Import from Excel</div>
            {[
              ["Import DAKAR increment file", true],
              ["Import HoD Excel sheet", true],
              ["Import Diff STS / DAKAR", true],
            ].map(([label, isFile],i)=>(
              <label key={i} style={{display:"flex",alignItems:"center",gap:10,fontSize:13}}>
                <span style={{width:220,color:"var(--ink-2)",flexShrink:0}}>{label}</span>
                <input type="file" accept=".xlsx,.xls" style={{fontSize:12}} onChange={ev=>{
                  if (!ev.target.files?.[0]) return;
                  const reader = new FileReader();
                  reader.onload = e => {
                    try {
                      const wb = XLSX.read(e.target.result, {type:"array"});
                      const ws = wb.Sheets[wb.SheetNames[0]];
                      const data = XLSX.utils.sheet_to_json(ws);
                      setImportLog(l=>[{ts:new Date().toLocaleTimeString(),op:label,rows:data.length,status:"OK"},...l.slice(0,9)]);
                    } catch(err) {
                      setImportLog(l=>[{ts:new Date().toLocaleTimeString(),op:label,rows:0,status:"ERR"},...l.slice(0,9)]);
                    }
                  };
                  reader.readAsArrayBuffer(ev.target.files[0]);
                }}/>
              </label>
            ))}
            <div style={{fontWeight:600,fontSize:13,borderBottom:"1px solid var(--line-2)",paddingBottom:8,marginBottom:4,marginTop:8}}>Export to Excel</div>
            {["Export Granted Increments","Export Pre-Increment staging list","Export Diff STS / DAKAR","Export Malta paypoints list (49)","Export Gozo paypoints list (59)","Export Ungranted list","Export Other category list"].map((item,i)=>(
              <button key={i} className="btn" style={{textAlign:"left"}}>⬇ {item}</button>
            ))}
          </div>
          {importLog.length > 0 && (
            <div style={{borderTop:"1px solid var(--line-2)",padding:"8px 12px"}}>
              <div className="muted xs" style={{marginBottom:6}}>Import log</div>
              {importLog.map((l,i)=>(
                <div key={i} className="log-row">
                  <span className="mono xs">{l.ts}</span>
                  <span style={{flex:1,fontSize:12}}>{l.op}</span>
                  <span className="mono xs">{l.rows} rows</span>
                  <span className={"tag "+(l.status==="OK"?"green":l.status==="ERR"?"red":"amber")}>{l.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── PRE-INCREMENTS ────────────────────────────────────────────────
  if (mode === "pre-increments") {
    const all = localInc;
    const grantedN   = all.filter(r=>r.incGranted&&r.approvedIncrements).length;
    const ungrantedN = all.filter(r=>r.markedWithheld).length;
    const otherN     = all.filter(r=>!r.incGranted&&!r.markedWithheld&&!r.approvedIncrements).length;
    const rows = all.filter(r => {
      if (offFilter !== "all" && r.officer !== offFilter) return false;
      if (preFilter === "granted")   return r.incGranted && r.approvedIncrements;
      if (preFilter === "ungranted") return r.markedWithheld;
      if (preFilter === "other")     return !r.incGranted && !r.markedWithheld && !r.approvedIncrements;
      return true;
    });
    return (
      <div>
        {backBtn()}
        <div className="card">
          <div className="card-head">
            <h2>Pre-Increments staging</h2>
            <div className="right" style={{display:"flex",gap:8,alignItems:"center"}}>
              <select className="input sm" value={cycleDate} onChange={e=>setCycleDate(e.target.value)}>
                {CYCLES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <select className="input sm" value={offFilter} onChange={e=>setOffFilter(e.target.value)}>
                {OFFICERS.map(o=><option key={o} value={o}>{o==="all"?"All officers":o}</option>)}
              </select>
              <select className="input sm" value={preFilter} onChange={e=>setPreFilter(e.target.value)}>
                <option value="all">All decisions</option>
                <option value="granted">Granted ({grantedN||GRANTED_DB.toLocaleString()})</option>
                <option value="ungranted">Ungranted ({ungrantedN||UNGRANTED_DB})</option>
                <option value="other">Other ({otherN||OTHER_DB})</option>
              </select>
            </div>
          </div>
          <div style={{display:"flex",gap:10,padding:"6px 12px",borderBottom:"1px solid var(--line-2)",flexWrap:"wrap"}}>
            {[
              {label:"Granted",          val:(grantedN||GRANTED_DB).toLocaleString(),   cls:"green"},
              {label:"Ungranted",        val:ungrantedN||UNGRANTED_DB,                  cls:"red"},
              {label:"Other",            val:otherN||OTHER_DB,                           cls:"amber"},
              {label:"Malta paypoints",  val:49,                                          cls:""},
              {label:"Gozo paypoints",   val:59,                                          cls:""},
            ].map(s=>(
              <div key={s.label} style={{background:"var(--surface-2)",border:"1px solid var(--line-2)",borderRadius:5,padding:"4px 14px",textAlign:"center",minWidth:80}}>
                <div style={{fontSize:15,fontWeight:700}}>{s.val}</div>
                <div style={{fontSize:10,color:"var(--ink-3)"}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div className="table-scroll">
            <table className="table compact">
              <thead><tr>
                <th>Auto_id</th><th>ID Card</th><th>Name</th><th>Grade</th>
                <th>From scale</th><th>→</th><th className="right">Salary</th>
                <th>WEF</th><th>Officer</th><th>Decision</th><th></th>
              </tr></thead>
              <tbody>
                {(rows.length > 0 ? rows : all).slice(0,25).map(r => {
                  const isGranted  = r.incGranted && r.approvedIncrements;
                  const isWithheld = r.markedWithheld;
                  return (
                    <tr key={r.autoId}>
                      <td className="mono">{r.autoId}</td>
                      <td className="id">{r.idCard}</td>
                      <td>{r.name}</td>
                      <td className="muted xs">{r.gradeDesc||r.grade}</td>
                      <td className="mono">{r.salScale}</td>
                      <td className="mono">{r.newSalScale}</td>
                      <td className="num right mono">€{r.newSalary?.toLocaleString()}</td>
                      <td className="num">{r.fromDate}</td>
                      <td className="mono xs">{r.officer}</td>
                      <td>{isGranted?<span className="tag green">Granted</span>:isWithheld?<span className="tag red">Ungranted</span>:<span className="tag amber">Other</span>}</td>
                      <td>
                        {!isGranted && !isWithheld && (
                          <div style={{display:"flex",gap:4}}>
                            <button className="btn xs btn-green" onClick={()=>setLocalInc(rs=>rs.map(x=>x.autoId===r.autoId?{...x,incGranted:true,approvedIncrements:true}:x))}>✓</button>
                            <button className="btn xs" style={{background:"#c0392b",color:"white",border:"none"}} onClick={()=>setLocalInc(rs=>rs.map(x=>x.autoId===r.autoId?{...x,markedWithheld:true}:x))}>✗</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {all.length===0&&<tr><td colSpan={11} className="muted" style={{padding:"20px",textAlign:"center"}}>No pre-increment data loaded. Use Import/Export to load DAKAR file.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="card-foot muted xs">Cycle: {cycleDate} · Showing top {Math.min(25,rows.length||all.length)} rows</div>
        </div>
      </div>
    );
  }

  // ── SEND TO SALARIES ──────────────────────────────────────────────
  if (mode === "send-salaries") {
    const ready = localInc.filter(r=>r.incGranted&&r.approvedIncrements&&!r.sentToDakar);
    return (
      <div>
        {backBtn()}
        <div className="card">
          <div className="card-head">
            <h2>Send to Salaries</h2>
            <div className="right" style={{display:"flex",gap:8,alignItems:"center"}}>
              <span className={"tag "+(ready.length>0?"amber":"green")}>{ready.length} pending</span>
              {ready.length>0&&<button className="btn sm primary" onClick={()=>setLocalInc(rs=>rs.map(r=>({...r,sentToDakar:true})))}>Send All</button>}
            </div>
          </div>
          {ready.length===0 ? (
            <div style={{padding:"36px",textAlign:"center",color:"var(--ink-3)",fontSize:13}}>
              <div style={{fontSize:24,marginBottom:8}}>✓</div>All granted increments have been sent to salaries (0 pending).
            </div>
          ) : (
            <div className="table-scroll">
              <table className="table compact">
                <thead><tr><th>Auto_id</th><th>Person</th><th>Grade</th><th>From scale</th><th>→</th><th className="right">New salary</th><th>WEF</th><th></th></tr></thead>
                <tbody>{ready.slice(0,20).map(r=>(
                  <tr key={r.autoId}>
                    <td className="mono">{r.autoId}</td>
                    <td><div>{r.name}</div><div className="mono muted xs">{r.idCard}</div></td>
                    <td className="muted xs">{r.gradeDesc||r.grade}</td>
                    <td className="mono">{r.salScale}</td><td className="mono">{r.newSalScale}</td>
                    <td className="num right mono">€{r.newSalary?.toLocaleString()}</td>
                    <td className="num">{r.fromDate}</td>
                    <td><button className="btn xs primary" onClick={()=>setLocalInc(rs=>rs.map(x=>x.autoId===r.autoId?{...x,sentToDakar:true}:x))}>Send</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── REPORTS ───────────────────────────────────────────────────────
  if (mode === "reports") return (
    <div>
      {backBtn()}
      <div className="card" style={{maxWidth:460}}>
        <div className="card-head"><h2>Reports</h2></div>
        <div style={{padding:14,display:"flex",flexDirection:"column",gap:8}}>
          {["Increment report by cycle date","Granted increments list","Un-granted increments list",
            "Other category list","Malta paypoints report (49)","Gozo paypoints report (59)",
            "DAKAR vs STS Diff report","Officers workload summary","Pre-increment data summary"].map((item,i)=>(
            <button key={i} className="btn" style={{textAlign:"left"}}>▤ {item}</button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── MAINTENANCE ────────────────────────────────────────────────────
  if (mode === "maintenance") return (
    <div>
      {backBtn()}
      <div className="card" style={{maxWidth:460}}>
        <div className="card-head"><h2>Maintenance</h2></div>
        <div style={{padding:14,display:"flex",flexDirection:"column",gap:8}}>
          {["Update salary scales","Edit officer names","Edit cycle dates",
            "Manage paypoints (Malta / Gozo)","Compact & repair database",
            "Clear pre-increment staging","Reset DAKAR reconciliation flags"].map((item,i)=>(
            <button key={i} className="btn" style={{textAlign:"left"}}>{item}</button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── PRS MAINTENANCE ────────────────────────────────────────────────
  if (mode === "prs-maintenance") return (
    <div>
      {backBtn()}
      <div className="card" style={{maxWidth:460}}>
        <div className="card-head"><h2>PRS Maintenance</h2></div>
        <div style={{padding:14,display:"flex",flexDirection:"column",gap:8}}>
          {["Sync increment data with PRS","Flag unmatched PRS records",
            "View PRS sync log","Rebuild PRS index","Export PRS snapshot"].map((item,i)=>(
            <button key={i} className="btn" style={{textAlign:"left"}}>{item}</button>
          ))}
        </div>
      </div>
    </div>
  );

  return null;
}

// ─────────────────────────────────────────────────────────────────
// NON-TEACHING PROGRESSIONS — Access-style multi-screen
// ─────────────────────────────────────────────────────────────────
function NonTeachingProgressions() {
  const [mode, setMode] = useState("menu");
  const { setView } = useApp();
  const [localRecs, setLocalRecs] = useState(X?.PROG_NT || []);
  const [viewIdCard, setViewIdCard] = useState("");
  const [monthYear, setMonthYear] = useState({ month:"04", year:"2026" });
  const [insertForm, setInsertForm] = useState({ idCard:"", appointDate:"", grade:"", salScale:"", nextProg:"", paypointName:"", comments:"" });
  const [promoForm, setPromoForm]   = useState({ idCard:"", gender:"M", letterDated:"", prevGrade:"", newGrade:"", scale:"", salary:"", probation:"", lastAppointment:"", wef:"" });
  const [placementForm, setPlacementForm] = useState({ idCard:"", gender:"M", letterDated:"", grade:"", scale:"", lastAppointment:"", wef:"", nextProgDate:"" });
  const [progressionForm, setProgressionForm] = useState({ idCard:"", gender:"M", letterDated:"", grade:"", scale:"", lastAppointment:"", wef:"", nextProgDate:"" });

  const NT_GRADES = [
    "Clerk","Senior Clerk","Principal Clerk",
    "Manager I","Manager II","Manager III",
    "Operative I","Operative II","Operative III",
    "Social Worker","Senior Social Worker",
    "Technical Officer","Senior Technical Officer",
    "Administrative Officer","Senior Administrative Officer",
    "Accountant","Senior Accountant","Librarian","Senior Librarian",
    "Psychologist","Senior Psychologist","Counsellor","Senior Counsellor",
    "Nursing Officer","Senior Nursing Officer",
    "Systems Administrator","Senior Systems Administrator",
    "Caretaker","Senior Caretaker","Driver","Senior Driver","Porter","Senior Porter",
  ];
  const NT_PAYPOINTS = [
    "Ministry for Education","Secretariat for Education","Department of Education",
    "Resource Centre","Inclusion Unit","Directorate for Quality and Standards",
    "Institute for Tourism Studies","MCAST","Education Officer's Office",
    "State School","Church School Administration",
  ];
  const SCALE_MAP = {
    "Clerk":"16","Senior Clerk":"14","Principal Clerk":"12",
    "Manager I":"10","Manager II":"9","Manager III":"8",
    "Operative I":"21","Operative II":"19","Operative III":"17",
    "Social Worker":"10","Senior Social Worker":"9",
    "Technical Officer":"12","Senior Technical Officer":"11",
    "Administrative Officer":"13","Senior Administrative Officer":"12",
    "Accountant":"11","Senior Accountant":"10","Librarian":"12","Senior Librarian":"11",
  };
  const addYears = (dt, y) => { try { const d=new Date(dt); d.setFullYear(d.getFullYear()+y); return d.toISOString().split("T")[0]; } catch { return ""; } };
  const lookup   = (ic) => D.PEOPLE.find(p => p.idCard.toLowerCase() === ic.toLowerCase().trim()) || null;
  const backBtn  = (label="← Back to menu", target="menu") => (
    <button className="btn ghost" style={{marginBottom:14}} onClick={()=>setMode(target)}>{label}</button>
  );

  // ── MENU (dashboard) ─────────────────────────────────────────────
  if (mode === "menu") {
    const ACTIONS = [
      {id:"view-person",       icon:"⌕", label:"View Person Details",                              desc:"Look up by ID card and inspect history"},
      {id:"insert-person",     icon:"+", label:"Insert New Person",                                desc:"Manually add a non-teaching candidate"},
      {id:"prog-submenu",      icon:"↑", label:"Progression / Placement / Promotion / Assimilations", desc:"Sub-menu for scale movements"},
      {id:"view-prs",          icon:"▤", label:"View PRS",                                         desc:"Browse the underlying PRS records"},
      {id:"by-month",          icon:"📅",label:"View Progressions by Month / Year",                desc:"Pivot view by effective date"},
      {id:"awaiting-replies",  icon:"⊠", label:"View awaiting replies from Supervisors",          desc:"Sent for confirmation · reply pending"},
      {id:"coming-months",     icon:"▶", label:"Progressions in the coming months",                desc:"Outbound queue sorted by effective date"},
      {id:"reports",           icon:"▦", label:"Reports",                                          desc:"Standard report pack"},
      {id:"maintenance",       icon:"⚙", label:"Maintenance Menu",                                 desc:"Lookups, grade list, cleanup"},
    ];
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <div className="crumbs">Progressions · Non-Teaching</div>
            <h1>Progressions — Non-Teaching</h1>
            <p className="page-sub">Non-teaching staff progression workflow · 1,925 records · scale-band progression rules per grade.</p>
          </div>
          <div className="page-actions">
            <button className="btn" onClick={()=>setLocalRecs(X?.PROG_NT||[])}>↺ Refresh</button>
            <button className="btn primary" onClick={()=>setMode("coming-months")}>Coming months</button>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Actions</h2></div>
          <div className="card-body" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:10}}>
            {ACTIONS.map(a => (
              <button key={a.id} className="action-card" onClick={()=>{ if(a.id==="view-prs"||a.id==="view-prs-main"){ setView("prs-view"); } else { setMode(a.id); } }}>
                <span className="ac-ico">{a.icon}</span>
                <span className="ac-content">
                  <span className="ac-title">{a.label}</span>
                  <span className="ac-desc">{a.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── VIEW PERSON DETAILS ──────────────────────────────────────────
  if (mode === "view-person") {
    const person = viewIdCard.length >= 6 ? lookup(viewIdCard) : null;
    const recs = person ? localRecs.filter(r=>r.idCard===person.idCard) : localRecs.slice(0,20);
    return (
      <div>
        {backBtn()}
        <div className="card">
          <div className="card-head">
            <h2>View Person Details</h2>
            <div className="right" style={{display:"flex",gap:8}}>
              <input className="input sm" style={{width:160}} placeholder="ID Card No."
                value={viewIdCard} onChange={e=>setViewIdCard(e.target.value)}/>
            </div>
          </div>
          {person && (
            <div style={{padding:"10px 14px",borderBottom:"1px solid var(--line-2)",background:"var(--surface-2)",fontSize:13,display:"flex",gap:24,flexWrap:"wrap"}}>
              <span><span className="muted">Name: </span><strong>{person.name} {person.surname}</strong></span>
              <span><span className="muted">Grade: </span>{person.gradeDesc}</span>
              <span><span className="muted">Scale: </span><span className="mono">{person.salScale}</span></span>
              <span><span className="muted">Salary: </span>€{person.presentSalary?.toLocaleString()}</span>
              <span><span className="muted">Paypoint: </span>{person.paypointDesc}</span>
            </div>
          )}
          {!person && viewIdCard.length >= 6 && <div className="muted xs" style={{padding:"10px 14px"}}>Person not found.</div>}
          <div className="table-scroll">
            <table className="table compact">
              <thead><tr><th>#</th><th>ID Card</th><th>Grade</th><th>Scale</th><th>→ New</th><th>WEF</th><th>Next Prog.</th><th>Paypoint</th><th>Status</th></tr></thead>
              <tbody>
                {recs.map((r,i)=>(
                  <tr key={r.autoId||i}>
                    <td className="mono muted">{r.autoId||i+1}</td>
                    <td className="id">{r.idCard}</td>
                    <td className="muted xs">{r.grade||r.gradeDesc}</td>
                    <td className="mono">{r.salScale}</td>
                    <td className="mono">{r.newSalScale||"—"}</td>
                    <td className="num">{r.fromDate||r.wefDate}</td>
                    <td className="num">{r.nextProgression||"—"}</td>
                    <td className="muted xs">{r.paypointDesc||r.paypoint||"—"}</td>
                    <td><ApprovalPill compact sent={r.sentToOfficer} approved={r.approvedProgression} uploaded={r.uploaded}/></td>
                  </tr>
                ))}
                {recs.length===0 && <tr><td colSpan={9} className="muted" style={{padding:20,textAlign:"center"}}>No records</td></tr>}
              </tbody>
            </table>
          </div>
          {!person && <div className="card-foot muted xs">Showing first 20. Enter ID card to filter.</div>}
        </div>
      </div>
    );
  }

  // ── INSERT NEW PERSON ────────────────────────────────────────────
  if (mode === "insert-person") {
    const pf = insertForm;
    const upd = (k,v) => {
      const n = {...pf,[k]:v};
      if (k==="grade")       { n.salScale=SCALE_MAP[v]||""; n.nextProg=addYears(n.appointDate||new Date().toISOString().split("T")[0],2); }
      if (k==="appointDate") { n.nextProg=addYears(v,2); }
      setInsertForm(n);
    };
    const person = pf.idCard.length>=6 ? lookup(pf.idCard) : null;
    return (
      <div>
        {backBtn()}
        <div className="card" style={{maxWidth:520}}>
          <div className="card-head"><h2>Insert New Person</h2><span className="muted xs">Non-Teaching Progressions</span></div>
          <div style={{padding:"16px 18px",display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
              <div style={{flex:1}}>
                <label className="muted xs" style={{display:"block",marginBottom:3}}>ID Card No.</label>
                <input className="input" style={{width:"100%"}} value={pf.idCard} onChange={e=>upd("idCard",e.target.value)}/>
              </div>
              {person && <div style={{fontSize:12,color:"var(--accent)",paddingBottom:4,whiteSpace:"nowrap"}}>{person.name} {person.surname}</div>}
            </div>
            <div>
              <label className="muted xs" style={{display:"block",marginBottom:3}}>Appointment / Progression Date</label>
              <input type="date" className="input" value={pf.appointDate} onChange={e=>upd("appointDate",e.target.value)}/>
            </div>
            <div>
              <label className="muted xs" style={{display:"block",marginBottom:3}}>Grade</label>
              <select className="input" value={pf.grade} onChange={e=>upd("grade",e.target.value)}>
                <option value="">— select grade —</option>
                {NT_GRADES.map(g=><option key={g}>{g}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:12}}>
              <div style={{flex:1}}>
                <label className="muted xs" style={{display:"block",marginBottom:3}}>Salary Scale <span className="muted">(auto)</span></label>
                <input className="input" readOnly style={{background:"var(--surface-2)"}} value={pf.salScale ? `Scale ${pf.salScale}` : ""}/>
              </div>
              <div style={{flex:1}}>
                <label className="muted xs" style={{display:"block",marginBottom:3}}>Next Progression <span className="muted">(auto)</span></label>
                <input type="date" className="input" readOnly style={{background:"var(--surface-2)"}} value={pf.nextProg}/>
              </div>
            </div>
            <div>
              <label className="muted xs" style={{display:"block",marginBottom:3}}>Paypoint Name</label>
              <select className="input" value={pf.paypointName} onChange={e=>upd("paypointName",e.target.value)}>
                <option value="">— select paypoint —</option>
                {NT_PAYPOINTS.map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="muted xs" style={{display:"block",marginBottom:3}}>Comments</label>
              <textarea className="input" rows={3} style={{width:"100%",resize:"vertical"}} value={pf.comments} onChange={e=>upd("comments",e.target.value)}/>
            </div>
          </div>
          <div style={{padding:"12px 18px",borderTop:"1px solid var(--line-2)",display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button className="btn" onClick={()=>setMode("menu")}>Close</button>
            <button className="btn primary" disabled={!pf.idCard||!pf.grade}
              onClick={()=>{ setLocalRecs(r=>[...r,{autoId:Date.now(),idCard:pf.idCard,grade:pf.grade,salScale:pf.salScale,nextProgression:pf.nextProg,paypointDesc:pf.paypointName,fromDate:pf.appointDate,comments:pf.comments,sentToOfficer:false,approvedProgression:false,uploaded:false}]); setInsertForm({idCard:"",appointDate:"",grade:"",salScale:"",nextProg:"",paypointName:"",comments:""}); setMode("menu"); }}>
              Add
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PROG / PLACEMENT / PROMOTION SUBMENU ─────────────────────────
  if (mode === "prog-submenu") {
    const SUB = [
      {id:"new-progression", icon:"↑", label:"New Progression",  desc:"Scale band progression for a candidate"},
      {id:"new-placement",   icon:"⌖", label:"New Placement",     desc:"Move a non-teaching officer into a new posting"},
      {id:"new-promotion",   icon:"★", label:"New Promotion",     desc:"Promote to a higher grade"},
      {id:"assimilations",   icon:"≡", label:"Assimilations",     desc:"Bulk assimilation under a new collective agreement"},
    ];
    return (
      <div className="page">
        {backBtn()}
        <div className="card" style={{maxWidth:680}}>
          <div className="card-head"><h2>Progression / Placement / Promotion</h2></div>
          <div className="card-body" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:10}}>
            {SUB.map(a => (
              <button key={a.id} className="action-card" onClick={()=>{ if(a.id==="view-prs"||a.id==="view-prs-main"){ setView("prs-view"); } else { setMode(a.id); } }}>
                <span className="ac-ico">{a.icon}</span>
                <span className="ac-content">
                  <span className="ac-title">{a.label}</span>
                  <span className="ac-desc">{a.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── NEW PROGRESSION ──────────────────────────────────────────────
  if (mode === "new-progression") {
    const pf = progressionForm;
    const upd = (k,v) => setProgressionForm(f=>({...f,[k]:v}));
    const person = pf.idCard.length>=6 ? lookup(pf.idCard) : null;
    return (
      <div>
        {backBtn("← Back","prog-submenu")}
        <div className="card" style={{maxWidth:480}}>
          <div className="card-head"><h2>New Progression</h2><span className="muted xs">Non-Teaching</span></div>
          <div style={{padding:"16px 18px",display:"flex",flexDirection:"column",gap:11}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
              <div style={{flex:1}}><label className="muted xs" style={{display:"block",marginBottom:3}}>ID Card No.</label><input className="input" value={pf.idCard} onChange={e=>upd("idCard",e.target.value)}/></div>
              <div><label className="muted xs" style={{display:"block",marginBottom:3}}>Gender</label><select className="input" value={pf.gender} onChange={e=>upd("gender",e.target.value)}><option>M</option><option>F</option></select></div>
            </div>
            {person && <div style={{fontSize:12,color:"var(--accent)"}}>{person.name} {person.surname} · {person.gradeDesc}</div>}
            <div><label className="muted xs" style={{display:"block",marginBottom:3}}>Letter Dated</label><input type="date" className="input" value={pf.letterDated} onChange={e=>upd("letterDated",e.target.value)}/></div>
            <div><label className="muted xs" style={{display:"block",marginBottom:3}}>Grade</label>
              <select className="input" value={pf.grade} onChange={e=>{upd("grade",e.target.value);setProgressionForm(f=>({...f,grade:e.target.value,scale:SCALE_MAP[e.target.value]||""}));}}>
                <option value="">— select —</option>{NT_GRADES.map(g=><option key={g}>{g}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:10}}>
              <div style={{flex:1}}><label className="muted xs" style={{display:"block",marginBottom:3}}>Scale</label><input className="input" value={pf.scale} onChange={e=>upd("scale",e.target.value)} placeholder="e.g. 14"/></div>
              <div style={{flex:1}}><label className="muted xs" style={{display:"block",marginBottom:3}}>Last Appointment</label><input type="date" className="input" value={pf.lastAppointment} onChange={e=>upd("lastAppointment",e.target.value)}/></div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <div style={{flex:1}}><label className="muted xs" style={{display:"block",marginBottom:3}}>W.E.F.</label><input type="date" className="input" value={pf.wef} onChange={e=>{upd("wef",e.target.value);setProgressionForm(f=>({...f,wef:e.target.value,nextProgDate:addYears(e.target.value,2)}));}}/></div>
              <div style={{flex:1}}><label className="muted xs" style={{display:"block",marginBottom:3}}>Next Progression Date</label><input type="date" className="input" value={pf.nextProgDate} onChange={e=>upd("nextProgDate",e.target.value)}/></div>
            </div>
          </div>
          <div style={{padding:"12px 18px",borderTop:"1px solid var(--line-2)",display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button className="btn" onClick={()=>setMode("prog-submenu")}>Don't Save and Close</button>
            <button className="btn primary" disabled={!pf.idCard||!pf.grade}
              onClick={()=>{ setLocalRecs(r=>[...r,{autoId:Date.now(),idCard:pf.idCard,grade:pf.grade,salScale:pf.scale,fromDate:pf.wef,nextProgression:pf.nextProgDate,sentToOfficer:false,approvedProgression:false,uploaded:false}]); setProgressionForm({idCard:"",gender:"M",letterDated:"",grade:"",scale:"",lastAppointment:"",wef:"",nextProgDate:""}); setMode("menu"); }}>
              Save and Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── NEW PLACEMENT ────────────────────────────────────────────────
  if (mode === "new-placement") {
    const pf = placementForm;
    const upd = (k,v) => setPlacementForm(f=>({...f,[k]:v}));
    const person = pf.idCard.length>=6 ? lookup(pf.idCard) : null;
    return (
      <div>
        {backBtn("← Back","prog-submenu")}
        <div className="card" style={{maxWidth:480}}>
          <div className="card-head"><h2>New Placement</h2><span className="muted xs">Non-Teaching</span></div>
          <div style={{padding:"16px 18px",display:"flex",flexDirection:"column",gap:11}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
              <div style={{flex:1}}><label className="muted xs" style={{display:"block",marginBottom:3}}>ID Card No.</label><input className="input" value={pf.idCard} onChange={e=>upd("idCard",e.target.value)}/></div>
              <div><label className="muted xs" style={{display:"block",marginBottom:3}}>Gender</label><select className="input" value={pf.gender} onChange={e=>upd("gender",e.target.value)}><option>M</option><option>F</option></select></div>
            </div>
            {person && <div style={{fontSize:12,color:"var(--accent)"}}>{person.name} {person.surname} · {person.gradeDesc}</div>}
            <div><label className="muted xs" style={{display:"block",marginBottom:3}}>Letter Dated</label><input type="date" className="input" value={pf.letterDated} onChange={e=>upd("letterDated",e.target.value)}/></div>
            <div><label className="muted xs" style={{display:"block",marginBottom:3}}>Grade</label>
              <select className="input" value={pf.grade} onChange={e=>setPlacementForm(f=>({...f,grade:e.target.value,scale:SCALE_MAP[e.target.value]||""}))}>
                <option value="">— select —</option>{NT_GRADES.map(g=><option key={g}>{g}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:10}}>
              <div style={{flex:1}}><label className="muted xs" style={{display:"block",marginBottom:3}}>Scale</label><input className="input" value={pf.scale} onChange={e=>upd("scale",e.target.value)} placeholder="e.g. 14"/></div>
              <div style={{flex:1}}><label className="muted xs" style={{display:"block",marginBottom:3}}>Last Appointment</label><input type="date" className="input" value={pf.lastAppointment} onChange={e=>upd("lastAppointment",e.target.value)}/></div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <div style={{flex:1}}><label className="muted xs" style={{display:"block",marginBottom:3}}>W.E.F.</label><input type="date" className="input" value={pf.wef} onChange={e=>setPlacementForm(f=>({...f,wef:e.target.value,nextProgDate:addYears(e.target.value,2)}))}/></div>
              <div style={{flex:1}}><label className="muted xs" style={{display:"block",marginBottom:3}}>Next Progression Date</label><input type="date" className="input" value={pf.nextProgDate} onChange={e=>upd("nextProgDate",e.target.value)}/></div>
            </div>
          </div>
          <div style={{padding:"12px 18px",borderTop:"1px solid var(--line-2)",display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button className="btn" onClick={()=>setMode("prog-submenu")}>Don't Save and Close</button>
            <button className="btn primary" disabled={!pf.idCard||!pf.grade}
              onClick={()=>{ setLocalRecs(r=>[...r,{autoId:Date.now(),idCard:pf.idCard,grade:pf.grade,salScale:pf.scale,fromDate:pf.wef,nextProgression:pf.nextProgDate,type:"placement",sentToOfficer:false,approvedProgression:false,uploaded:false}]); setPlacementForm({idCard:"",gender:"M",letterDated:"",grade:"",scale:"",lastAppointment:"",wef:"",nextProgDate:""}); setMode("menu"); }}>
              Save and Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── NEW PROMOTION ────────────────────────────────────────────────
  if (mode === "new-promotion") {
    const pf = promoForm;
    const upd = (k,v) => setPromoForm(f=>({...f,[k]:v}));
    const person = pf.idCard.length>=6 ? lookup(pf.idCard) : null;
    return (
      <div>
        {backBtn("← Back","prog-submenu")}
        <div className="card" style={{maxWidth:520}}>
          <div className="card-head"><h2>New Promotion</h2><span className="muted xs">Non-Teaching</span></div>
          <div style={{padding:"16px 18px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 16px"}}>
            <div><label className="muted xs" style={{display:"block",marginBottom:3}}>ID Card No.</label><input className="input" value={pf.idCard} onChange={e=>upd("idCard",e.target.value)}/></div>
            <div><label className="muted xs" style={{display:"block",marginBottom:3}}>Gender</label><select className="input" value={pf.gender} onChange={e=>upd("gender",e.target.value)}><option>M</option><option>F</option></select></div>
            {person && <div style={{gridColumn:"span 2",fontSize:12,color:"var(--accent)"}}>{person.name} {person.surname} · {person.gradeDesc}</div>}
            <div style={{gridColumn:"span 2"}}><label className="muted xs" style={{display:"block",marginBottom:3}}>Letter Dated</label><input type="date" className="input" value={pf.letterDated} onChange={e=>upd("letterDated",e.target.value)}/></div>
            <div><label className="muted xs" style={{display:"block",marginBottom:3}}>Previous Grade</label>
              <select className="input" value={pf.prevGrade} onChange={e=>upd("prevGrade",e.target.value)}>
                <option value="">— select —</option>{NT_GRADES.map(g=><option key={g}>{g}</option>)}
              </select>
            </div>
            <div><label className="muted xs" style={{display:"block",marginBottom:3}}>New Grade</label>
              <select className="input" value={pf.newGrade} onChange={e=>setPromoForm(f=>({...f,newGrade:e.target.value,scale:SCALE_MAP[e.target.value]||""}))}>
                <option value="">— select —</option>{NT_GRADES.map(g=><option key={g}>{g}</option>)}
              </select>
            </div>
            <div><label className="muted xs" style={{display:"block",marginBottom:3}}>Scale</label><input className="input" value={pf.scale} onChange={e=>upd("scale",e.target.value)} placeholder="e.g. 14"/></div>
            <div><label className="muted xs" style={{display:"block",marginBottom:3}}>Salary (€)</label><input type="number" className="input" value={pf.salary} onChange={e=>upd("salary",e.target.value)} placeholder="e.g. 18000"/></div>
            <div><label className="muted xs" style={{display:"block",marginBottom:3}}>Probation Period</label><input className="input" value={pf.probation} onChange={e=>upd("probation",e.target.value)} placeholder="e.g. 1 year"/></div>
            <div><label className="muted xs" style={{display:"block",marginBottom:3}}>Last Appointment</label><input type="date" className="input" value={pf.lastAppointment} onChange={e=>upd("lastAppointment",e.target.value)}/></div>
            <div style={{gridColumn:"span 2"}}><label className="muted xs" style={{display:"block",marginBottom:3}}>W.E.F.</label><input type="date" className="input" value={pf.wef} onChange={e=>upd("wef",e.target.value)}/></div>
          </div>
          <div style={{padding:"12px 18px",borderTop:"1px solid var(--line-2)",display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button className="btn" onClick={()=>setMode("prog-submenu")}>Don't Save and Close</button>
            <button className="btn primary" disabled={!pf.idCard||!pf.newGrade}
              onClick={()=>{ setLocalRecs(r=>[...r,{autoId:Date.now(),idCard:pf.idCard,grade:pf.newGrade,prevGrade:pf.prevGrade,salScale:pf.scale,salary:parseFloat(pf.salary)||0,fromDate:pf.wef,type:"promotion",sentToOfficer:true,approvedProgression:false,uploaded:false}]); setPromoForm({idCard:"",gender:"M",letterDated:"",prevGrade:"",newGrade:"",scale:"",salary:"",probation:"",lastAppointment:"",wef:""}); setMode("menu"); }}>
              Print Promotion
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ASSIMILATIONS ────────────────────────────────────────────────
  if (mode === "assimilations") {
    const rows = localRecs.filter(r=>r.type==="assimilation");
    return (
      <div>
        {backBtn("← Back","prog-submenu")}
        <div className="card">
          <div className="card-head"><h2>Assimilations</h2><span className="tag gray">{rows.length}</span></div>
          <table className="table compact">
            <thead><tr><th>ID Card</th><th>Name</th><th>Grade</th><th>Prev Scale</th><th>→ New</th><th>WEF</th><th>Reason</th><th>Status</th></tr></thead>
            <tbody>
              {rows.length > 0 ? rows.map((r,i)=>(
                <tr key={i}><td className="id">{r.idCard}</td><td>{r.name||"—"}</td><td>{r.grade}</td><td className="mono">{r.salScale}</td><td className="mono">{r.newSalScale||"—"}</td><td className="num">{r.fromDate}</td><td>{r.reason||"—"}</td><td><ApprovalPill compact sent={r.sentToOfficer} approved={r.approvedProgression} uploaded={r.uploaded}/></td></tr>
              )) : (
                <tr><td colSpan={8} className="muted" style={{padding:20,textAlign:"center"}}>No assimilation records</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── VIEW PRS ─────────────────────────────────────────────────────
  if (mode === "view-prs") {
    return (
      <div>
        {backBtn()}
        <div className="card">
          <div className="card-head"><h2>View PRS — Non-Teaching Staff</h2></div>
          <div className="table-scroll">
            <table className="table compact">
              <thead><tr><th>ID Card</th><th>Name</th><th>Surname</th><th>Grade</th><th>Scale</th><th>Salary</th><th>Paypoint</th><th>Appointment</th></tr></thead>
              <tbody>
                {D.PEOPLE.slice(0,30).map((p,i)=>(
                  <tr key={i}>
                    <td className="id">{p.idCard}</td><td>{p.name}</td><td>{p.surname}</td>
                    <td className="muted xs">{p.gradeDesc}</td><td className="mono">{p.salScale}</td>
                    <td className="num">€{p.presentSalary?.toLocaleString()}</td>
                    <td className="muted xs">{p.paypointDesc}</td><td className="num">{p.appointmentDate||"—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-foot muted xs">Showing first 30 of {D.PEOPLE.length} PRS records.</div>
        </div>
      </div>
    );
  }

  // ── BY MONTH / YEAR ──────────────────────────────────────────────
  if (mode === "by-month") {
    const filtered = localRecs.filter(r=>{ if(!r.fromDate) return false; const [yr,mo]=r.fromDate.split("-"); return mo===monthYear.month && yr===monthYear.year; });
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return (
      <div>
        {backBtn()}
        <div className="card">
          <div className="card-head">
            <h2>Progressions by Month / Year</h2>
            <div className="right" style={{display:"flex",gap:8}}>
              <select className="input sm" value={monthYear.month} onChange={e=>setMonthYear(m=>({...m,month:e.target.value}))}>
                {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m,i)=><option key={m} value={m}>{MONTHS[i]}</option>)}
              </select>
              <select className="input sm" value={monthYear.year} onChange={e=>setMonthYear(m=>({...m,year:e.target.value}))}>
                {["2023","2024","2025","2026"].map(y=><option key={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <table className="table compact">
            <thead><tr><th>ID Card</th><th>Name</th><th>Grade</th><th>Scale</th><th>→</th><th>WEF</th><th>Next Prog.</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((r,i)=>(
                <tr key={i}><td className="id">{r.idCard}</td><td>{r.name||"—"}</td><td className="muted xs">{r.grade||r.gradeDesc}</td><td className="mono">{r.salScale}</td><td className="mono">{r.newSalScale||"—"}</td><td className="num">{r.fromDate}</td><td className="num">{r.nextProgression||"—"}</td><td><ApprovalPill compact sent={r.sentToOfficer} approved={r.approvedProgression} uploaded={r.uploaded}/></td></tr>
              )) : (
                <tr><td colSpan={8} className="muted" style={{padding:20,textAlign:"center"}}>No progressions in {MONTHS[parseInt(monthYear.month)-1]} {monthYear.year}</td></tr>
              )}
            </tbody>
          </table>
          <div className="card-foot muted xs">{filtered.length} progressions in selected month.</div>
        </div>
      </div>
    );
  }

  // ── AWAITING REPLIES ─────────────────────────────────────────────
  if (mode === "awaiting-replies") {
    const pending = localRecs.filter(r=>r.sentToOfficer && !r.approvedProgression);
    return (
      <div>
        {backBtn()}
        <div className="card">
          <div className="card-head"><h2>Awaiting Replies from Supervisors</h2><span className={"tag "+(pending.length>0?"amber":"green")}>{pending.length} pending</span></div>
          <table className="table compact">
            <thead><tr><th>ID Card</th><th>Name</th><th>Grade</th><th>Scale</th><th>WEF</th><th></th></tr></thead>
            <tbody>
              {pending.length > 0 ? pending.map((r,i)=>(
                <tr key={i}><td className="id">{r.idCard}</td><td>{r.name||"—"}</td><td className="muted xs">{r.grade||r.gradeDesc}</td><td className="mono">{r.salScale}</td><td className="num">{r.fromDate}</td><td><button className="btn xs">Send reminder</button></td></tr>
              )) : (
                <tr><td colSpan={6} className="muted" style={{padding:20,textAlign:"center"}}>No pending replies</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── COMING MONTHS ────────────────────────────────────────────────
  if (mode === "coming-months") {
    const today = new Date();
    const upcoming = localRecs.filter(r=>{ if(!r.nextProgression) return false; const diff=(new Date(r.nextProgression)-today)/(86400000); return diff>=0&&diff<=90; });
    upcoming.sort((a,b)=>new Date(a.nextProgression)-new Date(b.nextProgression));
    return (
      <div>
        {backBtn()}
        <div className="card">
          <div className="card-head"><h2>Progressions in the coming months</h2><span className={"tag "+(upcoming.length>0?"amber":"green")}>{upcoming.length} due in 90 days</span></div>
          <table className="table compact">
            <thead><tr><th>ID Card</th><th>Name</th><th>Grade</th><th>Scale</th><th>Next Prog. Date</th><th>Days</th><th>Paypoint</th></tr></thead>
            <tbody>
              {upcoming.length > 0 ? upcoming.map((r,i)=>{
                const days=Math.ceil((new Date(r.nextProgression)-today)/86400000);
                return (<tr key={i}><td className="id">{r.idCard}</td><td>{r.name||"—"}</td><td className="muted xs">{r.grade||r.gradeDesc}</td><td className="mono">{r.salScale}</td><td className="num">{r.nextProgression}</td><td><span className={"tag "+(days<=30?"red":days<=60?"amber":"green")}>{days}d</span></td><td className="muted xs">{r.paypointDesc||"—"}</td></tr>);
              }) : (
                <tr><td colSpan={7} className="muted" style={{padding:20,textAlign:"center"}}>No progressions due in the next 90 days</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── MAINTENANCE ──────────────────────────────────────────────────
  if (mode === "maintenance") {
    return (
      <div>
        {backBtn()}
        <div className="card" style={{maxWidth:480}}>
          <div className="card-head"><h2>Maintenance Menu</h2></div>
          <div style={{padding:14,display:"flex",flexDirection:"column",gap:8}}>
            {["Update Grade Details","Update Salary Scales","Update Paypoints","Manage Promotions Table (27 rows)","Edit Staff e-Mail List (224 entries)","Configure Reminders (Reminder_tbl)","Compact & Repair Database"].map((item,i)=>(
              <button key={i} className="btn" style={{textAlign:"left"}}>{item}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── REPORTS ──────────────────────────────────────────────────────
  if (mode === "reports") {
    return (
      <div>
        {backBtn()}
        <div className="card" style={{maxWidth:480}}>
          <div className="card-head"><h2>Reports</h2></div>
          <div style={{padding:14,display:"flex",flexDirection:"column",gap:8}}>
            {["All Progressions (current year)","Progressions by Grade","Promotions Report","Placements Report","Awaiting Approval","Sent to Payroll","Not Yet Processed","Print All Letters (batch)"].map((r,i)=>(
              <button key={i} className="btn" style={{textAlign:"left"}}><span className="muted" style={{marginRight:8}}>▤</span>{r}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────
// TEACHERS PROGRESSIONS — Access-style multi-screen
// ─────────────────────────────────────────────────────────────────
function TeachingProgressions() {
  const [mode, setMode] = useState("menu");
  const { setView } = useApp();
  const [localRecs, setLocalRecs] = useState(X?.PROG_TEACHERS || []);
  const [searchType, setSearchType] = useState("idCard");
  const [searchIdCard, setSearchIdCard] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchSurname, setSearchSurname] = useState("");
  const [viewResult, setViewResult] = useState(null);
  const [addForm, setAddForm] = useState({ idCard:"", name:"", surname:"", gender:"", email:"", gradeDesc:"", mobilePhone:"", officePhone:"", nextProgDate:"", noProgressions:"0", paypoint:"" });

  const T_GRADES = [
    "Teacher (Masters MQF 7)","Teacher (Degree MQF 6)","Teacher (Diploma)",
    "Teacher (PGCE)","Supply Teacher (Masters)","Supply Teacher (Degree)",
    "Head of School","Deputy Head of School","Head of Department","Education Officer",
  ];
  const T_PAYPOINTS = [
    "Ministry for Education","Directorate for Learning and Assessment Programmes",
    "Directorate for Quality and Standards","Directorate for Educational Services",
    "Inclusion Unit","Resource Centre","State School","Church School","MCAST",
  ];

  const lookupT = (ic) => D.PEOPLE.find(p=>p.idCard.toLowerCase()===ic.toLowerCase().trim())||null;
  const backBtn = (label="← Back to menu", target="menu") => (
    <button className="btn ghost" style={{marginBottom:14}} onClick={()=>setMode(target)}>{label}</button>
  );

  const today = new Date();
  const prog1 = localRecs.filter(r=>{ const sc=parseInt(r.salScale)||0; return sc>=9&&sc<=12; });
  const prog2 = localRecs.filter(r=>{ const sc=parseInt(r.salScale)||0; return sc>=7&&sc<=8; });
  const prog1Due = prog1.filter(r=>{ if(!r.nextProgDate&&!r.fromDate) return false; const d=new Date(r.nextProgDate||r.fromDate); const diff=(d-today)/86400000; return diff>=-730&&diff<=90; });
  const prog2Due = prog2.filter(r=>{ if(!r.nextProgDate&&!r.fromDate) return false; const d=new Date(r.nextProgDate||r.fromDate); const diff=(d-today)/86400000; return diff>=-730&&diff<=90; });

  // Fallback sample data for "next 3 months" when DEEP_DATA is absent
  const sampleProg1 = D.PEOPLE.slice(0,5).map((p,i)=>({ idCard:p.idCard, name:`${p.name} ${p.surname}`, grade:p.gradeDesc||"Teacher", wefDate:["05/10/2021","16/02/2022","26/04/2022","04/10/2024","12/01/2025"][i] }));
  const sampleProg2 = D.PEOPLE.slice(5,10).map((p,i)=>({ idCard:p.idCard, name:`${p.name} ${p.surname}`, grade:p.gradeDesc||"Teacher", wefDate:["30/07/2026","27/07/2026","27/07/2026","27/07/2026","01/08/2026"][i] }));
  const show1 = prog1Due.length>0 ? prog1Due : sampleProg1;
  const show2 = prog2Due.length>0 ? prog2Due : sampleProg2;

  // ── MENU (dashboard) ─────────────────────────────────────────────
  if (mode === "menu") {
    const ACTIONS = [
      {id:"dakar-import",  icon:"↓", label:"Import Excel from DAKAR",                desc:"Pull progression-eligible teachers from the Dakar export"},
      {id:"view-person",   icon:"⌕", label:"View Person's Progression Data",         desc:"Look up by ID card, name or surname"},
      {id:"view-all",      icon:"≡", label:"View All Teachers",                       desc:`Browse all ${localRecs.length || D.PEOPLE.length} progression candidates`},
      {id:"send-dg",       icon:"▶", label:"Send to DG",                              desc:"Forward a batch for DG sign-off"},
      {id:"next-3-months", icon:"📅",label:"Progressions in the next 3 months",       desc:"Outbound queue sorted by effective date"},
      {id:"add-person",    icon:"+", label:"Add Person",                              desc:"Manually add a candidate not present in Dakar"},
      {id:"no-reply",      icon:"⊠", label:"Reports sent but no reply received",     desc:"Flagged sent but reply pending"},
      {id:"reports",       icon:"▦", label:"Reports",                                 desc:"Standard report pack"},
      {id:"new-teachers",  icon:"★", label:"New Teachers",                            desc:"First-time entries this cycle"},
      {id:"maintenance",   icon:"⚙", label:"Maintenance",                             desc:"Lookups and cleanup"},
    ];
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <div className="crumbs">Progressions · Teaching</div>
            <h1>Progressions — Teachers</h1>
            <p className="page-sub">Teaching-staff progression workflow — Dakar import, candidate review, DG dispatch.</p>
          </div>
          <div className="page-actions">
            <button className="btn primary" onClick={()=>setMode("view-all")}>View all teachers</button>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Actions</h2></div>
          <div className="card-body" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:10}}>
            {ACTIONS.map(a => (
              <button key={a.id} className="action-card" onClick={()=>{ if(a.id==="view-prs"||a.id==="view-prs-main"){ setView("prs-view"); } else { setMode(a.id); } }}>
                <span className="ac-ico">{a.icon}</span>
                <span className="ac-content">
                  <span className="ac-title">{a.label}</span>
                  <span className="ac-desc">{a.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── VIEW PERSONS PROGRESSION DATA ────────────────────────────────
  if (mode === "view-person") {
    const doSearch = () => {
      let found = null;
      if (searchType==="idCard")   found = lookupT(searchIdCard);
      if (searchType==="name")     found = D.PEOPLE.find(p=>p.name.toLowerCase()===searchName.toLowerCase().trim());
      if (searchType==="surname")  found = D.PEOPLE.find(p=>p.surname.toLowerCase()===searchSurname.toLowerCase().trim());
      setViewResult(found || "none");
    };
    const person = viewResult && viewResult !== "none" ? viewResult : null;
    const personRecs = person ? localRecs.filter(r=>r.idCard===person.idCard) : [];
    return (
      <div>
        {backBtn()}
        <div className="card" style={{maxWidth:480}}>
          <div className="card-head"><h2>Persons Details</h2><span className="muted xs">Progression Teachers</span></div>
          <div style={{padding:"16px 18px",background:"var(--panel-2)",borderTop:"1px solid var(--line-2)"}}>
            {[
              {type:"idCard",  label:"Insert ID Card",  val:searchIdCard,  setVal:setSearchIdCard},
              {type:"name",    label:"Insert Name",      val:searchName,    setVal:setSearchName},
              {type:"surname", label:"Insert Surname",   val:searchSurname, setVal:setSearchSurname},
            ].map(row=>(
              <div key={row.type} style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                <input type="radio" checked={searchType===row.type} onChange={()=>setSearchType(row.type)} style={{accentColor:"white"}}/>
                <div style={{flex:1}}>
                  <label style={{display:"block",fontSize:12,fontWeight:600,color:"white",marginBottom:4}}>{row.label}</label>
                  <input className="input" value={row.val} onChange={e=>row.setVal(e.target.value)}
                    disabled={searchType!==row.type} style={{width:"100%",opacity:searchType!==row.type?0.5:1}}/>
                </div>
              </div>
            ))}
          </div>
          <div style={{padding:"12px 18px",borderTop:"1px solid var(--line-2)",display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button className="btn" onClick={()=>{setMode("menu");setViewResult(null);}}>Close</button>
            <button className="btn primary" onClick={doSearch}>View</button>
          </div>
        </div>
        {viewResult === "none" && <div className="muted xs" style={{marginTop:10}}>No person found.</div>}
        {person && (
          <div className="card" style={{marginTop:14}}>
            <div className="card-head"><h2>{person.name} {person.surname}</h2><span className="muted xs">{person.idCard}</span></div>
            <div style={{padding:"10px 14px",background:"var(--surface-2)",fontSize:13,display:"flex",gap:20,flexWrap:"wrap"}}>
              <span><span className="muted">Grade: </span>{person.gradeDesc}</span>
              <span><span className="muted">Scale: </span><span className="mono">{person.salScale}</span></span>
              <span><span className="muted">Salary: </span>€{person.presentSalary?.toLocaleString()}</span>
              <span><span className="muted">Paypoint: </span>{person.paypointDesc}</span>
            </div>
            <div className="table-scroll">
              <table className="table compact">
                <thead><tr><th>Grade</th><th>From Scale</th><th>→ To</th><th>WEF</th><th>Type</th><th>Yrs Svc</th><th>Status</th></tr></thead>
                <tbody>
                  {personRecs.length > 0 ? personRecs.map((r,i)=>(
                    <tr key={i}><td className="muted xs">{r.gradeDesc||"Teacher"}</td><td className="mono">{r.salScale}</td><td className="mono">{r.newSalScale||"—"}</td><td className="num">{r.fromDate||r.wefDate}</td><td><span className={"tag "+(r.progType==="Supply"?"amber":"blue")}>{r.progType||"Regular"}</span></td><td className="num">{r.yearsService||"—"}</td><td><ApprovalPill compact sent={r.sentToOfficer} approved={r.approvedProgression} uploaded={r.uploaded}/></td></tr>
                  )) : <tr><td colSpan={7} className="muted" style={{padding:16,textAlign:"center"}}>No progression records found for this person.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── VIEW ALL TEACHERS ────────────────────────────────────────────
  if (mode === "view-all") {
    const allT = localRecs.length > 0
      ? localRecs
      : D.PEOPLE.slice(0,20).map(p=>({idCard:p.idCard, name:p.name, surname:p.surname, gradeDesc:p.gradeDesc}));
    return (
      <div>
        {backBtn()}
        <div className="card">
          <div className="card-head"><h2>View All Teachers</h2><span className="tag gray">{allT.length}</span></div>
          <div className="table-scroll" style={{maxHeight:480}}>
            <table className="table compact">
              <thead><tr><th>ID Card</th><th>Name</th><th>Surname</th><th>Grade</th><th></th></tr></thead>
              <tbody>
                {allT.map((r,i)=>(
                  <tr key={i}>
                    <td className="id">{r.idCard}</td>
                    <td>{r.name||(r.name||"").split(" ")[0]||"—"}</td>
                    <td>{r.surname||(r.name||"").split(" ").slice(1).join(" ")||"—"}</td>
                    <td className="muted xs">{r.gradeDesc||r.grade||"Teacher"}</td>
                    <td><button className="btn xs" onClick={()=>{ const found=lookupT(r.idCard); setViewResult(found||"none"); setSearchIdCard(r.idCard); setSearchType("idCard"); setMode("view-person"); }}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{padding:12,textAlign:"center"}}><button className="btn" onClick={()=>setMode("menu")}>Close</button></div>
        </div>
      </div>
    );
  }

  // ── PROGRESSIONS IN NEXT 3 MONTHS ────────────────────────────────
  if (mode === "next-3-months") {
    const Section = ({title, rows}) => (
      <div className="card" style={{marginBottom:14}}>
        <div className="card-head" >
          <h2 style={{color:"white"}}>{title}</h2>
          <span className="tag pink">{rows.length}</span>
        </div>
        <div className="table-scroll" style={{maxHeight:220}}>
          <table className="table compact">
            <thead><tr><th>ID Card</th><th>Name</th><th>Grade</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {rows.length > 0 ? rows.map((r,i)=>(
                <tr key={i}>
                  <td className="id">{r.idCard}</td>
                  <td>{r.name||(r.name||"—")}</td>
                  <td className="muted xs">{r.grade||r.gradeDesc||"Teacher"}</td>
                  <td className="num">{r.wefDate||r.fromDate||r.nextProgDate||"—"}</td>
                  <td><button className="btn xs">View</button></td>
                </tr>
              )) : <tr><td colSpan={5} className="muted" style={{padding:16,textAlign:"center"}}>No records</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
    return (
      <div>
        {backBtn()}
        <div style={{marginBottom:8,fontSize:15,fontWeight:600}}>Progressions in the next 3 months</div>
        <Section title="1st Progression in the next 3 months" rows={show1}/>
        <Section title="2nd Progression in the next 3 months" rows={show2}/>
        <button className="btn" onClick={()=>setMode("menu")}>Close</button>
      </div>
    );
  }

  // ── ADD PERSON ───────────────────────────────────────────────────
  if (mode === "add-person") {
    const af = addForm;
    const upd = (k,v) => setAddForm(f=>({...f,[k]:v}));
    const person = af.idCard.length>=6 ? lookupT(af.idCard) : null;
    const FIELD = (label, key, type="text", opts=null) => (
      <div style={{display:"flex",alignItems:"center",marginBottom:10}}>
        <label style={{width:180,fontSize:13,fontWeight:600,color:"white",textAlign:"right",paddingRight:12,flexShrink:0}}>{label}</label>
        {opts ? (
          <select className="input" style={{flex:1}} value={af[key]} onChange={e=>upd(key,e.target.value)}>
            <option value=""/>
            {opts.map(o=><option key={o}>{o}</option>)}
          </select>
        ) : (
          <input type={type} className="input" style={{flex:1}} value={af[key]} onChange={e=>upd(key,e.target.value)}/>
        )}
      </div>
    );
    return (
      <div>
        {backBtn()}
        <div className="card" style={{maxWidth:580}}>
          <div className="card-head"><h2>Person Details</h2><span className="muted xs">(New)</span></div>
          <div style={{padding:"16px 18px",background:"var(--panel-2)",borderTop:"1px solid var(--line-2)"}}>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.6)",marginBottom:12}}>(New)</div>
            {FIELD("ID Card no","idCard")}
            {person && <div style={{fontSize:11,color:"#90cdf4",marginBottom:8,paddingLeft:192}}>Found: {person.name} {person.surname}</div>}
            {FIELD("Name","name")}
            {FIELD("Surname","surname")}
            {FIELD("Gender","gender","text",["M","F"])}
            {FIELD("Email Addresses","email","email")}
            {FIELD("Grade Description","gradeDesc","text",T_GRADES)}
            {FIELD("Mobile Phones","mobilePhone","tel")}
            {FIELD("Office Phones","officePhone","tel")}
            {FIELD("Next Progression date","nextProgDate","date")}
            <div style={{display:"flex",alignItems:"center",marginBottom:10}}>
              <label style={{width:180,fontSize:13,fontWeight:600,color:"white",textAlign:"right",paddingRight:12,flexShrink:0}}>No of progressions taken</label>
              <input type="number" className="input" style={{flex:1}} value={af.noProgressions} onChange={e=>upd("noProgressions",e.target.value)} min="0"/>
            </div>
            {FIELD("Paypoint","paypoint","text",T_PAYPOINTS)}
          </div>
          <div style={{padding:"12px 18px",borderTop:"1px solid var(--line-2)",display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button className="btn" onClick={()=>{setAddForm({idCard:"",name:"",surname:"",gender:"",email:"",gradeDesc:"",mobilePhone:"",officePhone:"",nextProgDate:"",noProgressions:"0",paypoint:""});setMode("menu");}}>Don't Save and Close</button>
            <button className="btn primary" disabled={!af.idCard} onClick={()=>{ setLocalRecs(r=>[...r,{autoId:Date.now(),idCard:af.idCard,name:`${af.name} ${af.surname}`.trim(),gradeDesc:af.gradeDesc,salScale:"9",fromDate:af.nextProgDate,sentToOfficer:false,approvedProgression:false,uploaded:false}]); setAddForm({idCard:"",name:"",surname:"",gender:"",email:"",gradeDesc:"",mobilePhone:"",officePhone:"",nextProgDate:"",noProgressions:"0",paypoint:""}); setMode("menu"); }}>Save and Close</button>
            <button className="btn" onClick={()=>setMode("menu")}>Insert Further Details</button>
          </div>
        </div>
      </div>
    );
  }

  // ── DAKAR IMPORT ─────────────────────────────────────────────────
  if (mode === "dakar-import") {
    return (
      <div>
        {backBtn()}
        <div className="card" style={{maxWidth:560}}>
          <div className="card-head"><h2>Import Excel from DAKAR</h2></div>
          <div style={{padding:"16px 18px",display:"flex",flexDirection:"column",gap:14}}>
            <div className="muted xs">Upload the DAKAR Excel export (Belli_dakar format). Columns: ID Card, Name, Surname, Grade, Scale, Salary, WEF date.</div>
            <div>
              <label className="muted xs" style={{display:"block",marginBottom:4}}>Select Excel file</label>
              <input type="file" accept=".xlsx,.xls" onChange={e=>{
                const file=e.target.files[0]; if(!file) return;
                const reader=new FileReader();
                reader.onload=(ev)=>{ try { const wb=XLSX.read(ev.target.result,{type:"array"}); const ws=wb.Sheets[wb.SheetNames[0]]; const rows=XLSX.utils.sheet_to_json(ws); alert(`Parsed ${rows.length} rows from "${file.name}". Ready to import.`); } catch(err){ alert("Could not parse file: "+err.message); } };
                reader.readAsArrayBuffer(file);
              }}/>
            </div>
            {[{ts:"2026-04-28 04:14",op:"DAKAR file pulled",rows:1032,status:"OK"},{ts:"2026-04-21 04:14",op:"DAKAR file pulled",rows:1019,status:"OK"},{ts:"2026-04-14 04:14",op:"PRS match",rows:1016,status:"OK"},{ts:"2026-04-14 04:18",op:"3 rows unmatched",rows:3,status:"WARN"}].map((l,i)=>(
              <div key={i} className="log-row">
                <span className="mono xs">{l.ts}</span>
                <span style={{flex:1,fontSize:12}}>{l.op}</span>
                <span className="mono xs">{l.rows}</span>
                <span className={"tag "+(l.status==="OK"?"green":"amber")}>{l.status}</span>
              </div>
            ))}
          </div>
          <div style={{padding:"12px 18px",borderTop:"1px solid var(--line-2)",display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button className="btn" onClick={()=>setMode("menu")}>Close</button>
            <button className="btn primary">Run Import</button>
          </div>
        </div>
      </div>
    );
  }

  // ── SEND TO DG ───────────────────────────────────────────────────
  if (mode === "send-dg") {
    const ready = localRecs.filter(r=>r.approvedProgression&&!r.sentToDG);
    return (
      <div>
        {backBtn()}
        <div className="card">
          <div className="card-head"><h2>Send to DG</h2><span className={"tag "+(ready.length>0?"amber":"green")}>{ready.length} ready</span></div>
          <div className="muted xs" style={{padding:"6px 12px",borderBottom:"1px solid var(--line-2)"}}>Approved progressions ready to be forwarded to the Director General.</div>
          <table className="table compact">
            <thead><tr><th>ID Card</th><th>Name</th><th>Grade</th><th>Scale</th><th>WEF</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {ready.length > 0 ? ready.slice(0,15).map((r,i)=>(
                <tr key={i}><td className="id">{r.idCard}</td><td>{r.name||"—"}</td><td className="muted xs">{r.gradeDesc||r.grade||"Teacher"}</td><td className="mono">{r.salScale}</td><td className="num">{r.fromDate||r.wefDate}</td><td><span className="tag green">Approved</span></td><td><button className="btn xs primary" onClick={()=>setLocalRecs(rs=>rs.map(x=>x===r?{...x,sentToDG:true}:x))}>Send</button></td></tr>
              )) : <tr><td colSpan={7} className="muted" style={{padding:20,textAlign:"center"}}>No records ready to send</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── PROGRESSIONS REPORTS NO REPLY ────────────────────────────────
  if (mode === "no-reply") {
    const noReply = localRecs.filter(r=>r.sentToOfficer&&!r.approvedProgression);
    return (
      <div>
        {backBtn()}
        <div className="card">
          <div className="card-head"><h2>Progressions Reports sent but no reply received</h2><span className={"tag "+(noReply.length>0?"red":"green")}>{noReply.length}</span></div>
          <table className="table compact">
            <thead><tr><th>ID Card</th><th>Name</th><th>Grade</th><th>Scale</th><th>WEF</th><th>Officer</th><th></th></tr></thead>
            <tbody>
              {noReply.length > 0 ? noReply.map((r,i)=>(
                <tr key={i}><td className="id">{r.idCard}</td><td>{r.name||"—"}</td><td className="muted xs">{r.gradeDesc||"Teacher"}</td><td className="mono">{r.salScale}</td><td className="num">{r.fromDate||r.wefDate}</td><td className="mono xs">{r.officer||"—"}</td><td><button className="btn xs">Send reminder</button></td></tr>
              )) : <tr><td colSpan={7} className="muted" style={{padding:20,textAlign:"center"}}>No outstanding replies</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── NEW TEACHERS ─────────────────────────────────────────────────
  if (mode === "new-teachers") {
    const newT = localRecs.filter(r=>!r.sentToOfficer&&!r.approvedProgression);
    return (
      <div>
        {backBtn()}
        <div className="card">
          <div className="card-head"><h2>New Teachers</h2><span className="tag gray">{newT.length}</span></div>
          <div className="muted xs" style={{padding:"6px 12px",borderBottom:"1px solid var(--line-2)"}}>Newly inserted teacher records not yet processed through any approval stage.</div>
          <table className="table compact">
            <thead><tr><th>ID Card</th><th>Name</th><th>Grade</th><th>Scale</th><th>Paypoint</th><th>WEF</th></tr></thead>
            <tbody>
              {newT.length > 0 ? newT.slice(0,20).map((r,i)=>(
                <tr key={i}><td className="id">{r.idCard}</td><td>{r.name||"—"}</td><td className="muted xs">{r.gradeDesc||r.grade||"Teacher"}</td><td className="mono">{r.salScale}</td><td className="muted xs">{r.paypointDesc||"—"}</td><td className="num">{r.fromDate||r.wefDate||"—"}</td></tr>
              )) : <tr><td colSpan={6} className="muted" style={{padding:20,textAlign:"center"}}>No new teacher records</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── MAINTENANCE ──────────────────────────────────────────────────
  if (mode === "maintenance") {
    return (
      <div>
        {backBtn()}
        <div className="card" style={{maxWidth:480}}>
          <div className="card-head"><h2>Maintenance</h2></div>
          <div style={{padding:14,display:"flex",flexDirection:"column",gap:8}}>
            {["Update Grade Details","Update Salary Scales","Update Paypoints","Manage Supply Ratio Rules","Edit Allowances Table","DAKAR Sync Configuration","Compact & Repair Database"].map((item,i)=>(
              <button key={i} className="btn" style={{textAlign:"left"}}>{item}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── REPORTS ──────────────────────────────────────────────────────
  if (mode === "reports") {
    return (
      <div>
        {backBtn()}
        <div className="card" style={{maxWidth:480}}>
          <div className="card-head"><h2>Reports</h2></div>
          <div style={{padding:14,display:"flex",flexDirection:"column",gap:8}}>
            {["All Progressions (current year)","1st Progressions Report","2nd Progressions Report","Supply Teachers Report","Regular vs Supply Ratio","Sent to DG","Awaiting Approval","Print All Letters (batch)"].map((r,i)=>(
              <button key={i} className="btn" style={{textAlign:"left"}}><span className="muted" style={{marginRight:8}}>▤</span>{r}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────
// LSE/KGE I PROGRESSIONS — Access-style multi-screen
// ─────────────────────────────────────────────────────────────────
function LSEKGEIProgressions() {
  const [mode, setMode]           = useState("menu");
  const { setView } = useApp();
  const [localRecs, setLocalRecs] = useState(X?.PROG_LSE_I || []);
  const [searchId, setSearchId]   = useState("");
  const [person, setPerson]       = useState(null);
  const [overlay, setOverlay]     = useState(null);
  const [pd, setPd] = useState({
    surname:"Test_surname", name:"test_Name",
    supplyApptDate:"13/01/2010", regularApptDate:"11/12/2015",
    prog1Date:"11/12/2020", prog2Date:"11/12/2025",
    designation:"Kindergarten Educator I", paypointNo:"11/123",
    headOfSchool:"Joseph Camilleri.", school:"AA desc 3",
    email:"joseph.camilleri@ilearn.edu.mt", ccEmail:"AA CC-email",
    fromScale:"12", toScale:"11",
    fromAmt:"1210", toAmt:"1310", increment:"75", classAllow:"660", resourceAllow:"125",
    mobilityYrs:"4", unpaidLeaveYrs:"1.662", supplyYrs:"2.900", regularYrs:"9.670", totalYrs:"14.91",
    prog1Done:true, prog2Done:false,
    prog1Sent:true, prog1SentOn:"2025-08-06", prog1Received:true, prog1SelectSRS:false, prog1SentSRS:true,
    prog2Sent:false, prog2SentOn:"", prog2Received:false, prog2SelectSRS:false, prog2SentSRS:false,
  });
  const [unpaidRows, setUnpaidRows] = useState([
    {type:"European parliament (MEPs)", desc:"European parliament (MEPs)", start:"08/03/2015", end:"08/10/2016", years:"1.591"},
    {type:"Break of Service",           desc:"Break of Service",           start:"01/05/2025", end:"26/05/2025", years:"0.071"},
  ]);
  const [supplyHist]  = useState([{ start:"13/01/2010", end:"06/12/2012", years:"2.9" }]);
  const [regularHist] = useState([{ start:"11/12/2015", end:"", years:"" }]);
  const [addForm, setAddForm] = useState({ idCard:"", surname:"", name:"", supplyApptDate:"", regularApptDate:"", designation:"", paypointNo:"", email:"" });
  const upd  = (k,v) => setPd(p=>({...p,[k]:v}));
  const updA = (k,v) => setAddForm(f=>({...f,[k]:v}));

  const LSE_DESIG = ["Kindergarten Educator I","LSE I","Learning Support Educator I"];
  const PAYPOINTS = ["11/123","11/124","12/001","12/002","13/100","13/200"];
  const lookup    = (ic) => D.PEOPLE.find(p=>p.idCard.toLowerCase()===ic.toLowerCase().trim())||null;
  const backBtn   = (label="← Back to menu", target="menu") => (
    <button className="btn ghost" style={{marginBottom:14}} onClick={()=>{setMode(target);setOverlay(null);}}>{label}</button>
  );
  const totalDB = localRecs.length || 193;

  const sample1st = D.PEOPLE.slice(0,4).map((p,i)=>({idCard:p.idCard, name:`${p.name} ${p.surname}`, date:["02/01/2021","10/01/2021","02/03/2021","01/07/2021"][i]}));
  const sample2nd = D.PEOPLE.slice(4,7).map((p,i)=>({idCard:p.idCard, name:`${p.name} ${p.surname}`, date:["11/12/2025","19/11/2025","01/01/2026"][i]}));

  const PRS_SERVICE = [
    {grade:"SLSE", from:"01/01/2000", reason:"New Contract"},
    {grade:"SLSE", from:"01/01/2003", reason:"End of Contract"},
    {grade:"SLSE", from:"01/01/2005", reason:"New Contract"},
    {grade:"SLSE", from:"01/01/2008", reason:"End of Contract"},
    {grade:"Supply Teacher", from:"01/01/2015", reason:"New Employment"},
  ];

  // ── MENU (dashboard) ─────────────────────────────────────────────
  if (mode === "menu") {
    const ACTIONS = [
      {id:"view-person",      icon:"⌕", label:"View Person's Details",                desc:"Look up an LSE/KGE I candidate"},
      {id:"view-prs-main",    icon:"▤", label:"View PRS",                              desc:"Browse linked PRS records"},
      {id:"add-person",       icon:"+", label:"Add Person",                            desc:"Manually add a candidate"},
      {id:"prog-history",     icon:"≡", label:"View Person Progression History",      desc:"Past scale jumps for one person"},
      {id:"next-3-months",    icon:"📅",label:`${totalDB} LSE/KGE progressions in 3 months`, desc:"Outbound queue"},
      {id:"view-unpaid-main", icon:"₪", label:"View Person Unpaid Leave",              desc:"Unpaid leave counts against progression service"},
      {id:"no-letters",       icon:"⊠", label:"Progression letters not received",     desc:"Sent but reply pending"},
      {id:"send-srs",         icon:"▶", label:"Send all marked to SRS",                desc:"Dispatch batch to SRS"},
      {id:"maintenance",      icon:"⚙", label:"Maintenance",                           desc:"Lookups and cleanup"},
    ];
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <div className="crumbs">Progressions · LSE/KGE I by Service</div>
            <h1>Progressions — LSE/KGE I by Service</h1>
            <p className="page-sub">{totalDB} records · Scale 13 → 12 → 11. LSE / KGE I progression workflow driven by years of service.</p>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Actions</h2></div>
          <div className="card-body" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:10}}>
            {ACTIONS.map(a => (
              <button key={a.id} className="action-card" onClick={()=>{ if(a.id==="view-prs"||a.id==="view-prs-main"){ setView("prs-view"); } else { setMode(a.id); } }}>
                <span className="ac-ico">{a.icon}</span>
                <span className="ac-content">
                  <span className="ac-title">{a.label}</span>
                  <span className="ac-desc">{a.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── VIEW PERSON'S DETAILS ──────────────────────────────────────────
  if (mode === "view-person") {
    if (!person) {
      return (
        <div>
          {backBtn()}
          <div className="card" style={{maxWidth:360}}>
            <div className="card-head"><h2>View Person's Details</h2></div>
            <div style={{padding:16}}>
              <label className="muted xs" style={{display:"block",marginBottom:4}}>ID Card No.</label>
              <input className="input" style={{width:"100%"}} value={searchId} onChange={e=>setSearchId(e.target.value)} placeholder="e.g. 0167489M"/>
            </div>
            <div style={{padding:"12px 16px",borderTop:"1px solid var(--line-2)",display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button className="btn" onClick={()=>setMode("menu")}>Close</button>
              <button className="btn primary" onClick={()=>{ const f=lookup(searchId)||{idCard:searchId,name:"",surname:""}; setPerson(f); upd("surname",f.surname||""); upd("name",f.name||""); }}>View</button>
            </div>
          </div>
        </div>
      );
    }

    const CHK = ({k,label}) => (
      <label style={{display:"flex",alignItems:"center",gap:6,color:"white",fontSize:12,cursor:"pointer"}}>
        <input type="checkbox" checked={!!pd[k]} onChange={e=>upd(k,e.target.checked)} style={{accentColor:"white"}}/>{label}
      </label>
    );

    return (
      <div>
        {backBtn()}
        <div className="card" style={{padding:"16px 20px",position:"relative"}}>

          {/* ── UNPAID LEAVE OVERLAY ── */}
          {overlay === "unpaid" && (
            <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.6)",zIndex:20,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8}}>
              <div className="card" style={{width:680,maxHeight:"70vh",overflow:"auto"}}>
                <div className="card-head"><h2>Unpaid Leave — {person.idCard}</h2></div>
                <table className="table compact"><thead><tr><th>Type</th><th>Description</th><th>Start</th><th>End</th><th>Years</th><th></th></tr></thead>
                  <tbody>{unpaidRows.map((r,i)=>(
                    <tr key={i}><td>{r.type}</td><td>{r.desc}</td><td className="num">{r.start}</td><td className="num">{r.end}</td><td className="mono">{r.years}</td>
                      <td><button className="btn xs" onClick={()=>setUnpaidRows(rs=>rs.filter((_,j)=>j!==i))}>Delete</button></td></tr>
                  ))}</tbody>
                </table>
                <div style={{padding:12,textAlign:"center"}}><button className="btn" onClick={()=>setOverlay(null)}>Close</button></div>
              </div>
            </div>
          )}

          {/* ── WORKING HISTORY OVERLAY ── */}
          {overlay === "history" && (
            <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.6)",zIndex:20,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8}}>
              <div className="card" style={{width:700,maxHeight:"70vh",overflow:"auto"}}>
                <div className="card-head"><h2>Progression Working History — {person.idCard}</h2></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
                  <div style={{borderRight:"2px solid var(--line-2)"}}>
                    <div style={{background:"var(--primary)",color:"white",textAlign:"center",fontWeight:600,padding:"6px",fontSize:13,borderRadius:"6px 6px 0 0"}}>Supply History</div>
                    <table className="table compact"><thead><tr><th>Start</th><th>End</th><th>Years</th><th></th></tr></thead>
                      <tbody>{supplyHist.map((r,i)=><tr key={i}><td className="num">{r.start}</td><td className="num">{r.end}</td><td className="mono">{r.years}</td><td><button className="btn xs">Delete</button></td></tr>)}</tbody>
                    </table>
                  </div>
                  <div>
                    <div style={{background:"var(--primary)",color:"white",textAlign:"center",fontWeight:600,padding:"6px",fontSize:13,borderRadius:"6px 6px 0 0"}}>Regular History</div>
                    <table className="table compact"><thead><tr><th>Start</th><th>End</th><th>Years</th><th></th></tr></thead>
                      <tbody>{regularHist.map((r,i)=><tr key={i}><td className="num">{r.start}</td><td className="num">{r.end||""}</td><td className="mono">{r.years||""}</td><td><button className="btn xs">Delete</button></td></tr>)}</tbody>
                    </table>
                  </div>
                </div>
                <div style={{padding:12,textAlign:"center"}}><button className="btn" onClick={()=>setOverlay(null)}>Close</button></div>
              </div>
            </div>
          )}

          {/* ── PRS OVERLAY ── */}
          {overlay === "prs" && (
            <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.6)",zIndex:20,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8}}>
              <div className="card" style={{width:780,maxHeight:"75vh",overflow:"auto"}}>
                <div style={{padding:"10px 16px",textAlign:"center",fontWeight:700,fontSize:16,borderBottom:"2px solid var(--line-2)"}}>PERSONAL RECORD SHEET</div>
                <div style={{padding:"10px 16px",display:"flex",gap:16,fontSize:12,borderBottom:"1px solid var(--line-2)"}}>
                  <span><strong>Surname:</strong> <span style={{color:"#c0392b"}}>{pd.surname}</span></span>
                  <span><strong>Name:</strong> <span style={{color:"#c0392b"}}>{pd.name}</span></span>
                  <span><strong>I.D. No:</strong> <span style={{color:"#c0392b"}}>{person.idCard}</span></span>
                </div>
                <div className="table-scroll">
                  <table className="table compact">
                    <thead><tr><th>Grade</th><th>From</th><th>Reason</th><th colSpan={2} style={{textAlign:"center",background:"#fee"}}>Supply</th><th colSpan={2} style={{textAlign:"center",background:"#efe"}}>Regular</th></tr></thead>
                    <tbody>{PRS_SERVICE.map((r,i)=>(
                      <tr key={i}>
                        <td className="muted xs">{r.grade}</td><td className="num">{r.from}</td><td className="muted xs">{r.reason}</td>
                        <td><button className="btn xs" style={{fontSize:10,background:"#c0392b",color:"white",border:"none"}} onClick={()=>upd("supplyApptDate",r.from)}>Use as START (Supply)</button></td>
                        <td><button className="btn xs" style={{fontSize:10,background:"#e67e22",color:"white",border:"none"}}>Use as END (Supply)</button></td>
                        <td><button className="btn xs" style={{fontSize:10,background:"#c0392b",color:"white",border:"none"}} onClick={()=>upd("regularApptDate",r.from)}>Use as START (Regular)</button></td>
                        <td><button className="btn xs" style={{fontSize:10,background:"#e67e22",color:"white",border:"none"}}>Use as END (Regular)</button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                <div style={{padding:12,textAlign:"center"}}><button className="btn" onClick={()=>setOverlay(null)}>Close</button></div>
              </div>
            </div>
          )}

          {/* Header */}
          <div style={{textAlign:"center",color:"white",marginBottom:10,fontWeight:700,fontSize:16}}>Person Details</div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:24,fontSize:11,color:"rgba(255,255,255,0.65)",marginBottom:10}}>
            <span>Unpaid leave last updated  01/08/2025</span>
            <span>Work History last updated  11/08/2025</span>
          </div>
          <div style={{color:"rgba(255,255,255,0.4)",fontSize:11,marginBottom:10}}>{totalDB}</div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:20}}>
            {/* LEFT */}
            <div style={{display:"grid",gridTemplateColumns:"160px 1fr",gap:"6px 10px",alignItems:"center"}}>
              <label style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.85)",textAlign:"right"}}>ID Card No</label>
              <div style={{color:"white",fontSize:13,padding:"3px 8px"}}>{person.idCard}</div>
              {[["Surname","surname"],["Name","name"],["Supply Appointment Date","supplyApptDate"],["Regular Appointment date","regularApptDate"],["1st Progression","prog1Date"],["2nd Progression","prog2Date"]].map(([label,key])=>(
                <React.Fragment key={key}>
                  <label style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.85)",textAlign:"right"}}>{label}</label>
                  <input className="input" style={{color:"white",borderColor:"rgba(255,255,255,0.3)"}} value={pd[key]||""} onChange={e=>upd(key,e.target.value)}/>
                </React.Fragment>
              ))}
              <label style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.85)",textAlign:"right"}}>Designation</label>
              <select className="input" style={{color:"white",borderColor:"rgba(255,255,255,0.3)"}} value={pd.designation} onChange={e=>upd("designation",e.target.value)}>
                {LSE_DESIG.map(g=><option key={g}>{g}</option>)}
              </select>
              <label style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.85)",textAlign:"right"}}>Paypoint No</label>
              <select className="input" style={{color:"white",borderColor:"rgba(255,255,255,0.3)"}} value={pd.paypointNo} onChange={e=>upd("paypointNo",e.target.value)}>
                {PAYPOINTS.map(p=><option key={p}>{p}</option>)}
              </select>
              {[["Head of School","headOfSchool"],["School","school"],["E-Mail","email"],["CC E-Mail","ccEmail"]].map(([label,key])=>(
                <React.Fragment key={key}>
                  <label style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.85)",textAlign:"right"}}>{label}</label>
                  <input className="input" style={{color:"white",borderColor:"rgba(255,255,255,0.3)"}} value={pd[key]||""} onChange={e=>upd(key,e.target.value)}/>
                </React.Fragment>
              ))}
            </div>

            {/* RIGHT: scale + financials + service calc */}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"5px 8px",alignItems:"center"}}>
                <label style={{fontSize:12,color:"rgba(255,255,255,0.85)",fontWeight:600}}>From scale</label>
                <select className="input" style={{color:"white",borderColor:"rgba(255,255,255,0.3)",width:70}} value={pd.fromScale} onChange={e=>upd("fromScale",e.target.value)}>
                  {["13","12","11"].map(s=><option key={s}>{s}</option>)}
                </select>
                <label style={{fontSize:12,color:"rgba(255,255,255,0.85)",fontWeight:600}}>To Scale</label>
                <select className="input" style={{color:"white",borderColor:"rgba(255,255,255,0.3)",width:70}} value={pd.toScale} onChange={e=>upd("toScale",e.target.value)}>
                  {["12","11","10"].map(s=><option key={s}>{s}</option>)}
                </select>
                {[["From €","fromAmt"],["To €","toAmt"],["Increment €","increment"],["Class Allowance €","classAllow"],["Resource Allowance €","resourceAllow"]].map(([label,key])=>(
                  <React.Fragment key={key}>
                    <label style={{fontSize:11,color:"rgba(255,255,255,0.8)",fontWeight:600}}>{label}</label>
                    <input className="input" style={{color:"white",borderColor:"rgba(255,255,255,0.3)",width:80}} value={pd[key]||""} onChange={e=>upd(key,e.target.value)}/>
                  </React.Fragment>
                ))}
              </div>
              <button className="btn" style={{fontSize:11}}>View Grade Salaries</button>
              <CHK k="prog1Done" label="1st Prog done"/>
              <CHK k="prog2Done" label="2nd Prog done"/>
              <div style={{height:1,background:"rgba(255,255,255,0.2)",margin:"4px 0"}}/>
              <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"4px 8px",alignItems:"center"}}>
                {[["Mobility years","mobilityYrs"],["Total unpaid leave yrs","unpaidLeaveYrs"],["Supply service yrs","supplyYrs"],["Regular service yrs","regularYrs"],["Total service yrs","totalYrs"]].map(([label,key])=>(
                  <React.Fragment key={key}>
                    <label style={{fontSize:11,color:"rgba(255,255,255,0.75)"}}>{label}</label>
                    <input className="input" style={{color:"white",borderColor:"rgba(255,255,255,0.3)",width:72,fontSize:12}} value={pd[key]||""} onChange={e=>upd(key,e.target.value)}/>
                  </React.Fragment>
                ))}
              </div>
              <button className="btn primary" style={{fontSize:11}} onClick={()=>{
                const reg=pd.regularApptDate; if(!reg) return;
                const parts=reg.includes("/")?reg.split("/").reverse():reg.split("-");
                const base=new Date(parts.join("-"));
                const p1=new Date(base); p1.setFullYear(p1.getFullYear()+5);
                const p2=new Date(p1);   p2.setFullYear(p2.getFullYear()+5);
                upd("prog1Date",p1.toLocaleDateString("en-GB")); upd("prog2Date",p2.toLocaleDateString("en-GB"));
              }}>Calculate Progression Dates</button>
            </div>
          </div>

          {/* Progression tracking: 1st + 2nd */}
          {[["1st","prog1"],["2nd","prog2"]].map(([ord,pfx],pi)=>(
            (!pi || pd.prog1Done) && (
              <div key={pfx} style={{marginTop:12,borderTop:"1px solid rgba(255,255,255,0.2)",paddingTop:10,display:"flex",gap:14,alignItems:"flex-start",flexWrap:"wrap"}}>
                <div style={{color:"white",fontWeight:700,fontSize:13,minWidth:100}}>{ord}<br/>Progression</div>
                <div style={{background:"rgba(0,0,0,0.2)",borderRadius:6,padding:"8px 12px"}}>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.6)",marginBottom:5,fontWeight:600}}>Progression Report</div>
                  <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
                    <CHK k={pfx+"Sent"} label="Sent"/>
                    <div><label style={{fontSize:11,color:"rgba(255,255,255,0.7)"}}>Sent on </label><input type="date" className="input" style={{color:"white",borderColor:"rgba(255,255,255,0.3)",width:130,fontSize:11}} value={pd[pfx+"SentOn"]||""} onChange={e=>upd(pfx+"SentOn",e.target.value)}/></div>
                    <CHK k={pfx+"Received"} label="Received"/>
                  </div>
                </div>
                <div style={{background:"rgba(0,0,0,0.2)",borderRadius:6,padding:"8px 12px"}}>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.6)",marginBottom:5,fontWeight:600}}>SRS</div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    <CHK k={pfx+"SelectSRS"} label="Select to Send to SRS"/>
                    <CHK k={pfx+"SentSRS"}   label="Sent to SRS"/>
                  </div>
                </div>
              </div>
            )
          ))}

          {/* Action buttons */}
          <div style={{marginTop:12,borderTop:"1px solid rgba(255,255,255,0.2)",paddingTop:10,display:"flex",flexWrap:"wrap",gap:6}}>
            {[
              ["Close",                        ()=>setMode("menu"),       false],
              ["View Prog DB working History", ()=>setOverlay("history"), false],
              ["Get Service dates from PRS",   ()=>setOverlay("prs"),     false],
              ["Progress to SC 12",            ()=>{},                    true],
              ["View PRS",                     ()=>setOverlay("prs"),     false],
              ["View Letter to Person",        ()=>{},                    false],
              ["View Prog DB Unpaid Leave",    ()=>setOverlay("unpaid"),  false],
              ["Get Unpaid Leave from Leaves DB",()=>{},                  false],
              ["Progress to SC 11",            ()=>{ setLocalRecs(r=>[...r,{autoId:Date.now(),idCard:person.idCard,name:`${pd.name} ${pd.surname}`,salScale:"12",newSalScale:"11",sentToOfficer:true,approvedProgression:false,uploaded:false}]); }, false],
              ["Send Progression Report",      ()=>{},                    false],
              ["View Letter to Salaries",      ()=>{},                    false],
            ].map(([label,action,disabled],i)=>(
              <button key={i} className="btn" style={{fontSize:11,opacity:disabled?0.4:1}} disabled={disabled} onClick={action}>{label}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── PROGRESSIONS IN NEXT 3 MONTHS ─────────────────────────────────
  if (mode === "next-3-months") {
    const Sec = ({title,rows}) => (
      <div className="card" style={{marginBottom:14}}>
        <div className="card-head" >
          <h2 style={{color:"white"}}>{title}</h2><span className="tag pink">{rows.length}</span>
        </div>
        <div className="table-scroll" style={{maxHeight:200}}>
          <table className="table compact">
            <thead><tr><th>ID Card</th><th>Name</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {rows.map((r,i)=>(
                <tr key={i}><td className="id">{r.idCard}</td><td>{r.name}</td><td className="num">{r.date}</td>
                  <td><button className="btn xs" onClick={()=>{setPerson(lookup(r.idCard)||{idCard:r.idCard,name:r.name,surname:""});setMode("view-person");}}>View</button></td>
                </tr>
              ))}
              {rows.length===0&&<tr><td colSpan={4} className="muted" style={{padding:16,textAlign:"center"}}>No records</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
    return (
      <div>
        {backBtn()}
        <div style={{fontSize:15,fontWeight:600,marginBottom:12}}>Progressions in the next 3 months</div>
        <Sec title="1st Progression" rows={sample1st}/>
        <Sec title="2nd Progression" rows={sample2nd}/>
        <button className="btn" onClick={()=>setMode("menu")}>Close</button>
      </div>
    );
  }

  // ── ADD PERSON ─────────────────────────────────────────────────────
  if (mode === "add-person") {
    const af = addForm;
    const found = af.idCard.length>=6 ? lookup(af.idCard) : null;
    return (
      <div>
        {backBtn()}
        <div className="card" style={{maxWidth:500}}>
          <div className="card-head"><h2>Add Person — LSE/KGE I</h2></div>
          <div style={{padding:"16px 18px",background:"var(--panel-2)",borderTop:"1px solid var(--line-2)",display:"flex",flexDirection:"column",gap:10}}>
            {[["ID Card No","idCard"],["Surname","surname"],["Name","name"],["Supply Appointment Date","supplyApptDate"],["Regular Appointment date","regularApptDate"],["E-Mail","email"]].map(([label,key])=>(
              <div key={key} style={{display:"flex",alignItems:"center",gap:10}}>
                <label style={{width:180,fontSize:12,fontWeight:600,color:"white",textAlign:"right",flexShrink:0}}>{label}</label>
                <input className="input" style={{flex:1,color:"white",borderColor:"rgba(255,255,255,0.3)"}} value={af[key]||""} onChange={e=>updA(key,e.target.value)}/>
              </div>
            ))}
            {found && <div style={{fontSize:11,color:"#90cdf4",paddingLeft:190}}>Found: {found.name} {found.surname}</div>}
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <label style={{width:180,fontSize:12,fontWeight:600,color:"white",textAlign:"right",flexShrink:0}}>Designation</label>
              <select className="input" style={{flex:1,color:"white",borderColor:"rgba(255,255,255,0.3)"}} value={af.designation||""} onChange={e=>updA("designation",e.target.value)}>
                <option value=""/>{LSE_DESIG.map(g=><option key={g}>{g}</option>)}
              </select>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <label style={{width:180,fontSize:12,fontWeight:600,color:"white",textAlign:"right",flexShrink:0}}>Paypoint No</label>
              <select className="input" style={{flex:1,color:"white",borderColor:"rgba(255,255,255,0.3)"}} value={af.paypointNo||""} onChange={e=>updA("paypointNo",e.target.value)}>
                <option value=""/>{PAYPOINTS.map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{padding:"12px 18px",borderTop:"1px solid var(--line-2)",display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button className="btn" onClick={()=>setMode("menu")}>Don't Save and Close</button>
            <button className="btn primary" disabled={!af.idCard} onClick={()=>{setLocalRecs(r=>[...r,{autoId:Date.now(),idCard:af.idCard,name:`${af.name} ${af.surname}`.trim(),designation:af.designation,sentToOfficer:false,approvedProgression:false,uploaded:false}]);setAddForm({idCard:"",surname:"",name:"",supplyApptDate:"",regularApptDate:"",designation:"",paypointNo:"",email:""});setMode("menu");}}>Save and Close</button>
          </div>
        </div>
      </div>
    );
  }

  // ── STUBS ──────────────────────────────────────────────────────────
  if (mode === "view-prs-main") return (
    <div>{backBtn()}<div className="card"><div className="card-head"><h2>View PRS — LSE/KGE I</h2></div>
      <div className="table-scroll"><table className="table compact">
        <thead><tr><th>ID Card</th><th>Surname</th><th>Name</th><th>Grade</th><th>Scale</th><th>Salary</th><th>Paypoint</th></tr></thead>
        <tbody>{D.PEOPLE.slice(0,20).map((p,i)=><tr key={i}><td className="id">{p.idCard}</td><td>{p.surname}</td><td>{p.name}</td><td className="muted xs">{p.gradeDesc}</td><td className="mono">{p.salScale}</td><td className="num">€{p.presentSalary?.toLocaleString()}</td><td className="muted xs">{p.paypointDesc}</td></tr>)}</tbody>
      </table></div><div className="card-foot muted xs">First 20 of {D.PEOPLE.length} PRS records.</div>
    </div></div>
  );

  if (mode === "prog-history") return (
    <div>{backBtn()}<div className="card"><div className="card-head"><h2>Person Progression History</h2></div>
      <div className="table-scroll"><table className="table compact">
        <thead><tr><th>ID Card</th><th>Name</th><th>Scale</th><th>→</th><th>WEF</th><th>1st Done</th><th>2nd Done</th><th>Status</th></tr></thead>
        <tbody>{localRecs.slice(0,20).map((r,i)=><tr key={i}><td className="id">{r.idCard}</td><td>{r.name||"—"}</td><td className="mono">{r.salScale}</td><td className="mono">{r.newSalScale||"—"}</td><td className="num">{r.fromDate||"—"}</td><td>{r.prog1Done?<span className="check">✓</span>:<span className="muted">—</span>}</td><td>{r.prog2Done?<span className="check">✓</span>:<span className="muted">—</span>}</td><td><ApprovalPill compact sent={r.sentToOfficer} approved={r.approvedProgression} uploaded={r.uploaded}/></td></tr>)}
        {localRecs.length===0&&<tr><td colSpan={8} className="muted" style={{padding:20,textAlign:"center"}}>No records</td></tr>}</tbody>
      </table></div>
    </div></div>
  );

  if (mode === "view-unpaid-main") return (
    <div>{backBtn()}<div className="card" style={{maxWidth:600}}><div className="card-head"><h2>View Person Unpaid Leave</h2></div>
      <div style={{padding:"10px 14px",borderBottom:"1px solid var(--line-2)"}}><input className="input" placeholder="Enter ID Card…" style={{width:200}} onChange={e=>setSearchId(e.target.value)}/></div>
      <table className="table compact"><thead><tr><th>Type</th><th>Description</th><th>Start</th><th>End</th><th>Years</th></tr></thead>
        <tbody>{unpaidRows.map((r,i)=><tr key={i}><td>{r.type}</td><td>{r.desc}</td><td className="num">{r.start}</td><td className="num">{r.end}</td><td className="mono">{r.years}</td></tr>)}</tbody>
      </table>
    </div></div>
  );

  if (mode === "no-letters") {
    const nl = localRecs.filter(r=>r.sentToOfficer&&!r.approvedProgression);
    return <div>{backBtn()}<div className="card"><div className="card-head"><h2>Progression letters not received</h2><span className={"tag "+(nl.length>0?"red":"green")}>{nl.length}</span></div>
      <table className="table compact"><thead><tr><th>ID Card</th><th>Name</th><th>Scale</th><th>WEF</th><th></th></tr></thead>
        <tbody>{nl.length>0?nl.map((r,i)=><tr key={i}><td className="id">{r.idCard}</td><td>{r.name||"—"}</td><td className="mono">{r.salScale}</td><td className="num">{r.fromDate}</td><td><button className="btn xs">Resend</button></td></tr>):<tr><td colSpan={5} className="muted" style={{padding:20,textAlign:"center"}}>No outstanding letters</td></tr>}</tbody>
      </table></div></div>;
  }

  if (mode === "send-srs") {
    const ts = localRecs.filter(r=>(r.prog1SelectSRS||r.prog2SelectSRS)&&!r.prog1SentSRS);
    return <div>{backBtn()}<div className="card"><div className="card-head"><h2>Send all marked to SRS</h2><span className={"tag "+(ts.length>0?"amber":"green")}>{ts.length} ready</span></div>
      <table className="table compact"><thead><tr><th>ID Card</th><th>Name</th><th>Scale</th><th>Progression</th><th></th></tr></thead>
        <tbody>{ts.length>0?ts.map((r,i)=><tr key={i}><td className="id">{r.idCard}</td><td>{r.name||"—"}</td><td className="mono">{r.salScale}</td><td><span className="tag blue">{r.prog1Done?"2nd":"1st"}</span></td><td><button className="btn xs primary" onClick={()=>setLocalRecs(rs=>rs.map(x=>x===r?{...x,prog1SentSRS:true}:x))}>Send</button></td></tr>):<tr><td colSpan={5} className="muted" style={{padding:20,textAlign:"center"}}>No records marked for SRS</td></tr>}</tbody>
      </table>
      {ts.length>0&&<div style={{padding:12,textAlign:"right"}}><button className="btn primary" onClick={()=>setLocalRecs(rs=>rs.map(r=>({...r,prog1SentSRS:true})))}>Send All</button></div>}
    </div></div>;
  }

  if (mode === "maintenance") return (
    <div>{backBtn()}<div className="card" style={{maxWidth:420}}><div className="card-head"><h2>Maintenance</h2></div>
      <div style={{padding:14,display:"flex",flexDirection:"column",gap:8}}>
        {["Update Grade Details (Scale 13→12→11)","Update Salary Scales","Manage Class Allowance Rates","Manage Resource Allowance Rates","Edit Leave Types","Edit Paypoints","Compact & Repair Database"].map((item,i)=><button key={i} className="btn" style={{textAlign:"left"}}>{item}</button>)}
      </div></div></div>
  );

  return null;
}

// ─────────────────────────────────────────────────────────────────
// EO / HoS / HoD / DHoS — senior education progressions
// ─────────────────────────────────────────────────────────────────
function EOHoSProgressions() {
  const [mode, setMode]             = useState("menu");
  const { setView } = useApp();
  const [searchType, setSearchType] = useState("idCard"); // idCard|name|surname
  const [searchIdCard, setSearchIdCard] = useState("");
  const [searchName, setSearchName]     = useState("");
  const [searchSurname, setSearchSurname] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("Deputy Head of School");
  const [selected, setSelected]     = useState(null);
  const [localRecs, setLocalRecs]   = useState(() => (X?.PROG_EO_HOS || []).slice());

  const GRADES = ["Education Officer","Head of School","Deputy Head of School","Head Of Department"];
  const today2025plus3mo = "2025-12-31";
  const today2025 = "2025-09-30";

  const upd = (autoId, patch) => {
    setLocalRecs(rs => rs.map(r => r.autoId === autoId ? {...r, ...patch} : r));
    if (selected && selected.autoId === autoId) setSelected(s => ({...s, ...patch}));
  };
  const lookupEO = (ic) => localRecs.find(r => r.idCard.toLowerCase() === ic.toLowerCase().trim());
  const backBtn = (label="← Main Menu", target="menu") => (
    <button className="btn ghost" style={{marginBottom:14}} onClick={()=>setMode(target)}>{label}</button>
  );

  // ── MENU ──────────────────────────────────────────────────────
  if (mode === "menu") {
    const ACTIONS = [
      {id:"dakar-import",  icon:"↓", label:"Import Excel from DAKAR",                 desc:"Pull senior-staff candidates from the Dakar export"},
      {id:"view-by-grade", icon:"▦", label:"View by Grade",                            desc:"Filter by EO / HoS / DHoS / HoD"},
      {id:"view-all",      icon:"≡", label:"View All Grades",                          desc:`Browse all ${localRecs.length} senior-track candidates`},
      {id:"next-3-months", icon:"📅",label:"Progressions in the next 3 months",        desc:"Outbound queue sorted by effective date"},
      {id:"no-reply",      icon:"⊠", label:"Reports sent but no reply received",      desc:"Sent but reply pending"},
      {id:"view-person",   icon:"⌕", label:"View Person's Progression Data",          desc:"Look up by ID card, name or surname"},
      {id:"send-dg",       icon:"▶", label:"Send to DG",                               desc:"Forward batch for DG sign-off"},
      {id:"add-person",    icon:"+", label:"Add Person",                               desc:"Manually add a candidate"},
      {id:"reports",       icon:"▤", label:"Reports",                                  desc:"Standard report pack"},
      {id:"maintenance",   icon:"⚙", label:"Maintenance",                              desc:"Lookups, clause text, cleanup"},
    ];
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <div className="crumbs">Progressions · EO / HoS</div>
            <h1>Progressions — DHOS, EO, HOD, HOS</h1>
            <p className="page-sub">Senior education positions. Two simultaneous conditions: total years in the Education Class + years specifically in the senior grade.</p>
          </div>
          <div className="page-actions">
            <button className="btn primary" onClick={()=>setMode("view-all")}>View all grades</button>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Actions</h2></div>
          <div className="card-body" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:10}}>
            {ACTIONS.map(a => (
              <button key={a.id} className="action-card" onClick={()=>{ if(a.id==="view-prs"||a.id==="view-prs-main"){ setView("prs-view"); } else { setMode(a.id); } }}>
                <span className="ac-ico">{a.icon}</span>
                <span className="ac-content">
                  <span className="ac-title">{a.label}</span>
                  <span className="ac-desc">{a.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── PERSON DETAIL FORM (matches the big Person_Details screen) ─
  if (mode === "person-detail" && selected) {
    const c = selected;
    return (
      <div className="page">
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
          <button className="btn ghost" onClick={()=>setMode("menu")}>← Main Menu</button>
          <h1 style={{margin:0,fontSize:18}}>Person Details</h1>
          <div style={{flex:1}}/>
          <span className="muted xs">Service data last updated · Unpaid leave last updated</span>
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}><input type="checkbox" checked={!!c.resigned} onChange={e=>upd(c.autoId,{resigned:e.target.checked})}/>Resigned</label>
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}><input type="checkbox" checked={!!c.detailed} onChange={e=>upd(c.autoId,{detailed:e.target.checked})}/>Detailed</label>
        </div>

        <div className="dossier-header">
          <div className="dossier-id-block">
            <div className="dossier-name">{c.title} {c.firstName} {c.surname}</div>
            <div className="dossier-meta">
              <span><strong>ID Card:</strong> {c.idCard}</span>
              <span><strong>Grade:</strong> {c.gradeDesc}</span>
              <span><strong>Scale:</strong> {c.scaleCode}</span>
              <span><strong>Pay Point:</strong> {c.paypointDesc}</span>
              <span><strong>HoS:</strong> {c.hosName}</span>
            </div>
          </div>
        </div>

        <div className="split" style={{alignItems:"flex-start"}}>
          {/* Left column — identity + employment */}
          <div className="card">
            <div className="card-head"><h2>Identity &amp; Employment</h2></div>
            <div className="card-body">
              <div className="form-row"><label>ID Card no</label><span className="id mono">{c.idCard}</span></div>
              <div className="form-row"><label>Title</label><input className="input" value={c.title||""} onChange={e=>upd(c.autoId,{title:e.target.value})}/></div>
              <div className="form-row"><label>Name</label><input className="input" value={c.firstName||""} onChange={e=>upd(c.autoId,{firstName:e.target.value})}/></div>
              <div className="form-row"><label>Surname</label><input className="input" value={c.surname||""} onChange={e=>upd(c.autoId,{surname:e.target.value})}/></div>
              <div className="form-row"><label>Gender</label><input className="input" value={c.gender||""} onChange={e=>upd(c.autoId,{gender:e.target.value})}/></div>
              <div className="form-row"><label>E-mail</label><input className="input" value={c.email||""} onChange={e=>upd(c.autoId,{email:e.target.value})}/></div>
              <div className="form-row"><label>Grade Description</label>
                <select className="input" title="Grade" value={c.gradeDesc||""} onChange={e=>upd(c.autoId,{gradeDesc:e.target.value})}>
                  {GRADES.map(g=><option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-row"><label>Scale Code</label><input className="input" value={c.scaleCode||""} onChange={e=>upd(c.autoId,{scaleCode:e.target.value})}/></div>
              <div className="form-row"><label>Mobile Phones</label><input className="input" value={c.mobile||""} onChange={e=>upd(c.autoId,{mobile:e.target.value})}/></div>
              <div className="form-row"><label>Office Phones</label><input className="input" value={c.officePhone||""} onChange={e=>upd(c.autoId,{officePhone:e.target.value})}/></div>
              <div className="form-row"><label>Progression date</label><input type="date" className="input" value={c.progressionDate||""} onChange={e=>upd(c.autoId,{progressionDate:e.target.value})}/></div>
              <div className="form-row"><label>No of progressions taken</label><input type="number" className="input" value={c.noOfProgressionsTaken||0} onChange={e=>upd(c.autoId,{noOfProgressionsTaken:Number(e.target.value)})}/></div>
              <div className="form-row"><label>Paypoint</label><input className="input" value={c.paypoint||""} onChange={e=>upd(c.autoId,{paypoint:e.target.value})}/></div>
              <div className="form-row"><label>Pay point description</label><input className="input" value={c.paypointDesc||""} onChange={e=>upd(c.autoId,{paypointDesc:e.target.value})}/></div>
              <div className="form-row"><label>HoS / Senior / Head</label><input className="input" value={c.hosName||""} onChange={e=>upd(c.autoId,{hosName:e.target.value})}/></div>
              <div className="form-row"><label>HoS / Head E-mail</label><input className="input" value={c.hosEmail||""} onChange={e=>upd(c.autoId,{hosEmail:e.target.value})}/></div>
              <div className="form-row"><label>Grade (of head)</label><input className="input" value={c.headGrade||""} onChange={e=>upd(c.autoId,{headGrade:e.target.value})}/></div>
              <div className="form-row"><label>Main office</label><input className="input" value={c.mainOffice||""} onChange={e=>upd(c.autoId,{mainOffice:e.target.value})}/></div>
            </div>
          </div>

          {/* Right column — service in years + dates + clauses + allowances */}
          <div className="col-flex">
            <div className="card">
              <div className="card-head"><h2>Service in Years</h2></div>
              <div className="card-body">
                {[["Mobility","mobilityYears"],["Unpaid Leave as Supply","unpaidSupplyYrs"],["Unpaid Leave as Teacher","unpaidTeacherYrs"],["Unpaid leave in the Grade","unpaidGradeYrs"],["Total years Supply","totalYearsSupply"],["Total years Teacher","totalYearsTeacher"],["Total years in the grade","totalYearsGrade"],["Actual Years for Progression","actualYearsForProgression"]].map(([l,k])=>(
                  <div key={k} className="form-row"><label>{l}</label><input type="number" className="input" value={c[k]||0} onChange={e=>upd(c.autoId,{[k]:Number(e.target.value)})}/></div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-head"><h2>Dates</h2></div>
              <div className="card-body">
                <div className="form-row"><label>Start date as Supply</label><input type="date" className="input" value={c.startDateAsSupply||""} onChange={e=>upd(c.autoId,{startDateAsSupply:e.target.value})}/></div>
                <div className="form-row"><label>Start date as Teacher</label><input type="date" className="input" value={c.startDateAsTeacher||""} onChange={e=>upd(c.autoId,{startDateAsTeacher:e.target.value})}/></div>
                <div className="form-row"><label>Start date in the Grade</label><input type="date" className="input" value={c.startDateInGrade||""} onChange={e=>upd(c.autoId,{startDateInGrade:e.target.value})}/></div>
                <button className="btn sm primary" style={{marginTop:6}}>Calculate Progression Dates</button>
              </div>
            </div>

            <div className="card">
              <div className="card-head"><h2>From / To Scale &amp; Clauses</h2></div>
              <div className="card-body">
                <div className="form-row"><label>From Scale</label><input type="number" className="input" value={c.fromScale||0} onChange={e=>upd(c.autoId,{fromScale:Number(e.target.value)})}/></div>
                <div className="form-row"><label>To Scale</label><input type="number" className="input" value={c.toScale||0} onChange={e=>upd(c.autoId,{toScale:Number(e.target.value)})}/></div>
                <div className="form-row"><label>Clauses</label><input className="input" value={c.clauses||""} onChange={e=>upd(c.autoId,{clauses:e.target.value})}/></div>
                <div className="form-row top"><label>Clause text</label><textarea className="input" rows={3} style={{resize:"vertical"}} value={c.clauseText||""} onChange={e=>upd(c.autoId,{clauseText:e.target.value})}/></div>
                <button className="btn sm">Get Salary and Allowance</button>
              </div>
            </div>

            <div className="card">
              <div className="card-head"><h2>Allowances &amp; Salary</h2></div>
              <div className="card-body">
                <div className="form-row"><label>Class Allowance</label><input type="number" className="input" value={c.classAllowance||0} onChange={e=>upd(c.autoId,{classAllowance:Number(e.target.value)})}/></div>
                <div className="form-row"><label>Responsibility Allowance</label><input type="number" className="input" value={c.responsibilityAllowance||0} onChange={e=>upd(c.autoId,{responsibilityAllowance:Number(e.target.value)})}/></div>
                <div className="form-row"><label>Work Resource Allowance</label><input type="number" className="input" value={c.workResourceAllowance||0} onChange={e=>upd(c.autoId,{workResourceAllowance:Number(e.target.value)})}/></div>
                <div className="form-row"><label>Salary</label><input type="number" className="input" value={c.salary||0} onChange={e=>upd(c.autoId,{salary:Number(e.target.value)})}/></div>
              </div>
            </div>

            <div className="card">
              <div className="card-head"><h2>Progression workflow</h2></div>
              <div className="card-body" style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13}}><input type="checkbox" checked={!!c.progressionReportSent} onChange={e=>upd(c.autoId,{progressionReportSent:e.target.checked})}/>Progression report sent</label>
                <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13}}><input type="checkbox" checked={!!c.progressionReportReceived} onChange={e=>upd(c.autoId,{progressionReportReceived:e.target.checked})}/>Progression report received</label>
                <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13}}><input type="checkbox" checked={!!c.progressionDone} onChange={e=>upd(c.autoId,{progressionDone:e.target.checked})}/>Progression done</label>
                <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13}}><input type="checkbox" checked={!!c.prsUpdated} onChange={e=>upd(c.autoId,{prsUpdated:e.target.checked})}/>PRS Updated</label>
                <button className="btn sm primary" style={{marginTop:6,alignSelf:"flex-start"}}>Update PRS</button>
                <div className="form-row top"><label>Comments</label><textarea className="input" rows={3} style={{resize:"vertical"}} value={c.comments||""} onChange={e=>upd(c.autoId,{comments:e.target.value})}/></div>
              </div>
            </div>
          </div>
        </div>

        <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>
          <button className="btn" onClick={()=>setMode("menu")}>Close</button>
          <button className="btn">View Service Dates in Prog DB</button>
          <button className="btn">Get Service Dates from PRS</button>
          <button className="btn">View Letter To Person</button>
          <button className="btn primary">Send Progression Report</button>
          <button className="btn">Print Details</button>
          <button className="btn">View original PRS</button>
          <button className="btn">View Unpaid Leave in Prog DB</button>
          <button className="btn">Get Unpaid Leave from Leaves DB</button>
          <button className="btn">View Letter To Salaries</button>
          <button className="btn">View Agreement Details</button>
        </div>
      </div>
    );
  }

  // ── VIEW PERSON LOOKUP (ID / Name / Surname with radio) ───────
  if (mode === "view-person") {
    const doSearch = () => {
      const all = localRecs;
      let found = null;
      if (searchType === "idCard")  found = all.find(r => r.idCard.toLowerCase() === searchIdCard.toLowerCase().trim());
      if (searchType === "name")    found = all.find(r => (r.firstName||"").toLowerCase() === searchName.toLowerCase().trim());
      if (searchType === "surname") found = all.find(r => (r.surname||"").toLowerCase() === searchSurname.toLowerCase().trim());
      if (found) { setSelected(found); setMode("person-detail"); }
    };
    return (
      <div className="page">
        {backBtn()}
        <div className="card" style={{maxWidth:480}}>
          <div className="card-head"><h2>Person's Details</h2></div>
          <div className="card-body">
            <div style={{display:"grid",gridTemplateColumns:"24px 1fr",gap:10,alignItems:"center",marginBottom:14}}>
              <input type="radio" name="seType" checked={searchType==="idCard"} onChange={()=>setSearchType("idCard")}/>
              <div>
                <div style={{fontSize:12,fontWeight:700,marginBottom:4}}>Insert ID Card</div>
                <input className="input" value={searchIdCard} onChange={e=>setSearchIdCard(e.target.value)} onFocus={()=>setSearchType("idCard")}/>
              </div>
              <input type="radio" name="seType" checked={searchType==="name"} onChange={()=>setSearchType("name")}/>
              <div>
                <div style={{fontSize:12,fontWeight:700,marginBottom:4}}>Insert Name</div>
                <input className="input" value={searchName} onChange={e=>setSearchName(e.target.value)} onFocus={()=>setSearchType("name")}/>
              </div>
              <input type="radio" name="seType" checked={searchType==="surname"} onChange={()=>setSearchType("surname")}/>
              <div>
                <div style={{fontSize:12,fontWeight:700,marginBottom:4}}>Insert Surname</div>
                <input className="input" value={searchSurname} onChange={e=>setSearchSurname(e.target.value)} onFocus={()=>setSearchType("surname")}/>
              </div>
            </div>
          </div>
          <div className="card-foot">
            <button className="btn" onClick={()=>setMode("menu")}>Close</button>
            <button className="btn primary" onClick={doSearch}>View</button>
          </div>
        </div>
      </div>
    );
  }

  // ── VIEW BY GRADE ─────────────────────────────────────────────
  if (mode === "view-by-grade") {
    const rows = localRecs.filter(r => r.gradeDesc === selectedGrade);
    return (
      <div className="page">
        {backBtn()}
        <div className="card" style={{maxWidth:560,marginBottom:14}}>
          <div className="card-head"><h2>View by Grade</h2></div>
          <div className="card-body">
            <div className="form-row"><label>Select Grade</label>
              <select className="input" title="Grade" value={selectedGrade} onChange={e=>setSelectedGrade(e.target.value)}>
                {GRADES.map(g=><option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Grade — {selectedGrade} ({rows.length})</h2></div>
          <table className="table compact">
            <thead><tr><th>ID Card</th><th>Name</th><th>Progression Date</th><th>Employment Date</th><th>Appointment Date</th><th></th></tr></thead>
            <tbody>{rows.length>0 ? rows.map(c=>(
              <tr key={c.autoId}>
                <td className="id">{c.idCard}</td>
                <td>{c.firstName} {c.surname}</td>
                <td className="num">{c.progressionDate||"—"}</td>
                <td className="num">{c.employmentDate}</td>
                <td className="num">{c.appointmentDate}</td>
                <td><button className="btn xs" onClick={()=>{setSelected(c);setMode("person-detail");}}>View</button></td>
              </tr>
            )) : <tr><td colSpan={6} className="muted" style={{padding:"16px",textAlign:"center"}}>No candidates in this grade.</td></tr>}</tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── VIEW ALL GRADES ───────────────────────────────────────────
  if (mode === "view-all") {
    return (
      <div className="page">
        {backBtn()}
        <div className="card">
          <div className="card-head"><h2>View All Grades ({localRecs.length})</h2><div className="right"><button className="btn sm">Export</button></div></div>
          <div className="table-scroll">
            <table className="table compact">
              <thead><tr><th>ID Card</th><th>Name</th><th>Grade</th><th>Scale</th><th>Progression Date</th><th>Employment Date</th><th>Appointment Date</th><th>Workflow</th><th></th></tr></thead>
              <tbody>{localRecs.map(c=>(
                <tr key={c.autoId}>
                  <td className="id">{c.idCard}</td>
                  <td>{c.firstName} {c.surname}</td>
                  <td className="muted xs">{c.gradeDesc}</td>
                  <td className="mono">{c.fromScale}→{c.toScale}</td>
                  <td className="num">{c.progressionDate||"—"}</td>
                  <td className="num">{c.employmentDate}</td>
                  <td className="num">{c.appointmentDate}</td>
                  <td>{c.prsUpdated?<span className="tag green">PRS</span>:c.progressionReportReceived?<span className="tag blue">Recvd</span>:c.progressionReportSent?<span className="tag amber">Sent</span>:<span className="tag gray">—</span>}</td>
                  <td><button className="btn xs" onClick={()=>{setSelected(c);setMode("person-detail");}}>View</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ── PROGRESSIONS IN THE NEXT 3 MONTHS ─────────────────────────
  if (mode === "next-3-months") {
    const upcoming = localRecs.filter(r => r.progressionDate && r.progressionDate >= today2025 && r.progressionDate <= today2025plus3mo)
                              .sort((a,b)=>(a.progressionDate||"").localeCompare(b.progressionDate||""));
    return (
      <div className="page">
        {backBtn()}
        <div className="card">
          <div className="card-head"><h2>Progressions in the next 3 months ({upcoming.length})</h2></div>
          <table className="table compact">
            <thead><tr><th>ID Card</th><th>Name</th><th>Grade</th><th>Progression date</th><th></th></tr></thead>
            <tbody>{upcoming.length>0 ? upcoming.map(c=>(
              <tr key={c.autoId}>
                <td className="id">{c.idCard}</td>
                <td>{c.firstName} {c.surname}</td>
                <td>{c.gradeDesc}</td>
                <td className="num">{c.progressionDate}</td>
                <td><button className="btn xs" onClick={()=>{setSelected(c);setMode("person-detail");}}>View</button></td>
              </tr>
            )) : <tr><td colSpan={5} className="muted" style={{padding:"16px",textAlign:"center"}}>No upcoming progressions in the next 3 months.</td></tr>}</tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── REPORTS SENT BUT NO REPLY RECEIVED ────────────────────────
  if (mode === "no-reply") {
    const rows = localRecs.filter(r => r.progressionReportSent && !r.progressionReportReceived);
    return (
      <div className="page">
        {backBtn()}
        <div className="card">
          <div className="card-head"><h2>Reports sent but no reply received ({rows.length})</h2></div>
          <table className="table compact">
            <thead><tr><th>ID Card</th><th>Name</th><th>Grade</th><th>Sent</th><th></th></tr></thead>
            <tbody>{rows.length>0 ? rows.map(c=>(
              <tr key={c.autoId}>
                <td className="id">{c.idCard}</td>
                <td>{c.firstName} {c.surname}</td>
                <td>{c.gradeDesc}</td>
                <td><span className="tag amber">Sent</span></td>
                <td><button className="btn xs" onClick={()=>{setSelected(c);setMode("person-detail");}}>View</button></td>
              </tr>
            )) : <tr><td colSpan={5} className="muted" style={{padding:"16px",textAlign:"center"}}>All replies received.</td></tr>}</tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── PLACEHOLDERS for remaining actions ────────────────────────
  if (["dakar-import","send-dg","add-person","reports","maintenance"].includes(mode)) {
    const titles = {
      "dakar-import": "Import Excel from DAKAR",
      "send-dg":      "Send to DG",
      "add-person":   "Add Person",
      "reports":      "Reports",
      "maintenance":  "Maintenance",
    };
    return (
      <div className="page">
        {backBtn()}
        <div className="card" style={{maxWidth:520}}>
          <div className="card-head"><h2>{titles[mode]}</h2></div>
          <div className="card-body muted xs">This step is wired to the underlying queries and lookups. UI placeholder.</div>
          <div className="card-foot"><button className="btn" onClick={()=>setMode("menu")}>Close</button></div>
        </div>
      </div>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────
// LSE / KGE — by Qualification — qualification-driven progression
// ─────────────────────────────────────────────────────────────────
function LSEQualProgressions() {
  const [mode, setMode]           = useState("menu");
  const { setView } = useApp();
  const [filterType, setFilterType] = useState("Submitted");
  const [selected, setSelected]   = useState(null);
  const [searchQ, setSearchQ]     = useState("");
  const [sortBy, setSortBy]       = useState("submission-desc");
  const [localRecs, setLocalRecs] = useState(() => (X?.PROG_LSE_QUAL || []).slice());

  const QUAL_OPTIONS = [
    {id:1, label:"KGE/LSE Degree MQF Level 6 (min 180 ECTS) Scale 9/8",                  mqf:"MQF 6", fromSc:10, toSc:8},
    {id:2, label:"KGE/LSE Degree MQF Level 6 and more than 5 Years",                     mqf:"MQF 6", fromSc:10, toSc:8},
    {id:3, label:"KGE/LSE Degree MQF Level 6 and more than 15 Years",                    mqf:"MQF 6", fromSc:10, toSc:7},
    {id:4, label:"KGE/LSE Diploma MQF Level 5 (min 60 ECTS) Scale 11/10/9",              mqf:"MQF 5", fromSc:11, toSc:9},
    {id:5, label:"KGE/LSE Diploma MQF Level 5 (min 60 ECTS) and more than 5 years",      mqf:"MQF 5", fromSc:11, toSc:10},
    {id:6, label:"KGE/LSE Diploma MQF Level 5 (min 60 ECTS) and more than 15 years",     mqf:"MQF 5", fromSc:11, toSc:9},
  ];

  const upd = (autoId, patch) => {
    setLocalRecs(rs => rs.map(r => r.autoId === autoId ? {...r, ...patch} : r));
    if (selected && selected.autoId === autoId) setSelected(s => ({...s, ...patch}));
  };
  const updBand = (autoId, band, patch) => {
    setLocalRecs(rs => rs.map(r => r.autoId === autoId ? {...r, [band]:{...r[band], ...patch}} : r));
    if (selected && selected.autoId === autoId) setSelected(s => ({...s, [band]:{...s[band], ...patch}}));
  };
  const backBtn = (label="← Main Menu", target="menu") => (
    <button className="btn ghost" style={{marginBottom:14}} onClick={()=>setMode(target)}>{label}</button>
  );

  // ── MENU ──────────────────────────────────────────────────────
  if (mode === "menu") {
    const ACTIONS = [
      {id:"import",       icon:"↓", label:"Import Excel From Workflow",  desc:"Pull qualification-progression applications from the workflow system"},
      {id:"view-prs",     icon:"▤", label:"View PRS",                     desc:"Browse linked PRS records"},
      {id:"unaudited",    icon:"⚠", label:"Un-Audited Applications",       desc:"Applications submitted but not yet audited"},
      {id:"view-promo",   icon:"⌕", label:"View Person Promotion Details", desc:"Look up a candidate's qualification-driven promotion"},
      {id:"all-apps",     icon:"≡", label:"All Applications",              desc:`Browse all ${localRecs.length} applications by type`},
      {id:"send-srs",     icon:"▶", label:"View to Send to SRS",           desc:"Marked applications ready for SRS dispatch"},
      {id:"edit-person",  icon:"✎", label:"Edit Person's Details",         desc:"Update qualification, ECTS, awarding body"},
      {id:"search-db",    icon:"⌖", label:"Search Database",                desc:"Free-text search across all applications"},
      {id:"maintenance",  icon:"⚙", label:"Maintenance",                   desc:"Lookups, awarding-body list, cleanup"},
    ];
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <div className="crumbs">Progressions · LSE/KGE by Qualification</div>
            <h1>Progression — LSE/KGE by Qualification</h1>
            <p className="page-sub">Triggered by gaining an MQF 6 / MQF 5 qualification — moves an LSE/KGE educator across sub-grades. Qualification recognition is the condition, not service years alone.</p>
          </div>
          <div className="page-actions">
            <button className="btn" onClick={()=>setMode("import")}>Import from Workflow</button>
            <button className="btn primary" onClick={()=>setMode("unaudited")}>Un-audited inbox</button>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Actions</h2></div>
          <div className="card-body" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:10}}>
            {ACTIONS.map(a => (
              <button key={a.id} className="action-card" onClick={()=>{ if(a.id==="view-prs"||a.id==="view-prs-main"){ setView("prs-view"); } else { setMode(a.id); } }}>
                <span className="ac-ico">{a.icon}</span>
                <span className="ac-content">
                  <span className="ac-title">{a.label}</span>
                  <span className="ac-desc">{a.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── PERSON DETAIL (big form) ──────────────────────────────────
  if (mode === "person-detail" && selected) {
    const c = selected;
    return (
      <div className="page">
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
          <button className="btn ghost" onClick={()=>setMode("menu")}>← Main Menu</button>
          <h1 style={{margin:0,fontSize:18}}>{c.firstName} {c.surname} — {c.idCard}</h1>
          <div style={{flex:1}}/>
          {c.sentToSRS && <span className="tag green">Sent To SRS</span>}
        </div>

        <div className="split" style={{alignItems:"flex-start"}}>
          {/* Left column — Submission + Qualification metadata */}
          <div className="card">
            <div className="card-head"><h2>Submission &amp; Qualification</h2></div>
            <div className="card-body">
              <div className="form-row"><label>Submission Date</label><input type="date" className="input" value={c.submissionDate||""} onChange={e=>upd(c.autoId,{submissionDate:e.target.value})}/></div>
              <div className="form-row"><label>Grade</label>
                <select className="input" title="Grade" value={c.grade||""} onChange={e=>upd(c.autoId,{grade:e.target.value})}>
                  {["KGE10","KGE11","LSE10","LSE11"].map(g=><option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-row"><label>Generic Grade</label><input className="input" value={c.genericGrade||""} onChange={e=>upd(c.autoId,{genericGrade:e.target.value})}/></div>
              <div className="form-row top"><label>Qualification Title</label><textarea className="input" rows={2} style={{resize:"vertical"}} value={c.qualificationTitle||""} onChange={e=>upd(c.autoId,{qualificationTitle:e.target.value})}/></div>
              <div className="form-row top"><label>Qualification</label><textarea className="input" rows={2} style={{resize:"vertical"}} value={c.qualification||""} readOnly/></div>
              <div className="form-row"><label>Awarding Body</label>
                <select className="input" title="Awarding Body" value={c.awardingBody||""} onChange={e=>upd(c.autoId,{awardingBody:e.target.value})}>
                  {["CC Education Academy","University of Malta","MCAST","Institute for Education","ETC","Foreign University"].map(b=><option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-row"><label>Transcript Date</label><input type="date" className="input" value={c.transcriptDate||""} onChange={e=>upd(c.autoId,{transcriptDate:e.target.value})}/></div>
              <div className="form-row"><label>Submission Reference No</label><input className="input" value={c.submissionRefNo||""} onChange={e=>upd(c.autoId,{submissionRefNo:e.target.value})}/></div>
              <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,padding:"4px 0"}}><input type="checkbox" checked={!!c.markToSendToSRS} onChange={e=>upd(c.autoId,{markToSendToSRS:e.target.checked})}/>Mark to Send To SRS</label>
              <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,padding:"4px 0"}}><input type="checkbox" checked={!!c.insertedInPRS} onChange={e=>upd(c.autoId,{insertedInPRS:e.target.checked})}/>Inserted in PRS</label>
              <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,padding:"4px 0"}}><input type="checkbox" checked={!!c.audited} onChange={e=>upd(c.autoId,{audited:e.target.checked})}/>Audited</label>
            </div>
          </div>

          {/* Right column — Dates + Qualification radios + scale + bands */}
          <div className="col-flex">
            <div className="card">
              <div className="card-head"><h2>Effective dates &amp; Pay calculation</h2></div>
              <div className="card-body">
                <div className="form-row"><label>With Effect From</label><input type="date" className="input" value={c.wef||""} onChange={e=>upd(c.autoId,{wef:e.target.value})}/></div>
                <div className="form-row"><label>Mobility</label><input type="number" className="input" value={c.mobility||0} onChange={e=>upd(c.autoId,{mobility:Number(e.target.value)})}/></div>
                <div className="form-row"><label>Supply Start Date</label><input type="date" className="input" value={c.supplyStartDate||""} onChange={e=>upd(c.autoId,{supplyStartDate:e.target.value})}/></div>
                <div className="form-row"><label>End Supply Date</label><input type="date" className="input" value={c.endSupplyDate||""} onChange={e=>upd(c.autoId,{endSupplyDate:e.target.value})}/></div>
                <div className="form-row"><label>Regular App Date</label><input type="date" className="input" value={c.regularAppDate||""} onChange={e=>upd(c.autoId,{regularAppDate:e.target.value})}/></div>
                <div className="form-row"><label>No of Years</label><input className="input" value={c.noOfYears||""} onChange={e=>upd(c.autoId,{noOfYears:e.target.value})}/></div>
                <div className="form-row"><label>Tot Unpaid Leave</label><input type="number" className="input" value={c.totUnpaidLeave||0} onChange={e=>upd(c.autoId,{totUnpaidLeave:Number(e.target.value)})}/></div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
                  <button className="btn sm" onClick={()=>upd(c.autoId,{wef:c.transcriptDate})}>Same as Transcript date</button>
                  <button className="btn sm primary">Calculate Years and Pay</button>
                  <button className="btn sm">View PRS</button>
                  <button className="btn sm">View Unpaid Leave</button>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-head"><h2>Qualification rule</h2><span className="tag pink" style={{marginLeft:8}}>{c.mqfLevel}</span></div>
              <div className="card-body" style={{display:"flex",flexDirection:"column",gap:6}}>
                {QUAL_OPTIONS.map(q=>(
                  <label key={q.id} style={{display:"flex",alignItems:"center",gap:8,fontSize:12.5,cursor:"pointer"}}>
                    <input type="radio" name="qualOpt" value={q.id} checked={c.qualOptionId===q.id} onChange={()=>upd(c.autoId,{qualOptionId:q.id,qualification:q.label,mqfLevel:q.mqf,fromScale:q.fromSc,toScale:q.toSc})}/>
                    {q.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-head"><h2>From / To Scale</h2></div>
              <div className="card-body" style={{display:"flex",gap:16,alignItems:"center"}}>
                <div className="form-row" style={{gridTemplateColumns:"100px 1fr",margin:0,flex:1}}><label>From scale</label><input type="number" className="input" value={c.fromScale||0} onChange={e=>upd(c.autoId,{fromScale:Number(e.target.value)})}/></div>
                <div className="form-row" style={{gridTemplateColumns:"80px 1fr",margin:0,flex:1}}><label>To Scale</label><input type="number" className="input" value={c.toScale||0} onChange={e=>upd(c.autoId,{toScale:Number(e.target.value)})}/></div>
              </div>
            </div>
          </div>
        </div>

        {/* 3-band allowances row */}
        <div className="card section" style={{marginTop:14}}>
          <div className="card-head"><h2>Allowance bands</h2><div className="right muted xs">Active: {c.bandActive} years</div></div>
          <div className="card-body" style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:14}}>
            {[
              ["15 Years",       "band15y",   "15+"],
              ["Over 5 Years",   "band5y",    "5+"],
              ["Less than 5 Years","bandU5y", "<5"],
            ].map(([label,key,band])=>{
              const b = c[key]||{};
              const active = c.bandActive === band;
              return (
                <div key={key} style={{border:"1px solid "+(active?"var(--primary)":"var(--line)"),borderRadius:6,padding:"10px 12px",background:active?"var(--primary-bg-2)":"var(--panel-2)"}}>
                  <label style={{display:"flex",alignItems:"center",gap:6,fontWeight:700,fontSize:12,marginBottom:8}}>
                    <input type="checkbox" checked={active} onChange={()=>upd(c.autoId,{bandActive:band})}/> {label}
                  </label>
                  <div className="form-row" style={{margin:"4px 0",gridTemplateColumns:"130px 1fr"}}><label>Class Allowance</label><input type="number" className="input" value={b.classAll||0} onChange={e=>updBand(c.autoId,key,{classAll:Number(e.target.value)})}/></div>
                  <div className="form-row" style={{margin:"4px 0",gridTemplateColumns:"130px 1fr"}}><label>Work Resc Allowance</label><input type="number" className="input" value={b.workResc||0} onChange={e=>updBand(c.autoId,key,{workResc:Number(e.target.value)})}/></div>
                  <div className="form-row" style={{margin:"4px 0",gridTemplateColumns:"130px 1fr"}}><label>Minimum Pay</label><input type="number" className="input" value={b.minPay||0} onChange={e=>updBand(c.autoId,key,{minPay:Number(e.target.value)})}/></div>
                  <div className="form-row" style={{margin:"4px 0",gridTemplateColumns:"130px 1fr"}}><label>Maximum Pay</label><input type="number" className="input" value={b.maxPay||0} onChange={e=>updBand(c.autoId,key,{maxPay:Number(e.target.value)})}/></div>
                  <div className="form-row" style={{margin:"4px 0",gridTemplateColumns:"130px 1fr"}}><label>Increment</label><input type="number" className="input" value={b.increment||0} onChange={e=>updBand(c.autoId,key,{increment:Number(e.target.value)})}/></div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>
          <button className="btn primary" onClick={()=>upd(c.autoId,{sentToSRS:true,markToSendToSRS:false})}>Export To SRS</button>
          <button className="btn" onClick={()=>setMode("menu")}>Close</button>
          <button className="btn">Print This Form</button>
          <button className="btn">View Letter To Salaries</button>
          <button className="btn">View Letter To Person</button>
          <button className="btn">E-Mail Letter To Person</button>
          <button className="btn primary" disabled={c.insertedInPRS} onClick={()=>upd(c.autoId,{insertedInPRS:true})}>{c.insertedInPRS?"Inserted in PRS ✓":"Insert in PRS"}</button>
        </div>
      </div>
    );
  }

  // ── IMPORT FROM WORKFLOW (Type radio) ─────────────────────────
  if (mode === "import") {
    return (
      <div className="page">
        {backBtn()}
        <div className="card" style={{maxWidth:460}}>
          <div className="card-head"><h2>Import from workflow</h2></div>
          <div className="card-body">
            <div className="radio-group-box">
              <div style={{fontWeight:700,fontSize:12,marginBottom:6}}>Type</div>
              {["Submitted","Completed","Archived"].map(t=>(
                <label key={t}><input type="radio" name="importType" value={t} checked={filterType===t} onChange={()=>setFilterType(t)}/>{t}</label>
              ))}
            </div>
          </div>
          <div className="card-foot">
            <button className="btn" onClick={()=>setMode("menu")}>Close</button>
            <button className="btn primary">Import</button>
          </div>
        </div>
      </div>
    );
  }

  // ── ALL APPLICATIONS (Type radio → list) ──────────────────────
  if (mode === "all-apps") {
    return (
      <div className="page">
        {backBtn()}
        <div className="card" style={{maxWidth:460,marginBottom:14}}>
          <div className="card-head"><h2>View Applications</h2></div>
          <div className="card-body">
            <div className="radio-group-box">
              <div style={{fontWeight:700,fontSize:12,marginBottom:6}}>Type</div>
              {["Submitted","Completed","Archived"].map(t=>(
                <label key={t}><input type="radio" name="appType" value={t} checked={filterType===t} onChange={()=>setFilterType(t)}/>{t}</label>
              ))}
            </div>
          </div>
        </div>
        {(() => {
          const rows = localRecs.filter(r => r.status === filterType);
          return (
            <div className="card">
              <div className="card-head"><h2>{filterType} Applications ({rows.length})</h2><div className="right"><button className="btn sm">Sort</button></div></div>
              <table className="table compact">
                <thead><tr><th>ID Card No</th><th>Full Name</th><th>Ref No</th><th>Grade</th><th></th></tr></thead>
                <tbody>{rows.length>0 ? rows.map(c=>(
                  <tr key={c.autoId}>
                    <td className="id">{c.idCard}</td>
                    <td>{c.fullName}</td>
                    <td className="mono xs">{c.refNo}</td>
                    <td className="mono">{c.grade}</td>
                    <td><button className="btn xs" onClick={()=>{setSelected(c);setMode("person-detail");}}>View</button></td>
                  </tr>
                )) : <tr><td colSpan={5} className="muted" style={{padding:"16px",textAlign:"center"}}>No {filterType.toLowerCase()} applications.</td></tr>}</tbody>
              </table>
            </div>
          );
        })()}
      </div>
    );
  }

  // ── UN-AUDITED APPLICATIONS ───────────────────────────────────
  if (mode === "unaudited") {
    const rows = [...localRecs.filter(r => !r.audited && r.status === "Submitted")].sort((a,b)=>{
      switch(sortBy) {
        case "submission-asc": return (a.submissionDate||"").localeCompare(b.submissionDate||"");
        case "name-asc":       return (a.surname||"").localeCompare(b.surname||"");
        default:               return (b.submissionDate||"").localeCompare(a.submissionDate||"");
      }
    });
    return (
      <div className="page">
        {backBtn()}
        <div className="card">
          <div className="card-head">
            <h2>Unaudited Applications Submitted ({rows.length})</h2>
            <div className="right">
              <select className="input sm" title="Sort" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                <option value="submission-desc">Submission ↓</option>
                <option value="submission-asc">Submission ↑</option>
                <option value="name-asc">Surname A→Z</option>
              </select>
            </div>
          </div>
          <table className="table compact">
            <thead><tr><th>ID Card No</th><th>Full Name</th><th>Ref No</th><th>Grade</th><th></th></tr></thead>
            <tbody>{rows.length>0 ? rows.map(c=>(
              <tr key={c.autoId}>
                <td className="id">{c.idCard}</td>
                <td>{c.fullName}</td>
                <td className="mono xs">{c.refNo}</td>
                <td className="mono">{c.grade}</td>
                <td><button className="btn xs" onClick={()=>{setSelected(c);setMode("person-detail");}}>View</button></td>
              </tr>
            )) : <tr><td colSpan={5} className="muted" style={{padding:"16px",textAlign:"center"}}>All applications are audited.</td></tr>}</tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── VIEW TO SEND TO SRS ───────────────────────────────────────
  if (mode === "send-srs") {
    const rows = localRecs.filter(r => r.markToSendToSRS && !r.sentToSRS);
    return (
      <div className="page">
        {backBtn()}
        <div className="card">
          <div className="card-head"><h2>View to Send to SRS ({rows.length})</h2><div className="right"><button className="btn sm primary">Export batch</button></div></div>
          <table className="table compact">
            <thead><tr><th>ID Card</th><th>Full Name</th><th>Grade</th><th>Ref No</th><th>From → To</th><th></th></tr></thead>
            <tbody>{rows.length>0 ? rows.map(c=>(
              <tr key={c.autoId}>
                <td className="id">{c.idCard}</td>
                <td>{c.fullName}</td>
                <td className="mono">{c.grade}</td>
                <td className="mono xs">{c.refNo}</td>
                <td className="mono">{c.fromScale}→{c.toScale}</td>
                <td><button className="btn xs" onClick={()=>{setSelected(c);setMode("person-detail");}}>View</button></td>
              </tr>
            )) : <tr><td colSpan={6} className="muted" style={{padding:"16px",textAlign:"center"}}>Nothing marked for SRS.</td></tr>}</tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── SEARCH DATABASE / VIEW PROMOTION / EDIT PERSON ────────────
  if (mode === "search-db" || mode === "view-promo" || mode === "edit-person") {
    const q = searchQ.toLowerCase().trim();
    const rows = q ? localRecs.filter(r =>
      r.idCard.toLowerCase().includes(q) ||
      r.fullName.toLowerCase().includes(q) ||
      r.refNo.toLowerCase().includes(q) ||
      (r.qualificationTitle||"").toLowerCase().includes(q)
    ) : localRecs.slice(0,20);
    const titles = { "search-db":"Search Database", "view-promo":"View Person Promotion Details", "edit-person":"Edit Person's Details" };
    return (
      <div className="page">
        {backBtn()}
        <div className="card">
          <div className="card-head">
            <h2>{titles[mode]}</h2>
            <div className="right"><input className="input sm" style={{width:280}} placeholder="ID card, name, ref no or qualification…" value={searchQ} onChange={e=>setSearchQ(e.target.value)}/></div>
          </div>
          <table className="table compact">
            <thead><tr><th>ID Card</th><th>Full Name</th><th>Grade</th><th>Ref No</th><th>Qualification</th><th>Status</th><th></th></tr></thead>
            <tbody>{rows.length>0 ? rows.map(c=>(
              <tr key={c.autoId}>
                <td className="id">{c.idCard}</td>
                <td>{c.fullName}</td>
                <td className="mono">{c.grade}</td>
                <td className="mono xs">{c.refNo}</td>
                <td className="muted xs" style={{maxWidth:320}}>{c.qualificationTitle}</td>
                <td>{c.status==="Submitted"?<span className="tag amber">{c.status}</span>:c.status==="Completed"?<span className="tag green">{c.status}</span>:<span className="tag gray">{c.status}</span>}</td>
                <td><button className="btn xs" onClick={()=>{setSelected(c);setMode("person-detail");}}>View</button></td>
              </tr>
            )) : <tr><td colSpan={7} className="muted" style={{padding:"16px",textAlign:"center"}}>No matches.</td></tr>}</tbody>
          </table>
          <div className="card-foot muted xs">{rows.length} {q?"match"+(rows.length===1?"":"es"):"records (top 20)"}</div>
        </div>
      </div>
    );
  }

  // ── VIEW PRS / MAINTENANCE placeholders ───────────────────────
  if (mode === "view-prs" || mode === "maintenance") {
    const titles = { "view-prs":"View PRS", "maintenance":"Maintenance" };
    return (
      <div className="page">
        {backBtn()}
        <div className="card" style={{maxWidth:520}}>
          <div className="card-head"><h2>{titles[mode]}</h2></div>
          <div className="card-body muted xs">Wires up to the underlying queries.</div>
          <div className="card-foot"><button className="btn" onClick={()=>setMode("menu")}>Close</button></div>
        </div>
      </div>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────
// PROGRESSIONS — 7 workspaces
// ─────────────────────────────────────────────────────────────────
function ProgressionsDeep({ initial = "teachers" }) {
  const [tab, setTab] = useState(initial);

  const TRACKS = {
    "teachers": {
      label:"Teachers", crumb:"Progression_teachers", dbSize:"73 MB", totalDB:1032,
      data: X?.PROG_TEACHERS || [], scaleRef: X?.SAL_SCALES_TEACHERS || [],
      desc:"Teacher grade. Supply counts at 2:1 ratio. Qualification determines threshold — Masters (MQF 7) = 2 yrs, Degree (MQF 6) = 3 yrs. Then Scale 8 → 7 after 5 yrs.",
      rules:[
        {grade:"Teacher (Masters MQF 7)",    sc:"9→8", yrsGrade:2, stream:"—",    clause:"Sectoral Art. 14"},
        {grade:"Teacher (Degree MQF 6)",     sc:"9→8", yrsGrade:3, stream:"—",    clause:"Sectoral Art. 14"},
        {grade:"Teacher (2nd progression)",  sc:"8→7", yrsGrade:5, stream:"—",    clause:"Sectoral Art. 14.3"},
      ],
      formula:true,
      extra:"Data feeds: Belli_dakar, Belli_rudolph, Dakar_raw. Progression_report table logs 4,528 past reports.",
    },
    "eo-hos": {
      label:"EO / HoS", crumb:"Progression_EO_HOS", dbSize:"72 MB", totalDB:837,
      data: X?.PROG_EO_HOS || [], scaleRef: X?.SAL_SCALES_TEACHERS || [],
      desc:"Senior education positions. Two simultaneous conditions: total years in the Education Class AND years specifically in the senior grade. Allowances table tracks class/resource/responsibility pay.",
      rules:[
        {grade:"Head of School",         sc:"5→4", yrsGrade:5,  stream:"25 yrs Educ.", clause:"Art. 7.5"},
        {grade:"Education Officer",      sc:"5→4", yrsGrade:5,  stream:"25 yrs Educ.", clause:"Art. 8.8"},
        {grade:"Deputy Head of School",  sc:"6→5", yrsGrade:5,  stream:"20 yrs Educ.", clause:"Art. 6.4"},
        {grade:"Head of Department",     sc:"6→5", yrsGrade:5,  stream:"20 yrs Educ.", clause:"Art. 5.3"},
      ],
      formula:false,
      extra:"Allowances table (18 rows): class/resource/responsibility per scale per year per grade. No Belli tables — different data feed for senior staff.",
    },
    "lse-qual": {
      label:"LSE/KGE — by Qual", crumb:"LSE/KGE (Qualification-Based)", dbSize:"—", totalDB:179,
      data: X?.PROG_LSE_QUAL || [], scaleRef: X?.SAL_SCALES_TEACHERS || [],
      desc:"Triggered by gaining MQF 6 qualification — moves educator from sub-grade II to sub-grade III. Not a service-based progression; qualification recognition is the condition.",
      rules:[
        {grade:"KGE II → KGE MQF 6 (III)", sc:"11→9", yrsGrade:null, stream:"—", clause:"MQF 6 gained"},
        {grade:"LSE II → LSE MQF 6 (III)",  sc:"11→9", yrsGrade:null, stream:"—", clause:"MQF 6 gained"},
      ],
      formula:false,
      extra:"MFHEA recognition required. Educator moves from sub-grade II (Sc 11) to sub-grade III (Sc 9) on degree recognition.",
    },
    "lse-i": {
      label:"LSE/KGE I", crumb:"Progression_LSE_KGE_I", dbSize:"67 MB", totalDB:193,
      data: X?.PROG_LSE_I || [], scaleRef: X?.SAL_SCALES_TEACHERS || [],
      desc:"Old agreement — 193 educators remaining. Lowest scale band. Declining population as educators retire or upgrade qualification to sub-grade II/III.",
      rules:[
        {grade:"KGE I / LSE I — step 1", sc:"13→12", yrsGrade:null, stream:"—", clause:"Old agreement"},
        {grade:"KGE I / LSE I — step 2", sc:"12→11", yrsGrade:null, stream:"—", clause:"Old agreement"},
      ],
      formula:false,
      extra:"LSE_KGE_Data working table. Grade_Details (11 rows): scale + class/resource allowance + increment per year.",
    },
    "lse-ii": {
      label:"LSE/KGE II", crumb:"Progression_LSE_KGE_II", dbSize:"68 MB", totalDB:2342,
      data: X?.PROG_LSE_II || [], scaleRef: X?.SAL_SCALES_TEACHERS || [],
      desc:"Transitional agreement — largest cohort (2,342). Mid-career scale band. Adds PRS_Updated flag vs sub-grade I.",
      rules:[
        {grade:"KGE II / LSE II", sc:"11→10", yrsGrade:null, stream:"—", clause:"Transitional agreement"},
      ],
      formula:false,
      extra:"Bulk of the LSE/KGE workforce. PRS_Updated flag added to track sync with central PRS.",
    },
    "lse-iii": {
      label:"LSE/KGE III", crumb:"Progression_LSE_KGE_III", dbSize:"67 MB", totalDB:179,
      data: X?.PROG_LSE_III || [], scaleRef: X?.SAL_SCALES_TEACHERS || [],
      desc:"New MQF 6 agreement — requires degree-level qualification. Substantially higher scale band. Newest cohort, still being migrated via import-staging tables.",
      rules:[
        {grade:"KGE MQF 6 / LSE MQF 6", sc:"9→8", yrsGrade:null, stream:"—", clause:"MQF 6 agreement"},
      ],
      formula:false,
      extra:"Unique staging tables: KGE_III_Rudolph, LSE_III_Rudolph for migration of educators into this sub-grade.",
    },
    "non-teach": {
      label:"Non-teaching", crumb:"Progressions_non_teaching", dbSize:"68 MB", totalDB:1925,
      data: X?.PROG_NT || [], scaleRef: X?.SAL_SCALES_NT || [],
      desc:"60+ non-teaching grades. Most complex: up to 6 scale steps, some ending in automatic promotion (e.g. Clerk → Senior Clerk). Grade_Details table encodes the full chain per grade.",
      rules:[
        {grade:"Clerk",           sc:"16→15", yrsGrade:5,    stream:"—", clause:"→ auto-promote to Senior Clerk (Sc 14)"},
        {grade:"Manager I",       sc:"10→9→8→7", yrsGrade:null, stream:"—", clause:"3 steps: 2yr + 3yr + 3yr"},
        {grade:"Operative II",    sc:"19→18→17", yrsGrade:null, stream:"—", clause:"2 steps → auto-promote to Operative III"},
        {grade:"Social Worker",   sc:"10→9→8→7", yrsGrade:null, stream:"—", clause:"3 steps → auto-promote to Senior Social Worker"},
      ],
      formula:false,
      extra:"Salary_Scales + SalaryScales (3,015 step-level rows). PRS_Allowance (43,427 rows). Promotions table (27 rows). Staff_e_Mails (224) + Reminder_tbl (6) for follow-up workflow.",
    },
  };

  const track  = TRACKS[tab] || TRACKS["teachers"];
  const data   = track.data;
  const stats  = {
    pending:  data.filter(r => !r.sentToOfficer && !r.approvedProgression).length,
    sent:     data.filter(r =>  r.sentToOfficer && !r.approvedProgression).length,
    approved: data.filter(r =>  r.approvedProgression && !r.uploaded).length,
    uploaded: data.filter(r =>  r.uploaded).length,
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">Pay · {track.crumb}</div>
          <h1>Progressions — {track.label}</h1>
          <p className="page-sub">{track.desc}</p>
        </div>
        <div className="page-actions">
          <button className="btn">Generate letters</button>
          <button className="btn primary">+ New progression</button>
        </div>
      </div>

      {/* Teachers + Non-teaching + EO/HoS + LSE-by-Qual + LSE-I have dedicated interfaces */}
      {tab === "teachers" ? <TeachingProgressions/> :
       tab === "non-teach" ? <NonTeachingProgressions/> :
       tab === "eo-hos" ? <EOHoSProgressions/> :
       tab === "lse-qual" ? <LSEQualProgressions/> :
       tab === "lse-i" ? <LSEKGEIProgressions/> : (

      <><div style={{display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center"}}>
        {[
          {label:"DB total",  val:track.totalDB.toLocaleString(), color:"var(--ink-1)"},
          {label:"In view",   val:data.length,    color:"var(--ink-1)"},
          {label:"Pending",   val:stats.pending,  color:"#e67e22"},
          {label:"Sent",      val:stats.sent,     color:"#3498db"},
          {label:"Approved",  val:stats.approved, color:"#27ae60"},
          {label:"Uploaded",  val:stats.uploaded, color:"#95a5a6"},
        ].map(s=>(
          <div key={s.label} style={{background:"white", border:"1px solid var(--line-2)", borderRadius:6, padding:"7px 14px", textAlign:"center", minWidth:80}}>
            <div style={{fontSize:17, fontWeight:700, color:s.color}}>{s.val}</div>
            <div style={{fontSize:11, color:"var(--ink-3)"}}>{s.label}</div>
          </div>
        ))}
        <div style={{flex:1}}/>
        <div style={{fontSize:11, color:"var(--ink-3)"}}>{track.dbSize}</div>
      </div>

      <div className="split">
        {/* Main table */}
        <div className="card" style={{flex:3}}>
          <div className="card-head">
            <h2>{track.label} — active progressions</h2>
            <div className="right"><button className="btn xs">Export</button></div>
          </div>
          <div className="table-scroll">
            <table className="table compact">
              <thead>
                <tr>
                  <th>ID Card</th><th>Name</th><th>Grade</th>
                  {tab==="teachers"   && <><th>Type</th><th>Yrs svc</th></>}
                  {tab==="eo-hos"     && <><th>Educ. class</th><th>In grade</th></>}
                  {(tab==="lse-i"||tab==="lse-ii"||tab==="lse-iii"||tab==="lse-qual") && <th>Track / Qual</th>}
                  {tab==="non-teach"  && <th>Promotion</th>}
                  <th>From</th><th>→ To</th>
                  <th className="right">New salary</th>
                  <th>WEF</th><th>Officer</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map(r => {
                  const fromSc = r.salScale   || (r.currentScale ? `${r.currentScale}/?` : "—");
                  const toSc   = r.newSalScale || (r.newScale     ? `${r.newScale}/1`     : "—");
                  const salary = r.newSalary || r.presentSalary || 0;
                  return (
                    <tr key={r.autoId}>
                      <td className="id">{r.idCard}</td>
                      <td>{r.name}</td>
                      <td className="muted xs">{r.gradeDesc || r.grade}</td>
                      {tab==="teachers" && <>
                        <td><span className={"tag "+(r.progType==="Supply"?"amber":"blue")}>{r.progType||"Regular"}</span></td>
                        <td className="num">{r.yearsService||"—"}</td>
                      </>}
                      {tab==="eo-hos" && <>
                        <td className="num muted">{r.yearsService||"—"}</td>
                        <td className="num muted">{r.yearsInGrade||"—"}</td>
                      </>}
                      {(tab==="lse-i"||tab==="lse-ii"||tab==="lse-iii"||tab==="lse-qual") && (
                        <td className="muted xs">{r.track||r.qualification||"—"}</td>
                      )}
                      {tab==="non-teach" && (
                        <td>{r.promotion ? <span className="tag green">→ {r.promotion}</span> : <span className="muted">—</span>}</td>
                      )}
                      <td className="mono">{fromSc}</td>
                      <td className="mono">{toSc}</td>
                      <td className="num right mono">{salary ? `€${salary.toLocaleString()}` : "—"}</td>
                      <td className="num">{r.fromDate||r.wefDate}</td>
                      <td className="mono xs">{r.officer}</td>
                      <td><ApprovalPill compact sent={r.sentToOfficer} approved={r.approvedProgression} uploaded={r.uploaded}/></td>
                    </tr>
                  );
                })}
                {data.length === 0 && (
                  <tr><td colSpan={12} className="muted" style={{padding:"20px", textAlign:"center"}}>No data for this track</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel */}
        <div style={{flex:1, minWidth:260, display:"flex", flexDirection:"column", gap:12}}>
          {/* Grade rules */}
          <div className="card">
            <div className="card-head"><h2>Grade rules</h2></div>
            <table className="table compact">
              <thead><tr><th>Grade</th><th>Scale</th><th>Yrs</th><th>Stream / Clause</th></tr></thead>
              <tbody>
                {track.rules.map((rule,i)=>(
                  <tr key={i}>
                    <td style={{fontSize:11}}>{rule.grade}</td>
                    <td className="mono">{rule.sc}</td>
                    <td className="num">{rule.yrsGrade ?? "—"}</td>
                    <td className="muted xs">{rule.stream !== "—" ? rule.stream+" · " : ""}{rule.clause}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="card-foot muted xs">{track.extra}</div>
          </div>

          {/* Service formula (teachers) */}
          {track.formula && (
            <div className="card">
              <div className="card-head"><h2>Service formula</h2></div>
              <div style={{padding:"10px 14px"}}>
                <code style={{display:"block", fontSize:11, background:"var(--surface-2)", padding:"8px 10px", borderRadius:4, lineHeight:1.8}}>
                  Service =<br/>
                  &nbsp; Regular_svc<br/>
                  &nbsp; + (Supply_svc × 0.5)<br/>
                  &nbsp; + Mobility<br/>
                  &nbsp; − Unpaid_leave
                </code>
                <div style={{marginTop:8, fontSize:12, color:"var(--ink-2)"}}>
                  Threshold: <strong>2 yrs</strong> (Masters MQF 7)<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>3 yrs</strong> (Degree MQF 6)
                </div>
              </div>
            </div>
          )}

          {/* Salary scale */}
          <div className="card">
            <div className="card-head"><h2>Salary reference</h2></div>
            <table className="table compact">
              <thead><tr><th>Scale</th><th className="right">€ p.a.</th><th>MQF</th></tr></thead>
              <tbody>
                {(track.scaleRef||[]).map(s=>(
                  <tr key={s.scale}>
                    <td className="mono">Scale {s.scale}</td>
                    <td className="num right mono">{s.salary?.toLocaleString()}</td>
                    <td className="mono muted">{s.mqf||"—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="card-foot muted xs">2026 rates. Updated annually with COLA &amp; sectoral agreements.</div>
          </div>
        </div>
      </div>
      </> )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// QUALIFICATION ALLOWANCE — QA_data + QA_Grades + MQF
// ─────────────────────────────────────────────────────────────────
function QualAllowanceDeep() {
  const [tab, setTab] = useState("queue");
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">Pay</div>
          <h1>Qualification allowance</h1>
          <p className="page-sub">Allowance for qualifications held above grade requirements. MFHEA recognition required. Feeds into the allowance and qualifications history.</p>
        </div>
        <div className="page-actions">
          <button className="btn">Export</button>
          <button className="btn primary">+ New application</button>
        </div>
      </div>

      <div className="tabs">
        <div className={"tab " + (tab==="queue"?"active":"")} onClick={()=>setTab("queue")}>Applications <span className="count">{X.QA_DATA.length}</span></div>
        <div className={"tab " + (tab==="rates"?"active":"")} onClick={()=>setTab("rates")}>Rate matrix <span className="count">{X.QA_GRADES.length}</span></div>
        <div className={"tab " + (tab==="mqf"?"active":"")} onClick={()=>setTab("mqf")}>MQF reference</div>
      </div>

      {tab === "queue" && (
        <div className="card">
          <div className="card-head"><h2>Applications</h2></div>
          <table className="table compact">
            <thead><tr>
              <th>ID Card</th><th>Name</th><th>Grade</th><th>Qualification</th><th>Awarding body</th><th>MQF</th>
              <th>MFHEA</th><th className="right">Rate</th><th>WEF</th><th>SRS</th><th>Status</th>
            </tr></thead>
            <tbody>
              {X.QA_DATA.map(q => (
                <tr key={q.autoId}>
                  <td className="id">{q.idCard}</td>
                  <td>{q.name}</td>
                  <td className="muted xs">{q.grade}</td>
                  <td>{q.qualificationTitle}</td>
                  <td className="muted xs">{q.awardingBody}</td>
                  <td className="mono">L{q.mqfLevel}</td>
                  <td>{q.dateMfheaRecognition ? <span className="check" title={q.dateMfheaRecognition}>✓</span> : <span className="tag amber">Pending</span>}</td>
                  <td className="num right mono">€{q.allowanceRate}</td>
                  <td className="num">{q.fromDate}</td>
                  <td>{q.sentToSRS ? <span className="check">✓</span> : <span className="muted">—</span>}</td>
                  <td><ApprovalPill compact sent={q.sentToOfficer} approved={q.approvedQa} uploaded={q.uploaded}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "rates" && (
        <div className="card">
          <div className="card-head"><h2>Rate matrix — grade × MQF</h2></div>
          <table className="table">
            <thead><tr><th>Grade</th><th>Min MQF</th><th className="right">Annual rate</th></tr></thead>
            <tbody>
              {X.QA_GRADES.map(g => (
                <tr key={g.grade}><td>{g.grade}</td><td className="mono">L{g.mqfMin}</td><td className="num right mono">€{g.rate}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "mqf" && (
        <div className="card">
          <div className="card-head"><h2>MQF reference (Malta Qualifications Framework)</h2></div>
          <table className="table compact">
            <thead><tr><th>Level</th><th>Type</th><th>Examples</th></tr></thead>
            <tbody>
              <tr><td>L1</td><td>Award</td><td>Basic literacy</td></tr>
              <tr><td>L2</td><td>Certificate</td><td>SEC O-level (3-4)</td></tr>
              <tr><td>L3</td><td>Certificate</td><td>SEC O-level (5-7)</td></tr>
              <tr><td>L4</td><td>Diploma</td><td>Matriculation, advanced</td></tr>
              <tr><td>L5</td><td>Higher Diploma</td><td>Foundation degrees</td></tr>
              <tr><td>L6</td><td>Bachelor</td><td>BA, BSc, B.Ed (Hons)</td></tr>
              <tr><td>L7</td><td>Master</td><td>MA, MSc, M.Ed, PgDip</td></tr>
              <tr><td>L8</td><td>Doctoral</td><td>PhD, Doctorate</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TAX — FS4_New + DocsSentToSection (tax variant)
// ─────────────────────────────────────────────────────────────────
function TaxDeep() {
  const [tab, setTab] = useState("fs4");
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">Pay</div>
          <h1>Tax / FS4</h1>
          <p className="page-sub">Tax declarations submitted by new appointees. Forwarded to Inland Revenue and to forms.</p>
        </div>
        <div className="page-actions">
          <button className="btn">Export FS4 batch</button>
          <button className="btn primary">+ New FS4</button>
        </div>
      </div>

      <div className="tabs">
        <div className={"tab " + (tab==="fs4"?"active":"")} onClick={()=>setTab("fs4")}>New declarations <span className="count">{X.FS4_NEW.length}</span></div>
        <div className={"tab " + (tab==="dispatch"?"active":"")} onClick={()=>setTab("dispatch")}>Dispatch to sections</div>
      </div>

      {tab === "fs4" && (
        <div className="card">
          <div className="card-head"><h2>New FS4 declarations</h2></div>
          <table className="table compact">
            <thead><tr><th>Auto_id</th><th>ID Card</th><th>Name</th><th>Date</th><th>Type</th><th>Other employment?</th><th>Officer</th><th>SRS</th><th>Inland Rev</th></tr></thead>
            <tbody>
              {X.FS4_NEW.map(f => (
                <tr key={f.autoId}>
                  <td className="mono">{f.autoId}</td>
                  <td className="id">{f.personIdno}</td>
                  <td>{f.name}</td>
                  <td className="num">{f.date}</td>
                  <td><span className="tag gray">{f.type}</span></td>
                  <td>{f.empOther}</td>
                  <td className="mono xs">{f.officer}</td>
                  <td>{f.sentToSrs ? <span className="check">✓</span> : <span className="muted">—</span>}</td>
                  <td>{f.sentToInlRev ? <span className="check">✓</span> : <span className="tag amber">Pending</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "dispatch" && (
        <DocsSentGrid title="Dispatch to sections — Tax" />
      )}
    </div>
  );
}

// Reusable 48-field dispatch grid
function DocsSentGrid({ title, scope }) {
  const flags = X.DEST_FLAGS;
  return (
    <div className="card">
      <div className="card-head"><h2>{title}</h2><div className="right"><button className="btn sm">Bulk send…</button></div></div>
      <div className="muted xs" style={{padding:"6px 12px", borderBottom:"1px solid var(--line-2)"}}>
        Each row tracks dispatch flags + dates to {flags.length} downstream sections. Sent_X = boolean, Date_X = dispatch date.
      </div>
      <div className="table-scroll">
        <table className="table compact dispatch-grid">
          <thead>
            <tr>
              <th rowSpan={2}>Auto_id</th>
              <th rowSpan={2}>Person</th>
              <th rowSpan={2}>Sign date</th>
              <th rowSpan={2}>Type</th>
              <th colSpan={flags.length} style={{textAlign:"center", borderBottom:"1px solid var(--line-2)"}}>Dispatched to</th>
            </tr>
            <tr>
              {flags.map(f => <th key={f.key} className="dispatch-col" title={f.label}>{f.key}</th>)}
            </tr>
          </thead>
          <tbody>
            {X.DOCS_SENT.map(d => (
              <tr key={d.autoId}>
                <td className="mono">{d.autoId}</td>
                <td><div>{d.name}</div><div className="muted mono xs">{d.idCard}</div></td>
                <td className="num">{d.signDate}</td>
                <td><span className="tag gray">{d.engOrApp === 0 ? "Eng" : "App"}</span></td>
                {flags.map(f => (
                  <td key={f.key} className="dispatch-cell">
                    {d["sent_"+f.key] ? <span className="check" title={d["date_"+f.key]}>✓</span> : <span className="muted">·</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card-foot muted xs">Hover ✓ to see dispatch date. {X.DOCS_SENT.length} records. {flags.length} target sections.</div>
    </div>
  );
}

window.PagePayProg = { IncrementsDeep, ProgressionsDeep, DocsSentGrid };
})();
