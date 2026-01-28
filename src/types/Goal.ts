// src/types/Goal.ts
export interface Goal {
  id: number | string;  // Permite ambos
  name: string;
  target: number;
  saved: number;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

// Meta padrão
export const DEFAULT_GOAL: Goal = {
  id: 1,
  name: "PC Gamer",
  target: 7000,
  saved: 0,
  createdAt: new Date().toISOString()
};