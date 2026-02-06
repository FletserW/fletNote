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

  constructor(userId: string) {
    this.userId = userId;
  }

  // ============ CONFIGURAÇÕES GERAIS ============

  // Obter todas as configurações do usuário
  async getUserConfigs(): Promise<DayOffConfig[]> {
    console.log(`🔍 [DayOffConfigService] Buscando configurações para usuário: ${this.userId}`);
    
    try {
      // Verificar se temos conexão com Firebase
      const db = getFirestoreDb();
      console.log(`📊 [DayOffConfigService] Firebase disponível:`, !!db);
      console.log(`📊 [DayOffConfigService] Firebase inicializado:`, db ? 'Sim' : 'Não');
      
      if (db && this.userId) {
        console.log(`🔥 [DayOffConfigService] Tentando Firestore...`);
        
        try {
          // Testar conexão com um timeout
          const connectionPromise = getDocs(collection(db, 'users', this.userId, COLLECTIONS.DAY_OFF_CONFIGS));
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Timeout Firestore')), 5000);
          });
          
          const snapshot = await Promise.race([connectionPromise, timeoutPromise]);
          console.log(`✅ [DayOffConfigService] Conexão Firestore OK. Documentos: ${snapshot.size}`);
          
          const configs: DayOffConfig[] = [];
          
          snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data() as FirebaseDayOffConfig;
            console.log(`📝 [DayOffConfigService] Processando: ${doc.id}`, data);
            
            // Criar objeto de configuração base
            const baseConfig = {
              id: doc.id,
              userId: this.userId,
              createdAt: this.parseFirestoreDate(data.createdAt),
              description: data.description || 'Sem descrição'
            };
            
            // Criar configuração específica baseada no tipo
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
            } else {
              console.warn(`⚠️ [DayOffConfigService] Tipo desconhecido ou dados inválidos:`, data);
            }
          });
          
          console.log(`✅ [DayOffConfigService] ${configs.length} configurações do Firestore`);
          
          // Salvar cópia no localStorage como cache
          this.saveToLocalStorage(configs);
          
          return configs;
          
        } catch (firestoreError) {
          console.warn(`⚠️ [DayOffConfigService] Erro no Firestore, usando cache local:`, firestoreError);
          // Continuar para fallback do localStorage
        }
      }
      
      // FALLBACK: localStorage
      console.log(`💾 [DayOffConfigService] Usando localStorage como fallback...`);
      const storageKey = `${LOCAL_STORAGE_KEYS.DAY_OFF_CONFIGS}_${this.userId}`;
      const stored = localStorage.getItem(storageKey);
      
      console.log(`📦 [DayOffConfigService] Chave localStorage: ${storageKey}`);
      console.log(`📦 [DayOffConfigService] Dados encontrados:`, stored ? 'Sim' : 'Não');
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as any[];
          console.log(`✅ [DayOffConfigService] ${parsed.length} configurações do localStorage`);
          
          // Converter strings para Date
          return parsed.map((config: any) => ({
            ...config,
            createdAt: new Date(config.createdAt),
            ...(config.type === 'regular' && { startDate: new Date(config.startDate) }),
            ...(config.type === 'extra' && { date: new Date(config.date) })
          })) as DayOffConfig[];
        } catch (parseError) {
          console.error(`❌ [DayOffConfigService] Erro ao parsear localStorage:`, parseError);
        }
      }
      
      console.log(`📭 [DayOffConfigService] Nenhuma configuração encontrada`);
      return [];
      
    } catch (error) {
      console.error(`❌ [DayOffConfigService] Erro geral:`, error);
      return [];
    }
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
      const configsRef = collection(db, 'users', this.userId, 'dayOffConfigs');
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
    this.saveToLocalStorage(updated);
    
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
        this.saveToLocalStorage(filtered);
        
        return true;
      } else {
        // Fallback localStorage
        const stored = await this.getUserConfigs();
        const filtered = stored.filter(config => config.id !== configId);
        this.saveToLocalStorage(filtered);
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

  // Verificar se um dia é folga baseado nas configurações
  async isDayOff(date: Date): Promise<{
    isDayOff: boolean;
    type: DayOffType | null;
    description: string | null;
    configId: string | null;
  }> {
    const configs = await this.getUserConfigs();
    
    // Verificar folgas fixas
    const fixedConfigs = configs.filter(config => config.type === 'fixed') as FixedDayOff[];
    for (const config of fixedConfigs) {
      if (date.getDay() === config.dayOfWeek) {
        return {
          isDayOff: true,
          type: 'fixed',
          description: config.description,
          configId: config.id
        };
      }
    }

    // Verificar folgas regulares
    const regularConfigs = configs.filter(config => config.type === 'regular') as RegularDayOff[];
    for (const config of regularConfigs) {
      const configStart = new Date(config.startDate);
      const diffDays = Math.floor((date.getTime() - configStart.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays % config.intervalDays === 0) {
        return {
          isDayOff: true,
          type: 'regular',
          description: config.description,
          configId: config.id
        };
      }
    }

    // Verificar folgas extras
    const extraConfigs = configs.filter(config => config.type === 'extra') as ExtraDayOff[];
    for (const config of extraConfigs) {
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

  // Obter estatísticas do mês
  async getMonthStats(month: number, year: number): Promise<{
    totalDays: number;
    fixedDaysOff: number;
    regularDaysOff: number;
    extraDaysOff: number;
    totalDaysOff: number;
    workDays: number;
  }> {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let fixedDaysOff = 0;
    let regularDaysOff = 0;
    let extraDaysOff = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOffInfo = await this.isDayOff(date);
      
      if (dayOffInfo.isDayOff) {
        switch (dayOffInfo.type) {
          case 'fixed':
            fixedDaysOff++;
            break;
          case 'regular':
            regularDaysOff++;
            break;
          case 'extra':
            extraDaysOff++;
            break;
        }
      }
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
      const testRef = collection(db, '_test');
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