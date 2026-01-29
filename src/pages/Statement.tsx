import { useEffect, useState, useCallback } from 'react'
import { getTransactionsByFilter, calculateSummary } from '../services/financeService'
import type { Transaction } from '../types/Transaction'
import { useNavigate } from 'react-router-dom'


// Ícones (adicionar ícone de calendário para datas)
const Icons = {
  // ... outros ícones permanecem iguais ...
  
  CalendarDay: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <text x="12" y="17" textAnchor="middle" fontSize="6" fill="currentColor">DD</text>
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  Filter: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  Calendar: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Category: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 11h16M4 6h16M4 16h16M4 21h16" />
    </svg>
  ),
  Income: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12l7-7 7 7" />
    </svg>
  ),
  Expense: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  ),
  Search: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Empty: () => (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="9" x2="15" y2="15" />
      <line x1="15" y1="9" x2="9" y2="15" />
    </svg>
  )
}


export default function Statement() {
  const navigate = useNavigate()
  const today = new Date()

  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  const [category, setCategory] = useState('Todos')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<Transaction[]>([])
  const [groupedItems, setGroupedItems] = useState<Record<string, Transaction[]>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Função para formatar data para chave de agrupamento (YYYY-MM-DD)
  const getDateKey = (dateString: string) => {
    const date = new Date(dateString)
    return date.toISOString().split('T')[0] // Retorna YYYY-MM-DD
  }

  // Função para formatar data para exibição
  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).replace(/^\w/, c => c.toUpperCase())
  }

  // Função para formatar data curta (usada no header do grupo)
  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const isToday = date.toDateString() === today.toDateString()
    const isYesterday = date.toDateString() === yesterday.toDateString()
    
    if (isToday) return 'Hoje'
    if (isYesterday) return 'Ontem'
    
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    }).replace(/^\w/, c => c.toUpperCase())
  }

  // Função para calcular total do dia
  /*const calculateDayTotal = (transactions: Transaction[]) => {
    return transactions.reduce((total, tx) => {
      return tx.type === 'income' ? total + tx.amount : total - tx.amount
    }, 0)
  }*/

  // Agrupar transações por data
  const groupTransactionsByDate = (transactions: Transaction[]) => {
    const grouped: Record<string, Transaction[]> = {}
    
    transactions.forEach(transaction => {
      const dateKey = getDateKey(transaction.date)
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(transaction)
    })
    
    // Ordenar por data (mais recente primeiro)
    return Object.keys(grouped)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .reduce((sorted, dateKey) => {
        // Ordenar transações dentro do dia (mais recente primeiro)
        sorted[dateKey] = grouped[dateKey].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        return sorted
      }, {} as Record<string, Transaction[]>)
  }

  // Carregar transações
  const loadTransactions = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getTransactionsByFilter(
        month,
        year,
        category === 'Todos' ? undefined : category
      )
      setItems(data)
      setGroupedItems(groupTransactionsByDate(data))
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
    } finally {
      setIsLoading(false)
    }
  }, [month, year, category])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  // Resumo calculado
  const summary = calculateSummary(items)

  // Filtrar por busca
  const filteredGroupedItems = Object.keys(groupedItems).reduce((filtered, dateKey) => {
    const dayTransactions = groupedItems[dateKey]
    const filteredDayTransactions = dayTransactions.filter(item => 
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
    )
    
    if (filteredDayTransactions.length > 0) {
      filtered[dateKey] = filteredDayTransactions
    }
    
    return filtered
  }, {} as Record<string, Transaction[]>)

  // Calcular totais de dias para exibição
  const getDayTotals = (transactions: Transaction[]) => {
    const income = transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0)
    
    const expense = transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0)
    
    const total = income - expense
    
    return { income, expense, total }
  }

  // Nome do mês
  const monthName = new Date(year, month - 1).toLocaleDateString('pt-BR', {
    month: 'long'
  }).replace(/^\w/, c => c.toUpperCase())

  const categories = [
  'Todos',
  'Jogos', 
  'Comida', 
  'Roupa', 
  'Cabelo', 
  'Salario',
  'Lazer', 
  'Computador', 
  'Pink', 
  'Mãe', 
  'Cofre', 
  'Outros',
  'Retirada do Cofre', // Adicionada para transações de retirada
  'Teste' // Para testes
]

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
        <div>
          <h1 style={styles.title}>Extrato Financeiro</h1>
          <div style={styles.subtitle}>
            {monthName} de {year}
          </div>
        </div>
      </div>

      {/* CARDS DE RESUMO */}
      <div style={styles.summaryGrid}>
        <div style={{ ...styles.summaryCard, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
          <div style={styles.summaryIcon}>
            <Icons.Income />
          </div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryLabel}>Entradas</div>
            <div style={styles.summaryValue}>R$ {summary.income.toFixed(2)}</div>
          </div>
        </div>

        <div style={{ ...styles.summaryCard, background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
          <div style={styles.summaryIcon}>
            <Icons.Expense />
          </div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryLabel}>Saídas</div>
            <div style={styles.summaryValue}>R$ {summary.expense.toFixed(2)}</div>
          </div>
        </div>

        <div style={{ 
          ...styles.summaryCard, 
          background: summary.total >= 0 
            ? 'linear-gradient(135deg, #3b82f6, #2563eb)' 
            : 'linear-gradient(135deg, #f59e0b, #d97706)'
        }}>
          <div style={styles.summaryIcon}>
            {summary.total >= 0 ? (
              <Icons.Income />
            ) : (
              <Icons.Expense />
            )}
          </div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryLabel}>Saldo</div>
            <div style={styles.summaryValue}>R$ {summary.total.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div style={styles.filtersCard}>
        <h3 style={styles.filtersTitle}>
          <Icons.Filter /> Filtros
        </h3>
        
        <div style={styles.filtersGrid}>
          {/* MÊS */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>
              <Icons.Calendar /> Mês
            </label>
            <div style={styles.monthYearInputs}>
              <input
                type="number"
                value={month}
                min={1}
                max={12}
                onChange={e => setMonth(Number(e.target.value))}
                style={styles.monthInput}
                placeholder="Mês"
              />
              <input
                type="number"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                style={styles.yearInput}
                placeholder="Ano"
              />
            </div>
          </div>

          {/* CATEGORIA */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>
              <Icons.Category /> Categoria
            </label>
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              style={styles.selectInput}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* BUSCA */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>
              <Icons.Search /> Buscar
            </label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Descrição ou categoria..."
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* CONTADOR DE RESULTADOS */}
        <div style={styles.resultsCount}>
          {Object.keys(filteredGroupedItems).length} {Object.keys(filteredGroupedItems).length === 1 ? 'dia com' : 'dias com'} {items.length} {items.length === 1 ? 'transação' : 'transações'}
        </div>
      </div>

      {/* LISTA DE TRANSAÇÕES AGRUPADAS POR DATA */}
      <div style={styles.transactionsContainer}>
        {isLoading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <div style={styles.loadingText}>Carregando transações...</div>
          </div>
        ) : Object.keys(filteredGroupedItems).length === 0 ? (
          <div style={styles.emptyState}>
            <Icons.Empty />
            <h3 style={styles.emptyTitle}>Nenhuma transação encontrada</h3>
            <p style={styles.emptyText}>
              {items.length === 0 
                ? 'Não há transações para o período selecionado.'
                : 'Nenhuma transação corresponde aos filtros aplicados.'}
            </p>
            {items.length === 0 && (
              <button 
                onClick={() => navigate('/add')}
                style={styles.emptyButton}
              >
                Adicionar Primeira Transação
              </button>
            )}
          </div>
        ) : (
          Object.keys(filteredGroupedItems).map(dateKey => {
            const dayTransactions = filteredGroupedItems[dateKey]
            const dayTotals = getDayTotals(dayTransactions)
            
            return (
              <div key={dateKey} style={styles.dayGroup}>
                {/* HEADER DO DIA */}
                <div style={styles.dayHeader}>
                  <div style={styles.dayHeaderLeft}>
                    <div style={styles.dayIcon}>
                      <Icons.CalendarDay />
                    </div>
                    <div>
                      <div style={styles.dayShortDate}>
                        {formatShortDate(dateKey)}
                      </div>
                      <div style={styles.dayFullDate}>
                        {formatDateDisplay(dateKey)}
                      </div>
                    </div>
                  </div>
                  <div style={styles.dayTotal}>
                    <span style={{
                      color: dayTotals.total >= 0 ? '#10b981' : '#ef4444',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      {dayTotals.total >= 0 ? '+' : ''}R$ {dayTotals.total.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {/* RESUMO DO DIA */}
                <div style={styles.daySummary}>
                  <div style={styles.daySummaryItem}>
                    <span style={styles.daySummaryLabel}>Entradas:</span>
                    <span style={styles.daySummaryIncome}>+R$ {dayTotals.income.toFixed(2)}</span>
                  </div>
                  <div style={styles.daySummaryItem}>
                    <span style={styles.daySummaryLabel}>Saídas:</span>
                    <span style={styles.daySummaryExpense}>-R$ {dayTotals.expense.toFixed(2)}</span>
                  </div>
                </div>
                
                {/* LISTA DE TRANSAÇÕES DO DIA */}
                <div style={styles.dayTransactions}>
                  {dayTransactions.map(item => (
                    <div 
                      key={item.id} 
                      style={{
                        ...styles.transactionCard,
                        borderLeft: `4px solid ${item.type === 'income' ? '#10b981' : '#ef4444'}`
                      }}
                    >
                      <div style={styles.transactionHeader}>
                        <div style={styles.transactionTypeIcon}>
                          {item.type === 'income' ? (
                            <div style={styles.incomeIcon}>
                              <Icons.Income />
                            </div>
                          ) : (
                            <div style={styles.expenseIcon}>
                              <Icons.Expense />
                            </div>
                          )}
                        </div>
                        <div style={styles.transactionMain}>
                          <div style={styles.transactionCategory}>
                            {item.category}
                          </div>
                          <div style={styles.transactionDescription}>
                            {item.description || 'Sem descrição'}
                          </div>
                        </div>
                        <div style={styles.transactionAmount}>
                          <span style={{
                            color: item.type === 'income' ? '#10b981' : '#ef4444',
                            fontWeight: '700',
                            fontSize: '16px'
                          }}>
                            {item.type === 'income' ? '+' : '-'} R$ {item.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <div style={styles.transactionFooter}>
                        <div style={styles.transactionTime}>
                          {new Date(item.date).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div style={styles.transactionTypeBadge}>
                          <span style={{
                            background: item.type === 'income' 
                              ? 'rgba(16, 185, 129, 0.1)' 
                              : 'rgba(239, 68, 68, 0.1)',
                            color: item.type === 'income' ? '#10b981' : '#ef4444',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {item.type === 'income' ? 'ENTRADA' : 'SAÍDA'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// Estilos atualizados
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
    marginBottom: '24px',
    position: 'relative' as const
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
  
  title: {
    fontSize: '24px',
    fontWeight: '700',
    margin: 0,
    background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent'
  },
  
  subtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    marginTop: '4px'
  },
  
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '24px'
  },
  
  summaryCard: {
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
  },
  
  summaryIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
    color: 'white'
  },
  
  summaryContent: {
    flex: 1
  },
  
  summaryLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '4px'
  },
  
  summaryValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'white'
  },
  
  filtersCard: {
    background: '#1e293b',
    borderRadius: '20px',
    padding: '20px',
    marginBottom: '24px',
    border: '1px solid #334155',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
  },
  
  filtersTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 20px 0',
    color: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(1, 1fr)',
    gap: '16px',
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(3, 1fr)'
    }
  },
  
  filterGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  
  filterLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#cbd5e1',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  
  monthYearInputs: {
    display: 'flex',
    gap: '8px'
  },
  
  monthInput: {
    flex: 1,
    padding: '10px 12px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '10px',
    color: '#f8fafc',
    fontSize: '14px'
  },
  
  yearInput: {
    flex: 2,
    padding: '10px 12px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '10px',
    color: '#f8fafc',
    fontSize: '14px'
  },
  
  selectInput: {
    padding: '10px 12px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '10px',
    color: '#f8fafc',
    fontSize: '14px',
    cursor: 'pointer'
  },
  
  searchInput: {
    padding: '10px 12px',
    paddingLeft: '40px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '10px',
    color: '#f8fafc',
    fontSize: '14px',
    position: 'relative' as const
  },
  
  resultsCount: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #334155',
    fontSize: '14px',
    color: '#94a3b8',
    textAlign: 'center' as const
  },
  
  transactionsContainer: {
    marginBottom: '80px'
  },
  
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px'
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
  
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center' as const
  },
  
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '20px 0 8px 0',
    color: '#f8fafc'
  },
  
  emptyText: {
    fontSize: '14px',
    color: '#94a3b8',
    marginBottom: '24px',
    maxWidth: '300px'
  },
  
  emptyButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  
  // NOVOS ESTILOS PARA AGRUPAMENTO POR DATA
  dayGroup: {
    marginBottom: '24px',
    background: '#1e293b',
    borderRadius: '20px',
    overflow: 'hidden',
    border: '1px solid #334155',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
  },
  
  dayHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    background: 'rgba(30, 41, 59, 0.8)',
    borderBottom: '1px solid #334155'
  },
  
  dayHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  
  dayIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  },
  
  dayShortDate: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#f8fafc'
  },
  
  dayFullDate: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '2px'
  },
  
  dayTotal: {
    fontSize: '16px',
    fontWeight: '700'
  },
  
  daySummary: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 20px',
    background: 'rgba(15, 23, 42, 0.5)',
    borderBottom: '1px solid #334155'
  },
  
  daySummaryItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px'
  },
  
  daySummaryLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase' as const
  },
  
  daySummaryIncome: {
    fontSize: '13px',
    color: '#10b981',
    fontWeight: '700'
  },
  
  daySummaryExpense: {
    fontSize: '13px',
    color: '#ef4444',
    fontWeight: '700'
  },
  
  dayTransactions: {
    padding: '12px'
  },
  
  transactionCard: {
    background: 'rgba(15, 23, 42, 0.5)',
    borderRadius: '12px',
    padding: '12px',
    marginBottom: '8px',
    border: '1px solid #334155',
    transition: 'all 0.2s ease'
  },
  
  transactionHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px'
  },
  
  transactionTypeIcon: {
    marginRight: '12px'
  },
  
  incomeIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'rgba(16, 185, 129, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#10b981'
  },
  
  expenseIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'rgba(239, 68, 68, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ef4444'
  },
  
  transactionMain: {
    flex: 1
  },
  
  transactionCategory: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: '2px'
  },
  
  transactionDescription: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  
  transactionAmount: {
    fontSize: '14px',
    fontWeight: '700'
  },
  
  transactionFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '8px',
    borderTop: '1px solid rgba(51, 65, 85, 0.3)'
  },
  
  transactionTime: {
    fontSize: '11px',
    color: '#64748b',
    fontFamily: 'monospace'
  },
  
  transactionTypeBadge: {
    // Estilo definido inline
  }
}

// Adicionar animação de spin
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