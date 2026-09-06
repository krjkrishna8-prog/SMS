import React, { useState } from 'react';
import { Download, Upload, FileText, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  adminToken: string;
}

export const CsvImportModal: React.FC<Props> = ({ isOpen, onClose, onImportSuccess, adminToken }) => {
  const [csvText, setCsvText] = useState('');
  const [defaultClass, setDefaultClass] = useState('Grade 12');
  const [defaultYear, setDefaultYear] = useState('2081');
  const [defaultStream, setDefaultStream] = useState('Science');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const sampleCsvContent = `symbolNumber,registrationNumber,name,nameNepali,dobBS,dobAD,classGrade,stream,section,academicYear
0240020A,8032100420,Prashant Adhikari,प्रशान्त अधिकारी,2062/06/14,2005-09-30,Grade 12,Science,Science-A,2081
0240021B,8032100421,Kripa Silwal,कृपा सिलवाल,2061/12/22,2005-04-05,Grade 12,Management,Management-A,2081
0240022C,8032100422,Suman Gurung,सुमन गुरुङ,2062/02/19,2005-06-02,Grade 12,Science,Science-B,2081
0240023D,8032100423,Anisha Bista,अनिशा विष्ट,2062/08/10,2005-11-26,Grade 11,Science,Science-A,2081`;

  const downloadSampleTemplate = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'NEB_Student_Result_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text || '');
    };
    reader.readAsText(file);
  };

  // Simple CSV parser
  const parseCsv = (text: string) => {
    const lines = text.trim().split(/\r\n|\n/);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle comma separation
      const values = line.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
      const obj: Record<string, string> = {};

      headers.forEach((h, index) => {
        obj[h] = values[index] !== undefined ? values[index] : '';
      });

      if (obj.symbolNumber || obj.name) {
        rows.push(obj);
      }
    }
    return rows;
  };

  const handleImport = async () => {
    setErrorMessage(null);
    setImportStatus(null);

    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      setErrorMessage('No valid rows found in CSV. Please check formatting or download the sample template.');
      return;
    }

    setIsImporting(true);
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          rows,
          defaultClass,
          defaultYear,
          defaultStream,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setImportStatus(`Successfully imported ${data.importedCount} student results with NEB grades calculated.`);
        onImportSuccess();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMessage(data.message || 'Failed to import student data.');
      }
    } catch (err: any) {
      setErrorMessage('Network error during import.');
    } finally {
      setIsImporting(false);
    }
  };

  const previewRows = parseCsv(csvText).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-amber-300" />
            <h2 className="font-bold text-base sm:text-lg">Batch Import Students from CSV / Excel</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {importStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* Download Sample Button */}
          <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
            <div>
              <div className="font-bold text-blue-950 text-xs">Standard CSV Template</div>
              <div className="text-[11px] text-blue-700">Pre-formatted columns for NEB grading</div>
            </div>
            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-100 text-blue-800 font-semibold rounded-lg text-xs border border-blue-300 transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Template (.CSV)
            </button>
          </div>

          {/* File input / Paste area */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 text-xs uppercase tracking-wider">
              Upload File or Paste CSV Text:
            </label>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer mb-2"
            />
            <textarea
              rows={5}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Or paste CSV rows directly here..."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Fallback Defaults */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <span className="text-slate-500 font-medium block mb-1">Default Class:</span>
              <select
                value={defaultClass}
                onChange={(e) => setDefaultClass(e.target.value)}
                className="w-full p-1.5 bg-white border border-slate-300 rounded font-medium text-xs"
              >
                <option value="Grade 12">Grade 12</option>
                <option value="Grade 11">Grade 11</option>
              </select>
            </div>
            <div>
              <span className="text-slate-500 font-medium block mb-1">Default Year:</span>
              <select
                value={defaultYear}
                onChange={(e) => setDefaultYear(e.target.value)}
                className="w-full p-1.5 bg-white border border-slate-300 rounded font-medium text-xs"
              >
                <option value="2081">2081 B.S.</option>
                <option value="2080">2080 B.S.</option>
              </select>
            </div>
            <div>
              <span className="text-slate-500 font-medium block mb-1">Default Stream:</span>
              <select
                value={defaultStream}
                onChange={(e) => setDefaultStream(e.target.value)}
                className="w-full p-1.5 bg-white border border-slate-300 rounded font-medium text-xs"
              >
                <option value="Science">Science</option>
                <option value="Management">Management</option>
              </select>
            </div>
          </div>

          {/* Preview parsed rows */}
          {previewRows.length > 0 && (
            <div>
              <div className="font-bold text-slate-700 text-xs mb-1">
                Detected Rows Preview ({parseCsv(csvText).length} total records):
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-36">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-1.5">Symbol</th>
                      <th className="p-1.5">Name</th>
                      <th className="p-1.5">DOB (BS)</th>
                      <th className="p-1.5">Class</th>
                      <th className="p-1.5">Stream</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {previewRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-1.5 font-mono font-bold text-blue-900">{r.symbolNumber}</td>
                        <td className="p-1.5">{r.name}</td>
                        <td className="p-1.5 font-mono">{r.dobBS}</td>
                        <td className="p-1.5">{r.classGrade || defaultClass}</td>
                        <td className="p-1.5">{r.stream || defaultStream}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white text-slate-700 font-semibold rounded-lg text-xs border border-slate-300 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={isImporting || !csvText.trim()}
            className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg text-xs shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isImporting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                Process & Calculate Results
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
