// Deep pages — welfare + records cluster
// Leaves (sick + special), GP47, Discipline, Injury, Documents Sent, HR Plan, Pay Points
(function(){
const { useState, useMemo } = React;
const D = window.HR_DATA;
const X = window.DEEP_DATA;
const ApprovalPill = window.ApprovalPill;
const { useApp } = window.Shell;

// ─────────────────────────────────────────────────────────────────
// LEAVES — SickLeaveData + SpecialLeaveData + LeaveType
// ─────────────────────────────────────────────────────────────────
function LeavesDeep({ readOnly = false } = {}) {
  const ro = readOnly;
  const { roleKey } = useApp();
  const [overlay, setOverlay]     = useState(null); // null|"sick"|"special"|"reduced"
  const [mode, setMode]           = useState("menu"); // menu|view
  const [recordsTab, setRecordsTab] = useState("sick"); // sick|special|reduced|reports
  const [idCardInput, setIdCardInput] = useState("");
  const [slForm, setSlForm]       = useState({idCard:"",year:"2026",totalDays:"",comments:""});
  const [spForm, setSpForm]       = useState({idCard:"",paidType:"Paid",state:"Teaching",fromDate:"",toDate:"",leaveType:"",comments:""});
  const [rpForm, setRpForm]       = useState({idCard:"",type:"Reduced",hrsPerWeek:"0",fromDate:"",toDate:"",comments:""});
  const [localSick, setLocalSick] = useState(X?.SICK_LEAVE_DATA || []);
  const [localSpecial, setLocalSpecial] = useState(X?.SPECIAL_LEAVE_DATA || []);
  const [localRPT, setLocalRPT]   = useState(X?.RED_PT_DATA || []);

  const BG = "#ffffff";
  const LEAVE_TYPES = [
    "Maternity Leave And Breastfeeding Facilities","Special Reason Unpaid","Parental Leave",
    "Unpaid Maternity Leave","Marriage/Civil Union Leave","Bereavement Leave",
    "Donation of Vacation Leave/TOIL","Paternity Leave","International Sports Activities",
    "Paid Study Leave","Career Break","Sick Leave (Unpaid)","Injury on Duty Leave",
    "IVF Leave","Alternative Employment (Unpaid)","Pre-Retirement Leave",
    "Release on Paid Leave","Study Leave Abroad","Trade Union Leave","Other",
  ];
  const lookupPerson = (ic) => D.PEOPLE.find(p=>p.idCard.toLowerCase()===ic.toLowerCase().trim())||null;
  const calcDays = (f,t) => { try { const d=new Date(t)-new Date(f); return d>=0?Math.round(d/86400000)+1:0; } catch{return 0;} };
  const spDays = calcDays(spForm.fromDate, spForm.toDate);

  // Overlay-form button style (used by the 3 leave entry modals)
  const OB = {background:"#ffffff",border:"1px solid #e6e6f0",color:"#1a1a2e",padding:"8px 16px",borderRadius:4,fontSize:12,cursor:"pointer"};

  const saveSL = () => { const r={persIdNo:slForm.idCard,slYear:slForm.year,totDays:slForm.totalDays,slComments:slForm.comments,officer:"camij",dateAdded:new Date().toISOString().split("T")[0],id:Date.now()}; setLocalSick(rs=>[...rs,r]); return r; };
  const saveSP = () => { const r={persIdNo:spForm.idCard,nature:spForm.leaveType,paidUnpaid:spForm.paidType==="Paid"?1:2,state:spForm.state,fromDate:spForm.fromDate,toDate:spForm.toDate,totDays:spDays,comments:spForm.comments,officer:"camij",dateAdded:new Date().toISOString().split("T")[0],id:Date.now()}; setLocalSpecial(rs=>[...rs,r]); return r; };
  const saveRP = () => { const r={...rpForm,persIdNo:rpForm.idCard,officer:"camij",dateAdded:new Date().toISOString().split("T")[0],id:Date.now()}; setLocalRPT(rs=>[...rs,r]); return r; };

  // ── VIEW (tabs: sick / special / reduced / reports) ─────────────
  if (mode === "view") {
    const person = idCardInput ? lookupPerson(idCardInput) : null;
    const personFilter = rows => idCardInput ? rows.filter(r=>r.persIdNo===idCardInput||r.idCard===idCardInput) : rows;
    const sick    = personFilter(localSick);
    const special = personFilter(localSpecial);
    const rpt     = personFilter(localRPT);
    const tableRows = recordsTab==="sick"?sick:recordsTab==="special"?special:recordsTab==="reduced"?rpt:[];

    return (
      <div className="page">
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
          <button className="btn ghost" onClick={()=>setMode("menu")}>← Leaves</button>
          <h1 style={{margin:0,fontSize:18}}>{person?person.name+" "+person.surname:"All Leave Records"}</h1>
          <div style={{flex:1}}/>
          {idCardInput && <button className="btn sm" onClick={()=>{setIdCardInput("");}}>Clear filter</button>}
          {!ro && <button className="btn sm" onClick={()=>{setSlForm(f=>({...f,idCard:idCardInput}));setOverlay("sick");}}>+ Sick</button>}
          {!ro && <button className="btn sm" onClick={()=>{setSpForm(f=>({...f,idCard:idCardInput}));setOverlay("special");}}>+ Special</button>}
          {!ro && <button className="btn sm" onClick={()=>{setRpForm(f=>({...f,idCard:idCardInput}));setOverlay("reduced");}}>+ Reduced/PT</button>}
        </div>

        {person && (
          <div className="dossier-header">
            <div className="dossier-id-block">
              <div className="dossier-name">{person.name} {person.surname}</div>
              <div className="dossier-meta">
                <span><strong>ID Card:</strong> {person.idCard}</span>
                <span><strong>Grade:</strong> {person.gradeDesc}</span>
                <span><strong>Scale:</strong> {person.salScale}</span>
                <span><strong>Pay Point:</strong> {person.paypointDesc}</span>
              </div>
            </div>
          </div>
        )}
        {idCardInput && !person && <div className="muted xs" style={{marginBottom:12}}>Person not found for ID: {idCardInput}</div>}

        <div className="tabs">
          <div className={"tab "+(recordsTab==="sick"?"active":"")} onClick={()=>setRecordsTab("sick")}>Sick Leave <span className="count">{sick.length}</span></div>
          <div className={"tab "+(recordsTab==="special"?"active":"")} onClick={()=>setRecordsTab("special")}>Special Leave <span className="count">{special.length}</span></div>
          <div className={"tab "+(recordsTab==="reduced"?"active":"")} onClick={()=>setRecordsTab("reduced")}>Reduced / Part-Time <span className="count">{rpt.length}</span></div>
          {person && <div className={"tab "+(recordsTab==="card"?"active":"")} onClick={()=>setRecordsTab("card")}>Leave Card <span className="count">{sick.length+special.length+rpt.length}</span></div>}
          <div className={"tab "+(recordsTab==="reports"?"active":"")} onClick={()=>setRecordsTab("reports")}>Generic Reports</div>
        </div>

        {recordsTab==="sick" && (
          <div className="card">
            <div className="card-head"><h2>Sick Leave ({sick.length})</h2><div className="right">{!ro && <button className="btn sm primary" onClick={()=>{setSlForm(f=>({...f,idCard:idCardInput}));setOverlay("sick");}}>+ Add</button>}</div></div>
            <div className="table-scroll">
              <table className="table compact">
                <thead><tr>{!person&&<th>ID Card</th>}<th>Year</th><th className="right">Days</th><th>Comments</th><th>Officer</th><th>Added</th></tr></thead>
                <tbody>{sick.length>0?sick.slice(0,40).map((r,i)=>(
                  <tr key={i}>
                    {!person&&<td className="id">{r.persIdNo||r.idCard}</td>}
                    <td className="mono">{r.slYear||r.year}</td>
                    <td className="num right mono">{r.totDays||r.totalDays}</td>
                    <td className="muted xs">{r.slComments||r.comments||"—"}</td>
                    <td className="mono xs">{r.officer||"—"}</td>
                    <td className="mono xs">{r.dateAdded||"—"}</td>
                  </tr>
                )):<tr><td colSpan={person?5:6} className="muted" style={{padding:"16px",textAlign:"center"}}>No records.</td></tr>}</tbody>
              </table>
            </div>
            {sick.length>40 && <div className="card-foot muted xs">Showing 40 of {sick.length}</div>}
          </div>
        )}

        {recordsTab==="special" && (
          <div className="card">
            <div className="card-head"><h2>Special Leave ({special.length})</h2><div className="right">{!ro && <button className="btn sm primary" onClick={()=>{setSpForm(f=>({...f,idCard:idCardInput}));setOverlay("special");}}>+ Add</button>}</div></div>
            <div className="table-scroll">
              <table className="table compact">
                <thead><tr>{!person&&<th>ID Card</th>}<th>Leave Type</th><th>From</th><th>To</th><th className="right">Days</th><th>Paid</th><th>State</th><th>Officer</th></tr></thead>
                <tbody>{special.length>0?special.slice(0,40).map((r,i)=>(
                  <tr key={i}>
                    {!person&&<td className="id">{r.persIdNo||r.idCard}</td>}
                    <td className="muted xs">{r.nature||r.leaveType||"—"}</td>
                    <td className="num">{r.fromDate}</td>
                    <td className="num">{r.toDate}</td>
                    <td className="num right mono">{r.totDays||r.days}</td>
                    <td>{r.paidUnpaid===1||r.paidType==="Paid"?<span className="tag green">Paid</span>:<span className="tag gray">Unpaid</span>}</td>
                    <td className="muted xs">{r.state||"—"}</td>
                    <td className="mono xs">{r.officer||"—"}</td>
                  </tr>
                )):<tr><td colSpan={person?7:8} className="muted" style={{padding:"16px",textAlign:"center"}}>No records.</td></tr>}</tbody>
              </table>
            </div>
            {special.length>40 && <div className="card-foot muted xs">Showing 40 of {special.length}</div>}
          </div>
        )}

        {recordsTab==="reduced" && (
          <div className="card">
            <div className="card-head"><h2>Reduced / Part-Time ({rpt.length})</h2><div className="right">{!ro && <button className="btn sm primary" onClick={()=>{setRpForm(f=>({...f,idCard:idCardInput}));setOverlay("reduced");}}>+ Add</button>}</div></div>
            <div className="table-scroll">
              <table className="table compact">
                <thead><tr>{!person&&<th>ID Card</th>}<th>Type</th><th className="right">Hrs/Wk</th><th>From</th><th>To</th><th>Comments</th><th>Officer</th></tr></thead>
                <tbody>{rpt.length>0?rpt.slice(0,40).map((r,i)=>(
                  <tr key={i}>
                    {!person&&<td className="id">{r.persIdNo||r.idCard}</td>}
                    <td><span className="tag gray">{r.type||"—"}</span></td>
                    <td className="num right mono">{r.hrsPerWeek||r.numOfHrs}</td>
                    <td className="num">{r.fromDate}</td>
                    <td className="num">{r.toDate}</td>
                    <td className="muted xs">{r.comments||"—"}</td>
                    <td className="mono xs">{r.officer||"—"}</td>
                  </tr>
                )):<tr><td colSpan={person?6:7} className="muted" style={{padding:"16px",textAlign:"center"}}>No records.</td></tr>}</tbody>
              </table>
            </div>
            {rpt.length>40 && <div className="card-foot muted xs">Showing 40 of {rpt.length}</div>}
          </div>
        )}

        {recordsTab==="card" && person && (
          <div className="prs-dossier">
            <div className="dossier-toolbar no-print" style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
              <button className="btn primary" onClick={()=>window.print()}>🖨 Print Leave Card</button>
            </div>

            {/* 1 · Sick Leave */}
            <div className="card section">
              <div className="card-head"><h2>1 · Sick Leave ({sick.length})</h2><div className="right"><button className="btn sm primary no-print" onClick={()=>{setSlForm(f=>({...f,idCard:idCardInput}));setOverlay("sick");}}>+ Add</button></div></div>
              <table className="table compact">
                <thead><tr><th>Year</th><th className="right">Days</th><th>Comments</th><th>Officer</th><th>Date added</th></tr></thead>
                <tbody>{sick.length>0?sick.map((r,i)=>(
                  <tr key={i}>
                    <td className="mono">{r.slYear||r.year}</td>
                    <td className="num right mono">{r.totDays||r.totalDays}</td>
                    <td className="muted xs">{r.slComments||r.comments||"—"}</td>
                    <td className="mono xs">{r.officer||"—"}</td>
                    <td className="mono xs">{r.dateAdded||"—"}</td>
                  </tr>
                )):<tr><td colSpan={5} className="muted" style={{padding:"16px",textAlign:"center"}}>No sick leave records.</td></tr>}</tbody>
              </table>
            </div>

            {/* 2 · Special Leave */}
            <div className="card section">
              <div className="card-head"><h2>2 · Special Leave ({special.length})</h2><div className="right"><button className="btn sm primary no-print" onClick={()=>{setSpForm(f=>({...f,idCard:idCardInput}));setOverlay("special");}}>+ Add</button></div></div>
              <table className="table compact">
                <thead><tr><th>Leave Type</th><th>From</th><th>To</th><th className="right">Days</th><th>Paid</th><th>State</th><th>Comments</th></tr></thead>
                <tbody>{special.length>0?special.map((r,i)=>(
                  <tr key={i}>
                    <td className="muted xs">{r.nature||r.leaveType||"—"}</td>
                    <td className="num">{r.fromDate}</td>
                    <td className="num">{r.toDate}</td>
                    <td className="num right mono">{r.totDays||r.days}</td>
                    <td>{r.paidUnpaid===1||r.paidType==="Paid"?<span className="tag green">Paid</span>:<span className="tag gray">Unpaid</span>}</td>
                    <td className="muted xs">{r.state||"—"}</td>
                    <td className="muted xs">{r.comments||"—"}</td>
                  </tr>
                )):<tr><td colSpan={7} className="muted" style={{padding:"16px",textAlign:"center"}}>No special leave records.</td></tr>}</tbody>
              </table>
            </div>

            {/* 3 · Reduced / Part-Time */}
            <div className="card section">
              <div className="card-head"><h2>3 · Reduced / Part-Time ({rpt.length})</h2><div className="right"><button className="btn sm primary no-print" onClick={()=>{setRpForm(f=>({...f,idCard:idCardInput}));setOverlay("reduced");}}>+ Add</button></div></div>
              <table className="table compact">
                <thead><tr><th>Type</th><th className="right">Hrs/Wk</th><th>From</th><th>To</th><th>Comments</th></tr></thead>
                <tbody>{rpt.length>0?rpt.map((r,i)=>(
                  <tr key={i}>
                    <td><span className="tag gray">{r.type||"—"}</span></td>
                    <td className="num right mono">{r.hrsPerWeek||r.numOfHrs}</td>
                    <td className="num">{r.fromDate}</td>
                    <td className="num">{r.toDate}</td>
                    <td className="muted xs">{r.comments||"—"}</td>
                  </tr>
                )):<tr><td colSpan={5} className="muted" style={{padding:"16px",textAlign:"center"}}>No reduced/part-time records.</td></tr>}</tbody>
              </table>
            </div>

            {/* 4 · Summary */}
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
              Printed {new Date().toLocaleString()} · Education HR — Sick &amp; Special Leave Card · {person.name} {person.surname} ({person.idCard})
            </div>
          </div>
        )}

        {recordsTab==="reports" && (
          <div className="card" style={{maxWidth:520}}>
            <div className="card-head"><h2>Generic Reports</h2><div className="right muted xs">{person?"Scoped to "+person.name:"All employees"}</div></div>
            <div className="card-body" style={{display:"flex",flexDirection:"column",gap:8}}>
              {["Sick leave by year","Special leave by type","Reduced/Part-Time arrangements","Replacement list — Teaching","Replacement list — Non-Teaching","Leave totals by grade","Upload pending summary"].map((item,i)=>(
                <button key={i} className="btn" style={{textAlign:"left",justifyContent:"flex-start"}}>▤ {item}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── MAIN MENU + OVERLAYS (Pay Points-style dashboard) ─────────
  const ACTIONS = [
    {id:"new-sick",    icon:"+", label:"New Sick Leave",      desc:"Record sick leave days for an employee",       onClick:()=>setOverlay("sick")},
    {id:"new-special", icon:"+", label:"New Special Leave",   desc:"Maternity, parental, study and other leaves",  onClick:()=>setOverlay("special")},
    {id:"new-reduced", icon:"+", label:"New Reduced / PT",    desc:"Section B GP47 — reduced-hours arrangements",  onClick:()=>setOverlay("reduced")},
    {id:"all-records", icon:"≡", label:"All Leave Records",   desc:"Browse all sick, special and reduced records", onClick:()=>{setIdCardInput("");setRecordsTab("sick");setMode("view");}},
    {id:"reports",     icon:"▤", label:"Generic Reports",     desc:"Pre-canned leave reports — by year, type, grade", onClick:()=>{setIdCardInput("");setRecordsTab("reports");setMode("view");}},
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">Leaves &amp; Confirmations</div>
          <h1>Leaves</h1>
          <p className="page-sub">Sick, special and reduced/part-time leave for the entire workforce. Search by ID card or browse all records by tab.</p>
        </div>
        <div className="page-actions">
          <button className="btn primary" onClick={()=>setOverlay("sick")}>+ New Sick Leave</button>
        </div>
      </div>

      {/* Quick lookup */}
      <div className="card" style={{marginBottom:14}}>
        <div className="card-head"><h2>Quick lookup</h2></div>
        <div className="card-body" style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <input className="input" style={{flex:1,minWidth:240,maxWidth:320}} placeholder="ID Card No." value={idCardInput} onChange={e=>setIdCardInput(e.target.value)}/>
          <button className="btn primary" disabled={!idCardInput} onClick={()=>{setRecordsTab("sick");setMode("view");}}>View Person's Leaves</button>
          <button className="btn" onClick={()=>{setIdCardInput("");setRecordsTab("sick");setMode("view");}}>Browse all</button>
        </div>
      </div>

      {/* Quick actions */}
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

      {/* ── SICK LEAVE OVERLAY ── */}
      {overlay==="sick"&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:40,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.45)"}}>
          <div style={{background:BG,borderRadius:8,width:560,boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
            <div style={{background:"#1a1a2e",padding:"8px 14px",borderRadius:"8px 8px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:"#ffffff",fontSize:12}}>New Sick Leave</span>
              <button style={{background:"none",border:"none",color:"white",cursor:"pointer",fontSize:14}} onClick={()=>setOverlay(null)}>✕</button>
            </div>
            <div style={{padding:"20px 28px"}}>
              <div style={{textAlign:"center",color:"#1a1a2e",fontWeight:700,fontSize:18,textDecoration:"underline",marginBottom:20}}>Sick Leave</div>
              <div style={{display:"flex",alignItems:"center",marginBottom:16}}>
                <label style={{color:"#1a1a2e",fontWeight:600,fontSize:13,width:120}}>ID Card No:</label>
                <select style={{flex:1,padding:"5px 8px",borderRadius:3,border:"1px solid #ccc",fontSize:12}} value={slForm.idCard} onChange={e=>setSlForm(f=>({...f,idCard:e.target.value}))}>
                  <option value=""/>{D.PEOPLE.map(p=><option key={p.idCard} value={p.idCard}>{p.idCard}</option>)}
                </select>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
                <div>
                  <div style={{color:"#1a1a2e",fontWeight:600,fontSize:13,textAlign:"center",marginBottom:4}}>Year</div>
                  <input style={{width:"100%",padding:"6px 10px",borderRadius:3,border:"1px solid #ccc",fontSize:13,boxSizing:"border-box"}} value={slForm.year} onChange={e=>setSlForm(f=>({...f,year:e.target.value}))}/>
                </div>
                <div>
                  <div style={{color:"#1a1a2e",fontWeight:600,fontSize:13,textAlign:"center",marginBottom:4}}>Total Days</div>
                  <input type="number" style={{width:"100%",padding:"6px 10px",borderRadius:3,border:"1px solid #ccc",fontSize:13,boxSizing:"border-box"}} value={slForm.totalDays} onChange={e=>setSlForm(f=>({...f,totalDays:e.target.value}))}/>
                </div>
              </div>
              <div style={{marginBottom:18}}>
                <div style={{color:"#1a1a2e",fontWeight:600,fontSize:13,marginBottom:4}}>Comments</div>
                <textarea style={{width:"100%",height:80,padding:"6px 10px",borderRadius:3,border:"1px solid #ccc",fontSize:12,resize:"none",boxSizing:"border-box"}} value={slForm.comments} onChange={e=>setSlForm(f=>({...f,comments:e.target.value}))}/>
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:8}}>
                <button style={OB} onClick={()=>{saveSL();setSlForm({idCard:"",year:"2026",totalDays:"",comments:""});setOverlay(null);}}>Save and Close</button>
                <button style={OB} onClick={()=>{saveSL();setSlForm(f=>({idCard:"",year:"2026",totalDays:"",comments:""}));}}>Save and Add another Sick Leave</button>
                <button style={{...OB,color:"#c0392b"}} onClick={()=>setOverlay(null)}>Close</button>
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                <button style={OB} onClick={()=>{saveSL();setSlForm(f=>({...f,year:"",totalDays:"",comments:""}));}}>Save and Add another Sick Leavefor this person</button>
                <button style={OB} onClick={()=>{saveSL();setSpForm(f=>({...f,idCard:slForm.idCard}));setOverlay("special");}}>Save and Add Special Leavefor this person</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SPECIAL LEAVE OVERLAY ── */}
      {overlay==="special"&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:40,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.45)"}}>
          <div style={{background:BG,borderRadius:8,width:680,boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
            <div style={{background:"#1a1a2e",padding:"8px 14px",borderRadius:"8px 8px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:"#ffffff",fontSize:12}}>New Special Leave</span>
              <button style={{background:"none",border:"none",color:"white",cursor:"pointer",fontSize:14}} onClick={()=>setOverlay(null)}>✕</button>
            </div>
            <div style={{padding:"20px 28px"}}>
              <div style={{textAlign:"center",color:"#1a1a2e",fontWeight:700,fontSize:18,textDecoration:"underline",marginBottom:18}}>Special Leave</div>
              <div style={{display:"flex",alignItems:"center",marginBottom:16}}>
                <label style={{color:"#1a1a2e",fontWeight:600,fontSize:13,width:120}}>ID Card No:</label>
                <select style={{width:260,padding:"5px 8px",borderRadius:3,border:"1px solid #ccc",fontSize:12}} value={spForm.idCard} onChange={e=>setSpForm(f=>({...f,idCard:e.target.value}))}>
                  <option value=""/>{D.PEOPLE.map(p=><option key={p.idCard} value={p.idCard}>{p.idCard}</option>)}
                </select>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:16,marginBottom:14}}>
                <div>
                  <div style={{border:"1px solid #e6e6f0",borderRadius:4,padding:"8px 12px",marginBottom:8}}>
                    <div style={{color:"#1a1a2e",fontWeight:600,fontSize:11,marginBottom:6}}>Type</div>
                    {["Paid","Unpaid"].map(t=><label key={t} style={{display:"flex",alignItems:"center",gap:8,color:"#1a1a2e",fontSize:12,marginBottom:4,cursor:"pointer"}}><input type="radio" name="spPaid" value={t} checked={spForm.paidType===t} onChange={()=>setSpForm(f=>({...f,paidType:t}))}/>{t}</label>)}
                  </div>
                  <div style={{border:"1px solid #e6e6f0",borderRadius:4,padding:"8px 12px"}}>
                    <div style={{color:"#1a1a2e",fontWeight:600,fontSize:11,marginBottom:6}}>State</div>
                    {["Teaching","Non Teaching"].map(t=><label key={t} style={{display:"flex",alignItems:"center",gap:8,color:"#1a1a2e",fontSize:12,marginBottom:4,cursor:"pointer"}}><input type="radio" name="spState" value={t} checked={spForm.state===t} onChange={()=>setSpForm(f=>({...f,state:t}))}/>{t}</label>)}
                  </div>
                </div>
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                    <div>
                      <div style={{color:"#1a1a2e",fontWeight:600,fontSize:12,textAlign:"center",marginBottom:3}}>From Date</div>
                      <input type="date" style={{width:"100%",padding:"4px 6px",borderRadius:3,border:"1px solid #ccc",fontSize:12,boxSizing:"border-box"}} value={spForm.fromDate} onChange={e=>setSpForm(f=>({...f,fromDate:e.target.value}))}/>
                    </div>
                    <div>
                      <div style={{color:"#1a1a2e",fontWeight:600,fontSize:12,textAlign:"center",marginBottom:3}}>Type</div>
                      <select style={{width:"100%",padding:"4px 6px",borderRadius:3,border:"1px solid #ccc",fontSize:11,boxSizing:"border-box"}} value={spForm.leaveType} onChange={e=>setSpForm(f=>({...f,leaveType:e.target.value}))}>
                        <option value=""/>{LEAVE_TYPES.map(t=><option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{color:"#1a1a2e",fontWeight:600,fontSize:12,textAlign:"center",marginBottom:3}}>To Date</div>
                      <input type="date" style={{width:"100%",padding:"4px 6px",borderRadius:3,border:"1px solid #ccc",fontSize:12,boxSizing:"border-box"}} value={spForm.toDate} onChange={e=>setSpForm(f=>({...f,toDate:e.target.value}))}/>
                    </div>
                  </div>
                  <div style={{marginBottom:8}}>
                    <div style={{color:"#1a1a2e",fontWeight:600,fontSize:12,textAlign:"right",marginBottom:3}}>Comments</div>
                    <textarea style={{width:"100%",height:70,padding:"4px 6px",borderRadius:3,border:"1px solid #ccc",fontSize:11,resize:"none",boxSizing:"border-box"}} value={spForm.comments} onChange={e=>setSpForm(f=>({...f,comments:e.target.value}))}/>
                  </div>
                  <div style={{color:"#1a1a2e",fontWeight:600,fontSize:12,textAlign:"right"}}>Days <span style={{background:"#f1f5f9",color:"#1a1a2e",padding:"2px 10px",borderRadius:3,marginLeft:6}}>{spDays||0}</span></div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:8}}>
                <button style={OB} onClick={()=>{saveSP();setSpForm({idCard:"",paidType:"Paid",state:"Teaching",fromDate:"",toDate:"",leaveType:"",comments:""});setOverlay(null);}}>Save and Close</button>
                <button style={OB} onClick={()=>{saveSP();setSpForm(f=>({idCard:"",paidType:"Paid",state:"Teaching",fromDate:"",toDate:"",leaveType:"",comments:""}));}}>Save and Add another Special Leave</button>
                <button style={{...OB,color:"#c0392b"}} onClick={()=>setOverlay(null)}>Close</button>
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                <button style={OB} onClick={()=>{saveSP();setSpForm(f=>({...f,fromDate:"",toDate:"",leaveType:"",comments:""}));}}>Save and Add another Special Leave for this Person</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REDUCED / PT OVERLAY ── */}
      {overlay==="reduced"&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:40,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.45)"}}>
          <div style={{background:BG,borderRadius:8,width:600,boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
            <div style={{background:"#1a1a2e",padding:"8px 14px",borderRadius:"8px 8px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:"#ffffff",fontSize:12}}>Reduced / Part_Time</span>
              <button style={{background:"none",border:"none",color:"white",cursor:"pointer",fontSize:14}} onClick={()=>setOverlay(null)}>✕</button>
            </div>
            <div style={{padding:"20px 28px"}}>
              <div style={{textAlign:"center",color:"#1a1a2e",fontWeight:700,fontSize:17,textDecoration:"underline",marginBottom:18}}>Reduced / Part-Time for all Grades</div>
              <div style={{display:"flex",alignItems:"center",marginBottom:16}}>
                <label style={{color:"#1a1a2e",fontWeight:600,fontSize:13,width:120}}>ID Card No:</label>
                <select style={{width:260,padding:"5px 8px",borderRadius:3,border:"1px solid #ccc",fontSize:12}} value={rpForm.idCard} onChange={e=>setRpForm(f=>({...f,idCard:e.target.value}))}>
                  <option value=""/>{D.PEOPLE.map(p=><option key={p.idCard} value={p.idCard}>{p.idCard}</option>)}
                </select>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"190px 1fr",gap:16,marginBottom:14}}>
                <div style={{border:"1px solid #e6e6f0",borderRadius:4,padding:"8px 12px",alignSelf:"start"}}>
                  <div style={{color:"#1a1a2e",fontWeight:600,fontSize:11,marginBottom:6}}>Type</div>
                  {["Reduced","Part-Time"].map(t=><label key={t} style={{display:"flex",alignItems:"center",gap:8,color:"#1a1a2e",fontSize:12,marginBottom:4,cursor:"pointer"}}><input type="radio" name="rpType" value={t} checked={rpForm.type===t} onChange={()=>setRpForm(f=>({...f,type:t}))}/>{t}</label>)}
                </div>
                <div>
                  {[["Hrs per Week","hrsPerWeek","text"],["From Date","fromDate","date"],["To Date","toDate","date"]].map(([label,key,type])=>(
                    <div key={key} style={{display:"flex",alignItems:"center",marginBottom:8}}>
                      <label style={{width:110,color:"#1a1a2e",fontWeight:600,fontSize:12,flexShrink:0}}>{label}</label>
                      <input type={type} style={{flex:1,padding:"4px 8px",borderRadius:3,border:"1px solid #ccc",fontSize:12}} value={rpForm[key]} onChange={e=>setRpForm(f=>({...f,[key]:e.target.value}))}/>
                    </div>
                  ))}
                  <div style={{display:"flex",alignItems:"flex-start"}}>
                    <label style={{width:110,color:"#1a1a2e",fontWeight:600,fontSize:12,flexShrink:0,paddingTop:4}}>Comments</label>
                    <textarea style={{flex:1,height:70,padding:"4px 8px",borderRadius:3,border:"1px solid #ccc",fontSize:11,resize:"none"}} value={rpForm.comments} onChange={e=>setRpForm(f=>({...f,comments:e.target.value}))}/>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:8}}>
                <button style={OB} onClick={()=>{saveRP();setRpForm({idCard:"",type:"Reduced",hrsPerWeek:"0",fromDate:"",toDate:"",comments:""});setOverlay(null);}}>Save and Close</button>
                <button style={OB} onClick={()=>{saveRP();setRpForm(f=>({idCard:"",type:"Reduced",hrsPerWeek:"0",fromDate:"",toDate:"",comments:""}));}}>Save and Add another Red-P/T</button>
                <button style={{...OB,color:"#c0392b"}} onClick={()=>setOverlay(null)}>Close</button>
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                <button style={OB} onClick={()=>{saveRP();setRpForm(f=>({...f,fromDate:"",toDate:"",comments:"",hrsPerWeek:"0"}));}}>Save and Add another Reduced-P/T this person</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// GP47 — service history doc generation
// ─────────────────────────────────────────────────────────────────
function GP47Deep() {
  const PRS = window.PRS_DATA;
  const [idCard, setIdCard]       = useState("");
  const [mode, setMode]           = useState("menu"); // menu | view-service | view-gp47 | bulk-input
  const [sortBy, setSortBy]       = useState("date"); // date | time
  const [localPRS, setLocalPRS]   = useState([]);
  const [bulkError, setBulkError] = useState(null);
  const [serviceRows, setServiceRows] = useState([]);

  const isHero     = idCard.trim().toUpperCase() === (PRS?.HERO_ID || "").toUpperCase();
  const foundPerson= D.PEOPLE.find(p => p.idCard?.toLowerCase() === idCard.trim().toLowerCase())
    || (isHero ? {idCard: PRS.HERO_ID, name:"Roberta", surname:"Camilleri", gradeDesc:"Teacher", lastSalScale:"8", dob:"1982-03-14"} : null);
  const personName = foundPerson ? `${foundPerson.name} ${foundPerson.surname}` : null;
  const lastScale  = foundPerson?.lastSalScale || (isHero ? "8" : "—");

  function genServiceHistory(person) {
    if (!person) return [];
    const grade    = person.gradeDesc || "Teacher";
    const scaleNum = parseInt(person.lastSalScale) || 10;
    const yr       = 2000 + (Math.abs(parseInt((person.idCard||"0").replace(/\D/g,"")) || 0) % 15);
    return [
      {autoId:1e6,   idCard:person.idCard, position:grade, dept:"Educ", salScale:`${scaleNum+2}/1`, fromDate:`${yr}-09-01`,   reason:"First Appointment",  addEmm:`First appointed as ${grade}`, showInGP47:true,  sentToOfficer:true, approvedRecords:true, officer:"borgm196", dateAdded:`${yr}-09-02`,   timeAdded:"10:14"},
      {autoId:1e6+1, idCard:person.idCard, position:grade, dept:"Educ", salScale:`${scaleNum+1}/1`, fromDate:`${yr+4}-09-01`, reason:"Progression",        addEmm:"Progressed",                   showInGP47:true,  sentToOfficer:true, approvedRecords:true, officer:"borgm196", dateAdded:`${yr+4}-09-02`, timeAdded:"11:00"},
      {autoId:1e6+2, idCard:person.idCard, position:grade, dept:"Educ", salScale:`${scaleNum}/1`,   fromDate:`${yr+8}-09-01`, reason:"Progression",        addEmm:"Progressed to current scale",  showInGP47:true,  sentToOfficer:true, approvedRecords:true, officer:"borgm196", dateAdded:`${yr+8}-09-02`, timeAdded:"11:30"},
    ];
  }

  function getBasePRS() {
    if (isHero) return [...(PRS?.HERO_PRS || [])];
    const custom = localPRS.filter(r => r.idCard?.toLowerCase() === idCard.trim().toLowerCase());
    if (custom.length) return custom;
    return genServiceHistory(foundPerson);
  }

  function sortRecords(recs, by) {
    return [...recs].sort((a,b) =>
      by === "date" ? new Date(a.fromDate) - new Date(b.fromDate)
                    : (a.timeAdded||"00:00").localeCompare(b.timeAdded||"00:00")
    );
  }

  function openService() {
    setServiceRows(sortRecords(getBasePRS(), "date"));
    setMode("view-service");
  }

  function openGP47(by) {
    setSortBy(by);
    setMode("view-gp47");
  }

  function updateSvcRow(idx, field, val) {
    setServiceRows(prev => prev.map((r,i) => i===idx ? {...r,[field]:val} : r));
  }

  function handleBulkUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const wb   = XLSX.read(ev.target.result, {type:"binary"});
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);
        const mapped = rows.map((r,i) => ({
          autoId:       Date.now() + i,
          idCard:       r.idCard || r.ID_Card_No || r.id_card || "",
          position:     r.position || r.Position || r["Grade/Position"] || "",
          dept:         r.dept || r.Dept || "Educ",
          salScale:     r.salScale || r.Salary_Scale || "",
          salary:       r.salary || r.Salary || "",
          fromDate:     r.fromDate || r.From_Date || "",
          reason:       r.reason || r.Reason || "",
          addEmm:       r.addEmm || r.Remarks || r.Add_Emm || "",
          showInGP47:   (r.showInGP47 ?? r.ShowInGP47 ?? true) !== false,
          sentToOfficer:false, approvedRecords:false, uploaded:false,
          officer:      "borgm196",
          dateAdded:    new Date().toISOString().slice(0,10),
          timeAdded:    new Date().toTimeString().slice(0,5),
        }));
        setLocalPRS(prev => [...prev, ...mapped]);
        setBulkError(null);
        setMode("menu");
      } catch(err) { setBulkError(err.message); }
    };
    reader.readAsBinaryString(file);
  }

  // ── MENU (dashboard) ─────────────────────────────────────────────
  if (mode === "menu") {
    const ACTIONS = [
      {id:"view-service",  icon:"▤", label:"View PRS (Service)",     desc:"Browse the underlying service-history records",      needsPerson:true,  onClick:()=>{if(foundPerson)openService();}},
      {id:"by-date",       icon:"📅",label:"Create GP 47 — by Date", desc:"Generate the official GP47 sorted by effective date",needsPerson:true,  onClick:()=>{if(foundPerson)openGP47("date");}},
      {id:"by-time",       icon:"⏱", label:"Create GP 47 — by Time", desc:"Generate sorted by date/time the record was added",  needsPerson:true,  onClick:()=>{if(foundPerson)openGP47("time");}},
      {id:"poma",          icon:"★", label:"POMA GP47",              desc:"Public Officer Management Authority GP47 variant",   needsPerson:false, onClick:()=>{
        if (foundPerson) {
          openGP47("date");
          window.dispatchEvent(new CustomEvent("toast", { detail: `POMA GP47 generated for ${foundPerson.name} ${foundPerson.surname}` }));
        } else {
          window.dispatchEvent(new CustomEvent("toast", { detail: "Look up an employee first — POMA GP47 will use that record." }));
        }
      }},
      {id:"bulk-input",    icon:"↑", label:"Bulk Input from Excel",  desc:"Upload an Excel file to bulk-load PRS records",      needsPerson:false, onClick:()=>setMode("bulk-input")},
      {id:"clear",         icon:"✕", label:"Clear / Exit GP47",      desc:"Reset the lookup and bulk-loaded buffer",            needsPerson:false, onClick:()=>{setIdCard(""); setLocalPRS([]);}},
    ];
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <div className="crumbs">Leaves &amp; Confirmations · GP 47</div>
            <h1>GP 47</h1>
            <p className="page-sub">Generate the official Personnel Record of Service (GP 47) for an employee. Look up by ID card, then pick a generation option below.</p>
          </div>
          <div className="page-actions">
            {localPRS.length > 0 && <span className="tag green">{localPRS.length} bulk records loaded</span>}
            <button className="btn primary" onClick={()=>setMode("bulk-input")}>↑ Bulk Input</button>
          </div>
        </div>

        <div className="card" style={{marginBottom:14}}>
          <div className="card-head"><h2>Look up employee</h2></div>
          <div className="card-body" style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <input className="input" style={{flex:1,minWidth:240,maxWidth:340}} placeholder="Enter ID Card Number" value={idCard} onChange={e=>setIdCard(e.target.value)}/>
            {personName && <span className="tag green">✓ {personName} · Scale {lastScale}</span>}
            {idCard && !personName && <span className="tag red">Person not found</span>}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h2>Actions</h2></div>
          <div className="card-body" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:10}}>
            {ACTIONS.map(a => (
              <button key={a.id} type="button" className="action-card" disabled={a.needsPerson && !foundPerson} onClick={a.onClick} style={a.needsPerson && !foundPerson ? {opacity:0.5,cursor:"not-allowed"} : {}}>
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

  // ── BULK INPUT ────────────────────────────────────────────────────
  if (mode === "bulk-input") return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">GP 47 · <button className="btn xs" onClick={()=>setMode("menu")}>← Back</button></div>
          <h1>Bulk Input — Import PRS Records</h1>
          <p className="page-sub">Upload an Excel (.xlsx) file. Required columns: <code>idCard, position, salScale, fromDate, reason, addEmm</code>. Optional: <code>showInGP47 (true/false)</code>.</p>
        </div>
      </div>
      <div className="card" style={{padding:28, maxWidth:720}}>
        <div style={{marginBottom:20, display:"flex", gap:10, alignItems:"center", flexWrap:"wrap"}}>
          <label className="btn primary" style={{cursor:"pointer", margin:0}}>
            ↑ Upload Excel
            <input type="file" accept=".xlsx,.xls" onChange={handleBulkUpload} style={{display:"none"}}/>
          </label>
          <button type="button" className="btn" onClick={()=>{
            if (typeof XLSX === "undefined") { alert("XLSX library not loaded."); return; }
            const sample = [
              {idCard:"0259684M", position:"Teacher",          salScale:"10/3", fromDate:"2008-09-29", reason:"First Appointment", addEmm:"Initial appointment as Supply", showInGP47:true},
              {idCard:"0259684M", position:"Teacher",          salScale:"10/1", fromDate:"2010-09-29", reason:"Confirmation",      addEmm:"Confirmed in grade",            showInGP47:true},
              {idCard:"0259684M", position:"Teacher",          salScale:"9/1",  fromDate:"2014-09-29", reason:"Progression",       addEmm:"Progressed to Scale 9",         showInGP47:true},
              {idCard:"0259684M", position:"Teacher",          salScale:"9/4",  fromDate:"2021-09-29", reason:"Increment",         addEmm:"",                              showInGP47:false},
              {idCard:"0312068M", position:"Foreman",          salScale:"15/2", fromDate:"2025-05-15", reason:"First Appointment", addEmm:"WEF 15 May 2025",               showInGP47:true},
            ];
            const ws = XLSX.utils.json_to_sheet(sample);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "GP47_PRS");
            XLSX.writeFile(wb, "GP47_BulkInput_template.xlsx");
          }}>↓ Download template</button>
          {localPRS.length > 0 && <span className="tag green">{localPRS.length} rows loaded</span>}
        </div>
        {bulkError && <div style={{color:"#c0392b", fontSize:13, marginBottom:16, padding:"8px 12px", background:"var(--red-bg)", borderRadius:4}}>Error: {bulkError}</div>}
        <div style={{marginBottom:16, fontSize:12, color:"var(--ink-2)"}}>
          <strong>Expected columns:</strong> idCard · position · salScale · fromDate · reason · addEmm · showInGP47
        </div>
        {localPRS.length > 0 && (
          <div style={{marginBottom:16}}>
            <div style={{fontWeight:600, marginBottom:8, fontSize:13}}>{localPRS.length} records loaded</div>
            <table className="table compact">
              <thead><tr><th>ID Card</th><th>Position</th><th>Scale</th><th>From</th><th>Reason</th><th>GP47</th></tr></thead>
              <tbody>
                {localPRS.slice(0,12).map((r,i) => (
                  <tr key={i}>
                    <td className="id">{r.idCard}</td><td>{r.position}</td>
                    <td className="mono">{r.salScale}</td><td className="num">{r.fromDate}</td>
                    <td>{r.reason}</td>
                    <td>{r.showInGP47 ? <span className="check">✓</span> : <span className="muted">—</span>}</td>
                  </tr>
                ))}
                {localPRS.length > 12 && <tr><td colSpan={6} className="muted" style={{textAlign:"center", padding:"8px"}}>…and {localPRS.length - 12} more</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        <div style={{display:"flex", gap:12}}>
          <button className="btn" onClick={()=>setMode("menu")}>Close</button>
          {localPRS.length > 0 && <button className="btn" style={{color:"#c0392b"}} onClick={()=>setLocalPRS([])}>Clear all records</button>}
        </div>
      </div>
    </div>
  );

  // ── VIEW PRS (SERVICE) ────────────────────────────────────────────
  if (mode === "view-service") {
    const ptRows = []; // part-time not in demo data
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <div className="crumbs">GP 47 · <button className="btn xs" onClick={()=>setMode("menu")}>← Back</button></div>
            <h1 style={{fontSize:17}}>Service data for {foundPerson?.idCard} — {personName}</h1>
            <div style={{display:"flex", gap:28, marginTop:8, fontSize:13}}>
              <div><strong>Status</strong>&nbsp;&nbsp;<span style={{color:"var(--ink-2)"}}>Confirmed</span></div>
              <div><strong>Last Salary Scale</strong>&nbsp;&nbsp;<span style={{border:"1px solid var(--line-2)", padding:"1px 10px", borderRadius:3, fontFamily:"monospace", background:"white"}}>{lastScale}</span></div>
            </div>
          </div>
        </div>
        {/* Full-time service */}
        <div className="card" style={{padding:0, marginBottom:16, overflow:"hidden"}}>
          <div style={{fontWeight:700, fontSize:14, textAlign:"center", padding:"10px", background:"var(--surface-2,#f5f5f5)", borderBottom:"1px solid var(--line-2)"}}>Service</div>
          <table className="table compact">
            <thead><tr><th>Grade / Position</th><th>Salary Scale</th><th>From Date</th><th>Remarks</th><th>Time Added</th><th>Type</th></tr></thead>
            <tbody>
              {serviceRows.map((r,i) => (
                <tr key={r.autoId}>
                  <td><input className="input" value={r.position} onChange={e=>updateSvcRow(i,"position",e.target.value)} style={{fontSize:12, minWidth:140}}/></td>
                  <td><input className="input" value={r.salScale} onChange={e=>updateSvcRow(i,"salScale",e.target.value)} style={{fontSize:12, width:72}}/></td>
                  <td><input className="input" type="date" value={r.fromDate} onChange={e=>updateSvcRow(i,"fromDate",e.target.value)} style={{fontSize:12}}/></td>
                  <td><input className="input" value={r.addEmm||""} onChange={e=>updateSvcRow(i,"addEmm",e.target.value)} style={{fontSize:12, minWidth:180}}/></td>
                  <td className="mono xs">{r.timeAdded||"—"}</td>
                  <td className="muted xs">{r.reason}</td>
                </tr>
              ))}
              {serviceRows.length === 0 && <tr><td colSpan={6} className="muted" style={{padding:"16px", textAlign:"center"}}>No records</td></tr>}
            </tbody>
          </table>
        </div>
        {/* Part-time service */}
        <div className="card" style={{padding:0, marginBottom:20, overflow:"hidden"}}>
          <div style={{fontWeight:700, fontSize:14, textAlign:"center", padding:"10px", background:"var(--surface-2,#f5f5f5)", borderBottom:"1px solid var(--line-2)"}}>Service Part-Time</div>
          <table className="table compact">
            <thead><tr><th>Grade / Position</th><th>Salary Scale</th><th>From Date</th><th>Remarks</th><th>Time Added</th></tr></thead>
            <tbody><tr><td colSpan={5} className="muted" style={{padding:"14px", textAlign:"center"}}>No part-time service records</td></tr></tbody>
          </table>
        </div>
        <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
          <button className="btn primary" onClick={()=>setMode("menu")}>Save and Close</button>
          <button className="btn">Sort by Time</button>
          <button className="btn">Status</button>
          <button className="btn" onClick={()=>openGP47("date")}>View written GP47 — Service Sorted by Date</button>
          <button className="btn" onClick={()=>openGP47("time")}>View written GP47 — Service Sorted by Time</button>
        </div>
      </div>
    );
  }

  // ── GP47 DOCUMENT ─────────────────────────────────────────────────
  const docRecs    = sortRecords(getBasePRS(), sortBy).filter(r => r.showInGP47);
  const docHidden  = getBasePRS().filter(r => !r.showInGP47).length;
  const docRemarks = isHero ? (PRS?.HERO_REMARKS || []) : [];
  const today      = "04 May 2026";
  const TD = {border:"1px solid #ccc", padding:"4px 10px", fontSize:12};
  const TH = {...TD, background:"#f0f0f0", fontWeight:600, textAlign:"center"};

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">GP 47 · <button className="btn xs" onClick={()=>setMode("menu")}>← Back</button></div>
          <h1>GP 47 — {sortBy === "date" ? "Service Sorted by Date" : "Service Sorted by Time"}</h1>
        </div>
      </div>
      {/* Printable document */}
      <div id="gp47-print" className="card" style={{padding:"32px 40px", maxWidth:860, background:"white", fontFamily:"Georgia, serif", fontSize:13, lineHeight:1.5}}>
        {/* Info header */}
        <div style={{textAlign:"center", marginBottom:14, borderBottom:"1px solid #bbb", paddingBottom:12}}>
          <div style={{fontSize:11, color:"#444"}}>
            <strong>Information Protected</strong> — Personal Information provided on this form is protected, and used in accordance with the Data Protection Act.
          </div>
          <div style={{fontWeight:700, fontSize:15, marginTop:6, letterSpacing:2}}>SERVICE AND LEAVE RECORD</div>
        </div>
        {/* Person info */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:14, fontSize:13}}>
          <div><strong>Name &amp; Surname:</strong>&nbsp; {personName}</div>
          <div><strong>ID Card Number:</strong>&nbsp; <span style={{fontFamily:"monospace"}}>{foundPerson?.idCard}</span></div>
          <div><strong>Present Grade / Position:</strong>&nbsp; {foundPerson?.gradeDesc || docRecs[docRecs.length-1]?.position || "—"}</div>
          <div><strong>Salary Scale:</strong>&nbsp; {lastScale}</div>
          <div><strong>Date Of Birth:</strong>&nbsp; {foundPerson?.dob || "—"}</div>
        </div>
        {/* A. SERVICE */}
        <div style={{marginBottom:16}}>
          <div style={{background:"#c8c8c8", fontWeight:700, textAlign:"center", padding:"5px", border:"1px solid #aaa", fontSize:13}}>A. SERVICE</div>
          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead>
              <tr>
                {["Grade / Position","Status","Dept.","From","Remarks"].map(h=>(
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docRecs.map((r,i) => (
                <tr key={r.autoId}>
                  <td style={{...TD, textAlign:"center", color: r.reason?.includes("End")||r.reason?.includes("Termination") ? "#b8860b" : undefined}}>{r.position}</td>
                  <td style={{...TD, textAlign:"center"}}>{r.approvedRecords ? "" : "Pending"}</td>
                  <td style={{...TD, textAlign:"center"}}>{r.dept}</td>
                  <td style={{...TD, textAlign:"center", fontFamily:"monospace"}}>{r.fromDate}</td>
                  <td style={{...TD, color: i%4===2 ? "#b8860b" : undefined}}>{r.addEmm}</td>
                </tr>
              ))}
              {docRecs.length === 0 && <tr><td colSpan={5} style={{...TD, textAlign:"center", color:"#999"}}>No GP47 records for this person</td></tr>}
            </tbody>
          </table>
        </div>
        {/* Remarks */}
        {docRemarks.length > 0 && (
          <div style={{marginBottom:16}}>
            <div style={{background:"#c8c8c8", fontWeight:700, padding:"5px 12px", border:"1px solid #aaa", fontSize:13}}>Remarks</div>
            <table style={{width:"100%", borderCollapse:"collapse"}}>
              <tbody>
                {docRemarks.map((r,i) => (
                  <tr key={r.autoId} style={{borderBottom:"1px solid #ddd"}}>
                    <td style={{...TD, width:30, textAlign:"center", color:"#666"}}>{i+1}</td>
                    <td style={TD}>{r.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Date + signature */}
        <div style={{marginTop:28, display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, fontSize:12}}>
          <div>
            <div style={{borderBottom:"1px solid #333", marginBottom:4, paddingBottom:24}}></div>
            <strong>Date:</strong>&nbsp;&nbsp;{today}
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{borderBottom:"1px solid #333", marginBottom:4, paddingBottom:24, fontStyle:"italic", color:"#888", fontSize:11}}>signature</div>
            <strong>f/Head of Dept:</strong><br/>
            Ms Mary Scicluna<br/>
            Director General People Management
          </div>
        </div>
        {/* Legal text */}
        <div style={{marginTop:20, fontSize:10, textAlign:"center", color:"#555"}}>
          This form may be used by the employing Department, the People_Standards Division, the Central Salaries Section in Gozo, and by the National Audit Office (NAO) for HR Management purposes, and by the Examinations Department in the case of public calls for applications.
        </div>
        <div style={{marginTop:8, fontSize:10, fontWeight:700, textAlign:"center"}}>
          * if the GP 47 is required in connection with an application for a post/position in the Public Service, the date should not be earlier than one (1) month from the date of application by the candidate
        </div>
        <div style={{marginTop:10, fontSize:12, fontWeight:700}}>GP 47</div>
        {docHidden > 0 && <div style={{marginTop:6, fontSize:10, color:"#888"}}>{docHidden} administrative rows (COLA / progression steps) suppressed — ShowInGP47 = false.</div>}
      </div>
      {/* Action buttons */}
      <div style={{display:"flex", gap:8, marginTop:16, flexWrap:"wrap"}}>
        <button className="btn" onClick={()=>setMode("menu")}>Close</button>
        <button className="btn" onClick={()=>window.print()}>Print</button>
        <button className="btn">E-Mail leaves</button>
        <button className="btn">E-Mail Dept</button>
        <button className="btn">E-Mail to Person</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// INJURY — Injury_Data + Injury_Type + Work_Condition + Medical_Board
// ─────────────────────────────────────────────────────────────────
function InjuryDeep() {
  const [tab, setTab] = useState("incidents");
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">Welfare</div>
          <h1>Injury</h1>
          <p className="page-sub">On-duty injuries. Injury type and work-condition lookups, medical-board reviews, insurance-claim tracking.</p>
        </div>
        <div className="page-actions">
          <button className="btn">Notify OHSA</button>
          <button className="btn primary">+ New incident</button>
        </div>
      </div>

      <div className="tabs">
        <div className={"tab " + (tab==="incidents"?"active":"")} onClick={()=>setTab("incidents")}>Incidents <span className="count">{(X?.INJURY_DATA||[]).length}</span></div>
        <div className={"tab " + (tab==="types"?"active":"")} onClick={()=>setTab("types")}>Types <span className="count">{(X?.INJURY_TYPES||[]).length}</span></div>
        <div className={"tab " + (tab==="conditions"?"active":"")} onClick={()=>setTab("conditions")}>Work conditions <span className="count">{(X?.WORK_CONDITIONS||[]).length}</span></div>
        <div className={"tab " + (tab==="board"?"active":"")} onClick={()=>setTab("board")}>Medical board <span className="count">{(X?.MEDICAL_BOARD||[]).length}</span></div>
      </div>

      {tab === "incidents" && (
        <div className="card">
          <div className="card-head"><h2>Incidents</h2></div>
          <div className="table-scroll">
          <table className="table compact">
            <thead><tr>
              <th>ID Card</th><th>Name</th><th>Date</th><th>Time</th><th>Place</th><th>Nature</th>
              <th>Type</th><th>Condition</th><th>Witness</th><th>Claim</th><th>Status</th>
            </tr></thead>
            <tbody>
              {(X?.INJURY_DATA||[]).map(i => (
                <tr key={i.autoId}>
                  <td className="id">{i.persIdno}</td>
                  <td>{i.name}</td>
                  <td className="num">{i.dateOfInjury}</td>
                  <td className="mono">{i.timeOfInjury}</td>
                  <td className="muted xs">{i.placeOfInjury}</td>
                  <td>{i.natureOfInjury}</td>
                  <td><span className="tag gray">{i.injuryTypeName}</span></td>
                  <td className="muted xs">{i.workConditionName}</td>
                  <td className="muted xs">{i.witness || "—"}</td>
                  <td className="mono">{i.claimMade ? "€"+i.claimAmount.toLocaleString() : "—"}</td>
                  <td><ApprovalPill compact sent={i.sentToOfficer} approved={i.approvedInjury} uploaded={i.uploaded}/></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {tab === "types" && (
        <div className="card">
          <div className="card-head"><h2>Injury_Type — 15 categories</h2></div>
          <table className="table compact">
            <thead><tr><th>Id</th><th>Type</th></tr></thead>
            <tbody>{(X?.INJURY_TYPES||[]).map(t => <tr key={t.id}><td className="mono">{t.id}</td><td>{t.name}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {tab === "conditions" && (
        <div className="card">
          <div className="card-head"><h2>Work_Condition — 20 categories</h2></div>
          <table className="table compact">
            <thead><tr><th>Id</th><th>Condition</th></tr></thead>
            <tbody>{(X?.WORK_CONDITIONS||[]).map(c => <tr key={c.id}><td className="mono">{c.id}</td><td>{c.name}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {tab === "board" && (
        <div className="card">
          <div className="card-head"><h2>Medical board reviews</h2></div>
          <table className="table compact">
            <thead><tr><th>ID Card</th><th>Name</th><th>Board date</th><th>Chair</th><th>Result</th><th>Next review</th><th>Officer</th></tr></thead>
            <tbody>
              {(X?.MEDICAL_BOARD||[]).map(b => (
                <tr key={b.id}>
                  <td className="id">{b.idCard}</td>
                  <td>{b.name}</td>
                  <td className="num">{b.boardDate}</td>
                  <td className="muted xs">{b.chairperson}</td>
                  <td><span className={"tag " + (b.result==="Fit for duty"?"green":b.result.startsWith("Unfit")?"red":"amber")}>{b.result}</span></td>
                  <td className="num">{b.nextReview}</td>
                  <td className="mono xs">{b.officer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// HR PLAN
// ─────────────────────────────────────────────────────────────────
// ── HR Plan grouped report rows ───────────────────────────────────
function HRPlanGroupedRows({ rows, groupBy, editRow, onEdit }) {
  const groups = useMemo(() => {
    const map = {};
    rows.forEach(r => {
      const key = groupBy === "dept" ? r.dept : r.desig;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0]));
  }, [rows, groupBy]);

  return (
    <div style={{display:"flex", flexDirection:"column", gap:"24px"}}>
      {groups.map(([groupName, gRows]) => {
        const totQty  = gRows.reduce((s,r)=>s+r.qty, 0);
        const totTaken= gRows.reduce((s,r)=>s+r.taken, 0);
        const totRem  = totQty - totTaken;
        return (
          <div key={groupName}>
            <div style={{fontWeight:700, fontSize:"0.9rem", padding:"6px 12px", background:"var(--bg-2,#f5f7fa)", borderLeft:"3px solid var(--blue,#3b82f6)"}}>
              {groupName}
            </div>
            <table className="table compact">
              <thead><tr>
                <th>{groupBy==="dept" ? "Designation" : "Department"}</th>
                <th className="right">Salary Scale</th>
                <th className="right">Quantity Requested</th>
                <th className="right">Taken</th>
                <th className="right">Remaining</th>
                <th>Type</th>
                <th>From</th>
                <th></th>
              </tr></thead>
              <tbody>
                {gRows.sort((a,b)=>(groupBy==="dept"?a.desig:a.dept).localeCompare(groupBy==="dept"?b.desig:b.dept)).map(r => {
                  const rem = r.qty - r.taken;
                  return (
                    <tr key={r.autoId}>
                      <td>{groupBy==="dept" ? r.desig : r.dept}</td>
                      <td className="num right mono">{r.scale}</td>
                      <td className="num right mono">{r.qty}</td>
                      <td className="num right mono" style={r.taken<0?{color:"var(--red,#ef4444)"}:{}}>{r.taken}</td>
                      <td className="num right mono"><strong style={rem<0?{color:"var(--red,#ef4444)"}:{}}>{rem}</strong></td>
                      <td className="muted xs">{r.typePost||"—"}</td>
                      <td><span className={"tag "+(r.fromWhere==="Spillover"?"amber":r.fromWhere==="New"?"blue":"gray")}>{r.fromWhere||"HR Plan"}</span></td>
                      <td><button className="btn" style={{fontSize:"0.78rem",padding:"2px 10px"}} onClick={()=>onEdit(r)}>Edit</button></td>
                    </tr>
                  );
                })}
                <tr style={{borderTop:"2px solid var(--line-2)",fontWeight:600, background:"var(--bg-2,#f5f7fa)"}}>
                  <td className="muted xs">Totals</td>
                  <td></td>
                  <td className="num right mono">{totQty}</td>
                  <td className="num right mono">{totTaken}</td>
                  <td className="num right mono">{totRem}</td>
                  <td></td><td></td><td></td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

function HRPlanDeep() {
  const allRows = X?.HR_PLAN_ROWS || [];
  const years   = [...new Set(allRows.map(r=>r.year))].sort((a,b)=>b-a);
  const curYear = years[0] || 2025;

  const [view,        setView]        = useState("menu");  // menu | byDept | byDesig | byDeptOne | byDesigOne
  const [yearSel,     setYearSel]     = useState(curYear);
  const [fromWhere,   setFromWhere]   = useState("HR Plan");
  const [deptSel,     setDeptSel]     = useState("");
  const [desigSel,    setDesigSel]    = useState("");
  const [editRow,     setEditRow]     = useState(null);  // HR_PLAN row being edited
  const [planRows,    setPlanRows]    = useState(allRows);  // local state for edits
  const [dirty,       setDirty]       = useState(false);
  const [editForm,    setEditForm]    = useState(null);   // form values for modal

  const filtered = useMemo(() =>
    planRows.filter(r =>
      r.year === yearSel &&
      r.show &&
      (fromWhere === "all" || r.fromWhere === fromWhere)
    ), [planRows, yearSel, fromWhere]);

  const depts  = useMemo(()=>[...new Set(planRows.filter(r=>r.year===yearSel&&r.show).map(r=>r.dept))].sort(), [planRows, yearSel]);
  const desigs = useMemo(()=>[...new Set(planRows.filter(r=>r.year===yearSel&&r.show).map(r=>r.desig))].sort(), [planRows, yearSel]);

  function openEdit(r) {
    setEditRow(r);
    setEditForm({...r});
  }

  function saveEdit() {
    if (!editForm) return;
    // Validate
    if (editForm.qty < 0)  { alert("Quantity must be >= 0"); return; }
    if (editForm.taken < -1){ alert("Amount Taken cannot be less than -1"); return; }
    if (editForm.scale < 0 || editForm.scale > 20) { alert("Salary Scale must be between 0 and 20"); return; }
    if (editForm.year < 2020 || editForm.year > 2099) { alert("Year must be between 2020 and 2099"); return; }
    setPlanRows(prev => prev.map(r => r.autoId === editForm.autoId ? {...editForm} : r));
    setEditRow(null);
    setEditForm(null);
  }

  const FLD = {display:"grid", gridTemplateColumns:"160px 1fr", alignItems:"center", gap:"8px", marginBottom:"10px"};
  const btnByDept  = deptSel  ? () => setView("byDeptOne")  : null;
  const btnByDesig = desigSel ? () => setView("byDesigOne") : null;

  function ReportHeader({title}) {
    return (
      <div style={{display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px", flexWrap:"wrap"}}>
        <button className="btn" onClick={()=>setView("menu")}>← Main Menu</button>
        <h2 style={{margin:0}}>{title}</h2>
        <span className="tag gray">{fromWhere}</span>
        <select className="input" style={{width:"auto"}} value={yearSel} onChange={e=>setYearSel(Number(e.target.value))}>
          {years.map(y=><option key={y}>{y}</option>)}
        </select>
        <select className="input" style={{width:"auto"}} value={fromWhere} onChange={e=>setFromWhere(e.target.value)}>
          <option value="HR Plan">HR Plan</option>
          <option value="New">New</option>
          <option value="Spillover">Spillover</option>
          <option value="all">All</option>
        </select>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">HR · Establishment</div>
          <h1>Main Menu</h1>
        </div>
      </div>

      {/* ═══ MAIN MENU ════════════════════════════════════════════ */}
      {view === "menu" && (
        <div style={{padding:"32px", display:"flex", flexDirection:"column", gap:"16px", maxWidth:"640px", margin:"0 auto"}}>
          <div style={{marginBottom:"8px", display:"flex", alignItems:"center", gap:"12px"}}>
            <label style={{fontWeight:600}}>Year:</label>
            <select className="input" style={{width:"100px"}} value={yearSel} onChange={e=>setYearSel(Number(e.target.value))}>
              {years.map(y=><option key={y}>{y}</option>)}
            </select>
          </div>

          {/* Button 1 */}
          <button className="btn primary" style={{padding:"16px 24px", fontSize:"1rem", borderRadius:"24px"}}
            onClick={()=>{setView("byDept");}}>
            View HR Plan All Departments
          </button>

          {/* Button 2 */}
          <button className="btn primary" style={{padding:"16px 24px", fontSize:"1rem", borderRadius:"24px"}}
            onClick={()=>{setView("byDesig");}}>
            View HR Plan All Designations
          </button>

          {/* Button 3 — by one department */}
          <div style={{display:"flex", gap:"12px", alignItems:"center"}}>
            <button className="btn primary" style={{padding:"14px 20px", fontSize:"0.95rem", borderRadius:"24px", flex:"0 0 auto"}}
              disabled={!deptSel}
              onClick={()=>setView("byDeptOne")}>
              View HR Plan by Department
            </button>
            <select className="input" style={{flex:1}} value={deptSel} onChange={e=>setDeptSel(e.target.value)}>
              <option value=""></option>
              {depts.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Button 4 — by one designation */}
          <div style={{display:"flex", gap:"12px", alignItems:"center"}}>
            <button className="btn primary" style={{padding:"14px 20px", fontSize:"0.95rem", borderRadius:"24px", flex:"0 0 auto"}}
              disabled={!desigSel}
              onClick={()=>setView("byDesigOne")}>
              View HR Plan by Designation
            </button>
            <select className="input" style={{flex:1}} value={desigSel} onChange={e=>setDesigSel(e.target.value)}>
              <option value=""></option>
              {desigs.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <button className="btn" style={{padding:"12px 24px", borderRadius:"24px", marginTop:"16px", alignSelf:"center"}}
            onClick={()=>window.Shell && window.Shell.useApp && null}>
            Exit
          </button>
        </div>
      )}

      {/* ═══ BY DEPARTMENT (ALL) ══════════════════════════════════ */}
      {view === "byDept" && (
        <div style={{padding:"16px"}}>
          <ReportHeader title={`All HR Plan ${yearSel} by Department`}/>
          <HRPlanGroupedRows rows={filtered} groupBy="dept" onEdit={openEdit}/>
        </div>
      )}

      {/* ═══ BY DESIGNATION (ALL) ═════════════════════════════════ */}
      {view === "byDesig" && (
        <div style={{padding:"16px"}}>
          <ReportHeader title={`All HR Plan ${yearSel} by Designation`}/>
          <HRPlanGroupedRows rows={filtered} groupBy="desig" onEdit={openEdit}/>
        </div>
      )}

      {/* ═══ BY ONE DEPARTMENT ════════════════════════════════════ */}
      {view === "byDeptOne" && (
        <div style={{padding:"16px"}}>
          <ReportHeader title={`HR Plan ${yearSel} — ${deptSel}`}/>
          <HRPlanGroupedRows rows={filtered.filter(r=>r.dept===deptSel)} groupBy="dept" onEdit={openEdit}/>
        </div>
      )}

      {/* ═══ BY ONE DESIGNATION ═══════════════════════════════════ */}
      {view === "byDesigOne" && (
        <div style={{padding:"16px"}}>
          <ReportHeader title={`HR Plan ${yearSel} — ${desigSel}`}/>
          <HRPlanGroupedRows rows={filtered.filter(r=>r.desig===desigSel)} groupBy="desig" onEdit={openEdit}/>
        </div>
      )}

      {/* ═══ EDIT HR PLAN MODAL ══════════════════════════════════ */}
      {editRow && editForm && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={()=>{if(confirm("Discard changes?")) {setEditRow(null);setEditForm(null);}}}>
          <div style={{background:"#fff",width:"520px",padding:"28px 32px",borderRadius:"6px",maxHeight:"90vh",overflow:"auto"}}
            onClick={e=>e.stopPropagation()}>
            <h3 style={{margin:"0 0 20px",fontWeight:700}}>Edit HR Plan</h3>

            <div style={FLD}>
              <label>Department</label>
              <input className="input" value={editForm.dept} readOnly style={{background:"var(--bg-2,#f5f7fa)"}}/>
            </div>
            <div style={FLD}>
              <label>Designation</label>
              <select className="input" value={editForm.desig} onChange={e=>setEditForm(f=>({...f,desig:e.target.value}))}>
                {desigs.map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div style={FLD}>
              <label>Quantity</label>
              <input className="input" type="number" min="0" value={editForm.qty}
                onChange={e=>setEditForm(f=>({...f,qty:Number(e.target.value)}))}/>
            </div>
            <div style={FLD}>
              <label>Salary Scale</label>
              <input className="input" type="number" min="0" max="20" step="0.5" value={editForm.scale}
                onChange={e=>setEditForm(f=>({...f,scale:Number(e.target.value)}))}/>
            </div>
            <div style={FLD}>
              <label>Salary</label>
              <input className="input" type="number" step="0.01" value={editForm.sal}
                onChange={e=>setEditForm(f=>({...f,sal:Number(e.target.value)}))}/>
            </div>
            <div style={{...FLD, marginBottom:"14px"}}>
              <label>Teaching</label>
              <div style={{display:"flex", gap:"20px"}}>
                <label style={{display:"flex",gap:"6px",alignItems:"center"}}>
                  <input type="radio" name="tnt" checked={editForm.tnt===1} onChange={()=>setEditForm(f=>({...f,tnt:1}))}/>
                  Teaching
                </label>
                <label style={{display:"flex",gap:"6px",alignItems:"center"}}>
                  <input type="radio" name="tnt" checked={editForm.tnt===2} onChange={()=>setEditForm(f=>({...f,tnt:2}))}/>
                  Non-Teaching
                </label>
              </div>
            </div>
            <div style={FLD}>
              <label>Year_HR_Plan</label>
              <input className="input" type="number" min="2020" max="2099" value={editForm.year}
                onChange={e=>setEditForm(f=>({...f,year:Number(e.target.value)}))}/>
            </div>
            <div style={FLD}>
              <label>Ammount Taken</label>
              <input className="input" type="number" min="-1" value={editForm.taken}
                onChange={e=>setEditForm(f=>({...f,taken:Number(e.target.value)}))}/>
            </div>
            <div style={FLD}>
              <label>From Where</label>
              <select className="input" value={editForm.fromWhere} onChange={e=>setEditForm(f=>({...f,fromWhere:e.target.value}))}>
                <option>HR Plan</option><option>New</option><option>Spillover</option>
              </select>
            </div>

            <div style={{display:"flex", gap:"10px", justifyContent:"flex-end", marginTop:"20px", borderTop:"1px solid var(--line-2)", paddingTop:"16px"}}>
              <button className="btn primary" onClick={saveEdit}>Save</button>
              <button className="btn" onClick={()=>{setEditRow(null);setEditForm(null);}}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.PageWelfareRec = { LeavesDeep, GP47Deep, InjuryDeep, HRPlanDeep };
})();
