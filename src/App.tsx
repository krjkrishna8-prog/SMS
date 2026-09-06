import React, { useState, useEffect } from 'react';
import { SchoolConfig } from './types';
import { StudentResultCheck } from './components/StudentResultCheck';
import { AdminPanel } from './components/AdminPanel';
import { EditSchoolModal } from './components/EditSchoolModal';
import { Language, translations } from './utils/i18n';
import { Globe, Lock, GraduationCap, ShieldCheck, Pencil } from 'lucide-react';

export default function App() {
  const [viewMode, setViewMode] = useState<'student' | 'admin'>('student');
  const [lang, setLang] = useState<Language>('en');
  const [isEditSchoolModalOpen, setIsEditSchoolModalOpen] = useState(false);

  const [school, setSchool] = useState<SchoolConfig>({
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
  });

  // Fetch school config from backend on mount
  useEffect(() => {
    fetch('/api/school-config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.school) {
          setSchool(data.school);
        }
      })
      .catch((err) => {
        console.error('Error fetching school config:', err);
      });
  }, []);

  const t = translations[lang];

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col font-sans selection:bg-blue-200">
      {/* Universal Top Application Bar - Bold Typography Theme */}
      <header className="no-print bg-[#1E3A8A] text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          {/* Logo & School Name */}
          <div className="flex items-center gap-3 select-none">
            <div
              onClick={() => setViewMode('student')}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-xs cursor-pointer"
            >
              <div className="w-5 h-5 border-4 border-[#1E3A8A] rounded-xs transform rotate-45"></div>
            </div>
            <div className="flex items-center gap-2">
              <div
                onClick={() => setViewMode('student')}
                className="cursor-pointer group"
              >
                <h1 className="text-lg sm:text-xl font-black tracking-tight leading-none text-white uppercase font-sans group-hover:text-amber-300 transition-colors">
                  {school.schoolName}
                </h1>
                <p className="text-[10px] tracking-widest uppercase text-blue-200 font-bold mt-0.5">
                  {school.schoolNameNepali} • Code: {school.schoolCode}
                </p>
              </div>

              {/* Quick Edit School Name & Photo Button in Header */}
              <button
                type="button"
                onClick={() => setIsEditSchoolModalOpen(true)}
                className="p-1.5 bg-blue-800/80 hover:bg-blue-700 text-blue-100 hover:text-white rounded-lg transition-colors cursor-pointer border border-blue-700/60 shadow-2xs"
                title="Edit School Name (English & Nepali) and Campus Photo"
                id="header-edit-school-btn"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Navigation & Language Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => setIsEditSchoolModalOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 bg-blue-900/80 hover:bg-blue-800 border border-blue-700 text-blue-100 hover:text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Pencil className="w-3 h-3 text-amber-300" />
              <span>Edit School</span>
            </button>

            {/* Language Toggle */}
            <div className="flex items-center bg-blue-950/60 p-1 rounded-lg border border-blue-800 text-xs">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded font-black tracking-wide text-xs transition-all cursor-pointer uppercase ${
                  lang === 'en' ? 'bg-white text-[#1E3A8A] shadow-xs' : 'text-blue-200 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('np')}
                className={`px-2.5 py-1 rounded font-black tracking-wide text-xs transition-all cursor-pointer ${
                  lang === 'np' ? 'bg-white text-[#1E3A8A] shadow-xs' : 'text-blue-200 hover:text-white'
                }`}
              >
                नेपाली
              </button>
            </div>

            {/* Portal Switcher */}
            {viewMode === 'student' ? (
              <button
                onClick={() => setViewMode('admin')}
                id="admin-portal-nav-btn"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-slate-100 text-[#1E3A8A] font-black rounded-lg text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-[#1E3A8A]" />
                <span className="hidden sm:inline">Admin Login</span>
                <span className="sm:hidden">Admin</span>
              </button>
            ) : (
              <button
                onClick={() => setViewMode('student')}
                id="student-portal-nav-btn"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-lg text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student Portal</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1">
        {viewMode === 'student' ? (
          <StudentResultCheck
            school={school}
            lang={lang}
            onOpenAdmin={() => setViewMode('admin')}
            onOpenEditSchool={() => setIsEditSchoolModalOpen(true)}
            onUpdateSchool={setSchool}
          />
        ) : (
          <AdminPanel
            school={school}
            onUpdateSchool={setSchool}
            onExitAdmin={() => setViewMode('student')}
          />
        )}
      </main>

      {/* Edit School Names & Front Campus Photo Modal */}
      <EditSchoolModal
        isOpen={isEditSchoolModalOpen}
        onClose={() => setIsEditSchoolModalOpen(false)}
        school={school}
        onSave={setSchool}
      />

      {/* Institutional Footer */}
      <footer className="no-print bg-slate-900 text-slate-300 py-6 px-4 text-xs border-t-2 border-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left space-y-1">
            <div className="text-sm font-black text-white uppercase tracking-wider">
              {school.schoolName}
            </div>
            <div className="text-slate-400 text-[11px] font-medium">
              {school.address} • Contact: {school.contactNumber}
            </div>
            <div className="text-blue-300 text-[11px] font-semibold">
              {school.affiliationText}
            </div>
          </div>

          <div className="text-center sm:text-right space-y-1 text-slate-400 text-[11px]">
            <div className="flex items-center justify-center sm:justify-end gap-1.5 text-slate-200 font-bold uppercase tracking-wider text-[10px]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified School Examination & Result Management System</span>
            </div>
            <p className="max-w-md text-slate-500 font-medium">
              Evaluated strictly according to National Examinations Board (NEB) Nepal Letter Grading Directives 2078.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
