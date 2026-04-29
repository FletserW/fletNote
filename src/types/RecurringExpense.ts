// src/types/RecurringExpense.ts
export type RecurrenceType = 'monthly' | 'weekly' | 'biweekly' | 'quarterly' | 'yearly' | 'custom';

export type PaymentMethod = 'credit_card' | 'debit' | 'pix' | 'boleto' | 'transfer';

export type Priority = 'essential' | 'important' | 'optional';

export type RecurringExpense = {
  id?: string;
  name: string;
  amount: number;
  category: string;
  dueDay: number;
  paymentMethod: PaymentMethod;
  cardId?: string;
  recurrenceType: RecurrenceType;
  recurrenceInterval?: number;
  startDate: string;
  endDate?: string;
  installments?: number;
  installmentsPaid?: number;
  priority: Priority;
  autoPay: boolean;
  status: 'active' | 'paused' | 'cancelled';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
};

export type RecurringExpenseLog = {
  id?: string;
  recurringId: string;
  dueDate: string;
  paidDate?: string;
  amount: number;
  status: 'paid' | 'pending' | 'skipped' | 'overdue';
  transactionId?: string;
  createdAt?: string;
};

export type RecurringStats = {
  totalMonthly: number;
  totalEssential: number;
  totalImportant: number;
  totalOptional: number;
  upcomingCount: number;
  overdueCount: number;
  paidThisMonth: number;
  pendingThisMonth: number;
  byCategory: Record<string, number>;
  byPaymentMethod: Record<string, number>;
};