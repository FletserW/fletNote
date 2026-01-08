import { useState } from 'react'
import { addTransaction } from '../services/financeService'
import { useNavigate } from 'react-router-dom'
import type { TransactionType } from '../types/Transaction'

// Ícones
const Icons = {
  ArrowLeft: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  Plus: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Income: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12l7-7 7 7" />
    </svg>
  ),
  Expense: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  ),
  Dollar: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Description: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Category: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 7h-9M4 7h9m-9 5h16m-7 5h7M4 17h7" />
    </svg>
  ),
  Calendar: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

// Categorias organizadas por tipo
const expenseCategories = [
  'Jogos', 'Comida', 'Roupa', 'Cabelo', 'Lazer',
  'Computador', 'Pink', 'Mãe', 'Cofre', 'Outros'
]

const incomeCategories = [
  'Salário', 'Freelance', 'Investimentos', 'Presente', 'Reembolso', 'Outros'
]

export default function AddTransaction() {
  const navigate = useNavigate()

  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Outros')
  const [description, setDescription] = useState('')
  const [customDate, setCustomDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Categorias baseadas no tipo
  const currentCategories = type === 'income' ? incomeCategories : expenseCategories

  async function handleSave() {
    // Validações
    if (!amount || amount === '0') {
      alert('Digite um valor válido')
      return
    }
    
    const amountNumber = parseFloat(amount)
    if (isNaN(amountNumber) || amountNumber <= 0) {
      alert('Digite um valor maior que zero')
      return
    }

    setIsLoading(true)

    try {
      // Usar data customizada ou atual
      const dateToUse = customDate 
        ? new Date(customDate + 'T12:00:00').toISOString()
        : new Date().toISOString()

      await addTransaction({
        type: type,
        amount: Math.abs(amountNumber),
        category,
        description,
        date: dateToUse
      })

      // Feedback visual antes de navegar
      setTimeout(() => {
        navigate('/')
      }, 300)

    } catch (error) {
      console.error('Erro ao salvar transação:', error)
      alert('Erro ao salvar transação')
      setIsLoading(false)
    }
  }

  // Formatar data atual para input
  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <button 
          onClick={() => navigate('/')}
          style={styles.backButton}
          aria-label="Voltar"
          disabled={isLoading}
        >
          <Icons.ArrowLeft />
        </button>
        <div>
          <h1 style={styles.title}>Nova Transação</h1>
          <div style={styles.subtitle}>Adicione uma nova entrada ou gasto</div>
        </div>
      </div>

      {/* CARD PRINCIPAL */}
      <div style={styles.mainCard}>
        {/* TIPO DE TRANSAÇÃO */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionIcon}>
              {type === 'income' ? <Icons.Income /> : <Icons.Expense />}
            </div>
            <h3 style={styles.sectionTitle}>Tipo de Transação</h3>
          </div>
          
          <div style={styles.typeButtons}>
            <button 
              onClick={() => {
                setType('income')
                setCategory('Salário') // Categoria padrão para entrada
              }}
              style={{
                ...styles.typeButton,
                background: type === 'income' 
                  ? 'linear-gradient(135deg, #10b981, #059669)' 
                  : '#1e293b',
                border: type === 'income' ? 'none' : '1px solid #334155'
              }}
              disabled={isLoading}
            >
              <div style={styles.typeButtonContent}>
                <Icons.Income />
                <span>Entrada</span>
              </div>
              <span style={styles.typeButtonSubtitle}>Dinheiro recebido</span>
            </button>
            
            <button 
              onClick={() => {
                setType('expense')
                setCategory('Outros') // Categoria padrão para gasto
              }}
              style={{
                ...styles.typeButton,
                background: type === 'expense' 
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                  : '#1e293b',
                border: type === 'expense' ? 'none' : '1px solid #334155'
              }}
              disabled={isLoading}
            >
              <div style={styles.typeButtonContent}>
                <Icons.Expense />
                <span>Gasto</span>
              </div>
              <span style={styles.typeButtonSubtitle}>Dinheiro gasto</span>
            </button>
          </div>
        </div>

        {/* VALOR */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={{ ...styles.sectionIcon, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <Icons.Dollar />
            </div>
            <h3 style={styles.sectionTitle}>Valor</h3>
          </div>
          
          <div style={styles.amountInputContainer}>
            <span style={styles.currencySymbol}>R$</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              step="0.01"
              min="0"
              placeholder="0,00"
              style={styles.amountInput}
              disabled={isLoading}
              autoFocus
            />
          </div>
          <div style={styles.inputHint}>
            Use ponto para centavos (ex: 100.50)
          </div>
        </div>

        {/* DESCRIÇÃO */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={{ ...styles.sectionIcon, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
              <Icons.Description />
            </div>
            <h3 style={styles.sectionTitle}>Descrição</h3>
          </div>
          
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="O que foi essa transação? (opcional)"
            style={styles.textInput}
            disabled={isLoading}
            maxLength={100}
          />
          <div style={styles.charCount}>
            {description.length}/100 caracteres
          </div>
        </div>

        {/* CATEGORIA */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={{ ...styles.sectionIcon, background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
              <Icons.Category />
            </div>
            <h3 style={styles.sectionTitle}>Categoria</h3>
          </div>
          
          <div style={styles.selectedCategory}>
            <span style={styles.selectedCategoryLabel}>Selecionada:</span>
            <span style={styles.selectedCategoryValue}>{category}</span>
          </div>
          
          <div style={styles.categoriesGrid}>
            {currentCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                style={{
                  ...styles.categoryButton,
                  background: category === cat 
                    ? 'linear-gradient(135deg, #3b82f6, #2563eb)' 
                    : '#0f172a',
                  border: category === cat ? 'none' : '1px solid #334155'
                }}
                disabled={isLoading}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* DATA (OPCIONAL) */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={{ ...styles.sectionIcon, background: 'linear-gradient(135deg, #64748b, #475569)' }}>
              <Icons.Calendar />
            </div>
            <div>
              <h3 style={styles.sectionTitle}>Data da Transação</h3>
              <div style={styles.sectionSubtitle}>Deixe em branco para usar data atual</div>
            </div>
          </div>
          
          <input
            type="date"
            value={customDate}
            onChange={e => setCustomDate(e.target.value)}
            max={today}
            style={styles.dateInput}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* BOTÕES DE AÇÃO */}
      <div style={styles.actionButtons}>
        <button 
          onClick={() => navigate('/')}
          style={styles.cancelButton}
          disabled={isLoading}
        >
          Cancelar
        </button>
        
        <button 
          onClick={handleSave}
          style={{
            ...styles.saveButton,
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
          disabled={isLoading || !amount}
        >
          {isLoading ? (
            <div style={styles.loadingSpinnerSmall}></div>
          ) : (
            <>
              <Icons.Plus />
              Salvar Transação
            </>
          )}
        </button>
      </div>

      {/* LOADING OVERLAY */}
      {isLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingMessage}>
            <div style={styles.loadingSpinner}></div>
            <div style={styles.loadingText}>Salvando transação...</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Estilos
const styles = {
  container: {
    padding: '20px 16px',
    background: '#0f172a',
    minHeight: '100vh',
    color: '#f8fafc',
    position: 'relative' as const
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
  
  mainCard: {
    background: '#1e293b',
    borderRadius: '20px',
    padding: '20px',
    marginBottom: '20px',
    border: '1px solid #334155',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
  },
  
  section: {
    marginBottom: '24px',
    paddingBottom: '24px',
    borderBottom: '1px solid #334155',
    '&:last-child': {
      marginBottom: 0,
      paddingBottom: 0,
      borderBottom: 'none'
    }
  },
  
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px'
  },
  
  sectionIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
    color: 'white'
  },
  
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
    color: '#f8fafc'
  },
  
  sectionSubtitle: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '2px'
  },
  
  typeButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px'
  },
  
  typeButton: {
    padding: '16px',
    borderRadius: '12px',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
    gap: '8px'
  },
  
  typeButtonContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '600'
  },
  
  typeButtonSubtitle: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'left' as const
  },
  
  amountInputContainer: {
    display: 'flex',
    alignItems: 'center',
    background: '#0f172a',
    borderRadius: '12px',
    border: '1px solid #334155',
    padding: '0 16px',
    transition: 'all 0.2s ease'
  },
  
  currencySymbol: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#94a3b8',
    marginRight: '8px'
  },
  
  amountInput: {
    flex: 1,
    padding: '16px 0',
    background: 'transparent',
    border: 'none',
    color: '#f8fafc',
    fontSize: '24px',
    fontWeight: '700',
    fontFamily: 'monospace',
    outline: 'none',
    '&::placeholder': {
      color: '#64748b'
    }
  },
  
  inputHint: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '8px',
    textAlign: 'center' as const
  },
  
  textInput: {
    width: '100%',
    padding: '16px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '12px',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease'
  },
  
  charCount: {
    fontSize: '12px',
    color: '#64748b',
    textAlign: 'right' as const,
    marginTop: '4px'
  },
  
  selectedCategory: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#0f172a',
    padding: '12px 16px',
    borderRadius: '12px',
    marginBottom: '16px',
    border: '1px solid #334155'
  },
  
  selectedCategoryLabel: {
    fontSize: '14px',
    color: '#94a3b8'
  },
  
  selectedCategoryValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#3b82f6'
  },
  
  categoriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    '@media (min-width: 480px)': {
      gridTemplateColumns: 'repeat(3, 1fr)'
    }
  },
  
  categoryButton: {
    padding: '12px 8px',
    borderRadius: '10px',
    border: 'none',
    color: 'white',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  
  dateInput: {
    width: '100%',
    padding: '16px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '12px',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none'
  },
  
  actionButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '12px',
    marginBottom: '40px'
  },
  
  cancelButton: {
    padding: '16px',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    color: '#cbd5e1',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  
  saveButton: {
    padding: '16px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  
  loadingOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  },
  
  loadingMessage: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '16px',
    background: '#1e293b',
    padding: '32px',
    borderRadius: '20px',
    border: '1px solid #334155'
  },
  
  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '3px solid rgba(51, 65, 85, 0.3)',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  
  loadingSpinnerSmall: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  
  loadingText: {
    fontSize: '16px',
    color: '#f8fafc',
    fontWeight: '500'
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