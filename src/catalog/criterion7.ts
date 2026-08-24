import type { Criterion } from './types';

export const criterion7: Criterion = {
  number: 7,
  title: 'Institutional Values and Best Practices',
  keyIndicators: [
    {
      code: '7.1',
      title: 'Institutional Values and Social Responsibilities',
      metrics: [
        {
          id: '7.1.1',
          kind: 'qlm',
          title:
            'Measures initiated by the institution for the promotion of gender equity during the year: Highlight the curricular and co- and extra-curricular activities promoting gender equity and sensitization and the facilities available for women on campus (within a maximum of 200 words).',
          writeups: [{ key: 'main', wordLimit: 200 }],
          urls: [
            {
              key: 'annual_gender_sensitization_action_plan',
              label: 'Annual gender sensitization action plan(s)',
            },
            {
              key: 'facilities_for_women',
              label:
                'Specific facilities provided for women in terms of: a. Safety and security b. Counselling c. Common rooms d. Daycare Centre e. Any other relevant information',
            },
            {
              key: 'additional_information_link',
              label: 'Paste link for additional Information',
            },
          ],
          evidence: [
            { key: 'additional_information', label: 'Upload any additional information' },
          ],
          newFrameworkMapping:
            'New C10 Sustainability Outcomes (Outcome); partly C6 Extended Curricular Engagements (Process)',
          notes:
            'Listed under the "Gender Equity" sub-heading of KI 7.1. The template\'s single "Provide the weblink to" block (action plan + facilities a-e) is modelled as two URL fields.',
        },
        {
          id: '7.1.2',
          kind: 'option',
          title:
            'The Institution has facilities for alternate sources of energy and energy conservation: 1. Solar energy 2. Biogas plant 3. Wheeling to the Grid 4. Sensor-based energy conservation 5. Use of LED bulbs/ power-efficient equipment',
          optionSelect: {
            options: [
              'Any 4 or All of the above',
              'Any 3 of the above',
              'Any 2 of the above',
              'Any 1 of the above',
              'None of the above',
            ],
          },
          evidence: [
            { key: 'geotagged_photographs', label: 'Geotagged Photographs' },
            { key: 'any_other_relevant_information', label: 'Any other relevant information' },
          ],
          dataTemplateApplicable: false,
          newFrameworkMapping:
            'New C10 Sustainability Outcomes (Outcome); partly C6 Extended Curricular Engagements (Process)',
          notes:
            'Listed under the "Environmental Consciousness and Sustainability" sub-heading of KI 7.1. Template marks this QnM but the answer is an option choice ("Options: ..."), so it is modelled as an option metric. Template typo "Any 1of the above" normalized to "Any 1 of the above".',
        },
        {
          id: '7.1.3',
          kind: 'qlm',
          title:
            'Describe the facilities in the institution for the management of the following types of degradable and non-degradable waste (within a maximum of 200 words): 1. Solid waste management 2. Liquid waste management 3. Biomedical waste management 4. E-waste management 5. Hazardous chemicals and radioactive waste management 6. Waste recycling system',
          writeups: [{ key: 'main', wordLimit: 200 }],
          urls: [
            {
              key: 'agreements_mous',
              label:
                'Relevant documents like agreements/MoUs with Government and other approved agencies',
            },
            {
              key: 'geotagged_photographs',
              label: 'Geotagged photographs of the facilities',
            },
            { key: 'any_other_relevant_information', label: 'Any other relevant information' },
          ],
          newFrameworkMapping:
            'New C10 Sustainability Outcomes (Outcome); partly C6 Extended Curricular Engagements (Process)',
        },
        {
          id: '7.1.4',
          kind: 'option',
          title:
            'Water conservation facilities available in the institution: 1. Rainwater harvesting 2. Borewell /Open well recharge 3. Construction of tanks and bunds 4. Waste water recycling 5. Maintenance of water bodies and distribution system in the campus',
          optionSelect: {
            options: [
              'Any 4 or All of the above',
              'Any 3 of the above',
              'Any 2 of the above',
              'Any 1 of the above',
              'None of the above',
            ],
          },
          evidence: [
            {
              key: 'geotagged_photographs_videos',
              label: 'Geotagged photographs / videos of the facilities',
            },
            { key: 'any_other_relevant_information', label: 'Any other relevant information' },
          ],
          dataTemplateApplicable: false,
          newFrameworkMapping:
            'New C10 Sustainability Outcomes (Outcome); partly C6 Extended Curricular Engagements (Process)',
          notes:
            'Template marks this QnM but the answer is an option choice; modelled as an option metric.',
        },
        {
          id: '7.1.5',
          kind: 'option',
          title:
            'Green campus initiatives include: The institutional initiatives for greening the campus are as follows: 1. Restricted entry of automobiles 2. Use of bicycles/ Battery-powered vehicles 3. Pedestrian-friendly pathways 4. Ban on use of plastic 5. Landscaping',
          optionSelect: {
            options: [
              'Any 4 or All of the above',
              'Any 3 of the above',
              'Any 2 of the above',
              'Any 1 of the above',
              'None of the above',
            ],
          },
          evidence: [
            {
              key: 'geotagged_photos_videos',
              label: 'Geotagged photos / videos of the facilities',
            },
            {
              key: 'policy_documents',
              label: 'Various policy documents / decisions circulated for implementation',
            },
            { key: 'any_other_relevant_documents', label: 'Any other relevant documents' },
          ],
          dataTemplateApplicable: false,
          newFrameworkMapping:
            'New C10 Sustainability Outcomes (Outcome); partly C6 Extended Curricular Engagements (Process)',
          notes:
            'Template marks this QnM but the answer is an option choice; modelled as an option metric. Options are printed with letter prefixes A.-E. in the template; the letters are presentation and are not part of the option text.',
        },
        {
          id: '7.1.6',
          kind: 'option',
          title:
            'Quality audits on environment and energy undertaken by the institution: 7.1.6.1. The institution\'s initiatives to preserve and improve the environment and harness energy are confirmed through the following: 1. Green audit 2. Energy audit 3. Environment audit 4. Clean and green campus recognitions/awards 5. Beyond the campus environmental promotional activities',
          optionSelect: {
            options: [
              'Any 4 or all of the above',
              'Any 3 of the above',
              'Any 2 of the above',
              'Any 1 of the above',
              'None of the above',
            ],
          },
          evidence: [
            {
              key: 'audit_reports',
              label:
                'Reports on environment and energy audits submitted by the auditing agency',
            },
            {
              key: 'auditing_agency_certification',
              label: 'Certification by the auditing agency',
            },
            { key: 'award_certificates', label: 'Certificates of the awards received' },
            { key: 'any_other_relevant_information', label: 'Any other relevant information' },
          ],
          dataTemplateApplicable: false,
          newFrameworkMapping:
            'New C10 Sustainability Outcomes (Outcome); partly C6 Extended Curricular Engagements (Process)',
          notes:
            'Template marks this QnM but the answer is an option choice; modelled as an option metric.',
        },
        {
          id: '7.1.7',
          kind: 'option',
          title:
            'The Institution has a Divyangjan-friendly and barrier-free environment: 1. Ramps/lifts for easy access to classrooms and centres 2. Divyangjan-friendly washrooms 3. Signage including tactile path lights, display boards and signposts 4. Assistive technology and facilities for persons with Divyangjan: accessible website, screen-reading software, mechanized equipment, etc. 5. Provision for enquiry and information: Human assistance, reader, scribe, soft copies of reading materials, screen reading, etc.',
          optionSelect: {
            options: [
              'Any 4 or all of the above',
              'Any 3 of the above',
              'Any 2 of the above',
              'Any 1 of the above',
              'None of the above',
            ],
          },
          evidence: [
            {
              key: 'geotagged_photographs_videos',
              label: 'Geotagged photographs / videos of facilities',
            },
            {
              key: 'policy_documents_brochures',
              label: 'Policy documents and brochures on the support to be provided',
            },
            {
              key: 'software_details',
              label: 'Details of the software procured for providing assistance',
            },
            { key: 'any_other_relevant_information', label: 'Any other relevant information' },
          ],
          dataTemplateApplicable: false,
          newFrameworkMapping:
            'New C10 Sustainability Outcomes (Outcome); partly C6 Extended Curricular Engagements (Process)',
          notes:
            'Template marks this QnM but the answer is an option choice; modelled as an option metric.',
        },
        {
          id: '7.1.8',
          kind: 'qlm',
          title:
            'Describe the Institutional efforts/initiatives in providing an inclusive environment i.e. tolerance and harmony towards cultural, regional, linguistic, communal, socio-economic and other diversities (within a maximum of 200 words).',
          writeups: [{ key: 'main', wordLimit: 200 }],
          urls: [
            {
              key: 'supporting_documents',
              label:
                'Supporting documents on the information provided (as reflected in the administrative and academic activities of the Institution)',
            },
          ],
          newFrameworkMapping:
            'New C10 Sustainability Outcomes (Outcome); partly C6 Extended Curricular Engagements (Process)',
          notes: 'Listed under the "Inclusion and Situatedness" sub-heading of KI 7.1.',
        },
        {
          id: '7.1.9',
          kind: 'qlm',
          title:
            'Sensitization of students and employees of the institution to constitutional obligations: values, rights, duties and responsibilities of citizens: Describe the various activities of the institution for inculcating values for becoming responsible citizens as reflected in the Constitution of India (within a maximum of 200 words).',
          writeups: [{ key: 'main', wordLimit: 200 }],
          urls: [
            {
              key: 'activities_inculcating_values',
              label:
                'Details of activities that inculcate values necessary to transform students into responsible citizens',
            },
            { key: 'any_other_relevant_information', label: 'Any other relevant information' },
          ],
          newFrameworkMapping:
            'New C10 Sustainability Outcomes (Outcome); partly C6 Extended Curricular Engagements (Process)',
          notes:
            'Listed under the "Human Values and Professional Ethics" sub-heading of KI 7.1.',
        },
        {
          id: '7.1.10',
          kind: 'option',
          title:
            'The institution has a prescribed code of conduct for students, teachers, administrators and other staff and conducts periodic sensitization programmes in this regard: 1. The Code of Conduct is displayed on the website 2. There is a committee to monitor adherence to the Code of Conduct 3. Institution organizes professional ethics programmes for students, teachers, administrators and other staff 4. Annual awareness programmes on the Code of Conduct are organized',
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
            { key: 'code_of_ethics_policy', label: 'Code of Ethics - policy document' },
            {
              key: 'monitoring_committee_details',
              label:
                'Details of the monitoring committee composition and minutes of the committee meeting, number of programmes organized, reports on the various programmes, etc. in support of the claims',
            },
            { key: 'any_other_relevant_information', label: 'Any other relevant information' },
          ],
          dataTemplateApplicable: false,
          newFrameworkMapping:
            'New C10 Sustainability Outcomes (Outcome); partly C6 Extended Curricular Engagements (Process)',
          notes:
            'Template marks this QnM but the answer is an option choice; modelled as an option metric.',
        },
        {
          id: '7.1.11',
          kind: 'qlm',
          title:
            'Institution celebrates / organizes national and international commemorative days, events and festivals: Describe the efforts of the institution to celebrate /organize national and international commemorative days, events and festivals during the year (within a maximum of 200 words).',
          writeups: [{ key: 'main', wordLimit: 200 }],
          urls: [
            {
              key: 'annual_report_celebrations',
              label:
                'Annual report of the celebrations and commemorative events for during the year',
            },
            {
              key: 'geotagged_photographs',
              label: 'Geotagged photographs of some of the events',
            },
            { key: 'any_other_relevant_information', label: 'Any other relevant information' },
          ],
          newFrameworkMapping:
            'New C10 Sustainability Outcomes (Outcome); partly C6 Extended Curricular Engagements (Process)',
          notes:
            'The phrase "for during the year" in the first weblink item is printed as such in the NAAC template.',
        },
      ],
    },
    {
      code: '7.2',
      title: 'Best Practices',
      metrics: [
        {
          id: '7.2.1',
          kind: 'qlm',
          title:
            'Provide the weblink on the Institutional website regarding the Best practices as per the prescribed format of NAAC',
          writeups: [
            { key: 'title_of_the_practice', label: 'Title of the Practice' },
            {
              key: 'objectives_of_the_practice',
              label: 'Objectives of the Practice',
              wordLimit: 20,
            },
            { key: 'the_context', label: 'The Context', wordLimit: 30 },
            { key: 'the_practice', label: 'The Practice', wordLimit: 50 },
            { key: 'evidence_of_success', label: 'Evidence of Success', wordLimit: 40 },
            {
              key: 'problems_encountered',
              label: 'Problems Encountered and Resources Required',
              wordLimit: 30,
            },
            { key: 'notes_optional', label: 'Notes (Optional)', wordLimit: 30 },
            {
              key: 'any_other_information',
              label:
                'Any other information regarding Institutional Values and Best Practices which the institution would like to include',
            },
          ],
          urls: [
            {
              key: 'best_practices_website',
              label: 'Best practices in the Institutional website',
            },
            { key: 'any_other_relevant_information', label: 'Any other relevant information' },
          ],
          newFrameworkMapping:
            'New C10 Sustainability Outcomes (Outcome); partly C6 Extended Curricular Engagements (Process)',
          notes:
            'The template appends the "Format for Presentation of Best Practices" (Institution should submit the Best Practices in this format only); its named sections and word limits are modelled as the write-up sections here, and the format applies to each best practice submitted. The trailing catch-all line of Criterion VII is included as the final write-up section.',
        },
      ],
    },
    {
      code: '7.3',
      title: 'Institutional Distinctiveness',
      metrics: [
        {
          id: '7.3.1',
          kind: 'qlm',
          title:
            'Highlight the performance of the institution in an area distinct to its priority and thrust (within a maximum of 200 words)',
          writeups: [{ key: 'main', wordLimit: 200 }],
          urls: [
            {
              key: 'institutional_distinctiveness_website',
              label: 'Institutional Distinctiveness on the Institutional website',
            },
            { key: 'website_link', label: 'Appropriate link in the institutional website' },
            { key: 'any_other_relevant_information', label: 'Any other relevant information' },
          ],
          newFrameworkMapping:
            'New C10 Sustainability Outcomes (Outcome); partly C6 Extended Curricular Engagements (Process)',
          notes:
            'The template prints two consecutive "Provide (the) web link to" blocks for this metric; the three link items across them are modelled as three URL fields.',
        },
      ],
    },
  ],
};
