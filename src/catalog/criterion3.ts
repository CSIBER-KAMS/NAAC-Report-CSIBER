import type { Criterion } from './types';

export const criterion3: Criterion = {
  number: 3,
  title: 'Research, Innovations and Extension',
  keyIndicators: [
    {
      code: '3.1',
      title: 'Promotion of Research and Facilities',
      metrics: [
        {
          id: '3.1.1',
          kind: 'qlm',
          title:
            'The institution\'s research facilities are frequently updated and there is a well-defined policy for promotion of research which is uploaded on the institutional website and implemented. Present a write-up within a maximum of 200 words.',
          writeups: [{ key: 'main', wordLimit: 200 }],
          urls: [
            {
              key: 'policy_document_url',
              label: 'Provide URL of policy document on promotion of research uploaded on the website',
            },
          ],
          evidence: [
            {
              key: 'minutes_research_policy',
              label:
                'Upload the Minutes of the Governing Council/ Syndicate/Board of Management related to research promotion policy adoption',
            },
            { key: 'additional_info', label: 'Any additional information' },
          ],
          newFrameworkMapping:
            'New C9 Research and Innovation Outcomes (Outcome); extension partly New C6 Extended Curricular Engagements (Process)',
        },
        {
          id: '3.1.2',
          kind: 'qnm',
          title:
            'The institution provides seed money to its teachers for research: Seed money provided by the institution to its teachers for research during the year (INR in lakhs)',
          headline: {
            label:
              'Seed money provided by the institution to its teachers for research during the year (INR in lakhs)',
            derive: { expr: 'sum', column: 'amount_of_seed_money' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '3.1.2',
              columns: [
                {
                  key: 'name_of_teacher',
                  label: 'Name of the teacher provided with seed money',
                  type: 'text',
                  required: true,
                },
                { key: 'amount_of_seed_money', label: 'Amount of seed money', type: 'number', required: true },
                { key: 'month_year_of_receiving', label: 'Month and Year of receiving', type: 'date' },
                {
                  key: 'link_policy_sanction',
                  label:
                    'Link to the policy document for sanction of seed money / grants for research from the institution and link to the sanction letter',
                  type: 'url',
                },
              ],
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            {
              key: 'minutes_seed_money',
              label: 'Minutes of the relevant bodies of the institution regarding seed money',
            },
            {
              key: 'budget_expenditure_statements',
              label:
                'Budget and expenditure statements signed by the Finance Officer indicating seed money provided and utilized',
            },
            {
              key: 'list_of_teachers_grants',
              label: 'List of teachers receiving grant and details of grant received',
            },
            { key: 'additional_info', label: 'Any additional information' },
          ],
          newFrameworkMapping:
            'New C9 Research and Innovation Outcomes (Outcome); extension partly New C6 Extended Curricular Engagements (Process)',
        },
        {
          id: '3.1.3',
          kind: 'qnm',
          title:
            'Number of teachers who were awarded national / international fellowship(s) for advanced studies/research during the year',
          headline: {
            label:
              'Number of teachers awarded national / international fellowship(s) for advanced studies/research during the year',
            derive: { expr: 'count' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '3.1.3',
              columns: [
                {
                  key: 'name_of_teacher',
                  label: 'Name of the teacher awarded national/ international fellowship/financial support',
                  type: 'text',
                  required: true,
                },
                { key: 'name_of_award', label: 'Name of the Award/Fellowship', type: 'text', required: true },
                { key: 'month_year_of_award', label: 'Month and Year of Award', type: 'date' },
                { key: 'awarding_agency', label: 'Awarding Agency', type: 'text' },
              ],
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            { key: 'award_letters', label: 'e-copies of the award letters of the teachers' },
            {
              key: 'list_of_teachers_fellowships',
              label: 'List of teachers and details of their international fellowship(s)',
            },
            { key: 'additional_info', label: 'Any additional information' },
          ],
          newFrameworkMapping:
            'New C9 Research and Innovation Outcomes (Outcome); extension partly New C6 Extended Curricular Engagements (Process)',
        },
      ],
    },
    {
      code: '3.2',
      title: 'Resource Mobilization for Research',
      metrics: [
        {
          id: '3.2.1',
          kind: 'qnm',
          title:
            'Grants received from Government and Non-Governmental agencies for research projects, endowments, Chairs during the year (INR in Lakhs)',
          headline: {
            label:
              'Grants received from Government and Non-Governmental agencies for research projects, endowments, Chairs during the year (INR in Lakhs)',
            derive: { expr: 'sum', column: 'funds_provided' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '3.2.1, 3.2.2 & 3.2.4',
              sharedWith: ['3.2.2', '3.2.4'],
              columns: [
                {
                  key: 'principal_investigator',
                  label: 'Name of the Principal Investigator/ Co-Investigator (if applicable)',
                  type: 'text',
                  required: true,
                },
                {
                  key: 'department',
                  label: 'Department of the Principal Investigator/ Co-Investigator',
                  type: 'text',
                },
                { key: 'funding_agency', label: 'Name of the Funding Agency', type: 'text', required: true },
                {
                  key: 'agency_type',
                  label: 'Type (Government/Non-Government)',
                  type: 'select',
                  options: ['Government', 'Non-Government'],
                },
                { key: 'funds_provided', label: 'Funds provided (INR in lakhs)', type: 'number', required: true },
                { key: 'month_year_of_grant', label: 'Month and Year of receving the grant', type: 'date' },
                { key: 'duration', label: 'Duration of the Project', type: 'text' },
              ],
              note:
                'Single NAAC sheet shared by metrics 3.2.1, 3.2.2 and 3.2.4. Column heading "receving" is NAAC\'s own typo, kept verbatim.',
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            {
              key: 'grant_award_letters',
              label:
                'e-copies of the grant award letters for research projects sponsored by non-governmental agencies/organizations',
            },
            { key: 'list_of_projects', label: 'List of projects and grant details' },
            { key: 'additional_info', label: 'Any additional information' },
          ],
          newFrameworkMapping:
            'New C9 Research and Innovation Outcomes (Outcome); extension partly New C6 Extended Curricular Engagements (Process)',
        },
        {
          id: '3.2.2',
          kind: 'qnm',
          title: 'Number of teachers having research projects during the year',
          headline: { label: 'Number of teachers having research projects during the year' },
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            { key: 'additional_info', label: 'Upload any additional information' },
          ],
          urls: [{ key: 'additional_info_link', label: 'Paste link for additional Information' }],
          notes:
            'Data comes from the shared sheet owned by 3.2.1 (sheet "3.2.1, 3.2.2 & 3.2.4"). Headline counts distinct teachers, not rows, so it is entered manually rather than derived.',
          newFrameworkMapping:
            'New C9 Research and Innovation Outcomes (Outcome); extension partly New C6 Extended Curricular Engagements (Process)',
        },
        {
          id: '3.2.3',
          kind: 'qnm',
          title: 'Number of teachers recognised as research guides',
          headline: { label: 'Number of teachers recognised as research guides' },
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            {
              key: 'university_recognition_letters',
              label: 'Upload copies of the letter of the university recognizing teachers as research guides',
            },
          ],
          notes:
            'Data for this metric lives in the cross-criterion shared sheet "2.4.2 , 3.2.3 & 3.4.2", whose table is owned by metric 2.4.2 in Criterion 2; no separate table is modelled here.',
          newFrameworkMapping:
            'New C9 Research and Innovation Outcomes (Outcome); extension partly New C6 Extended Curricular Engagements (Process)',
        },
        {
          id: '3.2.4',
          kind: 'qnm',
          title:
            'Number of departments having research projects funded by Government and Non-Government agencies during the year',
          headline: {
            label:
              'Number of departments having research projects funded by Government and Non-Government agencies during the year',
          },
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            { key: 'funding_agency_documents', label: 'Supporting document from Funding Agencies' },
            { key: 'additional_info', label: 'Any additional information' },
          ],
          urls: [{ key: 'funding_agency_website', label: 'Paste link to funding agencies\' website' }],
          notes:
            'Data comes from the shared sheet owned by 3.2.1 (sheet "3.2.1, 3.2.2 & 3.2.4"). Headline counts distinct departments, not rows, so it is entered manually rather than derived.',
          newFrameworkMapping:
            'New C9 Research and Innovation Outcomes (Outcome); extension partly New C6 Extended Curricular Engagements (Process)',
        },
      ],
    },
    {
      code: '3.3',
      title: 'Innovation Ecosystem',
      metrics: [
        {
          id: '3.3.1',
          kind: 'qlm',
          title:
            'Institution has created an ecosystem for innovations and creation and transfer of knowledge supported by dedicated centres for research, entrepreneurship, community orientation, incubation, etc. Present a write-up within a maximum of 200 words.',
          writeups: [{ key: 'main', wordLimit: 200 }],
          evidence: [{ key: 'additional_info', label: 'Upload any additional information' }],
          urls: [{ key: 'additional_info_link', label: 'Paste link for additional information' }],
          newFrameworkMapping:
            'New C9 Research and Innovation Outcomes (Outcome); extension partly New C6 Extended Curricular Engagements (Process)',
        },
        {
          id: '3.3.2',
          kind: 'qnm',
          title:
            'Number of workshops/seminars conducted on Research Methodology, Intellectual Property Rights (IPR), Entrepreneurship and Skill Development during the year',
          headline: {
            label:
              'Number of workshops/seminars conducted on Research Methodology, IPR, Entrepreneurship and Skill Development during the year',
            derive: { expr: 'count' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '3.3.2',
              columns: [
                { key: 'workshop_name', label: 'Name of the Workshop/ Seminar', type: 'text', required: true },
                { key: 'number_of_participants', label: 'Number of Participants', type: 'number' },
                { key: 'date_from_to', label: 'Date (From - To)', type: 'text' },
                {
                  key: 'link_to_report',
                  label: 'Link to the Workshop/Seminar report on the website',
                  type: 'url',
                },
              ],
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            { key: 'event_reports', label: 'Report of the events' },
            { key: 'list_of_workshops', label: 'List of workshops/seminars conducted during the year' },
            { key: 'additional_info', label: 'Any additional information' },
          ],
          newFrameworkMapping:
            'New C9 Research and Innovation Outcomes (Outcome); extension partly New C6 Extended Curricular Engagements (Process)',
        },
      ],
    },
    {
      code: '3.4',
      title: 'Research Publications and Awards',
      metrics: [
        {
          id: '3.4.1',
          kind: 'option',
          title:
            'The Institution ensures implementation of its Code of Ethics for Research uploaded in the website through the following: Research Advisory Committee; Ethics Committee; Inclusion of Research Ethics in the research methodology course work; Plagiarism check through authenticated software',
          optionSelect: {
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
              key: 'code_of_ethics_documents',
              label:
                'Code of Ethics for Research, Research Advisory Committee and Ethics Committee constitution and list of members of these committees, software used for plagiarism check',
            },
            { key: 'additional_info', label: 'Any additional information' },
          ],
          dataTemplateApplicable: false,
          notes:
            'Template labels this metric QnM but presents an option list ("Options:") rather than "Choose any one"; modelled as an option metric.',
          newFrameworkMapping:
            'New C9 Research and Innovation Outcomes (Outcome); extension partly New C6 Extended Curricular Engagements (Process)',
        },
        {
          id: '3.4.2',
          kind: 'qnm',
          title:
            'Number of PhD candidates registered per teacher (as per the data given with regard to recognized PhD guides/ supervisors provided in Metric No. 3.2.3) during the year',
          headline: { label: 'Number of PhD candidates registered per teacher during the year' },
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            {
              key: 'phd_scholars_list',
              label:
                'List of PhD scholars with relevant details like name of the guide, title of the thesis, month and year of registration, etc.',
            },
            { key: 'additional_info', label: 'Any additional information' },
          ],
          urls: [{ key: 'research_page_url', label: 'Provide URL to the research page on HEI website' }],
          notes:
            'Data lives in the cross-criterion shared sheet "2.4.2 , 3.2.3 & 3.4.2" owned by metric 2.4.2 in Criterion 2. The template prints two overlapping File Description blocks (merged here) and asks separately for "Number of PhD students registered during the year" and "Number of teachers recognized as guides during the year" (numerator and denominator of the headline ratio).',
          newFrameworkMapping:
            'New C9 Research and Innovation Outcomes (Outcome); extension partly New C6 Extended Curricular Engagements (Process)',
        },
        {
          id: '3.4.3',
          kind: 'qnm',
          title: 'Number of research papers per teacher in CARE Journals notified on UGC website during the year',
          headline: {
            label: 'Number of research papers in CARE Journals notified on UGC website during the year',
            derive: { expr: 'count' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '3.4.3',
              columns: [
                { key: 'author_names', label: 'Name of the Author(s)', type: 'text', required: true },
                { key: 'author_department', label: 'Department of the Author(s)', type: 'text' },
                { key: 'paper_title', label: 'Title of the Paper', type: 'text', required: true },
                { key: 'journal_name', label: 'Name of the Journal', type: 'text', required: true },
                { key: 'month_year_of_publication', label: 'Month and Year of publication', type: 'date' },
                { key: 'issn', label: 'ISSN', type: 'text' },
                {
                  key: 'link_ugc_notification',
                  label: 'Link to the notification in UGC enlistment of the Journal',
                  type: 'url',
                },
              ],
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            {
              key: 'list_of_papers',
              label: 'List of research papers by title, author, department, and year of publication',
            },
            { key: 'additional_info', label: 'Any additional information' },
          ],
          notes:
            'Headline counts papers (table rows); NAAC computes the per-teacher ratio against full-time teacher data.',
          newFrameworkMapping:
            'New C9 Research and Innovation Outcomes (Outcome); extension partly New C6 Extended Curricular Engagements (Process)',
        },
        {
          id: '3.4.4',
          kind: 'qnm',
          title:
            'Number of books and chapters in edited volumes / books published per teacher during the year',
          headline: {
            label: 'Number of books and chapters in edited volumes / books published during the year',
            derive: { expr: 'count' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '3.4.4',
              columns: [
                { key: 'sl_no', label: 'Sl. No.', type: 'number' },
                { key: 'teacher_name', label: 'Name of the Teacher', type: 'text', required: true },
                { key: 'book_title', label: 'Title of the Book published', type: 'text' },
                { key: 'chapter_title', label: 'Title of the Chapter published', type: 'text' },
                {
                  key: 'proceedings_title',
                  label: 'Title of the proceedings of the conference',
                  type: 'text',
                },
                { key: 'conference_name', label: 'Name of the conference', type: 'text' },
                {
                  key: 'national_international',
                  label: 'National / International',
                  type: 'select',
                  options: ['National', 'International'],
                },
                { key: 'year_month_of_publication', label: 'Year and month of publication', type: 'date' },
                { key: 'isbn', label: 'ISBN of the Book/Conference Proceeding', type: 'text' },
                {
                  key: 'affiliating_institute',
                  label: 'Affiliating Institute of the teacher at the time of publication',
                  type: 'text',
                },
                { key: 'publisher_name', label: 'Name of the Publisher', type: 'text' },
              ],
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            { key: 'additional_info', label: 'Upload any additional information' },
          ],
          urls: [{ key: 'additional_info_link', label: 'Paste link for additional information' }],
          notes:
            'Headline counts publications (table rows); NAAC computes the per-teacher ratio against full-time teacher data.',
          newFrameworkMapping:
            'New C9 Research and Innovation Outcomes (Outcome); extension partly New C6 Extended Curricular Engagements (Process)',
        },
        {
          id: '3.4.5',
          kind: 'qnm',
          title:
            'Bibliometrics of the publications during the year based on average Citation Index in Scopus/ Web of Science/PubMed',
          headline: {
            label:
              'Average Citation Index of publications in Scopus/ Web of Science/PubMed during the year',
          },
          evidence: [
            { key: 'additional_info', label: 'Any additional information' },
            { key: 'bibliometrics', label: 'Bibliometrics of the publications during the year' },
          ],
          dataTemplateApplicable: false,
          notes:
            'Template asks for sub-values 3.4.5.1 (total Citations in Scopus and in Web of Science during the year) and 3.4.5.2 (total Publications in Scopus and in Web of Science during the year), each as Year/Number boxes. The data obtained from INFLIBNET will be used for the purpose.',
          newFrameworkMapping:
            'New C9 Research and Innovation Outcomes (Outcome); extension partly New C6 Extended Curricular Engagements (Process)',
        },
      ],
    },
    {
      code: '3.5',
      title: 'Consultancy',
      metrics: [
        {
          id: '3.5.1',
          kind: 'qnm',
          title: 'Revenue generated from consultancy and corporate training during the year (INR in lakhs)',
          headline: {
            label: 'Revenue generated from consultancy and corporate training during the year (INR in lakhs)',
          },
          tables: [
            {
              key: 'consultancy',
              title: 'Revenue generated from consultancy during the year',
              mode: 'dynamic',
              sheetRef: '3.5.1',
              columns: [
                { key: 'consultant_names', label: 'Names of the teacher-consultants', type: 'text', required: true },
                { key: 'project_name', label: 'Name of the consultancy project', type: 'text' },
                {
                  key: 'sponsoring_agency',
                  label: 'Consulting/Sponsoring agency with contact details',
                  type: 'text',
                },
                { key: 'revenue_generated', label: 'Revenue generated (INR in lakhs)', type: 'number' },
              ],
              note:
                'Workbook captions this sheet "3.5.1 ... & 3.5.2 ..." but both sub-tables hold 3.5.1 revenue data; 3.5.2 (expenditure) has no columns of its own — mapped by content, not by sheet label.',
            },
            {
              key: 'corporate_training',
              title: 'Revenue generated from corporate training during the year',
              mode: 'dynamic',
              sheetRef: '3.5.1',
              columns: [
                {
                  key: 'trainer_names',
                  label: 'Names of the teacher-consultants/corporate trainers',
                  type: 'text',
                  required: true,
                },
                { key: 'programme_title', label: 'Title of the corporate training programme', type: 'text' },
                { key: 'training_agency', label: 'Agency seeking training with contact details', type: 'text' },
                { key: 'revenue_generated', label: 'Revenue generated (amount in rupees)', type: 'number' },
                { key: 'number_of_trainees', label: 'Number of trainees', type: 'number' },
              ],
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            {
              key: 'audited_statements',
              label:
                'Audited statements of accounts indicating the revenue generated through consultancy and corporate training',
            },
            { key: 'list_of_consultants', label: 'List of consultants and revenue generated by them' },
            { key: 'additional_info', label: 'Any additional information' },
          ],
          notes:
            'Headline is entered manually: the two sub-tables report revenue in different units (INR in lakhs vs rupees), so no automatic sum is derived.',
          newFrameworkMapping:
            'New C9 Research and Innovation Outcomes (Outcome); extension partly New C6 Extended Curricular Engagements (Process)',
        },
        {
          id: '3.5.2',
          kind: 'qnm',
          title:
            'Total amount spent on developing facilities, training teachers and clerical/project staff for undertaking consultancy during the year',
          headline: {
            label:
              'Total amount spent on developing facilities, training teachers and clerical/project staff for undertaking consultancy during the year',
          },
          evidence: [
            {
              key: 'audited_statements',
              label:
                'Audited statements of accounts indicating the expenditure incurred on developing facilities and training teachers and staff for undertaking consultancy',
            },
            {
              key: 'list_of_training_programmes',
              label: 'List of training programmes, teachers and staff trained for undertaking consultancy',
            },
            {
              key: 'list_of_facilities',
              label: 'List of facilities and staff available for undertaking consultancy',
            },
            { key: 'additional_info', label: 'Any additional information' },
          ],
          dataTemplateApplicable: false,
          notes:
            'Criterion template states "Data template is not applicable to this metric" (hence dataTemplateApplicable: false), although 3.5.2 is absent from the master workbook\'s not-applicable list — that list names a nonexistent 3.4.6 instead, likely NAAC\'s typo for 3.5.2. Its File Description carries no data-template bullet, and the sheet captioned "3.5.1 & 3.5.2" holds only 3.5.1 revenue columns.',
          newFrameworkMapping:
            'New C9 Research and Innovation Outcomes (Outcome); extension partly New C6 Extended Curricular Engagements (Process)',
        },
      ],
    },
    {
      code: '3.6',
      title: 'Extension Activities',
      metrics: [
        {
          id: '3.6.1',
          kind: 'qlm',
          title:
            'Extension activities carried out in the neighbourhood sensitising students to social issues for their holistic development, and the impact thereof during the year: Describe the impact of extension activities in sensitising students to social issues for their holistic development within a maximum of 200 words.',
          writeups: [{ key: 'main', wordLimit: 200 }],
          evidence: [{ key: 'additional_info', label: 'Upload any additional information' }],
          urls: [{ key: 'additional_info_link', label: 'Paste link for additional information' }],
          newFrameworkMapping:
            'New C9 Research and Innovation Outcomes (Outcome); extension partly New C6 Extended Curricular Engagements (Process)',
        },
        {
          id: '3.6.2',
          kind: 'qnm',
          title:
            'Number of awards and recognition received by the Institution, its teachers and students for extension activities from Government / Government-recognised bodies during the year',
          headline: {
            label:
              'Number of awards and recognition received for extension activities from Government / Government-recognised bodies during the year',
            derive: { expr: 'count' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '3.6.2',
              columns: [
                {
                  key: 'recipient_name',
                  label: 'Name of the Institution / Teacher / Student',
                  type: 'text',
                  required: true,
                },
                { key: 'award_name', label: 'Name of the Award/ Recognition', type: 'text', required: true },
                {
                  key: 'awarding_body',
                  label:
                    'Name of the Awarding Body/Agency (Government/Government-recognised agencies/bodies)',
                  type: 'text',
                },
                { key: 'month_year_of_award', label: 'Month and Year of award', type: 'date' },
              ],
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            {
              key: 'awards_count_document',
              label: 'Number of awards for extension activities in during the year',
            },
            { key: 'award_letters', label: 'e-copy of the award letters' },
            { key: 'additional_info', label: 'Any additional information' },
          ],
          notes:
            'File Description bullet "Number of awards for extension activities in during the year" is reproduced verbatim, including NAAC\'s own wording.',
          newFrameworkMapping:
            'New C9 Research and Innovation Outcomes (Outcome); extension partly New C6 Extended Curricular Engagements (Process)',
        },
        {
          id: '3.6.3',
          kind: 'qnm',
          title:
            'Number of extension and outreach programmes conducted by the institution through NSS/NCC during the year',
          headline: {
            label:
              'Number of extension and outreach programmes conducted through NSS/NCC during the year',
            derive: { expr: 'count' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '3.6.3 & 3.6.4',
              sharedWith: ['3.6.4'],
              columns: [
                { key: 'activity_name', label: 'Name of the Activity', type: 'text', required: true },
                {
                  key: 'organising_unit',
                  label: 'Organising Unit/ Agency/ Collaborating Agency',
                  type: 'text',
                },
                { key: 'scheme_name', label: 'Name of the Scheme', type: 'text' },
                { key: 'month_year_of_activity', label: 'Month and Year of the activity', type: 'date' },
                {
                  key: 'number_of_students_participated',
                  label: 'Number of students who participated in such activities',
                  type: 'number',
                },
              ],
            },
          ],
          evidence: [
            { key: 'event_reports', label: 'Reports of the events organized' },
            { key: 'additional_info', label: 'Any additional information' },
          ],
          notes:
            'The criterion template\'s File Description omits an "Upload the data template" bullet even though workbook sheet "3.6.3 & 3.6.4" covers this metric; the shared table is modelled here as sheet owner.',
          newFrameworkMapping:
            'New C9 Research and Innovation Outcomes (Outcome); extension partly New C6 Extended Curricular Engagements (Process)',
        },
        {
          id: '3.6.4',
          kind: 'qnm',
          title: 'Number of students participating in extension activities listed in 3.6.3 during the year',
          headline: {
            label: 'Number of students participating in extension activities listed in 3.6.3 during the year',
            derive: {
              tableMetricId: '3.6.3',
              expr: 'sum',
              column: 'number_of_students_participated',
            },
          },
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            { key: 'event_reports', label: 'Reports of the events' },
            { key: 'additional_info', label: 'Any additional information' },
          ],
          newFrameworkMapping:
            'New C9 Research and Innovation Outcomes (Outcome); extension partly New C6 Extended Curricular Engagements (Process)',
        },
      ],
    },
    {
      code: '3.7',
      title: 'Collaboration',
      metrics: [
        {
          id: '3.7.1',
          kind: 'qnm',
          title:
            'Number of collaborative activities during the year for research/ faculty exchange/ student exchange/ internship/ on-the-job training/ project work',
          headline: {
            label:
              'Number of collaborative activities for research/ faculty exchange/ student exchange/ internship/ on-the-job training/ project work during the year',
            derive: { expr: 'count' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '3.7.1',
              columns: [
                { key: 'sl_no', label: 'Sl. No.', type: 'number' },
                {
                  key: 'activity_title',
                  label: 'Title of the collaborative activity',
                  type: 'text',
                  required: true,
                },
                {
                  key: 'collaborating_agency',
                  label: 'Name of the collaborating agency with contact details',
                  type: 'text',
                },
                { key: 'participant_name', label: 'Name of the participant', type: 'text' },
                { key: 'duration', label: 'Duration', type: 'text' },
                { key: 'nature_of_activity', label: 'Nature of the activity', type: 'text' },
                { key: 'link_to_document', label: 'Link to the relavant document', type: 'url' },
              ],
              note: 'Column heading "relavant" is NAAC\'s own typo, kept verbatim.',
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            { key: 'collaboration_documents', label: 'Copies of documents highlighting collaboration' },
            { key: 'additional_info', label: 'Any additional information' },
          ],
          newFrameworkMapping:
            'New C9 Research and Innovation Outcomes (Outcome); extension partly New C6 Extended Curricular Engagements (Process)',
        },
        {
          id: '3.7.2',
          kind: 'qnm',
          title:
            'Number of functional MoUs with institutions of national and/or international importance, other universities, industries, corporate houses, etc. during the year (only functional MoUs with ongoing activities to be considered)',
          headline: {
            label:
              'Number of functional MoUs with institutions of national and/or international importance, other universities, industries, corporate houses, etc. during the year',
            derive: { expr: 'count' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '3.7.2',
              columns: [
                { key: 'sl_no', label: 'Sl. No.', type: 'number' },
                {
                  key: 'institution_name',
                  label: 'Name of the institution/ industry/ corporate house',
                  type: 'text',
                  required: true,
                },
                { key: 'month_year_of_signing', label: 'Month and Year of signing MoU', type: 'date' },
                { key: 'duration', label: 'Duration', type: 'text' },
                { key: 'activities_list', label: 'List of activities under each MOU', type: 'longtext' },
                {
                  key: 'number_benefitted',
                  label: 'Number of students/teachers who benefitted from MoUs',
                  type: 'number',
                },
              ],
            },
          ],
          evidence: [
            { key: 'data_template', label: 'Upload the data template', required: true },
            {
              key: 'mou_copies',
              label: 'e-copies of the MoUs with institution/ industry/ corporate house',
            },
            {
              key: 'mou_details',
              label:
                'Details of functional MoUs with institutions of national, international importance, other institutions etc. during the year',
            },
            { key: 'additional_info', label: 'Any additional information' },
          ],
          newFrameworkMapping:
            'New C9 Research and Innovation Outcomes (Outcome); extension partly New C6 Extended Curricular Engagements (Process)',
        },
      ],
    },
  ],
};
