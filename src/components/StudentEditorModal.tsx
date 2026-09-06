import React, { useState, useEffect } from 'react';
import { StudentResult, SubjectMark, ClassConfig } from '../types';
import { calculateSubjectGrades, calculateStudentOverall, STANDARD_NEB_SUBJECTS } from '../utils/grading';
import { formatSectionLabel, QUICK_CHARACTERS, normalizeSectionInput } from '../utils/sectionFormats';
import { X, Plus, Trash2, Calculator, Check, AlertTriangle, Sparkles, Layers } from 'lucide-react';

interface Props {
  student: StudentResult | null; // null if creating new
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentData: Partial<StudentResult>) => Promise<void>;
  classes?: ClassConfig[];
}

export const StudentEditorModal: React.FC<Props> = ({ student, isOpen, onClose, onSave, classes }) => {
  const [name, setName] = useState('');
  const [nameNepali, setNameNepali] = useState('');
  const [symbolNumber, setSymbolNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [dobBS, setDobBS] = useState('2062/05/15');
  const [dobAD, setDobAD] = useState('2005-08-30');
  const [classGrade, setClassGrade] = useState('Grade 12');
  const [stream, setStream] = useState('Science');
  const [section, setSection] = useState('A');
  const [isCustomSection, setIsCustomSection] = useState(false);
  const [academicYear, setAcademicYear] = useState('2081');
  const [isPublished, setIsPublished] = useState(true);

  const [subjects, setSubjects] = useState<SubjectMark[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Available sections for the currently selected class
  const currentClassConfig = classes?.find((c) => c.className === classGrade);
  const availableSections = currentClassConfig?.sections && currentClassConfig.sections.length > 0
    ? currentClassConfig.sections
    : ['A', 'B', 'C', 'D'];

  const handleClassChange = (newClass: string) => {
    setClassGrade(newClass);
    const target = classes?.find((c) => c.className === newClass);
    if (target && target.sections.length > 0) {
      if (!target.sections.includes(section)) {
        setSection(target.sections[0]);
      }
    }
  };

  // Initialize or reset form when student changes
  useEffect(() => {
    if (student) {
      setName(student.name);
      setNameNepali(student.nameNepali || '');
      setSymbolNumber(student.symbolNumber);
      setRegistrationNumber(student.registrationNumber);
      setDobBS(student.dobBS);
      setDobAD(student.dobAD);
      setClassGrade(student.classGrade);
      setStream(student.stream);
      setSection(student.section || 'A');
      setAcademicYear(student.academicYear);
      setIsPublished(student.isPublished);
      setSubjects(student.subjects || []);

      const target = classes?.find((c) => c.className === student.classGrade);
      if (target && !target.sections.includes(student.section)) {
        setIsCustomSection(true);
      } else {
        setIsCustomSection(false);
      }
    } else {
      // Default new student with Standard Science template
      setName('');
      setNameNepali('');
      setSymbolNumber(`024${Math.floor(1000 + Math.random() * 9000)}A`);
      setRegistrationNumber(`803210${Math.floor(1000 + Math.random() * 9000)}`);
      setDobBS('2062/05/15');
      setDobAD('2005-08-30');
      const initialClass = classes && classes.length > 0 ? classes[0].className : 'Grade 12';
      const initialSections = classes && classes.length > 0 ? classes[0].sections : ['A', 'B', 'C', 'D'];
      setClassGrade(initialClass);
      setStream('Science');
      setSection(initialSections[0] || 'A');
      setIsCustomSection(false);
      setAcademicYear('2081');
      setIsPublished(true);
      loadPreset('scienceGrade12');
    }
    setFormError(null);
  }, [student, isOpen, classes]);

  const loadPreset = (presetKey: 'scienceGrade12' | 'managementGrade12') => {
    const template = STANDARD_NEB_SUBJECTS[presetKey];
    const initialSubjects: SubjectMark[] = template.map((item) =>
      calculateSubjectGrades({
        ...item,
        theoryObtained: 55,
        practicalObtained: item.practicalFullMarks > 0 ? 22 : 0,
      })
    );
    setSubjects(initialSubjects);
    if (presetKey === 'scienceGrade12') {
      setStream('Science');
      setSection('A');
    } else {
      setStream('Management');
      setSection('B');
    }
  };

  // Live recalculate subject mark when user changes obtained marks
  const updateSubjectField = (index: number, field: keyof SubjectMark, value: any) => {
    const updated = [...subjects];
    const target = { ...updated[index], [field]: value };

    // Recalculate grades for this subject
    updated[index] = calculateSubjectGrades(target);
    setSubjects(updated);
  };

  const addSubjectRow = () => {
    const newSubject = calculateSubjectGrades({
      code: 'SUB.001',
      name: 'Elective Subject',
      nameNepali: '',
      creditHours: 4,
      theoryFullMarks: 75,
      theoryPassMarks: 26.25,
      theoryObtained: 50,
      practicalFullMarks: 25,
      practicalPassMarks: 10,
      practicalObtained: 20,
    });
    setSubjects([...subjects, newSubject]);
  };

  const removeSubjectRow = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  // Calculate live overall student summary
  const liveOverall = calculateStudentOverall(subjects);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !symbolNumber.trim() || !dobBS.trim()) {
      setFormError('Please fill in Student Name, Symbol Number, and Date of Birth.');
      return;
    }

    if (subjects.length === 0) {
      setFormError('Please add at least one subject.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        nameNepali: nameNepali.trim(),
        symbolNumber: symbolNumber.trim().toUpperCase(),
        registrationNumber: registrationNumber.trim(),
        dobBS: dobBS.trim(),
        dobAD: dobAD.trim(),
        classGrade,
        stream,
        section: section.trim(),
        academicYear,
        isPublished,
        subjects,
      });
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save student record.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {student ? `Edit Result: ${student.name} (${student.symbolNumber})` : 'New Student & Marks Entry'}
            </h2>
            <p className="text-xs text-slate-300">
              National Examinations Board (NEB) Pattern Evaluation & GPA Engine
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Quick Presets Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
            <span className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-700" />
              Quick Fill Curriculum Presets:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadPreset('scienceGrade12')}
                className="px-2.5 py-1 text-xs bg-white hover:bg-blue-100 text-blue-800 font-medium rounded border border-blue-300 transition-colors cursor-pointer"
              >
                Grade 12 Science (6 Subjects)
              </button>
              <button
                type="button"
                onClick={() => loadPreset('managementGrade12')}
                className="px-2.5 py-1 text-xs bg-white hover:bg-blue-100 text-blue-800 font-medium rounded border border-blue-300 transition-colors cursor-pointer"
              >
                Grade 12 Management (6 Subjects)
              </button>
            </div>
          </div>

          {/* Basic Student Information Grid */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              1. Candidate Demographics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Student Name (English) *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Student Name (Devanagari / नेपाली)
                </label>
                <input
                  type="text"
                  value={nameNepali}
                  onChange={(e) => setNameNepali(e.target.value)}
                  placeholder="जस्तै: आरव शर्मा"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Symbol Number *
                </label>
                <input
                  type="text"
                  value={symbolNumber}
                  onChange={(e) => setSymbolNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. 0240012A"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Registration Number
                </label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="e.g. 8032100412"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Date of Birth (B.S.) *
                </label>
                <input
                  type="text"
                  value={dobBS}
                  onChange={(e) => setDobBS(e.target.value)}
                  placeholder="YYYY/MM/DD (e.g. 2062/04/18)"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Date of Birth (A.D.)
                </label>
                <input
                  type="text"
                  value={dobAD}
                  onChange={(e) => setDobAD(e.target.value)}
                  placeholder="YYYY-MM-DD (e.g. 2005-08-02)"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Class / Grade *
                </label>
                <select
                  value={classGrade}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {classes && classes.length > 0 ? (
                    classes.map((c) => (
                      <option key={c.id} value={c.className}>
                        {c.className} {c.classNameNepali ? `(${c.classNameNepali})` : ''}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Grade 12">Grade 12</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 10">Grade 10</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Faculty / Stream *
                </label>
                <select
                  value={stream}
                  onChange={(e) => setStream(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Science">Science</option>
                  <option value="Management">Management</option>
                  <option value="Humanities">Humanities</option>
                  <option value="Education">Education</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-medium">
                    Section (Class {classGrade}) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomSection(!isCustomSection)}
                    className="text-[11px] text-blue-700 hover:text-blue-900 font-medium underline cursor-pointer"
                  >
                    {isCustomSection ? 'Select from list' : '+ Custom section'}
                  </button>
                </div>

                {!isCustomSection ? (
                  <div className="space-y-2">
                    {/* Quick Section Chips with Nepali & English format support */}
                    <div className="flex flex-wrap gap-1.5">
                      {availableSections.map((sec) => {
                        const { label, prefix, nepaliPrefix } = formatSectionLabel(sec);
                        const isSelected = section === sec;
                        return (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => setSection(sec)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-blue-800 text-white border-blue-900 shadow-xs ring-2 ring-blue-300'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                            }`}
                          >
                            <span className="text-[10px] opacity-75 font-normal">
                              {nepaliPrefix}:
                            </span>
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Secondary dropdown if many sections */}
                    {availableSections.length > 6 && (
                      <select
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        {availableSections.map((sec) => (
                          <option key={sec} value={sec}>
                            Section {sec}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={section}
                      onChange={(e) => setSection(normalizeSectionInput(e.target.value))}
                      placeholder="e.g. A, B, 1, 2, क, ख, १, २, Morning-A..."
                      className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-slate-900 font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      required
                    />

                    {/* On-screen Quick Character Insertion for Nepali & Number formats */}
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                        <span>Click to Insert Format:</span>
                        <span className="text-[10px] text-blue-700">Nepali / English Keypad</span>
                      </div>

                      {/* Nepali Alphabet */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-medium w-12 shrink-0">नेपाली:</span>
                        {QUICK_CHARACTERS.nepaliLetters.slice(0, 6).map((char) => (
                          <button
                            key={char}
                            type="button"
                            onClick={() => setSection(char)}
                            className="px-2 py-0.5 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-400 rounded text-xs font-bold text-slate-800 cursor-pointer"
                          >
                            {char}
                          </button>
                        ))}
                      </div>

                      {/* Nepali Numbers */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-medium w-12 shrink-0">अङ्क:</span>
                        {QUICK_CHARACTERS.nepaliNumbers.slice(0, 6).map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setSection(num)}
                            className="px-2 py-0.5 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-400 rounded text-xs font-bold text-slate-800 cursor-pointer font-mono"
                          >
                            {num}
                          </button>
                        ))}
                      </div>

                      {/* English Alphabet & Numbers */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-medium w-12 shrink-0">English:</span>
                        {QUICK_CHARACTERS.englishLetters.slice(0, 4).map((ltr) => (
                          <button
                            key={ltr}
                            type="button"
                            onClick={() => setSection(ltr)}
                            className="px-2 py-0.5 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-400 rounded text-xs font-bold text-slate-800 cursor-pointer font-mono"
                          >
                            {ltr}
                          </button>
                        ))}
                        <span className="text-slate-300">|</span>
                        {QUICK_CHARACTERS.englishNumbers.slice(0, 4).map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setSection(n)}
                            className="px-2 py-0.5 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-400 rounded text-xs font-bold text-slate-800 cursor-pointer font-mono"
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Academic Year
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="2081">2081 B.S.</option>
                  <option value="2080">2080 B.S.</option>
                  <option value="2079">2079 B.S.</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-slate-800">
                    Publish Result Online
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Subject-Wise Marks & Real-Time Calculation Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Subject-Wise Marks & Real-Time NEB Grade Engine
                </h3>
                <p className="text-[11px] text-slate-500">
                  Grades, Grade Points, and GPA automatically update upon entering marks according to NEB criteria.
                </p>
              </div>
              <button
                type="button"
                onClick={addSubjectRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition-colors border border-blue-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Subject
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="p-2.5 w-24">Code</th>
                    <th className="p-2.5">Subject Name</th>
                    <th className="p-2.5 w-16 text-center">Cr. Hr</th>
                    <th className="p-2.5 w-20 text-center">TH Full</th>
                    <th className="p-2.5 w-20 text-center">TH Obt</th>
                    <th className="p-2.5 w-16 text-center">TH Gr</th>
                    <th className="p-2.5 w-20 text-center">PR Full</th>
                    <th className="p-2.5 w-20 text-center">PR Obt</th>
                    <th className="p-2.5 w-16 text-center">PR Gr</th>
                    <th className="p-2.5 w-16 text-center font-bold text-blue-900">Final</th>
                    <th className="p-2.5 w-16 text-center font-bold text-slate-900">GP</th>
                    <th className="p-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {subjects.map((sub, idx) => (
                    <tr key={idx} className={sub.finalGrade === 'NG' ? 'bg-rose-50/50' : 'hover:bg-slate-50'}>
                      <td className="p-2">
                        <input
                          type="text"
                          value={sub.code}
                          onChange={(e) => updateSubjectField(idx, 'code', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-xs focus:bg-white focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={sub.name}
                          onChange={(e) => updateSubjectField(idx, 'name', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded font-medium text-xs focus:bg-white focus:outline-none"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="0.5"
                          value={sub.creditHours}
                          onChange={(e) => updateSubjectField(idx, 'creditHours', parseFloat(e.target.value) || 0)}
                          className="w-14 px-1.5 py-1 bg-slate-50 border border-slate-300 rounded text-center font-mono text-xs focus:bg-white focus:outline-none"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          value={sub.theoryFullMarks}
                          onChange={(e) => updateSubjectField(idx, 'theoryFullMarks', parseFloat(e.target.value) || 0)}
                          className="w-16 px-1.5 py-1 bg-slate-50 border border-slate-300 rounded text-center font-mono text-xs focus:bg-white focus:outline-none"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          value={sub.theoryObtained}
                          onChange={(e) => updateSubjectField(idx, 'theoryObtained', parseFloat(e.target.value) || 0)}
                          className="w-16 px-1.5 py-1 bg-white border border-blue-400 rounded text-center font-mono font-bold text-xs text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </td>
                      <td className="p-2 text-center font-bold">
                        <span className={sub.theoryGrade === 'NG' ? 'text-rose-600 font-extrabold' : 'text-slate-800'}>
                          {sub.theoryGrade}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          value={sub.practicalFullMarks}
                          onChange={(e) => updateSubjectField(idx, 'practicalFullMarks', parseFloat(e.target.value) || 0)}
                          className="w-16 px-1.5 py-1 bg-slate-50 border border-slate-300 rounded text-center font-mono text-xs focus:bg-white focus:outline-none"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          value={sub.practicalObtained}
                          disabled={sub.practicalFullMarks === 0}
                          onChange={(e) => updateSubjectField(idx, 'practicalObtained', parseFloat(e.target.value) || 0)}
                          className="w-16 px-1.5 py-1 bg-white border border-blue-400 rounded text-center font-mono font-bold text-xs text-blue-900 disabled:bg-slate-100 disabled:border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </td>
                      <td className="p-2 text-center font-bold">
                        {sub.practicalFullMarks > 0 ? (
                          <span className={sub.practicalGrade === 'NG' ? 'text-rose-600 font-extrabold' : 'text-slate-800'}>
                            {sub.practicalGrade}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-2 text-center font-extrabold text-sm">
                        <span className={sub.finalGrade === 'NG' ? 'text-rose-600' : 'text-blue-900'}>
                          {sub.finalGrade}
                        </span>
                      </td>
                      <td className="p-2 text-center font-mono font-bold text-slate-800">
                        {sub.gradePoint.toFixed(2)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeSubjectRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remove subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Automatic Calculated Outcome */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400">Total Credit Hours</div>
                <div className="text-lg font-bold font-mono text-white">{liveOverall.totalCreditHours.toFixed(1)}</div>
              </div>
              <div className="border-l border-slate-700 pl-6">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">Calculated GPA</div>
                <div className="text-2xl font-extrabold font-mono text-amber-400">{liveOverall.gpa.toFixed(2)}</div>
              </div>
              <div className="border-l border-slate-700 pl-6">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">Result Status</div>
                <div className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                  {liveOverall.resultStatus === 'PASS' && (
                    <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      PASS
                    </span>
                  )}
                  {liveOverall.resultStatus === 'NG' && (
                    <span className="text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                      NON-GRADED (NG)
                    </span>
                  )}
                  {liveOverall.resultStatus === 'ABSENT' && (
                    <span className="text-rose-400 font-bold bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                      ABSENT
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-300 text-right">
              <span className="font-semibold text-white">Remarks: </span>
              <span>{liveOverall.remarks}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm border border-slate-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg text-sm shadow-md transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {isSaving ? 'Saving Record...' : student ? 'Update Student & Recalculate' : 'Save & Calculate Result'}
          </button>
        </div>
      </div>
    </div>
  );
};
