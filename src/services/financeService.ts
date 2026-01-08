import type { AnnualSummaryMonth } from '../types/AnnualSummary'
import { openDB } from 'idb'

const DB_NAME = 'finance-db'
const STORE_NAME = 'transactions'

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, {
        keyPath: 'id',
        autoIncrement: true
      })
    }
  }
})

export type Transaction = {
  id?: number
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string // ISO
}

/* ============================
   ADD TRANSACTION (CORRIGIDO)
============================ */
export async function addTransaction(tx: Transaction) {
  const db = await dbPromise
  
  // GARANTIR que todos os valores sejam positivos
  const transactionToSave = {
    ...tx,
    amount: Math.abs(tx.amount) // ← CORREÇÃO: garantir valor positivo
  }
  
  console.log('Salvando transação:', transactionToSave)
  await db.add(STORE_NAME, transactionToSave)
}

/* ============================
   FILTER TRANSACTIONS
============================ */
export async function getTransactionsByFilter(
  month: number,
  year: number,
  category?: string
): Promise<Transaction[]> {
  const db = await dbPromise
  const all = await db.getAll(STORE_NAME)

  return all.filter(tx => {
    const date = new Date(tx.date)
    const matchDate =
      date.getMonth() + 1 === month &&
      date.getFullYear() === year

    const matchCategory = category ? tx.category === category : true

    return matchDate && matchCategory
  })
}

/* ============================
   MONTH SUMMARY (CORRIGIDO)
============================ */
export function calculateSummary(transactions: Transaction[]) {
  let income = 0
  let expense = 0

  console.log('Calculando resumo para', transactions.length, 'transações')

  transactions.forEach(tx => {
    // Usar valor absoluto para garantir consistência
    const amount = Math.abs(tx.amount)
    
    if (tx.type === 'income') {
      income += amount
      console.log(`+ Entrada: R$ ${amount}`)
    } else if (tx.type === 'expense') {
      expense += amount
      console.log(`- Despesa: R$ ${amount}`)
    } else {
      console.warn('Tipo de transação desconhecido:', tx.type)
    }
  })

  const total = income - expense
  console.log(`Total: ${income} - ${expense} = ${total}`)

  return {
    income,
    expense,
    total
  }
}

/* ============================
   ANNUAL SUMMARY
============================ */
export async function getAnnualSummary(
  year: number
): Promise<AnnualSummaryMonth[]> {
  const db = await dbPromise
  const all = await db.getAll(STORE_NAME)

  const summary: AnnualSummaryMonth[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    income: 0,
    expense: 0,
    total: 0
  }))

  all.forEach(tx => {
    const date = new Date(tx.date)
    const y = date.getFullYear()
    const m = date.getMonth() + 1

    if (y === year) {
      const amount = Math.abs(tx.amount) // ← CORREÇÃO: usar valor absoluto
      if (tx.type === 'income') summary[m - 1].income += amount
      else summary[m - 1].expense += amount
    }
  })

  summary.forEach(m => {
    m.total = m.income - m.expense
  })

  return summary
}

/* ============================
   FUNÇÃO PARA CORRIGIR VALORES NEGATIVOS (OPCIONAL)
============================ */
export async function fixNegativeValues() {
  const db = await dbPromise
  const all = await db.getAll(STORE_NAME)
  
  const transactionsToFix = all.filter(tx => tx.amount < 0)
  
  if (transactionsToFix.length > 0) {
    console.log(`Corrigindo ${transactionsToFix.length} transações com valores negativos`)
    
    for (const tx of transactionsToFix) {
      await db.put(STORE_NAME, {
        ...tx,
        amount: Math.abs(tx.amount)
      })
    }
    
    console.log('Transações corrigidas com sucesso!')
  }
}