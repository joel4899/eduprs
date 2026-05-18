// Page modules - all 16
(function(){
const { useState, useMemo } = React;
const D = window.HR_DATA;
const P = window.PRS_DATA;
const X = window.DEEP_DATA;
const { useApp, ROLES } = window.Shell;

// Helpers
const fmtDate = d => d ? d : "—";
const fmtMoney = n => "€" + n.toLocaleString();
const StatusDot = ({ status }) => {
  const map = {
    "Accepted": "green", "Granted": "green", "Approved": "green", "Closed": "gray",
    "Refused": "red", "Not approved": "red", "Not Granted": "red",
    "Pending": "amber", "Submitted": "blue", "Open": "amber", "Under review": "amber",
    "Postponed": "amber", "Other": "gray", "Passed Step 1": "blue", "Passed Step 2": "blue",
  };
  return <span><span className={"dot " + (map[status]||"gray")}></span>{status}</span>;
};

// ─── DASHBOARD ──────────────────────────────────────────────────
// Department → modules mapping (used to render dashboard buttons per role)
const DEPT_MODULES = {
  "prs-office":           [{ view:"prs-office",            label:"PRS Office",                 icon:"★", desc:"Master personnel records — full edit access" }],
  "recruitment":          [
    { view:"recruitment-teaching",     label:"Recruitment — Teaching",     icon:"+", desc:"Teaching applications and ranking" },
    { view:"recruitment-non-teaching", label:"Recruitment — Non-Teaching", icon:"+", desc:"Non-teaching positions" },
    { view:"view-result-sheet",        label:"View Result Sheet",          icon:"▦", desc:"Application result sheets" },
    { view:"vet-certificates",         label:"VET Certificates",           icon:"✓", desc:"VET certification register" },
  ],
  "salaries":             [
    { view:"increments", label:"Increments", icon:"₪", desc:"Annual step increments" },
  ],
  "paypoints":            [{ view:"paypoints", label:"Pay Points", icon:"⌖", desc:"Pay point master list" }],
  "progressions":         [
    { view:"prog-teachers",     label:"Progressions — Teachers",      icon:"↑", desc:"Teacher scale progressions" },
    { view:"prog-non-teaching", label:"Progressions — Non-Teaching",  icon:"↑", desc:"Non-teaching progressions" },
    { view:"prog-eo-hos",       label:"Progressions — EO / HoS",      icon:"↑", desc:"EO and Head-of-School tracks" },
    { view:"prog-by-qual",      label:"Progression by Qualification", icon:"↑", desc:"Qualification-driven progressions" },
    { view:"prog-lse-i",        label:"LSE/KGE I",                    icon:"↑" },
    { view:"prog-lse-ii",       label:"LSE/KGE II",                   icon:"↑" },
    { view:"prog-lse-iii",      label:"LSE/KGE III",                  icon:"↑" },
  ],
  "leaves":               [
    { view:"leaves", label:"Leaves",   icon:"◵", desc:"Sick / special / reduced leaves — full edit" },
    { view:"gp47",   label:"GP47 Form", icon:"▤", desc:"Service history form generator" },
  ],
  "conf-appointment":     [
    { view:"conf-appointment", label:"Confirmation of Appointment", icon:"✓", desc:"Probation audit, college dispatch, DG sign-off, PRS insertion" },
    { view:"conf-indefinite",  label:"Confirmation — Indefinite",   icon:"✓", desc:"Move confirmed records to permanent status" },
  ],
  "discipline-hr":        [
    { view:"discipline", label:"Discipline", icon:"!", desc:"Conduct cases" },
    { view:"hr-plan",    label:"HR Plan",    icon:"▦", desc:"Authorised vs filled head-count" },
  ],
  "health-safety":        [
    { view:"injury",  label:"Injury",  icon:"+", desc:"Workplace injuries and medical board" },
    { view:"vaccine", label:"Vaccine", icon:"✚", desc:"Vaccination register" },
  ],
  "forms-docs":           [
    { view:"forms",     label:"Forms (SRS)",          icon:"✎", desc:"SRS form intake" },
    { view:"documents", label:"Docs sent to sections", icon:"≡", desc:"Dispatch tracking" },
  ],
  "terminations":         [
    { view:"term-carmen",  label:"Terminations — Carmen Spiteri",  icon:"✕" },
    { view:"term-rudolph", label:"Terminations — Rudolph Farrugia", icon:"✕" },
  ],
  "transfers-promotions": [{ view:"transfers-promotions", label:"Promotion / Transfer", icon:"↔", desc:"Inter-ministry transfers and grade promotions" }],
};

function Dashboard() {
  const { roleKey, setView } = useApp();
  const role = ROLES[roleKey] || ROLES["super-admin"];
  const isAll = role.departments === "all";
  const has = dept => isAll || role.departments.includes(dept);

  // Buttons for the user's own departments (editable modules)
  const myButtons = isAll
    ? Object.values(DEPT_MODULES).flat()
    : Object.entries(DEPT_MODULES).filter(([d]) => has(d)).flatMap(([_, btns]) => btns);

  // Editable PRS / Leaves if role owns the dept; otherwise read-only view
  const prsTarget    = has("prs-office") ? "prs-office" : "prs-view";
  const leavesTarget = has("leaves")     ? "leaves"     : "leaves-view";
  const prsCanEdit    = has("prs-office");
  const leavesCanEdit = has("leaves");

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">Overview</div>
          <h1>Dashboard</h1>
          <p className="page-sub">Welcome, {role.person} · {role.label}.</p>
        </div>
      </div>

      {/* Role-specific edit modules */}
      {myButtons.length > 0 && (
        <div className="card" style={{marginBottom:14}}>
          <div className="card-head">
            <h2>{isAll ? "All modules" : "Your modules"}</h2>
            <div className="right muted xs">{myButtons.length} module{myButtons.length===1?"":"s"} · full edit access</div>
          </div>
          <div className="card-body" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:10}}>
            {myButtons.map(b => (
              <button key={b.view} className="action-card" onClick={()=>setView(b.view)}>
                <span className="ac-ico">{b.icon || "▤"}</span>
                <span className="ac-content">
                  <span className="ac-title">{b.label}</span>
                  {b.desc && <span className="ac-desc">{b.desc}</span>}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Always-shown PRS + Leaves quick view (read-only for those without that dept) */}
      <div className="card">
        <div className="card-head">
          <h2>Quick view</h2>
          <div className="right muted xs">Available to every role</div>
        </div>
        <div className="card-body" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:10}}>
          <button className="action-card" onClick={()=>setView(prsTarget)}>
            <span className="ac-ico">★</span>
            <span className="ac-content">
              <span className="ac-title">{prsCanEdit ? "PRS Office" : "View PRS"}</span>
              <span className="ac-desc">{prsCanEdit ? "Browse and edit personnel records" : "Browse personnel records — read-only"}</span>
            </span>
          </button>
          <button className="action-card" onClick={()=>setView(leavesTarget)}>
            <span className="ac-ico">◵</span>
            <span className="ac-content">
              <span className="ac-title">{leavesCanEdit ? "Leaves" : "View Leaves"}</span>
              <span className="ac-desc">{leavesCanEdit ? "Browse and edit sick / special / reduced leaves" : "Browse leaves — read-only"}</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PRS VIEW (read-only dossier — full PRS only) ──────────────
function PRSView() {
  const [idCardInput, setIdCardInput] = useState("");
  const lookup = ic => D.PEOPLE.find(p => p.idCard.toLowerCase() === (ic||"").toLowerCase().trim()) || null;
  const person = idCardInput ? lookup(idCardInput) : null;

  const allPRS    = [...(window.__SHARED_HIRES || []), ...(P?.RECENT_PRS || [])];
  const pPRS      = person ? allPRS.filter(r => r.idCard === person.idCard) : [];
  const pPRSgp47  = pPRS.filter(r => r.showInGP47);
  const pPT       = pPRS.filter(r => r.partTime || /part.?time/i.test(r.position||""));
  const pCola     = pPRS.filter(r => /cola/i.test(r.reason||""));
  const pAllow    = (P?.HERO_ALLOWANCES || []).filter(r => person && r.idCard === person.idCard);
  const pSECQ     = (P?.HERO_SECQ || []).filter(r => person && r.idCard === person.idCard);
  const pRem      = (P?.HERO_REMARKS || []).filter(r => person && r.idCard === person.idCard);

  return (
    <div className="page prs-dossier">
      <div className="page-head">
        <div>
          <div className="crumbs">View PRS · read-only</div>
          <h1>View PRS</h1>
          <p className="page-sub">Full personnel record sheet for any employee. Read-only access — editing is restricted to the PRS Office department.</p>
        </div>
        <div className="page-actions">
          <span className="tag amber">Read-only</span>
          {person && <button className="btn primary" onClick={()=>window.print()}>🖨 Print</button>}
        </div>
      </div>

      <div className="card no-print" style={{marginBottom:14}}>
        <div className="card-head"><h2>Look up employee</h2></div>
        <div className="card-body" style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <input className="input" style={{flex:1,minWidth:240,maxWidth:340}} placeholder="Enter ID Card No." value={idCardInput} onChange={e=>setIdCardInput(e.target.value)}/>
          {idCardInput && !person && <span className="muted xs">Person not found.</span>}
        </div>
      </div>

      {!person ? (
        <div className="empty">Enter an ID card number above to load the full PRS dossier.</div>
      ) : (<>
        <div className="dossier-header">
          <div className="dossier-id-block">
            <div className="dossier-name">{person.name} {person.surname}</div>
            <div className="dossier-meta">
              <span><strong>ID Card:</strong> {person.idCard}</span>
              <span><strong>Grade:</strong> {person.gradeDesc}</span>
              <span><strong>Scale:</strong> {person.salScale}</span>
              <span><strong>Pay Point:</strong> {person.paypointDesc}</span>
              <span className={person.stillInService?"tag green":"tag red"}>{person.stillInService?"In service":"Left service"}</span>
            </div>
          </div>
        </div>

        <div className="card section">
          <div className="card-head"><h2>1 · Personal Details</h2></div>
          <table className="table compact">
            <tbody>{[
              ["ID Card",person.idCard],["NI",person.ni],["Name",person.name],["Surname",person.surname],
              ["Birth Surname",person.birthSurname||"—"],["Gender",person.gender],["DOB",person.dob],
              ["Grade",person.gradeDesc],["Pay Point",person.paypointDesc],["Salary Scale",person.salScale],
              ["In Service",person.stillInService?"Yes":"No"],
            ].map(([k,v])=>(
              <tr key={k}><td style={{fontWeight:600,width:160}}>{k}</td><td>{v}</td></tr>
            ))}</tbody>
          </table>
        </div>

        <div className="card section">
          <div className="card-head"><h2>2 · Service ({pPRS.length})</h2></div>
          <table className="table compact">
            <thead><tr><th>From</th><th>Position</th><th>Scale</th><th>Salary</th><th>Reason</th><th>GP47</th><th>Officer</th></tr></thead>
            <tbody>{pPRS.length>0 ? pPRS.map((r,i)=>(
              <tr key={i}>
                <td className="num">{r.fromDate}</td><td>{r.position}</td>
                <td className="mono">{r.salScale}</td><td className="mono">{r.salary}</td>
                <td><span className="tag gray">{r.reason}</span></td>
                <td>{r.showInGP47?<span className="check">✓</span>:"—"}</td>
                <td className="mono xs">{r.officer}</td>
              </tr>
            )) : <tr><td colSpan={7} className="muted" style={{padding:"16px",textAlign:"center"}}>No service records.</td></tr>}</tbody>
          </table>
        </div>

        <div className="card section">
          <div className="card-head"><h2>3 · Service — Part-Time ({pPT.length})</h2></div>
          <table className="table compact">
            <thead><tr><th>From</th><th>Position</th><th>Rate</th><th>Reason</th></tr></thead>
            <tbody>{pPT.length>0 ? pPT.map((r,i)=>(
              <tr key={i}><td className="num">{r.fromDate}</td><td>{r.position}</td><td className="mono">{r.salary}</td><td><span className="tag gray">{r.reason}</span></td></tr>
            )) : <tr><td colSpan={4} className="muted" style={{padding:"16px",textAlign:"center"}}>No part-time records.</td></tr>}</tbody>
          </table>
        </div>

        <div className="card section">
          <div className="card-head"><h2>4 · Partial GP 47 ({pPRSgp47.length})</h2></div>
          <table className="table compact">
            <thead><tr><th>From</th><th>Position</th><th>Scale</th><th>Salary</th><th>Reason</th></tr></thead>
            <tbody>{pPRSgp47.length>0 ? pPRSgp47.map((r,i)=>(
              <tr key={i}><td className="num">{r.fromDate}</td><td>{r.position}</td><td className="mono">{r.salScale}</td><td className="mono">{r.salary}</td><td><span className="tag gray">{r.reason}</span></td></tr>
            )) : <tr><td colSpan={5} className="muted" style={{padding:"16px",textAlign:"center"}}>No GP47 entries.</td></tr>}</tbody>
          </table>
        </div>

        <div className="card section">
          <div className="card-head"><h2>5 · COLA history ({pCola.length})</h2></div>
          {pCola.length>0 ? (
            <table className="table compact">
              <thead><tr><th>From</th><th>Scale</th><th>Salary</th><th>Officer</th></tr></thead>
              <tbody>{pCola.map((r,i)=>(
                <tr key={i}><td className="num">{r.fromDate}</td><td className="mono">{r.salScale}</td><td className="mono">{r.salary}</td><td className="mono xs">{r.officer}</td></tr>
              ))}</tbody>
            </table>
          ) : <div className="muted xs" style={{padding:"14px 16px"}}>No COLA records on file.</div>}
        </div>

        <div className="card section">
          <div className="card-head"><h2>6 · Allowances ({pAllow.length})</h2></div>
          <table className="table compact">
            <thead><tr><th>Nature</th><th>From</th><th>To</th><th>Rate</th><th>Authority</th></tr></thead>
            <tbody>{pAllow.length>0 ? pAllow.map((r,i)=>(
              <tr key={i}><td>{r.nature}</td><td className="num">{r.fromAll}</td><td className="num">{r.toAll||<span className="tag green">Open</span>}</td><td className="mono">{r.rateAll}</td><td className="muted xs">{r.authorityAll}</td></tr>
            )) : <tr><td colSpan={5} className="muted" style={{padding:"16px",textAlign:"center"}}>No allowances.</td></tr>}</tbody>
          </table>
        </div>

        <div className="card section">
          <div className="card-head"><h2>7 · Qualifications — S.E.C.Q. ({pSECQ.length})</h2></div>
          <table className="table compact">
            <thead><tr><th>Qualification</th><th>Date Added</th><th>Officer</th></tr></thead>
            <tbody>{pSECQ.length>0 ? pSECQ.map((r,i)=>(
              <tr key={i}><td>{r.secq}</td><td className="num">{r.dateAdded}</td><td className="mono xs">{r.officer}</td></tr>
            )) : <tr><td colSpan={3} className="muted" style={{padding:"16px",textAlign:"center"}}>None on file.</td></tr>}</tbody>
          </table>
        </div>

        <div className="card section">
          <div className="card-head"><h2>8 · Remarks ({pRem.length})</h2></div>
          <table className="table compact">
            <thead><tr><th>Date</th><th>Type</th><th>Remark</th><th>Officer</th></tr></thead>
            <tbody>{pRem.length>0 ? pRem.map((r,i)=>(
              <tr key={i}><td className="num">{r.date}</td><td><span className="tag gray">{r.type}</span></td><td style={{maxWidth:480}}>{r.text}</td><td className="mono xs">{r.officer}</td></tr>
            )) : <tr><td colSpan={4} className="muted" style={{padding:"16px",textAlign:"center"}}>No remarks.</td></tr>}</tbody>
          </table>
        </div>

        <div className="dossier-footer print-only muted xs">
          Printed {new Date().toLocaleString()} · Read-only view · Education HR — Personnel Record Sheet
        </div>
      </>)}
    </div>
  );
}

// ─── LEAVES VIEW (read-only Sick & Special Leave Card) ─────────
function LeavesView() {
  const [idCardInput, setIdCardInput] = useState("");
  const lookup = ic => D.PEOPLE.find(p => p.idCard.toLowerCase() === (ic||"").toLowerCase().trim()) || null;
  const person = idCardInput ? lookup(idCardInput) : null;

  const filterRows = (rows) => person ? rows.filter(r => r.persIdNo === person.idCard || r.idCard === person.idCard) : [];
  const sick    = filterRows(X?.SICK_LEAVE_DATA    || []);
  const special = filterRows(X?.SPECIAL_LEAVE_DATA || []);
  const rpt     = filterRows(X?.RED_PT_DATA        || []);

  return (
    <div className="page prs-dossier">
      <div className="page-head">
        <div>
          <div className="crumbs">View Leaves · read-only</div>
          <h1>View Leaves</h1>
          <p className="page-sub">Full Sick &amp; Special Leave Card for any employee. Read-only access — editing is restricted to the Leaves &amp; Confirmations department.</p>
        </div>
        <div className="page-actions">
          <span className="tag amber">Read-only</span>
          {person && <button className="btn primary" onClick={()=>window.print()}>🖨 Print Leave Card</button>}
        </div>
      </div>

      <div className="card no-print" style={{marginBottom:14}}>
        <div className="card-head"><h2>Look up employee</h2></div>
        <div className="card-body" style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <input className="input" style={{flex:1,minWidth:240,maxWidth:340}} placeholder="Enter ID Card No." value={idCardInput} onChange={e=>setIdCardInput(e.target.value)}/>
          {idCardInput && !person && <span className="muted xs">Person not found.</span>}
        </div>
      </div>

      {!person ? (
        <div className="empty">Enter an ID card number above to load the full Leave Card.</div>
      ) : (<>
        <div className="dossier-header">
          <div className="dossier-id-block">
            <div className="dossier-name">{person.name} {person.surname}</div>
            <div className="dossier-meta">
              <span><strong>ID Card:</strong> {person.idCard}</span>
              <span><strong>Grade:</strong> {person.gradeDesc}</span>
              <span><strong>Scale:</strong> {person.salScale}</span>
              <span><strong>Pay Point:</strong> {person.paypointDesc}</span>
              <span className={person.stillInService?"tag green":"tag red"}>{person.stillInService?"In service":"Left service"}</span>
            </div>
          </div>
        </div>

        <div className="card section">
          <div className="card-head"><h2>1 · Sick Leave ({sick.length})</h2></div>
          <table className="table compact">
            <thead><tr><th>Year</th><th className="right">Days</th><th>Comments</th><th>Officer</th><th>Date added</th></tr></thead>
            <tbody>{sick.length>0 ? sick.map((r,i)=>(
              <tr key={i}>
                <td className="mono">{r.slYear||r.year}</td>
                <td className="num right mono">{r.totDays||r.totalDays}</td>
                <td className="muted xs">{r.slComments||r.comments||"—"}</td>
                <td className="mono xs">{r.officer||"—"}</td>
                <td className="mono xs">{r.dateAdded||"—"}</td>
              </tr>
            )) : <tr><td colSpan={5} className="muted" style={{padding:"16px",textAlign:"center"}}>No sick leave records.</td></tr>}</tbody>
          </table>
        </div>

        <div className="card section">
          <div className="card-head"><h2>2 · Special Leave ({special.length})</h2></div>
          <table className="table compact">
            <thead><tr><th>Leave Type</th><th>From</th><th>To</th><th className="right">Days</th><th>Paid</th><th>State</th><th>Comments</th></tr></thead>
            <tbody>{special.length>0 ? special.map((r,i)=>(
              <tr key={i}>
                <td className="muted xs">{r.nature||r.leaveType||"—"}</td>
                <td className="num">{r.fromDate}</td>
                <td className="num">{r.toDate}</td>
                <td className="num right mono">{r.totDays||r.days}</td>
                <td>{r.paidUnpaid===1||r.paidType==="Paid"?<span className="tag green">Paid</span>:<span className="tag gray">Unpaid</span>}</td>
                <td className="muted xs">{r.state||"—"}</td>
                <td className="muted xs">{r.comments||"—"}</td>
              </tr>
            )) : <tr><td colSpan={7} className="muted" style={{padding:"16px",textAlign:"center"}}>No special leave records.</td></tr>}</tbody>
          </table>
        </div>

        <div className="card section">
          <div className="card-head"><h2>3 · Reduced / Part-Time ({rpt.length})</h2></div>
          <table className="table compact">
            <thead><tr><th>Type</th><th className="right">Hrs/Wk</th><th>From</th><th>To</th><th>Comments</th></tr></thead>
            <tbody>{rpt.length>0 ? rpt.map((r,i)=>(
              <tr key={i}>
                <td><span className="tag gray">{r.type||"—"}</span></td>
                <td className="num right mono">{r.hrsPerWeek||r.numOfHrs}</td>
                <td className="num">{r.fromDate}</td>
                <td className="num">{r.toDate}</td>
                <td className="muted xs">{r.comments||"—"}</td>
              </tr>
            )) : <tr><td colSpan={5} className="muted" style={{padding:"16px",textAlign:"center"}}>No reduced/part-time records.</td></tr>}</tbody>
          </table>
        </div>

        <div className="card section">
          <div className="card-head"><h2>4 · Summary</h2></div>
          <table className="table compact">
            <tbody>
              <tr><td style={{fontWeight:600,width:240}}>Total sick leave days (all years)</td><td className="num right mono">{sick.reduce((a,r)=>a+Number(r.totDays||r.totalDays||0),0)}</td></tr>
              <tr><td style={{fontWeight:600}}>Total special leave records</td><td className="num right mono">{special.length}</td></tr>
              <tr><td style={{fontWeight:600}}>Total special leave days</td><td className="num right mono">{special.reduce((a,r)=>a+Number(r.totDays||r.days||0),0)}</td></tr>
              <tr><td style={{fontWeight:600}}>Reduced / Part-Time arrangements</td><td className="num right mono">{rpt.length}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="dossier-footer print-only muted xs">
          Printed {new Date().toLocaleString()} · Read-only view · Sick &amp; Special Leave Card · {person.name} {person.surname} ({person.idCard})
        </div>
      </>)}
    </div>
  );
}

// ─── EMPLOYEES (list + 360 detail) ─────────────────────────────
function EmployeesList() {
  const { setSelectedPerson, setView } = useApp();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [showNewEmp, setShowNewEmp] = useState(false);
  const list = D.PEOPLE.filter(p => {
    if (filter === "teaching" && !p.teaching) return false;
    if (filter === "non-teaching" && p.teaching) return false;
    if (filter === "in-service" && !p.stillInService) return false;
    if (filter === "resigned" && !p.resigned) return false;
    if (q) {
      const s = q.toLowerCase();
      if (!p.idCard.toLowerCase().includes(s) && !`${p.name} ${p.surname}`.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  return (
    <div className="page">
      {showNewEmp && window.PageForms && React.createElement(window.PageForms.NewEmployeeModal, {onClose: () => setShowNewEmp(false)})}
      <div className="page-head">
        <div><div className="crumbs">Records</div><h1>Employees</h1></div>
        <div className="page-actions">
          <button className="btn">Import CSV</button>
          <button className="btn">Export</button>
          <button className="btn primary" onClick={() => setShowNewEmp(true)}>+ New employee</button>
        </div>
      </div>

      <div className="toolbar">
        <input placeholder="Search ID card, name…" value={q} onChange={e=>setQ(e.target.value)} style={{width:280}}/>
        <select value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="all">All staff</option>
          <option value="teaching">Teaching only</option>
          <option value="non-teaching">Non-teaching only</option>
          <option value="in-service">In service</option>
          <option value="resigned">Resigned</option>
        </select>
        <select><option>All paypoints</option>{D.PAYPOINTS.map(p=><option key={p.no}>{p.no} — {p.desc}</option>)}</select>
        <select><option>All grades</option>{D.GRADES.map(g=><option key={g.code}>{g.desc}</option>)}</select>
        <div className="sep"/>
        <span className="muted" style={{fontSize:11}}>{list.length} of {D.PEOPLE.length}</span>
      </div>
      <div className="card" style={{borderTopLeftRadius:0, borderTopRightRadius:0, borderTop:0}}>
        <table className="table compact">
          <thead><tr>
            <th>ID Card</th><th>Surname, name</th><th>Emp No.</th><th>Grade</th>
            <th>Subject</th><th>Pay point</th><th>Type</th><th>Status</th><th>Flags</th>
          </tr></thead>
          <tbody>
            {list.slice(0, 60).map(p => (
              <tr key={p.idCard} onClick={()=>{setSelectedPerson(p); setView("employee-detail");}} style={{cursor:"pointer"}}>
                <td className="id">{p.idCard}</td>
                <td><strong>{p.surname}</strong>, {p.name} {p.title && <span className="muted">({p.title})</span>}</td>
                <td className="id">{p.empNo}</td>
                <td>{p.gradeDesc}</td>
                <td>{p.teachingOf || <span className="muted">—</span>}</td>
                <td className="id">{p.paypoint}</td>
                <td>{p.teaching ? <span className="tag blue">Teaching</span> : <span className="tag gray">Non-teach</span>}</td>
                <td>{p.stillInService ? <StatusDot status="Active"/> : p.resigned ? <span><span className="dot red"></span>Resigned</span> : <span><span className="dot gray"></span>Inactive</span>}</td>
                <td>
                  {p.hasDiscAction ? <span className="tag red" title="Disciplinary">D</span> : null}
                  {p.confProb===1 ? <span className="tag amber" title="Probation">P</span> : null}
                  {p.confProb===2 ? <span className="tag amber" title="Trial">T</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmployeeDetail() {
  const { selectedPerson: p, setView } = useApp();
  const [tab, setTab] = useState("summary");
  if (!p) return <div className="page"><div className="empty">Select an employee</div></div>;

  const prsRecords = p.idCard === "0259684M" ? D.PRS_RECORDS : [
    { id: 100, idCard: p.idCard, from: p.commencDate, to: null, scale: p.lastSalScale, grade: p.grade, position: p.gradeDesc, paypoint: p.paypoint, fullPart: "Full", approved: true, approvedBy: "—", uploaded: true },
  ];
  const allowances = p.idCard === "0259684M" ? D.PRS_ALLOWANCES : [];
  const remarks = p.idCard === "0259684M" ? D.PRS_REMARKS : [];

  const initials = (p.name[0] || "") + (p.surname[0] || "");

  const tabs = [
    { id: "summary", label: "Summary" },
    { id: "prs", label: "PRS service", count: prsRecords.length },
    { id: "allowances", label: "Allowances", count: allowances.length },
    { id: "remarks", label: "Remarks", count: remarks.length },
    { id: "leaves", label: "Leaves" },
    { id: "qualifications", label: "Qualifications" },
    { id: "discipline", label: "Discipline" },
    { id: "documents", label: "Documents" },
    { id: "audit", label: "Audit history" },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs"><span className="linkish" onClick={()=>setView("employees")}>Employees</span> / {p.idCard}</div>
          <h1>{p.title} {p.name} {p.surname}</h1>
        </div>
        <div className="page-actions">
          <button className="btn">Print PRS</button>
          <button className="btn">Generate GP47</button>
          <button className="btn primary">Edit</button>
        </div>
      </div>

      <div className="profile-head" style={{marginBottom:12}}>
        <div className="profile-photo">{initials}</div>
        <div>
          <div className="profile-name">{p.title} {p.name} {p.surname} {p.birthSurname !== p.surname && <span className="muted" style={{fontSize:13, fontWeight:400}}>(née {p.birthSurname})</span>}</div>
          <div className="profile-meta">
            <span><strong>ID</strong> <span className="mono">{p.idCard}</span></span>
            <span><strong>Emp</strong> <span className="mono">{p.empNo}</span></span>
            <span><strong>NI</strong> <span className="mono">{p.ni}</span></span>
            <span><strong>Grade</strong> {p.gradeDesc} (Scale {p.lastSalScale})</span>
            <span><strong>Pay point</strong> <span className="mono">{p.paypoint}</span> {p.paypointDesc}</span>
            <span><strong>Commenced</strong> {p.commencDate}</span>
          </div>
        </div>
        <div style={{display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end"}}>
          {p.stillInService ? <span className="tag green">Active in service</span> : <span className="tag red">Inactive</span>}
          {p.teaching ? <span className="tag blue">Teaching</span> : <span className="tag gray">Non-teaching</span>}
          {p.hasDiscAction ? <span className="tag red">Disciplinary action</span> : null}
        </div>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <div key={t.id} className={"tab " + (tab===t.id?"active":"")} onClick={()=>setTab(t.id)}>
            {t.label} {t.count != null && <span className="count">{t.count}</span>}
          </div>
        ))}
      </div>

      {tab === "summary" && (
        <div className="split" style={{alignItems:"flex-start"}}>
          <div className="col-flex">
            <div className="card"><div className="card-head"><h2>Personal details</h2></div><div className="card-body">
              <dl className="kv">
                <dt>Title</dt><dd>{p.title}</dd>
                <dt>Date of birth</dt><dd>{p.dob}</dd>
                <dt>Gender</dt><dd>{p.gender}</dd>
                <dt>Marital status</dt><dd>{p.maritalStatus}</dd>
                <dt>Citizenship</dt><dd>{p.citizenship}</dd>
                <dt>Father</dt><dd>{p.fatherName} {p.fatherSurname}</dd>
              </dl>
            </div></div>
            <div className="card"><div className="card-head"><h2>Address & contact</h2></div><div className="card-body">
              <dl className="kv">
                <dt>Door / House</dt><dd>{p.door}{p.houseName?", "+p.houseName:""}</dd>
                <dt>Street</dt><dd>{p.streetName}</dd>
                <dt>Locality</dt><dd>{p.locality}, {p.postCode}</dd>
                <dt>Telephone</dt><dd className="mono">{p.telephone}</dd>
                <dt>Mobile</dt><dd className="mono">{p.mobile}</dd>
                <dt>Email</dt><dd>{p.email}</dd>
              </dl>
            </div></div>
          </div>
          <div className="col-flex">
            <div className="card"><div className="card-head"><h2>Employment summary</h2></div><div className="card-body">
              <dl className="kv">
                <dt>Commencement</dt><dd>{p.commencDate}</dd>
                <dt>Present employment</dt><dd>{p.presentEmployment}</dd>
                <dt>Post</dt><dd>{p.postOfEmp}</dd>
                <dt>Subject</dt><dd>{p.teachingOf || "—"}</dd>
                <dt>Pay point</dt><dd className="mono">{p.paypoint}</dd>
                <dt>Last scale</dt><dd>Scale {p.lastSalScale}</dd>
              </dl>
            </div></div>
            <div className="card"><div className="card-head"><h2>Cross-module links</h2></div><div className="card-body" style={{padding:0}}>
              {[
                {l:"Service history (PRS)", v: prsRecords.length+" records", t:"prs"},
                {l:"Allowances", v: allowances.length+" entries", t:"allowances"},
                {l:"Remarks", v: remarks.length+" notes", t:"remarks"},
                {l:"Sick leaves (lifetime)", v:"24 days · 2026"},
                {l:"Special leaves", v:"3 entries"},
                {l:"Qualification allowances", v:"1 active"},
                {l:"Documents sent", v:"7 records"},
                {l:"Disciplinary cases", v: p.hasDiscAction ? "1 active" : "None"},
              ].map((r,i) => (
                <div key={i} style={{padding:"7px 12px", borderBottom:"1px solid var(--line-2)", display:"flex"}}>
                  <span style={{flex:1, fontSize:12}}>{r.l}</span>
                  <span className="muted" style={{fontSize:12}}>{r.v}</span>
                </div>
              ))}
            </div></div>
          </div>
        </div>
      )}

      {tab === "prs" && (
        <div className="card">
          <div className="card-head"><h2>PRS — Personnel Record Sheet</h2><div className="right"><button className="btn sm">+ Add record</button><button className="btn sm">Print PRS</button></div></div>
          <table className="table">
            <thead><tr><th>From</th><th>To</th><th>Grade</th><th>Position</th><th>Scale</th><th>Pay point</th><th>FT/PT</th><th>Approved by</th><th>Status</th></tr></thead>
            <tbody>
              {prsRecords.map(r => (
                <tr key={r.id}>
                  <td className="num">{r.from}</td>
                  <td className="num">{r.to || <span className="tag green">Current</span>}</td>
                  <td>{r.grade}</td>
                  <td>{r.position}</td>
                  <td className="num">Scale {r.scale}</td>
                  <td className="id">{r.paypoint}</td>
                  <td>{r.fullPart}</td>
                  <td>{r.approvedBy}</td>
                  <td>{r.uploaded ? <span className="tag green">Uploaded</span> : <span className="tag amber">Pending</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "allowances" && (
        <div className="card">
          <div className="card-head"><h2>Allowances</h2><div className="right"><button className="btn sm">+ Add allowance</button></div></div>
          {allowances.length === 0 ? <div className="empty">No allowances on record.</div> : (
            <table className="table">
              <thead><tr><th>Type</th><th>From</th><th>To</th><th className="right">Amount (annual)</th></tr></thead>
              <tbody>
                {allowances.map(a => (
                  <tr key={a.id}><td>{a.type}</td><td className="num">{a.from}</td><td className="num">{a.to||<span className="tag green">Current</span>}</td><td className="num right">{fmtMoney(a.amount)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "remarks" && (
        <div className="card">
          <div className="card-head"><h2>Remarks & annotations</h2><div className="right"><button className="btn sm">+ Add remark</button></div></div>
          <div className="card-body">
            {remarks.length === 0 ? <div className="empty">No remarks on record.</div> :
              <div className="timeline">{remarks.map(r => (
                <div key={r.id} className="tl-item">
                  <div className="tl-time">{r.date} · <span className="tag gray">{r.type}</span></div>
                  <div className="tl-desc">{r.text}</div>
                </div>
              ))}</div>
            }
          </div>
        </div>
      )}

      {tab === "leaves" && (
        <div className="col-flex">
          <div className="card">
            <div className="card-head"><h2>Sick leave — current year</h2></div>
            <table className="table compact">
              <thead><tr><th>From</th><th>To</th><th>Days</th><th>Paid?</th><th>Type</th></tr></thead>
              <tbody>
                {[1,2,3].map(i => <tr key={i}><td className="num">2026-0{i+1}-1{i}</td><td className="num">2026-0{i+1}-1{i+2}</td><td className="num">{i+1}</td><td>Paid</td><td>{i===2?"Hospitalisation":"Doctor cert"}</td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="card">
            <div className="card-head"><h2>Special leave</h2></div>
            <div className="empty">No special leave on record for {p.name}.</div>
          </div>
        </div>
      )}

      {tab === "qualifications" && (
        <div className="card">
          <div className="card-head"><h2>Qualifications & MQF allowances</h2></div>
          <table className="table">
            <thead><tr><th>Title</th><th>Awarding body</th><th>MQF</th><th>WEF</th><th>Allowance</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>BEd (Hons) Mathematics</td><td>University of Malta</td><td>6</td><td className="num">2008-09-29</td><td>Entry qualification</td><td><span className="tag green">Recognised</span></td></tr>
              <tr><td>Master in Educational Leadership</td><td>University of Malta</td><td>7</td><td className="num">2018-09-01</td><td className="num">€1,100</td><td><span className="tag green">Approved</span></td></tr>
            </tbody>
          </table>
        </div>
      )}

      {tab === "discipline" && (
        <div className="card"><div className="card-head"><h2>Disciplinary history</h2></div>
          <div className="empty">No disciplinary actions for {p.name}.</div>
        </div>
      )}

      {tab === "documents" && (
        <div className="card">
          <div className="card-head"><h2>Documents sent to sections</h2></div>
          <table className="table">
            <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Sent to</th></tr></thead>
            <tbody>
              {D.DOCS_SENT.slice(0,5).map(d => (
                <tr key={d.id}><td className="num">{d.dateUploaded}</td><td><span className="tag gray">{d.category}</span></td><td>{d.description}</td><td>{d.sentTo}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "audit" && (
        <div className="card"><div className="card-head"><h2>Change history</h2></div>
          <div className="card-body">
            <div className="timeline">
              {D.AUDIT_LOG.map((a,i) => (
                <div key={i} className="tl-item">
                  <div className="tl-time">{a.ts} · {a.user}</div>
                  <div className="tl-title">{a.action}</div>
                  <div className="tl-desc">{a.entity} — <span className="muted">{a.before}</span> → <strong>{a.after}</strong></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.PageA = { Dashboard, EmployeesList, EmployeeDetail, PRSView, LeavesView, StatusDot };
})();
