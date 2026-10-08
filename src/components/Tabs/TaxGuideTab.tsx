import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileCheck2,
  HelpCircle,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { BIR1701QComputation, TaxpayerProfile } from '../../types/index.ts';
import { copyToClipboard, formatPHP, QUARTER_DETAILS } from '../../utils/formatters.ts';

interface TaxGuideTabProps {
  computation: BIR1701QComputation;
  taxpayer: TaxpayerProfile;
}

export const TaxGuideTab: React.FC<TaxGuideTabProps> = ({ computation, taxpayer }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const quarterInfo = QUARTER_DETAILS[computation.quarter];
  const isQ4 = computation.quarter === 'Q4';

  const handleCopy = async (boxId: string, value: number | string) => {
    const textToCopy = typeof value === 'number' ? value.toFixed(2) : value;
    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCopiedKey(boxId);
      setTimeout(() => setCopiedKey(null), 1800);
    }
  };

  const scheduleRows = [
    {
      box: 'Item 47',
      title: isQ4
        ? 'Q4 Gross Sales / Receipts (Oct – Dec)'
        : 'Current Quarter Gross Sales / Receipts',
      formula: 'Sum of all receipts received in the current quarter',
      source: `Calculated from ${computation.quarter} recorded transactions`,
      value: computation.item47_currentQuarterGross,
      isEditableInEBIR: true,
      highlight: false,
    },
    {
      box: 'Item 50',
      title: isQ4
        ? 'Add: Prior Quarters (Q1 + Q2 + Q3) Taxable Gross Sales/Receipts'
        : 'Add: Taxable Gross Sales/Receipts from Previous Quarter(s)',
      formula: computation.quarter === 'Q1' ? '₱ 0.00 (First Quarter)' : 'Cumulative gross from prior quarters',
      source: 'User cumulative input or prior quarter transactions',
      value: computation.item50_prevQuartersTaxableIncome,
      isEditableInEBIR: true,
      highlight: false,
    },
    {
      box: 'Item 51',
      title: isQ4
        ? 'Total Cumulative Full-Year Gross Sales / Receipts'
        : 'Total Cumulative Taxable Gross Sales / Receipts',
      formula: 'Item 47 + Item 50',
      source: isQ4 ? 'Total full calendar year gross income' : 'Cumulative gross income to date',
      value: computation.item51_totalCumulativeTaxableIncome,
      isEditableInEBIR: false,
      highlight: false,
    },
    {
      box: 'Item 52',
      title: 'Less: Statutory Deduction (Allowable Reduction)',
      formula: 'Standard ₱ 250,000.00 allowance under TRAIN Law Sec. 24(A)(2)(b)',
      source: 'Fixed statutory amount for purely self-employed/professionals',
      value: computation.item52_statutoryDeduction,
      isEditableInEBIR: false,
      highlight: false,
    },
    {
      box: 'Item 53',
      title: 'Net Taxable Income',
      formula: 'Math.max(0, Item 51 - Item 52)',
      source: 'Taxable base subject to 8% tax',
      value: computation.item53_netTaxableIncome,
      isEditableInEBIR: false,
      highlight: false,
    },
    {
      box: 'Item 54',
      title: 'Tax Due (8%)',
      formula: 'Item 53 × 8%',
      source: 'Gross Income Tax at 8% rate',
      value: computation.item54_taxDue8Percent,
      isEditableInEBIR: false,
      highlight: false,
    },
    {
      box: 'Item 56',
      title: isQ4
        ? 'Less: Total Tax Remitted in Previous Quarters (Q1 + Q2 + Q3)'
        : 'Less: Tax Remitted in Previous Quarter(s)',
      formula: computation.quarter === 'Q1' ? '₱ 0.00 (First Quarter)' : 'Tax payments previously made for prior quarters',
      source: 'Payments made on previous 1701Q returns',
      value: computation.item56_prevQuarterTaxPaid,
      isEditableInEBIR: true,
      highlight: false,
    },
    {
      box: 'Item 58',
      title: isQ4
        ? 'Less: Total Creditable Tax Withheld (BIR Form 2307)'
        : 'Less: Creditable Tax Withheld for Current Quarter (Form 2307)',
      formula: 'Total of withholding certificates issued by clients for this quarter',
      source: 'BIR Form 2307 certificates received',
      value: computation.item58_form2307Withheld,
      isEditableInEBIR: true,
      highlight: false,
    },
    {
      box: 'Item 63',
      title: isQ4
        ? 'Final Annual Tax Payable / (Overpayment)'
        : 'Net Tax Payable / (Overpayment)',
      formula: 'Item 54 - Item 56 - Item 58',
      source: 'Final balance due to BIR or overpayment credit',
      value: computation.item63_netTaxPayable,
      isEditableInEBIR: false,
      highlight: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Information Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                isQ4
                  ? 'text-amber-800 bg-amber-50 border-amber-300'
                  : 'text-emerald-800 bg-emerald-50 border-emerald-200'
              }`}>
                {isQ4 ? 'Form 1701A Annual' : 'Schedule II (1701Q)'}
              </span>
              <h2 className="text-base font-bold text-slate-900">
                {isQ4 ? 'BIR Form 1701A Cheat Sheet' : 'BIR Form 1701Q eBIRForms Cheat Sheet'}
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {isQ4
                ? 'Full-year final reconciliation for Philippine self-employed individuals and professionals under the 8% Gross Income Tax rate (TRAIN Law RA 10963). Filed annually on or before April 15.'
                : 'Exact box-by-box breakdown for purely self-employed and professionals opting for the 8% Gross Income Tax rate under the TRAIN Law.'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
            <div>
              <div className="font-semibold text-slate-800">
                {quarterInfo.name} Deadline: {quarterInfo.ebirFormDeadline}
              </div>
              <div className="text-[11px] text-slate-500">
                Applicable form: {quarterInfo.birForm}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Box-by-Box Cheat Sheet Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-800" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {isQ4
                ? 'BIR Form 1701A (Part V - 8% GIT Annual Reconciliation Table)'
                : 'Schedule II - 8% Income Tax Rate Computation Table'}
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Click "Copy" to paste numerical values directly into eBIRForms
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3 w-28">
                  BIR Box #
                </th>
                <th scope="col" className="px-4 py-3">
                  Description
                </th>
                <th scope="col" className="px-4 py-3 hidden md:table-cell">
                  Formula / Statutory Basis
                </th>
                <th scope="col" className="px-4 py-3 text-right w-44 font-mono">
                  Computed (PHP)
                </th>
                <th scope="col" className="px-3 py-3 text-center w-24">
                  Transcribe
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {scheduleRows.map((row) => {
                const isItem63 = row.box === 'Item 63';
                const isOverpayment = isItem63 && computation.isOverpayment;
                const isZeroDue = isItem63 && computation.item63_netTaxPayable === 0;

                return (
                  <tr
                    key={row.box}
                    className={`transition-colors ${
                      isItem63
                        ? isOverpayment
                          ? 'bg-emerald-50/50 hover:bg-emerald-50'
                          : isZeroDue
                          ? 'bg-slate-50/70 hover:bg-slate-50'
                          : 'bg-amber-50/50 hover:bg-amber-50'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Box number */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block font-mono text-xs font-bold px-2 py-0.5 rounded ${
                          isItem63
                            ? isOverpayment || isZeroDue
                              ? 'bg-emerald-200 text-emerald-950 font-black'
                              : 'bg-amber-200 text-amber-950 font-black'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {row.box}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3">
                      <div className={`font-semibold ${isItem63 ? 'text-slate-900 text-sm' : 'text-slate-800'}`}>
                        {row.title}
                      </div>
                      <div className="text-[11px] text-slate-500 md:hidden mt-0.5">
                        {row.formula}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {row.source}
                      </div>
                    </td>

                    {/* Formula */}
                    <td className="px-4 py-3 hidden md:table-cell text-slate-600 font-mono text-[11px]">
                      {row.formula}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 font-mono font-bold text-right whitespace-nowrap">
                      {isItem63 ? (
                        <div className="space-y-0.5">
                          <span
                            className={`text-sm ${
                              isOverpayment
                                ? 'text-emerald-700'
                                : isZeroDue
                                ? 'text-slate-700'
                                : 'text-amber-800'
                            }`}
                          >
                            {isOverpayment
                              ? `(${formatPHP(computation.overpaymentAmount)})`
                              : formatPHP(computation.item63_netTaxPayable)}
                          </span>
                          <span
                            className={`block text-[10px] font-sans font-semibold uppercase ${
                              isOverpayment
                                ? 'text-emerald-700'
                                : isZeroDue
                                ? 'text-slate-500'
                                : 'text-amber-700'
                            }`}
                          >
                            {isOverpayment
                              ? 'Overpayment Credit'
                              : isZeroDue
                              ? 'Zero Tax Due'
                              : 'Amount to Pay'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-900 text-xs">
                          {formatPHP(row.value)}
                        </span>
                      )}
                    </td>

                    {/* Copy action */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            row.box,
                            isItem63 && isOverpayment ? 0 : row.value
                          )
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded border transition-colors ${
                          copiedKey === row.box
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        title={`Copy ${row.box} value to clipboard`}
                      >
                        {copiedKey === row.box ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-500" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Highlight footer */}
        <div
          className={`p-4 border-t ${
            computation.isOverpayment
              ? 'bg-emerald-50/80 border-emerald-200'
              : computation.item63_netTaxPayable === 0
              ? 'bg-slate-50 border-slate-200'
              : 'bg-amber-50/90 border-amber-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-800">
                Summary for {computation.quarter} Tax Return:
              </span>
              {computation.isOverpayment ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Overpayment of {formatPHP(computation.overpaymentAmount)} (No tax due to pay)
                </span>
              ) : computation.item63_netTaxPayable === 0 ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-200 text-slate-800">
                  ₱ 0.00 Net Tax Due (File return even if zero tax)
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Net Tax Payable: {formatPHP(computation.item63_netTaxPayable)}
                </span>
              )}
            </div>

            <div className="text-xs text-slate-600">
              Taxpayer: <strong className="text-slate-900">{taxpayer.taxpayerName}</strong> (TIN: {taxpayer.tin})
            </div>
          </div>
        </div>
      </div>

      {/* eBIRForms Step-by-Step Filing Walkthrough */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step-by-Step Guide */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>How to File in Windows Offline eBIRForms</span>
          </h3>

          <ol className="space-y-3 text-xs text-slate-700">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                1
              </span>
              <div>
                <strong className="text-slate-900">
                  {isQ4 ? 'Select Form 1701A:' : 'Select Form 1701Q:'}
                </strong>{' '}
                In the eBIRForms offline package (v7.9.4.2+), choose{' '}
                <strong>
                  {isQ4
                    ? 'BIR Form 1701Av2018 (Annual Income Tax Return for Individuals Earning Purely from Business/Profession)'
                    : 'BIR Form 1701Qv2018 (Quarterly Income Tax Return for Individuals)'}
                </strong>
                .
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                2
              </span>
              <div>
                <strong className="text-slate-900">Choose Tax Rate:</strong> In Part II (Tax Relief / Rate Selection), mark <span className="font-mono font-semibold">8% in lieu of Graduated Rates</span>.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                3
              </span>
              <div>
                <strong className="text-slate-900">
                  {isQ4 ? 'Fill Annual Reconciliation Table:' : 'Fill Schedule II:'}
                </strong>{' '}
                Transcribe Item 47, Item 50, Item 56, and Item 58 from the cheat sheet above. The offline form auto-computes Item 51, 52, 53, 54, and 63.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                4
              </span>
              <div>
                <strong className="text-slate-900">Validate &amp; Submit:</strong> Click "Validate". When validated without errors, click <strong>"Submit / Final Copy"</strong>. Keep the BIR automated email tax confirmation.
              </div>
            </li>
          </ol>
        </div>

        {/* Critical BIR Compliance Reminders */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <span>Important 8% Regime Rules (TRAIN Law)</span>
          </h3>

          <ul className="space-y-2.5 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-emerald-700 font-bold">✓</span>
              <div>
                <strong>Zero-Tax Filing is Required:</strong> Even if Item 63 is ₱0.00 or an overpayment, you <strong>MUST</strong> still submit the return before the deadline to avoid BIR compromise penalties (₱1,000+ per late return).
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-700 font-bold">✓</span>
              <div>
                <strong>Exemption from 3% Percentage Tax:</strong> Under Section 116 as amended by TRAIN Law, 8% taxpayers are exempt from filing BIR Form 2551Q (Quarterly Percentage Tax).
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-700 font-bold">✓</span>
              <div>
                <strong>₱3,000,000 VAT Threshold:</strong> If your cumulative gross sales/receipts exceed ₱3M at any time during the year, you must register as VAT and shift to graduated rates.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-700 font-bold">✓</span>
              <div>
                <strong>Accredited Payment Channels:</strong> Pay tax due via Maya, GCash, Landbank Link.Biz, UnionBank Online, or BIR Authorized Agent Banks (AABs).
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
