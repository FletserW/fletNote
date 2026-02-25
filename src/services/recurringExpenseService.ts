// src/services/recurringExpenseService.ts - ARQUIVO COMPLETO COM EXPORTS
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  Timestamp,
  Firestore 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirebaseApp, getFirestoreDb } from './firebaseService';
import { saveTransaction, getCurrentUserId } from './storageService';
import type { RecurringExpense, RecurringExpenseLog, RecurringStats } from '../types/RecurringExpense';
import type { Transaction } from '../types/Transaction';

// ============================
// CONSTANTES
// ============================
const STORAGE_KEYS = {
  RECURRING: '@finances/recurring_expenses',
  RECURRING_LOGS: '@finances/recurring_logs'
};

// ============================
// UTILITÁRIOS
// ============================
const generateId = (): string => {
  return `re_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ============================
// FUNÇÃO PARA OBTER FIRESTORE (CORRIGIDA)
// ============================
const getFirestoreInstance = (): Firestore | null => {
  try {
    const app = getFirebaseApp();
    if (!app) {
      console.error('❌ Firebase App não inicializado');
      return null;
    }
    return getFirestore(app);
  } catch (error) {
    console.error('❌ Erro ao obter Firestore:', error);
    return null;
  }
};

// ============================
// FUNÇÃO PARA OBTER USUÁRIO ATUAL
// ============================
const getCurrentFirebaseUser = (): string | null => {
  try {
    const auth = getAuth();
    return auth.currentUser?.uid || null;
  } catch (error) {
    console.error('❌ Erro ao obter usuário atual:', error);
    return null;
  }
};


// ============================
// CRUD COMPLETO COM FIREBASE
// ============================

export const saveRecurringExpense = async (expense: RecurringExpense): Promise<void> => {
  try {
    // 1. Obter ID do usuário de múltiplas fontes
    const localStorageUserId = getCurrentUserId();
    const firebaseUserId = getCurrentFirebaseUser();
    const userId = firebaseUserId || localStorageUserId;
    
    console.log('👤 Usuário para save:', { localStorageUserId, firebaseUserId, final: userId });

    const expenseToSave = {
      ...expense,
      id: expense.id || generateId(),
      createdAt: expense.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: userId || undefined
    };

    console.log('💾 Salvando despesa fixa:', expenseToSave);

    // 2. SEMPRE salvar no localStorage primeiro
    const storageKey = userId 
      ? `${STORAGE_KEYS.RECURRING}_${userId}`
      : STORAGE_KEYS.RECURRING;
    
    const existing = await getRecurringExpenses();
    const updated = existing.filter(e => e.id !== expenseToSave.id);
    updated.push(expenseToSave);
    
    localStorage.setItem(storageKey, JSON.stringify(updated));
    console.log('✅ Despesa fixa salva localmente');

    // 3. Tentar salvar no Firestore (SE tiver usuário)
    if (firebaseUserId) {
      try {
        console.log(`🔥 TENTANDO salvar no Firestore para usuário: ${firebaseUserId}`);
        
        const db = getFirestoreInstance();
        if (!db) {
          console.error('❌ Firestore não disponível');
          return;
        }

        // Criar referência do documento
        const expenseRef = doc(db, 'users', firebaseUserId, 'recurring_expenses', expenseToSave.id!);
        
        // Preparar dados para o Firestore
        const firestoreData = {
          name: expenseToSave.name,
          amount: expenseToSave.amount,
          category: expenseToSave.category,
          dueDay: expenseToSave.dueDay,
          paymentMethod: expenseToSave.paymentMethod,
          cardId: expenseToSave.cardId || null,
          recurrenceType: expenseToSave.recurrenceType,
          recurrenceInterval: expenseToSave.recurrenceInterval || null,
          startDate: expenseToSave.startDate,
          endDate: expenseToSave.endDate || null,
          installments: expenseToSave.installments || null,
          installmentsPaid: expenseToSave.installmentsPaid || 0,
          priority: expenseToSave.priority,
          autoPay: expenseToSave.autoPay,
          status: expenseToSave.status,
          notes: expenseToSave.notes || null,
          createdAt: expenseToSave.createdAt,
          updatedAt: expenseToSave.updatedAt,
          userId: firebaseUserId,
          syncedAt: Timestamp.now()
        };

        console.log('📤 Enviando para Firestore:', firestoreData);
        
        // Salvar no Firestore
        await setDoc(expenseRef, firestoreData, { merge: true });
        
        console.log('✅✅✅ SUCESSO! Despesa fixa salva no Firestore!');
        
        // Verificar se salvou
        const verifyRef = doc(db, 'users', firebaseUserId, 'recurring_expenses', expenseToSave.id!);
        const { getDoc } = await import('firebase/firestore');
        const verifySnap = await getDoc(verifyRef);
        
        if (verifySnap.exists()) {
          console.log('🔍 Verificação: Documento existe no Firestore');
        } else {
          console.error('❌ Verificação: Documento NÃO encontrado após salvar');
        }
        
      } catch (error) {
        console.error('❌ ERRO CRÍTICO ao salvar no Firestore:', error);
        console.error('Detalhes do erro:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    } else {
      console.log('👤 Usuário não logado no Firebase, salvando apenas localmente');
    }

    window.dispatchEvent(new CustomEvent('recurringUpdated'));
    
  } catch (error) {
    console.error('❌ Erro ao salvar despesa fixa:', error);
    throw error;
  }
};

export const getRecurringExpenses = async (): Promise<RecurringExpense[]> => {
  try {
    // Obter ID do usuário
    const localStorageUserId = getCurrentUserId();
    const firebaseUserId = getCurrentFirebaseUser();
    const userId = firebaseUserId || localStorageUserId;
    
    const storageKey = userId 
      ? `${STORAGE_KEYS.RECURRING}_${userId}`
      : STORAGE_KEYS.RECURRING;
    
    let expenses: RecurringExpense[] = [];
    
    // 1. SEMPRE buscar do Firestore primeiro se estiver logado no Firebase
    if (firebaseUserId) {
      try {
        console.log(`🔥 Buscando despesas fixas do Firestore para: ${firebaseUserId}`);
        
        const db = getFirestoreInstance();
        if (db) {
          const expensesRef = collection(db, 'users', firebaseUserId, 'recurring_expenses');
          const snapshot = await getDocs(expensesRef);
          
          if (!snapshot.empty) {
            console.log(`📥 Encontradas ${snapshot.size} despesas no Firestore`);
            
            snapshot.forEach(doc => {
              const data = doc.data();
              expenses.push({
                ...data,
                id: doc.id,
                cardId: data.cardId || undefined,
                recurrenceInterval: data.recurrenceInterval || undefined,
                endDate: data.endDate || undefined,
                installments: data.installments || undefined,
                notes: data.notes || undefined
              } as RecurringExpense);
            });
            
            console.log(`✅ ${expenses.length} despesas fixas carregadas do Firestore`);
            
            // Salvar no localStorage para cache
            localStorage.setItem(storageKey, JSON.stringify(expenses));
            
            return expenses;
          } else {
            console.log('📭 Nenhuma despesa fixa encontrada no Firestore');
          }
        }
      } catch (error) {
        console.error('❌ Erro ao buscar do Firestore:', error);
      }
    }
    
    // 2. Fallback para localStorage
    console.log('💾 Buscando despesas fixas do localStorage...');
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        expenses = JSON.parse(stored);
        console.log(`✅ ${expenses.length} despesas fixas carregadas do localStorage`);
      } catch (e) {
        console.error('Erro ao parsear localStorage:', e);
      }
    }
    
    return expenses;
    
  } catch (error) {
    console.error('❌ Erro ao buscar despesas fixas:', error);
    return [];
  }
};

// ============================
// FUNÇÃO DELETE
// ============================
export const deleteRecurringExpense = async (id: string): Promise<void> => {
  try {
    console.log(`🗑️ Deletando despesa fixa: ${id}`);
    
    const localStorageUserId = getCurrentUserId();
    const firebaseUserId = getCurrentFirebaseUser();
    const userId = firebaseUserId || localStorageUserId;
    
    // 1. Remover do localStorage
    const expenses = await getRecurringExpenses();
    const updated = expenses.filter(e => e.id !== id);
    
    const storageKey = userId 
      ? `${STORAGE_KEYS.RECURRING}_${userId}`
      : STORAGE_KEYS.RECURRING;
    
    localStorage.setItem(storageKey, JSON.stringify(updated));
    console.log('✅ Removida do localStorage');
    
    // 2. Remover do Firestore
    if (firebaseUserId) {
      try {
        const db = getFirestoreInstance();
        if (db) {
          console.log(`🔥 Removendo do Firestore: ${firebaseUserId}/recurring_expenses/${id}`);
          
          const expenseRef = doc(db, 'users', firebaseUserId, 'recurring_expenses', id);
          await deleteDoc(expenseRef);
          
          console.log('✅ Removida do Firestore');
        }
      } catch (error) {
        console.warn('⚠️ Erro ao deletar do Firestore:', error);
      }
    }
    
    window.dispatchEvent(new CustomEvent('recurringUpdated'));
    
  } catch (error) {
    console.error('❌ Erro ao deletar despesa fixa:', error);
    throw error;
  }
};

// ============================
// LOGS
// ============================
export const saveRecurringLog = async (log: RecurringExpenseLog): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const cleanUserId = userId !== null ? userId : undefined;
    
    const logToSave = {
      ...log,
      id: log.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: log.createdAt || new Date().toISOString()
    };
    
    // Salvar no localStorage
    const storageKey = cleanUserId 
      ? `${STORAGE_KEYS.RECURRING_LOGS}_${cleanUserId}`
      : STORAGE_KEYS.RECURRING_LOGS;
    
    const existing = await getRecurringLogs();
    const updated = [logToSave, ...existing];
    
    localStorage.setItem(storageKey, JSON.stringify(updated));
    
    // Salvar no Firestore
    if (cleanUserId) {
      try {
        const db = getFirestoreDb();
        if (db) {
          const logRef = doc(db, 'users', cleanUserId, 'recurring_logs', logToSave.id!);
          await setDoc(logRef, {
            ...logToSave,
            syncedAt: Timestamp.now()
          });
          console.log('✅ Log salvo no Firestore');
        }
      } catch (error) {
        console.warn('⚠️ Erro ao salvar log no Firestore:', error);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao salvar log:', error);
  }
};

export const getRecurringLogs = async (): Promise<RecurringExpenseLog[]> => {
  try {
    const userId = getCurrentUserId();
    const cleanUserId = userId !== null ? userId : undefined;
    
    const storageKey = cleanUserId 
      ? `${STORAGE_KEYS.RECURRING_LOGS}_${cleanUserId}`
      : STORAGE_KEYS.RECURRING_LOGS;
    
    // Buscar do Firestore primeiro
    if (cleanUserId) {
      try {
        const db = getFirestoreDb();
        if (db) {
          const logsRef = collection(db, 'users', cleanUserId, 'recurring_logs');
          const snapshot = await getDocs(logsRef);
          
          if (!snapshot.empty) {
            const logs: RecurringExpenseLog[] = [];
            snapshot.forEach(doc => {
              const data = doc.data();
              logs.push({
                ...data,
                id: doc.id
              } as RecurringExpenseLog);
            });
            
            // Salvar no localStorage
            localStorage.setItem(storageKey, JSON.stringify(logs));
            
            return logs;
          }
        }
      } catch (error) {
        console.warn('⚠️ Erro ao buscar logs do Firestore:', error);
      }
    }
    
    // Fallback para localStorage
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return JSON.parse(stored);
    }
    
    return [];
  } catch (error) {
    console.error('❌ Erro ao buscar logs:', error);
    return [];
  }
};

// ============================
// PROCESSAMENTO
// ============================
export const processDueRecurringExpenses = async (): Promise<{
  processed: number;
  transactions: Transaction[];
}> => {
  try {
    console.log('🔄 Processando despesas fixas...');
    
    const expenses = await getRecurringExpenses();
    const today = new Date();
    const currentDay = today.getDate();
    
    const processed: Transaction[] = [];
    
    for (const expense of expenses) {
      if (expense.status !== 'active') continue;
      
      const startDate = new Date(expense.startDate);
      if (startDate > today) continue;
      
      if (expense.endDate) {
        const endDate = new Date(expense.endDate);
        if (endDate < today) continue;
      }
      
      if (expense.dueDay === currentDay) {
        console.log(`📅 Processando: ${expense.name} - R$ ${expense.amount}`);
        
        const alreadyProcessed = await wasProcessedToday(expense.id!);
        if (alreadyProcessed) {
          console.log(`⏭️  ${expense.name} já foi processada hoje`);
          continue;
        }
        
        // ID como string garantida
        const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const transaction: Transaction = {
          id: transactionId,
          type: 'expense',
          amount: expense.amount,
          category: expense.category,
          description: `${expense.name} - ${expense.paymentMethod === 'credit_card' ? 'Cartão' : 'Débito'}`,
          date: today.toISOString(),
          createdAt: new Date().toISOString()
        };
        
        await saveTransaction(transaction, getCurrentUserId() || undefined);
        processed.push(transaction);
        
        // Usar transactionId que é string
        await saveRecurringLog({
          recurringId: expense.id!,
          dueDate: today.toISOString(),
          amount: expense.amount,
          status: expense.autoPay ? 'paid' : 'pending',
          transactionId: transactionId
        });
        
        if (expense.installments && expense.installmentsPaid !== undefined) {
          const updatedExpense = { ...expense };
          updatedExpense.installmentsPaid = (updatedExpense.installmentsPaid || 0) + 1;
          
          if (updatedExpense.installmentsPaid >= (updatedExpense.installments || 0)) {
            updatedExpense.status = 'cancelled';
          }
          
          await saveRecurringExpense(updatedExpense);
        }
      }
    }
    
    console.log(`✅ ${processed.length} despesas processadas`);
    return { processed: processed.length, transactions: processed };
    
  } catch (error) {
    console.error('❌ Erro ao processar despesas fixas:', error);
    return { processed: 0, transactions: [] };
  }
};

const wasProcessedToday = async (recurringId: string): Promise<boolean> => {
  try {
    const logs = await getRecurringLogs();
    const today = new Date().toDateString();
    
    return logs.some(log => {
      const logDate = new Date(log.dueDate).toDateString();
      return log.recurringId === recurringId && logDate === today;
    });
  } catch (error) {
    console.error('❌ Erro ao verificar logs:', error);
    return false;
  }
};

// ============================
// ESTATÍSTICAS
// ============================
export const getRecurringStats = async (): Promise<RecurringStats> => {
  try {
    const expenses = await getRecurringExpenses();
    const today = new Date();
    
    const stats: RecurringStats = {
      totalMonthly: 0,
      totalEssential: 0,
      totalImportant: 0,
      totalOptional: 0,
      upcomingCount: 0,
      overdueCount: 0,
      paidThisMonth: 0,
      pendingThisMonth: 0,
      byCategory: {},
      byPaymentMethod: {}
    };
    
    expenses.forEach(exp => {
      if (exp.status === 'active') {
        stats.totalMonthly += exp.amount;
        
        if (exp.priority === 'essential') stats.totalEssential += exp.amount;
        if (exp.priority === 'important') stats.totalImportant += exp.amount;
        if (exp.priority === 'optional') stats.totalOptional += exp.amount;
        
        stats.byCategory[exp.category] = (stats.byCategory[exp.category] || 0) + exp.amount;
        stats.byPaymentMethod[exp.paymentMethod] = (stats.byPaymentMethod[exp.paymentMethod] || 0) + exp.amount;
        
        const dueDay = exp.dueDay;
        if (dueDay >= today.getDate() && dueDay <= today.getDate() + 7) {
          stats.upcomingCount++;
        }
      }
    });
    
    const logs = await getRecurringLogs();
    logs.forEach(log => {
      const logDate = new Date(log.dueDate);
      if (logDate.getMonth() === today.getMonth() && logDate.getFullYear() === today.getFullYear()) {
        if (log.status === 'paid') stats.paidThisMonth++;
        if (log.status === 'pending') stats.pendingThisMonth++;
      }
    });
    
    return stats;
    
  } catch (error) {
    console.error('❌ Erro ao calcular estatísticas:', error);
    return {
      totalMonthly: 0,
      totalEssential: 0,
      totalImportant: 0,
      totalOptional: 0,
      upcomingCount: 0,
      overdueCount: 0,
      paidThisMonth: 0,
      pendingThisMonth: 0,
      byCategory: {},
      byPaymentMethod: {}
    };
  }
};

export const checkOverdueExpenses = async (): Promise<RecurringExpenseLog[]> => {
  try {
    const logs = await getRecurringLogs();
    const today = new Date();
    const overdue: RecurringExpenseLog[] = [];
    
    logs.forEach(log => {
      if (log.status === 'pending') {
        const dueDate = new Date(log.dueDate);
        if (dueDate < today) {
          overdue.push(log);
        }
      }
    });
    
    return overdue;
  } catch (error) {
    console.error('❌ Erro ao verificar vencidos:', error);
    return [];
  }
};

