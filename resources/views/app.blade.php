<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>PRS System · Ministry for Education</title>
<meta name="csrf-token" content="{{ csrf_token() }}">
<link rel="stylesheet" href="{{ asset('edu-assets/styles.css') }}?v={{ config('app.asset_v', '20') }}"/>

<style>
    /* Laravel-owned overlay: a small "Signed in as … · Sign out" badge sits
       on top of the edu app so the user can leave without touching the
       edu role-switcher. */
    .prs-auth-badge {
        position: fixed; top: 8px; right: 14px; z-index: 9999;
        display: flex; align-items: center; gap: 10px;
        background: #ffffff; border: 1px solid #e2e8f0; border-radius: 999px;
        padding: 4px 8px 4px 12px; font-size: 12px; color: #475569;
        box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .prs-auth-badge .prs-auth-name { font-weight: 600; color: #0f172a; }
    .prs-auth-badge form { margin: 0; }
    .prs-auth-badge button {
        background: transparent; border: 0; color: #0b5cff; cursor: pointer;
        font: inherit; padding: 4px 8px; border-radius: 4px;
    }
    .prs-auth-badge button:hover { background: #f1f5f9; }
</style>
</head>
<body>

<div class="prs-auth-badge">
    <span>Signed in as <span class="prs-auth-name">{{ auth()->user()->name }}</span></span>
    <form method="POST" action="{{ route('logout') }}">
        @csrf
        <button type="submit">Sign out</button>
    </form>
</div>

<div id="root"></div>

{{-- Inject the logged-in user's role so the edu shell picks it up as
     `tweaks.role`. The edu app's TWEAK_DEFAULTS resolves from this. --}}
<script>
window.PRS_USER = {!! json_encode([
    'id'    => auth()->id(),
    'name'  => auth()->user()->name,
    'email' => auth()->user()->email,
    'role'  => auth()->user()->role ?? 'super-admin',
]) !!};
</script>

<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" crossorigin="anonymous"></script>

<script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"></script>
<script src="{{ asset('edu-assets/data.js') }}?v={{ config('app.asset_v', '20') }}"></script>
<script src="{{ asset('edu-assets/data-prs.js') }}?v={{ config('app.asset_v', '20') }}"></script>
<script src="{{ asset('edu-assets/data-deep.js') }}?v={{ config('app.asset_v', '20') }}"></script>
<script type="text/babel" src="{{ asset('edu-assets/tweaks-panel.jsx') }}?v={{ config('app.asset_v', '20') }}"></script>
<script type="text/babel" src="{{ asset('edu-assets/shell.jsx') }}?v={{ config('app.asset_v', '20') }}"></script>
<script type="text/babel" src="{{ asset('edu-assets/pages-a.jsx') }}?v={{ config('app.asset_v', '20') }}"></script>
<script type="text/babel" src="{{ asset('edu-assets/pages-b.jsx') }}?v={{ config('app.asset_v', '20') }}"></script>
<script type="text/babel" src="{{ asset('edu-assets/pages-c.jsx') }}?v={{ config('app.asset_v', '20') }}"></script>
<script type="text/babel" src="{{ asset('edu-assets/pages-d.jsx') }}?v={{ config('app.asset_v', '20') }}"></script>
<script type="text/babel" src="{{ asset('edu-assets/page-prs-office.jsx') }}?v={{ config('app.asset_v', '20') }}"></script>
<script type="text/babel" src="{{ asset('edu-assets/page-pay-prog.jsx') }}?v={{ config('app.asset_v', '20') }}"></script>
<script type="text/babel" src="{{ asset('edu-assets/page-lifecycle.jsx') }}?v={{ config('app.asset_v', '20') }}"></script>
<script type="text/babel" src="{{ asset('edu-assets/page-welfare-rec.jsx') }}?v={{ config('app.asset_v', '20') }}"></script>
<script type="text/babel" src="{{ asset('edu-assets/page-extras.jsx') }}?v={{ config('app.asset_v', '20') }}"></script>
<script type="text/babel" src="{{ asset('edu-assets/page-forms.jsx') }}?v={{ config('app.asset_v', '20') }}"></script>

@verbatim
<script type="text/babel" data-presets="react">
const { useState } = React;
const { Brand, Topbar, Sidebar, AuditDrawer, Toast, AppCtx, ROLES, visibleRoutes, NoAccess } = window.Shell;

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  componentDidCatch(e) { console.error("[ErrorBoundary]", e); }
  render() {
    if (this.state.error) {
      return (
        <div className="page">
          <div className="no-access">
            <div className="na-icon">⚠</div>
            <h2>Page error</h2>
            <p style={{fontSize:13,color:"var(--ink-2)",marginBottom:12}}>This view encountered a runtime error and could not render.</p>
            <code style={{fontSize:11,color:"#c0392b",display:"block",marginBottom:16,whiteSpace:"pre-wrap"}}>{this.state.error.message}</code>
            <button className="btn primary" onClick={()=>this.setState({error:null})}>Try again</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const { Dashboard, EmployeesList, EmployeeDetail, PRSView, LeavesView } = window.PageA;
const { PRSOffice } = window.PRSOffice;
const { IncrementsDeep, ProgressionsDeep } = window.PagePayProg;
const { RecruitmentDeep, RecruitmentNonTeachingDeep, RecruitmentTeachingDeep, FormsDeep, TransfersDeep, TerminationsDeep } = window.PageLifecycle;
const { LeavesDeep, GP47Deep, InjuryDeep, HRPlanDeep } = window.PageWelfareRec;
const { Vaccine, ConfAppointment, ConfIndefinite, ViewResultSheet, VETCerts, DisciplineDeep, PayPointsDeep } = window.PageExtras;
const { Documents } = window.PageD;

// Pull the role from the Laravel-injected window.PRS_USER. The edu shell
// reads `tweaks.role`; we seed it from the authenticated user.
const TWEAK_DEFAULTS = { role: window.PRS_USER?.role || "super-admin" };

const VIEWS = {
  "dashboard":       { dept:"overview",   render:()=><Dashboard/> },
  "employees":       { dept:"overview",   render:()=><EmployeesList/> },
  "employee-detail": { dept:"overview",   render:()=><EmployeeDetail/> },
  "prs-view":        { dept:"overview",   render:()=><PRSView/> },
  "leaves-view":     { dept:"overview",   render:()=><LeavesView/> },
  "prs-office":      { dept:"prs-office", render:()=><PRSOffice/> },
  "recruitment-teaching":     { dept:"recruitment", render:()=><RecruitmentTeachingDeep/> },
  "recruitment-non-teaching": { dept:"recruitment", render:()=><RecruitmentNonTeachingDeep/> },
  "view-result-sheet":        { dept:"recruitment", render:()=><ViewResultSheet/> },
  "vet-certificates":         { dept:"recruitment", render:()=><VETCerts/> },
  "increments":          { dept:"salaries", render:()=><IncrementsDeep/> },
  "paypoints":           { dept:"paypoints", render:()=><PayPointsDeep/> },
  "prog-teachers":       { dept:"progressions", render:()=><ProgressionsDeep initial="teachers"/> },
  "prog-non-teaching":   { dept:"progressions", render:()=><ProgressionsDeep initial="non-teach"/> },
  "prog-eo-hos":         { dept:"progressions", render:()=><ProgressionsDeep initial="eo-hos"/> },
  "prog-by-qual":        { dept:"progressions", render:()=><ProgressionsDeep initial="lse-qual"/> },
  "prog-lse-i":          { dept:"progressions", render:()=><ProgressionsDeep initial="lse-i"/> },
  "prog-lse-ii":         { dept:"progressions", render:()=><ProgressionsDeep initial="lse-ii"/> },
  "prog-lse-iii":        { dept:"progressions", render:()=><ProgressionsDeep initial="lse-iii"/> },
  "leaves":              { dept:"leaves", render:()=><LeavesDeep/> },
  "gp47":                { dept:"leaves", render:()=><GP47Deep/> },
  "conf-appointment":    { dept:"conf-appointment", render:()=><ConfAppointment/> },
  "conf-indefinite":     { dept:"conf-appointment", render:()=><ConfIndefinite/> },
  "discipline":  { dept:"discipline-hr", render:()=><DisciplineDeep/> },
  "hr-plan":     { dept:"discipline-hr", render:()=><HRPlanDeep/> },
  "injury":      { dept:"health-safety", render:()=><InjuryDeep/> },
  "vaccine":     { dept:"health-safety", render:()=><Vaccine/> },
  "forms":       { dept:"forms-docs", render:()=><FormsDeep/> },
  "documents":   { dept:"forms-docs", render:()=><Documents/> },
  "term-carmen":   { dept:"terminations", render:()=><TerminationsDeep initial="carmen"/> },
  "term-rudolph":  { dept:"terminations", render:()=><TerminationsDeep initial="rudolph"/> },
  "transfers-promotions": { dept:"transfers-promotions", render:()=><TransfersDeep/> },
};

function App() {
  const [view, setView] = useState("dashboard");
  const [selectedPerson, setSelectedPerson] = useState(window.HR_DATA.PEOPLE[0]);
  const [search, setSearch] = useState("");
  const [auditOpen, setAuditOpen] = useState(false);
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const roleKey = tweaks.role && ROLES[tweaks.role] ? tweaks.role : "super-admin";

  const setRoleKey = (newRole) => {
    setTweak("role", newRole);
    setView("dashboard");
  };

  const role = ROLES[roleKey];
  const ctx = {
    view, setView,
    selectedPerson, setSelectedPerson,
    search, setSearch,
    roleKey, setRoleKey, role,
    auditOpen, openAudit:()=>setAuditOpen(true), closeAudit:()=>setAuditOpen(false),
  };

  const v = VIEWS[view] || VIEWS["dashboard"];
  const canSee = role.departments === "all" || role.departments.includes(v.dept);
  const body = canSee ? v.render() : <NoAccess moduleLabel={view}/>;

  return (
    <AppCtx.Provider value={ctx}>
      <div className="app">
        <Brand/>
        <Topbar/>
        <Sidebar/>
        <main className="main"><ErrorBoundary key={view}>{body}</ErrorBoundary></main>
        <AuditDrawer/>
        <Toast/>
      </div>
      {window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection title="Active department">
            <window.TweakSelect
              label="Logged-in role"
              value={roleKey}
              options={Object.entries(ROLES).map(([k,r])=>({value:k, label:r.label + " — " + r.person}))}
              onChange={v=>setRoleKey(v)}
            />
            <p style={{fontSize:11, color:"var(--ink-3)", marginTop:6}}>
              Each department sees only its own modules. Super Admin sees everything.
            </p>
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </AppCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
</script>
@endverbatim

</body>
</html>
