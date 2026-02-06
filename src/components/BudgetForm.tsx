import React, { useState } from 'react';
import { X, Calendar, Repeat, Bell } from 'lucide-react';

interface BudgetData {
  categoryId: string;
  valueLimit: number;
  period: 'mensal' | 'anual' | 'personalizado';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  alerts: {
    active: boolean;
    warningPercentage: number;
  };
}

interface BudgetFormProps {
  initialData?: Partial<BudgetData>;
  onSave: (data: BudgetData) => void;
  onClose: () => void;
}

const BudgetForm: React.FC<BudgetFormProps> = ({ initialData, onSave, onClose }) => {
  const [formData, setFormData] = useState<BudgetData>({
    categoryId: initialData?.categoryId || '',
    valueLimit: initialData?.valueLimit || 0,
    period: initialData?.period || 'mensal',
    startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
    endDate: initialData?.endDate || '',
    autoRenew: initialData?.autoRenew ?? true,
    alerts: {
      active: initialData?.alerts?.active ?? true,
      warningPercentage: initialData?.alerts?.warningPercentage || 80
    }
  });

  // Calcular data final padrão se for mensal
  React.useEffect(() => {
    if (formData.period === 'mensal' && !initialData) {
      const today = new Date();
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setFormData(prev => ({
        ...prev,
        endDate: lastDay.toISOString().split('T')[0]
      }));
    }
  }, [formData.period, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>
            {initialData ? 'Editar Orçamento' : 'Novo Orçamento'}
          </h2>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} color="#94a3b8" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Categoria</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
              style={styles.select}
              required
            >
              <option value="">Selecione uma categoria</option>
              <option value="lazer">Lazer</option>
              <option value="alimentacao">Alimentação</option>
              <option value="transporte">Transporte</option>
              <option value="educacao">Educação</option>
              <option value="saude">Saúde</option>
              <option value="moradia">Moradia</option>
              <option value="vestuario">Vestuário</option>
              <option value="outros">Outros</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Valor do Orçamento</label>
            <div style={styles.inputWithPrefix}>
              <span style={styles.currencyPrefix}>R$</span>
              <input
                type="number"
                value={formData.valueLimit || ''}
                onChange={(e) => setFormData({
                  ...formData, 
                  valueLimit: e.target.value ? parseFloat(e.target.value) : 0
                })}
                style={styles.input}
                placeholder="0,00"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Período</label>
            <div style={styles.periodOptions}>
              <button
                type="button"
                style={{
                  ...styles.periodButton,
                  ...(formData.period === 'mensal' ? styles.periodButtonActive : {})
                }}
                onClick={() => setFormData({...formData, period: 'mensal'})}
              >
                <Calendar size={16} />
                Mensal
              </button>
              <button
                type="button"
                style={{
                  ...styles.periodButton,
                  ...(formData.period === 'anual' ? styles.periodButtonActive : {})
                }}
                onClick={() => setFormData({...formData, period: 'anual'})}
              >
                <Calendar size={16} />
                Anual
              </button>
              <button
                type="button"
                style={{
                  ...styles.periodButton,
                  ...(formData.period === 'personalizado' ? styles.periodButtonActive : {})
                }}
                onClick={() => setFormData({...formData, period: 'personalizado'})}
              >
                <Calendar size={16} />
                Personalizado
              </button>
            </div>
          </div>

          {formData.period === 'personalizado' && (
            <div style={styles.dateRange}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Data Inicial</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Data Final</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.autoRenew}
                onChange={(e) => setFormData({...formData, autoRenew: e.target.checked})}
                style={styles.checkbox}
              />
              <Repeat size={16} color="#94a3b8" />
              Renovação automática
            </label>
          </div>

          <div style={styles.alertSection}>
            <div style={styles.alertHeader}>
              <Bell size={16} color="#94a3b8" />
              <h3 style={styles.alertTitle}>Alertas</h3>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.alerts.active}
                  onChange={(e) => setFormData({
                    ...formData, 
                    alerts: {...formData.alerts, active: e.target.checked}
                  })}
                  style={styles.checkbox}
                />
                Ativar alertas de orçamento
              </label>
            </div>

            {formData.alerts.active && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Avisar quando atingir</label>
                <div style={styles.percentageInput}>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={formData.alerts.warningPercentage}
                    onChange={(e) => setFormData({
                      ...formData,
                      alerts: {...formData.alerts, warningPercentage: parseInt(e.target.value)}
                    })}
                    style={styles.rangeInput}
                  />
                  <div style={styles.percentageValueContainer}>
                    <span style={styles.percentageValue}>
                      {formData.alerts.warningPercentage}%
                    </span>
                  </div>
                </div>
                <div style={styles.percentageLabels}>
                  <span style={styles.percentageLabel}>50%</span>
                  <span style={styles.percentageLabel}>95%</span>
                </div>
              </div>
            )}
          </div>

          <div style={styles.formActions}>
            <button type="button" onClick={onClose} style={styles.cancelButton}>
              Cancelar
            </button>
            <button type="submit" style={styles.saveButton}>
              {initialData ? 'Atualizar' : 'Criar'} Orçamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px'
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: '20px',
    padding: '24px',
    border: '1px solid #334155',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto' as const
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    margin: '0',
    color: '#f8fafc'
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#94a3b8'
  },
  input: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '10px',
    padding: '12px 16px',
    color: '#f8fafc',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    width: '100%',
    boxSizing: 'border-box' as const
  },
  inputWithPrefix: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '10px',
    overflow: 'hidden'
  },
  currencyPrefix: {
    padding: '0 12px',
    backgroundColor: '#334155',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    color: '#94a3b8',
    fontSize: '16px',
    fontWeight: '500',
    minWidth: '40px'
  },
  select: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '10px',
    padding: '12px 16px',
    color: '#f8fafc',
    fontSize: '16px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const
  },
  periodOptions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px'
  },
  periodButton: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    padding: '12px 8px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '10px',
    color: '#94a3b8',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    borderWidth: '2px'
  },
  periodButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3b82f6',
    color: '#3b82f6'
  },
  dateRange: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#94a3b8',
    cursor: 'pointer'
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer'
  },
  alertSection: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #334155'
  },
  alertHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px'
  },
  alertTitle: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '0',
    color: '#94a3b8'
  },
  percentageInput: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginTop: '4px'
  },
  rangeInput: {
    flex: 1,
    height: '4px',
    backgroundColor: '#334155',
    borderRadius: '2px',
    outline: 'none',
    cursor: 'pointer',
    WebkitAppearance: 'none' as const
  },
  percentageValueContainer: {
    minWidth: '40px',
    textAlign: 'center' as const
  },
  percentageValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#3b82f6'
  },
  percentageLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#64748b',
    marginTop: '4px'
  },
  percentageLabel: {
    fontSize: '12px',
    color: '#64748b'
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px'
  },
  cancelButton: {
    flex: 1,
    padding: '12px 16px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '12px',
    color: '#f8fafc',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  saveButton: {
    flex: 1,
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: '12px',
    color: '#f8fafc',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
} as const;

export default BudgetForm;