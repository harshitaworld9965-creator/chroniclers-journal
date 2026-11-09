import { Routes, Route, Navigate } from 'react-router-dom'

// Temporary stand-in until each real page is built.
// As we finish a page, we'll import it and swap it in here.
function Placeholder({ title }) {
  return (
    <main style={{ padding: 'var(--gutter)' }}>
      <h1>{title}</h1>
      <p className="italic-note">This chapter is yet to be written.</p>
    </main>
  )
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Home dashboard */}
        <Route path="/" element={<Placeholder title="The Chronicler's Journal" />} />

        {/* The six arch cards */}
        <Route path="/tasks" element={<Placeholder title="Tasks" />} />
        <Route path="/journal" element={<Placeholder title="Journal" />} />
        <Route path="/habits" element={<Placeholder title="Habits" />} />
        <Route path="/reminders" element={<Placeholder title="Reminders" />} />
        <Route path="/goals" element={<Placeholder title="Goals" />} />
        <Route path="/vault" element={<Placeholder title="Vault" />} />

        {/* Bottom-nav extras */}
        <Route path="/stats" element={<Placeholder title="Heatmaps" />} />
        <Route path="/night" element={<Placeholder title="Nightfall" />} />

        {/* Any unknown address goes home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* <BottomNav /> will live here, outside <Routes>, so it shows on every page */}
    </>
  )
}