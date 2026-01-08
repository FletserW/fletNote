import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getTransactionsByFilter,
  calculateSummary,
  addTransaction
} from '../services/financeService'
import { requestNotificationPermission } from '../services/notificationService'
import { getGoal, saveGoal } from '../services/goalService'
import type { Goal } from '../types/Goal'
// Ícones simples em SVG
const Icons = {
  Wallet: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12V7H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14v4" />
      <path d="M3 9v9a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12h.01" />
    </svg>
  ),
  Target: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
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
  Chart: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Plus: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  PiggyBank: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h12v-3.5c1.2-1.3 2-2.5 2-4.5 0-2.5-2.5-4-5-4z" />
      <path d="M12 9v6" />
      <path d="M15 12h-6" />
    </svg>
  )
}

export default function Finance() {
  const navigate = useNavigate()
  const today = new Date()
  const isMounted = useRef(true)

  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [goal, setGoal] = useState<Goal>({
    id: 1,
    name: 'PC Gamer',
    target: 7000,
    saved: 0
  })
  const [monthData, setMonthData] = useState({ income: 0, expense: 0 })

  /* ============================
     LOAD ALL DATA (corrigido - sem isLoading na dependência)
  ============================ */
  const loadAllData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true)
    }
    
    try {
      // Carrega transações e calcula sumário
      const data = await getTransactionsByFilter(
        today.getMonth() + 1,
        today.getFullYear()
      )
      const summary = calculateSummary(data)
      
      // Atualiza estados apenas se o componente ainda estiver montado
      if (isMounted.current) {
        setTotal(summary.total)
        setMonthData({ 
          income: summary.income, 
          expense: summary.expense 
        })
      }

      // Carrega a meta
      const storedGoal = await getGoal()
      if (storedGoal && isMounted.current) {
        setGoal(storedGoal)
      } else if (isMounted.current) {
        await saveGoal(goal)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      if (isMounted.current && showLoading) {
        setIsLoading(false)
      }
    }
  }, [today, goal])

  /* ============================
     INITIAL LOAD (simplificado)
  ============================ */
  useEffect(() => {
    isMounted.current = true
    requestNotificationPermission()
    
    // Carrega dados iniciais apenas uma vez
    loadAllData()

    return () => {
      isMounted.current = false
    }
  }, []) // Array vazio = executa apenas uma vez

  /* ============================
     ADD TO SAFE (otimizado)
  ============================ */
  const addToSafe = useCallback(async (amount: number) => {
    if (amount > total) {
      alert('Saldo insuficiente para guardar esse valor')
      return
    }

    try {
      // Adiciona transação
      await addTransaction({
        type: 'expense',
        amount: amount,
        category: 'Cofre',
        description: `Depósito no cofre: ${goal.name}`,
        date: new Date().toISOString()
      })

      // Atualiza meta localmente primeiro (feedback instantâneo)
      const newSaved = Math.min(goal.saved + amount, goal.target)
      const updatedGoal = { ...goal, saved: newSaved }
      
      setGoal(updatedGoal)
      // Salva em segundo plano
      saveGoal(updatedGoal)

      // Recarrega dados sem mostrar loading
      await loadAllData(false)

    } catch (error) {
      console.error('Erro ao adicionar ao cofre:', error)
      alert('Erro ao adicionar valor ao cofre')
    }
  }, [total, goal, loadAllData])

  const progress = Math.min((goal.saved / goal.target) * 100, 100)
  const remaining = goal.target - goal.saved

  // Se estiver carregando e ainda não tem dados, mostra loading
  if (isLoading && total === 0 && monthData.income === 0 && monthData.expense === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <div style={styles.loadingText}>Carregando seus dados...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>Finanças Pessoais</h1>
        <div style={styles.date}>
          {today.toLocaleDateString('pt-BR', { 
            month: 'long', 
            year: 'numeric' 
          }).replace(/^\w/, c => c.toUpperCase())}
        </div>
      </div>

      {/* SALDO CARD */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardIcon}>
            <Icons.Wallet />
          </div>
          <div>
            <h3 style={styles.cardTitle}>Saldo Disponível</h3>
            <div style={styles.cardSubtitle}>Mês atual</div>
          </div>
        </div>
        
        <div style={{
          ...styles.balanceAmount,
          color: total >= 0 ? '#10b981' : '#ef4444',
          opacity: isLoading ? 0.7 : 1
        }}>
          {isLoading ? '...' : `R$ ${total.toFixed(2)}`}
        </div>
        
        <div style={styles.balanceInfo}>
          <div style={styles.balanceItem}>
            <span style={styles.balanceLabel}>Entradas</span>
            <span style={{ color: '#10b981', fontWeight: '600', opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? '...' : `R$ ${monthData.income.toFixed(2)}`}
            </span>
          </div>
          <div style={styles.balanceDivider} />
          <div style={styles.balanceItem}>
            <span style={styles.balanceLabel}>Saídas</span>
            <span style={{ color: '#ef4444', fontWeight: '600', opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? '...' : `R$ ${monthData.expense.toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>

      {/* COFRE CARD */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={{ ...styles.cardIcon, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            <Icons.PiggyBank />
          </div>
          <div>
            <h3 style={styles.cardTitle}>Meu Cofre</h3>
            <div style={styles.cardSubtitle}>{goal.name}</div>
          </div>
        </div>

        {/* PROGRESSO */}
        <div style={styles.progressSection}>
          <div style={styles.progressHeader}>
            <span style={styles.progressLabel}>Progresso</span>
            <span style={styles.progressPercentage}>{progress.toFixed(1)}%</span>
          </div>
          
          <div style={styles.progressBar}>
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10b981, #34d399)',
                borderRadius: 10,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
          
          <div style={styles.progressValues}>
            <span style={styles.progressValue}>
              <span style={{ color: '#94a3b8', fontSize: 14 }}>Guardado:</span>
              <span style={{ fontWeight: '600', marginLeft: 8 }}>R$ {goal.saved.toFixed(2)}</span>
            </span>
            <span style={styles.progressValue}>
              <span style={{ color: '#94a3b8', fontSize: 14 }}>Meta:</span>
              <span style={{ fontWeight: '600', marginLeft: 8 }}>R$ {goal.target.toFixed(2)}</span>
            </span>
          </div>
          
          {remaining > 0 && (
            <div style={styles.remainingText}>
              Faltam R$ {remaining.toFixed(2)} para atingir a meta
            </div>
          )}
        </div>

        {/* BOTÕES RÁPIDOS */}
        <div style={styles.quickActions}>
          <div style={styles.quickActionsLabel}>Adicionar valor:</div>
          <div style={styles.quickActionsGrid}>
            {[10, 50, 100, 500, 1000, 5000].map((value) => (
              <button
                key={value}
                onClick={() => addToSafe(value)}
                style={{
                  ...styles.quickActionButton,
                  background: (value <= total && !isLoading) 
                    ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                    : '#94a3b8',
                  cursor: (value <= total && !isLoading) ? 'pointer' : 'not-allowed',
                  opacity: (value <= total && !isLoading) ? 1 : 0.6
                }}
                disabled={value > total || isLoading}
              >
                +R$ {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MENU DE NAVEGAÇÃO */}
      <div style={styles.navGrid}>
        <div 
          style={styles.navCard}
          onClick={() => navigate('/statement')}
        >
          <div style={{ ...styles.navIcon, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Icons.Chart />
          </div>
          <div style={styles.navContent}>
            <h4 style={styles.navTitle}>Extrato</h4>
            <p style={styles.navDescription}>Ver todas as transações</p>
          </div>
          <div style={styles.navArrow}>
            <Icons.ArrowRight />
          </div>
        </div>

        <div 
          style={styles.navCard}
          onClick={() => navigate('/annual')}
        >
          <div style={{ ...styles.navIcon, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            <Icons.Calendar />
          </div>
          <div style={styles.navContent}>
            <h4 style={styles.navTitle}>Resumo Anual</h4>
            <p style={styles.navDescription}>Visão completa do ano</p>
          </div>
          <div style={styles.navArrow}>
            <Icons.ArrowRight />
          </div>
        </div>
      </div>

      {/* FLOATING ACTION BUTTON */}
      <button
        onClick={() => navigate('/add')}
        style={{
          ...styles.fab,
          opacity: isLoading ? 0.7 : 1,
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }}
        disabled={isLoading}
        aria-label="Adicionar transação"
      >
        <Icons.Plus />
      </button>

      {/* LOADING OVERLAY sutil (apenas durante atualizações) */}
      {isLoading && total > 0 && (
        <div style={styles.loadingOverlay}>
          <div style={styles.miniSpinner}></div>
        </div>
      )}
    </div>
  )
}
// Adicionando estilos de loading
const styles = {
  // ... (seus estilos anteriores permanecem) ...

  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '70vh',
    padding: '60px 20px'
  },
  
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(51, 65, 85, 0.3)',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  
  loadingText: {
    marginTop: '16px',
    color: '#94a3b8',
    fontSize: '16px'
  },
  
  loadingOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(2px)'
  },
  
  miniSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(51, 65, 85, 0.3)',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  
  container: {
    padding: '20px 16px',
    background: '#0f172a',
    minHeight: '100vh',
    color: '#f8fafc'
  },
  
  header: {
    marginBottom: 24
  },
  
  title: {
    fontSize: '28px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    margin: 0,
    marginBottom: 8
  },
  
  date: {
    fontSize: '14px',
    color: '#94a3b8'
  },
  
  card: {
    background: '#1e293b',
    borderRadius: '20px',
    padding: '20px',
    marginBottom: '16px',
    border: '1px solid #334155',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
  },
  
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px'
  },
  
  cardIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
    color: 'white'
  },
  
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
    color: '#f8fafc'
  },
  
  cardSubtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    marginTop: '4px'
  },
  
  balanceAmount: {
    fontSize: '36px',
    fontWeight: '700',
    marginBottom: '16px',
    fontFamily: 'monospace'
  },
  
  balanceInfo: {
    display: 'flex',
    alignItems: 'center',
    background: '#0f172a',
    borderRadius: '12px',
    padding: '12px'
  },
  
  balanceItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center'
  },
  
  balanceLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    marginBottom: '4px'
  },
  
  balanceDivider: {
    width: '1px',
    height: '24px',
    background: '#334155'
  },
  
  progressSection: {
    marginTop: '16px'
  },
  
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  
  progressLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f8fafc'
  },
  
  progressPercentage: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#10b981'
  },
  
  progressBar: {
    height: '8px',
    background: '#334155',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '16px'
  },
  
  progressValues: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  
  progressValue: {
    display: 'flex',
    alignItems: 'center'
  },
  
  remainingText: {
    fontSize: '13px',
    color: '#fbbf24',
    background: 'rgba(251, 191, 36, 0.1)',
    padding: '8px 12px',
    borderRadius: '8px',
    textAlign: 'center' as const,
    marginTop: '12px'
  },
  
  quickActions: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #334155'
  },
  
  quickActionsLabel: {
    fontSize: '14px',
    color: '#94a3b8',
    marginBottom: '12px'
  },
  
  quickActionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px'
  },
  
  quickActionButton: {
    padding: '12px 8px',
    borderRadius: '12px',
    border: 'none',
    color: 'white',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  
  navGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px'
  },
  
  navCard: {
    background: '#1e293b',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #334155',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  
  navIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
    color: 'white'
  },
  
  navContent: {
    flex: 1
  },
  
  navTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
    color: '#f8fafc'
  },
  
  navDescription: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: '4px 0 0 0'
  },
  
  navArrow: {
    color: '#64748b'
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
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.5)',
    transition: 'all 0.2s ease'
  }
  
}

// Adicionar keyframes via CSS-in-JS
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);
