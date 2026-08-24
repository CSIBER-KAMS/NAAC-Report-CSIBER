/**
 * Realistic sample data for end-to-end testing and the demo.
 *
 * Fills year 2025-26 with plausible CSIBER data: Part A identity fields,
 * Extended Profile rows/headlines, every Criterion 1 metric, and two
 * change requests. Idempotent — existing sample rows for the year are
 * deleted before re-insertion.
 *
 *   npx tsx scripts/sample-data.ts
 *
 * NOTE: all values below are GENERIC SAMPLE TEXT for demonstration only,
 * not audited institutional data.
 */
import { getDb } from '../src/lib/db';
import type { MetricPayload, MetricStatus } from '../src/catalog/types';

const db = getDb();
const YEAR_LABEL = '2025-26';

/* ------------------------------------------------------------------ */
/* 1. Ensure the year exists                                           */
/* ------------------------------------------------------------------ */

db.prepare('INSERT OR IGNORE INTO years (label) VALUES (?)').run(YEAR_LABEL);
const yearRow = db
  .prepare('SELECT id FROM years WHERE label = ?')
  .get(YEAR_LABEL) as { id: number };
const yearId = yearRow.id;

const anyUser = db
  .prepare('SELECT id FROM users ORDER BY id LIMIT 1')
  .get() as { id: number } | undefined;
const userId = anyUser?.id ?? null;

/* ------------------------------------------------------------------ */
/* Wipe previous sample rows for this year (idempotency)               */
/* ------------------------------------------------------------------ */

db.prepare('DELETE FROM metric_values WHERE year_id = ?').run(yearId);
db.prepare('DELETE FROM table_rows WHERE year_id = ?').run(yearId);
db.prepare('DELETE FROM change_requests WHERE year_id = ?').run(yearId);
db.prepare('DELETE FROM part_a WHERE year_id = ?').run(yearId);

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const upsertMetric = db.prepare(
  `INSERT INTO metric_values (year_id, metric_id, payload, status, updated_by, updated_at)
   VALUES (?, ?, ?, ?, ?, datetime('now'))
   ON CONFLICT (year_id, metric_id) DO UPDATE SET
     payload = excluded.payload,
     status = excluded.status,
     updated_by = excluded.updated_by,
     updated_at = excluded.updated_at`
);

const insertRow = db.prepare(
  `INSERT INTO table_rows (year_id, metric_id, table_key, row_index, data)
   VALUES (?, ?, ?, ?, ?)`
);

let metricCount = 0;
let rowCount = 0;

function setMetric(
  metricId: string,
  payload: MetricPayload,
  status: MetricStatus = 'complete'
) {
  upsertMetric.run(yearId, metricId, JSON.stringify(payload), status, userId);
  metricCount++;
}

function setRows(
  metricId: string,
  tableKey: string,
  rows: Record<string, unknown>[]
) {
  rows.forEach((row, i) => {
    insertRow.run(yearId, metricId, tableKey, i, JSON.stringify(row));
    rowCount++;
  });
}

/* ------------------------------------------------------------------ */
/* 2. Part A — Data of the Institution                                 */
/*    Written below as "<sectionKey>.<fieldKey>" for readability, then  */
/*    converted to the real storage shape the app uses everywhere:      */
/*    { [sectionKey]: { [fieldKey]: value, _rows?: Row[] } } — see      */
/*    PartAValues in src/components/PartAForm.tsx.                      */
/* ------------------------------------------------------------------ */

const partAPayloadFlat: Record<string, unknown> = {
  // 1. Name of the Institution
  'institution.institution_name':
    'Chhatrapati Shahu Institute of Business Education and Research (CSIBER), Kolhapur',
  'institution.head_name': 'Dr. S. Sample Director',
  'institution.designation': 'Director',
  'institution.own_campus': 'Yes',
  'institution.phone': '0231-2535706',
  'institution.mobile': '9876500000',
  'institution.registered_email': 'director@siberindia.edu.in',
  'institution.alternate_email': 'iqac@siberindia.edu.in',
  'institution.address': 'University Road, Kolhapur, Maharashtra',
  'institution.city': 'Kolhapur',
  'institution.state': 'Maharashtra',
  'institution.pin_code': '416004',
  // 2. Institutional status
  'status.autonomy_date': '2005-06-01',
  'status.institution_type': 'Co-education',
  'status.location': 'Urban',
  'status.financial_status': 'Self financing',
  'status.financial_status_details': 'Self-financing autonomous institute',
  'status.iqac_coordinator': 'Dr. P. Sample Coordinator',
  'status.iqac_phone': '0231-2535707',
  'status.iqac_mobile': '9876500001',
  'status.iqac_email': 'iqac@siberindia.edu.in',
  'status.iqac_alternate_email': 'quality@siberindia.edu.in',
  // 3. Website address
  'website.website': 'https://www.siberindia.edu.in',
  'website.aqar_weblink': 'https://www.siberindia.edu.in/iqac/aqar-2024-25',
  // 4. Academic calendar
  'academicCalendar.prepared': 'Yes',
  'academicCalendar.uploaded': 'Yes',
  'academicCalendar.weblink':
    'https://www.siberindia.edu.in/academic-calendar-2025-26',
  // 5. Accreditation details (fixedRows table: 1st..5th)
  'accreditation.rows': [
    {
      cycle: '1st',
      grade: 'A',
      cgpa: 3.16,
      year_of_accreditation: '2004',
      validity_from: '2004-09-16',
      validity_to: '2009-09-15',
    },
    {
      cycle: '2nd',
      grade: 'A',
      cgpa: 3.25,
      year_of_accreditation: '2011',
      validity_from: '2011-09-16',
      validity_to: '2016-09-15',
    },
    {
      cycle: '3rd',
      grade: 'A',
      cgpa: 3.3,
      year_of_accreditation: '2017',
      validity_from: '2017-11-01',
      validity_to: '2022-10-31',
    },
    {
      cycle: '4th',
      grade: 'A+',
      cgpa: 3.42,
      year_of_accreditation: '2023',
      validity_from: '2023-03-01',
      validity_to: '2028-02-29',
    },
  ],
  // 6. Date of establishment of IQAC
  'iqacEstablishment.establishment_date': '2004-06-15',
  // 7. Quality initiatives by IQAC
  'qualityInitiatives.rows': [
    {
      initiative: 'Academic and Administrative Audit (AAA) of all departments',
      date_duration: '12-13 January 2026 (2 days)',
      participants: 85,
    },
    {
      initiative: 'Workshop on Outcome Based Education and CO-PO mapping',
      date_duration: '22 August 2025 (1 day)',
      participants: 62,
    },
    {
      initiative: 'Feedback analysis and action-taken review meeting',
      date_duration: '10 December 2025 (half day)',
      participants: 34,
    },
    {
      initiative: 'Participation in NIRF 2026 data submission',
      date_duration: 'November 2025',
      participants: 12,
    },
  ],
  // 8. Special status
  'specialStatus.rows': [
    {
      unit: 'Institution',
      scheme: 'UGC Autonomous Status',
      funding_agency: 'UGC',
      year_of_award: '2005 (extended 2021, 6 years)',
      amount: 0,
    },
  ],
  // 9. IQAC composition
  'iqacComposition.as_per_guidelines': 'Yes',
  'iqacComposition.notification_link':
    'https://www.siberindia.edu.in/iqac/composition-2025-26',
  // 10. IQAC meetings
  'iqacMeetings.meetings_held': 4,
  'iqacMeetings.minutes_uploaded': 'Yes',
  // 11. IQAC funding
  'iqacFunding.funding_received': 'No',
  // 12. Significant contributions (max five bullets)
  'contributions.rows': [
    {
      contribution:
        'Institutionalised outcome-based curriculum review across all seven postgraduate and undergraduate programmes.',
    },
    {
      contribution:
        'Introduced four new value-added courses on transferable and life skills with industry partners.',
    },
    {
      contribution:
        'Streamlined online stakeholder feedback collection and published action-taken reports on the website.',
    },
    {
      contribution:
        'Completed Academic and Administrative Audit of all departments and tracked compliance actions.',
    },
    {
      contribution:
        'Strengthened internship and field-project mentoring through a structured supervisor allocation system.',
    },
  ],
  // 13. Plan of action and outcomes
  'planOfAction.rows': [
    {
      plan: 'Revise syllabi of management and computer science programmes in line with NEP 2020 and industry feedback.',
      outcome:
        'Syllabus revision completed for four programmes with 20-30% content updated after BoS approval.',
    },
    {
      plan: 'Expand value-added course offerings for employability and life skills.',
      outcome:
        'Four value-added courses conducted with over 300 enrolments and completion certificates issued.',
    },
    {
      plan: 'Achieve full coverage of structured stakeholder feedback with published action-taken reports.',
      outcome:
        'Feedback obtained from students, teachers, employers and alumni; ATR placed before the Governing Body and hosted on the website.',
    },
  ],
  // 14. Statutory body
  'statutoryBody.placed': 'Yes',
  'statutoryBody.body_name': 'Governing Body',
  'statutoryBody.meeting_date': '2026-08-10',
  // 15. External visit
  'externalVisit.visited': 'No',
  // 16. AISHE
  'aishe.submitted': 'Yes',
  'aishe.year': '2025-26',
  'aishe.submission_date': '2026-01-20',
  // 17. MIS
  'mis.has_mis': 'Yes',
  'mis.description':
    'The Institute operates an integrated Management Information System covering admissions, student records, fee management, attendance, internal assessment, examination processing, library circulation and payroll. Modules currently operational include Student Lifecycle Management, Examination Management, Library OPAC, Accounts and HR. Reports generated by the MIS support IQAC reviews, NIRF and AISHE submissions, and programme-level outcome analysis. (Sample description for demonstration.)',
  // Closing section
  'futurePlans.plan':
    'In the coming academic year the Institute plans to complete NEP-aligned curriculum restructuring for the remaining programmes, expand the basket of value-added and skill-development courses, deepen industry engagement through additional MoUs for internships and live projects, extend the outcome-attainment analysis to course level in the MIS, pursue green-campus and energy-audit initiatives, and strengthen research culture through seed grants and publication incentives. (Generic sample plan for demonstration.)',
};

/** Convert the flat "section.field" / "section.rows" keys above into the
 * nested { [section]: { [field]: value, _rows?: Row[] } } shape the app
 * actually reads and writes (PartAForm.tsx). */
function toNestedPartAPayload(
  flat: Record<string, unknown>
): Record<string, Record<string, unknown>> {
  const nested: Record<string, Record<string, unknown>> = {};
  for (const [dottedKey, value] of Object.entries(flat)) {
    const dot = dottedKey.indexOf('.');
    const sectionKey = dottedKey.slice(0, dot);
    const fieldKey = dottedKey.slice(dot + 1);
    const section = (nested[sectionKey] ??= {});
    if (fieldKey === 'rows') {
      section['_rows'] = value;
    } else {
      section[fieldKey] = value;
    }
  }
  return nested;
}

const partAPayload = toNestedPartAPayload(partAPayloadFlat);

db.prepare(
  `INSERT INTO part_a (year_id, payload, updated_by, updated_at)
   VALUES (?, ?, ?, datetime('now'))
   ON CONFLICT (year_id) DO UPDATE SET
     payload = excluded.payload,
     updated_by = excluded.updated_by,
     updated_at = excluded.updated_at`
).run(yearId, JSON.stringify(partAPayload), userId);

/* ------------------------------------------------------------------ */
/* 3. Extended Profile                                                 */
/* ------------------------------------------------------------------ */

const programmes = [
  { programme_code: 'MBA01', programme_name: 'MBA' },
  { programme_code: 'MCA01', programme_name: 'MCA' },
  { programme_code: 'MSW01', programme_name: 'MSW' },
  { programme_code: 'MCOM01', programme_name: 'M.Com.' },
  { programme_code: 'MSC01', programme_name: 'M.Sc. (Environment & Safety)' },
  { programme_code: 'BBA01', programme_name: 'BBA' },
  { programme_code: 'BCA01', programme_name: 'BCA' },
];

// EP-1.1 — programmes offered (headline derives as row count = 7)
setRows('EP-1.1', 'main', programmes);
setMetric('EP-1.1', {});

// EP-2.1 — total students: sample roster rows + MIS headline
setRows('EP-2.1', 'main', [
  {
    name: 'Aarti Sample Kulkarni',
    year_of_enrollment: '2025',
    enrollment_number: 'CS2025MBA001',
    date_of_enrollment: '2025-07-14',
  },
  {
    name: 'Rohan Sample Jadhav',
    year_of_enrollment: '2025',
    enrollment_number: 'CS2025MCA014',
    date_of_enrollment: '2025-07-15',
  },
  {
    name: 'Sneha Sample Pawar',
    year_of_enrollment: '2025',
    enrollment_number: 'CS2025MSW007',
    date_of_enrollment: '2025-07-15',
  },
  {
    name: 'Imran Sample Shaikh',
    year_of_enrollment: '2025',
    enrollment_number: 'CS2025BBA021',
    date_of_enrollment: '2025-07-16',
  },
  {
    name: 'Prachi Sample Desai',
    year_of_enrollment: '2025',
    enrollment_number: 'CS2025BCA033',
    date_of_enrollment: '2025-07-16',
  },
]);
setMetric('EP-2.1', {
  headlineOverride: 912,
  headlineOverrideReason:
    'Total from admission MIS; only sample roster rows entered in the template.',
});

// EP-2.2 — outgoing / final year students
setRows('EP-2.2', 'main', [
  {
    month_year_of_passing: 'May 2026',
    name: 'Vaibhav Sample Patil',
    enrollment_number: 'CS2024MBA052',
  },
  {
    month_year_of_passing: 'May 2026',
    name: 'Kavita Sample More',
    enrollment_number: 'CS2024MCA030',
  },
  {
    month_year_of_passing: 'May 2026',
    name: 'Suraj Sample Kamble',
    enrollment_number: 'CS2023BBA044',
  },
  {
    month_year_of_passing: 'May 2026',
    name: 'Nikita Sample Ghatge',
    enrollment_number: 'CS2023BCA018',
  },
]);
setMetric('EP-2.2', {
  headlineOverride: 388,
  headlineOverrideReason:
    'Count from examination section records; sample rows only in the template.',
});

// EP-2.3 — students who appeared in institutional examinations
setRows('EP-2.3', 'main', [
  {
    month_year: 'December 2025',
    name: 'Aarti Sample Kulkarni',
    roll_number: 'MBA-I-01',
    date_of_appearing: '2025-12-08',
  },
  {
    month_year: 'December 2025',
    name: 'Rohan Sample Jadhav',
    roll_number: 'MCA-I-14',
    date_of_appearing: '2025-12-08',
  },
  {
    month_year: 'April 2026',
    name: 'Suraj Sample Kamble',
    roll_number: 'BBA-III-44',
    date_of_appearing: '2026-04-15',
  },
  {
    month_year: 'April 2026',
    name: 'Nikita Sample Ghatge',
    roll_number: 'BCA-III-18',
    date_of_appearing: '2026-04-15',
  },
]);
setMetric('EP-2.3', {
  headlineOverride: 897,
  headlineOverrideReason:
    'Count from examination MIS; sample rows only in the template.',
});

// EP-3.1 — courses offered across all programmes
setRows('EP-3.1', 'main', [
  {
    programme_code: 'MBA01',
    programme_name: 'MBA',
    course_code: 'MBA101',
    course_name: 'Principles of Management',
  },
  {
    programme_code: 'MBA01',
    programme_name: 'MBA',
    course_code: 'MBA204',
    course_name: 'Business Analytics',
  },
  {
    programme_code: 'MCA01',
    programme_name: 'MCA',
    course_code: 'MCA103',
    course_name: 'Data Structures and Algorithms',
  },
  {
    programme_code: 'MSW01',
    programme_name: 'MSW',
    course_code: 'MSW102',
    course_name: 'Community Organisation',
  },
  {
    programme_code: 'BBA01',
    programme_name: 'BBA',
    course_code: 'BBA201',
    course_name: 'Marketing Management',
  },
  {
    programme_code: 'BCA01',
    programme_name: 'BCA',
    course_code: 'BCA305',
    course_name: 'Web Technologies',
  },
]);
setMetric('EP-3.1', {
  headlineOverride: 296,
  headlineOverrideReason:
    'Full course list maintained in the MIS; sample rows only in the template.',
});

// EP-3.2 — full-time teachers (working + movement tables)
setRows('EP-3.2', 'working', [
  {
    name: 'Dr. A. Sample Joshi',
    id_number: '',
    email: 'a.joshi@siberindia.edu.in',
    gender: 'Male',
    designation: 'Professor',
    date_of_joining: '2008-06-16',
  },
  {
    name: 'Dr. B. Sample Salunkhe',
    id_number: '',
    email: 'b.salunkhe@siberindia.edu.in',
    gender: 'Female',
    designation: 'Associate Professor',
    date_of_joining: '2012-07-02',
  },
  {
    name: 'Mr. C. Sample Nikam',
    id_number: '',
    email: 'c.nikam@siberindia.edu.in',
    gender: 'Male',
    designation: 'Assistant Professor',
    date_of_joining: '2016-08-01',
  },
  {
    name: 'Ms. D. Sample Bhosale',
    id_number: '',
    email: 'd.bhosale@siberindia.edu.in',
    gender: 'Female',
    designation: 'Assistant Professor',
    date_of_joining: '2019-07-15',
  },
  {
    name: 'Dr. E. Sample Chavan',
    id_number: '',
    email: 'e.chavan@siberindia.edu.in',
    gender: 'Male',
    designation: 'Assistant Professor',
    date_of_joining: '2021-08-02',
  },
  {
    name: 'Ms. F. Sample Mane',
    id_number: '',
    email: 'f.mane@siberindia.edu.in',
    gender: 'Female',
    designation: 'Assistant Professor',
    date_of_joining: '2023-07-03',
  },
]);
setRows('EP-3.2', 'movement', [
  {
    name: 'Mr. G. Sample Shinde',
    id_number: '',
    email: 'g.shinde@siberindia.edu.in',
    gender: 'Male',
    designation: 'Assistant Professor',
    date_of_joining: '2025-08-01',
    date_of_leaving: '',
  },
  {
    name: 'Dr. H. Sample Gaikwad',
    id_number: '',
    email: 'h.gaikwad@siberindia.edu.in',
    gender: 'Female',
    designation: 'Associate Professor',
    date_of_joining: '2014-06-16',
    date_of_leaving: '2025-10-31',
  },
]);
setMetric('EP-3.2', {
  headlineOverride: 54,
  headlineOverrideReason:
    'Count from establishment records; sample rows only in the template.',
});

// EP-3.3 / EP-4.x — plain-number questions (manual headlines)
setMetric('EP-3.3', { headlineOverride: 62 });
setMetric('EP-4.1', { headlineOverride: 38 });
setMetric('EP-4.2', { headlineOverride: 412.75 });
setMetric('EP-4.3', { headlineOverride: 385 });
setMetric('EP-4.4', { headlineOverride: 4.5 });

/* ------------------------------------------------------------------ */
/* 4. Criterion 1 — every metric                                       */
/* ------------------------------------------------------------------ */

// 1.1.1 — QlM write-up (~150 words, generic sample prose)
setMetric('1.1.1', {
  writeups: {
    main:
      'The Institute designs and delivers curricula that respond to local, regional, national and global developmental needs across its management, computer applications, social work, commerce and environmental science programmes. As an autonomous institution, Boards of Studies with academicians, industry experts and alumni review every syllabus so that Programme Outcomes, Programme Specific Outcomes and Course Outcomes remain aligned with employer expectations, NEP 2020 priorities and emerging technologies. Locally, courses on cooperative management, rural entrepreneurship and community development address the needs of the Kolhapur region. Nationally and globally oriented content in analytics, artificial intelligence, sustainability and international business prepares graduates for wider markets. Outcome attainment is measured through direct assessment of course outcomes and indirect stakeholder surveys, and the results feed back into curriculum revision. Field work, internships and live projects embedded in each programme connect classroom learning with industry and community practice. This text is generic sample content prepared for system demonstration.',
  },
  urls: {
    link_additional_information:
      'https://www.siberindia.edu.in/iqac/curriculum-outcomes',
  },
});

// 1.1.2 — syllabus revision table (shared with 1.2.2); manual headline 4
// Mix: 4 rows revised during the year; 6 of 7 rows CBCS "Yes" so the
// 1.2.2 derived countWhere produces 6.
setRows('1.1.2', 'main', [
  {
    programme_code: 'MBA01',
    programme_name: 'MBA',
    year_of_introduction: '1994-07-01',
    cbcs_elective_status: 'Yes',
    year_of_cbcs_implementation: '2018',
    year_of_revision: '2025',
    percentage_content_added_or_replaced: 30,
    link_to_relevant_document:
      'https://www.siberindia.edu.in/syllabus/mba-2025',
  },
  {
    programme_code: 'MCA01',
    programme_name: 'MCA',
    year_of_introduction: '1996-07-01',
    cbcs_elective_status: 'Yes',
    year_of_cbcs_implementation: '2018',
    year_of_revision: '2025',
    percentage_content_added_or_replaced: 25,
    link_to_relevant_document:
      'https://www.siberindia.edu.in/syllabus/mca-2025',
  },
  {
    programme_code: 'MSW01',
    programme_name: 'MSW',
    year_of_introduction: '1999-07-01',
    cbcs_elective_status: 'Yes',
    year_of_cbcs_implementation: '2019',
    year_of_revision: '',
    percentage_content_added_or_replaced: '',
    link_to_relevant_document:
      'https://www.siberindia.edu.in/syllabus/msw',
  },
  {
    programme_code: 'MCOM01',
    programme_name: 'M.Com.',
    year_of_introduction: '2001-07-01',
    cbcs_elective_status: 'Yes',
    year_of_cbcs_implementation: '2019',
    year_of_revision: '2025',
    percentage_content_added_or_replaced: 20,
    link_to_relevant_document:
      'https://www.siberindia.edu.in/syllabus/mcom-2025',
  },
  {
    programme_code: 'MSC01',
    programme_name: 'M.Sc. (Environment & Safety)',
    year_of_introduction: '2003-07-01',
    cbcs_elective_status: 'Yes',
    year_of_cbcs_implementation: '2019',
    year_of_revision: '',
    percentage_content_added_or_replaced: '',
    link_to_relevant_document:
      'https://www.siberindia.edu.in/syllabus/msc-env',
  },
  {
    programme_code: 'BBA01',
    programme_name: 'BBA',
    year_of_introduction: '2004-07-01',
    cbcs_elective_status: 'Yes',
    year_of_cbcs_implementation: '2020',
    year_of_revision: '2025',
    percentage_content_added_or_replaced: 25,
    link_to_relevant_document:
      'https://www.siberindia.edu.in/syllabus/bba-2025',
  },
  {
    programme_code: 'BCA01',
    programme_name: 'BCA',
    year_of_introduction: '2006-07-01',
    cbcs_elective_status: 'No',
    year_of_cbcs_implementation: '',
    year_of_revision: '',
    percentage_content_added_or_replaced: '',
    link_to_relevant_document:
      'https://www.siberindia.edu.in/syllabus/bca',
  },
]);
setMetric('1.1.2', {
  headlineOverride: 4,
  headlineOverrideReason: 'Sample',
});

// 1.1.3 — employability/skill development courses (shared with 1.2.1)
setRows('1.1.3', 'main', [
  {
    course_name: 'Business Analytics with Python',
    course_code: 'MBA204',
    activities_bearing_on_employability:
      'Hands-on labs on data wrangling, dashboarding and predictive modelling using industry datasets; capstone analytics project with a local enterprise.',
    link_to_relevant_document:
      'https://www.siberindia.edu.in/courses/mba204',
  },
  {
    course_name: 'Full-Stack Web Development',
    course_code: 'BCA305',
    activities_bearing_on_employability:
      'Project-based learning covering front-end frameworks, REST APIs and deployment; students build and host a working application as portfolio evidence.',
    link_to_relevant_document:
      'https://www.siberindia.edu.in/courses/bca305',
  },
  {
    course_name: 'Entrepreneurship Development',
    course_code: 'BBA210',
    activities_bearing_on_employability:
      'Business-plan competitions, interaction with incubated startups and bank-linkage sessions building venture creation skills.',
    link_to_relevant_document:
      'https://www.siberindia.edu.in/courses/bba210',
  },
  {
    course_name: 'GST and E-Filing Practice',
    course_code: 'MCOM108',
    activities_bearing_on_employability:
      'Practical filing of GST returns on the sandbox portal and case studies from tax practitioners improving direct employability in accounting roles.',
    link_to_relevant_document:
      'https://www.siberindia.edu.in/courses/mcom108',
  },
  {
    course_name: 'Industrial Safety Management',
    course_code: 'MSC207',
    activities_bearing_on_employability:
      'Site visits, HAZOP exercises and safety-audit drills mapped to statutory safety officer competencies.',
    link_to_relevant_document:
      'https://www.siberindia.edu.in/courses/msc207',
  },
]);
setMetric('1.1.3', {
  headlineOverride: 5,
  headlineOverrideReason: 'Sample',
});

// 1.2.1 — new courses introduced (data lives in the shared 1.1.3 table)
setMetric('1.2.1', {
  headlineOverride: 3,
  headlineOverrideReason: 'Sample',
});

// 1.2.2 — CBCS programmes: derived from the 1.1.2 table (countWhere Yes = 6)
setMetric('1.2.2', {});

// 1.3.1 — QlM write-up (~150 words, generic sample prose)
setMetric('1.3.1', {
  writeups: {
    main:
      'Cross-cutting issues of professional ethics, gender, human values, and environment and sustainability are systematically woven into the curricula of all programmes. Courses on business ethics and corporate governance in the management stream, cyber ethics and professional practice in computer applications, and social justice perspectives in social work sensitise students to ethical and gender dimensions of professional life. The M.Sc. programme in Environment and Safety anchors institution-wide teaching on sustainability, supported by compulsory environmental studies modules, green-campus drives and waste-audit projects undertaken by students. Gender sensitisation is reinforced through dedicated units, awareness sessions by the Internal Committee and equal participation in leadership roles across student activities. Human values are cultivated through community outreach, NSS-style extension work, rural camps and value-education sessions embedded in induction programmes. Assessment of these components through projects and reflective assignments ensures genuine engagement. This text is generic sample content prepared for system demonstration.',
  },
});

// 1.3.2 — value-added courses (headline derives as row count = 4)
setRows('1.3.2', 'main', [
  {
    course_name: 'Communication and Employability Skills',
    course_code: 'VAC101',
    times_offered: 2,
    duration_hours: 40,
    students_enrolled: 118,
    students_completed: 105,
  },
  {
    course_name: 'Advanced Excel and Data Visualisation',
    course_code: 'VAC102',
    times_offered: 2,
    duration_hours: 36,
    students_enrolled: 96,
    students_completed: 88,
  },
  {
    course_name: 'Digital Marketing Essentials',
    course_code: 'VAC103',
    times_offered: 1,
    duration_hours: 30,
    students_enrolled: 64,
    students_completed: 57,
  },
  {
    course_name: 'Yoga, Wellness and Life Skills',
    course_code: 'VAC104',
    times_offered: 1,
    duration_hours: 30,
    students_enrolled: 52,
    students_completed: 46,
  },
]);
setMetric('1.3.2', {});

// 1.3.3 — derives automatically from the 1.3.2 table (sum enrolled = 330)
setMetric('1.3.3', {});

// 1.3.4 — field work / projects / internships; manual headline 210
setRows('1.3.4', 'main', [
  {
    programme_name: 'MBA',
    programme_code: 'MBA01',
    students_list:
      'Summer internship project batch 2025-26: 82 students placed with regional industries and banks (list maintained by the Training and Placement Cell).',
    link_to_relevant_document:
      'https://www.siberindia.edu.in/internships/mba-2025-26',
  },
  {
    programme_name: 'MCA',
    programme_code: 'MCA01',
    students_list:
      'Industry software development projects: 48 students on six-month internships with IT companies (project allocation register available).',
    link_to_relevant_document:
      'https://www.siberindia.edu.in/internships/mca-2025-26',
  },
  {
    programme_name: 'MSW',
    programme_code: 'MSW01',
    students_list:
      'Concurrent field work with NGOs, hospitals and rural communities: 44 students (field work diary records maintained by the department).',
    link_to_relevant_document:
      'https://www.siberindia.edu.in/fieldwork/msw-2025-26',
  },
  {
    programme_name: 'M.Sc. (Environment & Safety)',
    programme_code: 'MSC01',
    students_list:
      'Environmental audit and safety internship projects in manufacturing units: 36 students (project reports archived in the department).',
    link_to_relevant_document:
      'https://www.siberindia.edu.in/projects/msc-2025-26',
  },
]);
setMetric('1.3.4', {
  headlineOverride: 210,
  headlineOverrideReason:
    'Student counts are recorded inside the programme-wise lists; headline entered from departmental registers.',
});

// 1.4.1 — feedback obtained from all four stakeholder groups
setMetric('1.4.1', {
  optionChoice: 'All 4 of the above',
  urls: {
    stakeholders_feedback_report:
      'https://www.siberindia.edu.in/iqac/feedback-report-2025-26',
  },
});

// 1.4.2 — feedback system status
setMetric('1.4.2', {
  optionChoice: 'Feedback collected, analysed and action taken',
  urls: {
    stakeholders_feedback_report:
      'https://www.siberindia.edu.in/iqac/feedback-atr-2025-26',
  },
});

/* ------------------------------------------------------------------ */
/* 5. Change requests                                                  */
/* ------------------------------------------------------------------ */

const insertCr = db.prepare(
  `INSERT INTO change_requests
     (year_id, metric_id, source, note, status, created_by, created_at, resolved_at, resolution_note)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

insertCr.run(
  yearId,
  '1.3.2',
  'Prof. Deshmukh, MBA Dept',
  'The value-added course "Stock Market Operations and Trading Simulation" (VAC105, 32 hours, conducted in January 2026 with 41 enrolments) is missing from the 1.3.2 table. Please add it and update the enrolment totals.',
  'open',
  userId,
  '2026-08-18 10:35:00',
  null,
  null
);

insertCr.run(
  yearId,
  '1.1.2',
  'Dr. Patil, MCA Dept',
  'The percentage of content added or replaced for the MCA syllabus revision should be 25%, not 15% — the AI/ML electives block was counted incorrectly.',
  'resolved',
  userId,
  '2026-08-11 14:20:00',
  '2026-08-14 09:05:00',
  'Verified against the BoS minutes of 12 June 2025; the 1.1.2 table row for MCA now shows 25%.'
);

/* ------------------------------------------------------------------ */
/* Summary                                                             */
/* ------------------------------------------------------------------ */

const crCount = db
  .prepare('SELECT COUNT(*) AS n FROM change_requests WHERE year_id = ?')
  .get(yearId) as { n: number };

console.log('Sample data loaded for year', YEAR_LABEL, `(id ${yearId})`);
console.log(
  `  Part A fields       : ${Object.keys(partAPayloadFlat).length} across ${Object.keys(partAPayload).length} sections`
);
console.log(`  Metric values       : ${metricCount}`);
console.log(`  Table rows          : ${rowCount}`);
console.log(`  Change requests     : ${crCount.n} (1 open, 1 resolved)`);
console.log('All values are generic sample content for demonstration only.');
