//src/services/manualDayOffService.ts
const STORAGE_KEY = 'extra_day_offs'

export function getExtraDaysOff(): string[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
}

export function addExtraDayOff(date: string) {
  const current = getExtraDaysOff()
  if (!current.includes(date)) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...current, date])
    )
  }
}

export function removeExtraDayOff(date: string) {
  const current = getExtraDaysOff().filter(d => d !== date)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
}

export function isExtraDayOff(date: Date): boolean {
  const iso = date.toISOString().split('T')[0]
  return getExtraDaysOff().includes(iso)
}

