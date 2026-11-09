import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { todayKey, formatDay } from '../lib/dates'
import TornPaper from '../components/TornPaper'
import ArchCard from '../components/ArchCard'
import Art from '../components/Art'
import Check from '../components/Check'

const SECTIONS = [
  { to: '/tasks', title: 'Tasks', subtitle: 'The pending chaos.', art: 'pug', fallback: '🐶' },
  { to: '/journal', title: 'Journal', subtitle: 'Thoughts, feelings & 3 AM ideas.', art: 'inkwell', fallback: '🪶' },
  { to: '/habits', title: 'Habits', subtitle: 'Routines, fitness & certain delusions.', art: 'dumbbells', fallback: '🏋️' },
  { to: '/reminders', title: 'Reminders', subtitle: 'So you don’t forget again.', art: 'bell', fallback: '🔔' },
  { to: '/goals', title: 'Goals', subtitle: 'Longer plots and side quests.', art: 'compass', fallback: '🧭' },
  { to: '/vault', title: 'Vault', subtitle: 'Ideas, links, references & other treasures.', art: 'chest', fallback: '🗝️' },
]

export default function Home() {
  const today = todayKey()
  const tasks =
    useLiveQuery(() => db.tasks.where('date').equals(today).sortBy('order'), [today]) ?? []
  const shown = tasks.slice(0, 5)

  const toggle = (t) =>
    db.tasks.update(t.id, { done: !t.done, completedAt: t.done ? null : Date.now() })

  return (
    <main className="home">
      <section className="hero">
        <Art name="ivy" fallback="" className="hero__ivy" />
        <div className="hero__text">
          <h1 className="hero__title">
            The Chronicler’s Journal <span className="hero__star">✦</span>
          </h1>
          <p className="hero__tagline">A living record of an unusually eventful life.</p>
          <span className="hero__rule" />
        </div>
        <Art name="hero-cat" fallback="🐈‍⬛" className="hero__art" />
      </section>

      <TornPaper seed={9} className="today-card">
        <div className="today">
          <div className="today__date">
            <h2 className="today__title">Today</h2>
            <p>{formatDay(today)}</p>
          </div>

          <ul className="today__list">
            {shown.length === 0 && (
              <li className="italic-note">Nothing yet. Suspiciously calm.</li>
            )}
            {shown.map((t) => (
              <li key={t.id}>
                <Check checked={t.done} onChange={() => toggle(t)}>
                  {t.title}
                </Check>
              </li>
            ))}
            {tasks.length > 5 && (
              <li>
                <Link to="/tasks" className="more-link">+{tasks.length - 5} more</Link>
              </li>
            )}
          </ul>

          <Art name="moon-face" fallback="" className="today__moon" />
        </div>
      </TornPaper>

      <section className="arch-grid">
        {SECTIONS.map((s) => (
          <ArchCard key={s.to} {...s} />
        ))}
      </section>

      <div className="home__collage" aria-hidden="true">
        <Art name="moon-globe" fallback="" className="collage__moon" />
        <Art name="polaroid" fallback="" className="collage__polaroid" />
        <Art name="berry-branch" fallback="" className="collage__branch" />
      </div>
    </main>
  )
}