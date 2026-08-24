import type { Criterion } from './types';

export const criterion1: Criterion = {
  number: 1,
  title: 'Curricular Aspects',
  keyIndicators: [
    {
      code: '1.1',
      title: 'Curriculum Design and Development',
      metrics: [
        {
          id: '1.1.1',
          kind: 'qlm',
          title:
            'Curricula developed and implemented have relevance to the local, national, regional and global developmental needs which are reflected in Programme Outcomes (POs), Programme Specific Outcomes (PSOs) and Course Outcomes (COs) of the various Programmes offered by the Institution: Present a write-up within a maximum of 200 words.',
          writeups: [{ key: 'main', wordLimit: 200 }],
          evidence: [
            { key: 'additional_information', label: 'Upload additional information, if any' },
          ],
          urls: [
            { key: 'link_additional_information', label: 'Link for additional information' },
          ],
          newFrameworkMapping: 'New C1 Curriculum Design (Input)',
        },
        {
          id: '1.1.2',
          kind: 'qnm',
          title:
            'Number of Programmes where syllabus revision was carried out during the year',
          headline: {
            label:
              'Number of Programmes where syllabus revision was carried out during the year',
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '1.1.2 & 1.2.2',
              sharedWith: ['1.2.2'],
              columns: [
                { key: 'programme_code', label: 'Programme Code', type: 'text', required: true },
                { key: 'programme_name', label: 'Programme Name', type: 'text', required: true },
                { key: 'year_of_introduction', label: 'Year of introduction (Date)', type: 'date' },
                {
                  key: 'cbcs_elective_status',
                  label: 'Status of implemetation of CBCS / Elective Course System (Yes/No)',
                  type: 'yesno',
                },
                {
                  key: 'year_of_cbcs_implementation',
                  label: 'Year of implemetation of CBCS / Elective Course System',
                  type: 'text',
                },
                { key: 'year_of_revision', label: 'Year of revision, if any', type: 'text' },
                {
                  key: 'percentage_content_added_or_replaced',
                  label:
                    'If revision has been carried out in the syllabus during the year, percentage of content added or replaced',
                  type: 'number',
                },
                { key: 'link_to_relevant_document', label: 'Link to the relevant document', type: 'url' },
              ],
              note:
                'Shared NAAC sheet covering both 1.1.2 (syllabus revision) and 1.2.2 (CBCS/Elective Course System). The CBCS columns pertain to 1.2.2; the revision columns pertain to 1.1.2. Sheet labels retain NAAC\'s own spelling "implemetation".',
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            {
              key: 'minutes_academic_council_bos',
              label: 'Minutes of relevant Academic Council/BOS meeting',
            },
            {
              key: 'syllabus_revision_details',
              label: 'Details of syllabus revision during the year',
            },
            { key: 'additional_information', label: 'Any additional information' },
          ],
          newFrameworkMapping: 'New C1 Curriculum Design (Input)',
          notes:
            'Headline is entered manually: the shared sheet mixes syllabus-revision rows with CBCS rows, so a plain row count would over-state 1.1.2.',
        },
        {
          id: '1.1.3',
          kind: 'qnm',
          title:
            'Number of courses focusing on employability/entrepreneurship/skill development offered by the Institution during the year',
          headline: {
            label:
              'Number of courses focusing on employability/entrepreneurship/skill development offered during the year',
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '1.1.3 & 1.2.1',
              sharedWith: ['1.2.1'],
              columns: [
                { key: 'course_name', label: 'Name of the Course', type: 'text', required: true },
                { key: 'course_code', label: 'Course Code', type: 'text', required: true },
                {
                  key: 'activities_bearing_on_employability',
                  label:
                    'Activities/Content with a direct bearing on Employability/ Entrepreneurship/ Skill development',
                  type: 'longtext',
                },
                { key: 'link_to_relevant_document', label: 'Link to the relevant document', type: 'url' },
              ],
              note:
                'Shared NAAC sheet covering both 1.1.3 (employability/entrepreneurship/skill development courses) and 1.2.1 (new courses introduced). The sheet does not mark which rows belong to which metric.',
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            { key: 'curriculum_syllabus', label: 'Curriculum / Syllabus of such courses' },
            {
              key: 'minutes_bos_academic_council',
              label:
                'Minutes of the Boards of Studies/ Academic Council meetings with approval for these courses',
            },
            {
              key: 'mous_relevant_organizations',
              label: 'MoUs with relevant organizations for these courses, if any',
            },
            { key: 'additional_information', label: 'Any additional information' },
          ],
          newFrameworkMapping: 'New C1 Curriculum Design (Input)',
          notes:
            'Headline is entered manually: the shared 1.1.3 & 1.2.1 sheet does not distinguish 1.1.3 rows from 1.2.1 rows, so no derivation is safe.',
        },
      ],
    },
    {
      code: '1.2',
      title: 'Academic Flexibility',
      metrics: [
        {
          id: '1.2.1',
          kind: 'qnm',
          title:
            'Number of new courses introduced across all programmes offered during the year',
          headline: {
            label: 'Number of new courses introduced across all programmes during the year',
          },
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            {
              key: 'minutes_academic_council_bos',
              label: 'Minutes of relevant Academic Council/BoS meetings',
            },
            { key: 'additional_information', label: 'Any additional information' },
          ],
          newFrameworkMapping: 'New C1 Curriculum Design (Input)',
          notes:
            'Data is entered in the shared table owned by 1.1.3 (sheet "1.1.3 & 1.2.1"). Headline is entered manually because the shared sheet does not mark which rows are newly introduced courses.',
        },
        {
          id: '1.2.2',
          kind: 'qnm',
          title:
            'Number of Programmes offered through Choice Based Credit System (CBCS)/Elective Course System',
          headline: {
            label: 'Number of Programmes offered through CBCS/Elective Course System',
            derive: {
              tableMetricId: '1.1.2',
              expr: 'countWhere',
              whereColumn: 'cbcs_elective_status',
              whereEquals: 'Yes',
            },
          },
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            {
              key: 'minutes_academic_council_bos',
              label: 'Minutes of relevant Academic Council/BoS meetings',
            },
            { key: 'additional_information', label: 'Any additional information' },
          ],
          newFrameworkMapping: 'New C1 Curriculum Design (Input)',
          notes:
            'Data is entered in the shared table owned by 1.1.2 (sheet "1.1.2 & 1.2.2"). Headline is derived as the count of rows whose "Status of implemetation of CBCS / Elective Course System (Yes/No)" column is Yes.',
        },
      ],
    },
    {
      code: '1.3',
      title: 'Curriculum Enrichment',
      metrics: [
        {
          id: '1.3.1',
          kind: 'qlm',
          title:
            'Institution integrates cross-cutting issues relevant to Professional Ethics, Gender, Human Values, Environment and Sustainability, and Human Values into the curriculum: Present a write-up within a maximum of 200 words.',
          writeups: [{ key: 'main', wordLimit: 200 }],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            {
              key: 'course_list_description',
              label:
                'Upload the list and description of the courses which address issues related to Gender, Environment and Sustainability, Human Values and Professional Ethics in the curriculum',
            },
          ],
          newFrameworkMapping: 'New C1 Curriculum Design (Input)',
          notes:
            'The metric prompt repeats "Human Values" twice; this is NAAC\'s own wording and is kept verbatim. The File Description asks for a data template although the Data-Template workbook contains no dedicated 1.3.1 sheet.',
        },
        {
          id: '1.3.2',
          kind: 'qnm',
          title:
            'Number of value-added courses for imparting transferable and life skills offered during the year',
          headline: {
            label: 'Number of value-added courses offered during the year',
            derive: { expr: 'count' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '1.3.2&1.3.3',
              sharedWith: ['1.3.3'],
              columns: [
                {
                  key: 'course_name',
                  label: 'Name of the value-added courses (with 30 or more contact hours) offered',
                  type: 'text',
                  required: true,
                },
                { key: 'course_code', label: 'Course Code, if any', type: 'text' },
                { key: 'times_offered', label: 'No. of times offered during the year', type: 'number' },
                { key: 'duration_hours', label: 'Duration of course (in hours)', type: 'number' },
                {
                  key: 'students_enrolled',
                  label: 'Number of students enrolled during the year',
                  type: 'number',
                },
                {
                  key: 'students_completed',
                  label: '1.3.3 Number of students who completed the course  during the year',
                  type: 'number',
                },
              ],
              note:
                'Shared NAAC sheet covering 1.3.2 and 1.3.3. NAAC prefixes the completion column with "1.3.3" although the 1.3.3 metric text asks for students enrolled.',
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            { key: 'value_added_course_list', label: 'List of value-added courses' },
            {
              key: 'brochure',
              label: 'Brochure or any other document relating to value-added courses',
            },
            { key: 'additional_information', label: 'Any additional information' },
          ],
          newFrameworkMapping: 'New C1 Curriculum Design (Input)',
        },
        {
          id: '1.3.3',
          kind: 'qnm',
          title: 'Number of students enrolled in the courses under 1.3.2 above',
          headline: {
            label: 'Number of students enrolled in the value-added courses under 1.3.2',
            derive: { tableMetricId: '1.3.2', expr: 'sum', column: 'students_enrolled' },
          },
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            { key: 'students_enrolled_list', label: 'List of students enrolled' },
            { key: 'additional_information', label: 'Any additional information' },
          ],
          newFrameworkMapping: 'New C1 Curriculum Design (Input)',
          notes:
            'Derived as the sum of the "Number of students enrolled during the year" column of the shared 1.3.2 table. The sheet labels the completion column "1.3.3", but the metric text asks for enrolment, so the enrolled column is summed.',
        },
        {
          id: '1.3.4',
          kind: 'qnm',
          title:
            'Number of students undertaking field work/projects/internships/student projects',
          headline: {
            label:
              'Number of students undertaking field work/projects/internships/student projects',
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '1.3.3',
              columns: [
                { key: 'programme_name', label: 'Programme Name', type: 'text', required: true },
                { key: 'programme_code', label: 'Programme Code', type: 'text', required: true },
                {
                  key: 'students_list',
                  label:
                    'List of students undertaking field projects /  internships /student projects',
                  type: 'longtext',
                },
                { key: 'link_to_relevant_document', label: 'Link to the relevant document', type: 'url' },
              ],
              note:
                'The workbook sheet is mis-labelled "1.3.3" but its content ("1.3.4 Details of students undertaking field work/projects/ internships / student projects") belongs to 1.3.4; mapped by content.',
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            {
              key: 'programme_student_list',
              label:
                'List of programmes and number of students undertaking field projects / internships / student projects',
            },
            { key: 'additional_information', label: 'Any additional information' },
          ],
          newFrameworkMapping: 'New C1 Curriculum Design (Input)',
          notes:
            'Headline is entered manually: table rows are programmes, and student counts sit inside a free-text list column, so no row-level derivation is possible.',
        },
      ],
    },
    {
      code: '1.4',
      title: 'Feedback System',
      metrics: [
        {
          id: '1.4.1',
          kind: 'option',
          title:
            'Structured feedback and review of the syllabus (semester-wise / year-wise) is obtained from 1) Students 2) Teachers 3) Employers and 4) Alumni',
          optionSelect: {
            label: 'Choose any one',
            options: [
              'All 4 of the above',
              'Any 3 of the above',
              'Any 2 of the above',
              'Any 1 of the above',
              'None of the above',
            ],
          },
          urls: [
            {
              key: 'stakeholders_feedback_report',
              label: 'Provide the URL for stakeholders’ feedback report',
            },
          ],
          evidence: [
            {
              key: 'action_taken_report',
              label:
                'Upload the Action Taken Report of the feedback as recorded by the Governing Council / Syndicate / Board of Management',
            },
            { key: 'additional_information', label: 'Any additional information' },
          ],
          dataTemplateApplicable: false,
          newFrameworkMapping: 'New C1 Curriculum Design (Input)',
          notes:
            'Printed as QnM in the template but modelled as an option metric because it asks to "Choose any one" from a fixed list. Data template is not applicable to this metric.',
        },
        {
          id: '1.4.2',
          kind: 'option',
          title: 'The feedback system of the Institution comprises the following:',
          optionSelect: {
            label: 'Choose any one',
            options: [
              'Feedback collected, analysed and action taken made available on the website',
              'Feedback collected, analysed and action taken',
              'Feedback collected and analysed',
              'Feedback collected',
              'Feedback not collected',
            ],
          },
          urls: [
            {
              key: 'stakeholders_feedback_report',
              label: 'Provide URL for stakeholders’ feedback report',
            },
          ],
          evidence: [
            { key: 'additional_information', label: 'Any additional information' },
          ],
          dataTemplateApplicable: false,
          newFrameworkMapping: 'New C1 Curriculum Design (Input)',
          notes:
            'Printed as QnM in the template but modelled as an option metric because it asks to "Choose any one" from a fixed list. Data template is not applicable to this metric.',
        },
      ],
    },
  ],
};
