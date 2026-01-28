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
};


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
    
    // Verificar se há usuário logado no Firebase
    const user = firebaseService.getCurrentUser();
    let allTransactions: Transaction[] = [];
    
    if (user?.uid) {
      console.log(`👤 Usuário logado: ${user.uid}, buscando do Firestore`);
      
      // 🔥 PRIMEIRO: Buscar do Firestore
      const firestoreTransactions = await firebaseService.getUserTransactions(user.uid);
      console.log(`📊 ${firestoreTransactions.length} transações do Firestore`);
      
      // 🔥 SEGUNDO: Buscar do localStorage (para compatibilidade)
      const localTransactions = await getTransactions(user.uid); // Passa o userId
      console.log(`💾 ${localTransactions.length} transações do localStorage`);
      
      // 🔥 COMBINAR: Juntar ambas as fontes, dando prioridade ao Firestore
      const combinedTransactions = [...firestoreTransactions];
      
      // Adicionar transações locais que não estão no Firestore
      localTransactions.forEach(localTx => {
        if (!firestoreTransactions.some(remoteTx => remoteTx.id === localTx.id)) {
          combinedTransactions.push(localTx);
        }
      });
      
      allTransactions = combinedTransactions;
      console.log(`🔄 Total combinado: ${allTransactions.length} transações`);
      
      // 🔥 SINCRONIZAR: Se houver transações locais que não estão no Firestore
      const localOnlyTransactions = localTransactions.filter(localTx => 
        !firestoreTransactions.some(remoteTx => remoteTx.id === localTx.id)
      );
      
      if (localOnlyTransactions.length > 0 && user.uid) {
        console.log(`🔄 ${localOnlyTransactions.length} transações locais precisam ser sincronizadas`);
        // Sincronizar em background
        setTimeout(async () => {
          try {
            await firebaseService.syncTransactions(user.uid, localOnlyTransactions);
            console.log('✅ Transações locais sincronizadas com Firestore');
          } catch (error) {
            console.warn('⚠️ Erro ao sincronizar transações:', error);
          }
        }, 1000);
      }
      
    } else {
      // Usuário não logado - apenas do localStorage
      allTransactions = await getTransactions();
      console.log(`👤 Nenhum usuário logado, usando localStorage: ${allTransactions.length} transações`);
    }
    
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
export function calculateSummary(transactions: Transaction[]) {
  let income = 0;
  let expense = 0;

  console.log('Calculando resumo para', transactions?.length || 0, 'transações');

  // Se não houver transações, retorna zeros
  if (!transactions || !Array.isArray(transactions)) {
    console.log('Nenhuma transação para calcular resumo');
    return {
      income: 0,
      expense: 0,
      total: 0
    };
  }

  // Verifica se o array está vazio
  if (transactions.length === 0) {
    console.log('Array de transações vazio');
    return {
      income: 0,
      expense: 0,
      total: 0
    };
  }

  transactions.forEach(tx => {
    try {
      const amount = Math.abs(tx.amount || 0);
      
      if (tx.type === 'income') {
        income += amount;
        console.log(`+ Entrada: R$ ${amount} (${tx.description})`);
      } else if (tx.type === 'expense') {
        expense += amount;
        console.log(`- Despesa: R$ ${amount} (${tx.description})`);
      } else {
        console.warn('Tipo de transação desconhecido:', tx.type);
      }
    } catch (error) {
      console.error('Erro ao processar transação no resumo:', tx, error);
    }
  });

  const total = income - expense;
  console.log(`Resumo: Entradas: R$ ${income}, Saídas: R$ ${expense}, Total: R$ ${total}`);

  return {
    income,
    expense,
    total
  };
}

/* ============================
   ANNUAL SUMMARY (HÍBRIDO)
============================ */
export async function getAnnualSummary(
  year: number
): Promise<AnnualSummaryMonth[]> {
  try {
    console.log(`Buscando resumo anual para ${year}`);
    
    const allTransactions = await getTransactions();
    
    // Se não houver transações, retorna array com valores zerados
    if (!allTransactions || !Array.isArray(allTransactions) || allTransactions.length === 0) {
      console.log('Nenhuma transação para resumo anual, retornando meses zerados');
      return Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        income: 0,
        expense: 0,
        total: 0
      }));
    }

    const summary: AnnualSummaryMonth[] = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0,
      total: 0
    }));

    allTransactions.forEach(tx => {
      try {
        const date = new Date(tx.date);
        if (isNaN(date.getTime())) return;
        
        const y = date.getFullYear();
        const m = date.getMonth() + 1;

        if (y === year) {
          const amount = Math.abs(tx.amount || 0);
          if (tx.type === 'income') summary[m - 1].income += amount;
          else if (tx.type === 'expense') summary[m - 1].expense += amount;
        }
      } catch (error) {
        console.error('Erro ao processar transação no resumo anual:', tx, error);
      }
    });

    summary.forEach(m => {
      m.total = m.income - m.expense;
    });

    console.log(`Resumo anual ${year} calculado com sucesso`);
    return summary;
    
  } catch (error) {
    console.error('Erro em getAnnualSummary:', error);
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