export type NEBGrade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'NG';

export interface SubjectMark {
  code: string;
  name: string;
  nameNepali?: string;
  creditHours: number;
  theoryFullMarks: number;
  theoryPassMarks: number;
  theoryObtained: number; // -1 for absent
  practicalFullMarks: number;
  practicalPassMarks: number;
  practicalObtained: number; // 0 if no practical, -1 for absent
  theoryGrade: NEBGrade;
  practicalGrade: NEBGrade;
  finalGrade: NEBGrade;
  gradePoint: number;
  isAbsent?: boolean;
}

export interface StudentResult {
  id: string;
  symbolNumber: string;
  registrationNumber: string;
  name: string;
  nameNepali?: string;
  dobBS: string; // e.g. 2062/05/14
  dobAD: string; // e.g. 2005-08-30
  classGrade: string; // 'Grade 11' | 'Grade 12'
  stream: string; // 'Science' | 'Management' | 'Humanities' | 'Education'
  section: string;
  academicYear: string; // '2081' | '2080'
  subjects: SubjectMark[];
  totalCreditHours: number;
  gpa: number;
  resultStatus: 'PASS' | 'FAIL' | 'NG' | 'ABSENT';
  remarks: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClassConfig {
  id: string;
  className: string; // e.g. 'Grade 12', 'Grade 11'
  classNameNepali?: string; // e.g. 'कक्षा १२'
  sections: string[]; // e.g. ['A', 'B', 'C', 'D']
  description?: string;
  updatedAt?: string;
}

export interface SchoolConfig {
  schoolName: string;
  schoolNameNepali: string;
  schoolPhotoUrl?: string;
  address: string;
  schoolCode: string;
  affiliationText: string;
  examTitle: string;
  examTitleNepali: string;
  academicYear: string;
  principalName: string;
  controllerName: string;
  contactNumber: string;
  website: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  studentName?: string;
  symbolNumber?: string;
  details: string;
  performedBy: string;
}

export interface VerificationRequest {
  symbolNumber: string;
  dob: string; // can match either BS or AD
  classGrade: string;
  academicYear: string;
  captchaToken?: string;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  student?: StudentResult;
  school?: SchoolConfig;
}
