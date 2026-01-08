import { isSundayOff, isWednesday } from './dayOffService'
import { isExtraDayOff } from './manualDayOffService'
import { showNotification } from './notificationService'

export function checkTodayDayOff() {
  const today = new Date()

  const isOff =
    isSundayOff(today) ||
    isWednesday(today) ||
    isExtraDayOff(today)

  if (isOff) {
    showNotification(
      '🎉 Hoje é folga!',
      'Aproveite seu dia de descanso 👏'
    )
  }
}
