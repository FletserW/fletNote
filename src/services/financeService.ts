// src/services/financeService.ts - VERSÃO CORRIGIDA
import type { AnnualSummaryMonth } from '../types/AnnualSummary';
import { 
  getTransactions,
  saveTransaction as saveTransactionToStorage,
  getCurrentGoal,
  saveGoal as saveGoalToStorage
} from './storageService';
import { firebaseService } from './firebaseService'; 


export type Transaction = {
  id?: number | string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string; // ISO
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  transferType?: 'vault_deposit' | 'vault_withdrawal';
  excludeFromSummary?: boolean;
};

type SummaryMode = 'financial' | 'cashflow';

const isVaultCategory = (category?: string): boolean => {
  const normalizedCategory = (category || '').trim().toLowerCase();
  return normalizedCategory === 'cofre' || normalizedCategory === 'retirada do cofre';
};

const isVaultDescription = (description?: string): boolean => {
  const normalizedDescription = (description || '').trim().toLowerCase();
  return normalizedDescription.startsWith('depósito no cofre:')
    || normalizedDescription.startsWith('deposito no cofre:')
    || normalizedDescription.startsWith('retirada do cofre:');
};

export const isInternalTransfer = (tx: Transaction): boolean => {
  return tx.excludeFromSummary === true
    || Boolean(tx.transferType)
    || isVaultCategory(tx.category)
    || isVaultDescription(tx.description);
};

function shouldIncludeInSummary(tx: Transaction, mode: SummaryMode): boolean {
  return mode === 'cashflow' || !isInternalTransfer(tx);
}

function buildEmptySummary() {
  return {
    income: 0,
    expense: 0,
    total: 0
  };
}

function addTransactionToSummary(
  summary: { income: number; expense: number; total: number },
  tx: Transaction,
  mode: SummaryMode = 'financial'
) {
  if (!shouldIncludeInSummary(tx, mode)) return;

  const amount = Math.abs(Number(tx.amount) || 0);

  if (tx.type === 'income') {
    summary.income += amount;
  } else if (tx.type === 'expense') {
    summary.expense += amount;
  } else {
    console.warn('Tipo de transação desconhecido:', tx.type);
  }
}

function calculateTransactionTotal(transactions: Transaction[], mode: SummaryMode = 'financial'): number {
  const summary = calculateSummary(transactions, mode);
  return summary.total;
}

function getSignedAmount(tx: Transaction, mode: SummaryMode = 'financial'): number {
  if (!shouldIncludeInSummary(tx, mode)) return 0;

  const amount = Math.abs(Number(tx.amount) || 0);
  if (tx.type === 'income') return amount;
  if (tx.type === 'expense') return -amount;
  return 0;
}

function getTransactionKey(tx: Transaction): string {
  if (tx.id !== undefined && tx.id !== null) return tx.id.toString();
  return [
    tx.type,
    tx.amount,
    tx.category,
    tx.description,
    tx.date
  ].join('|');
}

function mergeTransactionsById(...transactionGroups: Transaction[][]): Transaction[] {
  const merged = new Map<string, Transaction>();

  transactionGroups.flat().forEach(tx => {
    if (!tx || typeof tx !== 'object') return;

    const key = getTransactionKey(tx);
    if (!merged.has(key)) {
      merged.set(key, tx);
    }
  });

  return Array.from(merged.values());
}

async function getAllTransactions(userId?: string): Promise<Transaction[]> {
  const localTransactions = await getTransactions();

  if (!userId) {
    console.log(`💾 ${localTransactions.length} transações do localStorage`);
    return localTransactions;
  }

  let firestoreTransactions: Transaction[] = [];
  let userLocalTransactions: Transaction[] = [];

  try {
    firestoreTransactions = await firebaseService.getUserTransactions(userId);
    console.log(`🔥 ${firestoreTransactions.length} transações do Firestore`);
  } catch (firestoreError) {
    console.warn('⚠️ Erro ao buscar transações do Firestore:', firestoreError);
  }

  try {
    userLocalTransactions = await getTransactions(userId);
    console.log(`💾 ${userLocalTransactions.length} transações locais do usuário`);
  } catch (localError) {
    console.warn('⚠️ Erro ao buscar transações locais do usuário:', localError);
  }

  const mergedTransactions = mergeTransactionsById(
    firestoreTransactions,
    userLocalTransactions,
    localTransactions
  );

  console.log(`🔄 Total combinado: ${mergedTransactions.length} transações`);
  return mergedTransactions;
}


/* ============================
   ADD TRANSACTION (HÍBRIDO CORRIGIDO)
============================ */
// src/services/financeService.ts - ATUALIZE addTransaction
export async function addTransaction(tx: Transaction): Promise<void> {
  try {
    // Gerar ID compatível com Firestore
    const txId = tx.id?.toString() || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const transactionToSave = {
      ...tx,
      id: txId,
      amount: Math.abs(tx.amount),
      createdAt: tx.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString() // SEMPRE atualizar timestamp
    };
    
    console.log('💾 Salvando transação (Firestore master)...');
    
    // 1. Salvar localmente PRIMEIRO (feedback instantâneo)
    await saveTransactionToStorage(transactionToSave);
    console.log('✅ Transação salva localmente');
    
    // 2. Tentar salvar no Firestore IMEDIATAMENTE
    try {
      const user = firebaseService.getCurrentUser();
      if (user) {
        console.log(`👤 Enviando para Firestore: ${user.uid}`);
        
        // Adicionar userId para garantir consistência
        const txWithUserId = { ...transactionToSave, userId: user.uid };
        await firebaseService.addTransaction(txWithUserId, user.uid);
        console.log('✅ Transação enviada para Firestore');
      } else {
        console.log('👤 Nenhum usuário logado, apenas local');
      }
    } catch (firestoreError) {
      console.warn('⚠️ Firestore offline, será sincronizado depois:', firestoreError);
      // Não lançar erro - modo offline OK
    }
    
  } catch (error) {
    console.error('❌ Erro ao salvar transação:', error);
    throw error;
  }
}
/* ============================
   GET TRANSACTIONS (HÍBRIDO)
============================ */
// src/services/financeService.ts - ATUALIZE A FUNÇÃO getTransactionsByFilter
export async function getTransactionsByFilter(
  month: number,
  year: number,
  category?: string
): Promise<Transaction[]> {
  try {
    console.log(`Buscando transações para ${month}/${year}, categoria: ${category || 'todas'}`);
    
    const user = firebaseService.getCurrentUser();
    const allTransactions = await getAllTransactions(user?.uid);

    // Se não houver transações, retorna array vazio sem erro
    if (!allTransactions || allTransactions.length === 0) {
      console.log('📭 Nenhuma transação encontrada');
      return [];
    }
    
    // Se não for um array, retorna vazio
    if (!Array.isArray(allTransactions)) {
      console.warn('⚠️ Transações não são um array válido:', typeof allTransactions);
      return [];
    }
    
    // 🔥 FILTRAR POR MÊS/ANO E CATEGORIA
    const filtered = allTransactions.filter(tx => {
      try {
        // Valida transação
        if (!tx || typeof tx !== 'object') {
          return false;
        }
        
        // Valida data
        if (!tx.date) {
          return false;
        }
        
        const date = new Date(tx.date);
        if (isNaN(date.getTime())) {
          return false;
        }
        
        // Filtra por mês/ano
        const txMonth = date.getMonth() + 1;
        const txYear = date.getFullYear();
        
        // Verifica se corresponde ao filtro
        const monthMatch = txMonth === month;
        const yearMatch = txYear === year;
        const dateMatch = monthMatch && yearMatch;
        
        // Filtra por categoria se fornecida
        const categoryMatch = category ? tx.category === category : true;
        
        return dateMatch && categoryMatch;
      } catch (error) {
        console.error('Erro ao processar transação:', tx, error);
        return false;
      }
    });
    
    console.log(`✅ ${filtered.length} transações filtradas para ${month}/${year}`);
    
    // 🔥 ORDENAR POR DATA (mais recente primeiro)
    const sorted = filtered.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    return sorted;
    
  } catch (error) {
    console.error('❌ Erro em getTransactionsByFilter:', error);
    return [];
  }
}

/* ============================
   MONTH SUMMARY
============================ */
export function calculateSummary(transactions: Transaction[], mode: SummaryMode = 'financial') {
  const summary = buildEmptySummary();

  console.log('Calculando resumo para', transactions?.length || 0, 'transacoes');

  if (!transactions || !Array.isArray(transactions)) {
    console.log('Nenhuma transacao para calcular resumo');
    return summary;
  }

  if (transactions.length === 0) {
    console.log('Array de transacoes vazio');
    return summary;
  }

  transactions.forEach(tx => {
    try {
      addTransactionToSummary(summary, tx, mode);
    } catch (error) {
      console.error('Erro ao processar transacao no resumo:', tx, error);
    }
  });

  summary.total = summary.income - summary.expense;
  console.log(`Resumo: Entradas: R$ ${summary.income}, Saidas: R$ ${summary.expense}, Total: R$ ${summary.total}`);

  return summary;
}

/* ============================
   ANNUAL SUMMARY (HÍBRIDO)
============================ */
export async function getAnnualSummary(
  year: number,
  userId?: string // Adicione o userId como parâmetro opcional
): Promise<AnnualSummaryMonth[]> {
  try {
    console.log(`📊 Buscando resumo anual para ${year}, usuário: ${userId || 'local'}`);
    
    // 1. Usar a mesma fonte consolidada do extrato.
    const allTransactions = await getAllTransactions(userId);

    // 2. Se não houver transações, retorna array com valores zerados
    if (!allTransactions || !Array.isArray(allTransactions) || allTransactions.length === 0) {
      console.log('📭 Nenhuma transação para resumo anual, retornando meses zerados');
      return Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        income: 0,
        expense: 0,
        total: 0
      }));
    }
    
    // 3. Criar estrutura inicial para os 12 meses
    const summary: AnnualSummaryMonth[] = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0,
      total: 0
    }));
    
    // 4. Processar cada transação e somar por mês
    allTransactions.forEach(tx => {
      try {
        const date = new Date(tx.date);
        if (isNaN(date.getTime())) {
          console.warn(`⏰ Data inválida na transação: ${tx.id}`, tx.date);
          return;
        }
        
        const txYear = date.getFullYear();
        const txMonth = date.getMonth() + 1;
        
        // 5. Filtrar apenas transações do ano solicitado
        if (txYear === year) {
          const monthIndex = txMonth - 1;
          addTransactionToSummary(summary[monthIndex], tx);
        }
      } catch (error) {
        console.error('❌ Erro ao processar transação no resumo anual:', tx, error);
      }
    });
    
    // 6. Calcular o total (saldo) para cada mês
    summary.forEach(month => {
      month.total = month.income - month.expense;
      
      // Log para debug
      console.log(`📅 ${month.month}/${year}: Entradas: R$ ${month.income.toFixed(2)}, Saídas: R$ ${month.expense.toFixed(2)}, Saldo: R$ ${month.total.toFixed(2)}`);
    });
    
    // 7. Calcular totais para validação
    const totalIncome = summary.reduce((sum, month) => sum + month.income, 0);
    const totalExpense = summary.reduce((sum, month) => sum + month.expense, 0);
    const totalBalance = summary.reduce((sum, month) => sum + month.total, 0);
    
    console.log(`✅ Resumo anual ${year} calculado com sucesso:`);
    console.log(`   📈 Total Entradas: R$ ${totalIncome.toFixed(2)}`);
    console.log(`   📉 Total Saídas: R$ ${totalExpense.toFixed(2)}`);
    console.log(`   💰 Saldo Anual: R$ ${totalBalance.toFixed(2)}`);
    
    return summary;
    
  } catch (error) {
    console.error('❌ Erro em getAnnualSummary:', error);
    // Em caso de erro, retorna meses zerados
    return Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0,
      total: 0
    }));
  }
}

/* ============================
   CALCULAR SALDO PARA EXIBIÇÃO NO EXTRATO
============================ */

// Calcular saldo TOTAL acumulado (incluindo todos os meses)
export async function getTotalBalanceForStatement(
  month: number,
  year: number,
  userId?: string
): Promise<{
  monthBalance: number;      // Saldo apenas do mês atual
  accumulatedBalance: number; // Saldo total acumulado
  previousBalance: number;    // Saldo dos meses anteriores
}> {
  try {
    console.log(`📊 Calculando saldo para extrato: ${month}/${year}`);
    
    // 1. Calcular saldo do mês atual
    const currentMonthTransactions = await getTransactionsByFilter(month, year);
    const monthBalance = calculateTransactionTotal(currentMonthTransactions, 'cashflow');
    
    // 2. Buscar saldo acumulado dos meses anteriores
    let accumulatedBalance = 0;
    let previousBalance = 0;
    
    // Se tiver usuário, buscar do Firestore, senão do localStorage
    if (userId) {
      // Tentar buscar saldo do mês anterior do Firestore
      const previousMonthBalance = await getPreviousMonthBalance(month, year, userId);
      if (previousMonthBalance !== null) {
        previousBalance = previousMonthBalance;
        accumulatedBalance = previousBalance + monthBalance;
      } else {
        // Se não encontrar no Firestore, calcular manualmente
        accumulatedBalance = await calculateManualAccumulatedBalance(month, year, userId);
        previousBalance = accumulatedBalance - monthBalance;
      }
    } else {
      // Usuário não logado - calcular manualmente do localStorage
      accumulatedBalance = await calculateManualAccumulatedBalance(month, year);
      previousBalance = accumulatedBalance - monthBalance;
    }
    
    console.log(`💰 Saldo do extrato:`, {
      mesAtual: monthBalance,
      mesesAnteriores: previousBalance,
      totalAcumulado: accumulatedBalance
    });
    
    return {
      monthBalance,
      accumulatedBalance,
      previousBalance
    };
    
  } catch (error) {
    console.error('❌ Erro ao calcular saldo para extrato:', error);
    
    // Fallback: calcular apenas do mês atual
    const currentMonthTransactions = await getTransactionsByFilter(month, year);
    const monthBalance = calculateTransactionTotal(currentMonthTransactions, 'cashflow');
    
    return {
      monthBalance,
      accumulatedBalance: monthBalance,
      previousBalance: 0
    };
  }
}

// Calcular saldo acumulado manualmente (somando todos os meses anteriores)
async function calculateManualAccumulatedBalance(
  currentMonth: number,
  currentYear: number,
  userId?: string
): Promise<number> {
  try {
    console.log(`🧮 Calculando saldo acumulado manualmente...`);
    
    // Obter todas as transacoes usando a mesma fonte consolidada do extrato.
    const allTransactions = await getAllTransactions(userId);
    
    // Se não houver transações, retorna 0
    if (!allTransactions || allTransactions.length === 0) {
      return 0;
    }
    
    // Filtrar transações até o mês atual (inclusive)
    const filteredTransactions = allTransactions.filter(tx => {
      try {
        const date = new Date(tx.date);
        if (isNaN(date.getTime())) return false;
        
        const txYear = date.getFullYear();
        const txMonth = date.getMonth() + 1;
        
        // Incluir transações até o mês atual
        if (txYear < currentYear) return true;
        if (txYear === currentYear && txMonth <= currentMonth) return true;
        return false;
      } catch (error) {
        console.error('Erro ao filtrar transação:', tx, error);
        return false;
      }
    });
    
    // Calcular saldo total
    const total = calculateTransactionTotal(filteredTransactions, 'cashflow');
    
    console.log(`✅ Saldo manual calculado: R$ ${total.toFixed(2)} (${filteredTransactions.length} transações)`);
    return total;
    
  } catch (error) {
    console.error('❌ Erro no cálculo manual:', error);
    return 0;
  }
}

// Obter saldo do mês anterior (melhorada)
async function getPreviousMonthBalance(
  currentMonth: number,
  currentYear: number,
  userId?: string
): Promise<number | null> {
  try {
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    
    // Se for Janeiro, mês anterior é Dezembro do ano anterior
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = currentYear - 1;
    }
    
    // Primeiro tentar buscar saldo salvo
    const savedBalance = await getBalanceForMonth(prevMonth, prevYear, userId);
    if (savedBalance !== null) {
      return savedBalance;
    }
    
    // Se não tiver saldo salvo, calcular manualmente para todos os meses anteriores
    console.log(`📝 Nenhum saldo salvo para ${prevMonth}/${prevYear}, calculando...`);
    
    // Calcular saldo de TODOS os meses anteriores.
    const totalPreviousBalance = await calculateAllPreviousMonths(currentMonth, currentYear, userId);
    
    return totalPreviousBalance;
    
  } catch (error) {
    console.error('❌ Erro ao calcular saldos anteriores:', error);
    return null;
  }
}

// Calcular todos os meses anteriores
async function calculateAllPreviousMonths(
  currentMonth: number,
  currentYear: number,
  userId?: string
): Promise<number> {
  try {
    // Buscar todas as transações
    const allTransactions = await getAllTransactions(userId);
    
    let total = 0;
    
    for (const tx of allTransactions) {
      try {
        const date = new Date(tx.date);
        if (isNaN(date.getTime())) continue;
        
        const txYear = date.getFullYear();
        const txMonth = date.getMonth() + 1;
        
        // Verificar se a transação é de um mês anterior
        const isPreviousMonth = (
          txYear < currentYear || 
          (txYear === currentYear && txMonth < currentMonth)
        );
        
        if (isPreviousMonth) {
          total += getSignedAmount(tx, 'cashflow');
        }
      } catch (error) {
        console.error('Erro ao processar transação:', tx, error);
      }
    }
    
    console.log(`📊 Saldo de meses anteriores calculado: R$ ${total.toFixed(2)}`);
    return total;
    
  } catch (error) {
    console.error('❌ Erro no cálculo de meses anteriores:', error);
    return 0;
  }
}

/* ============================
   GERENCIAR SALDO ACUMULADO NO FIRESTORE
============================ */


interface AccumulatedBalance {
  month: number;      // Mês do saldo
  year: number;       // Ano do saldo
  balance: number;    // Saldo final do mês
  updatedAt: string;  // Quando foi atualizado
}

// Salvar saldo final do mês NO FIRESTORE
export async function saveMonthEndBalance(
  month: number, 
  year: number, 
  balance: number,
  userId?: string
): Promise<void> {
  try {
    if (!userId) {
      console.log('👤 Usuário não logado, salvando apenas localmente');
      saveToLocalStorage(month, year, balance);
      return;
    }
    
    console.log(`💾 Salvando saldo no Firestore para ${month}/${year}: R$ ${balance.toFixed(2)}`);
    
    // 1. Salvar no Firestore
    try {
      const balanceData = {
        month,
        year,
        balance,
        updatedAt: new Date().toISOString(),
        userId
      };
      
      // Usar uma coleção específica para saldos mensais
      const { getFirestore, doc, setDoc } = await import('firebase/firestore');
      const { getFirebaseApp } = await import('./firebaseService');
      
      const app = getFirebaseApp();
      if (!app) throw new Error('Firebase não inicializado');
      
      const db = getFirestore(app);
      
      // Criar ID único para o mês/ano
      const balanceId = `balance_${year}_${month.toString().padStart(2, '0')}`;
      const balanceRef = doc(db, 'users', userId, 'monthly_balances', balanceId);
      
      await setDoc(balanceRef, balanceData, { merge: true });
      console.log(`✅ Saldo salvo no Firestore: ${balanceId}`);
      
    } catch (firestoreError) {
      console.error('❌ Erro ao salvar no Firestore:', firestoreError);
      // Fallback para localStorage
      saveToLocalStorage(month, year, balance, userId);
      throw firestoreError;
    }
    
    // 2. Também salvar localmente como cache
    saveToLocalStorage(month, year, balance, userId);
    
  } catch (error) {
    console.error('❌ Erro ao salvar saldo final:', error);
    throw error;
  }
}

// Função auxiliar para salvar localmente
function saveToLocalStorage(
  month: number, 
  year: number, 
  balance: number,
  userId?: string
): void {
  try {
    const storageKey = userId 
      ? `@finances/monthly_balance_${userId}` 
      : '@finances/monthly_balance';
    
    // Carregar histórico existente
    const stored = localStorage.getItem(storageKey);
    const existingData: AccumulatedBalance[] = stored ? JSON.parse(stored) : [];
    
    // Encontrar ou criar entrada para este mês
    const existingIndex = existingData.findIndex(
      item => item.month === month && item.year === year
    );
    
    if (existingIndex >= 0) {
      existingData[existingIndex] = {
        month,
        year,
        balance,
        updatedAt: new Date().toISOString()
      };
    } else {
      existingData.push({
        month,
        year,
        balance,
        updatedAt: new Date().toISOString()
      });
    }
    
    // Manter apenas os últimos 12 meses
    const recentData = existingData
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      })
      .slice(0, 12);
    
    localStorage.setItem(storageKey, JSON.stringify(recentData));
    console.log(`📱 Saldo salvo localmente para ${month}/${year}`);
    
  } catch (error) {
    console.error('❌ Erro ao salvar localmente:', error);
  }
}

// Obter saldo de um mês específico (tenta Firestore primeiro)
export async function getBalanceForMonth(
  month: number,
  year: number,
  userId?: string
): Promise<number | null> {
  try {
    // 1. Tentar Firestore se tiver usuário
    if (userId) {
      try {
        const balance = await getBalanceFromFirestore(month, year, userId);
        if (balance !== null) {
          console.log(`🔥 Saldo carregado do Firestore: ${month}/${year} = R$ ${balance.toFixed(2)}`);
          return balance;
        }
      } catch (firestoreError) {
        console.warn('⚠️ Erro ao buscar do Firestore, tentando local:', firestoreError);
      }
    }
    
    // 2. Fallback para localStorage
    const balance = await getBalanceFromLocalStorage(month, year, userId);
    if (balance !== null) {
      console.log(`💾 Saldo carregado localmente: ${month}/${year} = R$ ${balance.toFixed(2)}`);
    }
    
    return balance;
    
  } catch (error) {
    console.error('❌ Erro ao buscar saldo do mês:', error);
    return null;
  }
}

// Buscar saldo do Firestore
async function getBalanceFromFirestore(
  month: number,
  year: number,
  userId: string
): Promise<number | null> {
  try {
    const { getFirestore, doc, getDoc } = await import('firebase/firestore');
    const { getFirebaseApp } = await import('./firebaseService');
    
    const app = getFirebaseApp();
    if (!app) return null;
    
    const db = getFirestore(app);
    
    // ID do documento
    const balanceId = `balance_${year}_${month.toString().padStart(2, '0')}`;
    const balanceRef = doc(db, 'users', userId, 'monthly_balances', balanceId);
    
    const docSnap = await getDoc(balanceRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.balance || null;
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Erro ao buscar do Firestore:', error);
    return null;
  }
}

// Buscar saldo do localStorage
async function getBalanceFromLocalStorage(
  month: number,
  year: number,
  userId?: string
): Promise<number | null> {
  try {
    const storageKey = userId 
      ? `@finances/monthly_balance_${userId}` 
      : '@finances/monthly_balance';
    
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      const data: AccumulatedBalance[] = JSON.parse(stored);
      const monthData = data.find(
        item => item.month === month && item.year === year
      );
      
      return monthData ? monthData.balance : null;
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Erro ao buscar localmente:', error);
    return null;
  }
}



// Função para sincronizar todos os saldos locais com Firestore
export async function syncAllBalancesToFirestore(userId: string): Promise<void> {
  try {
    console.log('🔄 Sincronizando saldos locais com Firestore...');
    
    const storageKey = `@finances/monthly_balance_${userId}`;
    const stored = localStorage.getItem(storageKey);
    
    if (!stored) {
      console.log('📭 Nenhum saldo local para sincronizar');
      return;
    }
    
    const localBalances: AccumulatedBalance[] = JSON.parse(stored);
    
    for (const balance of localBalances) {
      try {
        await saveMonthEndBalance(balance.month, balance.year, balance.balance, userId);
        console.log(`✅ Sincronizado: ${balance.month}/${balance.year}`);
      } catch (error) {
        console.warn(`⚠️ Erro ao sincronizar ${balance.month}/${balance.year}:`, error);
      }
    }
    
    console.log('🎉 Todos os saldos sincronizados com Firestore');
    
  } catch (error) {
    console.error('❌ Erro na sincronização geral:', error);
  }
}

// Função principal para calcular saldo disponível
export async function calculateAvailableBalance(
  currentMonth: number,
  currentYear: number,
  currentBalance: number,
  userId?: string
): Promise<{
  available: number;
  previousMonthBalance: number;
  previousMonth: number;
  previousYear: number;
}> {
  try {
    // 1. Verificar se estamos no início de um novo mês (primeiros 5 dias)
    const today = new Date();
    const isBeginningOfMonth = today.getDate() <= 5;
    
    if (isBeginningOfMonth) {
      console.log(`🌅 Início do mês detectado (dia ${today.getDate()})`);
      
      // 2. Buscar saldo do mês anterior
      const previousBalance = await getPreviousMonthBalance(currentMonth, currentYear, userId);
      
      if (previousBalance !== null && previousBalance !== 0) {
        // 3. Calcular mês anterior
        let prevMonth = currentMonth - 1;
        let prevYear = currentYear;
        
        if (prevMonth === 0) {
          prevMonth = 12;
          prevYear = currentYear - 1;
        }
        
        // 4. Somar saldo do mês anterior com saldo atual
        const totalBalance = previousBalance + currentBalance;
        
        console.log(`💰 Saldo anterior (${prevMonth}/${prevYear}): R$ ${previousBalance.toFixed(2)}`);
        console.log(`📊 Saldo atual (${currentMonth}/${currentYear}): R$ ${currentBalance.toFixed(2)}`);
        console.log(`✅ Total disponível: R$ ${totalBalance.toFixed(2)}`);
        
        return {
          available: totalBalance,
          previousMonthBalance: previousBalance,
          previousMonth: prevMonth,
          previousYear: prevYear
        };
      }
    }
    
    // Se não for início do mês ou não houver saldo anterior, usar apenas saldo atual
    console.log(`📅 Usando apenas saldo do mês atual: R$ ${currentBalance.toFixed(2)}`);
    
    return {
      available: currentBalance,
      previousMonthBalance: 0,
      previousMonth: 0,
      previousYear: 0
    };
    
  } catch (error) {
    console.error('❌ Erro ao calcular saldo disponível:', error);
    return {
      available: currentBalance,
      previousMonthBalance: 0,
      previousMonth: 0,
      previousYear: 0
    };
  }
}

// Forçar adicionar saldo do mês anterior
export async function forceAddPreviousMonthBalance(
  currentMonth: number,
  currentYear: number,
  userId?: string
): Promise<number | null> {
  try {
    const previousBalance = await getPreviousMonthBalance(currentMonth, currentYear, userId);
    
    if (previousBalance !== null) {
      let prevMonth = currentMonth - 1;
      let prevYear = currentYear;
      
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = currentYear - 1;
      }
      
      console.log(`🔧 Saldo anterior encontrado: ${prevMonth}/${prevYear} = R$ ${previousBalance.toFixed(2)}`);
      return previousBalance;
    }
    
    console.log('📭 Nenhum saldo anterior encontrado');
    return null;
    
  } catch (error) {
    console.error('❌ Erro ao buscar saldo anterior:', error);
    return null;
  }
}
/* ============================
   GOAL SERVICE (HÍBRIDO)
============================ */
export const getGoal = async () => {
  try {
    const goal = await getCurrentGoal();
    console.log('Meta carregada:', goal);
    return goal;
  } catch (error) {
    console.error('Erro ao carregar meta:', error);
    // Retorna meta padrão em caso de erro
    return {
      id: 1,
      name: "Minha Meta",
      target: 1000,
      saved: 0,
      createdAt: new Date().toISOString()
    };
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const saveGoal = async (goal: any) => {
  try {
    console.log('Salvando meta:', goal);
    await saveGoalToStorage(goal);
    console.log('Meta salva com sucesso');
  } catch (error) {
    console.error('Erro ao salvar meta:', error);
    throw error;
  }
};
