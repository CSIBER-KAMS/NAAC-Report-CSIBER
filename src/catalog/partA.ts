/**
 * Part A — Data of the Institution.
 *
 * Transcribed from the official NAAC AQAR guideline for Autonomous
 * Colleges ("Part – A / Data of the Institution", items 1..17).
 * Data may be captured from IIQA.
 */
import type { PartASection } from './types';

export const partASections: PartASection[] = [
  {
    key: 'institution',
    title: '1. Name of the Institution',
    fields: [
      { key: 'institution_name', label: 'Name of the Institution', type: 'text' },
      { key: 'head_name', label: 'Name of the Head of the institution', type: 'text' },
      { key: 'designation', label: 'Designation', type: 'text' },
      {
        key: 'own_campus',
        label: 'Does the institution function from own campus',
        type: 'yesno',
      },
      { key: 'phone', label: 'Phone no./Alternate phone no.', type: 'text' },
      { key: 'mobile', label: 'Mobile no.', type: 'text' },
      { key: 'registered_email', label: 'Registered Email', type: 'text' },
      { key: 'alternate_email', label: 'Alternate Email', type: 'text' },
      { key: 'address', label: 'Address', type: 'longtext' },
      { key: 'city', label: 'City/Town', type: 'text' },
      { key: 'state', label: 'State/UT', type: 'text' },
      { key: 'pin_code', label: 'Pin Code', type: 'text' },
    ],
  },
  {
    key: 'status',
    title: '2. Institutional status',
    fields: [
      {
        key: 'autonomy_date',
        label:
          'Autonomous Status (provide the date of Conformant of Autonomous Status)',
        type: 'date',
      },
      {
        key: 'institution_type',
        label: 'Type of Institution',
        type: 'select',
        options: ['Co-education', 'Men', 'Women'],
      },
      {
        key: 'location',
        label: 'Location',
        type: 'select',
        options: ['Rural', 'Semi-urban', 'Urban'],
      },
      {
        key: 'financial_status',
        label: 'Financial Status',
        type: 'select',
        options: ['Grants-in aid', 'UGC 2f and 12 (B)', 'Self financing'],
      },
      {
        key: 'financial_status_details',
        label: 'Financial Status (please specify)',
        type: 'text',
      },
      {
        key: 'iqac_coordinator',
        label: 'Name of the IQAC Co-ordinator/Director',
        type: 'text',
      },
      { key: 'iqac_phone', label: 'Phone no./Alternate phone no.', type: 'text' },
      { key: 'iqac_mobile', label: 'Mobile', type: 'text' },
      { key: 'iqac_email', label: 'IQAC e-mail address', type: 'text' },
      { key: 'iqac_alternate_email', label: 'Alternate Email address', type: 'text' },
    ],
  },
  {
    key: 'website',
    title: '3. Website address',
    fields: [
      { key: 'website', label: 'Website address', type: 'url' },
      {
        key: 'aqar_weblink',
        label: 'Web-link of the AQAR (Previous Academic Year)',
        type: 'url',
      },
    ],
  },
  {
    key: 'academicCalendar',
    title: '4. Whether Academic Calendar prepared during the year?',
    fields: [
      {
        key: 'prepared',
        label: 'Whether Academic Calendar prepared during the year?',
        type: 'yesno',
      },
      {
        key: 'uploaded',
        label: 'If yes, whether it is uploaded in the Institutional website',
        type: 'yesno',
      },
      { key: 'weblink', label: 'Weblink', type: 'url' },
    ],
  },
  {
    key: 'accreditation',
    title: '5. Accreditation Details',
    fields: [],
    table: {
      key: 'main',
      mode: 'fixedRows',
      fixedRows: ['1st', '2nd', '3rd', '4th', '5th'],
      columns: [
        { key: 'cycle', label: 'Cycle', type: 'text' },
        { key: 'grade', label: 'Grade', type: 'text' },
        { key: 'cgpa', label: 'CGPA', type: 'number' },
        { key: 'year_of_accreditation', label: 'Year of Accreditation', type: 'text' },
        { key: 'validity_from', label: 'Validity Period (from)', type: 'date' },
        { key: 'validity_to', label: 'Validity Period (to)', type: 'date' },
      ],
    },
  },
  {
    key: 'iqacEstablishment',
    title: '6. Date of Establishment of IQAC',
    fields: [
      {
        key: 'establishment_date',
        label: 'Date of Establishment of IQAC (DD/MM/YYYY)',
        type: 'date',
      },
    ],
  },
  {
    key: 'qualityInitiatives',
    title: '7. Internal Quality Assurance System',
    fields: [],
    table: {
      key: 'main',
      title:
        '7.1 Quality initiatives by IQAC during the year for promoting quality culture',
      mode: 'dynamic',
      columns: [
        {
          key: 'initiative',
          label: 'Item /Title of the quality initiative by IQAC',
          type: 'text',
        },
        { key: 'date_duration', label: 'Date & duration', type: 'text' },
        {
          key: 'participants',
          label: 'Number of participants/beneficiaries',
          type: 'number',
        },
      ],
      note:
        'Some Quality Assurance initiatives of the institution are (indicative list): Regular meeting of Internal Quality Assurance Cell (IQAC); timely submission of Annual Quality Assurance Report (AQAR) to NAAC; Feedback from all stakeholders collected, analysed and used for improvements; Academic Administrative Audit (AAA) conducted and its follow up action; Participation in NIRF; ISO Certification; NBA etc.; Any other Quality Audit.',
    },
  },
  {
    key: 'specialStatus',
    title:
      '8. Provide the list of Special Status conferred by Central/ State Government-UGC/CSIR/DST/DBT/ICMR/TEQIP/World Bank/CPE of UGC etc.',
    fields: [],
    table: {
      key: 'main',
      mode: 'dynamic',
      columns: [
        {
          key: 'unit',
          label: 'Institution/ Department/Faculty',
          type: 'text',
        },
        { key: 'scheme', label: 'Scheme', type: 'text' },
        { key: 'funding_agency', label: 'Funding agency', type: 'text' },
        {
          key: 'year_of_award',
          label: 'Year of award with duration',
          type: 'text',
        },
        { key: 'amount', label: 'Amount', type: 'number' },
      ],
    },
  },
  {
    key: 'iqacComposition',
    title: '9. Whether composition of IQAC as per latest NAAC guidelines',
    fields: [
      {
        key: 'as_per_guidelines',
        label: 'Whether composition of IQAC as per latest NAAC guidelines',
        type: 'yesno',
      },
      {
        key: 'notification_link',
        label: 'Upload latest notification of formation of IQAC (link)',
        type: 'url',
      },
    ],
  },
  {
    key: 'iqacMeetings',
    title: '10. No. of IQAC meetings held during the year',
    fields: [
      {
        key: 'meetings_held',
        label: 'No. of IQAC meetings held during the year',
        type: 'number',
      },
      {
        key: 'minutes_uploaded',
        label:
          'The minutes of IQAC meeting and compliance to the decisions have been uploaded on the institutional website (Please upload, minutes of meetings and action taken report)',
        type: 'yesno',
      },
    ],
  },
  {
    key: 'iqacFunding',
    title:
      '11. Whether IQAC received funding from any of the funding agency to support its activities during the year?',
    fields: [
      {
        key: 'funding_received',
        label:
          'Whether IQAC received funding from any of the funding agency to support its activities during the year?',
        type: 'yesno',
      },
      { key: 'amount', label: 'If yes, mention the amount', type: 'number' },
      { key: 'year', label: 'Year', type: 'text' },
    ],
  },
  {
    key: 'contributions',
    title:
      '12. Significant contributions made by IQAC during the current year (maximum five bullets)',
    fields: [],
    table: {
      key: 'main',
      mode: 'dynamic',
      columns: [
        {
          key: 'contribution',
          label: 'Significant contribution made by IQAC',
          type: 'longtext',
        },
      ],
      note: 'Maximum five bullets.',
    },
  },
  {
    key: 'planOfAction',
    title:
      '13. Plan of action chalked out by the IQAC in the beginning of the Academic year towards Quality Enhancement and the outcome achieved by the end of the Academic year',
    fields: [],
    table: {
      key: 'main',
      mode: 'dynamic',
      columns: [
        { key: 'plan', label: 'Plan of Action', type: 'longtext' },
        { key: 'outcome', label: 'Achievements/Outcomes', type: 'longtext' },
      ],
    },
  },
  {
    key: 'statutoryBody',
    title: '14. Whether the AQAR was placed before statutory body?',
    fields: [
      {
        key: 'placed',
        label: 'Whether the AQAR was placed before statutory body?',
        type: 'yesno',
      },
      { key: 'body_name', label: 'Name of the Statutory body', type: 'text' },
      { key: 'meeting_date', label: 'Date of meeting(s)', type: 'date' },
    ],
  },
  {
    key: 'externalVisit',
    title:
      '15. Whether NAAC/or any other accredited body(s) visited IQAC or interacted with it to assess the functioning?',
    fields: [
      {
        key: 'visited',
        label:
          'Whether NAAC/or any other accredited body(s) visited IQAC or interacted with it to assess the functioning?',
        type: 'yesno',
      },
      { key: 'visit_date', label: 'Date', type: 'date' },
    ],
  },
  {
    key: 'aishe',
    title: '16. Whether institutional data submitted to AISHE',
    fields: [
      {
        key: 'submitted',
        label: 'Whether institutional data submitted to AISHE',
        type: 'yesno',
      },
      { key: 'year', label: 'Year', type: 'text' },
      { key: 'submission_date', label: 'Date of Submission', type: 'date' },
    ],
  },
  {
    key: 'mis',
    title: '17. Does the Institution have Management Information System?',
    fields: [
      {
        key: 'has_mis',
        label: 'Does the Institution have Management Information System?',
        type: 'yesno',
      },
      {
        key: 'description',
        label:
          'If yes, give a brief description and a list of modules currently operational (Maximum 500 words)',
        type: 'longtext',
        wordLimit: 500,
      },
    ],
  },
  {
    /**
     * Closing section of the AQAR: printed at the END of the generated
     * document (after Part B, before the signature block), not with the
     * Part A front matter. The document generator special-cases this key.
     */
    key: 'futurePlans',
    title: 'Plan of action for the next academic year',
    fields: [
      {
        key: 'plan',
        label: 'Plan of action for the next academic year (in 200 words)',
        type: 'longtext',
        wordLimit: 200,
      },
    ],
  },
];
