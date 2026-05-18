// Recruitment, Progressions, Increments
(function(){
const { useState, useMemo } = React;
const D = window.HR_DATA;
const { useApp } = window.Shell;
const { StatusDot } = window.PageA;

// ─── RECRUITMENT ─────────────────────────────────────────────
function Recruitment() {
  const [tab, setTab] = useState("teaching");
  const [stage, setStage] = useState(0);
  const [showFlow, setShowFlow] = useState(false);
  const apps = D.APPLICATIONS;

  return (
    <div className="page">
      <div className="page-head">
        <div><div className="crumbs">Lifecycle</div><h1>Recruitment</h1></div>
        <div className="page-actions">
          <button className="btn">HR plan</button>
          <button className="btn">Seniority list</button>
          <button className="btn primary" onClick={()=>setShowFlow(true)}>+ New application</button>
        </div>
      </div>

      <div className="tabs">
        <div className={"tab " + (tab==="teaching"?"active":"")} onClick={()=>setTab("teaching")}>Teaching <span className="count">{apps.length}</span></div>
        <div className={"tab " + (tab==="non-teaching"?"active":"")} onClick={()=>setTab("non-teaching")}>Non-teaching <span className="count">14</span></div>
        <div className={"tab " + (tab==="seniority"?"active":"")} onClick={()=>setTab("seniority")}>Supply seniority list</div>
        <div className={"tab " + (tab==="hr-plan"?"active":"")} onClick={()=>setTab("hr-plan")}>HR plan</div>
        <div className={"tab " + (tab==="results"?"active":"")} onClick={()=>setTab("results")}>Result sheet</div>
      </div>

      {tab === "teaching" && (
        <>
          <div className="stats" style={{marginBottom:12}}>
            {[
              {l:"Submitted", v: apps.filter(a=>a.status==="Submitted").length},
              {l:"Passed Step 1", v: apps.filter(a=>a.status==="Passed Step 1").length},
              {l:"Passed Step 2", v: apps.filter(a=>a.status==="Passed Step 2").length},
              {l:"Accepted", v: apps.filter(a=>a.status==="Accepted").length},
              {l:"Refused", v: apps.filter(a=>a.status==="Refused").length},
            ].map((s,i)=><div key={i} className="stat"><div className="lbl">{s.l}</div><div className="val">{s.v}</div></div>)}
          </div>

          <div className="toolbar">
            <input placeholder="Search applicant…" style={{width:240}}/>
            <select><option>All profiles</option><option>PROF/2026/001</option></select>
            <select><option>All subjects</option>{D.SUBJECTS.map(s=><option key={s}>{s}</option>)}</select>
            <select><option>All statuses</option><option>Submitted</option><option>Accepted</option></select>
            <div className="sep"/>
            <button className="btn sm">Match HR plan</button>
            <button className="btn sm">Find duplicates</button>
            <button className="btn sm">Email applicants</button>
          </div>
          <div className="card" style={{borderTopLeftRadius:0, borderTopRightRadius:0, borderTop:0}}>
            <table className="table compact">
              <thead><tr><th>Rank</th><th>Profile</th><th>ID Card</th><th>Applicant</th><th>Subject</th><th>Grade</th><th>Status</th><th>Already employee</th><th>HR plan ref</th><th>Submitted</th><th></th></tr></thead>
              <tbody>
                {apps.map(a => (
                  <tr key={a.id}>
                    <td className="num">#{a.ranking}</td>
                    <td className="id">{a.profileNumber}</td>
                    <td className="id">{a.idCard}</td>
                    <td><strong>{a.surname}</strong>, {a.name}</td>
                    <td>{a.subject}</td>
                    <td>{a.grade}</td>
                    <td><StatusDot status={a.status}/></td>
                    <td>{a.alreadyEmployee ? <span className="tag blue">Yes</span> : <span className="muted">No</span>}</td>
                    <td className="id">{a.hrPlanRef}</td>
                    <td className="num">{a.submittedOn}</td>
                    <td><button className="btn sm">Open</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "seniority" && (
        <div className="card"><div className="card-head"><h2>Supply teacher seniority list</h2></div>
          <table className="table compact">
            <thead><tr><th>Rank</th><th>ID Card</th><th>Name</th><th>Subject</th><th>Years supply</th><th>Available</th></tr></thead>
            <tbody>{D.PEOPLE.slice(0,12).map((p,i)=>(
              <tr key={p.idCard}><td className="num">{i+1}</td><td className="id">{p.idCard}</td><td>{p.surname}, {p.name}</td><td>{p.teachingOf||"—"}</td><td className="num">{(i*0.7+1.3).toFixed(1)}</td><td>{i%3===0 ? <span className="tag green">Available</span> : <span className="tag gray">Engaged</span>}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === "hr-plan" && (
        <div className="card"><div className="card-head"><h2>HR plan — authorised vs filled</h2></div>
          <table className="table">
            <thead><tr><th>Department</th><th>Designation</th><th className="num right">Authorised</th><th className="num right">Filled</th><th className="num right">Vacant</th><th>Fill rate</th></tr></thead>
            <tbody>{D.HR_PLAN.map((h,i)=>(
              <tr key={i}><td>{h.dept}</td><td>{h.desig}</td><td className="num right">{h.authorised}</td><td className="num right">{h.filled}</td><td className="num right">{h.vacant}</td><td><span className="bar-mini"><span style={{width:(h.filled/h.authorised*100)+"%"}}></span></span><span className="num">{Math.round(h.filled/h.authorised*100)}%</span></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === "results" && (
        <div className="card"><div className="card-head"><h2>Consolidated result sheet</h2></div>
          <table className="table compact">
            <thead><tr><th>ID</th><th>Name</th><th>Track</th><th>Subject/Designation</th><th>Status</th><th>Outcome</th></tr></thead>
            <tbody>{apps.slice(0,15).map(a=>(
              <tr key={a.id}><td className="id">{a.idCard}</td><td>{a.name} {a.surname}</td><td><span className="tag blue">Teaching</span></td><td>{a.subject}</td><td><StatusDot status={a.status}/></td><td>{a.status==="Accepted"?"WEF "+a.wefDate:"—"}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === "non-teaching" && (
        <div className="card"><div className="card-head"><h2>Non-teaching recruitment</h2></div>
          <div className="empty">Same workbench layout as Teaching, with trade designations instead of subjects.</div>
        </div>
      )}

      {showFlow && <RecruitmentFlow stage={stage} setStage={setStage} onClose={()=>setShowFlow(false)}/>}
    </div>
  );
}

function RecruitmentFlow({ stage, setStage, onClose }) {
  const steps = ["Applicant details","Qualifications & subject","HR plan match","Ranking & decision","Confirmation"];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{width:680}} onClick={e=>e.stopPropagation()}>
        <div className="modal-head"><h3>New recruitment application</h3><button className="close" onClick={onClose}>✕</button></div>
        <div style={{padding:"12px 16px"}}>
          <div className="stepper">
            {steps.map((s,i)=>(
              <div key={i} className={"step " + (i<stage?"done":i===stage?"active":"")}>
                <div className="n">Step {i+1}</div><div className="t">{s}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-body">
          {stage === 0 && (
            <div className="fields-grid">
              <div className="field col-2"><label>ID Card</label><input defaultValue="0418876M"/></div>
              <div className="field col-2"><label>Profile number</label><input defaultValue="PROF/2026/019"/></div>
              <div className="field col-2"><label>First name</label><input defaultValue="Annalise"/></div>
              <div className="field col-2"><label>Surname</label><input defaultValue="Mizzi"/></div>
              <div className="field col-2"><label>Email</label><input defaultValue="annalise.mizzi@example.com"/></div>
              <div className="field col-2"><label>Mobile</label><input defaultValue="79123456"/></div>
            </div>
          )}
          {stage === 1 && (
            <div className="fields-grid">
              <div className="field col-2"><label>Grade applied for</label><select><option>Teacher (TCH)</option><option>LSE I</option></select></div>
              <div className="field col-2"><label>Subject</label><select><option>Mathematics</option><option>English</option></select></div>
              <div className="field col-2"><label>Entry qualification</label><input defaultValue="BEd (Hons) Mathematics"/></div>
              <div className="field col-2"><label>MQF level</label><select><option>6</option><option>7</option></select></div>
              <div className="field col-full"><label>Awarding body</label><input defaultValue="University of Malta"/></div>
            </div>
          )}
          {stage === 2 && (
            <div>
              <div className="alert"><span className="ico">ℹ</span><div>Match found in <strong>HR Plan HRP-2026-014 — Mathematics, Teacher</strong>. <strong>16 vacancies</strong> available.</div></div>
              <table className="table" style={{marginTop:10}}>
                <thead><tr><th>HR plan ref</th><th>Department</th><th>Designation</th><th className="right">Auth</th><th className="right">Filled</th><th className="right">Vacant</th></tr></thead>
                <tbody><tr><td className="id">HRP-2026-014</td><td>Mathematics</td><td>Teacher</td><td className="num right">240</td><td className="num right">224</td><td className="num right" style={{color:"var(--green)", fontWeight:600}}>16</td></tr></tbody>
              </table>
            </div>
          )}
          {stage === 3 && (
            <div className="fields-grid">
              <div className="field col-2"><label>Ranking</label><input defaultValue="29"/></div>
              <div className="field col-2"><label>Decision</label><select><option>Passed Step 2</option><option>Accepted</option><option>Postponed</option></select></div>
              <div className="field col-2"><label>WEF date</label><input type="date" defaultValue="2026-09-01"/></div>
              <div className="field col-2"><label>Recruitment type</label><select><option>New</option><option>Replacement</option><option>Spillover</option></select></div>
            </div>
          )}
          {stage === 4 && (
            <div className="alert" style={{background:"var(--green-bg)", borderColor:"#b9dec3"}}>
              <span className="ico" style={{color:"var(--green)"}}>✓</span>
              <div><strong>Application ready for submission.</strong><br/>
              Will create: PRS service record, Engagement letter (Forms), FS4 entry (Tax), Acceptance letter (Documents).</div>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          {stage > 0 && <button className="btn" onClick={()=>setStage(stage-1)}>Back</button>}
          {stage < 4 ? <button className="btn primary" onClick={()=>setStage(stage+1)}>Next</button> : <button className="btn primary" onClick={onClose}>Submit & link to PRS</button>}
        </div>
      </div>
    </div>
  );
}

// ─── PROGRESSIONS ───────────────────────────────────────────
function Progressions() {
  const [tab, setTab] = useState("teachers");
  const tabs = [
    { id: "teachers", label: "Teachers" },
    { id: "eo-hos", label: "EO / HOS" },
    { id: "lse-i", label: "LSE/KGE I" },
    { id: "lse-ii", label: "LSE/KGE II" },
    { id: "lse-iii", label: "LSE/KGE III" },
    { id: "qual", label: "By qualification" },
    { id: "non-teaching", label: "Non-teaching" },
  ];
  const list = D.PROGRESSIONS_DUE;
  const trackName = { teachers: "Teachers", "eo-hos": "EO/HOS", "lse-i": "LSE/KGE I", "lse-ii": "LSE/KGE II", "lse-iii": "LSE/KGE III" };
  const filtered = list.filter(p => tab === "qual" || tab === "non-teaching" || p.track === trackName[tab]);

  return (
    <div className="page">
      <div className="page-head">
        <div><div className="crumbs">Pay & progression</div><h1>Progressions</h1></div>
        <div className="page-actions">
          <button className="btn">Letter to Salaries</button>
          <button className="btn primary">Run progression batch</button>
        </div>
      </div>

      <div className="tabs">{tabs.map(t=><div key={t.id} className={"tab "+(tab===t.id?"active":"")} onClick={()=>setTab(t.id)}>{t.label}</div>)}</div>

      <div className="stats" style={{marginBottom:12}}>
        <div className="stat"><div className="lbl">Due in next 3 months</div><div className="val">{filtered.length}</div></div>
        <div className="stat"><div className="lbl">Letters issued</div><div className="val">{filtered.filter(p=>p.letterIssued).length}</div></div>
        <div className="stat"><div className="lbl">Awaiting reply</div><div className="val">{filtered.filter(p=>!p.letterIssued).length}</div></div>
        <div className="stat"><div className="lbl">Avg years' service</div><div className="val">11.2</div></div>
      </div>

      {tab === "qual" ? (
        <div className="card"><div className="card-head"><h2>By qualification — applications</h2></div>
          <table className="table compact">
            <thead><tr><th>ID</th><th>Name</th><th>Grade</th><th>Qualification</th><th>MQF</th><th>From → To scale</th><th>WEF</th><th>Status</th></tr></thead>
            <tbody>{D.QUAL_ALLOWANCE.map(q=>(
              <tr key={q.id}><td className="id">{q.idCard}</td><td>{q.name}</td><td>{q.grade}</td><td>{q.title}</td><td className="num">{q.mqf}</td><td className="num">12 → 11</td><td className="num">{q.effectiveDate}</td><td>{q.psdApproval ? <span className="tag green">Approved</span> : <span className="tag amber">Pending</span>}</td></tr>
            ))}</tbody>
          </table>
        </div>
      ) : (
        <div className="card"><div className="card-head"><h2>Service-based progressions</h2><div className="right"><button className="btn sm">Calculate effective service</button></div></div>
          <table className="table compact">
            <thead><tr><th>ID Card</th><th>Name</th><th>Grade</th><th>Years (eff.)</th><th>Scale</th><th>WEF</th><th>Pay point</th><th>Letter</th><th></th></tr></thead>
            <tbody>{filtered.map(p=>(
              <tr key={p.id}>
                <td className="id">{p.idCard}</td><td>{p.name}</td><td>{p.gradeDesc}</td>
                <td className="num">{p.yearsService}</td>
                <td className="num">Scale {p.fromScale} → {p.toScale}</td>
                <td className="num">{p.effectiveDate}</td>
                <td className="id">{p.paypoint}</td>
                <td>{p.letterIssued ? <span className="tag green">Issued</span> : <span className="tag amber">Draft</span>}</td>
                <td><button className="btn sm">View calc</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── INCREMENTS ─────────────────────────────────────────────
function Increments() {
  const [rows, setRows] = useState(D.INCREMENTS);
  const [filter, setFilter] = useState("all");
  const [officer, setOfficer] = useState("all");
  const [region, setRegion] = useState("all");
  const [selected, setSelected] = useState(new Set());

  const visible = rows.filter(r => {
    if (filter === "pending" && r.grantedStatus !== 0) return false;
    if (filter === "granted" && r.grantedStatus !== 1) return false;
    if (filter === "not-granted" && r.grantedStatus !== 2) return false;
    if (filter === "other" && r.grantedStatus !== 3) return false;
    if (officer !== "all" && r.officer !== officer) return false;
    if (region === "malta" && r.isGozo) return false;
    if (region === "gozo" && !r.isGozo) return false;
    return true;
  });

  const toggle = id => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const setStatus = (status) => {
    setRows(rows.map(r => selected.has(r.id) ? {...r, grantedStatus: status} : r));
    setSelected(new Set());
  };

  const sendToSalaries = () => {
    setRows(rows.map(r => selected.has(r.id) ? {...r, sentToSalaries: true} : r));
    setSelected(new Set());
  };

  const statusLabel = { 0: "Pending", 1: "Granted", 2: "Not Granted", 3: "Other" };
  const statusTag = { 0: "amber", 1: "green", 2: "red", 3: "gray" };

  return (
    <div className="page">
      <div className="page-head">
        <div><div className="crumbs">Pay & progression</div><h1>Annual Increments — Cycle 2026</h1></div>
        <div className="page-actions">
          <button className="btn">Import from ER (Excel)</button>
          <button className="btn">Match against PRS</button>
          <button className="btn primary">Export to STS / SRS</button>
        </div>
      </div>

      <div className="alert" style={{marginBottom:12}}>
        <span className="ico">ℹ</span>
        <div><strong>Workbench split.</strong> Records are auto-routed to officer queues by paypoint and grade. Malta uses 49/ paypoints; Gozo uses 59/.</div>
      </div>

      <div className="stats" style={{marginBottom:12}}>
        {[
          {l:"Total in cycle", v: rows.length, c:""},
          {l:"Pending review", v: rows.filter(r=>r.grantedStatus===0).length, c:"amber"},
          {l:"Granted", v: rows.filter(r=>r.grantedStatus===1).length, c:"green"},
          {l:"Not granted", v: rows.filter(r=>r.grantedStatus===2).length, c:"red"},
          {l:"Sent to salaries", v: rows.filter(r=>r.sentToSalaries).length, c:""},
          {l:"Added to PRS", v: rows.filter(r=>r.addedToPRS).length, c:""},
        ].map((s,i)=>(<div key={i} className="stat"><div className="lbl">{s.l}</div><div className="val">{s.v}</div></div>))}
      </div>

      <div className="toolbar">
        <select value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="granted">Granted</option>
          <option value="not-granted">Not granted</option>
          <option value="other">Other</option>
        </select>
        <select value={officer} onChange={e=>setOfficer(e.target.value)}>
          <option value="all">All officers</option>
          {["Carnemolla","Friggieri","Molla","MZ","SZ"].map(o=><option key={o}>{o}</option>)}
        </select>
        <select value={region} onChange={e=>setRegion(e.target.value)}>
          <option value="all">All regions</option>
          <option value="malta">Malta (49/)</option>
          <option value="gozo">Gozo (59/)</option>
        </select>
        <input placeholder="Search ID, name…" style={{width:200}}/>
        <div className="sep"/>
        <span className="muted" style={{fontSize:11}}>{selected.size} selected</span>
        <div className="sep"/>
        <button className="btn sm success" disabled={!selected.size} onClick={()=>setStatus(1)}>✓ Mark granted</button>
        <button className="btn sm danger" disabled={!selected.size} onClick={()=>setStatus(2)}>✕ Mark not granted</button>
        <button className="btn sm" disabled={!selected.size} onClick={()=>setStatus(3)}>~ Mark other</button>
        <div className="sep"/>
        <button className="btn sm primary" disabled={!selected.size} onClick={sendToSalaries}>Send to Salaries</button>
      </div>
      <div className="card" style={{borderTopLeftRadius:0, borderTopRightRadius:0, borderTop:0}}>
        <table className="table compact">
          <thead><tr>
            <th style={{width:24}}><input type="checkbox" onChange={e=>setSelected(e.target.checked ? new Set(visible.map(r=>r.id)) : new Set())}/></th>
            <th>Emp ID</th><th>Name</th><th>Grade</th><th>Pay point</th><th>Officer</th>
            <th className="num right">Next step</th><th className="num right">Next salary</th>
            <th>Prob exp</th><th>Status</th><th>Sent</th><th>PRS</th><th>File no.</th>
          </tr></thead>
          <tbody>{visible.map(r=>(
            <tr key={r.id} className={selected.has(r.id)?"selected":""}>
              <td><input type="checkbox" checked={selected.has(r.id)} onChange={()=>toggle(r.id)}/></td>
              <td className="id">{r.employeeId}</td>
              <td>{r.employeeName}</td>
              <td>{r.shortDesc}</td>
              <td className="id">{r.paypoint}{r.isGozo && <span className="tag gray" style={{marginLeft:4}}>Gozo</span>}</td>
              <td>{r.officer}</td>
              <td className="num right">{r.nextStepLevel}</td>
              <td className="num right">€{r.nextSalary.toLocaleString()}</td>
              <td className="num">{r.probExpDate}</td>
              <td><span className={"tag "+statusTag[r.grantedStatus]}>{statusLabel[r.grantedStatus]}</span></td>
              <td>{r.sentToSalaries ? <span className="tag green">✓</span> : <span className="muted">—</span>}</td>
              <td>{r.addedToPRS ? <span className="tag green">✓</span> : <span className="muted">—</span>}</td>
              <td className="id">{r.fileNumber}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

window.PageB = { Recruitment, Progressions, Increments };
})();
