import { useState,  } from 'react'
import {
  getMonthDays,
  isSundayOff,
  isWednesday
} from '../services/dayOffService'
import {
  addExtraDayOff,
  isExtraDayOff,
  removeExtraDayOff,

} from '../services/manualDayOffService'
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
  ChevronLeft: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Sun: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  Moon: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  X: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Stats: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export default function DayOffCalendar() {
  const navigate = useNavigate()
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars


  const days = getMonthDays(month, year)
  const firstDayWeek = days[0].getDay()

  // Navegação do calendário
  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11)
      setYear(y => y - 1)
    } else setMonth(m => m - 1)
  }

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0)
      setYear(y => y + 1)
    } else setMonth(m => m + 1)
  }

  // Estatísticas
  const totalDaysInMonth = days.length
  const sundays = days.filter(isSundayOff).length
  const wednesdays = days.filter(isWednesday).length
  const extraDaysInMonth = days.filter(day => 
    isExtraDayOff(day)
  ).length
  const totalDaysOff = sundays + wednesdays + extraDaysInMonth
  const workDays = totalDaysInMonth - totalDaysOff

  // Manipular folga extra
  const handleToggleDayOff = (date: Date) => {
  const dateString = date.toISOString().split('T')[0]

  if (isExtraDayOff(date)) {
    removeExtraDayOff(dateString)
  } else {
    addExtraDayOff(dateString)
  }

  setSelectedDate(null)
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
          <h1 style={styles.title}>
            <Icons.Calendar /> Calendário de Folgas
          </h1>
          <div style={styles.subtitle}>Gerencie seus dias de descanso</div>
        </div>
      </div>

      {/* CARDS DE RESUMO */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <Icons.Moon />
          </div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{totalDaysOff}</div>
            <div style={styles.statLabel}>Dias de Folga</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Icons.Sun />
          </div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{workDays}</div>
            <div style={styles.statLabel}>Dias Úteis</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            <Icons.Stats />
          </div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{extraDaysInMonth}</div>
            <div style={styles.statLabel}>Folgas Extras</div>
          </div>
        </div>
      </div>

      {/* CARD DO CALENDÁRIO */}
      <div style={styles.calendarCard}>
        {/* CABEÇALHO DO MÊS */}
        <div style={styles.calendarHeader}>
          <button 
            onClick={handlePrevMonth}
            style={styles.navButton}
            aria-label="Mês anterior"
          >
            <Icons.ChevronLeft />
          </button>
          
          <div style={styles.monthDisplay}>
            <div style={styles.monthName}>{monthNames[month]} {year}</div>
            <div style={styles.monthStats}>
              {totalDaysOff} folgas • {workDays} úteis
            </div>
          </div>
          
          <button 
            onClick={handleNextMonth}
            style={styles.navButton}
            aria-label="Próximo mês"
          >
            <Icons.ChevronRight />
          </button>
        </div>

        {/* DIAS DA SEMANA */}
        <div style={styles.weekDays}>
          {weekDays.map((day, index) => (
            <div 
              key={day} 
              style={{
                ...styles.weekDay,
                color: index === 0 || index === 3 ? '#ef4444' : '#94a3b8'
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* DIAS DO MÊS */}
        <div style={styles.calendarGrid}>
          {/* Espaços vazios para início do mês */}
          {Array.from({ length: firstDayWeek }).map((_, i) => (
            <div key={`empty-${i}`} style={styles.emptyDay} />
          ))}

          {days.map(date => {
            const isToday = date.toDateString() === today.toDateString()
            const isSunday = isSundayOff(date)
            const isWed = isWednesday(date)
            const isExtra = isExtraDayOff(date)
            const isDayOff = isSunday || isWed || isExtra
            const isSelected = selectedDate?.toDateString() === date.toDateString()

            // Determinar cor baseada no tipo de folga
            let backgroundColor = '#0f172a'
            let borderColor = '#334155'
            
            if (isExtra) {
              backgroundColor = 'rgba(16, 185, 129, 0.2)'
              borderColor = '#10b981'
            } else if (isSunday) {
              backgroundColor = 'rgba(139, 92, 246, 0.2)'
              borderColor = '#8b5cf6'
            } else if (isWed) {
              backgroundColor = 'rgba(59, 130, 246, 0.2)'
              borderColor = '#3b82f6'
            }

            if (isToday) {
              borderColor = '#f59e0b'
            }

            if (isSelected) {
              borderColor = '#ffffff'
              backgroundColor = 'rgba(59, 130, 246, 0.4)'
            }

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                style={{
                  ...styles.dayCell,
                  background: backgroundColor,
                  border: `2px solid ${borderColor}`,
                  fontWeight: isDayOff ? '600' : '400'
                }}
                aria-label={`Dia ${date.getDate()} de ${monthNames[month]}`}
              >
                <div style={styles.dayNumber}>
                  {date.getDate()}
                  {isToday && (
                    <div style={styles.todayIndicator}></div>
                  )}
                </div>
                
                {isDayOff && (
                  <div style={styles.dayOffIndicator}>
                    {isExtra ? (
                      <span style={{ color: '#10b981' }}>★</span>
                    ) : isSunday ? (
                      <span style={{ color: '#8b5cf6' }}>⊙</span>
                    ) : (
                      <span style={{ color: '#3b82f6' }}>⋆</span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* AÇÕES PARA DATA SELECIONADA */}
        {selectedDate && (
          <div style={styles.selectedDateCard}>
            <div style={styles.selectedDateHeader}>
              <h3 style={styles.selectedDateTitle}>
                {selectedDate.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </h3>
              <button 
                onClick={() => setSelectedDate(null)}
                style={styles.closeButton}
                aria-label="Fechar"
              >
                <Icons.X />
              </button>
            </div>

            <div style={styles.selectedDateInfo}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Tipo:</span>
                <span style={styles.infoValue}>
                  {isExtraDayOff(selectedDate) ? 'Folga Extra' :
                   isSundayOff(selectedDate) ? 'Domingo (Folga)' :
                   isWednesday(selectedDate) ? 'Quarta-feira' : 'Dia Útil'}
                </span>
              </div>
              
              {isExtraDayOff(selectedDate) ? (
                <button
                  onClick={() => handleToggleDayOff(selectedDate)}
                  style={styles.removeButton}
                >
                  <Icons.X /> Remover Folga Extra
                </button>
              ) : (
                <button
                  onClick={() => handleToggleDayOff(selectedDate)}
                  style={styles.addButton}
                >
                  <Icons.Plus /> Adicionar Folga Extra
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* LEGENDA */}
      <div style={styles.legendCard}>
        <h3 style={styles.legendTitle}>Legenda</h3>
        <div style={styles.legendGrid}>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, background: 'rgba(139, 92, 246, 0.2)', borderColor: '#8b5cf6' }}></div>
            <div>
              <div style={styles.legendLabel}>Domingo</div>
              <div style={styles.legendSubtitle}>Folga semanal</div>
            </div>
          </div>
          
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, background: 'rgba(59, 130, 246, 0.2)', borderColor: '#3b82f6' }}></div>
            <div>
              <div style={styles.legendLabel}>Quarta-feira</div>
              <div style={styles.legendSubtitle}>Dia regular</div>
            </div>
          </div>
          
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, background: 'rgba(16, 185, 129, 0.2)', borderColor: '#10b981' }}></div>
            <div>
              <div style={styles.legendLabel}>Folga Extra</div>
              <div style={styles.legendSubtitle}>Adicionada por você</div>
            </div>
          </div>
          
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, background: '#0f172a', borderColor: '#f59e0b' }}></div>
            <div>
              <div style={styles.legendLabel}>Hoje</div>
              <div style={styles.legendSubtitle}>Dia atual</div>
            </div>
          </div>
        </div>
      </div>

      {/* DICAS */}
      <div style={styles.tipsCard}>
        <h3 style={styles.tipsTitle}>💡 Dicas</h3>
        <ul style={styles.tipsList}>
          <li>Clique em qualquer dia para gerenciar folgas extras</li>
          <li>Domingos são automaticamente considerados folga</li>
          <li>Use folgas extras para dias especiais ou descanso adicional</li>
        </ul>
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
  
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '24px'
  },
  
  statCard: {
    background: '#1e293b',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid #334155',
    display: 'flex',
    alignItems: 'center'
  },
  
  statIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
    color: 'white'
  },
  
  statContent: {
    flex: 1
  },
  
  statValue: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '2px'
  },
  
  statLabel: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  
  calendarCard: {
    background: '#1e293b',
    borderRadius: '20px',
    padding: '20px',
    marginBottom: '20px',
    border: '1px solid #334155',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
  },
  
  calendarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px'
  },
  
  navButton: {
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '10px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#cbd5e1',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  
  monthDisplay: {
    textAlign: 'center' as const
  },
  
  monthName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: '4px'
  },
  
  monthStats: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  
  weekDays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    marginBottom: '12px'
  },
  
  weekDay: {
    fontSize: '12px',
    fontWeight: '600',
    textAlign: 'center' as const,
    padding: '8px 0'
  },
  
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '6px'
  },
  
  emptyDay: {
    height: '60px',
    borderRadius: '10px'
  },
  
  dayCell: {
    height: '60px',
    borderRadius: '10px',
    border: '2px solid',
    background: '#0f172a',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    padding: '8px',
    position: 'relative' as const
  },
  
  dayNumber: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '4px',
    color:  '#f8fafc',
    position: 'relative' as const
  },
  
  todayIndicator: {
    position: 'absolute' as const,
    top: '-4px',
    right: '-4px',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#f59e0b'
  },
  
  dayOffIndicator: {
    fontSize: '12px'
  },
  
  selectedDateCard: {
    marginTop: '24px',
    padding: '20px',
    background: '#0f172a',
    borderRadius: '16px',
    border: '1px solid #334155'
  },
  
  selectedDateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  
  selectedDateTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
    color: '#f8fafc'
  },
  
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  selectedDateInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px'
  },
  
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  
  infoLabel: {
    fontSize: '14px',
    color: '#94a3b8'
  },
  
  infoValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f8fafc'
  },
  
  addButton: {
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
  },
  
  removeButton: {
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
  },
  
  legendCard: {
    background: '#1e293b',
    borderRadius: '20px',
    padding: '20px',
    marginBottom: '20px',
    border: '1px solid #334155'
  },
  
  legendTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 16px 0',
    color: '#f8fafc'
  },
  
  legendGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px'
  },
  
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  
  legendColor: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    border: '2px solid'
  },
  
  legendLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: '2px'
  },
  
  legendSubtitle: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  
  tipsCard: {
    background: 'rgba(59, 130, 246, 0.1)',
    borderRadius: '20px',
    padding: '20px',
    border: '1px solid rgba(59, 130, 246, 0.3)'
  },
  
  tipsTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 12px 0',
    color: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  
  tipsList: {
    margin: 0,
    paddingLeft: '20px'
  },
  
  tipsListLi: {
    fontSize: '14px',
    color: '#cbd5e1',
    marginBottom: '8px',
    lineHeight: '1.5'
  }
}