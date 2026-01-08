import { useEffect, useState, useCallback } from 'react'
import { getAnnualSummary } from '../services/financeService'
import AnnualChart from '../components/AnnualChart'
import type { AnnualSummaryMonth } from '../types/AnnualSummary'
import { useNavigate } from 'react-router-dom'

// Ícones
const Icons = {
  ArrowLeft: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  Calendar: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  ChartLine: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" />
      <path d="M19 9l-5 5-4-4-3 3" />
    </svg>
  ),
  TrendingUp: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 6l-9.5 9.5-5-5L1 18" />
      <path d="M17 6h6v6" />
    </svg>
  ),
  TrendingDown: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 18l-9.5-9.5-5 5L1 6" />
      <path d="M17 18h6v-6" />
    </svg>
  ),
  Dollar: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Filter: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  Info: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

export default function AnnualSummary() {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [data, setData] = useState<AnnualSummaryMonth[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const summaryData = await getAnnualSummary(selectedYear)
      setData(summaryData)
    } catch (error) {
      console.error('Erro ao carregar resumo anual:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedYear])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Cálculos
  const totalIncome = data.reduce((sum, month) => sum + month.income, 0)
  const totalExpense = data.reduce((sum, month) => sum + month.expense, 0)
  const totalBalance = data.reduce((sum, month) => sum + month.total, 0)
  const averageMonthly = data.length > 0 ? totalBalance / data.length : 0

  // Encontrar melhores e piores meses
  const bestMonth = data.length > 0 
    ? data.reduce((max, month) => month.total > max.total ? month : max)
    : null
  const worstMonth = data.length > 0 
    ? data.reduce((min, month) => month.total < min.total ? month : min)
    : null

  // Nomes dos meses
  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ]

  // Ano atual e opções
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <button 
          onClick={() => navigate('/')}
          style={styles.backButton}
          aria-label="Voltar"
        >
          <Icons.ArrowLeft />
        </button>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>
            <Icons.ChartLine /> Resumo Anual
          </h1>
          <div style={styles.subtitle}>Visão completa do seu desempenho financeiro</div>
        </div>
      </div>

      {/* SELEÇÃO DE ANO */}
      <div style={styles.yearSelectorCard}>
        <div style={styles.yearSelectorHeader}>
          <Icons.Calendar />
          <h3 style={styles.yearSelectorTitle}>Selecionar Ano</h3>
        </div>
        <div style={styles.yearButtons}>
          {yearOptions.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              style={{
                ...styles.yearButton,
                background: selectedYear === year 
                  ? 'linear-gradient(135deg, #3b82f6, #2563eb)' 
                  : '#1e293b',
                color: selectedYear === year ? 'white' : '#94a3b8'
              }}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* CARDS DE RESUMO */}
      <div style={styles.summaryCards}>
        <div style={styles.summaryCard}>
          <div style={{ ...styles.summaryIcon, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Icons.TrendingUp />
          </div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryLabel}>Total Recebido</div>
            <div style={styles.summaryValue}>R$ {totalIncome.toFixed(2)}</div>
            <div style={styles.summarySubtitle}>No ano de {selectedYear}</div>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={{ ...styles.summaryIcon, background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            <Icons.TrendingDown />
          </div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryLabel}>Total Gastos</div>
            <div style={styles.summaryValue}>R$ {totalExpense.toFixed(2)}</div>
            <div style={styles.summarySubtitle}>No ano de {selectedYear}</div>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={{ 
            ...styles.summaryIcon, 
            background: totalBalance >= 0 
              ? 'linear-gradient(135deg, #3b82f6, #2563eb)' 
              : 'linear-gradient(135deg, #f59e0b, #d97706)'
          }}>
            <Icons.Dollar />
          </div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryLabel}>Saldo Anual</div>
            <div style={{
              ...styles.summaryValue,
              color: totalBalance >= 0 ? '#3b82f6' : '#f59e0b'
            }}>
              R$ {totalBalance.toFixed(2)}
            </div>
            <div style={styles.summarySubtitle}>
              Média mensal: R$ {averageMonthly.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICO */}
      <div style={styles.chartCard}>
        <div style={styles.chartHeader}>
          <h3 style={styles.chartTitle}>
            <Icons.Filter /> Distribuição Mensal - {selectedYear}
          </h3>
          <div style={styles.chartInfo}>
            <Icons.Info />
            <span style={styles.chartInfoText}>Passe o mouse para detalhes</span>
          </div>
        </div>
        
        {isLoading ? (
          <div style={styles.chartLoading}>
            <div style={styles.loadingSpinner}></div>
            <div style={styles.loadingText}>Gerando gráfico...</div>
          </div>
        ) : data.length > 0 ? (
          <>
            <AnnualChart data={data} />
            <div style={styles.chartLegend}>
              <div style={styles.legendItem}>
                <div style={{ ...styles.legendColor, background: '#10b981' }}></div>
                <span>Entradas</span>
              </div>
              <div style={styles.legendItem}>
                <div style={{ ...styles.legendColor, background: '#ef4444' }}></div>
                <span>Gastos</span>
              </div>
            </div>
          </>
        ) : (
          <div style={styles.emptyChart}>
            <div style={styles.emptyChartIcon}>📊</div>
            <h4 style={styles.emptyChartTitle}>Sem dados para exibir</h4>
            <p style={styles.emptyChartText}>
              Não há transações registradas para {selectedYear}
            </p>
          </div>
        )}
      </div>

      {/* MESES DESTAQUES */}
      {data.length > 0 && (
        <div style={styles.highlightsCard}>
          <h3 style={styles.highlightsTitle}>📈 Destaques do Ano</h3>
          <div style={styles.highlightsGrid}>
            <div style={styles.highlightItem}>
              <div style={styles.highlightLabel}>Melhor mês</div>
              <div style={styles.highlightContent}>
                <div style={styles.highlightMonth}>
                  {bestMonth ? monthNames[bestMonth.month - 1] : 'N/A'}
                </div>
                <div style={{ ...styles.highlightValue, color: '#10b981' }}>
                  R$ {bestMonth?.total.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>

            <div style={styles.highlightItem}>
              <div style={styles.highlightLabel}>Mês mais crítico</div>
              <div style={styles.highlightContent}>
                <div style={styles.highlightMonth}>
                  {worstMonth ? monthNames[worstMonth.month - 1] : 'N/A'}
                </div>
                <div style={{ ...styles.highlightValue, color: '#ef4444' }}>
                  R$ {worstMonth?.total.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>

            <div style={styles.highlightItem}>
              <div style={styles.highlightLabel}>Balanço anual</div>
              <div style={styles.highlightContent}>
                <div style={styles.highlightMonth}>{selectedYear}</div>
                <div style={{
                  ...styles.highlightValue,
                  color: totalBalance >= 0 ? '#3b82f6' : '#f59e0b'
                }}>
                  {totalBalance >= 0 ? 'Positivo' : 'Negativo'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TABELA DETALHADA */}
      <div style={styles.tableCard}>
        <h3 style={styles.tableTitle}>Detalhamento Mensal - {selectedYear}</h3>
        
        {isLoading ? (
          <div style={styles.tableLoading}>
            <div style={styles.loadingSpinner}></div>
            <div style={styles.loadingText}>Carregando dados...</div>
          </div>
        ) : data.length > 0 ? (
          <>
            <div style={styles.table}>
              <div style={styles.tableHeader}>
                <div style={styles.tableCellHeader}>Mês</div>
                <div style={styles.tableCellHeader}>Entradas</div>
                <div style={styles.tableCellHeader}>Gastos</div>
                <div style={styles.tableCellHeader}>Saldo</div>
              </div>
              
              {data.map(month => (
                <div 
                  key={month.month} 
                  style={styles.tableRow}
                >
                  <div style={styles.tableCell}>
                    <div style={styles.monthName}>
                      {monthNames[month.month - 1]}
                    </div>
                    <div style={styles.monthNumber}>
                      {month.month.toString().padStart(2, '0')}
                    </div>
                  </div>
                  <div style={{ ...styles.tableCell, color: '#10b981' }}>
                    R$ {month.income.toFixed(2)}
                  </div>
                  <div style={{ ...styles.tableCell, color: '#ef4444' }}>
                    R$ {month.expense.toFixed(2)}
                  </div>
                  <div style={{
                    ...styles.tableCell,
                    color: month.total >= 0 ? '#3b82f6' : '#f59e0b',
                    fontWeight: '600'
                  }}>
                    R$ {month.total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* RESUMO DA TABELA */}
            <div style={styles.tableSummary}>
              <div style={styles.tableSummaryItem}>
                <span>Total Recebido:</span>
                <strong style={{ color: '#10b981' }}>R$ {totalIncome.toFixed(2)}</strong>
              </div>
              <div style={styles.tableSummaryItem}>
                <span>Total Gastos:</span>
                <strong style={{ color: '#ef4444' }}>R$ {totalExpense.toFixed(2)}</strong>
              </div>
              <div style={styles.tableSummaryItem}>
                <span>Saldo Final:</span>
                <strong style={{ 
                  color: totalBalance >= 0 ? '#3b82f6' : '#f59e0b' 
                }}>
                  R$ {totalBalance.toFixed(2)}
                </strong>
              </div>
            </div>
          </>
        ) : (
          <div style={styles.emptyTable}>
            <div style={styles.emptyTableIcon}>📋</div>
            <p style={styles.emptyTableText}>
              Nenhum dado disponível para {selectedYear}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Estilos
const styles = {
  container: {
    padding: '20px 16px',
    background: '#0f172a',
    minHeight: '100vh',
    color: '#f8fafc'
  },
  
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '24px'
  },
  
  backButton: {
    background: 'transparent',
    border: 'none',
    color: '#cbd5e1',
    cursor: 'pointer',
    padding: '8px',
    marginRight: '12px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  
  headerContent: {
    flex: 1
  },
  
  title: {
    fontSize: '24px',
    fontWeight: '700',
    margin: 0,
    background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  
  subtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    marginTop: '4px'
  },
  
  yearSelectorCard: {
    background: '#1e293b',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
    border: '1px solid #334155'
  },
  
  yearSelectorHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px'
  },
  
  yearSelectorTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
    color: '#f8fafc'
  },
  
  yearButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const
  },
  
  yearButton: {
    padding: '10px 20px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flex: 1,
    minWidth: '80px'
  },
  
  summaryCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(1, 1fr)',
    gap: '16px',
    marginBottom: '24px',
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(3, 1fr)'
    }
  },
  
  summaryCard: {
    background: '#1e293b',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid #334155',
    display: 'flex',
    alignItems: 'center'
  },
  
  summaryIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '16px',
    color: 'white'
  },
  
  summaryContent: {
    flex: 1
  },
  
  summaryLabel: {
    fontSize: '14px',
    color: '#94a3b8',
    marginBottom: '4px'
  },
  
  summaryValue: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '4px'
  },
  
  summarySubtitle: {
    fontSize: '12px',
    color: '#64748b'
  },
  
  chartCard: {
    background: '#1e293b',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
    border: '1px solid #334155'
  },
  
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  
  chartTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
    color: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  
  chartInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#94a3b8'
  },
  
  chartInfoText: {
    fontSize: '12px'
  },
  
  chartLegend: {
    display: 'flex',
    gap: '16px',
    marginTop: '20px',
    justifyContent: 'center'
  },
  
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#cbd5e1'
  },
  
  legendColor: {
    width: '12px',
    height: '12px',
    borderRadius: '4px'
  },
  
  chartLoading: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px'
  },
  
  emptyChart: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center' as const
  },
  
  emptyChartIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  
  emptyChartTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#f8fafc'
  },
  
  emptyChartText: {
    fontSize: '14px',
    color: '#94a3b8'
  },
  
  highlightsCard: {
    background: '#1e293b',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
    border: '1px solid #334155'
  },
  
  highlightsTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 20px 0',
    color: '#f8fafc'
  },
  
  highlightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(1, 1fr)',
    gap: '16px',
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(3, 1fr)'
    }
  },
  
  highlightItem: {
    background: '#0f172a',
    borderRadius: '12px',
    padding: '16px'
  },
  
  highlightLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    marginBottom: '8px'
  },
  
  highlightContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  
  highlightMonth: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#f8fafc'
  },
  
  highlightValue: {
    fontSize: '16px',
    fontWeight: '700'
  },
  
  tableCard: {
    background: '#1e293b',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid #334155'
  },
  
  tableTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 20px 0',
    color: '#f8fafc'
  },
  
  tableLoading: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px'
  },
  
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(51, 65, 85, 0.3)',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  
  loadingText: {
    marginTop: '16px',
    color: '#94a3b8',
    fontSize: '14px'
  },
  
  table: {
    overflowX: 'auto' as const
  },
  
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: '16px',
    padding: '12px 16px',
    background: '#0f172a',
    borderRadius: '10px',
    marginBottom: '8px'
  },
  
  tableCellHeader: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#94a3b8'
  },
  
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: '16px',
    padding: '16px',
    borderBottom: '1px solid #334155',
    alignItems: 'center'
  },
  
  tableCell: {
    fontSize: '14px'
  },
  
  monthName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f8fafc'
  },
  
  monthNumber: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '2px'
  },
  
  tableSummary: {
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #334155',
    display: 'grid',
    gridTemplateColumns: 'repeat(1, 1fr)',
    gap: '12px',
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(3, 1fr)'
    }
  },
  
  tableSummaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#0f172a',
    borderRadius: '10px',
    fontSize: '14px'
  },
  
  emptyTable: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center' as const
  },
  
  emptyTableIcon: {
    fontSize: '32px',
    marginBottom: '16px'
  },
  
  emptyTableText: {
    fontSize: '14px',
    color: '#94a3b8'
  }
}

// Adicionar animação
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `
  document.head.appendChild(style)
}