// Deep pages — lifecycle cluster
// Recruitment, Forms (SRS), Transfers/Promotions, Terminations
(function(){
const { useState, useMemo } = React;
const D = window.HR_DATA;
const X = window.DEEP_DATA;
const ApprovalPill = window.ApprovalPill;
const { useApp } = window.Shell;
const DocsSentGrid = window.PagePayProg?.DocsSentGrid;

// ─────────────────────────────────────────────────────────────────
// EXCEL TEMPLATE DOWNLOADER — builds a .xlsx with headers + sample rows
// ─────────────────────────────────────────────────────────────────
function downloadXlsx(rows, sheetName, fileName) {
  if (typeof XLSX === "undefined") { alert("XLSX library not loaded."); return; }
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}

// Sample applications template — used by both Teaching and Non-Teaching
function downloadAppsTemplate(kind /* "teaching" | "non-teaching" */) {
  const isTeaching = kind === "teaching";
  const profiles = isTeaching
    ? ["TCH-2026-001","TCH-2026-001","TCH-2026-002","TCH-2026-002","TCH-2026-003"]
    : ["NT-2026-FOR-001","NT-2026-FOR-001","NT-2026-TRD-002","NT-2026-TRD-002","NT-2026-CLK-003"];
  const designations = isTeaching
    ? "Teacher"
    : ["Foreman","Foreman","Tradesperson I","Tradesperson I","Clerk"];
  const trades = isTeaching
    ? ["Mathematics","English","Physics","Biology","Computing"]
    : ["","","Plumbing","Plumbing",""];
  const sample = [
    ["0259684M","Maria","Borg",     "2026-01-12","Submitted",           "",       "A", profiles[0], isTeaching?designations:designations[0], trades[0], "2026-01-01","2026-01-31","MEYR/REC/001/26","REF-2026-001","2026-01-05","2026-02-20","12"],
    ["0312068M","Robert","Mula",    "2026-01-14","Passed Step 1",       "Pass",   "A", profiles[1], isTeaching?designations:designations[1], trades[1], "2026-01-01","2026-01-31","MEYR/REC/001/26","REF-2026-001","2026-01-05","2026-02-20","12"],
    ["0544665M","John Charles","Doughty","2026-01-16","Passed Step 2",  "Pass",   "B", profiles[2], isTeaching?designations:designations[2], trades[2], "2026-01-08","2026-02-05","MEYR/REC/002/26","REF-2026-002","2026-01-12","2026-02-28","12"],
    ["0013766M","Philip","Zerafa",  "2026-01-18","Accepted",            "Pass",   "A", profiles[3], isTeaching?designations:designations[3], trades[3], "2026-01-08","2026-02-05","MEYR/REC/002/26","REF-2026-002","2026-01-12","2026-02-28","12"],
    ["0011768M","Jane","Cassar",    "2026-01-20","Refused",             "Refused","C", profiles[4], isTeaching?designations:designations[4], trades[4], "2026-01-15","2026-02-15","MEYR/REC/003/26","REF-2026-003","2026-01-20","2026-03-10","12"],
  ];
  const headers = ["PersonIDNO","PersonName","PersonSurname","Application_Date","Status","Result","Category","Job_Profile","Designation","Trade_of_Profession","Call_Opens","Call-Closes","File_number","Reference","Pub_date","Result_date","Valid_for"];
  const rows = sample.map(r => Object.fromEntries(headers.map((h,i)=>[h,r[i]])));
  downloadXlsx(rows, "Applications", `Applications_${isTeaching?"Teaching":"NonTeaching"}_template.xlsx`);
}

function downloadRankingsTemplate(kind /* "teaching" | "non-teaching" */) {
  const isTeaching = kind === "teaching";
  const profile = isTeaching ? "TCH-2026-001" : "NT-2026-FOR-001";
  if (isTeaching) {
    const sample = [
      ["0259684M","Maria","Borg",          profile, 1, 92, "A", false, false, "10/3","Top ranked — full pass"],
      ["0312068M","Robert","Mula",          profile, 2, 88, "A", false, false, "10/2","Strong interview"],
      ["0544665M","John Charles","Doughty", profile, 3, 84, "B", false, false, "10/1","Recommended"],
      ["0013766M","Philip","Zerafa",        profile, 4, 78, "A", false, false, "10/1","Reserve"],
      ["0011768M","Jane","Cassar",          profile, 5, 65, "C", true,  false, "",     "Failed final paper"],
    ];
    const headers = ["PersonIDNO","PersonName","PersonSurname","Job_Profile","Ranking","Ranking_Mark","Category","Failed","Sent_To_Recom","SalScale","Comments"];
    const rows = sample.map(r => Object.fromEntries(headers.map((h,i)=>[h,r[i]])));
    downloadXlsx(rows, "Rankings", "Rankings_Teaching_template.xlsx");
  } else {
    const sample = [
      ["0259684M","Maria","Borg",          profile, 1, 91, "A", true,  false],
      ["0312068M","Robert","Mula",          profile, 2, 87, "A", true,  false],
      ["0544665M","John Charles","Doughty", profile, 3, 82, "B", true,  false],
      ["0013766M","Philip","Zerafa",        profile, 4, 76, "A", false, false],
      ["0011768M","Jane","Cassar",          profile, 5, 62, "C", false, false],
    ];
    const headers = ["PersonIDNO","PersonName","PersonSurname","Job_Profile","Ranking","Ranking_Mark","Category","Recomend","Email_Sent"];
    const rows = sample.map(r => Object.fromEntries(headers.map((h,i)=>[h,r[i]])));
    downloadXlsx(rows, "Rankings", "Rankings_NonTeaching_template.xlsx");
  }
}

// ─────────────────────────────────────────────────────────────────
// RECRUITMENT — Application_Details, Persons_Applications, Presons_Ranking,
//               Conf_of_appointment, Replacement_list, Supply_seniority, VET
// ─────────────────────────────────────────────────────────────────
function RecruitmentDeep() {
  const [tab, setTab] = useState("calls");
  const [teachingFilter, setTeachingFilter] = useState("all");
  const [appModal, setAppModal] = useState(null);

  const calls = (X?.APPLICATION_DETAILS||[]).filter(a => {
    if (teachingFilter === "teaching") return a.teaching === 1;
    if (teachingFilter === "non-teaching") return a.teaching === 2;
    return true;
  });

  const tabs = [
    {id:"calls", label:"Job calls", count: (X?.APPLICATION_DETAILS||[]).length},
    {id:"applications", label:"Applications", count: (X?.PERSONS_APPLICATIONS||[]).length},
    {id:"ranking", label:"Ranking", count: (X?.PRESONS_RANKING||[]).length},
    {id:"confirmation", label:"Confirmation of appointment", count: (X?.CONF_OF_APPOINTMENT||[]).length},
    {id:"replacement", label:"Replacement list", count: (X?.REPLACEMENT_LIST||[]).length},
    {id:"supply", label:"Supply seniority", count: (X?.SUPPLY_SENIORITY||[]).length},
    {id:"vet", label:"VET certificates", count: (X?.VET_CERTIFICATES||[]).length},
    {id:"results", label:"Result sheet", count: (X?.VIEW_RESULT_SHEET||[]).length},
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">Lifecycle · Teaching + non-teaching</div>
          <h1>Recruitment</h1>
          <p className="page-sub">Job calls, applications, ranking, replacement lists, supply seniority. Two parallel workspaces — teaching and non-teaching — sharing one schema.</p>
        </div>
        <div className="page-actions">
          <select className="input" value={teachingFilter} onChange={e=>setTeachingFilter(e.target.value)}>
            <option value="all">Both DBs</option>
            <option value="teaching">Teaching only</option>
            <option value="non-teaching">Non-teaching only</option>
          </select>
          <button className="btn primary">+ New call</button>
        </div>
      </div>

      <div className="tabs scrolly">
        {tabs.map(t => (
          <div key={t.id} className={"tab " + (tab===t.id?"active":"")} onClick={()=>setTab(t.id)}>{t.label} <span className="count">{t.count}</span></div>
        ))}
      </div>

      {tab === "calls" && (
        <div className="card">
          <div className="card-head"><h2>Open &amp; recent calls</h2></div>
          <table className="table compact">
            <thead><tr>
              <th>Profile no</th><th>Title</th><th>Subject</th><th>Grade</th><th>Scale</th>
              <th>Published</th><th>Closing</th><th>HR Plan</th><th className="right">Qty</th><th className="right">Filled</th><th>Status</th>
            </tr></thead>
            <tbody>
              {calls.map(c => (
                <tr key={c.autoId}>
                  <td className="mono">{c.jobProfileNumber}</td>
                  <td>{c.jobTitle}</td>
                  <td>{c.subject}</td>
                  <td className="mono">{c.grade}</td>
                  <td className="mono">Sc {c.salaryScale}</td>
                  <td className="num">{c.publicationDate}</td>
                  <td className="num">{c.closingDate}</td>
                  <td className="mono xs">{c.hrPlanRef}</td>
                  <td className="num right mono">{c.quantity}</td>
                  <td className="num right mono">{c.appointed}</td>
                  <td><span className={"tag " + (c.status==="Open"?"green":c.status==="Closed"?"gray":"amber")}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {appModal && window.PageForms && React.createElement(window.PageForms.AppDetailModal, {
        app: appModal,
        onClose: () => setAppModal(null),
      })}

      {tab === "applications" && (
        <div className="card">
          <div className="card-head"><h2>Applications received</h2><div className="right muted xs">Click a row to open the pipeline</div></div>
          <table className="table compact">
            <thead><tr><th>ID Card</th><th>Applicant</th><th>Profile</th><th>Submitted</th><th>Status</th></tr></thead>
            <tbody>
              {(X?.PERSONS_APPLICATIONS||[]).slice(0, 28).map(a => (
                <tr key={a.id} style={{cursor:"pointer"}} onClick={() => setAppModal(a)}>
                  <td className="id">{a.idCard}</td>
                  <td>{a.name} {a.surname}</td>
                  <td className="mono">{a.profileId}</td>
                  <td className="num">{a.submittedOn}</td>
                  <td><span className={"tag " + (a.status==="Accepted"?"green":a.status==="Refused"?"red":"gray")}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "ranking" && (
        <div className="card">
          <div className="card-head"><h2>Ranking</h2><div className="right"><span className="muted xs">Final rank order after Step 2 marking</span></div></div>
          <table className="table compact">
            <thead><tr>
              <th className="right">Rank</th><th>Profile</th><th>ID Card</th><th>Name</th>
              <th className="right">Mark</th><th className="right">Exam</th><th>Public officer</th>
              <th>Scale</th><th>Sen. teacher sent</th><th>HR Plan</th><th>Comments</th>
            </tr></thead>
            <tbody>
              {(X?.PRESONS_RANKING||[]).slice(0, 24).map(r => (
                <tr key={r.id}>
                  <td className="num right mono"><strong>{r.ranking}</strong></td>
                  <td className="mono xs">{r.jobProfileNumber}</td>
                  <td className="id">{r.idCardNo}</td>
                  <td>{r.name}</td>
                  <td className="num right mono">{r.mark}</td>
                  <td className="num right mono">{r.examMark}</td>
                  <td>{r.isPublicOfficer ? <span className="tag blue">Yes</span> : <span className="muted">—</span>}</td>
                  <td className="mono">Sc {r.salaryScale}</td>
                  <td>{r.sentSeniorityTeacher ? <span className="check">✓</span> : "—"}</td>
                  <td>{r.hrPlanUpdated ? <span className="check">✓</span> : "—"}</td>
                  <td className="muted xs">{r.comments || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "confirmation" && (
        <div className="card">
          <div className="card-head"><h2>Probation tracking</h2></div>
          <table className="table compact">
            <thead><tr>
              <th>ID Card</th><th>Name</th><th>Cat</th><th>WEF</th><th>Grade</th><th>School</th>
              <th>Due</th><th>Audited</th><th>Sent → College</th><th>Recvd ← College</th>
              <th>Confirmed</th><th>→ DG</th>
            </tr></thead>
            <tbody>
              {(X?.CONF_OF_APPOINTMENT||[]).map(c => (
                <tr key={c.autoId}>
                  <td className="id">{c.idCard}</td>
                  <td>{c.name}</td>
                  <td className="mono">{c.category}</td>
                  <td className="num">{c.wefRecruitment}</td>
                  <td className="muted xs">{c.persGrade}</td>
                  <td className="muted xs">{c.persSchool.split(",")[0]}</td>
                  <td className="num">{c.dueDate}</td>
                  <td>{c.audited ? <span className="check">✓</span> : "—"}</td>
                  <td>{c.sentToCollege ? <span className="check">✓</span> : "—"}</td>
                  <td>{c.receivedFromCollege ? <span className="check">✓</span> : "—"}</td>
                  <td>{c.confirmed ? <span className="tag green">Confirmed</span> : <span className="tag amber">Probation</span>}</td>
                  <td>{c.sendToDg ? <span className="check">✓</span> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "replacement" && (
        <div className="card">
          <div className="card-head"><h2>Replacement list</h2></div>
          <table className="table compact">
            <thead><tr><th>ID Card (out)</th><th>Name</th><th>Reason</th><th>WEF</th><th>Grade</th><th>Replaced?</th><th>Replaced with</th><th>Profile</th></tr></thead>
            <tbody>
              {(X?.REPLACEMENT_LIST||[]).map(r => (
                <tr key={r.autoId}>
                  <td className="id">{r.idCard}</td>
                  <td>{r.name}</td>
                  <td><span className="tag gray">{r.reason}</span></td>
                  <td className="num">{r.wef}</td>
                  <td className="muted xs">{r.grade}</td>
                  <td>{r.replaced ? <span className="tag green">Yes</span> : <span className="tag amber">Open</span>}</td>
                  <td>{r.replacedWith ? <><span className="id">{r.replacedWith}</span> <span className="muted xs">{r.replacedWithName}</span></> : <span className="muted">—</span>}</td>
                  <td className="mono xs">{r.profileId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "supply" && (
        <div className="card">
          <div className="card-head"><h2>Supply_teacher_Seniority</h2><div className="right"><span className="muted xs">Live, ranked. Expiry 31 Dec.</span></div></div>
          <table className="table compact">
            <thead><tr>
              <th className="right">Rank</th><th>ID</th><th>Name</th><th>Subject</th><th>Cat</th>
              <th>WEF</th><th>Result</th><th>Active</th><th>Email sent</th><th>Renewed</th><th>Employed</th><th>Refused</th>
            </tr></thead>
            <tbody>
              {(X?.SUPPLY_SENIORITY||[]).map(s => (
                <tr key={s.autoId}>
                  <td className="num right mono"><strong>{s.ranking}</strong></td>
                  <td className="id">{s.idCardNo}</td>
                  <td>{s.name}</td>
                  <td>{s.tradeOfProfession}</td>
                  <td className="muted xs">{s.category}</td>
                  <td className="num">{s.wefRecruitment}</td>
                  <td className="num">{s.resultDate}</td>
                  <td>{s.activeSubject ? <span className="check">✓</span> : "—"}</td>
                  <td>{s.appointmentEmailSent ? <span className="check">✓</span> : "—"}</td>
                  <td>{s.renewed ? <span className="check">✓</span> : "—"}</td>
                  <td>{s.employed ? <span className="tag green">Yes</span> : <span className="muted">—</span>}</td>
                  <td>{s.refused ? <span className="tag red">Refused</span> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "vet" && (
        <div className="card">
          <div className="card-head"><h2>VET certificates</h2></div>
          <table className="table compact">
            <thead><tr><th>Subject</th><th>Holder</th><th>ID Card</th><th>Level</th><th>Issue date</th><th>Verified</th></tr></thead>
            <tbody>
              {(X?.VET_CERTIFICATES||[]).map(v => (
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
      )}

      {tab === "results" && (
        <div className="card">
          <div className="card-head"><h2>View_Result_Sheet — combined cross-DB</h2></div>
          <div className="muted xs" style={{padding:"6px 12px", borderBottom:"1px solid var(--line-2)"}}>
            Combined view: applications + ranking + final result. Used by senior officers to issue offers.
          </div>
          <table className="table compact">
            <thead><tr><th>Profile</th><th>Title</th><th>Track</th><th>ID Card</th><th>Name</th><th className="right">Rank</th><th className="right">Mark</th><th>Result</th></tr></thead>
            <tbody>
              {(X?.VIEW_RESULT_SHEET||[]).slice(0, 28).map((r, i) => (
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
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// FORMS — SRS_Forms_tbl + DocsSentToSection
// ─────────────────────────────────────────────────────────────────
function FormsDeep() {
  const [tab, setTab] = useState("forms");
  const [statusFilter, setStatusFilter] = useState("all");
  const [processFilter, setProcessFilter] = useState("all");

  const rows = (X?.SRS_FORMS || []).filter(f =>
    (statusFilter === "all" || f.status === statusFilter) &&
    (processFilter === "all" || f.process === processFilter)
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">Lifecycle</div>
          <h1>Forms &amp; engagement</h1>
          <p className="page-sub">Engagement form lifecycle. Officers create forms here, route them to back office, track Front and Back acceptance, dispatch to downstream sections.</p>
        </div>
        <div className="page-actions">
          <button className="btn">Bulk submit</button>
          <button className="btn primary">+ New form</button>
        </div>
      </div>

      <div className="tabs">
        <div className={"tab " + (tab==="forms"?"active":"")} onClick={()=>setTab("forms")}>Forms <span className="count">{(X?.SRS_FORMS||[]).length}</span></div>
        <div className={"tab " + (tab==="dispatch"?"active":"")} onClick={()=>setTab("dispatch")}>Dispatch to sections</div>
      </div>

      {tab === "forms" && (
        <div className="card">
          <div className="card-head">
            <h2>Engagement forms</h2>
            <div className="right">
              <select className="input sm" value={processFilter} onChange={e=>setProcessFilter(e.target.value)}>
                <option value="all">All processes</option>
                {(X?.SRS_PROCESSES||[]).map(p=><option key={p}>{p}</option>)}
              </select>
              <select className="input sm" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
                <option value="all">All statuses</option>
                {(X?.SRS_STATUS||[]).map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="table-scroll">
          <table className="table compact">
            <thead><tr>
              <th>Form ref</th><th>Process</th><th>Pay period</th><th>Employee</th>
              <th>Pay point</th><th>Created</th><th>By</th><th>Last submitted</th><th>Status</th>
            </tr></thead>
            <tbody>
              {rows.map(f => (
                <tr key={f.formRefNo}>
                  <td className="mono">{f.formRefNo}</td>
                  <td><span className="tag gray">{f.process}</span></td>
                  <td className="mono">{f.payPeriod}</td>
                  <td><div>{f.employeeName} {f.employeeSurname}</div><div className="muted mono xs">{f.employeeId}</div></td>
                  <td className="mono">{f.payPoint}</td>
                  <td className="num">{f.creationDate}</td>
                  <td className="mono xs">{f.createdBy}</td>
                  <td className="num">{f.lastSubmissionDate}</td>
                  <td><span className={"tag " + (f.status.startsWith("Accepted")?"green":f.status==="Rejected"?"red":"amber")}>{f.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {tab === "dispatch" && DocsSentGrid && <DocsSentGrid title="Dispatch to sections — full grid" />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TRANSFERS / PROMOTIONS
// ─────────────────────────────────────────────────────────────────
function TransfersDeep() {
  const [tab, setTab] = useState("transfers");
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">Lifecycle</div>
          <h1>Transfers &amp; promotions</h1>
          <p className="page-sub">Inter-ministry transfers and promotions to higher grades. Each event adds an entry to the personnel record.</p>
        </div>
        <div className="page-actions">
          <button className="btn primary">+ New event</button>
        </div>
      </div>

      <div className="tabs">
        <div className={"tab " + (tab==="transfers"?"active":"")} onClick={()=>setTab("transfers")}>Transfers <span className="count">{(X?.TRANSFERS_TBL||[]).length}</span></div>
        <div className={"tab " + (tab==="promotions"?"active":"")} onClick={()=>setTab("promotions")}>Promotions <span className="count">{(X?.PROMOTIONS_TBL||[]).length}</span></div>
        <div className={"tab " + (tab==="ministries"?"active":"")} onClick={()=>setTab("ministries")}>Ministries <span className="count">{(X?.MINISTRIES||[]).length}</span></div>
      </div>

      {tab === "transfers" && (
        <div className="card">
          <div className="card-head"><h2>Transfers</h2></div>
          <table className="table compact">
            <thead><tr>
              <th>ID Card</th><th>Name</th><th>Grade</th><th>From</th><th>→ To</th><th>Type</th>
              <th>Date</th><th>Direction</th><th>Email sent</th><th>360 emailed</th><th>Officer</th>
            </tr></thead>
            <tbody>
              {(X?.TRANSFERS_TBL||[]).map(t => (
                <tr key={t.id}>
                  <td className="id">{t.personIdno}</td>
                  <td>{t.name}</td>
                  <td className="muted xs">{t.persGrade}</td>
                  <td className="mono">{t.transferredFrom}</td>
                  <td className="mono"><strong>{t.transferredTo}</strong></td>
                  <td className="muted xs">{t.typeOfTransfer}</td>
                  <td className="num">{t.dateOfTransfer}</td>
                  <td><span className={"tag " + (t.transferType==="incoming"?"green":"amber")}>{t.transferType}</span></td>
                  <td>{t.emailSent ? <span className="check">✓</span> : "—"}</td>
                  <td>{t.emailSentPeople360 ? <span className="check">✓</span> : "—"}</td>
                  <td className="mono xs">{t.officer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "promotions" && (
        <div className="card">
          <div className="card-head"><h2>Promotions</h2></div>
          <table className="table compact">
            <thead><tr>
              <th>ID Card</th><th>Name</th><th>Sex</th><th>From grade</th><th>→ To grade</th>
              <th>Scale</th><th>Date</th><th>Record id</th><th>Track</th><th>Status</th>
            </tr></thead>
            <tbody>
              {(X?.PROMOTIONS_TBL||[]).map(p => (
                <tr key={p.id}>
                  <td className="id">{p.personIdno}</td>
                  <td>{p.name}</td>
                  <td>{p.persGender}</td>
                  <td className="muted xs">{p.previousGrade}</td>
                  <td><strong>{p.newGrade}</strong></td>
                  <td className="mono">Sc {p.salScale}</td>
                  <td className="num">{p.promAppDate}</td>
                  <td className="mono xs">{p.autoIdPrs}</td>
                  <td><span className={"tag " + (p.teachingNonTeaching===1?"blue":"gray")}>{p.teachingNonTeaching===1?"Teaching":"Non-teaching"}</span></td>
                  <td><ApprovalPill compact sent={p.sentToOfficer} approved={p.approved} uploaded={p.uploaded}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "ministries" && (
        <div className="card">
          <div className="card-head"><h2>Ministries — reference</h2></div>
          <table className="table compact">
            <thead><tr><th>Abv</th><th>Name</th></tr></thead>
            <tbody>
              {(X?.MINISTRIES||[]).map(m => (
                <tr key={m.abv}><td className="mono">{m.abv}</td><td>{m.name}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SERVICE FUNCTIONS — mirror Access query behaviour in-memory
// (§3.1 validation, §3.2 read, §3.3 update / delete)
// ─────────────────────────────────────────────────────────────────
const TERM_SVC = {
  // §3.1 Validation
  chk_pre_termination_exists: (personIdno, officer, preTermData) =>
    (preTermData || []).some(r =>
      r.personIdno?.toLowerCase() === personIdno?.toLowerCase() && r.officer === officer
    ),

  chk_idcard_exist_in_replacement_teaching: (personIdno) =>
    (X?.REPLACEMENT_LIST_TEACHING || []).some(r =>
      r.personIdno?.toLowerCase() === personIdno?.toLowerCase()
    ),

  chk_idcard_exist_in_replacement_non_teaching: (personIdno) =>
    (X?.REPLACEMENT_LIST_NON_TEACHING || []).some(r =>
      r.personIdno?.toLowerCase() === personIdno?.toLowerCase()
    ),

  // Returns latest PRS_records row for person — Access ORDER BY From_Date
  chk_last_grade: (personIdno) => {
    const rows = (window.PRS_DATA?.HERO_PRS || [])
      .filter(r => r.idCard?.toLowerCase() === personIdno?.toLowerCase() && r.position)
      .sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate));
    return rows[0] ? {position: rows[0].position, idCardNo: rows[0].idCard, fromDate: rows[0].fromDate} : null;
  },

  chk_no_of_remarks: (personIdno) =>
    (window.PRS_DATA?.HERO_REMARKS || [])
      .filter(r => r.idCard?.toLowerCase() === personIdno?.toLowerCase()).length,

  chk_works_done: (personIdno, tracker) =>
    (tracker || []).find(r => r.persIdno?.toLowerCase() === personIdno?.toLowerCase()) || null,

  // Returns array (empty = no duplicate, non-empty = warn user)
  chk_duplicate_termination: (personIdno, termData) =>
    (termData || []).filter(r =>
      (r.personIdno || "").toLowerCase() === personIdno?.toLowerCase()
    ),

  chk_tech_non_teach: (position) => {
    const m = (X?.TEACHING_GRADES || []).find(g => g.posi === position);
    return m ? m.techOrNonTeach : 2;
  },

  // §3.2 Read
  prs_data: (personIdno) => {
    const fn = (window.PRS_DATA?.FILE_NUMBERS || []).find(f =>
      f.idCard?.toLowerCase() === personIdno?.toLowerCase()
    );
    const p = (D.PEOPLE || []).find(p => p.idCard?.toLowerCase() === personIdno?.toLowerCase());
    return p ? {personIdno, personName: p.name, personSurname: p.surname, dob: p.dob,
                persFileNo: fn?.persFileNo || "—", woPens: fn?.woPens || "—"} : null;
  },

  prs_records_by_id: (personIdno) =>
    (window.PRS_DATA?.HERO_PRS || [])
      .filter(r => r.idCard?.toLowerCase() === personIdno?.toLowerCase())
      .sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate)),

  prs_remarks_by_id: (personIdno) =>
    (window.PRS_DATA?.HERO_REMARKS || [])
      .filter(r => r.idCard?.toLowerCase() === personIdno?.toLowerCase()),

  // §3.3 Update / delete (return new state arrays — no mutation)
  del_pre_termination: (autoId, preTermData) =>
    (preTermData || []).filter(r => r.autoId !== autoId),

  del_record: (personIdno, termData) =>
    (termData || []).filter(r => r.personIdno?.toLowerCase() !== personIdno?.toLowerCase()),

  upd_sections_informed: (id, termData) =>
    (termData || []).map(r => r.id === id ? {...r, sectionsInformed: true} : r),

  upd_works_done_termination: (personIdno, tracker) => {
    const exists = (tracker || []).some(r => r.persIdno?.toLowerCase() === personIdno?.toLowerCase());
    if (exists) return tracker.map(r => r.persIdno?.toLowerCase() === personIdno?.toLowerCase() ? {...r, terminationDone: true} : r);
    return [...(tracker || []), {persIdno: personIdno, srsInformed: 0, jobsInformed: 0, terminationDone: true}];
  },

  upd_mark_for_bulk_upload: (officer, preTermData) =>
    (preTermData || []).map(r =>
      r.officer === officer && !r.markForTermination ? {...r, markForTermination: true} : r
    ),

  // App_bulk_upload → Termination_Data (Carmen two-step)
  app_bulk_termination: (officer, preTermData, currentTermData) => {
    const toCommit = (preTermData || []).filter(r =>
      r.officer === officer && r.markForTermination
    );
    const newRows = toCommit.map((r, i) => ({
      id: 9000 + currentTermData.length + i,
      personIdno: r.personIdno,
      name: `${r.personName} ${r.personSurname}`,
      gradePosition: "", reason: r.reason, genReason: r.genReason,
      terminationComments: r.terminationComments, terminationDate: r.terminationDate,
      sex: r.sex, officer: r.officer, sectionsInformed: false, emailComments: "",
      dbName: "Terminations", prsRecAutoId: 0, prsRemAutoId: 0,
      teachingNonTeaching: officer === "spitc188" ? 1 : 2,
      college: "", primarySecondary: "", terminationResignation: "Termination",
    }));
    return {
      newTermData: [...currentTermData, ...newRows],
      remainingPre: (preTermData || []).filter(r => !(r.officer === officer && r.markForTermination)),
    };
  },

  // without_service_id — terminations where PRS_Record_Auto_id = 0
  without_service_id: (officer, termData) =>
    (termData || []).filter(r => r.officer === officer && (!r.prsRecAutoId || r.prsRecAutoId === 0)),

  // without_remarks_id — terminations where PRS_Rem_Auto_id = 0
  without_remarks_id: (officer, termData) =>
    (termData || []).filter(r => r.officer === officer && (!r.prsRemAutoId || r.prsRemAutoId === 0)),

  // view_terminations_by_grade — date range + grade filter
  view_by_grade: (dateFrom, dateTo, grade, terminationData) =>
    (terminationData || []).filter(r =>
      r.gradePosition === grade &&
      r.terminationResignation === "Termination" &&
      (!dateFrom || r.terminationDate >= dateFrom) &&
      (!dateTo   || r.terminationDate <= dateTo)
    ),

  // e_mail_data — payload for notification email
  e_mail_data: (termRow) => {
    const p = (D.PEOPLE || []).find(p => p.idCard?.toLowerCase() === termRow.personIdno?.toLowerCase());
    const dayBefore = termRow.terminationDate
      ? new Date(new Date(termRow.terminationDate).getTime() - 86400000).toISOString().slice(0,10)
      : "";
    return {
      ...termRow,
      personName: p?.name || "", personSurname: p?.surname || "",
      fullName: p ? `${p.name} ${p.surname}` : termRow.personIdno,
      dayBefore,
    };
  },
};

// ─────────────────────────────────────────────────────────────────
// TERMINATIONS — 2 separate workspaces (Carmen / Rudolph)
// ─────────────────────────────────────────────────────────────────
function TerminationsDeep({ initial }) {
  const isCarmen  = (initial || "carmen") === "carmen";
  const officer   = isCarmen ? "spitc188" : "farrr149";

  const [termModal, setTermModal]   = useState(false);
  const [eocNrModal, setEocNrModal] = useState(false);
  const [eocCgModal, setEocCgModal] = useState(false);
  const [viewModal, setViewModal]   = useState(null);
  const [selPreTerm, setSelPreTerm] = useState(null);
  const [caseSearch, setCaseSearch] = useState("");

  const [localTerms,   setLocalTerms]   = useState([]);
  const [localPreTerm, setLocalPreTerm] = useState(
    (X?.PRE_TERM_DATA || []).filter(r => r.officer === officer)
  );
  const [localEocNr, setLocalEocNr] = useState([]);
  const [localEocCg, setLocalEocCg] = useState([]);
  const [worksTracker, setWorksTracker] = useState(X?.WORKS_DONE || []);

  const baseTermData = isCarmen ? (X?.TERM_CARMEN || []) : (X?.TERM_RUDOLPH || []);
  const termData     = [...baseTermData, ...localTerms];
  const preTermData  = localPreTerm;
  const allEocNr     = [...(X?.END_OF_CONTRACT || []), ...localEocNr];
  const allEocCg     = [...(X?.END_OF_CONTRACT_CG || []), ...localEocCg];

  // ── Case-file search results ──────────────────────────────────────
  const q = caseSearch.trim().toLowerCase();
  const caseTermRows  = q ? termData.filter(t =>
    (t.personIdno||"").toLowerCase().includes(q) || (t.name||"").toLowerCase().includes(q)
  ) : [];
  const casePreRows   = q ? preTermData.filter(r =>
    (r.personIdno||"").toLowerCase().includes(q) ||
    (`${r.personName||""} ${r.personSurname||""}`).toLowerCase().includes(q)
  ) : [];
  const caseEocNrRows = q ? allEocNr.filter(e => (e.persIdno||"").toLowerCase().includes(q)) : [];
  const caseEocCgRows = q ? allEocCg.filter(e => (e.persIdno||"").toLowerCase().includes(q)) : [];
  const caseExtRows   = q ? (X?.EXTENSIONS||[]).filter(e =>
    (e.persIdno||"").toLowerCase().includes(q) || (e.name||"").toLowerCase().includes(q)
  ) : [];
  const totalFound = caseTermRows.length + casePreRows.length + caseEocNrRows.length + caseEocCgRows.length + caseExtRows.length;

  // ── Audit ─────────────────────────────────────────────────────────
  function handleAuditBtn(type) {
    const rows = type === "service"
      ? TERM_SVC.without_service_id(officer, termData)
      : TERM_SVC.without_remarks_id(officer, termData);
    setViewModal({
      records: rows.map(r => ({id:r.id, name:r.name, reason:r.reason,
        terminationDate:r.terminationDate, gradePosition:r.gradePosition,
        comments: type==="service"
          ? "PRS_Record_Auto_id = 0 — service record not yet linked"
          : "PRS_Rem_Auto_id = 0 — remarks record not yet linked"})),
      title: (type==="service"?"Without Service ID":"Without Remarks ID")+" — "+rows.length+" found",
    });
  }

  // ── Export CSV ───────────────────────────────────────────────────
  function doExport() {
    const headers = ["Person_idno","Name","Grade_Position","Sex","Reason","Gen_reason","Term_Res","Termination_Date","College","PRS_Record_Auto_id","PRS_Rem_Auto_id","Sections_informed"];
    const rows = termData.map(t => [
      t.personIdno, t.name, t.gradePosition, t.sex, t.reason, t.genReason,
      t.terminationResignation, t.terminationDate, t.college,
      t.prsRecAutoId, t.prsRemAutoId, t.sectionsInformed ? 1 : 0,
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(v => '"' + String(v ?? "").replace(/"/g, '""') + '"').join(","))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], {type: "text/csv"}));
    a.download = "terminations_" + (isCarmen ? "carmen" : "rudolph") + "_" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
  }

  // ── Insert / staging handlers ─────────────────────────────────────
  function onTermSave(data) {
    if (!data) return;
    setLocalPreTerm(prev => [...prev, {
      autoId: 5000 + prev.length,
      personIdno: data.person?.idCard || "",
      personName: data.person?.name || "",
      personSurname: data.person?.surname || "",
      reason: data.form.reason,
      genReason: data.form.genReason,
      terminationComments: data.form.terminationComments,
      terminationDate: data.form.terminationDate,
      sex: data.form.sex,
      officer,
      markForTermination: false,
    }]);
  }
  const onMarkPreTerm   = (autoId) => setLocalPreTerm(prev => prev.map(r => r.autoId===autoId ? {...r, markForTermination:true} : r));
  const onDeletePreTerm = (autoId) => setLocalPreTerm(prev => TERM_SVC.del_pre_termination(autoId, prev));
  function doBulkCommit() {
    const result = TERM_SVC.app_bulk_termination(officer, preTermData, localTerms);
    setLocalTerms(result.newTermData.slice(localTerms.length));
    setLocalPreTerm(prev => TERM_SVC.upd_mark_for_bulk_upload(officer, prev).filter(r => !r.markForTermination));
    result.newTermData.slice(localTerms.length).forEach(r => {
      setWorksTracker(prev => TERM_SVC.upd_works_done_termination(r.personIdno, prev));
    });
  }
  const markAllForBulk = () => setLocalPreTerm(prev => TERM_SVC.upd_mark_for_bulk_upload(officer, prev));

  return (
    <div className="page">
      {termModal  && window.PageForms && React.createElement(window.PageForms.TerminationModal,  {onClose:()=>setTermModal(false),  onSave:onTermSave, existingTermData:termData, officer})}
      {eocNrModal && window.PageForms && React.createElement(window.PageForms.EocNrModal,        {onClose:()=>setEocNrModal(false), onInsert:(row)=>setLocalEocNr(prev=>[...prev,row])})}
      {eocCgModal && window.PageForms && React.createElement(window.PageForms.EocCgModal,        {onClose:()=>setEocCgModal(false), onInsert:(row)=>setLocalEocCg(prev=>[...prev,row])})}
      {viewModal  && window.PageForms && React.createElement(window.PageForms.TermViewModal,     {records:viewModal.records, title:viewModal.title, onClose:()=>setViewModal(null)})}
      {selPreTerm && window.PageForms && React.createElement(window.PageForms.PreTerminationModal,{record:selPreTerm, onClose:()=>setSelPreTerm(null), onMark:onMarkPreTerm, onDelete:onDeletePreTerm})}

      <div className="page-head">
        <div>
          <div className="crumbs">Lifecycle · Terminations</div>
          <h1>Terminations — {isCarmen ? "Carmen Spiteri" : "Rudolph Farrugia"}</h1>
          <p className="page-sub">{isCarmen ? "Teaching staff" : "Non-teaching staff"} · resignations, retirements, end-of-contracts, dismissals.</p>
        </div>
      </div>

      {/* ── Action bar ── */}
      <div className="card" style={{marginBottom:12}}>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,padding:"12px 16px",alignItems:"center"}}>
          <button className="btn primary" onClick={()=>setTermModal(true)}>Insert Termination</button>
          <button className="btn" onClick={()=>setEocCgModal(true)}>Insert EOC — Change Grade</button>
          <button className="btn" onClick={()=>setEocNrModal(true)}>Insert EOC — Non Renewal</button>
          <span style={{flex:1}}/>
          <button className="btn" onClick={()=>handleAuditBtn("service")}>Without Service ID</button>
          <button className="btn" onClick={()=>handleAuditBtn("remarks")}>Without Remarks ID</button>
          <button className="btn" onClick={doExport}>Export CSV</button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="card" style={{marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px"}}>
          <span style={{fontSize:18,color:"var(--ink-3)"}}>🔍</span>
          <input
            className="input"
            placeholder="Search by ID card number or name…"
            value={caseSearch}
            onChange={e=>setCaseSearch(e.target.value)}
            style={{flex:1,maxWidth:400}}
            autoFocus
          />
          {caseSearch && <button className="btn" onClick={()=>setCaseSearch("")}>Clear</button>}
          {q && <span className="muted xs">{totalFound} record{totalFound!==1?"s":""} found</span>}
        </div>
      </div>

      {/* ── Empty state ── */}
      {!q && (
        <div className="card">
          <div style={{padding:"56px 24px",textAlign:"center",color:"var(--ink-3)"}}>
            <div style={{fontSize:40,marginBottom:14}}>📋</div>
            <div style={{fontWeight:600,fontSize:15,marginBottom:6}}>Search to view a case</div>
            <div className="xs">Enter an ID card number or name above to see all termination records for that person.<br/>Use <strong>Export CSV</strong> to download the full dataset.</div>
          </div>
        </div>
      )}

      {/* ── Case file ── */}
      {q && (
        <>
          {/* Termination Data */}
          <div className="card" style={{marginBottom:12}}>
            <div className="card-head">
              <h2>Termination_Data</h2>
              <div className="right muted xs">{caseTermRows.length} row{caseTermRows.length!==1?"s":""}</div>
            </div>
            {caseTermRows.length === 0
              ? <div className="muted xs" style={{padding:"14px 16px"}}>No termination records match this search.</div>
              : <div className="table-scroll"><table className="table compact">
                  <thead><tr>
                    <th>Person_idno</th><th>Name</th><th>Grade_Position</th><th>Sex</th>
                    <th>Reason</th><th>Gen_reason</th><th>Term. / Res.</th>
                    <th>Termination_Date</th><th>College</th>
                    <th>PRS_Rec_id</th><th>PRS_Rem_id</th><th>Sections_informed</th>
                  </tr></thead>
                  <tbody>
                    {caseTermRows.map(t=>(
                      <tr key={t.id} style={{cursor:"pointer"}} onClick={()=>setViewModal({
                        records:[{id:t.id, name:t.name, reason:t.reason, genReason:t.genReason,
                          terminationDate:t.terminationDate, sex:t.sex, college:t.college,
                          primarySecondary:t.primarySecondary, gradePosition:t.gradePosition,
                          comments:t.terminationComments||""}],
                        title:t.name+" — Termination record",
                      })}>
                        <td className="id">{t.personIdno}</td>
                        <td>{t.name}</td>
                        <td className="muted xs">{t.gradePosition}</td>
                        <td>{t.sex}</td>
                        <td>{t.reason}</td>
                        <td><span className="tag gray">{t.genReason}</span></td>
                        <td><span className={"tag "+(t.terminationResignation==="Termination"?"red":"amber")}>{t.terminationResignation}</span></td>
                        <td className="num">{t.terminationDate}</td>
                        <td className="muted xs">{t.college}</td>
                        <td className={"mono xs"+(!t.prsRecAutoId?" tag red":"")}>{t.prsRecAutoId||<span className="tag red">0</span>}</td>
                        <td className={"mono xs"+(!t.prsRemAutoId?" tag red":"")}>{t.prsRemAutoId||<span className="tag red">0</span>}</td>
                        <td>{t.sectionsInformed?<span className="check">✓</span>:<span className="tag amber">Pending</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
            }
          </div>

          {/* Pre-termination staging */}
          {casePreRows.length > 0 && (
            <div className="card" style={{marginBottom:12}}>
              <div className="card-head">
                <h2>Pre_Termination_data — staging</h2>
                <div className="right muted xs">{casePreRows.length} row{casePreRows.length!==1?"s":""}</div>
              </div>
              <table className="table compact">
                <thead><tr><th>Auto_ID</th><th>Person_idno</th><th>Name</th><th>Reason</th><th>Term. date</th><th>Sex</th><th>Marked</th></tr></thead>
                <tbody>
                  {casePreRows.map(r=>(
                    <tr key={r.autoId} style={{cursor:"pointer"}} onClick={()=>setSelPreTerm(r)}>
                      <td className="mono xs">{r.autoId}</td>
                      <td className="id">{r.personIdno}</td>
                      <td>{r.personName} {r.personSurname}</td>
                      <td>{r.reason}</td>
                      <td className="num">{r.terminationDate}</td>
                      <td>{r.sex}</td>
                      <td>{r.markForTermination?<span className="tag green">✓</span>:<span className="tag amber">No</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* EOC Non-Renewal */}
          {caseEocNrRows.length > 0 && (
            <div className="card" style={{marginBottom:12}}>
              <div className="card-head">
                <h2>End_of_contract_tbl</h2>
                <div className="right muted xs">{caseEocNrRows.length} row{caseEocNrRows.length!==1?"s":""}</div>
              </div>
              <table className="table compact">
                <thead><tr><th>Auto_id</th><th>Pers_IDNO</th><th>WEF_date</th><th>From_grade</th><th>To_grade</th><th>Reason</th><th>D_B_Name</th></tr></thead>
                <tbody>
                  {caseEocNrRows.map(e=>(
                    <tr key={e.autoId}>
                      <td className="mono xs">{e.autoId}</td><td className="id">{e.persIdno}</td>
                      <td className="num">{e.wefDate}</td><td className="muted xs">{e.fromGrade}</td>
                      <td className="muted xs">{e.toGrade||"—"}</td><td>{e.reason}</td><td className="muted xs">{e.dbName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* EOC Change of Grade */}
          {caseEocCgRows.length > 0 && (
            <div className="card" style={{marginBottom:12}}>
              <div className="card-head">
                <h2>End_of_Contract_Change_of_grade</h2>
                <div className="right muted xs">{caseEocCgRows.length} row{caseEocCgRows.length!==1?"s":""}</div>
              </div>
              <table className="table compact">
                <thead><tr><th>Auto_id</th><th>Pers_IDNO</th><th>WEF_date</th><th>From_grade</th><th>To_grade</th></tr></thead>
                <tbody>
                  {caseEocCgRows.map(e=>(
                    <tr key={e.autoId} className={e.wefDate>="2024-01-01"?"row-highlight":""}>
                      <td className="mono xs">{e.autoId}</td><td className="id">{e.persIdno}</td>
                      <td className="num">{e.wefDate}</td><td className="muted xs">{e.fromGrade}</td><td className="muted xs">{e.toGrade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Extensions */}
          {caseExtRows.length > 0 && (
            <div className="card" style={{marginBottom:12}}>
              <div className="card-head">
                <h2>Extensions</h2>
                <div className="right muted xs">{caseExtRows.length} row{caseExtRows.length!==1?"s":""}</div>
              </div>
              <table className="table compact">
                <thead><tr><th>Pers_idno</th><th>Name</th><th>DOB</th><th>DOR</th><th>Ext. days</th><th>Actual ret. date</th><th>Term done</th></tr></thead>
                <tbody>
                  {caseExtRows.map(e=>(
                    <tr key={e.persIdno}>
                      <td className="id">{e.persIdno}</td><td>{e.name}</td>
                      <td className="num">{e.dob}</td><td className="num">{e.dor}</td>
                      <td className="mono">{e.extInDays} days</td><td className="num">{e.actRetDate}</td>
                      <td>{e.terminationDone?<span className="tag green">Done</span>:<span className="tag amber">Open</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* No results at all */}
          {totalFound === 0 && (
            <div className="card">
              <div style={{padding:"32px 24px",textAlign:"center",color:"var(--ink-3)"}}>
                <div style={{fontWeight:600,marginBottom:4}}>No records found</div>
                <div className="xs">No termination data matches "<strong>{caseSearch}</strong>" across any table.</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// RECRUITMENT NON-TEACHING
// Tabs: Applications · Rankings · Recomendation · Accep/Ref · SRS
//       Person Details · Reports · Maintenance
// ─────────────────────────────────────────────────────────────────
function RecruitmentNonTeachingDeep() {
  const [tab, setTab] = useState("applications");

  // ── Applications ─────────────────────────────────────────────
  const [uploadedApps, setUploadedApps]       = useState([]);
  const [searchDesig,  setSearchDesig]         = useState("");
  const [searchTrade,  setSearchTrade]         = useState("");
  const [searchProfile,setSearchProfile]       = useState("");
  const [viewProfile,  setViewProfile]         = useState(null);

  // ── Rankings ─────────────────────────────────────────────────
  const [uploadedRankings, setUploadedRankings] = useState([]);

  // ── Recommendation ───────────────────────────────────────────
  const [recomProfile,    setRecomProfile]    = useState("");
  const [showResultSheet, setShowResultSheet] = useState(false);
  const [recruitedSet,    setRecruitedSet]    = useState(new Set());

  // ── Accep/Ref ─────────────────────────────────────────────────
  const [accepProfile,  setAccepProfile]  = useState("");
  const [emailSentSet,  setEmailSentSet]  = useState(new Set());
  const [chooserOpen,   setChooserOpen]   = useState(false);
  const [ntDecisions,   setNtDecisions]   = useState({}); // {profileId_idCard: {status, wef, salScale, school, comments}}
  const [ntAcceptForm,  setNtAcceptForm]  = useState(null); // {idCard, firstName, surname, category, rank, wef, salScale, comments}

  // ── SRS ───────────────────────────────────────────────────────
  const [srsMode,    setSrsMode]    = useState("profile");
  const [srsProfile, setSrsProfile] = useState("");

  // ── Non-teaching profiles from seed data ─────────────────────
  const ntCalls = (X?.APPLICATION_DETAILS || []).filter(a => a.teaching === 2);

  // ── Excel parse helpers ───────────────────────────────────────
  function parseExcel(file, onRows) {
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const wb = XLSX.read(ev.target.result, {type:"binary"});
        const ws = wb.Sheets[wb.SheetNames[0]];
        onRows(XLSX.utils.sheet_to_json(ws, {defval:""}));
      } catch(e) { alert("Could not parse file: " + e.message); }
    };
    reader.readAsBinaryString(file);
  }

  function handleAppsUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    parseExcel(file, rows => {
      const apps = rows.map(r => ({
        idCard:    r.PersonIDNO   || r.ID_Card || r["ID Card"] || r["ID card number"] || "",
        firstName: r.PersonName   || r.Name    || "",
        surname:   r.PersonSurname|| r.Surname || "",
        appDate:   r.Application_Date || r["Application Date"] || "",
        status:    r.Status       || "",
        result:    r.Result       || "",
        category:  r.Category     || "",
        profileId: r.Job_Profile  || r.Profile_ID || r["Profile ID"] || "",
        designation: r.Designation || "",
        trade:     r.Trade_of_Profession || r["Trade of Profession"] || "",
        callOpens: r.Call_Opens || r["Call Opens"] || "",
        callCloses:r["Call-Closes"] || r["Call Closes"] || "",
        fileNo:    r.File_number  || r["File Number"] || "",
        reference: r.Reference    || "",
        pubDate:   r.Pub_date     || r["Pub Date"] || "",
        resultDate:r.Result_date  || r["Result Date"] || "",
        validFor:  r.Valid_for    || r["Valid For"]  || "0",
      })).filter(r => r.idCard || r.profileId);
      setUploadedApps(apps);
    });
    e.target.value = "";
  }

  function handleRankingsUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    parseExcel(file, rows => {
      const rankings = rows.map(r => ({
        idCard:    r.PersonIDNO || r.ID_Card || r["ID Card"] || "",
        firstName: r.PersonName  || r.Name  || "",
        surname:   r.PersonSurname || r.Surname || "",
        profileId: r.Job_Profile || r.Profile_ID || r["Profile ID"] || "",
        rank:      r.Ranking     || r.Rank  || "",
        mark:      r.Ranking_Mark || r.Mark || "",
        category:  r.Category    || "",
        recomend:  !!(r.Recomend || r.Recommend || r.recomend),
        emailSent: !!(r.Email_Sent || r.email_sent),
      })).filter(r => r.idCard);
      setUploadedRankings(rankings);
    });
    e.target.value = "";
  }

  // ── Derived data ─────────────────────────────────────────────
  const allProfiles = useMemo(() => {
    const fromApps  = [...new Set(uploadedApps.map(a => a.profileId).filter(Boolean))];
    const fromCalls = ntCalls.map(a => String(a.jobProfileNumber));
    return [...new Set([...fromApps, ...fromCalls])].sort();
  }, [uploadedApps, ntCalls.length]);

  function getProfileMeta(profileId) {
    const seed = ntCalls.find(a => String(a.jobProfileNumber) === String(profileId));
    const app0 = uploadedApps.find(a => a.profileId === profileId);
    return {
      profileId,
      designation: app0?.designation || seed?.jobTitle || "",
      trade:       app0?.trade       || seed?.subject   || "",
      callOpens:   app0?.callOpens   || seed?.publicationDate || "",
      callCloses:  app0?.callCloses  || seed?.closingDate     || "",
      fileNo:      app0?.fileNo      || seed?.fileNumber      || "",
      reference:   app0?.reference   || seed?.hrPlanRef       || "",
      pubDate:     app0?.pubDate     || seed?.publicationDate || "",
      resultDate:  app0?.resultDate  || seed?.resultDate      || "",
      validFor:    app0?.validFor    || seed?.validFor        || "0",
      resultExpDate: seed?.resultExpDate || "",
    };
  }

  function getAppsForProfile(profileId) {
    const fromUpload = uploadedApps.filter(a => a.profileId === profileId);
    if (fromUpload.length) return fromUpload;
    return (X?.PERSONS_APPLICATIONS || []).filter(a => a.profileId === profileId);
  }

  function getRankingsForProfile(profileId) {
    const fromUpload = uploadedRankings.filter(r => r.profileId === profileId);
    if (fromUpload.length) return fromUpload;
    return (X?.PRESONS_RANKING||[])
      .filter(r => String(r.jobProfileNumber) === String(profileId))
      .map(r => ({
        idCard: r.idCardNo, firstName: r.name, surname: "",
        rank: r.ranking, mark: r.mark, category: r.category || "",
        recomend: !!(r.recomend || r.recommended),
        profileId,
      }));
  }

  function doView() {
    const pid = searchProfile ||
      (searchDesig || searchTrade
        ? (() => {
            const hit = ntCalls.find(a =>
              (!searchDesig || a.jobTitle === searchDesig) &&
              (!searchTrade  || a.subject  === searchTrade)
            );
            return hit ? String(hit.jobProfileNumber) : null;
          })()
        : null);
    if (pid) setViewProfile(pid);
    else alert("No matching profile found.");
  }

  function doPrint(contentHtml) {
    const w = window.open("","_blank","width=800,height=900");
    w.document.write(`<!doctype html><html><head><title>Recruitment Letter</title>
      <style>body{font-family:Georgia,serif;padding:60px;max-width:700px;margin:0 auto;font-size:14px;line-height:1.7}
      h3{text-align:center;margin-bottom:24px}.sig{margin-top:80px}.line{border-top:1px solid #000;display:inline-block;min-width:240px;margin-top:60px}</style>
      </head><body>${contentHtml}
      <script>window.onload=function(){window.print();window.close();}<\/script>
      </body></html>`);
    w.document.close();
  }

  // ── SRS export ────────────────────────────────────────────────
  function doSrsExport() {
    if (typeof XLSX === "undefined") { alert("XLSX library not loaded. Check your network connection."); return; }
    let recruits = [];
    const accepted = (uploadedApps.length ? uploadedApps : (X?.PERSONS_APPLICATIONS || []))
      .filter(a => (a.status||"").toLowerCase().includes("accept"));
    if (srsMode === "profile") {
      if (!srsProfile) { alert("Select a profile first."); return; }
      recruits = accepted.filter(a => a.profileId === srsProfile);
    } else {
      recruits = accepted;
    }
    if (!recruits.length) { alert("No accepted recruits found."); return; }
    const headers = ["ID Card","First Name","Surname","Application Date","Status","Profile ID","Designation","Trade of Profession","Category"];
    const dataRows = recruits.map(r => [
      r.idCard || r.idcard || "",
      r.firstName || r.name || "",
      r.surname || "",
      r.appDate || r.submittedOn || "",
      r.status || "",
      r.profileId || "",
      r.designation || "",
      r.trade || "",
      r.category || "",
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SRS_Recruits");
    XLSX.writeFile(wb, `SRS_Recruits_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  // ── Tabs ──────────────────────────────────────────────────────
  const TABS = [
    {id:"applications", label:"Applications"},
    {id:"rankings",     label:"Rankings"},
    {id:"recomendation",label:"Recomendation"},
    {id:"accep-ref",    label:"Accep/Ref"},
    {id:"srs",          label:"SRS"},
  ];

  const FLD = {display:"grid", gridTemplateColumns:"185px 1fr", alignItems:"center", gap:"8px"};
  const CARD = {padding:"20px"};

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumbs">Recruitment · Non-Teaching</div>
          <h1>Recruitment Non Teaching</h1>
        </div>
      </div>
      <div className="tabs scrolly">
        {TABS.map(t => (
          <div key={t.id} className={"tab "+(tab===t.id?"active":"")} onClick={()=>setTab(t.id)}>{t.label}</div>
        ))}
      </div>

      {/* ═══ APPLICATIONS ═══════════════════════════════════════ */}
      {tab === "applications" && (
        <div style={{padding:"16px", display:"flex", flexDirection:"column", gap:"16px"}}>
          {/* Upload bar */}
          <div className="card" style={{padding:"14px 20px", display:"flex", gap:"14px", alignItems:"center", flexWrap:"wrap"}}>
            <label className="btn primary" style={{cursor:"pointer"}}>
              Upload Applications from Excel
              <input type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={handleAppsUpload}/>
            </label>
            <button className="btn" onClick={()=>downloadAppsTemplate("non-teaching")}>↓ Download template</button>
            {uploadedApps.length > 0 &&
              <span className="tag green">{uploadedApps.length} rows loaded ({[...new Set(uploadedApps.map(a=>a.profileId).filter(Boolean))].length} profiles)</span>}
          </div>

          {/* Search panel (only when not viewing a result) */}
          {!viewProfile && (
            <div className="card" style={{maxWidth:"520px", margin:"0 auto", width:"100%", ...CARD}}>
              <h3 style={{textAlign:"center", fontWeight:600, marginBottom:"22px", fontSize:"1.05rem"}}>View Applications</h3>
              <div style={{display:"flex", flexDirection:"column", gap:"14px"}}>
                <div style={FLD}>
                  <label style={{textAlign:"right", fontWeight:500}}>Select Designation:</label>
                  <select className="input" value={searchDesig} onChange={e=>setSearchDesig(e.target.value)}>
                    <option value=""></option>
                    {[...new Set(ntCalls.map(a=>a.jobTitle))].sort().map(d=>(
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div style={FLD}>
                  <label style={{textAlign:"right", fontWeight:500}}>Select Trade of Profession:</label>
                  <select className="input" value={searchTrade} onChange={e=>setSearchTrade(e.target.value)}>
                    <option value=""></option>
                    {[...new Set(ntCalls.map(a=>a.subject).filter(Boolean))].sort().map(t=>(
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div style={{textAlign:"center", fontWeight:700, fontSize:"0.9rem"}}>OR</div>
                <div style={FLD}>
                  <label style={{textAlign:"right", fontWeight:500}}>Profile ID:</label>
                  <select className="input" value={searchProfile} onChange={e=>setSearchProfile(e.target.value)}>
                    <option value=""></option>
                    {allProfiles.map(p=>(
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div style={{display:"flex", gap:"12px", justifyContent:"center", marginTop:"8px"}}>
                  <button className="btn primary" onClick={doView}>View</button>
                  <button className="btn" onClick={()=>{setSearchDesig("");setSearchTrade("");setSearchProfile("");}}>Close</button>
                </div>
              </div>
            </div>
          )}

          {/* Application details report */}
          {viewProfile && (() => {
            const meta  = getProfileMeta(viewProfile);
            const apps  = getAppsForProfile(viewProfile);
            const title = [meta.designation, meta.trade ? "IN THE " + meta.trade.toUpperCase() : ""].filter(Boolean).join("  ");
            return (
              <div className="card" style={{padding:0, overflow:"hidden"}}>
                <div style={{background:"#dce8ff", padding:"16px 24px"}}>
                  <h3 style={{textAlign:"center", fontWeight:700, marginBottom:"16px", textTransform:"uppercase", fontSize:"0.95rem"}}>
                    {title}
                  </h3>
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 40px", fontSize:"0.875rem"}}>
                    <div><strong>Profile No:</strong> {meta.profileId}</div>
                    <div><strong>Reference:</strong> {meta.reference}</div>
                    <div><strong>Designation:</strong> {meta.designation}</div>
                    <div><strong>File Number:</strong> {meta.fileNo}</div>
                    <div><strong>Trade of Profession:</strong> {meta.trade}</div>
                    <div><strong>Publication Date:</strong> {meta.pubDate}</div>
                    <div><strong>Call Opens:</strong> {meta.callOpens}</div>
                    <div><strong>Result Date:</strong> {meta.resultDate ? `(Valid for ${meta.validFor} years)` : ""}</div>
                    <div><strong>Call Closes:</strong> {meta.callCloses}</div>
                    <div><strong>Result expires on:</strong> {meta.resultExpDate}</div>
                  </div>
                </div>
                <table className="table compact">
                  <thead><tr>
                    <th>ID card number</th>
                    <th>Name and Surname</th>
                    <th>Application Date</th>
                    <th>Status</th>
                    <th>Result</th>
                    <th>Category</th>
                  </tr></thead>
                  <tbody>
                    {apps.map((a, i) => (
                      <tr key={i}>
                        <td className="id">{a.idCard || a.idcard}</td>
                        <td>{[a.firstName||a.name, a.surname].filter(Boolean).join("  ")}</td>
                        <td className="num">{a.appDate || a.submittedOn}</td>
                        <td><span className="tag gray">{a.status}</span></td>
                        <td>{a.result || ""}</td>
                        <td>{a.category || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{background:"#dce8ff", padding:"10px 24px", textAlign:"center", fontWeight:600, fontSize:"0.9rem"}}>
                  Total number of applications = {apps.length}
                </div>
                <div style={{padding:"6px 24px", textAlign:"center", color:"var(--muted)", fontSize:"0.8rem"}}>Page 1</div>
                <div style={{padding:"12px 24px", borderTop:"1px solid var(--line-2)", display:"flex", gap:"10px"}}>
                  <button className="btn" onClick={()=>setViewProfile(null)}>← Back to search</button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ═══ RANKINGS ════════════════════════════════════════════ */}
      {tab === "rankings" && (
        <div style={{padding:"16px", display:"flex", flexDirection:"column", gap:"16px"}}>
          <div className="card" style={{padding:"14px 20px", display:"flex", gap:"14px", alignItems:"center", flexWrap:"wrap"}}>
            <label className="btn primary" style={{cursor:"pointer"}}>
              Upload Rankings from Excel
              <input type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={handleRankingsUpload}/>
            </label>
            <button className="btn" onClick={()=>downloadRankingsTemplate("non-teaching")}>↓ Download template</button>
            {uploadedRankings.length > 0 &&
              <span className="tag green">{uploadedRankings.length} ranking rows loaded</span>}
          </div>
          {uploadedRankings.length > 0 ? (
            <div className="card">
              <div className="card-head"><h2>Uploaded Rankings</h2></div>
              <table className="table compact">
                <thead><tr>
                  <th className="right">Rank</th><th>Profile</th><th>ID Card</th>
                  <th>Name</th><th className="right">Mark</th><th>Category</th><th>Recommend</th>
                </tr></thead>
                <tbody>
                  {uploadedRankings.map((r, i) => (
                    <tr key={i}>
                      <td className="num right mono"><strong>{r.rank}</strong></td>
                      <td className="mono xs">{r.profileId}</td>
                      <td className="id">{r.idCard}</td>
                      <td>{[r.firstName, r.surname].filter(Boolean).join(" ")}</td>
                      <td className="num right mono">{r.mark}</td>
                      <td className="mono">{r.category}</td>
                      <td>{r.recomend ? <span className="tag green">Yes</span> : <span className="muted">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card" style={{padding:"40px", textAlign:"center"}}>
              <div className="muted">No rankings uploaded yet.</div>
              <div className="muted xs" style={{marginTop:"8px"}}>Expected columns: PersonIDNO, PersonName, PersonSurname, Job_Profile, Ranking_Mark, Category, Recomend</div>
            </div>
          )}
        </div>
      )}

      {/* ═══ RECOMENDATION ═══════════════════════════════════════ */}
      {tab === "recomendation" && (() => {
        const meta        = recomProfile ? getProfileMeta(recomProfile) : null;
        const allRankRows = recomProfile ? getRankingsForProfile(recomProfile) : [];
        const recomRows   = allRankRows.filter(r => r.recomend);
        const ntProfileIds= ntCalls.map(a => String(a.jobProfileNumber));
        const curIdx      = ntProfileIds.indexOf(String(recomProfile));

        // Join recomRows with application data by idCard
        const resultRows = recomRows.map(r => {
          const app = getAppsForProfile(recomProfile).find(a =>
            (a.idCard||a.idcard||"").toLowerCase() === (r.idCard||"").toLowerCase()
          );
          return { ...r, appDate: app?.appDate||app?.submittedOn||"", appStatus: app?.status||"" };
        });

        // Recruited persons for this profile
        const recruitedForProfile = resultRows.filter(r => recruitedSet.has(recomProfile + "_" + r.idCard));

        function doGenerateLetter() {
          if (!recruitedForProfile.length) { alert("No recruits selected yet. Click Recruit on at least one person."); return; }
          const d = meta?.designation || "";
          const t = meta?.trade || "";
          const ref = meta?.reference || "";
          const today = new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
          const listHtml = recruitedForProfile.map((r,i) =>
            `<tr><td style="padding:4px 12px 4px 0">${i+1}.</td><td style="padding:4px 20px 4px 0"><strong>${[r.firstName,r.surname].filter(Boolean).join(" ")}</strong></td><td style="padding:4px 20px 4px 0">${r.idCard}</td><td style="padding:4px 0">${r.category||""}</td></tr>`
          ).join("");
          doPrint(`
            <div style="text-align:right;margin-bottom:20px">${today}</div>
            ${ref?`<div style="margin-bottom:16px">Ref: ${ref}</div>`:""}
            <h3 style="text-align:center;margin-bottom:24px;font-size:15px">
              APPOINTMENT — ${d.toUpperCase()}${t?" ("+t.toUpperCase()+")":""}
            </h3>
            <p>Following the selection process conducted for the post of <strong>${d}</strong>${t?" ("+t+")":""}, the following candidates have been recommended for appointment:</p>
            <table style="margin:20px 0;border-collapse:collapse">${listHtml}</table>
            <p>The above-named persons are requested to report for duty at the designated venue as communicated by their respective College/Department. Their appointments will be subject to the terms and conditions of the Public Administration Act and applicable Collective Agreements.</p>
            <p>Each appointee is required to confirm their acceptance of this appointment within five (5) working days from the date of this letter.</p>
            <div class="sig">
              <p>Yours sincerely,</p>
              <div class="line"></div><br/>
              <strong>Permanent Secretary</strong><br/>
              <span style="font-size:13px">Ministry for Education, Sport, Youth, Research and Innovation</span>
            </div>
          `);
        }

        return (
          <div style={{padding:"16px", display:"flex", flexDirection:"column", gap:"16px"}}>
            {/* Control card */}
            <div className="card" style={CARD}>
              <div style={{display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px", flexWrap:"wrap"}}>
                <label style={{fontWeight:600}}>Profile No:</label>
                <input className="input" style={{width:"130px"}} value={recomProfile}
                  onChange={e=>{setRecomProfile(e.target.value);setShowResultSheet(false);}}
                  placeholder="e.g. 4782"/>
              </div>
              {meta && (
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"16px", fontSize:"0.9rem"}}>
                  <div><strong>Designation :</strong><span style={{marginLeft:"10px"}}>{meta.designation}</span></div>
                  <div><strong>Trade of Profession :</strong><span style={{marginLeft:"10px"}}>{meta.trade}</span></div>
                </div>
              )}
              <div style={{display:"flex", gap:"10px", flexWrap:"wrap", alignItems:"center"}}>
                <button className="btn" onClick={()=>{
                  const keys = recomRows.map(r => recomProfile + "_" + r.idCard);
                  setRecruitedSet(prev => { const n=new Set(prev); keys.forEach(k=>n.delete(k)); return n; });
                }}>
                  Clear {recomProfile||"—"}/{recomRows.length}
                </button>
                <button className="btn" onClick={()=>{
                  const next = ntProfileIds[(curIdx+1) % Math.max(ntProfileIds.length,1)];
                  setRecomProfile(next||""); setShowResultSheet(false);
                }}>Next</button>
                {recomProfile && (
                  <button className="btn" onClick={()=>{setViewProfile(recomProfile);setTab("applications");}}>
                    View {recomProfile}
                  </button>
                )}
                {recomProfile && (
                  <button className={"btn " + (showResultSheet?"":"primary")}
                    onClick={()=>setShowResultSheet(v=>!v)}>
                    {showResultSheet ? "Hide Result Sheet" : "View Result Sheet"}
                  </button>
                )}
                {recruitedForProfile.length > 0 && (
                  <button className="btn primary" onClick={doGenerateLetter}>
                    Generate Letter ({recruitedForProfile.length})
                  </button>
                )}
              </div>
            </div>

            {/* Result Sheet — shown when toggled */}
            {showResultSheet && recomProfile && (
              <div className="card">
                <div className="card-head">
                  <h2>Result Sheet — Profile {recomProfile}</h2>
                  <div className="right muted xs">{recomRows.length} of {allRankRows.length} recommended</div>
                </div>
                {resultRows.length > 0 ? (
                  <table className="table compact">
                    <thead><tr>
                      <th className="right">Rank</th>
                      <th>ID Card</th>
                      <th>Name</th>
                      <th>App Date</th>
                      <th>App Status</th>
                      <th className="right">Mark</th>
                      <th>Category</th>
                      <th>Recruit</th>
                    </tr></thead>
                    <tbody>
                      {resultRows.map((r, i) => {
                        const key = recomProfile + "_" + r.idCard;
                        const recruited = recruitedSet.has(key);
                        return (
                          <tr key={i} style={recruited ? {background:"var(--green-bg,#f0faf4)"} : {}}>
                            <td className="num right mono"><strong>{r.rank}</strong></td>
                            <td className="id">{r.idCard}</td>
                            <td>{[r.firstName, r.surname].filter(Boolean).join(" ")}</td>
                            <td className="num">{r.appDate}</td>
                            <td><span className="tag gray">{r.appStatus}</span></td>
                            <td className="num right mono">{r.mark}</td>
                            <td className="mono">{r.category}</td>
                            <td>
                              {recruited
                                ? <span className="tag green">Recruited ✓</span>
                                : <button className="btn primary" style={{fontSize:"0.8rem",padding:"4px 12px"}}
                                    onClick={()=>setRecruitedSet(prev=>new Set([...prev,key]))}>Recruit</button>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div style={{padding:"32px", textAlign:"center", color:"var(--muted)"}}>
                    No recommended candidates for profile {recomProfile}. Upload rankings with Recomend=true rows.
                  </div>
                )}
                {recruitedForProfile.length > 0 && (
                  <div style={{padding:"12px 16px", borderTop:"1px solid var(--line-2)", display:"flex", alignItems:"center", gap:"14px"}}>
                    <span className="muted xs">{recruitedForProfile.length} person(s) marked for recruitment</span>
                    <button className="btn primary" onClick={doGenerateLetter}>
                      Generate Letter for All Recruited
                    </button>
                  </div>
                )}
              </div>
            )}

            {recomProfile && !showResultSheet && recomRows.length === 0 && (
              <div className="card" style={{padding:"28px", textAlign:"center", color:"var(--muted)"}}>
                No recommended candidates for profile {recomProfile}. Upload rankings or click <strong>View Result Sheet</strong> to see the full list.
              </div>
            )}
          </div>
        );
      })()}

      {/* ═══ ACCEP/REF ═══════════════════════════════════════════ */}
      {tab === "accep-ref" && (
        <div style={{padding:"16px"}}>
          <div className="card" style={{...CARD, maxWidth:"580px", margin:"0 auto", position:"relative"}}>
            {accepProfile && !emailSentSet.has(accepProfile) && (
              <div style={{color:"#c0392b", fontWeight:600, textAlign:"right", marginBottom:"12px", fontSize:"0.9rem"}}>
                No acceptance Forms E-Mailed
              </div>
            )}
            <div style={{...FLD, marginBottom:"16px"}}>
              <label style={{textAlign:"right", fontWeight:600}}>Select Profile Number :</label>
              <select className="input" value={accepProfile} onChange={e=>setAccepProfile(e.target.value)}>
                <option value=""></option>
                {allProfiles.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            {accepProfile && (() => {
              const meta = getProfileMeta(accepProfile);
              return (
                <>
                  <div style={{paddingLeft:"193px", display:"flex", flexDirection:"column", gap:"8px", marginBottom:"20px", fontSize:"0.9rem"}}>
                    <div><strong>Designation :</strong><span style={{marginLeft:"10px"}}>{meta.designation}</span></div>
                    <div><strong>Trade of Profession :</strong><span style={{marginLeft:"10px"}}>{meta.trade}</span></div>
                  </div>
                  <div style={{display:"flex", gap:"10px", justifyContent:"center", flexWrap:"wrap"}}>
                    <button className="btn" onClick={()=>setEmailSentSet(prev=>{const n=new Set(prev);n.delete(accepProfile);return n;})}>
                      Mark as e-mail not sent
                    </button>
                    <button className="btn primary" onClick={()=>{
                      setEmailSentSet(prev=>new Set([...prev,accepProfile]));
                      alert("Acceptance emails marked as sent for profile " + accepProfile);
                    }}>
                      E-Mail Acceptance Forms
                    </button>
                    <button className="btn" disabled={!emailSentSet.has(accepProfile)} onClick={()=>setChooserOpen(true)}>
                      Choose Accept/Refuse
                    </button>
                  </div>
                  {emailSentSet.has(accepProfile) && (
                    <div style={{marginTop:"14px", textAlign:"center"}}>
                      <span className="tag green">✓ Acceptance Forms E-Mailed</span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* ── Accept/Refuse chooser modal ─────────────────────── */}
          {chooserOpen && accepProfile && (() => {
            const meta = getProfileMeta(accepProfile);
            const candidates = uploadedRankings
              .filter(r => r.profileId === accepProfile)
              .filter(r => recruitedSet.has(accepProfile + "_" + r.idCard))
              .sort((a,b)=>(Number(a.rank)||0)-(Number(b.rank)||0));
            const decideRefuse = (cand) => {
              const key = accepProfile + "_" + cand.idCard;
              setNtDecisions(prev => ({...prev, [key]: {status:"Refused", profileId:accepProfile, idCard:cand.idCard, firstName:cand.firstName, surname:cand.surname, category:cand.category}}));
              try { window.dispatchEvent(new CustomEvent("toast", {detail:`${cand.firstName||""} ${cand.surname||""} (${cand.idCard}) marked Refused.`})); } catch {}
            };
            const openAccept = (cand) => {
              setNtAcceptForm({idCard:cand.idCard, firstName:cand.firstName, surname:cand.surname, category:cand.category, rank:cand.rank, wef:new Date().toISOString().slice(0,10), salScale:cand.salScale||"15/1", school:"", comments:""});
            };
            const saveAccept = () => {
              const f = ntAcceptForm;
              if (!f || !f.wef || !f.salScale) return;
              const key = accepProfile + "_" + f.idCard;
              setNtDecisions(prev => ({...prev, [key]: {status:"Accepted (Full Time)", profileId:accepProfile, idCard:f.idCard, firstName:f.firstName, surname:f.surname, category:f.category, wef:f.wef, salScale:f.salScale, school:f.school, comments:f.comments}}));
              if (typeof window.addRecruitmentHire === "function") {
                window.addRecruitmentHire({
                  idCard:      f.idCard,
                  firstName:   f.firstName,
                  surname:     f.surname,
                  category:    f.category,
                  designation: meta.designation || "Non-Teaching",
                  position:    meta.designation || "Non-Teaching",
                  salScale:    f.salScale,
                  wef:         f.wef,
                  school:      f.school,
                  comments:    f.comments,
                });
              }
              setNtAcceptForm(null);
            };
            return (
              <div style={{position:"fixed",inset:0,background:"rgba(10,0,20,.45)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>{setChooserOpen(false);setNtAcceptForm(null);}}>
                <div className="card" style={{width:780,maxWidth:"95vw",maxHeight:"90vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}>
                  <div className="card-head">
                    <h2>Accept / Refuse — Profile {accepProfile}</h2>
                    <div className="right muted xs">{meta.designation}{meta.trade?" · "+meta.trade:""}</div>
                  </div>
                  <div className="muted xs" style={{padding:"6px 16px",borderBottom:"1px solid var(--line-2)"}}>
                    Mark each candidate as Accepted or Refused. <strong>Accepting</strong> auto-creates a PRS record.
                  </div>
                  <table className="table compact">
                    <thead><tr><th className="right">Rank</th><th>ID Card</th><th>Name</th><th>Cat</th><th>Decision</th><th></th></tr></thead>
                    <tbody>{candidates.length>0 ? candidates.map(c => {
                      const key = accepProfile + "_" + c.idCard;
                      const dec = ntDecisions[key];
                      return (
                        <tr key={c.idCard+"_"+c.rank}>
                          <td className="num right mono"><strong>{c.rank}</strong></td>
                          <td className="id">{c.idCard}</td>
                          <td>{[c.firstName,c.surname].filter(Boolean).join(" ")||<span className="muted">—</span>}</td>
                          <td className="mono xs">{c.category||"—"}</td>
                          <td>
                            {dec?.status==="Accepted (Full Time)" ? <span className="tag green">✓ Accepted</span>
                             : dec?.status==="Refused" ? <span className="tag red">✕ Refused</span>
                             : <span className="muted xs">Pending</span>}
                          </td>
                          <td style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
                            <button type="button" className="btn xs btn-red" onClick={()=>decideRefuse(c)}>Refuse</button>
                            <button type="button" className="btn xs btn-green" onClick={()=>openAccept(c)}>Accept…</button>
                          </td>
                        </tr>
                      );
                    }) : <tr><td colSpan={6} className="muted" style={{padding:"16px",textAlign:"center"}}>No recruited candidates for this profile yet. Go to the <strong>Recomendation</strong> tab first and click <strong>Recruit</strong> on the recommended candidates.</td></tr>}</tbody>
                  </table>
                  {ntAcceptForm && (
                    <div style={{borderTop:"2px solid var(--primary)",padding:"14px 18px",background:"var(--primary-bg-2)"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                        <strong>Accept</strong>
                        <span>{ntAcceptForm.firstName} {ntAcceptForm.surname}</span>
                        <span className="id mono">{ntAcceptForm.idCard}</span>
                        <span className="muted xs">· Rank {ntAcceptForm.rank}</span>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                        <div className="form-row" style={{gridTemplateColumns:"120px 1fr",margin:0}}><label>WEF Date</label><input type="date" className="input" title="WEF Date" value={ntAcceptForm.wef} onChange={e=>setNtAcceptForm(f=>({...f,wef:e.target.value}))}/></div>
                        <div className="form-row" style={{gridTemplateColumns:"120px 1fr",margin:0}}><label>Salary Scale</label><input className="input" title="Salary Scale" placeholder="e.g. 15/1" value={ntAcceptForm.salScale} onChange={e=>setNtAcceptForm(f=>({...f,salScale:e.target.value}))}/></div>
                        <div className="form-row" style={{gridTemplateColumns:"120px 1fr",margin:0,gridColumn:"span 2"}}><label>School / College</label>
                          <select className="input" title="School / College" value={ntAcceptForm.school} onChange={e=>setNtAcceptForm(f=>({...f,school:e.target.value}))}>
                            <option value=""/>{(X?.COLLEGES_LIST||[]).map(c=><option key={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="form-row top" style={{gridTemplateColumns:"120px 1fr",margin:0,gridColumn:"span 2"}}><label>Comments</label><textarea className="input" rows={2} title="Comments" style={{resize:"vertical"}} value={ntAcceptForm.comments} onChange={e=>setNtAcceptForm(f=>({...f,comments:e.target.value}))}/></div>
                      </div>
                      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                        <button type="button" className="btn" onClick={()=>setNtAcceptForm(null)}>Cancel</button>
                        <button type="button" className="btn btn-green" disabled={!ntAcceptForm.wef||!ntAcceptForm.salScale} onClick={saveAccept}>✓ Confirm Accept → create PRS</button>
                      </div>
                    </div>
                  )}
                  <div className="card-foot">
                    <span className="muted xs">{Object.values(ntDecisions).filter(d=>d.profileId===accepProfile&&d.status==="Accepted (Full Time)").length} accepted · {Object.values(ntDecisions).filter(d=>d.profileId===accepProfile&&d.status==="Refused").length} refused</span>
                    <button type="button" className="btn" onClick={()=>{setChooserOpen(false);setNtAcceptForm(null);}}>Close</button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ═══ SRS ═════════════════════════════════════════════════ */}
      {tab === "srs" && (
        <div style={{padding:"16px"}}>
          <div className="card" style={{...CARD, maxWidth:"480px", margin:"0 auto"}}>
            <div style={{fontWeight:600, marginBottom:"14px"}}>Type of Excel Sheet</div>
            <div style={{border:"1px solid var(--line-2)", borderRadius:"4px", padding:"16px", display:"flex", flexDirection:"column", gap:"16px"}}>
              <label style={{display:"flex", alignItems:"center", gap:"10px"}}>
                <input type="radio" name="srs-mode" value="profile" checked={srsMode==="profile"} onChange={()=>setSrsMode("profile")}/>
                <span>Select Profile ID :</span>
                <select className="input" style={{flex:1}} value={srsProfile} onChange={e=>setSrsProfile(e.target.value)}
                  disabled={srsMode!=="profile"}>
                  <option value=""></option>
                  {allProfiles.map(p=>(
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
              <div style={{height:"1px", background:"var(--line-2)"}}></div>
              <label style={{display:"flex", alignItems:"center", gap:"10px"}}>
                <input type="radio" name="srs-mode" value="all" checked={srsMode==="all"} onChange={()=>setSrsMode("all")}/>
                <span>All Accepted Recruits</span>
              </label>
            </div>
            <div style={{marginTop:"20px", textAlign:"center"}}>
              <button className="btn primary" onClick={doSrsExport}>Export to Desktop as Excel</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PERSON DETAILS ══════════════════════════════════════ */}
      {tab === "person-details" && (
        <div style={{padding:"16px"}}>
          <div className="card" style={{...CARD, textAlign:"center", color:"var(--muted)"}}>
            Person details — links to CustomerDetails_tbl for each applicant. Select a profile from Applications to drill in.
          </div>
        </div>
      )}

      {/* ═══ REPORTS ═════════════════════════════════════════════ */}
      {tab === "reports" && (
        <div style={{padding:"16px"}}>
          <div className="card" style={{...CARD, textAlign:"center", color:"var(--muted)"}}>Reports module</div>
        </div>
      )}

      {/* ═══ MAINTENANCE ═════════════════════════════════════════ */}
      {tab === "maintenance" && (
        <div style={{padding:"16px"}}>
          <div className="card" style={{...CARD, textAlign:"center", color:"var(--muted)"}}>Maintenance — lookup tables and status management</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// RECRUITMENT TEACHING
// Tabs: Applications · Rankings · Recruitment · SRS · Person Details · Reports-1 · Reports-2
// ─────────────────────────────────────────────────────────────────
function RecruitmentTeachingDeep() {
  const [tab, setTab] = useState("applications");

  // ── Applications ──────────────────────────────────────────────
  const [uploadedApps,  setUploadedApps]  = useState([]);
  const [searchDesig,   setSearchDesig]   = useState("");
  const [searchTrade,   setSearchTrade]   = useState("");
  const [searchProfile, setSearchProfile] = useState("");
  const [viewProfile,   setViewProfile]   = useState(null);

  // ── Rankings ──────────────────────────────────────────────────
  const [uploadedRankings, setUploadedRankings] = useState([]);
  const [revisedRankings,  setRevisedRankings]  = useState([]);

  // ── Recruitment ───────────────────────────────────────────────
  const [recrProfile, setRecrProfile] = useState("");
  const [acceptModal, setAcceptModal] = useState(null);
  const [acceptForm,  setAcceptForm]  = useState({status:"", wef:"", school:"", salScale:"", comments:""});
  const [recruitedMap,setRecruitedMap]= useState({});
  const [emailSentSet,setEmailSentSet]= useState(new Set());
  const [hrPlanLocal, setHrPlanLocal] = useState((X?.HR_PLAN_ROWS) || []);

  // ── SRS ───────────────────────────────────────────────────────
  const [srsMode,    setSrsMode]    = useState("profile");
  const [srsProfile, setSrsProfile] = useState("");
  const [srsCat,     setSrsCat]     = useState("");

  // ── Seed data ─────────────────────────────────────────────────
  const tCalls        = X?.TEACHING_APP_DETAILS || [];
  const tRankings     = X?.TEACHING_RANKINGS    || [];
  const acceptStatuses= X?.ACCEPTANCE_STATUS    || [];

  // ── Excel helpers ─────────────────────────────────────────────
  function parseExcel(file, cb) {
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const wb = XLSX.read(ev.target.result, {type:"binary"});
        cb(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {defval:""}));
      } catch(e) { alert("Could not parse: " + e.message); }
    };
    reader.readAsBinaryString(file);
  }

  function handleAppsUpload(e) {
    const file = e.target.files[0]; if (!file) return;
    parseExcel(file, rows => {
      setUploadedApps(rows.map(r => ({
        idCard:      r.PersonIDNO || r.ID_Card || r["ID Card"] || "",
        firstName:   r.PersonName || r.Name || "",
        surname:     r.PersonSurname || r.Surname || "",
        appDate:     r.Application_Date || r["Application Date"] || "",
        status:      r.Status || "",
        result:      r.Result || "",
        category:    r.Category || "",
        profileId:   r.Job_Profile || r.Profile_ID || r["Profile ID"] || "",
        designation: r.Designation || "",
        trade:       r.Trade_of_Profession || r["Trade of Profession"] || "",
        callOpens:   r.Call_Opens || r["Call Opens"] || "",
        callCloses:  r["Call-Closes"] || r["Call Closes"] || "",
        fileNo:      r.File_number || r["File Number"] || "",
        reference:   r.Reference || "",
        pubDate:     r.Pub_date || r["Pub Date"] || "",
        resultDate:  r.Result_date || r["Result Date"] || "",
        validFor:    r.Valid_for || r["Valid For"] || "0",
      })).filter(r => r.idCard || r.profileId));
    });
    e.target.value = "";
  }

  function handleRankingsUpload(e, isRevised) {
    const file = e.target.files[0]; if (!file) return;
    parseExcel(file, rows => {
      const parsed = rows.map(r => ({
        idCard:      r.PersonIDNO || r.ID_Card || r["ID Card"] || "",
        firstName:   r.PersonName || r.Name || "",
        surname:     r.PersonSurname || r.Surname || "",
        profileId:   r.Job_Profile || r.Profile_ID || r["Profile ID"] || "",
        rank:        Number(r.Ranking || r.Rank || 0),
        mark:        r.Ranking_Mark || r.Mark || "",
        category:    r.Category || "",
        failed:      !!(r.Failed || r.failed),
        sentToRecom: !!(r.Sent_To_Recom || r.SentToRecom || r.sentToRecom),
        salScale:    r.SalScale || r.Sal_Scale || "",
        comments:    r.Comments || "",
      })).filter(r => r.idCard);
      if (isRevised) setRevisedRankings(parsed);
      else           setUploadedRankings(parsed);
    });
    e.target.value = "";
  }

  // ── Derived data ─────────────────────────────────────────────
  const allProfiles = useMemo(() => {
    const fromApps  = [...new Set(uploadedApps.map(a => a.profileId).filter(Boolean))];
    const fromCalls = tCalls.map(a => String(a.profileId));
    return [...new Set([...fromApps, ...fromCalls])].sort();
  }, [uploadedApps]);

  const allCategories = useMemo(() =>
    [...new Set(Object.values(recruitedMap).map(r => r.category).filter(Boolean))],
    [recruitedMap]
  );

  function getProfileMeta(profileId) {
    const seed = tCalls.find(a => String(a.profileId) === String(profileId));
    const app0 = uploadedApps.find(a => a.profileId === profileId);
    return {
      profileId,
      designation:   app0?.designation   || seed?.designation   || "",
      trade:         app0?.trade         || seed?.trade         || "",
      callOpens:     app0?.callOpens     || seed?.callOpens     || "",
      callCloses:    app0?.callCloses    || seed?.callCloses    || "",
      fileNo:        app0?.fileNo        || seed?.fileNo        || "",
      reference:     app0?.reference     || seed?.reference     || "",
      pubDate:       app0?.pubDate       || seed?.pubDate       || "",
      resultDate:    app0?.resultDate    || seed?.resultDate    || "",
      validFor:      app0?.validFor      || seed?.validFor      || "0",
      resultExpDate: seed?.resultExpDate || "",
    };
  }

  function getAppsForProfile(profileId) {
    const up = uploadedApps.filter(a => a.profileId === profileId);
    return up.length ? up : [];
  }

  function getRankingsForProfile(profileId) {
    const rev = revisedRankings.filter(r => r.profileId === profileId);
    if (rev.length) return rev.sort((a,b) => a.rank - b.rank);
    const up  = uploadedRankings.filter(r => r.profileId === profileId);
    if (up.length)  return up.sort((a,b) => a.rank - b.rank);
    return tRankings
      .filter(r => String(r.profileId) === String(profileId))
      .sort((a,b) => a.rank - b.rank)
      .map(r => ({
        idCard: r.idCard, firstName: "", surname: "",
        rank: r.rank, mark: r.mark, category: r.category||"",
        failed: !!(r.failed), sentToRecom: !!(r.sentToRecom),
        salScale: r.salScale||"", comments: r.comments||"", profileId,
      }));
  }

  const recrRankings = useMemo(
    () => recrProfile ? getRankingsForProfile(recrProfile) : [],
    [recrProfile, uploadedRankings, revisedRankings]
  );

  // ── Search ────────────────────────────────────────────────────
  function doView() {
    const pid = searchProfile || (() => {
      if (!searchDesig && !searchTrade) return null;
      const hit = tCalls.find(a =>
        (!searchDesig || a.designation === searchDesig) &&
        (!searchTrade  || a.trade      === searchTrade)
      );
      return hit ? String(hit.profileId) : null;
    })();
    if (pid) setViewProfile(pid);
    else alert("No matching profile found.");
  }

  // ── Recruit / Accept ─────────────────────────────────────────
  function openAcceptModal(rankRow, profileId) {
    const existing = recruitedMap[profileId + "_" + rankRow.idCard];
    setAcceptForm(existing
      ? {status:existing.status||"", wef:existing.wef||"", school:existing.school||"", salScale:existing.salScale||rankRow.salScale||"", comments:existing.comments||""}
      : {status:"", wef:"", school:"", salScale:rankRow.salScale||"", comments:""});
    setAcceptModal({rankRow, profileId});
  }

  function onAcceptSave(overrideStatus) {
    if (!acceptModal) return;
    const {rankRow, profileId} = acceptModal;
    const key  = profileId + "_" + rankRow.idCard;
    const meta = getProfileMeta(profileId);
    const finalStatus = overrideStatus || acceptForm.status;
    const formToSave = {...acceptForm, status: finalStatus};
    setRecruitedMap(prev => ({...prev, [key]: {
      ...formToSave, profileId, idCard: rankRow.idCard,
      firstName: rankRow.firstName, surname: rankRow.surname,
      category: rankRow.category, designation: meta.designation,
    }}));
    if ((finalStatus||"").startsWith("Accepted")) {
      const year = formToSave.wef ? formToSave.wef.slice(0,4) : String(new Date().getFullYear());
      setHrPlanLocal(prev => prev.map(r =>
        String(r.year) === year && r.desig === meta.designation
          ? {...r, taken: (Number(r.taken)||0) + 1}
          : r
      ));
      // ── Push a new PRS record so the employee shows up in PRS Office ──
      if (typeof window.addRecruitmentHire === "function") {
        window.addRecruitmentHire({
          idCard:     rankRow.idCard,
          firstName:  rankRow.firstName,
          surname:    rankRow.surname,
          category:   rankRow.category,
          designation: meta.designation,
          position:   meta.designation || "Teacher",
          salScale:   formToSave.salScale || "10/1",
          wef:        formToSave.wef,
          school:     formToSave.school,
          comments:   formToSave.comments,
        });
      }
    } else if ((finalStatus||"") === "Refused") {
      try { window.dispatchEvent(new CustomEvent("toast", {detail:`${rankRow.firstName||""} ${rankRow.surname||""} (${rankRow.idCard}) marked Refused.`})); } catch {}
    }
    setAcceptModal(null);
  }

  // ── Letter generation ─────────────────────────────────────────
  function doPrint(html) {
    const w = window.open("","_blank","width=800,height=900");
    w.document.write(`<!doctype html><html><head><title>Recruitment Letter</title>
      <style>body{font-family:Georgia,serif;padding:60px;max-width:700px;margin:0 auto;font-size:14px;line-height:1.7}
      h3{text-align:center;margin-bottom:24px}.sig{margin-top:80px}.line{border-top:1px solid #000;display:inline-block;min-width:240px;margin-top:60px}</style>
      </head><body>${html}
      <script>window.onload=function(){window.print();window.close();}<\/script></body></html>`);
    w.document.close();
  }

  function doLetter(type) {
    const meta = getProfileMeta(recrProfile);
    let recruits = Object.values(recruitedMap).filter(r =>
      r.profileId === recrProfile &&
      ((r.status||"").startsWith("Accepted") || r.status === "Already MEYR Emp")
    );
    if (type === "new")         recruits = recruits.filter(r => !(r.status||"").includes("Replacement"));
    if (type === "replacement") recruits = recruits.filter(r => (r.status||"").includes("Replacement"));
    if (!recruits.length) { alert("No recruits for this letter type."); return; }
    const today = new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
    const tbl = recruits.map((r,i) =>
      `<tr><td style="padding:4px 12px 4px 0">${i+1}.</td>
       <td style="padding:4px 20px 4px 0"><strong>${[r.firstName,r.surname].filter(Boolean).join(" ")||r.idCard}</strong></td>
       <td style="padding:4px 20px 4px 0">${r.idCard}</td>
       <td style="padding:4px 20px 4px 0">${r.category||""}</td>
       <td style="padding:4px 0">${r.wef||""}</td></tr>`
    ).join("");
    doPrint(`
      <div style="text-align:right;margin-bottom:20px">${today}</div>
      <h3 style="font-size:15px">APPOINTMENT — ${(meta.designation||"").toUpperCase()}${meta.trade?" ("+meta.trade.toUpperCase()+")":""}</h3>
      <p>Following the selection process for the post of <strong>${meta.designation||""}</strong>, the following candidates are recommended for appointment:</p>
      <table style="margin:20px 0;border-collapse:collapse">${tbl}</table>
      <p>Appointments are subject to the conditions of service under the Public Administration Act and applicable Collective Agreements.</p>
      <div class="sig"><p>Yours sincerely,</p><div class="line"></div><br/>
      <strong>Permanent Secretary</strong><br/>
      <span style="font-size:13px">Ministry for Education, Sport, Youth, Research and Innovation</span></div>
    `);
  }

  // ── SRS export ────────────────────────────────────────────────
  function doSrsExport() {
    if (typeof XLSX === "undefined") { alert("XLSX library not loaded."); return; }
    let rows = Object.values(recruitedMap).filter(r =>
      (r.status||"").startsWith("Accepted") || r.status === "Already MEYR Emp"
    );
    if (srsMode === "profile") {
      if (!srsProfile) { alert("Select a profile first."); return; }
      rows = rows.filter(r => r.profileId === srsProfile);
    } else if (srsMode === "category") {
      if (!srsCat) { alert("Select a category."); return; }
      rows = rows.filter(r => r.category === srsCat);
    }
    if (!rows.length) { alert("No accepted recruits found."); return; }
    const headers = ["ID Card","First Name","Surname","Category","WEF","Status","Profile ID","Designation","Salary Scale","School/College","Comments"];
    const data = rows.map(r => [r.idCard||"",r.firstName||"",r.surname||"",r.category||"",r.wef||"",r.status||"",r.profileId||"",r.designation||"",r.salScale||"",r.school||"",r.comments||""]);
    const ws = XLSX.utils.aoa_to_sheet([headers,...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,"SRS_Recruits");
    XLSX.writeFile(wb,`SRS_Teaching_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  const FLD  = {display:"grid", gridTemplateColumns:"185px 1fr", alignItems:"center", gap:"8px"};
  const CARD = {padding:"20px"};
  const TABS_DEF = [
    {id:"applications",   label:"Applications"},
    {id:"rankings",       label:"Rankings"},
    {id:"recruitment",    label:"Recruitment"},
    {id:"srs",            label:"SRS"},
    {id:"person-details", label:"Person Details"},
    {id:"reports-1",      label:"Reports-1"},
    {id:"reports-2",      label:"Reports-2"},
  ];

  return (
    <div className="page">

      {/* ── Acceptance modal ── */}
      {acceptModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setAcceptModal(null)}>
          <div style={{background:"#fff",borderRadius:"8px",width:"460px",maxHeight:"90vh",overflowY:"auto",padding:"24px"}} onClick={e=>e.stopPropagation()}>
            <h3 style={{marginBottom:"18px",fontWeight:700,fontSize:"1rem"}}>
              Recruit — {acceptModal.rankRow.idCard}
              {(acceptModal.rankRow.firstName||acceptModal.rankRow.surname) ? " · " + [acceptModal.rankRow.firstName,acceptModal.rankRow.surname].filter(Boolean).join(" ") : ""}
            </h3>
            <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
              <div style={FLD}>
                <label style={{fontWeight:600}}>WEF Date :</label>
                <input className="input" type="date" title="WEF Date" value={acceptForm.wef} onChange={e=>setAcceptForm(f=>({...f,wef:e.target.value}))}/>
              </div>
              <div style={FLD}>
                <label style={{fontWeight:600}}>School / College :</label>
                <select className="input" title="School / College" value={acceptForm.school} onChange={e=>setAcceptForm(f=>({...f,school:e.target.value}))}>
                  <option value=""></option>
                  {(X?.COLLEGES_LIST||[]).map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={FLD}>
                <label style={{fontWeight:600}}>Salary Scale :</label>
                <input className="input" type="text" title="Salary Scale" placeholder="e.g. 10/1" value={acceptForm.salScale} onChange={e=>setAcceptForm(f=>({...f,salScale:e.target.value}))}/>
              </div>
              <div style={FLD}>
                <label style={{fontWeight:600}}>Comments :</label>
                <textarea className="input" rows={3} title="Comments" value={acceptForm.comments} onChange={e=>setAcceptForm(f=>({...f,comments:e.target.value}))}/>
              </div>
              <div className="muted xs" style={{borderTop:"1px solid var(--line-2)",paddingTop:10,marginTop:4}}>
                Choose the decision below. <strong>Accepting</strong> automatically creates a PRS record for this employee.
              </div>
            </div>
            <div style={{display:"flex",gap:"10px",justifyContent:"space-between",marginTop:"20px"}}>
              <button type="button" className="btn" onClick={()=>setAcceptModal(null)}>Cancel</button>
              <div style={{display:"flex",gap:"10px"}}>
                <button type="button" className="btn btn-red" disabled={!acceptForm.wef} onClick={()=>onAcceptSave("Refused")}>
                  ✕ Refuse
                </button>
                <button type="button" className="btn btn-green" disabled={!acceptForm.wef||!acceptForm.salScale} onClick={()=>onAcceptSave("Accepted (Full Time)")}>
                  ✓ Accept → create PRS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="page-head">
        <div>
          <div className="crumbs">Recruitment · Teaching</div>
          <h1>Recruitment Teaching</h1>
        </div>
      </div>

      <div className="tabs scrolly">
        {TABS_DEF.map(t => (
          <div key={t.id} className={"tab "+(tab===t.id?"active":"")} onClick={()=>setTab(t.id)}>{t.label}</div>
        ))}
      </div>

      {/* ═══ APPLICATIONS ═══════════════════════════════════════ */}
      {tab === "applications" && (
        <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:"16px"}}>
          <div className="card" style={{padding:"14px 20px",display:"flex",gap:"14px",alignItems:"center",flexWrap:"wrap"}}>
            <label className="btn primary" style={{cursor:"pointer"}}>
              Upload Applications from Excel
              <input type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={handleAppsUpload}/>
            </label>
            <button className="btn" onClick={()=>downloadAppsTemplate("teaching")}>↓ Download template</button>
            {uploadedApps.length > 0 &&
              <span className="tag green">{uploadedApps.length} rows loaded ({[...new Set(uploadedApps.map(a=>a.profileId).filter(Boolean))].length} profiles)</span>}
          </div>

          {!viewProfile && (
            <div className="card" style={{maxWidth:"520px",margin:"0 auto",width:"100%",...CARD}}>
              <h3 style={{textAlign:"center",fontWeight:600,marginBottom:"22px",fontSize:"1.05rem"}}>View Applications</h3>
              <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
                <div style={FLD}>
                  <label style={{textAlign:"right",fontWeight:500}}>Select Designation:</label>
                  <select className="input" value={searchDesig} onChange={e=>setSearchDesig(e.target.value)}>
                    <option value=""></option>
                    {[...new Set(tCalls.map(a=>a.designation).filter(Boolean))].sort().map(d=>(
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div style={FLD}>
                  <label style={{textAlign:"right",fontWeight:500}}>Select Trade of Profession:</label>
                  <select className="input" value={searchTrade} onChange={e=>setSearchTrade(e.target.value)}>
                    <option value=""></option>
                    {[...new Set(tCalls.map(a=>a.trade).filter(Boolean))].sort().map(t=>(
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div style={{textAlign:"center",fontWeight:700,fontSize:"0.9rem"}}>OR</div>
                <div style={FLD}>
                  <label style={{textAlign:"right",fontWeight:500}}>Profile ID:</label>
                  <select className="input" value={searchProfile} onChange={e=>setSearchProfile(e.target.value)}>
                    <option value=""></option>
                    {allProfiles.map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div style={{display:"flex",gap:"12px",justifyContent:"center",marginTop:"8px"}}>
                  <button className="btn primary" onClick={doView}>View</button>
                  <button className="btn" onClick={()=>{setSearchDesig("");setSearchTrade("");setSearchProfile("");}}>Close</button>
                </div>
              </div>
            </div>
          )}

          {viewProfile && (() => {
            const meta = getProfileMeta(viewProfile);
            const apps = getAppsForProfile(viewProfile);
            const title = [meta.designation, meta.trade ? "IN THE "+meta.trade.toUpperCase() : ""].filter(Boolean).join("  ");
            return (
              <div className="card" style={{padding:0,overflow:"hidden"}}>
                <div style={{background:"#dce8ff",padding:"16px 24px"}}>
                  <h3 style={{textAlign:"center",fontWeight:700,marginBottom:"16px",textTransform:"uppercase",fontSize:"0.95rem"}}>{title}</h3>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 40px",fontSize:"0.875rem"}}>
                    <div><strong>Profile No:</strong> {meta.profileId}</div>
                    <div><strong>Reference:</strong> {meta.reference}</div>
                    <div><strong>Designation:</strong> {meta.designation}</div>
                    <div><strong>File Number:</strong> {meta.fileNo}</div>
                    <div><strong>Trade of Profession:</strong> {meta.trade}</div>
                    <div><strong>Publication Date:</strong> {meta.pubDate}</div>
                    <div><strong>Call Opens:</strong> {meta.callOpens}</div>
                    <div><strong>Result Date:</strong> {meta.resultDate?`(Valid for ${meta.validFor} years)`:""}</div>
                    <div><strong>Call Closes:</strong> {meta.callCloses}</div>
                    <div><strong>Result expires on:</strong> {meta.resultExpDate}</div>
                  </div>
                </div>
                {apps.length > 0 ? (
                  <table className="table compact">
                    <thead><tr>
                      <th>ID card number</th><th>Name and Surname</th>
                      <th>Application Date</th><th>Status</th><th>Result</th><th>Category</th>
                    </tr></thead>
                    <tbody>
                      {apps.map((a,i)=>(
                        <tr key={i}>
                          <td className="id">{a.idCard}</td>
                          <td>{[a.firstName,a.surname].filter(Boolean).join("  ")}</td>
                          <td className="num">{a.appDate}</td>
                          <td><span className="tag gray">{a.status}</span></td>
                          <td>{a.result||""}</td>
                          <td>{a.category||""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{padding:"28px",textAlign:"center",color:"var(--ink-3)"}}>
                    No uploaded application data for profile {viewProfile}. Upload an Excel file to populate this report.
                  </div>
                )}
                <div style={{background:"#dce8ff",padding:"10px 24px",textAlign:"center",fontWeight:600,fontSize:"0.9rem"}}>
                  Total number of applications = {apps.length}
                </div>
                <div style={{padding:"12px 24px",borderTop:"1px solid var(--line-2)",display:"flex",gap:"10px"}}>
                  <button className="btn" onClick={()=>setViewProfile(null)}>← Back to search</button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ═══ RANKINGS ════════════════════════════════════════════ */}
      {tab === "rankings" && (
        <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:"16px"}}>
          <div className="card" style={{padding:"14px 20px",display:"flex",flexWrap:"wrap",gap:"12px",alignItems:"center"}}>
            <label className="btn primary" style={{cursor:"pointer"}}>
              Import Rankings
              <input type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={e=>handleRankingsUpload(e,false)}/>
            </label>
            <label className="btn" style={{cursor:"pointer"}}>
              Import REVISED Rankings
              <input type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={e=>handleRankingsUpload(e,true)}/>
            </label>
            <button className="btn" onClick={()=>downloadRankingsTemplate("teaching")}>↓ Download template</button>
            <button className="btn" style={{color:"#c0392b"}} onClick={()=>{
              const blocked = uploadedRankings.some(r=>r.sentToRecom) || revisedRankings.some(r=>r.sentToRecom);
              if (blocked) { alert("Cannot delete: some candidates have already been sent to recommendation."); return; }
              if (!confirm("Delete all uploaded rankings?")) return;
              setUploadedRankings([]); setRevisedRankings([]);
            }}>Delete Rankings</button>
            <span style={{flex:1}}/>
            {uploadedRankings.length > 0 && <span className="tag green">{uploadedRankings.length} rows</span>}
            {revisedRankings.length  > 0 && <span className="tag amber">{revisedRankings.length} REVISED rows</span>}
          </div>
          {(uploadedRankings.length > 0 || revisedRankings.length > 0) ? (() => {
            const active = revisedRankings.length > 0 ? revisedRankings : uploadedRankings;
            return (
              <div className="card">
                <div className="card-head">
                  <h2>Rankings {revisedRankings.length > 0 ? "(REVISED)" : ""}</h2>
                  <div className="right muted xs">{active.length} rows</div>
                </div>
                <table className="table compact">
                  <thead><tr>
                    <th className="right">Rank</th><th>Profile</th><th>ID Card</th>
                    <th>Name</th><th className="right">Mark</th><th>Category</th>
                    <th>Sal Scale</th><th>Failed</th><th>Sent to Recom</th>
                  </tr></thead>
                  <tbody>
                    {active.map((r,i)=>(
                      <tr key={i}>
                        <td className="num right mono"><strong>{r.rank}</strong></td>
                        <td className="mono xs">{r.profileId}</td>
                        <td className="id">{r.idCard}</td>
                        <td>{[r.firstName,r.surname].filter(Boolean).join(" ")}</td>
                        <td className="num right mono">{r.mark}</td>
                        <td className="mono">{r.category}</td>
                        <td className="mono">{r.salScale}</td>
                        <td>{r.failed?<span className="tag red">Yes</span>:<span className="muted">—</span>}</td>
                        <td>{r.sentToRecom?<span className="check">✓</span>:"—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })() : (
            <div className="card" style={{padding:"40px",textAlign:"center"}}>
              <div className="muted">No rankings uploaded yet. Seed data from {tRankings.length} DB rows available per profile.</div>
              <div className="muted xs" style={{marginTop:"8px"}}>Expected columns: PersonIDNO, PersonName, PersonSurname, Job_Profile, Ranking, Ranking_Mark, Category, SalScale, Sent_To_Recom</div>
            </div>
          )}
        </div>
      )}

      {/* ═══ RECRUITMENT ═════════════════════════════════════════ */}
      {tab === "recruitment" && (
        <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:"16px"}}>
          <div className="card" style={{...CARD}}>
            <div style={{display:"flex",alignItems:"center",gap:"16px",flexWrap:"wrap"}}>
              <label style={{fontWeight:600}}>Profile No:</label>
              <select className="input" style={{minWidth:"200px"}} value={recrProfile} onChange={e=>setRecrProfile(e.target.value)}>
                <option value=""></option>
                {allProfiles.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
              {recrProfile && (() => {
                const meta = getProfileMeta(recrProfile);
                return <span className="muted xs">{meta.designation}{meta.trade?" · "+meta.trade:""}</span>;
              })()}
              <span style={{flex:1}}/>
              {recrProfile && (
                <>
                  <button className="btn" onClick={()=>doLetter("new")}>Letter — All New</button>
                  <button className="btn" onClick={()=>doLetter("replacement")}>Letter — All Replacements</button>
                  <button className="btn primary" onClick={()=>doLetter("both")}>Letter — New + Replacements</button>
                </>
              )}
            </div>
            {recrProfile && Object.keys(recruitedMap).some(k=>k.startsWith(recrProfile+"_")) && (
              <div style={{marginTop:"12px",display:"flex",alignItems:"center",gap:"12px"}}>
                {emailSentSet.has(recrProfile)
                  ? <span className="tag green">✓ Acceptance emails sent</span>
                  : <>
                      <span style={{color:"#c0392b",fontWeight:600,fontSize:"0.88rem"}}>Acceptance emails not yet sent</span>
                      <button className="btn" onClick={()=>setEmailSentSet(prev=>new Set([...prev,recrProfile]))}>Send Acceptance Emails</button>
                    </>
                }
              </div>
            )}
          </div>

          {recrProfile ? (
            <div className="card">
              <div className="card-head">
                <h2>Candidates — Profile {recrProfile}</h2>
                <div className="right muted xs">{recrRankings.length} in ranking</div>
              </div>
              {recrRankings.length > 0 ? (
                <table className="table compact">
                  <thead><tr>
                    <th className="right">Rank</th><th>ID Card</th><th>Name</th>
                    <th className="right">Mark</th><th>Category</th><th>Sal Scale</th>
                    <th>Status</th><th>WEF</th><th>School</th><th>Action</th>
                  </tr></thead>
                  <tbody>
                    {recrRankings.map((r,i)=>{
                      const key = recrProfile + "_" + r.idCard;
                      const rec = recruitedMap[key];
                      const statusColor = rec
                        ? (rec.status||"").startsWith("Accepted")||rec.status==="Already MEYR Emp" ? "green"
                          : rec.status==="Refused" ? "red"
                          : "amber"
                        : "";
                      return (
                        <tr key={i} style={r.failed?{opacity:.5}:{}}>
                          <td className="num right mono"><strong>{r.rank}</strong></td>
                          <td className="id">{r.idCard}</td>
                          <td>{[r.firstName,r.surname].filter(Boolean).join(" ")||<span className="muted xs">—</span>}</td>
                          <td className="num right mono">{r.mark}</td>
                          <td className="mono">{r.category}</td>
                          <td className="mono">{r.salScale}</td>
                          <td>{rec?<span className={"tag "+statusColor}>{rec.status}</span>:<span className="muted">—</span>}</td>
                          <td className="num">{rec?.wef||"—"}</td>
                          <td className="muted xs">{rec?.school||"—"}</td>
                          <td>
                            <button className="btn" style={{fontSize:"0.78rem",padding:"3px 10px"}}
                              onClick={()=>openAcceptModal(r,recrProfile)}>
                              {rec ? "Edit" : "Recruit"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{padding:"36px",textAlign:"center",color:"var(--ink-3)"}}>
                  No ranking data for profile {recrProfile}. Upload rankings or select a profile with seed data.
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{padding:"40px",textAlign:"center",color:"var(--ink-3)"}}>
              Select a profile number above to view the candidate working window.
            </div>
          )}
        </div>
      )}

      {/* ═══ SRS ═════════════════════════════════════════════════ */}
      {tab === "srs" && (
        <div style={{padding:"16px"}}>
          <div className="card" style={{...CARD,maxWidth:"520px",margin:"0 auto"}}>
            <div style={{fontWeight:600,marginBottom:"14px"}}>SRS Export — Teaching Recruits</div>
            <div style={{border:"1px solid var(--line-2)",borderRadius:"4px",padding:"16px",display:"flex",flexDirection:"column",gap:"16px"}}>
              <label style={{display:"flex",alignItems:"center",gap:"10px"}}>
                <input type="radio" name="t-srs-mode" value="profile" checked={srsMode==="profile"} onChange={()=>setSrsMode("profile")}/>
                <span>Select Profile ID :</span>
                <select className="input" style={{flex:1}} value={srsProfile} onChange={e=>setSrsProfile(e.target.value)} disabled={srsMode!=="profile"}>
                  <option value=""></option>
                  {allProfiles.map(p=><option key={p} value={p}>{p}</option>)}
                </select>
              </label>
              <div style={{height:"1px",background:"var(--line-2)"}}/>
              <label style={{display:"flex",alignItems:"center",gap:"10px"}}>
                <input type="radio" name="t-srs-mode" value="category" checked={srsMode==="category"} onChange={()=>setSrsMode("category")}/>
                <span>Select Category :</span>
                <select className="input" style={{flex:1}} value={srsCat} onChange={e=>setSrsCat(e.target.value)} disabled={srsMode!=="category"}>
                  <option value=""></option>
                  {allCategories.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <div style={{height:"1px",background:"var(--line-2)"}}/>
              <label style={{display:"flex",alignItems:"center",gap:"10px"}}>
                <input type="radio" name="t-srs-mode" value="all" checked={srsMode==="all"} onChange={()=>setSrsMode("all")}/>
                <span>All Accepted Recruits</span>
              </label>
            </div>
            <div style={{marginTop:"20px",textAlign:"center"}}>
              <button className="btn primary" onClick={doSrsExport}>Export to Excel</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PERSON DETAILS ══════════════════════════════════════ */}
      {tab === "person-details" && (
        <div style={{padding:"16px"}}>
          <div className="card" style={{...CARD,textAlign:"center",color:"var(--ink-3)"}}>
            Person details — linked to CustomerDetails_tbl_teaching. Select a profile from Applications to drill in.
          </div>
        </div>
      )}

      {/* ═══ REPORTS-1 ═══════════════════════════════════════════ */}
      {tab === "reports-1" && (
        <div style={{padding:"16px"}}>
          <div className="card" style={{...CARD,textAlign:"center",color:"var(--ink-3)"}}>
            Reports module — printable reports and summaries.
          </div>
        </div>
      )}

      {/* ═══ REPORTS-2 / MAINTENANCE ═════════════════════════════ */}
      {tab === "reports-2" && (
        <div style={{padding:"16px"}}>
          <div className="card" style={{...CARD,textAlign:"center",color:"var(--ink-3)"}}>
            Reports-2 / Maintenance — salary scale management, grade lookups, admin tools.
          </div>
        </div>
      )}
    </div>
  );
}

window.PageLifecycle = { RecruitmentDeep, RecruitmentNonTeachingDeep, RecruitmentTeachingDeep, FormsDeep, TransfersDeep, TerminationsDeep };
})();
