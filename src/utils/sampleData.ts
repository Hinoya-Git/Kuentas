import { QuarterSettings, TaxpayerProfile, Transaction } from '../types/index.ts';

export const EMPTY_TAXPAYER: TaxpayerProfile = {
  taxpayerName: '',
  tin: '',
  registeredAddress: '',
  rdo: '',
  lineOfBusiness: '',
};

export const EMPTY_QUARTER_SETTINGS: Record<string, QuarterSettings> = {
  Q1: {
    quarter: 'Q1',
    year: 2026,
    prevQuarterTaxableIncome: 0,
    prevQuarterTaxPaid: 0,
    currentQuarter2307Withheld: 0,
  },
  Q2: {
    quarter: 'Q2',
    year: 2026,
    prevQuarterTaxableIncome: 0,
    prevQuarterTaxPaid: 0,
    currentQuarter2307Withheld: 0,
  },
  Q3: {
    quarter: 'Q3',
    year: 2026,
    prevQuarterTaxableIncome: 0,
    prevQuarterTaxPaid: 0,
    currentQuarter2307Withheld: 0,
  },
  Q4: {
    quarter: 'Q4',
    year: 2026,
    prevQuarterTaxableIncome: 0,
    prevQuarterTaxPaid: 0,
    currentQuarter2307Withheld: 0,
  },
};

export const DEFAULT_TAXPAYER: TaxpayerProfile = {
  taxpayerName: 'JUAN DELA CRUZ',
  tin: '123-456-789-000',
  registeredAddress: 'Unit 402, High Street South, Bonifacio Global City, Taguig City, Metro Manila',
  rdo: 'RDO 044 - Taguig City / Pateros',
  lineOfBusiness: 'Professional / IT & Software Development Consultancy (PSIC 6201)',
};

export const INITIAL_QUARTER_SETTINGS: Record<string, QuarterSettings> = {
  Q1: {
    quarter: 'Q1',
    year: 2026,
    prevQuarterTaxableIncome: 0,
    prevQuarterTaxPaid: 0,
    currentQuarter2307Withheld: 0,
  },
  Q2: {
    quarter: 'Q2',
    year: 2026,
    prevQuarterTaxableIncome: 0,
    prevQuarterTaxPaid: 0,
    currentQuarter2307Withheld: 0,
  },
  Q3: {
    quarter: 'Q3',
    year: 2026,
    prevQuarterTaxableIncome: 0,
    prevQuarterTaxPaid: 0,
    currentQuarter2307Withheld: 0,
  },
  Q4: {
    quarter: 'Q4',
    year: 2026,
    prevQuarterTaxableIncome: 0,
    prevQuarterTaxPaid: 0,
    currentQuarter2307Withheld: 0,
  },
};

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  // Q1 2026
  {
    id: 'txn_sample_01',
    date: '2026-01-14',
    payor: 'Apex Horizon Technologies Inc. (PH Client)',
    reference: 'INV-2026-001',
    amount: 150000,
    quarter: 'Q1',
    category: 'Full-Stack Web Development',
    notes: 'Payment for Phase 1 MVP Milestone. Net of 5% CWT 2307 (₱7,500).',
    withholding2307Amount: 7500,
    createdAt: 1736841600000,
  },
  {
    id: 'txn_sample_02',
    date: '2026-02-03',
    payor: 'CloudScale Solutions LLC (San Francisco, CA)',
    reference: 'WIRE-US-9941',
    amount: 125000,
    quarter: 'Q1',
    category: 'Cloud Architecture & DevOps',
    notes: 'Wise direct bank deposit for January retainer.',
    createdAt: 1738569600000,
  },
  {
    id: 'txn_sample_03',
    date: '2026-03-20',
    payor: 'DesignSprint Studio (Sydney, AU)',
    reference: 'INV-2026-002',
    amount: 110000,
    quarter: 'Q1',
    category: 'UI/UX Design Systems',
    notes: 'Design review and Figma component library delivery.',
    createdAt: 1742457600000,
  },

  // Q2 2026
  {
    id: 'txn_sample_04',
    date: '2026-04-12',
    payor: 'Metro Manila FinTech Ventures Corp.',
    reference: 'INV-2026-003',
    amount: 240000,
    quarter: 'Q2',
    category: 'API Security Integration',
    notes: 'Domestic client. Received Form 2307 (5% CWT = ₱12,000).',
    withholding2307Amount: 12000,
    createdAt: 1744444800000,
  },
  {
    id: 'txn_sample_05',
    date: '2026-05-18',
    payor: 'CloudScale Solutions LLC (San Francisco, CA)',
    reference: 'WIRE-US-9972',
    amount: 170000,
    quarter: 'Q2',
    category: 'DevOps & Infrastructure',
    notes: 'Wise payout - monthly ongoing maintenance retainer.',
    createdAt: 1747555200000,
  },

  // Q3 2026
  {
    id: 'txn_sample_06',
    date: '2026-07-15',
    payor: 'Nordic Health Digital (Stockholm, SE)',
    reference: 'INV-2026-004',
    amount: 210000,
    quarter: 'Q3',
    category: 'Healthcare App Frontend',
    notes: 'Milestone 2 acceptance and QA signoff.',
    createdAt: 1752566400000,
  },
  {
    id: 'txn_sample_07',
    date: '2026-08-25',
    payor: 'Bayanihan Logistics Corp. (PH)',
    reference: 'INV-2026-005',
    amount: 210000,
    quarter: 'Q3',
    category: 'Database Optimization',
    notes: 'Subject to 5% CWT. 2307 received.',
    withholding2307Amount: 10500,
    createdAt: 1756108800000,
  },
];
