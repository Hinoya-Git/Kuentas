import React from 'react';
import { ArrowDownRight, CheckCircle2, ChevronRight, Copy, DollarSign, Info, Percent, TrendingUp, Wallet } from 'lucide-react';
import { BIR1701QComputation } from '../types/index.ts';
import { copyToClipboard, formatPHP } from '../utils/formatters.ts';

interface SummaryCardsProps {
  computation: BIR1701QComputation;
  onCopyTaxDue: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ computation, onCopyTaxDue }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    const val = computation.isOverpayment ? '0.00' : computation.item63_netTaxPayable.toFixed(2);
    const success = await copyToClipboard(val);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopyTaxDue();
    }
  };

  const vatRemaining = Math.max(0, computation.vatThresholdLimit - computation.item51_totalCumulativeTaxableIncome);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 print:hidden">
      {/* Card 1: Quarter Gross Receipts */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">
            {computation.quarter} Gross Receipts
          </span>
          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
            Item 47
          </span>
        </div>
        <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight mt-1">
          {formatPHP(computation.item47_currentQuarterGross)}
        </div>
        <p className="text-xs text-slate-500 mt-2 flex items-center justify-between">
          <span>Inflow this quarter</span>
          <span className="font-mono text-slate-700 font-medium">
            Prior: {formatPHP(computation.item50_prevQuartersTaxableIncome, { showCents: false })}
          </span>
        </p>
      </div>

      {/* Card 2: Cumulative YTD Income */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Cumulative YTD Gross
          </span>
          <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
            Item 51
          </span>
        </div>
        <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight mt-1">
          {formatPHP(computation.item51_totalCumulativeTaxableIncome)}
        </div>
        {/* VAT threshold tracker */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
            <span>₱3M Non-VAT Cap</span>
            <span className="font-mono font-medium">
              {computation.vatThresholdPercentage.toFixed(1)}% used
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                computation.vatThresholdPercentage > 85
                  ? 'bg-red-500'
                  : computation.vatThresholdPercentage > 65
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, computation.vatThresholdPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card 3: ₱250k Deduction Utilization */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">
            TRAIN ₱250k Allowance
          </span>
          <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
            Item 52
          </span>
        </div>
        <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight mt-1">
          {formatPHP(computation.statutoryDeductionUsed)}
        </div>
        <div className="text-xs mt-2 text-slate-600">
          {computation.statutoryDeductionRemaining > 0 ? (
            <span className="text-emerald-700 font-medium">
              {formatPHP(computation.statutoryDeductionRemaining, { showCents: false })} buffer remaining tax-free
            </span>
          ) : (
            <span className="text-slate-500">
              100% deduction utilized. Excess taxed at 8%.
            </span>
          )}
        </div>
      </div>

      {/* Card 4: Net Tax Payable / (Overpayment) */}
      <div
        className={`rounded-lg border p-4 shadow-xs transition-colors ${
          computation.isOverpayment
            ? 'bg-emerald-50/70 border-emerald-300'
            : computation.item63_netTaxPayable === 0
            ? 'bg-slate-50 border-slate-300'
            : 'bg-amber-50/90 border-amber-300'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              computation.isOverpayment
                ? 'text-emerald-900'
                : computation.item63_netTaxPayable === 0
                ? 'text-slate-700'
                : 'text-amber-950 font-bold'
            }`}
          >
            {computation.isOverpayment
              ? 'Net Overpayment'
              : computation.item63_netTaxPayable === 0
              ? 'Tax Due: ₱ 0.00'
              : 'Net Tax Payable'}
          </span>
          <span
            className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
              computation.isOverpayment
                ? 'bg-emerald-200/80 text-emerald-900'
                : computation.item63_netTaxPayable === 0
                ? 'bg-slate-200 text-slate-800'
                : 'bg-amber-200 text-amber-900'
            }`}
          >
            Item 63
          </span>
        </div>

        <div
          className={`text-2xl font-bold font-mono tracking-tight mt-1 ${
            computation.isOverpayment
              ? 'text-emerald-800'
              : computation.item63_netTaxPayable === 0
              ? 'text-slate-800'
              : 'text-amber-900'
          }`}
        >
          {computation.isOverpayment
            ? `(${formatPHP(computation.overpaymentAmount)})`
            : formatPHP(computation.item63_netTaxPayable)}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-slate-600 font-medium">
            {computation.isOverpayment
              ? 'Carried over to next quarter'
              : computation.item63_netTaxPayable === 0
              ? 'Zero tax liability'
              : 'Due for payment'}
          </span>

          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border transition-colors ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
            title="Copy exact amount to clipboard for eBIRForms"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-500" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
