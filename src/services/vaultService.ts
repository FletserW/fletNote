export type VaultData = {
  current: number
  goal: number
}

const STORAGE_KEY = 'vault-data'

export function loadVault(): VaultData {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : { current: 0, goal: 1000 }
}

export function saveVault(data: VaultData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
