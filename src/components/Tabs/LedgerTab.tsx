import React, { useRef, useState } from 'react';
import {
  BookCheck,
  CheckCircle,
  FileDown,
  FileText,
  Filter,
  Info,
  Maximize2,
  Printer,
  Sparkles,
} from 'lucide-react';
import { Quarter, TaxpayerProfile, Transaction } from '../../types/index.ts';
import { exportJournalToDOC, exportJournalToPDF, triggerSandboxResilientPrint } from '../../utils/documentExport.ts';
import { formatDisplayDate, formatPHP, QUARTER_DETAILS } from '../../utils/formatters.ts';

interface LedgerTabProps {
  transactions: Transaction[];
  quarter: Quarter;
  year: number;
  taxpayer: TaxpayerProfile;
  onOpenTaxpayerModal: () => void;
}

export const LedgerTab: React.FC<LedgerTabProps> = ({
  transactions,
  quarter,
  year,
  taxpayer,
  onOpenTaxpayerModal,
}) => {
  const [viewScope, setViewScope] = useState<'quarter' | 'year'>('quarter');
  const [emptyRowCount, setEmptyRowCount] = useState<number>(6); // at least 5 placeholder rows
  const journalContainerRef = useRef<HTMLDivElement>(null);

  // Filter transactions based on viewScope
  const activeTransactions =
    viewScope === 'quarter'
      ? transactions.filter((t) => t.quarter === quarter)
      : [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  const totalDebit = activeTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalCredit = activeTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);

  const quarterInfo = QUARTER_DETAILS[quarter];

  // Direct PDF export trigger (A4 Landscape, vector, filename: Kuentas_Cash_Receipts_Journal_Q[Quarter].pdf)
  const handleExportPDF = () => {
    exportJournalToPDF({
      transactions,
      quarter,
      year,
      taxpayer,
      emptyRowCount,
      viewScope,
    });
  };

  // Direct DOC export trigger (Editable Word-compatible document)
  const handleExportDOC = () => {
    exportJournalToDOC({
      transactions,
      quarter,
      year,
      taxpayer,
      emptyRowCount,
      viewScope,
    });
  };

  // Sandbox-resilient print trigger
  const handlePrint = () => {
    const containerHtml = journalContainerRef.current?.innerHTML || '';
    const periodText =
      viewScope === 'quarter'
        ? `${quarterInfo.name} (${year})`
        : `Calendar Year ${year} (Full Ledger)`;

    triggerSandboxResilientPrint(
      containerHtml,
      taxpayer.taxpayerName,
      periodText,
      () => {
        // Fallback when window.print() and window.open are both blocked in an iframe sandbox
        handleExportPDF();
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Interactive Controls (Hidden during print) */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              Cash Receipts Journal (Books of Accounts)
            </h2>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Single-Entry Columnar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Formatted to match BIR-registered physical columnar notebooks for transcription, archiving, or filing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Scope Selector */}
          <div className="inline-flex rounded-md border border-slate-300 p-0.5 bg-slate-50 text-xs">
            <button
              type="button"
              onClick={() => setViewScope('quarter')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                viewScope === 'quarter'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {quarter} Only
            </button>
            <button
              type="button"
              onClick={() => setViewScope('year')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                viewScope === 'year'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Full Year {year}
            </button>
          </div>

          {/* Edit Taxpayer details shortcut */}
          <button
            type="button"
            onClick={onOpenTaxpayerModal}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
            title="Edit taxpayer name, TIN, and RDO in the journal header"
          >
            Header Details
          </button>

          {/* 1. Direct PDF Export Button */}
          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-md shadow-xs transition-colors"
            title={`Download pre-formatted A4 vector PDF directly (Kuentas_Cash_Receipts_Journal_Q${quarter}.pdf)`}
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Download Journal PDF</span>
          </button>

          {/* 2. Editable Word / DOC Export Button */}
          <button
            type="button"
            onClick={handleExportDOC}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
            title={`Export editable Word document (.doc) with full journal header and table (Kuentas_Cash_Receipts_Journal_Q${quarter}.doc)`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-700" />
            <span>Export as DOC</span>
          </button>

          {/* 3. Sandbox-Resilient Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
            title="Print or Save as PDF via system dialog (with sandbox-resilient new tab fallback)"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Page</span>
          </button>
        </div>
      </div>

      {/* Official Journal Sheet (Formatted for both screen preview and @media print) */}
      <div
        ref={journalContainerRef}
        className="journal-print-container bg-white rounded-lg border border-slate-300 shadow-sm p-6 sm:p-8 text-slate-900"
      >
        {/* Official Header Block */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
          <div className="text-[11px] font-serif tracking-widest text-slate-600 uppercase">
            Republic of the Philippines · Bureau of Internal Revenue
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif uppercase tracking-wider text-slate-900 my-1">
            Cash Receipts Journal
          </h1>
          <div className="text-xs font-serif italic text-slate-600">
            (Prescribed for Taxpayers subject to 8% Income Tax Rate under RA No. 10963 / TRAIN Law)
          </div>

          {/* Taxpayer Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-4 text-left text-xs font-mono pt-3 border-t border-slate-300">
            <div>
              <span className="font-bold font-sans text-slate-600">TAXPAYER NAME:</span>{' '}
              <span className="font-bold text-slate-900">{taxpayer.taxpayerName || 'JUAN DELA CRUZ'}</span>
            </div>
            <div>
              <span className="font-bold font-sans text-slate-600">TIN:</span>{' '}
              <span className="font-bold text-slate-900">{taxpayer.tin || '000-000-000-000'}</span>
            </div>
            <div>
              <span className="font-bold font-sans text-slate-600">REGISTERED ADDRESS:</span>{' '}
              <span className="text-slate-800">{taxpayer.registeredAddress || 'N/A'}</span>
            </div>
            <div>
              <span className="font-bold font-sans text-slate-600">RDO / DISTRICT:</span>{' '}
              <span className="text-slate-800">{taxpayer.rdo || 'RDO 044'}</span>
            </div>
            <div>
              <span className="font-bold font-sans text-slate-600">LINE OF BUSINESS:</span>{' '}
              <span className="text-slate-800">{taxpayer.lineOfBusiness || 'Professional Services'}</span>
            </div>
            <div>
              <span className="font-bold font-sans text-slate-600">PERIOD COVERED:</span>{' '}
              <span className="font-bold text-slate-900">
                {viewScope === 'quarter'
                  ? `${quarterInfo.name} (${quarterInfo.period}, ${year})`
                  : `Taxable Calendar Year ${year} (Full Ledger)`}
              </span>
            </div>
          </div>
        </div>

        {/* Ledger Columnar Table */}
        <div className="overflow-x-auto">
          <table className="journal-table w-full border-collapse border border-slate-900 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-900 border-b border-slate-900 font-bold">
                <th className="border border-slate-900 px-3 py-2 text-center w-28 uppercase font-serif text-[11px]">
                  Date
                </th>
                <th className="border border-slate-900 px-3 py-2 text-center w-36 uppercase font-serif text-[11px]">
                  Invoice / OR / Ref #
                </th>
                <th className="border border-slate-900 px-3 py-2 text-left uppercase font-serif text-[11px]">
                  Payor Name / Description / Particulars
                </th>
                <th className="border border-slate-900 px-3 py-2 text-right w-44 uppercase font-serif text-[11px] bg-slate-50">
                  <div>DEBIT (PHP)</div>
                  <div className="text-[10px] font-normal normal-case text-slate-600">
                    Cash in Bank / on Hand
                  </div>
                </th>
                <th className="border border-slate-900 px-3 py-2 text-right w-44 uppercase font-serif text-[11px] bg-slate-50">
                  <div>CREDIT (PHP)</div>
                  <div className="text-[10px] font-normal normal-case text-slate-600">
                    Professional / Service Income
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Recorded Transactions */}
              {activeTransactions.map((txn, index) => (
                <tr
                  key={txn.id || index}
                  className="border-b border-slate-300 hover:bg-slate-50/50"
                >
                  <td className="border border-slate-400 px-3 py-2 text-center font-mono text-[11px] whitespace-nowrap">
                    {txn.date}
                  </td>
                  <td className="border border-slate-400 px-3 py-2 text-center font-mono text-[11px] whitespace-nowrap font-medium">
                    {txn.reference}
                  </td>
                  <td className="border border-slate-400 px-3 py-2 font-medium">
                    <div>{txn.payor}</div>
                    {txn.notes && (
                      <div className="text-[11px] font-normal text-slate-500 italic">
                        {txn.notes}
                      </div>
                    )}
                  </td>
                  <td className="border border-slate-400 px-3 py-2 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    {formatPHP(txn.amount, { showSymbol: false })}
                  </td>
                  <td className="border border-slate-400 px-3 py-2 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    {formatPHP(txn.amount, { showSymbol: false })}
                  </td>
                </tr>
              ))}

              {/* Empty placeholder rows (mirrors manual physical columnar notebooks) */}
              {Array.from({ length: emptyRowCount }).map((_, idx) => (
                <tr key={`empty_${idx}`} className="border-b border-slate-300 h-8">
                  <td className="border border-slate-300 px-3 py-2 text-center text-slate-200">
                    &nbsp;
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-center text-slate-200">
                    &nbsp;
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-slate-200">
                    &nbsp;
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right text-slate-200 font-mono">
                    —
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right text-slate-200 font-mono">
                    —
                  </td>
                </tr>
              ))}

              {/* Footers / Grand Totals */}
              <tr className="bg-slate-100 font-bold border-t-2 border-b-2 border-slate-900 text-slate-900">
                <td
                  colSpan={3}
                  className="border border-slate-900 px-4 py-2.5 text-right font-serif uppercase tracking-wider text-xs"
                >
                  TOTALS CARRIED FORWARD (BALANCED):
                </td>
                <td className="border border-slate-900 px-3 py-2.5 text-right font-mono text-sm font-black text-slate-900 whitespace-nowrap double-underline">
                  {formatPHP(totalDebit)}
                </td>
                <td className="border border-slate-900 px-3 py-2.5 text-right font-mono text-sm font-black text-slate-900 whitespace-nowrap double-underline">
                  {formatPHP(totalCredit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Accounting Integrity Proof */}
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
            <span>
              Single-Entry Trial Proof: Total Debit ({formatPHP(totalDebit)}) equals Total Credit ({formatPHP(totalCredit)}).
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            {activeTransactions.length} recorded entries · {emptyRowCount} reserve lines
          </div>
        </div>

        {/* Perjury Certification & Signature Block */}
        <div className="mt-8 pt-6 border-t border-slate-300 text-xs">
          <p className="italic text-slate-600 mb-6 text-[11px]">
            "I declare, under penalties of perjury, that this Cash Receipts Journal has been made in good faith, verified by me, and to the best of my knowledge and belief, is true and correct, pursuant to the provisions of the National Internal Revenue Code, as amended."
          </p>

          <div className="flex flex-col sm:flex-row justify-between items-end gap-6 pt-4">
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                Date Verified:
              </div>
              <div className="font-mono font-medium text-slate-800 mt-1">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>

            <div className="text-center min-w-[240px]">
              <div className="border-b border-slate-900 pb-1 font-bold uppercase text-slate-900 tracking-wider">
                {taxpayer.taxpayerName || 'JUAN DELA CRUZ'}
              </div>
              <div className="text-[10px] text-slate-500 tracking-wider uppercase mt-1">
                Taxpayer / Authorized Representative Signature
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
