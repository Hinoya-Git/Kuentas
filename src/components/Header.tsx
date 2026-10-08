import React from 'react';
import { AlertCircle, BookOpen, Coffee, FileSpreadsheet, RotateCcw, Trash2, UserCheck } from 'lucide-react';
import { TaxpayerProfile } from '../types/index.ts';

interface HeaderProps {
  taxpayer: TaxpayerProfile;
  onOpenTaxpayerModal: () => void;
  onPromptResetSample: () => void;
  onPromptClearAll: () => void;
  onExportBackup: () => void;
  onOpenDonateModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  taxpayer,
  onOpenTaxpayerModal,
  onPromptResetSample,
  onPromptClearAll,
  onExportBackup,
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Brand Identity */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-emerald-800 text-amber-400 flex items-center justify-center font-serif text-2xl font-bold shadow-sm ring-1 ring-emerald-900/10 shrink-0">
              K
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-serif">
                  Kuentas
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  8% GIT Regime
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  v3.0 Local
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                Tax &amp; Books of Accounts Helper for Philippine Freelancers &amp; Self-Employed
              </p>
            </div>
          </div>

          {/* Quick Actions & Taxpayer Snippet */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Buy Me a Coffee Button */}
            <button
              type="button"
              onClick={onOpenDonateModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-md shadow-xs transition-colors border border-amber-500/40 print:hidden cursor-pointer"
              title="Send a GCash tip to support Kuentas"
            >
              <Coffee className="w-3.5 h-3.5 text-amber-950" />
              <span>Buy me a coffee</span>
            </button>

            {/* Taxpayer Profile Button */}
            <button
              type="button"
              onClick={onOpenTaxpayerModal}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-300 transition-colors shadow-xs"
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-md border border-slate-300 transition-colors"
              title="Backup your data as JSON file"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>Backup</span>
            </button>

            {/* Subtle Reset to Default Sample Data */}
            <button
              type="button"
              onClick={onPromptResetSample}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
              title="Load realistic Philippine freelancer sample data to evaluate calculations"
            >
              <RotateCcw className="w-3 h-3 text-emerald-700" />
              <span>Sample Data</span>
            </button>

            {/* Clear All Data */}
            <button
              type="button"
              onClick={onPromptClearAll}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md border border-red-200 transition-colors"
              title="Wipe all recorded transactions and reset application state"
            >
              <Trash2 className="w-3 h-3 text-red-600" />
              <span>Clear All</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
