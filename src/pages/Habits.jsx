import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { todayKey, lastNDays, keyToDate, formatDay, streak, ALL_DAYS } from '../lib/dates'
import PageHeader from '../components/PageHeader'
import Heatmap from '../components/Heatmap'
import Sheet from '../components/Sheet'

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function Habits() {
  const today = todayKey()
  const habits = useLiveQuery(() => db.habits.orderBy('createdAt').toArray()) ?? []
  const logs = useLiveQuery(() => db.habitLogs.toArray()) ?? []
  const [editing, setEditing] = useState(null)

  const active = habits.filter((h) => !h.archived)
  const week = lastNDays(7)

  const datesByHabit = useMemo(() => {
    const map = new Map()
    for (const l of logs) {
      if (!map.has(l.habitId)) map.set(l.habitId, [])
      map.get(l.habitId).push(l.date)
    }
    return map
  }, [logs])

  const weekday = new Date().getDay()
  const dueToday = active.filter((h) => (h.days ?? ALL_DAYS).includes(weekday))
  const doneToday = dueToday.filter((h) => datesByHabit.get(h.id)?.includes(today)).length

  async function toggle(habitId, date) {
    const existing = await db.habitLogs.where({ habitId, date }).first()
    if (existing) await db.habitLogs.delete(existing.id)
    else await db.habitLogs.add({ habitId, date })
  }

  return (
    <main className="page">
      <PageHeader title="Habits" subtitle="Routines, fitness & certain delusions." art="dumbbells" fallback="🏋️" />

      {dueToday.length > 0 && (
        <p className="summary-line">Today: {doneToday} of {dueToday.length} rituals kept.</p>
      )}

      <button className="btn btn--primary btn--full add-btn" onClick={() => setEditing({})}>
        + New habit
      </button>

      {active.length === 0 && <p className="empty">No habits yet. Start small. Suspiciously small.</p>}

      <div className="stack">
        {active.map((h) => {
          const days = h.days ?? ALL_DAYS
          const dates = datesByHabit.get(h.id) ?? []
          const s = streak(dates, days)
          const counts = Object.fromEntries(dates.map((d) => [d, 1]))

          return (
            <article key={h.id} className="card">
              <button className="row__main" onClick={() => setEditing(h)}>
                <span className="card__title">
                  <span className="habit-emoji">{h.emoji || '✦'}</span> {h.name}
                </span>
                <span className="streak">
                  {s > 0 ? `${s}-day streak` : 'No streak yet. Today’s a fine day.'}
                </span>
              </button>

              <div className="week-strip">
                {week.map((k) => {
                  const wd = keyToDate(k).getDay()
                  const done = dates.includes(k)
                  const rest = !days.includes(wd)
                  const cls = ['day-dot', done && 'is-done', rest && !done && 'is-rest', k === today && 'is-today']
                    .filter(Boolean)
                    .join(' ')
                  return (
                    <button
                      key={k}
                      className={cls}
                      aria-pressed={done}
                      aria-label={`${formatDay(k)}${done ? ', done' : ''}`}
                      onClick={() => toggle(h.id, k)}
                    >
                      <span className="day-dot__ring">{done ? '✓' : ''}</span>
                      {LETTERS[wd]}
                    </button>
                  )
                })}
              </div>

              <Heatmap counts={counts} weeks={12} label={`${h.name} history`} />
            </article>
          )
        })}
      </div>

      {editing && (
        <HabitSheet key={editing.id ?? 'new'} habit={editing} onClose={() => setEditing(null)} />
      )}
    </main>
  )
}

function HabitSheet({ habit, onClose }) {
  const isNew = !habit.id
  const [name, setName] = useState(habit.name ?? '')
  const [emoji, setEmoji] = useState(habit.emoji ?? '')
  const [days, setDays] = useState(habit.days ?? ALL_DAYS)

  const toggleDay = (d) =>
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()))

  async function save() {
    if (!name.trim() || days.length === 0) return
    const data = { name: name.trim(), emoji: emoji.trim(), days }
    if (isNew) await db.habits.add({ ...data, createdAt: Date.now(), archived: false })
    else await db.habits.update(habit.id, data)
    onClose()
  }

  async function archive() {
    await db.habits.update(habit.id, { archived: true })
    onClose()
  }

  async function remove() {
    await db.transaction('rw', db.habits, db.habitLogs, async () => {
      await db.habitLogs.where('habitId').equals(habit.id).delete()
      await db.habits.delete(habit.id)
    })
    onClose()
  }

  return (
    <Sheet title={isNew ? 'New habit' : 'Edit habit'} onClose={onClose}>
      <label className="field">
        <span>Habit</span>
        <input className="input" autoFocus placeholder="Gym, read 20 min…" value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      <label className="field">
        <span>Emoji</span>
        <input className="input" placeholder="🏋️" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
      </label>

      <div className="field">
        <span>Which days?</span>
        <div className="chips">
          {LETTERS.map((l, d) => (
            <button
              key={d}
              type="button"
              className={`chip${days.includes(d) ? ' is-on' : ''}`}
              onClick={() => toggleDay(d)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="sheet__actions">
        {!isNew && <button className="btn btn--danger" onClick={remove}>Delete</button>}
        {!isNew && <button className="btn btn--ghost" onClick={archive}>Retire</button>}
        <button className="btn btn--primary" onClick={save}>Save</button>
      </div>
    </Sheet>
  )
}