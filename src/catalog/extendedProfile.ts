/**
 * Extended Profile of the Institution (AQAR, Autonomous Colleges).
 *
 * Data tables transcribed from the AQAR Data-Template workbook sheets
 * 1.1, 2.1, 2.2, 2.3, 3.1 and 3.2. Per the master note, data templates
 * are NOT applicable to Extended Profile questions 3.3, 4.1, 4.2, 4.3
 * and 4.4 — those are plain-number questions.
 */
import type { Criterion } from './types';

export const extendedProfile: Criterion = {
  number: 0,
  title: 'Extended Profile of the Institution',
  keyIndicators: [
    {
      code: 'EP-1',
      title: '1 Programme',
      metrics: [
        {
          id: 'EP-1.1',
          kind: 'qnm',
          title: 'Number of programmes offered during the year',
          headline: {
            label: 'Number of programmes offered during the year',
            derive: { expr: 'count' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '1.1',
              columns: [
                { key: 'programme_code', label: 'Programme Code', type: 'text' },
                { key: 'programme_name', label: 'Programme Name', type: 'text' },
              ],
            },
          ],
        },
      ],
    },
    {
      code: 'EP-2',
      title: '2 Student',
      metrics: [
        {
          id: 'EP-2.1',
          kind: 'qnm',
          title: 'Total number of students during the year',
          headline: {
            label: 'Total number of students during the year',
            derive: { expr: 'count' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '2.1',
              columns: [
                { key: 'name', label: 'Name', type: 'text' },
                { key: 'year_of_enrollment', label: 'Year of enrollment', type: 'text' },
                {
                  key: 'enrollment_number',
                  label: "Student's enrollment number",
                  type: 'text',
                },
                { key: 'date_of_enrollment', label: 'Date of enrollment', type: 'date' },
              ],
            },
          ],
        },
        {
          id: 'EP-2.2',
          kind: 'qnm',
          title: 'Number of outgoing / final year students during the year',
          headline: {
            label: 'Number of outgoing / final year students during the year',
            derive: { expr: 'count' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '2.2',
              columns: [
                {
                  key: 'month_year_of_passing',
                  label:
                    'Month and Year of passing final year/semester examinations',
                  type: 'text',
                },
                { key: 'name', label: 'Name of students', type: 'text' },
                {
                  key: 'enrollment_number',
                  label: "Students' enrollment number",
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          id: 'EP-2.3',
          kind: 'qnm',
          title:
            'Number of students who appeared in the examinations conducted by the Institution during the year',
          headline: {
            label:
              'Number of students who appeared in the examinations conducted by the Institution during the year',
            derive: { expr: 'count' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '2.3',
              columns: [
                { key: 'month_year', label: 'Month and Year', type: 'text' },
                { key: 'name', label: 'Name of students', type: 'text' },
                { key: 'roll_number', label: 'Roll Number', type: 'text' },
                {
                  key: 'date_of_appearing',
                  label: 'Date of appearing for examinations',
                  type: 'date',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      code: 'EP-3',
      title: '3 Academic',
      metrics: [
        {
          id: 'EP-3.1',
          kind: 'qnm',
          title: 'List of courses offered across all programmes during the year',
          headline: {
            label: 'Number of courses offered across all programmes during the year',
            derive: { expr: 'count' },
          },
          tables: [
            {
              key: 'main',
              mode: 'dynamic',
              sheetRef: '3.1',
              columns: [
                { key: 'programme_code', label: 'Programme Code', type: 'text' },
                { key: 'programme_name', label: 'Programme Name', type: 'text' },
                { key: 'course_code', label: 'Course Code', type: 'text' },
                { key: 'course_name', label: 'Course Name', type: 'text' },
              ],
            },
          ],
        },
        {
          id: 'EP-3.2',
          kind: 'qnm',
          title: 'Number of full-time teachers during the year',
          headline: {
            label: 'Number of full-time teachers presently working in the institution',
            derive: { tableKey: 'working', expr: 'count' },
          },
          tables: [
            {
              key: 'working',
              title:
                '3.2 a Number of full-time teachers presently working in the institution',
              mode: 'dynamic',
              sheetRef: '3.2',
              columns: [
                { key: 'name', label: 'Name', type: 'text' },
                {
                  key: 'id_number',
                  label: 'ID number/Aaadhaar number (Not mandatory)',
                  type: 'text',
                },
                { key: 'email', label: 'Email', type: 'text' },
                { key: 'gender', label: 'Gender', type: 'text' },
                { key: 'designation', label: 'Designation', type: 'text' },
                {
                  key: 'date_of_joining',
                  label: 'Date of joining the institution',
                  type: 'date',
                },
              ],
            },
            {
              key: 'movement',
              title:
                '3.2 b Number of full-time teachers who left/joined the institution during the year',
              mode: 'dynamic',
              sheetRef: '3.2',
              columns: [
                { key: 'name', label: 'Name', type: 'text' },
                {
                  key: 'id_number',
                  label: 'ID number/Aaadhaar number (Not mandatory)',
                  type: 'text',
                },
                { key: 'email', label: 'Email', type: 'text' },
                { key: 'gender', label: 'Gender', type: 'text' },
                { key: 'designation', label: 'Designation', type: 'text' },
                {
                  key: 'date_of_joining',
                  label: 'Date of joining the institution',
                  type: 'date',
                },
                {
                  key: 'date_of_leaving',
                  label: 'Date of leaving the institution',
                  type: 'date',
                },
              ],
            },
          ],
        },
        {
          id: 'EP-3.3',
          kind: 'qnm',
          title: 'Number of sanctioned posts during the year',
          headline: {
            label: 'Number of sanctioned posts during the year',
          },
          dataTemplateApplicable: false,
          notes:
            'Caption not present in the master data template (data template not applicable to 3.3); label taken from the standard NAAC AQAR Extended Profile format — verify against the official AQAR guideline.',
        },
      ],
    },
    {
      code: 'EP-4',
      title: '4 Institution',
      metrics: [
        {
          id: 'EP-4.1',
          kind: 'qnm',
          title: 'Total number of Classrooms and Seminar halls',
          headline: {
            label: 'Total number of Classrooms and Seminar halls',
          },
          dataTemplateApplicable: false,
          notes:
            'Caption not present in the master data template (data template not applicable to 4.1); label taken from the standard NAAC AQAR Extended Profile format — verify against the official AQAR guideline.',
        },
        {
          id: 'EP-4.2',
          kind: 'qnm',
          title:
            'Total expenditure excluding salary during the year (INR in lakhs)',
          headline: {
            label:
              'Total expenditure excluding salary during the year (INR in lakhs)',
          },
          dataTemplateApplicable: false,
          notes:
            'Caption not present in the master data template (data template not applicable to 4.2); label taken from the standard NAAC AQAR Extended Profile format — verify against the official AQAR guideline.',
        },
        {
          id: 'EP-4.3',
          kind: 'qnm',
          title: 'Number of computers',
          headline: {
            label: 'Number of computers',
          },
          dataTemplateApplicable: false,
          notes:
            'Caption not present in the master data template (data template not applicable to 4.3); label taken from the standard NAAC AQAR Extended Profile format — verify against the official AQAR guideline.',
        },
        {
          id: 'EP-4.4',
          kind: 'qnm',
          title: 'Total campus area (in acres)',
          headline: {
            label: 'Total campus area (in acres)',
          },
          dataTemplateApplicable: false,
          notes:
            'Caption not present in the master data template (data template not applicable to 4.4); label inferred from the standard NAAC Extended Profile format — verify against the official AQAR guideline.',
        },
      ],
    },
  ],
};
