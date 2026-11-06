import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Calendar, CreditCard, FileText, DollarSign, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Transaction, PaymentMethod } from '../types/finance';
import { formatBRL, formatDateBR, getPaymentMethodLabel } from '../utils/formatters';

interface PaymentConfirmModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    txId: string,
    paymentDate: string,
    paymentMethod: PaymentMethod,
    receiptNote: string,
    paidAmount: number
  ) => void;
  onRevertPayment?: (txId: string) => void;
}

export const PaymentConfirmModal: React.FC<PaymentConfirmModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onConfirm,
  onRevertPayment,
}) => {
  if (!isOpen || !transaction) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const [paymentDate, setPaymentDate] = useState<string>(transaction.paymentDate || todayStr);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(transaction.paymentMethod || 'pix');
  const [receiptNote, setReceiptNote] = useState<string>(transaction.receiptNote || '');
  const [paidAmount, setPaidAmount] = useState<string>(transaction.amount.toString());

  useEffect(() => {
    if (transaction) {
      setPaymentDate(transaction.paymentDate || todayStr);
      setPaymentMethod(transaction.paymentMethod || 'pix');
      setReceiptNote(transaction.receiptNote || '');
      setPaidAmount(transaction.amount.toString());
    }
  }, [transaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(paidAmount.replace(',', '.')) || transaction.amount;
    
    // Trigger celebratory confetti effect
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#059669', '#10B981', '#34D399', '#3B82F6', '#F59E0B'],
      });
    } catch {
      // ignore if environment prevents confetti
    }

    onConfirm(transaction.id, paymentDate, paymentMethod, receiptNote, parsedAmount);
    onClose();
  };

  const handleRevert = () => {
    if (onRevertPayment) {
      onRevertPayment(transaction.id);
      onClose();
    }
  };

  const isAlreadyPaid = transaction.status === 'paid';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isAlreadyPaid ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60'
            }`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isAlreadyPaid ? 'Comprovante & Detalhes do Pagamento' : 'Confirmar Pagamento'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAlreadyPaid ? 'Registro e autenticação do pagamento efetuado' : 'Valide e dê baixa nesta conta da família'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Summary Banner */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {transaction.type === 'expense' ? 'Despesa / Conta' : 'Receita / Renda'}
              </span>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">
                {transaction.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Vencimento previsto: <strong className="text-slate-700 dark:text-slate-300">{formatDateBR(transaction.dueDate)}</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400">Valor Original</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                {formatBRL(transaction.amount)}
              </div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Data do Pagamento */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Data do Pagamento *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>
            </div>

            {/* Valor Efetivamente Pago */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Valor Efetivo Pago (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white tabular-nums font-mono"
                />
              </div>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Forma de Pagamento Utilizada
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
            >
              <option value="pix">PIX (Chave, QR Code ou Copia e Cola)</option>
              <option value="boleto">Boleto Bancário</option>
              <option value="debito_automatico">Débito Automático em Conta</option>
              <option value="cartao_debito">Cartão de Débito</option>
              <option value="cartao_credito">Cartão de Crédito</option>
              <option value="transferencia">Transferência Bancária / TED</option>
              <option value="dinheiro">Dinheiro em Espécie</option>
            </select>
          </div>

          {/* Código de Comprovante / Autenticação Bancária */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Autenticação Bancária ou Nº do Comprovante (Opcional)
            </label>
            <input
              type="text"
              value={receiptNote}
              onChange={(e) => setReceiptNote(e.target.value)}
              placeholder="Ex: Autenticação: 8392.1104.9928, ou ID Transação PIX"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Guarde aqui o número de autenticação do banco ou a anotação para prestação de contas familiar.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            {isAlreadyPaid && onRevertPayment ? (
              <button
                type="button"
                onClick={handleRevert}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:underline"
              >
                Desfazer confirmação (Voltar para Pendente)
              </button>
            ) : (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Confirmação imediata no balanço
              </span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAlreadyPaid ? 'Salvar Alterações' : 'Confirmar Pagamento'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
