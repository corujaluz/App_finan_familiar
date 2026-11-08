import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatBRL } from '../utils/formatters';
import { Category, CreditCardExpense, IncomeSource, Transaction } from '../types/finance';

interface SummaryCardsProps {
  transactions: Transaction[];
  creditCardExpenses?: CreditCardExpense[];
  incomeSources?: IncomeSource[];
  currentMonthKey?: string;
  onFilterByStatus?: (status: string) => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  transactions,
  creditCardExpenses = [],
  incomeSources = [],
  currentMonthKey,
  onFilterByStatus,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Incomes (Rendas e Entradas relacionadas aos lançamentos pagos)
  const incomeTx = transactions.filter((t) => t.type === 'income');
  const paidIncomeTx = incomeTx.filter((t) => t.status === 'paid');
  const receivedIncome = paidIncomeTx.reduce((acc, t) => acc + t.amount, 0);
  const totalIncome = incomeTx.reduce((acc, t) => acc + t.amount, 0);
  const pendingIncome = totalIncome - receivedIncome;

  // Valor de entrada das fontes de renda ativas como garantia
  const activeSources = (incomeSources || []).filter((s) => s.isActive);
  const activeSourcesTotal = activeSources.reduce((sum, s) => sum + s.estimatedMonthlyAmount, 0);

  // Valor de entrada a considerar no saldo: prioriza os lançamentos pagos/recebidos
  const displayIncome = receivedIncome > 0 ? receivedIncome : totalIncome > 0 ? totalIncome : activeSourcesTotal;

  // Expenses:
  // Item "cartão de crédito" em lançamentos não computa no total para não duplicar com os gastos individuais do cartão!
  const cardInvoiceTx = transactions.find(
    (t) => t.type === 'expense' && (t.isCreditCardInvoice || t.categoryId === 'cat_cartao')
  );

  const regularExpenseTx = transactions.filter(
    (t) => t.type === 'expense' && !t.isCreditCardInvoice && t.categoryId !== 'cat_cartao'
  );

  // Gastos no Cartão de Crédito deste mês de referência
  const creditCardMonthExpenses = creditCardExpenses.filter((c) =>
    currentMonthKey ? c.referenceMonth === currentMonthKey : true
  );
  const creditCardTotal = creditCardMonthExpenses.reduce((acc, c) => acc + c.amount, 0);

  // Total gasto = despesas regulares + gastos individuais do cartão no mês
  const regularExpenseTotal = regularExpenseTx.reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = regularExpenseTotal + creditCardTotal;

  // Contabilização de pagos e pendentes
  const regularPaidExpense = regularExpenseTx
    .filter((t) => t.status === 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  // Se a fatura do cartão em lançamentos foi marcada como paga, consideramos os gastos do cartão quitados
  const isCardInvoicePaid = cardInvoiceTx ? cardInvoiceTx.status === 'paid' : false;
  const cardPaidAmount = isCardInvoicePaid ? creditCardTotal : 0;

  const paidExpense = regularPaidExpense + cardPaidAmount;
  const pendingExpense = totalExpense - paidExpense;

  // Overdue and Today counts
  const overdueExpenses = regularExpenseTx.filter(
    (t) => t.status !== 'paid' && t.dueDate < todayStr
  );
  const overdueTotal = overdueExpenses.reduce((acc, t) => acc + t.amount, 0);

  // Balance & Savings Rate (computando as fontes de renda e lançamentos pagos)
  const balance = displayIncome - totalExpense;
  const realizedBalance = receivedIncome - paidExpense;
  const savingsRate = displayIncome > 0 ? ((displayIncome - totalExpense) / displayIncome) * 100 : 0;

  // Payment confirmation progress percentage
  const totalExpenseBills = regularExpenseTx.length + (creditCardTotal > 0 ? 1 : 0);
  const paidExpenseBills = regularExpenseTx.filter((t) => t.status === 'paid').length + (isCardInvoicePaid ? 1 : 0);
  const paymentProgressPct = totalExpense > 0 ? Math.round((paidExpense / totalExpense) * 100) : 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
      {/* 1. Total Entradas (Rendas) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Rendas (Entradas)
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatBRL(displayIncome)}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex justify-between">
            <span>Recebido (Pagos): <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">{formatBRL(receivedIncome)}</strong></span>
            {pendingIncome > 0 ? (
              <span>A receber: <span className="tabular-nums font-semibold text-amber-600 dark:text-amber-400">{formatBRL(pendingIncome)}</span></span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% recebido</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Total Saídas (Gastos & Pagamentos) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Saídas (Pagamentos)
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {formatBRL(totalExpense)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Contas: <strong className="text-slate-700 dark:text-slate-300 tabular-nums">{formatBRL(regularExpenseTotal)}</strong> · Cartão: <strong className="text-indigo-600 dark:text-indigo-400 tabular-nums">{formatBRL(creditCardTotal)}</strong>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex justify-between">
            <span>Pago: <strong className="text-slate-900 dark:text-white tabular-nums">{formatBRL(paidExpense)}</strong></span>
            <span>A pagar: <strong className="text-amber-600 dark:text-amber-400 tabular-nums">{formatBRL(pendingExpense)}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Saldo Líquido do Mês */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Saldo do Mês
          </span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              balance >= 0
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
            }`}
          >
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div
            className={`text-2xl font-bold tracking-tight tabular-nums ${
              balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {balance >= 0 ? `+${formatBRL(balance)}` : formatBRL(balance)}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex justify-between">
            <span>Saldo Realizado (Pagos):</span>
            <strong
              className={`font-semibold tabular-nums ${
                realizedBalance >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {realizedBalance >= 0 ? `+${formatBRL(realizedBalance)}` : formatBRL(realizedBalance)}
            </strong>
          </div>
        </div>
      </div>

      {/* 4. Confirmação de Pagamentos */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Confirmação de Pagamentos
          </span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              overdueExpenses.length > 0
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {overdueExpenses.length > 0 ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {paymentProgressPct}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {paidExpenseBills} de {totalExpenseBills} quitadas
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                paymentProgressPct === 100
                  ? 'bg-emerald-600'
                  : paymentProgressPct >= 50
                  ? 'bg-blue-600'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, paymentProgressPct))}%` }}
            />
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs flex justify-between items-center">
            {overdueExpenses.length > 0 ? (
              <button
                onClick={() => onFilterByStatus && onFilterByStatus('overdue')}
                className="text-rose-600 dark:text-rose-400 hover:underline font-semibold flex items-center gap-1"
              >
                <span>{overdueExpenses.length} conta(s) em atraso!</span>
              </button>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Nenhuma conta em atraso
              </span>
            )}
            <span className="text-slate-500 dark:text-slate-400 tabular-nums">
              Restam: {formatBRL(pendingExpense)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
