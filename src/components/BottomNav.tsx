import { NavLink } from 'react-router-dom'
import { useDesign } from '../contexts/DesignContext'

// Ícones SVG
const Icons = {
  Wallet: ({ active }: { active: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--app-primary)" : "var(--app-text-muted)"} strokeWidth="2">
      <path d="M21 12V7H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14v4" />
      <path d="M3 9v9a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12h.01" />
    </svg>
  ),
  Calendar: ({ active }: { active: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--app-primary)" : "var(--app-text-muted)"} strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Chart: ({ active }: { active: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--app-primary)" : "var(--app-text-muted)"} strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  PiggyBank: ({ active }: { active: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--app-primary)" : "var(--app-text-muted)"} strokeWidth="2">
      <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h12v-3.5c1.2-1.3 2-2.5 2-4.5 0-2.5-2.5-4-5-4z" />
      <path d="M12 9v6" />
      <path d="M15 12h-6" />
    </svg>
  )
}

export default function BottomNav() {
  const { designMode } = useDesign()
  const isSimpleMode = designMode === 'assisted'
  const navStyles = createStyles(isSimpleMode)

  return (
    <nav style={navStyles.nav}>
      {/* Financeiro */}
      <NavLink 
        to="/" 
        end 
        style={({ isActive }) => ({
          ...styles.navItem,
          ...navStyles.navItem,
          ...(isActive && navStyles.navItemActive)
        })}
      >
        {({ isActive }) => (
          <>
            <div style={navStyles.iconContainer}>
              <Icons.Wallet active={isActive} />
            </div>
            <span style={{
              ...navStyles.label,
              color: isActive ? 'var(--app-primary)' : 'var(--app-text-muted)'
            }}>
              Financeiro
            </span>
            {isActive && <div style={navStyles.activeIndicator} />}
          </>
        )}
      </NavLink>

      {/* Extrato */}
      <NavLink 
        to="/statement" 
        style={({ isActive }) => ({
          ...styles.navItem,
          ...navStyles.navItem,
          ...(isActive && navStyles.navItemActive)
        })}
      >
        {({ isActive }) => (
          <>
            <div style={navStyles.iconContainer}>
              <Icons.Chart active={isActive} />
            </div>
            <span style={{
              ...navStyles.label,
              color: isActive ? 'var(--app-primary)' : 'var(--app-text-muted)'
            }}>
              Extrato
            </span>
            {isActive && <div style={navStyles.activeIndicator} />}
          </>
        )}
      </NavLink>

      {/* Botão Central (Adicionar) */}
      <div style={navStyles.centerSpacer} />

      {/* Cofre */}
      <NavLink 
        to="/annual" 
        style={({ isActive }) => ({
          ...styles.navItem,
          ...navStyles.navItem,
          ...(isActive && navStyles.navItemActive)
        })}
      >
        {({ isActive }) => (
          <>
            <div style={navStyles.iconContainer}>
              <Icons.PiggyBank active={isActive} />
            </div>
            <span style={{
              ...navStyles.label,
              color: isActive ? 'var(--app-primary)' : 'var(--app-text-muted)'
            }}>
              Anual
            </span>
            {isActive && <div style={navStyles.activeIndicator} />}
          </>
        )}
      </NavLink>

      {/* Calendário */}
      <NavLink 
        to="/calendar" 
        style={({ isActive }) => ({
          ...styles.navItem,
          ...navStyles.navItem,
          ...(isActive && navStyles.navItemActive)
        })}
      >
        {({ isActive }) => (
          <>
            <div style={navStyles.iconContainer}>
              <Icons.Calendar active={isActive} />
            </div>
            <span style={{
              ...navStyles.label,
              color: isActive ? 'var(--app-primary)' : 'var(--app-text-muted)'
            }}>
              Folgas
            </span>
            {isActive && <div style={navStyles.activeIndicator} />}
          </>
        )}
      </NavLink>
    </nav>
  )
}

// Estilos
const styles = {
  nav: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '72px',
    background: 'var(--app-surface-elevated)',
    borderTop: '1px solid var(--app-border)',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '0 16px',
    backdropFilter: 'blur(10px)',
    zIndex: 1000,
    boxShadow: 'var(--app-shadow)'
  },
  
  navItem: {
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '8px 12px',
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    position: 'relative' as const,
    flex: 1,
    maxWidth: '80px'
  },
  
  navItemActive: {
    background: 'var(--app-primary-soft)'
  },
  
  iconContainer: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  label: {
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.3px',
    transition: 'color 0.2s ease'
  },
  
  activeIndicator: {
    position: 'absolute' as const,
    top: '-2px',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: 'var(--app-primary)',
    animation: 'pulse 2s infinite'
  },
  
  centerSpacer: {
    width: '72px' // Espaço para o botão flutuante central
  }
}

// Adicionar animação de pulse
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes pulse {
      0% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.5;
        transform: scale(1.1);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }
  `
  document.head.appendChild(style)
}

const createStyles = (isSimpleMode: boolean) => ({
  ...styles,
  nav: {
    ...styles.nav,
    height: isSimpleMode ? '88px' : styles.nav.height,
    padding: isSimpleMode ? '0 12px' : styles.nav.padding,
    boxShadow: isSimpleMode ? 'none' : styles.nav.boxShadow,
    borderTop: isSimpleMode ? '2px solid var(--app-border)' : styles.nav.borderTop
  },
  navItem: {
    ...styles.navItem,
    minHeight: isSimpleMode ? '64px' : undefined,
    gap: isSimpleMode ? '6px' : styles.navItem.gap,
    padding: isSimpleMode ? '10px 8px' : styles.navItem.padding,
    borderRadius: isSimpleMode ? '10px' : styles.navItem.borderRadius
  },
  navItemActive: {
    ...styles.navItemActive,
    background: isSimpleMode ? 'var(--app-primary-soft)' : styles.navItemActive.background,
    outline: isSimpleMode ? '2px solid var(--app-primary)' : undefined
  },
  iconContainer: {
    ...styles.iconContainer,
    width: isSimpleMode ? '28px' : styles.iconContainer.width,
    height: isSimpleMode ? '28px' : styles.iconContainer.height
  },
  label: {
    ...styles.label,
    fontSize: isSimpleMode ? '14px' : styles.label.fontSize,
    fontWeight: isSimpleMode ? '700' : styles.label.fontWeight
  },
  activeIndicator: {
    ...styles.activeIndicator,
    display: isSimpleMode ? 'none' : undefined
  },
  centerSpacer: {
    ...styles.centerSpacer,
    width: isSimpleMode ? '48px' : styles.centerSpacer.width
  }
})
