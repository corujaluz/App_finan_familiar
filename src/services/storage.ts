import { AlarmSettings, Category, CreditCardExpense, CreditCardPresetItem, FamilyMember, IncomeSource, Transaction, UserAccount } from '../types/finance';
import { DEFAULT_CREDIT_CARD_PRESETS, INITIAL_CATEGORIES, INITIAL_CREDIT_CARD_EXPENSES, INITIAL_INCOME_SOURCES, INITIAL_MEMBERS, INITIAL_TRANSACTIONS } from '../data/initialData';

const STORAGE_KEYS = {
  TRANSACTIONS: 'heckler_family_transactions_v2',
  CATEGORIES: 'heckler_family_categories_v2',
  MEMBERS: 'heckler_family_members_v2',
  INCOME_SOURCES: 'heckler_family_income_sources_v2',
  CREDIT_CARD_EXPENSES: 'heckler_family_credit_card_v2',
  CREDIT_CARD_PRESETS: 'heckler_family_credit_card_presets_v2',
  ALARM_SETTINGS: 'heckler_family_alarm_settings_v2',
  USER_ACCOUNTS: 'heckler_family_user_accounts_v2',
  ACTIVE_USER_ID: 'heckler_family_active_user_v2',
  THEME: 'heckler_family_theme_v2',
};

export const DEFAULT_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr_eduardo',
    username: 'eduardo',
    name: 'Eduardo Heckler',
    role: 'admin',
    memberId: 'mem_eduardo',
    pin: '1234',
    avatarInitials: 'EH',
    color: '#2563EB', // Blue
  },
  {
    id: 'usr_graciela',
    username: 'graciela',
    name: 'Graciela Heckler',
    role: 'user',
    memberId: 'mem_graciela',
    pin: '1234',
    avatarInitials: 'GH',
    color: '#059669', // Emerald
  },
];

export const DEFAULT_ALARM_SETTINGS: AlarmSettings = {
  enabled: true,
  alertOverdue: true,
  alertUpcoming: true,
  upcomingDaysThreshold: 3, // Período de antecedência padrão: 3 dias
  repeatIntervalMinutes: 30, // Período de repetição do disparo: a cada 30 min
  soundType: 'digital_alert',
  volume: 0.7,
  isMutedForSession: false,
};

export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  members: FamilyMember[];
  incomeSources: IncomeSource[];
  creditCardExpenses: CreditCardExpense[];
  creditCardPresets: CreditCardPresetItem[];
  alarmSettings: AlarmSettings;
  userAccounts: UserAccount[];
  activeUserId: string | null;
}

export const loadStoredData = (): AppState => {
  try {
    const rawTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || localStorage.getItem('finanfamilia_transactions_v1');
    const rawCat = localStorage.getItem(STORAGE_KEYS.CATEGORIES) || localStorage.getItem('finanfamilia_categories_v1');
    const rawMem = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    const rawSources = localStorage.getItem(STORAGE_KEYS.INCOME_SOURCES);
    const rawCC = localStorage.getItem(STORAGE_KEYS.CREDIT_CARD_EXPENSES);
    const rawPresets = localStorage.getItem(STORAGE_KEYS.CREDIT_CARD_PRESETS);
    const rawAlarm = localStorage.getItem(STORAGE_KEYS.ALARM_SETTINGS);
    const rawAccounts = localStorage.getItem(STORAGE_KEYS.USER_ACCOUNTS);
    const rawActiveUser = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);

    const transactions: Transaction[] = rawTx ? JSON.parse(rawTx) : INITIAL_TRANSACTIONS;
    const categories: Category[] = rawCat ? JSON.parse(rawCat) : INITIAL_CATEGORIES;
    const members: FamilyMember[] = rawMem ? JSON.parse(rawMem) : INITIAL_MEMBERS;
    const incomeSources: IncomeSource[] = rawSources ? JSON.parse(rawSources) : INITIAL_INCOME_SOURCES;
    const creditCardExpenses: CreditCardExpense[] = rawCC ? JSON.parse(rawCC) : INITIAL_CREDIT_CARD_EXPENSES;
    const creditCardPresets: CreditCardPresetItem[] = rawPresets ? JSON.parse(rawPresets) : DEFAULT_CREDIT_CARD_PRESETS;
    const alarmSettings: AlarmSettings = rawAlarm ? { ...DEFAULT_ALARM_SETTINGS, ...JSON.parse(rawAlarm) } : DEFAULT_ALARM_SETTINGS;
    const userAccounts: UserAccount[] = rawAccounts ? JSON.parse(rawAccounts) : DEFAULT_USER_ACCOUNTS;
    const activeUserId: string | null =
      rawActiveUser && rawActiveUser !== '__logged_out__'
        ? rawActiveUser
        : rawActiveUser === '__logged_out__'
        ? null
        : 'usr_eduardo';

    return { transactions, categories, members, incomeSources, creditCardExpenses, creditCardPresets, alarmSettings, userAccounts, activeUserId };
  } catch (err) {
    console.error('Erro ao ler do localStorage, usando valores padrão:', err);
    return {
      transactions: INITIAL_TRANSACTIONS,
      categories: INITIAL_CATEGORIES,
      members: INITIAL_MEMBERS,
      incomeSources: INITIAL_INCOME_SOURCES,
      creditCardExpenses: INITIAL_CREDIT_CARD_EXPENSES,
      creditCardPresets: DEFAULT_CREDIT_CARD_PRESETS,
      alarmSettings: DEFAULT_ALARM_SETTINGS,
      userAccounts: DEFAULT_USER_ACCOUNTS,
      activeUserId: 'usr_eduardo',
    };
  }
};

export const persistData = (state: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(state.categories));
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(state.members));
    localStorage.setItem(STORAGE_KEYS.INCOME_SOURCES, JSON.stringify(state.incomeSources));
    localStorage.setItem(STORAGE_KEYS.CREDIT_CARD_EXPENSES, JSON.stringify(state.creditCardExpenses));
    localStorage.setItem(STORAGE_KEYS.CREDIT_CARD_PRESETS, JSON.stringify(state.creditCardPresets || DEFAULT_CREDIT_CARD_PRESETS));
    localStorage.setItem(STORAGE_KEYS.ALARM_SETTINGS, JSON.stringify(state.alarmSettings));
    localStorage.setItem(STORAGE_KEYS.USER_ACCOUNTS, JSON.stringify(state.userAccounts));
    if (state.activeUserId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, state.activeUserId);
    } else {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, '__logged_out__');
    }
  } catch (err) {
    console.error('Erro ao salvar no localStorage:', err);
  }
};

export const exportDataAsJSON = (state: AppState): void => {
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  link.download = `heckler_family_backup_${dateStr}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportTransactionsAsCSV = (state: AppState): void => {
  const memberMap = new Map(state.members.map((m) => [m.id, m.name]));
  const categoryMap = new Map(state.categories.map((c) => [c.id, c.name]));

  const headers = ['ID', 'Tipo', 'Descrição', 'Fonte de Renda', 'Valor (R$)', 'Categoria', 'Membro', 'Vencimento', 'Status', 'Data Pagamento', 'Forma Pagamento', 'Comprovante/Obs'];
  const rows = state.transactions.map((tx) => [
    `"${tx.id}"`,
    `"${tx.type === 'income' ? 'Entrada (Renda)' : 'Saída (Gasto)'}"`,
    `"${(tx.title || '').replace(/"/g, '""')}"`,
    `"${(tx.sourceName || '').replace(/"/g, '""')}"`,
    tx.amount.toFixed(2).replace('.', ','),
    `"${(categoryMap.get(tx.categoryId) || '').replace(/"/g, '""')}"`,
    `"${(memberMap.get(tx.memberId) || '').replace(/"/g, '""')}"`,
    tx.dueDate,
    `"${tx.status === 'paid' ? 'Pago' : tx.status === 'overdue' ? 'Atrasado' : 'Pendente'}"`,
    tx.paymentDate || '',
    `"${tx.paymentMethod}"`,
    `"${(tx.receiptNote || tx.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  link.download = `heckler_family_lancamentos_${dateStr}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportCreditCardExpensesAsCSV = (state: AppState): void => {
  const memberMap = new Map(state.members.map((m) => [m.id, m.name]));
  const categoryMap = new Map(state.categories.map((c) => [c.id, c.name]));

  const headers = ['ID', 'Descrição', 'Cartão', 'Valor (R$)', 'Mês Fatura', 'Data Compra', 'Parcela', 'Categoria', 'Membro Responsável', 'Observações'];
  const rows = state.creditCardExpenses.map((cc) => [
    `"${cc.id}"`,
    `"${(cc.description || '').replace(/"/g, '""')}"`,
    `"${(cc.cardName || '').replace(/"/g, '""')}"`,
    cc.amount.toFixed(2).replace('.', ','),
    cc.referenceMonth,
    cc.purchaseDate,
    cc.installmentsTotal && cc.installmentsTotal > 1 ? `"${cc.installmentsCurrent || 1}/${cc.installmentsTotal}"` : '"À vista"',
    `"${(categoryMap.get(cc.categoryId) || '').replace(/"/g, '""')}"`,
    `"${(memberMap.get(cc.memberId) || '').replace(/"/g, '""')}"`,
    `"${(cc.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  link.download = `heckler_family_cartao_credito_${dateStr}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
