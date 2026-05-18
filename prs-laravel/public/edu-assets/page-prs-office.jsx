// PRS_Office workspace — master personnel records DB
// Surfaces all 17 tables: PRS_records, PRS_Remarks, PRS_Allowance, PRS_SECQ,
// CustDetails_PRS, CustomerDetails_tbl, Officer_tbl, TeachingGrades, Back_up_Date,
// plus the approval queue inbox for senior officers.

(function(){
const { useState, useMemo, useEffect } = React;
const D = window.HR_DATA;
const P = window.PRS_DATA;
const { useApp, ROLES } = window.Shell;

// ─────────────────────────────────────────────────────────────────
// SHARED HIRE PIPELINE — Recruitment → PRS
// ─────────────────────────────────────────────────────────────────
// New hires accepted in Recruitment are pushed here and broadcast via
// the `new-hire-added` window event. PRSOffice listens and merges them
// into its local state. The hire is also appended to window.HR_DATA.PEOPLE
// so View Employee / search / dossier lookups find the new person.
window.__SHARED_HIRES = window.__SHARED_HIRES || [];

window.addRecruitmentHire = window.addRecruitmentHire || function(hire) {
  // hire = { idCard, firstName, surname, position, salScale, wef, school?, category?, designation?, comments? }
  const ic = (hire.idCard||"").trim();
  if (!ic) { console.warn("addRecruitmentHire: no idCard"); return null; }

  // 1) Push a synthetic Person into HR_DATA.PEOPLE so it can be looked up
  if (!D.PEOPLE.some(p => p.idCard.toLowerCase() === ic.toLowerCase())) {
    D.PEOPLE.push({
      idCard: ic,
      name: hire.firstName || "",
      surname: hire.surname || "",
      birthSurname: hire.surname || "",
      gender: "—",
      dob: "",
      ni: "",
      empNo: `NEW-${Date.now().toString().slice(-6)}`,
      grade: (hire.designation||"TCH").substring(0,3).toUpperCase(),
      gradeDesc: hire.designation || hire.position || "Teacher",
      salScale: Number(hire.salScale) || 10,
      lastSalScale: Number(hire.salScale) || 10,
      paypoint: hire.paypoint || "",
      paypointDesc: hire.school || "—",
      stillInService: true,
      teaching: true,
      confProb: 0,
      commencDate: hire.wef || new Date().toISOString().slice(0,10),
      presentSalary: 0,
    });
  }

  // 2) Build the PRS service-event record
  const now = new Date();
  const date = now.toISOString().slice(0,10);
  const time = now.toTimeString().slice(0,5);
  const record = {
    autoId: Date.now() + Math.floor(Math.random()*1000),
    idCard: ic,
    position: hire.position || hire.designation || "Teacher",
    fromDate: hire.wef || date,
    salScale: hire.salScale || "10/1",
    salary: hire.salary || "—",
    reason: "First Appointment",
    showInGP47: true,
    officer: "recruitment",
    sentToOfficer: false,
    approvedRecords: false,
    uploaded: false,
    dateAdded: date,
    timeAdded: time,
    lastEditDept: "recruitment",
    lastEditTime: `${date} ${time}`,
    _fromRecruitment: true,
    _name: `${hire.firstName||""} ${hire.surname||""}`.trim(),
  };
  window.__SHARED_HIRES.push(record);

  // 3) Notify any subscribers (PRSOffice etc.)
  window.dispatchEvent(new CustomEvent("new-hire-added", { detail: record }));
  window.dispatchEvent(new CustomEvent("toast", {
    detail: `${(hire.firstName||"")} ${(hire.surname||"")} (${ic}) added to PRS as ${record.position}`.trim()
  }));
  return record;
};

// Generic PRS-event helper for any module that needs to push a service event
// with a custom reason / source dept (e.g. Confirmation of Appointment).
window.addPRSEvent = window.addPRSEvent || function(evt) {
  // evt = { idCard, firstName?, surname?, position, salScale?, fromDate?, reason, sourceDept?, comments? }
  const ic = (evt.idCard||"").trim();
  if (!ic) { console.warn("addPRSEvent: no idCard"); return null; }
  // Make sure the person exists for lookup
  if (!D.PEOPLE.some(p => p.idCard.toLowerCase() === ic.toLowerCase()) && (evt.firstName || evt.surname)) {
    D.PEOPLE.push({
      idCard: ic,
      name: evt.firstName || "",
      surname: evt.surname || "",
      birthSurname: evt.surname || "",
      gender: "—", dob: "", ni: "",
      empNo: `PRS-${Date.now().toString().slice(-6)}`,
      grade: (evt.position||"TCH").substring(0,3).toUpperCase(),
      gradeDesc: evt.position || "Employee",
      salScale: Number(String(evt.salScale||"10").split("/")[0]) || 10,
      lastSalScale: Number(String(evt.salScale||"10").split("/")[0]) || 10,
      paypoint: "", paypointDesc: "—",
      stillInService: true, teaching: false, confProb: 1,
      commencDate: evt.fromDate || new Date().toISOString().slice(0,10),
      presentSalary: 0,
    });
  }
  const now = new Date();
  const date = now.toISOString().slice(0,10);
  const time = now.toTimeString().slice(0,5);
  const record = {
    autoId: Date.now() + Math.floor(Math.random()*1000),
    idCard: ic,
    position: evt.position || "Employee",
    fromDate: evt.fromDate || date,
    salScale: evt.salScale || "10/1",
    salary: evt.salary || "—",
    reason: evt.reason || "First Appointment",
    showInGP47: true,
    officer: evt.officer || (evt.sourceDept || "prs-office"),
    sentToOfficer: false, approvedRecords: false, uploaded: false,
    dateAdded: date, timeAdded: time,
    lastEditDept: evt.sourceDept || "prs-office",
    lastEditTime: `${date} ${time}`,
    _name: `${evt.firstName||""} ${evt.surname||""}`.trim(),
  };
  window.__SHARED_HIRES.push(record);
  window.dispatchEvent(new CustomEvent("new-hire-added", { detail: record }));
  window.dispatchEvent(new CustomEvent("toast", {
    detail: `${(evt.firstName||"")} ${(evt.surname||"")} (${ic}) — ${record.reason} added to PRS`.trim()
  }));
  return record;
};

// ── Universal approval pill ───────────────────────────────────
function ApprovalPill({ sent, approved, uploaded, compact }) {
  // 4 stages: Draft → Sent → Approved → Uploaded
  const stage = uploaded ? 3 : approved ? 2 : sent ? 1 : 0;
  const labels = ["Draft", "Sent", "Approved", "Uploaded"];
  const colors = ["gray", "amber", "blue", "green"];
  if (compact) return <span className={"tag " + colors[stage]}>{labels[stage]}</span>;
  return (
    <div className="approval-pill">
      {labels.map((lab, i) => (
        <span key={i} className={"ap-step " + (i <= stage ? "done s-" + colors[i] : "")} title={lab}>
          <span className="ap-dot"></span>
          <span className="ap-lab">{lab}</span>
        </span>
      ))}
    </div>
  );
}
window.ApprovalPill = ApprovalPill;

function StatHero({ label, value, sub, accent }) {
  return (
    <div className={"stat-hero " + (accent || "")}>
      <div className="sh-lab">{label}</div>
      <div className="sh-val">{value}</div>
      {sub && <div className="sh-sub">{sub}</div>}
    </div>
  );
}

function PRSOffice({ readOnly = false } = {}) {
  const { setView, setSelectedPerson, roleKey } = useApp();
  const ro = readOnly;

  // ── ALL STATE AT TOP ────────────────────────────────────────────
  const [mode, setMode]               = useState("menu");
  const [insertType, setInsertType]   = useState("Service");
  const [viewType, setViewType]       = useState("Personal Details");
  const [idCardInput, setIdCardInput] = useState("");
  const [searchQ, setSearchQ]         = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [officerFilter, setOfficerFilter] = useState("");
  const [sortBy, setSortBy]           = useState("date-desc");
  const [deptEditFilter, setDeptEditFilter] = useState("");
  const [editingTimeFor, setEditingTimeFor] = useState(null);
  const [maintTab, setMaintTab]       = useState("prs-records");
  const [svcForm, setSvcForm]         = useState({idCard:"",position:"",fromDate:"",salScale:"",salary:"",reason:"First Appointment",showGP47:true});
  const [allowForm, setAllowForm]     = useState({idCard:"",nature:"",fromDate:"",toDate:"",rate:"",authority:""});
  const [secqForm, setSecqForm]       = useState({idCard:"",secq:""});
  const [remForm, setRemForm]         = useState({idCard:"",date:"",type:"",text:""});
  const [bulkForm, setBulkForm]       = useState({reason:"COLA",fromDate:"",salScale:"",ids:""});
  const [bulkPreview, setBulkPreview] = useState(null); // { matched: [...], unknown: [...] } | null

  const TRACKED_DEPTS = ["prs-office","recruitment","salaries","leaves","discipline-hr","health-safety","forms-docs","terminations","transfers-promotions","progressions","paypoints"];
  const enrichRecord = (r, i) => {
    const d = r.dateAdded || `2026-04-${String((i*3)%28+1).padStart(2,"0")}`;
    const t = r.timeAdded || `${String(8+(i%9)).padStart(2,"0")}:${String((i*7)%60).padStart(2,"0")}`;
    return { ...r, dateAdded:d, timeAdded:t,
      lastEditDept: r.lastEditDept || TRACKED_DEPTS[i % TRACKED_DEPTS.length],
      lastEditTime: r.lastEditTime || `${d} ${t}` };
  };
  const [localPRS, setLocalPRS]       = useState(() => [
    ...(window.__SHARED_HIRES || []),
    ...P.RECENT_PRS.map(enrichRecord),
  ]);

  // ── Subscribe to new-hire-added events from Recruitment ───────
  useEffect(() => {
    const handler = (e) => {
      const r = e.detail;
      setLocalPRS(rs => rs.some(x => x.autoId === r.autoId) ? rs : [r, ...rs]);
    };
    window.addEventListener("new-hire-added", handler);
    return () => window.removeEventListener("new-hire-added", handler);
  }, []);
  const [localAllow, setLocalAllow]   = useState(() => P.HERO_ALLOWANCES.slice());
  const [localSECQ, setLocalSECQ]     = useState(() => P.HERO_SECQ.slice());
  const [localRem, setLocalRem]       = useState(() => P.HERO_REMARKS.slice());

  // ── CONSTANTS ───────────────────────────────────────────────────
  const INSERT_TYPES = ["Service","Allowances","S.E.C.Q.","Remarks","Service Part Time"];
  const VIEW_TYPES   = ["Personal Details","Service","Allowances","S.E.C.Q.","Remarks","PRS","Partial GP 47","Service Part Time","Add COLA","Mobility"];

  const lookupPerson = ic => D.PEOPLE.find(p => p.idCard.toLowerCase() === (ic||"").toLowerCase().trim()) || null;
  const filtered = localPRS.filter(r =>
    (!reasonFilter||r.reason===reasonFilter) &&
    (!officerFilter||r.officer===officerFilter) &&
    (!deptEditFilter||r.lastEditDept===deptEditFilter)
  );
  const sortRecords = rows => {
    const s = [...rows];
    switch(sortBy) {
      case "date-asc":  return s.sort((a,b)=>(a.fromDate||"").localeCompare(b.fromDate||""));
      case "time-desc": return s.sort((a,b)=>((b.dateAdded||"")+" "+(b.timeAdded||"")).localeCompare((a.dateAdded||"")+" "+(a.timeAdded||"")));
      case "time-asc":  return s.sort((a,b)=>((a.dateAdded||"")+" "+(a.timeAdded||"")).localeCompare((b.dateAdded||"")+" "+(b.timeAdded||"")));
      case "edit-desc": return s.sort((a,b)=>(b.lastEditTime||"").localeCompare(a.lastEditTime||""));
      case "edit-asc":  return s.sort((a,b)=>(a.lastEditTime||"").localeCompare(b.lastEditTime||""));
      default:          return s.sort((a,b)=>(b.fromDate||"").localeCompare(a.fromDate||""));
    }
  };
  const recent = sortRecords(filtered);
  const stamp = () => { const d=new Date(); return `${d.toISOString().slice(0,10)} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };
  const touch = (extra={}) => ({ lastEditDept: roleKey, lastEditTime: stamp(), ...extra });
  const updateEditTime = (autoId, newTime) => {
    setLocalPRS(rs => rs.map(r => r.autoId === autoId ? {...r, lastEditTime:newTime, lastEditDept:roleKey} : r));
    setEditingTimeFor(null);
  };

  const saveSVC   = () => { const r={autoId:Date.now(),idCard:svcForm.idCard,position:svcForm.position,fromDate:svcForm.fromDate,salScale:svcForm.salScale,salary:svcForm.salary,reason:svcForm.reason,showInGP47:svcForm.showGP47,officer:"camij",sentToOfficer:false,approvedRecords:false,uploaded:false,dateAdded:new Date().toISOString().slice(0,10),timeAdded:new Date().toTimeString().slice(0,5),...touch()}; setLocalPRS(rs=>[r,...rs]); return r; };
  const saveAllow = () => { const r={id:Date.now(),idCard:allowForm.idCard,nature:allowForm.nature,fromAll:allowForm.fromDate,toAll:allowForm.toDate,rateAll:allowForm.rate,authorityAll:allowForm.authority,officer:"camij",sentToOfficer:false,approvedAllowance:false,uploaded:false}; setLocalAllow(rs=>[r,...rs]); return r; };
  const saveSECQ  = () => { const r={autoId:Date.now(),idCard:secqForm.idCard,secq:secqForm.secq,officer:"camij",dateAdded:new Date().toISOString().split("T")[0],sentToOfficer:false,approvedSecq:false}; setLocalSECQ(rs=>[r,...rs]); return r; };
  const saveRem   = () => { const r={autoId:Date.now(),idCard:remForm.idCard,date:remForm.date,type:remForm.type,text:remForm.text,officer:"camij",approvedRemarks:false,uploaded:false}; setLocalRem(rs=>[r,...rs]); return r; };

  // ── MENU (Pay Points-style dashboard) ───────────────────────────
  if (mode === "menu") {
    const ALL_ACTIONS = [
      {id:"add-employee",  edit:true,  label:"Add Employee / PRS",  icon:"+", desc:"Create a new employee — adds the master PRS record",  onClick:()=>{setInsertType("Service");setMode("insert-prs");}},
      {id:"add-allowance", edit:true,  label:"Add Allowance",       icon:"₪", desc:"Record a new allowance against an employee",            onClick:()=>{setInsertType("Allowances");setMode("insert-prs");}},
      {id:"add-qual",      edit:true,  label:"Add Qualification",   icon:"★", desc:"Add a secondary qualification (S.E.C.Q.) on file",      onClick:()=>{setInsertType("S.E.C.Q.");setMode("insert-prs");}},
      {id:"add-remark",    edit:true,  label:"Add Remark",          icon:"✎", desc:"Free-text annotation against an employee record",       onClick:()=>{setInsertType("Remarks");setMode("insert-prs");}},
      {id:"search",        edit:false, label:"Search Employees",    icon:"⌕", desc:"Browse and search the master register",                  onClick:()=>setMode("search")},
      {id:"bulk-prs",      edit:true,  label:"Bulk PRS",            icon:"≡", desc:"Apply the same record to many employees at once",       onClick:()=>setMode("bulk-prs")},
      {id:"service-events",edit:false, label:"Service events",      icon:"▤", desc:"Browse all service events across the register",          onClick:()=>{setMaintTab("prs-records");setMode("maintenance");}},
      {id:"approval-queue",edit:true,  label:"Approval queue",      icon:"✓", desc:"Senior officer inbox — sent records pending approval",   onClick:()=>{setMaintTab("approvals");setMode("maintenance");}},
    ];
    const ACTIONS = ro ? ALL_ACTIONS.filter(a=>!a.edit) : ALL_ACTIONS;

    return (
      <div className="page">
        <div className="page-head">
          <div>
            <div className="crumbs">PRS Office</div>
            <h1>Personal Records</h1>
            <p className="page-sub">Master employee register. Creating a PRS creates the employee record. Every other module replicates from these tables.</p>
          </div>
          <div className="page-actions">
            {ro && <span className="tag amber">View-only · {ROLES[roleKey]?.label}</span>}
            <button className="btn" onClick={()=>setMode("maintenance")}>{ro?"Browse records":"Maintenance"}</button>
            {!ro && <button className="btn primary" onClick={()=>{setInsertType("Service");setMode("insert-prs");}}>+ New Employee / PRS</button>}
          </div>
        </div>

        <div className="card" style={{marginBottom:14}}>
          <div className="card-head"><h2>Quick lookup</h2></div>
          <div className="card-body" style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <input className="input" style={{flex:1,minWidth:240,maxWidth:320}} placeholder="ID Card No." value={idCardInput} onChange={e=>setIdCardInput(e.target.value)}/>
            <button className="btn primary" onClick={()=>setMode("view-person")} disabled={!idCardInput}>View Employee</button>
            <button className="btn" onClick={()=>setMode("search")}>Browse all</button>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h2>Quick actions</h2></div>
          <div className="card-body" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:10}}>
            {ACTIONS.map(a => (
              <button key={a.id} className="action-card" onClick={a.onClick}>
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

  // ── INSERT PRS ──────────────────────────────────────────────────
  if (mode === "insert-prs") return (
    <div className="page">
      <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:16,flexWrap:"wrap"}}>
        <button className="btn ghost" onClick={()=>setMode("menu")}>← PRS Office</button>
        <h1 style={{margin:0,fontSize:18}}>Insert PRS Records</h1>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {INSERT_TYPES.map(t=><button key={t} className={"btn xs "+(insertType===t?"primary":"")} onClick={()=>setInsertType(t)}>{t}</button>)}
        </div>
      </div>
      <div className="card" style={{maxWidth:640}}>
        <div className="card-head"><h2>New {insertType} Record</h2></div>
        <div className="card-body" style={{padding:"20px 24px"}}>
          {insertType==="Service" && (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{display:"grid",gridTemplateColumns:"140px 1fr",gap:8,alignItems:"center"}}>
                <label className="form-label">ID Card No</label>
                <input className="input" placeholder="e.g. 0259684M" value={svcForm.idCard} onChange={e=>setSvcForm(f=>({...f,idCard:e.target.value}))}/>
                <label className="form-label">Position</label>
                <select className="input" value={svcForm.position} onChange={e=>setSvcForm(f=>({...f,position:e.target.value}))}>
                  <option value=""/>{D.GRADES.map(g=><option key={g.code}>{g.desc}</option>)}
                </select>
                <label className="form-label">From Date</label>
                <input type="date" className="input" value={svcForm.fromDate} onChange={e=>setSvcForm(f=>({...f,fromDate:e.target.value}))}/>
                <label className="form-label">Salary Scale</label>
                <input className="input" placeholder="e.g. 10/3" value={svcForm.salScale} onChange={e=>setSvcForm(f=>({...f,salScale:e.target.value}))}/>
                <label className="form-label">Salary</label>
                <input className="input" placeholder="e.g. €19,488.67" value={svcForm.salary} onChange={e=>setSvcForm(f=>({...f,salary:e.target.value}))}/>
                <label className="form-label">Reason</label>
                <select className="input" value={svcForm.reason} onChange={e=>setSvcForm(f=>({...f,reason:e.target.value}))}>
                  {P.PRS_REASONS.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13}}><input type="checkbox" checked={svcForm.showGP47} onChange={e=>setSvcForm(f=>({...f,showGP47:e.target.checked}))}/>Show in GP47</label>
              <div style={{display:"flex",gap:8}}>
                <button className="btn primary" onClick={()=>{saveSVC();setSvcForm({idCard:"",position:"",fromDate:"",salScale:"",salary:"",reason:"First Appointment",showGP47:true});setMode("menu");}}>Save and Close</button>
                <button className="btn primary" onClick={()=>{saveSVC();setSvcForm(f=>({...f,fromDate:"",salScale:"",salary:""}));}}>Save and Add Another</button>
                <button className="btn" onClick={()=>setMode("menu")}>Close</button>
              </div>
            </div>
          )}
          {insertType==="Allowances" && (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{display:"grid",gridTemplateColumns:"140px 1fr",gap:8,alignItems:"center"}}>
                <label className="form-label">ID Card No</label>
                <input className="input" placeholder="e.g. 0259684M" value={allowForm.idCard} onChange={e=>setAllowForm(f=>({...f,idCard:e.target.value}))}/>
                <label className="form-label">Nature</label>
                <input className="input" placeholder="e.g. Teaching Duties" value={allowForm.nature} onChange={e=>setAllowForm(f=>({...f,nature:e.target.value}))}/>
                <label className="form-label">From Date</label>
                <input type="date" className="input" value={allowForm.fromDate} onChange={e=>setAllowForm(f=>({...f,fromDate:e.target.value}))}/>
                <label className="form-label">To Date</label>
                <input type="date" className="input" value={allowForm.toDate} onChange={e=>setAllowForm(f=>({...f,toDate:e.target.value}))}/>
                <label className="form-label">Rate</label>
                <input className="input" placeholder="e.g. €2,400 pa" value={allowForm.rate} onChange={e=>setAllowForm(f=>({...f,rate:e.target.value}))}/>
                <label className="form-label">Authority</label>
                <input className="input" placeholder="e.g. Educ. All 31/96" value={allowForm.authority} onChange={e=>setAllowForm(f=>({...f,authority:e.target.value}))}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn primary" onClick={()=>{saveAllow();setAllowForm({idCard:"",nature:"",fromDate:"",toDate:"",rate:"",authority:""});setMode("menu");}}>Save and Close</button>
                <button className="btn primary" onClick={()=>{saveAllow();setAllowForm(f=>({...f,nature:"",fromDate:"",toDate:"",rate:"",authority:""}));}}>Save and Add Another</button>
                <button className="btn" onClick={()=>setMode("menu")}>Close</button>
              </div>
            </div>
          )}
          {insertType==="S.E.C.Q." && (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{display:"grid",gridTemplateColumns:"140px 1fr",gap:8,alignItems:"center"}}>
                <label className="form-label">ID Card No</label>
                <input className="input" placeholder="e.g. 0259684M" value={secqForm.idCard} onChange={e=>setSecqForm(f=>({...f,idCard:e.target.value}))}/>
                <label className="form-label">Qualification</label>
                <input className="input" placeholder="e.g. Master of Education" value={secqForm.secq} onChange={e=>setSecqForm(f=>({...f,secq:e.target.value}))}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn primary" onClick={()=>{saveSECQ();setSecqForm({idCard:"",secq:""});setMode("menu");}}>Save and Close</button>
                <button className="btn primary" onClick={()=>{saveSECQ();setSecqForm(f=>({...f,secq:""}));}}>Save and Add Another</button>
                <button className="btn" onClick={()=>setMode("menu")}>Close</button>
              </div>
            </div>
          )}
          {insertType==="Remarks" && (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{display:"grid",gridTemplateColumns:"140px 1fr",gap:8,alignItems:"center"}}>
                <label className="form-label">ID Card No</label>
                <input className="input" placeholder="e.g. 0259684M" value={remForm.idCard} onChange={e=>setRemForm(f=>({...f,idCard:e.target.value}))}/>
                <label className="form-label">Date</label>
                <input type="date" className="input" value={remForm.date} onChange={e=>setRemForm(f=>({...f,date:e.target.value}))}/>
                <label className="form-label">Type</label>
                <input className="input" placeholder="e.g. Posting" value={remForm.type} onChange={e=>setRemForm(f=>({...f,type:e.target.value}))}/>
                <label className="form-label">Remark</label>
                <textarea className="input" rows={4} style={{resize:"none"}} value={remForm.text} onChange={e=>setRemForm(f=>({...f,text:e.target.value}))} placeholder="Free-text annotation…"/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn primary" onClick={()=>{saveRem();setRemForm({idCard:"",date:"",type:"",text:""});setMode("menu");}}>Save and Close</button>
                <button className="btn primary" onClick={()=>{saveRem();setRemForm(f=>({...f,date:"",type:"",text:""}));}}>Save and Add Another</button>
                <button className="btn" onClick={()=>setMode("menu")}>Close</button>
              </div>
            </div>
          )}
          {insertType==="Service Part Time" && (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{display:"grid",gridTemplateColumns:"140px 1fr",gap:8,alignItems:"center"}}>
                <label className="form-label">ID Card No</label>
                <input className="input" placeholder="e.g. 0259684M" value={svcForm.idCard} onChange={e=>setSvcForm(f=>({...f,idCard:e.target.value}))}/>
                <label className="form-label">Position</label>
                <select className="input" value={svcForm.position} onChange={e=>setSvcForm(f=>({...f,position:e.target.value}))}>
                  <option value=""/>{D.GRADES.map(g=><option key={g.code}>{g.desc}</option>)}
                </select>
                <label className="form-label">From Date</label>
                <input type="date" className="input" value={svcForm.fromDate} onChange={e=>setSvcForm(f=>({...f,fromDate:e.target.value}))}/>
                <label className="form-label">Rate (per hr)</label>
                <input className="input" placeholder="e.g. €23.74 per hour" value={svcForm.salary} onChange={e=>setSvcForm(f=>({...f,salary:e.target.value}))}/>
                <label className="form-label">Reason</label>
                <select className="input" value={svcForm.reason} onChange={e=>setSvcForm(f=>({...f,reason:e.target.value}))}>
                  {P.PRS_REASONS.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn primary" onClick={()=>{saveSVC();setSvcForm({idCard:"",position:"",fromDate:"",salScale:"",salary:"",reason:"First Appointment",showGP47:true});setMode("menu");}}>Save and Close</button>
                <button className="btn" onClick={()=>setMode("menu")}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── VIEW PERSON (consolidated dossier — all sections, printable) ─
  if (mode === "view-person") {
    const person   = lookupPerson(idCardInput);
    const pPRS     = localPRS.filter(r=>r.idCard===idCardInput);
    const pPRSgp47 = pPRS.filter(r=>r.showInGP47);
    const pPT      = pPRS.filter(r=>r.partTime || /part.?time/i.test(r.position||""));
    const pCola    = pPRS.filter(r=>/cola/i.test(r.reason||""));
    const pAllow   = localAllow.filter(r=>r.idCard===idCardInput);
    const pSECQ    = localSECQ.filter(r=>r.idCard===idCardInput);
    const pRem     = localRem.filter(r=>r.idCard===idCardInput);

    return (
      <div className="page prs-dossier">
        <div className="dossier-toolbar no-print" style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
          <button className="btn ghost" onClick={()=>setMode("menu")}>← PRS Office</button>
          <h1 style={{margin:0,fontSize:18}}>Employee Record</h1>
          <div style={{flex:1}}/>
          <select className="input sm" title="Sort service records" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
            <option value="date-desc">Sort: Date ↓</option>
            <option value="date-asc">Sort: Date ↑</option>
            <option value="time-desc">Sort: Time ↓</option>
            <option value="time-asc">Sort: Time ↑</option>
            <option value="edit-desc">Sort: Last edit ↓</option>
            <option value="edit-asc">Sort: Last edit ↑</option>
          </select>
          {!ro && <button className="btn" onClick={()=>{setSvcForm(f=>({...f,idCard:idCardInput}));setInsertType("Service");setMode("insert-prs");}}>+ Service</button>}
          {!ro && <button className="btn" onClick={()=>{setAllowForm(f=>({...f,idCard:idCardInput}));setInsertType("Allowances");setMode("insert-prs");}}>+ Allowance</button>}
          <button className="btn primary" onClick={()=>window.print()}>🖨 Print</button>
        </div>

        {person ? (
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
        ) : idCardInput && <div className="muted xs" style={{marginBottom:12}}>Person not found: {idCardInput}</div>}

        {!person ? null : <>

        {/* 1. Personal Details */}
        <div className="card section">
          <div className="card-head"><h2>1 · Personal Details</h2></div>
          <table className="table compact">
            <tbody>{[
              ["ID Card",person.idCard],["NI",person.ni],["Name",person.name],["Surname",person.surname],
              ["Birth Surname",person.birthSurname||"—"],["Gender",person.gender],["DOB",person.dob],
              ["Grade",person.gradeDesc],["Pay Point",person.paypointDesc],["Salary Scale",person.salScale],
              ["In Service",person.stillInService?"Yes":"No"]
            ].map(([k,v])=>(
              <tr key={k}><td style={{fontWeight:600,width:160}}>{k}</td><td>{v}</td></tr>
            ))}</tbody>
          </table>
        </div>

        {/* 2. Service */}
        <div className="card section">
          <div className="card-head"><h2>2 · Service ({pPRS.length})</h2></div>
          <table className="table compact">
            <thead><tr><th>From</th><th>Position</th><th>Scale</th><th>Salary</th><th>Reason</th><th>Added</th><th>Last edit</th><th>GP47</th></tr></thead>
            <tbody>{pPRS.length>0 ? sortRecords(pPRS).map((r,i)=>(
              <tr key={i}>
                <td className="num">{r.fromDate}</td>
                <td>{r.position}</td>
                <td className="mono">{r.salScale}</td>
                <td className="mono">{r.salary}</td>
                <td><span className="tag gray">{r.reason}</span></td>
                <td className="mono xs">{r.dateAdded} {r.timeAdded}</td>
                <td>
                  {editingTimeFor===r.autoId ? (
                    <input className="input sm" autoFocus defaultValue={r.lastEditTime} style={{width:160}}
                      onBlur={e=>updateEditTime(r.autoId,e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter")updateEditTime(r.autoId,e.currentTarget.value);if(e.key==="Escape")setEditingTimeFor(null);}}/>
                  ) : (
                    <span style={{display:"flex",alignItems:"center",gap:6}}>
                      <span className="tag pink" style={{fontSize:10}}>{ROLES[r.lastEditDept]?.label || r.lastEditDept}</span>
                      <span className="mono xs">{r.lastEditTime}</span>
                      {!ro && <button className="btn xs ghost no-print" title="Edit time (your dept)" onClick={()=>setEditingTimeFor(r.autoId)}>✎</button>}
                    </span>
                  )}
                </td>
                <td>{r.showInGP47?<span className="check">✓</span>:"—"}</td>
              </tr>
            )) : <tr><td colSpan={8} className="muted" style={{padding:"16px",textAlign:"center"}}>No service records.</td></tr>}</tbody>
          </table>
        </div>

        {/* 3. Service — Part-Time */}
        <div className="card section">
          <div className="card-head"><h2>3 · Service — Part-Time ({pPT.length})</h2></div>
          <table className="table compact">
            <thead><tr><th>From</th><th>Position</th><th>Rate</th><th>Reason</th><th>Officer</th></tr></thead>
            <tbody>{pPT.length>0 ? sortRecords(pPT).map((r,i)=>(
              <tr key={i}><td className="num">{r.fromDate}</td><td>{r.position}</td><td className="mono">{r.salary}</td><td><span className="tag gray">{r.reason}</span></td><td className="mono xs">{r.officer}</td></tr>
            )) : <tr><td colSpan={5} className="muted" style={{padding:"16px",textAlign:"center"}}>No part-time records.</td></tr>}</tbody>
          </table>
        </div>

        {/* 4. Partial GP 47 */}
        <div className="card section">
          <div className="card-head"><h2>4 · Partial GP 47 — visible records ({pPRSgp47.length})</h2><div className="right muted xs">ShowInGP47 = true</div></div>
          <table className="table compact">
            <thead><tr><th>From</th><th>Position</th><th>Scale</th><th>Salary</th><th>Reason</th></tr></thead>
            <tbody>{pPRSgp47.length>0 ? sortRecords(pPRSgp47).map((r,i)=>(
              <tr key={i}><td className="num">{r.fromDate}</td><td>{r.position}</td><td className="mono">{r.salScale}</td><td className="mono">{r.salary}</td><td><span className="tag gray">{r.reason}</span></td></tr>
            )) : <tr><td colSpan={5} className="muted" style={{padding:"16px",textAlign:"center"}}>No GP47 entries.</td></tr>}</tbody>
          </table>
        </div>

        {/* 5. COLA */}
        <div className="card section">
          <div className="card-head"><h2>5 · COLA history ({pCola.length})</h2></div>
          {pCola.length>0 ? (
            <table className="table compact">
              <thead><tr><th>From</th><th>Scale</th><th>Salary</th><th>Officer</th></tr></thead>
              <tbody>{sortRecords(pCola).map((r,i)=>(
                <tr key={i}><td className="num">{r.fromDate}</td><td className="mono">{r.salScale}</td><td className="mono">{r.salary}</td><td className="mono xs">{r.officer}</td></tr>
              ))}</tbody>
            </table>
          ) : <div className="muted xs" style={{padding:"14px 16px"}}>No COLA records on file. COLA is applied annually each January via App_Cola_1…4.</div>}
        </div>

        {/* 6. Allowances */}
        <div className="card section">
          <div className="card-head"><h2>6 · Allowances ({pAllow.length})</h2></div>
          <table className="table compact">
            <thead><tr><th>Nature</th><th>From</th><th>To</th><th>Rate</th><th>Authority</th></tr></thead>
            <tbody>{pAllow.length>0?pAllow.map((r,i)=>(
              <tr key={i}><td>{r.nature}</td><td className="num">{r.fromAll}</td><td className="num">{r.toAll||<span className="tag green">Open</span>}</td><td className="mono">{r.rateAll}</td><td className="muted xs">{r.authorityAll}</td></tr>
            )):<tr><td colSpan={5} className="muted" style={{padding:"16px",textAlign:"center"}}>No allowances.</td></tr>}</tbody>
          </table>
        </div>

        {/* 7. Qualifications (S.E.C.Q.) */}
        <div className="card section">
          <div className="card-head"><h2>7 · Qualifications — S.E.C.Q. ({pSECQ.length})</h2></div>
          <table className="table compact">
            <thead><tr><th>Qualification</th><th>Date Added</th><th>Officer</th></tr></thead>
            <tbody>{pSECQ.length>0?pSECQ.map((r,i)=>(
              <tr key={i}><td>{r.secq}</td><td className="num">{r.dateAdded}</td><td className="mono xs">{r.officer}</td></tr>
            )):<tr><td colSpan={3} className="muted" style={{padding:"16px",textAlign:"center"}}>None on file.</td></tr>}</tbody>
          </table>
        </div>

        {/* 8. Remarks */}
        <div className="card section">
          <div className="card-head"><h2>8 · Remarks ({pRem.length})</h2></div>
          <table className="table compact">
            <thead><tr><th>Date</th><th>Type</th><th>Remark</th><th>Officer</th></tr></thead>
            <tbody>{pRem.length>0?pRem.map((r,i)=>(
              <tr key={i}><td className="num">{r.date}</td><td><span className="tag gray">{r.type}</span></td><td style={{maxWidth:480}}>{r.text}</td><td className="mono xs">{r.officer}</td></tr>
            )):<tr><td colSpan={4} className="muted" style={{padding:"16px",textAlign:"center"}}>No remarks.</td></tr>}</tbody>
          </table>
        </div>

        {/* 9. Mobility */}
        <div className="card section">
          <div className="card-head"><h2>9 · Mobility</h2></div>
          <div className="muted xs" style={{padding:"14px 16px"}}>Mobility periods that count towards progression service. {(person.mobility||[]).length===0 && "No mobility records on file for this employee."}</div>
        </div>

        {/* Footer (print only) */}
        <div className="dossier-footer print-only muted xs">
          Printed {new Date().toLocaleString()} · {ROLES[roleKey]?.label || "—"} · Education HR — Personnel Record Sheet
        </div>

        </>}
      </div>
    );
  }

  // ── SEARCH PERSON ───────────────────────────────────────────────
  if (mode === "search") {
    const matches = searchQ
      ? D.PEOPLE.filter(p=>p.idCard.toLowerCase().includes(searchQ.toLowerCase())||`${p.name} ${p.surname}`.toLowerCase().includes(searchQ.toLowerCase())||(p.empNo||"").toLowerCase().includes(searchQ.toLowerCase())).slice(0,20)
      : D.PEOPLE.slice(0,20);
    return (
      <div className="page">
        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:16}}>
          <button className="btn ghost" onClick={()=>setMode("menu")}>← PRS Office</button>
          <h1 style={{margin:0,fontSize:18}}>Search Person</h1>
          <input className="input" style={{flex:1,maxWidth:400}} placeholder="Search by ID card, name or employee no…" value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
        </div>
        <div className="card">
          <table className="table compact">
            <thead><tr><th>ID Card</th><th>Name</th><th>Grade</th><th>Pay Point</th><th>In Service</th><th></th></tr></thead>
            <tbody>
              {matches.map(p=>(
                <tr key={p.idCard}>
                  <td className="id">{p.idCard}</td>
                  <td>{p.name} {p.surname}</td>
                  <td className="muted xs">{p.gradeDesc}</td>
                  <td className="muted xs">{p.paypointDesc}</td>
                  <td>{p.stillInService?<span className="tag green">Yes</span>:<span className="tag red">No</span>}</td>
                  <td style={{display:"flex",gap:4}}>
                    <button className="btn xs" onClick={()=>{setIdCardInput(p.idCard);setMode("view-person");}}>View PRS</button>
                    <button className="btn xs" onClick={()=>{setSelectedPerson(p);setView("employee-detail");}}>Profile</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="card-foot muted xs">Showing {matches.length} results{searchQ?' for "'+searchQ+'"':" (top 20)"}.</div>
        </div>
      </div>
    );
  }

  // ── BULK PRS ────────────────────────────────────────────────────
  if (mode === "bulk-prs") return (
    <div className="page">
      <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:16}}>
        <button className="btn ghost" onClick={()=>setMode("menu")}>← PRS Office</button>
        <h1 style={{margin:0,fontSize:18}}>Bulk PRS</h1>
      </div>
      <div className="card" style={{maxWidth:680}}>
        <div className="card-head"><h2>Bulk_PRS — Mass record entry</h2></div>
        <div className="card-body" style={{padding:"14px 20px"}}>
          <p className="muted" style={{marginTop:0}}>Load ID card numbers for employees who should receive the same PRS entry (mass COLA, assimilation, end-of-scholastic-year contracts). Fill in the common fields once; the system creates one record per ID.</p>
          <div style={{display:"grid",gridTemplateColumns:"140px 1fr",gap:8,alignItems:"center",marginBottom:16}}>
            <label className="form-label">Reason</label>
            <select className="input" value={bulkForm.reason} onChange={e=>setBulkForm(f=>({...f,reason:e.target.value}))}>{P.PRS_REASONS.map(r=><option key={r}>{r}</option>)}</select>
            <label className="form-label">From Date</label>
            <input type="date" className="input" value={bulkForm.fromDate} onChange={e=>setBulkForm(f=>({...f,fromDate:e.target.value}))}/>
            <label className="form-label">Salary Scale</label>
            <input className="input" placeholder="e.g. COLA 2026" value={bulkForm.salScale} onChange={e=>setBulkForm(f=>({...f,salScale:e.target.value}))}/>
            <label className="form-label">ID Cards</label>
            <textarea className="input" rows={6} style={{resize:"vertical"}} placeholder={"One ID card per line:\n12345678M\n87654321F\n…"}
              value={bulkForm.ids} onChange={e=>setBulkForm(f=>({...f,ids:e.target.value}))}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn primary" onClick={()=>{
              const lines = bulkForm.ids.split(/[\r\n,;]+/).map(s=>s.trim()).filter(Boolean);
              const matched = []; const unknown = [];
              lines.forEach(ic => {
                const p = D.PEOPLE.find(x => x.idCard.toLowerCase() === ic.toLowerCase());
                p ? matched.push(p) : unknown.push(ic);
              });
              setBulkPreview({matched, unknown, reason:bulkForm.reason, fromDate:bulkForm.fromDate, salScale:bulkForm.salScale});
              window.dispatchEvent(new CustomEvent("toast", { detail: `Bulk preview: ${matched.length} matched, ${unknown.length} unknown` }));
            }}>Preview bulk insert</button>
            <button className="btn" onClick={()=>{ setBulkForm({reason:"COLA",fromDate:"",salScale:"",ids:""}); setBulkPreview(null); }}>Clear</button>
            <button className="btn ghost" onClick={()=>setMode("menu")}>Cancel</button>
          </div>
          {bulkPreview && (
            <div className="card" style={{marginTop:14,background:"var(--panel-2)"}}>
              <div className="card-head"><h2>Preview — {bulkPreview.matched.length + bulkPreview.unknown.length} ID cards parsed</h2></div>
              <div className="card-body" style={{padding:"10px 14px"}}>
                <p className="muted xs" style={{marginTop:0}}>
                  Each match below would receive a new PRS record with reason <strong>{bulkPreview.reason || "—"}</strong>,
                  from date <strong>{bulkPreview.fromDate || "—"}</strong>, scale <strong>{bulkPreview.salScale || "—"}</strong>.
                </p>
                {bulkPreview.matched.length > 0 && (
                  <div style={{marginBottom:10}}>
                    <div style={{fontWeight:600,fontSize:12,marginBottom:4}}>Matched ({bulkPreview.matched.length})</div>
                    <table className="table compact">
                      <thead><tr><th>ID Card</th><th>Name</th><th>Grade</th><th>Paypoint</th></tr></thead>
                      <tbody>{bulkPreview.matched.slice(0,20).map(p=>(
                        <tr key={p.idCard}><td className="id">{p.idCard}</td><td>{p.name} {p.surname}</td><td className="muted xs">{p.gradeDesc}</td><td className="mono xs">{p.paypoint}</td></tr>
                      ))}</tbody>
                    </table>
                    {bulkPreview.matched.length > 20 && <p className="muted xs">… and {bulkPreview.matched.length - 20} more.</p>}
                  </div>
                )}
                {bulkPreview.unknown.length > 0 && (
                  <div>
                    <div style={{fontWeight:600,fontSize:12,marginBottom:4,color:"var(--amber-2)"}}>Unknown ({bulkPreview.unknown.length})</div>
                    <code style={{fontSize:11,display:"block",whiteSpace:"pre-wrap"}}>{bulkPreview.unknown.join(", ")}</code>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── MAINTENANCE ─────────────────────────────────────────────────
  const MTABS = [
    {id:"prs-records",label:"Service events",count:P.PRS_STATS.prsRecordsTotal.toLocaleString()},
    {id:"remarks",    label:"Remarks",        count:P.PRS_STATS.remarksTotal.toLocaleString()},
    {id:"allowance",  label:"Allowances",     count:P.PRS_STATS.allowanceTotal.toLocaleString()},
    {id:"secq",       label:"Qualifications", count:P.PRS_STATS.secqTotal.toLocaleString()},
    {id:"people",     label:"People",         count:P.PRS_STATS.customerDetailsTotal.toLocaleString()},
    {id:"files",      label:"File numbers",   count:P.PRS_STATS.fileNumbersTotal.toLocaleString()},
    {id:"officers",   label:"Officers",       count:P.OFFICERS.length},
    {id:"grades",     label:"Grades",         count:D.GRADES.length},
    {id:"approvals",  label:"Approval queue", count:P.APPROVAL_QUEUE.length,pulse:true},
    {id:"admin",      label:"Schema / backup"},
  ];
  return (
    <div className="page">
      <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:0,flexWrap:"wrap"}}>
        <button className="btn ghost" onClick={()=>setMode("menu")}>← PRS Office</button>
        <h1 style={{margin:0,fontSize:18}}>Maintenance Menu</h1>
        <div style={{flex:1}}/>
        <button className="btn" onClick={()=>{
          // Export the visible maintenance tab as XLSX (or CSV fallback).
          const tabName = MTABS.find(t=>t.id===maintTab)?.label || maintTab;
          const data = maintTab==="prs-records" ? recent
            : maintTab==="remarks"   ? localRem
            : maintTab==="allowance" ? localAllow
            : maintTab==="secq"      ? localSECQ
            : maintTab==="people"    ? D.PEOPLE
            : maintTab==="files"     ? P.FILE_NUMBERS
            : maintTab==="officers"  ? P.OFFICERS
            : maintTab==="grades"    ? D.GRADES
            : maintTab==="approvals" ? P.APPROVAL_QUEUE
            : [];
          if (window.XLSX) {
            const ws = window.XLSX.utils.json_to_sheet(data);
            const wb = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(wb, ws, tabName.slice(0,28));
            window.XLSX.writeFile(wb, `prs-${maintTab}-${new Date().toISOString().slice(0,10)}.xlsx`);
            window.dispatchEvent(new CustomEvent("toast", { detail: `Exported ${data.length} rows from ${tabName}` }));
          } else {
            window.dispatchEvent(new CustomEvent("toast", { detail: "Export failed — XLSX library not loaded" }));
          }
        }}>Export</button>
        <button className="btn" onClick={()=>{
          window.dispatchEvent(new CustomEvent("toast", { detail: `Sync started for ${MTABS.find(t=>t.id===maintTab)?.label || maintTab} — see audit log` }));
        }}>Run sync</button>
        {!ro && <button className="btn primary" onClick={()=>setMode("insert-prs")}>+ New PRS record</button>}
      </div>
      <div className="tabs scrolly">
        {MTABS.map(t=>(
          <div key={t.id} className={"tab "+(maintTab===t.id?"active":"")} onClick={()=>setMaintTab(t.id)}>
            {t.label}{t.count!=null&&<span className={"count"+(t.pulse?" pulse":"")}>{t.count}</span>}
          </div>
        ))}
      </div>

      {maintTab==="prs-records" && (
        <div className="card">
          <div className="card-head">
            <h2>Service events</h2>
            <div className="right" style={{flexWrap:"wrap"}}>
              <select className="input sm" title="Sort" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                <option value="date-desc">Date — newest</option>
                <option value="date-asc">Date — oldest</option>
                <option value="time-desc">Time added — newest</option>
                <option value="time-asc">Time added — oldest</option>
                <option value="edit-desc">Last edit — newest</option>
                <option value="edit-asc">Last edit — oldest</option>
              </select>
              <select className="input sm" title="Filter by edit department" value={deptEditFilter} onChange={e=>setDeptEditFilter(e.target.value)}>
                <option value="">All depts (edit)</option>
                {Object.entries(ROLES).filter(([k])=>k!=="super-admin").map(([k,r])=><option key={k} value={k}>{r.label}</option>)}
              </select>
              <select className="input sm" title="Filter by reason" value={reasonFilter} onChange={e=>setReasonFilter(e.target.value)}>
                <option value="">All reasons</option>{P.PRS_REASONS.map(r=><option key={r}>{r}</option>)}
              </select>
              <select className="input sm" title="Filter by officer" value={officerFilter} onChange={e=>setOfficerFilter(e.target.value)}>
                <option value="">All officers</option>{P.OFFICERS.map(o=><option key={o.username} value={o.username}>{o.username}</option>)}
              </select>
              <button className="btn sm">Export CSV</button>
            </div>
          </div>
          <div className="muted xs" style={{padding:"6px 12px",borderBottom:"1px solid var(--line-2)"}}>
            One row per employment event. Default sort is by date (newest first). Click ✎ next to a Last edit cell to override the timestamp — the edit will be attributed to your current department ({ROLES[roleKey]?.label || "—"}).
          </div>
          <div className="table-scroll">
            <table className="table compact">
              <thead><tr><th>Auto_id</th><th>ID Card</th><th>Position</th><th>Reason</th><th>From</th><th>Date added</th><th>Time</th><th>Last edit (dept · time)</th><th>GP47</th><th>Status</th></tr></thead>
              <tbody>{recent.map(r=>(
                <tr key={r.autoId}>
                  <td className="mono">{r.autoId}</td>
                  <td className="id" style={{cursor:"pointer"}} onClick={()=>{const p=D.PEOPLE.find(x=>x.idCard===r.idCard);if(p){setSelectedPerson(p);setView("employee-detail");}}}>{r.idCard}</td>
                  <td>{r.position}</td>
                  <td><span className="tag gray">{r.reason}</span></td>
                  <td className="num">{r.fromDate}</td>
                  <td className="num xs">{r.dateAdded}</td>
                  <td className="mono xs">{r.timeAdded}</td>
                  <td>
                    {editingTimeFor===r.autoId ? (
                      <input className="input sm" autoFocus defaultValue={r.lastEditTime} style={{width:160}}
                        onBlur={e=>updateEditTime(r.autoId,e.target.value)}
                        onKeyDown={e=>{if(e.key==="Enter")updateEditTime(r.autoId,e.currentTarget.value);if(e.key==="Escape")setEditingTimeFor(null);}}/>
                    ) : (
                      <span style={{display:"flex",alignItems:"center",gap:6}}>
                        <span className="tag pink" style={{fontSize:10}}>{ROLES[r.lastEditDept]?.label || r.lastEditDept}</span>
                        <span className="mono xs">{r.lastEditTime}</span>
                        {!ro && <button className="btn xs ghost" title="Edit time (your dept)" onClick={()=>setEditingTimeFor(r.autoId)}>✎</button>}
                      </span>
                    )}
                  </td>
                  <td>{r.showInGP47?<span className="check">✓</span>:<span className="muted">—</span>}</td>
                  <td><ApprovalPill compact sent={r.sentToOfficer} approved={r.approvedRecords} uploaded={r.uploaded}/></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="card-foot"><span className="muted xs">Showing {recent.length} of {P.PRS_STATS.prsRecordsTotal.toLocaleString()} rows · sorted by {sortBy.replace("-"," ").replace("desc","↓").replace("asc","↑")}{deptEditFilter?` · last edited by ${ROLES[deptEditFilter]?.label}`:""}</span></div>
        </div>
      )}
      {maintTab==="remarks" && (
        <div className="card">
          <div className="card-head"><h2>Remarks</h2><div className="right"><span className="tag amber">{P.PRS_STATS.remarksPending} pending</span>{!ro && <button className="btn sm primary" onClick={()=>{setInsertType("Remarks");setMode("insert-prs");}}>+ Add remark</button>}</div></div>
          <div className="muted xs" style={{padding:"6px 12px",borderBottom:"1px solid var(--line-2)"}}>Free-text annotations against employee records.</div>
          <table className="table compact">
            <thead><tr><th>Auto_id</th><th>ID Card</th><th>Date</th><th>Type</th><th>Remark</th><th>Officer</th><th>Status</th></tr></thead>
            <tbody>{localRem.map(r=>(
              <tr key={r.autoId}><td className="mono">{r.autoId}</td><td className="id">{r.idCard}</td><td className="num">{r.date}</td><td><span className="tag gray">{r.type}</span></td><td style={{maxWidth:480}}>{r.text}</td><td className="mono xs">{r.officer}</td><td><ApprovalPill compact sent={true} approved={r.approvedRemarks} uploaded={r.uploaded}/></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {maintTab==="allowance" && (
        <div className="card">
          <div className="card-head"><h2>Allowances</h2><div className="right">{!ro && <button className="btn sm primary" onClick={()=>{setInsertType("Allowances");setMode("insert-prs");}}>+ New allowance</button>}</div></div>
          <div className="muted xs" style={{padding:"6px 12px",borderBottom:"1px solid var(--line-2)"}}>Allowances paid above base salary. Rate and validity window per row.</div>
          <table className="table compact">
            <thead><tr><th>Id</th><th>ID Card</th><th>Nature</th><th>From</th><th>To</th><th>Rate</th><th>Authority</th><th>Officer</th><th>Status</th></tr></thead>
            <tbody>{localAllow.map(a=>(
              <tr key={a.id}><td className="mono">{a.id}</td><td className="id">{a.idCard}</td><td>{a.nature}</td><td className="num">{a.fromAll}</td><td className="num">{a.toAll||<span className="tag green">Open</span>}</td><td className="mono">{a.rateAll}</td><td className="muted xs">{a.authorityAll}</td><td className="mono xs">{a.officer}</td><td><ApprovalPill compact sent={a.sentToOfficer} approved={a.approvedAllowance} uploaded={a.uploaded}/></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {maintTab==="secq" && (
        <div className="card">
          <div className="card-head"><h2>Qualifications on file</h2><div className="right">{!ro && <button className="btn sm primary" onClick={()=>{setInsertType("S.E.C.Q.");setMode("insert-prs");}}>+ Add qualification</button>}</div></div>
          <div className="muted xs" style={{padding:"6px 12px",borderBottom:"1px solid var(--line-2)"}}>Used for Qualification Allowance eligibility and progression checks.</div>
          <table className="table compact">
            <thead><tr><th>Auto_id</th><th>ID Card</th><th>Qualification (SECQ)</th><th>Officer</th><th>Date added</th><th>Status</th></tr></thead>
            <tbody>{localSECQ.map(s=>(
              <tr key={s.autoId}><td className="mono">{s.autoId}</td><td className="id">{s.idCard}</td><td>{s.secq}</td><td className="mono xs">{s.officer}</td><td className="num">{s.dateAdded}</td><td><ApprovalPill compact sent={s.sentToOfficer} approved={s.approvedSecq} uploaded={true}/></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {maintTab==="people" && (
        <div className="card">
          <div className="card-head"><h2>People — master profiles</h2><div className="right"><span className="muted xs">{P.PRS_STATS.customerDetailsTotal.toLocaleString()} total</span><button className="btn sm">Export</button></div></div>
          <div className="muted xs" style={{padding:"6px 12px",borderBottom:"1px solid var(--line-2)"}}>Master employee profile table. Foreign key: PersonIDNO = ID card number.</div>
          <table className="table compact">
            <thead><tr><th>PersonIDNO</th><th>Name</th><th>Surname</th><th>Gender</th><th>DOB</th><th>Pay point</th><th>Conf/Prob</th><th>In service</th></tr></thead>
            <tbody>{D.PEOPLE.slice(0,16).map(p=>(
              <tr key={p.idCard} style={{cursor:"pointer"}} onClick={()=>{setSelectedPerson(p);setView("employee-detail");}}>
                <td className="id">{p.idCard}</td><td>{p.name}</td><td>{p.surname}</td><td>{p.gender}</td><td className="num">{p.dob}</td><td className="mono xs">{p.paypoint}</td><td>{["Probation","Confirmed","Trial"][p.confProb]}</td><td>{p.stillInService?<span className="tag green">Yes</span>:<span className="tag red">No</span>}</td>
              </tr>
            ))}</tbody>
          </table>
          <div className="card-foot muted xs">Showing 16 of {P.PRS_STATS.customerDetailsTotal.toLocaleString()} rows. Click any row to open the 360 view.</div>
        </div>
      )}
      {maintTab==="files" && (
        <div className="card">
          <div className="card-head"><h2>CustDetails_PRS — physical file numbers</h2><div className="right">{!ro && <button className="btn sm primary" onClick={()=>{
            const ic = prompt("ID card to allocate a file number for:");
            if (!ic) return;
            const fn = prompt("Physical file number (e.g. PRS-2026-1234):");
            if (!fn) return;
            P.FILE_NUMBERS.unshift({ idCard: ic.trim(), persFileNo: fn.trim(), woPens: "", uploaded: false });
            window.dispatchEvent(new CustomEvent("toast", { detail: `File ${fn} allocated to ${ic}` }));
            setMaintTab("files"); // force refresh
          }}>+ Allocate file</button>}</div></div>
          <div className="muted xs" style={{padding:"6px 12px",borderBottom:"1px solid var(--line-2)"}}>Links ID card numbers to the physical PRS file at the registry.</div>
          <table className="table compact">
            <thead><tr><th>ID_card_No</th><th>PersFileNo</th><th>WO_Pens</th><th>Uploaded</th></tr></thead>
            <tbody>{P.FILE_NUMBERS.slice(0,18).map(f=>(
              <tr key={f.idCard}><td className="id">{f.idCard}</td><td className="mono">{f.persFileNo}</td><td className="mono">{f.woPens||<span className="muted">—</span>}</td><td>{f.uploaded?<span className="check">✓</span>:"—"}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {maintTab==="officers" && (
        <div className="card">
          <div className="card-head"><h2>Officer_tbl — 19 officers</h2><div className="right">{!ro && <button className="btn sm primary" onClick={()=>{
            const username = prompt("Username (e.g. borgmj):");
            if (!username) return;
            const fullName = prompt("Full name (e.g. Mark Borg):") || "";
            const email = prompt("Email:") || "";
            const [name, ...rest] = fullName.split(" ");
            P.OFFICERS.unshift({
              offNumber: String(P.OFFICERS.length + 1),
              username: username.trim(),
              title: "Mr",
              nameCC: name || "",
              surname: rest.join(" "),
              maiden: "",
              gradeOff: "Records Officer",
              permissions: "Officer",
              idcard: "",
              email: email.trim(),
            });
            window.dispatchEvent(new CustomEvent("toast", { detail: `Officer ${username} added` }));
            setMaintTab("officers"); // force refresh
          }}>+ New user</button>}</div></div>
          <div className="muted xs" style={{padding:"6px 12px",borderBottom:"1px solid var(--line-2)"}}>Permissions: Administrator · Records · Data · Recruitment.</div>
          <table className="table">
            <thead><tr><th>#</th><th>Username</th><th>Name</th><th>Grade</th><th>Permissions</th><th>ID Card</th><th>Email</th></tr></thead>
            <tbody>{P.OFFICERS.map(o=>(
              <tr key={o.username}>
                <td className="mono">{o.offNumber}</td><td className="mono">{o.username}</td>
                <td>{o.title} {o.nameCC} {o.surname}{o.maiden&&<span className="muted xs"> ({o.maiden})</span>}</td>
                <td className="muted xs">{o.gradeOff}</td>
                <td>{o.permissions==="Administrator"?<span className="tag red">Admin</span>:o.permissions==="Officer"?<span className="tag blue">Officer</span>:<span className="tag gray">Read Only</span>}</td>
                <td className="id">{o.idcard}</td><td className="muted xs">{o.email}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {maintTab==="grades" && (
        <div className="card">
          <div className="card-head"><h2>TeachingGrades</h2><div className="right"><span className="muted xs">Lookup · 242 rows in production</span></div></div>
          <div className="muted xs" style={{padding:"6px 12px",borderBottom:"1px solid var(--line-2)"}}>Tech_or_non_teach: 1 = Teaching, 2 = Non-Teaching.</div>
          <table className="table compact">
            <thead><tr><th>#</th><th>Position / Grade</th><th>Type</th><th>Scale</th></tr></thead>
            <tbody>{D.GRADES.map((g,i)=>(
              <tr key={g.code}><td className="mono">{i+1}</td><td>{g.desc}</td><td>{g.type==="Teaching"?<span className="tag blue">Teaching</span>:<span className="tag gray">Non-Teaching</span>}</td><td className="mono">{g.scale}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {maintTab==="approvals" && (
        <div className="split" style={{alignItems:"flex-start"}}>
          <div className="card">
            <div className="card-head"><h2>Approval queue — senior officer inbox</h2><div className="right"><button className="btn sm">Bulk approve…</button></div></div>
            <div className="muted xs" style={{padding:"6px 12px",borderBottom:"1px solid var(--line-2)"}}>SentToOfficer = True and Approved_Records = False. Approve here to queue for nightly upload.</div>
            <table className="table compact">
              <thead><tr><th></th><th>Auto_id</th><th>Person</th><th>Reason</th><th>From</th><th>Scale → Salary</th><th>Officer</th><th></th></tr></thead>
              <tbody>{P.APPROVAL_QUEUE.map(r=>(
                <tr key={r.autoId}>
                  <td><input type="checkbox"/></td>
                  <td className="mono">{r.autoId}</td>
                  <td><div>{r.name}</div><div className="muted mono xs">{r.idCard}</div></td>
                  <td><span className="tag gray">{r.reason}</span></td>
                  <td className="num">{r.fromDate}</td>
                  <td className="mono">{r.salScale} → {r.salary}</td>
                  <td className="mono xs">{r.officer}</td>
                  <td style={{display:"flex",gap:4}}><button className="btn xs primary">Approve</button><button className="btn xs">Reject</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{flex:"0 0 260px"}}>
            <div className="card">
              <div className="card-head"><h2>Workflow</h2></div>
              <div className="card-body" style={{fontSize:12,lineHeight:1.6}}>
                <ol style={{margin:0,paddingLeft:18}}>
                  <li><strong>Officer enters</strong> — all flags False.</li>
                  <li><strong>Officer marks ready</strong> — sets SentToOfficer.</li>
                  <li><strong>Senior officer reviews</strong> — sets Approved.</li>
                  <li><strong>Nightly sync</strong> — sets Uploaded.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
      {maintTab==="admin" && (
        <div className="split">
          <div className="card">
            <div className="card-head"><h2>Schema & version</h2></div>
            <div className="card-body">
              <dl className="kv">
                <dt>Database file</dt><dd className="mono">{P.LAST_BACKUP.dbName}</dd>
                <dt>Schema version</dt><dd>v{P.LAST_BACKUP.schemaVersion}</dd>
                <dt>Last backup</dt><dd>{P.LAST_BACKUP.lastBackupDate}</dd>
                <dt>Total rows</dt><dd className="mono">{(P.PRS_STATS.prsRecordsTotal+P.PRS_STATS.customerDetailsTotal+P.PRS_STATS.allowanceTotal+P.PRS_STATS.remarksTotal+P.PRS_STATS.secqTotal).toLocaleString()}</dd>
              </dl>
              <hr/>
              <table className="table compact">
                <thead><tr><th>Table</th><th className="right">Rows</th></tr></thead>
                <tbody>
                  {[["Service events",P.PRS_STATS.prsRecordsTotal],["People",P.PRS_STATS.customerDetailsTotal],["Remarks",P.PRS_STATS.remarksTotal],["Allowances",P.PRS_STATS.allowanceTotal],["Qualifications",P.PRS_STATS.secqTotal],["File numbers",P.PRS_STATS.fileNumbersTotal],["Officers",P.OFFICERS.length]].map(([t,n])=>(
                    <tr key={t}><td>{t}</td><td className="num right mono">{n.toLocaleString()}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><h2>Backup & sync log</h2><div className="right"><button className="btn sm">Run backup</button></div></div>
            <div className="card-body" style={{padding:0}}>
              {[
                {ts:"2026-04-27 23:00",op:"Nightly backup",bytes:"412 MB",status:"OK",msg:"Full backup of master workspace"},
                {ts:"2026-04-28 02:00",op:"Sync → 23 workspaces",bytes:"—",status:"OK",msg:"315,095 rows replicated · 28 minutes"},
                {ts:"2026-04-28 02:36",op:"Drift alert",bytes:"—",status:"WARN",msg:"Transfers/promotions drift = 454 rows"},
                {ts:"2026-04-26 23:00",op:"Nightly backup",bytes:"410 MB",status:"OK",msg:"Full backup of master workspace"},
              ].map((row,i)=>(
                <div key={i} className="log-row">
                  <span className="mono xs">{row.ts}</span>
                  <span style={{flex:1,fontSize:12}}><strong>{row.op}</strong> — {row.msg}</span>
                  <span className="mono xs muted">{row.bytes}</span>
                  <span className={"tag "+(row.status==="OK"?"green":"amber")}>{row.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.PRSOffice = { PRSOffice };
})();
