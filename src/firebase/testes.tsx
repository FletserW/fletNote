/*/ src/pages/DayOffCalendar.tsx - VERSÃO ATUALIZADA
import { useState, useEffect, useCallback } from 'react';
import { getMonthDays } from '../services/dayOffService';
import { DayOffConfigService } from '../services/dayOffConfigService';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getFirebaseApp } from '../services/firebaseService';

// ... restante dos imports e ícones ...

export default function DayOffCalendar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [configService, setConfigService] = useState<DayOffConfigService | null>(null);
  const [dayOffStats, setDayOffStats] = useState({
    fixedDaysOff: 0,
    regularDaysOff: 0,
    extraDaysOff: 0,
    totalDaysOff: 0,
    workDays: 0
  });
  const [dayOffs, setDayOffs] = useState<Array<{
    date: Date;
    isDayOff: boolean;
    type: string | null;
    description: string | null;
    configId: string | null;
  }>>([]);
  
  const [firebaseConnected, setFirebaseConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  // Carregar configurações e estatísticas
  const loadConfigs = useCallback(async (service: DayOffConfigService) => {
    setLoading(true);
    try {
      console.log(`📅 Carregando configurações para ${currentMonth}/${currentYear}...`);
      
      // 1. Carregar configurações do usuário
      const configs = await service.getUserConfigs();
      console.log(`✅ ${configs.length} configurações carregadas:`, configs);
      
      // 2. Calcular dias do mês atual
      const days = getMonthDays(currentMonth, currentYear);
      const dayOffData: Array<{
        date: Date;
        isDayOff: boolean;
        type: string | null;
        description: string | null;
        configId: string | null;
      }> = [];
      
      // 3. Verificar cada dia do mês
      for (const day of days) {
        try {
          const dayOffInfo = await service.isDayOff(day);
          dayOffData.push({
            date: day,
            isDayOff: dayOffInfo.isDayOff,
            type: dayOffInfo.type,
            description: dayOffInfo.description,
            configId: dayOffInfo.configId
          });
          
          // Log para debug
          if (dayOffInfo.isDayOff) {
            console.log(`📌 ${day.toLocaleDateString('pt-BR')}: ${dayOffInfo.type} - ${dayOffInfo.description}`);
          }
        } catch (error) {
          console.error(`❌ Erro ao processar dia ${day.toLocaleDateString('pt-BR')}:`, error);
          dayOffData.push({
            date: day,
            isDayOff: false,
            type: null,
            description: null,
            configId: null
          });
        }
      }
      
      setDayOffs(dayOffData);
      
      // 4. Calcular estatísticas
      const stats = await service.getMonthStats(currentMonth, currentYear);
      console.log('📊 Estatísticas:', stats);
      setDayOffStats(stats);
      
    } catch (error) {
      console.error('❌ Erro ao carregar configurações:', error);
      // Fallback: dias sem folgas
      const days = getMonthDays(currentMonth, currentYear);
      setDayOffs(days.map(day => ({
        date: day,
        isDayOff: false,
        type: null,
        description: null,
        configId: null
      })));
      
      // Estatísticas zeradas
      setDayOffStats({
        fixedDaysOff: 0,
        regularDaysOff: 0,
        extraDaysOff: 0,
        totalDaysOff: 0,
        workDays: 0
      });
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    if (user) {
      const service = new DayOffConfigService(user.uid);
      setConfigService(service);
      
      // Verificar conexão
      const checkConnection = async () => {
        try {
          const connected = await service.testFirebaseConnection();
          setFirebaseConnected(connected);
        } catch (error) {
          console.error('Erro ao verificar conexão:', error);
          setFirebaseConnected(false);
        }
      };
      
      checkConnection();
      loadConfigs(service);
    }
  }, [user, loadConfigs]);

  useEffect(() => {
    if (configService) {
      console.log(`🔄 Recarregando dados para ${currentMonth}/${currentYear}`);
      loadConfigs(configService);
    }
  }, [currentMonth, currentYear, configService, loadConfigs]);

  // ... restante do código permanece similar ...

  // Adicione a função debugFirestoreData
  const debugFirestoreData = async () => {
    if (!user?.uid) {
      console.log('❌ Usuário não logado');
      return;
    }
    
    console.log('🔍 Debug: Verificando dados do Firestore diretamente...');
    
    try {
      const app = getFirebaseApp();
      if (!app) {
        console.log('❌ Firebase não inicializado');
        return;
      }
      
      const db = getFirestore(app);
      const configsRef = collection(db, 'users', user.uid, 'dayOffConfigs');
      const snapshot = await getDocs(configsRef);
      
      console.log(`📊 Total no Firestore: ${snapshot.size} documentos`);
      
      snapshot.forEach(doc => {
        console.log(`📄 ${doc.id}:`, doc.data());
      });
      
      // Verificar também no localStorage
      const localStorageKey = `@dayoff/configs_${user.uid}`;
      const localData = localStorage.getItem(localStorageKey);
      console.log(`💾 Dados no localStorage:`, localData ? JSON.parse(localData) : 'Nenhum');
      
    } catch (error) {
      console.error('❌ Erro no debug:', error);
    }
  };

  // Adicione um indicador de status no JSX
  return (
    <div style={styles.container}>
      {/* HEADER /}
      <div style={styles.header}>
        <button 
          onClick={() => navigate('/')}
          style={styles.backButton}
          aria-label="Voltar"
        >
          <Icons.ArrowLeft />
        </button>
        <div>
          <h1 style={styles.title}>
            <Icons.Calendar /> Calendário de Folgas
          </h1>
          <div style={styles.subtitle}>Gerencie seus dias de descanso</div>
        </div>
        
        <div style={styles.headerActions}>
          <button 
            onClick={() => navigate('/dayoff-settings')}
            style={styles.settingsButton}
          >
            <Icons.Settings /> Configurar Folgas
          </button>
          
          <button 
            onClick={debugFirestoreData}
            style={styles.debugButton}
          >
            🐛 Debug
          </button>
        </div>
      </div>

      {/* Indicador de conexão /}
      {firebaseConnected !== null && (
        <div style={{
          padding: '8px 16px',
          marginBottom: '20px',
          background: firebaseConnected 
            ? 'rgba(16, 185, 129, 0.1)' 
            : 'rgba(245, 158, 11, 0.1)',
          border: `1px solid ${firebaseConnected ? '#10b981' : '#f59e0b'}`,
          borderRadius: '8px',
          color: firebaseConnected ? '#10b981' : '#f59e0b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {firebaseConnected ? '✅' : '⚠️'}
          <span>
            {firebaseConnected 
              ? 'Conectado ao Firebase' 
              : 'Modo offline - usando cache local'}
          </span>
        </div>
      )}

      {/* Loading overlay /}
      {loading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingSpinner}></div>
          <div>Carregando folgas...</div>
        </div>
      )}

      {/* ... restante do JSX ... /}
    </div>
  );
}

// Adicione os novos estilos
const styles = {
  // ... outros estilos existentes ...
  
  loadingOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.8)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    color: '#f8fafc',
    fontSize: '16px'
  },
  
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(59, 130, 246, 0.3)',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '10px'
  },
  
  debugButton: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px'
  }
};

// Adicione a animação do spinner
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}*/