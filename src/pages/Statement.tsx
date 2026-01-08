import { useEffect, useState, useCallback } from 'react'
import { getTransactionsByFilter, calculateSummary } from '../services/financeService'
import type { Transaction } from '../types/Transaction'
import { useNavigate } from 'react-router-dom'

// Ícones
const Icons = {
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

const categories = [
  'Todos',
  'Jogos', 'Comida', 'Roupa', 'Cabelo', 'Salario',
  'Lazer', 'Computador', 'Pink', 'Mãe', 'Cofre', 'Outros'
]

export default function Statement() {
  const navigate = useNavigate()
  const today = new Date()

  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  const [category, setCategory] = useState('Todos')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)

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
  const filteredItems = items.filter(item => 
    item.description.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  )

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Nome do mês
  const monthName = new Date(year, month - 1).toLocaleDateString('pt-BR', {
    month: 'long'
  }).replace(/^\w/, c => c.toUpperCase())

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
          {filteredItems.length} {filteredItems.length === 1 ? 'transação encontrada' : 'transações encontradas'}
        </div>
      </div>

      {/* LISTA DE TRANSAÇÕES */}
      <div style={styles.transactionsContainer}>
        {isLoading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <div style={styles.loadingText}>Carregando transações...</div>
          </div>
        ) : filteredItems.length === 0 ? (
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
          filteredItems.map(item => (
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
                <div style={styles.transactionDate}>
                  {formatDate(item.date)}
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
          ))
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
  
  transactionCard: {
    background: '#1e293b',
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '12px',
    border: '1px solid #334155',
    transition: 'all 0.2s ease'
  },
  
  transactionHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px'
  },
  
  transactionTypeIcon: {
    marginRight: '12px'
  },
  
  incomeIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'rgba(16, 185, 129, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#10b981'
  },
  
  expenseIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
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
    fontSize: '16px',
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: '4px'
  },
  
  transactionDescription: {
    fontSize: '14px',
    color: '#94a3b8'
  },
  
  transactionAmount: {
    fontSize: '16px',
    fontWeight: '700'
  },
  
  transactionFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px solid #334155'
  },
  
  transactionDate: {
    fontSize: '12px',
    color: '#64748b'
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