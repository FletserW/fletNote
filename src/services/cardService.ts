// src/services/cardService.ts
import { getFirestoreDb } from './firebaseService';
import { getCurrentUserId } from './storageService';
import type { Card, CardStats } from '../types/Card';
import { collection, doc, getDocs, setDoc, deleteDoc,  Timestamp } from 'firebase/firestore';

// ============================
// CONSTANTES
// ============================
const STORAGE_KEYS = {
  CARDS: '@finances/cards'
};



// ============================
// UTILITÁRIOS
// ============================
const generateId = (): string => {
  return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ============================
// CRUD DE CARTÕES
// ============================

export const saveCard = async (card: Card): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const cleanUserId = userId !== null ? userId : undefined;
    
    const cardToSave = {
      ...card,
      id: card.id || generateId(),
      createdAt: card.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: cleanUserId
    };

    console.log('💾 Salvando cartão:', cardToSave);

    // 1. Salvar no localStorage
    const storageKey = cleanUserId 
      ? `${STORAGE_KEYS.CARDS}_${cleanUserId}`
      : STORAGE_KEYS.CARDS;
    
    const existing = await getCards();
    const updated = existing.filter(c => c.id !== cardToSave.id);
    updated.push(cardToSave);
    
    localStorage.setItem(storageKey, JSON.stringify(updated));

    // 2. Salvar no Firestore
    if (cleanUserId) {
      try {
        const db = getFirestoreDb();
        if (db) {
          const cardRef = doc(db, 'users', cleanUserId, 'cards', cardToSave.id!);
          await setDoc(cardRef, {
            ...cardToSave,
            syncedAt: Timestamp.now()
          }, { merge: true });
          console.log('✅ Cartão salvo no Firestore');
        }
      } catch (error) {
        console.warn('⚠️ Erro ao salvar no Firestore:', error);
      }
    }

    window.dispatchEvent(new CustomEvent('cardsUpdated'));
    
  } catch (error) {
    console.error('❌ Erro ao salvar cartão:', error);
    throw error;
  }
};

export const getCards = async (): Promise<Card[]> => {
  try {
    const userId = getCurrentUserId();
    const cleanUserId = userId !== null ? userId : undefined;
    
    const storageKey = cleanUserId 
      ? `${STORAGE_KEYS.CARDS}_${cleanUserId}`
      : STORAGE_KEYS.CARDS;
    
    // 1. Tentar do Firestore primeiro
    if (cleanUserId) {
      try {
        const db = getFirestoreDb();
        if (db) {
          const cardsRef = collection(db, 'users', cleanUserId, 'cards');
          const snapshot = await getDocs(cardsRef);
          
          if (!snapshot.empty) {
            const firestoreCards: Card[] = [];
            snapshot.forEach(doc => {
              const data = doc.data();
              firestoreCards.push({
                ...data,
                id: doc.id
              } as Card);
            });
            
            // Salvar no localStorage para cache
            localStorage.setItem(storageKey, JSON.stringify(firestoreCards));
            
            return firestoreCards;
          }
        }
      } catch (error) {
        console.warn('⚠️ Erro ao buscar cartões do Firestore:', error);
      }
    }
    
    // 2. Fallback para localStorage
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // 3. Cartões padrão
    const defaultCards: Card[] = [
      {
        id: generateId(),
        name: 'Nubank',
        lastDigits: '0000',
        brand: 'mastercard',
        dueDay: 10,
        closingDay: 5,
        isActive: true,
        color: '#820ad1'
      },
      {
        id: generateId(),
        name: 'Itaú',
        lastDigits: '0000',
        brand: 'visa',
        dueDay: 15,
        closingDay: 10,
        isActive: true,
        color: '#ec7000'
      }
    ];
    
    return defaultCards;
    
  } catch (error) {
    console.error('❌ Erro ao buscar cartões:', error);
    return [];
  }
};

export const deleteCard = async (id: string): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const cleanUserId = userId !== null ? userId : undefined;
    
    // Remover do localStorage
    const cards = await getCards();
    const updated = cards.filter(c => c.id !== id);
    
    const storageKey = cleanUserId 
      ? `${STORAGE_KEYS.CARDS}_${cleanUserId}`
      : STORAGE_KEYS.CARDS;
    
    localStorage.setItem(storageKey, JSON.stringify(updated));
    
    // Remover do Firestore
    if (cleanUserId) {
      try {
        const db = getFirestoreDb();
        if (db) {
          const cardRef = doc(db, 'users', cleanUserId, 'cards', id);
          await deleteDoc(cardRef);
        }
      } catch (error) {
        console.warn('⚠️ Erro ao deletar do Firestore:', error);
      }
    }
    
    window.dispatchEvent(new CustomEvent('cardsUpdated'));
    
  } catch (error) {
    console.error('❌ Erro ao deletar cartão:', error);
    throw error;
  }
};

export const getCardStats = async (): Promise<CardStats> => {
  try {
    const cards = await getCards();
    const activeCards = cards.filter(c => c.isActive);
    
    const totalLimit = activeCards.reduce((sum, card) => sum + (card.limit || 0), 0);
    
    // TODO: Calcular limite usado baseado nas transações do mês
    const usedLimit = 0;
    
    // Próximo vencimento
    const today = new Date();
    const nextDueCards = activeCards
      .map(card => {
        const dueDate = new Date(today.getFullYear(), today.getMonth(), card.dueDay);
        if (dueDate < today) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }
        return {
          card,
          dueDate
        };
      })
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    
    const nextDue = nextDueCards[0];
    
    return {
      totalCards: cards.length,
      activeCards: activeCards.length,
      totalLimit,
      usedLimit,
      availableLimit: totalLimit - usedLimit,
      nextDueDate: nextDue ? nextDue.dueDate.toISOString() : null,
      nextDueAmount: 0 // TODO: Calcular baseado nas faturas
    };
    
  } catch (error) {
    console.error('❌ Erro ao calcular estatísticas:', error);
    return {
      totalCards: 0,
      activeCards: 0,
      totalLimit: 0,
      usedLimit: 0,
      availableLimit: 0,
      nextDueDate: null,
      nextDueAmount: 0
    };
  }
  
};