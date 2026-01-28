// src/contexts/auth/AuthProvider.tsx (versão simplificada - RECOMENDADO)
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';

interface UserData {
  displayName?: string;
  email?: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  setUserData: (data: UserData | null) => void;
}

import { AuthContext } from './AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser: User | null) => {
      if (authUser) {
        // Usuário acabou de fazer login
        console.log('Usuário logado:', authUser.email);
        
        // Cria userData básico
        const userData: UserData = {
          displayName: authUser.displayName || undefined,
          email: authUser.email || undefined,
          photoURL: authUser.photoURL || undefined
        };
        setUserData(userData);
      } else {
        // Usuário deslogou
        console.log('Usuário deslogado');
        setUserData(null);
      }
      
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    userData,
    loading,
    setUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};