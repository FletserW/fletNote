import React from 'react';
import DayOffConfigPanel from '../components/DayOffConfigPanel';

const DayOffSettings: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Configurações de Folgas</h1>
        <p style={styles.subtitle}>
          Configure seus dias de folga fixos, regulares e extras
        </p>
      </div>
      
      <div style={styles.content}>
        <DayOffConfigPanel />
      </div>
      
      <div style={styles.infoCard}>
        <h3 style={styles.infoTitle}>Como funciona:</h3>
        <ul style={styles.infoList}>
          <li><strong>Folgas Fixas:</strong> Dias específicos da semana (ex: toda quarta)</li>
          <li><strong>Folgas Regulares:</strong> A cada X dias (ex: a cada 21 dias)</li>
          <li><strong>Folgas Extras:</strong> Dias específicos que você escolher</li>
          <li>As configurações são salvas no seu perfil e sincronizadas entre dispositivos</li>
        </ul>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    minHeight: '100vh',
    background: '#0f172a',
    color: '#f8fafc'
  },
  header: {
    marginBottom: '30px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent'
  },
  subtitle: {
    fontSize: '16px',
    color: '#94a3b8'
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  infoCard: {
    maxWidth: '800px',
    margin: '30px auto 0',
    padding: '20px',
    background: '#1e293b',
    borderRadius: '12px',
    border: '1px solid #334155'
  },
  infoTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#f8fafc'
  },
  infoList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#cbd5e1'
  },
  infoListLi: {
    marginBottom: '8px',
    lineHeight: '1.5'
  }
};

export default DayOffSettings;