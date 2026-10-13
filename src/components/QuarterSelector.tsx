import React from 'react';
import { Calendar, HelpCircle, RefreshCw, ShieldAlert } from 'lucide-react';
import { Quarter, QuarterSettings } from '../types/index.ts';
import { formatPHP, parseCleanNumber, QUARTER_DETAILS } from '../utils/formatters.ts';
import { InfoTooltip } from './InfoTooltip.tsx';

interface QuarterSelectorProps {
  currentQuarter: Quarter;
  onQuarterChange: (quarter: Quarter) => void;
  year: number;
  onYearChange: (year: number) => void;
  settings: QuarterSettings;
  onUpdateSettings: (updated: Partial<QuarterSettings>) => void;
  priorQuarterCalculatedGross: number;
  currentQuarterCalculated2307: number;
}

export const QuarterSelector: React.FC<QuarterSelectorProps> = ({
  currentQuarter,
  onQuarterChange,
  year,
  onYearChange,
  settings,
  onUpdateSettings,
  priorQuarterCalculatedGross,
  currentQuarterCalculated2307,
}) => {
  const currentInfo = QUARTER_DETAILS[currentQuarter];
  const quarters: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  const isQ4 = currentQuarter === 'Q4';

  const handleNumericChange = (field: keyof QuarterSettings, rawValue: string) => {
    const val = parseCleanNumber(rawValue);
    onUpdateSettings({ [field]: val });
  };

  const handleAutoFillPriorGross = () => {
    onUpdateSettings({ prevQuarterTaxableIncome: priorQuarterCalculatedGross });
  };

  const handleAutoFill2307 = () => {
    onUpdateSettings({ currentQuarter2307Withheld: currentQuarterCalculated2307 });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 mb-6 print:hidden">
      {/* Quarter Switcher Tabs & Year */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
            Taxable Quarter
          </label>
          <div className="inline-flex flex-wrap rounded-lg border border-slate-200 p-1 bg-slate-50 gap-1">
            {quarters.map((q) => {
              const isActive = currentQuarter === q;
              const isQuarter4 = q === 'Q4';
              return (
                <button
                  key={q}
                  type="button"
                  onClick={() => onQuarterChange(q)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {isQuarter4 ? 'Q4 / Annual' : q}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Calendar Year
            </label>
            <select
              value={year}
              onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden sm:block">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Form / Deadline
            </span>
            <div className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-700 shadow-2xs">
              {currentInfo.birForm} · Due {currentInfo.ebirFormDeadline}
            </div>
          </div>
        </div>
      </div>

      {/* Cumulative BIR Form Inputs */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {isQ4
                ? 'BIR Form 1701A Annual Reconciliation Inputs'
                : 'BIR Form 1701Q Cumulative Adjustment Inputs'}
            </h3>
            <span className="text-[11px] text-slate-500">
              {isQ4
                ? '(Reconciles Q1–Q3 prior filings with Q4 to complete your Annual Income Tax Return)'
                : '(Cumulative adjustments for accurate 8% GIT computation)'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Input 1: Item 50 Previous Quarters Taxable Income */}
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200">
            <div className="flex items-start justify-between gap-1 mb-1.5">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                  <span className="font-mono text-emerald-700 font-bold">Item 50:</span>
                  <span>Prior Quarters' Income</span>
                </label>
                <InfoTooltip
                  itemCode="Item 50"
                  title="Prior Quarters' Gross Income"
                  content="The BIR 8% regime calculates income tax cumulatively across the calendar year. In Q1, this is ₱0.00. For Q2, Q3, and Q4, enter the total cumulative gross revenue you already reported on your previous 1701Q returns this year."
                  tip="Click 'Auto-fill' to automatically sum prior quarters' recorded transactions."
                />
              </div>

              {currentQuarter !== 'Q1' && priorQuarterCalculatedGross > 0 && (
                <button
                  type="button"
                  onClick={handleAutoFillPriorGross}
                  className="text-[10px] text-emerald-700 hover:text-emerald-900 font-medium inline-flex items-center gap-0.5 underline cursor-pointer"
                  title={`Auto-fill from prior quarter transactions: ${formatPHP(priorQuarterCalculatedGross)}`}
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  Auto-fill ({formatPHP(priorQuarterCalculatedGross, { showCents: false })})
                </button>
              )}
            </div>

            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                PHP
              </span>
              <input
                type="number"
                min="0"
                step="any"
                disabled={currentQuarter === 'Q1'}
                value={currentQuarter === 'Q1' ? 0 : settings.prevQuarterTaxableIncome || ''}
                onChange={(e) => handleNumericChange('prevQuarterTaxableIncome', e.target.value)}
                placeholder={currentQuarter === 'Q1' ? '0.00 (N/A for Q1)' : '0.00'}
                className="w-full pl-11 pr-3 py-2 text-xs font-mono font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {currentQuarter === 'Q1'
                ? 'Item 50 is always ₱0.00 on 1st Quarter returns.'
                : isQ4
                ? 'Cumulative gross receipts declared in Q1, Q2, and Q3 returns.'
                : 'Cumulative gross income reported in previous quarter(s) of this year.'}
            </p>
          </div>

          {/* Input 2: Item 56 Tax Remitted in Previous Quarters */}
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200">
            <div className="flex items-start justify-between gap-1 mb-1.5">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                  <span className="font-mono text-emerald-700 font-bold">Item 56:</span>
                  <span>Prior Quarters' Tax Paid</span>
                </label>
                <InfoTooltip
                  itemCode="Item 56"
                  title="Prior Quarters' Tax Remitted"
                  content="Enter the total income tax payments you actually remitted to the BIR for previous quarters of this taxable year (e.g. tax payments made on your Q1, Q2, and Q3 1701Q returns). This prevents double taxation by deducting what you've already paid."
                  tip="Check your BIR electronic confirmation receipts or bank payment slips from prior quarters."
                />
              </div>
            </div>

            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                PHP
              </span>
              <input
                type="number"
                min="0"
                step="any"
                disabled={currentQuarter === 'Q1'}
                value={currentQuarter === 'Q1' ? 0 : settings.prevQuarterTaxPaid || ''}
                onChange={(e) => handleNumericChange('prevQuarterTaxPaid', e.target.value)}
                placeholder={currentQuarter === 'Q1' ? '0.00 (N/A for Q1)' : '0.00'}
                className="w-full pl-11 pr-3 py-2 text-xs font-mono font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {currentQuarter === 'Q1'
                ? 'No prior quarters in Q1.'
                : isQ4
                ? 'Total 8% taxes already paid on Q1, Q2, and Q3 returns.'
                : 'Total tax payments made to BIR in prior quarters of this taxable year.'}
            </p>
          </div>

          {/* Input 3: Item 58 Form 2307 Creditable Tax Withheld */}
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200">
            <div className="flex items-start justify-between gap-1 mb-1.5">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                  <span className="font-mono text-emerald-700 font-bold">Item 58:</span>
                  <span>Form 2307 Withheld</span>
                </label>
                <InfoTooltip
                  itemCode="Item 58"
                  title="Form 2307 Creditable Tax Withheld"
                  content="Represents creditable taxes withheld by Philippine domestic clients who provided you with signed BIR Form 2307 certificates (typically 5% or 10% on professional fees). This amount directly reduces your net tax payable peso-for-peso."
                  tip="Foreign clients (Upwork, Wise, Stripe, overseas companies) do not withhold Philippine Form 2307."
                />
              </div>

              {currentQuarterCalculated2307 > 0 && (
                <button
                  type="button"
                  onClick={handleAutoFill2307}
                  className="text-[10px] text-emerald-700 hover:text-emerald-900 font-medium inline-flex items-center gap-0.5 underline cursor-pointer"
                  title={`Auto-fill from transactions: ${formatPHP(currentQuarterCalculated2307)}`}
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  Auto-fill ({formatPHP(currentQuarterCalculated2307, { showCents: false })})
                </button>
              )}
            </div>

            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                PHP
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={settings.currentQuarter2307Withheld || ''}
                onChange={(e) => handleNumericChange('currentQuarter2307Withheld', e.target.value)}
                placeholder="0.00"
                className="w-full pl-11 pr-3 py-2 text-xs font-mono font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Creditable tax withheld by domestic withholding agents (Certificate BIR Form 2307).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
