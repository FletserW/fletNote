// types/Transaction.ts
export type TransactionType = 'income' | 'expense'  // ← Mudar

export type Transaction = {
  id?: number
  type: TransactionType  // 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
}