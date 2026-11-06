import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit2,
  Trash2,
  Copy,
  FileCheck,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Bell,
  CreditCard,
} from 'lucide-react';
import { Category, FamilyMember, IncomeSource, PaymentStatus, Transaction, TransactionType } from '../types/finance';
import { formatBRL, formatDateBR, getPaymentMethodLabel, getPaymentStatusInfo } from '../utils/formatters';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  members: FamilyMember[];
  incomeSources?: IncomeSource[];
  onOpenConfirmPayment: (tx: Transaction) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onDuplicateTransaction: (tx: Transaction) => void;
  onOpenNewTransaction: () => void;
  initialStatusFilter?: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  members,
  incomeSources,
  onOpenConfirmPayment,
  onEditTransaction,
  onDeleteTransaction,
  onDuplicateTransaction,
  onOpenNewTransaction,
  initialStatusFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const cat = categoryMap.get(tx.categoryId);
        const mem = memberMap.get(tx.memberId);
        const matchesTitle = tx.title.toLowerCase().includes(term);
        const matchesSource = tx.sourceName?.toLowerCase().includes(term) || false;
        const matchesCat = cat?.name.toLowerCase().includes(term) || false;
        const matchesMem = mem?.name.toLowerCase().includes(term) || false;
        const matchesNote = tx.notes?.toLowerCase().includes(term) || false;
        const matchesReceipt = tx.receiptNote?.toLowerCase().includes(term) || false;
        if (!matchesTitle && !matchesSource && !matchesCat && !matchesMem && !matchesNote && !matchesReceipt) {
          return false;
        }
      }

      // Type
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }

      // Member
      if (memberFilter !== 'all' && tx.memberId !== memberFilter) {
        return false;
      }

      // Category
      if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) {
        return false;
      }

      // Status
      if (statusFilter === 'paid' && tx.status !== 'paid') return false;
      if (statusFilter === 'pending' && (tx.status === 'paid' || tx.dueDate < todayStr)) return false;
      if (statusFilter === 'overdue' && (tx.status === 'paid' || tx.dueDate >= todayStr)) return false;
      if (statusFilter === 'due_today' && (tx.status === 'paid' || tx.dueDate !== todayStr)) return false;

      return true;
    });
  }, [transactions, searchTerm, typeFilter, statusFilter, memberFilter, categoryFilter, categoryMap, memberMap, todayStr]);

  // Sort: Overdue first, then by date ascending (soonest first)
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      // Overdue non-paid expenses come first
      const aIsOverdue = a.status !== 'paid' && a.dueDate < todayStr;
      const bIsOverdue = b.status !== 'paid' && b.dueDate < todayStr;
      if (aIsOverdue && !bIsOverdue) return -1;
      if (!aIsOverdue && bIsOverdue) return 1;

      // Unpaid before paid
      if (a.status !== 'paid' && b.status === 'paid') return -1;
      if (a.status === 'paid' && b.status !== 'paid') return 1;

      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [filteredTransactions, todayStr]);

  // Compute filtered totals (o item de cartão de crédito em lançamentos não computa no total)
  const totalFilteredAmount = sortedTransactions.reduce(
    (acc, tx) => {
      if (tx.isCreditCardInvoice || tx.categoryId === 'cat_cartao') {
        return acc;
      }
      return tx.type === 'income' ? acc + tx.amount : acc - tx.amount;
    },
    0
  );

  return (
    <div className="space-y-4">
      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descrição, comprovante, categoria ou membro..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
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

          {/* Type Segmented Control (Allowed Interactive Buttons) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Todos ({transactions.length})
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                typeFilter === 'income'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Rendas (Entradas)</span>
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                typeFilter === 'expense'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Saídas (Gastos)</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mr-2 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Status: Todos</option>
            <option value="paid">Pagas / Confirmadas</option>
            <option value="pending">Pendentes a vencer</option>
            <option value="overdue">Atrasadas</option>
          </select>

          {/* Member Filter */}
          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Membro da Família: Todos</option>
            {members.map((mem) => (
              <option key={mem.id} value={mem.id}>
                {mem.name}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Categoria: Todas</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.type === 'income' ? 'Entrada' : 'Saída'})
              </option>
            ))}
          </select>

          {(statusFilter !== 'all' || memberFilter !== 'all' || categoryFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setMemberFilter('all');
                setCategoryFilter('all');
                setSearchTerm('');
              }}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline ml-auto font-medium"
            >
              Resetar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Table & Transaction Rows */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden transition-colors">
        {sortedTransactions.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Clock className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Nenhum lançamento encontrado
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {transactions.length === 0
                ? 'Você ainda não possui lançamentos cadastrados para este mês.'
                : 'Nenhum lançamento corresponde aos filtros selecionados acima.'}
            </p>
            <button
              onClick={onOpenNewTransaction}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
            >
              Cadastrar Lançamento
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Confirmação / Status</th>
                  <th className="py-3 px-4">Lançamento / Categoria</th>
                  <th className="py-3 px-4">Membro</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4">Forma</th>
                  <th className="py-3 px-4 text-right">Valor (R$)</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedTransactions.map((tx) => {
                  const cat = categoryMap.get(tx.categoryId);
                  const mem = memberMap.get(tx.memberId);
                  const statusInfo = getPaymentStatusInfo(tx.status, tx.dueDate, tx.paymentDate);

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        statusInfo.isOverdue ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Column 1: Confirmation / Status button */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {tx.status === 'paid' ? (
                          <button
                            onClick={() => onOpenConfirmPayment(tx)}
                            title="Ver detalhes do pagamento ou comprovante"
                            className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 hover:opacity-80 transition-opacity font-medium"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Pago</span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                              · {formatDateBR(tx.paymentDate || tx.dueDate)}
                            </span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onOpenConfirmPayment(tx)}
                              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${
                                statusInfo.isOverdue
                                  ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400'
                                  : 'bg-white border-slate-300 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-emerald-950/40'
                              }`}
                              title="Clique para confirmar pagamento desta conta"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Confirmar Baixa</span>
                            </button>
                            {statusInfo.isOverdue && (
                              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3" />
                                Atrasada
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Column 2: Title and Category (Zero-Pill: Clean unboxed metadata) */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white truncate">
                            {tx.title}
                          </span>
                          {(tx.isCreditCardInvoice || tx.categoryId === 'cat_cartao') && (
                            <span
                              title="Item de Cartão de Crédito a preencher nos lançamentos. Não computa no total geral para evitar duplicidade com os gastos detalhados da aba Cartão de Crédito."
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 shrink-0"
                            >
                              <CreditCard className="w-2.5 h-2.5" />
                              <span>Fatura Informativa</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span
                            className="inline-block w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: cat?.color || '#94a3b8' }}
                          />
                          <span>{cat?.name || 'Geral'}</span>
                          {tx.type === 'income' && tx.sourceName && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                Fonte: {tx.sourceName}
                              </span>
                            </>
                          )}
                          {tx.isRecurring && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-slate-400">Recorrente Mensal</span>
                            </>
                          )}
                          {tx.receiptNote && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px] truncate max-w-[140px]" title={tx.receiptNote}>
                                Comprovante: {tx.receiptNote}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Member */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                            style={{ backgroundColor: mem?.color || '#64748B' }}
                          >
                            {mem?.avatarInitials || 'FM'}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[120px]">
                            {mem?.name || 'Família'}
                          </span>
                        </div>
                      </td>

                      {/* Column 4: Due Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 tabular-nums">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDateBR(tx.dueDate)}</span>
                          {tx.type === 'expense' && tx.enableAlarm !== false && tx.status !== 'paid' && (
                            <span title={`Alarme sonoro ativo (${tx.alarmDaysNotice ?? 3} dias antes)`}>
                              <Bell className="w-3 h-3 text-amber-500" />
                            </span>
                          )}
                        </div>
                        {tx.status !== 'paid' && (
                          <div className={`text-[10px] ${statusInfo.isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                            {statusInfo.sublabel}
                          </div>
                        )}
                      </td>

                      {/* Column 5: Payment Method */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        <span>{getPaymentMethodLabel(tx.paymentMethod)}</span>
                      </td>

                      {/* Column 6: Amount with tabular-nums */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div
                          className={`font-bold tabular-nums text-sm ${
                            tx.type === 'income'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {tx.type === 'income' ? `+ ${formatBRL(tx.amount)}` : `- ${formatBRL(tx.amount)}`}
                        </div>
                        {(tx.isCreditCardInvoice || tx.categoryId === 'cat_cartao') && (
                          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                            Não computa no total
                          </div>
                        )}
                      </td>

                      {/* Column 7: Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            title="Editar lançamento"
                            aria-label="Editar lançamento"
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDuplicateTransaction(tx)}
                            title="Duplicar para outro mês ou data"
                            aria-label="Duplicar lançamento"
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Deseja excluir "${tx.title}"?`)) {
                                onDeleteTransaction(tx.id);
                              }
                            }}
                            title="Excluir lançamento"
                            aria-label="Excluir lançamento"
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer with summary of listed items */}
        {sortedTransactions.length > 0 && (
          <div className="py-3 px-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Exibindo <strong>{sortedTransactions.length}</strong> de {transactions.length} lançamentos
            </span>
            <div className="flex items-center gap-4">
              <span>
                Subtotal dos lançamentos filtrados:{' '}
                <strong
                  className={`tabular-nums ${
                    totalFilteredAmount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {totalFilteredAmount >= 0 ? `+${formatBRL(totalFilteredAmount)}` : formatBRL(totalFilteredAmount)}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
