import type { Criterion } from './types';

export const criterion5: Criterion = {
  number: 5,
  title: 'Student Support and Progression',
  keyIndicators: [
    {
      code: '5.1',
      title: 'Student Support',
      metrics: [
        {
          id: '5.1.1',
          kind: 'qnm',
          title:
            'Number of students benefitted by scholarships and freeships provided by the Government during the year',
          headline: {
            label:
              'Number of students benefitted by Government scholarships and freeships during the year',
            derive: { expr: 'sum', column: 'govt_students' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '5.1.1 & 5.1.2',
              sharedWith: ['5.1.2'],
              columns: [
                { key: 'scheme_name', label: 'Name of the scheme', type: 'text', required: true },
                {
                  key: 'govt_students',
                  label:
                    'Number of students receiving scholarships and freeships provided by the Government during the year: Number of students',
                  type: 'number',
                },
                {
                  key: 'govt_amount',
                  label:
                    'Number of students receiving scholarships and freeships provided by the Government during the year: Amount',
                  type: 'number',
                },
                {
                  key: 'institution_students',
                  label:
                    'Number of students receiving scholarships and freeships provided by the institution during the year: Number of students',
                  type: 'number',
                },
                {
                  key: 'institution_amount',
                  label:
                    'Number of students receiving scholarships and freeships provided by the institution during the year: Amount',
                  type: 'number',
                },
                {
                  key: 'ngo_students',
                  label:
                    'Number of students receiving scholarships and freeships provided by non-government agencies during the year: Number of students',
                  type: 'number',
                },
                {
                  key: 'ngo_amount',
                  label:
                    'Number of students receiving scholarships and freeships provided by non-government agencies during the year: Amount',
                  type: 'number',
                },
                {
                  key: 'ngo_name',
                  label:
                    'Number of students receiving scholarships and freeships provided by non-government agencies during the year: Name of the NGO/Agency',
                  type: 'text',
                },
                {
                  key: 'link_to_relevant_document',
                  label: 'Link to relevant document',
                  type: 'url',
                },
              ],
              note:
                'Shared NAAC sheet covering 5.1.1 (Government scholarships/freeships) and 5.1.2 (institution and non-government scholarships/freeships). The sheet has a two-level header; column labels here combine the group heading with the sub-heading.',
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            {
              key: 'self_attested_letters',
              label:
                'Upload self-attested letters with the list of students receiving scholarships',
            },
            { key: 'additional_information', label: 'Upload any additional information' },
          ],
          newFrameworkMapping: 'New C8 Student Outcomes (Outcome)',
          notes:
            'Headline is derived as the sum of the Government "Number of students" column of the shared sheet.',
        },
        {
          id: '5.1.2',
          kind: 'qnm',
          title:
            'Number of students benefitted by scholarships and freeships provided by the institution and non-government agencies during the year',
          headline: {
            label:
              'Number of students benefitted by scholarships and freeships from the institution and non-government agencies during the year',
          },
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            { key: 'additional_information', label: 'Upload any additional information' },
          ],
          newFrameworkMapping: 'New C8 Student Outcomes (Outcome)',
          notes:
            'Data is entered in the shared table owned by 5.1.1 (sheet "5.1.1 & 5.1.2"). Headline is entered manually because it equals the sum of TWO columns (institution students + non-government students), which a single-column derivation cannot express.',
        },
        {
          id: '5.1.3',
          kind: 'option',
          title:
            'The following Capacity Development and Skill Enhancement activities are organised for improving students’ capabilities: Soft Skills, Language and Communication Skills, Life Skills (Yoga, Physical fitness, Health and Hygiene), Awareness of Trends in Technology',
          optionSelect: {
            label: 'Choose any one',
            options: [
              'All of the above',
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
              sheetRef: '5.1.3',
              columns: [
                {
                  key: 'programme_name',
                  label: 'Name of the Capacity Development and Skill Enhancement programme',
                  type: 'text',
                  required: true,
                },
                { key: 'year_of_implementation', label: 'Year of implementation', type: 'text' },
                {
                  key: 'students_enrolled',
                  label: 'Number of students enrolled',
                  type: 'number',
                },
                {
                  key: 'agencies_involved',
                  label:
                    'Name of the agencies/consultants involved with contact details, if any',
                  type: 'text',
                },
              ],
              note:
                'The data-template sheet heading for the agencies column reads "Name of the agencies/consultants involved with contact details, if any"; the docx Data Requirements list abbreviates it to "Name of the agencies involved with contact details". The sheet wording is used.',
            },
          ],
          urls: [
            { key: 'institutional_website', label: 'Link to Institutional website' },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            {
              key: 'capability_development_details',
              label: 'Details of capability development and schemes',
            },
            { key: 'additional_information', label: 'Any additional information' },
          ],
          newFrameworkMapping: 'New C8 Student Outcomes (Outcome)',
          notes:
            'Printed as QnM in the template but modelled as an option metric because it offers a fixed list of options (All / Any 3 / Any 2 / Any 1 / None of the above).',
        },
        {
          id: '5.1.4',
          kind: 'qnm',
          title:
            'Number of students benefitted from guidance/coaching for competitive examinations and career counselling offered by the institution during the year',
          headline: {
            label:
              'Number of students benefitted from guidance/coaching for competitive examinations and career counselling during the year',
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '5.1.4',
              columns: [
                {
                  key: 'competitive_exam_activity_name',
                  label:
                    'Name of the Activity conducted by the HEI to offer guidance/coaching for competitive examinations during the year: Name of the Activity',
                  type: 'text',
                  required: true,
                },
                {
                  key: 'competitive_exam_students_participated',
                  label:
                    'Name of the Activity conducted by the HEI to offer guidance/coaching for competitive examinations during the year: Number of students who attended / participated',
                  type: 'number',
                },
                {
                  key: 'career_counselling_details',
                  label:
                    'Name of the Activity conducted by the HEI to offer guidance / coaching for career counselling during the year: Details of career counselling',
                  type: 'longtext',
                },
                {
                  key: 'career_counselling_students_participated',
                  label:
                    'Name of the Activity conducted by the HEI to offer guidance / coaching for career counselling during the year: Number of students who attended / participated',
                  type: 'number',
                },
                {
                  key: 'students_placed_campus_placement',
                  label: 'Number of students placed through campus placement',
                  type: 'number',
                },
                {
                  key: 'link_to_relevant_documents',
                  label: 'Link to the relevant document(s)',
                  type: 'url',
                },
              ],
              note:
                'The sheet has a two-level header (competitive-examination activities and career-counselling activities each span two sub-columns); column labels here combine the group heading with the sub-heading.',
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            { key: 'additional_information', label: 'Any additional information' },
          ],
          newFrameworkMapping: 'New C8 Student Outcomes (Outcome)',
          notes:
            'Headline is entered manually: students benefitted spans the two participation columns (competitive examinations + career counselling), which a single-column derivation cannot express. The docx Data Requirement list (scheme name, students passed, students placed) differs from the data-template sheet; the sheet columns are used.',
        },
        {
          id: '5.1.5',
          kind: 'option',
          title:
            'The institution adopts the following mechanism for redressal of students’ grievances, including sexual harassment and ragging: Implementation of guidelines of statutory/regulatory bodies, Creating awareness and implementation of policies with zero tolerance, Mechanism for submission of online/offline students’ grievances, Timely redressal of grievances through appropriate committees',
          optionSelect: {
            label: 'Choose any one',
            options: [
              'All of the above',
              'Any 3 of the above',
              'Any 2 of the above',
              'Any 1 of the above',
              'None of the above',
            ],
          },
          evidence: [
            {
              key: 'committee_minutes',
              label:
                'Minutes of the meetings of students’ grievance redressal committee, prevention of sexual harassment committee and Anti-ragging committee',
            },
            {
              key: 'grievance_details',
              label: 'Details of student grievances including sexual harassment and ragging cases',
            },
            { key: 'additional_information', label: 'Upload any additional information' },
          ],
          dataTemplateApplicable: false,
          newFrameworkMapping: 'New C8 Student Outcomes (Outcome)',
          notes:
            'Printed as QnM in the template but modelled as an option metric because it offers a fixed list of options. Data template is not applicable to this metric.',
        },
      ],
    },
    {
      code: '5.2',
      title: 'Student Progression',
      metrics: [
        {
          id: '5.2.1',
          kind: 'qnm',
          title: 'Number of outgoing students who got placement during the year',
          headline: {
            label: 'Number of outgoing students placed during the year',
            derive: { expr: 'count' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '5.2.1',
              columns: [
                {
                  key: 'student_name_contact',
                  label: 'Name of student placed with his/her contact details',
                  type: 'text',
                  required: true,
                },
                { key: 'programme_completed', label: 'Programme completed', type: 'text' },
                {
                  key: 'employer_name_contact',
                  label: 'Name of the employer with contact details',
                  type: 'text',
                },
                {
                  key: 'pay_package',
                  label: 'Pay package at the time of appointment',
                  type: 'number',
                },
              ],
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            { key: 'students_placed_list', label: 'Self-attested list of students placed' },
            { key: 'additional_information', label: 'Upload any additional information' },
          ],
          newFrameworkMapping: 'New C8 Student Outcomes (Outcome)',
          notes: 'Headline is derived as the count of rows (one row per student placed).',
        },
        {
          id: '5.2.2',
          kind: 'qnm',
          title: 'Number of outgoing students progressing to higher education during the year',
          headline: {
            label: 'Number of outgoing students progressing to higher education during the year',
            derive: { expr: 'count' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '5.2.2',
              columns: [
                {
                  key: 'student_name',
                  label: 'Name of student enrolled for higher education',
                  type: 'text',
                  required: true,
                },
                { key: 'programme_completed', label: 'Programme completed', type: 'text' },
                { key: 'institution_joined', label: 'Name of institution joined', type: 'text' },
                {
                  key: 'programme_admitted_to',
                  label: 'Name of programme admitted to',
                  type: 'text',
                },
              ],
              note:
                'The sheet heading reads "5.2.2 Percentage of students’ progression to higher education" although the AQAR metric asks for the Number of outgoing students progressing; mapped by content.',
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            { key: 'supporting_data', label: 'Upload supporting data for students/alumni' },
            {
              key: 'higher_education_details',
              label: 'Details of students who went for higher education',
            },
            { key: 'additional_information', label: 'Any additional information' },
          ],
          newFrameworkMapping: 'New C8 Student Outcomes (Outcome)',
          notes:
            'Headline is derived as the count of rows (one row per student enrolled for higher education). The Number-Year box in the docx is the headline presentation, not a table.',
        },
        {
          id: '5.2.3',
          kind: 'qnm',
          title:
            'Number of students qualifying in state/ national/ international level examinations during the year',
          headline: {
            label:
              '5.2.3.1: Number of students who qualified in state/ national/ international examinations (e.g.: IIT-JAM/NET/SET/JRF/GATE/GMAT/CAT/GRE/TOEFL/Civil Services/State government examinations) during the year',
          },
          tables: [
            {
              key: 'qualified',
              title: 'Names of students selected/ qualified',
              mode: 'dynamic',
              sheetRef: '5.2.3',
              columns: [
                {
                  key: 'registration_number',
                  label: 'Registration number/Roll number for the exam',
                  type: 'text',
                  required: true,
                },
                { key: 'net', label: 'NET', type: 'text' },
                { key: 'iit_jam', label: 'IIT-JAM', type: 'text' },
                { key: 'slet_set', label: 'SLET/SET', type: 'text' },
                { key: 'jrf', label: 'JRF', type: 'text' },
                { key: 'gate', label: 'GATE', type: 'text' },
                { key: 'gmat', label: 'GMAT', type: 'text' },
                { key: 'cat', label: 'CAT', type: 'text' },
                { key: 'gre', label: 'GRE', type: 'text' },
                { key: 'jam', label: 'JAM', type: 'text' },
                { key: 'ielts', label: 'IELTS', type: 'text' },
                { key: 'toefl', label: 'TOEFL', type: 'text' },
                { key: 'civil_services', label: 'Civil Services', type: 'text' },
                {
                  key: 'state_government_examinations',
                  label: 'State government examinations',
                  type: 'text',
                },
                {
                  key: 'other_examinations',
                  label:
                    'Other examinations conducted by the State / Central Government Agencies (Specify)',
                  type: 'text',
                },
              ],
              note:
                'Student names are entered under the column of the examination qualified. Instruction on the sheet: "Please do not include individual university’s entrance examination."',
            },
            {
              key: 'appeared',
              title: 'Names of students who appeared',
              mode: 'dynamic',
              sheetRef: '5.2.3',
              columns: [
                {
                  key: 'registration_number',
                  label: 'Registration number/Roll number for the exam',
                  type: 'text',
                  required: true,
                },
                { key: 'net', label: 'NET', type: 'text' },
                { key: 'iit_jam', label: 'IIT-JAM', type: 'text' },
                { key: 'slet_set', label: 'SLET/SET', type: 'text' },
                { key: 'jrf', label: 'JRF', type: 'text' },
                { key: 'gate', label: 'GATE', type: 'text' },
                { key: 'gmat', label: 'GMAT', type: 'text' },
                { key: 'cat', label: 'CAT', type: 'text' },
                { key: 'gre', label: 'GRE', type: 'text' },
                { key: 'jam', label: 'JAM', type: 'text' },
                { key: 'ielts', label: 'IELTS', type: 'text' },
                { key: 'toefl', label: 'TOEFL', type: 'text' },
                { key: 'civil_services', label: 'Civil Services', type: 'text' },
                {
                  key: 'state_government_examinations',
                  label: 'State government examinations',
                  type: 'text',
                },
                {
                  key: 'other_examinations',
                  label:
                    'Other examinations conducted by the State / Central Government Agencies (Specify)',
                  type: 'text',
                },
              ],
              note:
                'Second block of the same 5.2.3 sheet, capturing students who appeared (sub-metric 5.2.3.2).',
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            { key: 'supporting_data', label: 'Upload supporting data for students/alumni' },
            { key: 'additional_information', label: 'Any additional information' },
          ],
          newFrameworkMapping: 'New C8 Student Outcomes (Outcome)',
          notes:
            'The metric has two sub-numbers: 5.2.3.1 (students who qualified) is the headline; 5.2.3.2 (students who appeared) is captured in the "appeared" table since the catalog models one headline per metric. Both headline numbers are entered manually: a student appearing in more than one examination occupies multiple rows, so a row count could over-state the number of students.',
        },
      ],
    },
    {
      code: '5.3',
      title: 'Student Participation and Activities',
      metrics: [
        {
          id: '5.3.1',
          kind: 'qnm',
          title:
            'Number of awards/medals for outstanding performance in sports and/or cultural activities at inter-university / state /national / international events (award for a team event should be counted as one) during the year',
          headline: {
            label:
              'Number of awards/medals won at inter-university/state/national/international events during the year',
            derive: { expr: 'count' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '5.3.1',
              columns: [
                {
                  key: 'award_medal_name',
                  label: 'Name of the award/ medal',
                  type: 'text',
                  required: true,
                },
                {
                  key: 'team_or_individual',
                  label: 'Team / Individual',
                  type: 'select',
                  options: ['Team', 'Individual'],
                },
                { key: 'student_name', label: 'Name of the student', type: 'text' },
                {
                  key: 'event_level',
                  label: 'Inter-university / State / National / International',
                  type: 'select',
                  options: ['Inter-university', 'State', 'National', 'International'],
                },
                { key: 'event_name', label: 'Name of the event', type: 'text' },
                { key: 'month_and_year', label: 'Month and Year', type: 'date' },
              ],
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            {
              key: 'award_letters_certificates',
              label: 'e-copies of award letters and certificates',
            },
            { key: 'additional_information', label: 'Any additional information' },
          ],
          newFrameworkMapping: 'New C8 Student Outcomes (Outcome)',
          notes:
            'Headline is derived as the count of rows (one row per award/medal; a team award is one row).',
        },
        {
          id: '5.3.2',
          kind: 'qlm',
          title:
            'Presence of an active Student Council and representation of students in academic and administrative bodies/committees of the institution: Describe the Student Council’s activities and students’ role in academic and administrative bodies/committees (within a maximum of 200 words)',
          writeups: [{ key: 'main', wordLimit: 200 }],
          evidence: [
            { key: 'additional_information', label: 'Upload any additional information' },
          ],
          urls: [
            { key: 'link_additional_information', label: 'Paste link for additional information' },
          ],
          newFrameworkMapping: 'New C8 Student Outcomes (Outcome)',
          notes: 'Printed as "Q1M" in the template; this is NAAC’s typo for QlM.',
        },
        {
          id: '5.3.3',
          kind: 'qnm',
          title:
            'Number of sports and cultural events / competitions organised by the institution',
          headline: {
            label:
              'Number of sports and cultural events / competitions organised during the year',
            derive: { expr: 'count' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '5.3.3',
              columns: [
                {
                  key: 'event_name',
                  label: 'Name of the event/competition',
                  type: 'text',
                  required: true,
                },
                {
                  key: 'event_date',
                  label: 'Date of event/competition (DD-MM-YYYY)',
                  type: 'date',
                },
              ],
              note:
                'Sheet instruction: "Classify the data and provide in a chronological order."',
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            { key: 'event_report', label: 'Report of the event' },
            {
              key: 'events_list',
              label: 'List of sports and cultural events / competitions organised per year',
            },
            { key: 'additional_information', label: 'Upload any additional information' },
          ],
          newFrameworkMapping: 'New C8 Student Outcomes (Outcome)',
          notes: 'Headline is derived as the count of rows (one row per event/competition).',
        },
      ],
    },
    {
      code: '5.4',
      title: 'Alumni Engagement',
      metrics: [
        {
          id: '5.4.1',
          kind: 'qlm',
          title:
            'The Alumni Association and its Chapters (registered and functional) contribute significantly to the development of the institution through financial and other support services: Describe the contribution of the alumni association to the institution (within a maximum of 200 words)',
          writeups: [{ key: 'main', wordLimit: 200 }],
          evidence: [
            { key: 'additional_information', label: 'Upload any additional information' },
          ],
          urls: [
            { key: 'link_additional_information', label: 'Paste link for additional Information' },
          ],
          newFrameworkMapping: 'New C8 Student Outcomes (Outcome)',
        },
        {
          id: '5.4.2',
          kind: 'option',
          title: 'Alumni’s financial contribution during the year',
          optionSelect: {
            label: 'Choose any one',
            options: [
              'A. ≥ 15 Lakhs',
              'B. 10 Lakhs - 15 Lakhs',
              'C. 5 Lakhs - 10 Lakhs',
              'D. 2 Lakhs - 5 Lakhs',
              'E. <2 Lakhs',
            ],
          },
          evidence: [
            { key: 'additional_information', label: 'Upload any additional information' },
          ],
          dataTemplateApplicable: false,
          newFrameworkMapping: 'New C8 Student Outcomes (Outcome)',
          notes:
            'Printed as QnM in the template but modelled as an option metric because it asks to "Choose any one" from a fixed list of contribution slabs. Data template is not applicable to this metric.',
        },
      ],
    },
  ],
};
