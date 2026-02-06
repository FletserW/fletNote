import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, TrendingUp, Settings, Calendar, Repeat, AlertTriangle, Check, MoreVertical } from 'lucide-react';

interface BudgetCategory {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  valueLimit: number;
  spent: number;
  period: 'mensal' | 'anual' | 'personalizado';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  alerts: {
    active: boolean;
    warningPercentage: number;
  };
  remaining: number;
  percentage: number;
  status: 'safe' | 'warning' | 'exceeded';
}

const BudgetsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [budgets] = useState<BudgetCategory[]>([
    {
      id: '1',
      categoryId: 'lazer',
      categoryName: 'Lazer',
      categoryColor: '#8b5cf6',
      valueLimit: 500,
      spent: 320,
      period: 'mensal',
      startDate: '2024-02-01',
      endDate: '2024-02-29',
      autoRenew: true,
      alerts: { active: true, warningPercentage: 80 },
      remaining: 180,
      percentage: 64,
      status: 'safe'
    },
    {
      id: '2',
      categoryId: 'alimentacao',
      categoryName: 'Alimentação',
      categoryColor: '#10b981',
      valueLimit: 800,
      spent: 750,
      period: 'mensal',
      startDate: '2024-02-01',
      endDate: '2024-02-29',
      autoRenew: true,
      alerts: { active: true, warningPercentage: 80 },
      remaining: 50,
      percentage: 94,
      status: 'warning'
    },
    {
      id: '3',
      categoryId: 'transporte',
      categoryName: 'Transporte',
      categoryColor: '#3b82f6',
      valueLimit: 300,
      spent: 320,
      period: 'mensal',
      startDate: '2024-02-01',
      endDate: '2024-02-29',
      autoRenew: true,
      alerts: { active: true, warningPercentage: 80 },
      remaining: -20,
      percentage: 107,
      status: 'exceeded'
    },
    {
      id: '4',
      categoryId: 'educacao',
      categoryName: 'Educação',
      categoryColor: '#f59e0b',
      valueLimit: 400,
      spent: 150,
      period: 'mensal',
      startDate: '2024-02-01',
      endDate: '2024-02-29',
      autoRenew: true,
      alerts: { active: true, warningPercentage: 80 },
      remaining: 250,
      percentage: 38,
      status: 'safe'
    }
  ]);

  const [totalBudgeted, setTotalBudgeted] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [view, setView] = useState<'current' | 'history'>('current');
  const [selectedMonth, setSelectedMonth] = useState('2024-02');

  useEffect(() => {
    const budgeted = budgets.reduce((sum, budget) => sum + budget.valueLimit, 0);
    const spent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTotalBudgeted(budgeted);
    setTotalSpent(spent);
  }, [budgets]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'exceeded': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'safe': return 'Dentro do orçamento';
      case 'warning': return 'Próximo do limite';
      case 'exceeded': return 'Orçamento excedido';
      default: return 'Em andamento';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleAddBudget = () => {
    navigate('/budgets/new');
  };

  const handleEditBudget = (id: string) => {
    navigate(`/budgets/edit/${id}`);
  };

  const handleViewCategory = (categoryId: string) => {
    navigate(`/financeiro/extrato?categoria=${categoryId}`);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <ArrowLeft size={24} color="#f8fafc" />
        </button>
        <div>
          <h1 style={styles.title}>Orçamentos</h1>
          <p style={styles.subtitle}>Controle seus gastos por categoria</p>
        </div>
        <button style={styles.settingsButton}>
          <Settings size={24} color="#94a3b8" />
        </button>
      </div>

      {/* Resumo do Mês */}
      <div style={styles.summaryCard}>
        <div style={styles.summaryHeader}>
          <div style={styles.summaryIcon}>
            <TrendingUp size={24} color="#f8fafc" />
          </div>
          <div>
            <h3 style={styles.summaryTitle}>Resumo do Mês</h3>
            <p style={styles.summaryPeriod}>Fevereiro 2024</p>
          </div>
        </div>
        
        <div style={styles.summaryGrid}>
          <div style={styles.summaryItem}>
            <p style={styles.summaryLabel}>Total Orçado</p>
            <p style={styles.summaryValue}>{formatCurrency(totalBudgeted)}</p>
          </div>
          <div style={styles.summaryItem}>
            <p style={styles.summaryLabel}>Total Gasto</p>
            <p style={styles.summaryValue}>{formatCurrency(totalSpent)}</p>
          </div>
          <div style={styles.summaryItem}>
            <p style={styles.summaryLabel}>Diferença</p>
            <p style={{
              ...styles.summaryValue,
              color: totalBudgeted - totalSpent >= 0 ? '#10b981' : '#ef4444'
            }}>
              {formatCurrency(totalBudgeted - totalSpent)}
            </p>
          </div>
        </div>

        {/* Barra de Progresso Geral */}
        <div style={styles.overallProgress}>
          <div style={styles.progressLabels}>
            <span style={styles.progressLabel}>Progresso geral: {((totalSpent / totalBudgeted) * 100).toFixed(1)}%</span>
            <span style={styles.progressLabel}>{formatCurrency(totalSpent)} / {formatCurrency(totalBudgeted)}</span>
          </div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${Math.min((totalSpent / totalBudgeted) * 100, 100)}%`,
                background: totalSpent > totalBudgeted 
                  ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                  : 'linear-gradient(90deg, #3b82f6, #2563eb)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Filtros e Visão */}
      <div style={styles.filterCard}>
        <div style={styles.filterTabs}>
          <button 
            style={{
              ...styles.filterTab,
              ...(view === 'current' ? styles.filterTabActive : {})
            }}
            onClick={() => setView('current')}
          >
            Orçamentos Atuais
          </button>
          <button 
            style={{
              ...styles.filterTab,
              ...(view === 'history' ? styles.filterTabActive : {})
            }}
            onClick={() => setView('history')}
          >
            Histórico
          </button>
        </div>

        <div style={styles.filterRow}>
          <div style={styles.filterSelect}>
            <Calendar size={16} color="#94a3b8" />
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={styles.select}
            >
              <option value="2024-01">Janeiro 2024</option>
              <option value="2024-02">Fevereiro 2024</option>
              <option value="2024-03">Março 2024</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Orçamentos */}
      <div style={styles.budgetsList}>
        {budgets.map((budget) => (
          <div key={budget.id} style={styles.budgetCard}>
            <div style={styles.budgetHeader}>
              <div style={styles.categoryInfo}>
                <div 
                  style={{
                    ...styles.categoryColor,
                    backgroundColor: budget.categoryColor
                  }}
                />
                <div>
                  <h3 style={styles.categoryName}>{budget.categoryName}</h3>
                  <div style={styles.budgetDetails}>
                    <span style={styles.budgetDetail}>
                      <Repeat size={12} color="#94a3b8" />
                      {budget.period === 'mensal' ? 'Mensal' : 'Anual'}
                    </span>
                    <span style={styles.budgetDetail}>
                      <Calendar size={12} color="#94a3b8" />
                      {budget.autoRenew ? 'Renovação automática' : 'Sem renovação'}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                style={styles.moreButton}
                onClick={() => handleEditBudget(budget.id)}
              >
                <MoreVertical size={20} color="#94a3b8" />
              </button>
            </div>

            {/* Barra de Progresso */}
            <div style={styles.budgetProgress}>
              <div style={styles.progressLabels}>
                <span style={styles.progressLabel}>
                  {formatCurrency(budget.spent)} / {formatCurrency(budget.valueLimit)}
                </span>
                <span style={styles.progressPercentage}>{budget.percentage}%</span>
              </div>
              <div style={styles.progressBar}>
                <div 
                  style={{
                    ...styles.progressFill,
                    width: `${Math.min(budget.percentage, 100)}%`,
                    background: budget.status === 'safe' 
                      ? 'linear-gradient(90deg, #10b981, #34d399)'
                      : budget.status === 'warning'
                      ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                      : 'linear-gradient(90deg, #ef4444, #dc2626)'
                  }}
                />
              </div>
            </div>

            {/* Status e Alertas */}
            <div style={styles.budgetStatus}>
              <div style={{
                ...styles.statusBadge,
                backgroundColor: getStatusColor(budget.status) + '20',
                color: getStatusColor(budget.status)
              }}>
                {budget.status === 'exceeded' && <AlertTriangle size={12} />}
                {budget.status === 'warning' && <AlertTriangle size={12} />}
                {budget.status === 'safe' && <Check size={12} />}
                {getStatusText(budget.status)}
              </div>
              
              {budget.status === 'warning' && budget.alerts.active && (
                <div style={styles.alertMessage}>
                  <AlertTriangle size={14} color="#f59e0b" />
                  <span style={styles.alertText}>
                    Você atingiu {budget.alerts.warningPercentage}% do orçamento
                  </span>
                </div>
              )}

              {budget.status === 'exceeded' && (
                <div style={styles.alertMessage}>
                  <AlertTriangle size={14} color="#ef4444" />
                  <span style={styles.alertText}>
                    Orçamento excedido em {formatCurrency(Math.abs(budget.remaining))}
                  </span>
                </div>
              )}
            </div>

            {/* Botões de Ação */}
            <div style={styles.budgetActions}>
              <button 
                style={styles.actionButton}
                onClick={() => handleViewCategory(budget.categoryId)}
              >
                Ver Extrato
              </button>
              <button 
                style={{
                  ...styles.actionButton,
                  ...styles.actionButtonPrimary
                }}
                onClick={() => handleEditBudget(budget.id)}
              >
                Ajustar Orçamento
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Botão para Adicionar Novo Orçamento */}
      <button style={styles.fab} onClick={handleAddBudget}>
        <Plus size={24} color="#f8fafc" />
      </button>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#0f172a',
    minHeight: '100vh',
    padding: '20px 16px',
    color: '#f8fafc'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px'
  },
  backButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  settingsButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    margin: '0',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  subtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: '4px 0 0 0'
  },
  summaryCard: {
    backgroundColor: '#1e293b',
    borderRadius: '20px',
    padding: '20px',
    border: '1px solid #334155',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
    marginBottom: '16px'
  },
  summaryHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px'
  },
  summaryIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px'
  },
  summaryTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0',
    color: '#f8fafc'
  },
  summaryPeriod: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: '4px 0 0 0'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '20px'
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  summaryLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: '0 0 4px 0'
  },
  summaryValue: {
    fontSize: '18px',
    fontWeight: '700',
    margin: '0',
    color: '#f8fafc'
  },
  overallProgress: {
    marginTop: '20px'
  },
  progressLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },
  progressLabel: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  progressPercentage: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#f8fafc'
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#334155',
    borderRadius: '10px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: '10px',
    transition: 'width 0.3s ease'
  },
  filterCard: {
    backgroundColor: '#1e293b',
    borderRadius: '20px',
    padding: '16px',
    border: '1px solid #334155',
    marginBottom: '16px'
  },
  filterTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px'
  },
  filterTab: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '12px',
    color: '#94a3b8',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  filterTabActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3b82f6',
    color: '#3b82f6'
  },
  filterRow: {
    display: 'flex',
    gap: '12px'
  },
  filterSelect: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '10px'
  },
  select: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none'
  },
  budgetsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '80px'
  },
  budgetCard: {
    backgroundColor: '#1e293b',
    borderRadius: '20px',
    padding: '20px',
    border: '1px solid #334155',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
  },
  budgetHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  },
  categoryInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  categoryColor: {
    width: '40px',
    height: '40px',
    borderRadius: '10px'
  },
  categoryName: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 4px 0',
    color: '#f8fafc'
  },
  budgetDetails: {
    display: 'flex',
    gap: '12px'
  },
  budgetDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: '#94a3b8'
  },
  moreButton: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  budgetProgress: {
    marginBottom: '16px'
  },
  budgetStatus: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px'
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    width: 'fit-content'
  },
  alertMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '10px'
  },
  alertText: {
    fontSize: '12px',
    color: '#f59e0b'
  },
  budgetActions: {
    display: 'flex',
    gap: '12px'
  },
  actionButton: {
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
  actionButtonPrimary: {
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    border: 'none'
  },
  fab: {
    position: 'fixed' as const,
    bottom: '24px',
    right: '24px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    border: 'none',
    color: 'white',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
} as const;

export default BudgetsScreen;