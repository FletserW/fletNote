// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './contexts'; // Import do barrel
import AuthGuard from './components/AuthGuard';
import Finance from './pages/Finance';
import Calendar from './pages/Calendar';
import Statement from './pages/Statement';
import BottomNav from './components/BottomNav';
import AddTransaction from './pages/AddTransaction';
import AnnualSummary from './pages/AnnualSummary';
import { checkTodayDayOff } from './services/dayOffNotification';
import Login from './pages/Login';

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
      </Routes>
      <BottomNav />
    </div>
  );
};

export default function App() {
  useEffect(() => {
    checkTodayDayOff();
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