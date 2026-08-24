import type { Criterion } from './types';

export const criterion4: Criterion = {
  number: 4,
  title: 'Infrastructure and Learning Resources',
  keyIndicators: [
    {
      code: '4.1',
      title: 'Physical Facilities',
      metrics: [
        {
          id: '4.1.1',
          kind: 'qlm',
          title:
            'The Institution has adequate infrastructure and physical facilities for teaching-learning, viz., classrooms, laboratories, computing equipments, etc. Describe the adequacy of facilities for teaching-learning as per the minimum requirement specified by statutory bodies (within a maximum of 200 words).',
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
          newFrameworkMapping: 'New C3 Infrastructure (Input)',
        },
        {
          id: '4.1.2',
          kind: 'qlm',
          title:
            'The institution has adequate facilities for cultural activities, yoga, sports and games (indoor and outdoor) including gymnasium, yoga centre, auditorium etc.) Describe the adequacy of institutional facilities for cultural activities, yoga, and sports and games (indoor and outdoor) which include specification about area/size, year of establishment and user rate (within a maximum of 200 words).',
          writeups: [{ key: 'main', wordLimit: 200 }],
          urls: [
            {
              key: 'additional_information_link',
              label: 'Paste link for additional information',
            },
          ],
          evidence: [
            { key: 'geotagged_pictures', label: 'Geotagged pictures' },
            {
              key: 'additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping: 'New C3 Infrastructure (Input)',
          notes:
            'The unbalanced closing parenthesis after "auditorium etc.)" is reproduced from the NAAC template.',
        },
        {
          id: '4.1.3',
          kind: 'qnm',
          title:
            'Number of classrooms and seminar halls with ICT-enabled facilities',
          headline: {
            label:
              'Number of classrooms and seminar halls with ICT-enabled facilities',
            derive: { expr: 'count' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '4.1.3',
              columns: [
                {
                  key: 'room_number_or_name',
                  label:
                    'Room number or Name of classrooms/Seminar Halls with LCD / Wi-Fi /LAN facilities',
                  type: 'text',
                  required: true,
                },
                {
                  key: 'ict_facility_type',
                  label: 'Type of ICT facility provided',
                  type: 'text',
                },
                {
                  key: 'geotagged_photos_link',
                  label: 'Link to geo-tagged photos and master time-table',
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
              key: 'additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping: 'New C3 Infrastructure (Input)',
        },
        {
          id: '4.1.4',
          kind: 'qnm',
          title:
            'Expenditure for infrastructure augmentation, excluding salary, during the year (INR in Lakhs)',
          headline: {
            label:
              'Expenditure for infrastructure augmentation, excluding salary, during the year (INR in lakhs)',
            derive: {
              expr: 'sum',
              column: 'expenditure_infrastructure_augmentation',
            },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '4.1.4 & 4.4.1',
              sharedWith: ['4.4.1'],
              columns: [
                {
                  key: 'budget_infrastructure_augmentation',
                  label: 'Budget allocated for infrastructure augmentation',
                  type: 'number',
                },
                {
                  key: 'expenditure_infrastructure_augmentation',
                  label: 'Expenditure for infrastructure augmentation',
                  type: 'number',
                  required: true,
                },
                {
                  key: 'expenditure_maintenance_academic',
                  label:
                    'Expenditure on maintenance of academic facilities (excluding salary for human resources)',
                  type: 'number',
                },
                {
                  key: 'expenditure_maintenance_physical',
                  label:
                    'Expenditure on maintenance of physical facilities (excluding salary for human resources)',
                  type: 'number',
                },
                {
                  key: 'total_expenditure_excluding_salary',
                  label: 'Total expenditure excluding salary',
                  type: 'number',
                },
              ],
              note: 'Shared NAAC sheet: also carries the maintenance expenditure figures reported under 4.4.1.',
            },
          ],
          evidence: [
            {
              key: 'data_template',
              label: 'Upload the data template',
              required: true,
            },
            {
              key: 'audited_utilization_statements',
              label: 'Upload audited utilization statements',
            },
            {
              key: 'expenditure_details',
              label: 'Details of Expenditure, excluding salary, during the years',
            },
            {
              key: 'additional_information',
              label: 'Any additional information',
            },
          ],
          newFrameworkMapping: 'New C3 Infrastructure (Input)',
        },
      ],
    },
    {
      code: '4.2',
      title: 'Library as a Learning Resource',
      metrics: [
        {
          id: '4.2.1',
          kind: 'qlm',
          title:
            'Library is automated using Integrated Library Management System (ILMS). Provide a description of the library with: Name of the ILMS software; Nature of automation (full or partial); Version; Year of automation. Present a write-up within a maximum of 200 words.',
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
          newFrameworkMapping: 'New C3 Infrastructure (Input)',
        },
        {
          id: '4.2.2',
          kind: 'option',
          title:
            'Institution has access to the following: e-journals, e-ShodhSindhu, Shodhganga Membership, e-books, Databases, Remote access to e-resources',
          optionSelect: {
            label:
              'e-journals; e-ShodhSindhu; Shodhganga Membership; e-books; Databases; Remote access to e-resources',
            options: [
              'Any 4 or more of the above',
              'Any 3 of the above',
              'Any 2 of the above',
              'Any 1 of the above',
              'None of the above',
            ],
          },
          tables: [
            {
              key: 'main',
              mode: 'fixedRows',
              sheetRef: '4.2.2 & 4.2.3',
              sharedWith: ['4.2.3'],
              fixedRows: [
                'Books',
                'Journals',
                'e-journals',
                'e-books',
                'e-ShodhSindhu',
                'Shodhganga',
                'Databases',
                'Local and / or Remote access to library resources (Specify)',
              ],
              columns: [
                {
                  key: 'library_resources',
                  label: 'Library resources',
                  type: 'text',
                },
                {
                  key: 'membership_subscription_details',
                  label: 'Details of memberships/subscriptions',
                  type: 'longtext',
                },
                {
                  key: 'expenditure_ejournals_ebooks',
                  label:
                    'Expenditure on subscription to e-journals and e-books (INR in lakhs)',
                  type: 'number',
                },
                {
                  key: 'expenditure_other_eresources',
                  label:
                    'Expenditure on subscription to other e-resources (INR in lakhs)',
                  type: 'number',
                },
                {
                  key: 'total_library_expenditure',
                  label: 'Total Library Expenditure',
                  type: 'number',
                },
                {
                  key: 'relevant_document_link',
                  label: 'Link to the relevant document',
                  type: 'url',
                },
              ],
              note: 'Shared NAAC sheet: subscription details answer 4.2.2 and the expenditure columns answer 4.2.3.',
            },
          ],
          evidence: [
            {
              key: 'data_template',
              label: 'Upload the data template',
              required: true,
            },
            {
              key: 'subscription_details',
              label:
                'Details of subscriptions like e-journals, e-books, e-ShodhSindhu, Shodhganga membership',
            },
            {
              key: 'additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping: 'New C3 Infrastructure (Input)',
        },
        {
          id: '4.2.3',
          kind: 'qnm',
          title:
            'Expenditure on purchase of books/ e-books and subscription to journals/e-journals during the year (INR in lakhs)',
          headline: {
            label:
              'Expenditure on purchase of books/e-books and subscription to journals/e-journals during the year (INR in lakhs)',
          },
          evidence: [
            {
              key: 'data_template',
              label: 'Upload the data template',
              required: true,
            },
            {
              key: 'audited_statements',
              label: 'Audited statements of accounts',
            },
            {
              key: 'additional_information',
              label: 'Any additional information',
            },
          ],
          newFrameworkMapping: 'New C3 Infrastructure (Input)',
          notes:
            'Data is entered in the shared 4.2.2 & 4.2.3 sheet owned by metric 4.2.2. The headline is not auto-derived: the sheet splits expenditure into e-journals/e-books and other e-resources columns, which does not map one-to-one onto the books/journals figure asked for here.',
        },
        {
          id: '4.2.4',
          kind: 'qnm',
          title:
            'Usage of library by teachers and students (footfalls and login data for online access): Number of teachers and students using the library per day during the year',
          headline: {
            label:
              'Number of teachers and students using the library per day during the year',
          },
          evidence: [
            {
              key: 'library_usage_details',
              label: 'Upload details of library usage by teachers and students',
            },
            {
              key: 'additional_information',
              label: 'Any additional information',
            },
          ],
          dataTemplateApplicable: false,
          newFrameworkMapping: 'New C3 Infrastructure (Input)',
          notes:
            'HEI is requested to calculate the teachers’ and students’ usage of library per day. Average = Total number of teachers and students on every working day for all working days / Total number of working days. Data requirement also asks for the last page of the accession register, the method of computing per-day usage, the number of physical users and the number of users through e-access.',
        },
      ],
    },
    {
      code: '4.3',
      title: 'IT Infrastructure',
      metrics: [
        {
          id: '4.3.1',
          kind: 'qlm',
          title:
            'Institution has an IT policy covering Wi-Fi, cyber security, etc. and has allocated budget for updating its IT facilities. Describe IT facilities including Wi-Fi with date and nature of updation within a maximum of 200 words.',
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
          newFrameworkMapping: 'New C3 Infrastructure (Input)',
        },
        {
          id: '4.3.2',
          kind: 'qnm',
          title: 'Student - Computer ratio (Number of Students: Number of Computers)',
          headline: { label: 'Student - Computer ratio (number of students per computer)' },
          evidence: [
            {
              key: 'additional_information',
              label: 'Upload any additional information',
            },
          ],
          dataTemplateApplicable: false,
          newFrameworkMapping: 'New C3 Infrastructure (Input)',
        },
        {
          id: '4.3.3',
          kind: 'option',
          title:
            'Bandwidth of internet connection in the Institution and the number of students on campus',
          optionSelect: {
            options: [
              '≥50 Mbps',
              '35 Mbps - 50 Mbps',
              '20 Mbps - 35 Mbps',
              '5 Mbps - 20 Mbps',
              '<5 Mbps',
            ],
          },
          evidence: [
            {
              key: 'bandwidth_details',
              label: 'Details of bandwidth available in the Institution',
            },
            {
              key: 'additional_information',
              label: 'Upload any additional information',
            },
          ],
          dataTemplateApplicable: false,
          newFrameworkMapping: 'New C3 Infrastructure (Input)',
        },
        {
          id: '4.3.4',
          kind: 'option',
          title:
            'Institution has facilities for e-content development. Facilities available for e-content development: Media Centre, Audio-Visual Centre, Lecture Capturing System (LCS), Mixing equipments and software for editing',
          optionSelect: {
            label:
              'Media Centre; Audio-Visual Centre; Lecture Capturing System (LCS); Mixing equipments and software for editing',
            options: [
              'All four of the above',
              'Any three of the above',
              'Any two of the above',
              'Any one of the above',
              'None of the above',
            ],
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '4.3.4',
              columns: [
                {
                  key: 'teacher_name',
                  label: 'Name of the teacher',
                  type: 'text',
                },
                {
                  key: 'module_name',
                  label: 'Name of the module developed',
                  type: 'text',
                },
                {
                  key: 'platform',
                  label: 'Platform on which module has been developed',
                  type: 'text',
                },
                {
                  key: 'launch_date',
                  label: 'Date of launching the e-content',
                  type: 'date',
                },
                {
                  key: 'relevant_document_link',
                  label:
                    'Link to the relevant document and facility available in the institution',
                  type: 'url',
                },
                {
                  key: 'facilities_list',
                  label: 'List of the e-content development facilities available',
                  type: 'longtext',
                },
                {
                  key: 'media_centre_video_link',
                  label:
                    'Provide link to videos of the Media Centre and recording facilities',
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
              key: 'additional_information',
              label: 'Upload any additional information',
            },
          ],
          urls: [
            {
              key: 'additional_information_link',
              label: 'Paste link for additional information',
            },
          ],
          newFrameworkMapping: 'New C3 Infrastructure (Input)',
        },
      ],
    },
    {
      code: '4.4',
      title: 'Maintenance of Campus Infrastructure',
      metrics: [
        {
          id: '4.4.1',
          kind: 'qnm',
          title:
            'Expenditure incurred on maintenance of physical and academic support facilities, excluding salary component, during the year (INR in lakhs)',
          headline: {
            label:
              'Expenditure incurred on maintenance of physical and academic support facilities, excluding salary component (INR in lakhs)',
          },
          evidence: [
            {
              key: 'data_template',
              label: 'Upload the data template',
              required: true,
            },
            {
              key: 'audited_statements',
              label: 'Audited statements of accounts',
            },
            {
              key: 'additional_information',
              label: 'Upload any additional information',
            },
          ],
          newFrameworkMapping: 'New C3 Infrastructure (Input)',
          notes:
            'Data is entered in the shared 4.1.4 & 4.4.1 sheet owned by metric 4.1.4. The headline is not auto-derived because it spans two sheet columns (maintenance of academic facilities plus maintenance of physical facilities).',
        },
        {
          id: '4.4.2',
          kind: 'qlm',
          title:
            'There are established systems and procedures for maintaining and utilizing physical, academic and support facilities – classrooms, laboratory, library, sports complex, computers, etc. Describe the institution’s policy with details of systems and procedures for maintaining and utilizing physical, academic and support facilities (within a maximum of 200 words).',
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
          newFrameworkMapping: 'New C3 Infrastructure (Input)',
        },
      ],
    },
  ],
};
