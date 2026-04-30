/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/dayOffConfigService.ts - VERSÃO CORRIGIDA
import { 
  getFirestoreDb, 
} from '../services/firebase';
import type { 
  DayOffConfig, 
  FixedDayOff, 
  RegularDayOff, 
  ExtraDayOff,
  DayOffType
} from './dayOffService';
import { collection, doc, getDocs, addDoc, deleteDoc, type DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

// Chaves para armazenamento local (fallback)
 export const LOCAL_STORAGE_KEYS = {
  DAY_OFF_CONFIGS: '@dayoff/configs'
} as const;

// Firestore Collection Names
export const COLLECTIONS = {
  DAY_OFF_CONFIGS: 'dayOffConfigs'
} as const;

interface FirebaseDayOffConfig {
  type: DayOffType;
  description: string;
  createdAt: unknown; // Firestore Timestamp ou Date string
  userId?: string;
  // Campos específicos por tipo
  dayOfWeek?: number;
  intervalDays?: number;
  startDate?: unknown;
  date?: unknown;
}

export class DayOffConfigService {
  private userId: string;
  private configsCache: DayOffConfig[] | null = null;
  private configsPromise: Promise<DayOffConfig[]> | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  // ============ CONFIGURAÇÕES GERAIS ============

  // Obter todas as configuracoes do usuario
  async getUserConfigs(options: { forceRefresh?: boolean } = {}): Promise<DayOffConfig[]> {
    if (!options.forceRefresh && this.configsCache) {
      return this.configsCache;
    }

    if (!options.forceRefresh && this.configsPromise) {
      return this.configsPromise;
    }

    this.configsPromise = this.loadUserConfigs();

    try {
      return await this.configsPromise;
    } finally {
      this.configsPromise = null;
    }
  }

  private async loadUserConfigs(): Promise<DayOffConfig[]> {
    try {
      const db = getFirestoreDb();
      if (db && this.userId) {
        try {
          const snapshot = await Promise.race([
            getDocs(collection(db, 'users', this.userId, COLLECTIONS.DAY_OFF_CONFIGS)),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout Firestore')), 2500))
          ]);

          const configs = this.parseSnapshot(snapshot.docs);
          this.setLocalConfigs(configs);
          return configs;
        } catch (firestoreError) {
          console.warn('[DayOffConfigService] Firestore indisponivel, usando cache local:', firestoreError);
        }
      }

      const configs = this.loadFromLocalStorage();
      this.configsCache = configs;
      return configs;
    } catch (error) {
      console.error('[DayOffConfigService] Erro geral:', error);
      const configs = this.loadFromLocalStorage();
      this.configsCache = configs;
      return configs;
    }
  }

  private parseSnapshot(docs: QueryDocumentSnapshot<DocumentData>[]): DayOffConfig[] {
    const configs: DayOffConfig[] = [];

    docs.forEach((doc) => {
      const data = doc.data() as FirebaseDayOffConfig;
      const baseConfig = {
        id: doc.id,
        userId: this.userId,
        createdAt: this.parseFirestoreDate(data.createdAt),
        description: data.description || 'Sem descricao'
      };

      if (data.type === 'fixed' && typeof data.dayOfWeek === 'number') {
        configs.push({
          ...baseConfig,
          type: 'fixed',
          dayOfWeek: data.dayOfWeek
        } as FixedDayOff);
      } else if (data.type === 'regular' && typeof data.intervalDays === 'number') {
        configs.push({
          ...baseConfig,
          type: 'regular',
          intervalDays: data.intervalDays,
          startDate: this.parseFirestoreDate(data.startDate)
        } as RegularDayOff);
      } else if (data.type === 'extra') {
        configs.push({
          ...baseConfig,
          type: 'extra',
          date: this.parseFirestoreDate(data.date)
        } as ExtraDayOff);
      }
    });

    return configs;
  }

  private loadFromLocalStorage(): DayOffConfig[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.DAY_OFF_CONFIGS + '_' + this.userId);
      if (!stored) return [];

      const parsed = JSON.parse(stored) as any[];
      return parsed.map((config: any) => ({
        ...config,
        createdAt: new Date(config.createdAt),
        ...(config.type === 'regular' && { startDate: new Date(config.startDate) }),
        ...(config.type === 'extra' && { date: new Date(config.date) })
      })) as DayOffConfig[];
    } catch (error) {
      console.error('[DayOffConfigService] Erro ao carregar cache local:', error);
      return [];
    }
  }

  private setLocalConfigs(configs: DayOffConfig[]): void {
    this.configsCache = configs;
    this.saveToLocalStorage(configs);
  }

  // Função auxiliar para parsear datas do Firestore
  private parseFirestoreDate(dateValue: any): Date {
    if (!dateValue) return new Date();
    
    // Se for um Firestore Timestamp
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      return dateValue.toDate();
    }
    
    // Se já for um Date
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    // Se for string ISO
    if (typeof dateValue === 'string') {
      return new Date(dateValue);
    }
    
    // Se for número (timestamp)
    if (typeof dateValue === 'number') {
      return new Date(dateValue);
    }
    
    return new Date();
  }

  // Adicionar configuração
 // No DayOffConfigService.ts, atualize a função addConfig
async addConfig(config: Omit<DayOffConfig, 'id' | 'userId' | 'createdAt'>): Promise<DayOffConfig | null> {
  try {
    const db = getFirestoreDb();
    const newConfig = {
      ...config,
      userId: this.userId,
      createdAt: new Date()
    };

    let configId: string;
    
    if (db && this.userId) {
      // 1. Salvar no Firestore PRIMEIRO
      const configsRef = collection(db, 'users', this.userId, COLLECTIONS.DAY_OFF_CONFIGS);
      const docRef = await addDoc(configsRef, newConfig);
      configId = docRef.id;
      
      console.log(`🔥 Salvo no Firestore: ${configId}`);
    } else {
      // Fallback: apenas localStorage
      configId = `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    const configWithId = {
      ...newConfig,
      id: configId
    } as DayOffConfig;
    
    // 2. SEMPRE salvar no localStorage também
    const stored = await this.getUserConfigs();
    const updated = [...stored.filter(c => c.id !== configId), configWithId];
    this.setLocalConfigs(updated);
    
    console.log(`💾 Salvo localmente: ${configId}`);
    
    return configWithId;
    
  } catch (error) {
    console.error('Erro ao adicionar configuração:', error);
    return null;
  }
}

  // Remover configuração
  async removeConfig(configId: string): Promise<boolean> {
    try {
      const db = getFirestoreDb();
      
      if (db && this.userId) {
        const configRef = doc(db, 'users', this.userId, COLLECTIONS.DAY_OFF_CONFIGS, configId);
        await deleteDoc(configRef);
        
        // Atualizar localStorage
        const stored = await this.getUserConfigs();
        const filtered = stored.filter(config => config.id !== configId);
        this.setLocalConfigs(filtered);
        
        return true;
      } else {
        // Fallback localStorage
        const stored = await this.getUserConfigs();
        const filtered = stored.filter(config => config.id !== configId);
        this.setLocalConfigs(filtered);
        return true;
      }
    } catch (error) {
      console.error('Erro ao remover configuração:', error);
      return false;
    }
  }

  // ============ FOLGAS EXTRAS ============

  // Adicionar folga extra
  async addExtraDayOff(date: Date, description: string = 'Folga Extra'): Promise<ExtraDayOff | null> {
    try {
      const extraConfig: Omit<ExtraDayOff, 'id' | 'userId' | 'createdAt'> = {
        type: 'extra',
        date,
        description
      };

      return await this.addConfig(extraConfig) as ExtraDayOff;
    } catch (error) {
      console.error('Erro ao adicionar folga extra:', error);
      return null;
    }
  }

  // ============ CONFIGURAÇÕES PRÉ-DEFINIDAS ============

  // Adicionar folga fixa (ex: toda quarta-feira)
  async addFixedDayOff(dayOfWeek: number, description: string = 'Folga Fixa'): Promise<FixedDayOff | null> {
    try {
      const fixedConfig: Omit<FixedDayOff, 'id' | 'userId' | 'createdAt'> = {
        type: 'fixed',
        dayOfWeek,
        description
      };

      return await this.addConfig(fixedConfig) as FixedDayOff;
    } catch (error) {
      console.error('Erro ao adicionar folga fixa:', error);
      return null;
    }
  }

  // Adicionar folga regular (ex: a cada 21 dias)
  async addRegularDayOff(intervalDays: number, startDate: Date, description: string = 'Folga Regular'): Promise<RegularDayOff | null> {
    try {
      const regularConfig: Omit<RegularDayOff, 'id' | 'userId' | 'createdAt'> = {
        type: 'regular',
        intervalDays,
        startDate,
        description
      };

      return await this.addConfig(regularConfig) as RegularDayOff;
    } catch (error) {
      console.error('Erro ao adicionar folga regular:', error);
      return null;
    }
  }

  // ============ FERRAMENTAS ÚTEIS ============

  // Verificar se um dia e folga baseado nas configuracoes
  async isDayOff(date: Date): Promise<{
    isDayOff: boolean;
    type: DayOffType | null;
    description: string | null;
    configId: string | null;
  }> {
    const configs = await this.getUserConfigs();
    return this.getDayOffInfo(date, configs);
  }

  getDayOffInfo(date: Date, configs: DayOffConfig[]): {
    isDayOff: boolean;
    type: DayOffType | null;
    description: string | null;
    configId: string | null;
  } {
    for (const config of configs) {
      if (config.type === 'fixed' && date.getDay() === config.dayOfWeek) {
        return {
          isDayOff: true,
          type: 'fixed',
          description: config.description,
          configId: config.id
        };
      }
    }

    for (const config of configs) {
      if (config.type !== 'regular') continue;
      const configStart = new Date(config.startDate);
      const diffDays = Math.floor((date.getTime() - configStart.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && config.intervalDays > 0 && diffDays % config.intervalDays === 0) {
        return {
          isDayOff: true,
          type: 'regular',
          description: config.description,
          configId: config.id
        };
      }
    }

    for (const config of configs) {
      if (config.type !== 'extra') continue;
      const configDate = new Date(config.date);
      if (
        configDate.getDate() === date.getDate() &&
        configDate.getMonth() === date.getMonth() &&
        configDate.getFullYear() === date.getFullYear()
      ) {
        return {
          isDayOff: true,
          type: 'extra',
          description: config.description,
          configId: config.id
        };
      }
    }

    return {
      isDayOff: false,
      type: null,
      description: null,
      configId: null
    };
  }

  // Obter estatisticas do mes
  async getMonthStats(month: number, year: number): Promise<{
    totalDays: number;
    fixedDaysOff: number;
    regularDaysOff: number;
    extraDaysOff: number;
    totalDaysOff: number;
    workDays: number;
  }> {
    return this.getMonthStatsFromConfigs(month, year, await this.getUserConfigs());
  }

  getMonthStatsFromConfigs(month: number, year: number, configs: DayOffConfig[]): {
    totalDays: number;
    fixedDaysOff: number;
    regularDaysOff: number;
    extraDaysOff: number;
    totalDaysOff: number;
    workDays: number;
  } {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let fixedDaysOff = 0;
    let regularDaysOff = 0;
    let extraDaysOff = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayOffInfo = this.getDayOffInfo(new Date(year, month, day), configs);
      if (!dayOffInfo.isDayOff) continue;

      if (dayOffInfo.type === 'fixed') fixedDaysOff++;
      if (dayOffInfo.type === 'regular') regularDaysOff++;
      if (dayOffInfo.type === 'extra') extraDaysOff++;
    }

    const totalDaysOff = fixedDaysOff + regularDaysOff + extraDaysOff;

    return {
      totalDays: daysInMonth,
      fixedDaysOff,
      regularDaysOff,
      extraDaysOff,
      totalDaysOff,
      workDays: daysInMonth - totalDaysOff
    };
  }

  // Testar conexão com Firebase
  async testFirebaseConnection(): Promise<boolean> {
    try {
      console.log(`🔌 Testando conexão com Firebase...`);
      const db = getFirestoreDb();
      
      if (!db) {
        console.log(`❌ Firestore não inicializado`);
        return false;
      }
      
      // Tentar uma operação simples
      const testRef = collection(db, 'users', this.userId, COLLECTIONS.DAY_OFF_CONFIGS);
      await getDocs(testRef);
      
      console.log(`✅ Conexão com Firebase OK`);
      return true;
    } catch (error) {
      console.error(`❌ Erro na conexão Firebase:`, error);
      return false;
    }
  }

  // ============ MÉTODOS PRIVADOS ============

  private saveToLocalStorage(configs: DayOffConfig[]): void {
    try {
      localStorage.setItem(
        `${LOCAL_STORAGE_KEYS.DAY_OFF_CONFIGS}_${this.userId}`,
        JSON.stringify(configs)
      );
      console.log(`💾 ${configs.length} configurações salvas no localStorage`);
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  }
}
