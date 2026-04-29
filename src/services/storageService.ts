/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/storageService.ts

export type Transaction = {
  id?: number | string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string; // ISO
  createdAt?: string;
  updatedAt?: string; // ADICIONE ESTA LINHA
  userId?: string; // ADICIONE ESTA LINHA (opcional)
  transferType?: 'vault_deposit' | 'vault_withdrawal';
  excludeFromSummary?: boolean;
};

export type Goal = {
  id: number | string;
  name: string;
  target: number;
  saved: number;
  createdAt?: string;
  updatedAt?: string;
};

// ============================
// CONSTANTES
// ============================
const STORAGE_KEYS = {
  TRANSACTIONS: '@finances/transactions',
  GOAL: '@finances/goal',
  USER_ID: '@finances/user_id'
};

// ============================
// UTILITÁRIOS
// ============================

const generateId = (): string => {
  return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 🔥 ADICIONE ESTA FUNÇÃO (se ainda não existir)
export const getCurrentUserId = (): string | null => {
  try {
    return localStorage.getItem('@finances/user_id');
  } catch (error) {
    console.error('Erro ao obter ID do usuário:', error);
    return null;
  }
};

// 🔥 E ESTA FUNÇÃO PARA DEFINIR O USER ID
const setCurrentUserId = (userId: string): void => {
  try {
    localStorage.setItem('@finances/user_id', userId);
    console.log(`✅ User ID salvo no localStorage: ${userId}`);
  } catch (error) {
    console.error('Erro ao salvar ID do usuário:', error);
  }
};




export const saveAllTransactions = async (transactions: Transaction[], userId?: string): Promise<void> => {
  try {
    console.log(`💾 Salvando ${transactions.length} transações no localStorage...`);
    
    // Limpar possíveis duplicatas antes de salvar
    const uniqueTransactions = removeDuplicatesById(transactions);
    
    const storageKey = userId 
      ? `${STORAGE_KEYS.TRANSACTIONS}_${userId}`
      : STORAGE_KEYS.TRANSACTIONS;
    
    localStorage.setItem(storageKey, JSON.stringify(uniqueTransactions));
    console.log(`✅ ${uniqueTransactions.length} transações salvas (sem duplicatas)`);
    
    // Disparar evento de atualização
    window.dispatchEvent(new CustomEvent('transactionsUpdated', {
      detail: { count: uniqueTransactions.length, userId }
    }));
    
  } catch (error) {
    console.error('❌ Erro ao salvar todas as transações:', error);
    throw error;
  }
};

// Função auxiliar para remover duplicatas por ID
const removeDuplicatesById = (transactions: Transaction[]): Transaction[] => {
  const seenIds = new Set<string | number>();
  const unique: Transaction[] = [];
  
  for (const tx of transactions) {
    if (tx.id && !seenIds.has(tx.id)) {
      seenIds.add(tx.id);
      unique.push(tx);
    } else if (!tx.id) {
      // Transação sem ID - adicionar com ID gerado
      const txWithId = { ...tx, id: generateId() };
      unique.push(txWithId);
    }
  }
  
  const duplicatesRemoved = transactions.length - unique.length;
  if (duplicatesRemoved > 0) {
    console.log(`🧹 Removidas ${duplicatesRemoved} duplicatas por ID`);
  }
  
  return unique;
};


// ============================
// TRANSACTIONS (LOCAL)
// ============================
// src/services/storageService.ts - ATUALIZE A FUNÇÃO getTransactions

export const getTransactions = async (userId?: string): Promise<Transaction[]> => {
  try {
    console.log('📂 Buscando transações do localStorage...');
    
    // Se temos userId, buscar por usuário específico
    if (userId) {
      const userKey = `${STORAGE_KEYS.TRANSACTIONS}_${userId}`;
      const userStored = localStorage.getItem(userKey);
      
      if (userStored) {
        console.log(`✅ Transações encontradas para usuário ${userId}`);
        const parsed = JSON.parse(userStored);
        return Array.isArray(parsed) ? parsed : [];
      }
    }
    
    // Fallback: buscar transações globais (para compatibilidade)
    const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    console.log('📦 Dados brutos encontrados:', stored ? 'sim' : 'não');
    
    if (!stored) {
      console.log('📭 Nenhuma transação encontrada, retornando array vazio');
      return [];
    }
    
    const parsed = JSON.parse(stored);
    console.log(`✅ ${parsed.length} transações parseadas com sucesso`);
    
    if (!Array.isArray(parsed)) {
      console.warn('⚠️ Dados não são um array, retornando array vazio');
      return [];
    }
    
    return parsed;
  } catch (error) {
    console.error('❌ Erro ao carregar transações:', error);
    return [];
  }
};

// E também a função saveTransaction:
// src/services/storageService.ts - ATUALIZE saveTransaction
export const saveTransaction = async (transaction: Transaction, userId?: string): Promise<void> => {
  try {
    console.log('💾 Salvando transação no localStorage:', { transaction, userId });
    
    const txToSave = {
      ...transaction,
      id: transaction.id || generateFirestoreId(), // MUDANÇA AQUI
      createdAt: transaction.createdAt || new Date().toISOString()
    };
    
    console.log('📝 Transação processada:', txToSave);
    
    // Salvar na chave do usuário se userId fornecido
    if (userId) {
      const userKey = `${STORAGE_KEYS.TRANSACTIONS}_${userId}`;
      const existing = await getTransactions(userId);
      const updated = [txToSave, ...existing];
      localStorage.setItem(userKey, JSON.stringify(updated));
      console.log(`✅ Transação salva para usuário ${userId}`);
    }
    
    // Também salvar na chave global (para compatibilidade)
    const existingGlobal = await getTransactions(); // Sem userId
    const updatedGlobal = [txToSave, ...existingGlobal];
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedGlobal));
    console.log('✅ Transação também salva globalmente');
    
    // 🔥 NOVO: Tentar salvar no Firestore
    await trySaveToFirestore(txToSave, userId);
    
    window.dispatchEvent(new CustomEvent('transactionsUpdated', {
      detail: { count: updatedGlobal.length, userId }
    }));
    
  } catch (error) {
    console.error('❌ Erro ao salvar transação:', error);
    throw new Error('Falha ao salvar transação no localStorage');
  }
};

// Adicione esta função no mesmo arquivo:
// src/services/storageService.ts - CORRIJA A FUNÇÃO trySaveToFirestore
async function trySaveToFirestore(transaction: Transaction, userId?: string): Promise<void> {
  try {
    // Verificar se Firebase está disponível
    if (typeof window === 'undefined') return;
    
    // 🔥 CORREÇÃO: Usar variável local para não conflitar com parâmetro
    let firebaseUserId: string | null | undefined = userId;
    
    if (!firebaseUserId) {
      // Tentar do localStorage
      firebaseUserId = getCurrentUserId(); // Agora esta função existe
    }
    
    if (!firebaseUserId) {
      // Tentar do auth Firebase
      try {
        const authModule = await import('firebase/auth');
        const auth = authModule.getAuth();
        if (auth.currentUser) {
          firebaseUserId = auth.currentUser.uid;
          // Salvar no localStorage para uso futuro
          if (firebaseUserId) {
            setCurrentUserId(firebaseUserId);
          }
        }
      } catch (authError) {
        console.warn('⚠️ Não foi possível acessar auth Firebase:', authError);
      }
    }
    
    if (!firebaseUserId) {
      console.log('👤 Nenhum usuário logado, pulando Firestore');
      return;
    }
    
    console.log(`🔥 Salvando no Firestore para usuário: ${firebaseUserId}`);
    
    // Verificar se a transação tem ID no formato correto
    if (!transaction.id || !transaction.id.toString().startsWith('tx_')) {
      console.warn('⚠️ Transação sem ID compatível com Firestore, pulando');
      return;
    }
    
    try {
      // Importar dinamicamente para evitar erros de inicialização
      const firestoreModule = await import('firebase/firestore');
      const { getFirestore, doc, setDoc, Timestamp } = firestoreModule;
      
      // Obter app Firebase
      const { getFirebaseApp } = await import('./firebaseService');
      const app = getFirebaseApp();
      
      if (!app) {
        console.warn('⚠️ App Firebase não disponível');
        return;
      }
      
      const firestore = getFirestore(app);
      
      const txRef = doc(firestore, 'users', firebaseUserId, 'transactions', transaction.id.toString());
      
      const firestoreData = {
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        date: transaction.date,
        transferType: transaction.transferType || null,
        excludeFromSummary: transaction.excludeFromSummary === true,
        createdAt: transaction.createdAt || new Date().toISOString(),
        userId: firebaseUserId,
        updatedAt: new Date().toISOString(),
        syncedAt: Timestamp.now()
      };
      
      console.log('💾 Dados para Firestore:', firestoreData);
      await setDoc(txRef, firestoreData, { merge: true });
      console.log(`✅ Transação ${transaction.id} sincronizada com Firestore`);
      
    } catch (firestoreError) {
      console.warn('⚠️ Erro específico do Firestore:', firestoreError);
      throw firestoreError;
    }
    
  } catch (error) {
    console.warn('⚠️ Falha ao salvar no Firestore (modo offline):', error);
    // Não lança erro - continua em modo offline
  }
}

// Atualize a função generateId para compatibilidade com Firestore:
const generateFirestoreId = (): string => {
  return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};


// ============================
// GOAL (LOCAL)
// ============================
export const getCurrentGoal = async (): Promise<Goal | null> => {
  try {
    console.log('🎯 Buscando meta do localStorage...');
    
    const userId = getCurrentUserId();
    const storageKey = userId ? `${STORAGE_KEYS.GOAL}_${userId}` : STORAGE_KEYS.GOAL;
    
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      const goal = JSON.parse(stored);
      console.log('✅ Meta carregada:', goal);
      return goal;
    }
    
    // Meta padrão se não existir
    const defaultGoal: Goal = {
      id: generateId(),
      name: "Minha Primeira Meta",
      target: 5000,
      saved: 0,
      createdAt: new Date().toISOString()
    };
    
    console.log('📝 Nenhuma meta encontrada, usando padrão:', defaultGoal);
    return defaultGoal;
    
  } catch (error) {
    console.error('❌ Erro ao carregar meta:', error);
    // Retorna meta padrão em caso de erro
    return {
      id: generateId(),
      name: "Meta Padrão",
      target: 1000,
      saved: 0,
      createdAt: new Date().toISOString()
    };
  }
};

export const saveGoal = async (goal: Goal): Promise<void> => {
  try {
    console.log('💾 Salvando meta no localStorage:', goal);
    
    // Garantir timestamps
    const goalToSave = {
      ...goal,
      updatedAt: new Date().toISOString(),
      createdAt: goal.createdAt || new Date().toISOString()
    };
    
    const userId = getCurrentUserId();
    const storageKey = userId ? `${STORAGE_KEYS.GOAL}_${userId}` : STORAGE_KEYS.GOAL;
    
    localStorage.setItem(storageKey, JSON.stringify(goalToSave));
    console.log('✅ Meta salva com sucesso');
    
    // Disparar evento para atualizar UI
    window.dispatchEvent(new CustomEvent('goalUpdated', {
      detail: { goal: goalToSave }
    }));
    
  } catch (error) {
    console.error('❌ Erro ao salvar meta:', error);
    throw new Error('Falha ao salvar meta no localStorage');
  }
};

// ============================
// LIMPEZA/UTILIDADES
// ============================
export const clearAllData = (): void => {
  try {
    console.log('🧹 Limpando todos os dados do localStorage...');
    
    // Remover todas as chaves relacionadas ao app
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
      // Remover também versões por usuário
      for (let i = 0; i < localStorage.length; i++) {
        const storedKey = localStorage.key(i);
        if (storedKey && storedKey.startsWith(key)) {
          localStorage.removeItem(storedKey);
        }
      }
    });
    
    console.log('✅ Dados limpos com sucesso');
  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error);
  }
};

export const exportData = (): string => {
  try {
    const data = {
      transactions: localStorage.getItem(STORAGE_KEYS.TRANSACTIONS),
      goal: localStorage.getItem(STORAGE_KEYS.GOAL),
      timestamp: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('❌ Erro ao exportar dados:', error);
    return '{}';
  }
};

export const importData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.transactions) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, data.transactions);
    }
    
    if (data.goal) {
      localStorage.setItem(STORAGE_KEYS.GOAL, data.goal);
    }
    
    console.log('✅ Dados importados com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao importar dados:', error);
    return false;
  }
};

// ============================
// DEBUG/ESTATÍSTICAS
// ============================
export const getStorageStats = () => {
  try {
    const userId = getCurrentUserId();
    const transactionsKey = userId ? `${STORAGE_KEYS.TRANSACTIONS}_${userId}` : STORAGE_KEYS.TRANSACTIONS;
    const goalKey = userId ? `${STORAGE_KEYS.GOAL}_${userId}` : STORAGE_KEYS.GOAL;
    
    const transactions = JSON.parse(localStorage.getItem(transactionsKey) || '[]');
    const goal = JSON.parse(localStorage.getItem(goalKey) || 'null');
    
    return {
      transactionsCount: Array.isArray(transactions) ? transactions.length : 0,
      hasGoal: !!goal,
      goal: goal,
      localStorageUsage: `${Math.round((JSON.stringify(localStorage).length / 1024) * 100) / 100} KB`
    };
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    return {
      transactionsCount: 0,
      hasGoal: false,
      goal: null,
      localStorageUsage: '0 KB'
    };
  }
};
