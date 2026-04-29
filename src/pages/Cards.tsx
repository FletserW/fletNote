// src/pages/Cards.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCards, saveCard, deleteCard, getCardStats } from '../services/cardService';
import type { Card, CardStats } from '../types/Card';

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
  CreditCard: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
};

export default function Cards() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[]>([]);
  const [stats, setStats] = useState<CardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  const [newCard, setNewCard] = useState<Partial<Card>>({
    name: '',
    lastDigits: '',
    brand: 'visa',
    limit: undefined,
    dueDay: 10,
    closingDay: 5,
    isActive: true,
    color: '#3b82f6'
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cardsData, statsData] = await Promise.all([
        getCards(),
        getCardStats()
      ]);
      setCards(cardsData);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar cartões:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('cardsUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('cardsUpdated', handleUpdate);
    };
  }, [loadData]);

  const handleSaveCard = async () => {
    try {
      if (!newCard.name?.trim()) {
        alert('Digite o nome do cartão');
        return;
      }

      if (!newCard.lastDigits || newCard.lastDigits.length < 4) {
        alert('Digite os últimos 4 dígitos do cartão');
        return;
      }

      if (!newCard.dueDay || newCard.dueDay < 1 || newCard.dueDay > 31) {
        alert('Dia de vencimento inválido');
        return;
      }

      const cardToSave: Card = {
        ...newCard as Card,
        id: editingCard?.id
      };

      await saveCard(cardToSave);
      setShowModal(false);
      setEditingCard(null);
      resetForm();
      await loadData();

    } catch (error) {
      console.error('Erro ao salvar cartão:', error);
      alert('❌ Erro ao salvar cartão');
    }
  };

  const handleDeleteCard = async (id: string, name: string) => {
    const confirm = window.confirm(
      `Tem certeza que deseja excluir o cartão "${name}"?\n\n` +
      `Isso pode afetar os gastos fixos vinculados a ele.`
    );
    
    if (!confirm) return;
    
    try {
      await deleteCard(id);
      await loadData();
    } catch (error) {
      console.error('Erro ao deletar cartão:', error);
      alert('❌ Erro ao deletar cartão');
    }
  };

  const handleEditCard = (card: Card) => {
    setEditingCard(card);
    setNewCard(card);
    setShowModal(true);
  };

  const resetForm = () => {
    setNewCard({
      name: '',
      lastDigits: '',
      brand: 'visa',
      limit: undefined,
      dueDay: 10,
      closingDay: 5,
      isActive: true,
      color: '#3b82f6'
    });
    setEditingCard(null);
  };

  const getBrandColor = (brand: string) => {
    switch (brand) {
      case 'visa': return '#1a1f71';
      case 'mastercard': return '#eb001b';
      case 'amex': return '#006fcf';
      case 'elo': return '#f15a29';
      default: return '#64748b';
    }
  };

  const getBrandLogo = (brand: string) => {
    switch (brand) {
      case 'visa': return '💳 VISA';
      case 'mastercard': return '💳 MC';
      case 'amex': return '💳 AMEX';
      case 'elo': return '💳 ELO';
      default: return '💳';
    }
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <button onClick={() => navigate('/recurring')} style={styles.backButton}>
          <Icons.ArrowLeft />
        </button>
        <div>
          <h1 style={styles.title}>Cartões</h1>
          <div style={styles.subtitle}>Gerencie seus cartões de crédito</div>
        </div>
      </div>

      {/* ESTATÍSTICAS */}
      {stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statsCard}>
            <div style={styles.statsIcon}>
              <Icons.CreditCard />
            </div>
            <div style={styles.statsContent}>
              <div style={styles.statsLabel}>Cartões Ativos</div>
              <div style={styles.statsValue}>{stats.activeCards}</div>
            </div>
          </div>

          <div style={styles.statsCard}>
            <div style={styles.statsIcon}>
              <Icons.Calendar />
            </div>
            <div style={styles.statsContent}>
              <div style={styles.statsLabel}>Próximo Vencimento</div>
              <div style={styles.statsValue}>
                {stats.nextDueDate 
                  ? new Date(stats.nextDueDate).toLocaleDateString('pt-BR')
                  : 'Nenhum'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LISTA DE CARTÕES */}
      <div style={styles.cardsContainer}>
        {isLoading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <div style={styles.loadingText}>Carregando cartões...</div>
          </div>
        ) : cards.length === 0 ? (
          <div style={styles.emptyState}>
            <Icons.CreditCard />
            <h3 style={styles.emptyTitle}>Nenhum cartão cadastrado</h3>
            <p style={styles.emptyText}>
              Adicione seus cartões de crédito para vincular aos gastos fixos.
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              style={styles.emptyButton}
            >
              <Icons.Plus /> Adicionar Cartão
            </button>
          </div>
        ) : (
          cards.map(card => (
            <div key={card.id} style={styles.card}>
              <div style={{
                ...styles.cardColor,
                background: card.color || getBrandColor(card.brand)
              }} />
              
              <div style={styles.cardContent}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.cardName}>{card.name}</div>
                    <div style={styles.cardBrand}>
                      {getBrandLogo(card.brand)} •••• {card.lastDigits}
                    </div>
                  </div>
                  {!card.isActive && (
                    <div style={styles.inactiveBadge}>Inativo</div>
                  )}
                </div>

                <div style={styles.cardDetails}>
                  {card.limit ? (
                    <div style={styles.cardLimit}>
                      <span style={styles.cardLimitLabel}>Limite:</span>
                      <span style={styles.cardLimitValue}>
                        R$ {card.limit.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <div style={styles.cardNoLimit}>Sem limite definido</div>
                  )}

                  <div style={styles.cardDates}>
                    <div style={styles.cardDate}>
                      <span>Fechamento:</span>
                      <strong>dia {card.closingDay}</strong>
                    </div>
                    <div style={styles.cardDate}>
                      <span>Vencimento:</span>
                      <strong>dia {card.dueDay}</strong>
                    </div>
                  </div>
                </div>

                <div style={styles.cardActions}>
                  <button
                    onClick={() => handleEditCard(card)}
                    style={styles.actionButton}
                  >
                    <Icons.Edit /> Editar
                  </button>
                  <button
                    onClick={() => handleDeleteCard(card.id!, card.name)}
                    style={{ ...styles.actionButton, color: '#ef4444' }}
                  >
                    <Icons.Delete /> Excluir
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => {
          resetForm();
          setShowModal(true);
        }}
        style={styles.fab}
      >
        <Icons.Plus />
      </button>

      {/* MODAL */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={styles.modalIcon}>💳</div>
              <h3 style={styles.modalTitle}>
                {editingCard ? 'Editar Cartão' : 'Novo Cartão'}
              </h3>
            </div>

            <div style={styles.modalBody}>
              {/* Nome */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Nome do Cartão *</label>
                <input
                  type="text"
                  value={newCard.name}
                  onChange={e => setNewCard({ ...newCard, name: e.target.value })}
                  style={styles.formInput}
                  placeholder="Ex: Nubank, Itaú, etc"
                />
              </div>

              {/* Últimos 4 dígitos e Bandeira */}
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Últimos 4 dígitos *</label>
                  <input
                    type="text"
                    value={newCard.lastDigits}
                    onChange={e => setNewCard({ 
                      ...newCard, 
                      lastDigits: e.target.value.replace(/\D/g, '').slice(0, 4)
                    })}
                    style={styles.formInput}
                    maxLength={4}
                    placeholder="0000"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Bandeira</label>
                  <select
                    value={newCard.brand}
                    onChange={e => setNewCard({ 
                      ...newCard, 
                      brand: e.target.value as never 
                    })}
                    style={styles.formSelect}
                  >
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="amex">American Express</option>
                    <option value="elo">Elo</option>
                    <option value="other">Outra</option>
                  </select>
                </div>
              </div>

              {/* Limite */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Limite (R$) - opcional</label>
                <input
                  type="number"
                  value={newCard.limit || ''}
                  onChange={e => setNewCard({ 
                    ...newCard, 
                    limit: parseFloat(e.target.value) || undefined 
                  })}
                  style={styles.formInput}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              {/* Dias */}
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Dia de Fechamento *</label>
                  <input
                    type="number"
                    value={newCard.closingDay}
                    onChange={e => setNewCard({ 
                      ...newCard, 
                      closingDay: parseInt(e.target.value) || 1 
                    })}
                    style={styles.formInput}
                    min="1"
                    max="31"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Dia de Vencimento *</label>
                  <input
                    type="number"
                    value={newCard.dueDay}
                    onChange={e => setNewCard({ 
                      ...newCard, 
                      dueDay: parseInt(e.target.value) || 1 
                    })}
                    style={styles.formInput}
                    min="1"
                    max="31"
                  />
                </div>
              </div>

              {/* Cor */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Cor do Cartão</label>
                <div style={styles.colorPicker}>
                  <input
                    type="color"
                    value={newCard.color || '#3b82f6'}
                    onChange={e => setNewCard({ ...newCard, color: e.target.value })}
                    style={styles.colorInput}
                  />
                  <span style={styles.colorValue}>{newCard.color}</span>
                </div>
              </div>

              {/* Ativo */}
              <div style={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newCard.isActive}
                  onChange={e => setNewCard({ ...newCard, isActive: e.target.checked })}
                  style={styles.checkbox}
                />
                <label htmlFor="isActive" style={styles.checkboxLabel}>
                  Cartão ativo
                </label>
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
                  onClick={handleSaveCard}
                  style={styles.modalConfirm}
                >
                  {editingCard ? 'Salvar Alterações' : 'Adicionar Cartão'}
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
    background: '#0f172a',
    minHeight: '100vh',
    color: '#f8fafc',
    paddingBottom: '100px'
  },
  
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px'
  },
  
  backButton: {
    background: 'transparent',
    border: 'none',
    color: '#cbd5e1',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px'
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
  
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '24px'
  },
  
  statsCard: {
    background: '#1e293b',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  
  statsIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
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
    color: '#94a3b8',
    marginBottom: '4px'
  },
  
  statsValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#f8fafc'
  },
  
  cardsContainer: {
    marginBottom: '80px'
  },
  
  card: {
    background: '#1e293b',
    borderRadius: '16px',
    marginBottom: '16px',
    border: '1px solid #334155',
    overflow: 'hidden',
    display: 'flex'
  },
  
  cardColor: {
    width: '8px',
    height: 'auto'
  },
  
  cardContent: {
    flex: 1,
    padding: '16px'
  },
  
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  
  cardName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: '4px'
  },
  
  cardBrand: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  
  inactiveBadge: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 8px',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    borderRadius: '12px'
  },
  
  cardDetails: {
    marginBottom: '16px'
  },
  
  cardLimit: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  
  cardLimitLabel: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  
  cardLimitValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#10b981'
  },
  
  cardNoLimit: {
    fontSize: '12px',
    color: '#94a3b8',
    fontStyle: 'italic',
    marginBottom: '8px'
  },
  
  cardDates: {
    display: 'flex',
    gap: '16px'
  },
  
  cardDate: {
    fontSize: '12px',
    color: '#94a3b8',
    display: 'flex',
    gap: '4px'
  },
  
  cardActions: {
    display: 'flex',
    gap: '12px',
    borderTop: '1px solid #334155',
    paddingTop: '12px'
  },
  
  actionButton: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    padding: '4px 8px',
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
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
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
    background: '#1e293b',
    borderRadius: '20px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    border: '1px solid #334155'
  },
  
  modalHeader: {
    padding: '20px',
    borderBottom: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  
  modalIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px'
  },
  
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#f8fafc',
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
    color: '#cbd5e1',
    marginBottom: '8px'
  },
  
  formInput: {
    width: '100%',
    padding: '10px 12px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '10px',
    color: '#f8fafc',
    fontSize: '14px'
  },
  
  formSelect: {
    width: '100%',
    padding: '10px 12px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '10px',
    color: '#f8fafc',
    fontSize: '14px'
  },
  
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  
  colorPicker: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  
  colorInput: {
    width: '50px',
    height: '40px',
    padding: '4px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  
  colorValue: {
    fontSize: '13px',
    color: '#94a3b8',
    fontFamily: 'monospace'
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
    color: '#cbd5e1',
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
    border: '1px solid #334155',
    borderRadius: '10px',
    color: '#94a3b8',
    fontWeight: '600',
    cursor: 'pointer'
  },
  
  modalConfirm: {
    padding: '12px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

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