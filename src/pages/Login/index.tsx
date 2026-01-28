// src/pages/Login/index.tsx
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../../services/auth';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      
      if (isLogin) {
        result = await loginUser(email, password);
      } else {
        if (!displayName.trim()) {
          throw new Error('Nome é obrigatório');
        }
        result = await registerUser(email, password, displayName);
      }

      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Ocorreu um erro');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Sistema de Gerenciamento</h2>
          <p>{isLogin ? 'Faça login para continuar' : 'Crie sua conta'}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="displayName">Nome</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>

        <div className="login-footer">
          <button 
            className="toggle-button"
            onClick={() => setIsLogin(!isLogin)}
            type="button"
          >
            {isLogin 
              ? 'Não tem uma conta? Cadastre-se' 
              : 'Já tem uma conta? Faça login'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;