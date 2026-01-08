import type { Goal } from '../types/Goal'

const STORAGE_KEY = 'finance-goal'

export async function getGoal(): Promise<Goal | null> {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : null
}

export async function saveGoal(goal: Goal): Promise<void> {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goal))
}
