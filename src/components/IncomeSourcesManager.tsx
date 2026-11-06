import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  TrendingUp,
  DollarSign,
  Calendar,
  User,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Category, FamilyMember, IncomeSource, Transaction } from '../types/finance';
import { formatBRL, formatMonthYear } from '../utils/formatters';

interface IncomeSourcesManagerProps {
  incomeSources: IncomeSource[];
  categories: Category[];
  members: FamilyMember[];
  transactions: Transaction[];
  currentMonthKey: string;
  onAddIncomeSource: (source: Omit<IncomeSource, 'id'>) => void;
  onEditIncomeSource: (source: IncomeSource) => void;
  onDeleteIncomeSource: (id: string) => void;
  onQuickIncomeForSource: (source: IncomeSource) => void;
}

export const IncomeSourcesManager: React.FC<IncomeSourcesManagerProps> = ({
  incomeSources,
  categories,
  members,
  transactions,
  currentMonthKey,
  onAddIncomeSource,
  onEditIncomeSource,
  onDeleteIncomeSource,
  onQuickIncomeForSource,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [memberId, setMemberId] = useState(members[0]?.id || '');
  const incomeCategories = categories.filter((c) => c.type === 'income' || c.type === 'both');
  const [categoryId, setCategoryId] = useState(incomeCategories[0]?.id || '');
  const [estimatedMonthlyAmount, setEstimatedMonthlyAmount] = useState('');
  const [expectedDayOfMonth, setExpectedDayOfMonth] = useState('5');
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const memberMap = new Map(members.map((m) => [m.id, m]));

  // Month transactions for comparison
  const monthIncomeTx = transactions.filter(
    (t) => t.type === 'income' && t.dueDate.startsWith(currentMonthKey)
  );

  const totalEstimated = incomeSources
    .filter((s) => s.isActive)
    .reduce((sum, s) => sum + s.estimatedMonthlyAmount, 0);

  const totalActual = monthIncomeTx.reduce((sum, t) => sum + t.amount, 0);

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingSource(null);
    setName('');
    setMemberId(members[0]?.id || '');
    setCategoryId(incomeCategories[0]?.id || '');
    setEstimatedMonthlyAmount('');
    setExpectedDayOfMonth('5');
    setIsActive(true);
    setNotes('');
  };

  const handleStartEdit = (source: IncomeSource) => {
    setEditingSource(source);
    setIsAdding(false);
    setName(source.name);
    setMemberId(source.memberId);
    setCategoryId(source.categoryId);
    setEstimatedMonthlyAmount(source.estimatedMonthlyAmount.toString());
    setExpectedDayOfMonth(source.expectedDayOfMonth?.toString() || '5');
    setIsActive(source.isActive);
    setNotes(source.notes || '');
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingSource(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedAmount = parseFloat(estimatedMonthlyAmount.replace(',', '.')) || 0;
    const parsedDay = parseInt(expectedDayOfMonth, 10) || 5;

    if (editingSource) {
      onEditIncomeSource({
        ...editingSource,
        name: name.trim(),
        memberId,
        categoryId,
        estimatedMonthlyAmount: parsedAmount,
        expectedDayOfMonth: Math.min(31, Math.max(1, parsedDay)),
        isActive,
        notes: notes.trim() || undefined,
      });
      setEditingSource(null);
    } else {
      onAddIncomeSource({
        name: name.trim(),
        memberId,
        categoryId,
        estimatedMonthlyAmount: parsedAmount,
        expectedDayOfMonth: Math.min(31, Math.max(1, parsedDay)),
        isActive,
        notes: notes.trim() || undefined,
      });
      setIsAdding(false);
    }
  };

  const handleToggleActive = (source: IncomeSource) => {
    onEditIncomeSource({
      ...source,
      isActive: !source.isActive,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Summary Stats */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Fontes de Renda da Família
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Cadastre, edite e monitore os empregos, empresas, investimentos, aluguéis e atividades geradoras de receita.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Previsão Mensal Total:</span>
              <strong className="text-base text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatBRL(totalEstimated)}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Efetivado em {formatMonthYear(currentMonthKey).split(' de ')[0]}:</span>
              <strong className="text-base text-slate-900 dark:text-white tabular-nums">
                {formatBRL(totalActual)}
              </strong>
            </div>
            {!isAdding && !editingSource && (
              <button
                onClick={handleStartAdd}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all whitespace-nowrap self-start md:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Adicionar Fonte de Renda</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editable Form for New or Edit Source */}
      {(isAdding || editingSource) && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 rounded-xl p-6 shadow-xs space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>{editingSource ? 'Editar Fonte de Renda' : 'Cadastrar Nova Fonte de Renda'}</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Todos os campos são editáveis
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Nome da Fonte */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nome da Fonte de Renda / Empresa / Pagador *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Empresa Tech Ltda, Consultoria de Interiores, Aluguel Apto 402"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
            </div>

            {/* Membro Responsável */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Membro da Família *
              </label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              >
                {members.map((mem) => (
                  <option key={mem.id} value={mem.id}>
                    {mem.name} ({mem.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Categoria de Renda */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Categoria de Renda *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              >
                {incomeCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Valor Estimado Mensal */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Valor Previsto / Estimado Mensal (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={estimatedMonthlyAmount}
                  onChange={(e) => setEstimatedMonthlyAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono tabular-nums"
                />
              </div>
            </div>

            {/* Dia Previsto no Mês */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Dia Previsto de Recebimento
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={expectedDayOfMonth}
                  onChange={(e) => setExpectedDayOfMonth(e.target.value)}
                  placeholder="5"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white tabular-nums"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400">do mês</span>
              </div>
            </div>

            {/* Status Ativo */}
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Fonte Ativa (incluir nas estimativas)</span>
              </label>
            </div>

            {/* Observações */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Anotações, CNPJ ou Regras de Pagamento (Opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: CLT com 13º, pagamento via PIX no 5º dia útil..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-all"
            >
              {editingSource ? 'Salvar Alterações' : 'Salvar Nova Fonte de Renda'}
            </button>
          </div>
        </form>
      )}

      {/* Grid of Income Source Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {incomeSources.map((source) => {
          const cat = categoryMap.get(source.categoryId);
          const mem = memberMap.get(source.memberId);

          // Find current month transactions matching this source (by sourceId or name)
          const matchingTx = monthIncomeTx.filter(
            (t) => t.sourceId === source.id || t.title.toLowerCase().includes(source.name.toLowerCase())
          );
          const actualReceived = matchingTx
            .filter((t) => t.status === 'paid')
            .reduce((sum, t) => sum + t.amount, 0);
          const actualPending = matchingTx
            .filter((t) => t.status !== 'paid')
            .reduce((sum, t) => sum + t.amount, 0);
          const actualTotal = actualReceived + actualPending;

          const percentOfTarget = source.estimatedMonthlyAmount > 0
            ? Math.round((actualTotal / source.estimatedMonthlyAmount) * 100)
            : 0;

          return (
            <div
              key={source.id}
              className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-2xs flex flex-col justify-between transition-colors ${
                source.isActive
                  ? 'border-slate-200 dark:border-slate-800'
                  : 'border-slate-200/60 dark:border-slate-800/60 opacity-60'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: mem?.color || '#059669' }}
                    >
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {source.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{mem?.name || 'Família'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{cat?.name || 'Renda'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleActive(source)}
                      title={source.isActive ? 'Desativar fonte' : 'Ativar fonte'}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                    >
                      {source.isActive ? (
                        <ToggleRight className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleStartEdit(source)}
                      title="Editar fonte de renda"
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {incomeSources.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Deseja excluir a fonte de renda "${source.name}"?`)) {
                            onDeleteIncomeSource(source.id);
                          }
                        }}
                        title="Excluir fonte de renda"
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Values row */}
                <div className="space-y-2 my-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500 dark:text-slate-400">Previsão Mensal:</span>
                    <strong className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatBRL(source.estimatedMonthlyAmount)}
                    </strong>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500 dark:text-slate-400">Recebido neste mês:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums font-semibold">
                      {formatBRL(actualReceived)}
                      {actualPending > 0 && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal ml-1">
                          (+{formatBRL(actualPending)} pendente)
                        </span>
                      )}
                    </strong>
                  </div>

                  {source.expectedDayOfMonth && (
                    <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Dia esperado:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Dia {source.expectedDayOfMonth} de cada mês
                      </span>
                    </div>
                  )}

                  {source.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-50 dark:border-slate-800/60 truncate" title={source.notes}>
                      Obs: {source.notes}
                    </p>
                  )}
                </div>

                {/* Progress bar */}
                {source.estimatedMonthlyAmount > 0 && (
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          percentOfTarget >= 100
                            ? 'bg-emerald-600'
                            : percentOfTarget >= 50
                            ? 'bg-blue-600'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, percentOfTarget)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span>{percentOfTarget}% da meta atingida</span>
                      <span>{actualReceived > 0 ? 'Recebido' : 'Aguardando'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Quick Action */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {matchingTx.length} lançamento(s) no mês
                </span>
                <button
                  onClick={() => onQuickIncomeForSource(source)}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-md transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Lançar Renda</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
