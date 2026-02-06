// src/services/categoryService.ts
import { getFirestoreDb } from './firebaseService';
import { getCurrentUserId } from './storageService';

export type CategoryType = 'income' | 'expense';

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  color?: string;
  icon?: string;
  isDefault?: boolean;
  order?: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
};

// Categorias padrão
const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'inc_salary', name: 'Salário', type: 'income', color: '#10b981', isDefault: true, order: 1 },
  { id: 'inc_freelance', name: 'Freelance', type: 'income', color: '#3b82f6', isDefault: true, order: 2 },
  { id: 'inc_investment', name: 'Investimentos', type: 'income', color: '#8b5cf6', isDefault: true, order: 3 },
  { id: 'inc_gift', name: 'Presente', type: 'income', color: '#ec4899', isDefault: true, order: 4 },
  { id: 'inc_refund', name: 'Reembolso', type: 'income', color: '#14b8a6', isDefault: true, order: 5 },
  { id: 'inc_other', name: 'Outros', type: 'income', color: '#64748b', isDefault: true, order: 6 },
];

const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'exp_games', name: 'Jogos', type: 'expense', color: '#f59e0b', isDefault: true, order: 1 },
  { id: 'exp_food', name: 'Comida', type: 'expense', color: '#ef4444', isDefault: true, order: 2 },
  { id: 'exp_clothes', name: 'Roupa', type: 'expense', color: '#8b5cf6', isDefault: true, order: 3 },
  { id: 'exp_hair', name: 'Cabelo', type: 'expense', color: '#ec4899', isDefault: true, order: 4 },
  { id: 'exp_salary', name: 'Salario', type: 'expense', color: '#10b981', isDefault: true, order: 5 },
  { id: 'exp_fun', name: 'Lazer', type: 'expense', color: '#3b82f6', isDefault: true, order: 6 },
  { id: 'exp_computer', name: 'Computador', type: 'expense', color: '#6366f1', isDefault: true, order: 7 },
{ id: 'exp_safe', name: 'Cofre', type: 'expense', color: '#10b981', isDefault: true, order: 8 },
  { id: 'exp_other', name: 'Outros', type: 'expense', color: '#64748b', isDefault: true, order: 9 },
  { id: 'exp_withdraw', name: 'Retirada do Cofre', type: 'expense', color: '#f59e0b', isDefault: true, order: 10 },
];

const STORAGE_KEYS = {
  CATEGORIES: '@finances/categories',
  USER_ID: '@finances/user_id'
};

// Funções de storage local
const getStoredCategories = async (): Promise<Category[]> => {
  try {
    const userId = getCurrentUserId();
    const storageKey = userId ? `${STORAGE_KEYS.CATEGORIES}_${userId}` : STORAGE_KEYS.CATEGORIES;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
    
    // Se não tem categorias salvas, retorna padrão
    return [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];
  } catch (error) {
    console.error('❌ Erro ao carregar categorias do localStorage:', error);
    return [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];
  }
};

const saveCategoriesToStorage = async (categories: Category[]): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const storageKey = userId ? `${STORAGE_KEYS.CATEGORIES}_${userId}` : STORAGE_KEYS.CATEGORIES;
    
    // Filtrar apenas categorias não padrão para salvar
    const categoriesToSave = categories.map(cat => ({
      ...cat,
      // Garantir que categorias padrão tenham seus IDs originais
      id: cat.isDefault ? cat.id : cat.id || `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }));
    
    localStorage.setItem(storageKey, JSON.stringify(categoriesToSave));
    console.log('✅ Categorias salvas no localStorage:', categoriesToSave.length);
    
    // Disparar evento para atualizar UI
    window.dispatchEvent(new CustomEvent('categoriesUpdated'));
  } catch (error) {
    console.error('❌ Erro ao salvar categorias no localStorage:', error);
    throw error;
  }
};

// Funções do Firestore
const syncCategoriesToFirestore = async (userId: string, categories: Category[]): Promise<boolean> => {
  try {
    console.log('🔥 Sincronizando categorias com Firestore...');
    
    // Importar Firebase Firestore dinamicamente
    const { doc, setDoc } = await import('firebase/firestore');
    const firestore = getFirestoreDb();
    
    if (!firestore) {
      console.warn('⚠️ Firestore não disponível');
      return false;
    }
    
    // Preparar dados para Firestore (sincronizar apenas personalizadas)
    const customCategories = categories.filter(cat => !cat.isDefault);
    
    // Para cada categoria personalizada, salvar no Firestore
    for (const category of customCategories) {
      const catRef = doc(firestore, 'users', userId, 'categories', category.id);
      
      const catData = {
        name: category.name,
        type: category.type,
        color: category.color || '#3b82f6',
        userId: userId,
        createdAt: category.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: false
      };
      
      await setDoc(catRef, catData, { merge: true });
    }
    
    console.log('✅ Categorias sincronizadas com Firestore');
    return true;
  } catch (error) {
    console.error('❌ Erro ao sincronizar categorias com Firestore:', error);
    return false;
  }
};


const loadCategoriesFromFirestore = async (userId: string): Promise<Category[]> => {
  try {
    console.log('🔥 Carregando categorias do Firestore...');
    
    // Importar Firebase Firestore dinamicamente
    const { collection, getDocs } = await import('firebase/firestore');
    const firestore = getFirestoreDb();
    
    if (!firestore) {
      console.warn('⚠️ Firestore não disponível');
      return [];
    }
    
    const categoriesRef = collection(firestore, 'users', userId, 'categories');
    const snapshot = await getDocs(categoriesRef);
    
    const firestoreCategories: Category[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      firestoreCategories.push({
        id: docSnap.id,
        name: data.name || '',
        type: data.type || 'expense',
        color: data.color || '#3b82f6',
        userId: data.userId || userId,
        isDefault: data.isDefault || false,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString()
      });
    });
    
    console.log(`✅ ${firestoreCategories.length} categorias carregadas do Firestore`);
    return firestoreCategories;
  } catch (error) {
    console.error('❌ Erro ao carregar categorias do Firestore:', error);
    return [];
  }
};

// API principal
export const getCategories = async (type?: CategoryType): Promise<Category[]> => {
  try {
    const userId = getCurrentUserId();
    const firestoreCategories = userId ? await loadCategoriesFromFirestore(userId) : [];
    
    // Carregar do localStorage
    const storedCategories = await getStoredCategories();
    
    // Combinar: Firestore + localStorage (evitando duplicatas)
    const allCategories = [...storedCategories];
    
    // Adicionar categorias do Firestore que não existem localmente
    firestoreCategories.forEach(firestoreCat => {
      if (!allCategories.some(storedCat => storedCat.id === firestoreCat.id)) {
        allCategories.push(firestoreCat);
      }
    });
    
    // Filtrar por tipo se especificado
    if (type) {
      return allCategories.filter(cat => cat.type === type);
    }
    
    return allCategories;
  } catch (error) {
    console.error('❌ Erro ao carregar categorias:', error);
    return type === 'income' ? DEFAULT_INCOME_CATEGORIES : 
           type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : 
           [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];
  }
};

export const addCategory = async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> => {
  try {
    const newCategory: Category = {
      ...category,
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false
    };
    
    // Carregar categorias atuais
    const currentCategories = await getCategories();
    
    // Verificar se já existe
    const exists = currentCategories.some(cat => 
      cat.name.toLowerCase() === category.name.toLowerCase() && cat.type === category.type
    );
    
    if (exists) {
      throw new Error(`Já existe uma categoria "${category.name}" do tipo ${category.type}`);
    }
    
    // Adicionar nova categoria
    const updatedCategories = [...currentCategories, newCategory];
    
    // Salvar no localStorage
    await saveCategoriesToStorage(updatedCategories);
    
    // Sincronizar com Firestore se estiver logado
    const userId = getCurrentUserId();
    if (userId) {
      await syncCategoriesToFirestore(userId, [newCategory]);
    }
    
    console.log('✅ Categoria adicionada:', newCategory);
    return newCategory;
  } catch (error) {
    console.error('❌ Erro ao adicionar categoria:', error);
    throw error;
  }
};

export const updateCategory = async (id: string, updates: Partial<Category>): Promise<Category> => {
  try {
    const currentCategories = await getCategories();
    const categoryIndex = currentCategories.findIndex(cat => cat.id === id);
    
    if (categoryIndex === -1) {
      throw new Error('Categoria não encontrada');
    }
    
    // Não permitir editar categorias padrão
    if (currentCategories[categoryIndex].isDefault) {
      throw new Error('Não é possível editar categorias padrão');
    }
    
    const updatedCategory = {
      ...currentCategories[categoryIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    const updatedCategories = [...currentCategories];
    updatedCategories[categoryIndex] = updatedCategory;
    
    // Salvar no localStorage
    await saveCategoriesToStorage(updatedCategories);
    
    // Sincronizar com Firestore se estiver logado
    const userId = getCurrentUserId();
    if (userId) {
      await syncCategoriesToFirestore(userId, [updatedCategory]);
    }
    
    console.log('✅ Categoria atualizada:', updatedCategory);
    return updatedCategory;
  } catch (error) {
    console.error('❌ Erro ao atualizar categoria:', error);
    throw error;
  }
};

export const deleteCategory = async (id: string): Promise<void> => {
  try {
    const currentCategories = await getCategories();
    const category = currentCategories.find(cat => cat.id === id);
    
    if (!category) {
      throw new Error('Categoria não encontrada');
    }
    
    // Não permitir deletar categorias padrão
    if (category.isDefault) {
      throw new Error('Não é possível deletar categorias padrão');
    }
    
    const updatedCategories = currentCategories.filter(cat => cat.id !== id);
    
    // Salvar no localStorage
    await saveCategoriesToStorage(updatedCategories);
    
    // Remover do Firestore se estiver logado
    const userId = getCurrentUserId();
    if (userId) {
      await deleteCategoryFromFirestore(userId, id);
    }
    
    console.log('✅ Categoria deletada:', category.name);
  } catch (error) {
    console.error('❌ Erro ao deletar categoria:', error);
    throw error;
  }
};
export const reorderCategories = async (type: CategoryType, orderedIds: string[]): Promise<void> => {
  try {
    const currentCategories = await getCategories(type);
    
    // Atualizar ordem
    const updatedCategories = currentCategories.map(cat => {
      const newOrder = orderedIds.indexOf(cat.id);
      return newOrder !== -1 ? { ...cat, order: newOrder + 1 } : cat;
    });
    
    // Salvar no localStorage
    const allCategories = await getCategories();
    const otherCategories = allCategories.filter(cat => cat.type !== type);
    await saveCategoriesToStorage([...updatedCategories, ...otherCategories]);
    
    console.log('✅ Categorias reordenadas');
  } catch (error) {
    console.error('❌ Erro ao reordenar categorias:', error);
  }
};

const deleteCategoryFromFirestore = async (userId: string, categoryId: string): Promise<void> => {
  try {
    const { doc, deleteDoc } = await import('firebase/firestore');
    const firestore = getFirestoreDb();
    
    if (!firestore) {
      console.warn('⚠️ Firestore não disponível');
      return;
    }
    
    const catRef = doc(firestore, 'users', userId, 'categories', categoryId);
    await deleteDoc(catRef);
    console.log('✅ Categoria removida do Firestore');
  } catch (error) {
    console.warn('⚠️ Erro ao remover categoria do Firestore:', error);
  }
};



export const resetToDefaultCategories = async (): Promise<void> => {
  try {
    const defaultCategories = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];
    await saveCategoriesToStorage(defaultCategories);
    
    // Limpar categorias personalizadas do Firestore
    const userId = getCurrentUserId();
    if (userId) {
      try {
        const firestore = getFirestoreDb();
        if (firestore) {
          // Importar funções do Firebase
          const { collection, getDocs, writeBatch } = await import('firebase/firestore');
          
          const categoriesRef = collection(firestore, 'users', userId, 'categories');
          const snapshot = await getDocs(categoriesRef);
          
          // Usar batch para deletar múltiplos documentos
          const batch = writeBatch(firestore);
          snapshot.forEach(docSnap => {
            batch.delete(docSnap.ref);
          });
          
          await batch.commit();
          console.log('✅ Categorias personalizadas removidas do Firestore');
        }
      } catch (firestoreError) {
        console.warn('⚠️ Erro ao limpar categorias do Firestore:', firestoreError);
      }
    }
    
    console.log('✅ Categorias resetadas para padrão');
  } catch (error) {
    console.error('❌ Erro ao resetar categorias:', error);
    throw error;
  }
};
// ADICIONAR ESTA FUNÇÃO AUXILIAR PARA LIMPAR CATEGORIAS ANTIGAS
export const cleanupOldCategories = async (userId: string): Promise<void> => {
  try {
    const { collection, getDocs, writeBatch } = await import('firebase/firestore');
    const firestore = getFirestoreDb();
    
    if (!firestore) return;
    
    const categoriesRef = collection(firestore, 'users', userId, 'categories');
    const snapshot = await getDocs(categoriesRef);
    
    // Verificar categorias sem nome ou tipo
    const batch = writeBatch(firestore);
    let deletedCount = 0;
    
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (!data.name || !data.type) {
        batch.delete(docSnap.ref);
        deletedCount++;
      }
    });
    
    if (deletedCount > 0) {
      await batch.commit();
      console.log(`🧹 ${deletedCount} categorias inválidas removidas do Firestore`);
    }
  } catch (error) {
    console.warn('⚠️ Erro na limpeza de categorias:', error);
  }
};