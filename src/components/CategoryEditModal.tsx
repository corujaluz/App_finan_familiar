import React, { useState, useEffect } from 'react';
import { X, Tag, Save, Trash2, Palette, Check, AlertCircle } from 'lucide-react';
import { Category, TransactionType } from '../types/finance';

interface CategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category | null;
  onSaveCategory: (categoryData: Omit<Category, 'id'>, id?: string) => void;
  onDeleteCategory?: (categoryId: string) => void;
  existingCategoriesCount?: number;
}

const PRESET_COLORS = [
  '#0284c7', // Sky Blue
  '#059669', // Emerald
  '#dc2626', // Red
  '#ea580c', // Orange
  '#d97706', // Amber
  '#7c3aed', // Violet
  '#db2777', // Pink
  '#0891b2', // Cyan
  '#4f46e5', // Indigo
  '#65a30d', // Lime
  '#64748b', // Slate
  '#b45309', // Brown
];

const PRESET_ICONS = [
  '🏠', '🛒', '🚗', '💊', '🎓', '⚡', '💻', '🎬',
  '✈️', '🐶', '👔', '🍔', '🎁', '🏦', '📈', '🔧',
  '⚽', '👶', '📚', '🛡️', '📦', '📱', '⛽', '💳',
];

export const CategoryEditModal: React.FC<CategoryEditModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
  onSaveCategory,
  onDeleteCategory,
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(categoryToEdit);
  const isSystemCategory = categoryToEdit?.id === 'cat_cartao';

  const [name, setName] = useState(categoryToEdit?.name || '');
  const [type, setType] = useState<TransactionType | 'both'>(categoryToEdit?.type || 'expense');
  const [color, setColor] = useState(categoryToEdit?.color || '#0284c7');
  const [icon, setIcon] = useState(categoryToEdit?.icon || '🏷️');
  const [monthlyBudget, setMonthlyBudget] = useState(
    categoryToEdit?.monthlyBudget ? categoryToEdit.monthlyBudget.toString() : '0'
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setType(categoryToEdit.type);
      setColor(categoryToEdit.color);
      setIcon(categoryToEdit.icon || '🏷️');
      setMonthlyBudget(categoryToEdit.monthlyBudget ? categoryToEdit.monthlyBudget.toString() : '0');
    } else {
      setName('');
      setType('expense');
      setColor('#0284c7');
      setIcon('🏷️');
      setMonthlyBudget('0');
    }
    setErrorMsg('');
    setShowDeleteConfirm(false);
  }, [categoryToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Por favor, informe o nome da categoria.');
      return;
    }

    const budgetVal = parseFloat(monthlyBudget.replace(',', '.')) || 0;

    onSaveCategory(
      {
        name: name.trim(),
        type,
        color,
        icon: icon.trim() || '🏷️',
        monthlyBudget: Math.max(0, budgetVal),
      },
      categoryToEdit?.id
    );

    onClose();
  };

  const handleDelete = () => {
    if (!categoryToEdit || !onDeleteCategory) return;
    if (isSystemCategory) {
      setErrorMsg('Esta é uma categoria protegida do sistema e não pode ser excluída.');
      return;
    }
    onDeleteCategory(categoryToEdit.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-2xs border border-white/20"
              style={{ backgroundColor: color }}
            >
              <span>{icon}</span>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing ? 'Atualize as informações da categoria' : 'Adicione uma nova categoria de receitas ou despesas'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome da Categoria *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Assinaturas & Streaming, Pet Shop, Viagens..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
            />
          </div>

          {/* Tipo de Categoria */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tipo de Movimentação *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                  type === 'expense'
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Despesa
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                  type === 'income'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Receita
              </button>
              <button
                type="button"
                onClick={() => setType('both')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                  type === 'both'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Ambos
              </button>
            </div>
          </div>

          {/* Orçamento Mensal Planejado */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Teto / Orçamento Mensal Planejado (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                placeholder="0,00"
                className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono tabular-nums"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Utilizado na aba "Orçamentos" e nos gráficos de acompanhamento de metas.
            </p>
          </div>

          {/* Ícone / Emoji */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ícone / Emoji
              </label>
              <span className="text-[11px] text-slate-400 font-mono">Atual: {icon}</span>
            </div>
            <div className="grid grid-cols-8 gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              {PRESET_ICONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setIcon(em)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-transform hover:scale-110 ${
                    icon === em
                      ? 'bg-white dark:bg-slate-700 shadow-sm border border-emerald-500 ring-2 ring-emerald-400/30'
                      : 'hover:bg-white/80 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Cor de Identificação */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-slate-500" />
                <span>Cor de Destaque</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[11px] font-mono text-slate-500">{color}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-lg transition-transform hover:scale-110 flex items-center justify-center ${
                    color === c ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-105' : ''
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white drop-shadow-xs" />}
                </button>
              ))}
            </div>
          </div>

          {/* Delete confirmation if editing */}
          {isEditing && onDeleteCategory && !isSystemCategory && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              {showDeleteConfirm ? (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl space-y-2">
                  <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                    Deseja realmente excluir esta categoria?
                  </p>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400">
                    Lançamentos existentes associados manterão seu histórico.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors"
                    >
                      Confirmar Exclusão
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1.5 font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Categoria</span>
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Salvar Alterações' : 'Criar Categoria'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
