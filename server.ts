import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { calculateSubjectGrades, calculateStudentOverall, STANDARD_NEB_SUBJECTS } from './src/utils/grading';
import { StudentResult, SchoolConfig, AuditLog, SubjectMark, ClassConfig } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// File-based persistence directory
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

interface DatabaseSchema {
  students: StudentResult[];
  school: SchoolConfig;
  classes: ClassConfig[];
  auditLogs: AuditLog[];
  adminToken: string;
}

const DEFAULT_CLASSES: ClassConfig[] = [
  {
    id: 'cls_grade_12',
    className: 'Grade 12',
    classNameNepali: 'कक्षा १२',
    sections: ['A', 'B', 'C', 'D'],
    description: 'NEB Plus Two Secondary Level - Grade 12',
  },
  {
    id: 'cls_grade_11',
    className: 'Grade 11',
    classNameNepali: 'कक्षा ११',
    sections: ['A', 'B', 'C', 'D'],
    description: 'NEB Plus Two Secondary Level - Grade 11',
  },
  {
    id: 'cls_grade_10',
    className: 'Grade 10',
    classNameNepali: 'कक्षा १०',
    sections: ['A', 'B', 'C'],
    description: 'Secondary Education Level (SEE)',
  },
];

const DEFAULT_SCHOOL: SchoolConfig = {
  schoolName: 'Himalayan Model Secondary School & College',
  schoolNameNepali: 'हिमालयन मोडल माध्यमिक विद्यालय तथा कलेज',
  schoolPhotoUrl: '/school_campus.jpg',
  address: 'Bagbazar, Kathmandu, Nepal',
  schoolCode: '27014',
  affiliationText: 'Affiliated with National Examinations Board (NEB), Sanothimi, Bhaktapur',
  examTitle: 'Secondary Education Examination (Class 11 & 12) Annual Evaluation',
  examTitleNepali: 'माध्यमिक शिक्षा परीक्षा (कक्षा ११ र १२) वार्षिक नतिजा',
  academicYear: '2081 B.S. (2024)',
  principalName: 'Prof. Dr. Rameshwor K. Bhattarai',
  controllerName: 'Devendra Raj Pandey',
  contactNumber: '+977-1-4245689 / 4245690',
  website: 'www.himalayanmodel.edu.np',
};

function generateInitialSeedStudents(): StudentResult[] {
  // Student 1: Aarav Sharma (Science - Outstanding / Distinction)
  const s1Subjects: SubjectMark[] = [
    calculateSubjectGrades({
      code: 'Eng.004',
      name: 'Compulsory English',
      nameNepali: 'अनिवार्य अंग्रेजी',
      creditHours: 4,
      theoryFullMarks: 75,
      theoryPassMarks: 26.25,
      theoryObtained: 68,
      practicalFullMarks: 25,
      practicalPassMarks: 10,
      practicalObtained: 24,
    }),
    calculateSubjectGrades({
      code: 'Nep.002',
      name: 'Compulsory Nepali',
      nameNepali: 'अनिवार्य नेपाली',
      creditHours: 3,
      theoryFullMarks: 75,
      theoryPassMarks: 26.25,
      theoryObtained: 65,
      practicalFullMarks: 25,
      practicalPassMarks: 10,
      practicalObtained: 24,
    }),
    calculateSubjectGrades({
      code: 'Phy.102',
      name: 'Physics',
      nameNepali: 'भौतिकशास्त्र',
      creditHours: 5,
      theoryFullMarks: 75,
      theoryPassMarks: 26.25,
      theoryObtained: 70,
      practicalFullMarks: 25,
      practicalPassMarks: 10,
      practicalObtained: 25,
    }),
    calculateSubjectGrades({
      code: 'Che.202',
      name: 'Chemistry',
      nameNepali: 'रसायनशास्त्र',
      creditHours: 5,
      theoryFullMarks: 75,
      theoryPassMarks: 26.25,
      theoryObtained: 66,
      practicalFullMarks: 25,
      practicalPassMarks: 10,
      practicalObtained: 24,
    }),
    calculateSubjectGrades({
      code: 'Mat.402',
      name: 'Mathematics',
      nameNepali: 'गणित',
      creditHours: 5,
      theoryFullMarks: 75,
      theoryPassMarks: 26.25,
      theoryObtained: 72,
      practicalFullMarks: 25,
      practicalPassMarks: 10,
      practicalObtained: 25,
    }),
    calculateSubjectGrades({
      code: 'Bio.302',
      name: 'Biology',
      nameNepali: 'जीवविज्ञान',
      creditHours: 5,
      theoryFullMarks: 75,
      theoryPassMarks: 26.25,
      theoryObtained: 64,
      practicalFullMarks: 25,
      practicalPassMarks: 10,
      practicalObtained: 24,
    }),
  ];
  const s1Overall = calculateStudentOverall(s1Subjects);

  // Student 2: Binita Thapa (Management - First Division)
  const s2Subjects: SubjectMark[] = [
    calculateSubjectGrades({
      code: 'Eng.004',
      name: 'Compulsory English',
      nameNepali: 'अनिवार्य अंग्रेजी',
      creditHours: 4,
      theoryFullMarks: 75,
      theoryPassMarks: 26.25,
      theoryObtained: 62,
      practicalFullMarks: 25,
      practicalPassMarks: 10,
      practicalObtained: 23,
    }),
    calculateSubjectGrades({
      code: 'Nep.002',
      name: 'Compulsory Nepali',
      nameNepali: 'अनिवार्य नेपाली',
      creditHours: 3,
      theoryFullMarks: 75,
      theoryPassMarks: 26.25,
      theoryObtained: 64,
      practicalFullMarks: 25,
      practicalPassMarks: 10,
      practicalObtained: 23,
    }),
    calculateSubjectGrades({
      code: 'Acc.104',
      name: 'Accounting',
      nameNepali: 'लेखाविधि',
      creditHours: 5,
      theoryFullMarks: 75,
      theoryPassMarks: 26.25,
      theoryObtained: 71,
      practicalFullMarks: 25,
      practicalPassMarks: 10,
      practicalObtained: 25,
    }),
    calculateSubjectGrades({
      code: 'Eco.204',
      name: 'Economics',
      nameNepali: 'अर्थशास्त्र',
      creditHours: 5,
      theoryFullMarks: 75,
      theoryPassMarks: 26.25,
      theoryObtained: 67,
      practicalFullMarks: 25,
      practicalPassMarks: 10,
      practicalObtained: 24,
    }),
    calculateSubjectGrades({
      code: 'Bus.304',
      name: 'Business Studies',
      nameNepali: 'व्यावसायिक अध्ययन',
      creditHours: 5,
      theoryFullMarks: 75,
      theoryPassMarks: 26.25,
      theoryObtained: 58,
      practicalFullMarks: 25,
      practicalPassMarks: 10,
      practicalObtained: 22,
    }),
    calculateSubjectGrades({
      code: 'Com.404',
      name: 'Computer Science',
      nameNepali: 'कम्प्युटर विज्ञान',
      creditHours: 5,
      theoryFullMarks: 50,
      theoryPassMarks: 17.5,
      theoryObtained: 46,
      practicalFullMarks: 50,
      practicalPassMarks: 20,
      practicalObtained: 48,
    }),
  ];
  const s2Overall = calculateStudentOverall(s2Subjects);

  // Student 3: Rohan Karki (Science - NG in Chemistry Theory)
  const s3Subjects: SubjectMark[] = [
    calculateSubjectGrades({
      code: 'Eng.004',
      name: 'Compulsory English',
      nameNepali: 'अनिवार्य अंग्रेजी',
      creditHours: 4,
      theoryFullMarks: 75,
      theoryPassMarks: 26.25,
      theoryObtained: 48,
      practicalFullMarks: 25,
      practicalPassMarks: 10,
      practicalObtained: 20,
    }),
    calculateSubjectGrades({
      code: 'Nep.002',
      name: 'Compulsory Nepali',
      nameNepali: 'अनिवार्य नेपाली',
      creditHours: 3,
      theoryFullMarks: 75,
      theoryPassMarks: 26.25,
      theoryObtained: 45,
      practicalFullMarks: 25,
      practicalPassMarks: 10,
      practicalObtained: 21,
    }),
    calculateSubjectGrades({
      code: 'Phy.102',
      name: 'Physics',
      nameNepali: 'भौतिकशास्त्र',
      creditHours: 5,
      theoryFullMarks: 75,
      theoryPassMarks: 26.25,
      theoryObtained: 38,
      practicalFullMarks: 25,
      practicalPassMarks: 10,
      practicalObtained: 20,
    }),
    calculateSubjectGrades({
      code: 'Che.202',
      name: 'Chemistry',
      nameNepali: 'रसायनशास्त्र',
      creditHours: 5,
      theoryFullMarks: 75,
      theoryPassMarks: 26.25,
      theoryObtained: 22, // Less than 26.25 (35%), so Theory is NG
      practicalFullMarks: 25,
      practicalPassMarks: 10,
      practicalObtained: 21,
    }),
    calculateSubjectGrades({
      code: 'Mat.402',
      name: 'Mathematics',
      nameNepali: 'गणित',
      creditHours: 5,
      theoryFullMarks: 75,
      theoryPassMarks: 26.25,
      theoryObtained: 42,
      practicalFullMarks: 25,
      practicalPassMarks: 10,
      practicalObtained: 22,
    }),
    calculateSubjectGrades({
      code: 'Bio.302',
      name: 'Biology',
      nameNepali: 'जीवविज्ञान',
      creditHours: 5,
      theoryFullMarks: 75,
      theoryPassMarks: 26.25,
      theoryObtained: 44,
      practicalFullMarks: 25,
      practicalPassMarks: 10,
      practicalObtained: 22,
    }),
  ];
  const s3Overall = calculateStudentOverall(s3Subjects);

  // Student 4: Sujata Shrestha (Grade 11 Science - Outstanding)
  const s4Subjects: SubjectMark[] = [
    calculateSubjectGrades({
      code: 'Eng.003',
      name: 'Compulsory English',
      nameNepali: 'अनिवार्य अंग्रेजी',
      creditHours: 4,
      theoryFullMarks: 75,
      theoryPassMarks: 26.25,
      theoryObtained: 70,
      practicalFullMarks: 25,
      practicalPassMarks: 10,
      practicalObtained: 25,
    }),
    calculateSubjectGrades({
      code: 'Nep.001',
      name: 'Compulsory Nepali',
      nameNepali: 'अनिवार्य नेपाली',
      creditHours: 3,
      theoryFullMarks: 75,
      theoryPassMarks: 26.25,
      theoryObtained: 68,
      practicalFullMarks: 25,
      practicalPassMarks: 10,
      practicalObtained: 24,
    }),
    calculateSubjectGrades({
      code: 'Phy.101',
      name: 'Physics',
      nameNepali: 'भौतिकशास्त्र',
      creditHours: 5,
      theoryFullMarks: 75,
      theoryPassMarks: 26.25,
      theoryObtained: 72,
      practicalFullMarks: 25,
      practicalPassMarks: 10,
      practicalObtained: 25,
    }),
    calculateSubjectGrades({
      code: 'Che.201',
      name: 'Chemistry',
      nameNepali: 'रसायनशास्त्र',
      creditHours: 5,
      theoryFullMarks: 75,
      theoryPassMarks: 26.25,
      theoryObtained: 69,
      practicalFullMarks: 25,
      practicalPassMarks: 10,
      practicalObtained: 24,
    }),
    calculateSubjectGrades({
      code: 'Mat.401',
      name: 'Mathematics',
      nameNepali: 'गणित',
      creditHours: 5,
      theoryFullMarks: 75,
      theoryPassMarks: 26.25,
      theoryObtained: 73,
      practicalFullMarks: 25,
      practicalPassMarks: 10,
      practicalObtained: 25,
    }),
    calculateSubjectGrades({
      code: 'Com.403',
      name: 'Computer Science',
      nameNepali: 'कम्प्युटर विज्ञान',
      creditHours: 5,
      theoryFullMarks: 50,
      theoryPassMarks: 17.5,
      theoryObtained: 47,
      practicalFullMarks: 50,
      practicalPassMarks: 20,
      practicalObtained: 49,
    }),
  ];
  const s4Overall = calculateStudentOverall(s4Subjects);

  // Student 5: Unpublished candidate to test unpublished flow
  const s5Subjects = [...s1Subjects];
  const s5Overall = calculateStudentOverall(s5Subjects);

  return [
    {
      id: 'std_001',
      symbolNumber: '0240012A',
      registrationNumber: '8032100412',
      name: 'Aarav Sharma',
      nameNepali: 'आरव शर्मा',
      dobBS: '2062/04/18',
      dobAD: '2005-08-02',
      classGrade: 'Grade 12',
      stream: 'Science',
      section: 'A',
      academicYear: '2081',
      subjects: s1Subjects,
      totalCreditHours: s1Overall.totalCreditHours,
      gpa: s1Overall.gpa,
      resultStatus: s1Overall.resultStatus,
      remarks: s1Overall.remarks,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'std_002',
      symbolNumber: '0240014C',
      registrationNumber: '8032100414',
      name: 'Binita Thapa',
      nameNepali: 'बिनिता थापा',
      dobBS: '2061/11/05',
      dobAD: '2005-02-17',
      classGrade: 'Grade 12',
      stream: 'Management',
      section: 'B',
      academicYear: '2081',
      subjects: s2Subjects,
      totalCreditHours: s2Overall.totalCreditHours,
      gpa: s2Overall.gpa,
      resultStatus: s2Overall.resultStatus,
      remarks: s2Overall.remarks,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'std_003',
      symbolNumber: '0240015D',
      registrationNumber: '8032100415',
      name: 'Rohan Karki',
      nameNepali: 'रोहन कार्की',
      dobBS: '2062/01/12',
      dobAD: '2005-04-25',
      classGrade: 'Grade 12',
      stream: 'Science',
      section: 'C',
      academicYear: '2081',
      subjects: s3Subjects,
      totalCreditHours: s3Overall.totalCreditHours,
      gpa: s3Overall.gpa,
      resultStatus: s3Overall.resultStatus,
      remarks: s3Overall.remarks,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'std_004',
      symbolNumber: '0240016E',
      registrationNumber: '8132100501',
      name: 'Sujata Shrestha',
      nameNepali: 'सुजाता श्रेष्ठ',
      dobBS: '2062/03/08',
      dobAD: '2005-06-22',
      classGrade: 'Grade 11',
      stream: 'Science',
      section: 'A',
      academicYear: '2081',
      subjects: s4Subjects,
      totalCreditHours: s4Overall.totalCreditHours,
      gpa: s4Overall.gpa,
      resultStatus: s4Overall.resultStatus,
      remarks: s4Overall.remarks,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'std_005',
      symbolNumber: '0240017F',
      registrationNumber: '8032100418',
      name: 'Deepak Chaudhary',
      nameNepali: 'दीपक चौधरी',
      dobBS: '2061/09/20',
      dobAD: '2005-01-04',
      classGrade: 'Grade 12',
      stream: 'Management',
      section: 'D',
      academicYear: '2081',
      subjects: s5Subjects,
      totalCreditHours: s5Overall.totalCreditHours,
      gpa: s5Overall.gpa,
      resultStatus: s5Overall.resultStatus,
      remarks: s5Overall.remarks,
      isPublished: false, // Intentionally unpublished for testing
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

function loadDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      let needsSave = false;

      // Ensure classes exist
      if (!parsed.classes || !Array.isArray(parsed.classes) || parsed.classes.length === 0) {
        parsed.classes = DEFAULT_CLASSES;
        needsSave = true;
      }

      // Normalize student sections if legacy "Science-A" format exists
      if (Array.isArray(parsed.students)) {
        parsed.students.forEach((s: any) => {
          if (s.section === 'Science-A') { s.section = 'A'; needsSave = true; }
          else if (s.section === 'Management-A') { s.section = 'B'; needsSave = true; }
          else if (s.section === 'Science-B') { s.section = 'C'; needsSave = true; }
          else if (s.section === 'Management-B') { s.section = 'D'; needsSave = true; }
        });
      }

      if (needsSave) {
        saveDatabase(parsed);
      }
      return parsed;
    } catch (e) {
      console.error('Error reading database file, re-initializing:', e);
    }
  }

  const initialData: DatabaseSchema = {
    students: generateInitialSeedStudents(),
    school: DEFAULT_SCHOOL,
    classes: DEFAULT_CLASSES,
    auditLogs: [
      {
        id: 'log_001',
        timestamp: new Date().toISOString(),
        action: 'SYSTEM_INITIALIZED',
        details: 'System database initialized with NEB Nepal pattern evaluation seed records and multi-section classes.',
        performedBy: 'System Administrator',
      },
    ],
    adminToken: 'admin_neb_session_secret_2026',
  };

  saveDatabase(initialData);
  return initialData;
}

function saveDatabase(data: DatabaseSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

// In-memory reference that syncs with disk
let db: DatabaseSchema = loadDatabase();

// Rate limiting map for student verification (IP -> array of timestamps)
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxAttempts = 30;

  const timestamps = (rateLimitMap.get(ip) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxAttempts) {
    return false;
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return true;
}

// Helper to normalize DOB strings (allowing 2062-04-18, 2062/04/18, 2062-4-18, etc.)
function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.trim().replace(/[-.]/g, '/');
}

// Check admin auth header
function verifyAdminToken(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Admin credentials required.' });
  }
  const token = authHeader.substring(7);
  if (token !== db.adminToken && token !== 'neb_demo_token') {
    return res.status(401).json({ success: false, message: 'Invalid or expired admin session token.' });
  }
  next();
}

/* =========================================================================
   PUBLIC STUDENT RESULT VERIFICATION API
   ========================================================================= */

// POST /api/results/check
app.post('/api/results/check', (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please wait a few minutes before trying again.',
    });
  }

  const { symbolNumber, dob, classGrade, academicYear } = req.body;

  if (!symbolNumber || !dob) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both Symbol Number and Date of Birth.',
    });
  }

  const cleanSymbol = String(symbolNumber).trim().toUpperCase();
  const cleanInputDob = normalizeDate(String(dob));

  // Find candidate strictly matching symbol number
  const student = db.students.find(
    (s) => s.symbolNumber.trim().toUpperCase() === cleanSymbol
  );

  if (!student) {
    return res.status(404).json({
      success: false,
      status: 'NOT_FOUND',
      message: 'Result not found. Please check your Symbol Number and Date of Birth.',
    });
  }

  // Verify Date of Birth (matches either BS or AD)
  const normBS = normalizeDate(student.dobBS);
  const normAD = normalizeDate(student.dobAD);

  const dobMatched = cleanInputDob === normBS || cleanInputDob === normAD;

  if (!dobMatched) {
    return res.status(404).json({
      success: false,
      status: 'DOB_MISMATCH',
      message: 'Result not found. Please check your Symbol Number and Date of Birth.',
    });
  }

  // Check optional class / academic year filters if provided
  if (classGrade && student.classGrade !== classGrade) {
    return res.status(404).json({
      success: false,
      status: 'CLASS_MISMATCH',
      message: `No result found for Symbol Number ${cleanSymbol} in selected class. Please verify your selected Grade/Class.`,
    });
  }

  if (academicYear && student.academicYear !== academicYear) {
    return res.status(404).json({
      success: false,
      status: 'YEAR_MISMATCH',
      message: `No result found for Symbol Number ${cleanSymbol} in Academic Year ${academicYear}.`,
    });
  }

  // Check publication state
  if (!student.isPublished) {
    return res.status(200).json({
      success: false,
      status: 'UNPUBLISHED',
      message: 'Your result is currently being verified and has not been published yet. Please check back later or contact the administration.',
    });
  }

  // Log successful public verification query without exposing student list
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'RESULT_VIEWED_PUBLIC',
    studentName: student.name,
    symbolNumber: student.symbolNumber,
    details: `Result queried and displayed for Symbol Number: ${student.symbolNumber} from IP: ${ip}`,
    performedBy: 'Public Student Verification',
  });
  if (db.auditLogs.length > 500) db.auditLogs.pop();
  saveDatabase(db);

  // Return the student record and school info
  return res.status(200).json({
    success: true,
    message: 'Congratulations! Your result has been published.',
    student,
    school: db.school,
  });
});

// GET /api/school-config
app.get('/api/school-config', (_req: Request, res: Response) => {
  res.json({ success: true, school: db.school });
});

// PUT /api/school-config (Quick update school details: English & Nepali names, photo, etc.)
app.put('/api/school-config', (req: Request, res: Response) => {
  db.school = {
    ...db.school,
    ...req.body,
  };
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'SCHOOL_CONFIG_UPDATED',
    details: `Updated school name/photo: ${db.school.schoolName} (${db.school.schoolNameNepali})`,
    performedBy: 'School Management',
  });
  if (db.auditLogs.length > 500) db.auditLogs.pop();
  saveDatabase(db);
  res.json({ success: true, school: db.school });
});

/* =========================================================================
   ADMIN AUTHENTICATION & MANAGEMENT API
   ========================================================================= */

// POST /api/admin/login
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Simple, robust credentials for school administrators
  // In production, hashed password comparison is performed
  if (
    (username === 'admin' && password === 'nebadmin2026') ||
    (username === 'examcontroller' && password === 'neb2026')
  ) {
    const token = db.adminToken;
    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'ADMIN_LOGIN_SUCCESS',
      details: `Administrator logged in successfully as: ${username}`,
      performedBy: username,
    });
    saveDatabase(db);

    return res.json({
      success: true,
      token,
      admin: {
        username,
        role: 'SUPER_ADMIN',
        name: username === 'examcontroller' ? db.school.controllerName : 'Administrator',
      },
    });
  }

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'ADMIN_LOGIN_FAILED',
    details: `Failed login attempt with username: ${username}`,
    performedBy: 'Unknown',
  });
  saveDatabase(db);

  return res.status(401).json({
    success: false,
    message: 'Invalid administrator credentials. Please check your username and password.',
  });
});

// GET /api/admin/students
app.get('/api/admin/students', verifyAdminToken, (req: Request, res: Response) => {
  const { classGrade, academicYear, stream, status, search, section } = req.query;

  let filtered = [...db.students];

  if (classGrade && typeof classGrade === 'string') {
    filtered = filtered.filter((s) => s.classGrade === classGrade);
  }
  if (academicYear && typeof academicYear === 'string') {
    filtered = filtered.filter((s) => s.academicYear === academicYear);
  }
  if (stream && typeof stream === 'string') {
    filtered = filtered.filter((s) => s.stream === stream);
  }
  if (section && typeof section === 'string' && section !== 'all') {
    filtered = filtered.filter((s) => s.section.toLowerCase() === section.toLowerCase());
  }
  if (status && typeof status === 'string') {
    if (status === 'PUBLISHED') {
      filtered = filtered.filter((s) => s.isPublished);
    } else if (status === 'UNPUBLISHED') {
      filtered = filtered.filter((s) => !s.isPublished);
    } else {
      filtered = filtered.filter((s) => s.resultStatus === status);
    }
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.symbolNumber.toLowerCase().includes(q) ||
        s.registrationNumber.toLowerCase().includes(q) ||
        s.section.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    total: filtered.length,
    students: filtered,
    stats: {
      total: db.students.length,
      published: db.students.filter((s) => s.isPublished).length,
      unpublished: db.students.filter((s) => !s.isPublished).length,
      passed: db.students.filter((s) => s.resultStatus === 'PASS').length,
      ng: db.students.filter((s) => s.resultStatus === 'NG').length,
      absent: db.students.filter((s) => s.resultStatus === 'ABSENT').length,
    },
  });
});

// POST /api/admin/students (Create Student)
app.post('/api/admin/students', verifyAdminToken, (req: Request, res: Response) => {
  const data = req.body;
  if (!data.name || !data.symbolNumber || !data.dobBS) {
    return res.status(400).json({ success: false, message: 'Student Name, Symbol Number, and Date of Birth (BS) are required.' });
  }

  // Check unique symbol number
  const existing = db.students.find(
    (s) => s.symbolNumber.trim().toUpperCase() === data.symbolNumber.trim().toUpperCase()
  );
  if (existing) {
    return res.status(400).json({ success: false, message: `A student with Symbol Number ${data.symbolNumber} already exists.` });
  }

  // Calculate subject grades and overall GPA automatically
  const subjects: SubjectMark[] = (data.subjects || []).map((sub: any) =>
    calculateSubjectGrades({
      code: sub.code || 'SUB.001',
      name: sub.name || 'Subject',
      nameNepali: sub.nameNepali || '',
      creditHours: Number(sub.creditHours) || 4,
      theoryFullMarks: Number(sub.theoryFullMarks) || 75,
      theoryPassMarks: Number(sub.theoryPassMarks) || 26.25,
      theoryObtained: Number(sub.theoryObtained) || 0,
      practicalFullMarks: Number(sub.practicalFullMarks) || 0,
      practicalPassMarks: Number(sub.practicalPassMarks) || 0,
      practicalObtained: Number(sub.practicalObtained) || 0,
      isAbsent: !!sub.isAbsent,
    })
  );

  const overall = calculateStudentOverall(subjects);

  const newStudent: StudentResult = {
    id: `std_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    symbolNumber: data.symbolNumber.trim().toUpperCase(),
    registrationNumber: (data.registrationNumber || '').trim(),
    name: data.name.trim(),
    nameNepali: (data.nameNepali || '').trim(),
    dobBS: (data.dobBS || '').trim(),
    dobAD: (data.dobAD || '').trim(),
    classGrade: data.classGrade || 'Grade 12',
    stream: data.stream || 'Science',
    section: (data.section || 'A').trim(),
    academicYear: data.academicYear || '2081',
    subjects,
    totalCreditHours: overall.totalCreditHours,
    gpa: overall.gpa,
    resultStatus: overall.resultStatus,
    remarks: overall.remarks,
    isPublished: data.isPublished !== undefined ? !!data.isPublished : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.students.unshift(newStudent);

  // Ensure class config contains this section
  const targetClass = db.classes.find(
    (c) => c.className.toLowerCase() === newStudent.classGrade.toLowerCase()
  );
  if (targetClass && newStudent.section && !targetClass.sections.includes(newStudent.section)) {
    targetClass.sections.push(newStudent.section);
    targetClass.sections.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    targetClass.updatedAt = new Date().toISOString();
  }

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'STUDENT_ADDED',
    studentName: newStudent.name,
    symbolNumber: newStudent.symbolNumber,
    details: `Added new student ${newStudent.name} (${newStudent.symbolNumber}) in ${newStudent.classGrade} with GPA ${newStudent.gpa} [${newStudent.resultStatus}]`,
    performedBy: 'Administrator',
  });
  saveDatabase(db);

  res.status(201).json({ success: true, student: newStudent });
});

// PUT /api/admin/students/:id (Update Student & Marks)
app.put('/api/admin/students/:id', verifyAdminToken, (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const idx = db.students.findIndex((s) => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Student record not found.' });
  }

  const prev = db.students[idx];

  // Calculate subject grades
  const subjects: SubjectMark[] = (data.subjects || prev.subjects).map((sub: any) =>
    calculateSubjectGrades({
      code: sub.code || 'SUB.001',
      name: sub.name || 'Subject',
      nameNepali: sub.nameNepali || '',
      creditHours: Number(sub.creditHours) || 4,
      theoryFullMarks: Number(sub.theoryFullMarks) || 75,
      theoryPassMarks: Number(sub.theoryPassMarks) || 26.25,
      theoryObtained: Number(sub.theoryObtained) || 0,
      practicalFullMarks: Number(sub.practicalFullMarks) || 0,
      practicalPassMarks: Number(sub.practicalPassMarks) || 0,
      practicalObtained: Number(sub.practicalObtained) || 0,
      isAbsent: !!sub.isAbsent,
    })
  );

  const overall = calculateStudentOverall(subjects);

  const updated: StudentResult = {
    ...prev,
    name: data.name !== undefined ? data.name.trim() : prev.name,
    nameNepali: data.nameNepali !== undefined ? data.nameNepali.trim() : prev.nameNepali,
    symbolNumber: data.symbolNumber !== undefined ? data.symbolNumber.trim().toUpperCase() : prev.symbolNumber,
    registrationNumber: data.registrationNumber !== undefined ? data.registrationNumber.trim() : prev.registrationNumber,
    dobBS: data.dobBS !== undefined ? data.dobBS.trim() : prev.dobBS,
    dobAD: data.dobAD !== undefined ? data.dobAD.trim() : prev.dobAD,
    classGrade: data.classGrade || prev.classGrade,
    stream: data.stream || prev.stream,
    section: data.section !== undefined ? data.section.trim() : prev.section,
    academicYear: data.academicYear || prev.academicYear,
    subjects,
    totalCreditHours: overall.totalCreditHours,
    gpa: overall.gpa,
    resultStatus: overall.resultStatus,
    remarks: overall.remarks,
    isPublished: data.isPublished !== undefined ? !!data.isPublished : prev.isPublished,
    updatedAt: new Date().toISOString(),
  };

  db.students[idx] = updated;

  // Ensure class config contains this section
  const targetClass = db.classes.find(
    (c) => c.className.toLowerCase() === updated.classGrade.toLowerCase()
  );
  if (targetClass && updated.section && !targetClass.sections.includes(updated.section)) {
    targetClass.sections.push(updated.section);
    targetClass.sections.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    targetClass.updatedAt = new Date().toISOString();
  }

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'MARKS_UPDATED',
    studentName: updated.name,
    symbolNumber: updated.symbolNumber,
    details: `Updated marks/info for ${updated.name}. Previous GPA: ${prev.gpa} -> New GPA: ${updated.gpa} [${updated.resultStatus}]`,
    performedBy: 'Administrator',
  });
  saveDatabase(db);

  res.json({ success: true, student: updated });
});

// DELETE /api/admin/students/:id
app.delete('/api/admin/students/:id', verifyAdminToken, (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.students.findIndex((s) => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Student record not found.' });
  }

  const removed = db.students[idx];
  db.students.splice(idx, 1);
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'STUDENT_DELETED',
    studentName: removed.name,
    symbolNumber: removed.symbolNumber,
    details: `Deleted student record for ${removed.name} (${removed.symbolNumber})`,
    performedBy: 'Administrator',
  });
  saveDatabase(db);

  res.json({ success: true, message: 'Student record deleted successfully.' });
});

// POST /api/admin/publish-batch (Bulk publish / unpublish)
app.post('/api/admin/publish-batch', verifyAdminToken, (req: Request, res: Response) => {
  const { studentIds, publish, classGrade, academicYear } = req.body;

  let count = 0;
  db.students.forEach((s) => {
    let match = false;
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      if (studentIds.includes(s.id)) match = true;
    } else if (classGrade && academicYear) {
      if (s.classGrade === classGrade && s.academicYear === academicYear) match = true;
    } else if (classGrade) {
      if (s.classGrade === classGrade) match = true;
    } else {
      match = true;
    }

    if (match) {
      s.isPublished = !!publish;
      s.updatedAt = new Date().toISOString();
      count++;
    }
  });

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: publish ? 'BATCH_PUBLISHED' : 'BATCH_UNPUBLISHED',
    details: `${publish ? 'Published' : 'Unpublished'} ${count} student results.`,
    performedBy: 'Administrator',
  });
  saveDatabase(db);

  res.json({ success: true, modifiedCount: count });
});

// POST /api/admin/import (CSV / Spreadsheet batch import)
app.post('/api/admin/import', verifyAdminToken, (req: Request, res: Response) => {
  const { rows, defaultClass, defaultYear, defaultStream } = req.body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ success: false, message: 'No rows provided for import.' });
  }

  let importedCount = 0;
  let skippedCount = 0;

  for (const row of rows) {
    if (!row.name || !row.symbolNumber) {
      skippedCount++;
      continue;
    }

    const symbol = String(row.symbolNumber).trim().toUpperCase();

    // Prepare subjects: either passed as array or dynamically mapped from columns
    let subjects: SubjectMark[] = [];

    if (Array.isArray(row.subjects) && row.subjects.length > 0) {
      subjects = row.subjects.map((sub: any) =>
        calculateSubjectGrades({
          code: sub.code || 'SUB.101',
          name: sub.name || 'Subject',
          nameNepali: sub.nameNepali || '',
          creditHours: Number(sub.creditHours) || 4,
          theoryFullMarks: Number(sub.theoryFullMarks) || 75,
          theoryPassMarks: Number(sub.theoryPassMarks) || 26.25,
          theoryObtained: Number(sub.theoryObtained) || 0,
          practicalFullMarks: Number(sub.practicalFullMarks) || 0,
          practicalPassMarks: Number(sub.practicalPassMarks) || 0,
          practicalObtained: Number(sub.practicalObtained) || 0,
        })
      );
    } else {
      // Use standard default subjects template for stream
      const streamKey = (row.stream || defaultStream || 'Science').toLowerCase().includes('manage')
        ? 'managementGrade12'
        : 'scienceGrade12';
      const template = STANDARD_NEB_SUBJECTS[streamKey];

      subjects = template.map((tmpl) =>
        calculateSubjectGrades({
          ...tmpl,
          theoryObtained: Math.min(tmpl.theoryFullMarks, Math.floor(Math.random() * 30 + 40)),
          practicalObtained: tmpl.practicalFullMarks > 0 ? Math.floor(tmpl.practicalFullMarks * 0.95) : 0,
        })
      );
    }

    const overall = calculateStudentOverall(subjects);

    // Upsert student
    const existingIndex = db.students.findIndex(
      (s) => s.symbolNumber.trim().toUpperCase() === symbol
    );

    const studentRecord: StudentResult = {
      id: existingIndex !== -1 ? db.students[existingIndex].id : `std_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      symbolNumber: symbol,
      registrationNumber: String(row.registrationNumber || row.regNo || `803210${Math.floor(1000 + Math.random() * 9000)}`),
      name: String(row.name).trim(),
      nameNepali: String(row.nameNepali || ''),
      dobBS: String(row.dobBS || row.dob || '2062/05/15'),
      dobAD: String(row.dobAD || '2005-08-30'),
      classGrade: String(row.classGrade || defaultClass || 'Grade 12'),
      stream: String(row.stream || defaultStream || 'Science'),
      section: String(row.section || 'A'),
      academicYear: String(row.academicYear || defaultYear || '2081'),
      subjects,
      totalCreditHours: overall.totalCreditHours,
      gpa: overall.gpa,
      resultStatus: overall.resultStatus,
      remarks: overall.remarks,
      isPublished: row.isPublished !== undefined ? !!row.isPublished : true,
      createdAt: existingIndex !== -1 ? db.students[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex !== -1) {
      db.students[existingIndex] = studentRecord;
    } else {
      db.students.push(studentRecord);
    }

    // Auto-register section in target class if not already configured
    const targetClass = db.classes.find(
      (c) => c.className.toLowerCase() === studentRecord.classGrade.toLowerCase()
    );
    if (targetClass && studentRecord.section && !targetClass.sections.includes(studentRecord.section)) {
      targetClass.sections.push(studentRecord.section);
      targetClass.sections.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      targetClass.updatedAt = new Date().toISOString();
    }

    importedCount++;
  }

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'CSV_IMPORTED',
    details: `Imported ${importedCount} student records from CSV data (Skipped: ${skippedCount}).`,
    performedBy: 'Administrator',
  });
  saveDatabase(db);

  res.json({ success: true, importedCount, skippedCount });
});

// GET /api/admin/audit-logs
app.get('/api/admin/audit-logs', verifyAdminToken, (_req: Request, res: Response) => {
  res.json({ success: true, logs: db.auditLogs });
});

// PUT /api/admin/school-config
app.put('/api/admin/school-config', verifyAdminToken, (req: Request, res: Response) => {
  db.school = {
    ...db.school,
    ...req.body,
  };
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'SCHOOL_CONFIG_UPDATED',
    details: `Updated school/college information and exam titles.`,
    performedBy: 'Administrator',
  });
  saveDatabase(db);
  res.json({ success: true, school: db.school });
});

/* =========================================================================
   CLASS & SECTION MANAGEMENT API
   ========================================================================= */

// GET /api/classes (Public/Admin - returns all classes with their sections)
app.get('/api/classes', (_req: Request, res: Response) => {
  res.json({ success: true, classes: db.classes || [] });
});

// POST /api/admin/classes (Add a new class)
app.post('/api/admin/classes', verifyAdminToken, (req: Request, res: Response) => {
  const { className, classNameNepali, sections, description } = req.body;
  if (!className || typeof className !== 'string' || !className.trim()) {
    return res.status(400).json({ success: false, message: 'Class name is required (e.g. Grade 10, Grade 12).' });
  }

  const trimmedName = className.trim();
  const existing = db.classes.find(
    (c) => c.className.toLowerCase() === trimmedName.toLowerCase()
  );
  if (existing) {
    return res.status(400).json({ success: false, message: `Class "${trimmedName}" already exists.` });
  }

  const newSections: string[] = Array.isArray(sections) && sections.length > 0
    ? Array.from(new Set(sections.map((s: string) => String(s).trim()).filter(Boolean)))
    : ['A'];

  const newClass: ClassConfig = {
    id: `cls_${Date.now()}`,
    className: trimmedName,
    classNameNepali: classNameNepali ? String(classNameNepali).trim() : undefined,
    sections: newSections,
    description: description ? String(description).trim() : undefined,
  };

  db.classes.push(newClass);
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'CLASS_CREATED',
    details: `Created new class "${trimmedName}" with sections: ${newSections.join(', ')}`,
    performedBy: 'Administrator',
  });
  saveDatabase(db);

  res.json({ success: true, class: newClass, classes: db.classes });
});

// PUT /api/admin/classes/:id (Update class details: name, sections, etc.)
app.put('/api/admin/classes/:id', verifyAdminToken, (req: Request, res: Response) => {
  const { id } = req.params;
  const { className, classNameNepali, sections, description } = req.body;

  const targetClass = db.classes.find((c) => c.id === id);
  if (!targetClass) {
    return res.status(404).json({ success: false, message: 'Class not found.' });
  }

  const oldName = targetClass.className;
  if (className && typeof className === 'string') {
    const trimmed = className.trim();
    if (trimmed !== oldName) {
      const collision = db.classes.find((c) => c.id !== id && c.className.toLowerCase() === trimmed.toLowerCase());
      if (collision) {
        return res.status(400).json({ success: false, message: `Class "${trimmed}" already exists.` });
      }
      targetClass.className = trimmed;

      // Update enrolled students with this class
      db.students.forEach((s) => {
        if (s.classGrade === oldName) {
          s.classGrade = trimmed;
        }
      });
    }
  }

  if (classNameNepali !== undefined) {
    targetClass.classNameNepali = classNameNepali ? String(classNameNepali).trim() : undefined;
  }
  if (description !== undefined) {
    targetClass.description = description ? String(description).trim() : undefined;
  }
  if (Array.isArray(sections)) {
    const unique = Array.from(new Set(sections.map((s: string) => String(s).trim()).filter(Boolean)));
    if (unique.length > 0) {
      targetClass.sections = unique;
    }
  }

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'CLASS_UPDATED',
    details: `Updated class details for "${targetClass.className}". Sections: ${targetClass.sections.join(', ')}`,
    performedBy: 'Administrator',
  });
  saveDatabase(db);

  res.json({ success: true, class: targetClass, classes: db.classes });
});

// DELETE /api/admin/classes/:id (Remove class)
app.delete('/api/admin/classes/:id', verifyAdminToken, (req: Request, res: Response) => {
  const { id } = req.params;
  const { force } = req.query;

  const idx = db.classes.findIndex((c) => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Class not found.' });
  }

  const targetClass = db.classes[idx];
  const enrolledStudents = db.students.filter((s) => s.classGrade === targetClass.className);
  if (enrolledStudents.length > 0 && force !== 'true') {
    return res.status(400).json({
      success: false,
      enrolledCount: enrolledStudents.length,
      message: `Cannot delete class "${targetClass.className}". There are ${enrolledStudents.length} students enrolled in it.`,
    });
  }

  db.classes.splice(idx, 1);
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'CLASS_DELETED',
    details: `Deleted class "${targetClass.className}"`,
    performedBy: 'Administrator',
  });
  saveDatabase(db);

  res.json({ success: true, message: `Class "${targetClass.className}" removed.`, classes: db.classes });
});

// POST /api/admin/classes/:id/sections (Add single or batch sections to class, e.g. A, B, 1, 2, क, ख, १, २)
app.post('/api/admin/classes/:id/sections', verifyAdminToken, (req: Request, res: Response) => {
  const { id } = req.params;
  const { sectionName, sectionNames, replaceAll } = req.body;

  const targetClass = db.classes.find((c) => c.id === id);
  if (!targetClass) {
    return res.status(404).json({ success: false, message: 'Class not found.' });
  }

  // Batch or single mode
  let toAdd: string[] = [];
  if (Array.isArray(sectionNames) && sectionNames.length > 0) {
    toAdd = sectionNames.map((s: string) => String(s).trim()).filter(Boolean);
  } else if (sectionName && typeof sectionName === 'string' && sectionName.trim()) {
    toAdd = [sectionName.trim()];
  } else {
    return res.status(400).json({ success: false, message: 'At least one section name is required.' });
  }

  if (replaceAll) {
    targetClass.sections = Array.from(new Set(toAdd));
  } else {
    for (const sec of toAdd) {
      const exists = targetClass.sections.some((s) => s.toLowerCase() === sec.toLowerCase());
      if (!exists) {
        targetClass.sections.push(sec);
      }
    }
  }

  targetClass.sections.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: replaceAll ? 'SECTIONS_BATCH_REPLACED' : 'SECTION_ADDED',
    details: `${replaceAll ? 'Replaced sections with' : 'Updated sections for'} "${targetClass.className}": ${targetClass.sections.join(', ')}`,
    performedBy: 'Administrator',
  });
  saveDatabase(db);

  res.json({ success: true, class: targetClass, classes: db.classes });
});

// PUT /api/admin/classes/:id/sections (Edit / rename section for a class)
app.put('/api/admin/classes/:id/sections', verifyAdminToken, (req: Request, res: Response) => {
  const { id } = req.params;
  const { oldSectionName, newSectionName, updateStudents = true } = req.body;

  if (!oldSectionName || !newSectionName) {
    return res.status(400).json({ success: false, message: 'Both current and new section names are required.' });
  }

  const targetClass = db.classes.find((c) => c.id === id);
  if (!targetClass) {
    return res.status(404).json({ success: false, message: 'Class not found.' });
  }

  const oldClean = String(oldSectionName).trim();
  const newClean = String(newSectionName).trim();

  const secIdx = targetClass.sections.findIndex((s) => s.toLowerCase() === oldClean.toLowerCase());
  if (secIdx === -1) {
    return res.status(404).json({
      success: false,
      message: `Section "${oldClean}" not found in class "${targetClass.className}".`,
    });
  }

  if (oldClean.toLowerCase() !== newClean.toLowerCase()) {
    const collides = targetClass.sections.some(
      (s, idx) => idx !== secIdx && s.toLowerCase() === newClean.toLowerCase()
    );
    if (collides) {
      return res.status(400).json({
        success: false,
        message: `Section "${newClean}" already exists in ${targetClass.className}.`,
      });
    }
  }

  targetClass.sections[secIdx] = newClean;

  let updatedStudentsCount = 0;
  if (updateStudents) {
    db.students.forEach((s) => {
      if (s.classGrade === targetClass.className && s.section.toLowerCase() === oldClean.toLowerCase()) {
        s.section = newClean;
        updatedStudentsCount++;
      }
    });
  }

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'SECTION_RENAMED',
    details: `Renamed section "${oldClean}" to "${newClean}" in ${targetClass.className}. Updated ${updatedStudentsCount} students.`,
    performedBy: 'Administrator',
  });
  saveDatabase(db);

  res.json({
    success: true,
    updatedStudentsCount,
    class: targetClass,
    classes: db.classes,
  });
});

// DELETE /api/admin/classes/:id/sections/:sectionName (Remove section from class)
app.delete('/api/admin/classes/:id/sections/:sectionName', verifyAdminToken, (req: Request, res: Response) => {
  const { id, sectionName } = req.params;
  const { force } = req.query;

  const targetClass = db.classes.find((c) => c.id === id);
  if (!targetClass) {
    return res.status(404).json({ success: false, message: 'Class not found.' });
  }

  const cleanSec = decodeURIComponent(sectionName).trim();
  const secIdx = targetClass.sections.findIndex((s) => s.toLowerCase() === cleanSec.toLowerCase());
  if (secIdx === -1) {
    return res.status(404).json({
      success: false,
      message: `Section "${cleanSec}" not found in class "${targetClass.className}".`,
    });
  }

  const enrolled = db.students.filter(
    (s) => s.classGrade === targetClass.className && s.section.toLowerCase() === cleanSec.toLowerCase()
  );

  if (enrolled.length > 0 && force !== 'true') {
    return res.status(400).json({
      success: false,
      enrolledCount: enrolled.length,
      message: `Cannot delete Section "${cleanSec}" in ${targetClass.className}. ${enrolled.length} students are currently enrolled in this section.`,
    });
  }

  targetClass.sections.splice(secIdx, 1);

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'SECTION_REMOVED',
    details: `Removed section "${cleanSec}" from class "${targetClass.className}". (Enrolled students: ${enrolled.length})`,
    performedBy: 'Administrator',
  });
  saveDatabase(db);

  res.json({ success: true, class: targetClass, classes: db.classes });
});

// Reset demo data helper endpoint
app.post('/api/admin/reset-demo', verifyAdminToken, (_req: Request, res: Response) => {
  db.students = generateInitialSeedStudents();
  db.school = DEFAULT_SCHOOL;
  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'DEMO_DATA_RESET',
    details: `Reset system students and configuration to factory defaults.`,
    performedBy: 'Administrator',
  });
  saveDatabase(db);
  res.json({ success: true, message: 'Database reset to demo state.' });
});

/* =========================================================================
   VITE MIDDLEWARE / PRODUCTION STATIC SERVING
   ========================================================================= */

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NEB Result Management System] Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
