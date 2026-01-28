// src/contexts/auth/AuthContext.tsx
import { createContext } from 'react';
import type { User } from 'firebase/auth';

// Interface para userData
interface UserData {
  displayName?: string;
  email?: string;
  photoURL?: string;
}

export interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  setUserData: (data: UserData | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);