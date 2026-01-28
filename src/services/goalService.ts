// src/services/goalService.ts
import { getCurrentGoal, saveGoal as saveGoalToStorage } from './storageService';
import type { Goal } from '../types/Goal';

// Meta padrão
const DEFAULT_GOAL: Goal = {
  id: 1,
  name: "PC Gamer",
  target: 7000,
  saved: 0,
  createdAt: new Date().toISOString()
};

export const getGoal = async (): Promise<Goal> => {
  const storedGoal = await getCurrentGoal();
  
  if (!storedGoal) {
    // Se não tem meta salva, cria uma padrão
    await saveGoalToStorage(DEFAULT_GOAL);
    return DEFAULT_GOAL;
  }
  
  return storedGoal;
};

export const saveGoal = async (goal: Goal): Promise<void> => {
  await saveGoalToStorage({
    ...goal,
    updatedAt: new Date().toISOString()
  });
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