// src/pages/ManageCategories.tsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  getCategories, 
  updateCategory, 
  deleteCategory, 
  reorderCategories,
  resetToDefaultCategories,
  type Category,
  type CategoryType
} from '../services/categoryService'

const Icons = {
  ArrowLeft: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  Edit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Delete: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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
  Reset: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 4v6h-6M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  Drag: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  )
}

export default function ManageCategories() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<CategoryType>('expense')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const cats = await getCategories()
      setCategories(cats)
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const filteredCategories = categories
    .filter(cat => cat.type === selectedType)
    .sort((a, b) => (a.order || 999) - (b.order || 999))

  const handleUpdateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      await updateCategory(id, updates)
      await loadCategories()
      alert('✅ Categoria atualizada com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error)
      alert(error instanceof Error ? error.message : 'Erro ao atualizar categoria')
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${name}"?`)) {
      return
    }

    try {
      await deleteCategory(id)
      await loadCategories()
      alert('✅ Categoria excluída com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
      alert(error instanceof Error ? error.message : 'Erro ao excluir categoria')
    }
  }

  const handleResetToDefault = async () => {
    if (!confirm('Tem certeza que deseja resetar todas as categorias para o padrão?\n\nIsso removerá todas as categorias personalizadas.')) {
      return
    }

    try {
      await resetToDefaultCategories()
      await loadCategories()
      alert('✅ Categorias resetadas para o padrão!')
    } catch (error) {
      console.error('Erro ao resetar categorias:', error)
      alert('Erro ao resetar categorias')
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedCategory(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedCategory || draggedCategory === targetId) return

    const draggedIndex = filteredCategories.findIndex(c => c.id === draggedCategory)
    const targetIndex = filteredCategories.findIndex(c => c.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newOrder = [...filteredCategories]
    const [draggedItem] = newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, draggedItem)

    // Atualizar ordem
    const orderedIds = newOrder.map(cat => cat.id)
    await reorderCategories(selectedType, orderedIds)
    
    await loadCategories()
    setDraggedCategory(null)
  }

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
          <h1 style={styles.title}>Gerenciar Categorias</h1>
          <div style={styles.subtitle}>Personalize suas categorias de entrada e gasto</div>
        </div>
      </div>

      {/* FILTRO POR TIPO */}
      <div style={styles.typeFilter}>
        <button
          onClick={() => setSelectedType('expense')}
          style={{
            ...styles.typeFilterButton,
            background: selectedType === 'expense' 
              ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
              : '#1e293b',
            color: selectedType === 'expense' ? 'white' : '#94a3b8'
          }}
        >
          <Icons.Expense /> Gastos
        </button>
        <button
          onClick={() => setSelectedType('income')}
          style={{
            ...styles.typeFilterButton,
            background: selectedType === 'income' 
              ? 'linear-gradient(135deg, #10b981, #059669)' 
              : '#1e293b',
            color: selectedType === 'income' ? 'white' : '#94a3b8'
          }}
        >
          <Icons.Income /> Entradas
        </button>
      </div>

      {/* LISTA DE CATEGORIAS */}
      <div style={styles.categoriesList}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <div style={styles.loadingText}>Carregando categorias...</div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🏷️</div>
            <h3 style={styles.emptyTitle}>Nenhuma categoria encontrada</h3>
            <p style={styles.emptyText}>
              {selectedType === 'income' 
                ? 'Você ainda não tem categorias de entrada personalizadas.'
                : 'Você ainda não tem categorias de gasto personalizadas.'}
            </p>
            <button 
              onClick={() => navigate('/add')}
              style={styles.emptyButton}
            >
              Criar Nova Categoria
            </button>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div
              key={cat.id}
              draggable={!cat.isDefault}
              onDragStart={(e) => !cat.isDefault && handleDragStart(e, cat.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => !cat.isDefault && handleDrop(e, cat.id)}
              style={{
                ...styles.categoryItem,
                background: '#1e293b',
                borderLeft: `4px solid ${cat.color || '#3b82f6'}`,
                opacity: draggedCategory === cat.id ? 0.5 : 1,
                cursor: cat.isDefault ? 'default' : 'grab'
              }}
            >
              <div style={styles.categoryLeft}>
                {!cat.isDefault && (
                  <div style={styles.dragHandle}>
                    <Icons.Drag />
                  </div>
                )}
                <div 
                  style={{
                    ...styles.categoryColor,
                    background: cat.color || '#3b82f6'
                  }}
                />
                <div>
                  <div style={styles.categoryName}>
                    {cat.name}
                    {cat.isDefault && (
                      <span style={styles.defaultTag}>Padrão</span>
                    )}
                  </div>
                  <div style={styles.categoryType}>
                    {cat.type === 'income' ? 'Entrada' : 'Gasto'}
                  </div>
                </div>
              </div>
              
              <div style={styles.categoryActions}>
                {!cat.isDefault && (
                  <>
                    <button
                      onClick={() => setEditingCategory(cat)}
                      style={styles.editButton}
                      title="Editar categoria"
                    >
                      <Icons.Edit />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      style={styles.deleteButton}
                      title="Excluir categoria"
                    >
                      <Icons.Delete />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* BOTÃO RESET */}
      <button
        onClick={handleResetToDefault}
        style={styles.resetButton}
      >
        <Icons.Reset /> Resetar para Categorias Padrão
      </button>

      {/* MODAL EDITAR */}
      {editingCategory && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={styles.modalIcon}>✏️</div>
              <h3 style={styles.modalTitle}>Editar Categoria</h3>
              <button
                onClick={() => setEditingCategory(null)}
                style={styles.modalCloseButton}
              >
                ×
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Nome</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                  style={styles.formInput}
                  maxLength={20}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Cor</label>
                <div style={styles.colorPicker}>
                  {[
                    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
                    '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'
                  ].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditingCategory({...editingCategory, color})}
                      style={{
                        ...styles.colorOption,
                        background: color,
                        border: editingCategory.color === color ? '3px solid white' : 'none',
                        transform: editingCategory.color === color ? 'scale(1.1)' : 'scale(1)'
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              
              <div style={styles.modalActions}>
                <button
                  onClick={() => setEditingCategory(null)}
                  style={styles.modalCancel}
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    await handleUpdateCategory(editingCategory.id, {
                      name: editingCategory.name,
                      color: editingCategory.color
                    })
                    setEditingCategory(null)
                  }}
                  style={{
                    ...styles.modalConfirm,
                    background: editingCategory.color || '#3b82f6'
                  }}
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// src/pages/ManageCategories.tsx - COMPLETAR ESTILOS
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
  
  // NOVOS ESTILOS
  typeFilter: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px'
  },
  
  typeFilterButton: {
    flex: 1,
    padding: '12px 16px',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
  },
  
  categoriesList: {
    marginBottom: '24px'
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
    textAlign: 'center' as const,
    background: '#1e293b',
    borderRadius: '20px',
    border: '1px solid #334155'
  },
  
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 8px 0',
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
  
  categoryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: '#1e293b',
    borderRadius: '12px',
    marginBottom: '12px',
    border: '1px solid #334155',
    transition: 'all 0.2s ease'
  },
  
  categoryLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1
  },
  
  dragHandle: {
    color: '#64748b',
    cursor: 'grab'
  },
  
  categoryColor: {
    width: '24px',
    height: '24px',
    borderRadius: '6px'
  },
  
  categoryName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  

  
  categoryType: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '2px'
  },
  
  categoryActions: {
    display: 'flex',
    gap: '8px'
  },
  
  editButton: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  
  deleteButton: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  
  resetButton: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
  },
  
  // Estilos do modal (copiar do AddTransaction.tsx)
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    backdropFilter: 'blur(4px)',
    padding: '20px'
  },

  modalContent: {
    background: '#1e293b',
    borderRadius: '20px',
    padding: '24px',
    width: '100%',
    maxWidth: '400px',
    border: '1px solid #334155',
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
    color: '#f8fafc',
    margin: 0,
    marginBottom: '4px'
  },

  modalCloseButton: {
    position: 'absolute' as const,
    top: '0',
    right: '0',
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
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
    color: '#f8fafc',
    marginBottom: '8px'
  },

  formInput: {
    width: '100%',
    padding: '12px 16px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '12px',
    color: '#f8fafc',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s ease'
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

  modalActions: {
    display: 'flex',
    gap: '12px'
  },

  modalCancel: {
    flex: 1,
    padding: '12px',
    border: '1px solid #334155',
    background: 'transparent',
    color: '#94a3b8',
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

  defaultTag: {
    fontSize: '10px',
    background: 'rgba(59, 130, 246, 0.1)',
    color: '#3b82f6',
    padding: '2px 6px',
    borderRadius: '10px',
    fontWeight: '500',
    marginLeft: '8px'
  },

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
