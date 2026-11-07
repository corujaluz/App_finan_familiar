import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Copy,
  Layers,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Download,
  Info,
  DollarSign,
  TrendingDown,
  ArrowRight,
  BarChart3,
  PieChart,
  Users,
  Percent,
  Target,
} from 'lucide-react';
import { Category, CreditCardExpense, FamilyMember, Transaction } from '../types/finance';
import { formatBRL, formatDateBR, formatMonthYear } from '../utils/formatters';
import { CreditCardModal } from './CreditCardModal';

interface CreditCardManagerProps {
  creditCardExpenses: CreditCardExpense[];
  transactions: Transaction[];
  categories: Category[];
  members: FamilyMember[];
  currentMonthKey: string;
  onAddExpense: (
    data: Omit<CreditCardExpense, 'id' | 'createdAt'>,
    autoGenerateInstallments?: boolean
  ) => void;
  onEditExpense: (updated: CreditCardExpense) => void;
  onDeleteExpense: (id: string) => void;
  onDuplicateExpense: (expense: CreditCardExpense) => void;
  onSyncInvoiceToTransactions?: (totalCardAmount: number) => void;
  onExportCSV?: () => void;
}

export const CreditCardManager: React.FC<CreditCardManagerProps> = ({
  creditCardExpenses,
  transactions,
  categories,
  members,
  currentMonthKey,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onDuplicateExpense,
  onSyncInvoiceToTransactions,
  onExportCSV,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<CreditCardExpense | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [cardFilter, setCardFilter] = useState<string>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [installmentFilter, setInstallmentFilter] = useState<'all' | 'single' | 'installments'>('all');

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  // Expenses for the reference month
  const monthExpenses = useMemo(() => {
    return creditCardExpenses.filter((c) => c.referenceMonth === currentMonthKey);
  }, [creditCardExpenses, currentMonthKey]);

  // Unique card names available
  const knownCardNames = useMemo(() => {
    const set = new Set<string>();
    creditCardExpenses.forEach((c) => {
      if (c.cardName) set.add(c.cardName);
    });
    return Array.from(set).sort();
  }, [creditCardExpenses]);

  // Totals for this month
  const totalMonthAmount = useMemo(() => {
    return monthExpenses.reduce((sum, c) => sum + c.amount, 0);
  }, [monthExpenses]);

  // Find invoice transaction in general transactions for this month
  const cardInvoiceTx = useMemo(() => {
    return transactions.find(
      (tx) =>
        tx.dueDate.startsWith(currentMonthKey) &&
        tx.type === 'expense' &&
        (tx.isCreditCardInvoice || tx.categoryId === 'cat_cartao' || tx.title.toLowerCase().includes('fatura'))
    );
  }, [transactions, currentMonthKey]);

  // Breakdown by card name
  const byCardBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    monthExpenses.forEach((c) => {
      const current = map.get(c.cardName) || { total: 0, count: 0 };
      map.set(c.cardName, {
        total: current.total + c.amount,
        count: current.count + 1,
      });
    });
    return Array.from(map.entries())
      .map(([card, data]) => ({ card, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [monthExpenses]);

  // Top spending member in card
  const topMember = useMemo(() => {
    const map = new Map<string, number>();
    monthExpenses.forEach((c) => {
      map.set(c.memberId, (map.get(c.memberId) || 0) + c.amount);
    });
    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;
    const mem = memberMap.get(sorted[0][0]);
    return { name: mem?.name || 'Membro', amount: sorted[0][1] };
  }, [monthExpenses, memberMap]);

  const [activeView, setActiveView] = useState<'list' | 'charts'>('list');

  // Breakdown by category in card expenses
  const byCategoryBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    monthExpenses.forEach((c) => {
      const cur = map.get(c.categoryId) || { total: 0, count: 0 };
      map.set(c.categoryId, { total: cur.total + c.amount, count: cur.count + 1 });
    });
    return Array.from(map.entries())
      .map(([catId, data]) => {
        const cat = categoryMap.get(catId);
        const pct = totalMonthAmount > 0 ? (data.total / totalMonthAmount) * 100 : 0;
        return {
          id: catId,
          name: cat?.name || 'Outros',
          color: cat?.color || '#6366F1',
          total: data.total,
          count: data.count,
          percentage: pct,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [monthExpenses, categoryMap, totalMonthAmount]);

  // Breakdown by family member in card expenses
  const byMemberBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    monthExpenses.forEach((c) => {
      const cur = map.get(c.memberId) || { total: 0, count: 0 };
      map.set(c.memberId, { total: cur.total + c.amount, count: cur.count + 1 });
    });
    return Array.from(map.entries())
      .map(([memId, data]) => {
        const mem = memberMap.get(memId);
        const pct = totalMonthAmount > 0 ? (data.total / totalMonthAmount) * 100 : 0;
        return {
          id: memId,
          name: mem?.name || 'Família',
          color: mem?.color || '#3B82F6',
          avatarInitials: mem?.avatarInitials || 'HF',
          total: data.total,
          count: data.count,
          percentage: pct,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [monthExpenses, memberMap, totalMonthAmount]);

  // Installment analytics (À vista vs. Parcelado)
  const installmentAnalytics = useMemo(() => {
    let singleTotal = 0;
    let singleCount = 0;
    let installmentTotal = 0;
    let installmentCount = 0;

    monthExpenses.forEach((c) => {
      if (c.installmentsTotal && c.installmentsTotal > 1) {
        installmentTotal += c.amount;
        installmentCount += 1;
      } else {
        singleTotal += c.amount;
        singleCount += 1;
      }
    });

    return {
      singleTotal,
      singleCount,
      installmentTotal,
      installmentCount,
      installmentPct: totalMonthAmount > 0 ? (installmentTotal / totalMonthAmount) * 100 : 0,
      singlePct: totalMonthAmount > 0 ? (singleTotal / totalMonthAmount) * 100 : 0,
    };
  }, [monthExpenses, totalMonthAmount]);

  // Filtered rows
  const filteredExpenses = useMemo(() => {
    return monthExpenses.filter((item) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const mem = memberMap.get(item.memberId);
        const cat = categoryMap.get(item.categoryId);
        const matchDesc = item.description.toLowerCase().includes(term);
        const matchCard = item.cardName.toLowerCase().includes(term);
        const matchMem = mem?.name.toLowerCase().includes(term) || false;
        const matchCat = cat?.name.toLowerCase().includes(term) || false;
        const matchNote = item.notes?.toLowerCase().includes(term) || false;
        if (!matchDesc && !matchCard && !matchMem && !matchCat && !matchNote) return false;
      }

      if (cardFilter !== 'all' && item.cardName !== cardFilter) return false;
      if (memberFilter !== 'all' && item.memberId !== memberFilter) return false;
      if (categoryFilter !== 'all' && item.categoryId !== categoryFilter) return false;

      if (installmentFilter === 'single' && (item.installmentsTotal || 1) > 1) return false;
      if (installmentFilter === 'installments' && (item.installmentsTotal || 1) <= 1) return false;

      return true;
    });
  }, [monthExpenses, searchTerm, cardFilter, memberFilter, categoryFilter, installmentFilter, memberMap, categoryMap]);

  // Sort: by purchase date descending (newest first)
  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate));
  }, [filteredExpenses]);

  // Save modal handler
  const handleSaveModal = (
    data: Omit<CreditCardExpense, 'id' | 'createdAt'>,
    editId?: string,
    autoGenerateInstallments?: boolean
  ) => {
    if (editId) {
      onEditExpense({
        ...data,
        id: editId,
        createdAt: expenseToEdit?.createdAt || new Date().toISOString().split('T')[0],
      });
    } else {
      onAddExpense(data, autoGenerateInstallments);
    }
  };

  const invoiceAmount = cardInvoiceTx ? cardInvoiceTx.amount : 0;
  const reconciliationDiff = totalMonthAmount - invoiceAmount;
  const isReconciled = Math.abs(reconciliationDiff) < 0.01 && invoiceAmount > 0;

  return (
    <div className="space-y-6">
      {/* 1. Top Section Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Gastos no Cartão de Crédito</span>
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                  · {formatMonthYear(currentMonthKey)}
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gastos diversos e editáveis da família que computam no total mensal e nos gráficos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onExportCSV && (
              <button
                onClick={onExportCSV}
                title="Exportar gastos do cartão em planilha CSV"
                className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exportar Planilha</span>
              </button>
            )}

            <button
              onClick={() => {
                setExpenseToEdit(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Gasto no Cartão</span>
            </button>
          </div>
        </div>

        {/* 2. Key Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          {/* Card 1: Total do Mês */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Fatura do Mês
            </span>
            <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums mt-1">
              {formatBRL(totalMonthAmount)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {monthExpenses.length} compras cadastradas
            </div>
          </div>

          {/* Card 2: Conciliação com Lançamentos */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Fatura em Lançamentos
              </span>
              {isReconciled ? (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  100% Batida
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                  <AlertCircle className="w-3 h-3" />
                  Diferença
                </span>
              )}
            </div>

            <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums mt-1">
              {cardInvoiceTx ? formatBRL(cardInvoiceTx.amount) : 'Não preenchido'}
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
              <span>
                {cardInvoiceTx
                  ? isReconciled
                    ? 'Bate com a soma das compras'
                    : `Diferença: ${formatBRL(Math.abs(reconciliationDiff))}`
                  : 'Item em Lançamentos'}
              </span>

              {onSyncInvoiceToTransactions && cardInvoiceTx && !isReconciled && (
                <button
                  onClick={() => onSyncInvoiceToTransactions(totalMonthAmount)}
                  title="Atualizar o valor do lançamento de Cartão com o total real calculado"
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  <span>Sincronizar</span>
                </button>
              )}
            </div>
          </div>

          {/* Card 3: Cartão Principal */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Cartão com Maior Gasto
            </span>
            <div className="text-base font-bold text-slate-900 dark:text-white truncate mt-1">
              {byCardBreakdown[0]?.card || 'Nenhum gasto'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
              {byCardBreakdown[0] ? formatBRL(byCardBreakdown[0].total) : 'R$ 0,00'}
            </div>
          </div>

          {/* Card 4: Membro com Maior Consumo */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Maior Consumo na Fatura
            </span>
            <div className="text-base font-bold text-slate-900 dark:text-white truncate mt-1">
              {topMember?.name || 'Nenhum'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
              {topMember ? formatBRL(topMember.amount) : 'R$ 0,00'}
            </div>
          </div>
        </div>

        {/* 3. Cards Quick Filter Ribbon */}
        {byCardBreakdown.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold shrink-0">
              Por Cartão:
            </span>
            <button
              onClick={() => setCardFilter('all')}
              className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
                cardFilter === 'all'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Todos ({monthExpenses.length})
            </button>
            {byCardBreakdown.map((item) => (
              <button
                key={item.card}
                onClick={() => setCardFilter(cardFilter === item.card ? 'all' : item.card)}
                className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors flex items-center gap-1.5 ${
                  cardFilter === item.card
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <CreditCard className="w-3 h-3 opacity-70" />
                <span>{item.card}</span>
                <span className="font-bold tabular-nums opacity-80">
                  {formatBRL(item.total)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* View Switcher: Lista vs Gráficos do Cartão */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'list'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Lista de Gastos ({sortedExpenses.length})</span>
          </button>
          <button
            onClick={() => setActiveView('charts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'charts'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Gráficos do Cartão de Crédito</span>
          </button>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          Visualização: <strong className="text-slate-800 dark:text-slate-200">{activeView === 'list' ? 'Tabela Detalhada' : 'Painel Gráfico'}</strong>
        </span>
      </div>

      {/* VIEW 1: LIST VIEW */}
      {activeView === 'list' && (
        <>
          {/* 4. Filters & Search Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar gasto por descrição, cartão, categoria, membro ou notas..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Installment Filter */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0 text-xs">
                <button
                  onClick={() => setInstallmentFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    installmentFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Todas ({monthExpenses.length})
                </button>
                <button
                  onClick={() => setInstallmentFilter('single')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    installmentFilter === 'single'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  À Vista
                </button>
                <button
                  onClick={() => setInstallmentFilter('installments')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    installmentFilter === 'installments'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Parceladas
                </button>
              </div>
            </div>

            {/* Secondary dropdown filters */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mr-1 shrink-0">
                <Filter className="w-3.5 h-3.5" />
                <span>Filtros:</span>
              </div>

              {/* Member */}
              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Membro: Todos</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>

              {/* Category */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Categoria: Todas</option>
                {categories
                  .filter((c) => c.type === 'expense' || c.type === 'both')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>

              {(searchTerm || cardFilter !== 'all' || memberFilter !== 'all' || categoryFilter !== 'all' || installmentFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCardFilter('all');
                    setMemberFilter('all');
                    setCategoryFilter('all');
                    setInstallmentFilter('all');
                  }}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline ml-auto font-medium"
                >
                  Resetar Filtros
                </button>
              )}
            </div>
          </div>

          {/* 5. Table of Expenses */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden transition-colors">
            {sortedExpenses.length === 0 ? (
              <div className="text-center py-12 px-4">
                <CreditCard className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Nenhum gasto no cartão encontrado
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {monthExpenses.length === 0
                    ? `Não há compras no cartão de crédito cadastradas para a fatura de ${formatMonthYear(currentMonthKey)}.`
                    : 'Nenhum gasto corresponde aos filtros selecionados acima.'}
                </p>
                <button
                  onClick={() => {
                    setExpenseToEdit(null);
                    setIsModalOpen(true);
                  }}
                  className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Novo Gasto no Cartão</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Data Compra</th>
                      <th className="py-3 px-4">Descrição do Gasto</th>
                      <th className="py-3 px-4">Cartão</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Responsável</th>
                      <th className="py-3 px-4 text-center">Parcela</th>
                      <th className="py-3 px-4 text-right">Valor (R$)</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sortedExpenses.map((expense) => {
                      const cat = categoryMap.get(expense.categoryId);
                      const mem = memberMap.get(expense.memberId);
                      const isMulti = expense.installmentsTotal && expense.installmentsTotal > 1;

                      return (
                        <tr
                          key={expense.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Date */}
                          <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400 tabular-nums">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{formatDateBR(expense.purchaseDate)}</span>
                            </div>
                          </td>

                          {/* Description & Notes */}
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-semibold text-slate-900 dark:text-white truncate">
                              {expense.description}
                            </div>
                            {expense.notes && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={expense.notes}>
                                {expense.notes}
                              </div>
                            )}
                          </td>

                          {/* Card Name */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium text-[11px]">
                              <CreditCard className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[130px]">{expense.cardName}</span>
                            </span>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: cat?.color || '#94a3b8' }}
                              />
                              <span>{cat?.name || 'Geral'}</span>
                            </div>
                          </td>

                          {/* Member */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                style={{ backgroundColor: mem?.color || '#64748B' }}
                              >
                                {mem?.avatarInitials || 'FM'}
                              </span>
                              <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[110px]">
                                {mem?.name || 'Família'}
                              </span>
                            </div>
                          </td>

                          {/* Installments */}
                          <td className="py-3 px-4 whitespace-nowrap text-center">
                            {isMulti ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                                <Layers className="w-3 h-3 text-indigo-500" />
                                <span>
                                  {expense.installmentsCurrent || 1}/{expense.installmentsTotal}
                                </span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">À vista</span>
                            )}
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            <div className="font-bold tabular-nums text-sm text-slate-900 dark:text-white">
                              {formatBRL(expense.amount)}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setExpenseToEdit(expense);
                                  setIsModalOpen(true);
                                }}
                                title="Editar gasto"
                                className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDuplicateExpense(expense)}
                                title="Duplicar gasto"
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Excluir o gasto "${expense.description}" no valor de ${formatBRL(expense.amount)}?`)) {
                                    onDeleteExpense(expense.id);
                                  }
                                }}
                                title="Excluir gasto"
                                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 font-bold text-xs text-slate-900 dark:text-white">
                      <td colSpan={6} className="py-3 px-4 text-right">
                        Subtotal dos Gastos Filtrados:
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-indigo-600 dark:text-indigo-400 text-sm">
                        {formatBRL(sortedExpenses.reduce((sum, e) => sum + e.amount, 0))}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* VIEW 2: DEDICATED CREDIT CARD CHARTS DASHBOARD */}
      {activeView === 'charts' && (
        <div className="space-y-6">
          {/* Quick Metrics Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Total Fatura
              </span>
              <div className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 tabular-nums mt-1">
                {formatBRL(totalMonthAmount)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {monthExpenses.length} lançamentos no cartão
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Gasto Médio por Compra
              </span>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums mt-1">
                {formatBRL(monthExpenses.length > 0 ? totalMonthAmount / monthExpenses.length : 0)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Ticket médio do mês
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Compras À Vista
              </span>
              <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                {formatBRL(installmentAnalytics.singleTotal)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {installmentAnalytics.singleCount} compras ({installmentAnalytics.singlePct.toFixed(0)}% da fatura)
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Parcelas do Mês
              </span>
              <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums mt-1">
                {formatBRL(installmentAnalytics.installmentTotal)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {installmentAnalytics.installmentCount} parcelas ativas ({installmentAnalytics.installmentPct.toFixed(0)}%)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Chart 1: Por Cartão */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Distribuição por Cartão
                  </h3>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {byCardBreakdown.length} cartões
                </span>
              </div>

              {byCardBreakdown.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Nenhum gasto registrado.</p>
              ) : (
                <div className="space-y-3.5">
                  {byCardBreakdown.map((item) => {
                    const pct = totalMonthAmount > 0 ? (item.total / totalMonthAmount) * 100 : 0;
                    return (
                      <div key={item.card} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-indigo-500 opacity-80" />
                            <span>{item.card}</span>
                            <span className="text-[11px] text-slate-400 font-normal">({item.count} compras)</span>
                          </span>
                          <div className="flex items-center gap-2 tabular-nums">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {formatBRL(item.total)}
                            </span>
                            <span className="text-xs font-semibold text-slate-500 w-10 text-right">
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(3, pct))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chart 2: Por Membro da Família */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Consumo no Cartão por Membro
                  </h3>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {byMemberBreakdown.length} membros
                </span>
              </div>

              {byMemberBreakdown.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Nenhum gasto registrado.</p>
              ) : (
                <div className="space-y-3.5">
                  {byMemberBreakdown.map((item) => (
                    <div key={item.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                            style={{ backgroundColor: item.color }}
                          >
                            {item.avatarInitials}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal shrink-0">({item.count} compras)</span>
                        </div>
                        <div className="flex items-center gap-2 tabular-nums shrink-0 ml-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatBRL(item.total)}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 w-10 text-right">
                            {item.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            backgroundColor: item.color,
                            width: `${Math.min(100, Math.max(3, item.percentage))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chart 3: Por Categoria de Despesa */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Gastos do Cartão por Categoria
                  </h3>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {byCategoryBreakdown.length} categorias identificadas
                </span>
              </div>

              {byCategoryBreakdown.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Nenhum gasto registrado.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {byCategoryBreakdown.map((cat) => (
                    <div
                      key={cat.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-1.5"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                            {cat.name}
                          </span>
                        </div>
                        <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                          {formatBRL(cat.total)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{cat.count} {cat.count === 1 ? 'compra' : 'compras'}</span>
                        <span className="font-mono">{cat.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            backgroundColor: cat.color,
                            width: `${Math.min(100, Math.max(3, cat.percentage))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chart 4: Modalidade e Conciliação */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5 min-w-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>À Vista vs. Parcelado</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Compromissos à vista contra parcelas recorrentes
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">À Vista:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatBRL(installmentAnalytics.singleTotal)} ({installmentAnalytics.singlePct.toFixed(0)}%)
                    </strong>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${installmentAnalytics.singlePct}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs pt-1">
                    <span className="text-slate-600 dark:text-slate-400">Parcelado:</span>
                    <strong className="text-amber-600 dark:text-amber-400 tabular-nums">
                      {formatBRL(installmentAnalytics.installmentTotal)} ({installmentAnalytics.installmentPct.toFixed(0)}%)
                    </strong>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${installmentAnalytics.installmentPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Conciliação */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Conferência da Fatura</span>
                  </h4>
                  {isReconciled && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                      Batida
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total do Cartão:</span>
                    <strong className="tabular-nums text-slate-900 dark:text-white">{formatBRL(totalMonthAmount)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Em Lançamentos:</span>
                    <strong className="tabular-nums text-slate-900 dark:text-white">
                      {cardInvoiceTx ? formatBRL(cardInvoiceTx.amount) : 'Não informado'}
                    </strong>
                  </div>
                  {cardInvoiceTx && !isReconciled && (
                    <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-amber-600 font-semibold">
                      <span>Diferença:</span>
                      <span className="tabular-nums">{formatBRL(Math.abs(reconciliationDiff))}</span>
                    </div>
                  )}
                </div>

                {onSyncInvoiceToTransactions && cardInvoiceTx && !isReconciled && (
                  <button
                    onClick={() => onSyncInvoiceToTransactions(totalMonthAmount)}
                    className="w-full py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Sincronizar Fatura em Lançamentos</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Explanatory Architecture Footer Banner */}
      <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
        <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Regra de Contabilização sem Duplicidade:</p>
          <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
            Todos os gastos cadastrados nesta aba <strong>"Cartão de Crédito"</strong> participam diretamente do <strong>total gasto da família no mês</strong> e dos <strong>gráficos de análise</strong>. Na aba <strong>Lançamentos</strong>, o item de fatura pode ser mantido e preenchido livremente para controle de pagamento, sem que seu valor seja somado em duplicidade ao total mensal. Nos gráficos, você pode ativar ou desativar a visualização da fatura conforme sua preferência.
          </p>
        </div>
      </div>

      {/* Modal */}
      <CreditCardModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setExpenseToEdit(null);
        }}
        onSave={handleSaveModal}
        expenseToEdit={expenseToEdit}
        categories={categories}
        members={members}
        defaultMonthKey={currentMonthKey}
        knownCardNames={knownCardNames}
      />
    </div>
  );
};
