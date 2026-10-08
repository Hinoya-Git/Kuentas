import { BIR1701QComputation, Quarter, QuarterSettings, Transaction } from '../types/index.ts';

export const STATUTORY_DEDUCTION_PHP = 250000;
export const VAT_THRESHOLD_PHP = 3000000;
export const GIT_TAX_RATE = 0.08;

/**
 * Calculate BIR Form 1701Q Schedule II values for the 8% Gross Income Tax regime.
 */
export function compute1701Q(
  currentQuarterGross: number,
  settings: QuarterSettings
): BIR1701QComputation {
  const item47 = Math.max(0, currentQuarterGross);
  const item50 = Math.max(0, settings.prevQuarterTaxableIncome);
  const item51 = item47 + item50;

  // Item 52: Statutory Deduction under TRAIN Law
  const item52 = STATUTORY_DEDUCTION_PHP;

  // Item 53: Net Taxable Income (taxable base, minimum 0)
  const item53 = Math.max(0, item51 - item52);

  // Item 54: Tax Due at 8%
  const item54 = item53 * GIT_TAX_RATE;

  // Item 56: Tax remitted in previous quarter(s)
  const item56 = Math.max(0, settings.prevQuarterTaxPaid);

  // Item 58: Form 2307 Creditable Tax Withheld
  const item58 = Math.max(0, settings.currentQuarter2307Withheld);

  // Item 63: Net Tax Payable / (Overpayment)
  const item63 = item54 - item56 - item58;

  const isOverpayment = item63 < 0;
  const overpaymentAmount = isOverpayment ? Math.abs(item63) : 0;
  const statutoryDeductionUsed = Math.min(STATUTORY_DEDUCTION_PHP, item51);
  const statutoryDeductionRemaining = Math.max(0, STATUTORY_DEDUCTION_PHP - item51);

  const vatPercentage = Math.min(100, (item51 / VAT_THRESHOLD_PHP) * 100);

  return {
    quarter: settings.quarter,
    year: settings.year,
    item47_currentQuarterGross: item47,
    item50_prevQuartersTaxableIncome: item50,
    item51_totalCumulativeTaxableIncome: item51,
    item52_statutoryDeduction: item52,
    item53_netTaxableIncome: item53,
    item54_taxDue8Percent: item54,
    item56_prevQuarterTaxPaid: item56,
    item58_form2307Withheld: item58,
    item63_netTaxPayable: item63,
    isOverpayment,
    overpaymentAmount,
    statutoryDeductionUsed,
    statutoryDeductionRemaining,
    vatThresholdLimit: VAT_THRESHOLD_PHP,
    vatThresholdPercentage: vatPercentage,
  };
}

/**
 * Filter transactions by selected quarter
 */
export function filterTransactionsByQuarter(
  transactions: Transaction[],
  quarter: Quarter
): Transaction[] {
  return transactions.filter((t) => t.quarter === quarter);
}

/**
 * Calculate gross receipts for a specific quarter
 */
export function calculateQuarterGross(
  transactions: Transaction[],
  quarter: Quarter
): number {
  return transactions
    .filter((t) => t.quarter === quarter)
    .reduce((sum, t) => sum + (t.amount || 0), 0);
}

/**
 * Get cumulative gross income from all quarters prior to the selected quarter
 */
export function getPriorQuartersGrossFromTransactions(
  transactions: Transaction[],
  currentQuarter: Quarter
): number {
  const quartersOrder: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  const currentIndex = quartersOrder.indexOf(currentQuarter);
  if (currentIndex <= 0) return 0;

  const priorQuarters = quartersOrder.slice(0, currentIndex);
  return transactions
    .filter((t) => priorQuarters.includes(t.quarter))
    .reduce((sum, t) => sum + (t.amount || 0), 0);
}

/**
 * Sum total 2307 withholding amounts attached to transactions in this quarter
 */
export function calculateQuarter2307FromTransactions(
  transactions: Transaction[],
  quarter: Quarter
): number {
  return transactions
    .filter((t) => t.quarter === quarter)
    .reduce((sum, t) => sum + (t.withholding2307Amount || 0), 0);
}
