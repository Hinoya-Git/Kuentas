import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  DollarSign,
  FileCheck2,
  FileText,
  HelpCircle,
  Info,
  Layers,
  Percent,
  Receipt,
  RotateCcw,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import { Quarter } from './types/index.ts';
import { formatPHP, parseCleanNumber } from './utils/formatters.ts';

const PERCENTAGE_TAX_ATC_OPTIONS = [
  {
    code: 'PT010',
    description: 'Persons exempt from VAT under Sec. 116 (Standard Freelancers / Sole Proprietorships)',
    rate: 0.03,
    displayRate: '3%',
  },
  {
    code: 'PT040',
    description: 'Domestic carriers and keepers of garages (Sec. 117)',
    rate: 0.03,
    displayRate: '3%',
  },
  {
    code: 'PT060',
    description: 'Franchises on radio/TV broadcasting companies not VAT-registered (Sec. 119)',
    rate: 0.03,
    displayRate: '3%',
  },
];

const DEADLINES_2551Q: Record<Quarter, string> = {
  Q1: 'April 25',
  Q2: 'July 25',
  Q3: 'October 25',
  Q4: 'January 25 (following year)',
};

export interface QuarterInputs2551Q {
  grossSales: string;
  creditableWithholding: string;
  previouslyPaid: string;
  otherCredits: string;
}

const DEFAULT_QUARTER_DATA_2551Q: Record<Quarter, QuarterInputs2551Q> = {
  Q1: {
    grossSales: '150000',
    creditableWithholding: '0',
    previouslyPaid: '0',
    otherCredits: '0',
  },
  Q2: {
    grossSales: '0',
    creditableWithholding: '0',
    previouslyPaid: '0',
    otherCredits: '0',
  },
  Q3: {
    grossSales: '0',
    creditableWithholding: '0',
    previouslyPaid: '0',
    otherCredits: '0',
  },
  Q4: {
    grossSales: '0',
    creditableWithholding: '0',
    previouslyPaid: '0',
    otherCredits: '0',
  },
};

const STORAGE_KEY_2551Q = 'kuentas_2551q_inputs_v1';

export function Calculator2551Q() {
  const [quarter, setQuarter] = useState<Quarter>('Q1');
  const [year, setYear] = useState<number>(2026);
  const [selectedATC, setSelectedATC] = useState<string>('PT010');

  // Independent per-quarter input state
  const [quarterData, setQuarterData] = useState<Record<Quarter, QuarterInputs2551Q>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_2551Q);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          Q1: { ...DEFAULT_QUARTER_DATA_2551Q.Q1, ...(parsed.Q1 || {}) },
          Q2: { ...DEFAULT_QUARTER_DATA_2551Q.Q2, ...(parsed.Q2 || {}) },
          Q3: { ...DEFAULT_QUARTER_DATA_2551Q.Q3, ...(parsed.Q3 || {}) },
          Q4: { ...DEFAULT_QUARTER_DATA_2551Q.Q4, ...(parsed.Q4 || {}) },
        };
      }
    } catch {
      // fallback
    }
    return DEFAULT_QUARTER_DATA_2551Q;
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_2551Q, JSON.stringify(quarterData));
    } catch {
      // ignore
    }
  }, [quarterData]);

  // Current active quarter inputs
  const currentInputs = quarterData[quarter] || DEFAULT_QUARTER_DATA_2551Q[quarter];
  const grossSalesInput = currentInputs.grossSales;
  const creditableWithholdingInput = currentInputs.creditableWithholding;
  const previouslyPaidInput = currentInputs.previouslyPaid;
  const otherCreditsInput = currentInputs.otherCredits;

  const handleInputChange = (field: keyof QuarterInputs2551Q, value: string) => {
    setQuarterData((prev) => ({
      ...prev,
      [quarter]: {
        ...prev[quarter],
        [field]: value,
      },
    }));
  };

  // Feedback toast
  const [copiedBox, setCopiedBox] = useState<string | null>(null);

  const handleCopy = (boxId: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedBox(boxId);
    setTimeout(() => setCopiedBox(null), 2000);
  };

  const currentATC = useMemo(() => {
    return (
      PERCENTAGE_TAX_ATC_OPTIONS.find((opt) => opt.code === selectedATC) ||
      PERCENTAGE_TAX_ATC_OPTIONS[0]
    );
  }, [selectedATC]);

  // Numeric parsed calculations for the currently selected quarter
  const grossSales = parseCleanNumber(grossSalesInput);
  const taxRate = currentATC.rate;
  const taxDue = grossSales * taxRate;

  const creditableWithholding = parseCleanNumber(creditableWithholdingInput);
  const previouslyPaid = parseCleanNumber(previouslyPaidInput);
  const otherCredits = parseCleanNumber(otherCreditsInput);

  const totalCredits = creditableWithholding + previouslyPaid + otherCredits;
  const netTaxPayable = taxDue - totalCredits;

  // Annual cumulative totals across all 4 quarters
  const annualSummary = useMemo(() => {
    const quarters: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
    let totalGross = 0;
    let totalTaxDue = 0;
    let totalCreditsSum = 0;
    let totalNetPayable = 0;

    const breakdown = quarters.map((q) => {
      const qData = quarterData[q] || DEFAULT_QUARTER_DATA_2551Q[q];
      const g = parseCleanNumber(qData.grossSales);
      const due = g * taxRate;
      const c =
        parseCleanNumber(qData.creditableWithholding) +
        parseCleanNumber(qData.previouslyPaid) +
        parseCleanNumber(qData.otherCredits);
      const net = Math.max(0, due - c);

      totalGross += g;
      totalTaxDue += due;
      totalCreditsSum += c;
      totalNetPayable += net;

      return { quarter: q, gross: g, taxDue: due, credits: c, netPayable: net };
    });

    return { totalGross, totalTaxDue, totalCreditsSum, totalNetPayable, breakdown };
  }, [quarterData, taxRate]);

  const handleReset = () => {
    setQuarterData((prev) => ({
      ...prev,
      [quarter]: {
        grossSales: '0',
        creditableWithholding: '0',
        previouslyPaid: '0',
        otherCredits: '0',
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Context Notice */}
      <div className="bg-indigo-50/90 border border-indigo-200/80 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs font-semibold text-sm">
              2551Q
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-serif">
                  BIR Form 2551Q: Quarterly Percentage Tax Calculator
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-300">
                  Sec. 116 Non-VAT
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                For Philippine self-employed professionals, sole proprietors, and freelancers under the{' '}
                <strong>Graduated Income Tax rates (OIT/OSD)</strong> with gross annual receipts below PHP 3,000,000.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono bg-white px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-900 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Filing Deadline: <strong>{DEADLINES_2551Q[quarter]}</strong></span>
          </div>
        </div>

        {/* 8% GIT vs 2551Q Note */}
        <div className="mt-3 pt-3 border-t border-indigo-100 flex items-center gap-2 text-[11px] text-indigo-900">
          <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>
            <em>Did you know?</em> If you opted for the <strong>8% Gross Income Tax</strong> regime on BIR Form 1901/1701Q, you are <strong>100% EXEMPT</strong> from filing Form 2551Q (TRAIN Law RA 10963).
          </span>
        </div>
      </div>

      {/* Quarter & Global Selectors */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Taxable Quarter
            </label>
            <div className="inline-flex flex-wrap rounded-lg border border-slate-200 p-1 bg-slate-50 gap-1">
              {(['Q1', 'Q2', 'Q3', 'Q4'] as Quarter[]).map((q) => {
                const qGross = parseCleanNumber(quarterData[q]?.grossSales || '0');
                const hasData =
                  qGross > 0 ||
                  parseCleanNumber(quarterData[q]?.creditableWithholding || '0') > 0 ||
                  parseCleanNumber(quarterData[q]?.previouslyPaid || '0') > 0 ||
                  parseCleanNumber(quarterData[q]?.otherCredits || '0') > 0;
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuarter(q)}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                      quarter === q
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>{q}</span>
                    {hasData && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          quarter === q ? 'bg-amber-300' : 'bg-indigo-500'
                        }`}
                        title={`${q} has recorded data`}
                      />
                    )}
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
                onChange={(e) => setYear(Number(e.target.value))}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Alphanumeric Tax Code (ATC)
              </label>
              <select
                value={selectedATC}
                onChange={(e) => setSelectedATC(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {PERCENTAGE_TAX_ATC_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.code} ({opt.displayRate}) - {opt.description.substring(0, 40)}...
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="mt-5 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title={`Reset ${quarter} form fields to zero`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset {quarter}</span>
            </button>
          </div>
        </div>

        {/* Input Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {/* Gross Receipts */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Current Quarter Gross Receipts (PHP)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                PHP
              </span>
              <input
                type="text"
                value={grossSalesInput}
                onChange={(e) => handleInputChange('grossSales', e.target.value)}
                className="w-full pl-11 pr-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden"
                placeholder="0.00"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Total revenue collected in {quarter}</p>
          </div>

          {/* Form 2307 Creditable Percentage Tax */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Creditable Tax Withheld Form 2307 (PHP)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                PHP
              </span>
              <input
                type="text"
                value={creditableWithholdingInput}
                onChange={(e) => handleInputChange('creditableWithholding', e.target.value)}
                className="w-full pl-11 pr-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden"
                placeholder="0.00"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Item 18A (Part II Schedule 2)</p>
          </div>

          {/* Tax Paid in Return Previously Filed */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Tax Paid in Previously Filed Return (PHP)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                PHP
              </span>
              <input
                type="text"
                value={previouslyPaidInput}
                onChange={(e) => handleInputChange('previouslyPaid', e.target.value)}
                className="w-full pl-11 pr-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden"
                placeholder="0.00"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Item 18B (For amended returns)</p>
          </div>

          {/* Other Tax Credits */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Other Valid Tax Credits / Advance (PHP)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                PHP
              </span>
              <input
                type="text"
                value={otherCreditsInput}
                onChange={(e) => handleInputChange('otherCredits', e.target.value)}
                className="w-full pl-11 pr-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden"
                placeholder="0.00"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Item 18C (Special credits)</p>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Quarter Gross Sales</span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {formatPHP(grossSales)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Base for percentage tax</p>
        </div>

        {/* Rate Applied */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Tax Rate ({currentATC.code})</span>
            <Percent className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-700">
            {currentATC.displayRate}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Sec. 116 NIRC standard rate</p>
        </div>

        {/* Total Tax Due */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Total Tax Due</span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {formatPHP(taxDue)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Gross × {currentATC.displayRate}</p>
        </div>

        {/* Net Tax Payable */}
        <div
          className={`p-4 rounded-xl border shadow-xs ${
            netTaxPayable > 0
              ? 'bg-amber-50/80 border-amber-300 text-amber-950'
              : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span>Net Tax Payable (Item 20)</span>
            {netTaxPayable > 0 ? (
              <DollarSign className="w-4 h-4 text-amber-700" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            )}
          </div>
          <div className="text-xl font-bold font-mono">
            {formatPHP(Math.max(0, netTaxPayable))}
          </div>
          <p className="text-[11px] opacity-80 mt-1">
            {netTaxPayable <= 0
              ? 'Overpayment / Zero tax liability'
              : `To pay by ${DEADLINES_2551Q[quarter]}`}
          </p>
        </div>
      </div>

      {/* BIR Form 2551Q Box-by-Box Cheat Sheet Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 font-serif flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              <span>eBIRForms Form 2551Q Box-by-Box Cheat Sheet</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Copy these values directly into your offline Windows eBIRForms package for {quarter} {year}.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-800 self-start sm:self-auto">
            Part II: Computation of Tax
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-4 w-20">Box #</th>
                <th className="py-2.5 px-4">Line Description / Formula</th>
                <th className="py-2.5 px-4 w-28 text-center">ATC / Rate</th>
                <th className="py-2.5 px-4 w-44 text-right">Computed Amount</th>
                <th className="py-2.5 px-4 w-24 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {/* Box 14 */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-indigo-700">14</td>
                <td className="py-3 px-4">
                  <span className="font-semibold text-slate-900">Total Taxable Amount</span>
                  <span className="block text-[11px] text-slate-500">Gross Sales / Receipts for the quarter</span>
                </td>
                <td className="py-3 px-4 text-center font-mono text-slate-600">{currentATC.code}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                  {formatPHP(grossSales)}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleCopy('box14', grossSales.toFixed(2))}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] cursor-pointer"
                  >
                    {copiedBox === 'box14' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                    <span>{copiedBox === 'box14' ? 'Copied' : 'Copy'}</span>
                  </button>
                </td>
              </tr>

              {/* Box 15 / 16 */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-indigo-700">16</td>
                <td className="py-3 px-4">
                  <span className="font-semibold text-slate-900">Total Tax Due</span>
                  <span className="block text-[11px] text-slate-500">Taxable Amount × {currentATC.displayRate} tax rate</span>
                </td>
                <td className="py-3 px-4 text-center font-mono text-slate-600">{currentATC.displayRate}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                  {formatPHP(taxDue)}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleCopy('box16', taxDue.toFixed(2))}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] cursor-pointer"
                  >
                    {copiedBox === 'box16' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                    <span>{copiedBox === 'box16' ? 'Copied' : 'Copy'}</span>
                  </button>
                </td>
              </tr>

              {/* Box 18A */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-indigo-700">18A</td>
                <td className="py-3 px-4">
                  <span className="font-semibold text-slate-900">Creditable Percentage Tax Withheld</span>
                  <span className="block text-[11px] text-slate-500">BIR Form 2307 certificates from clients (ATC WB080)</span>
                </td>
                <td className="py-3 px-4 text-center font-mono text-slate-400">—</td>
                <td className="py-3 px-4 text-right font-mono text-slate-700">
                  {formatPHP(creditableWithholding)}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleCopy('box18a', creditableWithholding.toFixed(2))}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] cursor-pointer"
                  >
                    {copiedBox === 'box18a' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                    <span>{copiedBox === 'box18a' ? 'Copied' : 'Copy'}</span>
                  </button>
                </td>
              </tr>

              {/* Box 18B */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-indigo-700">18B</td>
                <td className="py-3 px-4">
                  <span className="font-semibold text-slate-900">Tax Paid in Return Previously Filed</span>
                  <span className="block text-[11px] text-slate-500">Applicable if filing an amended return</span>
                </td>
                <td className="py-3 px-4 text-center font-mono text-slate-400">—</td>
                <td className="py-3 px-4 text-right font-mono text-slate-700">
                  {formatPHP(previouslyPaid)}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleCopy('box18b', previouslyPaid.toFixed(2))}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] cursor-pointer"
                  >
                    {copiedBox === 'box18b' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                    <span>{copiedBox === 'box18b' ? 'Copied' : 'Copy'}</span>
                  </button>
                </td>
              </tr>

              {/* Box 19 */}
              <tr className="bg-slate-50/60 hover:bg-slate-100/60 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-indigo-700">19</td>
                <td className="py-3 px-4">
                  <span className="font-semibold text-slate-900">Total Tax Credits / Payments</span>
                  <span className="block text-[11px] text-slate-500">Sum of Boxes 18A + 18B + 18C</span>
                </td>
                <td className="py-3 px-4 text-center font-mono text-slate-400">—</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                  {formatPHP(totalCredits)}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleCopy('box19', totalCredits.toFixed(2))}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] cursor-pointer"
                  >
                    {copiedBox === 'box19' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                    <span>{copiedBox === 'box19' ? 'Copied' : 'Copy'}</span>
                  </button>
                </td>
              </tr>

              {/* Box 20: Net Tax Payable */}
              <tr className="bg-indigo-50/70 border-t-2 border-indigo-200 font-bold">
                <td className="py-3.5 px-4 font-mono text-indigo-900 text-sm">20</td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 text-sm">Net Tax Payable / (Overpayment)</span>
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-indigo-200 text-indigo-900">
                      Final Due
                    </span>
                  </div>
                  <span className="block text-[11px] text-slate-600 font-normal">
                    Box 16 (Total Tax Due) less Box 19 (Total Credits)
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-slate-500">—</td>
                <td className="py-3.5 px-4 text-right font-mono text-base text-indigo-950 font-bold">
                  {formatPHP(Math.max(0, netTaxPayable))}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleCopy('box20', Math.max(0, netTaxPayable).toFixed(2))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    {copiedBox === 'box20' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBox === 'box20' ? 'Copied' : 'Copy'}</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4-Quarter Year-to-Date Annual Overview & VAT Threshold */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 font-serif flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>{year} Annual 4-Quarter Overview &amp; Sec. 116 Threshold</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cumulative view across all quarters. Click any quarter card to load its details into the calculator.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Total Annual Gross:</span>
            <span className="font-mono font-bold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
              {formatPHP(annualSummary.totalGross)}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* VAT Threshold Meter (PHP 3,000,000 max under Sec. 116) */}
          <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                <span>Annual Sec. 116 Non-VAT Limit (PHP 3,000,000 Threshold)</span>
              </span>
              <span className="font-mono font-bold text-slate-900">
                {((annualSummary.totalGross / 3000000) * 100).toFixed(1)}% utilized ({formatPHP(annualSummary.totalGross)} / PHP 3,000,000)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  annualSummary.totalGross > 3000000
                    ? 'bg-red-500'
                    : annualSummary.totalGross > 2400000
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(100, (annualSummary.totalGross / 3000000) * 100)}%` }}
              />
            </div>
            {annualSummary.totalGross > 3000000 && (
              <p className="text-[11px] text-red-600 font-semibold mt-2">
                Warning: Total receipts have breached PHP 3,000,000. Under Sec. 116 NIRC, you are required to register for VAT within the month following the breach.
              </p>
            )}
          </div>

          {/* 4 Quarters Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {annualSummary.breakdown.map((item) => {
              const isSelected = item.quarter === quarter;
              return (
                <div
                  key={item.quarter}
                  onClick={() => setQuarter(item.quarter)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                      {item.quarter} {year}
                    </span>
                    {isSelected ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 hover:text-indigo-600">
                        Select →
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Gross Sales:</span>
                      <span className="font-mono font-semibold text-slate-900">{formatPHP(item.gross)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Credits (18A-C):</span>
                      <span className="font-mono text-slate-700">{formatPHP(item.credits)}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold">
                      <span className="text-slate-700">Net Due:</span>
                      <span className="font-mono text-indigo-700">{formatPHP(item.netPayable)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Helpful Guidelines Card */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          <span>Filing Tips for BIR Form 2551Q</span>
        </h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Frequency:</strong> Filed quarterly via eBIRForms on or before the 25th day of the month following the close of each taxable quarter.
          </li>
          <li>
            <strong>Attachment:</strong> If claiming creditable withholding tax (Item 18A), you must attach copies of BIR Form 2307 and submit your SAWT (Summary Alphanumeric Withholding Tax) via eAFS or email.
          </li>
          <li>
            <strong>Payment:</strong> Pay any balance due through BIR online payment channels (e.g., LandBank Link.BizPortal, Maya, GCash BIR Tax Payment, UnionBank Online).
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Calculator2551Q;
