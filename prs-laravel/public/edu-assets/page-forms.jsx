// page-forms.jsx — Modal system + interactive workflow components
// Exposed on window.PageForms; loaded last so all page files can reference lazily.
(function(){
const { useState, useEffect } = React;
const D = window.HR_DATA;
const X = window.DEEP_DATA;

// ─── BASE MODAL ──────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={"modal" + (wide ? " wide" : "")} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// ─── NEW LEAVE MODAL — 4-step stepper ────────────────────────────
function NewLeaveModal({ onClose }) {
  const [step, setStep] = useState(0);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ person: null, nature: "", paid: "1", fromDate: "", toDate: "", notes: "" });
  const [done, setDone] = useState(false);
  const set = (k, v) => setForm(f => ({...f, [k]: v}));
  const steps = ["Select person", "Leave type", "Dates", "Submit"];

  const people = D.PEOPLE.filter(p =>
    q === "" || `${p.name} ${p.surname} ${p.idCard}`.toLowerCase().includes(q.toLowerCase())
  ).slice(0, 20);

  const days = form.fromDate && form.toDate
    ? Math.max(0, Math.ceil((new Date(form.toDate) - new Date(form.fromDate)) / 86400000) + 1)
    : 0;

  const nextDisabled = (
    (step === 0 && !form.person) ||
    (step === 1 && !form.nature) ||
    (step === 2 && (!form.fromDate || !form.toDate))
  );

  if (done) return (
    <Modal title="New leave record" onClose={onClose}>
      <div className="submit-success">
        <div className="success-ico">✓</div>
        <h3>Leave submitted</h3>
        <p>Record for <strong>{form.person?.name} {form.person?.surname}</strong> created and pending senior officer approval.</p>
        <button className="btn primary" onClick={onClose} style={{marginTop:16}}>Done</button>
      </div>
    </Modal>
  );

  return (
    <Modal title="New leave record" onClose={onClose}>
      <div className="stepper" style={{marginBottom:16}}>
        {steps.map((s,i) => (
          <div key={i} className={"step " + (i < step ? "done" : i === step ? "active" : "")}>
            <div className="n">Step {i+1}</div><div className="t">{s}</div>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div>
          <input className="input" placeholder="Search name or ID card…" value={q}
            onChange={e => setQ(e.target.value)} style={{width:"100%",marginBottom:10}}/>
          <div className="people-list">
            {people.map(p => (
              <div key={p.idCard}
                className={"people-item" + (form.person?.idCard === p.idCard ? " selected" : "")}
                onClick={() => set("person", p)}>
                <div className="pi-id">{p.idCard}</div>
                <div className="pi-name">{p.name} {p.surname}</div>
                <div className="pi-grade">{p.gradeDesc} · {p.paypoint}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <label className="field-label">Leave type</label>
          <select className="input" value={form.nature} onChange={e => set("nature", e.target.value)}
            style={{width:"100%",marginBottom:14}}>
            <option value="">— choose —</option>
            {(X.LEAVE_TYPES || []).map(t => <option key={t.id} value={t.en}>{t.en}</option>)}
          </select>
          <label className="field-label">Paid / Unpaid</label>
          <div className="radio-row">
            <label><input type="radio" value="1" checked={form.paid === "1"} onChange={() => set("paid","1")}/> Paid</label>
            <label><input type="radio" value="0" checked={form.paid === "0"} onChange={() => set("paid","0")}/> Unpaid</label>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="field-row">
            <div className="field" style={{flex:1}}>
              <label className="field-label">From date</label>
              <input type="date" className="input" value={form.fromDate} onChange={e => set("fromDate", e.target.value)} style={{width:"100%"}}/>
            </div>
            <div className="field" style={{flex:1}}>
              <label className="field-label">To date</label>
              <input type="date" className="input" value={form.toDate} onChange={e => set("toDate", e.target.value)} style={{width:"100%"}}/>
            </div>
          </div>
          {days > 0 && <div className="info-pill">{days} calendar day{days === 1 ? "" : "s"}</div>}
          <label className="field-label" style={{marginTop:12,display:"block"}}>Notes (optional)</label>
          <textarea className="input" rows={3} value={form.notes} onChange={e => set("notes", e.target.value)} style={{width:"100%"}}/>
        </div>
      )}

      {step === 3 && (
        <div className="review-kv">
          <div className="kv-row"><span>Employee</span><strong>{form.person?.name} {form.person?.surname} <span className="mono">({form.person?.idCard})</span></strong></div>
          <div className="kv-row"><span>Leave type</span><strong>{form.nature || "—"}</strong></div>
          <div className="kv-row"><span>Paid</span><strong>{form.paid === "1" ? "Paid" : "Unpaid"}</strong></div>
          <div className="kv-row"><span>From</span><strong>{form.fromDate || "—"}</strong></div>
          <div className="kv-row"><span>To</span><strong>{form.toDate || "—"}</strong></div>
          <div className="kv-row"><span>Days</span><strong>{days || "—"}</strong></div>
        </div>
      )}

      <div className="modal-actions">
        {step > 0 && <button className="btn" onClick={() => setStep(s => s-1)}>← Back</button>}
        <span style={{flex:1}}/>
        {step < 3 && (
          <button className="btn primary" onClick={() => setStep(s => s+1)} disabled={nextDisabled}>Next →</button>
        )}
        {step === 3 && (
          <button className="btn primary"
            disabled={!form.person || !form.nature || !form.fromDate || !form.toDate}
            onClick={() => setDone(true)}>
            Submit leave
          </button>
        )}
      </div>
    </Modal>
  );
}

// ─── CONFIRMATION KANBAN ─────────────────────────────────────────
const CONF_STAGES = [
  {key:"pending",   label:"Pending",       color:"amber"},
  {key:"letter",    label:"Letter sent",   color:"blue"},
  {key:"received",  label:"Response rcvd", color:"blue"},
  {key:"confirmed", label:"Confirmed",     color:"green"},
  {key:"overdue",   label:"Overdue",       color:"red"},
];

function stageOf(c) {
  if (c.confirmed) return "confirmed";
  if (c.dueDate && new Date(c.dueDate) < new Date("2026-04-30")) return "overdue";
  if (c.receivedFromCollege) return "received";
  if (c.sentToCollege) return "letter";
  return "pending";
}

function ConfKanban({ rows }) {
  const [items, setItems] = useState(() => rows.map(c => ({...c, _stage: stageOf(c)})));
  const [sel, setSel] = useState(null);

  const advance = (id) => setItems(prev => prev.map(c => {
    if (c.autoId !== id) return c;
    const idx = CONF_STAGES.findIndex(s => s.key === c._stage);
    const nxt = CONF_STAGES[Math.min(idx+1, CONF_STAGES.length-1)];
    return {...c, _stage: nxt.key};
  }));

  const cols = CONF_STAGES.map(s => ({...s, cards: items.filter(c => c._stage === s.key)}));

  return (
    <div>
      {sel && <ConfCardModal record={sel} onClose={() => setSel(null)} onAdvance={(id) => { advance(id); setSel(null); }}/>}
      <div className="kanban">
        {cols.map(col => (
          <div key={col.key} className="kanban-col">
            <div className={"kanban-col-head col-" + col.color}>
              <span>{col.label}</span>
              <span className="count">{col.cards.length}</span>
            </div>
            {col.cards.map(c => (
              <div key={c.autoId} className="kanban-card" onClick={() => setSel(c)}>
                <div className="kc-id">{c.idCard}</div>
                <div className="kc-name">{c.name}</div>
                <div className="kc-meta">{c.persGrade} · Due {c.dueDate}</div>
              </div>
            ))}
            {col.cards.length === 0 && <div className="kanban-empty">—</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfCardModal({ record, onClose, onAdvance }) {
  const idx = CONF_STAGES.findIndex(s => s.key === record._stage);
  const next = CONF_STAGES[idx+1];
  return (
    <Modal title={"Confirmation — " + record.name} onClose={onClose}>
      <div className="review-kv">
        <div className="kv-row"><span>ID Card</span><strong className="id">{record.idCard}</strong></div>
        <div className="kv-row"><span>Category</span><strong>{record.category}</strong></div>
        <div className="kv-row"><span>WEF</span><strong>{record.wefRecruitment}</strong></div>
        <div className="kv-row"><span>Grade</span><strong>{record.persGrade}</strong></div>
        <div className="kv-row"><span>School</span><strong>{record.persSchool.split(",")[0]}</strong></div>
        <div className="kv-row"><span>Due</span><strong>{record.dueDate}</strong></div>
        <div className="kv-row"><span>Stage</span><strong>{CONF_STAGES[idx]?.label}</strong></div>
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>Close</button>
        {next && (
          <button className="btn primary" onClick={() => onAdvance(record.autoId)}>
            Advance → {next.label}
          </button>
        )}
      </div>
    </Modal>
  );
}

// ─── INCREMENT WITHHOLD MODAL ────────────────────────────────────
const WITHHOLD_REASONS = [
  "Ongoing disciplinary proceedings",
  "Unsatisfactory performance review",
  "Unpaid leave — service break",
  "End of scale reached",
  "Contract not renewed",
  "Probation not completed",
];

function WithholdModal({ record, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  return (
    <Modal title={"Withhold increment — " + record.name} onClose={onClose}>
      <div className="review-kv" style={{marginBottom:14}}>
        <div className="kv-row"><span>Employee</span><strong>{record.name} <span className="mono">({record.idCard})</span></strong></div>
        <div className="kv-row"><span>Scale</span><strong>{record.salScale} → {record.newSalScale}</strong></div>
        <div className="kv-row"><span>WEF</span><strong>{record.fromDate}</strong></div>
      </div>
      <label className="field-label">Reason for withholding</label>
      <select className="input" value={reason} onChange={e => setReason(e.target.value)} style={{width:"100%",marginBottom:14}}>
        <option value="">— select —</option>
        {WITHHOLD_REASONS.map(r => <option key={r}>{r}</option>)}
      </select>
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-red" disabled={!reason} onClick={() => onConfirm(record.autoId, reason)}>
          Confirm withhold
        </button>
      </div>
    </Modal>
  );
}

// ─── DISCIPLINE STAGE MODAL ──────────────────────────────────────
const DISC_STAGES = [
  "Verbal warning","Written warning","Inquiry","Suspension (with pay)",
  "Disciplinary Board","Referred to PSC","Closed — no action","Closed — sanctioned"
];

function DisciplineModal({ record, onClose, onAdvance }) {
  const [notes, setNotes] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [done, setDone] = useState(false);
  const idx = DISC_STAGES.indexOf(record.stage);
  const next = DISC_STAGES[idx+1];
  const isClosed = record.stage.startsWith("Closed");

  if (done) return (
    <Modal title="Discipline case" onClose={onClose}>
      <div className="submit-success">
        <div className="success-ico">✓</div>
        <h3>Stage advanced</h3>
        <p>Case for <strong>{record.name}</strong> moved to <strong>{next}</strong>.</p>
        <button className="btn primary" onClick={onClose} style={{marginTop:16}}>Done</button>
      </div>
    </Modal>
  );

  return (
    <Modal title={"Discipline — " + record.name} onClose={onClose} wide>
      <div className="split-form">
        <div>
          <div className="review-kv">
            <div className="kv-row"><span>ID Card</span><strong className="id">{record.idCard}</strong></div>
            <div className="kv-row"><span>Grade</span><strong>{record.grade}</strong></div>
            <div className="kv-row"><span>Incident</span><strong>{record.incidentDate}</strong></div>
            <div className="kv-row"><span>Nature</span><strong>{record.nature}</strong></div>
            <div className="kv-row"><span>Officer</span><strong>{record.officer}</strong></div>
            {record.nextHearing && <div className="kv-row"><span>Next hearing</span><strong>{record.nextHearing}</strong></div>}
          </div>
        </div>
        <div>
          <p className="field-label" style={{marginBottom:8}}>Stage pipeline</p>
          {DISC_STAGES.map((s, i) => (
            <div key={s} className={"stage-item" + (i < idx ? " done" : i === idx ? " active" : "")}>
              <span className="stage-bullet">{i < idx ? "✓" : i === idx ? "●" : "○"}</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {next && !isClosed && (
        <div style={{marginTop:16,borderTop:"1px solid var(--line)",paddingTop:14}}>
          <p className="field-label" style={{marginBottom:10}}>Advance to: <strong style={{color:"var(--ink)"}}>{next}</strong></p>
          <div className="field-row">
            <div className="field" style={{flex:2}}>
              <label className="field-label">Officer notes</label>
              <textarea className="input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} style={{width:"100%"}}/>
            </div>
            <div className="field" style={{flex:1}}>
              <label className="field-label">Next hearing date</label>
              <input type="date" className="input" value={nextDate} onChange={e => setNextDate(e.target.value)} style={{width:"100%"}}/>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={onClose}>Close</button>
            <button className="btn primary" onClick={() => { onAdvance && onAdvance(record.id, next); setDone(true); }}>
              Advance stage →
            </button>
          </div>
        </div>
      )}
      {(!next || isClosed) && (
        <div className="modal-actions" style={{marginTop:16}}>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      )}
    </Modal>
  );
}

// ─── APPLICATION DETAIL MODAL ────────────────────────────────────
const APP_STAGES = ["Applied","Shortlisted","Examined","Ranked","Offer issued","Accepted","Commenced"];

function AppDetailModal({ app, onClose }) {
  const init = app.status === "Accepted" ? 5 : app.status === "Refused" ? 2 : 1;
  const [stage, setStage] = useState(init);
  const [done, setDone] = useState(false);

  if (done) return (
    <Modal title="Application" onClose={onClose}>
      <div className="submit-success">
        <div className="success-ico">✓</div>
        <h3>Stage updated</h3>
        <p>Application for <strong>{app.name} {app.surname}</strong> moved to <strong>{APP_STAGES[stage]}</strong>.</p>
        <button className="btn primary" onClick={onClose} style={{marginTop:16}}>Done</button>
      </div>
    </Modal>
  );

  return (
    <Modal title={app.name + " " + app.surname + " — Application"} onClose={onClose} wide>
      <div className="split-form">
        <div>
          <div className="review-kv">
            <div className="kv-row"><span>ID Card</span><strong className="id">{app.idCard}</strong></div>
            <div className="kv-row"><span>Profile</span><strong>{app.profileId}</strong></div>
            <div className="kv-row"><span>Submitted</span><strong>{app.submittedOn}</strong></div>
            <div className="kv-row"><span>Current status</span><strong>{app.status}</strong></div>
          </div>
          <div className="alert" style={{marginTop:14}}>
            <span className="ico">ℹ</span>
            <div>Click a pipeline stage to set the current position, then save.</div>
          </div>
        </div>
        <div>
          <p className="field-label" style={{marginBottom:8}}>Recruitment pipeline</p>
          {APP_STAGES.map((s, i) => (
            <div key={s}
              className={"stage-item clickable" + (i < stage ? " done" : i === stage ? " active" : "")}
              onClick={() => setStage(i)}>
              <span className="stage-bullet">{i < stage ? "✓" : i === stage ? "●" : "○"}</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="modal-actions" style={{marginTop:16}}>
        <button className="btn" onClick={onClose}>Close</button>
        <button className="btn primary" onClick={() => setDone(true)}>Save stage</button>
      </div>
    </Modal>
  );
}

// ─── NEW EMPLOYEE MODAL ──────────────────────────────────────────
function NewEmployeeModal({ onClose }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ idCard:"", name:"", surname:"", dob:"", grade:"", paypoint:"", type:"FT", startDate:"" });
  const [done, setDone] = useState(false);
  const set = (k, v) => setForm(f => ({...f, [k]: v}));
  const steps = ["Personal details", "Employment", "Review"];

  if (done) return (
    <Modal title="New employee" onClose={onClose}>
      <div className="submit-success">
        <div className="success-ico">✓</div>
        <h3>Record created</h3>
        <p><strong>{form.name} {form.surname}</strong> <span className="mono">({form.idCard})</span> added — pending records officer approval.</p>
        <button className="btn primary" onClick={onClose} style={{marginTop:16}}>Done</button>
      </div>
    </Modal>
  );

  return (
    <Modal title="New employee record" onClose={onClose}>
      <div className="stepper" style={{marginBottom:16}}>
        {steps.map((s, i) => (
          <div key={i} className={"step " + (i < step ? "done" : i === step ? "active" : "")}>
            <div className="n">Step {i+1}</div><div className="t">{s}</div>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="field-grid">
          <div>
            <label className="field-label">ID Card</label>
            <input className="input" value={form.idCard} onChange={e => set("idCard",e.target.value)} placeholder="0000000A" style={{width:"100%"}}/>
          </div>
          <div>
            <label className="field-label">First name</label>
            <input className="input" value={form.name} onChange={e => set("name",e.target.value)} style={{width:"100%"}}/>
          </div>
          <div>
            <label className="field-label">Surname</label>
            <input className="input" value={form.surname} onChange={e => set("surname",e.target.value)} style={{width:"100%"}}/>
          </div>
          <div>
            <label className="field-label">Date of birth</label>
            <input type="date" className="input" value={form.dob} onChange={e => set("dob",e.target.value)} style={{width:"100%"}}/>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="field-grid">
          <div>
            <label className="field-label">Grade</label>
            <select className="input" value={form.grade} onChange={e => set("grade",e.target.value)} style={{width:"100%"}}>
              <option value="">— choose —</option>
              {D.GRADES.map(g => <option key={g.code} value={g.code}>{g.code} — {g.desc}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Pay point</label>
            <select className="input" value={form.paypoint} onChange={e => set("paypoint",e.target.value)} style={{width:"100%"}}>
              <option value="">— choose —</option>
              {D.PAYPOINTS.map(pp => <option key={pp.code} value={pp.code}>{pp.code} — {pp.desc}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Type</label>
            <select className="input" value={form.type} onChange={e => set("type",e.target.value)} style={{width:"100%"}}>
              <option value="FT">Full time</option>
              <option value="PT">Part time</option>
            </select>
          </div>
          <div>
            <label className="field-label">Commencement date</label>
            <input type="date" className="input" value={form.startDate} onChange={e => set("startDate",e.target.value)} style={{width:"100%"}}/>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="review-kv">
          <div className="kv-row"><span>ID Card</span><strong className="id">{form.idCard || "—"}</strong></div>
          <div className="kv-row"><span>Name</span><strong>{form.name} {form.surname}</strong></div>
          <div className="kv-row"><span>DOB</span><strong>{form.dob || "—"}</strong></div>
          <div className="kv-row"><span>Grade</span><strong>{form.grade || "—"}</strong></div>
          <div className="kv-row"><span>Pay point</span><strong>{form.paypoint || "—"}</strong></div>
          <div className="kv-row"><span>Type</span><strong>{form.type}</strong></div>
          <div className="kv-row"><span>Commencement</span><strong>{form.startDate || "—"}</strong></div>
        </div>
      )}

      <div className="modal-actions">
        {step > 0 && <button className="btn" onClick={() => setStep(s => s-1)}>← Back</button>}
        <span style={{flex:1}}/>
        {step < 2 && <button className="btn primary" onClick={() => setStep(s => s+1)}>Next →</button>}
        {step === 2 && (
          <button className="btn primary"
            disabled={!form.idCard || !form.name || !form.surname}
            onClick={() => setDone(true)}>
            Create record
          </button>
        )}
      </div>
    </Modal>
  );
}

// ─── TERMINATION FORMS ──────────────────────────────────────────

// chk_tech_non_teach — derives Teaching(1)/Non-teaching(2) from TeachingGrades lookup
function chkTechNonTeach(position) {
  const m = (X.TEACHING_GRADES || []).find(g => g.posi === position);
  return m ? m.techOrNonTeach : 2;
}

// chk_duplicate_termination — warn before re-terminating
function chkDuplicate(personIdno, termData) {
  return (termData || []).filter(r =>
    (r.personIdno || "").toLowerCase() === (personIdno || "").toLowerCase()
  );
}

function TerminationModal({ onClose, onSave, existingTermData, officer }) {
  const [idCard, setIdCard] = useState("");
  const [person, setPerson] = useState(null);
  const [dupWarning, setDupWarning] = useState([]);
  const [locale, setLocale] = useState("eng"); // bilingual toggle: "eng" | "mlt"
  const [form, setForm] = useState({
    gradePosition:"", reason:"", genReason:"", teachingNonTeaching:"1",
    terminationDate:"", terminationComments:"", terminationResignation:"Termination",
    college:"", primarySecondary:"", sex:"Male", prsRemark:"",
    dbName:"Terminations",
  });
  const [remarks, setRemarks] = useState([]);
  const [done, setDone] = useState(false);
  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  // Only show Analise_show = true reasons
  const filteredReasons = (X.TERMINATION_REASONS || []).filter(r => r.analiseShow);

  const lookupPerson = () => {
    const p = D.PEOPLE.find(p => p.idCard.replace(/\s/g,"").toLowerCase() === idCard.replace(/\s/g,"").toLowerCase());
    setPerson(p ? {...p, notFound:false} : {notFound:true});
    if (p) {
      const tnT = String(chkTechNonTeach(p.gradeDesc));
      set("gradePosition", p.gradeDesc || "");
      set("teachingNonTeaching", tnT);
      // chk_duplicate_termination
      const dups = chkDuplicate(p.idCard, existingTermData);
      setDupWarning(dups);
    }
  };

  const handleReasonChange = (reasonEng) => {
    const row = filteredReasons.find(r => r.reasonEng === reasonEng);
    set("reason", reasonEng);
    set("genReason", row?.genericReason || "");
  };

  const addRemark = () => {
    if (form.prsRemark.trim()) {
      setRemarks(r => [...r, form.prsRemark.trim()]);
      set("prsRemark", "");
    }
  };

  if (done) return (
    <Modal title="Termination" onClose={onClose}>
      <div className="submit-success">
        <div className="success-ico">✓</div>
        <h3>Saved to Pre-Termination staging</h3>
        <p>Record for <strong>{person?.name} {person?.surname}</strong> has been added to the staging table.
          Use Bulk Commit to post to Termination_Data.
          {remarks.length > 0 && <> {remarks.length} PRS remark{remarks.length !== 1 ? "s" : ""} queued.</>}
        </p>
        <button className="btn primary" onClick={() => { onSave && onSave({person, form, remarks}); onClose(); }} style={{marginTop:16}}>Done</button>
      </div>
    </Modal>
  );

  const colleges = (X.COLLEGES_LIST || []);

  return (
    <Modal title="Termination Form" onClose={onClose} wide>
      <div className="term-id-row">
        <label className="field-label" style={{marginBottom:6,display:"block",textAlign:"center"}}>Insert ID Card No:</label>
        <div style={{display:"flex",justifyContent:"center",gap:8,alignItems:"center",marginBottom:8}}>
          <input className="input" value={idCard} onChange={e=>setIdCard(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&lookupPerson()} placeholder="00000000A"
            style={{width:180,textAlign:"center"}}/>
          <button className="btn" onClick={lookupPerson}>↵</button>
        </div>
        {person && !person.notFound && <div className="term-person-name">{person.name} {person.surname}</div>}
        {person?.notFound && <div style={{color:"var(--red)",textAlign:"center",fontSize:12}}>ID card not found</div>}
        {dupWarning.length > 0 && (
          <div className="alert" style={{marginTop:8,background:"var(--amber-bg)"}}>
            <span className="ico">⚠</span>
            <div><strong>Duplicate warning:</strong> {dupWarning.length} existing termination record{dupWarning.length!==1?"s":""} found for this ID card. Reason: {dupWarning[0].reason}. Proceed only if this is a new termination event.</div>
          </div>
        )}
      </div>

      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginBottom:8}}>
        <label className="field-label" style={{marginBottom:0,alignSelf:"center"}}>Language:</label>
        <button className={"btn"+(locale==="eng"?" primary":"")} onClick={()=>setLocale("eng")}>English</button>
        <button className={"btn"+(locale==="mlt"?" primary":"")} onClick={()=>setLocale("mlt")}>Maltese</button>
      </div>

      <div className="term-form-grid">
        <div className="term-col">
          <div className="field">
            <label className="field-label">Grade / Position (Grade_Position)</label>
            <select className="input" value={form.gradePosition} onChange={e=>{set("gradePosition",e.target.value);set("teachingNonTeaching",String(chkTechNonTeach(e.target.value)));}} style={{width:"100%"}}>
              <option value="">— choose —</option>
              {(X.TEACHING_GRADES||[]).map(g=><option key={g.posi} value={g.posi}>{g.posi}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Reason (Analise_show = true only)</label>
            <select className="input" value={form.reason} onChange={e=>handleReasonChange(e.target.value)} style={{width:"100%"}}>
              <option value="">— choose —</option>
              {filteredReasons.map(r=>(
                <option key={r.id} value={r.reasonEng}>
                  {locale==="eng" ? r.reasonEng : r.reasonMlt}
                </option>
              ))}
            </select>
            {form.genReason && <div className="muted xs" style={{marginTop:3}}>Generic: {form.genReason}</div>}
          </div>
          <div className="field">
            <label className="field-label">Termination / Resignation</label>
            <div className="radio-group-box">
              <label><input type="radio" checked={form.terminationResignation==="Termination"} onChange={()=>set("terminationResignation","Termination")}/> Termination</label>
              <label><input type="radio" checked={form.terminationResignation==="Resignation"} onChange={()=>set("terminationResignation","Resignation")}/> Resignation</label>
            </div>
          </div>
          <div className="field">
            <label className="field-label">Termination Date</label>
            <input type="date" className="input" value={form.terminationDate} onChange={e=>set("terminationDate",e.target.value)} style={{width:"100%"}}/>
          </div>
          <div className="field">
            <label className="field-label">Comments (Termination_comments)</label>
            <textarea className="input" rows={3} value={form.terminationComments} onChange={e=>set("terminationComments",e.target.value)} style={{width:"100%"}}/>
          </div>
        </div>

        <div className="term-col">
          <div className="field">
            <label className="field-label">Teaching / Non-teaching (auto from grade)</label>
            <div className="radio-group-box">
              <label><input type="radio" value="1" checked={form.teachingNonTeaching==="1"} onChange={()=>set("teachingNonTeaching","1")}/> Teaching (1)</label>
              <label><input type="radio" value="2" checked={form.teachingNonTeaching==="2"} onChange={()=>set("teachingNonTeaching","2")}/> Non-teaching (2)</label>
            </div>
          </div>
          <div className="field">
            <label className="field-label">College (Colleges_list)</label>
            <select className="input" value={form.college} onChange={e=>set("college",e.target.value)} style={{width:"100%"}}>
              <option value="">— choose —</option>
              {colleges.map(c=><option key={c.collName} value={c.collName}>{c.collName}{c.deptOrColl===2?" (Dept)":""}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Primary / Secondary</label>
            <select className="input" value={form.primarySecondary} onChange={e=>set("primarySecondary",e.target.value)} style={{width:"100%"}}>
              <option value="">— choose —</option>
              <option>Primary</option><option>Secondary</option>
              <option>Middle</option><option>CP Office</option>
              <option>Gem 16+</option><option>Tertiary / Post-secondary</option>
              <option>Administration</option>
            </select>
          </div>
          <div className="field">
            <label className="field-label">Sex</label>
            <div className="radio-row" style={{marginTop:4}}>
              <label><input type="radio" checked={form.sex==="Male"}   onChange={()=>set("sex","Male")}/> Male</label>
              <label><input type="radio" checked={form.sex==="Female"} onChange={()=>set("sex","Female")}/> Female</label>
            </div>
          </div>
        </div>
      </div>

      <div className="prs-remark-section">
        <label className="field-label">PRS Remarks (PRS_Remarks)</label>
        <div style={{display:"flex",gap:8,alignItems:"flex-start",marginTop:6}}>
          <button className="btn" style={{flexShrink:0}} onClick={addRemark}>Add PRS Remark</button>
          <textarea className="input" rows={2} value={form.prsRemark} onChange={e=>set("prsRemark",e.target.value)}
            placeholder="Type remark then click Add PRS Remark…" style={{flex:1}}/>
        </div>
        {remarks.length > 0 && (
          <div style={{marginTop:8}}>
            {remarks.map((r,i)=>(
              <div key={i} className="remark-chip">
                <span className="mono" style={{fontSize:10,color:"var(--ink-3)"}}>Remark {i+1}</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="modal-actions">
        <button className="btn" onClick={onClose}>Don't Save and Close</button>
        <span style={{flex:1}}/>
        <button className="btn primary"
          disabled={!person || person.notFound || !form.reason || !form.terminationDate}
          onClick={() => setDone(true)}>
          Save to Pre-Termination
        </button>
      </div>
    </Modal>
  );
}

// ─── PRE-TERMINATION STAGING MODAL ──────────────────────────────
function PreTerminationModal({ record, onClose, onMark, onDelete }) {
  const [done, setDone] = useState(false);
  if (done) return (
    <Modal title="Pre-Termination" onClose={onClose}>
      <div className="submit-success">
        <div className="success-ico">✓</div>
        <h3>Marked for bulk commit</h3>
        <p><strong>{record.personName} {record.personSurname}</strong> is now flagged <em>Mark_for_Termination = TRUE</em> and will be included in the next bulk commit.</p>
        <button className="btn primary" onClick={() => { onMark(record.autoId); onClose(); }} style={{marginTop:16}}>Done</button>
      </div>
    </Modal>
  );
  return (
    <Modal title={"Pre-Termination — " + record.personName + " " + record.personSurname} onClose={onClose}>
      <div className="review-kv">
        <div className="kv-row"><span>ID Card</span><strong className="id">{record.personIdno}</strong></div>
        <div className="kv-row"><span>Reason</span><strong>{record.reason}</strong></div>
        <div className="kv-row"><span>Generic</span><strong>{record.genReason}</strong></div>
        <div className="kv-row"><span>Term. date</span><strong>{record.terminationDate}</strong></div>
        <div className="kv-row"><span>Sex</span><strong>{record.sex}</strong></div>
        <div className="kv-row"><span>Officer</span><strong className="mono">{record.officer}</strong></div>
        <div className="kv-row"><span>Marked for bulk</span>
          <strong>{record.markForTermination ? <span className="tag green">Yes</span> : <span className="tag amber">No</span>}</strong>
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn btn-red" onClick={() => { onDelete && onDelete(record.autoId); onClose(); }}>Delete staging row</button>
        <span style={{flex:1}}/>
        {!record.markForTermination && (
          <button className="btn primary" onClick={() => setDone(true)}>Mark for bulk commit</button>
        )}
        {record.markForTermination && (
          <button className="btn" onClick={onClose}>Already marked — close</button>
        )}
      </div>
    </Modal>
  );
}

// ─── TERM VIEW MODAL ─────────────────────────────────────────────
function TermViewModal({ records, title, onClose }) {
  const [idx, setIdx] = useState(0);
  if (!records || records.length === 0) return (
    <Modal title={title || "View"} onClose={onClose}>
      <div className="submit-success">
        <div className="success-ico" style={{fontSize:36}}>○</div>
        <h3>No records found</h3>
        <p>No records found for this ID card.</p>
        <button className="btn" onClick={onClose} style={{marginTop:12}}>Close</button>
      </div>
    </Modal>
  );
  const r = records[idx];
  return (
    <Modal title={(r.name || title) + " — " + records.length + " Record" + (records.length !== 1 ? "s" : "")} onClose={onClose}>
      <div className="review-kv">
        <div className="kv-row"><span>Auto ID</span><strong className="mono">{r.id || r.autoId || (idx+1)}</strong></div>
        {r.reason       && <div className="kv-row"><span>Reason</span><strong>{r.reason}</strong></div>}
        {r.genReason    && <div className="kv-row"><span>Gen reason</span><strong>{r.genReason}</strong></div>}
        {r.terminationDate && <div className="kv-row"><span>Termination date</span><strong>{r.terminationDate}</strong></div>}
        {r.lastDay      && <div className="kv-row"><span>Last day</span><strong>{r.lastDay}</strong></div>}
        {r.sex          && <div className="kv-row"><span>Sex</span><strong>{r.sex}</strong></div>}
        {r.college      && <div className="kv-row"><span>College</span><strong>{r.college}</strong></div>}
        {r.primarySecondary && <div className="kv-row"><span>Primary / Secondary</span><strong>{r.primarySecondary}</strong></div>}
        {r.gradePosition && <div className="kv-row"><span>Grade / Position</span><strong>{r.gradePosition}</strong></div>}
        {r.comments !== undefined && <div className="kv-row"><span>Comments</span><strong>{r.comments || <span className="muted">—</span>}</strong></div>}
        {r.contractStart && <div className="kv-row"><span>Contract start</span><strong>{r.contractStart}</strong></div>}
        {r.contractEnd   && <div className="kv-row"><span>Contract end</span><strong>{r.contractEnd}</strong></div>}
        {r.grade         && <div className="kv-row"><span>Grade</span><strong>{r.grade}</strong></div>}
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>Close</button>
        <span style={{flex:1}}/>
        <button className="btn" disabled={idx <= 0} onClick={() => setIdx(i => i-1)}>← Previous Record</button>
        <button className="btn" disabled={idx >= records.length-1} onClick={() => setIdx(i => i+1)}>Next Record →</button>
      </div>
    </Modal>
  );
}

// ─── EOC NON-RENEWAL MODAL — End_of_contract_tbl shape ──────────
// Fields: Pers_IDNO, WEF_date, From_grade, Reason, D_B_Name
function EocNrModal({ onClose, onInsert }) {
  const [persIdno, setPersIdno] = useState("");
  const [wefDate, setWefDate]   = useState("");
  const [fromGrade, setFromGrade] = useState("");
  const [reason, setReason]     = useState("Non-renewal");
  const [person, setPerson]     = useState(null);
  const [done, setDone]         = useState(false);

  const lookupPerson = () => {
    const p = D.PEOPLE.find(p => p.idCard.replace(/\s/g,"").toLowerCase() === persIdno.replace(/\s/g,"").toLowerCase());
    setPerson(p ? {...p, notFound:false} : {notFound:true});
    if (p) setFromGrade(p.gradeDesc || "");
  };

  const payload = () => ({
    autoId: Date.now(),
    persIdno, wefDate, fromGrade, toGrade: fromGrade,
    reason, dbName: "Terminations",
  });

  if (done) return (
    <Modal title="End of Contract — Non Renewal" onClose={onClose}>
      <div className="submit-success">
        <div className="success-ico">✓</div>
        <h3>Inserted in End_of_contract_tbl</h3>
        <p>End of Contract (Non Renewal) for <strong>{person?.name} {person?.surname}</strong> has been inserted.</p>
        <button className="btn primary" onClick={() => { onInsert && onInsert(payload()); onClose(); }} style={{marginTop:16}}>Done</button>
      </div>
    </Modal>
  );

  return (
    <Modal title="End of Contract — Non Renewal" onClose={onClose}>
      <div className="field" style={{marginBottom:14}}>
        <label className="field-label">Pers_IDNO (ID Card)</label>
        <div style={{display:"flex",gap:8}}>
          <input className="input" value={persIdno} onChange={e=>setPersIdno(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&lookupPerson()} placeholder="00000000A" style={{flex:1}}/>
          <button className="btn" onClick={lookupPerson}>↵</button>
        </div>
        {person && !person.notFound && <div style={{marginTop:6,fontWeight:600,color:"var(--green)",fontSize:13}}>{person.name} {person.surname}</div>}
        {person?.notFound && <div style={{color:"var(--red)",fontSize:12,marginTop:4}}>ID card not found</div>}
      </div>
      <div className="field" style={{marginBottom:14}}>
        <label className="field-label">WEF Date (With-effect-from)</label>
        <input type="date" className="input" value={wefDate} onChange={e=>setWefDate(e.target.value)} style={{width:"100%"}}/>
      </div>
      <div className="field" style={{marginBottom:14}}>
        <label className="field-label">From_grade (current grade)</label>
        <select className="input" value={fromGrade} onChange={e=>setFromGrade(e.target.value)} style={{width:"100%"}}>
          <option value="">— choose —</option>
          {(X.TEACHING_GRADES||[]).map(g=><option key={g.posi} value={g.posi}>{g.posi}</option>)}
        </select>
      </div>
      <div className="field" style={{marginBottom:14}}>
        <label className="field-label">Reason</label>
        <select className="input" value={reason} onChange={e=>setReason(e.target.value)} style={{width:"100%"}}>
          <option>Non-renewal</option>
          <option>End of fixed term</option>
          <option>Contract expired</option>
        </select>
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>Close</button>
        <button className="btn primary"
          disabled={!person || person.notFound || !fromGrade || !wefDate}
          onClick={() => setDone(true)}>
          Insert In PRS
        </button>
      </div>
    </Modal>
  );
}

// ─── EOC CHANGE-OF-GRADE MODAL — End_of_Contract_Change_of_grade ─
// Fields: Pers_IDNO, WEF_date, From_grade, To_Grade
function EocCgModal({ onClose, onInsert }) {
  const [persIdno, setPersIdno]   = useState("");
  const [wefDate, setWefDate]     = useState("");
  const [fromGrade, setFromGrade] = useState("");
  const [toGrade, setToGrade]     = useState("");
  const [person, setPerson]       = useState(null);
  const [done, setDone]           = useState(false);

  const lookupPerson = () => {
    const p = D.PEOPLE.find(p => p.idCard.replace(/\s/g,"").toLowerCase() === persIdno.replace(/\s/g,"").toLowerCase());
    setPerson(p ? {...p, notFound:false} : {notFound:true});
    if (p) setFromGrade(p.gradeDesc || "");
  };

  const payload = () => ({autoId: Date.now(), persIdno, wefDate, fromGrade, toGrade});

  if (done) return (
    <Modal title="End of Contract — Change in Grade" onClose={onClose}>
      <div className="submit-success">
        <div className="success-ico">✓</div>
        <h3>Inserted in End_of_Contract_Change_of_grade</h3>
        <p>EOC change of grade for <strong>{person?.name} {person?.surname}</strong>: {fromGrade} → {toGrade} WEF {wefDate}.</p>
        <button className="btn primary" onClick={() => { onInsert && onInsert(payload()); onClose(); }} style={{marginTop:16}}>Done</button>
      </div>
    </Modal>
  );

  const grades = (X.TEACHING_GRADES||[]);
  return (
    <Modal title="End of Contract — Change in Grade" onClose={onClose}>
      <div className="field" style={{marginBottom:14}}>
        <label className="field-label">Pers_IDNO (ID Card)</label>
        <div style={{display:"flex",gap:8}}>
          <input className="input" value={persIdno} onChange={e=>setPersIdno(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&lookupPerson()} placeholder="00000000A" style={{flex:1}}/>
          <button className="btn" onClick={lookupPerson}>↵</button>
        </div>
        {person && !person.notFound && <div style={{marginTop:6,fontWeight:600,color:"var(--green)",fontSize:13}}>{person.name} {person.surname}</div>}
        {person?.notFound && <div style={{color:"var(--red)",fontSize:12,marginTop:4}}>ID card not found</div>}
      </div>
      <div className="field" style={{marginBottom:14}}>
        <label className="field-label">WEF Date</label>
        <input type="date" className="input" value={wefDate} onChange={e=>setWefDate(e.target.value)} style={{width:"100%"}}/>
      </div>
      <div className="field-row" style={{gap:12,marginBottom:14}}>
        <div className="field" style={{flex:1}}>
          <label className="field-label">From_grade</label>
          <select title="From grade" className="input" value={fromGrade} onChange={e=>setFromGrade(e.target.value)} style={{width:"100%"}}>
            <option value="">— choose —</option>
            {grades.map(g=><option key={g.posi} value={g.posi}>{g.posi}</option>)}
          </select>
        </div>
        <div className="field" style={{flex:1}}>
          <label className="field-label">To_Grade</label>
          <select title="To grade" className="input" value={toGrade} onChange={e=>setToGrade(e.target.value)} style={{width:"100%"}}>
            <option value="">— choose —</option>
            {grades.map(g=><option key={g.posi} value={g.posi}>{g.posi}</option>)}
          </select>
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>Close</button>
        <button className="btn primary"
          disabled={!person || person.notFound || !fromGrade || !toGrade || !wefDate}
          onClick={() => setDone(true)}>
          Insert In PRS
        </button>
      </div>
    </Modal>
  );
}

window.PageForms = { Modal, NewLeaveModal, ConfKanban, ConfCardModal, WithholdModal, DisciplineModal, AppDetailModal, NewEmployeeModal, TerminationModal, PreTerminationModal, TermViewModal, EocNrModal, EocCgModal };
})();
