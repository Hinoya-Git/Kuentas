import React, { useEffect, useState } from 'react';
import { AlertCircle, Calendar, DollarSign, FileText, Plus, User, X } from 'lucide-react';
import { Quarter, Transaction } from '../types/index.ts';
import { formatPHP, getQuarterFromDate, parseCleanNumber } from '../utils/formatters.ts';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => void;
  initialData?: Transaction | null;
  defaultQuarter: Quarter;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultQuarter,
}) => {
  const [date, setDate] = useState<string>('');
  const [payor, setPayor] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('Professional Fees');
  const [notes, setNotes] = useState<string>('');
  const [quarter, setQuarter] = useState<Quarter>(defaultQuarter);
  const [has2307, setHas2307] = useState<boolean>(false);
  const [withholdingRate, setWithholdingRate] = useState<number>(5); // 5% or 10%
  const [customWithholding, setCustomWithholding] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setPayor(initialData.payor);
      setReference(initialData.reference);
      setAmount(initialData.amount ? initialData.amount.toString() : '');
      setCategory(initialData.category || 'Professional Fees');
      setNotes(initialData.notes || '');
      setQuarter(initialData.quarter);
      if (initialData.withholding2307Amount && initialData.withholding2307Amount > 0) {
        setHas2307(true);
        setCustomWithholding(initialData.withholding2307Amount.toString());
      } else {
        setHas2307(false);
        setCustomWithholding('');
      }
    } else {
      // Set sensible default date based on selected quarter
      const currentYear = new Date().getFullYear();
      let defaultMonth = '01';
      if (defaultQuarter === 'Q2') defaultMonth = '04';
      if (defaultQuarter === 'Q3') defaultMonth = '07';
      if (defaultQuarter === 'Q4') defaultMonth = '10';

      const today = new Date().toISOString().split('T')[0];
      const todayQuarter = getQuarterFromDate(today);

      setDate(todayQuarter === defaultQuarter ? today : `${currentYear}-${defaultMonth}-15`);
      setPayor('');
      setReference('');
      setAmount('');
      setCategory('Professional Fees');
      setNotes('');
      setQuarter(defaultQuarter);
      setHas2307(false);
      setWithholdingRate(5);
      setCustomWithholding('');
    }
    setError('');
  }, [initialData, defaultQuarter, isOpen]);

  if (!isOpen) return null;

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    const inferred = getQuarterFromDate(newDate);
    setQuarter(inferred);
  };

  const calculateAutoWithholding = () => {
    const parsedAmount = parseCleanNumber(amount);
    return ((parsedAmount * withholdingRate) / 100).toFixed(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanAmount = parseCleanNumber(amount);
    if (!date) {
      setError('Please provide a valid transaction date.');
      return;
    }
    if (!payor.trim()) {
      setError('Please enter the client or payor name.');
      return;
    }
    if (!reference.trim()) {
      setError('Please provide an Invoice, OR, or Reference number.');
      return;
    }
    if (cleanAmount <= 0) {
      setError('Gross Amount must be greater than ₱0.00. Negative values are not permitted.');
      return;
    }

    let withholdingVal = 0;
    if (has2307) {
      withholdingVal = customWithholding
        ? parseCleanNumber(customWithholding)
        : parseCleanNumber(calculateAutoWithholding());
    }

    onSave({
      id: initialData?.id,
      date,
      payor: payor.trim(),
      reference: reference.trim(),
      amount: cleanAmount,
      quarter,
      category,
      notes: notes.trim() || undefined,
      withholding2307Amount: withholdingVal > 0 ? withholdingVal : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {initialData ? 'Edit Inflow Transaction' : 'Record New Income Transaction'}
            </h3>
            <p className="text-xs text-slate-500">
              Adds an entry to your Cash Receipts Journal and 1701Q Schedule II.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span>Inferred Quarter:</span>
                <span className="font-semibold text-emerald-800 font-mono">{quarter}</span>
              </div>
            </div>

            {/* Quarter Override */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Tax Quarter
              </label>
              <select
                value={quarter}
                onChange={(e) => setQuarter(e.target.value as Quarter)}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 font-medium"
              >
                <option value="Q1">Q1 (Jan 1 – Mar 31)</option>
                <option value="Q2">Q2 (Apr 1 – Jun 30)</option>
                <option value="Q3">Q3 (Jul 1 – Sep 30)</option>
                <option value="Q4">Q4 (Oct 1 – Dec 31)</option>
              </select>
            </div>
          </div>

          {/* Payor Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Client / Payor Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g., Acme Tech US LLC or Juan Reyes Corp"
                value={payor}
                onChange={(e) => setPayor(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Reference # */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice / OR / Ref # <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. INV-2026-001 or OR-1049"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
              />
            </div>

            {/* Gross Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gross Amount (PHP) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-serif text-xs font-bold">
                  ₱
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs font-mono font-semibold rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Form 2307 Creditable Withholding Helper */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={has2307}
                  onChange={(e) => {
                    setHas2307(e.target.checked);
                    if (e.target.checked && !customWithholding && amount) {
                      setCustomWithholding(calculateAutoWithholding());
                    }
                  }}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Client deducted BIR Form 2307 Creditable Tax Withholding</span>
              </label>
            </div>

            {has2307 && (
              <div className="mt-3 pt-2 border-t border-slate-200 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span>Rate:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setWithholdingRate(5);
                      const base = parseCleanNumber(amount);
                      setCustomWithholding(((base * 5) / 100).toFixed(2));
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      withholdingRate === 5
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    5% Professional
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWithholdingRate(10);
                      const base = parseCleanNumber(amount);
                      setCustomWithholding(((base * 10) / 100).toFixed(2));
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      withholdingRate === 10
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    10% Professional
                  </button>
                </div>

                <div className="flex-1 min-w-[140px]">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500 text-xs">
                      ₱
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Withheld amount"
                      value={customWithholding}
                      onChange={(e) => setCustomWithholding(e.target.value)}
                      className="w-full pl-6 pr-2 py-1 text-xs font-mono rounded border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Service Category & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Income Classification
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
              >
                <option value="Professional Fees">Professional Fees (Standard)</option>
                <option value="Consultancy Services">Consultancy Services</option>
                <option value="Software / Web Development">Software / Web Development</option>
                <option value="Creative / UI/UX Design">Creative / UI/UX Design</option>
                <option value="Writing / Content / Translation">Writing / Content / Translation</option>
                <option value="Virtual Assistance / Admin">Virtual Assistance / Admin</option>
                <option value="Other Service Income">Other Service Income</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes / Particulars (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Wise Wire, Upwork Payout, Cheque #..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-md shadow-xs transition-colors"
            >
              {initialData ? 'Update Record' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
