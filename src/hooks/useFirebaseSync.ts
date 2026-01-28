/* eslint-disable @typescript-eslint/no-unused-vars */
// src/hooks/useFirebaseSync.ts - ESTRATÉGIA "FIRESTORE COMO MASTER"
import { useState, useCallback } from 'react';
import { firebaseService } from '../services/firebaseService';
import { getTransactions, getCurrentGoal, saveGoal, saveAllTransactions } from '../services/storageService';
import type { Transaction, Goal } from '../services/storageService';

interface SyncResult {
  success: boolean;
  message: string;
  stats: {
    downloaded: number;
    uploaded: number;
    merged: number;
  };
}

export const useFirebaseSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // FUNÇÃO PRINCIPAL: Firestore como fonte da verdade
  const syncData = useCallback(async (
    userId: string, 
    forceDownload = false
  ): Promise<SyncResult> => {
    if (isSyncing) {
      return {
        success: false,
        message: 'Sincronização já em andamento',
        stats: { downloaded: 0, uploaded: 0, merged: 0 }
      };
    }

    setIsSyncing(true);
    const result: SyncResult = {
      success: false,
      message: '',
      stats: { downloaded: 0, uploaded: 0, merged: 0 }
    };

    try {
      console.log('🔄 Firestore como fonte da verdade...');
      console.log('👤 Usuário:', userId);

      // 1. SEMPRE baixar dados do Firestore primeiro
      const remoteTransactions = await firebaseService.getUserTransactions(userId);
      const remoteGoal = await firebaseService.getUserGoal(userId);
      
      console.log(`☁️ Dados no Firestore: ${remoteTransactions.length} transações, meta: ${remoteGoal ? 'sim' : 'não'}`);

      // 2. Carregar dados locais
      const localTransactions = await getTransactions(userId);
      const localGoal = await getCurrentGoal();
      
      console.log(`📁 Dados locais: ${localTransactions.length} transações, meta: ${localGoal ? 'sim' : 'não'}`);

      let uploadedCount = 0;
      let mergedCount = 0;

      // 3. Se há dados locais que não estão no Firestore, enviá-los
      if (localTransactions.length > 0 && !forceDownload) {
        console.log('📤 Enviando transações locais para Firestore...');
        
        // Criar mapa rápido dos IDs remotos
        const remoteIds = new Set(remoteTransactions.map(tx => tx.id?.toString()));
        
        for (const localTx of localTransactions) {
          const localId = localTx.id?.toString();
          if (!localId || !remoteIds.has(localId)) {
            // Transação local não existe no Firestore → enviar
            try {
              const now = new Date().toISOString();
              const txToSend = {
                ...localTx,
                updatedAt: now,
                createdAt: localTx.createdAt || now,
                userId: userId
              };
              
              await firebaseService.addTransaction(txToSend, userId);
              uploadedCount++;
              console.log(`📤 Enviada: "${localTx.description?.substring(0, 30) || 'Sem descrição'}"`);
            } catch (error) {
              console.warn(`⚠️ Falha ao enviar transação:`, error);
            }
          }
        }
      }

      // 4. AGORA: Sobrescrever localStorage com dados do Firestore (mesclados)
      console.log('📥 Atualizando localStorage com dados do Firestore...');
      
      // Mesclar: priorizar Firestore, adicionar apenas locais que não existem
      const remoteMap = new Map(remoteTransactions.map(tx => [tx.id?.toString(), tx]));
      const mergedTransactions = [...remoteTransactions]; // Começa com tudo do Firestore
      
      // Adicionar locais que não existem no Firestore (apenas se ainda não foram enviados)
      if (!forceDownload) {
        for (const localTx of localTransactions) {
          const localId = localTx.id?.toString();
          if (localId && !remoteMap.has(localId)) {
            // Se não foi enviado ainda (pode ser transação offline recente)
            mergedTransactions.push(localTx);
            mergedCount++;
          }
        }
      }
      
      // Salvar MESCLADO no localStorage
      // Precisamos criar uma função saveAllTransactions:
      await saveAllTransactions(mergedTransactions, userId);
      
      // 5. Mesclar metas (Firestore tem prioridade)
      if (remoteGoal) {
        await saveGoal(remoteGoal);
        console.log('📥 Meta do Firestore salva localmente');
      } else if (localGoal) {
        // Se não tem meta no Firestore, enviar a local
        await firebaseService.syncGoal(userId, localGoal);
        console.log('📤 Meta local enviada para Firestore');
      }

      // 6. Atualizar timestamp
      const now = new Date();
      setLastSyncTime(now);
      localStorage.setItem('@finances/last_sync', now.toISOString());
      localStorage.setItem('@finances/last_sync_attempt', now.toISOString());

      // 7. Preparar resultado
      result.success = true;
      result.message = `✅ Firestore sincronizado! 📥${remoteTransactions.length} 📤${uploadedCount} 🧩${mergedCount}`;
      result.stats = {
        downloaded: remoteTransactions.length,
        uploaded: uploadedCount,
        merged: mergedCount
      };

      console.log(`✅ ${result.message}`);

    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      result.message = `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    } finally {
      setIsSyncing(false);
    }

    return result;
  }, [isSyncing]);

  // NOVA FUNÇÃO: Forçar download do Firestore (sobrescreve tudo)
  const forceDownloadFromFirestore = useCallback(async (userId: string): Promise<boolean> => {
    try {
      console.log('⬇️ Forçando download do Firestore...');
      
      // 1. Baixar tudo do Firestore
      const remoteTransactions = await firebaseService.getUserTransactions(userId);
      const remoteGoal = await firebaseService.getUserGoal(userId);
      
      // 2. Sobrescrever completamente o localStorage
      await saveAllTransactions(remoteTransactions, userId);
      
      if (remoteGoal) {
        await saveGoal(remoteGoal);
      }
      
      console.log(`✅ Download forçado: ${remoteTransactions.length} transações`);
      
      // 3. Atualizar timestamp
      setLastSyncTime(new Date());
      localStorage.setItem('@finances/last_sync', new Date().toISOString());
      
      return true;
    } catch (error) {
      console.error('❌ Erro no download forçado:', error);
      return false;
    }
  }, []);

  // Função para carregar dados iniciais (prioridade Firestore)
  const loadInitialData = useCallback(async (userId: string): Promise<boolean> => {
    try {
      console.log('🚀 Carregando dados iniciais (Firestore como master)...');
      
      // Tentar carregar do Firestore primeiro
      let transactions: Transaction[] = [];
      let goal: Goal | null = null;
      
      try {
        transactions = await firebaseService.getUserTransactions(userId);
        goal = await firebaseService.getUserGoal(userId);
        console.log(`☁️ ${transactions.length} transações do Firestore`);
      } catch (firestoreError) {
        console.warn('⚠️ Firestore indisponível, usando dados locais:', firestoreError);
        // Fallback para dados locais
        transactions = await getTransactions(userId);
        goal = await getCurrentGoal();
        console.log(`📁 ${transactions.length} transações locais (fallback)`);
      }
      
      // Salvar no localStorage (última etapa)
      await saveAllTransactions(transactions, userId);
      if (goal) {
        await saveGoal(goal);
      }
      
      console.log(`✅ ${transactions.length} transações carregadas`);
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados iniciais:', error);
      return false;
    }
  }, []);

  // Função para verificar se precisa sincronizar
  const shouldSync = useCallback((): boolean => {
    const lastSync = localStorage.getItem('@finances/last_sync');
    if (!lastSync) return true;
    
    const lastSyncDate = new Date(lastSync);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60);
    
    // Sincronizar a cada 10 minutos
    return diffMinutes >= 10;
  }, []);

  return {
    isSyncing,
    lastSyncTime,
    syncData,
    loadInitialData,
    shouldSync,
    forceDownloadFromFirestore
  };
};