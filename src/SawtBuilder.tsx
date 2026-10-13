import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Code,
  Copy,
  Download,
  Edit2,
  FileCode,
  FileSpreadsheet,
  FileText,
  Filter,
  HelpCircle,
  Info,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserCheck,
  Wallet,
} from 'lucide-react';
import { Quarter } from './types/index.ts';
import { formatPHP, parseCleanNumber } from './utils/formatters.ts';

export interface SawtEntry {
  id: string;
  seqNo: number;
  payorTin: string;
  payorName: string;
  atc: string;
  atcDescription: string;
  taxRate: number; // e.g. 0.05
  incomePayment: number;
  taxWithheld: number;
  quarter: Quarter;
  dateReceived: string;
  PayorTIN?: string;
  PayorName?: string;
  ATC?: string;
  GrossAmount?: number;
  grossAmount?: number;
  TaxRate?: number;
  TaxWithheld?: number;
}

export type SawtFormType = '1701Q' | '2551Q';

export interface SawtFilerSettings {
  taxpayerTin: string; // 9 numeric digits
  branchCode: string; // 4 numeric digits, default "0000"
  registeredName: string; // e.g. "JUAN DELA CRUZ"
  lastName: string;
  firstName: string;
  middleName: string;
  rdoCode: string; // 3 digits, e.g. "008"
  formType: SawtFormType; // "1701Q" | "2551Q"
  periodQuarter: Quarter;
  periodYear: number;
  periodEnd: string; // e.g. "03/2026", "06/2026", "09/2026", "12/2026"
}

// Sanitization & Formatting Helpers for BIR RMC No. 61-2024
export function sanitizeTin9(raw: string, fallback = '123456789'): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length >= 9) {
    return digits.slice(0, 9);
  }
  return digits ? digits.padEnd(9, '0') : fallback;
}

export function sanitizeBranch4(raw: string, fallback = '0000'): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length >= 4) {
    return digits.slice(0, 4);
  }
  return digits ? digits.padStart(4, '0') : fallback;
}

export function extractTinAndBranch(rawTin: string): { tin9: string; branch4: string } {
  const digits = (rawTin || '').replace(/\D/g, '');
  const tin9 = (digits.slice(0, 9) || '000000000').padEnd(9, '0');
  const branchDigits = digits.slice(9, 13);
  const branch4 = branchDigits ? branchDigits.padEnd(4, '0').slice(0, 4) : '0000';
  return { tin9, branch4 };
}

export function sanitizeRdo3(raw: string, fallback = '008'): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length >= 3) {
    return digits.slice(0, 3);
  }
  return digits ? digits.padStart(3, '0') : fallback;
}

export function getQuarterPeriodEnd(quarter: Quarter, year: number): string {
  const monthMap: Record<Quarter, string> = {
    Q1: '03',
    Q2: '06',
    Q3: '09',
    Q4: '12',
  };
  const mm = monthMap[quarter] || '03';
  return `${mm}/${year}`;
}

export function formatPeriodSlash(
  periodEndStr: string,
  fallbackQuarter: Quarter = 'Q1',
  fallbackYear = 2026
): string {
  const trimmed = (periodEndStr || '').trim();
  const matchSlash = trimmed.match(/^(\d{1,2})\/(\d{4})$/);
  if (matchSlash) {
    const mm = matchSlash[1].padStart(2, '0');
    const yyyy = matchSlash[2];
    return `${mm}/${yyyy}`;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 6) {
    const mm = digits.slice(0, 2);
    const yyyy = digits.slice(2, 6);
    return `${mm}/${yyyy}`;
  }
  const monthMap: Record<Quarter, string> = {
    Q1: '03',
    Q2: '06',
    Q3: '09',
    Q4: '12',
  };
  const mm = monthMap[fallbackQuarter] || '03';
  return `${mm}/${fallbackYear}`;
}

export function parsePeriodMMYYYY(
  periodEndStr: string,
  fallbackQuarter: Quarter = 'Q1',
  fallbackYear = 2026
): string {
  return formatPeriodSlash(periodEndStr, fallbackQuarter, fallbackYear).replace(/\//g, '');
}

const COMMON_ATCS = [
  {
    code: 'WI011',
    description: 'Professional Fees (Individual) - Gross income <= 3M (5%)',
    rate: 0.05,
    rateLabel: '5%',
  },
  {
    code: 'WI158',
    description: 'Professional Fees (Individual) - Gross income > 3M (10%)',
    rate: 0.10,
    rateLabel: '10%',
  },
  {
    code: 'WB080',
    description: 'Percentage Tax on Persons Exempt from VAT (3%)',
    rate: 0.03,
    rateLabel: '3%',
  },
  {
    code: 'WI160',
    description: 'Rental of real/personal property (5%)',
    rate: 0.05,
    rateLabel: '5%',
  },
];

const INITIAL_SAWT_SAMPLE: SawtEntry[] = [
  {
    id: 'sawt-1',
    seqNo: 1,
    payorTin: '008-123-456-000',
    payorName: 'ACME INNOVATIONS PHILIPPINES INC.',
    atc: 'WI011',
    atcDescription: 'Professional Fees (Individual) - 5%',
    taxRate: 0.05,
    incomePayment: 80000,
    taxWithheld: 4000,
    quarter: 'Q1',
    dateReceived: '2026-02-15',
    PayorTIN: '008-123-456-000',
    PayorName: 'ACME INNOVATIONS PHILIPPINES INC.',
    ATC: 'WI011',
    GrossAmount: 80000,
    grossAmount: 80000,
    TaxRate: 0.05,
    TaxWithheld: 4000,
  },
  {
    id: 'sawt-2',
    seqNo: 2,
    payorTin: '102-987-654-000',
    payorName: 'DIGITAL MEDIA SPARK CORP.',
    atc: 'WI011',
    atcDescription: 'Professional Fees (Individual) - 5%',
    taxRate: 0.05,
    incomePayment: 60000,
    taxWithheld: 3000,
    quarter: 'Q1',
    dateReceived: '2026-03-20',
    PayorTIN: '102-987-654-000',
    PayorName: 'DIGITAL MEDIA SPARK CORP.',
    ATC: 'WI011',
    GrossAmount: 60000,
    grossAmount: 60000,
    TaxRate: 0.05,
    TaxWithheld: 3000,
  },
];

const STORAGE_KEY_SAWT = 'kuentas_sawt_certificates_v1';
const STORAGE_KEY_FILER = 'kuentas_sawt_filer_v2';

const DEFAULT_FILER_SETTINGS: SawtFilerSettings = {
  taxpayerTin: '123456789',
  branchCode: '0000',
  registeredName: 'JUAN DELA CRUZ',
  lastName: 'DELA CRUZ',
  firstName: 'JUAN',
  middleName: '',
  rdoCode: '008',
  formType: '1701Q',
  periodQuarter: 'Q1',
  periodYear: 2026,
  periodEnd: '03/2026',
};

export function SawtBuilder() {
  const [certificates, setCertificates] = useState<SawtEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAWT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c: SawtEntry, i: number) => ({
            ...c,
            id: c.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sawt-${Date.now()}-${i}`),
          }));
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_SAWT_SAMPLE;
  });

  // Alias for backward compatibility
  const entries = certificates;
  const setEntries = setCertificates;

  // Persist certificates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAWT, JSON.stringify(certificates));
    } catch {
      // ignore
    }
  }, [certificates]);

  // Filer Settings State (BIR RMC No. 61-2024 specifications)
  const [filerSettings, setFilerSettings] = useState<SawtFilerSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FILER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...DEFAULT_FILER_SETTINGS,
            ...parsed,
          };
        }
      }
      // Check if 1701Q taxpayer profile is available
      const savedTaxpayer = localStorage.getItem('kuentas_taxpayer_profile_v1');
      if (savedTaxpayer) {
        const tp = JSON.parse(savedTaxpayer);
        if (tp && tp.tin) {
          const { tin9, branch4 } = extractTinAndBranch(tp.tin);
          const rdoClean = sanitizeRdo3(tp.rdo || '008');
          const regName = tp.taxpayerName || 'JUAN DELA CRUZ';
          const nameParts = regName.trim().split(' ');
          const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : regName;
          const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : '';
          return {
            ...DEFAULT_FILER_SETTINGS,
            taxpayerTin: tin9,
            branchCode: branch4,
            registeredName: regName,
            lastName,
            firstName,
            rdoCode: rdoClean,
          };
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_FILER_SETTINGS;
  });

  // Persist filer settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FILER, JSON.stringify(filerSettings));
    } catch {
      // ignore
    }
  }, [filerSettings]);

  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | 'ALL'>('Q1');
  const [searchTerm, setSearchTerm] = useState('');

  // Filer settings modal state
  const [isFilerModalOpen, setIsFilerModalOpen] = useState(false);

  // DAT preview modal
  const [isDatPreviewOpen, setIsDatPreviewOpen] = useState(false);
  const [copiedDat, setCopiedDat] = useState(false);

  // New / Edit Entry Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formPayorTin, setFormPayorTin] = useState('');
  const [formPayorName, setFormPayorName] = useState('');
  const [formAtc, setFormAtc] = useState('WI011');
  const [formIncomePayment, setFormIncomePayment] = useState('');
  const [formTaxWithheld, setFormTaxWithheld] = useState('');
  const [formQuarter, setFormQuarter] = useState<Quarter>('Q1');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filtered entries
  const filteredEntries = entries.filter((entry) => {
    const matchesQuarter = selectedQuarter === 'ALL' || entry.quarter === selectedQuarter;
    const matchesSearch =
      entry.payorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.payorTin.includes(searchTerm) ||
      entry.atc.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesQuarter && matchesSearch;
  });

  // Totals
  const totalIncome = filteredEntries.reduce((sum, e) => sum + e.incomePayment, 0);
  const totalWithheld = filteredEntries.reduce((sum, e) => sum + e.taxWithheld, 0);

  const openAddForm = () => {
    setEditingId(null);
    setFormPayorTin('');
    setFormPayorName('');
    setFormAtc('WI011');
    setFormIncomePayment('');
    setFormTaxWithheld('');
    setFormQuarter(selectedQuarter === 'ALL' ? 'Q1' : selectedQuarter);
    setFormDate(new Date().toISOString().split('T')[0]);
    setIsFormOpen(true);
  };

  const openEditForm = (entry: SawtEntry) => {
    setEditingId(entry.id);
    setFormPayorTin(entry.payorTin);
    setFormPayorName(entry.payorName);
    setFormAtc(entry.atc);
    setFormIncomePayment(entry.incomePayment.toString());
    setFormTaxWithheld(entry.taxWithheld.toString());
    setFormQuarter(entry.quarter);
    setFormDate(entry.dateReceived);
    setIsFormOpen(true);
  };

  const handleIncomeChange = (incomeStr: string) => {
    setFormIncomePayment(incomeStr);
    const num = parseCleanNumber(incomeStr);
    const atcObj = COMMON_ATCS.find((a) => a.code === formAtc);
    if (atcObj && num > 0) {
      setFormTaxWithheld((num * atcObj.rate).toFixed(2));
    }
  };

  const handleAtcChange = (atcCode: string) => {
    setFormAtc(atcCode);
    const num = parseCleanNumber(formIncomePayment);
    const atcObj = COMMON_ATCS.find((a) => a.code === atcCode);
    if (atcObj && num > 0) {
      setFormTaxWithheld((num * atcObj.rate).toFixed(2));
    }
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const income = parseCleanNumber(formIncomePayment);
    const withheld = parseCleanNumber(formTaxWithheld);
    const atcObj = COMMON_ATCS.find((a) => a.code === formAtc) || COMMON_ATCS[0];

    if (!formPayorName.trim()) {
      alert('Please enter Payor / Withholding Agent Name');
      return;
    }

    if (editingId) {
      setCertificates((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                payorTin: formPayorTin.trim(),
                payorName: formPayorName.trim().toUpperCase(),
                atc: formAtc,
                atcDescription: atcObj.description,
                taxRate: atcObj.rate,
                incomePayment: income,
                taxWithheld: withheld,
                quarter: formQuarter,
                dateReceived: formDate,
                PayorTIN: formPayorTin.trim(),
                PayorName: formPayorName.trim().toUpperCase(),
                ATC: formAtc,
                GrossAmount: income,
                grossAmount: income,
                TaxRate: atcObj.rate,
                TaxWithheld: withheld,
              }
            : item
        )
      );
      showToast('Form 2307 entry updated.');
    } else {
      const newEntry: SawtEntry = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sawt-${Date.now()}`,
        seqNo: certificates.length + 1,
        payorTin: formPayorTin.trim(),
        payorName: formPayorName.trim().toUpperCase(),
        atc: formAtc,
        atcDescription: atcObj.description,
        taxRate: atcObj.rate,
        incomePayment: income,
        taxWithheld: withheld,
        quarter: formQuarter,
        dateReceived: formDate,
        PayorTIN: formPayorTin.trim(),
        PayorName: formPayorName.trim().toUpperCase(),
        ATC: formAtc,
        GrossAmount: income,
        grossAmount: income,
        TaxRate: atcObj.rate,
        TaxWithheld: withheld,
      };
      setCertificates((prev) => [...prev, newEntry]);
      showToast('Form 2307 entry added to SAWT schedule.');
    }

    setIsFormOpen(false);
  };

  const getFilerParams = () => {
    const payeeTin9 = sanitizeTin9(filerSettings.taxpayerTin);
    const branch4 = sanitizeBranch4(filerSettings.branchCode);
    const periodSlash = formatPeriodSlash(
      filerSettings.periodEnd,
      filerSettings.periodQuarter,
      filerSettings.periodYear
    );
    const periodMMYYYY = parsePeriodMMYYYY(
      filerSettings.periodEnd,
      filerSettings.periodQuarter,
      filerSettings.periodYear
    );
    const formType = filerSettings.formType === '2551Q' ? '2551Q' : '1701Q';
    const rdo = sanitizeRdo3(filerSettings.rdoCode);

    const regName = (filerSettings.registeredName || '').trim().replace(/"/g, '');
    const lastName = (filerSettings.lastName || '').trim().replace(/"/g, '');
    const firstName = (filerSettings.firstName || '').trim().replace(/"/g, '');
    const middleName = (filerSettings.middleName || '').trim().replace(/"/g, '');

    return {
      payeeTin9,
      branch4,
      periodSlash,
      periodMMYYYY,
      formType,
      rdo,
      regName,
      lastName,
      firstName,
      middleName,
    };
  };

  const getMandatedFileName = () => {
    const { payeeTin9, branch4, periodMMYYYY, formType } = getFilerParams();
    return `${payeeTin9}${branch4}${periodMMYYYY}${formType}.DAT`;
  };

  const generateDatContent = () => {
    const {
      payeeTin9,
      branch4,
      periodSlash,
      formType,
      rdo,
      regName,
      lastName,
      firstName,
      middleName,
    } = getFilerParams();

    // 1. Header Record (BIR RMC No. 61-2024):
    // HSAWT,H{FormType},{PayeeTIN9},{Branch4},"{RegisteredName}","{LastName}","{FirstName}","{MiddleName}",{PeriodMM/YYYY},{RDO}
    const headerRecord = `HSAWT,H${formType},${payeeTin9},${branch4},"${regName}","${lastName}","${firstName}","${middleName}",${periodSlash},${rdo}`;

    // Target certificates (one per certificate in table)
    const targetCertificates = filteredEntries.length > 0 ? filteredEntries : certificates;

    // 2. Detail Records (one per certificate in table):
    // DSAWT,D{FormType},{SeqNo},{PayorTIN9},{PayorBranch4},"{PayorName}","","","",{PeriodMM/YYYY},"{NatureOfIncome}",{ATC},{TaxRate.toFixed(2)},{GrossAmount.toFixed(2)},{TaxWithheld.toFixed(2)}
    const detailRecords = targetCertificates.map((item, idx) => {
      const seqNo = idx + 1;
      const rawPayorTin = item.PayorTIN ?? item.payorTin ?? '';
      const { tin9: payorTin9, branch4: payorBranch4 } = extractTinAndBranch(rawPayorTin);
      const payorName = (item.PayorName ?? item.payorName ?? '').trim().replace(/"/g, '');
      const atc = (item.ATC ?? item.atc ?? 'WI011').trim().replace(/[^A-Za-z0-9]/g, '');

      const natureOfIncome = (
        item.atcDescription ??
        COMMON_ATCS.find((a) => a.code === atc)?.description ??
        'Professional Fees (Individual) - 5%'
      )
        .trim()
        .replace(/"/g, '');

      const taxRateNum = Number(item.TaxRate ?? item.taxRate) || 0;
      const grossNum = Number(item.GrossAmount ?? item.grossAmount ?? item.incomePayment) || 0;
      const withheldNum = Number(item.TaxWithheld ?? item.taxWithheld) || 0;

      return `DSAWT,D${formType},${seqNo},${payorTin9},${payorBranch4},"${payorName}","","","",${periodSlash},"${natureOfIncome}",${atc},${taxRateNum.toFixed(2)},${grossNum.toFixed(2)},${withheldNum.toFixed(2)}`;
    });

    // 3. Control / Totals Record:
    // CSAWT,C{FormType},{PayeeTIN9},{Branch4},{PeriodMM/YYYY},{TotalGross.toFixed(2)},{TotalTaxWithheld.toFixed(2)}
    const totalGross = targetCertificates.reduce(
      (sum, item) => sum + (Number(item.GrossAmount ?? item.grossAmount ?? item.incomePayment) || 0),
      0
    );
    const totalTaxWithheld = targetCertificates.reduce(
      (sum, item) => sum + (Number(item.TaxWithheld ?? item.taxWithheld) || 0),
      0
    );

    const controlRecord = `CSAWT,C${formType},${payeeTin9},${branch4},${periodSlash},${totalGross.toFixed(2)},${totalTaxWithheld.toFixed(2)}`;

    // EXACT STRING LAYOUT (use CRLF \r\n line endings)
    const CRLF = '\r\n';
    return [headerRecord, ...detailRecords, controlRecord].join(CRLF);
  };

  const handleExportDat = () => {
    const datContent = generateDatContent();
    const fileName = getMandatedFileName();
    const blob = new Blob([datContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported BIR ${fileName}`);
  };

  const handleCopyDat = () => {
    const datContent = generateDatContent();
    navigator.clipboard.writeText(datContent);
    setCopiedDat(true);
    setTimeout(() => setCopiedDat(false), 2000);
    showToast('Copied BIR .DAT content (CRLF) to clipboard.');
  };

  const handleExportCSV = () => {
    const headers = [
      'Seq No',
      'Payor TIN',
      'Withholding Agent Registered Name',
      'ATC',
      'Tax Rate',
      'Income Payment (PHP)',
      'Tax Withheld (PHP)',
      'Quarter',
      'Date Received',
    ];

    const rows = filteredEntries.map((e, idx) => [
      idx + 1,
      `"${e.payorTin}"`,
      `"${e.payorName}"`,
      e.atc,
      `${(e.taxRate * 100).toFixed(0)}%`,
      e.incomePayment.toFixed(2),
      e.taxWithheld.toFixed(2),
      e.quarter,
      e.dateReceived,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BIR_SAWT_Schedule_${selectedQuarter}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported SAWT CSV file.');
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-sky-50/90 border border-sky-200/80 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs font-semibold text-sm">
              SAWT
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-serif">
                  SAWT Builder: Summary Alphanumeric Withholding Tax
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300">
                  BIR Form 2307 Schedule
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Compile and reconcile your Certificates of Creditable Tax Withheld at Source (Form 2307)
                for attachment to BIR Forms 1701Q, 1701A, or 2551Q.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Form 2307</span>
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-sky-100 flex items-center gap-2 text-[11px] text-sky-900">
          <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>
            Under BIR Revenue Regulations (RR No. 2-2006 &amp; RR 16-2005), claiming withholding tax credits on Item 58 of Form 1701Q requires submitting this SAWT schedule along with scanned copies of Form 2307 via the BIR eAFS portal.
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-semibold mb-1 flex items-center justify-between">
            <span>Certificates Recorded</span>
            <FileSpreadsheet className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {filteredEntries.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Form 2307 certificates in view</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-semibold mb-1 flex items-center justify-between">
            <span>Total Gross Income Payments</span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {formatPHP(totalIncome)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Base payments from clients</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
          <div className="text-emerald-800 text-xs font-semibold mb-1 flex items-center justify-between">
            <span>Total Tax Withheld (Claimable Credits)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-800 font-bold">
            {formatPHP(totalWithheld)}
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-1">
            Transfers directly to Item 58 (1701Q) or Item 18A (2551Q)
          </p>
        </div>
      </div>

      {/* Compact Filer Metadata Settings (BIR RMC No. 61-2024) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 font-serif">
                  Filer Settings (BIR RMC No. 61-2024)
                </h3>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                  {getMandatedFileName()}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Taxpayer metadata embedded into BIR Header, Detail, and Control .DAT records
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsFilerModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Filer Settings Modal</span>
          </button>
        </div>

        {/* Compact Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-3 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Taxpayer TIN (9 digits) *
            </label>
            <input
              type="text"
              placeholder="123456789"
              maxLength={11}
              value={filerSettings.taxpayerTin}
              onChange={(e) =>
                setFilerSettings((prev) => ({
                  ...prev,
                  taxpayerTin: e.target.value.replace(/[\s-]/g, ''),
                }))
              }
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Branch (4 digits) *
            </label>
            <input
              type="text"
              placeholder="0000"
              maxLength={4}
              value={filerSettings.branchCode}
              onChange={(e) =>
                setFilerSettings((prev) => ({
                  ...prev,
                  branchCode: e.target.value.replace(/\D/g, '').slice(0, 4),
                }))
              }
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              RDO Code (3 digits) *
            </label>
            <input
              type="text"
              placeholder="008"
              maxLength={3}
              value={filerSettings.rdoCode}
              onChange={(e) =>
                setFilerSettings((prev) => ({
                  ...prev,
                  rdoCode: e.target.value.replace(/\D/g, '').slice(0, 3),
                }))
              }
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Form Type *
            </label>
            <select
              value={filerSettings.formType}
              onChange={(e) =>
                setFilerSettings((prev) => ({
                  ...prev,
                  formType: e.target.value as SawtFormType,
                }))
              }
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            >
              <option value="1701Q">1701Q</option>
              <option value="2551Q">2551Q</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Period Quarter *
            </label>
            <select
              value={filerSettings.periodQuarter}
              onChange={(e) => {
                const q = e.target.value as Quarter;
                setFilerSettings((prev) => ({
                  ...prev,
                  periodQuarter: q,
                  periodEnd: getQuarterPeriodEnd(q, prev.periodYear),
                }));
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            >
              <option value="Q1">Q1 (03/{filerSettings.periodYear})</option>
              <option value="Q2">Q2 (06/{filerSettings.periodYear})</option>
              <option value="Q3">Q3 (09/{filerSettings.periodYear})</option>
              <option value="Q4">Q4 (12/{filerSettings.periodYear})</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Period End (MM/YYYY) *
            </label>
            <input
              type="text"
              placeholder="03/2026"
              value={filerSettings.periodEnd}
              onChange={(e) =>
                setFilerSettings((prev) => ({
                  ...prev,
                  periodEnd: e.target.value,
                }))
              }
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-semibold text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Taxpayer Name Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Taxpayer Registered Name *
            </label>
            <input
              type="text"
              placeholder="e.g. JUAN DELA CRUZ"
              value={filerSettings.registeredName}
              onChange={(e) =>
                setFilerSettings((prev) => ({
                  ...prev,
                  registeredName: e.target.value.toUpperCase(),
                }))
              }
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 uppercase font-semibold text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Last Name
            </label>
            <input
              type="text"
              placeholder="e.g. DELA CRUZ"
              value={filerSettings.lastName}
              onChange={(e) =>
                setFilerSettings((prev) => ({
                  ...prev,
                  lastName: e.target.value.toUpperCase(),
                }))
              }
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 uppercase text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              First Name
            </label>
            <input
              type="text"
              placeholder="e.g. JUAN"
              value={filerSettings.firstName}
              onChange={(e) =>
                setFilerSettings((prev) => ({
                  ...prev,
                  firstName: e.target.value.toUpperCase(),
                }))
              }
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 uppercase text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Middle Name
            </label>
            <input
              type="text"
              placeholder="e.g. SANTOS (optional)"
              value={filerSettings.middleName}
              onChange={(e) =>
                setFilerSettings((prev) => ({
                  ...prev,
                  middleName: e.target.value.toUpperCase(),
                }))
              }
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 uppercase text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Table Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Quarter Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-600">Quarter:</span>
            <div className="inline-flex flex-wrap rounded-lg border border-slate-200 p-0.5 bg-slate-50 gap-0.5">
              {(['ALL', 'Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setSelectedQuarter(q);
                    if (q !== 'ALL') {
                      setFilerSettings((prev) => ({
                        ...prev,
                        periodQuarter: q,
                        periodEnd: getQuarterPeriodEnd(q, prev.periodYear),
                      }));
                    }
                  }}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    selectedQuarter === q
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {q === 'ALL' ? 'All Quarters' : q}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Export Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search payor or TIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-hidden w-40 sm:w-52"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsFilerModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Configure Filer Metadata for BIR SAWT .DAT export"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Filer Settings</span>
            </button>

            <button
              type="button"
              onClick={() => setCertificates([])}
              disabled={certificates.length === 0}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-transparent hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Clear all Form 2307 certificates"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>Clear All</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Download SAWT schedule as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportDat}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
              title={`Generate and download official BIR RMC No. 61-2024 SAWT .DAT file (${getMandatedFileName()})`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export .DAT File</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDatPreviewOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Inspect BIR .DAT file format before downloading"
            >
              <Code className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">Preview .DAT</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="mt-4 overflow-x-auto w-full border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3 w-36">Payor TIN</th>
                <th className="py-2.5 px-3">Withholding Agent Name</th>
                <th className="py-2.5 px-3 w-24">ATC</th>
                <th className="py-2.5 px-3 w-20 text-center">Rate</th>
                <th className="py-2.5 px-3 w-32 text-right">Income Payment</th>
                <th className="py-2.5 px-3 w-32 text-right">Tax Withheld</th>
                <th className="py-2.5 px-3 w-16 text-center">Qtr</th>
                <th className="py-2.5 px-3 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No Form 2307 certificates found for the selected filter.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((cert, index) => (
                  <tr key={cert.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                      {cert.payorTin || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {cert.payorName}
                      <span className="block text-[10px] text-slate-400 font-mono">
                        Date: {cert.dateReceived}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-sky-800 font-semibold">
                      {cert.atc}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                      {(cert.taxRate * 100).toFixed(0)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                      {formatPHP(cert.incomePayment)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                      {formatPHP(cert.taxWithheld)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                      {cert.quarter}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditForm(cert)}
                          className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 cursor-pointer"
                          title="Edit certificate"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCertificates(prev => prev.filter(item => item.id !== cert.id))}
                          className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                          title="Delete certificate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredEntries.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300">
                  <td colSpan={5} className="py-2.5 px-3 text-right text-slate-700 uppercase tracking-wider text-[11px]">
                    Schedule Totals:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                    {formatPHP(totalIncome)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-800">
                    {formatPHP(totalWithheld)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-sky-50 border-b border-sky-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                {editingId ? 'Edit BIR Form 2307 Entry' : 'Add New Form 2307 Certificate'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Withholding Agent TIN
                  </label>
                  <input
                    type="text"
                    placeholder="000-000-000-000"
                    value={formPayorTin}
                    onChange={(e) => setFormPayorTin(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Taxable Quarter
                  </label>
                  <select
                    value={formQuarter}
                    onChange={(e) => setFormQuarter(e.target.value as Quarter)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  >
                    <option value="Q1">Q1 (Jan–Mar)</option>
                    <option value="Q2">Q2 (Apr–Jun)</option>
                    <option value="Q3">Q3 (Jul–Sep)</option>
                    <option value="Q4">Q4 (Oct–Dec)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Withholding Agent Registered Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. ACME TECH SERVICES INC."
                  value={formPayorName}
                  onChange={(e) => setFormPayorName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-semibold uppercase focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Alphanumeric Tax Code (ATC)
                </label>
                <select
                  value={formAtc}
                  onChange={(e) => handleAtcChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                >
                  {COMMON_ATCS.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} ({a.rateLabel}) - {a.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Gross Income Payment (PHP)
                  </label>
                  <input
                    type="text"
                    placeholder="0.00"
                    value={formIncomePayment}
                    onChange={(e) => handleIncomeChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Tax Withheld (PHP)
                  </label>
                  <input
                    type="text"
                    placeholder="0.00"
                    value={formTaxWithheld}
                    onChange={(e) => setFormTaxWithheld(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Date on Certificate
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs cursor-pointer"
                >
                  {editingId ? 'Save Changes' : 'Add Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filer Settings Modal (BIR RMC No. 61-2024) */}
      {isFilerModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-sky-50 border-b border-sky-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-sky-700" />
                <h3 className="text-sm font-bold text-slate-900 font-serif">
                  Filer Settings (BIR RMC No. 61-2024)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFilerModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-sky-50/80 rounded-lg border border-sky-200 text-sky-900 space-y-1">
                <p className="font-semibold text-xs flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>Mandated Output Filename:</span>
                </p>
                <p className="font-mono text-xs font-bold text-sky-950 bg-white/80 px-2 py-1 rounded border border-sky-200 inline-block">
                  {getMandatedFileName()}
                </p>
                <p className="text-[11px] text-sky-700">
                  Format: [PayeeTIN9][Branch4][PeriodMMYYYY][FormType].DAT
                </p>
              </div>

              {/* TIN & Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Taxpayer TIN (9 digits) *
                  </label>
                  <input
                    type="text"
                    placeholder="123456789"
                    maxLength={11}
                    value={filerSettings.taxpayerTin}
                    onChange={(e) =>
                      setFilerSettings((prev) => ({
                        ...prev,
                        taxpayerTin: e.target.value.replace(/[\s-]/g, ''),
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Hyphens and spaces are removed
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Branch Code (4 digits) *
                  </label>
                  <input
                    type="text"
                    placeholder="0000"
                    maxLength={4}
                    value={filerSettings.branchCode}
                    onChange={(e) =>
                      setFilerSettings((prev) => ({
                        ...prev,
                        branchCode: e.target.value.replace(/\D/g, '').slice(0, 4),
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Default: 0000 (Head Office)
                  </span>
                </div>
              </div>

              {/* Registered Name */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Taxpayer Registered Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. JUAN DELA CRUZ"
                  value={filerSettings.registeredName}
                  onChange={(e) =>
                    setFilerSettings((prev) => ({
                      ...prev,
                      registeredName: e.target.value.toUpperCase(),
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold uppercase focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              {/* Individual Name Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="DELA CRUZ"
                    value={filerSettings.lastName}
                    onChange={(e) =>
                      setFilerSettings((prev) => ({
                        ...prev,
                        lastName: e.target.value.toUpperCase(),
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 uppercase focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="JUAN"
                    value={filerSettings.firstName}
                    onChange={(e) =>
                      setFilerSettings((prev) => ({
                        ...prev,
                        firstName: e.target.value.toUpperCase(),
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 uppercase focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    placeholder="SANTOS"
                    value={filerSettings.middleName}
                    onChange={(e) =>
                      setFilerSettings((prev) => ({
                        ...prev,
                        middleName: e.target.value.toUpperCase(),
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 uppercase focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* RDO Code, Form Type & Period */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    RDO Code (3 digits) *
                  </label>
                  <input
                    type="text"
                    placeholder="008"
                    maxLength={3}
                    value={filerSettings.rdoCode}
                    onChange={(e) =>
                      setFilerSettings((prev) => ({
                        ...prev,
                        rdoCode: e.target.value.replace(/\D/g, '').slice(0, 3),
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Form Type *
                  </label>
                  <select
                    value={filerSettings.formType}
                    onChange={(e) =>
                      setFilerSettings((prev) => ({
                        ...prev,
                        formType: e.target.value as SawtFormType,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  >
                    <option value="1701Q">1701Q</option>
                    <option value="2551Q">2551Q</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Period End *
                  </label>
                  <select
                    value={filerSettings.periodQuarter}
                    onChange={(e) => {
                      const q = e.target.value as Quarter;
                      setFilerSettings((prev) => ({
                        ...prev,
                        periodQuarter: q,
                        periodEnd: getQuarterPeriodEnd(q, prev.periodYear),
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  >
                    <option value="Q1">Q1 (03/{filerSettings.periodYear})</option>
                    <option value="Q2">Q2 (06/{filerSettings.periodYear})</option>
                    <option value="Q3">Q3 (09/{filerSettings.periodYear})</option>
                    <option value="Q4">Q4 (12/{filerSettings.periodYear})</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Custom Period End (MM/YYYY)
                </label>
                <input
                  type="text"
                  placeholder="03/2026"
                  value={filerSettings.periodEnd}
                  onChange={(e) =>
                    setFilerSettings((prev) => ({
                      ...prev,
                      periodEnd: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFilerModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Save &amp; Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DAT File Preview Modal (BIR RMC No. 61-2024 Specifications) */}
      {isDatPreviewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold font-mono">
                  {getMandatedFileName()} Preview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDatPreviewOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-xs text-slate-600 bg-sky-50 border border-sky-200 rounded-lg p-3 space-y-1.5">
                <p className="font-semibold text-sky-900">
                  Official BIR RMC No. 61-2024 SAWT File Specification:
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-sky-800 font-mono">
                  <li>
                    <strong>Header:</strong> HSAWT,H{filerSettings.formType},{sanitizeTin9(filerSettings.taxpayerTin)},{sanitizeBranch4(filerSettings.branchCode)},&quot;{filerSettings.registeredName}&quot;,&quot;{filerSettings.lastName}&quot;,&quot;{filerSettings.firstName}&quot;,&quot;{filerSettings.middleName}&quot;,{formatPeriodSlash(filerSettings.periodEnd, filerSettings.periodQuarter, filerSettings.periodYear)},{sanitizeRdo3(filerSettings.rdoCode)}
                  </li>
                  <li>
                    <strong>Detail:</strong> DSAWT,D{filerSettings.formType},&#123;SeqNo&#125;,&#123;PayorTIN9&#125;,&#123;PayorBranch4&#125;,&quot;&#123;PayorName&#125;&quot;,&quot;&quot;,&quot;&quot;,&quot;&quot;,{formatPeriodSlash(filerSettings.periodEnd, filerSettings.periodQuarter, filerSettings.periodYear)},&quot;&#123;NatureOfIncome&#125;&quot;,&#123;ATC&#125;,&#123;TaxRate.toFixed(2)&#125;,&#123;GrossAmount.toFixed(2)&#125;,&#123;TaxWithheld.toFixed(2)&#125;
                  </li>
                  <li>
                    <strong>Control:</strong> CSAWT,C{filerSettings.formType},{sanitizeTin9(filerSettings.taxpayerTin)},{sanitizeBranch4(filerSettings.branchCode)},{formatPeriodSlash(filerSettings.periodEnd, filerSettings.periodQuarter, filerSettings.periodYear)},&#123;TotalGross.toFixed(2)&#125;,&#123;TotalTaxWithheld.toFixed(2)&#125;
                  </li>
                </ul>
                <p className="text-[11px] text-sky-700 pt-1 border-t border-sky-200">
                  Line Endings: <strong>CRLF (\r\n)</strong> | Filename: <strong>{getMandatedFileName()}</strong>
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-700">Raw .DAT Text File Output (CRLF formatted):</span>
                  <button
                    type="button"
                    onClick={handleCopyDat}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors cursor-pointer"
                  >
                    {copiedDat ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                    <span>{copiedDat ? 'Copied' : 'Copy All'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto max-h-64 whitespace-pre border border-slate-800 select-all">
                  {generateDatContent()}
                </pre>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <span className="text-xs text-slate-500">
                  {filteredEntries.length} detail record(s) ready for export
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDatPreviewOpen(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleExportDat();
                      setIsDatPreviewOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {getMandatedFileName()}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 border border-slate-800 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default SawtBuilder;
