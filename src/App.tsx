import React, { useState } from 'react';
import {
  BookOpen,
  Calculator,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Layers,
  Percent,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { Calculator1701Q } from './Calculator1701Q.tsx';
import { Calculator2551Q } from './Calculator2551Q.tsx';
import { SawtBuilder } from './SawtBuilder.tsx';

type MainModule = '1701Q' | '2551Q' | 'sawt';

export default function App() {
  const [activeModule, setActiveModule] = useState<MainModule>('1701Q');

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top App Module Navigation Bar */}
      <header className="bg-slate-950 text-white border-b border-slate-800 shadow-md sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 sm:py-0 sm:h-14 gap-2">
            {/* App Brand Header */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-amber-300 font-serif font-bold text-lg flex items-center justify-center shadow-xs">
                K
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-base tracking-wide text-white">
                    Kuentas
                  </span>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                    Tax Suite PH
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Philippine Freelancer &amp; Self-Employed Tax &amp; Books Helper
                </p>
              </div>
            </div>

            {/* Main Module Switcher Tabs */}
            <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto flex-nowrap pb-1 sm:pb-0 max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" aria-label="Main Modules">
              {/* Tab 1: 1701Q */}
              <button
                type="button"
                onClick={() => setActiveModule('1701Q')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  activeModule === '1701Q'
                    ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-emerald-300" />
                <span>BIR 1701Q (8% GIT)</span>
              </button>

              {/* Tab 2: 2551Q */}
              <button
                type="button"
                onClick={() => setActiveModule('2551Q')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  activeModule === '2551Q'
                    ? 'bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-400/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Percent className="w-3.5 h-3.5 text-indigo-300" />
                <span>BIR 2551Q (Percentage Tax)</span>
              </button>

              {/* Tab 3: SAWT */}
              <button
                type="button"
                onClick={() => setActiveModule('sawt')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  activeModule === 'sawt'
                    ? 'bg-sky-600 text-white shadow-xs ring-1 ring-sky-400/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-sky-300" />
                <span>SAWT Builder (Form 2307)</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Module Content */}
      <div className="flex-1">
        {activeModule === '1701Q' && <Calculator1701Q />}

        {activeModule === '2551Q' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Calculator2551Q />
          </div>
        )}

        {activeModule === 'sawt' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <SawtBuilder />
          </div>
        )}
      </div>

      {/* Footer for non-1701Q modules (1701Q has its own internal footer) */}
      {activeModule !== '1701Q' && (
        <footer className="border-t border-slate-200 bg-white py-6 mt-auto text-center text-xs text-slate-500 print:hidden">
          <div className="max-w-7xl mx-auto px-4 space-y-2">
            {/* Offline Privacy Badge */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                🔒 100% Client-Side &amp; Private: All numbers and TINs are stored solely in your browser's local cache. No data is ever transmitted to an external server.
              </span>
            </div>

            <p className="font-medium text-slate-700">
              Kuentas: Tax &amp; Books of Accounts Helper for Philippine Freelancers &amp; Self-Employed
            </p>
            <p className="text-[11px] text-slate-400">
              Compliant with TRAIN Law (RA 10963) · CREATE Law (RA 11534) · BIR Revenue Regulations · All data stays 100% private in your browser.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
