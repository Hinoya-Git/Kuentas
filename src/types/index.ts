export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface QuarterInfo {
  quarter: Quarter;
  name: string;
  period: string;
  months: string;
  ebirFormDeadline: string;
  birForm: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  payor: string;
  reference: string;
  amount: number;
  quarter: Quarter;
  notes?: string;
  category?: string;
  withholding2307Amount?: number;
  createdAt: number;
}

export interface QuarterSettings {
  quarter: Quarter;
  year: number;
  prevQuarterTaxableIncome: number; // BIR Item 50
  prevQuarterTaxPaid: number;        // BIR Item 56
  currentQuarter2307Withheld: number; // BIR Item 58
}

export interface TaxpayerProfile {
  taxpayerName: string;
  tin: string;
  registeredAddress: string;
  rdo: string;
  lineOfBusiness: string;
}

export interface BIR1701QComputation {
  quarter: Quarter;
  year: number;
  item47_currentQuarterGross: number;
  item50_prevQuartersTaxableIncome: number;
  item51_totalCumulativeTaxableIncome: number;
  item52_statutoryDeduction: number;
  item53_netTaxableIncome: number;
  item54_taxDue8Percent: number;
  item56_prevQuarterTaxPaid: number;
  item58_form2307Withheld: number;
  item63_netTaxPayable: number;
  isOverpayment: boolean;
  overpaymentAmount: number;
  statutoryDeductionUsed: number;
  statutoryDeductionRemaining: number;
  vatThresholdLimit: number;
  vatThresholdPercentage: number;
}

export interface CSVColumnMapping {
  dateColumn: string;
  payorColumn: string;
  refColumn: string;
  amountColumn: string;
  notesColumn?: string;
}

export interface CSVPreviewData {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}
