import type { Criterion } from './types';

/**
 * Criterion II – Teaching-Learning and Evaluation
 * Transcribed from the official NAAC AQAR template (Autonomous College format)
 * and the Data-Template-for-Autonomous workbook.
 */
export const criterion2: Criterion = {
  number: 2,
  title: 'Teaching-Learning and Evaluation',
  keyIndicators: [
    {
      code: '2.1',
      title: 'Student Enrolment and Profile',
      metrics: [
        {
          id: '2.1.1',
          kind: 'qnm',
          title:
            'Enrolment of Students: Number of students admitted (year-wise) during the year; Number of sanctioned seats (year-wise) during the year',
          headline: {
            label: 'Number of students admitted during the year',
            derive: { expr: 'sum', column: 'students_admitted' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '2.1.1',
              columns: [
                { key: 'programme_name', label: 'Programme Name', type: 'text' },
                { key: 'programme_code', label: 'Programme Code', type: 'text' },
                {
                  key: 'seats_sanctioned',
                  label: 'Number of seats sanctioned',
                  type: 'number',
                },
                {
                  key: 'students_admitted',
                  label: 'Number of Students admitted',
                  type: 'number',
                },
              ],
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            { key: 'any_additional_information', label: 'Any additional information' },
          ],
          newFrameworkMapping:
            'New C5 Learning and Teaching (Process); partly C2 Faculty Resources (Input)',
          notes:
            'The template shows two Number-Year boxes (students admitted and sanctioned seats); the headline models students admitted, and sanctioned seats are captured per programme in the data-template table.',
        },
        {
          id: '2.1.2',
          kind: 'qnm',
          title:
            'Number of seats filled against reserved categories (SC, ST, OBC, Divyangjan, etc.) as per the reservation policy during the year (exclusive of supernumerary seats)',
          headline: {
            label:
              'Number of seats filled against reserved categories during the year',
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '2.1.2',
              columns: [
                {
                  key: 'seats_earmarked_sc',
                  label:
                    'Number of seats earmarked for reserved categories as per GOI or State Government norms – SC',
                  type: 'number',
                },
                {
                  key: 'seats_earmarked_st',
                  label:
                    'Number of seats earmarked for reserved categories as per GOI or State Government norms – ST',
                  type: 'number',
                },
                {
                  key: 'seats_earmarked_obc',
                  label:
                    'Number of seats earmarked for reserved categories as per GOI or State Government norms – OBC',
                  type: 'number',
                },
                {
                  key: 'seats_earmarked_gen',
                  label:
                    'Number of seats earmarked for reserved categories as per GOI or State Government norms – Gen',
                  type: 'number',
                },
                {
                  key: 'seats_earmarked_others',
                  label:
                    'Number of seats earmarked for reserved categories as per GOI or State Government norms – Others',
                  type: 'number',
                },
                {
                  key: 'students_admitted_sc',
                  label:
                    'Number of students admitted from the reserved categories – SC',
                  type: 'number',
                },
                {
                  key: 'students_admitted_st',
                  label:
                    'Number of students admitted from the reserved categories – ST',
                  type: 'number',
                },
                {
                  key: 'students_admitted_obc',
                  label:
                    'Number of students admitted from the reserved categories – OBC',
                  type: 'number',
                },
                {
                  key: 'students_admitted_gen',
                  label:
                    'Number of students admitted from the reserved categories – Gen',
                  type: 'number',
                },
                {
                  key: 'students_admitted_others',
                  label:
                    'Number of students admitted from the reserved categories – Others',
                  type: 'number',
                },
              ],
              note:
                '* In case of Minority Institutions, the column Others may be used and the status of reservation for minorities needs to be specified',
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            { key: 'any_additional_information', label: 'Any additional information' },
          ],
          newFrameworkMapping:
            'New C5 Learning and Teaching (Process); partly C2 Faculty Resources (Input)',
          notes:
            'The NAAC sheet uses a two-row header (category group over SC/ST/OBC/Gen/Others); flattened here into ten columns with compound labels.',
        },
      ],
    },
    {
      code: '2.2',
      title: 'Catering to Student Diversity',
      metrics: [
        {
          id: '2.2.1',
          kind: 'qlm',
          title:
            'The institution assesses students’ learning levels and organises special programmes for both slow and advanced learners',
          writeups: [{ key: 'main', wordLimit: 200 }],
          urls: [
            {
              key: 'additional_information_link',
              label: 'Paste link for additional information',
            },
          ],
          evidence: [
            {
              key: 'any_additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping:
            'New C5 Learning and Teaching (Process); partly C2 Faculty Resources (Input)',
        },
        {
          id: '2.2.2',
          kind: 'qnm',
          title: 'Student – Teacher (full-time) ratio',
          headline: { label: 'Student – Teacher (full-time) ratio' },
          evidence: [
            {
              key: 'any_additional_information',
              label: 'Upload any additional information',
            },
          ],
          dataTemplateApplicable: false,
          newFrameworkMapping:
            'New C5 Learning and Teaching (Process); partly C2 Faculty Resources (Input)',
          notes:
            'Data Requirement: total number of students and total number of full-time teachers in the institution. Formula: Students : Teacher.',
        },
      ],
    },
    {
      code: '2.3',
      title: 'Teaching - Learning Process',
      metrics: [
        {
          id: '2.3.1',
          kind: 'qlm',
          title:
            'Student-centric methods such as experiential learning, participative learning and problem-solving methodologies are used for enhancing learning experiences',
          writeups: [{ key: 'main', wordLimit: 200 }],
          urls: [
            {
              key: 'additional_information_link',
              label: 'Link for additional Information',
            },
          ],
          evidence: [
            {
              key: 'any_additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping:
            'New C5 Learning and Teaching (Process); partly C2 Faculty Resources (Input)',
        },
        {
          id: '2.3.2',
          kind: 'qlm',
          title:
            'Teachers use ICT-enabled tools including online resources for effective teaching and learning',
          writeups: [{ key: 'main', wordLimit: 200 }],
          urls: [
            {
              key: 'ict_tools_webpage',
              label:
                'Provide link for webpage describing ICT enabled tools including online resources for effective teaching and learning process',
            },
          ],
          evidence: [
            {
              key: 'any_additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping:
            'New C5 Learning and Teaching (Process); partly C2 Faculty Resources (Input)',
        },
        {
          id: '2.3.3',
          kind: 'qnm',
          title: 'Ratio of students to mentor for academic and other related issues',
          headline: { label: 'Ratio of students to mentor (Mentor : Mentee)' },
          evidence: [
            {
              key: 'students_and_teachers_on_roll',
              label:
                'Upload year-wise number of students enrolled and full-time teachers on roll',
            },
            {
              key: 'mentor_mentee_circulars',
              label: 'Circulars with regard to assigning mentors to mentees',
            },
          ],
          dataTemplateApplicable: false,
          newFrameworkMapping:
            'New C5 Learning and Teaching (Process); partly C2 Faculty Resources (Input)',
          notes:
            'Data Requirement: number of mentors and number of students assigned to each mentor. Formula: Mentor : Mentee.',
        },
        {
          id: '2.3.4',
          kind: 'qlm',
          title:
            'Preparation and adherence to Academic Calendar and Teaching Plans by the institution',
          writeups: [{ key: 'main', wordLimit: 200 }],
          evidence: [
            {
              key: 'academic_calendar_teaching_plans',
              label:
                'Upload the Academic Calendar and Teaching Plans during the year',
            },
          ],
          newFrameworkMapping:
            'New C5 Learning and Teaching (Process); partly C2 Faculty Resources (Input)',
        },
      ],
    },
    {
      code: '2.4',
      title: 'Teacher Profile and Quality',
      metrics: [
        {
          id: '2.4.1',
          kind: 'qnm',
          title:
            'Number of full-time teachers against sanctioned posts during the year',
          headline: {
            label:
              'Number of full-time teachers against sanctioned posts during the year',
            derive: { expr: 'count' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '2.4.1 & 2.4.3',
              sharedWith: ['2.4.3'],
              columns: [
                {
                  key: 'teacher_name',
                  label: 'Names of full-time teachers',
                  type: 'text',
                },
                { key: 'pan', label: 'PAN', type: 'text' },
                { key: 'designation', label: 'Designation', type: 'text' },
                {
                  key: 'year_of_appointment',
                  label: 'Year of appointment',
                  type: 'number',
                },
                {
                  key: 'nature_of_appointment',
                  label:
                    'Nature of appointment (against Sanctioned post/Temporary/Permanent)',
                  type: 'select',
                  options: ['Against Sanctioned post', 'Temporary', 'Permanent'],
                },
                {
                  key: 'department',
                  label: 'Name of the Department',
                  type: 'text',
                },
                {
                  key: 'total_years_experience_same_institution',
                  label: 'Total years of experience in the same institution',
                  type: 'number',
                },
                {
                  key: 'still_serving_or_left',
                  label:
                    'Is the teacher still serving the institution?/If not, when did he/she leave the institution?',
                  type: 'text',
                },
              ],
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            {
              key: 'teachers_and_sanctioned_posts',
              label:
                'Year-wise full-time teachers and sanctioned posts for the year',
            },
            {
              key: 'faculty_list_authenticated',
              label:
                'List of the faculty members authenticated by the Head of HEI',
            },
            { key: 'any_additional_information', label: 'Any additional information' },
          ],
          newFrameworkMapping:
            'New C5 Learning and Teaching (Process); partly C2 Faculty Resources (Input)',
          notes:
            'Headline derived as the count of teachers listed in the shared 2.4.1 & 2.4.3 data-template sheet.',
        },
        {
          id: '2.4.2',
          kind: 'qnm',
          title:
            'Number of full-time teachers with PhD/ D.M. / M.Ch. / D.N.B Super-Specialty / DSc / DLitt during the year',
          headline: {
            label:
              'Number of full-time teachers with PhD/ D.M. / M.Ch. / D.N.B Super-Specialty / DSc / DLitt during the year',
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '2.4.2 , 3.2.3 & 3.4.2',
              sharedWith: ['3.2.3', '3.4.2'],
              columns: [
                {
                  key: 'teacher_name',
                  label:
                    'Name of full-time teachers with PhD / D.M. / M.Ch. / D.N.B Super Specialty /DSc / DLitt during the year',
                  type: 'text',
                },
                {
                  key: 'qualification_and_year',
                  label:
                    'Qualification (PhD / D.M. / M.Ch. / D.N.B Super Specialty /DSc / DLitt) and Year of obtaining',
                  type: 'text',
                },
                {
                  key: 'recognised_research_guide',
                  label: 'Whether recognised as a research guide for PhD?',
                  type: 'yesno',
                },
                {
                  key: 'year_of_recognition',
                  label: 'Year of recognition as a Research Guide',
                  type: 'number',
                },
                {
                  key: 'still_serving_or_left',
                  label:
                    'Is the teacher still serving the institution?/If not,when did he/she leave the institution?',
                  type: 'text',
                },
                { key: 'scholar_name', label: 'Name of the scholar', type: 'text' },
                {
                  key: 'scholar_registration_month_year',
                  label: 'Month and Year of registration of the scholar',
                  type: 'date',
                },
                {
                  key: 'thesis_title',
                  label: 'PhD Scholar’s Title of the Thesis',
                  type: 'text',
                },
              ],
              note:
                'Research-guide and scholar columns pertain to metrics 3.2.3 and 3.4.2, which share this sheet.',
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            {
              key: 'phd_teachers_list',
              label:
                'List of number of full-time teachers with PhD./ D.M. / M.Ch. / D.N.B Super- Specialty / D.Sc. / D.Litt. and number of full-time teachers for 5 years',
            },
            { key: 'any_additional_information', label: 'Any additional information' },
          ],
          newFrameworkMapping:
            'New C5 Learning and Teaching (Process); partly C2 Faculty Resources (Input)',
          notes:
            'No count derivation: a teacher guiding several scholars can occupy several rows of the shared sheet, so the row count is not a reliable teacher count.',
        },
        {
          id: '2.4.3',
          kind: 'qnm',
          title:
            'Total teaching experience of full-time teachers in the same institution (Full-time teachers’ total teaching experience in the current institution)',
          headline: {
            label:
              'Total teaching experience of full-time teachers in the same institution (years)',
            derive: {
              tableMetricId: '2.4.1',
              expr: 'sum',
              column: 'total_years_experience_same_institution',
            },
          },
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            {
              key: 'teachers_experience_list',
              label:
                'List of teachers including their PAN, designation, Department and details of their experience',
            },
            { key: 'any_additional_information', label: 'Any additional information' },
          ],
          newFrameworkMapping:
            'New C5 Learning and Teaching (Process); partly C2 Faculty Resources (Input)',
          notes:
            'Shares the 2.4.1 & 2.4.3 data-template sheet; headline derived as the sum of the experience column of the 2.4.1 table.',
        },
      ],
    },
    {
      code: '2.5',
      title: 'Evaluation Process and Reforms',
      metrics: [
        {
          id: '2.5.1',
          kind: 'qnm',
          title:
            'Number of days from the date of last semester-end/ year-end examination till the declaration of results during the year',
          headline: {
            label:
              'Number of days from the last semester-end/ year-end examination till the declaration of results',
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '2.5.1',
              columns: [
                { key: 'programme_name', label: 'Programme Name', type: 'text' },
                { key: 'programme_code', label: 'Programme Code', type: 'text' },
                { key: 'semester_year', label: 'Semester/Year', type: 'text' },
                {
                  key: 'last_exam_date',
                  label:
                    'Last date of the last semester-end/ year- end examination',
                  type: 'date',
                },
                {
                  key: 'result_declaration_date',
                  label:
                    'Date of declaration of results of the semester-end/ year-end examination',
                  type: 'date',
                },
              ],
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            {
              key: 'programmes_exam_result_dates',
              label:
                'List of Programmes and the date of last semester-end / year-end examinations and the date of declaration of result',
            },
            { key: 'any_additional_information', label: 'Any additional information' },
          ],
          newFrameworkMapping:
            'New C5 Learning and Teaching (Process); partly C2 Faculty Resources (Input)',
          notes:
            'The docx Data Requirement also lists "Number of days taken for declaration of results", which the sheet computes from the two dates; it is not a separate entry column in the extracted sheet header.',
        },
        {
          id: '2.5.2',
          kind: 'qnm',
          title:
            'Number of students’ complaints/grievances against evaluation against the total number who appeared in the examinations during the year',
          headline: {
            label:
              'Number of students’ complaints/grievances against evaluation during the year',
          },
          evidence: [
            {
              key: 'complaints_and_appeared_students',
              label:
                'Upload the number of complaints and total number of students who appeared for exams during the year',
            },
            {
              key: 'any_additional_information',
              label: 'Upload any additional information',
            },
          ],
          dataTemplateApplicable: false,
          newFrameworkMapping:
            'New C5 Learning and Teaching (Process); partly C2 Faculty Resources (Input)',
        },
        {
          id: '2.5.3',
          kind: 'qlm',
          title:
            'IT integration and reforms in the examination procedures and processes including Continuous Internal Assessment (CIA) have brought in considerable improvement in the Examination Management System (EMS) of the Institution',
          writeups: [{ key: 'main', wordLimit: 200 }],
          urls: [
            {
              key: 'additional_information_link',
              label: 'Paste link for additional Information',
            },
          ],
          evidence: [
            {
              key: 'any_additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping:
            'New C5 Learning and Teaching (Process); partly C2 Faculty Resources (Input)',
          notes:
            'Template asks for the write-up "within a minimum of 200 words" (a NAAC-side wording quirk) covering: Examination procedures; Processes/Procedures integrating IT; Continuous Internal Assessment System. Modelled as a single write-up with the 200-word figure.',
        },
      ],
    },
    {
      code: '2.6',
      title: 'Student Performance and Learning Outcomes',
      metrics: [
        {
          id: '2.6.1',
          kind: 'qlm',
          title:
            'Programme Outcomes and Course Outcomes for all Programmes offered by the institution are stated and displayed on the website and communicated to teachers and students',
          writeups: [{ key: 'main', wordLimit: 200 }],
          urls: [
            {
              key: 'additional_information_link',
              label: 'Link for additional Information',
            },
          ],
          evidence: [
            {
              key: 'course_outcomes',
              label: 'Upload COs for all courses (exemplars from the Glossary)',
            },
            {
              key: 'any_additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping:
            'New C5 Learning and Teaching (Process); partly C2 Faculty Resources (Input)',
        },
        {
          id: '2.6.2',
          kind: 'qlm',
          title:
            'Attainment of Programme Outcomes and Course Outcomes as evaluated by the institution',
          writeups: [{ key: 'main', wordLimit: 200 }],
          urls: [
            {
              key: 'additional_information_link',
              label: 'Paste link for additional Information',
            },
          ],
          evidence: [
            {
              key: 'any_additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping:
            'New C5 Learning and Teaching (Process); partly C2 Faculty Resources (Input)',
        },
        {
          id: '2.6.3',
          kind: 'qnm',
          title:
            'Pass Percentage of students: Total number of final year students who passed in the examinations conducted by Institution; Total number of final year students who appeared for the examinations',
          headline: { label: 'Pass percentage of students' },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '2.6.3',
              columns: [
                { key: 'programme_code', label: 'Programme Code', type: 'text' },
                { key: 'programme_name', label: 'Programme Name', type: 'text' },
                {
                  key: 'students_appeared',
                  label:
                    'Number of students who appeared in the final year examinations',
                  type: 'number',
                },
                {
                  key: 'students_passed',
                  label:
                    'Number of students who passed in the final year examinations',
                  type: 'number',
                },
              ],
            },
          ],
          urls: [
            { key: 'annual_report_link', label: 'Paste link for the annual report' },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            {
              key: 'programmes_pass_list',
              label:
                'Upload list of Programmes and number of students appear for and passed in the final year examinations',
            },
            {
              key: 'any_additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping:
            'New C5 Learning and Teaching (Process); partly C2 Faculty Resources (Input)',
          notes:
            'Headline (pass percentage) is a ratio of the summed passed and appeared columns, which the derive expressions cannot compute; entered manually.',
        },
      ],
    },
    {
      code: '2.7',
      title: 'Student Satisfaction Survey',
      metrics: [
        {
          id: '2.7.1',
          kind: 'qnm',
          title:
            'Student Satisfaction Survey (SSS) on overall institutional performance (Institution may design its own questionnaire). Results and details need to be provided as a weblink',
          headline: {
            label:
              'Student Satisfaction Survey (SSS) on overall institutional performance',
          },
          urls: [
            {
              key: 'sss_weblink',
              label:
                'Weblink to the results and details of the Student Satisfaction Survey',
            },
          ],
          dataTemplateApplicable: false,
          newFrameworkMapping:
            'New C5 Learning and Teaching (Process); partly C2 Faculty Resources (Input)',
        },
      ],
    },
  ],
};
