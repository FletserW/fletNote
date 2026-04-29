import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { DayOffConfigService } from '../services/dayOffConfigService';
import type { DayOffConfig } from '../services/dayOffService';

interface DayOffConfigPanelProps {
  onConfigChange?: () => void;
}

const dayOfWeekOptions = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' }
];

const DayOffConfigPanel: React.FC<DayOffConfigPanelProps> = ({ onConfigChange }) => {
  const { user } = useAuth();
  const [configService, setConfigService] = useState<DayOffConfigService | null>(null);
  const [configs, setConfigs] = useState<DayOffConfig[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para formulários
  const [newFixedDay, setNewFixedDay] = useState<number>(3);
  const [newFixedDescription, setNewFixedDescription] = useState('Folga Fixa');
  
  const [newRegularInterval, setNewRegularInterval] = useState<number>(21);
  const [newRegularStartDate, setNewRegularStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [newRegularDescription, setNewRegularDescription] = useState('Folga Regular');
  
  const [newExtraDate, setNewExtraDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [newExtraDescription, setNewExtraDescription] = useState('Folga Extra');

  useEffect(() => {
    if (user) {
      const service = new DayOffConfigService(user.uid);
      setConfigService(service);
      loadConfigs(service);
    }
  }, [user]);

  const loadConfigs = async (service: DayOffConfigService) => {
    try {
      setLoading(true);
      const loadedConfigs = await service.getUserConfigs();
      setConfigs(loadedConfigs);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFixedDayOff = async () => {
    if (!configService) return;
    
    try {
      await configService.addFixedDayOff(newFixedDay, newFixedDescription);
      await loadConfigs(configService);
      onConfigChange?.();
      
      // Reset form
      setNewFixedDescription('Folga Fixa');
    } catch (error) {
      console.error('Erro ao adicionar folga fixa:', error);
    }
  };

  const handleAddRegularDayOff = async () => {
    if (!configService) return;
    
    try {
      await configService.addRegularDayOff(
        newRegularInterval,
        new Date(newRegularStartDate),
        newRegularDescription
      );
      await loadConfigs(configService);
      onConfigChange?.();
      
      // Reset form
      setNewRegularDescription('Folga Regular');
    } catch (error) {
      console.error('Erro ao adicionar folga regular:', error);
    }
  };

  const handleAddExtraDayOff = async () => {
    if (!configService) return;
    
    try {
      await configService.addExtraDayOff(
        new Date(newExtraDate),
        newExtraDescription
      );
      await loadConfigs(configService);
      onConfigChange?.();
      
      // Reset form
      setNewExtraDescription('Folga Extra');
    } catch (error) {
      console.error('Erro ao adicionar folga extra:', error);
    }
  };

  const handleRemoveConfig = async (configId: string) => {
    if (!configService) return;
    
    try {
      await configService.removeConfig(configId);
      await loadConfigs(configService);
      onConfigChange?.();
    } catch (error) {
      console.error('Erro ao remover configuração:', error);
    }
  };

  const renderConfigItem = (config: DayOffConfig) => {
    switch (config.type) {
      case 'fixed':
        return (
          <div key={config.id} style={styles.configItem}>
            <div style={styles.configInfo}>
              <strong style={styles.configType}>📅 Folga Fixa</strong>
              <div>{config.description}</div>
              <div style={styles.configDetail}>
                Toda {dayOfWeekOptions.find(d => d.value === config.dayOfWeek)?.label}
              </div>
            </div>
            <button
              onClick={() => handleRemoveConfig(config.id)}
              style={styles.removeButton}
            >
              Remover
            </button>
          </div>
        );
      
      case 'regular':
        return (
          <div key={config.id} style={styles.configItem}>
            <div style={styles.configInfo}>
              <strong style={styles.configType}>🔄 Folga Regular</strong>
              <div>{config.description}</div>
              <div style={styles.configDetail}>
                A cada {config.intervalDays} dias (Início: {new Date(config.startDate).toLocaleDateString('pt-BR')})
              </div>
            </div>
            <button
              onClick={() => handleRemoveConfig(config.id)}
              style={styles.removeButton}
            >
              Remover
            </button>
          </div>
        );
      
      case 'extra':
        return (
          <div key={config.id} style={styles.configItem}>
            <div style={styles.configInfo}>
              <strong style={styles.configType}>⭐ Folga Extra</strong>
              <div>{config.description}</div>
              <div style={styles.configDetail}>
                Data: {new Date(config.date).toLocaleDateString('pt-BR')}
              </div>
            </div>
            <button
              onClick={() => handleRemoveConfig(config.id)}
              style={styles.removeButton}
            >
              Remover
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.alert}>
          Faça login para configurar suas folgas
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Carregando configurações...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Configurar Folgas</h2>
      
      {/* Lista de configurações existentes */}
      <div style={styles.configsList}>
        <h3 style={styles.sectionTitle}>Suas Folgas Configuradas</h3>
        {configs.length === 0 ? (
          <div style={styles.emptyMessage}>Nenhuma folga configurada ainda</div>
        ) : (
          configs.map(renderConfigItem)
        )}
      </div>

      {/* Formulário: Folga Fixa */}
      <div style={styles.formSection}>
        <h3 style={styles.sectionTitle}>Adicionar Folga Fixa</h3>
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Dia da Semana:
            <select
              value={newFixedDay}
              onChange={(e) => setNewFixedDay(Number(e.target.value))}
              style={styles.select}
            >
              {dayOfWeekOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Descrição:
            <input
              type="text"
              value={newFixedDescription}
              onChange={(e) => setNewFixedDescription(e.target.value)}
              style={styles.input}
              placeholder="Ex: Folga semanal"
            />
          </label>
        </div>
        <button
          onClick={handleAddFixedDayOff}
          style={styles.addButton}
        >
          Adicionar Folga Fixa
        </button>
      </div>

      {/* Formulário: Folga Regular */}
      <div style={styles.formSection}>
        <h3 style={styles.sectionTitle}>Adicionar Folga Regular</h3>
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Intervalo (dias):
            <input
              type="number"
              min="1"
              value={newRegularInterval}
              onChange={(e) => setNewRegularInterval(Number(e.target.value))}
              style={styles.input}
            />
          </label>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Data de Início:
            <input
              type="date"
              value={newRegularStartDate}
              onChange={(e) => setNewRegularStartDate(e.target.value)}
              style={styles.input}
            />
          </label>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Descrição:
            <input
              type="text"
              value={newRegularDescription}
              onChange={(e) => setNewRegularDescription(e.target.value)}
              style={styles.input}
              placeholder="Ex: Folga a cada 3 semanas"
            />
          </label>
        </div>
        <button
          onClick={handleAddRegularDayOff}
          style={styles.addButton}
        >
          Adicionar Folga Regular
        </button>
      </div>

      {/* Formulário: Folga Extra */}
      <div style={styles.formSection}>
        <h3 style={styles.sectionTitle}>Adicionar Folga Extra</h3>
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Data:
            <input
              type="date"
              value={newExtraDate}
              onChange={(e) => setNewExtraDate(e.target.value)}
              style={styles.input}
            />
          </label>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Descrição:
            <input
              type="text"
              value={newExtraDescription}
              onChange={(e) => setNewExtraDescription(e.target.value)}
              style={styles.input}
              placeholder="Ex: Aniversário"
            />
          </label>
        </div>
        <button
          onClick={handleAddExtraDayOff}
          style={styles.addButton}
        >
          Adicionar Folga Extra
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    background: 'var(--app-surface-elevated)',
    borderRadius: '12px',
    border: '1px solid var(--app-border)',
    marginBottom: '20px'
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
    color: 'var(--app-text)'
  },
  alert: {
    padding: '16px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
    borderRadius: '8px',
    color: '#fca5a5',
    textAlign: 'center' as const
  },
  loading: {
    textAlign: 'center' as const,
    color: 'var(--app-text-muted)',
    padding: '20px'
  },
  configsList: {
    marginBottom: '30px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
    color: 'var(--app-text-secondary)'
  },
  emptyMessage: {
    padding: '16px',
    background: 'var(--app-surface)',
    borderRadius: '8px',
    textAlign: 'center' as const,
    color: 'var(--app-text-muted)'
  },
  configItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    background: 'var(--app-surface)',
    borderRadius: '8px',
    marginBottom: '8px',
    border: '1px solid var(--app-border)'
  },
  configInfo: {
    flex: 1
  },
  configType: {
    display: 'block',
    marginBottom: '4px',
    color: 'var(--app-text)'
  },
  configDetail: {
    fontSize: '12px',
    color: 'var(--app-text-muted)'
  },
  removeButton: {
    padding: '6px 12px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
    borderRadius: '6px',
    color: '#fca5a5',
    cursor: 'pointer',
    fontSize: '12px'
  },
  formSection: {
    marginBottom: '24px',
    padding: '16px',
    background: 'var(--app-surface)',
    borderRadius: '8px',
    border: '1px solid var(--app-border)'
  },
  formGroup: {
    marginBottom: '12px'
  },
  label: {
    display: 'block',
    marginBottom: '4px',
    color: 'var(--app-text-secondary)',
    fontSize: '14px'
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    background: 'var(--app-surface-elevated)',
    border: '1px solid var(--app-border)',
    borderRadius: '6px',
    color: 'var(--app-text)',
    fontSize: '14px',
    marginTop: '4px'
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    background: 'var(--app-surface-elevated)',
    border: '1px solid var(--app-border)',
    borderRadius: '6px',
    color: 'var(--app-text)',
    fontSize: '14px',
    marginTop: '4px'
  },
  addButton: {
    padding: '10px 16px',
    background: 'linear-gradient(135deg, var(--app-primary), #2563eb)',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    marginTop: '8px'
  }
};

export default DayOffConfigPanel;