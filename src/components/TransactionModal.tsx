import React, { useState, useEffect } from 'react';
import { X, Plus, Save, TrendingUp, TrendingDown, Briefcase } from 'lucide-react';
import { Category, FamilyMember, IncomeSource, PaymentMethod, PaymentStatus, Transaction, TransactionType } from '../types/finance';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id' | 'createdAt'>, id?: string) => void;
  transactionToEdit?: Transaction | null;
  categories: Category[];
  members: FamilyMember[];
  incomeSources: IncomeSource[];
  defaultMonthKey: string; // "YYYY-MM"
  onOpenCategoryManager?: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transactionToEdit,
  categories,
  members,
  incomeSources,
  defaultMonthKey,
  onOpenCategoryManager,
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const initialDueDate = `${defaultMonthKey}-10`;

  const [type, setType] = useState<TransactionType>(transactionToEdit?.type || 'expense');
  const [title, setTitle] = useState(transactionToEdit?.title || '');
  const [amount, setAmount] = useState(transactionToEdit?.amount?.toString() || '');
  const [categoryId, setCategoryId] = useState(transactionToEdit?.categoryId || '');
  const [memberId, setMemberId] = useState(transactionToEdit?.memberId || members[0]?.id || '');
  const [sourceId, setSourceId] = useState(transactionToEdit?.sourceId || '');
  const [sourceName, setSourceName] = useState(transactionToEdit?.sourceName || '');
  const [dueDate, setDueDate] = useState(transactionToEdit?.dueDate || initialDueDate);
  const [status, setStatus] = useState<PaymentStatus>(transactionToEdit?.status || 'pending');
  const [paymentDate, setPaymentDate] = useState(transactionToEdit?.paymentDate || todayStr);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(transactionToEdit?.paymentMethod || 'pix');
  const [receiptNote, setReceiptNote] = useState(transactionToEdit?.receiptNote || '');
  const [isRecurring, setIsRecurring] = useState(transactionToEdit?.isRecurring ?? false);
  const [enableAlarm, setEnableAlarm] = useState(transactionToEdit?.enableAlarm ?? true);
  const [alarmDaysNotice, setAlarmDaysNotice] = useState((transactionToEdit?.alarmDaysNotice ?? 3).toString());
  const [isCreditCardInvoice, setIsCreditCardInvoice] = useState(
    transactionToEdit?.isCreditCardInvoice ?? (transactionToEdit?.categoryId === 'cat_cartao')
  );
  const [notes, setNotes] = useState(transactionToEdit?.notes || '');

  // Reset or fill fields on open or change of transactionToEdit
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setTitle(transactionToEdit.title);
      setAmount(transactionToEdit.amount.toString());
      setCategoryId(transactionToEdit.categoryId);
      setMemberId(transactionToEdit.memberId);
      setSourceId(transactionToEdit.sourceId || '');
      setSourceName(transactionToEdit.sourceName || '');
      setDueDate(transactionToEdit.dueDate);
      setStatus(transactionToEdit.status);
      setPaymentDate(transactionToEdit.paymentDate || todayStr);
      setPaymentMethod(transactionToEdit.paymentMethod);
      setReceiptNote(transactionToEdit.receiptNote || '');
      setIsRecurring(transactionToEdit.isRecurring ?? false);
      setEnableAlarm(transactionToEdit.enableAlarm ?? true);
      setAlarmDaysNotice((transactionToEdit.alarmDaysNotice ?? 3).toString());
      setIsCreditCardInvoice(transactionToEdit.isCreditCardInvoice ?? (transactionToEdit.categoryId === 'cat_cartao'));
      setNotes(transactionToEdit.notes || '');
    } else {
      setType('expense');
      setTitle('');
      setAmount('');
      const defaultExpCat = categories.find((c) => c.type === 'expense' || c.type === 'both');
      setCategoryId(defaultExpCat ? defaultExpCat.id : categories[0]?.id || '');
      setMemberId(members[0]?.id || '');
      setSourceId('');
      setSourceName('');
      setDueDate(initialDueDate);
      setStatus('pending');
      setPaymentDate(todayStr);
      setPaymentMethod('pix');
      setReceiptNote('');
      setIsRecurring(false);
      setEnableAlarm(true);
      setAlarmDaysNotice('3');
      setIsCreditCardInvoice(false);
      setNotes('');
    }
  }, [transactionToEdit, isOpen]);

  // Handle source selection
  const handleSelectSource = (selectedId: string) => {
    setSourceId(selectedId);
    if (selectedId === 'custom' || !selectedId) {
      // Keep or clear sourceName
      if (selectedId === 'custom') setSourceName('');
      return;
    }

    const found = incomeSources.find((s) => s.id === selectedId);
    if (found) {
      setSourceName(found.name);
      if (!title || incomeSources.some((s) => s.name === title)) {
        setTitle(found.name);
      }
      setMemberId(found.memberId);
      setCategoryId(found.categoryId);
      if (!amount || amount === '0') {
        setAmount(found.estimatedMonthlyAmount.toString());
      }
      if (found.expectedDayOfMonth) {
        const dayStr = String(found.expectedDayOfMonth).padStart(2, '0');
        setDueDate(`${defaultMonthKey}-${dayStr}`);
      }
    }
  };

  // Adjust category when type changes if current category is incompatible
  const filteredCategories = categories.filter((c) => c.type === type || c.type === 'both');

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const compatible = categories.find((c) => c.type === newType || c.type === 'both');
    if (compatible) {
      setCategoryId(compatible.id);
    }
    if (newType === 'income' && !sourceId && incomeSources.length > 0) {
      handleSelectSource(incomeSources[0].id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Por favor, informe um valor monetário válido maior que zero.');
      return;
    }

    const payload: Omit<Transaction, 'id' | 'createdAt'> = {
      type,
      title: title.trim(),
      amount: parsedAmount,
      categoryId,
      memberId,
      sourceId: type === 'income' ? (sourceId && sourceId !== 'custom' ? sourceId : undefined) : undefined,
      sourceName: type === 'income' ? (sourceName.trim() || undefined) : undefined,
      dueDate,
      status,
      paymentDate: status === 'paid' ? paymentDate : undefined,
      paymentMethod,
      receiptNote: receiptNote.trim() || undefined,
      isRecurring,
      enableAlarm: type === 'expense' ? enableAlarm : false,
      alarmDaysNotice: type === 'expense' && enableAlarm ? (parseInt(alarmDaysNotice, 10) || 3) : undefined,
      isCreditCardInvoice: type === 'expense' ? Boolean(isCreditCardInvoice || categoryId === 'cat_cartao') : false,
      notes: notes.trim() || undefined,
    };

    onSave(payload, transactionToEdit?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {transactionToEdit ? 'Editar Lançamento' : 'Novo Lançamento Familiar'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Discrimine rendas recebidas ou despesas/saídas da casa
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Type Selector (Entrada / Saída) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tipo de Movimentação *
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  type === 'income'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Renda / Entrada</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  type === 'expense'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                <span>Saída / Pagamento</span>
              </button>
            </div>
          </div>

          {/* Fonte de Renda Section (Only for Incomes) */}
          {type === 'income' && (
            <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Fonte de Renda (Pagador / Origem da Receita) *</span>
                </label>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Campo editável
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Selecionar Fonte Cadastrada
                  </label>
                  <select
                    value={sourceId}
                    onChange={(e) => handleSelectSource(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
                  >
                    <option value="">-- Selecione uma fonte ou crie --</option>
                    {incomeSources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.isActive ? 'Ativa' : 'Inativa'})
                      </option>
                    ))}
                    <option value="custom">+ Outra Fonte (Personalizada)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nome da Fonte (Editável)
                  </label>
                  <input
                    type="text"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    placeholder="Ex: Empresa X, Projeto Y, Aluguel Centro..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Description & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Descrição do Lançamento *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={type === 'income' ? 'Ex: Salário, Freelance, Rendimentos' : 'Ex: Supermercado, Aluguel, Luz, Escola'}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Valor (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Category & Family Member */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Categoria *
                </label>
                {onOpenCategoryManager && (
                  <button
                    type="button"
                    onClick={onOpenCategoryManager}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Nova / Editar</span>
                  </button>
                )}
              </div>
              <select
                value={categoryId}
                onChange={(e) => {
                  const val = e.target.value;
                  setCategoryId(val);
                  if (val === 'cat_cartao') {
                    setIsCreditCardInvoice(true);
                    if (!title) setTitle('Fatura Cartão de Crédito');
                  }
                }}
                required
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              >
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Membro da Família Responsável *
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
          </div>

          {/* Credit card invoice informative banner */}
          {type === 'expense' && (
            <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 rounded-xl space-y-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-slate-900 dark:text-white">
                <input
                  type="checkbox"
                  checked={isCreditCardInvoice || categoryId === 'cat_cartao'}
                  onChange={(e) => setIsCreditCardInvoice(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-0.5"
                />
                <div>
                  <span>Item "Cartão de Crédito" em Lançamentos (Informativo a preencher)</span>
                  <p className="text-[11px] font-normal text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Você pode preencher o valor desta fatura para acompanhar pagamentos e comprovantes. Este item <strong>não soma no total geral da família</strong> para não duplicar os gastos detalhados da aba Cartão de Crédito. Nos gráficos, pode ser ativado ou desativado.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Due date and Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Data de Vencimento / Previsão *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Status Atual *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              >
                <option value="pending">Pendente (Aguardando Pagamento/Recebimento)</option>
                <option value="paid">Pago / Confirmado</option>
              </select>
            </div>
          </div>

          {/* If Paid, show payment confirmation details */}
          {status === 'paid' && (
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-3">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">
                Detalhes da Confirmação do Pagamento:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Data do Pagamento
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Comprovante / Código de Autenticação
                  </label>
                  <input
                    type="text"
                    value={receiptNote}
                    onChange={(e) => setReceiptNote(e.target.value)}
                    placeholder="Ex: Autenticação nº 883920..."
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Payment Method & Recurring option */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Forma de Pagamento Principal
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              >
                <option value="pix">PIX</option>
                <option value="boleto">Boleto Bancário</option>
                <option value="debito_automatico">Débito Automático</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="transferencia">Transferência Bancária / TED</option>
                <option value="dinheiro">Dinheiro em Espécie</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Conta Recorrente Fixa (repete todo mês)</span>
              </label>
            </div>
          </div>

          {/* Alarme Sonoro Individual para a Conta */}
          {type === 'expense' && (
            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={enableAlarm}
                    onChange={(e) => setEnableAlarm(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span>Ativar Alarme Sonoro para esta conta</span>
                </label>

                {enableAlarm && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <span>Disparar</span>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={alarmDaysNotice}
                      onChange={(e) => setAlarmDaysNotice(e.target.value)}
                      className="w-14 px-2 py-0.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-center font-mono tabular-nums"
                    />
                    <span>dias antes do vencimento</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Observações Adicionais (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Parcela 2 de 5, comprado com desconto à vista..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
            />
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{transactionToEdit ? 'Salvar Lançamento' : 'Cadastrar Lançamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
