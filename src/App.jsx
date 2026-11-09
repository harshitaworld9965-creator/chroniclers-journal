import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './styles/ui.css'

import BottomNav from './components/BottomNav'
import QuickAdd from './components/QuickAdd'
import Home from './pages/Home'
import Tasks from './pages/Tasks'
import Journal from './pages/Journal'
import Habits from './pages/Habits'
import Reminders from './pages/Reminders'
import Goals from './pages/Goals'
import Vault from './pages/Vault'
import Stats from './pages/Stats'
import Nightfall from './pages/Nightfall'
import { initNotifications } from './lib/notify'

// Start every page at the top
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  const [quickOpen, setQuickOpen] = useState(false)

  // Sets up Android notifications (does nothing in the browser)
  useEffect(() => {
    initNotifications()
  }, [])

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/habits" element={<Habits />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/vault" element={<Vault />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/night" element={<Nightfall />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <BottomNav onAdd={() => setQuickOpen(true)} />
      <QuickAdd open={quickOpen} onClose={() => setQuickOpen(false)} />
    </>
  )
}