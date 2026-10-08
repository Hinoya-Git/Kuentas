import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Download,
  Edit2,
  FileSpreadsheet,
  Filter,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { Quarter, Transaction } from '../../types/index.ts';
import { formatDisplayDate, formatPHP, parseCleanNumber, QUARTER_DETAILS } from '../../utils/formatters.ts';

interface TransactionsTabProps {
  transactions: Transaction[];
  quarter: Quarter;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onOpenFullModal: () => void;
  onEditClick: (transaction: Transaction) => void;
  onDeleteClick: (id: string) => void;
  onPromptClearAll: () => void;
  onPromptResetSample: () => void;
  onOpenCSVImport: () => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  quarter,
  onAddTransaction,
  onOpenFullModal,
  onEditClick,
  onDeleteClick,
  onPromptClearAll,
  onPromptResetSample,
  onOpenCSVImport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Quick inline entry form state
  const today = new Date().toISOString().split('T')[0];
  const [inlineDate, setInlineDate] = useState<string>(today);
  const [inlinePayor, setInlinePayor] = useState<string>('');
  const [inlineRef, setInlineRef] = useState<string>('');
  const [inlineAmount, setInlineAmount] = useState<string>('');
  const [inlineError, setInlineError] = useState<string>('');

  // Filter by selected quarter
  const quarterTransactions = transactions.filter((t) => t.quarter === quarter);

  const filteredTransactions = quarterTransactions.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.payor.toLowerCase().includes(q) ||
      t.reference.toLowerCase().includes(q) ||
      (t.notes && t.notes.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q))
    );
  });

  const totalQuarterGross = quarterTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalQuarter2307 = quarterTransactions.reduce(
    (acc, t) => acc + (t.withholding2307Amount || 0),
    0
  );

  const handleInlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError('');

    const cleanAmount = parseCleanNumber(inlineAmount);
    if (!inlineDate) {
      setInlineError('Please select a valid date.');
      return;
    }
    if (!inlinePayor.trim()) {
      setInlineError('Please enter the client / payor name.');
      return;
    }
    if (!inlineRef.trim()) {
      setInlineError('Please enter an invoice or OR reference number.');
      return;
    }
    if (cleanAmount <= 0) {
      setInlineError('Gross amount must be greater than ₱0.00.');
      return;
    }

    onAddTransaction({
      date: inlineDate,
      payor: inlinePayor.trim(),
      reference: inlineRef.trim(),
      amount: cleanAmount,
      quarter,
      category: 'Professional Fees',
    });

    // Reset fields except date for fast batch entry
    setInlinePayor('');
    setInlineRef('');
    setInlineAmount('');
    setInlineError('');
  };

  const handleExportCSV = () => {
    if (quarterTransactions.length === 0) return;
    const headers = ['Date', 'Client / Payor', 'Reference / Invoice #', 'Gross Amount (PHP)', 'Form 2307 Withholding', 'Category', 'Notes'];
    const rows = quarterTransactions.map((t) => [
      t.date,
      `"${t.payor.replace(/"/g, '""')}"`,
      `"${t.reference.replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      (t.withholding2307Amount || 0).toFixed(2),
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kuentas_transactions_${quarter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const quarterInfo = QUARTER_DETAILS[quarter];

  return (
    <div className="space-y-5">
      {/* 1. Quick Manual Entry Row Container */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>Manual Income Entry Row</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Quickly record client fees, invoices, or cash received for {quarter} ({quarterInfo.period}).
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenFullModal}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-medium underline self-start sm:self-auto"
          >
            + Detailed Entry (with 2307 &amp; notes)
          </button>
        </div>

        {inlineError && (
          <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-xs text-red-800">
            <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span>{inlineError}</span>
          </div>
        )}

        <form onSubmit={handleInlineSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Date */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Date (YYYY-MM-DD) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={inlineDate}
                onChange={(e) => setInlineDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900"
              />
            </div>

            {/* Payor / Client Name */}
            <div className="lg:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Payor / Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Corp / Upwork Client"
                value={inlinePayor}
                onChange={(e) => setInlinePayor(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900"
              />
            </div>

            {/* Reference / Invoice / OR # */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Reference / Invoice / OR # <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. INV-2026-001"
                value={inlineRef}
                onChange={(e) => setInlineRef(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900"
              />
            </div>

            {/* Gross Amount (PHP) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Gross Amount (PHP) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 font-serif text-xs font-bold">
                  ₱
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  placeholder="0.00"
                  value={inlineAmount}
                  onChange={(e) => setInlineAmount(e.target.value)}
                  className="w-full pl-6 pr-2.5 py-1.5 text-xs font-mono font-bold rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1 px-4 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded shadow-xs transition-colors h-[31px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Entry</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 2. Top Controls Toolbar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Filter ${quarter} transactions by client, invoice #...`}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-slate-50 focus:bg-white text-slate-900"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenCSVImport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-700" />
            <span>Upload CSV</span>
          </button>

          {quarterTransactions.length > 0 && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
              title="Export this quarter's transactions as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          )}

          {/* Subtle Reset to Default Sample Data Button */}
          <button
            type="button"
            onClick={onPromptResetSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors"
            title="Load realistic Philippine freelancer sample data"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
            <span>Reset to Sample Data</span>
          </button>

          {/* Prominent Red Clear All Data Button */}
          <button
            type="button"
            onClick={onPromptClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
            title="Wipe all recorded transactions and reset application state"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>

      {/* 3. Table Container */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-800" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {quarter} Cash Inflows Ledger ({quarterInfo.period})
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              · {quarterTransactions.length} transaction{quarterTransactions.length === 1 ? '' : 's'}
            </span>
          </div>

          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Single-entry cash basis
          </span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800">
              {searchQuery ? 'No matching transactions found' : `No transactions recorded for ${quarter}`}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              {searchQuery
                ? 'Try adjusting your search query or reset the filter.'
                : `Use the manual entry row above or click "Upload CSV" to record your client fees and payments.`}
            </p>
            {!searchQuery && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onOpenCSVImport}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Upload Bank / E-Wallet CSV</span>
                </button>
                <button
                  type="button"
                  onClick={onPromptResetSample}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                  <span>Load Sample Freelancer Data</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-2.5">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-2.5">
                    Client / Payor
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-mono">
                    Invoice / OR #
                  </th>
                  <th scope="col" className="px-4 py-2.5">
                    Particulars
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-mono">
                    2307 CWT (PHP)
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-mono">
                    Gross Inflow (PHP)
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-center w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredTransactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                      {formatDisplayDate(txn.date)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{txn.payor}</div>
                      {txn.notes && (
                        <div className="text-[11px] font-normal text-slate-500 truncate max-w-xs">
                          {txn.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                        {txn.reference}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      <span className="text-slate-700">{txn.category || 'Professional Fees'}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-right text-slate-600 whitespace-nowrap">
                      {txn.withholding2307Amount && txn.withholding2307Amount > 0 ? (
                        <span className="text-amber-700 font-medium">
                          {formatPHP(txn.withholding2307Amount)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-right text-slate-900 whitespace-nowrap">
                      {formatPHP(txn.amount)}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => onEditClick(txn)}
                          className="p-1 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded"
                          title="Edit transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteClick(txn.id)}
                          className="p-1 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Running Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-600">
            <div>
              Total Transactions: <strong className="text-slate-900">{quarterTransactions.length}</strong>
            </div>
            {totalQuarter2307 > 0 && (
              <div>
                Total 2307 Withheld: <strong className="text-amber-800 font-mono">{formatPHP(totalQuarter2307)}</strong>
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              {quarter} Gross Receipts (Item 47):
            </span>
            <span className="text-base font-bold font-mono text-emerald-800">
              {formatPHP(totalQuarterGross)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
