export type TransactionType = 'income' | 'expense';

export type PaymentStatus = 'pending' | 'paid' | 'overdue';

export type PaymentMethod = 
  | 'pix' 
  | 'boleto' 
  | 'cartao_credito' 
  | 'cartao_debito' 
  | 'dinheiro' 
  | 'transferencia' 
  | 'debito_automatico';

export type UserRole = 'admin' | 'user';

export interface UserAccount {
  id: string;
  username: string; // 'eduardo' | 'graciela'
  name: string;
  role: UserRole;
  memberId: string;
  pin: string; // PIN ou senha de acesso
  email: string; // E-mail cadastrado para recuperação de senha
  avatarInitials: string;
  color: string;
  twoFactorEnabled?: boolean; // Autenticação em duas etapas do Google Authenticator ativada
  twoFactorSecret?: string; // Segredo Base32 do Google Authenticator
  twoFactorBackupCodes?: string[]; // Códigos reservas de emergência
}

export interface FamilyMember {
  id: string;
  name: string;
  role: string; // e.g. "Pai", "Mãe", "Filho", "Filha", "Geral"
  color: string;
  avatarInitials: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType | 'both';
  icon: string;
  color: string;
  monthlyBudget?: number;
}

export interface IncomeSource {
  id: string;
  name: string; // Ex: "Empresa Tecnologia S.A.", "Projetos de Arquitetura", "Aluguel Imóvel Blumenau", "Dividendos FIIs & Ações"
  memberId: string;
  categoryId: string;
  estimatedMonthlyAmount: number; // Valor estimado/previsto mensal R$
  expectedDayOfMonth?: number; // Dia previsto de recebimento (ex: 5)
  isActive: boolean;
  notes?: string;
}

export interface AlarmSettings {
  enabled: boolean;
  alertOverdue: boolean; // Alarme sonoro para contas atrasadas/vencidas
  alertUpcoming: boolean; // Alarme sonoro para contas a vencer
  upcomingDaysThreshold: number; // Período de antecedência em dias (editável: ex. vencer em até 3 dias)
  repeatIntervalMinutes: number; // Período de repetição do disparo do alarme em minutos (editável: ex. a cada 15 min, 30 min, 60 min, ou 0 = disparo único)
  soundType: 'gentle_chime' | 'digital_alert' | 'urgent_beep';
  volume: number; // 0.1 a 1.0
  isMutedForSession?: boolean;
}

export interface CreditCardPresetItem {
  id: string;
  name: string; // Nome/termo do item preenchível: "Combustível", "Farmácia", "Mercado", etc.
  categoryId?: string; // Categoria padrão sugerida
  memberId?: string; // Membro padrão sugerido
  categoryNamePartial?: string;
  memberNamePartial?: string;
  defaultAmount?: number;
}

export interface CreditCardExpense {
  id: string;
  description: string; // Nome/termo do lançamento: "Combustível", "Farmácia", "Mercado", "Casa", "Graciela", "Eduardo", "Haniela", etc.
  amount: number; // in Reais (float)
  purchaseDate: string; // YYYY-MM-DD
  referenceMonth: string; // YYYY-MM (mês de competência/fatura)
  cardName: string; // ex: "Nubank Ultravioleta", "XP Visa Infinite", "Itaú Black"
  memberId: string;
  categoryId: string;
  dueDate?: string; // Data de vencimento da fatura
  status?: PaymentStatus; // 'paid' | 'pending' | 'overdue'
  paymentMethod?: PaymentMethod;
  receiptNote?: string; // Comprovante / autenticação
  installmentsCurrent?: number; // ex: 1
  installmentsTotal?: number; // ex: 1 (à vista) ou 3, 6, 10
  notes?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  title: string;
  amount: number; // in Reais (float)
  categoryId: string;
  memberId: string;
  sourceId?: string; // ID da Fonte de Renda (quando type === 'income')
  sourceName?: string; // Nome da Fonte de Renda
  dueDate: string; // YYYY-MM-DD
  paymentDate?: string; // YYYY-MM-DD (when status === 'paid')
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  receiptNote?: string; // e.g. "Código de autenticação ou anotação do comprovante"
  isRecurring?: boolean;
  recurringMonthsCount?: number; // Quantos meses este lançamento deverá ser preenchido automaticamente (ex: 3, 6, 12, 24)
  recurringGroupId?: string; // ID do grupo recorrente para sincronizar lançamentos dos meses subsequentes
  enableAlarm?: boolean; // Alarme sonoro ativado para esta conta específica
  alarmDaysNotice?: number; // Período de disparo para esta conta específica (dias antes)
  isCreditCardInvoice?: boolean; // Marcador de item de fatura de cartão em lançamentos (não computa no total geral para evitar duplicidade, editável e com toggle no gráfico)
  notes?: string;
  createdAt: string;
}

export interface MonthlyBudget {
  categoryId: string;
  amount: number;
}

export interface MonthSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  paidExpense: number;
  pendingExpense: number;
  savingsRate: number; // in percentage
}

export interface ChangeLogEntry {
  id: string;
  timestamp: string; // Hora formatada HH:MM:SS
  fullDate: string; // YYYY-MM-DD
  user: string; // Nome do usuário que realizou a ação
  entity: 'Lançamento' | 'Cartão de Crédito' | 'Fonte de Renda' | 'Orçamento' | 'Categorias' | 'Segurança' | 'Sistema';
  action: 'create' | 'update' | 'delete' | 'payment' | 'pin_change' | 'save';
  actionLabel: string; // ex: "Nova Despesa", "Conta Paga", "PIN Alterado"
  details: string; // Detalhes legíveis do que foi modificado
  status: 'saved' | 'pending';
  savedAt?: string;
}
