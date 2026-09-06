import React from 'react';
import { StudentResult, SchoolConfig } from '../types';
import { NEB_GRADE_SCALE } from '../utils/grading';
import { SchoolHeader } from './SchoolHeader';
import { Language, translations } from '../utils/i18n';
import { Printer, ArrowLeft, Award, CheckCircle2, AlertTriangle, XCircle, QrCode, Download } from 'lucide-react';

interface Props {
  student: StudentResult;
  school: SchoolConfig;
  lang: Language;
  onReset: () => void;
}

export const NebMarksheet: React.FC<Props> = ({ student, school, lang, onReset }) => {
  const t = translations[lang];

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = () => {
    switch (student.resultStatus) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {t.pass}
          </span>
        );
      case 'NG':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            {t.ng}
          </span>
        );
      case 'ABSENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded font-bold text-sm">
            <XCircle className="w-4 h-4 text-rose-600" />
            {t.absent}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded font-bold text-sm">
            {student.resultStatus}
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Top Banner Notice - User Requested: “Congratulations! Your result has been published.” */}
      <div className="no-print mb-6 p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-900 font-black text-base sm:text-lg uppercase tracking-tight">
              {t.congratsTitle}
            </div>
            <div className="text-slate-500 font-bold text-xs uppercase tracking-wider mt-0.5">
              Grade-Sheet for Symbol: <span className="font-mono font-black text-[#1E3A8A]">{student.symbolNumber}</span> ({student.name})
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handlePrint}
            id="print-marksheet-btn"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1E3A8A] hover:bg-blue-900 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF / Print</span>
          </button>
          <button
            onClick={onReset}
            id="search-another-btn"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.searchAnother}</span>
          </button>
        </div>
      </div>

      {/* Official Marksheet Document (Printable A4 Certificate Layout - Bold Typography Theme) */}
      <div
        id="neb-marksheet-container"
        className="printable-marksheet bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 relative overflow-hidden font-sans"
      >
        {/* Verified & Published Badge */}
        <div className="flex justify-between items-center pb-4 mb-4 border-b-2 border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              OFFICIAL EVALUATION RECORD
            </span>
          </div>
          <div className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200 shadow-2xs">
            Verified & Published
          </div>
        </div>

        {/* Institutional Header */}
        <SchoolHeader school={school} lang={lang} variant="marksheet" />

        {/* Certificate Title Header */}
        <div className="text-center my-4 pb-3 border-b-2 border-slate-900">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
            {t.gradeSheet}
          </h3>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mt-0.5">
            {school.schoolName} • Academic Session {student.academicYear} B.S.
          </p>
        </div>

        {/* Student Details Grid - Bold Typography Theme */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t.studentName}</div>
            <div className="text-sm sm:text-base font-black text-slate-900 uppercase truncate">
              {student.name}
            </div>
            {student.nameNepali && (
              <div className="text-[10px] text-slate-500 font-semibold">{student.nameNepali}</div>
            )}
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t.symbolNumber}</div>
            <div className="text-sm sm:text-base font-black text-[#1E3A8A] font-mono">
              {student.symbolNumber}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t.regNo}</div>
            <div className="text-sm sm:text-base font-black text-slate-700 font-mono">
              {student.registrationNumber}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t.dob}</div>
            <div className="text-sm sm:text-base font-black text-slate-700 font-mono">
              {student.dobBS} B.S.
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t.classGrade}</div>
            <div className="text-xs sm:text-sm font-black text-slate-900 uppercase">
              {student.classGrade} ({student.section})
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t.facultyStream}</div>
            <div className="text-xs sm:text-sm font-black text-blue-900 uppercase">
              {student.stream}
            </div>
          </div>

          <div className="col-span-2">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">School / College</div>
            <div className="text-xs sm:text-sm font-black text-slate-800 uppercase truncate">
              {school.schoolName}, Code {school.schoolCode}
            </div>
          </div>
        </div>

        {/* Subject-Wise Marks & Grades Table - Bold Typography Theme */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-slate-900">
                <th className="py-2.5 px-2 text-[11px] font-black uppercase tracking-wider text-slate-900 w-10 text-center">S.N.</th>
                <th className="py-2.5 px-3 text-[11px] font-black uppercase tracking-wider text-slate-900 w-24">{t.subjectCode}</th>
                <th className="py-2.5 px-3 text-[11px] font-black uppercase tracking-wider text-slate-900">{t.subjectTitle}</th>
                <th className="py-2.5 px-2 text-[11px] font-black uppercase tracking-wider text-slate-900 text-center w-16">{t.creditHour}</th>
                <th className="py-2.5 px-2 text-[11px] font-black uppercase tracking-wider text-slate-900 text-center w-16">{t.gradeTheory}</th>
                <th className="py-2.5 px-2 text-[11px] font-black uppercase tracking-wider text-slate-900 text-center w-16">{t.gradePractical}</th>
                <th className="py-2.5 px-2 text-[11px] font-black uppercase tracking-wider text-slate-900 text-center w-20">{t.finalGrade}</th>
                <th className="py-2.5 px-2 text-[11px] font-black uppercase tracking-wider text-slate-900 text-center w-16">{t.gradePoint}</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold text-slate-700">
              {student.subjects.map((sub, idx) => {
                const isNG = sub.finalGrade === 'NG';
                const isEven = idx % 2 === 1;
                return (
                  <tr key={sub.code || idx} className={`border-b border-slate-200 ${isEven ? 'bg-slate-50/70' : 'bg-white'} ${isNG ? 'bg-rose-50/60' : ''}`}>
                    <td className="py-3 px-2 text-center font-mono text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-slate-900">
                      {sub.code}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div>{sub.name}</div>
                      {sub.nameNepali && (
                        <div className="text-[11px] text-slate-500 font-semibold">{sub.nameNepali}</div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-bold">
                      {sub.creditHours.toFixed(1)}
                    </td>
                    <td className="py-3 px-2 text-center font-black">
                      <span className={sub.theoryGrade === 'NG' ? 'text-rose-600 bg-rose-100 px-2 py-0.5 rounded' : 'bg-blue-50 px-2 py-0.5 rounded text-[#1E3A8A]'}>
                        {sub.theoryGrade}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-black">
                      {sub.practicalFullMarks > 0 ? (
                        <span className={sub.practicalGrade === 'NG' ? 'text-rose-600 bg-rose-100 px-2 py-0.5 rounded' : 'bg-blue-50 px-2 py-0.5 rounded text-[#1E3A8A]'}>
                          {sub.practicalGrade}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center font-black text-base">
                      <span className={`px-2.5 py-0.5 rounded ${isNG ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-[#1E3A8A]'}`}>
                        {sub.finalGrade}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-black text-slate-900">
                      {sub.gradePoint.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-black border-t-2 border-slate-900 text-slate-900">
                <td colSpan={3} className="py-3 px-3 text-right uppercase tracking-wider text-xs">
                  {t.totalCreditHours}:
                </td>
                <td className="py-3 px-2 text-center font-mono text-sm">
                  {student.totalCreditHours.toFixed(1)}
                </td>
                <td colSpan={2} className="py-3 px-3 text-right uppercase tracking-wider text-xs">
                  {t.gpa}:
                </td>
                <td colSpan={2} className="py-3 px-3 text-center font-mono text-lg font-black text-[#1E3A8A] bg-blue-100">
                  {student.gpa.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer Metrics & Official Signatures - Bold Typography Theme */}
        <footer className="mt-6 pt-6 border-t-2 border-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div className="flex items-center gap-8">
            <div>
              <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Final Status</div>
              <div className={`text-2xl sm:text-3xl font-black tracking-tight ${
                student.resultStatus === 'PASS'
                  ? 'text-green-600'
                  : student.resultStatus === 'NG'
                  ? 'text-amber-600'
                  : 'text-rose-600'
              }`}>
                {student.resultStatus}
              </div>
            </div>

            <div className="border-l-2 border-slate-200 pl-8">
              <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Grade Point Average (GPA)</div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                {student.gpa.toFixed(2)}
              </div>
            </div>

            <div className="border-l-2 border-slate-200 pl-8 hidden md:block">
              <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Evaluation Remarks</div>
              <div className="text-xs font-black text-slate-700 mt-1 max-w-xs">
                {student.remarks}
              </div>
            </div>
          </div>

          <div className="text-center sm:text-right w-full sm:w-auto">
            <div className="w-36 h-1 border-b-2 border-slate-400 mb-2 mx-auto sm:ml-auto sm:mr-0"></div>
            <div className="text-[10px] font-black uppercase text-slate-900 tracking-wider">
              {school.controllerName}
            </div>
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              Controller of Examinations • Date: 2081/04/18
            </div>
          </div>
        </footer>

        {/* Reference Key Table */}
        <div className="mt-8 pt-4 border-t border-slate-200">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
            {t.gradingSystemKey}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-bold">
            {NEB_GRADE_SCALE.map((g) => (
              <div key={g.grade} className="flex items-center justify-between px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-black text-[#1E3A8A]">{g.grade} ({g.gradePoint.toFixed(1)})</span>
                <span className="text-slate-600 font-medium text-[11px]">{g.minPercentage}%-{g.maxPercentage >= 100 ? '100%' : `${Math.floor(g.maxPercentage)}%`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
