// Terminations, Transfers, Tax, Documents, Forms, HR Plan, Pay Points
(function(){
const { useState } = React;
const D = window.HR_DATA;
const { StatusDot } = window.PageA;

function Terminations() {
  return (
    <div className="page">
      <div className="page-head"><div><div className="crumbs">Lifecycle</div><h1>Terminations</h1></div><div className="page-actions"><button className="btn">Pre-termination staging</button><button className="btn primary">+ New termination</button></div></div>
      <div className="tabs">
        <div className="tab active">Teaching (Carmen Spiteri)</div>
        <div className="tab">Non-teaching (Rudolph)</div>
        <div className="tab">Contract extensions</div>
        <div className="tab">End of contract</div>
      </div>
      <div className="card"><table className="table compact">
        <thead><tr><th>ID Card</th><th>Name</th><th>Type</th><th>Effective</th><th>Last day</th><th>Grade</th><th>Pay point</th><th>PRS</th><th>Salaries</th></tr></thead>
        <tbody>{D.TERMINATIONS.map(t=>(
          <tr key={t.id}><td className="id">{t.idCard}</td><td>{t.name}</td><td><span className="tag amber">{t.type}</span></td><td className="num">{t.effectiveDate}</td><td className="num">{t.lastDay}</td><td>{t.grade}</td><td className="id">{t.paypoint}</td><td>{t.prsUpdated?<span className="tag green">Updated</span>:<span className="tag amber">Pending</span>}</td><td>{t.salariesInformed?<span className="tag green">Informed</span>:<span className="tag amber">Pending</span>}</td></tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}

function Transfers() {
  const [tab, setTab] = useState("transfers");
  return (
    <div className="page">
      <div className="page-head"><div><div className="crumbs">Lifecycle</div><h1>Transfers & Promotions</h1></div><div className="page-actions"><button className="btn primary">+ New {tab==="transfers"?"transfer":"promotion"}</button></div></div>
      <div className="tabs">
        <div className={"tab "+(tab==="transfers"?"active":"")} onClick={()=>setTab("transfers")}>Transfers <span className="count">{D.TRANSFERS.length}</span></div>
        <div className={"tab "+(tab==="promotions"?"active":"")} onClick={()=>setTab("promotions")}>Promotions <span className="count">{D.PROMOTIONS.length}</span></div>
      </div>
      {tab==="transfers" ? (
        <div className="card"><table className="table compact">
          <thead><tr><th>ID</th><th>Name</th><th>Type</th><th>From</th><th>To</th><th>Effective</th><th>PRS</th></tr></thead>
          <tbody>{D.TRANSFERS.map(t=>(
            <tr key={t.id}><td className="id">{t.idCard}</td><td>{t.name}</td><td><span className="tag blue">{t.type}</span></td><td><span className="id">{t.fromPaypoint}</span> {t.fromDesc}</td><td><span className="id">{t.toPaypoint}</span> {t.toDesc}</td><td className="num">{t.effectiveDate}</td><td>{t.prsUpdated?<span className="tag green">✓</span>:<span className="tag amber">Pending</span>}</td></tr>
          ))}</tbody>
        </table></div>
      ) : (
        <div className="card"><table className="table compact">
          <thead><tr><th>ID</th><th>Name</th><th>From grade</th><th>To grade</th><th>Effective</th><th>Type</th><th>PRS</th></tr></thead>
          <tbody>{D.PROMOTIONS.map(p=>(
            <tr key={p.id}><td className="id">{p.idCard}</td><td>{p.name}</td><td>{p.fromGrade}</td><td><strong>{p.toGrade}</strong></td><td className="num">{p.effectiveDate}</td><td>{p.type}</td><td>{p.prsUpdated?<span className="tag green">✓</span>:<span className="tag amber">Pending</span>}</td></tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  );
}

function Tax() {
  return (
    <div className="page">
      <div className="page-head"><div><div className="crumbs">Pay & progression</div><h1>Tax / FS4</h1></div><div className="page-actions"><button className="btn">Send batch to Inland Revenue</button><button className="btn primary">+ New FS4</button></div></div>
      <div className="card"><table className="table compact">
        <thead><tr><th>ID Card</th><th>Name</th><th>Submitted</th><th>Tax status</th><th>To Inland Revenue</th></tr></thead>
        <tbody>{D.FS4_FORMS.map(f=>(
          <tr key={f.id}><td className="id">{f.idCard}</td><td>{f.name}</td><td className="num">{f.submitted}</td><td><span className="tag blue">{f.taxStatus}</span></td><td>{f.sentToInlRev?<span className="tag green">Sent</span>:<span className="tag amber">Pending</span>}</td></tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}

function Documents() {
  return (
    <div className="page">
      <div className="page-head"><div><div className="crumbs">Records</div><h1>Documents Sent to Sections</h1></div><div className="page-actions"><button className="btn primary">+ Log document</button></div></div>
      <div className="toolbar">
        <input placeholder="Search…" style={{width:240}}/>
        <select><option>All sections</option><option>SRS</option><option>Inland Revenue</option><option>Records Section</option><option>Recruitment</option><option>Gozo Office</option></select>
        <select><option>All categories</option><option>B2</option><option>C1</option></select>
      </div>
      <div className="card" style={{borderTop:0, borderRadius:"0 0 4px 4px"}}><table className="table compact">
        <thead><tr><th>Date</th><th>ID Card</th><th>Name</th><th>Category</th><th>Description</th><th>Sent to</th></tr></thead>
        <tbody>{D.DOCS_SENT.map(d=>(
          <tr key={d.id}><td className="num">{d.dateUploaded}</td><td className="id">{d.idCard}</td><td>{d.name}</td><td><span className="tag gray">{d.category}</span></td><td>{d.description}</td><td>{d.sentTo}</td></tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}

function Forms() {
  return (
    <div className="page">
      <div className="page-head"><div><div className="crumbs">Lifecycle</div><h1>Forms / Engagement</h1></div><div className="page-actions"><button className="btn">Print batch</button><button className="btn primary">+ New engagement</button></div></div>
      <div className="card"><table className="table compact">
        <thead><tr><th>Ref no.</th><th>ID Card</th><th>Name</th><th>Issue date</th><th>Post</th><th>Acceptance</th><th>Commencement form</th></tr></thead>
        <tbody>{D.ENGAGEMENTS.map(e=>(
          <tr key={e.id}><td className="id">{e.refNo}</td><td className="id">{e.idCard}</td><td>{e.name}</td><td className="num">{e.issueDate}</td><td>{e.post}</td><td>{e.accepted?<span className="tag green">Accepted</span>:<span className="tag amber">Pending</span>}</td><td>{e.commencementForm?<span className="tag green">Issued</span>:<span className="tag gray">—</span>}</td></tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}

function HRPlanReports() {
  const total = D.HR_PLAN.reduce((a,b)=>a+b.authorised,0);
  const filled = D.HR_PLAN.reduce((a,b)=>a+b.filled,0);
  return (
    <div className="page">
      <div className="page-head"><div><div className="crumbs">Records</div><h1>HR Plan Reports</h1></div><div className="page-actions"><button className="btn">By department</button><button className="btn">By designation</button><button className="btn primary">Export</button></div></div>
      <div className="stats" style={{marginBottom:12}}>
        <div className="stat"><div className="lbl">Total authorised</div><div className="val">{total.toLocaleString()}</div></div>
        <div className="stat"><div className="lbl">Filled</div><div className="val">{filled.toLocaleString()}</div></div>
        <div className="stat"><div className="lbl">Vacant</div><div className="val">{(total-filled).toLocaleString()}</div></div>
        <div className="stat"><div className="lbl">Fill rate</div><div className="val">{Math.round(filled/total*100)}%</div><div className="bar"><span style={{width:(filled/total*100)+"%"}}/></div></div>
      </div>
      <div className="card"><table className="table">
        <thead><tr><th>Department</th><th>Designation</th><th className="right">Authorised</th><th className="right">Filled</th><th className="right">Vacant</th><th>Fill rate</th></tr></thead>
        <tbody>{D.HR_PLAN.map((h,i)=>(
          <tr key={i}><td>{h.dept}</td><td>{h.desig}</td><td className="num right">{h.authorised}</td><td className="num right">{h.filled}</td><td className="num right" style={{color:h.vacant>20?"var(--red)":"var(--ink)"}}>{h.vacant}</td><td><span className={"bar-mini "+(h.vacant/h.authorised>0.05?"amber":"")}><span style={{width:(h.filled/h.authorised*100)+"%"}}></span></span><span className="num">{Math.round(h.filled/h.authorised*100)}%</span></td></tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}

function PayPoints() {
  return (
    <div className="page">
      <div className="page-head"><div><div className="crumbs">Records</div><h1>Pay Points</h1></div><div className="page-actions"><button className="btn">Sync from ER</button><button className="btn primary">+ New pay point</button></div></div>
      <div className="card"><table className="table compact">
        <thead><tr><th>No.</th><th>Description</th><th>Main office</th><th>Directorate</th><th>Region</th><th>Staff</th></tr></thead>
        <tbody>{D.PAYPOINTS.map(p=>{
          const cnt = D.PEOPLE.filter(x=>x.paypoint===p.no).length;
          return (
            <tr key={p.no}><td className="id">{p.no}</td><td><strong>{p.desc}</strong></td><td>{p.main}</td><td className="muted">{p.dir}</td><td>{p.gozo?<span className="tag purple">Gozo</span>:<span className="tag blue">Malta</span>}</td><td className="num">{cnt}</td></tr>
          );
        })}</tbody>
      </table></div>
    </div>
  );
}

window.PageD = { Terminations, Transfers, Tax, Documents, Forms, HRPlanReports, PayPoints };
})();
