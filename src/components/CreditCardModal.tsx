import React, { useState, useEffect } from 'react';
import { X, CreditCard, Calendar, Tag, User, Layers, FileText } from 'lucide-react';
import { Category, CreditCardExpense, FamilyMember } from '../types/finance';

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
}

const DEFAULT_CARD_OPTIONS = [
  'Nubank Ultravioleta',
  'XP Visa Infinite',
  'Itaú Mastercard Black',
  'C6 Carbon Mastercard',
  'Bradesco Elo Nanquim',
  'Inter Mastercard Black',
];

interface QuickPreset {
  name: string;
  categoryNamePartial?: string;
  memberNamePartial?: string;
}

const PRESET_EXPENSE_TERMS: QuickPreset[] = [
  { name: 'Combustível', categoryNamePartial: 'transporte' },
  { name: 'Farmácia', categoryNamePartial: 'saúde' },
  { name: 'Mercado', categoryNamePartial: 'alimentação' },
  { name: 'Casa', categoryNamePartial: 'moradia' },
  { name: 'Graciela', memberNamePartial: 'graciela', categoryNamePartial: 'pessoal' },
  { name: 'Eduardo', memberNamePartial: 'eduardo', categoryNamePartial: 'pessoal' },
  { name: 'Haniela', memberNamePartial: 'haniela', categoryNamePartial: 'educação' },
  { name: 'Material escolar', categoryNamePartial: 'educação' },
  { name: 'Restaurante', categoryNamePartial: 'alimentação' },
  { name: 'Padaria', categoryNamePartial: 'alimentação' },
  { name: 'Outros', categoryNamePartial: 'outros' },
  { name: 'Roupas', categoryNamePartial: 'vestuário' },
  { name: 'Calçados', categoryNamePartial: 'vestuário' },
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

  const handleSelectPreset = (preset: QuickPreset) => {
    setDescription(preset.name);
    if (preset.categoryNamePartial) {
      const matchedCat = categories.find(
        (c) =>
          c.type !== 'income' &&
          c.name.toLowerCase().includes(preset.categoryNamePartial!.toLowerCase())
      );
      if (matchedCat) {
        setCategoryId(matchedCat.id);
      }
    }
    if (preset.memberNamePartial) {
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
          {/* Quick Preset Buttons (user requested items) */}
          <div className="space-y-1.5 pb-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Lançamentos Rápidos do Cartão (Clique para Preencher):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_EXPENSE_TERMS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                    description.toLowerCase() === preset.name.toLowerCase()
                      ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
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
