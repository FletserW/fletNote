// src/services/firebaseService.ts - VERSÃO CORRIGIDA
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  type Firestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  Timestamp,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import type { Transaction, Goal } from './storageService';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAJPxldozWGXPtjdYs4vFWEfv3-9PZqVwQ",
  authDomain: "fletnote.firebaseapp.com",
  projectId: "fletnote",
  storageBucket: "fletnote.firebasestorage.app",
  messagingSenderId: "436047979950",
  appId: "1:436047979950:web:08fb16c668eaf557d7d43f",
  measurementId: "G-1CV80ZBK4H"
};

// Variáveis globais
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

// ============================
// INICIALIZAÇÃO DO FIREBASE
// ============================
export const initializeFirebase = (): boolean => {
  try {
    console.log('🔧 Inicializando Firebase...');
    console.log('📋 Configuração:', {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain
    });
    
    // Verificar se já está inicializado
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
      console.log('✅ Firebase já inicializado');
    } else {
      // Inicializar nova instância
      app = initializeApp(firebaseConfig);
      console.log('✅ Nova instância do Firebase inicializada');
    }
    
    // Inicializar Firestore
    if (app) {
      db = getFirestore(app);
      console.log('✅ Firestore inicializado');
      
      // Habilitar persistência offline
      try {
        enableIndexedDbPersistence(db)
          .then(() => console.log('✅ Persistência offline habilitada'))
          .catch(err => {
            if (err.code === 'failed-precondition') {
              console.log('ℹ️  Persistência já ativada em outra aba');
            } else if (err.code === 'unimplemented') {
              console.log('ℹ️  Navegador não suporta persistência');
            } else {
              console.warn('⚠️  Erro ao habilitar persistência:', err);
            }
          });
      } catch (error) {
        console.warn('⚠️  Não foi possível habilitar persistência:', error);
      }
    }
    
    // Inicializar Auth
    auth = getAuth(app);
    console.log('✅ Auth inicializado');
    
    console.log('🎉 Firebase inicializado com sucesso!');
    return true;
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO ao inicializar Firebase:', error);
    console.error('Detalhes do erro:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
};

// ============================
// GETTERS SEGUROS
// ============================
export const getFirebaseApp = (): FirebaseApp | undefined => {
  if (!app) {
    const initialized = initializeFirebase();
    if (!initialized) return undefined;
  }
  return app;
};

export const getFirestoreDb = (): Firestore | undefined => {
  if (!db) {
    const initialized = initializeFirebase();
    if (!initialized) return undefined;
  }
  return db;
};

export const getFirebaseAuth = (): Auth | undefined => {
  if (!auth) {
    const initialized = initializeFirebase();
    if (!initialized) return undefined;
  }
  return auth;
};

// ============================
// SERVIÇOS DE TRANSAÇÕES
// ============================
export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const firestore = getFirestoreDb();
    if (!firestore || !userId) {
      console.warn('Firestore não inicializado ou userId inválido');
      return [];
    }
    
    console.log(`📊 Buscando transações do usuário: ${userId}`);
    const transactionsRef = collection(firestore, 'users', userId, 'transactions');
    const snapshot = await getDocs(transactionsRef);
    
    const transactions: Transaction[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        type: data.type as 'income' | 'expense',
        amount: data.amount,
        category: data.category,
        description: data.description,
        date: data.date,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt, // ADICIONE ESTA LINHA
  userId: data.userId // ADICIONE ESTA LINHA (opcional)

      });
    });
    
    console.log(`✅ ${transactions.length} transações carregadas do Firebase`);
    return transactions;
  } catch (error) {
    console.error('❌ Erro ao carregar transações do Firebase:', error);
    return [];
  }
};

export const syncTransactions = async (userId: string, transactions: Transaction[]): Promise<boolean> => {
  try {
    const firestore = getFirestoreDb();
    if (!firestore || !userId) {
      console.error('Firestore não inicializado ou userId inválido');
      return false;
    }
    
    console.log(`🔄 Sincronizando ${transactions.length} transações para Firebase...`);
    
    if (transactions.length === 0) {
      console.log('📭 Nenhuma transação para sincronizar');
      return true;
    }
    
    // Para cada transação, salva no Firestore
    for (const tx of transactions) {
      const txId = tx.id?.toString() || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const txRef = doc(firestore, 'users', userId, 'transactions', txId);
      
      const txData = {
        type: tx.type,
        amount: tx.amount,
        category: tx.category,
        description: tx.description || '',
        date: tx.date,
        createdAt: tx.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncedAt: Timestamp.now()
      };
      
      console.log(`💾 Salvando transação ${txId}:`, txData);
      await setDoc(txRef, txData, { merge: true });
      console.log(`✅ Transação ${txId} salva`);
    }
    
    console.log('🎉 Todas as transações sincronizadas com Firebase');
    return true;
  } catch (error) {
    console.error('❌ Erro ao sincronizar transações com Firebase:', error);
    return false;
  }
};

// ============================
// FUNÇÃO ADD TRANSACTION (NOVA)
// ============================
export const addTransaction = async (
  transactionToSave: Transaction, 
  userId: string
): Promise<void> => {
  try {
    console.log('🔥 addTransaction chamada:', { transactionToSave, userId });
    
    const firestore = getFirestoreDb();
    if (!firestore || !userId) {
      throw new Error('Firestore não inicializado ou userId inválido');
    }
    
    // Garantir que o ID seja string e compatível com Firestore
    const txId = transactionToSave.id?.toString() || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const txRef = doc(firestore, 'users', userId, 'transactions', txId);
    
    const firestoreData = {
      type: transactionToSave.type,
      amount: transactionToSave.amount,
      category: transactionToSave.category,
      description: transactionToSave.description || '',
      date: transactionToSave.date,
      createdAt: transactionToSave.createdAt || new Date().toISOString(),
      userId: userId,
      updatedAt: new Date().toISOString(),
      syncedAt: Timestamp.now()
    };
    
    console.log('💾 Salvando no Firestore:', firestoreData);
    await setDoc(txRef, firestoreData, { merge: true });
    console.log(`✅ Transação ${txId} salva no Firestore`);
    
  } catch (error) {
    console.error('❌ Erro em addTransaction:', error);
    throw error;
  }
};

// ============================
// SERVIÇOS DE META
// ============================
export const getUserGoal = async (userId: string): Promise<Goal | null> => {
  try {
    const firestore = getFirestoreDb();
    if (!firestore || !userId) {
      console.warn('Firestore não inicializado ou userId inválido');
      return null;
    }
    
    console.log(`🎯 Buscando meta do usuário: ${userId}`);
    const goalRef = doc(firestore, 'users', userId, 'goals', 'current');
    const goalDoc = await getDoc(goalRef);
    
    if (goalDoc.exists()) {
      const data = goalDoc.data();
      return {
        id: goalDoc.id,
        name: data.name || 'Minha Meta',
        target: data.target || 0,
        saved: data.saved || 0,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    }
    
    console.log('📭 Nenhuma meta encontrada no Firebase');
    return null;
  } catch (error) {
    console.error('❌ Erro ao carregar meta do Firebase:', error);
    return null;
  }
};

export const syncGoal = async (userId: string, goal: Goal): Promise<boolean> => {
  try {
    const firestore = getFirestoreDb();
    if (!firestore || !userId) {
      console.error('Firestore não inicializado ou userId inválido');
      return false;
    }
    
    console.log(`🎯 Sincronizando meta para usuário: ${userId}`, goal);
    
    const goalRef = doc(firestore, 'users', userId, 'goals', 'current');
    const goalData = {
      name: goal.name,
      target: goal.target,
      saved: goal.saved,
      createdAt: goal.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncedAt: Timestamp.now()
    };
    
    console.log('💾 Salvando meta:', goalData);
    await setDoc(goalRef, goalData, { merge: true });
    
    console.log('✅ Meta sincronizada com Firebase');
    return true;
  } catch (error) {
    console.error('❌ Erro ao sincronizar meta com Firebase:', error);
    return false;
  }
};

// ============================
// FUNÇÕES AUXILIARES
// ============================
export const getCurrentUser = () => {
  if (!auth) {
    const initialized = initializeFirebase();
    if (!initialized) return null;
  }
  return auth?.currentUser;
};

// ============================
// SERVIÇO COMPLETO
// ============================
export const firebaseService = {
  getUserTransactions,
  getUserGoal,
  syncTransactions,
  syncGoal,
  addTransaction,
  getCurrentUser,
  getFirestoreDb,
};

// ============================
// TESTE DE CONEXÃO
// ============================
export const checkFirebaseConnection = async (): Promise<boolean> => {
  console.log('🔌 Testando conexão com Firebase...');
  
  try {
    // Verificar inicialização
    const firestore = getFirestoreDb();
    if (!firestore) {
      console.error('❌ Firestore não inicializado');
      return false;
    }
    
    console.log('✅ Firestore disponível');
    
    // Tentar uma operação simples
    const testRef = doc(firestore, '_test_connection', 'test_document');
    
    const testData = {
      test: true,
      timestamp: Timestamp.now(),
      message: 'Teste de conexão Firebase',
      environment: typeof window !== 'undefined' ? 'browser' : 'server'
    };
    
    console.log('📝 Tentando escrever documento de teste...');
    await setDoc(testRef, testData);
    console.log('✅ Documento de teste escrito com sucesso');
    
    // Verificar se consegue ler
    const docSnapshot = await getDoc(testRef);
    
    if (docSnapshot.exists()) {
      console.log('✅ Documento de teste lido com sucesso');
      
      // Limpar documento de teste
      await setDoc(testRef, { test: false }); // Apenas marcar como falso
      console.log('✅ Documento de teste atualizado');
      
      return true;
    } else {
      console.error('❌ Documento de teste não encontrado após escrita');
      return false;
    }
    
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('❌ ERRO no teste de conexão:', error);
    console.error('Detalhes do erro:', {
      name: error?.name,
      message: error?.message,
      code: error?.code
    });
    
    return false;
  }
};



// ============================
// INICIALIZAÇÃO AUTOMÁTICA
// ============================
// Inicializar automaticamente quando o módulo for carregado
if (typeof window !== 'undefined') {
  console.log('🌐 Ambiente de navegador detectado');
  // Inicializar com delay para evitar conflitos
  setTimeout(() => {
    initializeFirebase();
  }, 1000);
}