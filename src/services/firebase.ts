

// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  Timestamp,
  Firestore
} from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import type { Transaction, Goal } from './storageService';

// Configuração do Firebase (substitua com suas credenciais)
const firebaseConfig = {
  apiKey: "AIzaSyAJPxldozWGXPtjdYs4vFWEfv3-9PZqVwQ",
  authDomain: "fletnote.firebaseapp.com",
  projectId: "fletnote",
  storageBucket: "fletnote.firebasestorage.app",
  messagingSenderId: "436047979950",
  appId: "1:436047979950:web:08fb16c668eaf557d7d43f",
  measurementId: "G-1CV80ZBK4H"
};

// Inicializar Firebase
let app;
export let db: Firestore;
export let auth: Auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
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