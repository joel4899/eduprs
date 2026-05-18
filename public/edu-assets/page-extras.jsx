// Extra workspaces called out in the org chart but not yet covered:
// Vaccine, Leaves — Meeting Done, Confirmation of Appointment (Indefinite),
// Recruitment splits (Teaching/Non-Teaching wrappers), View Result Sheet,
// VET Certificates, Pay Points (deep), Discipline (deep stub).
(function(){
const { useState } = React;
const { useApp } = window.Shell;
const D = window.HR_DATA;
const X = window.DEEP_DATA;
const ApprovalPill = window.ApprovalPill;

// ─── VACCINE ────────────────────────────────────────────────────
const VACCINES = ["COVID-19 (booster)","Influenza","Hepatitis B","Tetanus","TB / Mantoux","MMR"];
const VACCINE_DATA = D.PEOPLE.slice(0, 22).map((p, i) => ({
  id: 8000+i,
  idCard: p.idCard,
  name: `${p.name} ${p.surname}`,
  vaccine: VACCINES[i % VACCINES.length],
  dose: ["1st","2nd","Booster","Annual"][i%4],
  date: `2026-0${(i%4)+1}-${String((i*3)%28+1).padStart(2,"0")}`,
  centre: ["Mater Dei","Health Centre — Floriana","Health Centre — Mosta","Gozo General","Private GP"][i%5],
  mandatory: i%3===0,
  certUploaded: i%4!==0,
  officer: ["spitc188","camis087","borgm196"][i%3],
}));

function Vaccine() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">Health &amp; Safety</div>
          <h1>Vaccinations</h1>
          <p className="page-sub">Mandatory and voluntary vaccinations. Certificates attach to the personnel record.</p>
        </div>
        <div className="page-actions">
          <button className="btn">Export</button>
          <button className="btn primary">+ New record</button>
        </div>
      </div>
      <div className="card">
        <div className="card-head"><h2>Vaccination records</h2></div>
        <table className="table compact">
          <thead><tr><th>ID Card</th><th>Name</th><th>Vaccine</th><th>Dose</th><th>Date</th><th>Centre</th><th>Mandatory</th><th>Cert</th><th>Officer</th></tr></thead>
          <tbody>
            {VACCINE_DATA.map(v => (
              <tr key={v.id}>
                <td className="id">{v.idCard}</td>
                <td>{v.name}</td>
                <td>{v.vaccine}</td>
                <td className="mono">{v.dose}</td>
                <td className="num">{v.date}</td>
                <td className="muted xs">{v.centre}</td>
                <td>{v.mandatory ? <span className="tag red">Mandatory</span> : <span className="tag gray">Voluntary</span>}</td>
                <td>{v.certUploaded ? <span className="check">✓</span> : <span className="tag amber">Pending</span>}</td>
                <td className="mono xs">{v.officer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── CONFIRMATION OF APPOINTMENT (PROBATION) ────────────────────
function ConfAppointment() {
  const [mode, setMode]         = useState("menu");
  const { setView } = useApp(); // menu|unaudited|lookup|person-list|detail|send-college|not-received|send-dg|due-to-send|maintenance
  const [idCardInput, setIdCardInput] = useState("");
  const [selected, setSelected] = useState(null);
  const [sendKind, setSendKind] = useState("College"); // College | Department
  const [sendTarget, setSendTarget] = useState("");
  const [dg, setDg]             = useState("");
  const [fileNumber, setFileNumber] = useState("MEYR 3/2025");
  const [localData, setLocalData] = useState(() => (X?.CONF_OF_APPOINTMENT || []).slice());

  const COLLEGES = ["St Benedict College","St Ignatius College","St Margaret College","St Nicholas College","St Clare College","Gozo College","MCAST","State Technical College"];
  const DEPARTMENTS = ["Directorate for Educational Services","Directorate for Learning and Assessment","Directorate Corporate Services","People & Standards HQ","Salaries Section","Records Section","Recruitment Section"];
  const DGS = ["Mr A. Borg","Ms M. Vella","Mr J. Camilleri","Ms C. Spiteri","Mr R. Farrugia"];

  const lookupPerson = ic => D.PEOPLE.find(p => p.idCard.toLowerCase() === (ic||"").toLowerCase().trim()) || null;
  const personAppts = ic => localData.filter(r => r.idCard === ic);
  const upd = (autoId, patch) => setLocalData(rs => rs.map(r => r.autoId === autoId ? {...r, ...patch} : r));

  // ── MENU (Access-style) ───────────────────────────────────────
  if (mode === "menu") {
    const ACTIONS = [
      {id:"unaudited",     icon:"⚠", label:"Un Audited Appointments",            desc:"Appointments that still need a manual audit",                    onClick:()=>setMode("unaudited")},
      {id:"view-persons",  icon:"⌕", label:"View Person's Appointment",          desc:"Look up by ID card — shows all of a person's appointments",     onClick:()=>setMode("lookup")},
      {id:"send-college",  icon:"✉", label:"Send E-Mail to College",             desc:"Pick a college / department and dispatch the confirmation pack", onClick:()=>setMode("send-college")},
      {id:"not-received",  icon:"⊠", label:"Confirmations still not received",   desc:"From college — flagged sent but reply pending",                  onClick:()=>setMode("not-received")},
      {id:"send-dg",       icon:"▶", label:"Send to DG",                         desc:"Assign DG and file number for sign-off",                          onClick:()=>setMode("send-dg")},
      {id:"due-to-send",   icon:"📅",label:"Date due to send Confirmation",      desc:"Outbound queue — confirmations approaching due date",            onClick:()=>setMode("due-to-send")},
      {id:"maintenance",   icon:"⚙", label:"Maintenance",                        desc:"Cleanup, exports and lookup updates",                              onClick:()=>setMode("maintenance")},
    ];
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <div className="crumbs">Confirmation of Appointment</div>
            <h1>Main Menu</h1>
            <p className="page-sub">Probationary confirmation workflow — audit, dispatch to college, DG sign-off, then insert event in PRS.</p>
          </div>
          <div className="page-actions">
            <button className="btn">Export</button>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Actions</h2></div>
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

  // ── DETAIL form (used by every list's "View" action) ──────────
  if (mode === "detail" && selected) {
    const c = selected;
    const person = lookupPerson(c.idCard);
    return (
      <div className="page">
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
          <button className="btn ghost" onClick={()=>setMode("menu")}>← Confirmations</button>
          <h1 style={{margin:0,fontSize:18}}>{c.name}</h1>
          <span className="id mono">{c.idCard}</span>
          <div style={{flex:1}}/>
          <button className="btn" onClick={()=>setView("prs-view")}>View PRS</button>
          <button className="btn primary" disabled={c.insertInPRS||c.statusCode!=="yes"} title={c.statusCode!=="yes"?"Set Status to Yes Confirmed first":"Insert a Confirmation event into PRS"} onClick={()=>{
            if (typeof window.addPRSEvent === "function") {
              const [fn, ...rest] = (c.name||"").split(" ");
              window.addPRSEvent({
                idCard:    c.idCard,
                firstName: fn||"",
                surname:   rest.join(" "),
                position:  c.persGrade || "Employee",
                salScale:  c.salaryScale ? String(c.salaryScale)+"/1" : "10/1",
                fromDate:  c.wefAppointment || c.wefRecruitment,
                reason:    "Granted Indefinite Status",
                sourceDept:"conf-appointment",
                comments:  c.persComments || "",
              });
            }
            upd(c.autoId,{insertInPRS:true});
          }}>
            {c.insertInPRS ? "Inserted in PRS ✓" : "Insert Record in PRS"}
          </button>
        </div>

        <div className="card">
          <div className="card-head"><h2>Appointment details</h2></div>
          <div className="card-body" style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:24}}>
            <div>
              <div className="form-row"><label>Grade</label><input className="input" value={c.persGrade||""} onChange={e=>{setSelected({...c,persGrade:e.target.value});upd(c.autoId,{persGrade:e.target.value});}}/></div>
              <div className="form-row"><label>Pay Point</label><input className="input" value={c.payPoint||""} onChange={e=>{setSelected({...c,payPoint:e.target.value});upd(c.autoId,{payPoint:e.target.value});}}/></div>
              <div className="form-row"><label>College</label><input className="input" value={c.persCollege||""} onChange={e=>{setSelected({...c,persCollege:e.target.value});upd(c.autoId,{persCollege:e.target.value});}}/></div>
              <div className="form-row"><label>School</label><input className="input" value={c.persSchool||""} onChange={e=>{setSelected({...c,persSchool:e.target.value});upd(c.autoId,{persSchool:e.target.value});}}/></div>
              <div className="form-row"><label>WEF Appointment</label><input className="input" value={c.wefAppointment||c.wefRecruitment||""} readOnly/></div>
              <div className="form-row"><label>Salary Scale</label><input className="input" value={c.salaryScale||0} onChange={e=>{setSelected({...c,salaryScale:e.target.value});upd(c.autoId,{salaryScale:e.target.value});}}/></div>
              <div className="form-row"><label>Due Date</label><input type="date" className="input" value={c.dueDate||""} onChange={e=>{setSelected({...c,dueDate:e.target.value});upd(c.autoId,{dueDate:e.target.value});}}/></div>
              <div className="form-row"><label>Date to send Conf</label><input type="date" className="input" value={c.dateToSendConf||""} onChange={e=>{setSelected({...c,dateToSendConf:e.target.value});upd(c.autoId,{dateToSendConf:e.target.value});}}/></div>

              <div style={{display:"flex",gap:18,padding:"10px 12px",background:"var(--panel-2)",borderRadius:"var(--r-sm)",border:"1px solid var(--line-2)",marginBottom:8,fontSize:13}}>
                <label style={{display:"flex",alignItems:"center",gap:6}}><input type="checkbox" checked={!!c.sentToCollege} onChange={e=>{setSelected({...c,sentToCollege:e.target.checked});upd(c.autoId,{sentToCollege:e.target.checked});}}/>Mark to send to college</label>
                <label style={{display:"flex",alignItems:"center",gap:6}}><input type="checkbox" checked={!!c.receivedFromCollege} onChange={e=>{setSelected({...c,receivedFromCollege:e.target.checked});upd(c.autoId,{receivedFromCollege:e.target.checked});}}/>Received from college</label>
              </div>
              <div style={{display:"flex",gap:14,padding:"10px 12px",background:"var(--panel-2)",borderRadius:"var(--r-sm)",border:"1px solid var(--line-2)",marginBottom:8,fontSize:13,alignItems:"center"}}>
                <label style={{display:"flex",alignItems:"center",gap:6}}><input type="checkbox" checked={!!c.sendToDg} onChange={e=>{setSelected({...c,sendToDg:e.target.checked});upd(c.autoId,{sendToDg:e.target.checked});}}/>Send to DG</label>
                <select className="input sm" style={{flex:1}} title="DG" value={c.dgName||""} onChange={e=>{setSelected({...c,dgName:e.target.value});upd(c.autoId,{dgName:e.target.value});}}>
                  <option value=""/>{DGS.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,marginBottom:8}}>
                <input type="checkbox" checked={!!c.audited} onChange={e=>{setSelected({...c,audited:e.target.checked});upd(c.autoId,{audited:e.target.checked});}}/>Audited
              </label>
              <div className="form-row top"><label>Comments</label><textarea className="input" rows={3} style={{resize:"vertical"}} value={c.persComments||""} onChange={e=>{setSelected({...c,persComments:e.target.value});upd(c.autoId,{persComments:e.target.value});}}/></div>
            </div>
            <div className="radio-group-box" style={{height:"fit-content"}}>
              <div style={{fontWeight:700,fontSize:12,marginBottom:8}}>Status</div>
              {[["yes","Yes Confirmed"],["no","Not Confirmed"],["none","None"]].map(([v,l])=>(
                <label key={v}><input type="radio" name="confStatus" value={v} checked={c.statusCode===v} onChange={()=>{setSelected({...c,statusCode:v,confirmed:v==="yes"?1:0});upd(c.autoId,{statusCode:v,confirmed:v==="yes"?1:0});}}/>{l}</label>
              ))}
            </div>
          </div>
        </div>

        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button className="btn" onClick={()=>setMode("menu")}>Close</button>
        </div>
      </div>
    );
  }

  // ── Unaudited Appointments list ───────────────────────────────
  if (mode === "unaudited") {
    const rows = localData.filter(r => !r.audited);
    return (
      <div className="page">
        <ConfBack setMode={setMode}/>
        <div className="card">
          <div className="card-head"><h2>Unaudited Appointments ({rows.length})</h2></div>
          <div className="table-scroll">
            <table className="table compact">
              <thead><tr><th>ID Card</th><th>Name</th><th>Grade</th><th>W.E.F</th><th>Due Date</th><th>Paypoint</th><th>Sent → College</th><th>Recvd</th><th></th></tr></thead>
              <tbody>{rows.length>0 ? rows.map(c=>(
                <tr key={c.autoId}>
                  <td className="id">{c.idCard}</td>
                  <td>{c.name}</td>
                  <td className="muted xs">{c.persGrade}</td>
                  <td className="num">{c.wefAppointment||c.wefRecruitment}</td>
                  <td className="num">{c.dueDate}</td>
                  <td className="mono xs">{c.payPoint||"—"}</td>
                  <td><input type="checkbox" checked={!!c.sentToCollege} onChange={e=>upd(c.autoId,{sentToCollege:e.target.checked})}/></td>
                  <td><input type="checkbox" checked={!!c.receivedFromCollege} onChange={e=>upd(c.autoId,{receivedFromCollege:e.target.checked})}/></td>
                  <td><button className="btn xs" onClick={()=>{setSelected(c);setMode("detail");}}>View</button></td>
                </tr>
              )) : <tr><td colSpan={9} className="muted" style={{padding:"16px",textAlign:"center"}}>All appointments are audited.</td></tr>}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ── Look up person (ID card form) ─────────────────────────────
  if (mode === "lookup") {
    return (
      <div className="page">
        <ConfBack setMode={setMode}/>
        <div className="card" style={{maxWidth:460}}>
          <div className="card-head"><h2>Person's Appointments</h2></div>
          <div className="card-body">
            <div className="form-row"><label>Insert ID Card</label><input className="input" value={idCardInput} onChange={e=>setIdCardInput(e.target.value)} placeholder="e.g. 0312068M"/></div>
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <button className="btn" onClick={()=>setMode("menu")}>Close</button>
              <button className="btn primary" disabled={!idCardInput} onClick={()=>setMode("person-list")}>View</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Person's appointments list (multiple) ─────────────────────
  if (mode === "person-list") {
    const person = lookupPerson(idCardInput);
    const rows = personAppts(idCardInput);
    return (
      <div className="page">
        <ConfBack setMode={setMode} target="lookup" label="← Lookup"/>
        <div className="card">
          <div className="card-head">
            <h2>{rows.length > 1 ? "More than one Appointment" : "Appointments"} — {person ? person.name+" "+person.surname : idCardInput}</h2>
            <div className="right muted xs">{idCardInput}</div>
          </div>
          <table className="table compact">
            <thead><tr><th>Grade</th><th>WEF</th><th>Audited</th><th>Status</th><th></th></tr></thead>
            <tbody>{rows.length>0 ? rows.map(c=>(
              <tr key={c.autoId}>
                <td>{c.persGrade}</td>
                <td className="num">{c.wefAppointment||c.wefRecruitment}</td>
                <td><input type="checkbox" checked={!!c.audited} onChange={e=>upd(c.autoId,{audited:e.target.checked})}/></td>
                <td>{c.statusCode==="yes"?<span className="tag green">Confirmed</span>:c.statusCode==="no"?<span className="tag red">Not confirmed</span>:<span className="tag gray">None</span>}</td>
                <td><button className="btn xs" onClick={()=>{setSelected(c);setMode("detail");}}>View</button></td>
              </tr>
            )) : <tr><td colSpan={5} className="muted" style={{padding:"16px",textAlign:"center"}}>No appointments on file for this person.</td></tr>}</tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Send E-Mail to College (picker) ───────────────────────────
  if (mode === "send-college") {
    const options = sendKind === "College" ? COLLEGES : DEPARTMENTS;
    return (
      <div className="page">
        <ConfBack setMode={setMode}/>
        <div className="card" style={{maxWidth:520}}>
          <div className="card-head"><h2>Select College / Department</h2></div>
          <div className="card-body">
            <div className="form-row"><label>Select</label>
              <select className="input" title="College or Department" value={sendTarget} onChange={e=>setSendTarget(e.target.value)}>
                <option value=""/>{options.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="radio-group-box" style={{maxWidth:200,marginTop:6}}>
              <div style={{fontWeight:700,fontSize:12,marginBottom:6}}>Select</div>
              {["College","Department"].map(k=>(
                <label key={k}><input type="radio" name="sendKind" value={k} checked={sendKind===k} onChange={()=>{setSendKind(k);setSendTarget("");}}/>{k}</label>
              ))}
            </div>
            <div style={{display:"flex",gap:8,marginTop:14}}>
              <button className="btn" onClick={()=>setMode("menu")}>Close</button>
              <button className="btn primary" disabled={!sendTarget}>Send e-mail</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Confirmation still not received from college ──────────────
  if (mode === "not-received") {
    const rows = localData.filter(r => r.sentToCollege && !r.receivedFromCollege);
    return (
      <div className="page">
        <ConfBack setMode={setMode}/>
        <div className="card">
          <div className="card-head"><h2>Confirmation Still not received ({rows.length})</h2><div className="right muted xs">Sent to college · awaiting reply</div></div>
          <div className="table-scroll">
            <table className="table compact">
              <thead><tr><th>ID Card</th><th>Name</th><th>Grade</th><th>WEF</th><th></th></tr></thead>
              <tbody>{rows.length>0 ? rows.map(c=>(
                <tr key={c.autoId}>
                  <td className="id">{c.idCard}</td>
                  <td>{c.name}</td>
                  <td className="muted xs">{c.persGrade}</td>
                  <td className="num">{c.wefAppointment||c.wefRecruitment}</td>
                  <td><button className="btn xs" onClick={()=>{setSelected(c);setMode("detail");}}>View</button></td>
                </tr>
              )) : <tr><td colSpan={5} className="muted" style={{padding:"16px",textAlign:"center"}}>Nothing pending — all replies received.</td></tr>}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ── Send to DG ────────────────────────────────────────────────
  if (mode === "send-dg") {
    return (
      <div className="page">
        <ConfBack setMode={setMode}/>
        <div className="card" style={{maxWidth:480}}>
          <div className="card-head"><h2>Select DG</h2></div>
          <div className="card-body">
            <div className="form-row"><label>DG</label>
              <select className="input" title="DG" value={dg} onChange={e=>setDg(e.target.value)}>
                <option value=""/>{DGS.map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-row"><label>File Number</label><input className="input" value={fileNumber} onChange={e=>setFileNumber(e.target.value)}/></div>
            <div style={{display:"flex",gap:8,marginTop:14}}>
              <button className="btn" onClick={()=>setMode("menu")}>Close</button>
              <button className="btn primary" disabled={!dg}>Apply &amp; Send</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Date due to send Confirmation ─────────────────────────────
  if (mode === "due-to-send") {
    const rows = [...localData].sort((a,b)=>(a.dateToSendConf||a.dueDate||"").localeCompare(b.dateToSendConf||b.dueDate||""));
    return (
      <div className="page">
        <ConfBack setMode={setMode}/>
        <div className="card">
          <div className="card-head"><h2>Date due to send Confirmation</h2><div className="right muted xs">{rows.length} records · sorted by due date</div></div>
          <div className="table-scroll">
            <table className="table compact">
              <thead><tr><th>ID Card</th><th>Name</th><th>Grade</th><th>Due / Send date</th><th></th></tr></thead>
              <tbody>{rows.length>0 ? rows.map(c=>(
                <tr key={c.autoId}>
                  <td className="id">{c.idCard}</td>
                  <td>{c.name}</td>
                  <td className="muted xs">{c.persGrade}</td>
                  <td className="num">{c.dateToSendConf||c.dueDate}</td>
                  <td><button className="btn xs" onClick={()=>{setSelected(c);setMode("detail");}}>View</button></td>
                </tr>
              )) : <tr><td colSpan={5} className="muted" style={{padding:"16px",textAlign:"center"}}>No records.</td></tr>}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ── Maintenance ───────────────────────────────────────────────
  if (mode === "maintenance") {
    return (
      <div className="page">
        <ConfBack setMode={setMode}/>
        <div className="card" style={{maxWidth:420}}>
          <div className="card-head"><h2>Maintenance</h2></div>
          <div className="card-body" style={{display:"flex",flexDirection:"column",gap:8}}>
            {["Export confirmations to Excel","Bulk audit","Reset due-date queue","Lookup: DG list","Lookup: College list"].map((item,i)=>(
              <button key={i} className="btn" style={{textAlign:"left",justifyContent:"flex-start"}}>{item}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function ConfBack({ setMode, target="menu", label="← Main Menu" }) {
  return <button className="btn ghost" style={{marginBottom:14}} onClick={()=>setMode(target)}>{label}</button>;
}

// ─── CONFIRMATION OF APPOINTMENT — INDEFINITE ────────────────────
function ConfIndefinite() {
  const [mode, setMode]           = useState("menu");
  const { setView } = useApp();
  const [detailTab, setDetailTab] = useState("personal");
  const [selected, setSelected]   = useState(null);
  const [sortBy, setSortBy]       = useState("appt-desc");
  const [findIdCard, setFindIdCard] = useState("");
  const [eligCheck, setEligCheck] = useState({appointmentDate:"",yrsSupply:0,unpaidMonths:0,certProduced:false,noPendDiscipl:false,eligible:false});
  const [localData, setLocalData] = useState(() => (X?.CONF_OF_APPOINTMENT || []).slice());

  const upd = (autoId, patch) => {
    setLocalData(rs => rs.map(r => r.autoId === autoId ? {...r, ...patch} : r));
    if (selected && selected.autoId === autoId) setSelected(s => ({...s, ...patch}));
  };
  const updWF = (autoId, key, patch) => {
    setLocalData(rs => rs.map(r => r.autoId === autoId ? {...r, wf:{...r.wf, [key]:{...r.wf[key], ...patch}}} : r));
    if (selected && selected.autoId === autoId) setSelected(s => ({...s, wf:{...s.wf, [key]:{...s.wf[key], ...patch}}}));
  };

  const eligibleCount = localData.filter(c => c.eligible).length;
  const expiredCount  = localData.filter(c => c.envEndDateLevel6 && c.envEndDateLevel6 < "2026-05-13").length;

  // ── MENU ──────────────────────────────────────────────────────
  if (mode === "menu") {
    const ACTIONS = [
      {id:"import",   icon:"↓", label:"Import From Dakar",     desc:"Pull the latest employment file from the Dakar HR system",          onClick:()=>setMode("import")},
      {id:"find",     icon:"⌕", label:"Find Person",            desc:"Look up an individual by ID card",                                  onClick:()=>setMode("find")},
      {id:"view-all", icon:"≡", label:"View All Persons",       desc:`Browse all ${localData.length} indefinite-track candidates`,         onClick:()=>setMode("view-all")},
      {id:"eligible", icon:"✓", label:"Check Eligible Persons", desc:`Eligibility check — ${eligibleCount} currently eligible`,            onClick:()=>setMode("check-eligible")},
      {id:"expired",  icon:"⚠", label:"View Expired Envisaged Date", desc:`${expiredCount} qualification deadlines have passed`,          onClick:()=>setMode("expired")},
      {id:"maint",    icon:"⚙", label:"Maintenance",            desc:"Lookups, exports, cleanup",                                          onClick:()=>setMode("maintenance")},
    ];
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <div className="crumbs">Confirmation of Appointment</div>
            <h1>Indefinite — Main Menu</h1>
            <p className="page-sub">Tracks supply teachers and staff moving from definite contracts to indefinite (permanent) status. Eligibility, qualifications, workflow steps.</p>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Actions</h2></div>
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

  // ── DETAIL — 6 tabs ───────────────────────────────────────────
  if (mode === "detail" && selected) {
    const c = selected;
    const eligible = c.eligible;
    return (
      <div className="page">
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
          <button className="btn ghost" onClick={()=>setMode("view-all")}>← All persons</button>
          <h1 style={{margin:0,fontSize:18}}>Person Details — Current</h1>
          <div style={{flex:1}}/>
          <span className={"tag "+(eligible?"green":"amber")}>{eligible?"Eligible":"Not Eligible"}</span>
          <button className="btn" title="See why">Why?</button>
        </div>

        <div className="dossier-header">
          <div className="dossier-id-block">
            <div className="dossier-name">{c.firstName} {c.surname}</div>
            <div className="dossier-meta">
              <span><strong>ID Card:</strong> {c.idCard}</span>
              <span><strong>Grade:</strong> {c.persGrade}</span>
              <span><strong>Scale:</strong> {c.salaryScale}</span>
              <span><strong>Status:</strong> {c.payrollStatus}</span>
            </div>
          </div>
        </div>

        <div className="tabs" style={{flexWrap:"wrap"}}>
          {[["personal","Personal Details"],["employment","Employment Details"],["contract","Contract Details"],["eligibility","Eligibility — Indefinite Status"],["indefinite","Indefinite Status"],["workflow","Work Flow"]].map(([k,l])=>(
            <div key={k} className={"tab "+(detailTab===k?"active":"")} onClick={()=>setDetailTab(k)}>{l}</div>
          ))}
        </div>

        {detailTab==="personal" && (
          <div className="split" style={{alignItems:"flex-start"}}>
            <div className="card">
              <div className="card-head"><h2>Personal Details</h2></div>
              <div className="card-body">
                <div className="form-row"><label>ID Card No</label><span className="id mono">{c.idCard}</span></div>
                <div className="form-row"><label>Name</label><input className="input" value={c.firstName||""} onChange={e=>upd(c.autoId,{firstName:e.target.value})}/></div>
                <div className="form-row"><label>Surname</label><input className="input" value={c.surname||""} onChange={e=>upd(c.autoId,{surname:e.target.value})}/></div>
                <div className="form-row"><label>Date of Birth</label><input type="date" className="input" value={c.dob||""} onChange={e=>upd(c.autoId,{dob:e.target.value})}/></div>
                <div className="form-row"><label>Age</label><input className="input" value={c.age||""} readOnly/></div>
                <div className="form-row"><label>Gender</label><input className="input" value={c.gender||""} onChange={e=>upd(c.autoId,{gender:e.target.value})}/></div>
                <div className="form-row top"><label>Address</label><textarea className="input" rows={2} style={{resize:"vertical"}} value={c.address||""} onChange={e=>upd(c.autoId,{address:e.target.value})}/></div>
                <div className="form-row"><label>Town</label><input className="input" value={c.town||""} onChange={e=>upd(c.autoId,{town:e.target.value})}/></div>
                <div className="form-row"><label>E-mail</label><input className="input" value={c.email||""} onChange={e=>upd(c.autoId,{email:e.target.value})}/></div>
                <div className="form-row"><label>Mobile Phone</label><input className="input" value={c.mobile||""} onChange={e=>upd(c.autoId,{mobile:e.target.value})}/></div>
                <div className="form-row"><label>Office Phone</label><input className="input" value={c.officePhone||""} onChange={e=>upd(c.autoId,{officePhone:e.target.value})}/></div>
              </div>
            </div>
            <div className="col-flex">
              <div style={{background:"#fde047",border:"1px solid #c5a51d",borderRadius:"var(--r-sm)",padding:"10px 14px",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:8}}>
                <input type="checkbox" checked={!!c.completed} onChange={e=>upd(c.autoId,{completed:e.target.checked})}/> Completed
              </div>
              <div style={{background:"#16a34a",color:"white",border:"1px solid #15803d",borderRadius:"var(--r-sm)",padding:"10px 14px",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:8}}>
                <input type="checkbox" checked={!!c.selectToSendRec} onChange={e=>upd(c.autoId,{selectToSendRec:e.target.checked})}/> Select to Send Recommendation
              </div>
              <div style={{background:"#0ea5e9",color:"white",border:"1px solid #0369a1",borderRadius:"var(--r-sm)",padding:"10px 14px",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:8}}>
                <input type="checkbox" checked={!!c.selectToSendListRecER} onChange={e=>upd(c.autoId,{selectToSendListRecER:e.target.checked})}/> Select to send list to Rec &amp; ER
              </div>
            </div>
          </div>
        )}

        {detailTab==="employment" && (
          <div className="card">
            <div className="card-head"><h2>Employment Details</h2></div>
            <div className="card-body" style={{maxWidth:560}}>
              <div className="form-row"><label>Date of Employment</label><input type="date" className="input" value={c.dateOfEmployment||""} onChange={e=>upd(c.autoId,{dateOfEmployment:e.target.value})}/></div>
              <div className="form-row"><label>Date of Termination</label><input type="date" className="input" value={c.dateOfTermination||""} onChange={e=>upd(c.autoId,{dateOfTermination:e.target.value})}/></div>
              <div className="form-row"><label>Grade Description</label><input className="input" value={c.persGrade||""} onChange={e=>upd(c.autoId,{persGrade:e.target.value})}/></div>
              <div className="form-row"><label>Grade Step</label><input className="input" value={c.gradeStep||""} onChange={e=>upd(c.autoId,{gradeStep:e.target.value})}/></div>
              <div className="form-row"><label>Pay point No</label><input className="input" value={c.payPoint||""} onChange={e=>upd(c.autoId,{payPoint:e.target.value})}/></div>
              <div className="form-row"><label>Paypoint Description</label><input className="input" value={c.persSchool||""} onChange={e=>upd(c.autoId,{persSchool:e.target.value})}/></div>
              <div className="form-row"><label>Part Timer</label><input className="input" value={c.partTimer||"N"} onChange={e=>upd(c.autoId,{partTimer:e.target.value})}/></div>
              <div className="form-row"><label>Payroll Status</label><input className="input" value={c.payrollStatus||""} onChange={e=>upd(c.autoId,{payrollStatus:e.target.value})}/></div>
              <div className="form-row"><label>Scale Code</label><input className="input" value={c.scaleCode||""} onChange={e=>upd(c.autoId,{scaleCode:e.target.value})}/></div>
            </div>
          </div>
        )}

        {detailTab==="contract" && (
          <div className="card">
            <div className="card-head"><h2>Contract Details</h2></div>
            <div className="card-body" style={{maxWidth:560}}>
              <div className="form-row"><label>Contract Reason</label><input className="input" value={c.contractReason||""} onChange={e=>upd(c.autoId,{contractReason:e.target.value})}/></div>
              <div className="form-row"><label>Contract Start Date</label><input type="date" className="input" value={c.contractStartDate||""} onChange={e=>upd(c.autoId,{contractStartDate:e.target.value})}/></div>
              <div className="form-row"><label>Contract End Date</label><input type="date" className="input" value={c.contractEndDate||""} onChange={e=>upd(c.autoId,{contractEndDate:e.target.value})}/></div>
              <div className="form-row"><label>Pay point no</label><input className="input" value={c.payPoint||""} onChange={e=>upd(c.autoId,{payPoint:e.target.value})}/></div>
              <div className="form-row top"><label>Paypoint Description</label><textarea className="input" rows={2} style={{resize:"vertical"}} value={c.persSchool||""} onChange={e=>upd(c.autoId,{persSchool:e.target.value})}/></div>
            </div>
          </div>
        )}

        {detailTab==="eligibility" && (
          <div className="split" style={{alignItems:"flex-start"}}>
            <div className="card">
              <div className="card-head"><h2>Eligibility — Indefinite Status</h2></div>
              <div className="card-body">
                <div className="form-row"><label>Ref No</label><input className="input" value={c.refNo||""} onChange={e=>upd(c.autoId,{refNo:e.target.value})}/></div>
                <div className="form-row"><label>Appointment Date</label><input type="date" className="input" value={c.appointmentDate||""} onChange={e=>upd(c.autoId,{appointmentDate:e.target.value})}/></div>
                <div className="form-row"><label>Actual Date of Empl. as Supply</label><input type="date" className="input" value={c.actualDateOfEmploymentAsSupply||""} onChange={e=>upd(c.autoId,{actualDateOfEmploymentAsSupply:e.target.value})}/></div>
                <div className="form-row"><label>Years as Supply teacher</label><input type="number" className="input" value={c.yearsAsSupplyTeacher||0} onChange={e=>upd(c.autoId,{yearsAsSupplyTeacher:Number(e.target.value)})}/></div>
                <div className="form-row"><label>Unpaid Leave (months)</label><input type="number" className="input" value={c.unpaidLeaveMonths||0} onChange={e=>upd(c.autoId,{unpaidLeaveMonths:Number(e.target.value)})}/></div>
                <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,padding:"6px 0"}}><input type="checkbox" checked={!!c.letterAfter4yrsSent} onChange={e=>upd(c.autoId,{letterAfter4yrsSent:e.target.checked})}/>Letter after 4 yrs sent</label>
                <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,padding:"6px 0"}}><input type="checkbox" checked={!!c.certificationProduced} onChange={e=>upd(c.autoId,{certificationProduced:e.target.checked})}/>Certification produced</label>
                <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,padding:"6px 0"}}><input type="checkbox" checked={!!c.noPendingDisciplinaryActions} onChange={e=>upd(c.autoId,{noPendingDisciplinaryActions:e.target.checked})}/>No Pending Disciplinary Actions</label>
                <div className="form-row"><label>Eligible</label><span className={"tag "+(c.eligible?"green":"red")}>{c.eligible?"Yes":"No"}</span></div>
              </div>
            </div>
            <div className="card">
              <div className="card-head"><h2>Type of certification produced</h2></div>
              <div className="card-body">
                <textarea className="input" rows={6} style={{resize:"vertical",width:"100%"}} value={c.typeOfCertification||""} onChange={e=>upd(c.autoId,{typeOfCertification:e.target.value})}/>
              </div>
            </div>
          </div>
        )}

        {detailTab==="indefinite" && (
          <div className="card">
            <div className="card-head"><h2>Indefinite Status</h2></div>
            <div className="card-body" style={{maxWidth:640}}>
              <div className="form-row"><label>Indefinite WEF</label><input type="date" className="input" value={c.indefiniteWEF||""} onChange={e=>upd(c.autoId,{indefiniteWEF:e.target.value})}/></div>
              <div className="form-row"><label>Salary Scale to be granted</label><input className="input" value={c.scaleToBeGranted||""} onChange={e=>upd(c.autoId,{scaleToBeGranted:e.target.value})}/></div>
              <div className="form-row"><label>Grade Desc to be Granted</label><input className="input" value={c.gradeDescToBeGranted||""} onChange={e=>upd(c.autoId,{gradeDescToBeGranted:e.target.value})}/></div>
              <div className="form-row"><label>Envisaged End — Level 6</label><input type="date" className="input" value={c.envEndDateLevel6||""} onChange={e=>upd(c.autoId,{envEndDateLevel6:e.target.value})}/></div>
              <div className="form-row"><label>Envisaged End — PG DIP</label><input type="date" className="input" value={c.envEndDatePGDIP||""} onChange={e=>upd(c.autoId,{envEndDatePGDIP:e.target.value})}/></div>
              <div className="form-row"><label>Envisaged End — Masters</label><input type="date" className="input" value={c.envEndDateMasters||""} onChange={e=>upd(c.autoId,{envEndDateMasters:e.target.value})}/></div>
              <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,padding:"6px 0"}}><input type="checkbox" checked={!!c.letterOfAppointmentSent} onChange={e=>upd(c.autoId,{letterOfAppointmentSent:e.target.checked})}/>Letter of Appointment sent</label>
              <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,padding:"6px 0"}}><input type="checkbox" checked={!!c.confirmationOfAppointmentSent} onChange={e=>upd(c.autoId,{confirmationOfAppointmentSent:e.target.checked})}/>Confirmation of Appointment sent</label>
              <div className="form-row"><label>Confirmation of App Date</label><input type="date" className="input" value={c.confirmationOfAppDate||""} onChange={e=>upd(c.autoId,{confirmationOfAppDate:e.target.value})}/></div>
              <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,padding:"6px 0"}}><input type="checkbox" checked={!!c.appointedTeacher} onChange={e=>upd(c.autoId,{appointedTeacher:e.target.checked})}/>Appointed teacher</label>
              <div className="form-row"><label>Appointed teacher on</label><input type="date" className="input" value={c.appointedTeacherOn||""} onChange={e=>upd(c.autoId,{appointedTeacherOn:e.target.value})}/></div>
            </div>
          </div>
        )}

        {detailTab==="workflow" && (
          <div className="card">
            <div className="card-head"><h2>Work Flow — Sent / Received on</h2><div className="right"><button className="btn sm">Edit Workflow</button></div></div>
            <div className="card-body" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
              <div>
                {[["letter4yrs","1) Letter (4 yrs)"],["ack","2) Acknowledgement"],["recommendPS","3) Recommendation to PS"],["emailRecPSC","4) E-Mail Rec to PSC manually"],["pscApproval","5) PSC Approval received"]].map(([k,l])=>(
                  <div key={k} style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                    <input type="checkbox" checked={!!c.wf[k].done} onChange={e=>updWF(c.autoId,k,{done:e.target.checked})}/>
                    <input type="date" className="input sm" style={{width:140}} value={c.wf[k].date||""} onChange={e=>updWF(c.autoId,k,{date:e.target.value})}/>
                    <span style={{fontSize:12,fontWeight:600}}>{l}</span>
                  </div>
                ))}
              </div>
              <div>
                {[["indefAppt","6) Indefinite Appointment"],["sentEmployee","6.1) Sent to Employee"],["sentPSC","6.2) Sent to PSC"],["uploadedSRS","6.3) Uploaded on SRS"],["forwardDegree","7) To Forward Degree & Transcript"],["listRecordsER","8) List Sent To RECORDS & ER"],["jobsPlusUpd","9) Jobs+ Updated"],["confOfAppt","10) Conf Of Appointment"]].map(([k,l])=>(
                  <div key={k} style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                    <input type="checkbox" checked={!!c.wf[k].done} onChange={e=>updWF(c.autoId,k,{done:e.target.checked})}/>
                    <input type="date" className="input sm" style={{width:140}} value={c.wf[k].date||""} onChange={e=>updWF(c.autoId,k,{date:e.target.value})}/>
                    <span style={{fontSize:12,fontWeight:600}}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button className="btn" onClick={()=>setMode("view-all")}>Close</button>
          <button className="btn primary" onClick={()=>setView("prs-view")}>View PRS</button>
        </div>
      </div>
    );
  }

  // ── VIEW ALL PERSONS ──────────────────────────────────────────
  if (mode === "view-all") {
    const sorted = [...localData].sort((a,b) => {
      switch(sortBy) {
        case "appt-asc":    return (a.appointmentDate||"").localeCompare(b.appointmentDate||"");
        case "name-asc":    return (a.surname||"").localeCompare(b.surname||"");
        case "name-desc":   return (b.surname||"").localeCompare(a.surname||"");
        default:            return (b.appointmentDate||"").localeCompare(a.appointmentDate||"");
      }
    });
    return (
      <div className="page">
        <ConfIndefBack setMode={setMode}/>
        <div className="card">
          <div className="card-head">
            <h2>View All Persons ({sorted.length})</h2>
            <div className="right">
              <select className="input sm" title="Sort" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                <option value="appt-desc">Appointment ↓</option>
                <option value="appt-asc">Appointment ↑</option>
                <option value="name-asc">Surname A→Z</option>
                <option value="name-desc">Surname Z→A</option>
              </select>
              <button className="btn sm">Export to Excel</button>
            </div>
          </div>
          <div className="table-scroll">
            <table className="table compact">
              <thead><tr><th>ID Card</th><th>Name</th><th>Surname</th><th>Part Time</th><th>Letter after 4 yrs</th><th>Conf of Appt sent</th><th>Appointment</th><th>Completed</th><th></th></tr></thead>
              <tbody>{sorted.map(c=>(
                <tr key={c.autoId}>
                  <td className="id">{c.idCard}</td>
                  <td><input className="input sm" value={c.firstName||""} onChange={e=>upd(c.autoId,{firstName:e.target.value})}/></td>
                  <td><input className="input sm" value={c.surname||""} onChange={e=>upd(c.autoId,{surname:e.target.value})}/></td>
                  <td>{c.partTime==="Y"?<span className="tag amber">Y</span>:<span className="tag gray">N</span>}</td>
                  <td>{c.letterAfter4yrsSent?<span className="tag green">Yes</span>:<span className="tag gray">No</span>}</td>
                  <td>{c.confOfAppSent?<span className="tag green">Yes</span>:<span className="tag gray">No</span>}</td>
                  <td className="num">{c.appointmentDate}</td>
                  <td><input type="checkbox" checked={!!c.completed} onChange={e=>upd(c.autoId,{completed:e.target.checked})}/></td>
                  <td><button className="btn xs" onClick={()=>{setSelected(c);setDetailTab("personal");setMode("detail");}}>View Details</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="card-foot"><span className="muted xs">{sorted.length} candidates · sorted by {sortBy.replace("-"," ")}</span></div>
        </div>
      </div>
    );
  }

  // ── FIND PERSON ───────────────────────────────────────────────
  if (mode === "find") {
    const match = findIdCard ? localData.find(c => c.idCard.toLowerCase() === findIdCard.toLowerCase().trim()) : null;
    return (
      <div className="page">
        <ConfIndefBack setMode={setMode}/>
        <div className="card" style={{maxWidth:520}}>
          <div className="card-head"><h2>Find Person</h2></div>
          <div className="card-body">
            <div className="form-row"><label>ID Card</label><input className="input" value={findIdCard} onChange={e=>setFindIdCard(e.target.value)} placeholder="e.g. 0043094M"/></div>
            {findIdCard && !match && <div className="muted xs">No indefinite-track record for that ID card.</div>}
            {match && (
              <div className="rec-row" style={{cursor:"pointer",marginTop:10}} onClick={()=>{setSelected(match);setDetailTab("personal");setMode("detail");}}>
                <div>
                  <div className="nm">{match.firstName} {match.surname}</div>
                  <div className="gr">{match.persGrade} · {match.persCollege} · Appt {match.appointmentDate}</div>
                </div>
                <div><span className={"tag "+(match.eligible?"green":"amber")}>{match.eligible?"Eligible":"Not Eligible"}</span></div>
              </div>
            )}
          </div>
          <div className="card-foot">
            <button className="btn" onClick={()=>setMode("menu")}>Close</button>
            <button className="btn primary" disabled={!match} onClick={()=>{if(match){setSelected(match);setDetailTab("personal");setMode("detail");}}}>Open record</button>
          </div>
        </div>
      </div>
    );
  }

  // ── IMPORT FROM DAKAR ─────────────────────────────────────────
  if (mode === "import") {
    return (
      <div className="page">
        <ConfIndefBack setMode={setMode}/>
        <div className="card" style={{maxWidth:520}}>
          <div className="card-head"><h2>Import From Dakar</h2></div>
          <div className="card-body">
            <p className="muted">Pulls the latest employment file from the Dakar HR system. Reconciles supply-teacher records against the indefinite-track candidates list.</p>
            <div style={{display:"flex",gap:8,marginTop:14}}>
              <button className="btn" onClick={()=>setMode("menu")}>Cancel</button>
              <button className="btn primary">Run Import</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── CHECK ELIGIBLE PERSONS ────────────────────────────────────
  if (mode === "check-eligible") {
    const ec = eligCheck;
    const computedEligible = ec.appointmentDate && ec.yrsSupply >= 4 && ec.certProduced && ec.noPendDiscipl;
    return (
      <div className="page">
        <ConfIndefBack setMode={setMode}/>
        <div className="card" style={{maxWidth:480}}>
          <div className="card-head"><h2>Eligibility check</h2></div>
          <div className="card-body">
            <div className="form-row"><label>Appointment Date</label><input type="date" className="input" value={ec.appointmentDate} onChange={e=>setEligCheck(s=>({...s,appointmentDate:e.target.value}))}/></div>
            <div className="form-row"><label>Years as Supply teacher</label><input type="number" className="input" value={ec.yrsSupply} onChange={e=>setEligCheck(s=>({...s,yrsSupply:Number(e.target.value)}))}/></div>
            <div className="form-row"><label>Unpaid Leave (months)</label><input type="number" className="input" value={ec.unpaidMonths} onChange={e=>setEligCheck(s=>({...s,unpaidMonths:Number(e.target.value)}))}/></div>
            <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,padding:"6px 0"}}><input type="checkbox" checked={ec.certProduced} onChange={e=>setEligCheck(s=>({...s,certProduced:e.target.checked}))}/>Certification produced</label>
            <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,padding:"6px 0"}}><input type="checkbox" checked={ec.noPendDiscipl} onChange={e=>setEligCheck(s=>({...s,noPendDiscipl:e.target.checked}))}/>No Pending Disciplinary Actions</label>
            <div className="form-row"><label>Eligible</label><span className={"tag "+(computedEligible?"green":"red")}>{computedEligible?"Yes":"No"}</span></div>
          </div>
          <div className="card-foot">
            <button className="btn" onClick={()=>setMode("menu")}>Close</button>
            <button className="btn primary" disabled={!computedEligible} onClick={()=>setEligCheck(s=>({...s,eligible:true}))}>Mark as Eligible</button>
          </div>
        </div>
      </div>
    );
  }

  // ── VIEW EXPIRED ENVISAGED DATE ───────────────────────────────
  if (mode === "expired") {
    const today = "2026-05-13";
    const expired = localData.filter(c => (c.envEndDateLevel6 && c.envEndDateLevel6 < today) || (c.envEndDatePGDIP && c.envEndDatePGDIP < today) || (c.envEndDateMasters && c.envEndDateMasters < today));
    return (
      <div className="page">
        <ConfIndefBack setMode={setMode}/>
        <div className="card">
          <div className="card-head"><h2>Expired Envisaged Dates ({expired.length})</h2><div className="right muted xs">Qualification deadlines that have passed</div></div>
          <table className="table compact">
            <thead><tr><th>ID Card</th><th>Name</th><th>Grade</th><th>Level 6</th><th>PG DIP</th><th>Masters</th><th></th></tr></thead>
            <tbody>{expired.length>0 ? expired.map(c=>(
              <tr key={c.autoId}>
                <td className="id">{c.idCard}</td>
                <td>{c.firstName} {c.surname}</td>
                <td className="muted xs">{c.persGrade}</td>
                <td className="num">{c.envEndDateLevel6||"—"}</td>
                <td className="num">{c.envEndDatePGDIP||"—"}</td>
                <td className="num">{c.envEndDateMasters||"—"}</td>
                <td><button className="btn xs" onClick={()=>{setSelected(c);setDetailTab("indefinite");setMode("detail");}}>View</button></td>
              </tr>
            )) : <tr><td colSpan={7} className="muted" style={{padding:"16px",textAlign:"center"}}>No expired envisaged dates.</td></tr>}</tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── MAINTENANCE ───────────────────────────────────────────────
  if (mode === "maintenance") {
    return (
      <div className="page">
        <ConfIndefBack setMode={setMode}/>
        <div className="card" style={{maxWidth:420}}>
          <div className="card-head"><h2>Maintenance</h2></div>
          <div className="card-body" style={{display:"flex",flexDirection:"column",gap:8}}>
            {["Lookup: Grade list","Lookup: Scale codes","Export indefinite to Excel","Bulk eligibility re-check","Reset workflow steps"].map((item,i)=>(
              <button key={i} className="btn" style={{textAlign:"left",justifyContent:"flex-start"}}>{item}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function ConfIndefBack({ setMode }) {
  return <button className="btn ghost" style={{marginBottom:14}} onClick={()=>setMode("menu")}>← Main Menu</button>;
}

// ─── VIEW RESULT SHEET (page) ───────────────────────────────────
function ViewResultSheet() {
  const rows = X?.VIEW_RESULT_SHEET || [];
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">Recruitment</div>
          <h1>Result sheet</h1>
          <p className="page-sub">Combined view of applications, ranking and final result. Used by senior officers to issue offers.</p>
        </div>
        <div className="page-actions">
          <button className="btn">Export PDF</button>
        </div>
      </div>
      <div className="card">
        <div className="card-head"><h2>Result sheet — all profiles</h2></div>
        <table className="table compact">
          <thead><tr><th>Profile</th><th>Title</th><th>Track</th><th>ID Card</th><th>Name</th><th className="right">Rank</th><th className="right">Mark</th><th>Result</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="mono xs">{r.jobProfileNumber}</td>
                <td>{r.jobTitle}</td>
                <td><span className={"tag " + (r.teaching===1?"blue":"gray")}>{r.teaching===1?"Teaching":"Non-teaching"}</span></td>
                <td className="id">{r.idCardNo}</td>
                <td>{r.name}</td>
                <td className="num right mono">{r.ranking}</td>
                <td className="num right mono">{r.mark}</td>
                <td><span className={"tag " + (r.result==="Selected"?"green":r.result==="Reserve"?"amber":"red")}>{r.result}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── VET CERTIFICATES (page) ─────────────────────────────────────
function VETCerts() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">Recruitment</div>
          <h1>VET certificates</h1>
          <p className="page-sub">Vocational training certificates required for trade-subject teachers — Plumbing, Electrical, Hospitality, and similar.</p>
        </div>
        <div className="page-actions">
          <button className="btn primary">+ Verify cert</button>
        </div>
      </div>
      <div className="card">
        <div className="card-head"><h2>Certificates on file</h2></div>
        <table className="table compact">
          <thead><tr><th>Subject</th><th>Holder</th><th>ID Card</th><th>Level</th><th>Issue date</th><th>Verified</th></tr></thead>
          <tbody>
            {(X?.VET_CERTIFICATES || []).map(v => (
              <tr key={v.id}>
                <td>{v.subject}</td>
                <td>{v.holder}</td>
                <td className="id">{v.holderId}</td>
                <td className="mono">{v.qualLevel}</td>
                <td className="num">{v.issueDate}</td>
                <td>{v.verified ? <span className="check">✓</span> : <span className="tag amber">Pending</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── DISCIPLINE (deep) ──────────────────────────────────────────
function DisciplineDeep() {
  const [idCard, setIdCard] = useState("00000001");
  const [mode, setMode] = useState("menu");
  const { setView } = useApp(); // menu | add-disc | view-data | check-expiry
  const [addForm, setAddForm] = useState({
    fromDate:"", toDate:"", numDays:"", showPrsTill:"", showGp47Till:"",
    approvedBy:"hod", penalty:"written-warning", info:""
  });
  const [localDisc, setLocalDisc] = useState(() =>
    D.DISCIPLINE.map(d => ({
      id: d.id,
      idCard: d.idCard,
      name: d.name,
      isDisc: true,
      showGp47: false,
      allowNoDate: false,
      gp47Expiry: d.expiryDate ? d.expiryDate.slice(0,10) : "",
      prsExpiry: d.expiryDate ? d.expiryDate.slice(0,10) : "",
      remark: `(${d.id}) ${d.type} — ${d.status}`,
    }))
  );
  const [expiryTab, setExpiryTab] = useState(null); // null | "gp47" | "prs"

  const foundPerson  = D.PEOPLE.find(p => p.idCard?.toLowerCase() === idCard.trim().toLowerCase());
  const personName   = foundPerson ? `${foundPerson.name} ${foundPerson.surname}` : null;
  const personRemarks= localDisc.filter(d => d.idCard === foundPerson?.idCard);

  const gp47Count   = localDisc.filter(d => d.isDisc && d.gp47Expiry).length;
  const prsCount    = localDisc.filter(d => d.isDisc && d.prsExpiry).length;
  const noDateCount = localDisc.filter(d => d.isDisc && !d.gp47Expiry && !d.prsExpiry).length;
  const gp47Records = localDisc.filter(d => d.isDisc && d.gp47Expiry);
  const prsRecords  = localDisc.filter(d => d.isDisc && d.prsExpiry);

  function handleSaveDisc() {
    if (!foundPerson) return;
    setLocalDisc(prev => [...prev, {
      id: Date.now(), idCard: foundPerson.idCard, name: personName,
      isDisc: true, showGp47: false, allowNoDate: false,
      gp47Expiry: addForm.showGp47Till, prsExpiry: addForm.showPrsTill,
      remark: addForm.info || addForm.penalty,
    }]);
    setAddForm({fromDate:"", toDate:"", numDays:"", showPrsTill:"", showGp47Till:"", approvedBy:"hod", penalty:"written-warning", info:""});
    setMode("menu");
  }

  function updateRemark(id, field, val) {
    setLocalDisc(prev => prev.map(r => r.id === id ? {...r, [field]: val} : r));
  }

  function deleteRemark(id) {
    setLocalDisc(prev => prev.filter(r => r.id !== id));
  }

  const PENALTIES = [
    {id:"written-warning",    label:"Written warning"},
    {id:"suspension-10",      label:"Suspension without pay for a number of days not exceeding ten working days;"},
    {id:"withhold-increment", label:"Withholding of increment for a period of not less than 1 year and not exceeding 3 years"},
    {id:"suspension-15",      label:"Suspension without pay for a number of days not exceeding 15 working days and a warning of dismissal valid for a number of years"},
    {id:"warning-dismissal",  label:"Warning of dismissal"},
    {id:"dismissal",          label:"Dismissal"},
  ];

  // ── MENU ───────────────────────────────────────────────────────────
  if (mode === "menu") return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">Discipline &amp; HR</div>
          <h1>Discipline Section</h1>
        </div>
      </div>
      <div className="card" style={{maxWidth:460, margin:"24px auto", padding:"28px 32px"}}>
        <div style={{textAlign:"center", marginBottom:24}}>
          <label style={{fontWeight:600, display:"block", marginBottom:8, fontSize:13}}>Insert ID Card</label>
          <input
            className="input"
            style={{maxWidth:220, textAlign:"center", fontSize:15, margin:"0 auto", display:"block"}}
            value={idCard}
            onChange={e=>setIdCard(e.target.value)}
            placeholder="ID Card number"
          />
          {personName && <div style={{marginTop:6, color:"var(--ink-2)", fontSize:13}}>{personName}</div>}
          {idCard && !personName && <div style={{marginTop:6, color:"#c0392b", fontSize:12}}>Person not found</div>}
        </div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
          <button className="btn primary" style={{padding:"16px 12px", fontSize:13, fontWeight:600}} onClick={()=>setView("prs-view")}>View PRS</button>
          <button className="btn primary" style={{padding:"16px 12px", fontSize:13, fontWeight:600}} onClick={()=>setMode("add-disc")}>Add Disciplinary</button>
          <button className="btn primary" style={{padding:"16px 12px", fontSize:13, fontWeight:600}}>Search Person</button>
          <button className="btn primary" style={{padding:"16px 12px", fontSize:13, fontWeight:600}} onClick={()=>setMode("view-data")}>View Disciplinary Data</button>
          <button className="btn primary" style={{padding:"16px 12px", fontSize:13, fontWeight:600}} onClick={()=>setMode("check-expiry")}>Check Disciplinary Expiry Dates</button>
          <button className="btn" style={{padding:"16px 12px", fontSize:13, fontWeight:700, color:"#c9980a", borderColor:"#c9980a"}} onClick={()=>setMode("add-disc")}>Add Pending Disciplinary Case</button>
        </div>
      </div>
    </div>
  );

  // ── ADD DISCIPLINARY ───────────────────────────────────────────────
  if (mode === "add-disc") return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">Discipline &amp; HR · <button className="btn xs" onClick={()=>setMode("menu")}>← Back</button></div>
          <h1>Add Disciplinary Record for : {idCard}</h1>
          {personName && <p className="page-sub">{personName}</p>}
        </div>
      </div>
      <div className="card" style={{padding:28}}>
        <div style={{display:"grid", gridTemplateColumns:"180px 1fr 1.5fr", gap:20}}>
          <div style={{display:"flex", flexDirection:"column", gap:12}}>
            {[["fromDate","From Date","date"],["toDate","To Date","date"],["numDays","Number of days","number"],["showPrsTill","Show in PRS till","date"],["showGp47Till","Show in GP47 till","date"]].map(([field,lbl,type])=>(
              <div key={field}>
                <label style={{fontWeight:600, fontSize:12, display:"block", marginBottom:3}}>{lbl}</label>
                <input className="input" type={type} value={addForm[field]} onChange={e=>setAddForm(f=>({...f,[field]:e.target.value}))} style={{fontSize:12}}/>
              </div>
            ))}
          </div>
          <div style={{border:"1px solid var(--line-2)", borderRadius:6, padding:16}}>
            <div style={{fontWeight:700, fontSize:13, marginBottom:14, textAlign:"center"}}>Approved By</div>
            {[["hod","Head of Department"],["opm","OPM on the recommendation of the PSC"]].map(([val,lbl])=>(
              <label key={val} style={{display:"flex", gap:8, alignItems:"flex-start", marginBottom:14, cursor:"pointer", fontSize:13}}>
                <input type="radio" name="approvedBy" value={val} checked={addForm.approvedBy===val} onChange={()=>setAddForm(f=>({...f,approvedBy:val}))} style={{marginTop:2}}/>
                {lbl}
              </label>
            ))}
          </div>
          <div style={{border:"1px solid var(--line-2)", borderRadius:6, padding:16}}>
            <div style={{fontWeight:700, fontSize:13, marginBottom:14, textAlign:"center"}}>Disciplinary penalties</div>
            {PENALTIES.map(p=>(
              <label key={p.id} style={{display:"flex", gap:8, alignItems:"flex-start", marginBottom:10, cursor:"pointer", fontSize:12}}>
                <input type="radio" name="penalty" value={p.id} checked={addForm.penalty===p.id} onChange={()=>setAddForm(f=>({...f,penalty:p.id}))} style={{marginTop:2, flexShrink:0}}/>
                {p.label}
              </label>
            ))}
          </div>
        </div>
        <div style={{marginTop:20}}>
          <div style={{fontWeight:600, fontSize:12, border:"1px solid var(--line-2)", background:"var(--surface-2,#f5f5f5)", padding:"6px 12px", borderRadius:"4px 4px 0 0", textAlign:"center"}}>
            Information in the PRS (in the remarks section)
          </div>
          <textarea className="input" style={{width:"100%", minHeight:90, borderRadius:"0 0 4px 4px", borderTop:"none", resize:"vertical", fontFamily:"inherit", fontSize:13, boxSizing:"border-box"}} value={addForm.info} onChange={e=>setAddForm(f=>({...f,info:e.target.value}))}/>
        </div>
        <div style={{display:"flex", gap:12, justifyContent:"center", marginTop:20}}>
          <button className="btn primary" onClick={handleSaveDisc}>Save and Close</button>
          <button className="btn" onClick={()=>setMode("menu")}>Don't Save and Close</button>
        </div>
      </div>
    </div>
  );

  // ── VIEW DISCIPLINARY DATA ─────────────────────────────────────────
  if (mode === "view-data") return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">Discipline &amp; HR · <button className="btn xs" onClick={()=>setMode("menu")}>← Back</button></div>
          <h1>{idCard}{personName ? ` — ${personName}` : ""}</h1>
        </div>
      </div>
      <div className="card" style={{padding:0, overflow:"hidden"}}>
        <table className="table">
          <thead>
            <tr>
              <th style={{width:"42%"}}>Remarks</th>
              <th style={{textAlign:"center"}}>Check if Disciplinary Record</th>
              <th></th>
              <th>Disciplinary Expiry Date GP47</th>
              <th>Disciplinary Expiry Date PRS</th>
            </tr>
          </thead>
          <tbody>
            {personRemarks.length === 0 && (
              <tr><td colSpan={5} className="muted" style={{padding:"24px 20px", textAlign:"center"}}>No discipline records for this ID card</td></tr>
            )}
            {personRemarks.map(r => (
              <tr key={r.id} style={{verticalAlign:"top", borderBottom:"1px solid var(--line-2)"}}>
                <td style={{padding:"10px 12px"}}>
                  <textarea className="input" style={{width:"100%", minHeight:56, resize:"vertical", fontFamily:"inherit", fontSize:12, boxSizing:"border-box"}} value={r.remark} onChange={e=>updateRemark(r.id,"remark",e.target.value)}/>
                  <div style={{display:"flex", gap:6, marginTop:5, flexWrap:"wrap"}}>
                    <label style={{display:"flex", gap:4, alignItems:"center", fontSize:11, cursor:"pointer", background:"#1a1a1a", color:"#ffe000", padding:"3px 7px", borderRadius:3, fontWeight:600}}>
                      <input type="checkbox" checked={!!r.showGp47} onChange={e=>updateRemark(r.id,"showGp47",e.target.checked)}/> Show Remark in GP47
                    </label>
                    <label style={{display:"flex", gap:4, alignItems:"center", fontSize:11, cursor:"pointer", background:"#1a1a1a", color:"#ffe000", padding:"3px 7px", borderRadius:3, fontWeight:600}}>
                      <input type="checkbox" checked={!!r.allowNoDate} onChange={e=>updateRemark(r.id,"allowNoDate",e.target.checked)}/> Allow No Discipline Date
                    </label>
                  </div>
                </td>
                <td style={{textAlign:"center", padding:"10px 12px", verticalAlign:"middle"}}>
                  <input type="checkbox" checked={!!r.isDisc} onChange={e=>updateRemark(r.id,"isDisc",e.target.checked)}/>
                </td>
                <td style={{padding:"10px 8px", verticalAlign:"middle"}}>
                  <button className="btn xs" style={{color:"#c0392b", borderColor:"#c0392b"}} onClick={()=>deleteRemark(r.id)}>Delete</button>
                </td>
                <td style={{padding:"10px 8px", verticalAlign:"middle"}}>
                  <input className="input" type="date" value={r.gp47Expiry} onChange={e=>updateRemark(r.id,"gp47Expiry",e.target.value)} style={{fontSize:12}}/>
                </td>
                <td style={{padding:"10px 8px", verticalAlign:"middle"}}>
                  <input className="input" type="date" value={r.prsExpiry} onChange={e=>updateRemark(r.id,"prsExpiry",e.target.value)} style={{fontSize:12}}/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px", borderTop:"1px solid var(--line-2)"}}>
          <span style={{fontWeight:700, fontSize:14}}>{personRemarks.length} Records</span>
          <button className="btn primary" onClick={()=>setMode("menu")}>Save and Close</button>
        </div>
      </div>
    </div>
  );

  // ── CHECK EXPIRY DATES ─────────────────────────────────────────────
  const expiryRecords = expiryTab === "gp47" ? gp47Records : prsRecords;
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">Discipline &amp; HR · <button className="btn xs" onClick={()=>setMode("menu")}>← Back</button></div>
          <h1>Disciplinary Expiry Dates</h1>
        </div>
      </div>
      <div style={{display:"flex", gap:24, alignItems:"flex-start"}}>
        <div className="card" style={{minWidth:260, padding:24, flexShrink:0}}>
          <h2 style={{marginBottom:16, fontSize:15, fontWeight:700}}>Expiry Dates</h2>
          {[
            {id:"gp47", label:`Expiry Date GP47 = ${gp47Count}`},
            {id:"prs",  label:`Expiry Date PRS = ${prsCount}`},
            {id:"none", label:`Discipline Remarks without dates = ${noDateCount}`},
          ].map(item => (
            <button key={item.id} className="btn primary"
              style={{display:"block", width:"100%", marginBottom:10, padding:"14px 12px", fontWeight:600, fontSize:13,
                      opacity: item.id==="none" ? 0.85 : 1,
                      outline: expiryTab===item.id ? "2px solid #fff" : "none"}}
              onClick={()=>item.id!=="none" && setExpiryTab(item.id)}>
              {item.label}
            </button>
          ))}
          <button className="btn" style={{display:"block", width:"100%", marginTop:8}} onClick={()=>setMode("menu")}>Close</button>
        </div>
        {expiryTab && (
          <div className="card" style={{flex:1, padding:0, overflow:"hidden"}}>
            <div style={{padding:"12px 20px", borderBottom:"1px solid var(--line-2)", fontWeight:700, fontSize:14}}>
              {expiryTab === "gp47" ? "GP 47 Expiry Dates" : "PRS Expiry Dates"}
            </div>
            <table className="table compact">
              <thead><tr><th>ID Card</th><th>Name</th><th>Expiry Date</th><th>Remarks</th><th></th></tr></thead>
              <tbody>
                {expiryRecords.map(r => (
                  <tr key={r.id} style={{verticalAlign:"top"}}>
                    <td className="id">{r.idCard}</td>
                    <td>{r.name}</td>
                    <td className="num">{expiryTab==="gp47" ? r.gp47Expiry : r.prsExpiry}</td>
                    <td style={{maxWidth:360, fontSize:12, color:"var(--ink-2)"}}>{r.remark}</td>
                    <td><button className="btn xs" style={{color:"#c0392b", borderColor:"#c0392b"}} onClick={()=>deleteRemark(r.id)}>Delete</button></td>
                  </tr>
                ))}
                {expiryRecords.length === 0 && (
                  <tr><td colSpan={5} className="muted" style={{padding:"24px 20px", textAlign:"center"}}>No records</td></tr>
                )}
              </tbody>
            </table>
            <div style={{padding:"12px 20px", borderTop:"1px solid var(--line-2)", textAlign:"right"}}>
              <button className="btn" onClick={()=>setExpiryTab(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PAYPOINTS (deep) — Access-style multi-screen ───────────────
function PayPointsDeep() {
  const [mode, setMode]           = useState("menu");
  const { setView } = useApp();
  const [selectedPP, setSelectedPP]   = useState(null);
  const [selectedDir, setSelectedDir] = useState(null);
  const [listOverlay, setListOverlay] = useState(null);
  const [findNo, setFindNo]       = useState("");
  const [addForm, setAddForm]     = useState({ppNo:"",college:"",desc:"",email:"",hosName:"",hosEmail:"",type:"None",comments:""});
  const [addDirForm, setAddDirForm] = useState({name:"",dirName:"",grade:"",email:"",comments:""});
  const updAddDir = (k,v) => setAddDirForm(f=>({...f,[k]:v}));
  const [localPP, setLocalPP]     = useState(() => [
    {ppNo:"06/001",college:"Gozo College",desc:"Gozo College - CP Office - Victoria",sopName:"Gozo College - CP Office - Victoria",email:"gozo.college@ilearn.edu.mt",hosName:"Sean Zammit",hosEmail:"sean.zammit@ilearn.edu.mt",type:"None",comments:""},
    {ppNo:"06/002",college:"Gozo College",desc:"Gozo College - Primary - Gharb",sopName:"Gozo College - Primary - Gharb",email:"",hosName:"",hosEmail:"",type:"Primary",comments:""},
    {ppNo:"06/003",college:"Gozo College",desc:"Gozo College - Primary - Ghajnsielem",sopName:"Gozo College - Primary - Ghajnsielem",email:"",hosName:"",hosEmail:"",type:"Primary",comments:""},
    {ppNo:"06/004",college:"Gozo College",desc:"Gozo College - Primary - Kercem",sopName:"Gozo College - Primary - Kercem",email:"",hosName:"",hosEmail:"",type:"Primary",comments:""},
    {ppNo:"06/005",college:"Gozo College",desc:"Gozo College - Primary - Nadur",sopName:"Gozo College - Primary - Nadur",email:"",hosName:"",hosEmail:"",type:"Primary",comments:""},
    {ppNo:"06/006",college:"Gozo College",desc:"Gozo College - Primary - Qala",sopName:"Gozo College - Primary - Qala",email:"",hosName:"",hosEmail:"",type:"Primary",comments:""},
    {ppNo:"12/123",college:"_Test Section",desc:"_Test Section",sopName:"_Test Section",email:"",hosName:"",hosEmail:"",type:"None",comments:""},
    {ppNo:"11/346",college:"AA",desc:"dddd",sopName:"dddd",email:"",hosName:"",hosEmail:"",type:"None",comments:""},
    {ppNo:"01/001",college:"St Benedict College",desc:"St Benedict College - Office",sopName:"",email:"",hosName:"",hosEmail:"",type:"None",comments:""},
    {ppNo:"01/002",college:"St Benedict College",desc:"St Benedict College - Primary - Birzebbuga",sopName:"",email:"",hosName:"",hosEmail:"",type:"Primary",comments:""},
    {ppNo:"01/003",college:"St Benedict College",desc:"St Benedict College - Primary - Marsaxlokk",sopName:"",email:"",hosName:"",hosEmail:"",type:"Primary",comments:""},
    {ppNo:"02/001",college:"St Ignatius College",desc:"St Ignatius College - Office",sopName:"",email:"",hosName:"",hosEmail:"",type:"None",comments:""},
    {ppNo:"02/002",college:"St Ignatius College",desc:"St Ignatius College - Secondary - Valletta",sopName:"",email:"",hosName:"",hosEmail:"",type:"Secondary",comments:""},
    {ppNo:"03/001",college:"St Margaret College",desc:"St Margaret College - Office",sopName:"",email:"",hosName:"",hosEmail:"",type:"None",comments:""},
    {ppNo:"04/001",college:"St Nicholas College",desc:"St Nicholas College - Office",sopName:"",email:"",hosName:"",hosEmail:"",type:"None",comments:""},
    {ppNo:"05/001",college:"St Clare College",desc:"St Clare College - Office",sopName:"",email:"",hosName:"",hosEmail:"",type:"None",comments:""},
  ]);
  const [localDir, setLocalDir]   = useState(() => [
    {id:1, name:"_Test Section",   dirName:"Joe Camilleri",  grade:"Director",         email:"joseph.camilleri.polidano@ilearn.edu.mt", ccEmail:"", comments:""},
    {id:2, name:"AA",              dirName:"AA Dir Name",    grade:"AA Dir Grade",     email:"joseph.camilleri.polidano@ilearn.edu.mt", ccEmail:"", comments:""},
    {id:3, name:"aab",             dirName:"",               grade:"",                 email:"",                                        ccEmail:"", comments:""},
    {id:4, name:"Accounts and Finance", dirName:"Vincent Borg", grade:"Officer in Grade 4", email:"vincent.e.borg@gov.mt",             ccEmail:"", comments:""},
    {id:5, name:"Accounts Section",dirName:"",               grade:"",                 email:"",                                        ccEmail:"", comments:""},
    {id:6, name:"Agenzija Zghazagh",dirName:"",              grade:"",                 email:"",                                        ccEmail:"", comments:""},
    {id:7, name:"Alimony Beneficiaries",dirName:"",          grade:"",                 email:"",                                        ccEmail:"", comments:""},
    {id:8, name:"Basketball Promotion Unit",dirName:"",      grade:"",                 email:"",                                        ccEmail:"", comments:""},
    {id:9, name:"Catch Up Classes",dirName:"",               grade:"",                 email:"",                                        ccEmail:"", comments:""},
    {id:10,name:"Commissioner for Voluntary Organisations",dirName:"",grade:"",        email:"",                                        ccEmail:"", comments:""},
    {id:11,name:"Gozo College",    dirName:"Sean Zammit",    grade:"Director",         email:"sean.zammit@ilearn.edu.mt",               ccEmail:"", comments:""},
    {id:12,name:"St Benedict College",dirName:"",            grade:"",                 email:"",                                        ccEmail:"", comments:""},
  ]);

  const COLLEGES = ["_Test Section","AA","aab","Accounts and Finance","Accounts Section","Agenzija Zghazagh","Alimony Beneficiaries","Basketball Promotion Unit","Catch Up Classes","Commissioner for Voluntary Organisations","Gozo College","St Benedict College","St Ignatius College","St Margaret College","St Nicholas College","St Clare College","State Technical College","MCAST"];
  const PP_TYPES = ["Primary","Secondary","Special Education","Other","None"];

  const upd    = (k,v) => setSelectedPP(p=>({...p,[k]:v}));
  const updAdd = (k,v) => setAddForm(f=>({...f,[k]:v}));
  const updDir = (k,v) => setSelectedDir(d=>({...d,[k]:v}));
  const backBtn = (label="← Pay Points", target="menu") => (
    <button className="btn ghost" style={{marginBottom:14}} onClick={()=>setMode(target)}>{label}</button>
  );
  const FF = ({label,value,onChange,readOnly,as,options}) => (
    <div className="form-row">
      <label>{label}</label>
      {as==="select" ? (
        <select className="input" title={label} value={value||""} onChange={e=>onChange&&onChange(e.target.value)} disabled={readOnly}>
          <option value=""/>{options.map(c=><option key={c}>{c}</option>)}
        </select>
      ) : (
        <input className="input" value={value||""} onChange={e=>onChange&&onChange(e.target.value)} readOnly={!!readOnly}/>
      )}
    </div>
  );

  // ── MENU (dashboard) ─────────────────────────────────────────────
  if (mode === "menu") {
    const ACTIONS = [
      {id:"add-paypoint",       label:"Add Pay Point",      icon:"+", desc:"Create a new pay point"},
      {id:"view-edit-paypoint", label:"View / Edit",        icon:"✎", desc:"Browse and modify pay points"},
      {id:"find-paypoint",      label:"Find Pay Point No",  icon:"⌕", desc:"Search by number or description"},
      {id:"sop-paypoints",      label:"SOP Pay Points",     icon:"⌖", desc:"Standing operating procedure list"},
      {id:"add-directorate",    label:"Add Directorate",    icon:"+", desc:"Register a new directorate"},
      {id:"list-directorates",  label:"Directorates + PPs", icon:"≡", desc:"Directorates with linked pay points"},
      {id:"er-paypoints",       label:"ER Pay Point List",  icon:"↗", desc:"Export-ready full pay-point list"},
    ];

    return (
      <div className="page">
        <div className="page-head">
          <div>
            <div className="crumbs">Pay Points</div>
            <h1>Pay Points</h1>
            <p className="page-sub">Master list of pay points across all colleges and directorates. Each pay point links a school or office to its HoS contact.</p>
          </div>
          <div className="page-actions">
            <button className="btn" onClick={()=>setMode("maintenance")}>Maintenance</button>
            <button className="btn primary" onClick={()=>setMode("add-paypoint")}>+ New Pay Point</button>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h2>Quick actions</h2></div>
          <div className="card-body" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:10}}>
            {ACTIONS.map(a => (
              <button key={a.id} className="action-card" onClick={()=>setMode(a.id)}>
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

  // ── Type radio group (used in add + view) ──────────────────────
  const TypeRadios = ({value, name, onChange}) => (
    <div className="form-row top">
      <label>Type</label>
      <div className="radio-group-box" style={{flexDirection:"row",flexWrap:"wrap",gap:"4px 16px"}}>
        {PP_TYPES.map(t=>(
          <label key={t}>
            <input type="radio" name={name} value={t} checked={value===t} onChange={()=>onChange(t)}/>{t}
          </label>
        ))}
      </div>
    </div>
  );

  // ── PP DETAIL FORM ─────────────────────────────────────────────
  if (mode === "view-pp-detail" && selectedPP) {
    const pp = selectedPP;
    return (
      <div className="page">
        {backBtn("← Pay Points list", "view-edit-paypoint")}
        <div className="card" style={{maxWidth:720}}>
          <div className="card-head">
            <h2>View / Edit Pay Point</h2>
            <span className="tag gray" style={{marginLeft:8}}>{pp.ppNo}</span>
          </div>
          <div className="card-body">
            <div className="form-row"><label>SOP Pay Point Name</label><span style={{fontWeight:500}}>{pp.sopName || pp.desc}</span></div>
            <FF label="Pay point No" value={pp.ppNo} readOnly/>
            <FF label="College / Dept" value={pp.college} as="select" options={COLLEGES} onChange={v=>upd("college",v)}/>
            <div className="form-row">
              <label>Pay Point Description</label>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <input className="input" style={{flex:1}} value={pp.desc} onChange={e=>upd("desc",e.target.value)}/>
                <button type="button" className="btn xs" onClick={()=>upd("desc",pp.sopName||pp.college)}>= SOP name</button>
              </div>
            </div>
            <FF label="School e-mail" value={pp.email} onChange={v=>upd("email",v)}/>
            <FF label="HoS Name" value={pp.hosName} onChange={v=>upd("hosName",v)}/>
            <FF label="HoS e-mail" value={pp.hosEmail} onChange={v=>upd("hosEmail",v)}/>
            <div className="form-row top">
              <label>Comments</label>
              <textarea className="input" rows={3} style={{resize:"vertical"}} value={pp.comments||""} onChange={e=>upd("comments",e.target.value)}/>
            </div>
            <TypeRadios value={pp.type} name="ppType" onChange={t=>upd("type",t)}/>
          </div>
          <div className="card-foot">
            <button className="btn danger" onClick={()=>{setLocalPP(rs=>rs.filter(x=>x.ppNo!==pp.ppNo));setMode("view-edit-paypoint");}}>Delete</button>
            <div style={{display:"flex",gap:8}}>
              <button className="btn" onClick={()=>setMode("view-edit-paypoint")}>Cancel</button>
              <button className="btn primary" onClick={()=>{setLocalPP(rs=>rs.map(x=>x.ppNo===pp.ppNo?pp:x));setMode("view-edit-paypoint");}}>Save and Close</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ADD PAY POINT ─────────────────────────────────────────────
  if (mode === "add-paypoint") {
    const af = addForm;
    return (
      <div className="page">
        {backBtn()}
        <div className="card" style={{maxWidth:720}}>
          <div className="card-head"><h2>Add new pay point</h2></div>
          <div className="card-body">
            <FF label="Pay point No" value={af.ppNo} onChange={v=>updAdd("ppNo",v)}/>
            <FF label="College / Dept" value={af.college} as="select" options={COLLEGES} onChange={v=>updAdd("college",v)}/>
            <div className="form-row">
              <label>Pay Point Description</label>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <input className="input" style={{flex:1}} value={af.desc} onChange={e=>updAdd("desc",e.target.value)}/>
                <button type="button" className="btn xs" onClick={()=>updAdd("desc",af.college)}>= College</button>
              </div>
            </div>
            <FF label="School e-mail" value={af.email} onChange={v=>updAdd("email",v)}/>
            <FF label="HoS Name" value={af.hosName} onChange={v=>updAdd("hosName",v)}/>
            <FF label="HoS e-mail" value={af.hosEmail} onChange={v=>updAdd("hosEmail",v)}/>
            <TypeRadios value={af.type} name="addPpType" onChange={t=>updAdd("type",t)}/>
          </div>
          <div className="card-foot">
            <span className="muted xs">Pay point number is required.</span>
            <div style={{display:"flex",gap:8}}>
              <button className="btn" onClick={()=>setMode("menu")}>Cancel</button>
              <button className="btn primary" disabled={!af.ppNo}
                onClick={()=>{setLocalPP(rs=>[...rs,{...af,sopName:af.desc}]);setAddForm({ppNo:"",college:"",desc:"",email:"",hosName:"",hosEmail:"",type:"None",comments:""});setMode("menu");}}>
                Save and Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── VIEW / EDIT PAY POINT ─────────────────────────────────────
  if (mode === "view-edit-paypoint" || mode === "find-paypoint") {
    const q = findNo.toLowerCase();
    const filtered = mode === "find-paypoint" && findNo
      ? localPP.filter(r=>r.ppNo.toLowerCase().includes(q)||r.desc.toLowerCase().includes(q))
      : localPP;
    return (
      <div className="page">
        {backBtn()}
        <div className="card">
          <div className="card-head">
            <h2>{mode==="find-paypoint"?"Find Pay Point No":"View / Edit Pay Point"}</h2>
            <div className="right" style={{display:"flex",gap:8}}>
              <input className="input sm" style={{width:200}} placeholder="Search pay point no or description…"
                value={findNo} onChange={e=>setFindNo(e.target.value)}/>
            </div>
          </div>
          <div className="table-scroll">
            <table className="table compact">
              <thead><tr><th>Pay Point No</th><th>Description</th><th>College / Dept</th><th>Type</th><th>HOS Name</th><th></th></tr></thead>
              <tbody>
                {filtered.map((pp,i)=>(
                  <tr key={i}>
                    <td className="mono">{pp.ppNo}</td>
                    <td>{pp.desc}</td>
                    <td className="muted xs">{pp.college}</td>
                    <td><span className="tag gray">{pp.type}</span></td>
                    <td className="muted xs">{pp.hosName||"—"}</td>
                    <td><button className="btn xs" onClick={()=>{setSelectedPP({...pp});setMode("view-pp-detail");}}>View Details</button></td>
                  </tr>
                ))}
                {filtered.length===0&&<tr><td colSpan={6} className="muted" style={{padding:"16px",textAlign:"center"}}>No pay points found.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="card-foot muted xs">{filtered.length} of {localPP.length} pay points</div>
        </div>
      </div>
    );
  }

  // ── SOP PAY POINTS ────────────────────────────────────────────
  if (mode === "sop-paypoints") {
    return (
      <div className="page">
        {backBtn()}
        <div className="card">
          <div className="card-head">
            <h2>SOP Pay Points</h2>
            <div className="right">
              <span className="muted xs">Standing operating procedure register</span>
              <button className="btn sm">View S.O.P.</button>
            </div>
          </div>
          <table className="table compact">
            <thead><tr><th style={{width:120}}>Pay Point No</th><th>SOP / Description</th><th>College</th><th>Type</th><th></th></tr></thead>
            <tbody>{localPP.map((pp,i)=>(
              <tr key={i}>
                <td className="mono">{pp.ppNo}</td>
                <td>{pp.sopName || pp.desc}</td>
                <td className="muted xs">{pp.college}</td>
                <td><span className="tag gray">{pp.type}</span></td>
                <td><button className="btn xs" onClick={()=>{setSelectedPP({...pp});setMode("view-pp-detail");}}>Details</button></td>
              </tr>
            ))}</tbody>
          </table>
          <div className="card-foot muted xs">{localPP.length} pay points · click Details to edit</div>
        </div>
      </div>
    );
  }

  // ── VIEW DIRECTORATE — SINGLE EDIT ─────────────────────────────
  if (mode === "view-directorate" && selectedDir) {
    const d = selectedDir;
    const dirPP = localPP.filter(p=>p.college===d.name);
    return (
      <div className="page">
        {backBtn("← Directorates list", "view-directorate-list")}
        <div className="card" style={{maxWidth:780}}>
          <div className="card-head">
            <h2>Edit Directorate / College</h2>
            <div className="right"><span className="tag pink">{dirPP.length} linked pay points</span></div>
          </div>
          <div className="card-body">
            <FF label="Directorate / College" value={d.name} onChange={v=>updDir("name",v)}/>
            <FF label="Name and Surname" value={d.dirName} onChange={v=>updDir("dirName",v)}/>
            <FF label="Grade" value={d.grade} onChange={v=>updDir("grade",v)}/>
            <FF label="E-mail" value={d.email} onChange={v=>updDir("email",v)}/>
            <FF label="CC e-mail" value={d.ccEmail} onChange={v=>updDir("ccEmail",v)}/>
            <div className="form-row top">
              <label>Comments</label>
              <textarea className="input" rows={2} style={{resize:"vertical"}} value={d.comments||""} onChange={e=>updDir("comments",e.target.value)}/>
            </div>
            {dirPP.length > 0 && (
              <div style={{marginTop:10,padding:"10px 12px",background:"var(--panel-2)",borderRadius:"var(--r-sm)",border:"1px solid var(--line-2)"}}>
                <div className="muted xs" style={{fontWeight:600,marginBottom:6}}>Linked pay points ({dirPP.length})</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {dirPP.map(pp=>(
                    <span key={pp.ppNo} className="tag gray" style={{cursor:"pointer"}} onClick={()=>{setSelectedPP({...pp});setMode("view-pp-detail");}}>{pp.ppNo} · {pp.desc}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="card-foot">
            <button className="btn" onClick={()=>setMode("view-edit-paypoint")}>View pay points</button>
            <div style={{display:"flex",gap:8}}>
              <button className="btn" onClick={()=>{setSelectedDir(null);setMode("view-directorate-list");}}>Cancel</button>
              <button className="btn primary" onClick={()=>{setLocalDir(ds=>ds.map(x=>x.id===d.id?d:x));setSelectedDir(null);setMode("view-directorate-list");}}>Save and Close</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "view-directorate" || mode === "view-directorate-list") {
    return (
      <div className="page">
        {backBtn()}
        <div className="card">
          <div className="card-head">
            <h2>Directorates &amp; Colleges</h2>
            <div className="right">
              <span className="muted xs">{localDir.length} entries</span>
              <button className="btn sm primary" onClick={()=>setMode("add-directorate")}>+ Add</button>
            </div>
          </div>
          <div className="table-scroll">
            <table className="table compact">
              <thead><tr><th>Directorate / College</th><th>Name and Surname</th><th>Grade</th><th>E-mail</th><th className="right">Pay points</th><th></th></tr></thead>
              <tbody>{localDir.map(d=>{
                const linked = localPP.filter(p=>p.college===d.name).length;
                return (
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td>{d.dirName||<span className="muted">—</span>}</td>
                    <td className="muted xs">{d.grade||"—"}</td>
                    <td className="muted xs">{d.email||"—"}</td>
                    <td className="num right mono">{linked || <span className="muted">0</span>}</td>
                    <td><button className="btn xs" onClick={()=>{setSelectedDir({...d});setMode("view-directorate");}}>View</button></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ── ADD DIRECTORATE / COLLEGE ──────────────────────────────────
  if (mode === "add-directorate") {
    const af = addDirForm;
    return (
      <div className="page">
        {backBtn()}
        <div className="card" style={{maxWidth:680}}>
          <div className="card-head"><h2>Add Directorate / College</h2></div>
          <div className="card-body">
            <FF label="Directorate / College" value={af.name}    onChange={v=>updAddDir("name",v)}/>
            <FF label="Name and Surname"      value={af.dirName} onChange={v=>updAddDir("dirName",v)}/>
            <FF label="Grade"                 value={af.grade}   onChange={v=>updAddDir("grade",v)}/>
            <FF label="E-mail"                value={af.email}   onChange={v=>updAddDir("email",v)}/>
            <div className="form-row top">
              <label>Comments</label>
              <textarea className="input" rows={2} style={{resize:"vertical"}} value={af.comments||""} onChange={e=>updAddDir("comments",e.target.value)}/>
            </div>
          </div>
          <div className="card-foot">
            <span className="muted xs">Directorate name is required.</span>
            <div style={{display:"flex",gap:8}}>
              <button className="btn" onClick={()=>setMode("menu")}>Cancel</button>
              <button className="btn primary" disabled={!af.name}
                onClick={()=>{setLocalDir(ds=>[...ds,{...af,id:Date.now()}]);setAddDirForm({name:"",dirName:"",grade:"",email:"",comments:""});setMode("menu");}}>
                Save and Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST OF DIRECTORATES + LINKED PAY POINTS ──────────────────
  if (mode === "list-directorates") {
    const ovDir = listOverlay;
    const ovPP  = ovDir ? localPP.filter(p=>p.college===ovDir.name) : [];
    return (
      <div className="page">
        {backBtn()}
        {ovDir && (
          <div className="modal-overlay" onClick={()=>setListOverlay(null)}>
            <div className="modal wide" onClick={e=>e.stopPropagation()}>
              <div className="modal-head"><h3>Pay Points — {ovDir.name}</h3><button className="close" onClick={()=>setListOverlay(null)}>✕</button></div>
              <div className="modal-body" style={{padding:0}}>
                <div style={{padding:"12px 18px",display:"grid",gridTemplateColumns:"auto 1fr auto 1fr",gap:"5px 12px",fontSize:12,background:"var(--panel-2)",borderBottom:"1px solid var(--line-2)"}}>
                  <span className="muted">Main office</span><span style={{fontWeight:600}}>{ovDir.name}</span>
                  <span className="muted">Pay points</span><span style={{fontWeight:600}}>{ovPP.length}</span>
                  <span className="muted">Director</span><span>{ovDir.dirName||"—"}</span>
                  <span className="muted">Grade</span><span>{ovDir.grade||"—"}</span>
                  <span className="muted">E-mail</span><span>{ovDir.email||"—"}</span>
                  <span className="muted">Comments</span><span>{ovDir.comments||""}</span>
                </div>
                {ovPP.length > 0 ? (
                  <table className="table compact">
                    <thead><tr><th>Pay Point</th><th>Description</th><th>HoS</th><th>HoS e-mail</th><th>School e-mail</th><th></th></tr></thead>
                    <tbody>{ovPP.map((pp,i)=>(
                      <React.Fragment key={i}>
                        <tr>
                          <td className="mono">{pp.ppNo}</td>
                          <td>{pp.desc}</td>
                          <td className="muted xs">{pp.hosName||"—"}</td>
                          <td className="muted xs">{pp.hosEmail||"—"}</td>
                          <td className="muted xs">{pp.email||"—"}</td>
                          <td><button className="btn xs danger" onClick={()=>setLocalPP(rs=>rs.filter(x=>x.ppNo!==pp.ppNo))}>Delete</button></td>
                        </tr>
                        <tr style={{background:"var(--panel-2)"}}>
                          <td colSpan={6} style={{padding:"4px 12px"}}>
                            <span className="muted xs" style={{marginRight:8}}>Comments</span>
                            <input className="input" style={{fontSize:11,padding:"3px 8px",width:380}} value={pp.comments||""}
                              onChange={e=>setLocalPP(rs=>rs.map(x=>x.ppNo===pp.ppNo?{...x,comments:e.target.value}:x))}/>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}</tbody>
                  </table>
                ) : (
                  <div className="empty" style={{margin:18}}>No pay points linked to this directorate.</div>
                )}
              </div>
              <div className="modal-foot">
                <button className="btn">Print</button>
                <button className="btn primary" onClick={()=>setListOverlay(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
        <div className="card">
          <div className="card-head"><h2>Directorates &amp; Colleges with linked pay points</h2><div className="right"><span className="muted xs">{localDir.length} entries</span></div></div>
          <table className="table compact">
            <thead><tr><th>Directorate / College</th><th>Director</th><th>Grade</th><th>E-mail</th><th>CC e-mail</th><th className="right">Pay points</th><th></th></tr></thead>
            <tbody>{localDir.map(d=>{
              const linked = localPP.filter(p=>p.college===d.name).length;
              return (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.dirName || <span className="muted">—</span>}</td>
                  <td className="muted xs">{d.grade||"—"}</td>
                  <td className="muted xs">{d.email||"—"}</td>
                  <td className="muted xs">{d.ccEmail||"—"}</td>
                  <td className="num right mono">{linked || <span className="muted">0</span>}</td>
                  <td style={{display:"flex",gap:4}}>
                    <button className="btn xs" onClick={()=>setListOverlay(d)}>View PPs</button>
                    <button className="btn xs" onClick={()=>{setSelectedDir({...d});setMode("view-directorate");}}>Edit</button>
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── ER PAY POINT LIST ──────────────────────────────────────────
  if (mode === "er-paypoints") {
    return (
      <div className="page">
        {backBtn()}
        <div className="card">
          <div className="card-head"><h2>ER Pay Point List</h2><div className="right"><span className="muted xs">{localPP.length} pay points</span></div></div>
          <div className="table-scroll">
            <table className="table compact">
              <thead><tr><th>Pay Point No</th><th>SOP Name</th><th>Description</th><th>College</th><th>Type</th><th>School E-mail</th><th>HOS</th></tr></thead>
              <tbody>{localPP.map((pp,i)=>(
                <tr key={i}>
                  <td className="mono">{pp.ppNo}</td>
                  <td className="muted xs">{pp.sopName||"—"}</td>
                  <td>{pp.desc}</td>
                  <td className="muted xs">{pp.college}</td>
                  <td><span className="tag gray">{pp.type}</span></td>
                  <td className="muted xs">{pp.email||"—"}</td>
                  <td className="muted xs">{pp.hosName||"—"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="card-foot muted xs">{localPP.length} pay point records</div>
        </div>
      </div>
    );
  }

  // ── MAINTENANCE ────────────────────────────────────────────────
  if (mode === "maintenance") return (
    <div className="page">
      {backBtn()}
      <div className="card" style={{maxWidth:420}}>
        <div className="card-head"><h2>Maintenance</h2></div>
        <div style={{padding:14,display:"flex",flexDirection:"column",gap:8}}>
          {["Update pay point numbers","Edit SOP names","Merge duplicate pay points","Export pay points to Excel","Import pay points from Excel","Compact & repair database"].map((item,i)=>(
            <button key={i} className="btn" style={{textAlign:"left"}}>{item}</button>
          ))}
        </div>
      </div>
    </div>
  );

  return null;
}

window.PageExtras = { Vaccine, ConfAppointment, ConfIndefinite, ViewResultSheet, VETCerts, DisciplineDeep, PayPointsDeep };
})();
