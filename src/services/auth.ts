// src/services/auth.ts
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  type User
} from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  balance: number;
  dayOffs: string[];
  transactions: unknown[];
  createdAt: string;
  settings: {
    currency: string;
    notifications: boolean;
  };
}

// Registrar novo usuário
export const registerUser = async (email: string, password: string, displayName: string): Promise<AuthResult> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    await updateProfile(userCredential.user, {
      displayName: displayName
    });

    await createUserDocument(userCredential.user.uid, email, displayName);
    
    return { success: true, user: userCredential.user };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error("Erro no registro:", errorMessage);
    return { success: false, error: errorMessage };
  }
};

// Login
export const loginUser = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error("Erro no login:", errorMessage);
    return { success: false, error: errorMessage };
  }
};

// Logout
export const logoutUser = async (): Promise<AuthResult> => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error("Erro no logout:", errorMessage);
    return { success: false, error: errorMessage };
  }
};

// Observar estado de autenticação
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Recuperar senha
export const resetPassword = async (email: string): Promise<AuthResult> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error("Erro ao recuperar senha:", errorMessage);
    return { success: false, error: errorMessage };
  }
};

// Criar documento do usuário no Firestore
const createUserDocument = async (uid: string, email: string, displayName: string): Promise<void> => {
  try {
    const userRef = doc(db, "users", uid);
    
    const userData: UserData = {
      uid: uid,
      email: email,
      displayName: displayName,
      balance: 0,
      dayOffs: [],
      transactions: [],
      createdAt: new Date().toISOString(),
      settings: {
        currency: "BRL",
        notifications: true
      }
    };

    await setDoc(userRef, userData);
    console.log("Documento do usuário criado com sucesso");
  } catch (error) {
    console.error("Erro ao criar documento do usuário:", error);
  }
};

// Buscar dados do usuário
export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserData;
    } else {
      console.log("Documento não encontrado");
      return null;
    }
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    return null;
  }
};