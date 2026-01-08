// Domingo real de início da escala
// 07/12/2025 — DOMINGO
const BASE_SUNDAY_OFF = new Date(2025, 11, 7)

export function isWednesday(date: Date): boolean {
  return date.getDay() === 3
}

export function isSundayOff(date: Date): boolean {
  // só verifica domingos
  if (date.getDay() !== 0) return false

  const diffDays = Math.floor(
    (date.getTime() - BASE_SUNDAY_OFF.getTime()) /
      (1000 * 60 * 60 * 24)
  )

  // evita domingos anteriores à data inicial
  if (diffDays < 0) return false

  return diffDays % 21  === 0
}

export function getMonthDays(month: number, year: number): Date[] {
  const days: Date[] = []
  const date = new Date(year, month, 1)

  while (date.getMonth() === month) {
    days.push(new Date(date))
    date.setDate(date.getDate() + 1)
  }

  return days
}
