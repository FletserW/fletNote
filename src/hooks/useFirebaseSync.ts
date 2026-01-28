// src/hooks/useFirebaseSync.ts - ATUALIZADO
import { useState, useCallback } from 'react';
import { firebaseService } from '../services/firebaseService';
import { syncWithUserId, type SyncResult } from '../services/syncService';

export const useFirebaseSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const syncData = useCallback(async (userId: string): Promise<SyncResult> => {
    if (!userId) {
      return {
        success: false,
        message: 'Usuário não autenticado',
        stats: { transactionsSynced: 0, goalsSynced: 0, conflictsResolved: 0 }
      };
    }

    setIsSyncing(true);
    
    try {
      console.log('🔄 Sincronizando dados para usuário:', userId);
      
      const result = await syncWithUserId(firebaseService, userId);
      
      setLastSyncResult(result);
      return result;
      
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      const errorResult: SyncResult = {
        success: false,
        message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        stats: { transactionsSynced: 0, goalsSynced: 0, conflictsResolved: 0 }
      };
      setLastSyncResult(errorResult);
      return errorResult;
      
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    isSyncing,
    lastSyncResult,
    syncData
  };
};