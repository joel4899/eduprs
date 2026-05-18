// Extended PRS_Office data — full schema fidelity for the master DB
// Tables: PRS_records, PRS_Remarks, PRS_Allowance, PRS_SECQ, CustDetails_PRS,
//         CustomerDetails_tbl (full variant), Officer_tbl, TeachingGrades, Back_up_Date

window.PRS_DATA = (() => {
  const D = window.HR_DATA;

  // ── Officers (Officer_tbl) ────────────────────────────────────
  const OFFICERS = [
    { idx: 1, offNumber: 1, title: "Ms",  nameCC: "Marisa",  surname: "Borg",      maiden: "Galea",     username: "borgm196", permissions: "Officer",       idcard: "0345621M", email: "marisa.borg@gov.mt",    showAtt: true, gradeOff: "Officer in Scale 10" },
    { idx: 2, offNumber: 2, title: "Mr",  nameCC: "Joseph",  surname: "Schembri",  maiden: null,        username: "schej201", permissions: "Administrator", idcard: "0118843M", email: "joseph.schembri@gov.mt", showAtt: true, gradeOff: "Senior Officer in Scale 7" },
    { idx: 3, offNumber: 3, title: "Ms",  nameCC: "Carmen",  surname: "Spiteri",   maiden: "Camilleri", username: "spitc188", permissions: "Officer",       idcard: "0420098M", email: "carmen.spiteri@gov.mt", showAtt: true, gradeOff: "Officer in Scale 9" },
    { idx: 4, offNumber: 4, title: "Mr",  nameCC: "Rudolph", surname: "Farrugia",  maiden: null,        username: "farrr149", permissions: "Officer",       idcard: "0292218M", email: "rudolph.farrugia@gov.mt", showAtt: true, gradeOff: "Officer in Scale 9" },
    { idx: 5, offNumber: 5, title: "Ms",  nameCC: "Stephanie", surname: "Camilleri", maiden: null,      username: "camis087", permissions: "Officer",       idcard: "0166532M", email: "stephanie.camilleri@gov.mt", showAtt: true, gradeOff: "Officer in Scale 10" },
    { idx: 6, offNumber: 6, title: "Mr",  nameCC: "Anton",   surname: "Galea",     maiden: null,        username: "galea045", permissions: "Read Only",     idcard: "0411902M", email: "anton.galea@gov.mt",    showAtt: true, gradeOff: "Clerical 2" },
    { idx: 7, offNumber: 7, title: "Mrs", nameCC: "Annalise", surname: "Vella",    maiden: "Bonnici",   username: "vella312", permissions: "Administrator", idcard: "0228671M", email: "annalise.vella@gov.mt", showAtt: true, gradeOff: "Manager in Scale 5" },
    { idx: 8, offNumber: 8, title: "Mr",  nameCC: "Karl",    surname: "Mifsud",    maiden: null,        username: "mifsk221", permissions: "Officer",       idcard: "0507112M", email: "karl.mifsud@gov.mt",    showAtt: true, gradeOff: "Officer in Scale 10" },
  ];

  // ── PRS file numbers (CustDetails_PRS) ────────────────────────
  const FILE_NUMBERS = D.PEOPLE.slice(0, 50).map((p, i) => ({
    idCard: p.idCard,
    persFileNo: "PRS/" + (1000 + i * 7) + "/" + (60 + (i % 30)),
    woPens: i % 9 === 0 ? "PW " + (4000 + i) : null,
    uploaded: true,
  }));

  // ── Reasons used in PRS_records ───────────────────────────────
  const PRS_REASONS = [
    "First Appointment", "Progression", "Promotion", "COLA", "Transfer",
    "Termination", "End of contract", "Move to part-time", "Move to full-time",
    "Allowance grant", "Disciplinary entry", "Confirmation in grade", "Resignation",
    "Superannuation", "Death in service",
  ];

  // ── Hero record: full PRS service history (richer) ────────────
  // Roberta Camilleri 0259684M
  const HERO_ID = "0259684M";
  const HERO_PRS = [
    { autoId: 184221, idCard: HERO_ID, position: "Supply Teacher",  dept: "Educ", salScale: "11/1", salary: "€20480.00", fromDate: "2008-09-29", reason: "First Appointment",      reasonSummary: "Engaged as supply teacher", addEmm: "Engaged on temporary basis pending availability of Scholastic Year teaching post.", showInGP47: true, sentToOfficer: true, approvedRecords: true, uploaded: true, officer: "borgm196",  dateAdded: "2008-09-30", timeAdded: "10:14", approvedBy: "schej201", approvedDate: "2008-10-02" },
    { autoId: 187004, idCard: HERO_ID, position: "Teacher",         dept: "Educ", salScale: "10/1", salary: "€21115.00", fromDate: "2010-09-29", reason: "First Appointment",      reasonSummary: "Probationary appointment", addEmm: "Appointed Teacher (Mathematics) following recruitment call PROF/2010/048. Probation period 12 months WEF 29.09.2010.", showInGP47: true, sentToOfficer: true, approvedRecords: true, uploaded: true, officer: "borgm196", dateAdded: "2010-09-30", timeAdded: "08:42", approvedBy: "schej201", approvedDate: "2010-10-04" },
    { autoId: 198451, idCard: HERO_ID, position: "Teacher",         dept: "Educ", salScale: "10/2", salary: "€21512.00", fromDate: "2011-09-29", reason: "Confirmation in grade", reasonSummary: "Probation completed", addEmm: "Confirmed in grade following successful completion of probation. Letter Ref. CONF/2011/0942.", showInGP47: true, sentToOfficer: true, approvedRecords: true, uploaded: true, officer: "borgm196", dateAdded: "2011-10-15", timeAdded: "09:30", approvedBy: "schej201", approvedDate: "2011-10-18" },
    { autoId: 204882, idCard: HERO_ID, position: "Teacher",         dept: "Educ", salScale: "10/3", salary: "€22019.00", fromDate: "2012-09-29", reason: "Progression",            reasonSummary: "Annual progression", addEmm: "Annual scale progression — Step 3.", showInGP47: false, sentToOfficer: true, approvedRecords: true, uploaded: true, officer: "borgm196", dateAdded: "2012-10-02", timeAdded: "10:00", approvedBy: "schej201", approvedDate: "2012-10-05" },
    { autoId: 219003, idCard: HERO_ID, position: "Teacher",         dept: "Educ", salScale: "10/3", salary: "€22591.00", fromDate: "2013-01-01", reason: "COLA",                   reasonSummary: "COLA 2013", addEmm: "Cost of Living Allowance — Budget Measures 2013.", showInGP47: false, sentToOfficer: true, approvedRecords: true, uploaded: true, officer: "schej201", dateAdded: "2013-01-15", timeAdded: "11:22", approvedBy: "schej201", approvedDate: "2013-01-15" },
    { autoId: 233412, idCard: HERO_ID, position: "Teacher",         dept: "Educ", salScale: "9/1",  salary: "€23456.00", fromDate: "2014-09-29", reason: "Progression",            reasonSummary: "Scale change to 9", addEmm: "Progressed from Scale 10 to Scale 9 in terms of teachers' Sectoral Agreement (4 yrs in Scale 10).", showInGP47: true, sentToOfficer: true, approvedRecords: true, uploaded: true, officer: "borgm196", dateAdded: "2014-09-30", timeAdded: "08:55", approvedBy: "schej201", approvedDate: "2014-10-02" },
    { autoId: 251220, idCard: HERO_ID, position: "Teacher",         dept: "Educ", salScale: "9/3",  salary: "€24592.32", fromDate: "2018-09-29", reason: "Progression",            reasonSummary: "Step 3", addEmm: "Annual progression to Step 3 in Scale 9.", showInGP47: false, sentToOfficer: true, approvedRecords: true, uploaded: true, officer: "borgm196", dateAdded: "2018-10-01", timeAdded: "09:04", approvedBy: "schej201", approvedDate: "2018-10-04" },
    { autoId: 278994, idCard: HERO_ID, position: "Teacher",         dept: "Educ", salScale: "8/1",  salary: "€26102.18", fromDate: "2021-09-29", reason: "Progression",            reasonSummary: "Scale change to 8", addEmm: "Progressed to Scale 8 on completion of 7 yrs in Scale 9 (Sectoral Agreement Art. 14.3).", showInGP47: true, sentToOfficer: true, approvedRecords: true, uploaded: true, officer: "borgm196", dateAdded: "2021-09-30", timeAdded: "10:11", approvedBy: "schej201", approvedDate: "2021-10-04" },
    { autoId: 295114, idCard: HERO_ID, position: "Teacher",         dept: "Educ", salScale: "8/4",  salary: "€27512.00", fromDate: "2024-09-29", reason: "Progression",            reasonSummary: "Step 4", addEmm: "Annual progression to Step 4 in Scale 8.", showInGP47: false, sentToOfficer: true, approvedRecords: true, uploaded: true, officer: "camis087", dateAdded: "2024-09-30", timeAdded: "09:18", approvedBy: "schej201", approvedDate: "2024-10-02" },
    // Pending entry — illustrates approval flow
    { autoId: 309998, idCard: HERO_ID, position: "Teacher",         dept: "Educ", salScale: "8/5",  salary: "€28104.00", fromDate: "2026-09-29", reason: "Progression",            reasonSummary: "Step 5 (draft)", addEmm: "Annual progression to Step 5. PENDING senior officer review.", showInGP47: false, sentToOfficer: true, approvedRecords: false, uploaded: false, officer: "borgm196", dateAdded: "2026-04-22", timeAdded: "14:32", approvedBy: null, approvedDate: null },
  ];

  // ── PRS_Allowance for hero ────────────────────────────────────
  const HERO_ALLOWANCES = [
    { id: 8821, idCard: HERO_ID, nature: "Mathematics graduate allowance",          fromAll: "2014-09-29", toAll: null,          rateAll: "€1100 pa", authorityAll: "Educ. All. 14/2014",  officer: "borgm196", dateAdded: "2014-10-02", sentToOfficer: true, approvedAllowance: true, uploaded: true },
    { id: 9412, idCard: HERO_ID, nature: "MATSEC Examiner allowance",                fromAll: "2019-05-01", toAll: "2024-08-31",  rateAll: "€350 sessional", authorityAll: "MATSEC Reg. Art. 12", officer: "borgm196", dateAdded: "2019-05-08", sentToOfficer: true, approvedAllowance: true, uploaded: true },
    { id: 10122, idCard: HERO_ID, nature: "Mentoring allowance — newly qualified",   fromAll: "2023-09-01", toAll: "2024-08-31",  rateAll: "€750 pa",  authorityAll: "Sectoral 2017 Art. 22", officer: "camis087", dateAdded: "2023-09-12", sentToOfficer: true, approvedAllowance: true, uploaded: true },
    { id: 11008, idCard: HERO_ID, nature: "Master qualification allowance — MQF 7",  fromAll: "2018-09-01", toAll: null,          rateAll: "€1250 pa", authorityAll: "PSMC Art. 1.6.5",     officer: "schej201", dateAdded: "2018-09-15", sentToOfficer: true, approvedAllowance: true, uploaded: true },
  ];

  // ── PRS_SECQ — qualifications on service record ───────────────
  const HERO_SECQ = [
    { autoId: 4421, idCard: HERO_ID, secq: "B.Ed. (Hons) Mathematics — University of Malta",                                officer: "borgm196", dateAdded: "2008-09-29", sentToOfficer: true, approvedSecq: true },
    { autoId: 5012, idCard: HERO_ID, secq: "PGCE Secondary Mathematics — University of Malta",                              officer: "borgm196", dateAdded: "2010-08-15", sentToOfficer: true, approvedSecq: true },
    { autoId: 6633, idCard: HERO_ID, secq: "Master in Educational Leadership and Management — University of Malta",        officer: "schej201", dateAdded: "2018-08-22", sentToOfficer: true, approvedSecq: true },
    { autoId: 7104, idCard: HERO_ID, secq: "Award in Special Educational Needs (MQF Level 5) — Inst. for Education",       officer: "camis087", dateAdded: "2022-06-10", sentToOfficer: true, approvedSecq: true },
  ];

  // ── PRS_Remarks for hero (richer) ─────────────────────────────
  const HERO_REMARKS = [
    { autoId: 12001, idCard: HERO_ID, date: "2008-09-29", type: "Service",          text: "Engaged as Supply Teacher pending recruitment call.",                                                                                             officer: "borgm196", approvedRemarks: true,  uploaded: true },
    { autoId: 12504, idCard: HERO_ID, date: "2010-09-29", type: "Service",          text: "Appointed Teacher (Mathematics) on probation. Recruitment call PROF/2010/048, ranked 12.",                                                       officer: "borgm196", approvedRemarks: true,  uploaded: true },
    { autoId: 12892, idCard: HERO_ID, date: "2011-10-15", type: "Service",          text: "Confirmed in grade following successful probation period.",                                                                                       officer: "borgm196", approvedRemarks: true,  uploaded: true },
    { autoId: 13550, idCard: HERO_ID, date: "2013-04-08", type: "General",          text: "Awarded MATSEC Subject Co-ordinator (Mathematics) status, 2013/14 academic year.",                                                                officer: "schej201", approvedRemarks: true,  uploaded: true },
    { autoId: 14702, idCard: HERO_ID, date: "2018-09-15", type: "Qualification",    text: "Master in Educational Leadership recognised by MFHEA — qualification allowance approved WEF 01.09.2018.",                                       officer: "schej201", approvedRemarks: true,  uploaded: true },
    { autoId: 15440, idCard: HERO_ID, date: "2021-09-29", type: "Service",          text: "Progressed to Scale 8 on completion of 7 yrs in Scale 9.",                                                                                        officer: "borgm196", approvedRemarks: true,  uploaded: true },
    { autoId: 16108, idCard: HERO_ID, date: "2023-04-12", type: "General",          text: "Appointed mentor for newly qualified teachers — Academic Year 2023/24. Mentoring allowance approved.",                                          officer: "camis087", approvedRemarks: true,  uploaded: true },
    { autoId: 17221, idCard: HERO_ID, date: "2026-04-22", type: "Service (draft)",  text: "Annual progression Step 5 in Scale 8 entered. Awaiting senior officer review.",                                                                  officer: "borgm196", approvedRemarks: false, uploaded: false },
  ];

  // ── Backup info ───────────────────────────────────────────────
  const LAST_BACKUP = { lastBackupDate: "2026-04-27 23:00", schemaVersion: 7, dbName: "PRS_Office.accdb" };

  // ── PRS-wide aggregate stats for the workspace overview ───────
  const PRS_STATS = {
    prsRecordsTotal: 315095,
    prsRecordsPending: 412,
    prsRecordsThisMonth: 1184,
    customerDetailsTotal: 13602,
    customerDetailsApproved: 13241,
    customerDetailsStillInService: 9847,
    remarksTotal: 26530,
    remarksPending: 88,
    allowanceTotal: 43465,
    allowanceActive: 14721,
    secqTotal: 6613,
    fileNumbersTotal: 2520,
  };

  // ── Recent PRS activity feed (cross-employee) ─────────────────
  // Each entry mimics one PRS_records row; status flags shown.
  const RECENT_PRS = D.PEOPLE.slice(1, 14).map((p, i) => {
    const reason = PRS_REASONS[(i * 3) % PRS_REASONS.length];
    const stage = i % 4; // 0 draft, 1 sent, 2 approved, 3 uploaded
    return {
      autoId: 310000 + i,
      idCard: p.idCard,
      name: `${p.name} ${p.surname}`,
      position: p.gradeDesc,
      dept: p.teaching ? "Educ" : "Admin",
      salScale: `${p.lastSalScale}/${(i % 7) + 1}`,
      salary: "€" + (20000 + i * 612).toLocaleString(),
      fromDate: `2026-0${(i % 4) + 1}-${String((i * 3) % 28 + 1).padStart(2, "0")}`,
      reason,
      addEmm: "—",
      officer: ["borgm196","camis087","spitc188","farrr149"][i % 4],
      sentToOfficer: stage >= 1,
      approvedRecords: stage >= 2,
      uploaded: stage >= 3,
      showInGP47: reason !== "COLA",
    };
  });

  // ── Approval queue for senior officers (the SentToOfficer=true & Approved=false rows) ──
  const APPROVAL_QUEUE = RECENT_PRS.filter(r => r.sentToOfficer && !r.approvedRecords);

  return {
    OFFICERS, FILE_NUMBERS, HERO_ID, HERO_PRS, HERO_ALLOWANCES, HERO_SECQ, HERO_REMARKS,
    PRS_REASONS, LAST_BACKUP, PRS_STATS, RECENT_PRS, APPROVAL_QUEUE,
  };
})();
