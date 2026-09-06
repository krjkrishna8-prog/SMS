import React from 'react';
import { SchoolConfig } from '../types';
import { Language } from '../utils/i18n';

interface Props {
  school: SchoolConfig;
  lang: Language;
  variant?: 'public' | 'marksheet' | 'admin';
}

export const SchoolHeader: React.FC<Props> = ({ school, lang, variant = 'public' }) => {
  const isMarksheet = variant === 'marksheet';

  return (
    <div className={`text-center ${isMarksheet ? 'pb-4 mb-4 border-b-2 border-slate-900' : 'py-3'}`}>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {/* Academic School Crest */}
        <div className={`relative flex items-center justify-center rounded-full bg-blue-900 text-white shadow-sm ring-4 ring-blue-100 ${isMarksheet ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-14 h-14 sm:w-16 sm:h-16'}`}>
          <svg viewBox="0 0 100 100" className="w-10 h-10 sm:w-12 sm:h-12 fill-current text-amber-300">
            {/* Mountain Peak silhouette */}
            <path d="M 20 65 L 50 25 L 80 65 Z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
            <path d="M 40 65 L 50 48 L 60 65 Z" fill="currentColor" />
            {/* Open Book */}
            <path d="M 25 75 Q 50 68 75 75 L 75 80 Q 50 73 25 80 Z" fill="#ffffff" />
            <path d="M 50 69 L 50 82" stroke="#1e3a8a" strokeWidth="2" />
            {/* Torch flame */}
            <circle cx="50" cy="20" r="4" fill="#f59e0b" />
          </svg>
          <div className="absolute -bottom-1 text-[8px] sm:text-[9px] font-bold bg-amber-400 text-blue-950 px-1.5 py-0.2 rounded-full uppercase tracking-wider">
            ESTD 1998
          </div>
        </div>

        {/* School / College Titles */}
        <div className="text-center sm:text-left">
          <div className="text-xs sm:text-sm font-black text-blue-900 uppercase tracking-wider">
            {school.schoolNameNepali}
          </div>
          <h1 className={`font-black text-slate-900 uppercase tracking-tight leading-none my-1 font-sans ${isMarksheet ? 'text-xl sm:text-2xl' : 'text-lg sm:text-2xl'}`}>
            {school.schoolName}
          </h1>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            {school.address} • CODE: <span className="text-[#1E3A8A] font-black">{school.schoolCode}</span>
          </div>
          <div className="text-[11px] text-blue-800 font-bold uppercase tracking-wider mt-0.5">
            {school.affiliationText}
          </div>
        </div>
      </div>

      {isMarksheet && (
        <div className="mt-4 pt-3 border-t border-slate-300">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            {school.examTitle}
          </div>
          <div className="text-xs text-slate-600 font-medium">
            {school.examTitleNepali}
          </div>
        </div>
      )}
    </div>
  );
};
