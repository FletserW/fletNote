// src/hooks/useUserData.js
import { useEffect, useState } from 'react';
import { getUserData } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';

export const useUserData = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const userData = await getUserData(user.uid);
      setData(userData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateBalance = async (newBalance) => {
    // Implementar atualização no Firestore
  };

  const addTransaction = async (transaction) => {
    // Implementar adição de transação
  };

  return {
    data,
    loading,
    error,
    refreshData: loadData,
    updateBalance,
    addTransaction
  };
};