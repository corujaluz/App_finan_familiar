import React, { useState } from 'react';
import { Users, Plus, Trash2, Edit2, Shield, Heart } from 'lucide-react';
import { FamilyMember, Transaction } from '../types/finance';
import { formatBRL, formatMonthYear } from '../utils/formatters';

interface FamilyMembersManagerProps {
  members: FamilyMember[];
  transactions: Transaction[];
  currentMonthKey: string;
  onAddMember: (member: Omit<FamilyMember, 'id'>) => void;
  onEditMember: (member: FamilyMember) => void;
  onDeleteMember: (id: string) => void;
}

export const FamilyMembersManager: React.FC<FamilyMembersManagerProps> = ({
  members,
  transactions,
  currentMonthKey,
  onAddMember,
  onEditMember,
  onDeleteMember,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const COLOR_PALETTE = ['#2563EB', '#059669', '#D97706', '#7C3AED', '#E11D48', '#0D9488', '#EA580C', '#4F46E5'];

  const currentMonthTx = transactions.filter((t) => t.dueDate.startsWith(currentMonthKey));

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingMember(null);
    setName('');
    setRole('');
    setColor(COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]);
  };

  const handleStartEdit = (mem: FamilyMember) => {
    setEditingMember(mem);
    setIsAdding(false);
    setName(mem.name);
    setRole(mem.role);
    setColor(mem.color);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingMember(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const initials = name
      .trim()
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('');

    if (editingMember) {
      onEditMember({
        ...editingMember,
        name: name.trim(),
        role: role.trim() || 'Familiar',
        color,
        avatarInitials: initials || 'FM',
      });
      setEditingMember(null);
    } else {
      onAddMember({
        name: name.trim(),
        role: role.trim() || 'Familiar',
        color,
        avatarInitials: initials || 'FM',
      });
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Gestão de Membros da Família
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cadastre os membros da casa para atribuir rendas e responsabilidades de despesas
          </p>
        </div>

        {!isAdding && !editingMember && (
          <button
            onClick={handleStartAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Membro</span>
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {(isAdding || editingMember) && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-6 shadow-xs space-y-4"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {editingMember ? 'Editar Membro da Família' : 'Novo Membro da Família'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Ana Silva, Vovó Maria"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Papel / Ocupação (Opcional)
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: Mãe, Pai, Filho, Aposentada"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Cor de Identificação
              </label>
              <div className="flex items-center gap-2 pt-1">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      color === c ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
            >
              Salvar Membro
            </button>
          </div>
        </form>
      )}

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((mem) => {
          const memIncome = currentMonthTx
            .filter((t) => t.memberId === mem.id && t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

          const memExpense = currentMonthTx
            .filter((t) => t.memberId === mem.id && t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

          const isSharedPool = mem.id === 'mem_all';

          return (
            <div
              key={mem.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-2xs shrink-0"
                      style={{ backgroundColor: mem.color }}
                    >
                      {mem.avatarInitials}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {mem.name}
                        </h3>
                        {mem.id === 'mem_eduardo' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Login Admin
                          </span>
                        )}
                        {mem.id === 'mem_graciela' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Login Usuário
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {mem.role}
                      </p>
                    </div>
                  </div>

                  {!isSharedPool && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(mem)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Editar Membro"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {members.length > 2 && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Deseja remover ${mem.name}?`)) {
                              onDeleteMember(mem.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Remover Membro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Rendas em {formatMonthYear(currentMonthKey).split(' de ')[0]}:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +{formatBRL(memIncome)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Despesas em {formatMonthYear(currentMonthKey).split(' de ')[0]}:</span>
                    <strong className="text-rose-600 dark:text-rose-400 tabular-nums">
                      -{formatBRL(memExpense)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Saldo individual:</span>
                <span
                  className={`font-bold tabular-nums ${
                    memIncome - memExpense >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {memIncome - memExpense >= 0
                    ? `+${formatBRL(memIncome - memExpense)}`
                    : formatBRL(memIncome - memExpense)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
