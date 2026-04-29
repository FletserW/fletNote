// src/pages/RecurringExpenses.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  getRecurringExpenses,
  saveRecurringExpense,
  deleteRecurringExpense,
  getRecurringStats,
  processDueRecurringExpenses,
  checkOverdueExpenses
} from '../services/recurringExpenseService';
import { getCategories } from '../services/categoryService';
import type { RecurringExpense, RecurringStats, RecurringExpenseLog } from '../types/RecurringExpense';
import type { Card } from '../types/Card';
import { getCards } from '../services/cardService'; 

// Ícones
const Icons = {
  ArrowLeft: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  Plus: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
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
  CreditCard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  Alert: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Close: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Refresh: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  PiggyBank: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h12v-3.5c1.2-1.3 2-2.5 2-4.5 0-2.5-2.5-4-5-4z" />
      <path d="M12 9v6" />
      <path d="M15 12h-6" />
    </svg>
  )
};

export default function RecurringExpenses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [stats, setStats] = useState<RecurringStats | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  const [overdueLogs, setOverdueLogs] = useState<RecurringExpenseLog[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'cancelled'>('active');

  // Estados para nova despesa
  const [newExpense, setNewExpense] = useState<Partial<RecurringExpense>>({
    name: '',
    amount: 0,
    category: '',
    dueDay: new Date().getDate(),
    paymentMethod: 'credit_card',
    recurrenceType: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    priority: 'essential',
    autoPay: false,
    status: 'active'
  });

  // Cards de crédito (mock - você pode integrar com seu sistema)
const [creditCards, setCreditCards] = useState<Card[]>([]);

  // Carregar dados
  const loadData = useCallback(async () => {
  setIsLoading(true);
  try {
    // Buscar todos os dados em paralelo
    const [expensesData, statsData, categoriesData, overdue] = await Promise.all([
      getRecurringExpenses(),
      getRecurringStats(),
      getCategories(),
      checkOverdueExpenses()
    ]);

    // Buscar cartões separadamente (se precisar)
    const cardsData = await getCards();

    setExpenses(expensesData);
    setStats(statsData);
    setCategories(categoriesData.map(c => c.name).filter(Boolean));
    setOverdueLogs(overdue);
    setCreditCards(cardsData.filter(c => c.isActive));
    
    if (overdue.length > 0) {
      setShowAlert(true);
    }
    
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  } finally {
    setIsLoading(false);
  }
}, []);

  useEffect(() => {
    loadData();

    // Listener para atualizações
    const handleUpdate = () => loadData();
    window.addEventListener('recurringUpdated', handleUpdate);
    window.addEventListener('cardsUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('recurringUpdated', handleUpdate);
    };
  }, [loadData]);

  // Carregar cartões reais
useEffect(() => {
  const loadCards = async () => {
    const cards = await getCards();
    setCreditCards(cards.filter((c: { isActive: unknown; }) => c.isActive));
  };
  loadCards();
}, []);

  // Processar cobranças manualmente
  const handleProcessNow = async () => {
    const confirm = window.confirm(
      'Deseja processar todas as cobranças fixas do dia agora?\n\n' +
      'Isso criará transações de despesas para cada conta fixa com vencimento hoje.'
    );
    
    if (!confirm) return;
    
    setIsLoading(true);
    try {
      const result = await processDueRecurringExpenses();
      alert(`✅ ${result.processed} despesas processadas!`);
      await loadData();
    } catch (error) {
      console.error('Erro ao processar:', error);
      alert('❌ Erro ao processar despesas');
    } finally {
      setIsLoading(false);
    }
  };

  // Salvar despesa
  const handleSaveExpense = async () => {
    try {
      // Validações
      if (!newExpense.name?.trim()) {
        alert('Digite o nome da despesa');
        return;
      }
      
      if (!newExpense.amount || newExpense.amount <= 0) {
        alert('Digite um valor válido');
        return;
      }
      
      if (!newExpense.category) {
        alert('Selecione uma categoria');
        return;
      }
      
      if (!newExpense.dueDay || newExpense.dueDay < 1 || newExpense.dueDay > 31) {
        alert('Dia da cobrança deve ser entre 1 e 31');
        return;
      }

      const expenseToSave: RecurringExpense = {
        ...newExpense as RecurringExpense,
        id: editingExpense?.id,
        userId: user?.uid
      };

      await saveRecurringExpense(expenseToSave);
      setShowModal(false);
      setEditingExpense(null);
      resetForm();
      await loadData();
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('❌ Erro ao salvar despesa');
    }
  };

  // Deletar despesa
  const handleDeleteExpense = async (id: string, name: string) => {
    const confirm = window.confirm(
      `Tem certeza que deseja excluir "${name}"?\n\n` +
      `Essa ação não pode ser desfeita.`
    );
    
    if (!confirm) return;
    
    try {
      await deleteRecurringExpense(id);
      await loadData();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert('❌ Erro ao deletar despesa');
    }
  };

  // Editar despesa
  const handleEditExpense = (expense: RecurringExpense) => {
    setEditingExpense(expense);
    setNewExpense({
      ...expense,
      startDate: expense.startDate.split('T')[0] // Formato YYYY-MM-DD
    });
    setShowModal(true);
  };

  // Resetar formulário
  const resetForm = () => {
    setNewExpense({
      name: '',
      amount: 0,
      category: '',
      dueDay: new Date().getDate(),
      paymentMethod: 'credit_card',
      recurrenceType: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      priority: 'essential',
      autoPay: false,
      status: 'active'
    });
    setEditingExpense(null);
  };

  // Filtrar despesas
  const filteredExpenses = expenses.filter(exp => {
    if (filter === 'all') return true;
    return exp.status === filter;
  });

  // Ordenar por dia do mês
  const sortedExpenses = [...filteredExpenses].sort((a, b) => a.dueDay - b.dueDay);

  // Agrupar por semana
  const groupedByWeek = sortedExpenses.reduce((groups, exp) => {
    const week = Math.ceil(exp.dueDay / 7);
    if (!groups[week]) groups[week] = [];
    groups[week].push(exp);
    return groups;
  }, {} as Record<number, RecurringExpense[]>);

  // Função para obter cor baseada na prioridade
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'essential': return '#ef4444';
      case 'important': return '#f59e0b';
      case 'optional': return '#10b981';
      default: return 'var(--app-text-muted)';
    }
  };

  // Função para obter label da prioridade
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'essential': return 'Essencial';
      case 'important': return 'Importante';
      case 'optional': return 'Opcional';
      default: return priority;
    }
  };

  // Função para obter label do método de pagamento
  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'credit_card': return 'Cartão de Crédito';
      case 'debit': return 'Débito';
      case 'pix': return 'PIX';
      case 'boleto': return 'Boleto';
      case 'transfer': return 'Transferência';
      default: return method;
    }
  };

  // Função para obter ícone do método de pagamento
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card': return '💳';
      case 'debit': return '💵';
      case 'pix': return '📱';
      case 'boleto': return '📄';
      case 'transfer': return '🔄';
      default: return '💰';
    }
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <button 
          onClick={() => navigate('/')}
          style={styles.backButton}
        >
          <Icons.ArrowLeft />
        </button>
        <div>
          <h1 style={styles.title}>Gastos Fixos</h1>
          <div style={styles.subtitle}>
            Gerencie suas despesas recorrentes
          </div>
        </div>
        <div style={styles.flexd}>
          <button
            onClick={handleProcessNow}
            style={styles.processButton}
            title="Processar cobranças do dia"
          >
            <Icons.Refresh />
          </button>
          <button
            onClick={() => navigate('/cards')}
            style={styles.processButton}
            title="Adicionar Cartão"
          >
            <Icons.Plus />
          </button>
        </div>
      </div>

      {/* ALERTA DE VENCIMENTOS */}
      {showAlert && overdueLogs.length > 0 && (
        <div style={styles.alertCard}>
          <div style={styles.alertIcon}>
            <Icons.Alert />
          </div>
          <div style={styles.alertContent}>
            <div style={styles.alertTitle}>
              {overdueLogs.length} {overdueLogs.length === 1 ? 'conta vencida' : 'contas vencidas'}
            </div>
            <div style={styles.alertMessage}>
              Clique para ver os detalhes
            </div>
          </div>
          <button
            onClick={() => setShowAlert(false)}
            style={styles.alertClose}
          >
            <Icons.Close />
          </button>
        </div>
      )}

      {/* CARDS DE ESTATÍSTICAS */}
      <div style={styles.statsGrid}>
        <div style={styles.statsCard}>
          <div style={styles.statsIcon}>
            <Icons.PiggyBank />
          </div>
          <div style={styles.statsContent}>
            <div style={styles.statsLabel}>Total Mensal</div>
            <div style={styles.statsValue}>
              R$ {stats?.totalMonthly.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>

        <div style={styles.statsCard}>
          <div style={styles.statsIcon}>
            <Icons.Calendar />
          </div>
          <div style={styles.statsContent}>
            <div style={styles.statsLabel}>Próximos 7 dias</div>
            <div style={styles.statsValue}>
              {stats?.upcomingCount || 0} cobranças
            </div>
          </div>
        </div>

        <div style={styles.statsCard}>
          <div style={styles.statsIcon}>
            <Icons.CreditCard />
          </div>
          <div style={styles.statsContent}>
            <div style={styles.statsLabel}>Mês Atual</div>
            <div style={styles.statsValue}>
              {stats?.paidThisMonth || 0} paga(s)
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div style={styles.filtersCard}>
        <div style={styles.filterTabs}>
          <button
            onClick={() => setFilter('active')}
            style={{
              ...styles.filterTab,
              background: filter === 'active' ? 'linear-gradient(135deg, var(--app-primary), #2563eb)' : 'var(--app-surface-elevated)',
              color: filter === 'active' ? '#fff' : 'var(--app-text-muted)'
            }}
          >
            Ativas
          </button>
          <button
            onClick={() => setFilter('all')}
            style={{
              ...styles.filterTab,
              background: filter === 'all' ? 'linear-gradient(135deg, var(--app-primary), #2563eb)' : 'var(--app-surface-elevated)',
              color: filter === 'all' ? '#fff' : 'var(--app-text-muted)'
            }}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('paused')}
            style={{
              ...styles.filterTab,
              background: filter === 'paused' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'var(--app-surface-elevated)',
              color: filter === 'paused' ? '#fff' : 'var(--app-text-muted)'
            }}
          >
            Pausadas
          </button>
        </div>
      </div>

      {/* LISTA DE DESPESAS */}
      <div style={styles.expensesContainer}>
        {isLoading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <div style={styles.loadingText}>Carregando gastos fixos...</div>
          </div>
        ) : sortedExpenses.length === 0 ? (
          <div style={styles.emptyState}>
            <Icons.Calendar />
            <h3 style={styles.emptyTitle}>Nenhum gasto fixo cadastrado</h3>
            <p style={styles.emptyText}>
              Adicione suas contas fixas como Netflix, Internet, Academia e acompanhe automaticamente.
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              style={styles.emptyButton}
            >
              <Icons.Plus /> Adicionar Gasto Fixo
            </button>
          </div>
        ) : (
          // Agrupado por semana
          Object.entries(groupedByWeek).map(([week, weekExpenses]) => (
            <div key={week} style={styles.weekGroup}>
              <div style={styles.weekHeader}>
                <div style={styles.weekTitle}>Semana {week}</div>
                <div style={styles.weekTotal}>
                  R$ {weekExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
                </div>
              </div>

              {weekExpenses.map(expense => (
                <div key={expense.id} style={styles.expenseCard}>
                  {/* DIA */}
                  <div style={{
                    ...styles.expenseDay,
                    background: expense.dueDay <= new Date().getDate() && expense.status === 'active'
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'linear-gradient(135deg, var(--app-primary), #2563eb)'
                  }}>
                    <span style={styles.expenseDayNumber}>{expense.dueDay}</span>
                    <span style={styles.expenseDayLabel}>dia</span>
                  </div>

                  {/* INFORMAÇÕES */}
                  <div style={styles.expenseInfo}>
                    <div style={styles.expenseHeader}>
                      <span style={styles.expenseName}>{expense.name}</span>
                      <div style={{
                        ...styles.expensePriority,
                        background: `${getPriorityColor(expense.priority)}20`,
                        color: getPriorityColor(expense.priority)
                      }}>
                        {getPriorityLabel(expense.priority)}
                      </div>
                    </div>

                    <div style={styles.expenseDetails}>
                      <span style={styles.expenseCategory}>{expense.category}</span>
                      <span style={styles.expenseAmount}>
                        R$ {expense.amount.toFixed(2)}
                      </span>
                    </div>

                    <div style={styles.expenseMeta}>
                      <span style={styles.expensePaymentMethod}>
                        {getPaymentMethodIcon(expense.paymentMethod)} {getPaymentMethodLabel(expense.paymentMethod)}
                      </span>
                      {expense.paymentMethod === 'credit_card' && expense.cardId && (
                        <span style={styles.expenseCard}>
                          {creditCards.find(c => c.id === expense.cardId)?.name || 'Cartão'}
                        </span>
                      )}
                      {expense.installments && (
                        <span style={styles.expenseInstallments}>
                          {expense.installmentsPaid || 0}/{expense.installments}
                        </span>
                      )}
                    </div>

                    {expense.autoPay && (
                      <div style={styles.autoPayBadge}>
                        <Icons.Check /> Débito Automático
                      </div>
                    )}
                  </div>

                  {/* AÇÕES */}
                  <div style={styles.expenseActions}>
                    <button
                      onClick={() => handleEditExpense(expense)}
                      style={styles.actionButton}
                      title="Editar"
                    >
                      <Icons.Edit />
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(expense.id!, expense.name)}
                      style={{ ...styles.actionButton, color: '#ef4444' }}
                      title="Excluir"
                    >
                      <Icons.Delete />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* BOTÃO FLUTUANTE */}
      <button
        onClick={() => {
          resetForm();
          setShowModal(true);
        }}
        style={styles.fab}
      >
        <Icons.Plus />
      </button>

      {/* MODAL DE ADICIONAR/EDITAR */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={styles.modalIcon}>
                {editingExpense ? '✏️' : '➕'}
              </div>
              <h3 style={styles.modalTitle}>
                {editingExpense ? 'Editar Gasto Fixo' : 'Novo Gasto Fixo'}
              </h3>
            </div>

            <div style={styles.modalBody}>
              {/* Nome */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Nome da Conta *</label>
                <input
                  type="text"
                  value={newExpense.name}
                  onChange={e => setNewExpense({ ...newExpense, name: e.target.value })}
                  style={styles.formInput}
                  placeholder="Ex: Netflix, Internet, Academia..."
                />
              </div>

              {/* Valor e Dia */}
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Valor (R$) *</label>
                  <input
                    type="number"
                    value={newExpense.amount}
                    onChange={e => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                    style={styles.formInput}
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Dia da Cobrança *</label>
                  <input
                    type="number"
                    value={newExpense.dueDay}
                    onChange={e => setNewExpense({ ...newExpense, dueDay: parseInt(e.target.value) || 1 })}
                    style={styles.formInput}
                    min="1"
                    max="31"
                  />
                </div>
              </div>

              {/* Categoria e Prioridade */}
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Categoria *</label>
                  <select
                    value={newExpense.category}
                    onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                    style={styles.formSelect}
                  >
                    <option value="">Selecione</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Prioridade</label>
                  <select
  value={newExpense.priority}
  onChange={e => setNewExpense({ 
    ...newExpense, 
    priority: e.target.value as 'essential' | 'important' | 'optional'
  })}
  style={styles.formSelect}
>
  <option value="essential">Essencial</option>
  <option value="important">Importante</option>
  <option value="optional">Opcional</option>
</select>
                </div>
              </div>

              {/* Método de Pagamento */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Método de Pagamento *</label>
                <select
  value={newExpense.paymentMethod}
  onChange={e => setNewExpense({ 
    ...newExpense, 
    paymentMethod: e.target.value as 'credit_card' | 'debit' | 'pix' | 'boleto' | 'transfer'
  })}
  style={styles.formSelect}
>
  <option value="credit_card">Cartão de Crédito</option>
  <option value="debit">Débito</option>
  <option value="pix">PIX</option>
  <option value="boleto">Boleto</option>
  <option value="transfer">Transferência</option>
</select>
              </div>

              {/* Cartão de Crédito (se aplicável) */}
              {newExpense.paymentMethod === 'credit_card' && (
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Cartão de Crédito</label>
                  <select
                    value={newExpense.cardId}
                    onChange={e => setNewExpense({ ...newExpense, cardId: e.target.value })}
                    style={styles.formSelect}
                  >
                    <option value="">Selecione um cartão</option>
                    {creditCards.map(card => (
                      <option key={card.id} value={card.id}>
                        {card.name} (•••• {card.lastDigits})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Parcelas (opcional) */}
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Total de Parcelas</label>
                  <input
                    type="number"
                    value={newExpense.installments || ''}
                    onChange={e => setNewExpense({ 
                      ...newExpense, 
                      installments: parseInt(e.target.value) || undefined,
                      installmentsPaid: 0
                    })}
                    style={styles.formInput}
                    min="1"
                    placeholder="Ex: 12"
                  />
                </div>

                {newExpense.installments && (
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Parcelas Pagas</label>
                    <input
                      type="number"
                      value={newExpense.installmentsPaid || 0}
                      onChange={e => setNewExpense({ 
                        ...newExpense, 
                        installmentsPaid: parseInt(e.target.value) || 0
                      })}
                      style={styles.formInput}
                      min="0"
                      max={newExpense.installments}
                    />
                  </div>
                )}
              </div>

              {/* Data de Início */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Data de Início</label>
                <input
                  type="date"
                  value={newExpense.startDate}
                  onChange={e => setNewExpense({ ...newExpense, startDate: e.target.value })}
                  style={styles.formInput}
                />
              </div>

              {/* Débito Automático */}
              <div style={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="autoPay"
                  checked={newExpense.autoPay}
                  onChange={e => setNewExpense({ ...newExpense, autoPay: e.target.checked })}
                  style={styles.checkbox}
                />
                <label htmlFor="autoPay" style={styles.checkboxLabel}>
                  Débito Automático (processar automaticamente no dia)
                </label>
              </div>

              {/* Status */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Status</label>
                <select
  value={newExpense.status}
  onChange={e => setNewExpense({ 
    ...newExpense, 
    status: e.target.value as 'active' | 'paused' | 'cancelled'
  })}
  style={styles.formSelect}
>
  <option value="active">Ativo</option>
  <option value="paused">Pausado</option>
  <option value="cancelled">Cancelado</option>
</select>
              </div>

              {/* Observações */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Observações</label>
                <textarea
                  value={newExpense.notes || ''}
                  onChange={e => setNewExpense({ ...newExpense, notes: e.target.value })}
                  style={styles.formTextarea}
                  placeholder="Informações adicionais..."
                  rows={3}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  style={styles.modalCancel}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveExpense}
                  style={styles.modalConfirm}
                >
                  {editingExpense ? 'Salvar Alterações' : 'Adicionar Gasto Fixo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px 16px',
    background: 'var(--app-surface)',
    minHeight: '100vh',
    color: 'var(--app-text)',
    paddingBottom: '100px'
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
    color: 'var(--app-text-secondary)',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
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
  
  processButton: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'var(--app-surface-elevated)',
    border: '1px solid var(--app-border)',
    color: '#10b981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },

  flexd: {
    display: 'flex',
    padding: '12px'
  },
  
  alertCard: {
    background: 'linear-gradient(135deg, #f59e0b20, #d9770620)',
    border: '1px solid #f59e0b',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  
  alertIcon: {
    color: '#f59e0b'
  },
  
  alertContent: {
    flex: 1
  },
  
  alertTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f59e0b'
  },
  
  alertMessage: {
    fontSize: '12px',
    color: 'var(--app-text-muted)'
  },
  
  alertClose: {
    background: 'transparent',
    border: 'none',
    color: 'var(--app-text-muted)',
    cursor: 'pointer',
    padding: '4px'
  },
  
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '24px'
  },
  
  statsCard: {
    background: 'var(--app-surface-elevated)',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid var(--app-border)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  
  statsIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, var(--app-primary), #2563eb)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  },
  
  statsContent: {
    flex: 1
  },
  
  statsLabel: {
    fontSize: '11px',
    color: 'var(--app-text-muted)',
    marginBottom: '4px'
  },
  
  statsValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--app-text)'
  },
  
  filtersCard: {
    background: 'var(--app-surface-elevated)',
    borderRadius: '16px',
    padding: '12px',
    marginBottom: '24px',
    border: '1px solid var(--app-border)'
  },
  
  filterTabs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px'
  },
  
  filterTab: {
    padding: '10px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  
  expensesContainer: {
    marginBottom: '80px'
  },
  
  weekGroup: {
    marginBottom: '24px'
  },
  
  weekHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    padding: '0 4px'
  },
  
  weekTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--app-text-muted)'
  },
  
  weekTotal: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--app-primary)',
    background: 'var(--app-primary-soft)',
    padding: '4px 12px',
    borderRadius: '20px'
  },
  
  expenseCard: {
    background: 'var(--app-surface-elevated)',
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '12px',
    border: '1px solid var(--app-border)',
    display: 'flex',
    gap: '16px',
    position: 'relative' as const
  },
  
  expenseDay: {
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, var(--app-primary), #2563eb)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flexShrink: 0
  },
  
  expenseDayNumber: {
    fontSize: '18px',
    fontWeight: '700',
    lineHeight: 1
  },
  
  expenseDayLabel: {
    fontSize: '10px',
    opacity: 0.8
  },
  
  expenseInfo: {
    flex: 1
  },
  
  expenseHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
    flexWrap: 'wrap' as const
  },
  
  expenseName: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--app-text)'
  },
  
  expensePriority: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '12px'
  },
  
  expenseDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  
  expenseCategory: {
    fontSize: '13px',
    color: 'var(--app-text-muted)'
  },
  
  expenseAmount: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ef4444'
  },
  
  expenseMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '11px',
    color: 'var(--app-text-subtle)',
    marginBottom: '8px'
  },
  
  expensePaymentMethod: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  

  
  expenseInstallments: {
    background: 'rgba(139, 92, 246, 0.1)',
    padding: '2px 8px',
    borderRadius: '12px',
    color: '#8b5cf6'
  },
  
  autoPayBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    color: '#10b981',
    background: 'rgba(16, 185, 129, 0.1)',
    padding: '2px 8px',
    borderRadius: '12px'
  },
  
  expenseActions: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  
  actionButton: {
    background: 'transparent',
    border: 'none',
    color: 'var(--app-text-muted)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px'
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
    borderTop: '3px solid var(--app-primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  
  loadingText: {
    marginTop: '16px',
    color: 'var(--app-text-muted)',
    fontSize: '14px'
  },
  
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center' as const,
    background: 'var(--app-surface-elevated)',
    borderRadius: '20px',
    border: '1px solid var(--app-border)'
  },
  
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '20px 0 8px 0',
    color: 'var(--app-text)'
  },
  
  emptyText: {
    fontSize: '14px',
    color: 'var(--app-text-muted)',
    marginBottom: '24px',
    maxWidth: '300px'
  },
  
  emptyButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, var(--app-primary), #2563eb)',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  
  fab: {
    position: 'fixed' as const,
    bottom: '24px',
    right: '24px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--app-primary), #2563eb)',
    color: 'white',
    border: 'none',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 100
  },
  
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  
  modalContent: {
    background: 'var(--app-surface-elevated)',
    borderRadius: '20px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    border: '1px solid var(--app-border)'
  },
  
  modalHeader: {
    padding: '20px',
    borderBottom: '1px solid var(--app-border)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  
  modalIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, var(--app-primary), #2563eb)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px'
  },
  
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--app-text)',
    margin: 0
  },
  
  modalBody: {
    padding: '20px'
  },
  
  formGroup: {
    marginBottom: '16px'
  },
  
  formLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--app-text-secondary)',
    marginBottom: '8px'
  },
  
  formInput: {
    width: '100%',
    padding: '10px 12px',
    background: 'var(--app-surface)',
    border: '1px solid var(--app-border)',
    borderRadius: '10px',
    color: 'var(--app-text)',
    fontSize: '14px'
  },
  
  formSelect: {
    width: '100%',
    padding: '10px 12px',
    background: 'var(--app-surface)',
    border: '1px solid var(--app-border)',
    borderRadius: '10px',
    color: 'var(--app-text)',
    fontSize: '14px'
  },
  
  formTextarea: {
    width: '100%',
    padding: '10px 12px',
    background: 'var(--app-surface)',
    border: '1px solid var(--app-border)',
    borderRadius: '10px',
    color: 'var(--app-text)',
    fontSize: '14px',
    resize: 'vertical' as const
  },
  
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px'
  },
  
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  
  checkboxLabel: {
    fontSize: '14px',
    color: 'var(--app-text-secondary)',
    cursor: 'pointer'
  },
  
  modalActions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginTop: '24px'
  },
  
  modalCancel: {
    padding: '12px',
    background: 'transparent',
    border: '1px solid var(--app-border)',
    borderRadius: '10px',
    color: 'var(--app-text-muted)',
    fontWeight: '600',
    cursor: 'pointer'
  },
  
  modalConfirm: {
    padding: '12px',
    background: 'linear-gradient(135deg, var(--app-primary), #2563eb)',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

// Adicionar animação de spin
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}