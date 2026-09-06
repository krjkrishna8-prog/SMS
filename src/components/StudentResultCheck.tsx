import React, { useState, useEffect } from 'react';
import { SchoolConfig, StudentResult } from '../types';
import { SchoolHeader } from './SchoolHeader';
import { NebMarksheet } from './NebMarksheet';
import { Language, translations } from '../utils/i18n';
import { Search, RefreshCw, ShieldCheck, AlertCircle, Sparkles, CheckCircle2, Building2, Pencil, Camera } from 'lucide-react';

interface Props {
  school: SchoolConfig;
  lang: Language;
  onOpenAdmin: () => void;
  onOpenEditSchool?: () => void;
  onUpdateSchool?: (updated: SchoolConfig) => void;
}

export const StudentResultCheck: React.FC<Props> = ({
  school,
  lang,
  onOpenAdmin,
  onOpenEditSchool,
}) => {
  const t = translations[lang];

  // Search input states
  const [symbolNumber, setSymbolNumber] = useState('');
  const [dob, setDob] = useState('');
  const [classGrade, setClassGrade] = useState('Grade 12');
  const [academicYear, setAcademicYear] = useState('2081');

  // Interactive Security CAPTCHA
  const [captchaNum1, setCaptchaNum1] = useState(7);
  const [captchaNum2, setCaptchaNum2] = useState(4);
  const [captchaInput, setCaptchaInput] = useState('');

  // Result verification state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'NOT_FOUND' | 'UNPUBLISHED' | 'ERROR' | null>(null);
  const [verifiedStudent, setVerifiedStudent] = useState<StudentResult | null>(null);

  // Generate random CAPTCHA
  const refreshCaptcha = () => {
    const n1 = Math.floor(Math.random() * 8) + 2;
    const n2 = Math.floor(Math.random() * 8) + 1;
    setCaptchaNum1(n1);
    setCaptchaNum2(n2);
    setCaptchaInput('');
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  // Quick Demo Fillers
  const demoCandidates = [
    {
      label: 'Aarav Sharma (Science - GPA 3.72)',
      symbol: '0240012A',
      dob: '2062/04/18',
      cls: 'Grade 12',
      year: '2081',
    },
    {
      label: 'Binita Thapa (Management - GPA 3.65)',
      symbol: '0240014C',
      dob: '2061/11/05',
      cls: 'Grade 12',
      year: '2081',
    },
    {
      label: 'Rohan Karki (Science - NG in Chem)',
      symbol: '0240015D',
      dob: '2062/01/12',
      cls: 'Grade 12',
      year: '2081',
    },
    {
      label: 'Sujata Shrestha (Grade 11 - GPA 3.84)',
      symbol: '0240016E',
      dob: '2062/03/08',
      cls: 'Grade 11',
      year: '2081',
    },
    {
      label: 'Deepak Chaudhary (Unpublished Demo)',
      symbol: '0240017F',
      dob: '2061/09/20',
      cls: 'Grade 12',
      year: '2081',
    },
  ];

  const handleQuickFill = (c: typeof demoCandidates[0]) => {
    setSymbolNumber(c.symbol);
    setDob(c.dob);
    setClassGrade(c.cls);
    setAcademicYear(c.year);
    setCaptchaInput(String(captchaNum1 + captchaNum2));
    setErrorMessage(null);
    setStatusType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusType(null);

    if (!symbolNumber.trim()) {
      setErrorMessage('Please enter your Symbol Number.');
      return;
    }

    if (!dob.trim()) {
      setErrorMessage('Please enter your Date of Birth.');
      return;
    }

    // Validate CAPTCHA
    if (parseInt(captchaInput.trim(), 10) !== captchaNum1 + captchaNum2) {
      setErrorMessage('Incorrect security code answer. Please try again.');
      refreshCaptcha();
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/results/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbolNumber: symbolNumber.trim(),
          dob: dob.trim(),
          classGrade,
          academicYear,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.student) {
        setVerifiedStudent(data.student);
        setErrorMessage(null);
      } else {
        setVerifiedStudent(null);
        setStatusType(data.status || 'NOT_FOUND');
        setErrorMessage(data.message || t.notFoundTitle);
        refreshCaptcha();
      }
    } catch (err: any) {
      setVerifiedStudent(null);
      setStatusType('ERROR');
      setErrorMessage('Connection error. Please verify the server is running and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setVerifiedStudent(null);
    setErrorMessage(null);
    setStatusType(null);
    setSymbolNumber('');
    setDob('');
    refreshCaptcha();
  };

  // If a student result is successfully verified, render the full NEB Marksheet!
  if (verifiedStudent) {
    return (
      <div className="py-6 px-4">
        <NebMarksheet
          student={verifiedStudent}
          school={school}
          lang={lang}
          onReset={handleReset}
        />
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 max-w-3xl mx-auto">
      {/* Front-Side School Showcase Banner with Campus Photo & Dual English/Nepali Names */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        {/* Campus Photo Header / Showcase */}
        <div className="relative w-full h-52 sm:h-64 bg-slate-900 overflow-hidden group">
          <img
            src={school.schoolPhotoUrl || '/school_campus.jpg'}
            alt={`${school.schoolName} Campus Building`}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-90"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/20"></div>

          {/* Quick Edit School Name & Photo Action Button on Front Side */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenEditSchool}
              id="front-edit-school-btn"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/95 hover:bg-white text-[#1E3A8A] font-black rounded-xl text-xs uppercase tracking-wider shadow-lg backdrop-blur-xs transition-all cursor-pointer hover:shadow-xl border border-white/50"
              title="Edit school name English and Nepali both, and change photo"
            >
              <Pencil className="w-3.5 h-3.5 text-amber-600" />
              <span>Edit School & Photo</span>
            </button>
          </div>

          {/* Campus Photo Badge */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-950/80 backdrop-blur-xs text-amber-300 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-400/30 shadow-xs">
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>Campus Photo</span>
            </div>
          </div>

          {/* Bottom Overlay: School Names (English & Nepali) */}
          <div className="absolute bottom-4 left-4 right-4 text-white z-10">
            {/* School Name in Nepali */}
            <div className="text-xs sm:text-base font-black text-amber-300 tracking-wider font-sans mb-1 drop-shadow-xs">
              {school.schoolNameNepali}
            </div>

            {/* School Name in English */}
            <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-white leading-tight font-sans drop-shadow-sm">
              {school.schoolName}
            </h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-200 font-bold uppercase tracking-wider mt-1.5">
              <span>{school.address}</span>
              <span className="text-blue-300">•</span>
              <span>
                School Code: <span className="font-mono text-amber-300 font-black">{school.schoolCode}</span>
              </span>
              <span className="text-blue-300 hidden sm:inline">•</span>
              <span className="text-blue-200 hidden sm:inline">{school.academicYear}</span>
            </div>
          </div>
        </div>

        {/* Sub-bar with Affiliation & Quick Edit trigger */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-center sm:text-left">
            <Building2 className="w-4 h-4 text-[#1E3A8A] shrink-0" />
            <span className="uppercase tracking-wider text-[11px] text-blue-900 font-black">
              {school.affiliationText}
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenEditSchool}
            className="text-xs font-black uppercase tracking-wider text-[#1E3A8A] hover:text-blue-800 underline flex items-center gap-1 cursor-pointer"
          >
            <span>Edit English / Nepali Names & Photo</span>
          </button>
        </div>
      </div>

      {/* Main Result Search Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header Bar */}
        <div className="bg-[#1E3A8A] text-white px-6 sm:px-8 py-5 border-b-2 border-blue-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight leading-tight">
                {t.systemTitle}
              </h2>
              <p className="text-blue-200 text-xs sm:text-sm font-bold uppercase tracking-wider mt-0.5">
                {t.systemSubtitle} • {school.academicYear}
              </p>
            </div>
          </div>
        </div>

        {/* Verification Form Body */}
        <div className="p-6 sm:p-8">
          {/* Unsuccessful Result Alert Notice */}
          {errorMessage && (
            <div
              id="verification-error-alert"
              className={`mb-6 p-4 rounded-xl border-2 flex items-start gap-3 text-sm ${
                statusType === 'UNPUBLISHED'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}
            >
              <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${statusType === 'UNPUBLISHED' ? 'text-amber-600' : 'text-rose-600'}`} />
              <div>
                <div className="font-black uppercase tracking-wide text-xs">
                  {statusType === 'UNPUBLISHED' ? 'Result Notice' : t.notFoundTitle}
                </div>
                <div className="text-xs sm:text-sm mt-0.5 font-bold opacity-90">{errorMessage}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Symbol Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t.symbolNumber} <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="symbol-number-input"
                    value={symbolNumber}
                    onChange={(e) => setSymbolNumber(e.target.value.toUpperCase())}
                    placeholder={t.symbolPlaceholder}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold text-sm sm:text-base focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none uppercase tracking-wider transition-all placeholder:normal-case placeholder:font-sans placeholder:text-slate-400 placeholder:font-normal"
                    required
                  />
                </div>
                <p className="text-[11px] font-medium text-slate-400 mt-1">
                  Enter 8-character exam symbol number (e.g. 0240012A)
                </p>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t.dob} <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  id="dob-input"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  placeholder="YYYY/MM/DD (e.g. 2062/04/18)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm sm:text-base font-mono font-bold focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                  required
                />
                <p className="text-[11px] font-medium text-slate-400 mt-1">
                  {t.dobFormatHint}
                </p>
              </div>

              {/* Class / Grade Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t.classGrade}
                </label>
                <select
                  id="class-grade-select"
                  value={classGrade}
                  onChange={(e) => setClassGrade(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm sm:text-base focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all font-bold"
                >
                  <option value="Grade 12">Grade 12 (कक्षा १२)</option>
                  <option value="Grade 11">Grade 11 (कक्षा ११)</option>
                </select>
              </div>

              {/* Academic Year */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t.academicYear}
                </label>
                <select
                  id="academic-year-select"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm sm:text-base focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all font-bold"
                >
                  <option value="2081">2081 B.S. (Annual 2024)</option>
                  <option value="2080">2080 B.S. (Annual 2023)</option>
                  <option value="2079">2079 B.S. (Annual 2022)</option>
                </select>
              </div>
            </div>

            {/* Anti-Bot Security CAPTCHA */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#1E3A8A]" />
                  <span className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
                    {t.captcha}:
                  </span>
                  <div className="inline-flex items-center px-3.5 py-1 bg-blue-100 border border-blue-200 rounded-lg font-mono font-black text-[#1E3A8A] tracking-wider text-sm select-none">
                    {captchaNum1} + {captchaNum2} = ?
                  </div>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="Change question"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-full sm:w-36">
                  <input
                    type="number"
                    id="captcha-answer-input"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    placeholder={t.captchaPlaceholder}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-center font-black text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                id="check-result-submit-btn"
                className="w-full sm:flex-1 py-4 px-6 bg-[#1E3A8A] hover:bg-blue-900 text-white font-black rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-sm uppercase tracking-widest"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t.checking}</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>{t.submitBtn}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                id="clear-form-btn"
                className="w-full sm:w-auto py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-xs uppercase tracking-wider cursor-pointer"
              >
                {t.resetBtn}
              </button>
            </div>
          </form>

          {/* Prompt / Disclaimer Callout Note */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-[11px] text-blue-900 leading-relaxed font-medium">
              <span className="font-black uppercase tracking-wider block mb-1 text-blue-950">Official Notice:</span>
              This online result is for immediate verification only. For official physical transcripts with security holograms, please visit the college administration office.
            </p>
          </div>

          {/* Quick Demo Candidates Section */}
          <div className="mt-6 pt-6 border-t border-slate-200 quick-demo-box">
            <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{t.quickFill}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {demoCandidates.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleQuickFill(c)}
                  className="px-3 py-2 bg-slate-50 hover:bg-blue-50 text-slate-800 hover:text-blue-900 text-xs font-bold rounded-lg border border-slate-200 hover:border-blue-300 transition-all flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <span className="font-mono font-black text-[#1E3A8A]">{c.symbol}</span>
                  <span className="text-slate-500 font-medium text-[11px]">({c.label.split('(')[1]?.replace(')', '') || c.cls})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Security & Verification Guarantee Information */}
      <div className="mt-8 text-center text-xs text-slate-500 space-y-1">
        <div className="flex items-center justify-center gap-1.5 font-medium text-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Official Institutional Portal • National Examinations Board (NEB) Directives Compliant</span>
        </div>
        <p>
          Results displayed here are verified copies issued by {school.schoolName}. For official transcripts, please visit the college administration office.
        </p>
      </div>
    </div>
  );
};
