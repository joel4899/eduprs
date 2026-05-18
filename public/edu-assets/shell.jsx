// Shell: sidebar nav, topbar, audit drawer, app frame
// Role-based scoping by department.
(function(){
const { useState, useEffect, useMemo, useRef, createContext, useContext } = React;

const D = window.HR_DATA;

// ─────────────────────────────────────────────────────────────────
// ROLES — department-scoped. Super Admin sees everything.
// ─────────────────────────────────────────────────────────────────
const ROLES = {
  "super-admin": {
    label: "Super Admin",
    avatar: "SA",
    person: "Super Admin",
    color: "#7c3aed",
    departments: "all",
  },
  "prs-office": {
    label: "PRS Office",
    avatar: "MB",
    person: "Marisa Borg",
    color: "#0b5cff",
    departments: ["overview","prs-office"],
    hint: "Master personnel records — gatekeeper for all replications.",
  },
  "recruitment": {
    label: "Recruitment",
    avatar: "KM",
    person: "Karl Mifsud",
    color: "#0891b2",
    departments: ["overview","recruitment"],
    hint: "Job calls, applications, ranking, supply seniority.",
  },
  "salaries": {
    label: "Salaries / Pay",
    avatar: "RC",
    person: "Roberta Camilleri",
    color: "#0d9488",
    departments: ["overview","salaries"],
    hint: "Increments.",
  },
  "leaves": {
    label: "Leaves",
    avatar: "JS",
    person: "Janet Sciberras",
    color: "#a16207",
    departments: ["overview","leaves"],
    hint: "Sick & special leaves, GP47.",
  },
  "conf-appointment": {
    label: "Confirmation of Appointment",
    avatar: "FM",
    person: "Francesca Mizzi",
    color: "#0f766e",
    departments: ["overview","conf-appointment"],
    hint: "Probationary confirmations — audit, college, DG, PRS insertion.",
  },
  "discipline-hr": {
    label: "Discipline & HR Plan",
    avatar: "AB",
    person: "Alex Buhagiar",
    color: "#9333ea",
    departments: ["overview","discipline-hr"],
    hint: "Conduct cases, HR Plan, organisational charts.",
  },
  "health-safety": {
    label: "Health & Safety",
    avatar: "PV",
    person: "Pauline Vella",
    color: "#dc2626",
    departments: ["overview","health-safety"],
    hint: "Workplace injuries, vaccinations, medical board.",
  },
  "forms-docs": {
    label: "Forms & Documents",
    avatar: "TS",
    person: "Thomas Spiteri",
    color: "#475569",
    departments: ["overview","forms-docs"],
    hint: "SRS forms, GP47 outflow, dispatch tracking.",
  },
  "terminations": {
    label: "Terminations",
    avatar: "CS",
    person: "Carmen Spiteri",
    color: "#b91c1c",
    departments: ["overview","terminations"],
    hint: "Resignations, retirements, end-of-contracts, dismissals.",
  },
  "transfers-promotions": {
    label: "Transfers & Promotions",
    avatar: "JS",
    person: "Joseph Schembri",
    color: "#1e40af",
    departments: ["overview","transfers-promotions"],
    hint: "Inter-ministry transfers and grade promotions.",
  },
  "progressions": {
    label: "Progressions",
    avatar: "GF",
    person: "George Farrugia",
    color: "#065f46",
    departments: ["overview","progressions"],
    hint: "Scale-band progressions across all 6 tracks: Teachers, EO/HoS, LSE/KGE I–III, Non-teaching.",
  },
  "paypoints": {
    label: "Pay Points",
    avatar: "MC",
    person: "Maria Caruana",
    color: "#2d6db5",
    departments: ["overview","paypoints"],
    hint: "Pay point master list — add, edit, SOP, directorates/colleges.",
  },
};

// ─────────────────────────────────────────────────────────────────
// ROUTES — grouped by department. `dept` key drives role scoping.
// ─────────────────────────────────────────────────────────────────
const ROUTES = [
  { group:"Overview", dept:"overview", items: [
    { id:"dashboard", label:"Dashboard", icon:"▤" },
  ]},
  { group:"PRS Office", dept:"prs-office", items: [
    { id:"prs-office", label:"PRS Office (master)", icon:"★", badge: window.PRS_DATA?.APPROVAL_QUEUE.length, badgeKind:"amber" },
  ]},
  { group:"Recruitment", dept:"recruitment", items: [
    { id:"recruitment-teaching", label:"Recruitment — Teaching", icon:"+" },
    { id:"recruitment-non-teaching", label:"Recruitment — Non-Teaching", icon:"+" },
    { id:"view-result-sheet", label:"View Result Sheet", icon:"▦" },
    { id:"vet-certificates", label:"VET Certificates", icon:"✓" },
  ]},
  { group:"Salaries / Pay", dept:"salaries", items: [
    { id:"increments", label:"Increments", icon:"₪", badge: D.INCREMENTS.filter(i=>i.grantedStatus===0).length },
  ]},
  { group:"Pay Points", dept:"paypoints", items: [
    { id:"paypoints", label:"Pay Points", icon:"⌖" },
  ]},
  { group:"Progressions", dept:"progressions", items: [
    { id:"prog-teachers",     label:"Progressions — Teachers",       icon:"↑" },
    { id:"prog-non-teaching", label:"Progressions — Non-Teaching",   icon:"↑" },
    { id:"prog-eo-hos",       label:"Progressions — EO / HoS",       icon:"↑" },
    { id:"prog-by-qual",      label:"Progression by Qualification",  icon:"↑" },
    { id:"prog-lse-i",        label:"Progression LSE/KGE I",         icon:"↑" },
    { id:"prog-lse-ii",       label:"Progression LSE/KGE II",        icon:"↑" },
    { id:"prog-lse-iii",      label:"Progression LSE/KGE III",       icon:"↑" },
  ]},
  { group:"Leaves", dept:"leaves", items: [
    { id:"leaves", label:"Leaves", icon:"◵" },
    // GP47 form hidden from the sidebar — still reachable from inside
    // the Leaves module via the "Create GP 47" action cards.
    // { id:"gp47", label:"GP47 Form", icon:"▤" },
  ]},
  { group:"Confirmation of Appointment", dept:"conf-appointment", items: [
    { id:"conf-appointment", label:"Confirmation of Appointment", icon:"✓" },
    { id:"conf-indefinite", label:"Confirmation — Indefinite", icon:"✓" },
  ]},
  { group:"Discipline & HR", dept:"discipline-hr", items: [
    { id:"discipline", label:"Discipline", icon:"!" },
    { id:"hr-plan", label:"HR Plan", icon:"▦" },
  ]},
  { group:"Health & Safety", dept:"health-safety", items: [
    { id:"injury", label:"Injury", icon:"+" },
    { id:"vaccine", label:"Vaccine", icon:"✚" },
  ]},
  { group:"Forms & Documents", dept:"forms-docs", items: [
    { id:"forms", label:"Forms (SRS)", icon:"✎" },
    { id:"documents", label:"Docs sent to sections", icon:"≡" },
  ]},
  { group:"Terminations", dept:"terminations", items: [
    { id:"term-carmen", label:"Terminations — Carmen Spiteri", icon:"✕" },
    { id:"term-rudolph", label:"Terminations — Rudolph Farrugia", icon:"✕" },
  ]},
  { group:"Transfers & Promotions", dept:"transfers-promotions", items: [
    { id:"transfers-promotions", label:"Promotion / Transfer", icon:"↔" },
  ]},
];

// App context for selected person, audit log, role, navigation
const AppCtx = createContext(null);
function useApp() { return useContext(AppCtx); }

// TEMP: only show these sections in the sidebar. Remove this allowlist
// (and the .filter call below) to restore all sections.
const VISIBLE_DEPTS = new Set([
  "prs-office",
  "salaries",        // Increments
  "paypoints",
  "progressions",
  "leaves",
  "conf-appointment",
]);

// Filter ROUTES by current role's department scope
function visibleRoutes(roleKey) {
  const role = ROLES[roleKey] || ROLES["super-admin"];
  const scoped = role.departments === "all"
    ? ROUTES
    : ROUTES.filter(g => role.departments.includes(g.dept));
  return scoped.filter(g => VISIBLE_DEPTS.has(g.dept));
}

function Brand() {
  const { roleKey } = useApp();
  const role = ROLES[roleKey] || ROLES["super-admin"];
  return (
    <div className="brand">
      <div className="brand-mark" style={{background: role.color}}>EM</div>
      <div className="brand-text">Education HR<small>Ministry for Education</small></div>
    </div>
  );
}

function Topbar() {
  const { search, setSearch, roleKey, setRoleKey, setSelectedPerson, setView, openAudit } = useApp();
  const role = ROLES[roleKey] || ROLES["super-admin"];
  const [open, setOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const matches = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return D.PEOPLE.filter(p =>
      p.idCard.toLowerCase().includes(q) ||
      `${p.name} ${p.surname}`.toLowerCase().includes(q) ||
      p.empNo.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [search]);

  return (
    <div className="topbar">
      <div className="tb-search" style={{position:"relative"}}>
        <span className="muted">⌕</span>
        <input
          placeholder="Search by ID card, name or employee no…"
          value={search}
          onChange={e=>{setSearch(e.target.value); setOpen(true);}}
          onFocus={()=>setOpen(true)}
          onBlur={()=>setTimeout(()=>setOpen(false), 150)}
        />
        <kbd>⌘K</kbd>
        {open && matches.length > 0 && (
          <div className="dropdown">
            {matches.map(p => (
              <div key={p.idCard} className="rec-row" onMouseDown={()=>{setSelectedPerson(p); setView("employee-detail"); setSearch(""); setOpen(false);}}>
                <div>
                  <div className="nm">{p.name} {p.surname}</div>
                  <div className="gr">{p.gradeDesc} · {p.paypointDesc}</div>
                </div>
                <div className="id">{p.idCard}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="tb-spacer" />
      <button className="tb-btn" onClick={openAudit}>⏱ Audit log</button>
      <div style={{position:"relative"}}>
        <button className="tb-btn role-btn" onClick={()=>setRoleOpen(o=>!o)}>
          <span className="role-dot" style={{background: role.color}} />
          {role.label}
          <span style={{fontSize:9, marginLeft:4}}>▼</span>
        </button>
        {roleOpen && (
          <div className="role-menu" onMouseLeave={()=>setRoleOpen(false)}>
            <div className="role-menu-head">Switch department</div>
            {Object.entries(ROLES).map(([key, r]) => (
              <div key={key} className={"role-opt " + (key === roleKey ? "active":"")} onClick={()=>{setRoleKey(key); setRoleOpen(false);}}>
                <span className="role-dot" style={{background: r.color}} />
                <div style={{flex:1}}>
                  <div className="role-opt-name">{r.label}</div>
                  <div className="role-opt-person">{r.person}</div>
                </div>
                {r.departments === "all" && <span className="tag amber" style={{fontSize:9}}>All access</span>}
              </div>
            ))}
            <div className="role-menu-foot muted xs">Each department sees only its own modules. Super Admin sees everything.</div>
          </div>
        )}
      </div>
      <div className="tb-user">
        <div className="tb-avatar" style={{background: role.color}}>{role.avatar}</div>
        <div style={{fontSize:12}}>{role.person}</div>
      </div>
    </div>
  );
}

function Sidebar() {
  const { view, setView, roleKey } = useApp();
  const groups = visibleRoutes(roleKey);
  // Auto-expand the group that contains the active view; collapse others by default
  const activeGroup = groups.find(g => g.items.some(i => i.id === view || (i.id==="employees" && view==="employee-detail")))?.group;
  const [collapsed, setCollapsed] = useState(() => {
    const map = {};
    groups.forEach(g => { map[g.group] = g.group !== activeGroup && g.items.length > 1; });
    return map;
  });
  // Re-expand current group when view changes to a different group
  useEffect(() => {
    if (activeGroup && collapsed[activeGroup]) {
      setCollapsed(c => ({ ...c, [activeGroup]: false }));
    }
  }, [activeGroup]);
  const toggle = (g) => setCollapsed(c => ({ ...c, [g]: !c[g] }));
  return (
    <div className="sidebar">
      {groups.map(group => (
        <div key={group.group} className={"sb-section " + (collapsed[group.group] ? "collapsed" : "")}>
          <div className="sb-label" onClick={()=>toggle(group.group)}>
            <span>{group.group}</span>
            <span className="chev">▼</span>
          </div>
          {group.items.map(item => (
            <div key={item.id}
              className={"sb-item " + ((view===item.id || (item.id==="employees" && view==="employee-detail")) ? "active":"")}
              onClick={()=>setView(item.id)}>
              <span className="ico">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge != null && <span className={"badge" + (item.badgeKind ? " " + item.badgeKind : "")}>{item.badge}</span>}
            </div>
          ))}
        </div>
      ))}
      <div className="sb-foot muted xs">
        <div>Logged in as</div>
        <div style={{color:"var(--ink-2)", fontWeight:600, marginTop:2}}>{ROLES[roleKey]?.person}</div>
        <div style={{marginTop:2}}>{ROLES[roleKey]?.label}</div>
      </div>
    </div>
  );
}

function AuditDrawer() {
  const { auditOpen, closeAudit } = useApp();
  if (!auditOpen) return null;
  return (
    <div className="drawer-overlay" onClick={closeAudit}>
      <div className="drawer" onClick={e=>e.stopPropagation()}>
        <div className="drawer-head">
          <h3>Audit log</h3>
          <span className="muted" style={{fontSize:11}}>Last 8 entries · all modules</span>
          <button className="btn ghost" style={{marginLeft:"auto"}} onClick={closeAudit}>✕</button>
        </div>
        <div className="drawer-body">
          {D.AUDIT_LOG.map((a, i) => (
            <div key={i} className="audit-row">
              <div className="ts">{a.ts}</div>
              <div className="who">{a.user}</div>
              <div>{a.action} <span className="muted">— {a.entity}</span></div>
              <div className="change"><strong>{a.before}</strong> → <strong>{a.after}</strong></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Restricted-access placeholder for routes outside a role's scope
function NoAccess({ moduleLabel }) {
  return (
    <div className="page">
      <div className="no-access">
        <div className="na-icon">🔒</div>
        <h2>Access restricted</h2>
        <p>You don't have permission to view <strong>{moduleLabel || "this module"}</strong>. Switch to <strong>Super Admin</strong> or the department that owns this module.</p>
      </div>
    </div>
  );
}

// ── Toast — listens to window "toast" events ─────────────────────
function Toast() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    const onToast = (e) => {
      const text = (e.detail && (e.detail.text || e.detail)) || "";
      if (!text) return;
      setMsg({ text: String(text), ts: Date.now() });
      setTimeout(() => setMsg(m => (m && Date.now()-m.ts >= 3900) ? null : m), 4000);
    };
    window.addEventListener("toast", onToast);
    return () => window.removeEventListener("toast", onToast);
  }, []);
  if (!msg) return null;
  return (
    <div className="toast-wrap">
      <div className="toast">✓ {msg.text}</div>
    </div>
  );
}

window.Shell = { Brand, Topbar, Sidebar, AuditDrawer, Toast, AppCtx, useApp, ROUTES, ROLES, visibleRoutes, NoAccess };
})();
