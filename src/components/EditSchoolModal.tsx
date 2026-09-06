import React, { useState, useRef } from 'react';
import { SchoolConfig } from '../types';
import { X, Building2, Image as ImageIcon, Upload, Save, Check, RotateCcw, Sparkles, Camera } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  school: SchoolConfig;
  onSave: (updatedSchool: SchoolConfig) => void;
}

const PRESET_SCHOOLS = [
  {
    nameEn: 'Himalayan Model Secondary School & College',
    nameNp: 'हिमालयन मोडल माध्यमिक विद्यालय तथा कलेज',
    code: '27014',
    address: 'Bagbazar, Kathmandu, Nepal',
  },
  {
    nameEn: 'Sagarmatha Secondary School & Higher Secondary',
    nameNp: 'सगरमाथा माध्यमिक विद्यालय तथा उच्च माध्यमिक',
    code: '21055',
    address: 'Pokhara, Kaski, Nepal',
  },
  {
    nameEn: 'Kathmandu Model Secondary School & College',
    nameNp: 'काठमाडौं मोडल माध्यमिक विद्यालय तथा कलेज',
    code: '27042',
    address: 'Balkumari, Lalitpur, Nepal',
  },
  {
    nameEn: 'Prabhat Secondary School & College',
    nameNp: 'प्रभात माध्यमिक विद्यालय तथा कलेज',
    code: '33018',
    address: 'Bharatpur, Chitwan, Nepal',
  },
];

export const EditSchoolModal: React.FC<Props> = ({
  isOpen,
  onClose,
  school,
  onSave,
}) => {
  const [form, setForm] = useState<SchoolConfig>({
    ...school,
    schoolPhotoUrl: school.schoolPhotoUrl || '/school_campus.jpg',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (JPG, PNG, WebP).');
        return;
      }
      // Read as base64 data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setForm((prev) => ({ ...prev, schoolPhotoUrl: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyPreset = (preset: typeof PRESET_SCHOOLS[0]) => {
    setForm((prev) => ({
      ...prev,
      schoolName: preset.nameEn,
      schoolNameNepali: preset.nameNp,
      schoolCode: preset.code,
      address: preset.address,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // 1. Send update to backend /api/school-config
      const response = await fetch('/api/school-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (data.success && data.school) {
        onSave(data.school);
      } else {
        onSave(form);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error saving school details:', err);
      // Fallback: save to client state
      onSave(form);
      setIsSaving(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header Bar */}
        <div className="bg-[#1E3A8A] text-white px-6 py-4 flex items-center justify-between border-b-2 border-blue-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                Edit School Details & Photo
              </h2>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mt-0.5">
                विद्यालय तथा कलेजको नाम र फोटो सम्पादन
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Quick Presets Bar */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Quick Preset Examples:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_SCHOOLS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-900 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  {p.nameEn.split(' ')[0]} {p.nameEn.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: School Names (English & Nepali) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-900">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                1. Institutional Names (English & Nepali)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* English Name */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  School Name (English) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={form.schoolName}
                  onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                  placeholder="e.g. Himalayan Model Secondary School & College"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  required
                />
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  Displayed on top banner, search portal, marksheet, and certificates.
                </p>
              </div>

              {/* Nepali Name */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  School Name (नेपालीमा) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={form.schoolNameNepali}
                  onChange={(e) => setForm({ ...form, schoolNameNepali: e.target.value })}
                  placeholder="उदा. हिमालयन मोडल माध्यमिक विद्यालय तथा कलेज"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  required
                />
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  नेपाली भाषामा विद्यालयको आधिकारिक नाम।
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: School Campus Photo (Front Side) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-900">
              <Camera className="w-4 h-4 text-[#1E3A8A]" />
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                2. Front Side School Campus Photo
              </span>
            </div>

            {/* Photo Preview Box */}
            <div className="relative rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100 h-44 sm:h-52 w-full group">
              <img
                src={form.schoolPhotoUrl || '/school_campus.jpg'}
                alt="School Campus Preview"
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-white text-slate-900 font-black rounded-lg text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 hover:bg-slate-100 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Upload New Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, schoolPhotoUrl: '/school_campus.jpg' })}
                  className="px-3 py-2 bg-slate-900/90 text-white font-bold rounded-lg text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 hover:bg-black cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>
              </div>

              <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider backdrop-blur-xs">
                Front Campus Photo Preview
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            {/* Photo Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs uppercase tracking-wider border border-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Upload Image from Computer</span>
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, schoolPhotoUrl: '/school_campus.jpg' })}
                  className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] font-bold rounded-lg text-xs uppercase tracking-wider border border-blue-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Use Modern Campus Photo</span>
                </button>
              </div>
            </div>

            {/* Image URL fallback */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Or Photo Web URL / Path
              </label>
              <input
                type="text"
                value={form.schoolPhotoUrl || ''}
                onChange={(e) => setForm({ ...form, schoolPhotoUrl: e.target.value })}
                placeholder="https://... or /school_campus.jpg"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          {/* Section 3: Campus Affiliation & Exam Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-900">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                3. Additional Institutional Details
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  School / College Code
                </label>
                <input
                  type="text"
                  value={form.schoolCode}
                  onChange={(e) => setForm({ ...form, schoolCode: e.target.value })}
                  placeholder="e.g. 27014"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Address / City, Nepal
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="e.g. Bagbazar, Kathmandu, Nepal"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Affiliation Statement
                </label>
                <input
                  type="text"
                  value={form.affiliationText}
                  onChange={(e) => setForm({ ...form, affiliationText: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#1E3A8A] hover:bg-blue-900 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Saved Successfully!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save & Update Everywhere'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
