import { NEBGrade, SubjectMark, StudentResult } from '../types';

export interface GradeInfo {
  grade: NEBGrade;
  gradePoint: number;
  description: string;
  descriptionNepali: string;
  minPercentage: number;
  maxPercentage: number;
}

export const NEB_GRADE_SCALE: GradeInfo[] = [
  { grade: 'A+', gradePoint: 4.0, description: 'Outstanding', descriptionNepali: 'विशिष्ट', minPercentage: 90, maxPercentage: 100 },
  { grade: 'A', gradePoint: 3.6, description: 'Excellent', descriptionNepali: 'उत्कृष्ट', minPercentage: 80, maxPercentage: 89.99 },
  { grade: 'B+', gradePoint: 3.2, description: 'Very Good', descriptionNepali: 'धेरै राम्रो', minPercentage: 70, maxPercentage: 79.99 },
  { grade: 'B', gradePoint: 2.8, description: 'Good', descriptionNepali: 'राम्रो', minPercentage: 60, maxPercentage: 69.99 },
  { grade: 'C+', gradePoint: 2.4, description: 'Satisfactory', descriptionNepali: 'सन्तोषजनक', minPercentage: 50, maxPercentage: 59.99 },
  { grade: 'C', gradePoint: 2.0, description: 'Acceptable', descriptionNepali: 'स्वीकार्य', minPercentage: 40, maxPercentage: 49.99 },
  { grade: 'D', gradePoint: 1.6, description: 'Basic', descriptionNepali: 'आधारभूत', minPercentage: 35, maxPercentage: 39.99 },
  { grade: 'NG', gradePoint: 0.0, description: 'Non-Graded', descriptionNepali: 'अवर्गीकृत', minPercentage: 0, maxPercentage: 34.99 },
];

/**
 * Calculates NEB letter grade and grade point from a percentage score.
 */
export function calculateGradeFromPercentage(percentage: number): { grade: NEBGrade; gradePoint: number } {
  const p = Math.max(0, Math.min(100, Math.round(percentage * 100) / 100));
  for (const info of NEB_GRADE_SCALE) {
    if (p >= info.minPercentage) {
      return { grade: info.grade, gradePoint: info.gradePoint };
    }
  }
  return { grade: 'NG', gradePoint: 0.0 };
}

/**
 * Compute grades for a single subject mark record according to NEB standards:
 * - Minimum 35% required in Theory to avoid NG.
 * - Minimum 40% required in Practical to avoid NG.
 * - Overall subject grade mapped from weighted combination.
 */
export function calculateSubjectGrades(
  subject: Omit<SubjectMark, 'theoryGrade' | 'practicalGrade' | 'finalGrade' | 'gradePoint'>
): SubjectMark {
  if (subject.isAbsent) {
    return {
      ...subject,
      theoryGrade: 'NG',
      practicalGrade: subject.practicalFullMarks > 0 ? 'NG' : 'D',
      finalGrade: 'NG',
      gradePoint: 0.0,
      isAbsent: true,
    };
  }

  // Calculate theory percentage
  const thPct = subject.theoryFullMarks > 0 ? (subject.theoryObtained / subject.theoryFullMarks) * 100 : 100;
  const thGrade = thPct >= 35 ? calculateGradeFromPercentage(thPct).grade : 'NG';

  // Calculate practical percentage
  let prGrade: NEBGrade = 'D';
  let prPct = 100;
  if (subject.practicalFullMarks > 0) {
    prPct = (subject.practicalObtained / subject.practicalFullMarks) * 100;
    prGrade = prPct >= 40 ? calculateGradeFromPercentage(prPct).grade : 'NG';
  }

  // Total percentage
  const totalFull = subject.theoryFullMarks + subject.practicalFullMarks;
  const totalObtained = subject.theoryObtained + (subject.practicalFullMarks > 0 ? subject.practicalObtained : 0);
  const totalPct = totalFull > 0 ? (totalObtained / totalFull) * 100 : 0;

  // NEB rule: If Theory is NG or Practical is NG, the final grade cannot pass and must be NG
  let finalGrade: NEBGrade = 'NG';
  let gradePoint = 0.0;

  if (thGrade === 'NG' || (subject.practicalFullMarks > 0 && prGrade === 'NG')) {
    finalGrade = 'NG';
    gradePoint = 0.0;
  } else {
    const totalResult = calculateGradeFromPercentage(totalPct);
    finalGrade = totalResult.grade;
    gradePoint = totalResult.gradePoint;
  }

  return {
    ...subject,
    theoryGrade: thGrade,
    practicalGrade: prGrade,
    finalGrade,
    gradePoint,
  };
}

/**
 * Recalculate GPA and result status for student
 */
export function calculateStudentOverall(subjects: SubjectMark[]): {
  totalCreditHours: number;
  gpa: number;
  resultStatus: 'PASS' | 'FAIL' | 'NG' | 'ABSENT';
  remarks: string;
} {
  if (!subjects || subjects.length === 0) {
    return { totalCreditHours: 0, gpa: 0, resultStatus: 'NG', remarks: 'No subjects recorded' };
  }

  let totalCreditHours = 0;
  let weightedPoints = 0;
  let hasNG = false;
  let ngCount = 0;
  let allAbsent = true;

  for (const s of subjects) {
    totalCreditHours += s.creditHours;
    weightedPoints += s.gradePoint * s.creditHours;
    if (!s.isAbsent) {
      allAbsent = false;
    }
    if (s.finalGrade === 'NG') {
      hasNG = true;
      ngCount++;
    }
  }

  if (allAbsent) {
    return {
      totalCreditHours,
      gpa: 0.0,
      resultStatus: 'ABSENT',
      remarks: 'Student was absent in all examinations',
    };
  }

  const gpa = totalCreditHours > 0 ? Math.round((weightedPoints / totalCreditHours) * 100) / 100 : 0.0;

  let resultStatus: 'PASS' | 'FAIL' | 'NG' | 'ABSENT' = 'PASS';
  let remarks = 'Passed Examination';

  if (hasNG) {
    resultStatus = 'NG';
    if (ngCount <= 2) {
      remarks = `Non-Graded (${ngCount} subject${ngCount > 1 ? 's' : ''} NG) - Eligible for Grade Increment`;
    } else {
      remarks = `Non-Graded (${ngCount} subjects NG) - Eligible for Next Annual Exam`;
    }
  } else {
    if (gpa >= 3.6) remarks = 'Passed with Distinction (Outstanding)';
    else if (gpa >= 3.2) remarks = 'Passed with First Division (Very Good)';
    else if (gpa >= 2.8) remarks = 'Passed with First Division';
    else if (gpa >= 2.4) remarks = 'Passed with Second Division';
    else remarks = 'Passed with Third Division';
  }

  return {
    totalCreditHours,
    gpa,
    resultStatus,
    remarks,
  };
}

/**
 * Standard templates for NEB Subjects
 */
export const STANDARD_NEB_SUBJECTS = {
  scienceGrade12: [
    { code: 'Eng.004', name: 'Compulsory English', nameNepali: 'अनिवार्य अंग्रेजी', creditHours: 4, theoryFullMarks: 75, theoryPassMarks: 26.25, practicalFullMarks: 25, practicalPassMarks: 10 },
    { code: 'Nep.002', name: 'Compulsory Nepali', nameNepali: 'अनिवार्य नेपाली', creditHours: 3, theoryFullMarks: 75, theoryPassMarks: 26.25, practicalFullMarks: 25, practicalPassMarks: 10 },
    { code: 'Phy.102', name: 'Physics', nameNepali: 'भौतिकशास्त्र', creditHours: 5, theoryFullMarks: 75, theoryPassMarks: 26.25, practicalFullMarks: 25, practicalPassMarks: 10 },
    { code: 'Che.202', name: 'Chemistry', nameNepali: 'रसायनशास्त्र', creditHours: 5, theoryFullMarks: 75, theoryPassMarks: 26.25, practicalFullMarks: 25, practicalPassMarks: 10 },
    { code: 'Mat.402', name: 'Mathematics', nameNepali: 'गणित', creditHours: 5, theoryFullMarks: 75, theoryPassMarks: 26.25, practicalFullMarks: 25, practicalPassMarks: 10 },
    { code: 'Bio.302', name: 'Biology', nameNepali: 'जीवविज्ञान', creditHours: 5, theoryFullMarks: 75, theoryPassMarks: 26.25, practicalFullMarks: 25, practicalPassMarks: 10 },
  ],
  managementGrade12: [
    { code: 'Eng.004', name: 'Compulsory English', nameNepali: 'अनिवार्य अंग्रेजी', creditHours: 4, theoryFullMarks: 75, theoryPassMarks: 26.25, practicalFullMarks: 25, practicalPassMarks: 10 },
    { code: 'Nep.002', name: 'Compulsory Nepali', nameNepali: 'अनिवार्य नेपाली', creditHours: 3, theoryFullMarks: 75, theoryPassMarks: 26.25, practicalFullMarks: 25, practicalPassMarks: 10 },
    { code: 'Acc.104', name: 'Accounting', nameNepali: 'लेखाविधि', creditHours: 5, theoryFullMarks: 75, theoryPassMarks: 26.25, practicalFullMarks: 25, practicalPassMarks: 10 },
    { code: 'Eco.204', name: 'Economics', nameNepali: 'अर्थशास्त्र', creditHours: 5, theoryFullMarks: 75, theoryPassMarks: 26.25, practicalFullMarks: 25, practicalPassMarks: 10 },
    { code: 'Bus.304', name: 'Business Studies', nameNepali: 'व्यावसायिक अध्ययन', creditHours: 5, theoryFullMarks: 75, theoryPassMarks: 26.25, practicalFullMarks: 25, practicalPassMarks: 10 },
    { code: 'Com.404', name: 'Computer Science', nameNepali: 'कम्प्युटर विज्ञान', creditHours: 5, theoryFullMarks: 50, theoryPassMarks: 17.5, practicalFullMarks: 50, practicalPassMarks: 20 },
  ],
};
