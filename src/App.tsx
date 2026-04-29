// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthProvider'; // Import do barrel
import AuthGuard from './components/AuthGuard';
import Finance from './pages/Finance';
import Calendar from './pages/Calendar';
import Statement from './pages/Statement';
import BottomNav from './components/BottomNav';
import AddTransaction from './pages/AddTransaction';
import AnnualSummary from './pages/AnnualSummary';
//import { checkTodayDayOff } from './services/dayOffNotification';
import Login from './pages/Login';
import ManageCategories from './pages/ManageCategories';
import DayOffSettings from './pages/dayoff-settings';
import Budgets from './pages/Budgets';
import BudgetForm from './components/BudgetForm';
import RecurringExpenses from './pages/RecurringExpenses';
import Cards from './pages/Cards';


// Componente Layout protegido
const ProtectedLayout = () => {
  return (
    <div style={{ paddingBottom: '70px' }}>
      <Routes>
        <Route path="/" element={<Finance />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/statement" element={<Statement />} />
        <Route path="/add" element={<AddTransaction />} />
        <Route path="/annual" element={<AnnualSummary />} />
        <Route path="/categories" element={<ManageCategories />} />
        <Route path="/dayoff-settings" element={<DayOffSettings />} />
        <Route path="orcamentos" element={<Budgets />} />
        <Route path="/recurring" element={<RecurringExpenses />} />
        <Route path="/cards" element={<Cards />} />
      <Route
  path="orcamentos/novo"
  element={
    <BudgetForm
      onSave={(data) => {
        console.log(data);
      }}
      onClose={() => {
        console.log("fechar");
      }}
    />
  }
/>

      <Route path="orcamentos/editar/:id" element={
    <BudgetForm
      onSave={(data) => {
        console.log(data);
      }}
      onClose={() => {
        console.log("fechar");
      }}
    />
  } />
      </Routes>
      <BottomNav />
    </div>
  );
};

export default function App() {
  useEffect(() => {
    //checkTodayDayOff();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <AuthGuard>
              <ProtectedLayout />
            </AuthGuard>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}