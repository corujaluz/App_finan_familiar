import React, { useState, useMemo } from 'react';
import {
  PieChart as PieIcon,
  BarChart3,
  Users,
  Wallet,
  TrendingUp,
  Percent,
  CheckCircle2,
  Clock,
  Info,
  Briefcase,
  CreditCard,
  Target,
  ChevronDown,
  ChevronUp,
  Layers,
  Calendar,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Category, CreditCardExpense, FamilyMember, IncomeSource, Transaction } from '../types/finance';
import { formatBRL, formatDateBR, formatMonthYear } from '../utils/formatters';

interface ChartsAnalyticsProps {
  transactions: Transaction[];
  categories: Category[];
  members: FamilyMember[];
  incomeSources?: IncomeSource[];
  creditCardExpenses?: CreditCardExpense[];
  currentMonthKey: string;
}

export const ChartsAnalytics: React.FC<ChartsAnalyticsProps> = ({
  transactions,
  categories,
  members,
  incomeSources = [],
  creditCardExpenses = [],
  currentMonthKey,
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'budgets_vs_actual' | 'credit_card' | 'income_sources' | 'monthly_flow' | 'members' | 'status'>('categories');
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [selectedCategoryForDrilldown, setSelectedCategoryForDrilldown] = useState<string | null>(null);

  // Controles de exibição de Cartão de Crédito nos gráficos (marcar e desmarcar!)
  const [includeDetailedCardExpenses, setIncludeDetailedCardExpenses] = useState<boolean>(true);
  const [includeInvoiceTransactionInCharts, setIncludeInvoiceTransactionInCharts] = useState<boolean>(false);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  // Current month transactions
  const currentMonthTx = useMemo(
    () => transactions.filter((t) => t.dueDate.startsWith(currentMonthKey)),
    [transactions, currentMonthKey]
  );

  // Current month card invoice transaction in general transactions
  const cardInvoiceTx = useMemo(() => {
    return currentMonthTx.find(
      (t) => t.type === 'expense' && (t.isCreditCardInvoice || t.categoryId === 'cat_cartao')
    );
  }, [currentMonthTx]);

  const cardInvoiceAmount = cardInvoiceTx ? cardInvoiceTx.amount : 0;

  // Total credit card expenses in current reference month
  const creditCardTotalThisMonth = useMemo(() => {
    return creditCardExpenses
      .filter((c) => c.referenceMonth === currentMonthKey)
      .reduce((sum, c) => sum + c.amount, 0);
  }, [creditCardExpenses, currentMonthKey]);

  // 1. Category breakdown for current month expenses
  const categoryExpenses = useMemo(() => {
    // Regular non-card expenses
    const regularExpenses = currentMonthTx.filter(
      (t) => t.type === 'expense' && !t.isCreditCardInvoice && t.categoryId !== 'cat_cartao'
    );

    const map = new Map<string, number>();

    // Add regular expenses
    regularExpenses.forEach((t) => {
      map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
    });

    // Add individual credit card expenses by category (if enabled)
    if (includeDetailedCardExpenses) {
      const monthCC = creditCardExpenses.filter((c) => c.referenceMonth === currentMonthKey);
      monthCC.forEach((c) => {
        map.set(c.categoryId, (map.get(c.categoryId) || 0) + c.amount);
      });
    }

    // Add general invoice transaction item if user checked "includeInvoiceTransactionInCharts" (marcar e desmarcar)
    if (includeInvoiceTransactionInCharts && cardInvoiceTx) {
      map.set('cat_cartao', (map.get('cat_cartao') || 0) + cardInvoiceTx.amount);
    }

    const totalExp = Array.from(map.values()).reduce((sum, v) => sum + v, 0);

    const list = Array.from(map.entries())
      .map(([catId, amount]) => {
        const cat = categoryMap.get(catId);
        const percentage = totalExp > 0 ? (amount / totalExp) * 100 : 0;
        return {
          id: catId,
          name: cat?.name || (catId === 'cat_cartao' ? 'Fatura Cartão de Crédito (Lançamento)' : 'Outros'),
          color: cat?.color || '#6366F1',
          amount,
          percentage,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return { items: list, total: totalExp };
  }, [
    currentMonthTx,
    categoryMap,
    creditCardExpenses,
    currentMonthKey,
    includeDetailedCardExpenses,
    includeInvoiceTransactionInCharts,
    cardInvoiceTx,
  ]);

  // Detailed Budget vs. Actual (Lançamentos vs. Orçamentos) data
  const budgetVsActualData = useMemo(() => {
    const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both');

    const items = expenseCategories.map((cat) => {
      // 1. Transactions (lançamentos regulares)
      const catTransactions = currentMonthTx.filter(
        (t) => t.type === 'expense' && t.categoryId === cat.id && !t.isCreditCardInvoice && t.categoryId !== 'cat_cartao'
      );

      // 2. Cartão de Crédito expenses
      const catCreditCard = includeDetailedCardExpenses
        ? creditCardExpenses.filter((c) => c.referenceMonth === currentMonthKey && c.categoryId === cat.id)
        : [];

      // 3. Invoice if applicable
      const catInvoice = cat.id === 'cat_cartao' && includeInvoiceTransactionInCharts && cardInvoiceTx
        ? [cardInvoiceTx]
        : [];

      const txSpent = catTransactions.reduce((sum, t) => sum + t.amount, 0);
      const cardSpent = catCreditCard.reduce((sum, c) => sum + c.amount, 0);
      const invoiceSpent = catInvoice.reduce((sum, t) => sum + t.amount, 0);
      const totalSpent = txSpent + cardSpent + invoiceSpent;

      const budget = cat.monthlyBudget || 0;
      const difference = budget - totalSpent; // > 0 means within budget, < 0 means over budget
      const percentage = budget > 0 ? (totalSpent / budget) * 100 : 0;

      let status: 'ok' | 'warning' | 'danger' | 'no_budget' = 'ok';
      if (budget === 0) {
        status = 'no_budget';
      } else if (percentage > 100) {
        status = 'danger';
      } else if (percentage >= 80) {
        status = 'warning';
      }

      return {
        category: cat,
        budget,
        totalSpent,
        txSpent,
        cardSpent,
        difference,
        percentage,
        status,
        transactions: catTransactions,
        creditCardExpenses: catCreditCard,
        totalItemsCount: catTransactions.length + catCreditCard.length,
      };
    });

    // Sort by percentage of budget used descending (highest alerts first)
    const sorted = [...items].sort((a, b) => {
      if (a.budget === 0 && b.budget > 0) return 1;
      if (b.budget === 0 && a.budget > 0) return -1;
      return b.percentage - a.percentage;
    });

    const totalBudget = expenseCategories.reduce((sum, c) => sum + (c.monthlyBudget || 0), 0);
    const totalSpentAll = sorted.reduce((sum, i) => sum + i.totalSpent, 0);
    const totalRemaining = totalBudget - totalSpentAll;
    const overallPercentage = totalBudget > 0 ? (totalSpentAll / totalBudget) * 100 : 0;
    const alertCount = sorted.filter((i) => i.status === 'warning' || i.status === 'danger').length;

    return {
      items: sorted,
      totalBudget,
      totalSpentAll,
      totalRemaining,
      overallPercentage,
      alertCount,
    };
  }, [
    categories,
    currentMonthTx,
    creditCardExpenses,
    currentMonthKey,
    includeDetailedCardExpenses,
    includeInvoiceTransactionInCharts,
    cardInvoiceTx,
  ]);

  // 2. Monthly cash flow across historical months
  const monthlyFlowData = useMemo(() => {
    const monthsSet = new Set<string>();
    transactions.forEach((t) => {
      monthsSet.add(t.dueDate.slice(0, 7));
    });
    creditCardExpenses.forEach((c) => {
      monthsSet.add(c.referenceMonth);
    });

    // Make sure current month is present
    monthsSet.add(currentMonthKey);

    const sortedMonths = Array.from(monthsSet).sort();

    return sortedMonths.map((mKey) => {
      const monthTx = transactions.filter((t) => t.dueDate.startsWith(mKey));
      const income = monthTx
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const regularExpense = monthTx
        .filter((t) => t.type === 'expense' && !t.isCreditCardInvoice && t.categoryId !== 'cat_cartao')
        .reduce((sum, t) => sum + t.amount, 0);

      const ccAmount = includeDetailedCardExpenses
        ? creditCardExpenses
            .filter((c) => c.referenceMonth === mKey)
            .reduce((sum, c) => sum + c.amount, 0)
        : 0;

      const invoiceItem = monthTx.find(
        (t) => t.type === 'expense' && (t.isCreditCardInvoice || t.categoryId === 'cat_cartao')
      );
      const invoiceAmount = includeInvoiceTransactionInCharts && invoiceItem ? invoiceItem.amount : 0;

      const expense = regularExpense + ccAmount + invoiceAmount;
      const balance = income - expense;
      const savingsRate = income > 0 ? (balance / income) * 100 : 0;

      return {
        monthKey: mKey,
        label: formatMonthYear(mKey).split(' de ')[0], // e.g. "Novembro"
        fullLabel: formatMonthYear(mKey),
        income,
        expense,
        balance,
        savingsRate,
      };
    });
  }, [transactions, creditCardExpenses, currentMonthKey, includeDetailedCardExpenses, includeInvoiceTransactionInCharts]);

  // Find max value for monthly chart scaling
  const maxFlowValue = useMemo(() => {
    const maxVal = Math.max(
      ...monthlyFlowData.map((d) => Math.max(d.income, d.expense)),
      1000
    );
    return maxVal * 1.15; // 15% headroom
  }, [monthlyFlowData]);

  // 3. Member breakdown: Incomes and Expenses per family member
  const memberBreakdown = useMemo(() => {
    return members.map((mem) => {
      const memTx = currentMonthTx.filter((t) => t.memberId === mem.id);
      const income = memTx
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const regularExpense = memTx
        .filter((t) => t.type === 'expense' && !t.isCreditCardInvoice && t.categoryId !== 'cat_cartao')
        .reduce((sum, t) => sum + t.amount, 0);

      const ccExpense = includeDetailedCardExpenses
        ? creditCardExpenses
            .filter((c) => c.referenceMonth === currentMonthKey && c.memberId === mem.id)
            .reduce((sum, c) => sum + c.amount, 0)
        : 0;

      const invoiceExpense = includeInvoiceTransactionInCharts
        ? memTx
            .filter((t) => t.type === 'expense' && (t.isCreditCardInvoice || t.categoryId === 'cat_cartao'))
            .reduce((sum, t) => sum + t.amount, 0)
        : 0;

      const expense = regularExpense + ccExpense + invoiceExpense;
      const balance = income - expense;

      return {
        id: mem.id,
        name: mem.name,
        role: mem.role,
        color: mem.color,
        initials: mem.avatarInitials,
        income,
        expense,
        balance,
      };
    });
  }, [members, currentMonthTx, creditCardExpenses, currentMonthKey, includeDetailedCardExpenses, includeInvoiceTransactionInCharts]);

  // 4. Dedicated Credit Card Analytics
  const creditCardAnalytics = useMemo(() => {
    const monthCC = creditCardExpenses.filter((c) => c.referenceMonth === currentMonthKey);
    const total = monthCC.reduce((sum, c) => sum + c.amount, 0);

    // By Card Name
    const byCardMap = new Map<string, number>();
    monthCC.forEach((c) => {
      byCardMap.set(c.cardName, (byCardMap.get(c.cardName) || 0) + c.amount);
    });
    const byCard = Array.from(byCardMap.entries())
      .map(([card, amount]) => ({
        card,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // By Member
    const byMemberMap = new Map<string, number>();
    monthCC.forEach((c) => {
      byMemberMap.set(c.memberId, (byMemberMap.get(c.memberId) || 0) + c.amount);
    });
    const byMember = Array.from(byMemberMap.entries())
      .map(([memberId, amount]) => {
        const mem = memberMap.get(memberId);
        return {
          memberId,
          name: mem?.name || 'Membro',
          role: mem?.role || '',
          color: mem?.color || '#6366f1',
          initials: mem?.avatarInitials || 'FM',
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // By Category
    const byCategoryMap = new Map<string, number>();
    monthCC.forEach((c) => {
      byCategoryMap.set(c.categoryId, (byCategoryMap.get(c.categoryId) || 0) + c.amount);
    });
    const byCategory = Array.from(byCategoryMap.entries())
      .map(([catId, amount]) => {
        const cat = categoryMap.get(catId);
        return {
          catId,
          name: cat?.name || 'Outros',
          color: cat?.color || '#94a3b8',
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return { total, byCard, byMember, byCategory, count: monthCC.length };
  }, [creditCardExpenses, currentMonthKey, memberMap, categoryMap]);

  // 4. Payment status analysis
  const paymentStatusBreakdown = useMemo(() => {
    const expenses = currentMonthTx.filter((t) => t.type === 'expense');
    const totalExp = expenses.reduce((sum, t) => sum + t.amount, 0);
    const paidExpenses = expenses.filter((t) => t.status === 'paid');
    const paidAmount = paidExpenses.reduce((sum, t) => sum + t.amount, 0);
    const pendingAmount = totalExp - paidAmount;

    // By payment method
    const methodMap = new Map<string, number>();
    expenses.forEach((t) => {
      methodMap.set(t.paymentMethod, (methodMap.get(t.paymentMethod) || 0) + t.amount);
    });

    const methods = Array.from(methodMap.entries()).map(([method, amount]) => ({
      method,
      amount,
      percentage: totalExp > 0 ? (amount / totalExp) * 100 : 0,
    })).sort((a, b) => b.amount - a.amount);

    return {
      total: totalExp,
      paidAmount,
      pendingAmount,
      paidCount: paidExpenses.length,
      totalCount: expenses.length,
      paidPercent: totalExp > 0 ? Math.round((paidAmount / totalExp) * 100) : 100,
      methods,
    };
  }, [currentMonthTx]);

  // 5. Income sources breakdown for current month
  const incomeSourcesBreakdown = useMemo(() => {
    const incomes = currentMonthTx.filter((t) => t.type === 'income');
    const totalInc = incomes.reduce((sum, t) => sum + t.amount, 0);

    return incomeSources.map((source) => {
      const sourceTx = incomes.filter(
        (t) => t.sourceId === source.id || (t.sourceName && t.sourceName.toLowerCase() === source.name.toLowerCase())
      );
      const received = sourceTx.filter((t) => t.status === 'paid').reduce((sum, t) => sum + t.amount, 0);
      const pending = sourceTx.filter((t) => t.status !== 'paid').reduce((sum, t) => sum + t.amount, 0);
      const total = received + pending;
      const mem = memberMap.get(source.memberId);
      const cat = categoryMap.get(source.categoryId);
      const percentageOfTotal = totalInc > 0 ? (total / totalInc) * 100 : 0;

      return {
        id: source.id,
        name: source.name,
        estimated: source.estimatedMonthlyAmount,
        received,
        pending,
        total,
        percentageOfTotal,
        memberName: mem?.name || 'Família',
        memberColor: mem?.color || '#059669',
        categoryName: cat?.name || 'Renda',
      };
    }).sort((a, b) => b.total - a.total);
  }, [currentMonthTx, incomeSources, memberMap, categoryMap]);

  // Helper to build Donut SVG paths
  const donutSlices = useMemo(() => {
    let cumulativeAngle = 0;
    const total = categoryExpenses.total;
    if (total === 0) return [];

    return categoryExpenses.items.map((item) => {
      const angle = (item.amount / total) * 360;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;
      cumulativeAngle += angle;

      // Arc calculation
      const r = 90;
      const innerR = 56;
      const cx = 110;
      const cy = 110;

      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (endAngle - 90) * (Math.PI / 180);

      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);

      const x3 = cx + innerR * Math.cos(endRad);
      const y3 = cy + innerR * Math.sin(endRad);
      const x4 = cx + innerR * Math.cos(startRad);
      const y4 = cy + innerR * Math.sin(startRad);

      const largeArc = angle > 180 ? 1 : 0;

      const pathData = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;

      return {
        ...item,
        pathData,
        startAngle,
        endAngle,
      };
    });
  }, [categoryExpenses]);

  return (
    <div className="space-y-6">
      {/* Chart Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'categories'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Despesas por Categoria</span>
          </button>
          <button
            onClick={() => setActiveTab('budgets_vs_actual')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'budgets_vs_actual'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Target className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Lançamentos vs. Orçamentos</span>
            {budgetVsActualData.alertCount > 0 && (
              <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                {budgetVsActualData.alertCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('credit_card')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'credit_card'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Cartão de Crédito</span>
          </button>
          <button
            onClick={() => setActiveTab('income_sources')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'income_sources'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Fontes de Renda</span>
          </button>
          <button
            onClick={() => setActiveTab('monthly_flow')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'monthly_flow'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Fluxo de Caixa Mensal</span>
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'members'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span>Membros da Família</span>
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'status'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Status & Confirmações</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 px-2 font-medium">
          Mês: <strong className="text-slate-800 dark:text-slate-200">{formatMonthYear(currentMonthKey)}</strong>
        </div>
      </div>

      {/* Credit Card Chart Settings Bar (opção de marcar e desmarcar o item de cartão de crédito) */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5 min-w-0 overflow-hidden">
        <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              Participação do Cartão de Crédito nos Gráficos
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Marque ou desmarque para incluir ou excluir dos cálculos e gráficos visuais
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
          {/* Opção 1: Gastos Detalhados */}
          <label
            className={`flex items-start sm:items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer min-w-0 ${
              includeDetailedCardExpenses
                ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 ring-1 ring-indigo-500/20'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <input
              type="checkbox"
              checked={includeDetailedCardExpenses}
              onChange={(e) => setIncludeDetailedCardExpenses(e.target.checked)}
              className="mt-0.5 sm:mt-0 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
            />
            <div className="min-w-0 flex-1 text-xs">
              <span className="font-semibold text-slate-900 dark:text-white block leading-tight">
                Incluir Gastos Detalhados do Cartão
              </span>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Total detalhado:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {formatBRL(creditCardTotalThisMonth)}
                </span>
              </div>
            </div>
          </label>

          {/* Opção 2: Item Cartão dos Lançamentos */}
          <label
            className={`flex items-start sm:items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer min-w-0 ${
              includeInvoiceTransactionInCharts
                ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 ring-1 ring-indigo-500/20'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Marcar ou desmarcar a visualização da fatura registrada nos Lançamentos neste gráfico"
          >
            <input
              type="checkbox"
              checked={includeInvoiceTransactionInCharts}
              onChange={(e) => setIncludeInvoiceTransactionInCharts(e.target.checked)}
              className="mt-0.5 sm:mt-0 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
            />
            <div className="min-w-0 flex-1 text-xs">
              <span className="font-semibold text-slate-900 dark:text-white block leading-tight">
                Marcar item "Cartão de Crédito" dos Lançamentos
              </span>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Fatura lançada:</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                  {cardInvoiceAmount > 0 ? formatBRL(cardInvoiceAmount) : 'R$ 0,00'}
                </span>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Tab 1: Despesas por Categoria */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Donut Chart Visualizer */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col items-center justify-start space-y-5 min-w-0">
            <div className="w-full text-left">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Composição das Saídas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Onde o orçamento familiar foi distribuído neste mês
              </p>
            </div>

            {categoryExpenses.total === 0 ? (
              <div className="text-center py-10">
                <p className="text-xs text-slate-400">Nenhuma despesa registrada neste mês.</p>
              </div>
            ) : (
              <div className="relative w-[210px] h-[210px] sm:w-[220px] sm:h-[220px] my-2">
                <svg viewBox="0 0 220 220" className="w-full h-full transform -rotate-90">
                  {donutSlices.map((slice) => {
                    const isHovered = hoveredSlice === slice.id;
                    return (
                      <path
                        key={slice.id}
                        d={slice.pathData}
                        fill={slice.color}
                        stroke="transparent"
                        strokeWidth={isHovered ? 3 : 1}
                        className="transition-all duration-200 cursor-pointer hover:opacity-90"
                        onMouseEnter={() => setHoveredSlice(slice.id)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    );
                  })}
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Total Gastos
                  </span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {formatBRL(categoryExpenses.total)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {categoryExpenses.items.length} categorias
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Category List & Progress Bars */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs min-w-0 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Ranking de Gastos por Categoria
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Percentual sobre o total de saídas do mês
                </p>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {categoryExpenses.items.length} categorias
              </span>
            </div>

            {categoryExpenses.items.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                Sem despesas para calcular o ranking.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="p-2.5 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>💡</span>
                  <span>Clique em qualquer categoria para abrir o detalhamento de <strong>Lançamentos</strong> e <strong>Orçamentos</strong>.</span>
                </div>

                {categoryExpenses.items.map((item) => {
                  const isHovered = hoveredSlice === item.id;
                  const isSelected = selectedCategoryForDrilldown === item.id;
                  const catBudget = categoryMap.get(item.id)?.monthlyBudget || 0;
                  const isOverBudget = catBudget > 0 && item.amount > catBudget;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedCategoryForDrilldown(isSelected ? null : item.id)}
                      onMouseEnter={() => setHoveredSlice(item.id)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all min-w-0 ${
                        isSelected
                          ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                          : isHovered
                          ? 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                          : 'bg-white dark:bg-slate-900/60 border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Top Row: Category Name + Budget Badge + Amount + Percentage */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs mb-2 min-w-0">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap flex-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span
                            className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-[280px]"
                            title={item.name}
                          >
                            {item.name}
                          </span>
                          {catBudget > 0 && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0 whitespace-nowrap ${
                                isOverBudget
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              Orçado: {formatBRL(catBudget)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2.5 tabular-nums shrink-0 ml-auto sm:ml-0">
                          <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {formatBRL(item.amount)}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 min-w-[38px] text-right">
                            {item.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Bar indicator */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.max(2, item.percentage))}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Drilldown Panel for Selected Category */}
          {selectedCategoryForDrilldown && (() => {
            const cat = categoryMap.get(selectedCategoryForDrilldown);
            const budgetItem = budgetVsActualData.items.find((i) => i.category.id === selectedCategoryForDrilldown);
            if (!cat) return null;

            return (
              <div className="lg:col-span-12 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Detalhamento: {cat.name}</span>
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                          (Lançamentos & Orçamento)
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Itens computados nesta categoria no mês de {formatMonthYear(currentMonthKey)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    {budgetItem && budgetItem.budget > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Orçamento</span>
                          <strong className="text-slate-900 dark:text-white tabular-nums font-bold">
                            {formatBRL(budgetItem.budget)}
                          </strong>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Realizado</span>
                          <strong className="text-indigo-600 dark:text-indigo-400 tabular-nums font-bold">
                            {formatBRL(budgetItem.totalSpent)}
                          </strong>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Saldo</span>
                          <strong
                            className={`tabular-nums font-bold ${
                              budgetItem.difference >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {formatBRL(budgetItem.difference)}
                          </strong>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => setSelectedCategoryForDrilldown(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800"
                    >
                      Fechar Detalhes
                    </button>
                  </div>
                </div>

                {/* Grid of underlying transactions and card expenses */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Lançamentos Regulares */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Lançamentos Diretos ({budgetItem?.transactions.length || 0})</span>
                      <span className="tabular-nums text-slate-900 dark:text-white font-bold">
                        {formatBRL(budgetItem?.txSpent || 0)}
                      </span>
                    </div>

                    {!budgetItem || budgetItem.transactions.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">Nenhum lançamento direto.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs">
                        {budgetItem.transactions.map((tx) => {
                          const mem = memberMap.get(tx.memberId);
                          return (
                            <div
                              key={tx.id}
                              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                            >
                              <div className="truncate max-w-[170px] sm:max-w-xs">
                                <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                  {tx.title}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {formatDateBR(tx.dueDate)} · {mem?.name || 'Família'}
                                </div>
                              </div>
                              <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                                {formatBRL(tx.amount)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Gastos no Cartão de Crédito */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Gastos no Cartão de Crédito ({budgetItem?.creditCardExpenses.length || 0})</span>
                      <span className="tabular-nums text-indigo-600 dark:text-indigo-400 font-bold">
                        {formatBRL(budgetItem?.cardSpent || 0)}
                      </span>
                    </div>

                    {!budgetItem || budgetItem.creditCardExpenses.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">Nenhum gasto no cartão nesta categoria.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs">
                        {budgetItem.creditCardExpenses.map((c) => {
                          const mem = memberMap.get(c.memberId);
                          return (
                            <div
                              key={c.id}
                              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                            >
                              <div className="truncate max-w-[170px] sm:max-w-xs">
                                <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                  {c.description}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {formatDateBR(c.purchaseDate)} · {c.cardName} · {mem?.name || 'Família'}
                                  {c.installmentsTotal && c.installmentsTotal > 1 ? ` (${c.installmentsCurrent || 1}/${c.installmentsTotal})` : ''}
                                </div>
                              </div>
                              <span className="font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                                {formatBRL(c.amount)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab: Lançamentos vs. Orçamentos (Orçado vs. Realizado com Interação Completa) */}
      {activeTab === 'budgets_vs_actual' && (
        <div className="space-y-6">
          {/* Header Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Interação: Lançamentos vs. Orçamentos
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Acompanhamento do teto orçamentário contra saídas reais (Lançamentos + Cartão de Crédito) em {formatMonthYear(currentMonthKey)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Total Orçado</span>
                  <strong className="text-slate-900 dark:text-white text-sm tabular-nums">
                    {formatBRL(budgetVsActualData.totalBudget)}
                  </strong>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:border-slate-700" />
                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Total Realizado</span>
                  <strong className="text-rose-600 dark:text-rose-400 text-sm tabular-nums">
                    {formatBRL(budgetVsActualData.totalSpentAll)}
                  </strong>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:border-slate-700" />
                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Saldo Geral</span>
                  <strong
                    className={`text-sm tabular-nums ${
                      budgetVsActualData.totalRemaining >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatBRL(budgetVsActualData.totalRemaining)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Execução Orçamentária Geral do Mês
                </span>
                <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                  {budgetVsActualData.overallPercentage.toFixed(1)}% utilizado
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetVsActualData.overallPercentage > 100
                      ? 'bg-rose-500'
                      : budgetVsActualData.overallPercentage >= 80
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(3, budgetVsActualData.overallPercentage))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Interactive Category Comparison Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden min-w-0">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Categorias: Orçado vs. Realizado (Clique para abrir lançamentos)
              </h4>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {budgetVsActualData.items.length} categorias de despesa
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {budgetVsActualData.items.map((item) => {
                const isExpanded = selectedCategoryForDrilldown === item.category.id;

                return (
                  <div key={item.category.id} className="transition-colors">
                    {/* Main Row */}
                    <div
                      onClick={() => setSelectedCategoryForDrilldown(isExpanded ? null : item.category.id)}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                        isExpanded ? 'bg-slate-50 dark:bg-slate-800/60' : ''
                      }`}
                    >
                      {/* Left: Category info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.category.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                            <span className="truncate" title={item.category.name}>{item.category.name}</span>
                            {item.status === 'danger' && (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.2 rounded shrink-0">
                                Estourado
                              </span>
                            )}
                            {item.status === 'warning' && (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded shrink-0">
                                Atenção (&gt;80%)
                              </span>
                            )}
                            {item.status === 'ok' && item.budget > 0 && (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded shrink-0">
                                No Limite
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{item.transactions.length} lançamentos</span>
                            <span>·</span>
                            <span>{item.creditCardExpenses.length} compras no cartão</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Progress bar */}
                      <div className="w-full sm:w-64 sm:max-w-xs space-y-1 shrink-0">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400">
                            {item.budget > 0 ? `${item.percentage.toFixed(0)}% da meta` : 'Sem teto definido'}
                          </span>
                          <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                            {formatBRL(item.totalSpent)} / {item.budget > 0 ? formatBRL(item.budget) : 'Livre'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              item.status === 'danger'
                                ? 'bg-rose-500'
                                : item.status === 'warning'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${item.budget > 0 ? Math.min(100, Math.max(3, item.percentage)) : 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Right: Amounts & Toggle */}
                      <div className="flex items-center gap-4 text-xs self-end sm:self-auto tabular-nums">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Saldo Restante</span>
                          <strong
                            className={`font-bold ${
                              item.difference >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {item.budget > 0 ? formatBRL(item.difference) : 'N/A'}
                          </strong>
                        </div>

                        <div className="text-slate-400 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Drilldown Content */}
                    {isExpanded && (
                      <div className="p-4 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                          {/* Lançamentos */}
                          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 space-y-2">
                            <div className="flex justify-between items-center font-bold text-slate-800 dark:text-slate-200">
                              <span>Lançamentos Registrados ({item.transactions.length})</span>
                              <span className="tabular-nums text-slate-900 dark:text-white">
                                Subtotal: {formatBRL(item.txSpent)}
                              </span>
                            </div>

                            {item.transactions.length === 0 ? (
                              <p className="text-slate-400 py-3 text-center text-xs">Nenhum lançamento direto registrado.</p>
                            ) : (
                              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {item.transactions.map((tx) => {
                                  const mem = memberMap.get(tx.memberId);
                                  return (
                                    <div
                                      key={tx.id}
                                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 flex justify-between items-center"
                                    >
                                      <div>
                                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                                          {tx.title}
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                          {formatDateBR(tx.dueDate)} · {mem?.name || 'Família'} · {tx.status === 'paid' ? 'Pago' : 'Pendente'}
                                        </div>
                                      </div>
                                      <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                                        {formatBRL(tx.amount)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Cartão de Crédito */}
                          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 space-y-2">
                            <div className="flex justify-between items-center font-bold text-slate-800 dark:text-slate-200">
                              <span>Compras no Cartão de Crédito ({item.creditCardExpenses.length})</span>
                              <span className="tabular-nums text-indigo-600 dark:text-indigo-400">
                                Subtotal: {formatBRL(item.cardSpent)}
                              </span>
                            </div>

                            {item.creditCardExpenses.length === 0 ? (
                              <p className="text-slate-400 py-3 text-center text-xs">Nenhuma compra no cartão nesta categoria.</p>
                            ) : (
                              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {item.creditCardExpenses.map((c) => {
                                  const mem = memberMap.get(c.memberId);
                                  return (
                                    <div
                                      key={c.id}
                                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 flex justify-between items-center"
                                    >
                                      <div>
                                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                                          {c.description}
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                          {formatDateBR(c.purchaseDate)} · {c.cardName} · {mem?.name || 'Família'}
                                          {c.installmentsTotal && c.installmentsTotal > 1 ? ` (${c.installmentsCurrent || 1}/${c.installmentsTotal})` : ''}
                                        </div>
                                      </div>
                                      <span className="font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                                        {formatBRL(c.amount)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Análise Gráfica de Cartão de Crédito */}
      {activeTab === 'credit_card' && (
        <div className="space-y-6">
          {/* Header Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Análise Gráfica dos Gastos no Cartão de Crédito
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Discriminação dos gastos diversos por cartão, membro e categoria em {formatMonthYear(currentMonthKey)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Total Compras no Cartão</span>
                  <strong className="text-indigo-600 dark:text-indigo-400 text-sm tabular-nums">
                    {formatBRL(creditCardAnalytics.total)}
                  </strong>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:border-slate-700" />
                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Fatura em Lançamentos</span>
                  <strong className="text-slate-900 dark:text-white text-sm tabular-nums">
                    {formatBRL(cardInvoiceAmount)}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 1. Gastos por Cartão */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                <span>Distribuição por Cartão</span>
              </h4>

              {creditCardAnalytics.byCard.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Nenhum gasto registrado nos cartões para este mês.
                </div>
              ) : (
                <div className="space-y-4">
                  {creditCardAnalytics.byCard.map((item) => (
                    <div key={item.card} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {item.card}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-mono text-[11px]">
                            {item.percentage.toFixed(1)}%
                          </span>
                          <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                            {formatBRL(item.amount)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(3, item.percentage))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Gastos por Membro no Cartão */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-violet-600" />
                <span>Consumo no Cartão por Membro</span>
              </h4>

              {creditCardAnalytics.byMember.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Nenhum gasto registrado para os membros no cartão.
                </div>
              ) : (
                <div className="space-y-4">
                  {creditCardAnalytics.byMember.map((mem) => (
                    <div key={mem.memberId} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                            style={{ backgroundColor: mem.color }}
                          >
                            {mem.initials}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {mem.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-mono text-[11px]">
                            {mem.percentage.toFixed(1)}%
                          </span>
                          <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                            {formatBRL(mem.amount)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            backgroundColor: mem.color,
                            width: `${Math.min(100, Math.max(3, mem.percentage))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Gastos no Cartão por Categoria */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                <PieIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Destino dos Gastos do Cartão por Categoria</span>
              </h4>

              {creditCardAnalytics.byCategory.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Nenhum gasto com categoria associada.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {creditCardAnalytics.byCategory.map((cat) => (
                    <div
                      key={cat.catId}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-1.5"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                            {cat.name}
                          </span>
                        </div>
                        <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                          {formatBRL(cat.amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Participação na fatura</span>
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

            {/* 4. Conferência de Fatura */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Auditoria da Fatura</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Soma Compras Cartão:</span>
                  <strong className="text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {formatBRL(creditCardAnalytics.total)}
                  </strong>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Fatura em Lançamentos:</span>
                  <strong className="text-slate-900 dark:text-white tabular-nums">
                    {formatBRL(cardInvoiceAmount)}
                  </strong>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Diferença / Saldo:</span>
                  <strong
                    className={`tabular-nums ${
                      Math.abs(creditCardAnalytics.total - cardInvoiceAmount) < 0.01
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {formatBRL(Math.abs(creditCardAnalytics.total - cardInvoiceAmount))}
                  </strong>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {Math.abs(creditCardAnalytics.total - cardInvoiceAmount) < 0.01 && cardInvoiceAmount > 0 ? (
                    <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                      ✓ A fatura informada nos Lançamentos coincide 100% com a soma detalhada dos gastos do cartão.
                    </span>
                  ) : (
                    <span>
                      Você pode conferir as compras no cartão e atualizar o valor da fatura em Lançamentos a qualquer momento.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Análise de Fontes de Renda */}
      {activeTab === 'income_sources' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Análise de Receitas por Fonte de Renda
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acompanhamento das entradas geradas por cada empresa, cliente ou investimento em {formatMonthYear(currentMonthKey)}
              </p>
            </div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Total de Rendas: {formatBRL(incomeSourcesBreakdown.reduce((s, i) => s + i.total, 0))}
            </div>
          </div>

          <div className="space-y-4">
            {incomeSourcesBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Nenhuma fonte de renda cadastrada.
              </p>
            ) : (
              incomeSourcesBreakdown.map((item) => {
                const percentOfEstimated = item.estimated > 0 ? (item.total / item.estimated) * 100 : 0;
                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ backgroundColor: item.memberColor }}
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.memberName} · {item.categoryName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs tabular-nums self-end sm:self-auto">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Recebido / Total</span>
                          <strong className="text-emerald-600 dark:text-emerald-400">
                            {formatBRL(item.received)}
                          </strong>
                          {item.pending > 0 && (
                            <span className="text-[10px] text-amber-500 block">
                              +{formatBRL(item.pending)} pendente
                            </span>
                          )}
                        </div>

                        <div className="text-right min-w-[70px]">
                          <span className="text-[10px] text-slate-400 block">Participação</span>
                          <strong className="text-slate-900 dark:text-white font-bold">
                            {item.percentageOfTotal.toFixed(1)}%
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar comparing vs estimated */}
                    <div className="space-y-1 pt-1">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, percentOfEstimated))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <span>
                          {percentOfEstimated >= 100
                            ? 'Meta de receita mensal atingida!'
                            : `${percentOfEstimated.toFixed(0)}% da previsão mensal atingida`}
                        </span>
                        <span className="tabular-nums">
                          Previsão cadastrada: {formatBRL(item.estimated)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Fluxo de Caixa Mensal */}
      {activeTab === 'monthly_flow' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Evolução do Fluxo de Caixa Familiar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparativo histórico entre Rendas (Entradas), Saídas (Gastos) e Saldo Líquido
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span className="text-slate-700 dark:text-slate-300">Entradas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-rose-500" />
                <span className="text-slate-700 dark:text-slate-300">Saídas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-500" />
                <span className="text-slate-700 dark:text-slate-300">Saldo</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-64 flex items-end gap-6 sm:gap-10 pt-6 pb-2 border-b border-slate-200 dark:border-slate-800">
            {monthlyFlowData.map((data) => {
              const incomeHeight = (data.income / maxFlowValue) * 100;
              const expenseHeight = (data.expense / maxFlowValue) * 100;
              const balanceHeight = (Math.max(0, data.balance) / maxFlowValue) * 100;
              const isCurrent = data.monthKey === currentMonthKey;

              return (
                <div key={data.monthKey} className="flex-1 flex flex-col items-center h-full justify-end group">
                  {/* Bars container */}
                  <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2 h-full pb-2">
                    {/* Income Bar */}
                    <div
                      className="w-4 sm:w-8 bg-emerald-500 rounded-t-md transition-all duration-300 group-hover:opacity-90 relative"
                      style={{ height: `${Math.max(4, incomeHeight)}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-1.5 rounded whitespace-nowrap pointer-events-none z-10 tabular-nums shadow-sm">
                        +{formatBRL(data.income)}
                      </div>
                    </div>

                    {/* Expense Bar */}
                    <div
                      className="w-4 sm:w-8 bg-rose-500 rounded-t-md transition-all duration-300 group-hover:opacity-90 relative"
                      style={{ height: `${Math.max(4, expenseHeight)}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-1.5 rounded whitespace-nowrap pointer-events-none z-10 tabular-nums shadow-sm">
                        -{formatBRL(data.expense)}
                      </div>
                    </div>

                    {/* Balance Bar */}
                    <div
                      className="w-4 sm:w-8 bg-blue-500 rounded-t-md transition-all duration-300 group-hover:opacity-90 relative"
                      style={{ height: `${Math.max(4, balanceHeight)}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-1.5 rounded whitespace-nowrap pointer-events-none z-10 tabular-nums shadow-sm">
                        Saldo: {formatBRL(data.balance)}
                      </div>
                    </div>
                  </div>

                  {/* Month Label */}
                  <div className={`mt-2 text-xs font-semibold whitespace-nowrap ${isCurrent ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {data.label}
                    {isCurrent && <span className="block text-[10px] text-emerald-500 font-normal">Atual</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Historical Table summary */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-2 px-3">Mês</th>
                  <th className="py-2 px-3 text-right">Entradas</th>
                  <th className="py-2 px-3 text-right">Saídas</th>
                  <th className="py-2 px-3 text-right">Saldo Líquido</th>
                  <th className="py-2 px-3 text-right">Taxa de Poupança</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {monthlyFlowData.map((d) => (
                  <tr key={d.monthKey} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      {d.fullLabel}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +{formatBRL(d.income)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-rose-600 dark:text-rose-400 tabular-nums">
                      -{formatBRL(d.expense)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                      {d.balance >= 0 ? `+${formatBRL(d.balance)}` : formatBRL(d.balance)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {d.savingsRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Membros da Família */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Participação Financeira por Membro da Família
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Contribuição de receitas e gastos gerados por cada integrante da casa em {formatMonthYear(currentMonthKey)}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {memberBreakdown.map((mem) => (
                <div
                  key={mem.id}
                  className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: mem.color }}
                      >
                        {mem.initials}
                      </span>
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {mem.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {mem.role}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Rendas geradas:</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                          +{formatBRL(mem.income)}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Gastos atribuídos:</span>
                        <strong className="text-rose-600 dark:text-rose-400 tabular-nums">
                          -{formatBRL(mem.expense)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-600 dark:text-slate-400">Balanço:</span>
                    <span
                      className={`font-bold tabular-nums ${
                        mem.balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {mem.balance >= 0 ? `+${formatBRL(mem.balance)}` : formatBRL(mem.balance)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Status de Pagamentos e Formas */}
      {activeTab === 'status' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Termômetro de Pagamento */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Controle de Baixa das Contas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Progresso de quitação e confirmação das saídas do mês
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Contas Quitadas ({paymentStatusBreakdown.paidCount} de {paymentStatusBreakdown.totalCount})
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {paymentStatusBreakdown.paidPercent}% concluído
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${paymentStatusBreakdown.paidPercent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[11px] text-emerald-800 dark:text-emerald-300 block font-medium">
                    Total Já Pago
                  </span>
                  <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {formatBRL(paymentStatusBreakdown.paidAmount)}
                  </span>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800">
                  <span className="text-[11px] text-amber-800 dark:text-amber-300 block font-medium">
                    Total a Pagar
                  </span>
                  <span className="text-base font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                    {formatBRL(paymentStatusBreakdown.pendingAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Formas de Pagamento Utilizadas */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Formas de Pagamento Utilizadas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Meios mais utilizados para efetuar pagamentos familiares
            </p>

            <div className="space-y-3">
              {paymentStatusBreakdown.methods.map((m) => {
                const methodLabels: Record<string, string> = {
                  pix: 'PIX Instantâneo',
                  boleto: 'Boleto Bancário',
                  cartao_credito: 'Cartão de Crédito',
                  cartao_debito: 'Cartão de Débito',
                  debito_automatico: 'Débito Automático',
                  transferencia: 'Transferência / TED',
                  dinheiro: 'Dinheiro em Espécie',
                };

                return (
                  <div key={m.method} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {methodLabels[m.method] || m.method}
                      </span>
                      <span className="tabular-nums font-bold text-slate-900 dark:text-white">
                        {formatBRL(m.amount)} ({m.percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-700 dark:bg-slate-300 rounded-full"
                        style={{ width: `${m.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
