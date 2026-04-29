//src/pages/AddTransactions.tsx
import { useEffect, useState } from 'react'
import { addTransaction } from '../services/financeService'
import { useNavigate } from 'react-router-dom'
import { getCategories, addCategory, type Category,  } from '../services/categoryService'
import { useDesign } from '../contexts/DesignContext'


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


export default function AddTransaction() {
  const navigate = useNavigate()
  const { designMode } = useDesign()
  const isSimpleMode = designMode === 'assisted'

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Outros')
  const [description, setDescription] = useState('')
  const [customDate, setCustomDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('var(--app-primary)')
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])


  useEffect(() => {
    loadCategories()
  }, [type])

  const loadCategories = async () => {
    try {
      const cats = await getCategories(type)
      setCategories(cats)
      
      // Filtrar e ordenar por ordem
      const filtered = cats
        .filter(cat => cat.type === type)
        .sort((a, b) => (a.order || 999) - (b.order || 999))
      
      setFilteredCategories(filtered)
      
      // Definir categoria padrão se não houver selecionada
      if (filtered.length > 0 && !category) {
        const defaultCategory = filtered.find(cat => cat.name === 'Outros') || filtered[0]
        setCategory(defaultCategory.name)
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  // Função para adicionar nova categoria
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Digite um nome para a categoria')
      return
    }

    setIsAddingCategory(true)
    try {
      const newCategory = await addCategory({
        name: newCategoryName.trim(),
        type: type,
        color: newCategoryColor,
        order: categories.filter(c => c.type === type).length + 1
      })

      // Atualizar lista de categorias
      await loadCategories()
      
      // Selecionar a nova categoria
      setCategory(newCategory.name)
      
      // Fechar modal e limpar formulário
      setShowAddCategoryModal(false)
      setNewCategoryName('')
      setNewCategoryColor('var(--app-primary)')
      
      alert(`✅ Categoria "${newCategory.name}" adicionada com sucesso!`)
    } catch (error) {
      console.error('Erro ao adicionar categoria:', error)
      alert(error instanceof Error ? error.message : 'Erro ao adicionar categoria')
    } finally {
      setIsAddingCategory(false)
    }
  }


  // Função de debug para testar storage
  const testStorage = async () => {
    console.log('🧪 Testando storage...');
    
    // Testar se localStorage está disponível
    if (typeof localStorage === 'undefined') {
      console.error('❌ localStorage não disponível!');
      return false;
    }
    
    try {
      // Testar escrita
      const testKey = '@finances/test';
      const testValue = 'test_' + Date.now();
      localStorage.setItem(testKey, testValue);
      
      // Testar leitura
      const readValue = localStorage.getItem(testKey);
      
      if (readValue === testValue) {
        console.log('✅ localStorage funcionando corretamente');
        localStorage.removeItem(testKey);
        return true;
      } else {
        console.error('❌ Falha na leitura do localStorage');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro no teste do localStorage:', error);
      return false;
    }
  };

  async function handleSave() {
    // Primeiro testar storage
    const storageWorking = await testStorage();
    if (!storageWorking) {
      alert('Erro: Armazenamento local não está disponível. Tente recarregar a página.');
      return;
    }

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
      const dateToUse = customDate 
        ? new Date(customDate + 'T12:00:00').toISOString()
        : new Date().toISOString()

      console.log('📝 Salvando transação com dados:', {
        type,
        amount: amountNumber,
        category,
        description,
        date: dateToUse
      });

      await addTransaction({
        type: type,
        amount: Math.abs(amountNumber),
        category,
        description: description || `Transação ${type === 'income' ? 'de entrada' : 'de gasto'}`,
        date: dateToUse
      })

      console.log('✅ Transação salva com sucesso!');

      setTimeout(() => {
        navigate('/')
      }, 300)

    } catch (error) {
      console.error('❌ Erro ao salvar transação:', error)
      alert('Erro ao salvar transação: ' + (error as Error).message)
      setIsLoading(false)
    }
  }

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
                  ? (isSimpleMode ? 'var(--app-success)' : 'linear-gradient(135deg, #10b981, #059669)')
                  : (isSimpleMode ? '#edf7f1' : 'var(--app-surface-elevated)'),
                border: type === 'income' ? 'none' : '1px solid var(--app-border)',
                color: type === 'income' ? 'white' : (isSimpleMode ? '#005c2e' : 'var(--app-text)')
              }}
              disabled={isLoading}
              type="button"
              aria-pressed={type === 'income'}
            >
              <div style={styles.typeButtonContent}>
                <Icons.Income />
                <span>Entrada</span>
              </div>
              <span style={{
                ...styles.typeButtonSubtitle,
                color: type === 'income' ? 'rgba(255, 255, 255, 0.92)' : (isSimpleMode ? '#005c2e' : 'var(--app-text-muted)')
              }}>Dinheiro recebido</span>
            </button>
            
            <button 
              onClick={() => {
                setType('expense')
                setCategory('Outros') // Categoria padrão para gasto
              }}
              style={{
                ...styles.typeButton,
                background: type === 'expense' 
                  ? (isSimpleMode ? 'var(--app-danger)' : 'linear-gradient(135deg, #ef4444, #dc2626)')
                  : (isSimpleMode ? '#fff0f2' : 'var(--app-surface-elevated)'),
                border: type === 'expense' ? 'none' : '1px solid var(--app-border)',
                color: type === 'expense' ? 'white' : (isSimpleMode ? '#9f1a2a' : 'var(--app-text)')
              }}
              disabled={isLoading}
              type="button"
              aria-pressed={type === 'expense'}
            >
              <div style={styles.typeButtonContent}>
                <Icons.Expense />
                <span>Gasto</span>
              </div>
              <span style={{
                ...styles.typeButtonSubtitle,
                color: type === 'expense' ? 'rgba(255, 255, 255, 0.92)' : (isSimpleMode ? '#9f1a2a' : 'var(--app-text-muted)')
              }}>Dinheiro gasto</span>
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
              id="transaction-amount"
              name="amount"
              aria-label="Valor da transação"
              inputMode="decimal"
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
            id="transaction-description"
            name="description"
            aria-label="Descrição da transação"
          />
          <div style={styles.charCount}>
            {description.length}/100 caracteres
          </div>
        </div>

        {/* CATEGORIA - ATUALIZADO */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={{ ...styles.sectionIcon, background: 'linear-gradient(135deg, var(--app-primary), #2563eb)' }}>
              <Icons.Category />
            </div>
            <div style={styles.sectionHeaderContent}>
              <h3 style={styles.sectionTitle}>Categoria</h3>
              <button
                onClick={() => setShowAddCategoryModal(true)}
                style={styles.addCategoryButton}
                type="button"
                disabled={isLoading}
                title="Adicionar nova categoria"
              >
                + Nova
              </button>
            </div>
          </div>
          
          <div style={styles.selectedCategory}>
            <span style={styles.selectedCategoryLabel}>Selecionada:</span>
            <span style={{
              ...styles.selectedCategoryValue,
              color: filteredCategories.find(c => c.name === category)?.color || 'var(--app-primary)'
            }}>
              {category}
            </span>
          </div>
          
          <div style={styles.categoriesGrid}>
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.name)}
                style={{
                  ...styles.categoryButton,
                  background: category === cat.name 
                    ? (cat.color || 'var(--app-primary)')
                    : 'var(--app-surface)',
                  border: category === cat.name ? 'none' : `1px solid ${cat.color || 'var(--app-border)'}`,
                  color: category === cat.name ? 'white' : (cat.color || 'var(--app-text)')
                }}
                disabled={isLoading}
                aria-pressed={category === cat.name}
                title={cat.isDefault ? 'Categoria padrão' : 'Categoria personalizada'}
              >
                {cat.name}
                {cat.isDefault && (
                  <span style={styles.defaultBadge}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* DATA (OPCIONAL) */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={{ ...styles.sectionIcon, background: 'linear-gradient(135deg, var(--app-text-subtle), #475569)' }}>
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
            id="transaction-date"
            name="date"
            aria-label="Data da transação"
          />
        </div>
      </div>

      {/* MODAL ADICIONAR CATEGORIA */}
      {showAddCategoryModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={styles.modalIcon}>🏷️</div>
              <div>
                <h3 style={styles.modalTitle}>Nova Categoria</h3>
                <div style={styles.modalSubtitle}>
                  Adicionar categoria de {type === 'income' ? 'entrada' : 'gasto'}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddCategoryModal(false)
                  setNewCategoryName('')
                  setNewCategoryColor('var(--app-primary)')
                }}
                style={styles.modalCloseButton}
              >
                ×
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Nome da Categoria</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={`Ex: ${type === 'income' ? 'Bônus, Dividendos' : 'Transporte, Saúde'}...`}
                  style={styles.formInput}
                  autoFocus
                  maxLength={20}
                />
                <div style={styles.formHelp}>
                  Máximo: 20 caracteres
                </div>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Cor</label>
                <div style={styles.colorPicker}>
                  {[
                    'var(--app-primary)', '#ef4444', '#10b981', '#f59e0b', 
                    '#8b5cf6', '#ec4899', '#14b8a6', 'var(--app-text-subtle)'
                  ].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCategoryColor(color)}
                      style={{
                        ...styles.colorOption,
                        background: color,
                        border: newCategoryColor === color ? '3px solid white' : 'none',
                        transform: newCategoryColor === color ? 'scale(1.1)' : 'scale(1)'
                      }}
                      title={color}
                    />
                  ))}
                </div>
                <div style={styles.selectedColor}>
                  Cor selecionada: <span style={{ color: newCategoryColor }}>●</span>
                </div>
              </div>
              
              <div style={styles.modalActions}>
                <button
                  onClick={() => {
                    setShowAddCategoryModal(false)
                    setNewCategoryName('')
                    setNewCategoryColor('var(--app-primary)')
                  }}
                  style={styles.modalCancel}
                  disabled={isAddingCategory}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddCategory}
                  style={{
                    ...styles.modalConfirm,
                    background: newCategoryColor,
                    opacity: !newCategoryName.trim() ? 0.6 : 1,
                    cursor: !newCategoryName.trim() ? 'not-allowed' : 'pointer'
                  }}
                  disabled={!newCategoryName.trim() || isAddingCategory}
                >
                  {isAddingCategory ? 'Adicionando...' : 'Adicionar Categoria'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* BOTÕES DE AÇÃO */}
      <div style={styles.actionButtons}>
        <button 
          onClick={() => navigate('/')}
          style={styles.cancelButton}
          disabled={isLoading}
          type="button"
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
          type="button"
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

// Estilos permanecem os mesmos...

// Estilos
const styles = {
  container: {
    padding: '20px 16px',
    background: 'var(--app-surface)',
    minHeight: '100vh',
    color: 'var(--app-text)',
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
    color: 'var(--app-text-secondary)',
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
    background: 'var(--app-gradient-title)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent'
  },
  
  subtitle: {
    fontSize: '14px',
    color: 'var(--app-text-muted)',
    marginTop: '4px'
  },
  
  mainCard: {
    background: 'var(--app-surface-elevated)',
    borderRadius: '20px',
    padding: '20px',
    marginBottom: '20px',
    border: '1px solid var(--app-border)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
  },
  
  section: {
    marginBottom: '24px',
    paddingBottom: '24px',
    borderBottom: '1px solid var(--app-border)',
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
    color: 'var(--app-text)'
  },
  
  sectionSubtitle: {
    fontSize: '12px',
    color: 'var(--app-text-muted)',
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
    color: 'var(--app-text)',
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
    color: 'var(--app-text-muted)',
    textAlign: 'left' as const
  },
  
  amountInputContainer: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--app-surface)',
    borderRadius: '12px',
    border: '1px solid var(--app-border)',
    padding: '0 16px',
    transition: 'all 0.2s ease'
  },
  
  currencySymbol: {
    fontSize: '20px',
    fontWeight: '600',
    color: 'var(--app-text-muted)',
    marginRight: '8px'
  },
  
  amountInput: {
    flex: 1,
    padding: '16px 0',
    background: 'transparent',
    border: 'none',
    color: 'var(--app-text)',
    fontSize: '24px',
    fontWeight: '700',
    fontFamily: 'monospace',
    outline: 'none',
    '&::placeholder': {
      color: 'var(--app-text-subtle)'
    }
  },
  
  inputHint: {
    fontSize: '12px',
    color: 'var(--app-text-muted)',
    marginTop: '8px',
    textAlign: 'center' as const
  },
  
  textInput: {
    width: '100%',
    padding: '16px',
    background: 'var(--app-surface)',
    border: '1px solid var(--app-border)',
    borderRadius: '12px',
    color: 'var(--app-text)',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease'
  },
  
  charCount: {
    fontSize: '12px',
    color: 'var(--app-text-subtle)',
    textAlign: 'right' as const,
    marginTop: '4px'
  },
  
  selectedCategory: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--app-surface)',
    padding: '12px 16px',
    borderRadius: '12px',
    marginBottom: '16px',
    border: '1px solid var(--app-border)'
  },
  
  selectedCategoryLabel: {
    fontSize: '14px',
    color: 'var(--app-text-muted)'
  },
  
  selectedCategoryValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--app-primary)'
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
    background: 'var(--app-surface)',
    border: '1px solid var(--app-border)',
    borderRadius: '12px',
    color: 'var(--app-text)',
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
    background: 'var(--app-surface-elevated)',
    border: '1px solid var(--app-border)',
    borderRadius: '12px',
    color: 'var(--app-text-secondary)',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  
  saveButton: {
    padding: '16px',
    background: 'linear-gradient(135deg, var(--app-primary), #2563eb)',
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
    background: 'var(--app-surface-elevated)',
    padding: '32px',
    borderRadius: '20px',
    border: '1px solid var(--app-border)'
  },
  
  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '3px solid rgba(51, 65, 85, 0.3)',
    borderTop: '3px solid var(--app-primary)',
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
    color: 'var(--app-text)',
    fontWeight: '500'
  },

  sectionHeaderContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },

  addCategoryButton: {
    padding: '6px 12px',
    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },

  defaultBadge: {
    fontSize: '10px',
    marginLeft: '4px',
    opacity: 0.8
  },

  // Modal styles
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'var(--app-overlay)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    backdropFilter: 'blur(4px)',
    padding: '20px'
  },

  modalContent: {
    background: 'var(--app-surface-elevated)',
    borderRadius: '20px',
    padding: '24px',
    width: '100%',
    maxWidth: '400px',
    border: '1px solid var(--app-border)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
  },

  modalHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '24px',
    position: 'relative' as const
  },

  modalIcon: {
    fontSize: '32px',
    marginRight: '12px',
    marginTop: '2px'
  },

  modalTitle: {
    fontSize: '20px',
    fontWeight: '600' as const,
    color: 'var(--app-text)',
    margin: 0,
    marginBottom: '4px'
  },

  modalSubtitle: {
    fontSize: '14px',
    color: 'var(--app-text-muted)'
  },

  modalCloseButton: {
    position: 'absolute' as const,
    top: '0',
    right: '0',
    background: 'transparent',
    border: 'none',
    color: 'var(--app-text-muted)',
    fontSize: '24px',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'all 0.2s ease'
  },

  modalBody: {
    marginBottom: '20px'
  },

  formGroup: {
    marginBottom: '20px'
  },

  formLabel: {
    display: 'block' as const,
    fontSize: '14px',
    fontWeight: '600' as const,
    color: 'var(--app-text)',
    marginBottom: '8px'
  },

  formInput: {
    width: '100%',
    padding: '12px 16px',
    background: 'var(--app-surface)',
    border: '1px solid var(--app-border)',
    borderRadius: '12px',
    color: 'var(--app-text)',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s ease'
  },

  formHelp: {
    fontSize: '12px',
    color: 'var(--app-text-muted)',
    marginTop: '4px'
  },

  colorPicker: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginBottom: '12px'
  },

  colorOption: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },

  selectedColor: {
    fontSize: '13px',
    color: 'var(--app-text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  modalActions: {
    display: 'flex',
    gap: '12px'
  },

  modalCancel: {
    flex: 1,
    padding: '12px',
    border: '1px solid var(--app-border)',
    background: 'transparent',
    color: 'var(--app-text-muted)',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },

  modalConfirm: {
    flex: 1,
    padding: '12px',
    border: 'none',
    color: 'white',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
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
