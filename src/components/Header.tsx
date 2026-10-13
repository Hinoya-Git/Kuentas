import React from 'react';
import { AlertCircle, BookOpen, Coffee, FileSpreadsheet, FolderUp, RotateCcw, Trash2, UserCheck } from 'lucide-react';
import { TaxpayerProfile } from '../types/index.ts';

interface HeaderProps {
  taxpayer: TaxpayerProfile;
  onOpenTaxpayerModal: () => void;
  onPromptResetSample: () => void;
  onPromptClearAll: () => void;
  onExportBackup: () => void;
  onRestoreBackup: () => void;
  onOpenDonateModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  taxpayer,
  onOpenTaxpayerModal,
  onPromptResetSample,
  onPromptClearAll,
  onExportBackup,
  onRestoreBackup,
  onOpenDonateModal,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white print:hidden">
      {/* Top Compliance & Legal Disclaimer Banner */}
      <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-semibold tracking-wide">LEGAL COMPLIANCE NOTICE:</span>
            <span>
              For computation and reference only. File and pay through official BIR eBIRForms and accredited payment channels.
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-amber-800/90 font-mono text-[11px]">
            <span>TRAIN Law RA 10963</span>
            <span>·</span>
            <span>BIR Form 1701Q / 1701A</span>
          </div>
        </div>
      </div>

      {/* Main App Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Brand Identity / Module Subtitle */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-semibold text-sm shadow-xs shrink-0">
              1701Q
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 font-serif">
                  BIR Form 1701Q: 8% Gross Income Tax Calculator
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  8% GIT Regime
                </span>
                <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                  TRAIN Law RA 10963
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Tax &amp; Books of Accounts Helper for Philippine Freelancers &amp; Self-Employed Professionals
              </p>
            </div>
          </div>

          {/* Quick Actions & Taxpayer Snippet */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Buy Me a Coffee Button */}
            <button
              type="button"
              onClick={onOpenDonateModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-lg shadow-2xs transition-colors border border-amber-500/40 print:hidden cursor-pointer"
              title="Send a GCash tip to support Kuentas"
            >
              <Coffee className="w-3.5 h-3.5 text-amber-950" />
              <span>Buy me a coffee</span>
            </button>

            {/* Taxpayer Profile Button */}
            <button
              type="button"
              onClick={onOpenTaxpayerModal}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 transition-colors shadow-2xs cursor-pointer"
              title="Edit BIR Registration Details (Name, TIN, RDO)"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
              <div className="text-left">
                <span className="block font-semibold truncate max-w-[130px] sm:max-w-[160px]">
                  {taxpayer.taxpayerName || 'Set Taxpayer Details'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block">
                  TIN: {taxpayer.tin || 'Unregistered'}
                </span>
              </div>
            </button>

            {/* Backup Export */}
            <button
              type="button"
              onClick={onExportBackup}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 transition-colors shadow-2xs cursor-pointer"
              title="Backup your data as JSON file"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>Backup</span>
            </button>

            {/* Restore Backup */}
            <button
              type="button"
              onClick={onRestoreBackup}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 transition-colors shadow-2xs cursor-pointer"
              title="Restore data from Kuentas JSON backup file"
            >
              <FolderUp className="w-3.5 h-3.5 text-slate-500" />
              <span>Restore Backup</span>
            </button>

            {/* Subtle Reset to Default Sample Data */}
            <button
              type="button"
              onClick={onPromptResetSample}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
              title="Load realistic Philippine freelancer sample data to evaluate calculations"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
              <span>Sample Data</span>
            </button>

            {/* Clear All Data */}
            <button
              type="button"
              onClick={onPromptClearAll}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors cursor-pointer"
              title="Wipe all recorded transactions and reset application state"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Clear All</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
