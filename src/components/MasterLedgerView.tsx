import React, { useState } from 'react';
import { StudentResult, SchoolConfig } from '../types';
import { Printer, Download, ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Filter } from 'lucide-react';
import { formatSectionLabel } from '../utils/sectionFormats';

interface Props {
  students: StudentResult[];
  school: SchoolConfig;
  selectedClass: string;
  selectedYear: string;
  onClose: () => void;
}

export const MasterLedgerView: React.FC<Props> = ({
  students,
  school,
  selectedClass,
  selectedYear,
  onClose,
}) => {
  const [selectedSection, setSelectedSection] = useState<string>('all');

  const handlePrint = () => {
    window.print();
  };

  // Collect available sections
  const availableSections: string[] = Array.from(
    new Set(students.map((s) => s.section).filter(Boolean) as string[])
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  // Filter students if specific section chosen
  const displayedStudents = selectedSection === 'all'
    ? students
    : students.filter((s) => s.section === selectedSection);

  // Collect unique subject codes across all students
  const subjectHeadersMap = new Map<string, string>();
  displayedStudents.forEach((s) => {
    s.subjects.forEach((sub) => {
      if (!subjectHeadersMap.has(sub.code)) {
        subjectHeadersMap.set(sub.code, sub.name);
      }
    });
  });

  const subjectHeaders = Array.from(subjectHeadersMap.entries());

  // Export to CSV
  const handleExportCsv = () => {
    const headerRow = [
      'S.N.',
      'Symbol Number',
      'Registration No',
      'Student Name',
      'DOB (BS)',
      'Class',
      'Stream',
      'Section',
      ...subjectHeaders.map(([code, name]) => `${name} (${code})`),
      'Total Cr.Hr',
      'GPA',
      'Result Status',
      'Remarks',
    ];

    const dataRows = displayedStudents.map((s, index) => {
      const subGrades = subjectHeaders.map(([code]) => {
        const found = s.subjects.find((sub) => sub.code === code);
        return found ? found.finalGrade : '—';
      });

      return [
        index + 1,
        `"${s.symbolNumber}"`,
        `"${s.registrationNumber}"`,
        `"${s.name}"`,
        `"${s.dobBS}"`,
        `"${s.classGrade}"`,
        `"${s.stream}"`,
        `"${s.section}"`,
        ...subGrades,
        s.totalCreditHours.toFixed(1),
        s.gpa.toFixed(2),
        s.resultStatus,
        `"${s.remarks}"`,
      ].join(',');
    });

    const csvContent = [headerRow.join(','), ...dataRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `NEB_Consolidated_Broadsheet_${selectedClass.replace(' ', '_')}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full">
      {/* Top Action Header (hidden in print) */}
      <div className="no-print mb-6 p-4 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </button>
          <h2 className="text-lg font-bold text-slate-900">
            Consolidated Broadsheet / Tabulation Ledger (लब्धाङ्क विवरण)
          </h2>
          <p className="text-xs text-slate-500">
            {selectedClass} • Academic Year {selectedYear} B.S. • Showing {displayedStudents.length} of {students.length} Candidates
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Section Filter */}
          {availableSections.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-600">Section/खण्ड:</span>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="bg-transparent font-bold text-blue-900 focus:outline-none cursor-pointer"
              >
                <option value="all">All Sections ({students.length})</option>
                {availableSections.map((sec) => {
                  const count = students.filter((s) => s.section === sec).length;
                  const { label, nepaliPrefix } = formatSectionLabel(sec);
                  return (
                    <option key={sec} value={sec}>
                      {nepaliPrefix} {label} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors border border-slate-300 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export to Excel/CSV
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Master Ledger
          </button>
        </div>
      </div>

      {/* Printable Master Broadsheet Document */}
      <div className="printable-ledger bg-white border border-slate-300 rounded-xl p-6 shadow-sm overflow-x-auto">
        {/* Document Header */}
        <div className="text-center pb-4 mb-4 border-b-2 border-slate-900">
          <div className="text-xs font-bold text-blue-900 uppercase tracking-wide">
            {school.schoolNameNepali}
          </div>
          <h1 className="font-cinzel text-xl font-extrabold text-slate-900">
            {school.schoolName}
          </h1>
          <div className="text-xs text-slate-600 font-medium">
            {school.address} • School Code: {school.schoolCode}
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-blue-950 mt-2 bg-blue-50 py-1 px-4 inline-block border border-blue-200 rounded">
            CONSOLIDATED TABULATION SHEET / MASTER BROADSHEET — {selectedClass.toUpperCase()} (YEAR: {selectedYear} B.S.)
            {selectedSection !== 'all' && ` • SECTION / खण्ड: ${selectedSection}`}
          </div>
        </div>

        {/* Big Ledger Table */}
        <table className="w-full text-left text-xs border-collapse border border-slate-900">
          <thead>
            <tr className="bg-slate-900 text-white border-b border-slate-900 text-[11px]">
              <th className="p-2 text-center border-r border-slate-700 w-8">SN</th>
              <th className="p-2 border-r border-slate-700 w-24">Symbol No</th>
              <th className="p-2 border-r border-slate-700 w-24">Reg No</th>
              <th className="p-2 border-r border-slate-700 w-44">Student Name</th>
              <th className="p-2 border-r border-slate-700 w-16">Stream</th>
              <th className="p-2 text-center border-r border-slate-700 w-16">Sec/खण्ड</th>
              {subjectHeaders.map(([code]) => (
                <th key={code} className="p-2 text-center border-r border-slate-700 w-12" title={code}>
                  {code.split('.')[0]}
                </th>
              ))}
              <th className="p-2 text-center border-r border-slate-700 w-14">Cr.Hr</th>
              <th className="p-2 text-center border-r border-slate-700 w-14 font-bold bg-blue-950">GPA</th>
              <th className="p-2 text-center border-r border-slate-700 w-20">Status</th>
              <th className="p-2 w-48">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {displayedStudents.map((s, idx) => (
              <tr key={s.id} className={`hover:bg-slate-50 ${s.resultStatus === 'NG' ? 'bg-amber-50/50' : ''}`}>
                <td className="p-2 text-center border-r border-slate-300 font-mono text-slate-600">
                  {idx + 1}
                </td>
                <td className="p-2 border-r border-slate-300 font-mono font-bold text-blue-900">
                  {s.symbolNumber}
                </td>
                <td className="p-2 border-r border-slate-300 font-mono text-slate-700">
                  {s.registrationNumber}
                </td>
                <td className="p-2 border-r border-slate-300 font-semibold text-slate-900">
                  {s.name}
                </td>
                <td className="p-2 border-r border-slate-300 text-slate-600 text-[11px]">
                  {s.stream}
                </td>
                <td className="p-2 border-r border-slate-300 text-center font-bold text-slate-800 text-xs">
                  {s.section || '—'}
                </td>

                {/* Subject final grades */}
                {subjectHeaders.map(([code]) => {
                  const sub = s.subjects.find((item) => item.code === code);
                  const grade = sub ? sub.finalGrade : '—';
                  const isNG = grade === 'NG';
                  return (
                    <td
                      key={code}
                      className={`p-2 text-center border-r border-slate-300 font-bold ${
                        isNG ? 'text-rose-600 bg-rose-50' : 'text-slate-800'
                      }`}
                    >
                      {grade}
                    </td>
                  );
                })}

                <td className="p-2 text-center border-r border-slate-300 font-mono">
                  {s.totalCreditHours.toFixed(1)}
                </td>
                <td className="p-2 text-center border-r border-slate-300 font-mono font-extrabold text-blue-950 bg-blue-50">
                  {s.gpa.toFixed(2)}
                </td>
                <td className="p-2 text-center border-r border-slate-300 font-bold text-[11px]">
                  {s.resultStatus === 'PASS' && <span className="text-emerald-700">PASS</span>}
                  {s.resultStatus === 'NG' && <span className="text-amber-700">NG</span>}
                  {s.resultStatus === 'ABSENT' && <span className="text-rose-700">ABSENT</span>}
                </td>
                <td className="p-2 text-slate-700 text-[11px]">
                  {s.remarks}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Ledger Summary & Signatures */}
        <div className="mt-8 pt-6 border-t border-slate-400 grid grid-cols-3 gap-6 text-center text-xs">
          <div>
            <div className="w-36 border-b border-slate-600 mx-auto mb-1"></div>
            <div className="font-bold text-slate-800">Tabulated & Checked By</div>
            <div className="text-[10px] text-slate-500">Exam Tabulation Committee</div>
          </div>
          <div>
            <div className="w-36 border-b border-slate-600 mx-auto mb-1"></div>
            <div className="font-bold text-slate-800">{school.controllerName}</div>
            <div className="text-[10px] text-slate-500">Controller of Examinations</div>
          </div>
          <div>
            <div className="w-36 border-b border-slate-600 mx-auto mb-1"></div>
            <div className="font-bold text-slate-800">{school.principalName}</div>
            <div className="text-[10px] text-slate-500">Principal / Head of Institution</div>
          </div>
        </div>
      </div>
    </div>
  );
};
