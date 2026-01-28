// src/services/syncService.ts - ATUALIZAÇÃO COMPLETA

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Transaction, Goal } from './storageService';

// ============================
// INTERFACES
// ============================
export interface SyncResult {
  success: boolean;
  message: string;
  stats: {
    transactionsSynced: number;
    goalsSynced: number;
    conflictsResolved: number;
  };
}

export interface FirebaseService {
  getUserTransactions: (userId: string) => Promise<Transaction[]>;
  getUserGoal: (userId: string) => Promise<Goal | null>;
  syncTransactions: (userId: string, transactions: Transaction[]) => Promise<boolean>;
  syncGoal: (userId: string, goal: Goal) => Promise<boolean>;
}

// ============================
// CONSTANTES
// ============================
const SYNC_KEYS = {
  LAST_SYNC: '@finances/last_sync',
  LAST_SYNC_ATTEMPT: '@finances/last_sync_attempt'
};

// ============================
// CONTADOR DE CHAMADAS
// ============================
let syncCallCount = 0;
let lastSyncTime = 0;
const MAX_SYNC_CALLS = 5;
const SYNC_COOLDOWN_MS = 3000; // 3 segundos entre sincronizações

const canSync = (): boolean => {
  const now = Date.now();
  
  if (now - lastSyncTime < SYNC_COOLDOWN_MS) {
    console.log('⏸️  Em cooldown, aguardando...');
    return false;
  }
  
  if (syncCallCount >= MAX_SYNC_CALLS) {
    console.error('🚨 MÁXIMO DE SINCRONIZAÇÕES ATINGIDO!');
    return false;
  }
  
  return true;
};

const startSync = (): void => {
  syncCallCount++;
  lastSyncTime = Date.now();
  console.log(`📞 Chamada de sync #${syncCallCount}`);
};

const resetSyncCounter = (): void => {
  setTimeout(() => {
    syncCallCount = 0;
    console.log('🔄 Contador de sync resetado');
  }, 60000); // Reset a cada 60 segundos
};

// ============================
// FUNÇÃO PRINCIPAL DE SINCRONIZAÇÃO
// ============================
export const syncLocalDataToFirebase = async (
  firebaseService: FirebaseService,
  userId: string // ← AGORA ACEITA userId COMO PARÂMETRO
): Promise<SyncResult> => {
  const result: SyncResult = {
    success: false,
    message: '',
    stats: {
      transactionsSynced: 0,
      goalsSynced: 0,
      conflictsResolved: 0
    }
  };

  try {
    if (!userId) {
      result.message = 'Usuário não autenticado';
      return result;
    }

    console.log('🔄 Iniciando sincronização com Firebase...');
    console.log('👤 Usuário:', userId);

    // 1. Obter dados locais
    const localTransactions = await getLocalTransactions(userId);
    const localGoal = await getLocalGoal(userId);
    
    console.log(`📁 Dados locais: ${localTransactions.length} transações, meta: ${localGoal ? 'sim' : 'não'}`);

    // 2. Obter dados remotos
    let remoteTransactions: Transaction[] = [];
    let remoteGoal: Goal | null = null;
    
    try {
      remoteTransactions = await firebaseService.getUserTransactions(userId);
      console.log(`☁️ Dados remotos: ${remoteTransactions.length} transações`);
    } catch (error) {
      console.warn('⚠️ Não foi possível obter transações remotas:', error);
    }
    
    try {
      remoteGoal = await firebaseService.getUserGoal(userId);
      console.log(`☁️ Meta remota: ${remoteGoal ? 'encontrada' : 'não encontrada'}`);
    } catch (error) {
      console.warn('⚠️ Não foi possível obter meta remota:', error);
    }

    // 3. Mesclar dados
    const transactionsToSync = mergeArrays(localTransactions, remoteTransactions);
    
    // 4. Sincronizar transações
    if (transactionsToSync.length > 0) {
      console.log(`🔄 Sincronizando ${transactionsToSync.length} transações...`);
      try {
        const syncSuccess = await firebaseService.syncTransactions(userId, transactionsToSync);
        
        if (syncSuccess) {
          result.stats.transactionsSynced = transactionsToSync.length;
          console.log('✅ Transações sincronizadas com Firebase');
        } else {
          console.error('❌ Falha ao sincronizar transações');
        }
      } catch (error) {
        console.error('❌ Erro ao sincronizar transações:', error);
      }
    } else {
      console.log('📭 Nenhuma transação para sincronizar');
    }

    // 5. Sincronizar meta
    let goalToSync = localGoal;
    if (remoteGoal && localGoal) {
      // Usar a meta mais recente
      const localDate = new Date(localGoal.updatedAt || localGoal.createdAt || 0);
      const remoteDate = new Date(remoteGoal.updatedAt || remoteGoal.createdAt || 0);
      
      if (remoteDate > localDate) {
        goalToSync = remoteGoal;
        console.log('☁️ Usando meta remota (mais recente)');
      }
    }
    
    if (goalToSync) {
      console.log(`🎯 Sincronizando meta: "${goalToSync.name}"`);
      try {
        const goalSuccess = await firebaseService.syncGoal(userId, goalToSync);
        
        if (goalSuccess) {
          result.stats.goalsSynced = 1;
          console.log('✅ Meta sincronizada com Firebase');
        } else {
          console.error('❌ Falha ao sincronizar meta');
        }
      } catch (error) {
        console.error('❌ Erro ao sincronizar meta:', error);
      }
    }

    // 6. Atualizar último sync
    await updateLastSync();
    
    result.success = true;
    result.message = `Sincronização concluída: ${result.stats.transactionsSynced} transações, ${result.stats.goalsSynced} meta(s)`;
    console.log('✅ Sincronização concluída com sucesso');

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro na sincronização:', error);
    result.message = `Erro: ${errorMessage}`;
  }

  return result;
};

// ============================
// FUNÇÕES AUXILIARES
// ============================
const getLocalTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const storageKey = `@finances/transactions_${userId}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
    return [];
  } catch (error) {
    console.error('Erro ao obter transações locais:', error);
    return [];
  }
};

const getLocalGoal = async (userId: string): Promise<Goal | null> => {
  try {
    const storageKey = `@finances/goal_${userId}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    console.error('Erro ao obter meta local:', error);
    return null;
  }
};

const mergeArrays = (arr1: Transaction[], arr2: Transaction[]): Transaction[] => {
  const merged = new Map<string | number, Transaction>();
  
  arr1.forEach((item: Transaction) => {
    if (item.id) {
      merged.set(item.id, item);
    }
  });
  
  arr2.forEach((item: Transaction) => {
    if (item.id) {
      const existing = merged.get(item.id);
      if (!existing || isNewer(item, existing)) {
        merged.set(item.id, item);
      }
    }
  });
  
  return Array.from(merged.values());
};

const isNewer = (item1: Transaction, item2: Transaction): boolean => {
  const date1 = new Date(item1.createdAt || item1.date || 0);
  const date2 = new Date(item2.createdAt || item2.date || 0);
  return date1 > date2;
};

const updateLastSync = async (): Promise<void> => {
  try {
    const now = new Date();
    localStorage.setItem(SYNC_KEYS.LAST_SYNC, now.toISOString());
    localStorage.setItem(SYNC_KEYS.LAST_SYNC_ATTEMPT, now.toISOString());
  } catch (error) {
    console.error('Erro ao atualizar último sync:', error);
  }
};

// ============================
// FUNÇÃO DE SINCRONIZAÇÃO SEGURA
// ============================
export const syncWithUserId = async (
  firebaseService: FirebaseService,
  userId: string
): Promise<SyncResult> => {
  if (!userId) {
    return {
      success: false,
      message: 'Usuário não autenticado',
      stats: { transactionsSynced: 0, goalsSynced: 0, conflictsResolved: 0 }
    };
  }
  
  if (!canSync()) {
    return {
      success: false,
      message: 'Aguarde antes de sincronizar novamente',
      stats: { transactionsSynced: 0, goalsSynced: 0, conflictsResolved: 0 }
    };
  }
  
  startSync();
  
  try {
    console.log('🔄 Sincronizando com userId:', userId);
    const result = await syncLocalDataToFirebase(firebaseService, userId);
    resetSyncCounter();
    return result;
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    resetSyncCounter();
    return {
      success: false,
      message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      stats: { transactionsSynced: 0, goalsSynced: 0, conflictsResolved: 0 }
    };
  }
};

// ============================
// MOCK SERVICE (para desenvolvimento)
// ============================
export const mockFirebaseService: FirebaseService = {
  getUserTransactions: async (userId: string): Promise<Transaction[]> => {
    console.log(`📊 Mock: Buscando transações do usuário ${userId}`);
    return [];
  },
  
  getUserGoal: async (userId: string): Promise<Goal | null> => {
    console.log(`🎯 Mock: Buscando meta do usuário ${userId}`);
    return null;
  },
  
  syncTransactions: async (userId: string, transactions: Transaction[]): Promise<boolean> => {
    console.log(`🔄 Mock: Sincronizando ${transactions.length} transações para ${userId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  },
  
  syncGoal: async (userId: string, goal: Goal): Promise<boolean> => {
    console.log(`🎯 Mock: Sincronizando meta "${goal.name}" para ${userId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }
};