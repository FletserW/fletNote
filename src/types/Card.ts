// src/types/Card.ts
export type Card = {
  id?: string;
  name: string;
  lastDigits: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'elo' | 'other';
  limit?: number;
  dueDay: number; // Dia de vencimento
  closingDay: number; // Dia de fechamento
  color?: string; // Cor do cartão (para UI)
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
};

export type CardStats = {
  totalCards: number;
  activeCards: number;
  totalLimit: number;
  usedLimit: number;
  availableLimit: number;
  nextDueDate: string | null;
  nextDueAmount: number;
};