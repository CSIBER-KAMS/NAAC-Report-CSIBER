import type { Criterion } from './types';

/**
 * Criterion VI – Governance, Leadership and Management
 * Transcribed from the official NAAC AQAR template (Autonomous College format)
 * and the Data-Template-for-Autonomous workbook.
 */
export const criterion6: Criterion = {
  number: 6,
  title: 'Governance, Leadership and Management',
  keyIndicators: [
    {
      code: '6.1',
      title: 'Institutional Vision and Leadership',
      metrics: [
        {
          id: '6.1.1',
          kind: 'qlm',
          title:
            'The governance of the institution is reflective of an effective leadership in tune with the vision and mission of the Institution: Describe the vision and mission of the institution with regard to governance, perspective plans and participation of the teachers in the decision-making bodies of the institution (within a maximum of 200 words).',
          writeups: [{ key: 'main', wordLimit: 200 }],
          urls: [
            {
              key: 'additional_information_link',
              label: 'Paste link for additional Information',
            },
          ],
          evidence: [
            {
              key: 'additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping: 'New C7 Governance and Administration (Process)',
        },
        {
          id: '6.1.2',
          kind: 'qlm',
          title:
            'Effective leadership is reflected in various institutional practices such as decentralization and participative management: Upload a case study highlighting decentralisation and participative management in the institution in not more than 200 words.',
          writeups: [{ key: 'main', wordLimit: 200 }],
          urls: [
            {
              key: 'additional_information_link',
              label: 'Paste link for additional Information',
            },
          ],
          evidence: [
            {
              key: 'strategic_plan_documents',
              label:
                'Upload strategic plan and deployment documents on the website',
            },
            {
              key: 'additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping: 'New C7 Governance and Administration (Process)',
        },
      ],
    },
    {
      code: '6.2',
      title: 'Strategy Development and Deployment',
      metrics: [
        {
          id: '6.2.1',
          kind: 'qlm',
          title:
            'The institutional Strategic/ Perspective plan has been clearly articulated and implemented. Describe any one activity/practice successfully implemented based on the institution’s strategic plan (within a maximum of 200 words).',
          writeups: [{ key: 'main', wordLimit: 200 }],
          urls: [
            {
              key: 'additional_information_link',
              label: 'Paste link for additional information',
            },
          ],
          evidence: [
            {
              key: 'strategic_plan_documents',
              label: 'Strategic Plan and deployment documents on the website',
            },
            {
              key: 'additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping: 'New C7 Governance and Administration (Process)',
        },
        {
          id: '6.2.2',
          kind: 'qlm',
          title:
            'The functioning of the various institutional bodies is effective and efficient as visible from the policies, administrative set-up, appointment and service rules, procedures, etc. Present the Organogram of the institution and describe its structure (within a maximum of 200 words).',
          writeups: [{ key: 'main', wordLimit: 200 }],
          urls: [
            {
              key: 'organogram_link',
              label: 'Paste link to Organogram on the institution webpage',
            },
            {
              key: 'additional_information_link',
              label: 'Paste link for additional Information',
            },
          ],
          evidence: [
            {
              key: 'additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping: 'New C7 Governance and Administration (Process)',
        },
        {
          id: '6.2.3',
          kind: 'option',
          title:
            'Implementation of e-governance in areas of operation: Administration, Finance and Accounts, Student Admission and Support, Examination',
          optionSelect: {
            label:
              'Administration; Finance and Accounts; Student Admission and Support; Examination',
            options: [
              'All of the above',
              'Any three of the above',
              'Any two of the above',
              'Any one of the above',
              'None of the above',
            ],
          },
          tables: [
            {
              key: 'main',
              mode: 'fixedRows',
              sheetRef: '6.2.3',
              fixedRows: [
                'Administration',
                'Finance and Accounts',
                'Student Admission and Support',
                'Examination',
              ],
              columns: [
                {
                  key: 'areas_of_e_governance',
                  label: 'Areas of e-governance',
                  type: 'text',
                },
                {
                  key: 'year_of_implementation',
                  label: 'Year of implementation',
                  type: 'number',
                },
                {
                  key: 'vendor_with_contact_details',
                  label: 'Name of the vendor with contact details',
                  type: 'text',
                },
                {
                  key: 'relevant_website_document_link',
                  label: 'Link to relevant website/ document',
                  type: 'url',
                },
              ],
            },
          ],
          evidence: [
            {
              key: 'data_template',
              label: 'Upload the data template',
              required: true,
            },
            {
              key: 'erp_document',
              label: 'ERP (Enterprise Resource Planning) Document',
            },
            {
              key: 'user_interface_screenshots',
              label: 'Screen shots of user interfaces',
            },
            {
              key: 'e_governance_details',
              label:
                'Details of implementation of e-governance in areas of operation',
            },
            {
              key: 'additional_information',
              label: 'Any additional information',
            },
          ],
          newFrameworkMapping: 'New C7 Governance and Administration (Process)',
          notes:
            'Printed as QnM in the template but modelled as an option metric because it presents a fixed option list (All of the above ... None of the above).',
        },
      ],
    },
    {
      code: '6.3',
      title: 'Faculty Empowerment Strategies',
      metrics: [
        {
          id: '6.3.1',
          kind: 'qlm',
          title:
            'The institution has effective welfare measures for teaching and non-teaching staff and avenues for their career development/ progression: Enumerate the existing welfare measures for teaching and non-teaching staff (within a maximum of 200 words).',
          writeups: [{ key: 'main', wordLimit: 200 }],
          urls: [
            {
              key: 'additional_information_link',
              label: 'Paste link for additional information',
            },
          ],
          evidence: [
            {
              key: 'additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping: 'New C7 Governance and Administration (Process)',
        },
        {
          id: '6.3.2',
          kind: 'qnm',
          title:
            'Number of teachers provided with financial support to attend conferences / workshops and towards payment of membership fee of professional bodies during the year',
          headline: {
            label:
              'Number of teachers provided with financial support to attend conferences/workshops and towards membership fee of professional bodies during the year',
            derive: { expr: 'count' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '6.3.2',
              columns: [
                {
                  key: 'teacher_name',
                  label: 'Name of teacher',
                  type: 'text',
                  required: true,
                },
                {
                  key: 'conference_workshop_supported',
                  label:
                    'Name of conference/ workshop attended for which financial support was provided',
                  type: 'text',
                },
                {
                  key: 'professional_body_membership',
                  label:
                    'Name of the professional body for which membership fee was provided',
                  type: 'text',
                },
                {
                  key: 'amount_of_support',
                  label: 'Amount of support',
                  type: 'number',
                },
              ],
            },
          ],
          evidence: [
            {
              key: 'data_template',
              label: 'Upload the data template',
              required: true,
            },
            {
              key: 'additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping: 'New C7 Governance and Administration (Process)',
          notes:
            'The "Amount of support" column appears in the data-template sheet although the docx Data Requirement list omits it.',
        },
        {
          id: '6.3.3',
          kind: 'qnm',
          title:
            'Number of professional development / administrative training programmes organized by the Institution for its teaching and non-teaching staff during the year',
          headline: {
            label:
              'Number of professional development / administrative training programmes organized by the Institution during the year',
            derive: { expr: 'count' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '6.3.3',
              columns: [
                {
                  key: 'pdp_title_teaching_staff',
                  label:
                    'Title of the professional development programme organised for teaching staff',
                  type: 'text',
                },
                {
                  key: 'admin_training_title_non_teaching_staff',
                  label:
                    'Title of the administrative training programme organised for non-teaching staff',
                  type: 'text',
                },
                {
                  key: 'no_of_participants',
                  label: 'No. of participants',
                  type: 'number',
                },
                {
                  key: 'dates_from_to',
                  label: 'Dates (from-to) (DD-MM-YYYY)',
                  type: 'text',
                },
              ],
              note: 'Classify the data and provide in a chronological order. Each row is one programme, with the title entered in whichever of the two title columns applies.',
            },
          ],
          evidence: [
            {
              key: 'data_template',
              label: 'Upload the data template',
              required: true,
            },
            {
              key: 'hrdc_reports',
              label:
                'Reports of the Human Resource Development Centres (UGC HRDC/ASC or other relevant centres)',
            },
            {
              key: 'additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping: 'New C7 Governance and Administration (Process)',
          notes:
            'The "No. of participants" column appears in the data-template sheet although the docx Data Requirement list omits it. The docx Year/Number box is the headline presentation, not a table.',
        },
        {
          id: '6.3.4',
          kind: 'qnm',
          title:
            'Number of teachers who have undergone online/ face-to-face Faculty Development Programmes during the year: (Professional Development Programmes, Orientation / Induction Programmes, Refresher Courses, Short-Term Course, etc.)',
          headline: {
            label:
              'Number of teachers who have undergone online/ face-to-face Faculty Development Programmes during the year',
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '6.3.4',
              columns: [
                {
                  key: 'teacher_name',
                  label: 'Name of Teacher who attended the programme',
                  type: 'text',
                  required: true,
                },
                {
                  key: 'programme_title',
                  label: 'Title of the programme',
                  type: 'text',
                },
                {
                  key: 'duration_from_to',
                  label: 'Duration (from - to) (DD-MM-YYYY)',
                  type: 'text',
                },
              ],
              note: 'Classify the data and provide in chronological order.',
            },
          ],
          evidence: [
            {
              key: 'data_template',
              label: 'Upload the data template',
              required: true,
            },
            {
              key: 'iqac_report_summary',
              label: 'Summary of the IQAC report',
            },
            {
              key: 'hrdc_reports',
              label:
                'Reports of the Human Resource Development Centres (UGC ASC or other relevant centers)',
            },
            {
              key: 'additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping: 'New C7 Governance and Administration (Process)',
          notes:
            'No auto-derive: the sheet holds one row per teacher-programme attendance, so a teacher attending several programmes appears in several rows and a row count would not equal the number of teachers. The docx Data Requirement lists "Number of teachers attended" per programme, but the data-template sheet (authoritative) collects individual teacher names.',
        },
      ],
    },
    {
      code: '6.4',
      title: 'Financial Management and Resource Mobilization',
      metrics: [
        {
          id: '6.4.1',
          kind: 'qlm',
          title:
            'Institution conducts internal and external financial audits regularly: Enumerate the various internal and external financial audits carried out during the year highlighting the mechanism for settling audit objections (within a maximum of 200 words).',
          writeups: [{ key: 'main', wordLimit: 200 }],
          urls: [
            {
              key: 'additional_information_link',
              label: 'Paste link for additional information',
            },
          ],
          evidence: [
            {
              key: 'additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping: 'New C7 Governance and Administration (Process)',
        },
        {
          id: '6.4.2',
          kind: 'qnm',
          title:
            'Funds / Grants received from non-government bodies, individuals, and philanthropists during the year (not covered in Criterion III and V) (INR in lakhs)',
          headline: {
            label:
              'Funds/Grants received from non-government bodies, individuals and philanthropists during the year (INR in lakhs)',
            derive: { expr: 'sum', column: 'funds_grants_received' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '6.4.2',
              columns: [
                {
                  key: 'funding_agency_name',
                  label:
                    'Name of the non-government funding agencies/ individuals/ philanthropists',
                  type: 'text',
                  required: true,
                },
                {
                  key: 'purpose_of_grant',
                  label: 'Purpose of the Grant',
                  type: 'text',
                },
                {
                  key: 'funds_grants_received',
                  label: 'Funds/ Grants received (in INR lakhs)',
                  type: 'number',
                  required: true,
                },
                {
                  key: 'month_and_year',
                  label: 'Month and Year',
                  type: 'date',
                },
                {
                  key: 'audited_statement_link',
                  label:
                    'Link to Audited Statement of Accounts reflecting the receipts',
                  type: 'url',
                },
              ],
            },
          ],
          evidence: [
            {
              key: 'data_template',
              label: 'Upload the data template',
              required: true,
            },
            {
              key: 'annual_statements_of_accounts',
              label: 'Annual statements of accounts',
            },
            {
              key: 'funds_grants_details',
              label:
                'Details of funds / grants received from non-government bodies, individuals, philanthropists during the year',
            },
            {
              key: 'additional_information',
              label: 'Any additional information',
            },
          ],
          newFrameworkMapping: 'New C7 Governance and Administration (Process)',
          notes:
            'The template prints an unbalanced "(INR in lakhs:" at the end of the prompt; normalised to "(INR in lakhs)". The "Purpose of the Grant", "Month and Year" and audited-statement link columns appear in the data-template sheet although the docx Data Requirement list omits them.',
        },
        {
          id: '6.4.3',
          kind: 'qlm',
          title:
            'Institutional strategies for mobilisation of funds and the optimal utilisation of resources: Describe the institution’s resource mobilisation policy and procedures within a maximum of 200 words.',
          writeups: [{ key: 'main', wordLimit: 200 }],
          urls: [
            {
              key: 'additional_information_link',
              label: 'Paste link for additional Information',
            },
          ],
          evidence: [
            {
              key: 'additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping: 'New C7 Governance and Administration (Process)',
        },
      ],
    },
    {
      code: '6.5',
      title: 'Internal Quality Assurance System',
      metrics: [
        {
          id: '6.5.1',
          kind: 'qlm',
          title:
            'Internal Quality Assurance Cell (IQAC) has contributed significantly for institutionalizing quality assurance strategies and processes visible in terms of incremental improvements made during the preceding year with regard to quality (in case of the First Cycle): Incremental improvements made during the preceding year with regard to quality and post-accreditation quality initiatives (Second and subsequent cycles): Describe two practices that have been institutionalized as a result of IQAC initiatives (within a maximum of 200 words).',
          writeups: [{ key: 'main', wordLimit: 200 }],
          urls: [
            {
              key: 'additional_information_link',
              label: 'Paste link for additional information',
            },
          ],
          evidence: [
            {
              key: 'additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping: 'New C7 Governance and Administration (Process)',
        },
        {
          id: '6.5.2',
          kind: 'qlm',
          title:
            'The institution reviews its teaching-learning process, structures and methodologies of operation and learning outcomes at periodic intervals through its IQAC as per norms: Describe any two examples of institutional reviews and implementation of teaching-learning reforms facilitated by the IQAC (within a maximum of 200 words each).',
          writeups: [
            { key: 'example_1', label: 'Example 1', wordLimit: 200 },
            { key: 'example_2', label: 'Example 2', wordLimit: 200 },
          ],
          urls: [
            {
              key: 'additional_information_link',
              label: 'Paste link for additional information',
            },
          ],
          evidence: [
            {
              key: 'additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping: 'New C7 Governance and Administration (Process)',
          notes:
            'The template asks for two examples of 200 words each; modelled as two write-up sections.',
        },
        {
          id: '6.5.3',
          kind: 'option',
          title:
            'Quality assurance initiatives of the institution include: Regular meeting of the IQAC; Feedback collected, analysed and used for improvement of the institution; Collaborative quality initiatives with other institution(s); Participation in NIRF; Any other quality audit recognized by state, national or international agencies (such as ISO Certification)',
          optionSelect: {
            label:
              'Regular meeting of the IQAC; Feedback collected, analysed and used for improvement of the institution; Collaborative quality initiatives with other institution(s); Participation in NIRF; Any other quality audit recognized by state, national or international agencies (such as ISO Certification)',
            options: [
              'Any 4 or all of the above',
              'Any 3 of the above',
              'Any 2 of the above',
              'Any 1 of the above',
              'None of the above',
            ],
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '6.5.3',
              columns: [
                {
                  key: 'month_and_year',
                  label: 'Month and Year',
                  type: 'date',
                },
                {
                  key: 'quality_conferences_conducted',
                  label: 'Conferences/Seminars/Workshops on quality conducted',
                  type: 'longtext',
                },
                {
                  key: 'aaa_and_follow_up',
                  label:
                    'Academic Administrative Audit (AAA) and initiation of follow-up action',
                  type: 'longtext',
                },
                {
                  key: 'nirf_participation_status',
                  label: 'Participation in NIRF along with Status',
                  type: 'text',
                },
                {
                  key: 'iso_certification',
                  label: 'ISO Certification - Nature and validity period',
                  type: 'text',
                },
                {
                  key: 'nba_or_other_certification',
                  label:
                    'NBA or any other certification received with programme specifications',
                  type: 'text',
                },
                {
                  key: 'collaborative_quality_initiatives',
                  label:
                    'Collaborative quality initiatives with other institution(s) (Provide the name of the institution and activity)',
                  type: 'longtext',
                },
                {
                  key: 'orientation_programme_on_quality',
                  label:
                    'Orientation programme on quality issues for teachers and students organised by the institution, Date (From -To) (DD-MM-YYYY)',
                  type: 'text',
                },
              ],
            },
          ],
          urls: [
            {
              key: 'annual_reports_link',
              label: 'Paste the web link of annual reports of the Institution',
            },
          ],
          evidence: [
            {
              key: 'data_template',
              label: 'Upload the data template',
              required: true,
            },
            {
              key: 'accreditation_certification_copies',
              label: 'Upload e-copies of accreditations and certification',
            },
            {
              key: 'quality_assurance_initiative_details',
              label:
                'Upload details of quality assurance initiatives of the institution',
            },
            {
              key: 'additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping: 'New C7 Governance and Administration (Process)',
          notes:
            'Printed as QnM in the template but modelled as an option metric because it presents a fixed option list (Any 4 or all of the above ... None of the above).',
        },
      ],
    },
  ],
};
