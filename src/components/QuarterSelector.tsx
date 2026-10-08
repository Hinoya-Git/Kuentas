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
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 sm:p-5 mb-6 print:hidden">
      {/* Quarter Switcher Tabs & Year */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tax Period Selector
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-emerald-700 font-medium">
              Taxable Year {year}
            </span>
            {isQ4 && (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded uppercase">
                Annual Filing
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <h2 className="text-lg font-bold text-slate-900">
              {currentInfo.name}
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
              Due: {currentInfo.ebirFormDeadline}
            </span>
          </div>
        </div>

        {/* Quarter Selection Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50">
            {quarters.map((q) => {
              const info = QUARTER_DETAILS[q];
              const isActive = currentQuarter === q;
              const isQuarter4 = q === 'Q4';
              return (
                <button
                  key={q}
                  type="button"
                  onClick={() => onQuarterChange(q)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    isActive
                      ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <span className="block sm:inline">
                    {isQuarter4 ? 'Q4 / Annual' : q}
                  </span>
                  <span className="hidden sm:inline text-[11px] text-slate-400 ml-1">
                    {isQuarter4 ? '(Form 1701A)' : `(${info.period.split('–')[0].trim()})`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Year selector */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={year}
              onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value={2026}>TY 2026</option>
              <option value={2025}>TY 2025</option>
              <option value={2024}>TY 2024</option>
              <option value={2027}>TY 2027</option>
            </select>
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
          <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-200">
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
                  className="text-[10px] text-emerald-700 hover:text-emerald-900 font-medium inline-flex items-center gap-0.5 underline"
                  title={`Auto-fill from prior quarter transactions: ${formatPHP(priorQuarterCalculatedGross)}`}
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  Auto-fill ({formatPHP(priorQuarterCalculatedGross, { showCents: false })})
                </button>
              )}
            </div>

            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 font-serif text-xs">
                ₱
              </span>
              <input
                type="number"
                min="0"
                step="any"
                disabled={currentQuarter === 'Q1'}
                value={currentQuarter === 'Q1' ? 0 : settings.prevQuarterTaxableIncome || ''}
                onChange={(e) => handleNumericChange('prevQuarterTaxableIncome', e.target.value)}
                placeholder={currentQuarter === 'Q1' ? '0.00 (N/A for Q1)' : '0.00'}
                className="w-full pl-7 pr-3 py-1.5 text-xs font-mono font-medium rounded border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:bg-slate-100 disabled:text-slate-400"
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
          <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-200">
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
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 font-serif text-xs">
                ₱
              </span>
              <input
                type="number"
                min="0"
                step="any"
                disabled={currentQuarter === 'Q1'}
                value={currentQuarter === 'Q1' ? 0 : settings.prevQuarterTaxPaid || ''}
                onChange={(e) => handleNumericChange('prevQuarterTaxPaid', e.target.value)}
                placeholder={currentQuarter === 'Q1' ? '0.00 (N/A for Q1)' : '0.00'}
                className="w-full pl-7 pr-3 py-1.5 text-xs font-mono font-medium rounded border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:bg-slate-100 disabled:text-slate-400"
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
          <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-200">
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
                  className="text-[10px] text-emerald-700 hover:text-emerald-900 font-medium inline-flex items-center gap-0.5 underline"
                  title={`Auto-fill from transactions: ${formatPHP(currentQuarterCalculated2307)}`}
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  Auto-fill ({formatPHP(currentQuarterCalculated2307, { showCents: false })})
                </button>
              )}
            </div>

            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 font-serif text-xs">
                ₱
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={settings.currentQuarter2307Withheld || ''}
                onChange={(e) => handleNumericChange('currentQuarter2307Withheld', e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-1.5 text-xs font-mono font-medium rounded border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
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
