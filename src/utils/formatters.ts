import { PaymentMethod, PaymentStatus } from '../types/finance';

export const formatBRL = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDateBR = (dateStr: string): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

export const formatMonthYear = (yearMonth: string): string => {
  // yearMonth format: "YYYY-MM"
  if (!yearMonth) return '';
  const [year, month] = yearMonth.split('-');
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const monthIdx = parseInt(month, 10) - 1;
  const monthName = months[monthIdx] || month;
  return `${monthName} de ${year}`;
};

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  switch (method) {
    case 'pix':
      return 'PIX';
    case 'boleto':
      return 'Boleto';
    case 'cartao_credito':
      return 'Cartão de Crédito';
    case 'cartao_debito':
      return 'Cartão de Débito';
    case 'debito_automatico':
      return 'Débito Automático';
    case 'transferencia':
      return 'Transferência / TED';
    case 'dinheiro':
      return 'Dinheiro em Espécie';
    default:
      return method;
  }
};

export const getPaymentStatusInfo = (status: PaymentStatus, dueDate: string, paymentDate?: string) => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  if (status === 'paid') {
    return {
      label: 'Pago / Confirmado',
      sublabel: paymentDate ? `em ${formatDateBR(paymentDate)}` : 'Confirmado',
      colorClass: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      badgeText: 'Pago',
      isOverdue: false,
    };
  }

  // Check if it is overdue
  if (dueDate < todayStr) {
    const today = new Date(todayStr);
    const due = new Date(dueDate);
    const diffTime = Math.abs(today.getTime() - due.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      label: 'Atrasado',
      sublabel: `${diffDays} dia${diffDays > 1 ? 's' : ''} em atraso`,
      colorClass: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
      badgeText: 'Atrasado',
      isOverdue: true,
    };
  }

  if (dueDate === todayStr) {
    return {
      label: 'Vence Hoje',
      sublabel: 'Vence hoje!',
      colorClass: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      badgeText: 'Vence Hoje',
      isOverdue: false,
    };
  }

  // Pending upcoming
  const today = new Date(todayStr);
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    label: 'Pendente',
    sublabel: diffDays <= 7 ? `Vence em ${diffDays} dia${diffDays > 1 ? 's' : ''}` : `Vence ${formatDateBR(dueDate)}`,
    colorClass: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    badgeText: 'Pendente',
    isOverdue: false,
  };
};

export const getMonthKey = (dateStr: string): string => {
  return dateStr.slice(0, 7); // "YYYY-MM"
};
