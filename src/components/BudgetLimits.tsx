import React, { useState } from 'react';
import { Target, AlertTriangle, CheckCircle, Edit3, Save, Check } from 'lucide-react';
import { Category, CreditCardExpense, Transaction } from '../types/finance';
import { formatBRL, formatMonthYear } from '../utils/formatters';

interface BudgetLimitsProps {
  categories: Category[];
  transactions: Transaction[];
  creditCardExpenses?: CreditCardExpense[];
  currentMonthKey: string;
  onUpdateCategoryBudget: (categoryId: string, newBudget: number) => void;
}

export const BudgetLimits: React.FC<BudgetLimitsProps> = ({
  categories,
  transactions,
  creditCardExpenses = [],
  currentMonthKey,
  onUpdateCategoryBudget,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempBudget, setTempBudget] = useState<string>('');

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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Metas e Tetos de Gastos por Categoria
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Defina limites mensais para controlar despesas e evitar surpresas no fim de {formatMonthYear(currentMonthKey)}.
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Orçamento Total Planejado:</span>
              <strong className="text-base text-slate-900 dark:text-white tabular-nums">
                {formatBRL(totalBudget)}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Total Gasto Até Agora:</span>
              <strong
                className={`text-base tabular-nums ${
                  totalSpent > totalBudget ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                }`}
              >
                {formatBRL(totalSpent)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {expenseCategories.map((cat) => {
          const spent = spentPerCat.get(cat.id) || 0;
          const budget = cat.monthlyBudget || 0;
          const percentage = budget > 0 ? (spent / budget) * 100 : 0;
          const isOverBudget = spent > budget && budget > 0;
          const isWarning = percentage >= 80 && !isOverBudget;
          const isEditing = editingId === cat.id;

          return (
            <div
              key={cat.id}
              className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-2xs flex flex-col justify-between transition-colors ${
                isOverBudget
                  ? 'border-rose-300 dark:border-rose-800'
                  : isWarning
                  ? 'border-amber-300 dark:border-amber-800'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {cat.name}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleStartEdit(cat)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Editar Teto de Gastos"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1 mb-3">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Gasto Atual:</span>
                    <strong className="text-sm text-slate-900 dark:text-white tabular-nums font-bold">
                      {formatBRL(spent)}
                    </strong>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-1.5 pt-2">
                      <span className="text-xs text-slate-400">Teto: R$</span>
                      <input
                        type="number"
                        step="50"
                        value={tempBudget}
                        onChange={(e) => setTempBudget(e.target.value)}
                        className="w-24 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                      />
                      <button
                        onClick={() => handleSave(cat.id)}
                        className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
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
                {budget > 0 && (
                  <div className="space-y-1 mt-2">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOverBudget
                            ? 'bg-rose-600'
                            : isWarning
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{percentage.toFixed(0)}% utilizado</span>
                      <span className="tabular-nums">
                        {isOverBudget
                          ? `Excedeu em ${formatBRL(spent - budget)}`
                          : `Restam ${formatBRL(budget - spent)}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status callout */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-[11px]">
                {isOverBudget ? (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Limite mensal ultrapassado!
                  </span>
                ) : isWarning ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Atenção: atingiu 80% do teto
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Dentro do planejado
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
