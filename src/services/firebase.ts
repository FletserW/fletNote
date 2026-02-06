import { initializeApp, type FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  Timestamp,
  Firestore,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { getAuth, type Auth, onAuthStateChanged } from 'firebase/auth';
import type { Transaction, Goal } from './storageService';
import { firebaseConfig } from '../config/firebaseConfig';

// Configuração do Firebase
initializeApp(firebaseConfig);


// Inicializar Firebase
let app: FirebaseApp | undefined;
export let db: Firestore;
export let auth: Auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  
  // Habilitar persistência offline
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('Persistência já ativada em outra aba');
    } else if (err.code === 'unimplemented') {
      console.log('Navegador não suporta persistência');
    }
  });
  
  console.log('✅ Firebase inicializado com sucesso');
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase:', error);
}

// ============================
// SERVIÇOS DE TRANSAÇÕES
// ============================
export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    if (!db || !userId) return [];
    
    const transactionsRef = collection(db, 'users', userId, 'transactions');
    const snapshot = await getDocs(transactionsRef);
    
    const transactions: Transaction[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        type: data.type,
        amount: data.amount,
        category: data.category,
        description: data.description,
        date: data.date,
        createdAt: data.createdAt
      });
    });
    
    console.log(`📊 ${transactions.length} transações carregadas do Firebase`);
    return transactions;
  } catch (error) {
    console.error('❌ Erro ao carregar transações do Firebase:', error);
    return [];
  }
};

export const syncTransactions = async (userId: string, transactions: Transaction[]): Promise<boolean> => {
  try {
    if (!db || !userId) return false;
    
    console.log(`🔄 Sincronizando ${transactions.length} transações para Firebase...`);
    
    // Para cada transação, salva no Firestore
    for (const tx of transactions) {
      const txId = tx.id?.toString() || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const txRef = doc(db, 'users', userId, 'transactions', txId);
      
      await setDoc(txRef, {
        type: tx.type,
        amount: tx.amount,
        category: tx.category,
        description: tx.description || '',
        date: tx.date,
        createdAt: tx.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncedAt: Timestamp.now()
      }, { merge: true });
    }
    
    console.log('✅ Transações sincronizadas com Firebase');
    return true;
  } catch (error) {
    console.error('❌ Erro ao sincronizar transações com Firebase:', error);
    return false;
  }
};

// ============================
// SERVIÇOS DE META
// ============================
export const getUserGoal = async (userId: string): Promise<Goal | null> => {
  try {
    if (!db || !userId) return null;
    
    const goalRef = doc(db, 'users', userId, 'goals', 'current');
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
    
    return null;
  } catch (error) {
    console.error('❌ Erro ao carregar meta do Firebase:', error);
    return null;
  }
};

export const syncGoal = async (userId: string, goal: Goal): Promise<boolean> => {
  try {
    if (!db || !userId) return false;
    
    const goalRef = doc(db, 'users', userId, 'goals', 'current');
    
    await setDoc(goalRef, {
      name: goal.name,
      target: goal.target,
      saved: goal.saved,
      createdAt: goal.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncedAt: Timestamp.now()
    }, { merge: true });
    
    console.log('✅ Meta sincronizada com Firebase');
    return true;
  } catch (error) {
    console.error('❌ Erro ao sincronizar meta com Firebase:', error);
    return false;
  }
};

export const initializeFirebase = () => {
  try {
    if (!app) {
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase inicializado');
    }
    
    if (!db) {
      db = getFirestore(app);
      
      // Habilitar persistência offline
      enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.log('Persistência já ativada em outra aba');
        } else if (err.code === 'unimplemented') {
          console.log('Navegador não suporta persistência');
        }
      });
      
      console.log('✅ Firestore inicializado');
    }
    
    if (!auth) {
      auth = getAuth(app);
      console.log('✅ Auth inicializado');
    }
    
    return { app, db, auth };
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error);
    throw error;
  }
};

export const getFirestoreDb = (): Firestore => {
  if (!db) {
    initializeFirebase();
  }
  if (!db) {
    throw new Error('Firestore não inicializado');
  }
  return db;
};

// ============================
// SERVIÇO COMPLETO
// ============================
export const firebaseService = {
  getUserTransactions,
  getUserGoal,
  syncTransactions,
  syncGoal
};

// ============================
// VERIFICAÇÃO DE CONEXÃO
// ============================
export const checkFirebaseConnection = async (): Promise<boolean> => {
  try {
    if (!db) return false;
    
    // Tenta uma operação simples
    const testRef = doc(db, '_test', 'connection');
    await setDoc(testRef, { test: true, timestamp: Timestamp.now() });
    
    console.log('✅ Conexão com Firebase estabelecida');
    return true;
  } catch (error) {
    console.error('❌ Não foi possível conectar ao Firebase:', error);
    return false;
  }
};

// ============================
// EXPORTAR FUNÇÕES DE AUTH
// ============================
export { onAuthStateChanged, getAuth };