import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Finance from './pages/Finance'
import Calendar from './pages/Calendar'
import Statement from './pages/Statement'
import BottomNav from './components/BottomNav'
import AddTransaction from './pages/AddTransaction'
import AnnualSummary from './pages/AnnualSummary'
import { checkTodayDayOff } from './services/dayOffNotification'



export default function App() {
  
  useEffect(() => {
    checkTodayDayOff()
  }, [])
  
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}
