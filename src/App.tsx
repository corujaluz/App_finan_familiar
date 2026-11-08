import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, ShieldAlert, Briefcase, Bell, CreditCard, Lock, LogOut, PieChart, BarChart3, TrendingDown, ArrowRight } from 'lucide-react';

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

  // Save & Inactivity tracking state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(() => {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  });
  const [inactivityNotice, setInactivityNotice] = useState<string | null>(null);

  // AppState and unsaved changes refs to avoid stale closures in timers and beforeunload listeners
  const appStateRef = useRef<AppState>(appState);
  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  const hasUnsavedChangesRef = useRef<boolean>(hasUnsavedChanges);
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

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
  // When activeUserId is null, currentUser is null and access is restricted
  const currentUser: UserAccount | null = useMemo(() => {
    if (!appState.activeUserId) return null;
    const accounts = appState.userAccounts || DEFAULT_USER_ACCOUNTS;
    const found = accounts.find((u) => u.id === appState.activeUserId);
    return found || null;
  }, [appState.activeUserId, appState.userAccounts]);

  // Function to save data (manual or automatic)
  const performSave = useCallback((isManual = false) => {
    setIsSaving(true);
    try {
      persistData(appStateRef.current);
      const now = new Date();
      setLastSavedTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Falha ao salvar dados:', err);
    } finally {
      setTimeout(() => {
        setIsSaving(false);
      }, isManual ? 400 : 200);
    }
  }, []);

  // 1. Periodic Auto-save every 10 minutes (600,000 ms)
  useEffect(() => {
    const AUTO_SAVE_INTERVAL_MS = 10 * 60 * 1000;
    const intervalId = setInterval(() => {
      performSave(false);
    }, AUTO_SAVE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [performSave]);

  // 2. Beforeunload event listener: guarantee save and confirm before closing window
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      try {
        persistData(appStateRef.current);
      } catch (err) {
        console.error('Erro ao persistir no beforeunload:', err);
      }

      if (hasUnsavedChangesRef.current) {
        e.preventDefault();
        e.returnValue = 'Suas alterações foram salvas. Deseja realmente fechar o aplicativo?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // 3. User Inactivity Detection (10 minutes without interaction): save then logout
  useEffect(() => {
    if (!currentUser) return;

    const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
    let timeoutId: ReturnType<typeof setTimeout>;

    const resetInactivityTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Step 1: Save data before logout
        try {
          persistData(appStateRef.current);
          const now = new Date();
          setLastSavedTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
          setHasUnsavedChanges(false);
        } catch (err) {
          console.error('Erro ao salvar antes do logout:', err);
        }

        // Step 2: Set security inactivity notice and logout
        setInactivityNotice(
          'Você foi desconectado automaticamente por inatividade (10 minutos sem interação). Suas alterações foram salvas com segurança!'
        );
        setAppState((prev) => ({
          ...prev,
          activeUserId: null,
        }));
        setIsLoginModalOpen(true);
      }, INACTIVITY_TIMEOUT_MS);
    };

    const interactionEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    interactionEvents.forEach((evt) => {
      window.addEventListener(evt, resetInactivityTimer, { passive: true });
    });

    // Start timer initially
    resetInactivityTimer();

    return () => {
      clearTimeout(timeoutId);
      interactionEvents.forEach((evt) => {
        window.removeEventListener(evt, resetInactivityTimer);
      });
    };
  }, [currentUser]);

  const handleLogin = (account: UserAccount) => {
    setAppState((prev) => ({
      ...prev,
      activeUserId: account.id,
    }));
    setInactivityNotice(null);
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    // Save data before manual logout
    persistData(appStateRef.current);
    setHasUnsavedChanges(false);
    setAppState((prev) => ({
      ...prev,
      activeUserId: null,
    }));
    setIsLoginModalOpen(true);
  };

  const handleUpdatePin = (userId: string, newPin: string) => {
    setAppState((prev) => ({
      ...prev,
      userAccounts: (prev.userAccounts || DEFAULT_USER_ACCOUNTS).map((u) =>
        u.id === userId ? { ...u, pin: newPin } : u
      ),
    }));
    setHasUnsavedChanges(true);
  };

  // Immediate persistence on state changes as background backup with change detection
  const isFirstLoadRef = useRef(true);
  useEffect(() => {
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      return;
    }
    setHasUnsavedChanges(true);
    persistData(appState);
  }, [appState]);

  // Current month transactions
  const monthTransactions = useMemo(() => {
    return appState.transactions.filter((tx) => tx.dueDate.startsWith(currentMonthKey));
  }, [appState.transactions, currentMonthKey]);

  // Entradas pagas do mês (somatório dos lançamentos de renda com status 'paid')
  const monthPaidIncome = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'income' && t.status === 'paid')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  // Sincroniza e garante que todas as fontes de renda ativas possuam lançamentos correspondentes no mês
  useEffect(() => {
    setAppState((prev) => {
      let hasChanges = false;
      const newTransactions = [...prev.transactions];

      prev.incomeSources.filter((s) => s.isActive).forEach((source) => {
        const existingTx = newTransactions.find(
          (tx) => tx.type === 'income' && tx.dueDate.startsWith(currentMonthKey) && (tx.sourceId === source.id || tx.title.toLowerCase() === source.name.toLowerCase())
        );

        const dayStr = source.expectedDayOfMonth ? String(source.expectedDayOfMonth).padStart(2, '0') : '05';
        const expectedDueDate = `${currentMonthKey}-${dayStr}`;

        if (!existingTx) {
          hasChanges = true;
          newTransactions.unshift({
            id: `tx_inc_${source.id}_${currentMonthKey}`,
            type: 'income',
            title: source.name,
            amount: source.estimatedMonthlyAmount || 0,
            categoryId: source.categoryId,
            memberId: source.memberId,
            sourceId: source.id,
            sourceName: source.name,
            dueDate: expectedDueDate,
            paymentDate: expectedDueDate,
            status: 'paid', // Lançamento pago para constar no saldo do mês
            paymentMethod: 'pix',
            receiptNote: 'Recebimento de entrada cadastrada',
            isRecurring: true,
            createdAt: `${currentMonthKey}-01`,
          });
        }
      });

      if (!hasChanges) return prev;
      return {
        ...prev,
        transactions: newTransactions,
      };
    });
  }, [currentMonthKey, appState.incomeSources]);

  // Top categories preview for quick analytics sidebar
  const topCategoriesPreview = useMemo(() => {
    const expenses = monthTransactions.filter((tx) => tx.type === 'expense');
    const catMap = new Map<string, number>();
    expenses.forEach((tx) => {
      catMap.set(tx.categoryId, (catMap.get(tx.categoryId) || 0) + tx.amount);
    });
    // Add detailed card expenses
    const cardExpenses = (appState.creditCardExpenses || []).filter(
      (c) => c.referenceMonth === currentMonthKey
    );
    cardExpenses.forEach((c) => {
      catMap.set(c.categoryId, (catMap.get(c.categoryId) || 0) + c.amount);
    });

    const total = Array.from(catMap.values()).reduce((acc, val) => acc + val, 0);
    const categoryInfoMap = new Map(appState.categories.map((c) => [c.id, c]));

    const items = Array.from(catMap.entries())
      .map(([catId, amount]) => {
        const cat = categoryInfoMap.get(catId);
        return {
          id: catId,
          name: cat?.name || 'Outros',
          color: cat?.color || '#94a3b8',
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);

    return { total, items };
  }, [monthTransactions, appState.creditCardExpenses, currentMonthKey, appState.categories]);

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
    const newSourceId = `src_${Date.now()}`;
    const newSource: IncomeSource = {
      ...sourceData,
      id: newSourceId,
    };
    const dayStr = newSource.expectedDayOfMonth ? String(newSource.expectedDayOfMonth).padStart(2, '0') : '05';
    const dueDate = `${currentMonthKey}-${dayStr}`;

    // Cria imediatamente o lançamento de entrada pago correspondente para constar na Visão Geral e Saldo
    const newTx: Transaction = {
      id: `tx_inc_${newSourceId}_${currentMonthKey}`,
      type: 'income',
      title: newSource.name,
      amount: newSource.estimatedMonthlyAmount || 0,
      categoryId: newSource.categoryId,
      memberId: newSource.memberId,
      sourceId: newSourceId,
      sourceName: newSource.name,
      dueDate: dueDate,
      paymentDate: dueDate,
      status: 'paid', // Lançamento pago para constar no saldo do mês
      paymentMethod: 'pix',
      receiptNote: 'Recebimento de entrada cadastrada',
      isRecurring: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setAppState((prev) => ({
      ...prev,
      incomeSources: [...prev.incomeSources, newSource],
      transactions: [newTx, ...prev.transactions],
    }));
  };

  const handleEditIncomeSource = (updatedSource: IncomeSource) => {
    setAppState((prev) => {
      // Atualiza também o lançamento correspondente no mês
      const updatedTransactions = prev.transactions.map((tx) => {
        if (tx.type === 'income' && tx.sourceId === updatedSource.id && tx.dueDate.startsWith(currentMonthKey)) {
          return {
            ...tx,
            title: updatedSource.name,
            sourceName: updatedSource.name,
            amount: updatedSource.estimatedMonthlyAmount,
            categoryId: updatedSource.categoryId,
            memberId: updatedSource.memberId,
          };
        }
        return tx;
      });

      return {
        ...prev,
        incomeSources: prev.incomeSources.map((s) =>
          s.id === updatedSource.id ? updatedSource : s
        ),
        transactions: updatedTransactions,
      };
    });
  };

  const handleDeleteIncomeSource = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      incomeSources: prev.incomeSources.filter((s) => s.id !== id),
    }));
  };

  const handleConfirmIncomePaid = (txId: string) => {
    const today = new Date().toISOString().split('T')[0];
    setAppState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((tx) =>
        tx.id === txId
          ? {
              ...tx,
              status: 'paid',
              paymentDate: tx.paymentDate || today,
            }
          : tx
      ),
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
      status: 'paid',
      paymentDate: `${currentMonthKey}-${dayStr}`,
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

  // Se nenhum usuário estiver logado, bloqueia o acesso à aplicação completa e exibe a tela de login
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
        {/* Glow de fundo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Lock Header */}
        <div className="mb-6 flex flex-col items-center text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-xl mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Heckler Family
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestão Financeira Familiar com Acesso Restrito
          </p>
        </div>

        {/* Modal de Login Obrigatório */}
        <LoginModal
          isOpen={true}
          isMandatory={true}
          currentUser={null}
          userAccounts={appState.userAccounts || DEFAULT_USER_ACCOUNTS}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onUpdatePin={handleUpdatePin}
          inactivityNotice={inactivityNotice}
        />

        <div className="mt-8 text-center text-[11px] text-slate-500 max-w-xs">
          Acesso protegido. Somente os usuários cadastrados (<strong>Eduardo</strong> e <strong>Graciela</strong>) possuem acesso às finanças familiares.
        </div>
      </div>
    );
  }

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
        onLogout={handleLogout}
        onSaveData={() => performSave(true)}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        lastSavedTime={lastSavedTime}
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
              incomeSources={appState.incomeSources}
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
                        Fontes de Renda (Entradas)
                      </h3>
                    </div>
                    <button
                      onClick={() => setCurrentTab('income_sources')}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Gerenciar &rarr;
                    </button>
                  </div>
                  <div className="flex items-baseline justify-between mb-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Entradas Pagas no Mês:
                    </p>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatBRL(monthPaidIncome)}
                    </span>
                  </div>
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    {appState.incomeSources.filter((s) => s.isActive).slice(0, 3).map((source) => {
                      const sourceTx = monthTransactions.find(
                        (t) => t.type === 'income' && (t.sourceId === source.id || t.title.toLowerCase() === source.name.toLowerCase())
                      );
                      const isPaid = sourceTx ? sourceTx.status === 'paid' : false;
                      const amount = sourceTx ? sourceTx.amount : source.estimatedMonthlyAmount;

                      return (
                        <div key={source.id} className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isPaid ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                            <span className="text-slate-700 dark:text-slate-300 truncate" title={source.name}>
                              {source.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
                              {isPaid ? 'Pago' : 'Pendente'}
                            </span>
                            <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                              {formatBRL(amount)}
                            </strong>
                          </div>
                        </div>
                      );
                    })}
                    {appState.incomeSources.filter((s) => s.isActive).length > 3 && (
                      <button
                        onClick={() => setCurrentTab('income_sources')}
                        className="text-[11px] text-slate-500 hover:text-emerald-600 dark:text-slate-400 block pt-1"
                      >
                        + Ver todas as {appState.incomeSources.filter((s) => s.isActive).length} fontes de renda
                      </button>
                    )}
                  </div>
                </div>

                {/* Visual mini-charts preview */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-3.5 min-w-0 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider truncate">
                        Análise Rápida de Gastos
                      </h3>
                    </div>
                    <button
                      onClick={() => setCurrentTab('charts')}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0 ml-2"
                    >
                      <span>Abrir Gráficos</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between text-xs pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Total de Despesas:</span>
                    <strong className="text-sm font-black text-rose-600 dark:text-rose-400 tabular-nums">
                      {formatBRL(topCategoriesPreview.total)}
                    </strong>
                  </div>

                  {topCategoriesPreview.items.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">
                      Nenhuma despesa registrada neste mês.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {topCategoriesPreview.items.map((item) => (
                        <div key={item.id} className="space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="truncate font-medium text-slate-800 dark:text-slate-200" title={item.name}>
                                {item.name}
                              </span>
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white tabular-nums shrink-0">
                              {formatBRL(item.amount)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(100, Math.max(2, item.percentage))}%`,
                                backgroundColor: item.color,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setCurrentTab('charts')}
                    className="w-full py-2.5 px-3 mt-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Ver Painel Completo de Gráficos</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Seção Gráfica Familiar Completa na Visão Geral (Full Width) */}
            <div className="mt-8 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>Painel Gráfico & Orçamentário Familiar</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Acompanhamento visual completo de despesas, metas orçamentárias e cartão de crédito em {formatMonthYear(currentMonthKey)}
                  </p>
                </div>
                <button
                  onClick={() => setCurrentTab('charts')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 self-start sm:self-center"
                >
                  <span>Ir para tela dedicada de Gráficos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

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
              onConfirmIncomePaid={handleConfirmIncomePaid}
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
              creditCardExpenses={appState.creditCardExpenses || []}
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
        onLogout={handleLogout}
        onUpdatePin={handleUpdatePin}
        inactivityNotice={inactivityNotice}
      />
    </div>
  );
}
