// src/types/Transaction.ts
export interface Transaction {
  id?: number | string;  // Permite tanto number quanto string (para Firebase)
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string; // ISO
  createdAt?: string;
  userId?: string; // Para Firebase
}

// Se quiser tipos separados para local e firebase:
export interface LocalTransaction extends Transaction {
  id?: number; // IndexedDB usa number
}

export interface FirebaseTransaction extends Transaction {
  id?: string; // Firebase usa string
  userId: string;
}