// src/scripts/migrateCofreTransactions.ts
/*import { getTransactions, saveAllTransactions } from '../services/storageService';
import type { Transaction } from '../types/Transaction';

export async function migrateExistingCofreTransactions() {
  try {
    console.log('🔄 Iniciando migração de transações do cofre...');
    
    const transactions = await getTransactions();
    let modified = 0;
    
    const updatedTransactions: Transaction[] = transactions.map(tx => {
      if (tx.category === 'Cofre' && tx.type !== 'cofre_movement') {
        modified++;
        
        const movementType = tx.description?.toLowerCase().includes('retirada') 
          ? 'withdrawal' 
          : 'deposit';
        
        return {
          ...tx,
          type: 'cofre_movement',
          movementType: movementType as 'deposit' | 'withdrawal'
        };
      }
      return tx;
    });
    
    if (modified > 0) {
      await saveAllTransactions(updatedTransactions);
      console.log(`✅ ${modified} transações do cofre migradas com sucesso!`);
    } else {
      console.log('📭 Nenhuma transação do cofre para migrar');
    }
    
    return modified;
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  }
}*/