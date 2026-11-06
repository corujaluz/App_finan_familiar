import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { MonthSelector } from './components/MonthSelector';
import { SummaryCards } from './components/SummaryCards';
import { TransactionList } from './components/TransactionList';
import { ChartsAnalytics } from './components/ChartsAnalytics';
import { BudgetLimits } from './components/BudgetLimits';
import { FamilyMembersManager } from './components/FamilyMembersManager';
import { IncomeSourcesManager } from './components/IncomeSourcesManager';
import { PaymentConfirmModal } from './components/PaymentConfirmModal';
import { TransactionModal } from './components/TransactionModal';
import { ExportImportModal } from './components/ExportImportModal';
import { LoginModal } from './components/LoginModal';
import { AppState, DEFAULT_ALARM_SETTINGS, DEFAULT_USER_ACCOUNTS, loadStoredData, persistData, exportCreditCardExpensesAsCSV } from './services/storage';
import { AlarmSettingsModal } from './components/AlarmSettingsModal';
import { ActiveAlarmBanner } from './components/ActiveAlarmBanner';
import { CreditCardManager } from './components/CreditCardManager';
import { playAlarmSound } from './utils/soundAlarm';
import { AlarmSettings, Category, CreditCardExpense, FamilyMember, IncomeSource, PaymentMethod, Transaction, UserAccount } from './types/finance';
import { INITIAL_CATEGORIES, INITIAL_CREDIT_CARD_EXPENSES, INITIAL_INCOME_SOURCES, INITIAL_MEMBERS, INITIAL_TRANSACTIONS } from './data/initialData';
import { formatBRL, formatMonthYear } from './utils/formatters';
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, ShieldAlert, Briefcase, Bell, CreditCard } from 'lucide-react';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('finanfamilia_dark_mode');
      if (stored !== null) return stored === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply dark mode class to root HTML
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('finanfamilia_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  // App Data State
  const [appState, setAppState] = useState<AppState>(() => loadStoredData());

  // Active month key (defaults to "2026-11" or current month)
  const [currentMonthKey, setCurrentMonthKey] = useState<string>(() => {
    const today = new Date().toISOString().slice(0, 7);
    return today.startsWith('2026') ? today : '2026-11';
  });

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState<'overview' | 'transactions' | 'credit_card' | 'income_sources' | 'charts' | 'budgets' | 'members'>('overview');

  // Modals state
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [txToConfirmPayment, setTxToConfirmPayment] = useState<Transaction | null>(null);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [isAlarmSettingsOpen, setIsAlarmSettingsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSessionMuted, setIsSessionMuted] = useState(false);
  const [initialStatusFilter, setInitialStatusFilter] = useState<string>('all');

  // Active User Account: Eduardo Heckler (Admin) or Graciela Heckler (Usuário)
  const currentUser: UserAccount = useMemo(() => {
    const accounts = appState.userAccounts || DEFAULT_USER_ACCOUNTS;
    const found = accounts.find((u) => u.id === appState.activeUserId);
    return found || accounts[0] || DEFAULT_USER_ACCOUNTS[0];
  }, [appState.activeUserId, appState.userAccounts]);

  const handleLogin = (account: UserAccount) => {
    setAppState((prev) => ({
      ...prev,
      activeUserId: account.id,
    }));
    setIsLoginModalOpen(false);
  };

  const handleUpdatePin = (userId: string, newPin: string) => {
    setAppState((prev) => ({
      ...prev,
      userAccounts: (prev.userAccounts || DEFAULT_USER_ACCOUNTS).map((u) =>
        u.id === userId ? { ...u, pin: newPin } : u
      ),
    }));
  };

  // Persist whenever state changes
  useEffect(() => {
    persistData(appState);
  }, [appState]);

  // Current month transactions
  const monthTransactions = useMemo(() => {
    return appState.transactions.filter((tx) => tx.dueDate.startsWith(currentMonthKey));
  }, [appState.transactions, currentMonthKey]);

  // Today reference date
  const todayStr = new Date().toISOString().split('T')[0];

  // Triggered bills according to user editable period threshold
  const triggeredBills = useMemo(() => {
    const expenses = appState.transactions.filter(
      (tx) => tx.type === 'expense' && tx.status !== 'paid' && tx.enableAlarm !== false
    );

    const overdue = expenses.filter((tx) => tx.dueDate < todayStr);

    const todayDate = new Date(todayStr);
    const thresholdDays = appState.alarmSettings.upcomingDaysThreshold || 3;

    const upcoming = expenses.filter((tx) => {
      if (tx.dueDate < todayStr) return false;
      const due = new Date(tx.dueDate);
      const diffTime = due.getTime() - todayDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const specificNotice = tx.alarmDaysNotice ?? thresholdDays;
      return diffDays <= specificNotice;
    });

    return { overdue, upcoming };
  }, [appState.transactions, appState.alarmSettings.upcomingDaysThreshold, todayStr]);

  // Total alarm alert count
  const totalAlarmAlertCount = useMemo(() => {
    let count = 0;
    if (appState.alarmSettings.alertOverdue) count += triggeredBills.overdue.length;
    if (appState.alarmSettings.alertUpcoming) count += triggeredBills.upcoming.length;
    return count;
  }, [appState.alarmSettings, triggeredBills]);

  // Audible Alarm Periodic Repetition Timer
  useEffect(() => {
    if (!appState.alarmSettings.enabled || isSessionMuted || totalAlarmAlertCount === 0) {
      return;
    }

    const intervalMin = appState.alarmSettings.repeatIntervalMinutes;
    if (intervalMin <= 0) return;

    const intervalId = setInterval(() => {
      playAlarmSound(appState.alarmSettings.soundType, appState.alarmSettings.volume);
    }, intervalMin * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [appState.alarmSettings, isSessionMuted, totalAlarmAlertCount]);

  // Handler for manual alarm sound
  const handlePlayAlarmManual = () => {
    playAlarmSound(appState.alarmSettings.soundType, appState.alarmSettings.volume);
  };

  // Handler for saving alarm settings
  const handleSaveAlarmSettings = (newSettings: AlarmSettings) => {
    setAppState((prev) => ({
      ...prev,
      alarmSettings: newSettings,
    }));
  };

  // Handlers for Transactions
  const handleSaveTransaction = (
    data: Omit<Transaction, 'id' | 'createdAt'>,
    editId?: string
  ) => {
    setAppState((prev) => {
      let updatedList: Transaction[];
      if (editId) {
        updatedList = prev.transactions.map((tx) =>
          tx.id === editId ? { ...tx, ...data } : tx
        );
      } else {
        const newTx: Transaction = {
          ...data,
          id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          createdAt: new Date().toISOString().split('T')[0],
        };
        updatedList = [newTx, ...prev.transactions];
      }
      return { ...prev, transactions: updatedList };
    });
  };

  const handleDeleteTransaction = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  };

  const handleDuplicateTransaction = (tx: Transaction) => {
    const duplicated: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: `${tx.title} (Cópia)`,
      status: 'pending',
      paymentDate: undefined,
      receiptNote: undefined,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAppState((prev) => ({
      ...prev,
      transactions: [duplicated, ...prev.transactions],
    }));
  };

  // Payment confirmation handler
  const handleConfirmPayment = (
    txId: string,
    paymentDate: string,
    paymentMethod: PaymentMethod,
    receiptNote: string,
    paidAmount: number
  ) => {
    setAppState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((tx) => {
        if (tx.id === txId) {
          return {
            ...tx,
            status: 'paid',
            amount: paidAmount,
            paymentDate,
            paymentMethod,
            receiptNote: receiptNote || tx.receiptNote,
          };
        }
        return tx;
      }),
    }));
  };

  // Revert payment confirmation (back to pending)
  const handleRevertPayment = (txId: string) => {
    setAppState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((tx) => {
        if (tx.id === txId) {
          return {
            ...tx,
            status: 'pending',
            paymentDate: undefined,
          };
        }
        return tx;
      }),
    }));
  };

  // Category Budget update
  const handleUpdateCategoryBudget = (categoryId: string, newBudget: number) => {
    setAppState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === categoryId ? { ...c, monthlyBudget: newBudget } : c
      ),
    }));
  };

  // Family Member handlers
  const handleAddMember = (memberData: Omit<FamilyMember, 'id'>) => {
    const newMember: FamilyMember = {
      ...memberData,
      id: `mem_${Date.now()}`,
    };
    setAppState((prev) => ({
      ...prev,
      members: [...prev.members, newMember],
    }));
  };

  const handleEditMember = (updatedMember: FamilyMember) => {
    setAppState((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.id === updatedMember.id ? updatedMember : m
      ),
    }));
  };

  const handleDeleteMember = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== id),
    }));
  };

  // Income Sources handlers
  const handleAddIncomeSource = (sourceData: Omit<IncomeSource, 'id'>) => {
    const newSource: IncomeSource = {
      ...sourceData,
      id: `src_${Date.now()}`,
    };
    setAppState((prev) => ({
      ...prev,
      incomeSources: [...prev.incomeSources, newSource],
    }));
  };

  const handleEditIncomeSource = (updatedSource: IncomeSource) => {
    setAppState((prev) => ({
      ...prev,
      incomeSources: prev.incomeSources.map((s) =>
        s.id === updatedSource.id ? updatedSource : s
      ),
    }));
  };

  const handleDeleteIncomeSource = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      incomeSources: prev.incomeSources.filter((s) => s.id !== id),
    }));
  };

  const handleQuickIncomeForSource = (source: IncomeSource) => {
    const dayStr = source.expectedDayOfMonth ? String(source.expectedDayOfMonth).padStart(2, '0') : '05';
    const prefilled: Transaction = {
      id: `quick_tx_${Date.now()}`,
      type: 'income',
      title: source.name,
      amount: source.estimatedMonthlyAmount || 0,
      categoryId: source.categoryId,
      memberId: source.memberId,
      sourceId: source.id,
      sourceName: source.name,
      dueDate: `${currentMonthKey}-${dayStr}`,
      status: 'pending',
      paymentMethod: 'pix',
      isRecurring: true,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTxToEdit(prefilled);
    setIsNewTxModalOpen(true);
  };

  // Credit Card Expense Handlers
  const handleAddCreditCardExpense = (
    data: Omit<CreditCardExpense, 'id' | 'createdAt'>,
    autoGenerateInstallments = false
  ) => {
    setAppState((prev) => {
      const baseId = `cce_${Date.now()}`;
      const newExpenses: CreditCardExpense[] = [
        {
          ...data,
          id: baseId,
          createdAt: new Date().toISOString().split('T')[0],
        },
      ];

      // Auto-generate future installments if requested
      if (autoGenerateInstallments && data.installmentsTotal && data.installmentsTotal > 1) {
        const [yearStr, monthStr] = data.referenceMonth.split('-');
        let curYear = parseInt(yearStr, 10);
        let curMonth = parseInt(monthStr, 10);
        const currentNum = data.installmentsCurrent || 1;
        const totalNum = data.installmentsTotal;

        for (let i = currentNum + 1; i <= totalNum; i++) {
          curMonth += 1;
          if (curMonth > 12) {
            curMonth = 1;
            curYear += 1;
          }
          const nextMonthKey = `${curYear}-${String(curMonth).padStart(2, '0')}`;
          newExpenses.push({
            ...data,
            id: `${baseId}_inst_${i}`,
            referenceMonth: nextMonthKey,
            installmentsCurrent: i,
            createdAt: new Date().toISOString().split('T')[0],
          });
        }
      }

      return {
        ...prev,
        creditCardExpenses: [...newExpenses, ...(prev.creditCardExpenses || [])],
      };
    });
  };

  const handleEditCreditCardExpense = (updated: CreditCardExpense) => {
    setAppState((prev) => ({
      ...prev,
      creditCardExpenses: (prev.creditCardExpenses || []).map((c) =>
        c.id === updated.id ? updated : c
      ),
    }));
  };

  const handleDeleteCreditCardExpense = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      creditCardExpenses: (prev.creditCardExpenses || []).filter((c) => c.id !== id),
    }));
  };

  const handleDuplicateCreditCardExpense = (expense: CreditCardExpense) => {
    const duplicated: CreditCardExpense = {
      ...expense,
      id: `cce_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      description: `${expense.description} (Cópia)`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAppState((prev) => ({
      ...prev,
      creditCardExpenses: [duplicated, ...(prev.creditCardExpenses || [])],
    }));
  };

  // Sync total card expenses into Lançamentos invoice line (with isCreditCardInvoice: true, not counted in total)
  const handleSyncInvoiceToTransactions = (totalCardAmount: number) => {
    setAppState((prev) => {
      const existingInvoice = prev.transactions.find(
        (t) =>
          t.dueDate.startsWith(currentMonthKey) &&
          (t.isCreditCardInvoice || t.categoryId === 'cat_cartao')
      );

      if (existingInvoice) {
        return {
          ...prev,
          transactions: prev.transactions.map((t) =>
            t.id === existingInvoice.id
              ? {
                  ...t,
                  amount: totalCardAmount,
                  isCreditCardInvoice: true,
                  title: `Fatura Cartão de Crédito (${formatMonthYear(currentMonthKey)})`,
                }
              : t
          ),
        };
      }

      // Create new invoice transaction for this month
      const newInvoiceTx: Transaction = {
        id: `tx_card_inv_${Date.now()}`,
        type: 'expense',
        title: `Fatura Cartão de Crédito (${formatMonthYear(currentMonthKey)})`,
        amount: totalCardAmount,
        categoryId: 'cat_cartao',
        memberId: prev.members[0]?.id || 'mem_geral',
        dueDate: `${currentMonthKey}-10`,
        status: 'pending',
        paymentMethod: 'debito_automatico',
        isCreditCardInvoice: true,
        receiptNote: 'Soma dos gastos do cartão (informativo para pagamento)',
        notes: 'Item informativo no campo lançamentos para conferência. Não computa em dobro no total.',
        createdAt: new Date().toISOString().split('T')[0],
      };

      return {
        ...prev,
        transactions: [newInvoiceTx, ...prev.transactions],
      };
    });
  };

  // Import and Reset handlers
  const handleImportData = (newState: AppState) => {
    setAppState(newState);
  };

  const handleResetToDemo = () => {
    const demoState: AppState = {
      transactions: INITIAL_TRANSACTIONS,
      categories: INITIAL_CATEGORIES,
      members: INITIAL_MEMBERS,
      incomeSources: INITIAL_INCOME_SOURCES,
      creditCardExpenses: INITIAL_CREDIT_CARD_EXPENSES,
      alarmSettings: DEFAULT_ALARM_SETTINGS,
      userAccounts: DEFAULT_USER_ACCOUNTS,
      activeUserId: 'usr_eduardo',
    };
    setAppState(demoState);
  };

  const handleJumpToStatusFilter = (status: string) => {
    setInitialStatusFilter(status);
    setCurrentTab('transactions');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* 1. Header (Top Bar Contract) */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenNewTransaction={() => {
          setTxToEdit(null);
          setIsNewTxModalOpen(true);
        }}
        onOpenExportImport={() => setIsExportImportOpen(true)}
        onOpenAlarmSettings={() => setIsAlarmSettingsOpen(true)}
        alarmAlertCount={totalAlarmAlertCount}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
        activeMonthYear={formatMonthYear(currentMonthKey)}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Active Audible Alarm Banner */}
        <ActiveAlarmBanner
          settings={appState.alarmSettings}
          triggeredBills={triggeredBills}
          onOpenAlarmSettings={() => setIsAlarmSettingsOpen(true)}
          onPlayAlarmManual={handlePlayAlarmManual}
          onMuteSession={() => setIsSessionMuted(!isSessionMuted)}
          onConfirmBill={(tx) => setTxToConfirmPayment(tx)}
          isMuted={isSessionMuted}
        />

        {/* Month Selector Bar */}
        <MonthSelector
          currentMonthKey={currentMonthKey}
          onChangeMonth={setCurrentMonthKey}
        />

        {/* 2. TAB: VISÃO GERAL (OVERVIEW) */}
        {currentTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <SummaryCards
              transactions={monthTransactions}
              creditCardExpenses={appState.creditCardExpenses}
              currentMonthKey={currentMonthKey}
              onFilterByStatus={handleJumpToStatusFilter}
            />

            {/* Quick Actions & Recent Transactions Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Transactions table for this month */}
              <div className="lg:col-span-8">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Lançamentos do Mês
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Rendas e contas registradas para {formatMonthYear(currentMonthKey)}
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentTab('transactions')}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Ver todos com filtros completos &rarr;
                  </button>
                </div>

                <TransactionList
                  transactions={monthTransactions}
                  categories={appState.categories}
                  members={appState.members}
                  incomeSources={appState.incomeSources}
                  onOpenConfirmPayment={(tx) => setTxToConfirmPayment(tx)}
                  onEditTransaction={(tx) => {
                    setTxToEdit(tx);
                    setIsNewTxModalOpen(true);
                  }}
                  onDeleteTransaction={handleDeleteTransaction}
                  onDuplicateTransaction={handleDuplicateTransaction}
                  onOpenNewTransaction={() => {
                    setTxToEdit(null);
                    setIsNewTxModalOpen(true);
                  }}
                  initialStatusFilter={initialStatusFilter}
                />
              </div>

              {/* Side Column: Quick Snapshot and Budgets glance */}
              <div className="lg:col-span-4 space-y-6">
                {/* Cartão de Crédito Quick Glance Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Cartão de Crédito
                      </h3>
                    </div>
                    <button
                      onClick={() => setCurrentTab('credit_card')}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Ver Detalhes &rarr;
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Gastos discriminados no cartão somados no mês
                  </p>
                  <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span className="text-slate-700 dark:text-slate-300">
                      Fatura de {formatMonthYear(currentMonthKey)}:
                    </span>
                    <strong className="text-indigo-600 dark:text-indigo-400 tabular-nums font-bold">
                      {formatBRL(
                        (appState.creditCardExpenses || [])
                          .filter((c) => c.referenceMonth === currentMonthKey)
                          .reduce((acc, c) => acc + c.amount, 0)
                      )}
                    </strong>
                  </div>
                </div>

                {/* Fontes de Renda Quick Glance Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Fontes de Renda
                      </h3>
                    </div>
                    <button
                      onClick={() => setCurrentTab('income_sources')}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Editar Fontes &rarr;
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    {appState.incomeSources.filter((s) => s.isActive).length} fontes ativas configuradas
                  </p>
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    {appState.incomeSources.slice(0, 3).map((source) => (
                      <div key={source.id} className="flex justify-between items-center text-xs">
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[170px]" title={source.name}>
                          {source.name}
                        </span>
                        <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {formatBRL(source.estimatedMonthlyAmount)}
                        </strong>
                      </div>
                    ))}
                    {appState.incomeSources.length > 3 && (
                      <button
                        onClick={() => setCurrentTab('income_sources')}
                        className="text-[11px] text-slate-500 hover:text-emerald-600 dark:text-slate-400 block pt-1"
                      >
                        + Ver mais {appState.incomeSources.length - 3} fontes de renda
                      </button>
                    )}
                  </div>
                </div>

                {/* Visual mini-charts preview */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Análise Gráfica Rápida
                    </h3>
                    <button
                      onClick={() => setCurrentTab('charts')}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Abrir Gráficos &rarr;
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Composição e distribuição das saídas em {formatMonthYear(currentMonthKey)}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <ChartsAnalytics
                      transactions={appState.transactions}
                      creditCardExpenses={appState.creditCardExpenses}
                      categories={appState.categories}
                      members={appState.members}
                      incomeSources={appState.incomeSources}
                      currentMonthKey={currentMonthKey}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. TAB: LANÇAMENTOS (FULL TRANSACTIONS) */}
        {currentTab === 'transactions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Controle de Lançamentos Familiares
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gerencie todas as entradas e saídas, filtre por status de pagamento e confirme quitações
                </p>
              </div>

              <button
                onClick={() => {
                  setTxToEdit(null);
                  setIsNewTxModalOpen(true);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
              >
                + Novo Lançamento
              </button>
            </div>

            <TransactionList
              transactions={monthTransactions}
              categories={appState.categories}
              members={appState.members}
              incomeSources={appState.incomeSources}
              onOpenConfirmPayment={(tx) => setTxToConfirmPayment(tx)}
              onEditTransaction={(tx) => {
                setTxToEdit(tx);
                setIsNewTxModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
              onDuplicateTransaction={handleDuplicateTransaction}
              onOpenNewTransaction={() => {
                setTxToEdit(null);
                setIsNewTxModalOpen(true);
              }}
              initialStatusFilter={initialStatusFilter}
            />
          </div>
        )}

        {/* 3. TAB: CARTÃO DE CRÉDITO */}
        {currentTab === 'credit_card' && (
          <div className="space-y-4">
            <CreditCardManager
              creditCardExpenses={appState.creditCardExpenses || []}
              transactions={appState.transactions}
              categories={appState.categories}
              members={appState.members}
              currentMonthKey={currentMonthKey}
              onAddExpense={handleAddCreditCardExpense}
              onEditExpense={handleEditCreditCardExpense}
              onDeleteExpense={handleDeleteCreditCardExpense}
              onDuplicateExpense={handleDuplicateCreditCardExpense}
              onSyncInvoiceToTransactions={handleSyncInvoiceToTransactions}
              onExportCSV={() => exportCreditCardExpensesAsCSV(appState)}
            />
          </div>
        )}

        {/* 4. TAB: FONTES DE RENDA */}
        {currentTab === 'income_sources' && (
          <div className="space-y-4">
            <IncomeSourcesManager
              incomeSources={appState.incomeSources}
              categories={appState.categories}
              members={appState.members}
              transactions={appState.transactions}
              currentMonthKey={currentMonthKey}
              onAddIncomeSource={handleAddIncomeSource}
              onEditIncomeSource={handleEditIncomeSource}
              onDeleteIncomeSource={handleDeleteIncomeSource}
              onQuickIncomeForSource={handleQuickIncomeForSource}
            />
          </div>
        )}

        {/* 5. TAB: GRÁFICOS & ANÁLISE */}
        {currentTab === 'charts' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Gráficos para Leitura e Análise dos Gastos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acompanhe visualmente para onde o dinheiro está indo, a evolução histórica do fluxo de caixa e o percentual de contas confirmadas
              </p>
            </div>

            <ChartsAnalytics
              transactions={appState.transactions}
              creditCardExpenses={appState.creditCardExpenses || []}
              categories={appState.categories}
              members={appState.members}
              incomeSources={appState.incomeSources}
              currentMonthKey={currentMonthKey}
            />
          </div>
        )}

        {/* 5. TAB: ORÇAMENTOS */}
        {currentTab === 'budgets' && (
          <div className="space-y-4">
            <BudgetLimits
              categories={appState.categories}
              transactions={appState.transactions}
              currentMonthKey={currentMonthKey}
              onUpdateCategoryBudget={handleUpdateCategoryBudget}
            />
          </div>
        )}

        {/* 6. TAB: MEMBROS DA FAMÍLIA */}
        {currentTab === 'members' && (
          <div className="space-y-4">
            <FamilyMembersManager
              members={appState.members}
              transactions={appState.transactions}
              currentMonthKey={currentMonthKey}
              onAddMember={handleAddMember}
              onEditMember={handleEditMember}
              onDeleteMember={handleDeleteMember}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Heckler Family · Gestão e Controle Financeiro Familiar</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExportImportOpen(true)}
              className="hover:text-slate-900 dark:hover:text-white underline"
            >
              Backup & Planilhas
            </button>
            <span aria-hidden="true">·</span>
            <span>Dados armazenados com segurança local no seu navegador</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {/* 1. Payment Confirm Modal (Specific User Feature) */}
      <PaymentConfirmModal
        transaction={txToConfirmPayment}
        isOpen={Boolean(txToConfirmPayment)}
        onClose={() => setTxToConfirmPayment(null)}
        onConfirm={handleConfirmPayment}
        onRevertPayment={handleRevertPayment}
      />

      {/* 2. New / Edit Transaction Modal */}
      <TransactionModal
        isOpen={isNewTxModalOpen}
        onClose={() => {
          setIsNewTxModalOpen(false);
          setTxToEdit(null);
        }}
        onSave={handleSaveTransaction}
        transactionToEdit={txToEdit}
        categories={appState.categories}
        members={appState.members}
        incomeSources={appState.incomeSources}
        defaultMonthKey={currentMonthKey}
      />

      {/* 3. Export / Import Backup Modal */}
      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        appState={appState}
        onImportData={handleImportData}
        onResetToDemo={handleResetToDemo}
        currentUser={currentUser}
      />

      {/* 4. Alarm Settings Modal (Configurações e Período do Alarme Sonoro) */}
      <AlarmSettingsModal
        isOpen={isAlarmSettingsOpen}
        onClose={() => setIsAlarmSettingsOpen(false)}
        settings={appState.alarmSettings}
        onSaveSettings={handleSaveAlarmSettings}
        triggeredBills={triggeredBills}
        onOpenConfirmPayment={(tx) => setTxToConfirmPayment(tx)}
      />

      {/* 5. User Account & Login Modal (Eduardo - Admin / Graciela - Usuário) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        userAccounts={appState.userAccounts || DEFAULT_USER_ACCOUNTS}
        onLogin={handleLogin}
        onUpdatePin={handleUpdatePin}
      />
    </div>
  );
}
