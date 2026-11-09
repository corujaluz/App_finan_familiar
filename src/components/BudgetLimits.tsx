import React, { useState } from 'react';
import { Target, AlertTriangle, CheckCircle, Edit3, Save, Check, Plus, Settings, Sliders, Tag } from 'lucide-react';
import { Category, CreditCardExpense, Transaction } from '../types/finance';
import { formatBRL, formatMonthYear } from '../utils/formatters';

interface BudgetLimitsProps {
  categories: Category[];
  transactions: Transaction[];
  creditCardExpenses?: CreditCardExpense[];
  currentMonthKey: string;
  onUpdateCategoryBudget: (categoryId: string, newBudget: number) => void;
  onOpenNewCategory?: () => void;
  onOpenEditCategory?: (category: Category) => void;
}

export const BudgetLimits: React.FC<BudgetLimitsProps> = ({
  categories,
  transactions,
  creditCardExpenses = [],
  currentMonthKey,
  onUpdateCategoryBudget,
  onOpenNewCategory,
  onOpenEditCategory,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempBudget, setTempBudget] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('expense');

  // Filter categories according to user choice
  const displayedCategories = categories.filter((c) => {
    if (filterType === 'all') return true;
    if (filterType === 'expense') return c.type === 'expense' || c.type === 'both';
    if (filterType === 'income') return c.type === 'income' || c.type === 'both';
    return true;
  });

  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both');

  // Compute spent amount per category for current month (regular non-invoice + credit card)
  const regularExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.dueDate.startsWith(currentMonthKey) && !t.isCreditCardInvoice && t.categoryId !== 'cat_cartao'
  );

  const spentPerCat = new Map<string, number>();
  regularExpenses.forEach((t) => {
    spentPerCat.set(t.categoryId, (spentPerCat.get(t.categoryId) || 0) + t.amount);
  });

  const monthCC = creditCardExpenses.filter((c) => c.referenceMonth === currentMonthKey);
  monthCC.forEach((c) => {
    spentPerCat.set(c.categoryId, (spentPerCat.get(c.categoryId) || 0) + c.amount);
  });

  const totalBudget = expenseCategories.reduce((sum, c) => sum + (c.monthlyBudget || 0), 0);
  const totalSpent = Array.from(spentPerCat.values()).reduce((sum, v) => sum + v, 0);

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setTempBudget(cat.monthlyBudget?.toString() || '0');
  };

  const handleSave = (catId: string) => {
    const parsed = parseFloat(tempBudget.replace(',', '.')) || 0;
    onUpdateCategoryBudget(catId, Math.max(0, parsed));
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Metas, Tetos e Gestão de Categorias
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Defina limites mensais para controlar despesas, adicione novas categorias e edite as existentes ({formatMonthYear(currentMonthKey)}).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Orçamento Total Planejado:</span>
              <strong className="text-base text-slate-900 dark:text-white tabular-nums">
                {formatBRL(totalBudget)}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Total Gasto Até Agora:</span>
              <strong
                className={`text-base tabular-nums ${
                  totalSpent > totalBudget ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                }`}
              >
                {formatBRL(totalSpent)}
              </strong>
            </div>

            {/* Nova Categoria Button */}
            {onOpenNewCategory && (
              <button
                type="button"
                onClick={onOpenNewCategory}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-all shrink-0 ml-auto sm:ml-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Nova Categoria</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs for Categories */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400 font-medium mr-1 text-[11px]">Exibir:</span>
          <button
            type="button"
            onClick={() => setFilterType('expense')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterType === 'expense'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Despesas ({categories.filter((c) => c.type === 'expense' || c.type === 'both').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('income')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterType === 'income'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Receitas ({categories.filter((c) => c.type === 'income' || c.type === 'both').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterType === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Todas ({categories.length})
          </button>
        </div>
      </div>

      {/* Grid of Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedCategories.map((cat) => {
          const spent = spentPerCat.get(cat.id) || 0;
          const budget = cat.monthlyBudget || 0;
          const percentage = budget > 0 ? (spent / budget) * 100 : 0;
          const isOverBudget = spent > budget && budget > 0;
          const isWarning = percentage >= 80 && !isOverBudget;
          const isEditing = editingId === cat.id;

          return (
            <div
              key={cat.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-2xs flex flex-col justify-between transition-colors ${
                isOverBudget
                  ? 'border-rose-300 dark:border-rose-800/80 bg-rose-50/20 dark:bg-rose-950/10'
                  : isWarning
                  ? 'border-amber-300 dark:border-amber-800/80'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                {/* Header with Icon, Color, Name, Type & Edit buttons */}
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shadow-2xs shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <span>{cat.icon || '🏷️'}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={cat.name}>
                        {cat.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {cat.type === 'expense' ? 'Despesa' : cat.type === 'income' ? 'Receita' : 'Ambos'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Full category edit modal trigger */}
                    {onOpenEditCategory && (
                      <button
                        type="button"
                        onClick={() => onOpenEditCategory(cat)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Editar detalhes da categoria (nome, ícone, cor, meta)"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Quick budget amount edit */}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Editar teto de gastos rapidamente"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 mb-3">
                  {cat.type !== 'income' && (
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Gasto Atual:</span>
                      <strong className="text-sm text-slate-900 dark:text-white tabular-nums font-bold">
                        {formatBRL(spent)}
                      </strong>
                    </div>
                  )}

                  {isEditing ? (
                    <div className="flex items-center gap-1.5 pt-2">
                      <span className="text-xs text-slate-400">Teto: R$</span>
                      <input
                        type="number"
                        step="50"
                        autoFocus
                        value={tempBudget}
                        onChange={(e) => setTempBudget(e.target.value)}
                        className="w-24 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() => handleSave(cat.id)}
                        className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        title="Salvar Teto"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Teto Planejado:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-semibold tabular-nums">
                        {budget > 0 ? formatBRL(budget) : 'Não definido'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {budget > 0 && cat.type !== 'income' && (
                  <div className="space-y-1.5 mt-2">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOverBudget
                            ? 'bg-rose-600'
                            : isWarning
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span
                        className={`font-semibold ${
                          isOverBudget
                            ? 'text-rose-600 dark:text-rose-400 font-bold'
                            : isWarning
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {percentage.toFixed(0)}% utilizado
                      </span>
                      <span className="text-slate-400 tabular-nums">
                        {spent <= budget
                          ? `Resta ${formatBRL(budget - spent)}`
                          : `Excedeu ${formatBRL(spent - budget)}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Message Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                {cat.type === 'income' ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    Categoria de Entrada / Receita
                  </span>
                ) : isOverBudget ? (
                  <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Teto Ultrapassado!
                  </span>
                ) : isWarning ? (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Atenção: Perto do Limite
                  </span>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    Dentro do Limite
                  </span>
                )}

                {onOpenEditCategory && (
                  <button
                    type="button"
                    onClick={() => onOpenEditCategory(cat)}
                    className="text-[10px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
