// Tipos de folga
export type DayOffType = 'fixed' | 'regular' | 'extra';

export interface FixedDayOff {
  id: string;
  userId: string;
  type: 'fixed';
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, etc.
  description: string;
  createdAt: Date;
}

export interface RegularDayOff {
  id: string;
  userId: string;
  type: 'regular';
  intervalDays: number; // Ex: 21 dias
  startDate: Date; // Data de início do ciclo
  description: string;
  createdAt: Date;
}

export interface ExtraDayOff {
  id: string;
  userId: string;
  type: 'extra';
  date: Date; // Data específica
  description: string;
  createdAt: Date;
}

export type DayOffConfig = FixedDayOff | RegularDayOff | ExtraDayOff;

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

// Função para obter todas as folgas de um usuário em um mês específico
export function getUserDayOffs(
  date: Date,
  userConfigs: DayOffConfig[]
): { 
  isDayOff: boolean; 
  type: DayOffType | null;
  description: string | null;
} {
  const result = {
    isDayOff: false,
    type: null as DayOffType | null,
    description: null as string | null
  };

  // Verificar folgas fixas
  const fixedDayOffs = userConfigs.filter(config => config.type === 'fixed') as FixedDayOff[];
  for (const config of fixedDayOffs) {
    if (date.getDay() === config.dayOfWeek) {
      result.isDayOff = true;
      result.type = 'fixed';
      result.description = config.description;
      return result;
    }
  }

  // Verificar folgas regulares
  const regularDayOffs = userConfigs.filter(config => config.type === 'regular') as RegularDayOff[];
  for (const config of regularDayOffs) {
    const diffDays = Math.floor(
      (date.getTime() - new Date(config.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (diffDays >= 0 && diffDays % config.intervalDays === 0) {
      result.isDayOff = true;
      result.type = 'regular';
      result.description = config.description;
      return result;
    }
  }

  // Verificar folgas extras
  const extraDayOffs = userConfigs.filter(config => config.type === 'extra') as ExtraDayOff[];
  for (const config of extraDayOffs) {
    const configDate = new Date(config.date);
    if (
      configDate.getDate() === date.getDate() &&
      configDate.getMonth() === date.getMonth() &&
      configDate.getFullYear() === date.getFullYear()
    ) {
      result.isDayOff = true;
      result.type = 'extra';
      result.description = config.description;
      return result;
    }
  }

  return result;
}