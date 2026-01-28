// src/pages/Finance.tsx - ATUALIZE OS IMPORTS
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTransactionsByFilter,
  calculateSummary,
  addTransaction,
} from "../services/financeService";
import { saveAllTransactions } from "../services/storageService"; // Adicionar clearAllData
import { requestNotificationPermission } from "../services/notificationService";
import { getGoal, saveGoal } from "../services/goalService";
import { useAuth } from "../contexts"; // AuthContext já deve ter função de logout
import type { Goal } from "../types/Goal";
import { firebaseService } from "../services/firebase";
import { useFirebaseSync } from "../hooks/useFirebaseSync";
import { getAuth, signOut } from "firebase/auth"; // Adicionar imports do Firebase Auth

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
};

export default function Finance() {
  const navigate = useNavigate();
  const today = new Date();
  const isMounted = useRef(true);
  const { user, loading: authLoading } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing] = useState(false);
  const [goal, setGoal] = useState<Goal>({
    id: 1,
    name: "PC Gamer",
    target: 7000,
    saved: 0,
    createdAt: new Date().toISOString(),
  });
  const [monthData, setMonthData] = useState({ income: 0, expense: 0 });
  const [dataSource, setDataSource] = useState<"local" | "firebase">("local");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

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

  /* ============================
     LOAD ALL DATA (sistema híbrido)
  ============================ */
  // src/pages/Finance.tsx - ATUALIZE A FUNÇÃO loadAllData
  const loadAllData = useCallback(
    async (showLoading = true) => {
      if (!isMounted.current) return;

      if (showLoading) {
        setIsLoading(true);
      }

      try {
        // Determina fonte de dados
        const source = user ? "firebase" : "local";
        setDataSource(source);

        console.log(`📊 Carregando dados de: ${source}`);
        if (user) {
          console.log(`👤 Usuário: ${user.email} (${user.uid})`);
        }

        // 🔥 IMPORTANTE: Carrega transações usando a função atualizada que busca do Firestore
        const data = await getTransactionsByFilter(
          today.getMonth() + 1,
          today.getFullYear(),
        );

        console.log(`📈 ${data.length} transações carregadas`);

        const summary = calculateSummary(data);

        // Atualiza estados apenas se o componente ainda estiver montado
        if (isMounted.current) {
          setTotal(summary.total);
          setMonthData({
            income: summary.income,
            expense: summary.expense,
          });
        }

        // Carrega a meta
        const storedGoal = await getGoal();
        if (storedGoal && isMounted.current) {
          setGoal(storedGoal);
        } else if (isMounted.current) {
          await saveGoal(goal);
        }

        // Atualiza timestamp da última sincronização
        if (isMounted.current) {
          setLastSync(
            new Date().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          );
        }

        // Marcar que dados iniciais foram carregados
        hasLoadedInitialData.current = true;

        // 🔥 ATUALIZADO: Verificar dados no Firestore para debug
        if (user?.uid) {
          const firestoreTransactions =
            await firebaseService.getUserTransactions(user.uid);
          console.log(
            `🔥 Firestore tem: ${firestoreTransactions.length} transações`,
          );

          // Se não houver transações no Firestore mas houver localmente, sincronizar
          if (firestoreTransactions.length === 0 && data.length > 0) {
            console.log(
              "🔄 Nenhuma transação no Firestore, iniciando primeira sincronização...",
            );
            // Aguardar um pouco antes de sincronizar
            setTimeout(async () => {
              try {
                await firebaseService.syncTransactions(user.uid, data);
                console.log("✅ Primeira sincronização concluída!");
              } catch (error) {
                console.error("❌ Erro na primeira sincronização:", error);
              }
            }, 3000);
          }
        }
      } catch (error) {
        console.error("❌ Erro ao carregar dados:", error);

        // 🔥 NOVO: Em caso de erro no Firestore, tentar carregar apenas do localStorage
        if (user?.uid) {
          console.log(
            "⚠️ Erro no Firestore, tentando carregar do localStorage...",
          );
          try {
            const localData = await getTransactionsByFilter(
              today.getMonth() + 1,
              today.getFullYear(),
            );

            const summary = calculateSummary(localData);

            if (isMounted.current) {
              setTotal(summary.total);
              setMonthData({
                income: summary.income,
                expense: summary.expense,
              });
            }
          } catch (localError) {
            console.error(
              "❌ Erro ao carregar do localStorage também:",
              localError,
            );
          }
        }
      } finally {
        if (isMounted.current && showLoading) {
          setIsLoading(false);
        }
      }
    },
    [today, goal, user],
  );

  const handleLogout = async () => {
    const confirmLogout = window.confirm(
      "Tem certeza que deseja sair?\n\n" +
        "✅ Seus dados já estão sincronizados na nuvem\n" +
        "✅ Você poderá acessar de qualquer dispositivo\n" +
        "❌ Dados não sincronizados serão perdidos localmente",
    );

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
  const verifyDataSources = async () => {
    if (!user?.uid) {
      alert("Faça login primeiro");
      return;
    }

    try {
      console.log("🔍 Verificando fontes de dados...");

      // 1. Ver transações no Firestore
      const firestoreTransactions = await firebaseService.getUserTransactions(
        user.uid,
      );
      console.log("🔥 Firestore:", {
        count: firestoreTransactions.length,
        transactions: firestoreTransactions.slice(0, 5), // Primeiras 5
      });

      // 2. Ver transações no localStorage
      const localTransactions = await getTransactionsByFilter(
        today.getMonth() + 1,
        today.getFullYear(),
      );
      console.log("💾 Local:", {
        count: localTransactions.length,
        transactions: localTransactions.slice(0, 5),
      });

      // 3. Comparar
      const firestoreIds = firestoreTransactions
        .map((t) => t.id)
        .filter(Boolean);
      const localIds = localTransactions.map((t) => t.id).filter(Boolean);

      const inFirestoreNotLocal = firestoreTransactions.filter(
        (ft) => !localIds.includes(ft.id),
      );
      const inLocalNotFirestore = localTransactions.filter(
        (lt) => !firestoreIds.includes(lt.id),
      );

      console.log("🔍 Comparação:", {
        "Firestore → Local": inFirestoreNotLocal.length,
        "Local → Firestore": inLocalNotFirestore.length,
      });

      alert(`📊 Resultado:\n
Firestore: ${firestoreTransactions.length} transações\n
Local: ${localTransactions.length} transações\n
Faltam no Local: ${inFirestoreNotLocal.length}\n
Faltam no Firestore: ${inLocalNotFirestore.length}\n
\n📝 Dica: Use "Reset Firestore" para corrigir discrepâncias.`);
    } catch (error) {
      console.error("❌ Erro na verificação:", error);
      alert(`Erro: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const confirmLogout = () => {
    setShowLogoutModal(true);
  };

  // Adicione um botão para chamar esta função no JSX:
  <button
    onClick={verifyDataSources}
    style={{
      position: "fixed",
      bottom: "320px",
      left: "20px",
      padding: "10px 15px",
      background: "#3b82f6",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "12px",
      zIndex: 1000,
      cursor: "not-allowed;", //pointer or not-allowed;
      opacity: 0
    }}
  >
    🔍 Verificar Dados
  </button>;

  useEffect(() => {
    isMounted.current = true;
    requestNotificationPermission();

    // Função de inicialização SIMPLIFICADA
    const initializeData = async () => {
      if (user?.uid) {
        console.log("🚀 Usuário logado - Firestore como master");

        // 1. SEMPRE carregar do Firestore primeiro
        const success = await loadInitialData(user.uid);

        if (success) {
          // 2. Depois exibir os dados
          await loadAllData(true);

          // 3. Sincronizar em background (apenas envia locais que faltam)
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

    // Executa inicialização apenas uma vez
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

    setSyncStatus(null);

    try {
      console.log("🔄 Sincronizando com Firestore (master)...");

      // Usar syncData normal (não forceDownload)
      const result = await syncData(user.uid, false);

      setSyncStatus({
        success: result.success,
        message: result.message,
      });

      if (result.success) {
        setLastSync(
          new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );

        // Recarregar dados para exibir versão atualizada
        await loadAllData(false);
        console.log("🎉 Sincronização Firestore concluída!");
      }
    } catch (error) {
      console.error("❌ Erro na sincronização:", error);
      setSyncStatus({
        success: false,
        message: `Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      });
    }
  }, [user, syncInProgress, syncData, shouldSync, loadAllData]);

  // NOVA FUNÇÃO: Forçar download do Firestore (sobrescreve tudo)
  const forceDownloadFromFirestore = useCallback(
    async (userId: string): Promise<boolean> => {
      try {
        console.log("⬇️ Forçando download do Firestore...");

        // 1. Baixar tudo do Firestore
        const remoteTransactions =
          await firebaseService.getUserTransactions(userId);
        const remoteGoal = await firebaseService.getUserGoal(userId);

        // 2. Sobrescrever completamente o localStorage
        await saveAllTransactions(remoteTransactions, userId);

        if (remoteGoal) {
          await saveGoal(remoteGoal);
        }

        console.log(
          `✅ Download forçado: ${remoteTransactions.length} transações`,
        );

        // 3. Atualizar timestamp

        localStorage.setItem("@finances/last_sync", new Date().toISOString());

        return true;
      } catch (error) {
        console.error("❌ Erro no download forçado:", error);
        return false;
      }
    },
    [],
  );

  // Adicione função para forçar reset (corrigir duplicatas)
  const forceFirestoreReset = async () => {
    if (!user?.uid) {
      alert("Faça login primeiro");
      return;
    }

    const confirmReset = window.confirm(
      "⚠️ ISSO VAI:\n" +
        "1. Baixar TUDO do Firestore\n" +
        "2. Sobrescrever dados locais\n" +
        "3. Corrigir todas duplicatas\n\n" +
        "Tem certeza?",
    );

    if (!confirmReset) return;

    try {
      console.log("🔄 Forçando reset do Firestore...");

      // 1. Baixar tudo do Firestore
      const success = await forceDownloadFromFirestore(user.uid);

      if (success) {
        // 2. Recarregar dados
        await loadAllData(false);

        alert("✅ Reset completo!\nAgora usando Firestore como fonte única.");
      } else {
        alert("❌ Falha no reset. Tente novamente.");
      }
    } catch (error) {
      console.error("❌ Erro no reset:", error);
      alert("Erro ao fazer reset");
    }
  };

  /* ============================
     FUNÇÃO PARA LIMPAR TIMEOUT
  ============================ */
  const clearSyncTimeout = useCallback(() => {
    if (syncTimeoutRef.current !== null) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
  }, []);

  // Adicione esta função no componente Finance
  const testFirestoreDirectly = async () => {
    try {
      console.log("🧪 Testando Firestore diretamente...");

      if (!user?.uid) {
        alert("Faça login primeiro");
        return;
      }

      // Importar módulos do Firebase
      const { initializeApp } = await import("firebase/app");
      const { getFirestore, doc, setDoc, getDoc, Timestamp } =
        await import("firebase/firestore");

      // Configuração (mesma que já está usando)
      const config = {
        apiKey: "AIzaSyAJPxldozWGXPtjdYs4vFWEfv3-9PZqVwQ",
        authDomain: "fletnote.firebasestorage.app",
        projectId: "fletnote",
        storageBucket: "fletnote.firebasestorage.app",
        messagingSenderId: "436047979950",
        appId: "1:436047979950:web:08fb16c668eaf557d7d43f",
        measurementId: "G-1CV80ZBK4H",
      };

      // Inicializar app separado para teste
      const testApp = initializeApp(config, "test-" + Date.now());
      const testDb = getFirestore(testApp);

      // Teste 1: Escrever um documento
      const testRef = doc(
        testDb,
        "users",
        user.uid,
        "test_transactions",
        "test_" + Date.now(),
      );
      const testData = {
        type: "income",
        amount: 100.5,
        category: "Teste",
        description: "Teste direto do componente",
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        test: true,
        timestamp: Timestamp.now(),
      };

      console.log("📝 Escrevendo documento de teste...", testData);
      await setDoc(testRef, testData);
      console.log("✅ Documento escrito");

      // Teste 2: Ler o documento
      const docSnap = await getDoc(testRef);
      if (docSnap.exists()) {
        console.log("✅ Documento lido:", docSnap.data());
        alert("🎉 Firestore funcionando! Documento salvo e lido com sucesso.");

        // Mostrar no console
        console.log("📄 Documento salvo no Firestore:", {
          id: docSnap.id,
          data: docSnap.data(),
          path: docSnap.ref.path,
        });
      } else {
        alert("⚠️ Documento não encontrado após escrita");
      }
    } catch (error) {
      console.error("❌ ERRO no teste do Firestore:", error);
      alert(
        `❌ Erro: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  const checkFirestoreData = async () => {
    try {
      if (!user?.uid) {
        alert("Faça login primeiro");
        return;
      }

      console.log("🔍 Verificando dados no Firestore...");

      // Usar o serviço real para buscar transações
      const remoteTransactions = await firebaseService.getUserTransactions(
        user.uid,
      );
      const remoteGoal = await firebaseService.getUserGoal(user.uid);

      console.log("📊 Dados no Firestore:", {
        transactionsCount: remoteTransactions.length,
        transactions: remoteTransactions,
        goal: remoteGoal,
      });

      alert(
        `Firestore tem:\n${remoteTransactions.length} transações\nMeta: ${remoteGoal ? "Sim" : "Não"}`,
      );

      // Se não houver transações, vamos sincronizar uma de teste
      if (remoteTransactions.length === 0) {
        const syncTest = confirm(
          "Nenhuma transação no Firestore. Deseja sincronizar uma de teste?",
        );
        if (syncTest) {
          const testTx = {
            type: "income" as const,
            amount: 99.99,
            category: "Teste",
            description: "Transação de teste para Firestore",
            date: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          };

          await firebaseService.syncTransactions(user.uid, [testTx]);
          alert("✅ Transação de teste sincronizada! Verifique novamente.");
        }
      }
    } catch (error) {
      console.error("❌ Erro ao verificar Firestore:", error);
      alert(`Erro: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Adicione este botão no seu JSX:
  <>
    // Adicione este botão no seu JSX:
    <button
      onClick={testFirestoreDirectly}
      style={{
        position: "fixed",
        bottom: "160px",
        left: "20px",
        padding: "10px 15px",
        background: "#f59e0b",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "12px",
        zIndex: 1000,
        cursor: "not-allowed;", //pointer or not-allowed;
          opacity: 0
      }}
    >
      🧪 Testar Firestore
    </button>
    // Botão de debug temporário no Finance.tsx
    <button
      onClick={async () => {
        if (!user?.uid) {
          alert("Não logado");
          return;
        }

        console.log("🔍 Debug: Verificando autenticação...");
        console.log("User object:", user);
        console.log("User UID:", user.uid);

        // Testar diretamente o Firestore
        try {
          const { initializeApp } = await import("firebase/app");
          const { getFirestore, doc, setDoc } =
            await import("firebase/firestore");

          const config = {
            apiKey: "AIzaSyAJPxldozWGXPtjdYs4vFWEfv3-9PZqVwQ",
            authDomain: "fletnote.firebasestorage.app",
            projectId: "fletnote",
            storageBucket: "fletnote.firebasestorage.app",
            messagingSenderId: "436047979950",
            appId: "1:436047979950:web:08fb16c668eaf557d7d43f",
            measurementId: "G-1CV80ZBK4H",
          };

          const testApp = initializeApp(config, "debug-" + Date.now());
          const testDb = getFirestore(testApp);
          const testRef = doc(testDb, "debug", "test");

          await setDoc(testRef, {
            timestamp: new Date().toISOString(),
            userId: user.uid,
            test: true,
          });

          alert("✅ Firebase Auth e Firestore funcionando!");
        } catch (error) {
          console.error("❌ Erro no debug:", error);
          alert(
            `❌ Erro: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }}
      style={{
        position: "fixed",
        bottom: "80px",
        left: "20px",
        padding: "10px",
        background: "#ef4444",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "12px",
        zIndex: 1000,
        cursor: "not-allowed;", //pointer or not-allowed;
          opacity: 0
      }}
    >
      🐛 Debug Auth
    </button>
  </>;

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
    requestNotificationPermission();

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

      if (amount > total) {
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
        });

        // Atualiza meta localmente primeiro (feedback instantâneo)
        const newSaved = Math.min(goal.saved + amount, goal.target);
        const updatedGoal = {
          ...goal,
          saved: newSaved,
          updatedAt: new Date().toISOString(),
        };

        setGoal(updatedGoal);
        // Salva em segundo plano
        await saveGoal(updatedGoal);

        // Recarrega dados sem mostrar loading
        await loadAllData(false);

        // Sincronizar automaticamente se estiver logado
        if (user && !isSyncing) {
          // Debounce para sincronização após alteração
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
      total,
      goal,
      loadAllData,
      user,
      isSyncing,
      safeSyncWithFirebase,
      clearSyncTimeout,
    ],
  );

  // No Finance.tsx, adicione:
  const forceSync = async () => {
    if (!user?.uid) {
      alert("Faça login primeiro");
      return;
    }

    console.log("🚀 Forçando sincronização manual...");

    // Limpar último sync para forçar
    localStorage.removeItem("@finances/last_sync_attempt");

    // Chamar sincronização
    const result = await syncData(user.uid);

    if (result.success) {
      alert(`✅ Sincronização forçada:\n${result.message}`);

      // Recarregar dados
      await loadAllData(false);
    } else {
      alert(`❌ Falha na sincronização:\n${result.message}`);
    }
  };

  // Botão para forçar sync
  <button
    onClick={forceSync}
    disabled={isSyncing}
    style={{
      position: "fixed",
      bottom: "280px",
      left: "20px",
      padding: "10px 15px",
      background: isSyncing ? "#64748b" : "#10b981",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "12px",
      zIndex: 1000,
      cursor: isSyncing ? "not-allowed" : "pointer",
    }}
  >
    {isSyncing ? "⏳ Sincronizando..." : "🚀 Forçar Sync"}
  </button>;

  /* ============================
     MANUAL REFRESH (COM CONTROLE)
  ============================ */
  const handleManualRefresh = async () => {
    if (isLoading || isSyncing) return;

    await loadAllData(true);

    // Se estiver logado, sincronizar também
    if (user && !isSyncing) {
      clearSyncTimeout();
      syncTimeoutRef.current = window.setTimeout(() => {
        safeSyncWithFirebase();
      }, 1000);
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

  /* ============================
     MANUAL SYNC
  ============================ */
  const handleManualSync = async () => {
    if (isSyncing || !user) {
      alert(
        user ? "Sincronização em andamento..." : "Faça login para sincronizar",
      );
      return;
    }

    await safeSyncWithFirebase();
  };

  // Função para exibir status de sincronização temporariamente
  useEffect(() => {
    if (syncStatus) {
      const timer = window.setTimeout(() => {
        if (isMounted.current) {
          setSyncStatus(null);
        }
      }, 3000);

      return () => {
        window.clearTimeout(timer);
      };
    }
  }, [syncStatus]);

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

  const debugFirestoreData = async () => {
    if (!user?.uid) {
      alert("Faça login primeiro");
      return;
    }

    try {
      console.log("🔍 Debug detalhado do Firestore...");

      // 1. Ver transações do Firestore
      const firestoreTransactions = await firebaseService.getUserTransactions(
        user.uid,
      );
      console.log("📊 Transações no Firestore:", firestoreTransactions);

      // 2. Ver transações locais
      const today = new Date();
      const localTransactions = await getTransactionsByFilter(
        today.getMonth() + 1,
        today.getFullYear(),
      );
      console.log("💾 Transações locais:", localTransactions);

      // 3. Comparar
      const localIds = localTransactions.map((tx) => tx.id);
      const firestoreIds = firestoreTransactions.map((tx) => tx.id);

      console.log("🔍 Comparação:");
      console.log("- IDs locais:", localIds);
      console.log("- IDs Firestore:", firestoreIds);

      const missingInFirestore = localTransactions.filter(
        (tx) => tx.id && !firestoreIds.includes(tx.id),
      );
      const missingLocally = firestoreTransactions.filter(
        (tx) => tx.id && !localIds.includes(tx.id),
      );

      console.log(
        "📝 Faltando no Firestore:",
        missingInFirestore.length,
        "transações",
      );
      console.log(
        "📝 Faltando localmente:",
        missingLocally.length,
        "transações",
      );

      alert(`Resultado:\n
Firestore: ${firestoreTransactions.length} transações\n
Local: ${localTransactions.length} transações\n
Faltam no Firestore: ${missingInFirestore.length}\n
Faltam localmente: ${missingLocally.length}`);
    } catch (error) {
      console.error("❌ Erro no debug:", error);
      alert(`Erro: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // CONTINUAÇÃO DO COMPONENTE...
  // Renderização do componente continua abaixo...

  return (
    <div style={styles.container}>
      {/* HEADER com indicador de fonte de dados */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div style={styles.headerLeft}>
            <h1 style={styles.title}>Finanças Pessoais</h1>
            <h2>v1.22</h2>
            <div style={styles.date}>
              {today
                .toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })
                .replace(/^\w/, (c) => c.toUpperCase())}
            </div>
          </div>

          {syncInProgress && (
            <div
              style={{
                position: "fixed",
                top: 10,
                right: 10,
                background: "rgba(59, 130, 246, 0.9)",
                color: "white",
                padding: "8px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: "white",
                  animation: "pulse 1.5s infinite",
                }}
              ></div>
              Sincronizando...
            </div>
          )}

          <div style={styles.headerRight}>
            <div
              style={{
                ...styles.dataSourceBadge,
                background:
                  dataSource === "firebase"
                    ? "linear-gradient(135deg, #10b981, #059669)"
                    : "linear-gradient(135deg, #6b7280, #4b5563)",
              }}
            >
              {dataSource === "firebase" ? (
                <>
                  <Icons.Cloud /> Cloud
                </>
              ) : (
                <>
                  <Icons.HardDrive /> Local
                </>
              )}

              {lastSync && <div style={styles.syncTime}>{lastSync}</div>}
            </div>

            {/* BOTÃO DE REFRESH */}
            <button
              onClick={handleManualRefresh}
              style={styles.refreshButton}
              disabled={isLoading}
              title="Atualizar dados"
            >
              <Icons.Refresh />
            </button>

            {/* BOTÃO DE LOGOUT (APENAS SE ESTIVER LOGADO) */}
            {user && (
              <div
                style={styles.navCard}
                onClick={confirmLogout} // Mudar para confirmLogout
                onKeyPress={(e) => e.key === "Enter" && confirmLogout()}
                tabIndex={0}
                role="button"
              >
                {/* ... resto permanece igual ... */}
              </div>
            )}
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

        {/* BOTÃO DE SYNC NO HEADER */}
      <button
        onClick={handleManualSync}
        style={styles.refreshButton}
        disabled={isSyncing}
        title="Sincronizar com a nuvem"
      >
        {isSyncing ? <div style={styles.miniSpinner}></div> : <Icons.Cloud />}
      </button>

      </div>

      {/* STATUS DE SINCRONIZAÇÃO */}
      {syncStatus && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 20px",
            background: syncStatus.success
              ? "rgba(16, 185, 129, 0.9)"
              : "rgba(239, 68, 68, 0.9)",
            color: "white",
            borderRadius: "8px",
            zIndex: 1000,
            animation: "fadeIn 0.3s ease",
          }}
        >
          {syncStatus.message}
        </div>
      )}

      
      

      {/* SALDO CARD */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardIcon}>
            <Icons.Wallet />
          </div>
          <div>
            <h3 style={styles.cardTitle}>Saldo Disponível</h3>
            <div style={styles.cardSubtitle}>Mês atual</div>
          </div>
        </div>

        <div
          style={{
            ...styles.balanceAmount,
            color: total >= 0 ? "#10b981" : "#ef4444",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? "..." : `R$ ${total.toFixed(2)}`}
        </div>

        <div style={styles.balanceInfo}>
          <div style={styles.balanceItem}>
            <span style={styles.balanceLabel}>Entradas</span>
            <span
              style={{
                color: "#10b981",
                fontWeight: "600",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? "..." : `R$ ${monthData.income.toFixed(2)}`}
            </span>
          </div>
          <div style={styles.balanceDivider} />
          <div style={styles.balanceItem}>
            <span style={styles.balanceLabel}>Saídas</span>
            <span
              style={{
                color: "#ef4444",
                fontWeight: "600",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? "..." : `R$ ${monthData.expense.toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>

      {/* COFRE CARD */}
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
          <div>
            <h3 style={styles.cardTitle}>Meu Cofre</h3>
            <div style={styles.cardSubtitle}>{goal.name}</div>
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
              <span style={{ color: "#94a3b8", fontSize: 14 }}>Guardado:</span>
              <span style={{ fontWeight: "600", marginLeft: 8 }}>
                R$ {goal.saved.toFixed(2)}
              </span>
            </span>
            <span style={styles.progressValue}>
              <span style={{ color: "#94a3b8", fontSize: 14 }}>Meta:</span>
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

        {/* BOTÕES RÁPIDOS */}
        <div style={styles.quickActions}>
          <div style={styles.quickActionsLabel}>Adicionar valor:</div>
          <div style={styles.quickActionsGrid}>
            {[10, 50, 100, 500, 1000, 5000].map((value) => (
              <button
                key={value}
                onClick={() => addToSafe(value)}
                style={{
                  ...styles.quickActionButton,
                  background:
                    value <= total && !isLoading
                      ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                      : "#94a3b8",
                  cursor:
                    value <= total && !isLoading ? "pointer" : "not-allowed",
                  opacity: value <= total && !isLoading ? 1 : 0.6,
                }}
                disabled={value > total || isLoading}
              >
                +R$ {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={checkFirestoreData}
        style={{
          position: "fixed",
          bottom: "200px",
          left: "20px",
          padding: "10px 15px",
          background: "#8b5cf6",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "12px",
          zIndex: 1000,
          cursor: "not-allowed;", //pointer or not-allowed;
          opacity: 0
        }}
      >
        👁️ Ver Firestore
      </button>

      <button
        onClick={forceFirestoreReset}
        style={{
          position: "fixed",
          bottom: "280px",
          left: "20px",
          padding: "10px 15px",
          background: "#ef4444",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "12px",
          zIndex: 1000,
          cursor: "not-allowed;", //pointer or not-allowed;
          opacity: 0
        }}
      >
        🔄 Reset Firestore
      </button>

      {/* MENU DE NAVEGAÇÃO */}
      <div style={styles.navGrid}>
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
              <p style={styles.navDescription}>Salve seus dados na nuvem</p>
            </div>
            <div style={styles.navArrow}>
              <Icons.ArrowRight />
            </div>
          </div>
        )}

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

      {/* INFO BOX */}
      <div style={styles.infoBox}>
        {user ? (
          <>
            <div style={styles.infoIcon}>☁️</div>
            <div>
              <h4 style={styles.infoTitle}>Dados sincronizados na nuvem</h4>
              <p style={styles.infoText}>
                Seus dados estão seguros no Firebase e disponíveis em qualquer
                dispositivo.
              </p>
            </div>
          </>
        ) : (
          <>
            <div style={styles.infoIcon}>💾</div>
            <div>
              <h4 style={styles.infoTitle}>Dados salvos localmente</h4>
              <p style={styles.infoText}>
                Faça login para salvar na nuvem e acessar de qualquer lugar.
                Seus dados locais serão migrados automaticamente.
              </p>
            </div>
          </>
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

                <div style={styles.logoutInfo}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoIcon}>✅</span>
                    <span>Seus dados estão sincronizados na nuvem</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoIcon}>✅</span>
                    <span>Você poderá acessar de qualquer dispositivo</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoIcon}>⚠️</span>
                    <span>
                      Dados não sincronizados serão perdidos localmente
                    </span>
                  </div>
                </div>

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

      {/* FLOATING ACTION BUTTON */}
      <button
        onClick={() => navigate("/add")}
        style={{
          ...styles.fab,
          opacity: isLoading ? 0.7 : 1,
          cursor: isLoading ? "not-allowed" : "pointer",
        }}
        disabled={isLoading}
        aria-label="Adicionar transação"
      >
        <Icons.Plus />
      </button>

      {/* LOADING OVERLAY sutil (apenas durante atualizações) */}
      {isLoading && total > 0 && (
        <div style={styles.loadingOverlay}>
          <div style={styles.miniSpinner}></div>
          <div style={styles.loadingTextSmall}>
            Atualizando{" "}
            {dataSource === "firebase" ? "da nuvem ☁️" : "localmente 💾"}...
          </div>
        </div>
      )}

      <button
        onClick={debugFirestoreData}
        style={{
          position: "fixed",
          bottom: "240px",
          left: "20px",
          padding: "10px 15px",
          background: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "12px",
          zIndex: 1000,
          cursor: "not-allowed;", //pointer or not-allowed;
          opacity: 0
        }}
      >
        🔍 Debug Firestore
      </button>

      <button
        onClick={forceSync}
        disabled={isSyncing}
        style={{
          position: "fixed",
          bottom: "280px",
          left: "20px",
          padding: "10px 15px",
          background: isSyncing ? "#64748b" : "#10b981",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "12px",
          zIndex: 1000,
          cursor: "not-allowed;", //pointer or not-allowed;
          opacity: 0
        }}
      >
        {isSyncing ? "⏳ Sincronizando..." : "🚀 Forçar Sync"}
      </button>
    </div>
  );
}

// Adicionando estilos de loading
const styles = {
  // ... (seus estilos anteriores permanecem) ...

  container: {
    padding: "20px 16px",
    background: "#0f172a",
    minHeight: "100vh",
    color: "#f8fafc",
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
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  title: {
    fontSize: "28px",
    fontWeight: "700" as const,
    background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    color: "transparent",
    margin: 0,
    marginBottom: 8,
  },
  date: {
    fontSize: "14px",
    color: "#94a3b8",
  },
  dataSourceBadge: {
    padding: "8px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "600" as const,
    color: "white",
    display: "flex" as const,
    alignItems: "center" as const,
    gap: 6,
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
  },
  syncTime: {
    fontSize: 10,
    opacity: 0.9,
    marginLeft: 4,
    background: "rgba(255,255,255,0.2)",
    padding: "2px 6px",
    borderRadius: 10,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "none",
    background: "#334155",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    cursor: "pointer",
    transition: "all 0.2s ease",
    color: "#f8fafc",
  },
  userInfo: {
    display: "flex" as const,
    alignItems: "center" as const,
    background: "#1e293b",
    padding: "10px 14px",
    borderRadius: 12,
    fontSize: 14,
    color: "#cbd5e1",
  },
  userBadge: {
    marginLeft: "auto",
    fontSize: 12,
    background: "rgba(59, 130, 246, 0.2)",
    color: "#60a5fa",
    padding: "3px 8px",
    borderRadius: 12,
    fontWeight: "500" as const,
  },

  card: {
    background: "#1e293b",
    borderRadius: "20px",
    padding: "20px",
    marginBottom: "16px",
    border: "1px solid #334155",
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
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
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
    color: "#f8fafc",
  },

  cardSubtitle: {
    fontSize: "14px",
    color: "#94a3b8",
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
    background: "#0f172a",
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
    color: "#94a3b8",
    marginBottom: "4px",
  },

  balanceDivider: {
    width: "1px",
    height: "24px",
    background: "#334155",
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
    color: "#f8fafc",
  },

  progressPercentage: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#10b981",
  },

  progressBar: {
    height: "8px",
    background: "#334155",
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
    borderTop: "1px solid #334155",
  },

  quickActionsLabel: {
    fontSize: "14px",
    color: "#94a3b8",
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
    background: "#1e293b",
    borderRadius: "16px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    border: "1px solid #334155",
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
    color: "#f8fafc",
  },

  navDescription: {
    fontSize: "13px",
    color: "#94a3b8",
    margin: "4px 0 0 0",
  },

  navArrow: {
    color: "#64748b",
  },

  // INFO BOX
  infoBox: {
    background: "rgba(59, 130, 246, 0.1)",
    border: "1px solid rgba(59, 130, 246, 0.3)",
    borderRadius: "12px",
    padding: "16px",
    display: "flex" as const,
    alignItems: "flex-start" as const,
    marginBottom: "16px",
  },
  infoIcon: {
    fontSize: "24px",
    marginRight: "12px",
    marginTop: "2px",
  },
  infoTitle: {
    fontSize: "14px",
    fontWeight: "600" as const,
    color: "#60a5fa",
    margin: 0,
    marginBottom: "4px",
  },
  infoText: {
    fontSize: "12px",
    color: "#cbd5e1",
    margin: 0,
    lineHeight: "1.4",
  },

  fab: {
    position: "fixed" as const,
    bottom: "100px",
    right: "24px",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    border: "none",
    color: "white",
    fontSize: "24px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.5)",
    transition: "all 0.2s ease",
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
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  loadingText: {
    marginTop: "16px",
    color: "#94a3b8",
    fontSize: "16px",
  },

  loadingTextSmall: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "8px",
  },

  dataSourceIndicator: {
    fontSize: "13px",
    color: "#cbd5e1",
    textAlign: "center" as const,
    marginTop: "16px",
    padding: "8px 16px",
    background: "#1e293b",
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
    borderTop: "3px solid #3b82f6",
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
    background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
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
    color: "#f8fafc",
    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
  },

  modalOverlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    zIndex: 2000,
    backdropFilter: "blur(4px)",
  },

  modalContent: {
    background: "#1e293b",
    borderRadius: "20px",
    padding: "24px",
    width: "90%",
    maxWidth: "400px",
    border: "1px solid #334155",
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
    color: "#f8fafc",
    margin: 0,
  },

  modalBody: {
    marginBottom: "20px",
  },

  modalText: {
    color: "#cbd5e1",
    fontSize: "15px",
    lineHeight: "1.5",
    marginBottom: "20px",
  },

  logoutInfo: {
    background: "#0f172a",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "24px",
  },

  infoItem: {
    display: "flex" as const,
    alignItems: "flex-start" as const,
    marginBottom: "12px",
    fontSize: "14px",
    color: "#94a3b8",
  },

  modalActions: {
    display: "flex" as const,
    gap: "12px",
  },

  modalCancel: {
    flex: 1,
    padding: "12px",
    border: "1px solid #334155",
    background: "transparent",
    color: "#94a3b8",
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
};
