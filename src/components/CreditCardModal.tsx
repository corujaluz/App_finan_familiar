import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Calendar,
  Tag,
  User,
  Layers,
  FileText,
  Sparkles,
  SlidersHorizontal,
  Plus,
  Edit2,
  Trash2,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Category, CreditCardExpense, CreditCardPresetItem, FamilyMember } from '../types/finance';
import { DEFAULT_CREDIT_CARD_PRESETS } from '../data/initialData';

interface CreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: Omit<CreditCardExpense, 'id' | 'createdAt'>,
    editId?: string,
    autoGenerateInstallments?: boolean
  ) => void;
  expenseToEdit?: CreditCardExpense | null;
  categories: Category[];
  members: FamilyMember[];
  defaultMonthKey: string;
  knownCardNames?: string[];
  presetItems?: CreditCardPresetItem[];
  onUpdatePresetItems?: (presets: CreditCardPresetItem[]) => void;
}

const DEFAULT_CARD_OPTIONS = [
  'Nubank Ultravioleta',
  'XP Visa Infinite',
  'Itaú Mastercard Black',
  'C6 Carbon Mastercard',
  'Bradesco Elo Nanquim',
  'Inter Mastercard Black',
];

export const CreditCardModal: React.FC<CreditCardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expenseToEdit,
  categories,
  members,
  defaultMonthKey,
  knownCardNames = [],
  presetItems,
  onUpdatePresetItems,
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const [description, setDescription] = useState(expenseToEdit?.description || '');
  const [amount, setAmount] = useState(expenseToEdit?.amount?.toString() || '');
  const [purchaseDate, setPurchaseDate] = useState(expenseToEdit?.purchaseDate || todayStr);
  const [referenceMonth, setReferenceMonth] = useState(expenseToEdit?.referenceMonth || defaultMonthKey);
  const [cardName, setCardName] = useState(expenseToEdit?.cardName || 'Nubank Ultravioleta');
  const [customCardName, setCustomCardName] = useState('');
  const [isCustomCard, setIsCustomCard] = useState(false);
  const [memberId, setMemberId] = useState(expenseToEdit?.memberId || members[0]?.id || '');
  const [categoryId, setCategoryId] = useState(
    expenseToEdit?.categoryId || categories.find((c) => c.type === 'expense')?.id || ''
  );
  const [isInstallment, setIsInstallment] = useState(
    Boolean(expenseToEdit?.installmentsTotal && expenseToEdit.installmentsTotal > 1)
  );
  const [installmentsCurrent, setInstallmentsCurrent] = useState(
    (expenseToEdit?.installmentsCurrent || 1).toString()
  );
  const [installmentsTotal, setInstallmentsTotal] = useState(
    (expenseToEdit?.installmentsTotal || 3).toString()
  );
  const [autoGenerateInstallments, setAutoGenerateInstallments] = useState(false);
  const [notes, setNotes] = useState(expenseToEdit?.notes || '');

  // Presets State (itens a serem preenchidos)
  const [localPresets, setLocalPresets] = useState<CreditCardPresetItem[]>(
    presetItems && presetItems.length > 0 ? presetItems : DEFAULT_CREDIT_CARD_PRESETS
  );
  const [isEditingPresets, setIsEditingPresets] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [presetItemName, setPresetItemName] = useState('');
  const [presetItemCategoryId, setPresetItemCategoryId] = useState('');
  const [presetItemMemberId, setPresetItemMemberId] = useState('');
  const [presetFeedbackMsg, setPresetFeedbackMsg] = useState('');

  // Keep localPresets in sync if presetItems prop updates
  useEffect(() => {
    if (presetItems && presetItems.length > 0) {
      setLocalPresets(presetItems);
    }
  }, [presetItems]);

  // Merge default and known card options
  const allCardOptions = Array.from(new Set([...DEFAULT_CARD_OPTIONS, ...knownCardNames]));

  useEffect(() => {
    if (expenseToEdit) {
      setDescription(expenseToEdit.description);
      setAmount(expenseToEdit.amount.toString());
      setPurchaseDate(expenseToEdit.purchaseDate);
      setReferenceMonth(expenseToEdit.referenceMonth);
      if (allCardOptions.includes(expenseToEdit.cardName)) {
        setCardName(expenseToEdit.cardName);
        setIsCustomCard(false);
        setCustomCardName('');
      } else {
        setIsCustomCard(true);
        setCustomCardName(expenseToEdit.cardName);
      }
      setMemberId(expenseToEdit.memberId);
      setCategoryId(expenseToEdit.categoryId);
      const hasInstallments = Boolean(expenseToEdit.installmentsTotal && expenseToEdit.installmentsTotal > 1);
      setIsInstallment(hasInstallments);
      setInstallmentsCurrent((expenseToEdit.installmentsCurrent || 1).toString());
      setInstallmentsTotal((expenseToEdit.installmentsTotal || 1).toString());
      setAutoGenerateInstallments(false);
      setNotes(expenseToEdit.notes || '');
    } else {
      setDescription('');
      setAmount('');
      setPurchaseDate(todayStr);
      setReferenceMonth(defaultMonthKey);
      setCardName(allCardOptions[0] || 'Nubank Ultravioleta');
      setIsCustomCard(false);
      setCustomCardName('');
      setMemberId(members[0]?.id || '');
      const defaultExp = categories.find((c) => c.type === 'expense');
      setCategoryId(defaultExp?.id || categories[0]?.id || '');
      setIsInstallment(false);
      setInstallmentsCurrent('1');
      setInstallmentsTotal('3');
      setAutoGenerateInstallments(false);
      setNotes('');
    }
  }, [expenseToEdit, isOpen]);

  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both');

  // Salvar novo item ou atualizar existente
  const handleSavePresetItem = () => {
    const trimmed = presetItemName.trim();
    if (!trimmed) {
      setPresetFeedbackMsg('Informe o nome do item para salvar.');
      return;
    }

    let updated: CreditCardPresetItem[];
    if (editingPresetId) {
      // Editando item existente
      updated = localPresets.map((p) =>
        p.id === editingPresetId
          ? {
              ...p,
              name: trimmed,
              categoryId: presetItemCategoryId || undefined,
              memberId: presetItemMemberId || undefined,
            }
          : p
      );
      setPresetFeedbackMsg(`Item "${trimmed}" atualizado com sucesso!`);
    } else {
      // Criando novo item
      const newItem: CreditCardPresetItem = {
        id: `preset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: trimmed,
        categoryId: presetItemCategoryId || undefined,
        memberId: presetItemMemberId || undefined,
      };
      updated = [...localPresets, newItem];
      setPresetFeedbackMsg(`Novo item "${trimmed}" criado com sucesso!`);
    }

    setLocalPresets(updated);
    if (onUpdatePresetItems) {
      onUpdatePresetItems(updated);
    }

    // Reset do formulário do editor
    setEditingPresetId(null);
    setPresetItemName('');
    setPresetItemCategoryId('');
    setPresetItemMemberId('');

    setTimeout(() => setPresetFeedbackMsg(''), 3000);
  };

  const handleStartEditPreset = (item: CreditCardPresetItem) => {
    setEditingPresetId(item.id);
    setPresetItemName(item.name);
    setPresetItemCategoryId(item.categoryId || '');
    setPresetItemMemberId(item.memberId || '');
    setPresetFeedbackMsg('');
  };

  const handleDeletePreset = (id: string) => {
    const itemToDelete = localPresets.find((p) => p.id === id);
    const updated = localPresets.filter((p) => p.id !== id);
    setLocalPresets(updated);
    if (onUpdatePresetItems) {
      onUpdatePresetItems(updated);
    }
    if (editingPresetId === id) {
      setEditingPresetId(null);
      setPresetItemName('');
      setPresetItemCategoryId('');
      setPresetItemMemberId('');
    }
    if (itemToDelete) {
      setPresetFeedbackMsg(`Item "${itemToDelete.name}" removido.`);
      setTimeout(() => setPresetFeedbackMsg(''), 3000);
    }
  };

  const handleResetDefaultPresets = () => {
    setLocalPresets(DEFAULT_CREDIT_CARD_PRESETS);
    if (onUpdatePresetItems) {
      onUpdatePresetItems(DEFAULT_CREDIT_CARD_PRESETS);
    }
    setEditingPresetId(null);
    setPresetItemName('');
    setPresetFeedbackMsg('Itens padrão restaurados com sucesso.');
    setTimeout(() => setPresetFeedbackMsg(''), 3000);
  };

  const handleSelectPresetItem = (preset: CreditCardPresetItem) => {
    setDescription(preset.name);
    if (preset.categoryId) {
      setCategoryId(preset.categoryId);
    } else if (preset.categoryNamePartial) {
      const matchedCat = categories.find(
        (c) =>
          c.type !== 'income' &&
          c.name.toLowerCase().includes(preset.categoryNamePartial!.toLowerCase())
      );
      if (matchedCat) {
        setCategoryId(matchedCat.id);
      }
    }

    if (preset.memberId) {
      setMemberId(preset.memberId);
    } else if (preset.memberNamePartial) {
      const matchedMem = members.find((m) =>
        m.name.toLowerCase().includes(preset.memberNamePartial!.toLowerCase())
      );
      if (matchedMem) {
        setMemberId(matchedMem.id);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Por favor, informe um valor válido em Reais maior que zero.');
      return;
    }

    if (!description.trim()) {
      alert('Por favor, informe a descrição do gasto no cartão.');
      return;
    }

    const finalCardName = isCustomCard ? customCardName.trim() : cardName.trim();
    if (!finalCardName) {
      alert('Por favor, selecione ou digite o nome do cartão de crédito.');
      return;
    }

    const curInst = isInstallment ? parseInt(installmentsCurrent, 10) || 1 : 1;
    const totInst = isInstallment ? parseInt(installmentsTotal, 10) || 1 : 1;

    onSave(
      {
        description: description.trim(),
        amount: parsedAmount,
        purchaseDate,
        referenceMonth,
        cardName: finalCardName,
        memberId,
        categoryId,
        installmentsCurrent: curInst,
        installmentsTotal: totInst,
        notes: notes.trim() || undefined,
      },
      expenseToEdit?.id,
      !expenseToEdit && isInstallment && autoGenerateInstallments
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {expenseToEdit ? 'Editar Gasto no Cartão' : 'Novo Gasto no Cartão de Crédito'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gasto diverso computado no total mensal e nos gráficos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Campo de Seleção e Edição dos Itens a Serem Preenchidos */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    Itens a Serem Preenchidos
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Clique para preencher os dados ou use o botão de edição ao lado
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditingPresets(!isEditingPresets);
                  if (isEditingPresets) {
                    setEditingPresetId(null);
                    setPresetItemName('');
                    setPresetFeedbackMsg('');
                  }
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 shrink-0 ml-2 ${
                  isEditingPresets
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{isEditingPresets ? 'Concluir' : 'Editar Itens'}</span>
              </button>
            </div>

            {presetFeedbackMsg && (
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs text-indigo-700 dark:text-indigo-300 animate-in fade-in">
                {presetFeedbackMsg}
              </div>
            )}

            {/* Visualização Padrão (Clique para Preencher o Formulário) */}
            {!isEditingPresets ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {localPresets.map((preset) => {
                    const isSelected = description.toLowerCase() === preset.name.toLowerCase();
                    const cat = categories.find((c) => c.id === preset.categoryId);
                    const mem = members.find((m) => m.id === preset.memberId);

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPresetItem(preset)}
                        className={`px-2.5 py-1.5 text-xs rounded-lg border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-xs ring-2 ring-indigo-500/20'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                        title={`${preset.name}${cat ? ` · Categoria: ${cat.name}` : ''}${mem ? ` · Membro: ${mem.name}` : ''}`}
                      >
                        <span>{preset.name}</span>
                        {mem && (
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: mem.color }}
                            title={`Membro padrão: ${mem.name}`}
                          />
                        )}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPresets(true);
                      setEditingPresetId(null);
                      setPresetItemName('');
                    }}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 transition-colors flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo Item</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Campo de Edição: Criar Novos Itens e Editar os Existentes */
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                {/* Formulário de Criação / Edição do Item */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {editingPresetId ? (
                        <>
                          <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                          <span>Editar Item Selecionado</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Criar Novo Item para Preenchimento</span>
                        </>
                      )}
                    </span>
                    {editingPresetId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPresetId(null);
                          setPresetItemName('');
                          setPresetItemCategoryId('');
                          setPresetItemMemberId('');
                        }}
                        className="text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:underline"
                      >
                        Cancelar edição
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Nome do Item */}
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Nome do Item *
                      </label>
                      <input
                        type="text"
                        value={presetItemName}
                        onChange={(e) => setPresetItemName(e.target.value)}
                        placeholder="Ex: Pet shop, Academia..."
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      />
                    </div>

                    {/* Categoria Padrão */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Categoria Sugerida
                      </label>
                      <select
                        value={presetItemCategoryId}
                        onChange={(e) => setPresetItemCategoryId(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      >
                        <option value="">(Nenhuma / Manter atual)</option>
                        {expenseCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Membro da Família Padrão */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Membro Sugerido
                      </label>
                      <select
                        value={presetItemMemberId}
                        onChange={(e) => setPresetItemMemberId(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      >
                        <option value="">(Nenhum / Manter atual)</option>
                        {members.map((mem) => (
                          <option key={mem.id} value={mem.id}>
                            {mem.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleSavePresetItem}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      {editingPresetId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{editingPresetId ? 'Salvar Alteração do Item' : '+ Adicionar Campo / Item'}</span>
                    </button>
                  </div>
                </div>

                {/* Lista de Itens Existentes */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Itens Disponíveis ({localPresets.length}):
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Clique no lápis para editar ou na lixeira para excluir
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                    {localPresets.map((item) => {
                      const cat = categories.find((c) => c.id === item.categoryId);
                      const mem = members.find((m) => m.id === item.memberId);
                      const isCurrentlyEditing = editingPresetId === item.id;

                      return (
                        <div
                          key={item.id}
                          className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                            isCurrentlyEditing
                              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-1 ring-amber-500/20'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                            <span className="font-semibold text-slate-900 dark:text-white truncate">
                              {item.name}
                            </span>
                            {cat && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate">
                                {cat.name}
                              </span>
                            )}
                            {mem && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: mem.color }} />
                                <span>{mem.name}</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              type="button"
                              onClick={() => handleStartEditPreset(item)}
                              className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Editar este item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePreset(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Excluir este item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rodapé da Edição */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={handleResetDefaultPresets}
                    className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline text-[11px] flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar Padrões</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPresets(false);
                      setEditingPresetId(null);
                      setPresetItemName('');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"
                  >
                    Concluir Edição
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrição do Gasto *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado Angeloni, Jantar Restaurante, Gasolina..."
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>

          {/* Valor and Purchase Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor da Parcela / Compra (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">R$</span>
                <input
                  type="text"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-9 pr-3 py-2 text-sm font-semibold tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data da Compra *
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Reference Month (Mês da Fatura) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mês da Fatura de Cobrança *
              </label>
              <input
                type="month"
                required
                value={referenceMonth}
                onChange={(e) => setReferenceMonth(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
              <span className="text-[10px] text-slate-400">
                Mês em que este gasto será debitado na fatura
              </span>
            </div>

            {/* Cartão de Crédito */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cartão Utilizado *
              </label>
              {!isCustomCard ? (
                <div className="space-y-1">
                  <select
                    value={cardName}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomCard(true);
                        setCustomCardName('');
                      } else {
                        setCardName(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  >
                    {allCardOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__custom__">+ Outro Cartão Personalizado...</option>
                  </select>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    required
                    value={customCardName}
                    onChange={(e) => setCustomCardName(e.target.value)}
                    placeholder="Nome do cartão (ex: Nubank, XP, C6...)"
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomCard(false)}
                    className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    Lista
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Member and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Membro Responsável *
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <select
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role.split(' ')[0]})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoria do Gasto *
              </label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Parcelamento Section */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInstallment}
                  onChange={(e) => setIsInstallment(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Compra Parcelada</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {isInstallment ? 'Parcelamento ativado' : 'À vista (1x)'}
              </span>
            </div>

            {isInstallment && (
              <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/60">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Parcela Atual
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={96}
                      value={installmentsCurrent}
                      onChange={(e) => setInstallmentsCurrent(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Total de Parcelas
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={96}
                      value={installmentsTotal}
                      onChange={(e) => setInstallmentsTotal(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md dark:text-white"
                    />
                  </div>
                </div>

                {!expenseToEdit && (
                  <label className="flex items-start gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoGenerateInstallments}
                      onChange={(e) => setAutoGenerateInstallments(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 mt-0.5"
                    />
                    <span>
                      Gerar automaticamente as próximas parcelas nos meses seguintes (ex: fatura de Dezembro, Janeiro...)
                    </span>
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações / Detalhes (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Cupom de desconto, local da compra, motivo..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>

          {/* Informative banner on total computation */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <span className="font-bold">✓</span>
            <span>
              Este gasto será computado no <strong>total mensal da família</strong> e nos <strong>gráficos de despesas</strong> do mês de referência ({referenceMonth}).
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{expenseToEdit ? 'Salvar Alterações' : 'Adicionar ao Cartão'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
