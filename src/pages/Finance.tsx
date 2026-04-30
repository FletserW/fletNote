// src/pages/Finance.tsx - ATUALIZE OS IMPORTS
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTransactionsByFilter,
  calculateSummary,
  addTransaction,
  syncAllBalancesToFirestore,
  getTotalBalanceForStatement
} from "../services/financeService";

//import { requestNotificationPermission } from "../services/notificationService";
import { getGoal, saveGoal } from "../services/goalService";
import { useAuth } from "../hooks/useAuth"; // AuthContext já deve ter função de logout
import type { Goal } from "../types/Goal";
import { firebaseService } from "../services/firebase";
import { useFirebaseSync } from "../hooks/useFirebaseSync";
import { getAuth, signOut } from "firebase/auth"; // Adicionar imports do Firebase Auth
import { useDesign } from "../contexts/DesignContext";

// Ícones simples em SVG
const Icons = {
  Wallet: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 12V7H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14v4" />
      <path d="M3 9v9a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12h.01" />
    </svg>
  ),
  Target: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  Calendar: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Chart: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Plus: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  ArrowRight: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  PiggyBank: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h12v-3.5c1.2-1.3 2-2.5 2-4.5 0-2.5-2.5-4-5-4z" />
      <path d="M12 9v6" />
      <path d="M15 12h-6" />
    </svg>
  ),
  Cloud: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  ),
  HardDrive: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M22 12H2" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  User: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Refresh: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  Logout: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Edit: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),

  Category: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 11h16M4 6h16M4 16h16M4 21h16" />
    </svg>
  ),

  Withdraw: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),

  Save: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),

  Cancel: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
};

export default function Finance() {
  const navigate = useNavigate();
  const { designMode } = useDesign();
  const isSimpleMode = designMode === "assisted";
  const today = new Date();
  const isMounted = useRef(true);
  const { user, loading: authLoading } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [goal, setGoal] = useState<Goal>({
    id: 1,
    name: "PC Gamer",
    target: 7000,
    saved: 0,
    createdAt: new Date().toISOString(),
  });
  const [monthData, setMonthData] = useState({ income: 0, expense: 0 });

  const [showEditGoalModal, setShowEditGoalModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal>({
    id: 1,
    name: "Meta",
    target: 5000,
    saved: 0,
    createdAt: new Date().toISOString(),
  });

  const {
    isSyncing: syncInProgress,
    syncData,
    loadInitialData,
    shouldSync,
  } = useFirebaseSync();

  // Refs para controle de sincronização
  const hasLoadedInitialData = useRef(false);
  const hasSyncedAfterLogin = useRef(false);
  const syncTimeoutRef = useRef<number | null>(null); // Alterado para number | null
  // Estados no Dashboard
const [availableBalance, setAvailableBalance] = useState(0); // Este será o saldo acumulado
const [previousMonthBalance, setPreviousMonthBalance] = useState(0);
const [total, setTotal] = useState(0); // Saldo apenas do mês atual

  /* ============================
     LOAD ALL DATA (sistema híbrido)
  ============================ */

// NO Dashboard (Finance.tsx) 
const loadAllData = useCallback(
  async (showLoading = true) => {
    if (!isMounted.current) return;

    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const source = user ? "firebase" : "local";

      console.log(`📊 Carregando dados de: ${source}`);
      if (user) {
        console.log(`👤 Usuário: ${user.email} (${user.uid})`);
      }

      // 1. Carregar transações do mês atual
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      
      const data = await getTransactionsByFilter(
        currentMonth,
        currentYear,
      );

      console.log(`📈 ${data.length} transações carregadas`);

      const summary = calculateSummary(data);

      // 2. 🔥 USAR A MESMA FUNÇÃO DO EXTRATO
      const userId = user?.uid;
      const balanceData = await getTotalBalanceForStatement(
        currentMonth,
        currentYear,
        userId
      );

      // 3. Atualizar estados com os dados corretos
      if (isMounted.current) {
        setTotal(summary.total);
        
        // 🔥 USAR accumulatedBalance ao invés de availableBalance
        setAvailableBalance(balanceData.accumulatedBalance); // Alteração aqui
        setPreviousMonthBalance(balanceData.previousBalance);
        
        setMonthData({
          income: summary.income,
          expense: summary.expense,
        });
      }

      // 4. Carrega a meta
      const storedGoal = await getGoal();
      if (storedGoal && isMounted.current) {
        setGoal(storedGoal);
      } else if (isMounted.current) {
        await saveGoal(goal);
      }

      hasLoadedInitialData.current = true;

      console.log('💰 Saldos (Dashboard):', {
        mesAtual: summary.total,
        mesesAnteriores: balanceData.previousBalance,
        totalAcumulado: balanceData.accumulatedBalance
      });

    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error);
    } finally {
      if (isMounted.current && showLoading) {
        setIsLoading(false);
      }
    }
  },
  [today, goal, user],
);


useEffect(() => {
  const handleMonthChange = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Verificar se o mês mudou desde a última atualização
    const lastUpdate = localStorage.getItem('@finances/last_balance_update');
    if (lastUpdate) {
      const lastUpdateDate = new Date(lastUpdate);
      if (lastUpdateDate.getMonth() + 1 !== currentMonth || 
          lastUpdateDate.getFullYear() !== currentYear) {
        // Mês mudou, recarregar saldos
        refreshBalances();
        localStorage.setItem('@finances/last_balance_update', new Date().toISOString());
      }
    }
  };
  
  // Verificar a cada minuto se o mês mudou
  const interval = setInterval(handleMonthChange, 60000);
  
  return () => clearInterval(interval);
}, [user]);

const refreshBalances = async () => {
  try {
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const userId = user?.uid;
    
    // Buscar saldo acumulado
    const balanceData = await getTotalBalanceForStatement(
      currentMonth,
      currentYear,
      userId
    );
    
    // Atualizar estados
    setAvailableBalance(balanceData.accumulatedBalance);
    setPreviousMonthBalance(balanceData.previousBalance);
    
    console.log('🔁 Saldos atualizados:', balanceData);
  } catch (error) {
    console.error('❌ Erro ao atualizar saldos:', error);
  }
};

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Tem certeza que deseja sair?");

    if (!confirmLogout) return;

    try {
      setIsLoading(true);
      console.log("🚪 Iniciando logout...");

      // 1. Garantir última sincronização
      if (user?.uid) {
        console.log("🔄 Fazendo última sincronização...");
        try {
          const data = await getTransactionsByFilter(
            today.getMonth() + 1,
            today.getFullYear(),
          );

          if (data.length > 0) {
            await firebaseService.syncTransactions(user.uid, data);
            console.log("✅ Última sincronização concluída");
          }
        } catch (syncError) {
          console.warn("⚠️ Erro na última sincronização:", syncError);
        } finally {
          setShowLogoutModal(false);
          setIsLoading(false);
        }
      }

      // 2. Fazer logout do Firebase
      try {
        const auth = getAuth();
        await signOut(auth);
        console.log("✅ Logout do Firebase realizado");
      } catch (firebaseError) {
        console.error("❌ Erro no logout do Firebase:", firebaseError);
      }

      // 3. Limpar dados locais (opcional - comentado por padrão)
      // Descomente a linha abaixo se quiser limpar dados locais ao fazer logout
      // clearAllData();

      // 4. Limpar indicadores de sincronização
      localStorage.removeItem("@finances/last_sync");
      localStorage.removeItem("@finances/last_sync_attempt");

      // 5. Feedback ao usuário
      alert(
        "✅ Logout realizado com sucesso!\n\n" +
          "Seus dados estão seguros na nuvem ☁️\n" +
          "Faça login novamente para acessá-los.",
      );

      // 6. Redirecionar para login
      navigate("/login");
    } catch (error) {
      console.error("❌ Erro durante o logout:", error);
      alert("Erro ao fazer logout. Tente novamente.");
      setIsLoading(false);
    }
  };

  // src/pages/Finance.tsx - ADICIONE ESTA FUNÇÃO


 useEffect(() => {
  isMounted.current = true;

  const initializeData = async () => {
    if (user?.uid) {
      console.log("🚀 Usuário logado - inicializando dados");

      // 1. Sincronizar saldos locais com Firestore
      try {
        await syncAllBalancesToFirestore(user.uid);
        console.log("✅ Saldos sincronizados com Firestore");
      } catch (syncError) {
        console.warn("⚠️ Erro ao sincronizar saldos:", syncError);
      }

      // 2. Carregar dados iniciais
      const success = await loadInitialData(user.uid);

      if (success) {
        // 3. Exibir dados
        await loadAllData(true);

        // 4. Sincronizar em background
        setTimeout(() => {
          if (isMounted.current) {
            safeSyncWithFirebase();
          }
        }, 3000);
      }
    } else {
      // Usuário não logado - apenas carrega local
      await loadAllData(true);
    }
  };

  if (!hasLoadedInitialData.current) {
    initializeData();
    hasLoadedInitialData.current = true;
  }

  return () => {
    isMounted.current = false;
    clearSyncTimeout();
  };
}, []);


  // Atualize a função safeSyncWithFirebase:
  const safeSyncWithFirebase = useCallback(async () => {
    if (!user?.uid || syncInProgress) {
      return;
    }

    // Verificar se precisa sincronizar
    if (!shouldSync()) {
      console.log("⏸️  Última sincronização recente, pulando...");
      return;
    }

    try {
      console.log("🔄 Sincronizando com Firestore (master)...");

      // Usar syncData normal (não forceDownload)
      const result = await syncData(user.uid, false);

      if (result.success) {
        // Recarregar dados para exibir versao atualizada
        await loadAllData(false);
        console.log("🎉 Sincronização Firestore concluída!");
      }
    } catch (error) {
      console.error("❌ Erro na sincronização:", error);
    }
  }, [user, syncInProgress, syncData, shouldSync, loadAllData]);



  /* ============================
     FUNÇÃO PARA LIMPAR TIMEOUT
  ============================ */
  const clearSyncTimeout = useCallback(() => {
    if (syncTimeoutRef.current !== null) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
  }, []);




  /* ============================
     SINCRONIZAÇÃO SEGURA
  ============================ */
  // No seu componente Finance, altere a função safeSyncWithFirebase:

  // Certifique-se de importar o firebaseService real:

  /* ============================
     Sincronizar dados quando usuário faz login (COM DEBOUNCE)
  ============================ */
  useEffect(() => {
    if (!user || !hasLoadedInitialData.current || hasSyncedAfterLogin.current) {
      return;
    }

    // Limpar timeout anterior se existir
    clearSyncTimeout();

    // Debounce de 3 segundos para evitar múltiplas sincronizações
    syncTimeoutRef.current = window.setTimeout(() => {
      console.log("🔑 Usuário logado detectado, sincronizando em 3s...");
      safeSyncWithFirebase();
    }, 3000);

    return () => {
      clearSyncTimeout();
    };
  }, [user, safeSyncWithFirebase, clearSyncTimeout]);

  /* ============================
     INITIAL LOAD (UMA VEZ)
  ============================ */
  useEffect(() => {
    isMounted.current = true;
    //requestNotificationPermission();

    // Carrega dados iniciais apenas uma vez
    if (!hasLoadedInitialData.current) {
      loadAllData();
    }

    // Configura listener para mudanças de autenticação (COM DEBOUNCE)
    const handleAuthChange = () => {
      if (isMounted.current && hasLoadedInitialData.current) {
        // Debounce para evitar múltiplas recargas
        clearSyncTimeout();

        syncTimeoutRef.current = window.setTimeout(() => {
          loadAllData(false);
        }, 1000);
      }
    };

    window.addEventListener("focus", handleAuthChange);

    return () => {
      isMounted.current = false;
      window.removeEventListener("focus", handleAuthChange);
      clearSyncTimeout();
    };
  }, []);

  /* ============================
     ADD TO SAFE
  ============================ */
  const addToSafe = useCallback(
    async (amount: number) => {
      if (amount <= 0) {
        alert("Valor deve ser maior que zero");
        return;
      }

      if (amount > availableBalance) {
        alert("Saldo insuficiente para guardar esse valor");
        return;
      }

      try {
        // Adiciona transação
        await addTransaction({
          type: "expense",
          amount: amount,
          category: "Cofre",
          description: `Depósito no cofre: ${goal.name}`,
          date: new Date().toISOString(),
          transferType: "vault_deposit",
          excludeFromSummary: true,
        });

        // Atualiza meta localmente primeiro (feedback instantâneo)
        const newSaved = Math.min(goal.saved + amount, goal.target);
        const updatedGoal = {
          ...goal,
          saved: newSaved,
          updatedAt: new Date().toISOString(),
        };

        setGoal(updatedGoal);

        // Salva no localStorage
        await saveGoal(updatedGoal);

        // 🔥 NOVO: Salva no Firestore se estiver logado
        if (user?.uid) {
          try {
            console.log("🔥 Salvando meta atualizada no Firestore...");
            await firebaseService.syncGoal(user.uid, updatedGoal);
            console.log("✅ Meta salva no Firestore");
          } catch (firestoreError) {
            console.warn(
              "⚠️ Erro ao salvar meta no Firestore:",
              firestoreError,
            );
          }
        }

        // Recarrega dados sem mostrar loading
        await loadAllData(false);

        // Sincronizar automaticamente se estiver logado
        if (user && !syncInProgress) {
          clearSyncTimeout();
          syncTimeoutRef.current = window.setTimeout(() => {
            safeSyncWithFirebase();
          }, 2000);
        }

        // Feedback ao usuário
        const source = user ? "Firebase ☁️" : "local 💾";
        alert(
          `✅ R$ ${amount.toFixed(2)} adicionado ao cofre!\nSalvo em: ${source}`,
        );
      } catch (error) {
        console.error("❌ Erro ao adicionar ao cofre:", error);
        alert("Erro ao adicionar valor ao cofre. Tente novamente.");
      }
    },
    [
      availableBalance,
      goal,
      loadAllData,
      user,
      syncInProgress,
      safeSyncWithFirebase,
      clearSyncTimeout,
    ],
  );

  /* ============================
     FUNÇÃO: EDITAR META
  ============================ */
  const openEditGoalModal = () => {
    setEditingGoal({ ...goal });
    setShowEditGoalModal(true);
  };

  const saveEditedGoal = async () => {
    try {
      if (!editingGoal.name.trim()) {
        alert("Digite um nome para a meta");
        return;
      }

      if (editingGoal.target <= 0) {
        alert("O valor da meta deve ser maior que zero");
        return;
      }

      if (editingGoal.saved > editingGoal.target) {
        const confirmExceed = window.confirm(
          `O valor guardado (R$ ${editingGoal.saved.toFixed(2)}) é maior que a nova meta (R$ ${editingGoal.target.toFixed(2)}).\n\nDeseja ajustar o valor guardado para o valor da meta?`,
        );

        if (confirmExceed) {
          editingGoal.saved = editingGoal.target;
        } else {
          return;
        }
      }

      setIsLoading(true);

      const updatedGoal = {
        ...editingGoal,
        updatedAt: new Date().toISOString(),
      };

      // Atualiza localmente
      setGoal(updatedGoal);
      await saveGoal(updatedGoal);

      // 🔥 Salva no Firestore se estiver logado
      if (user?.uid) {
        try {
          console.log("🔥 Salvando meta editada no Firestore...");
          await firebaseService.syncGoal(user.uid, updatedGoal);
          console.log("✅ Meta editada salva no Firestore");
        } catch (firestoreError) {
          console.warn("⚠️ Erro ao salvar meta no Firestore:", firestoreError);
        }
      }

      setShowEditGoalModal(false);

      // Recarrega dados
      await loadAllData(false);

      // Sincroniza se estiver logado
      if (user && !syncInProgress) {
        safeSyncWithFirebase();
      }

      alert("✅ Meta atualizada com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao salvar meta:", error);
      alert("Erro ao salvar meta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ============================
     FUNÇÃO: RETIRAR VALOR DO COFRE
  ============================ */
  const openWithdrawModal = () => {
    setShowWithdrawModal(true);
  };

  const withdrawFromSafe = async (amount: number) => {
    try {
      if (amount <= 0) {
        alert("Valor deve ser maior que zero");
        return;
      }

      if (amount > goal.saved) {
        alert("Valor insuficiente no cofre para retirar esse valor");
        return;
      }

      // Confirmação
      const confirmWithdraw = window.confirm(
        `Tem certeza que deseja retirar R$ ${amount.toFixed(2)} do cofre?\n\n` +
          `Após a retirada:\n` +
          `• Saldo no cofre: R$ ${(goal.saved - amount).toFixed(2)}\n` +
          `• Saldo disponível: R$ ${(availableBalance + amount).toFixed(2)}`,
      );

      if (!confirmWithdraw) return;

      setIsLoading(true);

      // Adiciona transação de retirada (como income)
      await addTransaction({
        type: "income",
        amount: amount,
        category: "Retirada do Cofre",
        description: `Retirada do cofre: ${goal.name}`,
        date: new Date().toISOString(),
        transferType: "vault_withdrawal",
        excludeFromSummary: true,
      });

      // Atualiza meta
      const updatedGoal = {
        ...goal,
        saved: Math.max(0, goal.saved - amount),
        updatedAt: new Date().toISOString(),
      };

      setGoal(updatedGoal);
      await saveGoal(updatedGoal);

      // 🔥 Salva no Firestore se estiver logado
      if (user?.uid) {
        try {
          console.log("🔥 Salvando retirada no Firestore...");
          await firebaseService.syncGoal(user.uid, updatedGoal);
          console.log("✅ Retirada salva no Firestore");
        } catch (firestoreError) {
          console.warn(
            "⚠️ Erro ao salvar retirada no Firestore:",
            firestoreError,
          );
        }
      }

      setShowWithdrawModal(false);

      // Recarrega dados
      await loadAllData(false);

      // Sincroniza se estiver logado
      if (user && !syncInProgress) {
        safeSyncWithFirebase();
      }

      alert(`✅ R$ ${amount.toFixed(2)} retirado do cofre com sucesso!`);
    } catch (error) {
      console.error("❌ Erro ao retirar do cofre:", error);
      alert("Erro ao retirar valor do cofre. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ============================
     FUNÇÃO: EXCLUIR META
  ============================ */
  const resetGoal = async () => {
    const confirmReset = window.confirm(
      "Tem certeza que deseja resetar sua meta?\n\n" +
        "• O valor guardado será zerado\n" +
        "• Você pode manter o nome e valor da meta\n" +
        "• Esta ação não pode ser desfeita",
    );

    if (!confirmReset) return;

    try {
      setIsLoading(true);

      const resetGoal = {
        ...goal,
        saved: 0,
        updatedAt: new Date().toISOString(),
      };

      setGoal(resetGoal);
      await saveGoal(resetGoal);

      // 🔥 Salva no Firestore se estiver logado
      if (user?.uid) {
        try {
          console.log("🔥 Salvando meta resetada no Firestore...");
          await firebaseService.syncGoal(user.uid, resetGoal);
          console.log("✅ Meta resetada salva no Firestore");
        } catch (firestoreError) {
          console.warn("⚠️ Erro ao salvar meta no Firestore:", firestoreError);
        }
      }

      // Recarrega dados
      await loadAllData(false);

      // Sincroniza se estiver logado
      if (user && !syncInProgress) {
        safeSyncWithFirebase();
      }

      alert("✅ Meta resetada com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao resetar meta:", error);
      alert("Erro ao resetar meta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid && !hasLoadedInitialData.current) {
      const loadAndSync = async () => {
        await loadAllData(true);

        // Carregar dados iniciais do Firestore se necessário
        await loadInitialData(user.uid);

        // Sincronizar após carregar
        setTimeout(() => {
          safeSyncWithFirebase();
        }, 2000);
      };

      loadAndSync();
    }
  }, [user, loadAllData, loadInitialData, safeSyncWithFirebase]);

  const progress = Math.min((goal.saved / goal.target) * 100, 100);
  const remaining = goal.target - goal.saved;

  // Se estiver carregando e ainda não tem dados, mostra loading
  if (
    authLoading ||
    (isLoading &&
      total === 0 &&
      monthData.income === 0 &&
      monthData.expense === 0)
  ) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <div style={styles.loadingText}>
            {authLoading
              ? "Verificando autenticação..."
              : "Carregando seus dados..."}
          </div>
          {user && (
            <div style={styles.dataSourceIndicator}>
              <Icons.User /> Conectado como: {user.email}
            </div>
          )}
        </div>
      </div>
    );
  }




  return (
    <div style={styles.container}>
      {/* HEADER com indicador de fonte de dados */}
      <div style={styles.header}>
        <div style={isSimpleMode ? styles.simpleHeaderTop : styles.headerTop}>
          <div style={styles.headerLeft}>
            <h1 style={styles.title}>Finanças Pessoais</h1>
            <h2>v1.32</h2>
            <div style={styles.date}>
              {today
                .toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })
                .replace(/^\w/, (c) => c.toUpperCase())}
            </div>
          </div>
        </div>

        {user && (
          <div style={styles.userInfo}>
            <Icons.User />
            <span style={{ fontWeight: "500", marginLeft: 8 }}>
              {user.email}
            </span>
            <div style={styles.userBadge}>
              {user.emailVerified ? "✓ Verificado" : "Não verificado"}
            </div>
          </div>
        )}
      </div>

      {/* SALDO CARD */}
  
{/* SALDO DISPONÍVEL - ATUALIZADO */}
<div style={styles.card}>
  <div style={styles.cardHeader}>
    <div style={styles.cardIcon}>
      <Icons.Wallet />
    </div>
    <div>
      <h3 style={styles.cardTitle}>Saldo Total Disponível</h3>
      <div style={styles.cardSubtitle}>
        {previousMonthBalance > 0 
          ? `Incluindo saldo acumulado dos meses anteriores`
          : `Apenas mês atual`}
      </div>
    </div>
  </div>

  <div
    style={{
      ...styles.balanceAmount,
      color: availableBalance >= 0 ? "#10b981" : "#ef4444",
      opacity: isLoading ? 0.7 : 1,
    }}
  >
    {isLoading ? "..." : `R$ ${availableBalance.toFixed(2)}`}
  </div>

  {/* DETALHAMENTO DO SALDO - SIMILAR AO EXTRATO */}
  <div style={styles.balanceBreakdown}>
    {previousMonthBalance > 0 && (
      <div style={styles.breakdownRow}>
        <div style={styles.breakdownLabel}>
          <span style={{ color: 'var(--app-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px' }}>📅</span>
            Acumulado (meses anteriores):
          </span>
        </div>
        <div style={styles.breakdownValue}>
          + R$ {previousMonthBalance.toFixed(2)}
        </div>
      </div>
    )}
    
    <div style={styles.breakdownRow}>
      <div style={styles.breakdownLabel}>
        <span style={{ color: 'var(--app-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '12px' }}>📊</span>
          {today.getMonth() + 1}/{today.getFullYear()}:
        </span>
      </div>
      <div style={{
        ...styles.breakdownValue,
        color: total >= 0 ? '#10b981' : '#ef4444'
      }}>
        {total >= 0 ? '+ ' : '- '}R$ {Math.abs(total).toFixed(2)}
      </div>
    </div>
    
    <div style={{
      ...styles.breakdownRow,
      borderTop: '1px solid var(--app-border)',
      paddingTop: '8px',
      marginTop: '8px',
      fontWeight: '600'
    }}>
      <div style={styles.breakdownLabel}>
        <span style={{ color: 'var(--app-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '12px' }}>💰</span>
          Saldo total:
        </span>
      </div>
      <div style={{
        ...styles.breakdownValue,
        color: availableBalance >= 0 ? '#10b981' : '#ef4444',
        fontSize: '16px'
      }}>
        R$ {availableBalance.toFixed(2)}
      </div>
    </div>
  </div>


</div>

{/* RESUMO DO MÊS ATUAL */}
<div style={{
  ...styles.card,
  marginTop: '12px',
  background: 'var(--app-soft-panel-muted)',
  border: '1px solid var(--app-border)'
}}>
  <div style={styles.cardHeader}>
    <div style={{
      ...styles.cardIcon,
      background: 'linear-gradient(135deg, var(--app-primary), #2563eb)',
      width: '36px',
      height: '36px'
    }}>
      <Icons.Calendar />
    </div>
    <div>
      <h3 style={{...styles.cardTitle, fontSize: '16px'}}>Resumo do Mês</h3>
      <div style={{...styles.cardSubtitle, fontSize: '12px'}}>
        {today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
      </div>
    </div>
  </div>

  <div style={styles.balanceInfo}>
    <div style={styles.balanceItem}>
      <span style={styles.balanceLabel}>Entradas</span>
      <span style={{ color: "#10b981", fontWeight: "600", fontSize: '14px' }}>
        R$ {monthData.income.toFixed(2)}
      </span>
    </div>
    <div style={styles.balanceDivider} />
    <div style={styles.balanceItem}>
      <span style={styles.balanceLabel}>Saídas</span>
      <span style={{ color: "#ef4444", fontWeight: "600", fontSize: '14px' }}>
        R$ {monthData.expense.toFixed(2)}
      </span>
    </div>
  </div>
  
  <div style={{
    ...styles.balanceItem,
    justifyContent: 'center',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid var(--app-border)'
  }}>
    <span style={{...styles.balanceLabel, fontSize: '14px'}}>Saldo do mês</span>
    <span style={{ 
      color: total >= 0 ? "#10b981" : "#ef4444", 
      fontWeight: "600",
      fontSize: '16px'
    }}>
      R$ {total.toFixed(2)}
    </span>
  </div>
</div>

      {/* COFRE CARD - ATUALIZADO COM NOVOS BOTÕES */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div
            style={{
              ...styles.cardIcon,
              background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
            }}
          >
            <Icons.PiggyBank />
          </div>
          <div style={styles.goalHeaderContent}>
            <div>
              <h3 style={styles.cardTitle}>Meu Cofre</h3>
              <div style={styles.cardSubtitle}>{goal.name}</div>
            </div>
            <div style={styles.goalActions}>
              {/* BOTÃO EDITAR META */}
              <button
                onClick={openEditGoalModal}
                style={styles.iconButton}
                title="Editar meta"
              >
                <Icons.Edit />
              </button>

              {/* BOTÃO RETIRAR */}
              {goal.saved > 0 && (
                <button
                  onClick={openWithdrawModal}
                  style={{
                    ...styles.iconButton,
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  }}
                  title="Retirar do cofre"
                >
                  <Icons.Withdraw />
                </button>
              )}

              {/* BOTÃO RESETAR */}
              <button
                onClick={resetGoal}
                style={{
                  ...styles.iconButton,
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                }}
                title="Resetar meta"
              >
                <Icons.Cancel />
              </button>
            </div>
          </div>
        </div>

        {/* PROGRESSO */}
        <div style={styles.progressSection}>
          <div style={styles.progressHeader}>
            <span style={styles.progressLabel}>Progresso</span>
            <span style={styles.progressPercentage}>
              {progress.toFixed(1)}%
            </span>
          </div>

          <div style={styles.progressBar}>
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #10b981, #34d399)",
                borderRadius: 10,
                transition: "width 0.3s ease",
              }}
            />
          </div>

          <div style={styles.progressValues}>
            <span style={styles.progressValue}>
              <span style={{ color: "var(--app-text-muted)", fontSize: 14 }}>Guardado:</span>
              <span style={{ fontWeight: "600", marginLeft: 8 }}>
                R$ {goal.saved.toFixed(2)}
              </span>
            </span>
            <span style={styles.progressValue}>
              <span style={{ color: "var(--app-text-muted)", fontSize: 14 }}>Meta:</span>
              <span style={{ fontWeight: "600", marginLeft: 8 }}>
                R$ {goal.target.toFixed(2)}
              </span>
            </span>
          </div>

          {remaining > 0 ? (
            <div style={styles.remainingText}>
              Faltam R$ {remaining.toFixed(2)} para atingir a meta
            </div>
          ) : (
            <div style={styles.completedText}>🎉 Meta atingida! Parabéns!</div>
          )}
        </div>

        {/* BOTÕES RÁPIDOS - ATUALIZADO COM OPÇÃO PERSONALIZADA */}
        <div style={styles.quickActions}>
          <div style={styles.quickActionsHeader}>
            <div style={styles.quickActionsLabel}>Adicionar valor:</div>
            <button
              onClick={() => {
                const customAmount = prompt(
                  "Digite o valor para adicionar ao cofre:",
                );
                if (customAmount) {
                  const amount = parseFloat(customAmount.replace(",", "."));
                  if (!isNaN(amount) && amount > 0) {
                    addToSafe(amount);
                  } else {
                    alert("Valor inválido. Digite um número positivo.");
                  }
                }
              }}
              style={styles.customAmountButton}
              title="Adicionar valor personalizado"
            >
              + Valor personalizado
            </button>
          </div>

          <div style={styles.quickActionsGrid}>
            {[10, 50, 100, 500, 1000, 5000].map((value) => (
              <button
                key={value}
                onClick={() => addToSafe(value)}
                style={{
                  ...styles.quickActionButton,
                  background:
                    value <= availableBalance && !isLoading
                      ? "linear-gradient(135deg, var(--app-primary), #2563eb)"
                      : "var(--app-text-muted)",
                  cursor:
                    value <= availableBalance && !isLoading ? "pointer" : "not-allowed",
                  opacity: value <= availableBalance && !isLoading ? 1 : 0.6,
                }}
                disabled={value > availableBalance || isLoading}
              >
                +R$ {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL EDITAR META */}
      {showEditGoalModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={styles.modalIcon}>✏️</div>
              <h3 style={styles.modalTitle}>Editar Meta</h3>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Nome da Meta</label>
                <input
                  type="text"
                  value={editingGoal.name}
                  onChange={(e) =>
                    setEditingGoal({ ...editingGoal, name: e.target.value })
                  }
                  style={styles.formInput}
                  placeholder="Ex: PC Gamer, Viagem, Carro..."
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Valor da Meta (R$)</label>
                <input
                  type="number"
                  value={editingGoal.target}
                  onChange={(e) =>
                    setEditingGoal({
                      ...editingGoal,
                      target: parseFloat(e.target.value) || 0,
                    })
                  }
                  style={styles.formInput}
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>
                  Valor Atual Guardado (R$)
                </label>
                <input
                  type="number"
                  value={editingGoal.saved}
                  onChange={(e) =>
                    setEditingGoal({
                      ...editingGoal,
                      saved: parseFloat(e.target.value) || 0,
                    })
                  }
                  style={styles.formInput}
                  min="0"
                  max={editingGoal.target}
                  step="0.01"
                  placeholder="0.00"
                />
                <div style={styles.formHelp}>
                  Máximo: R$ {editingGoal.target.toFixed(2)}
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  onClick={() => setShowEditGoalModal(false)}
                  style={styles.modalCancel}
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEditedGoal}
                  style={styles.modalConfirm}
                  disabled={isLoading}
                >
                  {isLoading ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RETIRAR DO COFRE */}
      {showWithdrawModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={styles.modalIcon}>💰</div>
              <h3 style={styles.modalTitle}>Retirar do Cofre</h3>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.withdrawInfo}>
                <div style={styles.withdrawInfoItem}>
                  <span>Saldo no cofre:</span>
                  <span style={styles.withdrawAmount}>
                    R$ {goal.saved.toFixed(2)}
                  </span>
                </div>
                <div style={styles.withdrawInfoItem}>
                  <span>Saldo disponível:</span>
                  <span style={styles.withdrawAmount}>
                    R$ {availableBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              <div style={styles.withdrawQuickValues}>
                <div style={styles.withdrawQuickLabel}>Valores rápidos:</div>
                <div style={styles.withdrawQuickGrid}>
                  {[50, 100, 200, 500, 1000].map((value) => (
                    <button
                      key={value}
                      onClick={() => withdrawFromSafe(value)}
                      style={{
                        ...styles.withdrawQuickButton,
                        background:
                          value <= goal.saved
                            ? "linear-gradient(135deg, #f59e0b, #d97706)"
                            : "var(--app-text-muted)",
                        cursor: value <= goal.saved ? "pointer" : "not-allowed",
                        opacity: value <= goal.saved ? 1 : 0.6,
                      }}
                      disabled={value > goal.saved}
                    >
                      R$ {value}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Valor personalizado (R$)</label>
                <div style={styles.withdrawCustom}>
                  <input
                    type="number"
                    id="customWithdrawAmount"
                    style={styles.formInput}
                    min="1"
                    max={goal.saved}
                    step="0.01"
                    placeholder="Digite o valor"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById(
                        "customWithdrawAmount",
                      ) as HTMLInputElement;
                      const amount = parseFloat(input.value.replace(",", "."));
                      if (
                        !isNaN(amount) &&
                        amount > 0 &&
                        amount <= goal.saved
                      ) {
                        withdrawFromSafe(amount);
                      } else {
                        alert(
                          `Valor inválido. Digite um valor entre R$ 0,01 e R$ ${goal.saved.toFixed(2)}`,
                        );
                      }
                    }}
                    style={styles.withdrawCustomButton}
                  >
                    Retirar
                  </button>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  style={styles.modalCancel}
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => withdrawFromSafe(goal.saved)}
                  style={{
                    ...styles.modalConfirm,
                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  }}
                  disabled={isLoading || goal.saved <= 0}
                >
                  {isLoading ? "Processando..." : "Retirar Tudo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* MENU DE NAVEGAÇÃO */}
      <div style={styles.navGrid}>
        <div style={styles.navCard} onClick={() => navigate("/add")}>
          <div
            style={{
              ...styles.navIcon,
              background: "linear-gradient(135deg, #10b981, #059669)",
            }}
          >
            <Icons.Plus />
          </div>
          <div style={styles.navContent}>
            <h4 style={styles.navTitle}>Adicionar Transacao</h4>
            <p style={styles.navDescription}>Registrar entrada ou saida</p>
          </div>
          <div style={styles.navArrow}>
            <Icons.ArrowRight />
          </div>
        </div>

        <div style={styles.navCard} onClick={() => navigate("/statement")}>
          <div
            style={{
              ...styles.navIcon,
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
            }}
          >
            <Icons.Chart />
          </div>
          <div style={styles.navContent}>
            <h4 style={styles.navTitle}>Extrato</h4>
            <p style={styles.navDescription}>Ver todas as transações</p>
          </div>
          <div style={styles.navArrow}>
            <Icons.ArrowRight />
          </div>
        </div>

        <div style={styles.navCard} onClick={() => navigate("/annual")}>
          <div
            style={{
              ...styles.navIcon,
              background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
            }}
          >
            <Icons.Calendar />
          </div>
          <div style={styles.navContent}>
            <h4 style={styles.navTitle}>Resumo Anual</h4>
            <p style={styles.navDescription}>Visão completa do ano</p>
          </div>
          <div style={styles.navArrow}>
            <Icons.ArrowRight />
          </div>
        </div>

       
<div style={styles.navCard} onClick={() => navigate("/recurring")}>
  <div
    style={{
      ...styles.navIcon,
      background: "linear-gradient(135deg, #f59e0b, #d97706)",
    }}
  >
    <Icons.Calendar />
  </div>
  <div style={styles.navContent}>
    <h4 style={styles.navTitle}>Gastos Fixos</h4>
    <p style={styles.navDescription}>Gerencie contas recorrentes</p>
  </div>
  <div style={styles.navArrow}>
    <Icons.ArrowRight />
  </div>
</div>
        {!user && (
          <div style={styles.navCard} onClick={() => navigate("/login")}>
            <div
              style={{
                ...styles.navIcon,
                background: "linear-gradient(135deg, #10b981, #059669)",
              }}
            >
              <Icons.Cloud />
            </div>
            <div style={styles.navContent}>
              <h4 style={styles.navTitle}>Fazer Login</h4>
              <p style={styles.navDescription}>Entrar na sua conta</p>
            </div>
            <div style={styles.navArrow}>
              <Icons.ArrowRight />
            </div>
          </div>
        )}

        <div style={styles.navCard} onClick={() => navigate("/categories")}>
          <div
            style={{
              ...styles.navIcon,
              background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
            }}
          >
            <Icons.Category />
          </div>
          <div style={styles.navContent}>
            <h4 style={styles.navTitle}>Categorias</h4>
            <p style={styles.navDescription}>Gerenciar suas categorias</p>
          </div>
          <div style={styles.navArrow}>
            <Icons.ArrowRight />
          </div>
        </div>

        {user && (
          <div
            style={styles.navCard}
            onClick={handleLogout}
            onKeyPress={(e) => e.key === "Enter" && handleLogout()}
            tabIndex={0}
            role="button"
          >
            <div
              style={{
                ...styles.navIcon,
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
              }}
            >
              <Icons.Logout />
            </div>
            <div style={styles.navContent}>
              <h4 style={styles.navTitle}>Sair da Conta</h4>
              <p style={styles.navDescription}>Encerrar sessão atual</p>
            </div>
            <div style={styles.navArrow}>
              <Icons.ArrowRight />
            </div>
          </div>
        )}

        
      </div>

      <div style={styles.container}>
        {/* MODAL DE CONFIRMAÇÃO DE LOGOUT */}
        {showLogoutModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <div style={styles.modalIcon}>🚪</div>
                <h3 style={styles.modalTitle}>Sair da Conta</h3>
              </div>

              <div style={styles.modalBody}>
                <p style={styles.modalText}>
                  Tem certeza que deseja sair da sua conta?
                </p>

                <div style={styles.modalActions}>
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    style={styles.modalCancel}
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleLogout}
                    style={styles.modalConfirm}
                    disabled={isLoading}
                  >
                    {isLoading ? "Saindo..." : "Sim, Sair"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}{" "}
      </div>


      {/* LOADING OVERLAY sutil (apenas durante atualizações) */}
      {isLoading && total > 0 && (
        <div style={styles.loadingOverlay}>
          <div style={styles.miniSpinner}></div>
          <div style={styles.loadingTextSmall}>
            Atualizando dados...
          </div>
        </div>
      )}

    </div>
  );
}

// Adicionando estilos de loading
const styles = {
  // ... (seus estilos anteriores permanecem) ...

  container: {
    padding: "20px 16px",
    background: "var(--app-surface)",
    minHeight: "100vh",
    color: "var(--app-text)",
  },

  // HEADER
  header: {
    marginBottom: 24,
  },
  headerTop: {
    display: "flex" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
    marginBottom: 12,
  },
  simpleHeaderTop: {
    display: "flex" as const,
    flexDirection: "column" as const,
    alignItems: "stretch" as const,
    gap: 16,
    marginBottom: 18,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: "28px",
    fontWeight: "700" as const,
    background: "var(--app-gradient-title)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    color: "transparent",
    margin: 0,
    marginBottom: 8,
  },
  date: {
    fontSize: "14px",
    color: "var(--app-text-muted)",
  },
  userInfo: {
    display: "flex" as const,
    alignItems: "center" as const,
    background: "var(--app-surface-elevated)",
    padding: "10px 14px",
    borderRadius: 12,
    fontSize: 14,
    color: "var(--app-text-secondary)",
  },
  userBadge: {
    marginLeft: "auto",
    fontSize: 12,
    background: "rgba(59, 130, 246, 0.2)",
    color: "var(--app-primary)",
    padding: "3px 8px",
    borderRadius: 12,
    fontWeight: "500" as const,
  },

  card: {
    background: "var(--app-surface-elevated)",
    borderRadius: "20px",
    padding: "20px",
    marginBottom: "16px",
    border: "1px solid var(--app-border)",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
  },

  cardIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, var(--app-primary), #2563eb)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "12px",
    color: "white",
  },

  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    margin: 0,
    color: "var(--app-text)",
  },

  cardSubtitle: {
    fontSize: "14px",
    color: "var(--app-text-muted)",
    marginTop: "4px",
  },

  balanceAmount: {
    fontSize: "36px",
    fontWeight: "700",
    marginBottom: "16px",
    fontFamily: "monospace",
  },

  balanceInfo: {
    display: "flex",
    alignItems: "center",
    background: "var(--app-surface)",
    borderRadius: "12px",
    padding: "12px",
  },

  balanceItem: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
  },

  balanceLabel: {
    fontSize: "12px",
    color: "var(--app-text-muted)",
    marginBottom: "4px",
  },

  balanceDivider: {
    width: "1px",
    height: "24px",
    background: "var(--app-border)",
  },

  progressSection: {
    marginTop: "16px",
  },

  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },

  progressLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--app-text)",
  },

  progressPercentage: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#10b981",
  },

  progressBar: {
    height: "8px",
    background: "var(--app-border)",
    borderRadius: "10px",
    overflow: "hidden",
    marginBottom: "16px",
  },

  progressValues: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },

  progressValue: {
    display: "flex",
    alignItems: "center",
  },

  remainingText: {
    fontSize: "13px",
    color: "#fbbf24",
    background: "rgba(251, 191, 36, 0.1)",
    padding: "8px 12px",
    borderRadius: "8px",
    textAlign: "center" as const,
    marginTop: "12px",
  },

  completedText: {
    fontSize: "13px",
    color: "#10b981",
    background: "rgba(16, 185, 129, 0.1)",
    padding: "8px 12px",
    borderRadius: "8px",
    textAlign: "center" as const,
    marginTop: "12px",
    fontWeight: "600",
  },

  quickActions: {
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: "1px solid var(--app-border)",
  },

  quickActionsLabel: {
    fontSize: "14px",
    color: "var(--app-text-muted)",
    marginBottom: "12px",
  },

  quickActionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
  },

  quickActionButton: {
    padding: "12px 8px",
    borderRadius: "12px",
    border: "none",
    color: "white",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  navGrid: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },

  navCard: {
    background: "var(--app-surface-elevated)",
    borderRadius: "16px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    border: "1px solid var(--app-border)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  navIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "12px",
    color: "white",
  },

  navContent: {
    flex: 1,
  },

  navTitle: {
    fontSize: "16px",
    fontWeight: "600",
    margin: 0,
    color: "var(--app-text)",
  },

  navDescription: {
    fontSize: "13px",
    color: "var(--app-text-muted)",
    margin: "4px 0 0 0",
  },

  navArrow: {
    color: "var(--app-text-subtle)",
  },

  loadingContainer: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "70vh",
    padding: "60px 20px",
  },

  loadingSpinner: {
    width: "50px",
    height: "50px",
    border: "4px solid rgba(51, 65, 85, 0.3)",
    borderTop: "4px solid var(--app-primary)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  loadingText: {
    marginTop: "16px",
    color: "var(--app-text-muted)",
    fontSize: "16px",
  },

  loadingTextSmall: {
    fontSize: "12px",
    color: "var(--app-text-muted)",
    marginTop: "8px",
  },

  dataSourceIndicator: {
    fontSize: "13px",
    color: "var(--app-text-secondary)",
    textAlign: "center" as const,
    marginTop: "16px",
    padding: "8px 16px",
    background: "var(--app-surface-elevated)",
    borderRadius: "12px",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: "6px",
  },

  loadingOverlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.8)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(2px)",
  },

  miniSpinner: {
    width: "40px",
    height: "40px",
    border: "3px solid rgba(51, 65, 85, 0.3)",
    borderTop: "3px solid var(--app-primary)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  syncProgress: {
    marginTop: "8px",
    height: "4px",
    background: "rgba(59, 130, 246, 0.2)",
    borderRadius: "2px",
    overflow: "hidden",
  },
  syncProgressBar: {
    height: "100%",
    width: "100%",
    background: "linear-gradient(90deg, var(--app-primary), var(--app-primary-strong))",
    animation: "progress 2s ease-in-out infinite",
    borderRadius: "2px",
  },

  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "none",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    cursor: "pointer",
    transition: "all 0.2s ease",
    color: "var(--app-text)",
    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
  },

  modalOverlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "var(--app-overlay)",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    zIndex: 2000,
    backdropFilter: "blur(4px)",
  },

  modalContent: {
    background: "var(--app-surface-elevated)",
    borderRadius: "20px",
    padding: "24px",
    width: "90%",
    maxWidth: "400px",
    border: "1px solid var(--app-border)",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
  },

  modalHeader: {
    display: "flex" as const,
    alignItems: "center" as const,
    marginBottom: "20px",
  },

  modalIcon: {
    fontSize: "32px",
    marginRight: "12px",
  },

  modalTitle: {
    fontSize: "20px",
    fontWeight: "600" as const,
    color: "var(--app-text)",
    margin: 0,
  },

  modalBody: {
    marginBottom: "20px",
  },

  modalText: {
    color: "var(--app-text-secondary)",
    fontSize: "15px",
    lineHeight: "1.5",
    marginBottom: "20px",
  },

  logoutInfo: {
    background: "var(--app-surface)",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "24px",
  },

  infoItem: {
    display: "flex" as const,
    alignItems: "flex-start" as const,
    marginBottom: "12px",
    fontSize: "14px",
    color: "var(--app-text-muted)",
  },

  modalActions: {
    display: "flex" as const,
    gap: "12px",
  },

  modalCancel: {
    flex: 1,
    padding: "12px",
    border: "1px solid var(--app-border)",
    background: "transparent",
    color: "var(--app-text-muted)",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600" as const,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  modalConfirm: {
    flex: 1,
    padding: "12px",
    border: "none",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "white",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600" as const,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  goalHeaderContent: {
    display: "flex" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    flex: 1,
  },

  goalActions: {
    display: "flex" as const,
    gap: "8px",
  },

  iconButton: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    background: "linear-gradient(135deg, #6b7280, #4b5563)",
    color: "white",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  quickActionsHeader: {
    display: "flex" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: "12px",
  },

  customAmountButton: {
    padding: "8px 12px",
    background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600" as const,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  formGroup: {
    marginBottom: "16px",
  },

  formLabel: {
    display: "block" as const,
    fontSize: "14px",
    fontWeight: "600" as const,
    color: "var(--app-text)",
    marginBottom: "8px",
  },

  formInput: {
    width: "100%",
    padding: "12px",
    background: "var(--app-surface)",
    border: "1px solid var(--app-border)",
    borderRadius: "8px",
    color: "var(--app-text)",
    fontSize: "15px",
  },

  formHelp: {
    fontSize: "12px",
    color: "var(--app-text-muted)",
    marginTop: "4px",
  },

  withdrawInfo: {
    background: "var(--app-surface)",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "20px",
  },

  withdrawInfoItem: {
    display: "flex" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: "8px",
    fontSize: "14px",
    color: "var(--app-text-secondary)",
  },

  withdrawAmount: {
    fontSize: "16px",
    fontWeight: "600" as const,
    color: "#10b981",
  },

  withdrawQuickValues: {
    marginBottom: "20px",
  },

  withdrawQuickLabel: {
    fontSize: "14px",
    fontWeight: "600" as const,
    color: "var(--app-text)",
    marginBottom: "12px",
  },

  withdrawQuickGrid: {
    display: "grid" as const,
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "8px",
  },

  withdrawQuickButton: {
    padding: "10px 8px",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontSize: "13px",
    fontWeight: "600" as const,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  withdrawCustom: {
    display: "flex" as const,
    gap: "8px",
  },

  withdrawCustomButton: {
    padding: "12px 16px",
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600" as const,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },

  // Adicione ao objeto styles:

balanceBreakdown: {
  background: 'var(--app-surface)',
  borderRadius: '8px',
  padding: '12px',
  marginTop: '12px',
  border: '1px solid var(--app-border)'
},

breakdownRow: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '6px',
  fontSize: '14px'
},

breakdownLabel: {
  color: 'var(--app-text-secondary)'
},

breakdownValue: {
  color: 'var(--app-text)',
  fontWeight: '500'
},
};
