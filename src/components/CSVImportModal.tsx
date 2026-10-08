import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronRight, FileSpreadsheet, FileUp, Info, UploadCloud, X } from 'lucide-react';
import { CSVColumnMapping, Quarter, Transaction } from '../types/index.ts';
import { convertRowsToTransactions, guessColumnMapping, parseCSVText } from '../utils/csvParser.ts';
import { formatPHP } from '../utils/formatters.ts';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newTransactions: Transaction[], mode: 'append' | 'replace') => void;
  defaultQuarter: Quarter;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  defaultQuarter,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvRaw, setCsvRaw] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<CSVColumnMapping>({
    dateColumn: '',
    payorColumn: '',
    refColumn: '',
    amountColumn: '',
  });
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [targetQuarter, setTargetQuarter] = useState<Quarter | 'auto'>('auto');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [step, setStep] = useState<'upload' | 'map'>('upload');

  if (!isOpen) return null;

  const handleFileProcess = (fileObj: File) => {
    setErrorMessage('');
    if (!fileObj.name.endsWith('.csv') && !fileObj.type.includes('csv') && !fileObj.type.includes('text')) {
      setErrorMessage('Please select a valid CSV (.csv) file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text || text.trim().length === 0) {
          setErrorMessage('The selected CSV file is empty.');
          return;
        }

        const { headers: detectedHeaders, rows: detectedRows } = parseCSVText(text);

        if (detectedHeaders.length === 0 || detectedRows.length === 0) {
          setErrorMessage('Could not extract any data rows from the CSV file. Please check its formatting.');
          return;
        }

        setFile(fileObj);
        setCsvRaw(text);
        setHeaders(detectedHeaders);
        setParsedRows(detectedRows);

        // Guess initial column mapping
        const guessed = guessColumnMapping(detectedHeaders);
        setMapping(guessed);
        setStep('map');
      } catch (err: any) {
        setErrorMessage(`Failed to read CSV: ${err.message || 'Unknown parsing error'}`);
      }
    };
    reader.readAsText(fileObj);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleLoadSampleCSV = () => {
    const sampleCSVContent = `Date,Client / Description,Invoice Number,Gross Amount,Notes
2026-01-20,Apex Fintech PH,INV-2026-101,135000.00,Backend Go API
2026-02-14,Velocity Labs Inc (US),WIRE-7732,180000.00,Fullstack React/Node
2026-03-05,Kreativ Studio Sydney,INV-2026-102,95000.00,UI UX Design Tokens
2026-03-22,Bayan Micro Lending,INV-2026-103,110000.00,Security audit`;

    const blob = new Blob([sampleCSVContent], { type: 'text/csv' });
    const dummyFile = new File([blob], 'sample_freelance_inflows.csv', { type: 'text/csv' });
    handleFileProcess(dummyFile);
  };

  const handleConfirmImport = () => {
    if (!mapping.dateColumn || !mapping.payorColumn || !mapping.amountColumn) {
      setErrorMessage('Please map at least Date, Client/Payor, and Gross Amount columns.');
      return;
    }

    const quarterParam = targetQuarter === 'auto' ? undefined : targetQuarter;
    const converted = convertRowsToTransactions(parsedRows, mapping, quarterParam);

    if (converted.length === 0) {
      setErrorMessage('No valid transactions could be extracted with the selected mapping.');
      return;
    }

    onImport(converted, importMode);
    onClose();
  };

  // Preview the first 3 converted rows
  const previewConverted = step === 'map' && mapping.dateColumn && mapping.amountColumn
    ? convertRowsToTransactions(parsedRows.slice(0, 3), mapping, targetQuarter === 'auto' ? undefined : targetQuarter)
    : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Import Inflow Transactions from CSV
              </h3>
              <p className="text-xs text-slate-500">
                Supports Wise, PayPal, Upwork, GCash, Maya, and Philippine bank statement exports.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'upload' ? (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-xl p-8 text-center transition-colors bg-slate-50/50 hover:bg-emerald-50/20 cursor-pointer"
                onClick={() => document.getElementById('csv-file-input')?.click()}
              >
                <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-800">
                  Drop your CSV file here or <span className="text-emerald-700 underline">browse</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  100% processed directly in your browser. No files are uploaded to any server.
                </p>
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  Don't have a CSV handy right now?
                </span>
                <button
                  type="button"
                  onClick={handleLoadSampleCSV}
                  className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline"
                >
                  Load Sample CSV Template (4 Rows)
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* File Info */}
              <div className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span className="font-semibold text-slate-800">{file?.name || 'Uploaded CSV'}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-600">{parsedRows.length} data rows found</span>
                </div>
                <button
                  onClick={() => {
                    setStep('upload');
                    setFile(null);
                  }}
                  className="text-emerald-700 hover:underline font-medium text-[11px]"
                >
                  Change file
                </button>
              </div>

              {/* Column Mapping Form */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  1. Map CSV Columns to Journal Fields
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/60 p-3 rounded-lg border border-slate-200">
                  {/* Date Column */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Date Column <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={mapping.dateColumn}
                      onChange={(e) => setMapping({ ...mapping, dateColumn: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-300 bg-white"
                    >
                      <option value="">-- Select Column --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payor Column */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Payor / Client Column <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={mapping.payorColumn}
                      onChange={(e) => setMapping({ ...mapping, payorColumn: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                    >
                      <option value="">-- Select Column --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reference Column */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Invoice / OR # Column
                    </label>
                    <select
                      value={mapping.refColumn}
                      onChange={(e) => setMapping({ ...mapping, refColumn: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-300 bg-white"
                    >
                      <option value="">-- Auto-generate if empty --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount Column */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Gross Amount Column <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={mapping.amountColumn}
                      onChange={(e) => setMapping({ ...mapping, amountColumn: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-semibold rounded border border-slate-300 bg-white text-emerald-900"
                    >
                      <option value="">-- Select Column --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Import Destination & Mode */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  2. Import Settings
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Target Quarter
                    </label>
                    <select
                      value={targetQuarter}
                      onChange={(e) => setTargetQuarter(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                    >
                      <option value="auto">Auto-detect quarter from Date</option>
                      <option value="Q1">Assign all to Q1 (Jan - Mar)</option>
                      <option value="Q2">Assign all to Q2 (Apr - Jun)</option>
                      <option value="Q3">Assign all to Q3 (Jul - Sep)</option>
                      <option value="Q4">Assign all to Q4 (Oct - Dec)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Ledger Insertion Mode
                    </label>
                    <div className="flex items-center gap-3 mt-1.5">
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                          className="text-emerald-700 focus:ring-emerald-600"
                        />
                        <span>Append to existing</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="text-emerald-700 focus:ring-emerald-600"
                        />
                        <span>Replace existing in quarter</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview of first rows */}
              {previewConverted.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Preview Parsed Records (First {previewConverted.length} Rows)</span>
                    <span className="text-[11px] text-emerald-700 font-normal">
                      Looks accurate
                    </span>
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-100 text-slate-700 text-[11px]">
                        <tr>
                          <th className="px-3 py-1.5 text-left font-semibold">Date</th>
                          <th className="px-3 py-1.5 text-left font-semibold">Client / Payor</th>
                          <th className="px-3 py-1.5 text-left font-semibold">Ref #</th>
                          <th className="px-3 py-1.5 text-right font-semibold">Gross (PHP)</th>
                          <th className="px-3 py-1.5 text-center font-semibold">Quarter</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {previewConverted.map((t, i) => (
                          <tr key={i}>
                            <td className="px-3 py-1.5 font-mono text-[11px]">{t.date}</td>
                            <td className="px-3 py-1.5 font-medium text-slate-800">{t.payor}</td>
                            <td className="px-3 py-1.5 font-mono text-[11px] text-slate-500">{t.reference}</td>
                            <td className="px-3 py-1.5 font-mono font-semibold text-right text-emerald-800">
                              {formatPHP(t.amount)}
                            </td>
                            <td className="px-3 py-1.5 text-center font-mono font-bold text-slate-600">
                              {t.quarter}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 rounded-md"
          >
            Cancel
          </button>
          {step === 'map' && (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-md shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Import {parsedRows.length} Transactions</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
