// src/services/goalService.ts - ATUALIZADO
import { getCurrentGoal, saveGoal as saveGoalToStorage } from './storageService';
import { firebaseService } from './firebaseService';
import type { Goal } from '../types/Goal';

// Meta padrão
const DEFAULT_GOAL: Goal = {
  id: 1,
  name: "Meta",
  target: 5000,
  saved: 0,
  createdAt: new Date().toISOString()
};

export const getGoal = async (): Promise<Goal> => {
  try {
    // Primeiro tenta do localStorage
    const storedGoal = await getCurrentGoal();
    
    if (!storedGoal) {
      // Se não tem meta salva, cria uma padrão
      await saveGoalToStorage(DEFAULT_GOAL);
      return DEFAULT_GOAL;
    }
    
    // 🔥 NOVO: Se estiver logado, tenta carregar do Firestore também
    const user = firebaseService.getCurrentUser();
    if (user?.uid) {
      try {
        const firestoreGoal = await firebaseService.getUserGoal(user.uid);
        if (firestoreGoal) {
          // Usa a meta do Firestore se existir
          await saveGoalToStorage(firestoreGoal);
          return firestoreGoal;
        }
      } catch (error) {
        console.warn('⚠️ Erro ao carregar meta do Firestore, usando local:', error);
      }
    }
    
    return storedGoal;
  } catch (error) {
    console.error('Erro ao carregar meta:', error);
    return DEFAULT_GOAL;
  }
};

export const saveGoal = async (goal: Goal): Promise<void> => {
  try {
    // Salva no localStorage
    await saveGoalToStorage({
      ...goal,
      updatedAt: new Date().toISOString()
    });
    
    // 🔥 NOVO: Se estiver logado, salva também no Firestore
    const user = firebaseService.getCurrentUser();
    if (user?.uid) {
      try {
        await firebaseService.syncGoal(user.uid, goal);
        console.log('✅ Meta salva no Firestore');
      } catch (firestoreError) {
        console.warn('⚠️ Erro ao salvar meta no Firestore:', firestoreError);
      }
    }
    
  } catch (error) {
    console.error('Erro ao salvar meta:', error);
    throw error;
  }
};

export const updateGoalSaved = async (amount: number): Promise<Goal> => {
  const currentGoal = await getGoal();
  const updatedGoal = {
    ...currentGoal,
    saved: Math.min(currentGoal.saved + amount, currentGoal.target),
    updatedAt: new Date().toISOString()
  };
  
  await saveGoal(updatedGoal);
  return updatedGoal;
};