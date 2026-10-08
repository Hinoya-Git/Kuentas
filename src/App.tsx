import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Calculator,
  CheckCircle2,
  FileCheck2,
  Receipt,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { CSVImportModal } from './components/CSVImportModal.tsx';
import { DonateModal } from './components/DonateModal.tsx';
import { Header } from './components/Header.tsx';
import { QuarterSelector } from './components/QuarterSelector.tsx';
import { SummaryCards } from './components/SummaryCards.tsx';
import { LedgerTab } from './components/Tabs/LedgerTab.tsx';
import { TaxGuideTab } from './components/Tabs/TaxGuideTab.tsx';
import { TransactionsTab } from './components/Tabs/TransactionsTab.tsx';
import { TaxpayerModal } from './components/TaxpayerModal.tsx';
import { TransactionModal } from './components/TransactionModal.tsx';
import {
  BIR1701QComputation,
  Quarter,
  QuarterSettings,
  TaxpayerProfile,
  Transaction,
} from './types/index.ts';
import { formatPHP } from './utils/formatters.ts';
import {
  DEFAULT_TAXPAYER,
  EMPTY_QUARTER_SETTINGS,
  EMPTY_TAXPAYER,
  INITIAL_QUARTER_SETTINGS,
  SAMPLE_TRANSACTIONS,
} from './utils/sampleData.ts';
import {
  calculateQuarter2307FromTransactions,
  calculateQuarterGross,
  compute1701Q,
  getPriorQuartersGrossFromTransactions,
} from './utils/taxEngine.ts';

// Storage keys for local browser persistence
const STORAGE_KEYS = {
  TRANSACTIONS: 'kuentas_txns_v3',
  SETTINGS: 'kuentas_settings_v3',
  TAXPAYER: 'kuentas_taxpayer_v3',
  ACTIVE_QUARTER: 'kuentas_quarter_v3',
  ACTIVE_YEAR: 'kuentas_year_v3',
  ACTIVE_TAB: 'kuentas_tab_v3',
};

type ActiveTab = 'transactions' | 'taxguide' | 'ledger';

export default function App() {
  // 1. Taxpayer Profile State (persisted in localStorage)
  const [taxpayer, setTaxpayer] = useState<TaxpayerProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TAXPAYER);
      return saved ? JSON.parse(saved) : EMPTY_TAXPAYER;
    } catch {
      return EMPTY_TAXPAYER;
    }
  });

  // 2. Quarter and Year State (persisted in localStorage)
  const [quarter, setQuarter] = useState<Quarter>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_QUARTER) as Quarter;
      return saved && ['Q1', 'Q2', 'Q3', 'Q4'].includes(saved) ? saved : 'Q1';
    } catch {
      return 'Q1';
    }
  });

  const [year, setYear] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_YEAR);
      return saved ? parseInt(saved, 10) : 2026;
    } catch {
      return 2026;
    }
  });

  // 3. Transactions State (persisted in localStorage)
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 4. Quarter Settings Map (persisted in localStorage)
  const [quarterSettingsMap, setQuarterSettingsMap] = useState<Record<string, QuarterSettings>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : EMPTY_QUARTER_SETTINGS;
    } catch {
      return EMPTY_QUARTER_SETTINGS;
    }
  });

  // 5. Active Tab (persisted in localStorage)
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) as ActiveTab;
      return saved && ['transactions', 'taxguide', 'ledger'].includes(saved)
        ? saved
        : 'transactions';
    } catch {
      return 'transactions';
    }
  });

  // 6. Modals & Dialogs
  const [isTaxpayerModalOpen, setIsTaxpayerModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [isResetSampleModalOpen, setIsResetSampleModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);

  // 7. Toast Notification Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 3200);
  };

  // LocalStorage synchronizations
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to persist transactions', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(quarterSettingsMap));
    } catch (e) {
      console.error('Failed to persist settings', e);
    }
  }, [quarterSettingsMap]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TAXPAYER, JSON.stringify(taxpayer));
    } catch (e) {
      console.error('Failed to persist taxpayer', e);
    }
  }, [taxpayer]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_QUARTER, quarter);
    } catch (e) {
      console.error('Failed to persist quarter', e);
    }
  }, [quarter]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_YEAR, year.toString());
    } catch (e) {
      console.error('Failed to persist year', e);
    }
  }, [year]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTab);
    } catch (e) {
      console.error('Failed to persist active tab', e);
    }
  }, [activeTab]);

  // Derived current quarter settings
  const currentSettings = useMemo<QuarterSettings>(() => {
    const existing = quarterSettingsMap[quarter];
    if (existing) {
      return { ...existing, quarter, year };
    }
    return {
      quarter,
      year,
      prevQuarterTaxableIncome: 0,
      prevQuarterTaxPaid: 0,
      currentQuarter2307Withheld: 0,
    };
  }, [quarterSettingsMap, quarter, year]);

  // Update Settings handler
  const handleUpdateQuarterSettings = (updates: Partial<QuarterSettings>) => {
    setQuarterSettingsMap((prev) => {
      const current = prev[quarter] || {
        quarter,
        year,
        prevQuarterTaxableIncome: 0,
        prevQuarterTaxPaid: 0,
        currentQuarter2307Withheld: 0,
      };
      return {
        ...prev,
        [quarter]: {
          ...current,
          ...updates,
          quarter,
          year,
        },
      };
    });
  };

  // Calculations
  const currentQuarterGross = useMemo(() => {
    return calculateQuarterGross(transactions, quarter);
  }, [transactions, quarter]);

  const priorQuarterCalculatedGross = useMemo(() => {
    return getPriorQuartersGrossFromTransactions(transactions, quarter);
  }, [transactions, quarter]);

  const currentQuarterCalculated2307 = useMemo(() => {
    return calculateQuarter2307FromTransactions(transactions, quarter);
  }, [transactions, quarter]);

  const computation = useMemo<BIR1701QComputation>(() => {
    return compute1701Q(currentQuarterGross, currentSettings);
  }, [currentQuarterGross, currentSettings]);

  // Fast direct addition from manual entry row
  const handleAddTransactionDirect = (
    data: Omit<Transaction, 'id' | 'createdAt'>
  ) => {
    const newTxn: Transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: data.date,
      payor: data.payor,
      reference: data.reference,
      amount: data.amount,
      quarter: data.quarter,
      notes: data.notes,
      category: data.category || 'Professional Fees',
      withholding2307Amount: data.withholding2307Amount,
      createdAt: Date.now(),
    };
    setTransactions((prev) => [newTxn, ...prev]);
    showToast(`Recorded ${formatPHP(data.amount)} for ${data.payor}`);
  };

  // Modal Save (Add / Edit)
  const handleSaveTransactionModal = (
    data: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }
  ) => {
    if (data.id) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === data.id
            ? {
                ...t,
                date: data.date,
                payor: data.payor,
                reference: data.reference,
                amount: data.amount,
                quarter: data.quarter,
                notes: data.notes,
                category: data.category,
                withholding2307Amount: data.withholding2307Amount,
              }
            : t
        )
      );
      showToast('Transaction updated successfully.');
    } else {
      const newTxn: Transaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        date: data.date,
        payor: data.payor,
        reference: data.reference,
        amount: data.amount,
        quarter: data.quarter,
        notes: data.notes,
        category: data.category,
        withholding2307Amount: data.withholding2307Amount,
        createdAt: Date.now(),
      };
      setTransactions((prev) => [newTxn, ...prev]);
      showToast('New transaction recorded.');
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast('Transaction deleted.');
  };

  // RESET TO DEFAULT SAMPLE DATA: Confirmed handler
  const handleResetToSampleData = () => {
    setTransactions(SAMPLE_TRANSACTIONS);
    setTaxpayer(DEFAULT_TAXPAYER);
    setQuarterSettingsMap(INITIAL_QUARTER_SETTINGS);
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(SAMPLE_TRANSACTIONS));
      localStorage.setItem(STORAGE_KEYS.TAXPAYER, JSON.stringify(DEFAULT_TAXPAYER));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_QUARTER_SETTINGS));
    } catch (e) {
      console.error('Failed to persist sample data reset', e);
    }
    showToast('Reset to default sample data successfully.');
  };

  // CLEAR ALL FEATURE: Confirmed handler
  const handleClearAllData = () => {
    setTransactions([]);
    setQuarterSettingsMap(EMPTY_QUARTER_SETTINGS);
    setTaxpayer(EMPTY_TAXPAYER);
    try {
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.TAXPAYER);
    } catch (e) {
      console.error('Failed to clear storage', e);
    }
    showToast('All transactions and data cleared. Application state is now completely empty.');
  };

  const handleCSVImport = (
    newTxns: Transaction[],
    mode: 'append' | 'replace'
  ) => {
    if (mode === 'replace') {
      setTransactions((prev) => [
        ...prev.filter((t) => t.quarter !== quarter),
        ...newTxns,
      ]);
      showToast(`Replaced ${quarter} with ${newTxns.length} imported transactions.`);
    } else {
      setTransactions((prev) => [...newTxns, ...prev]);
      showToast(`Appended ${newTxns.length} transactions from CSV.`);
    }
  };

  // Backup & Restore
  const handleExportBackup = () => {
    const backupData = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      taxpayer,
      quarterSettingsMap,
      transactions,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute(
      'download',
      `kuentas_backup_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Backup JSON exported successfully.');
  };

  const isQ4 = quarter === 'Q4';

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* App Header & Legal Notice */}
      <Header
        taxpayer={taxpayer}
        onOpenTaxpayerModal={() => setIsTaxpayerModalOpen(true)}
        onPromptResetSample={() => setIsResetSampleModalOpen(true)}
        onPromptClearAll={() => setIsClearAllModalOpen(true)}
        onExportBackup={handleExportBackup}
        onOpenDonateModal={() => setShowDonateModal(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Global Quarter & Cumulative Settings Controller */}
        <QuarterSelector
          currentQuarter={quarter}
          onQuarterChange={setQuarter}
          year={year}
          onYearChange={setYear}
          settings={currentSettings}
          onUpdateSettings={handleUpdateQuarterSettings}
          priorQuarterCalculatedGross={priorQuarterCalculatedGross}
          currentQuarterCalculated2307={currentQuarterCalculated2307}
        />

        {/* Real-time Summary Metric KPI Cards */}
        <SummaryCards
          computation={computation}
          onCopyTaxDue={() => showToast('Copied Item 63 value to clipboard!')}
        />

        {/* Primary View Navigation Tabs */}
        <div className="border-b border-slate-200 mb-6 print:hidden">
          <nav className="flex overflow-x-auto space-x-2 sm:space-x-4 pb-0.5" aria-label="Tabs">
            {/* Tab 1: Transactions Data Grid */}
            <button
              type="button"
              onClick={() => setActiveTab('transactions')}
              className={`shrink-0 pb-3.5 px-3 border-b-2 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all ${
                activeTab === 'transactions'
                  ? 'border-emerald-700 text-emerald-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Receipt className="w-4 h-4 text-emerald-700" />
              <span>1. Inflow Transactions</span>
              <span className="text-[11px] font-mono bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
                {transactions.filter((t) => t.quarter === quarter).length}
              </span>
            </button>

            {/* Tab 2: BIR Form Cheat Sheet (1701Q for Q1-Q3, 1701A for Q4 Annual) */}
            <button
              type="button"
              onClick={() => setActiveTab('taxguide')}
              className={`shrink-0 pb-3.5 px-3 border-b-2 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all ${
                activeTab === 'taxguide'
                  ? 'border-emerald-700 text-emerald-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Calculator className="w-4 h-4 text-emerald-700" />
              <span>
                {isQ4 ? '2. BIR Form 1701A Cheat Sheet' : '2. BIR Form 1701Q Cheat Sheet'}
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                  computation.isOverpayment
                    ? 'bg-emerald-100 text-emerald-800'
                    : computation.item63_netTaxPayable === 0
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {computation.isOverpayment
                  ? 'Credit'
                  : computation.item63_netTaxPayable === 0
                  ? '₱0 Due'
                  : 'Payable'}
              </span>
            </button>

            {/* Tab 3: Official Cash Receipts Journal */}
            <button
              type="button"
              onClick={() => setActiveTab('ledger')}
              className={`shrink-0 pb-3.5 px-3 border-b-2 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all ${
                activeTab === 'ledger'
                  ? 'border-emerald-700 text-emerald-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>3. Cash Receipts Journal</span>
              <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-semibold hidden sm:inline">
                Books of Accounts
              </span>
            </button>
          </nav>
        </div>

        {/* Tab Content Panes */}
        <div>
          {activeTab === 'transactions' && (
            <TransactionsTab
              transactions={transactions}
              quarter={quarter}
              onAddTransaction={handleAddTransactionDirect}
              onOpenFullModal={() => {
                setEditingTransaction(null);
                setIsTransactionModalOpen(true);
              }}
              onEditClick={(txn) => {
                setEditingTransaction(txn);
                setIsTransactionModalOpen(true);
              }}
              onDeleteClick={handleDeleteTransaction}
              onPromptClearAll={() => setIsClearAllModalOpen(true)}
              onPromptResetSample={() => setIsResetSampleModalOpen(true)}
              onOpenCSVImport={() => setIsCSVModalOpen(true)}
            />
          )}

          {activeTab === 'taxguide' && (
            <TaxGuideTab computation={computation} taxpayer={taxpayer} />
          )}

          {activeTab === 'ledger' && (
            <LedgerTab
              transactions={transactions}
              quarter={quarter}
              year={year}
              taxpayer={taxpayer}
              onOpenTaxpayerModal={() => setIsTaxpayerModalOpen(true)}
            />
          )}
        </div>
      </main>

      {/* App Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-1.5">
          <p className="font-medium text-slate-700">
            Kuentas · Dedicated to Filipino Freelancers, Virtual Assistants &amp; Self-Employed Professionals
          </p>
          <p className="text-[11px] text-slate-500">
            Compliant with TRAIN Law (Republic Act No. 10963) · Section 24(A)(2)(b) &amp; Section 116 · All computations and records remain strictly local to your browser.
          </p>
        </div>
      </footer>

      {/* Transaction Add / Edit Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransactionModal}
        initialData={editingTransaction}
        defaultQuarter={quarter}
      />

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onImport={handleCSVImport}
        defaultQuarter={quarter}
      />

      {/* Taxpayer Profile Modal */}
      <TaxpayerModal
        isOpen={isTaxpayerModalOpen}
        onClose={() => setIsTaxpayerModalOpen(false)}
        taxpayer={taxpayer}
        onSave={(updated) => {
          setTaxpayer(updated);
          showToast('Taxpayer details updated.');
        }}
      />

      {/* Buy Me a Coffee / Support Modal */}
      <DonateModal
        isOpen={showDonateModal}
        onClose={() => setShowDonateModal(false)}
      />

      {/* Reset to Sample Data Confirmation Modal */}
      {isResetSampleModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <RotateCcw className="w-6 h-6 text-emerald-800" />
              </div>

              <h3 className="text-base font-bold text-slate-900">
                Reset to Default Sample Data?
              </h3>

              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                This will populate realistic Philippine freelancer transactions (overseas clients, local clients with Form 2307 creditable withholding credits, and sample registered taxpayer details) to explore calculations, cheat sheets, and books of accounts.
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsResetSampleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleResetToSampleData();
                    setIsResetSampleModalOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-md shadow-xs transition-colors"
                >
                  Yes, Load Sample Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Data Strict Confirmation Modal */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-red-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>

              <h3 className="text-base font-bold text-slate-900">
                Wipe All Transactions &amp; Data?
              </h3>

              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                This action is <strong className="text-red-700">irreversible</strong>. It will permanently delete all recorded transactions across all quarters, reset quarter inputs (Item 50, Item 56, Item 58) to ₱0.00, clear profile info, and leave the application completely empty.
              </p>

              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200 text-xs text-red-900 font-mono">
                Total transactions to be deleted: <strong>{transactions.length}</strong>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsClearAllModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleClearAllData();
                    setIsClearAllModalOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-xs transition-colors"
                >
                  Yes, Clear All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-150 print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
