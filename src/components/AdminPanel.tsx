import React, { useState, useEffect } from 'react';
import { StudentResult, SchoolConfig, AuditLog, ClassConfig } from '../types';
import { StudentEditorModal } from './StudentEditorModal';
import { CsvImportModal } from './CsvImportModal';
import { MasterLedgerView } from './MasterLedgerView';
import { NebMarksheet } from './NebMarksheet';
import {
  SectionFormatType,
  SECTION_PRESETS,
  FORMAT_LABELS,
  convertSectionFormat,
  detectSectionFormat,
  formatSectionLabel,
  normalizeSectionInput,
  QUICK_CHARACTERS,
} from '../utils/sectionFormats';
import {
  Users,
  Search,
  Plus,
  Upload,
  Download,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
  Shield,
  LogOut,
  RefreshCw,
  Globe,
  SlidersHorizontal,
  Printer,
  History,
  Lock,
  Camera,
  Image as ImageIcon,
  Building2,
  Layers,
  Sparkles,
  Tag,
  ArrowRight,
  BookOpen,
  Keyboard,
  RotateCcw,
} from 'lucide-react';

interface Props {
  school: SchoolConfig;
  onUpdateSchool: (newSchool: SchoolConfig) => void;
  onExitAdmin: () => void;
}

export const AdminPanel: React.FC<Props> = ({ school, onUpdateSchool, onExitAdmin }) => {
  // Authentication State
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('neb_admin_token'));
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('nebadmin2026');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Tab State: Includes 'classes' tab for Class & Section Management
  const [activeTab, setActiveTab] = useState<'students' | 'classes' | 'ledger' | 'import' | 'settings' | 'audit'>('students');

  // Data States
  const [students, setStudents] = useState<StudentResult[]>([]);
  const [stats, setStats] = useState<any>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Classes & Sections state
  const [classes, setClasses] = useState<ClassConfig[]>([]);
  const [activeClassId, setActiveClassId] = useState<string>('');
  const [newSectionInput, setNewSectionInput] = useState('');
  const [activeFormatTab, setActiveFormatTab] = useState<SectionFormatType>('en-alpha');
  const [showKeypadInCustom, setShowKeypadInCustom] = useState(false);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassNameNepali, setNewClassNameNepali] = useState('');
  const [newClassSections, setNewClassSections] = useState('A, B, C, D');
  const [sectionMessage, setSectionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [editingSectionModal, setEditingSectionModal] = useState<{
    classId: string;
    className: string;
    oldName: string;
    newName: string;
    updateStudents: boolean;
  } | null>(null);
  const [editingClassModal, setEditingClassModal] = useState<{
    id: string;
    className: string;
    classNameNepali: string;
    description: string;
  } | null>(null);
  const [deletingSectionConfirm, setDeletingSectionConfirm] = useState<{
    classId: string;
    className: string;
    sectionName: string;
    enrolledCount: number;
  } | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedStream, setSelectedStream] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals & Selected items
  const [editingStudent, setEditingStudent] = useState<StudentResult | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [viewingMarksheetStudent, setViewingMarksheetStudent] = useState<StudentResult | null>(null);

  // Selected for batch action
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // School Settings form
  const [schoolForm, setSchoolForm] = useState<SchoolConfig>(school);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAdminToken(data.token);
        localStorage.setItem('neb_admin_token', data.token);
      } else {
        setLoginError(data.message || 'Invalid username or password.');
      }
    } catch (err) {
      setLoginError('Could not connect to authentication server.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setAdminToken(null);
    localStorage.removeItem('neb_admin_token');
  };

  // Fetch Students & Stats
  const fetchStudents = async () => {
    if (!adminToken) return;
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (selectedClass !== 'all') params.append('classGrade', selectedClass);
      if (selectedSection !== 'all') params.append('section', selectedSection);
      if (selectedYear !== 'all') params.append('academicYear', selectedYear);
      if (selectedStream !== 'all') params.append('stream', selectedStream);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/admin/students?${params.toString()}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Classes & Sections
  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      if (data.success && Array.isArray(data.classes)) {
        setClasses(data.classes);
        if (!activeClassId && data.classes.length > 0) {
          setActiveClassId(data.classes[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs);
      }
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (adminToken) {
      fetchStudents();
      if (activeTab === 'audit') {
        fetchAuditLogs();
      }
    }
  }, [adminToken, selectedClass, selectedSection, selectedYear, selectedStream, selectedStatus, searchQuery, activeTab]);

  // Section & Class Action Handlers
  const handleAddSection = async (classId: string, sectionName: string) => {
    if (!adminToken) return;
    const trimmed = normalizeSectionInput(sectionName);
    if (!trimmed) return;

    setSectionMessage(null);
    try {
      const res = await fetch(`/api/admin/classes/${classId}/sections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ sectionName: trimmed }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewSectionInput('');
        setClasses(data.classes);
        setSectionMessage({ text: `Section "${trimmed}" added successfully!`, type: 'success' });
        setTimeout(() => setSectionMessage(null), 3000);
      } else {
        setSectionMessage({ text: data.message || 'Failed to add section', type: 'error' });
      }
    } catch (e: any) {
      setSectionMessage({ text: e.message || 'Network error while adding section', type: 'error' });
    }
  };

  const handleBatchSetSections = async (classId: string, sectionNames: string[], replaceAll: boolean = false) => {
    if (!adminToken || sectionNames.length === 0) return;
    setSectionMessage(null);
    try {
      const res = await fetch(`/api/admin/classes/${classId}/sections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ sectionNames, replaceAll }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClasses(data.classes);
        setSectionMessage({
          text: replaceAll
            ? `Sections replaced with: ${sectionNames.join(', ')}`
            : `Added sections: ${sectionNames.join(', ')}`,
          type: 'success',
        });
        setTimeout(() => setSectionMessage(null), 3500);
      } else {
        setSectionMessage({ text: data.message || 'Failed to update sections', type: 'error' });
      }
    } catch (e: any) {
      setSectionMessage({ text: e.message || 'Network error while updating sections', type: 'error' });
    }
  };

  const handleEditSection = async (classId: string, oldName: string, newName: string, updateStudents: boolean) => {
    if (!adminToken) return;
    const trimmed = normalizeSectionInput(newName);
    if (!trimmed) return;

    try {
      const res = await fetch(`/api/admin/classes/${classId}/sections`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          oldSectionName: oldName,
          newSectionName: trimmed,
          updateStudents,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClasses(data.classes);
        setEditingSectionModal(null);
        fetchStudents();
        setSectionMessage({ text: `Section updated to "${trimmed}" successfully!`, type: 'success' });
        setTimeout(() => setSectionMessage(null), 3000);
      } else {
        alert(data.message || 'Failed to update section');
      }
    } catch (e: any) {
      alert(e.message || 'Network error while updating section');
    }
  };

  const handleDeleteSection = async (classId: string, sectionName: string, force: boolean = false) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/classes/${classId}/sections/${encodeURIComponent(sectionName)}${force ? '?force=true' : ''}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClasses(data.classes);
        setDeletingSectionConfirm(null);
        fetchStudents();
        setSectionMessage({ text: `Section "${sectionName}" removed.`, type: 'success' });
        setTimeout(() => setSectionMessage(null), 3000);
      } else {
        if (data.enrolledStudentsCount && !force) {
          const targetClass = classes.find((c) => c.id === classId);
          setDeletingSectionConfirm({
            classId,
            className: targetClass?.className || 'this class',
            sectionName,
            enrolledCount: data.enrolledStudentsCount,
          });
        } else {
          alert(data.message || 'Failed to delete section');
        }
      }
    } catch (e: any) {
      alert(e.message || 'Network error while deleting section');
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !newClassName.trim()) return;

    const sectionsArray = newClassSections
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    try {
      const res = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          className: newClassName.trim(),
          classNameNepali: newClassNameNepali.trim(),
          sections: sectionsArray.length > 0 ? sectionsArray : ['A'],
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClasses(data.classes);
        setActiveClassId(data.class.id);
        setIsAddingClass(false);
        setNewClassName('');
        setNewClassNameNepali('');
        setNewClassSections('A, B, C, D');
        setSectionMessage({ text: `Class "${data.class.className}" created with sections!`, type: 'success' });
        setTimeout(() => setSectionMessage(null), 3000);
      } else {
        alert(data.message || 'Failed to create class');
      }
    } catch (e: any) {
      alert(e.message || 'Error creating class');
    }
  };

  const handleDeleteClass = async (classId: string, className: string, force: boolean = false) => {
    if (!adminToken) return;
    if (!force && !window.confirm(`Are you sure you want to delete class "${className}" and its sections?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/classes/${classId}${force ? '?force=true' : ''}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClasses(data.classes);
        if (activeClassId === classId && data.classes.length > 0) {
          setActiveClassId(data.classes[0].id);
        }
        setSectionMessage({ text: `Class "${className}" deleted.`, type: 'success' });
        setTimeout(() => setSectionMessage(null), 3000);
      } else {
        if (data.enrolledStudentsCount && !force) {
          if (window.confirm(`Warning: ${data.enrolledStudentsCount} students are enrolled in ${className}. Are you sure you want to permanently delete it and all its sections?`)) {
            handleDeleteClass(classId, className, true);
          }
        } else {
          alert(data.message || 'Failed to delete class');
        }
      }
    } catch (e: any) {
      alert(e.message || 'Error deleting class');
    }
  };

  // Save student (Add or Edit)
  const handleSaveStudent = async (studentData: Partial<StudentResult>) => {
    if (!adminToken) return;

    if (editingStudent) {
      // Update
      const res = await fetch(`/api/admin/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(studentData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update student');
      }
    } else {
      // Create
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(studentData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create student');
      }
    }

    fetchStudents();
    fetchAuditLogs();
  };

  // Delete student
  const handleDeleteStudent = async (id: string, name: string) => {
    if (!adminToken) return;
    if (!window.confirm(`Are you sure you want to delete the record for ${name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/students/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        fetchStudents();
        fetchAuditLogs();
      }
    } catch (e) {
      console.error('Error deleting student:', e);
    }
  };

  // Single-student publish toggle
  const handleTogglePublish = async (student: StudentResult) => {
    if (!adminToken) return;
    try {
      await fetch(`/api/admin/students/${student.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ isPublished: !student.isPublished }),
      });
      fetchStudents();
      fetchAuditLogs();
    } catch (e) {
      console.error('Error toggling publish state:', e);
    }
  };

  // Batch publish / unpublish
  const handleBatchPublish = async (publish: boolean) => {
    if (!adminToken || selectedIds.length === 0) return;
    try {
      await fetch('/api/admin/publish-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          studentIds: selectedIds,
          publish,
        }),
      });
      setSelectedIds([]);
      fetchStudents();
      fetchAuditLogs();
    } catch (e) {
      console.error('Error in batch publish:', e);
    }
  };

  // Save school settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/school-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(schoolForm),
      });
      const data = await res.json();
      if (data.success) {
        onUpdateSchool(data.school);
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  };

  // Checkbox selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(students.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  /* =========================================================================
     RENDER 1: LOGIN FORM
     ========================================================================= */
  if (!adminToken) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-white text-center">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3 text-amber-300">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="font-cinzel text-xl font-bold">Admin / Staff Portal</h2>
            <p className="text-xs text-blue-200 mt-1">
              Result Management & Publishing System • NEB Directives
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {/* Quick Demo Credentials Helper */}
            <div className="mb-6 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs">
              <div className="font-bold text-blue-900 mb-1 flex items-center justify-between">
                <span>Default Demo Credentials:</span>
                <span className="text-[10px] bg-blue-200/70 text-blue-950 px-1.5 py-0.5 rounded font-mono">Pre-filled</span>
              </div>
              <div className="text-slate-700 font-mono space-y-0.5">
                <div>Username: <span className="font-bold text-blue-900">admin</span></div>
                <div>Password: <span className="font-bold text-blue-900">nebadmin2026</span></div>
              </div>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-bold rounded-lg text-sm transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Log In to Dashboard</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onExitAdmin}
                  className="text-xs text-slate-500 hover:text-blue-800 font-medium transition-colors cursor-pointer"
                >
                  ← Return to Public Student Result Portal
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     RENDER 2: SINGLE MARK SHEET PREVIEW MODAL
     ========================================================================= */
  if (viewingMarksheetStudent) {
    return (
      <div className="py-6 px-4">
        <NebMarksheet
          student={viewingMarksheetStudent}
          school={school}
          lang="en"
          onReset={() => setViewingMarksheetStudent(null)}
        />
      </div>
    );
  }

  /* =========================================================================
     RENDER 3: MAIN AUTHENTICATED DASHBOARD
     ========================================================================= */
  return (
    <div className="py-6 px-4 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Top Navbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold">
            <Shield className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 text-base sm:text-lg">
                NEB Result Administrator Dashboard
              </h1>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {school.schoolName} ({school.schoolCode})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onExitAdmin}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors border border-slate-300 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            Public Result Portal
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs transition-colors border border-rose-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>

      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Enrolled</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">{stats.total || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Students in records</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Published</div>
          <div className="text-2xl font-extrabold text-blue-700 font-mono mt-1">{stats.published || 0}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Publicly verifiable</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Unpublished</div>
          <div className="text-2xl font-extrabold text-amber-600 font-mono mt-1">{stats.unpublished || 0}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-0.5">Draft / Under review</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Passed</div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono mt-1">{stats.passed || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {stats.total > 0 ? `${Math.round(((stats.passed || 0) / stats.total) * 100)}% Pass rate` : '0%'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Non-Graded (NG)</div>
          <div className="text-2xl font-extrabold text-rose-600 font-mono mt-1">{stats.ng || 0}</div>
          <div className="text-[11px] text-rose-500 font-medium mt-0.5">Grade increment eligible</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('students')}
          className={`pb-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'students'
              ? 'border-blue-700 text-blue-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Students & Results
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`pb-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'classes'
              ? 'border-blue-700 text-blue-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Classes & Sections
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'ledger'
              ? 'border-blue-700 text-blue-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Master Broadsheet / Ledger
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-blue-700 text-blue-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          School Profile
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-blue-700 text-blue-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          Audit Trail Log
        </button>
      </div>

      {/* TAB 1: STUDENTS & RESULTS */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-b-xl border border-slate-200 p-4 sm:p-6 space-y-4 shadow-xs">
          {/* Action Toolbar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Symbol Number, Name, or Registration..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setEditingStudent(null);
                  setIsEditorOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Student
              </button>

              <button
                onClick={() => setIsImportOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors border border-slate-300 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Import CSV / Excel
              </button>
            </div>
          </div>

          {/* Filtering Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <span className="text-slate-500 font-medium block mb-1">Filter Class:</span>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSection('all');
                }}
                className="w-full p-1.5 bg-white border border-slate-300 rounded font-medium text-xs"
              >
                <option value="all">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.className}>
                    {c.className}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-slate-500 font-medium block mb-1">Filter Section:</span>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full p-1.5 bg-white border border-slate-300 rounded font-bold text-blue-950 text-xs"
              >
                <option value="all">All Sections</option>
                {(() => {
                  const targetClass = classes.find((c) => c.className === selectedClass);
                  const availableSecs: string[] = targetClass
                    ? targetClass.sections
                    : Array.from(new Set(classes.flatMap((c) => c.sections) as string[])).sort((a, b) =>
                        a.localeCompare(b, undefined, { numeric: true })
                      );
                  return availableSecs.map((sec) => {
                    const { label, nepaliPrefix } = formatSectionLabel(sec);
                    return (
                      <option key={sec} value={sec}>
                        {nepaliPrefix} {label}
                      </option>
                    );
                  });
                })()}
              </select>
            </div>

            <div>
              <span className="text-slate-500 font-medium block mb-1">Filter Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full p-1.5 bg-white border border-slate-300 rounded font-medium text-xs"
              >
                <option value="all">All Academic Years</option>
                <option value="2081">2081 B.S.</option>
                <option value="2080">2080 B.S.</option>
                <option value="2079">2079 B.S.</option>
              </select>
            </div>

            <div>
              <span className="text-slate-500 font-medium block mb-1">Filter Stream:</span>
              <select
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
                className="w-full p-1.5 bg-white border border-slate-300 rounded font-medium text-xs"
              >
                <option value="all">All Streams</option>
                <option value="Science">Science</option>
                <option value="Management">Management</option>
                <option value="Humanities">Humanities</option>
                <option value="Education">Education</option>
              </select>
            </div>

            <div>
              <span className="text-slate-500 font-medium block mb-1">Filter Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-1.5 bg-white border border-slate-300 rounded font-medium text-xs"
              >
                <option value="all">All Statuses</option>
                <option value="PUBLISHED">Published Only</option>
                <option value="UNPUBLISHED">Unpublished (Draft)</option>
                <option value="PASS">Passed Candidates</option>
                <option value="NG">Non-Graded (NG)</option>
                <option value="ABSENT">Absent Candidates</option>
              </select>
            </div>
          </div>

          {/* Batch Actions Bar (when items selected) */}
          {selectedIds.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
              <span className="font-bold text-blue-900">
                {selectedIds.length} candidate{selectedIds.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBatchPublish(true)}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded shadow-xs cursor-pointer"
                >
                  Publish Online ({selectedIds.length})
                </button>
                <button
                  onClick={() => handleBatchPublish(false)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded shadow-xs cursor-pointer"
                >
                  Unpublish / Retract ({selectedIds.length})
                </button>
              </div>
            </div>
          )}

          {/* Students Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === students.length && students.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300"
                    />
                  </th>
                  <th className="p-3 w-28">Symbol No</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3 w-28">DOB (BS)</th>
                  <th className="p-3 w-24">Class</th>
                  <th className="p-3 w-24">Stream</th>
                  <th className="p-3 w-16 text-center">GPA</th>
                  <th className="p-3 w-24 text-center">Result</th>
                  <th className="p-3 w-24 text-center">Published</th>
                  <th className="p-3 w-36 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading candidate records...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      No student results found matching current criteria.
                    </td>
                  </tr>
                ) : (
                  students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(s.id)}
                          onChange={(e) => handleSelectOne(s.id, e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300"
                        />
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-900">
                        {s.symbolNumber}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{s.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Reg: {s.registrationNumber}</div>
                      </td>
                      <td className="p-3 font-mono text-slate-700">
                        {s.dobBS}
                      </td>
                      <td className="p-3 text-slate-800">
                        {s.classGrade}
                      </td>
                      <td className="p-3 text-slate-600">
                        <div className="font-medium text-slate-800">{s.stream}</div>
                        {(() => {
                          const { label, nepaliPrefix } = formatSectionLabel(s.section);
                          return (
                            <span className="inline-block mt-0.5 px-2 py-0.5 bg-blue-50 text-blue-900 font-bold rounded border border-blue-200 text-[10px]">
                              {nepaliPrefix} {label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="p-3 text-center font-mono font-extrabold text-blue-950">
                        {s.gpa.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        {s.resultStatus === 'PASS' && (
                          <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                            PASS
                          </span>
                        )}
                        {s.resultStatus === 'NG' && (
                          <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                            NG
                          </span>
                        )}
                        {s.resultStatus === 'ABSENT' && (
                          <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                            ABSENT
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(s)}
                          className={`px-2 py-0.5 rounded font-bold text-[10px] cursor-pointer transition-colors ${
                            s.isPublished
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {s.isPublished ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingMarksheetStudent(s)}
                            className="p-1.5 text-blue-700 hover:bg-blue-50 rounded transition-colors"
                            title="View / Print Grade-Sheet"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingStudent(s);
                              setIsEditorOpen(true);
                            }}
                            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded transition-colors"
                            title="Edit Marks & Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s.id, s.name)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete Student Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: CLASSES & SECTIONS MANAGEMENT */}
      {activeTab === 'classes' && (
        <div className="bg-white rounded-b-xl border border-slate-200 p-4 sm:p-6 space-y-6 shadow-xs">
          {/* Notification Toast */}
          {sectionMessage && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                sectionMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {sectionMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{sectionMessage.text}</span>
              </div>
              <button
                onClick={() => setSectionMessage(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Section Management Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-800" />
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Classes & Multiple Sections Management
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Define multiple sections (A, B, C, D, etc.) for each academic class. Add, edit, or remove sections as required.
              </p>
            </div>

            <button
              onClick={() => setIsAddingClass(!isAddingClass)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-800 hover:bg-blue-900 text-white font-bold rounded-lg text-xs transition-colors shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              {isAddingClass ? 'Close Class Creator' : 'Add New Class'}
            </button>
          </div>

          {/* New Class Creator Form Modal/Drawer */}
          {isAddingClass && (
            <form
              onSubmit={handleCreateClass}
              className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-blue-950 text-xs sm:text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-700" />
                  Create New Academic Class
                </h3>
                <span className="text-[11px] text-blue-700 font-medium">NEB Pattern Class Definition</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Class / Grade Name (English) *
                  </label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="e.g. Grade 10, Grade 11, BBS 1st Year"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Class Name (Nepali)
                  </label>
                  <input
                    type="text"
                    value={newClassNameNepali}
                    onChange={(e) => setNewClassNameNepali(e.target.value)}
                    placeholder="e.g. कक्षा १०, कक्षा ११"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Sections (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newClassSections}
                    onChange={(e) => setNewClassSections(e.target.value)}
                    placeholder="A, B, C, D"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-200/60">
                <button
                  type="button"
                  onClick={() => setIsAddingClass(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-800 hover:bg-blue-900 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save & Create Class
                </button>
              </div>
            </form>
          )}

          {/* Classes & Sections Master Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: List of Classes */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider px-1">
                <span>Configured Classes ({classes.length})</span>
                <span>Enrolled</span>
              </div>

              <div className="space-y-2">
                {classes.map((cls) => {
                  const isSelected = activeClassId === cls.id;
                  const enrolledCount = students.filter((s) => s.classGrade === cls.className).length;

                  return (
                    <div
                      key={cls.id}
                      onClick={() => setActiveClassId(cls.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-900 text-white border-blue-900 shadow-md ring-2 ring-blue-300/60'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-extrabold text-sm flex items-center gap-1.5">
                            <span>{cls.className}</span>
                            {cls.classNameNepali && (
                              <span
                                className={`text-[11px] font-normal ${
                                  isSelected ? 'text-blue-200' : 'text-slate-500'
                                }`}
                              >
                                ({cls.classNameNepali})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isSelected ? 'bg-blue-800 text-amber-300' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {cls.sections.length} Section{cls.sections.length === 1 ? '' : 's'} (
                              {cls.sections.join(', ')})
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full ${
                              isSelected ? 'bg-blue-800 text-white' : 'bg-blue-50 text-blue-900'
                            }`}
                          >
                            {enrolledCount} {enrolledCount === 1 ? 'std' : 'stds'}
                          </span>

                          {classes.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClass(cls.id, cls.className);
                              }}
                              className={`block mt-2 ml-auto text-[11px] p-1 rounded transition-colors ${
                                isSelected ? 'text-rose-300 hover:text-white' : 'text-slate-400 hover:text-rose-600'
                              }`}
                              title="Delete Class"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Sections for Selected Class */}
            <div className="lg:col-span-8 space-y-5">
              {(() => {
                const selectedClassObj = classes.find((c) => c.id === activeClassId) || classes[0];
                if (!selectedClassObj) {
                  return (
                    <div className="p-8 text-center text-slate-500 bg-slate-50 border border-slate-200 rounded-xl">
                      No classes configured. Click "Add New Class" to get started.
                    </div>
                  );
                }

                const enrolledInClass = students.filter((s) => s.classGrade === selectedClassObj.className);

                return (
                  <div className="space-y-5">
                    {/* Active Class Ribbon */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-slate-900">
                            {selectedClassObj.className}
                          </h3>
                          {selectedClassObj.classNameNepali && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded-full">
                              {selectedClassObj.classNameNepali}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {selectedClassObj.sections.length} active section{selectedClassObj.sections.length === 1 ? '' : 's'} • {enrolledInClass.length} total enrolled candidates
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedClass(selectedClassObj.className);
                            setSelectedSection('all');
                            setActiveTab('students');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer shadow-xs"
                        >
                          <Users className="w-3.5 h-3.5 text-blue-700" />
                          View All Class Students
                        </button>
                      </div>
                    </div>

                    {/* Format Selector & Quick-Add Section Bar */}
                    <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3.5 shadow-2xs">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                        <div>
                          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                            Section Formats & Quick Configuration
                          </span>
                          <p className="text-[11px] text-slate-500">
                            Add or batch configure sections in English/Nepali alphabetical or numerical formats.
                          </p>
                        </div>

                        {/* 1-Click Batch Templates Dropdown / Buttons */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-500 font-semibold uppercase">Apply Scheme:</span>
                          <button
                            type="button"
                            onClick={() => handleBatchSetSections(selectedClassObj.id, ['A', 'B', 'C', 'D'], false)}
                            className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-900 border border-slate-300 rounded text-[11px] font-bold cursor-pointer"
                            title="Add A, B, C, D"
                          >
                            + A, B, C, D
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBatchSetSections(selectedClassObj.id, ['1', '2', '3', '4'], false)}
                            className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-900 border border-slate-300 rounded text-[11px] font-bold cursor-pointer font-mono"
                            title="Add 1, 2, 3, 4"
                          >
                            + 1, 2, 3, 4
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBatchSetSections(selectedClassObj.id, ['क', 'ख', 'ग', 'घ'], false)}
                            className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-900 border border-slate-300 rounded text-[11px] font-bold cursor-pointer"
                            title="Add क, ख, ग, घ"
                          >
                            + क, ख, ग, घ
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBatchSetSections(selectedClassObj.id, ['१', '२', '३', '४'], false)}
                            className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-900 border border-slate-300 rounded text-[11px] font-bold cursor-pointer font-mono"
                            title="Add १, २, ३, ४"
                          >
                            + १, २, ३, ४
                          </button>
                        </div>
                      </div>

                      {/* Format Tabs Switcher */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                        {(Object.keys(FORMAT_LABELS) as SectionFormatType[]).map((fmtKey) => {
                          const info = FORMAT_LABELS[fmtKey];
                          const isActive = activeFormatTab === fmtKey;
                          return (
                            <button
                              key={fmtKey}
                              type="button"
                              onClick={() => setActiveFormatTab(fmtKey)}
                              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border text-xs ${
                                isActive
                                  ? 'bg-blue-800 text-white border-blue-900 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              <span>{info.icon}</span>
                              <span>{info.title}</span>
                              <span className={`text-[10px] font-normal opacity-75 hidden sm:inline`}>
                                ({info.subtitle})
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Quick Add Chips corresponding to the active format */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                          <span>Click to add {FORMAT_LABELS[activeFormatTab].title} items to {selectedClassObj.className}:</span>
                          <span className="text-[10px] text-slate-400">Green = Already added</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {SECTION_PRESETS[activeFormatTab].map((item) => {
                            const alreadyExists = selectedClassObj.sections.some(
                              (s) => s.toLowerCase() === item.toLowerCase()
                            );
                            const { label, nepaliPrefix } = formatSectionLabel(item);
                            return (
                              <button
                                key={item}
                                type="button"
                                disabled={alreadyExists}
                                onClick={() => handleAddSection(selectedClassObj.id, item)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                  alreadyExists
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 opacity-80 cursor-default'
                                    : 'bg-white text-blue-900 border-blue-300 hover:bg-blue-800 hover:text-white shadow-xs'
                                }`}
                              >
                                {alreadyExists ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>{nepaliPrefix} {label} Added</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>+ Add {item}</span>
                                  </>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom Section Input with Keyboard Toggle */}
                      <div className="pt-2.5 border-t border-slate-200 space-y-2">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (newSectionInput.trim()) {
                              handleAddSection(selectedClassObj.id, newSectionInput);
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="text"
                            value={newSectionInput}
                            onChange={(e) => setNewSectionInput(e.target.value)}
                            placeholder="Type any section (e.g. A, 1, क, १, Group-A, Morning-1)..."
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKeypadInCustom(!showKeypadInCustom)}
                            className={`px-2.5 py-1.5 border rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                              showKeypadInCustom
                                ? 'bg-blue-100 text-blue-900 border-blue-300'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                            title="Toggle Nepali & Number Keypad"
                          >
                            <Keyboard className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Nepali Keypad</span>
                          </button>
                          <button
                            type="submit"
                            disabled={!newSectionInput.trim()}
                            className="px-3.5 py-1.5 bg-blue-800 hover:bg-blue-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                          >
                            + Add Section
                          </button>
                        </form>

                        {/* On-screen Nepali & Number Character Keyboard */}
                        {showKeypadInCustom && (
                          <div className="p-2.5 bg-white border border-blue-200 rounded-lg space-y-2 text-xs">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold border-b border-slate-100 pb-1">
                              <span>Click keys to insert into custom section input:</span>
                              <button
                                type="button"
                                onClick={() => setNewSectionInput('')}
                                className="text-rose-600 hover:underline cursor-pointer text-[10px]"
                              >
                                Clear
                              </button>
                            </div>

                            {/* Nepali Alphabet */}
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[10px] text-slate-400 font-bold w-14 shrink-0">नेपाली अक्षर:</span>
                              {QUICK_CHARACTERS.nepaliLetters.map((ch) => (
                                <button
                                  key={ch}
                                  type="button"
                                  onClick={() => setNewSectionInput((prev) => prev + ch)}
                                  className="px-2 py-1 bg-slate-50 hover:bg-blue-50 border border-slate-300 hover:border-blue-400 rounded text-xs font-bold text-slate-800 cursor-pointer shadow-2xs"
                                >
                                  {ch}
                                </button>
                              ))}
                            </div>

                            {/* Nepali Numbers */}
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[10px] text-slate-400 font-bold w-14 shrink-0">नेपाली अङ्क:</span>
                              {QUICK_CHARACTERS.nepaliNumbers.map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => setNewSectionInput((prev) => prev + num)}
                                  className="px-2 py-1 bg-slate-50 hover:bg-blue-50 border border-slate-300 hover:border-blue-400 rounded text-xs font-bold text-slate-800 cursor-pointer shadow-2xs font-mono"
                                >
                                  {num}
                                </button>
                              ))}
                            </div>

                            {/* English Alphabet & Numbers */}
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[10px] text-slate-400 font-bold w-14 shrink-0">English:</span>
                              {QUICK_CHARACTERS.englishLetters.map((ltr) => (
                                <button
                                  key={ltr}
                                  type="button"
                                  onClick={() => setNewSectionInput((prev) => prev + ltr)}
                                  className="px-2 py-1 bg-slate-50 hover:bg-blue-50 border border-slate-300 hover:border-blue-400 rounded text-xs font-bold text-slate-800 cursor-pointer shadow-2xs font-mono"
                                >
                                  {ltr}
                                </button>
                              ))}
                              <span className="text-slate-300 mx-1">|</span>
                              {QUICK_CHARACTERS.englishNumbers.map((dig) => (
                                <button
                                  key={dig}
                                  type="button"
                                  onClick={() => setNewSectionInput((prev) => prev + dig)}
                                  className="px-2 py-1 bg-slate-50 hover:bg-blue-50 border border-slate-300 hover:border-blue-400 rounded text-xs font-bold text-slate-800 cursor-pointer shadow-2xs font-mono"
                                >
                                  {dig}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section Cards Grid */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                        <span>Configured Sections ({selectedClassObj.sections.length})</span>
                        <span className="text-slate-400 font-normal normal-case">
                          Admins can rename, delete, or filter by each section
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {selectedClassObj.sections.map((secName) => {
                          const enrolledInThisSec = enrolledInClass.filter((s) => s.section === secName);
                          const streamCounts = enrolledInThisSec.reduce((acc: any, curr) => {
                            acc[curr.stream] = (acc[curr.stream] || 0) + 1;
                            return acc;
                          }, {});

                          return (
                            <div
                              key={secName}
                              className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3 group"
                            >
                              <div>
                                <div className="flex items-start justify-between">
                                  {(() => {
                                    const { label, nepaliPrefix, prefix } = formatSectionLabel(secName);
                                    const secFormat = detectSectionFormat(secName);
                                    return (
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center font-black text-sm shrink-0">
                                          {secName}
                                        </div>
                                        <div>
                                          <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 flex-wrap">
                                            <span>{nepaliPrefix} {label}</span>
                                            {secFormat.startsWith('ne') && (
                                              <span className="text-[9px] bg-red-50 text-red-700 font-bold px-1.5 py-0.2 rounded border border-red-200">
                                                नेपाली
                                              </span>
                                            )}
                                          </h4>
                                          <span className="text-[10px] text-slate-400 font-mono">
                                            {selectedClassObj.className} • {prefix} {label}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingSectionModal({
                                          classId: selectedClassObj.id,
                                          className: selectedClassObj.className,
                                          oldName: secName,
                                          newName: secName,
                                          updateStudents: true,
                                        })
                                      }
                                      className="p-1 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded transition-colors"
                                      title="Rename Section"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>

                                    {selectedClassObj.sections.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSection(selectedClassObj.id, secName)}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                        title="Delete Section"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500 font-medium">Enrolled Students:</span>
                                    <span className="font-mono font-bold text-blue-950">
                                      {enrolledInThisSec.length}
                                    </span>
                                  </div>

                                  {/* Streams list */}
                                  {Object.keys(streamCounts).length > 0 ? (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {Object.entries(streamCounts).map(([st, cnt]) => (
                                        <span
                                          key={st}
                                          className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium"
                                        >
                                          {st}: {String(cnt)}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-slate-400 italic">No candidates assigned</div>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedClass(selectedClassObj.className);
                                  setSelectedSection(secName);
                                  setActiveTab('students');
                                }}
                                className="w-full py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-900 border border-slate-200 hover:border-blue-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <span>Filter Sec {secName} Students</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER BROADSHEET / TABULATION LEDGER */}
      {activeTab === 'ledger' && (
        <MasterLedgerView
          students={students}
          school={school}
          selectedClass={selectedClass === 'all' ? 'Grade 12' : selectedClass}
          selectedYear={selectedYear === 'all' ? '2081' : selectedYear}
          onClose={() => setActiveTab('students')}
        />
      )}

      {/* TAB 3: SCHOOL CONFIGURATION */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-b-xl border border-slate-200 p-6 shadow-xs max-w-3xl">
          <h2 className="text-base font-bold text-slate-900 mb-1">
            School / College Profile & Exam Details
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Configure institutional details appearing on official student grade-sheets and ledger certificates.
          </p>

          {settingsSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>School information successfully updated and applied!</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6 text-xs sm:text-sm">
            {/* School Campus Photo Section */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#1E3A8A]" />
                  <span className="font-black text-slate-800 uppercase tracking-wider text-xs">
                    School Campus Photo (Front Side)
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Featured on Public Verification Portal
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {/* Photo Thumbnail */}
                <div className="relative w-full sm:w-48 h-28 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100 shrink-0 shadow-xs">
                  <img
                    src={schoolForm.schoolPhotoUrl || '/school_campus.jpg'}
                    alt="Campus Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-1 left-1 bg-slate-950/80 text-white px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                    Current Photo
                  </div>
                </div>

                <div className="flex-1 w-full space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg text-xs uppercase tracking-wider border border-slate-300 shadow-2xs cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 text-[#1E3A8A]" />
                      <span>Upload Photo from Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const result = event.target?.result as string;
                              if (result) {
                                setSchoolForm({ ...schoolForm, schoolPhotoUrl: result });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setSchoolForm({ ...schoolForm, schoolPhotoUrl: '/school_campus.jpg' })}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] font-bold rounded-lg text-xs uppercase tracking-wider border border-blue-200 transition-colors cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Use Default Campus Photo</span>
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={schoolForm.schoolPhotoUrl || ''}
                      onChange={(e) => setSchoolForm({ ...schoolForm, schoolPhotoUrl: e.target.value })}
                      placeholder="Or enter photo URL: /school_campus.jpg or https://..."
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-black text-slate-700 uppercase tracking-wider text-xs mb-1">
                  School Name (English) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={schoolForm.schoolName}
                  onChange={(e) => setSchoolForm({ ...schoolForm, schoolName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  Official name printed on English certificates & header
                </p>
              </div>

              <div>
                <label className="block font-black text-slate-700 uppercase tracking-wider text-xs mb-1">
                  School Name (नेपालीमा) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={schoolForm.schoolNameNepali}
                  onChange={(e) => setSchoolForm({ ...schoolForm, schoolNameNepali: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  नेपाली भाषामा विद्यालयको आधिकारिक नाम
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">School Code</label>
                <input
                  type="text"
                  value={schoolForm.schoolCode}
                  onChange={(e) => setSchoolForm({ ...schoolForm, schoolCode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address / Location</label>
                <input
                  type="text"
                  value={schoolForm.address}
                  onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Affiliation Statement</label>
                <input
                  type="text"
                  value={schoolForm.affiliationText}
                  onChange={(e) => setSchoolForm({ ...schoolForm, affiliationText: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Exam Title (English)</label>
                <input
                  type="text"
                  value={schoolForm.examTitle}
                  onChange={(e) => setSchoolForm({ ...schoolForm, examTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Principal Name</label>
                <input
                  type="text"
                  value={schoolForm.principalName}
                  onChange={(e) => setSchoolForm({ ...schoolForm, principalName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Controller of Examinations</label>
                <input
                  type="text"
                  value={schoolForm.controllerName}
                  onChange={(e) => setSchoolForm({ ...schoolForm, controllerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
              >
                Save School Configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-b-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                System Security & Modification Audit Trail
              </h2>
              <p className="text-xs text-slate-500">
                All result calculations, mark revisions, and publication actions are securely timestamped.
              </p>
            </div>
            <button
              onClick={fetchAuditLogs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="p-3 w-40">Timestamp</th>
                  <th className="p-3 w-36">Action</th>
                  <th className="p-3 w-40">Target Candidate</th>
                  <th className="p-3">Audit Details</th>
                  <th className="p-3 w-28">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-mono font-bold text-[11px] text-blue-900">
                      {log.action}
                    </td>
                    <td className="p-3 font-medium text-slate-800">
                      {log.studentName ? `${log.studentName} (${log.symbolNumber})` : '—'}
                    </td>
                    <td className="p-3 text-slate-700 text-xs">
                      {log.details}
                    </td>
                    <td className="p-3 text-slate-600 text-[11px]">
                      {log.performedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Add/Edit Modal */}
      <StudentEditorModal
        student={editingStudent}
        isOpen={isEditorOpen}
        classes={classes}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingStudent(null);
        }}
        onSave={handleSaveStudent}
      />

      {/* CSV / Excel Import Modal */}
      <CsvImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={() => {
          fetchStudents();
          fetchAuditLogs();
        }}
        adminToken={adminToken}
      />

      {/* Rename Section Modal */}
      {editingSectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">
                    Rename Section: {editingSectionModal.oldName}
                  </h3>
                  {(() => {
                    const fmt = detectSectionFormat(editingSectionModal.oldName);
                    return (
                      <span className="text-[10px] bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded border border-blue-200">
                        {FORMAT_LABELS[fmt].title}
                      </span>
                    );
                  })()}
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Class: {editingSectionModal.className}
                </span>
              </div>
              <button
                onClick={() => setEditingSectionModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              {/* 1-Click Format Converter Row */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  1-Click Convert to Different Format:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      'en-alpha',
                      'en-num',
                      'ne-alpha',
                      'ne-num',
                      'bilingual-alpha',
                      'bilingual-num',
                    ] as SectionFormatType[]
                  ).map((fmt) => {
                    const converted = convertSectionFormat(editingSectionModal.oldName, fmt);
                    const isCurrent = editingSectionModal.newName === converted;
                    return (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() =>
                          setEditingSectionModal({
                            ...editingSectionModal,
                            newName: converted,
                          })
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                          isCurrent
                            ? 'bg-blue-800 text-white border-blue-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <span>{FORMAT_LABELS[fmt].icon}</span>
                        <span>{converted}</span>
                        <span className="text-[10px] opacity-75">({FORMAT_LABELS[fmt].title})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Section Name / Label *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editingSectionModal.newName}
                    onChange={(e) =>
                      setEditingSectionModal({
                        ...editingSectionModal,
                        newName: e.target.value,
                      })
                    }
                    placeholder="e.g. A, 1, क, १, Group-A"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  {editingSectionModal.newName && (
                    <span className="absolute right-2.5 top-2.5 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                      Format: {FORMAT_LABELS[detectSectionFormat(editingSectionModal.newName)].title}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Character Palette for Nepali and Digits */}
              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-950">
                    Insert Characters (Click to append):
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingSectionModal({
                        ...editingSectionModal,
                        newName: '',
                      })
                    }
                    className="text-rose-600 hover:underline cursor-pointer text-[10px]"
                  >
                    Clear Input
                  </button>
                </div>

                {/* Nepali Letters */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-bold w-12 shrink-0">नेपाली:</span>
                  {QUICK_CHARACTERS.nepaliLetters.map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() =>
                        setEditingSectionModal({
                          ...editingSectionModal,
                          newName: editingSectionModal.newName + ch,
                        })
                      }
                      className="px-2 py-0.5 bg-white hover:bg-blue-100 border border-slate-300 rounded text-xs font-bold text-slate-800 cursor-pointer shadow-2xs"
                    >
                      {ch}
                    </button>
                  ))}
                </div>

                {/* Nepali Numbers */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-bold w-12 shrink-0">अङ्क:</span>
                  {QUICK_CHARACTERS.nepaliNumbers.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() =>
                        setEditingSectionModal({
                          ...editingSectionModal,
                          newName: editingSectionModal.newName + num,
                        })
                      }
                      className="px-2 py-0.5 bg-white hover:bg-blue-100 border border-slate-300 rounded text-xs font-bold text-slate-800 cursor-pointer shadow-2xs font-mono"
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {/* English Alpha & Numbers */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-bold w-12 shrink-0">Eng:</span>
                  {QUICK_CHARACTERS.englishLetters.map((ltr) => (
                    <button
                      key={ltr}
                      type="button"
                      onClick={() =>
                        setEditingSectionModal({
                          ...editingSectionModal,
                          newName: editingSectionModal.newName + ltr,
                        })
                      }
                      className="px-2 py-0.5 bg-white hover:bg-blue-100 border border-slate-300 rounded text-xs font-bold text-slate-800 cursor-pointer shadow-2xs font-mono"
                    >
                      {ltr}
                    </button>
                  ))}
                  <span className="text-slate-300 mx-1">|</span>
                  {QUICK_CHARACTERS.englishNumbers.map((dig) => (
                    <button
                      key={dig}
                      type="button"
                      onClick={() =>
                        setEditingSectionModal({
                          ...editingSectionModal,
                          newName: editingSectionModal.newName + dig,
                        })
                      }
                      className="px-2 py-0.5 bg-white hover:bg-blue-100 border border-slate-300 rounded text-xs font-bold text-slate-800 cursor-pointer shadow-2xs font-mono"
                    >
                      {dig}
                    </button>
                  ))}
                </div>
              </div>

              {/* Automatic Enrollment Update Option */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSectionModal.updateStudents}
                    onChange={(e) =>
                      setEditingSectionModal({
                        ...editingSectionModal,
                        updateStudents: e.target.checked,
                      })
                    }
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300"
                  />
                  <div>
                    <span className="font-bold text-blue-950 block">
                      Update Enrolled Students Automatically
                    </span>
                    <span className="text-blue-800 text-[11px] block mt-0.5">
                      Automatically reassign all candidates currently in Section {editingSectionModal.oldName} to the new section name.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingSectionModal(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!editingSectionModal.newName.trim()}
                onClick={() =>
                  handleEditSection(
                    editingSectionModal.classId,
                    editingSectionModal.oldName,
                    editingSectionModal.newName,
                    editingSectionModal.updateStudents
                  )
                }
                className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer disabled:opacity-50"
              >
                Save Section Name
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Section Enrolled Confirmation Modal */}
      {deletingSectionConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-rose-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Enrolled Students in Section {deletingSectionConfirm.sectionName}
                </h3>
                <span className="text-xs text-rose-600 font-semibold">
                  Action Required
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              There are{' '}
              <strong className="text-slate-900 font-bold">
                {deletingSectionConfirm.enrolledCount} candidate(s)
              </strong>{' '}
              currently enrolled in Section {deletingSectionConfirm.sectionName} of {deletingSectionConfirm.className}.
            </p>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
              Deleting this section will remove the section definition. To reassign them first, cancel and rename the section or edit individual students.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingSectionConfirm(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = deletingSectionConfirm;
                  setDeletingSectionConfirm(null);
                  handleDeleteSection(target.classId, target.sectionName, true);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
              >
                Force Delete Section
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
