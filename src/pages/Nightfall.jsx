import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, dateKey } from '../db/db'
import { todayKey, addDays, lastNDays, keyToDate, ALL_DAYS } from '../lib/dates'
import { moodById } from '../lib/moods'
import PageHeader from '../components/PageHeader'
import MoodPicker from '../components/MoodPicker'

export default function Nightfall() {
  const today = todayKey()
  const day = useLiveQuery(() => db.days.get(today), [today])
  const allDays = useLiveQuery(() => db.days.toArray()) ?? []
  const tasks = useLiveQuery(() => db.tasks.where('date').equals(today).toArray(), [today]) ?? []
  const habits = useLiveQuery(() => db.habits.toArray()) ?? []
  const logsToday = useLiveQuery(() => db.habitLogs.where('date').equals(today).toArray(), [today]) ?? []
  const journal = useLiveQuery(() => db.journal.toArray()) ?? []
  const vault = useLiveQuery(() => db.vault.toArray()) ?? []

  const [draft, setDraft] = useState(null)
  const note = draft ?? day?.note ?? ''

  const setMood = (mood) => db.days.put({ ...day, date: today, mood })
  const saveNote = () => {
    if (draft !== null) db.days.put({ ...day, date: today, note: draft })
  }

  // Today's tally
  const weekday = new Date().getDay()
  const dueHabits = habits.filter((h) => !h.archived && (h.days ?? ALL_DAYS).includes(weekday))
  const tasksDone = tasks.filter((t) => t.done).length
  const entriesToday = journal.filter((e) => e.date === today).length

  // The mosaic: last 28 days, coloured by mood
  const moodByDay = Object.fromEntries(allDays.map((d) => [d.date, d.mood]))
  const mosaic = lastNDays(28)

  // On this day
  const monthDay = today.slice(5)
  function whenLabel(date) {
    if (date === addDays(today, -7)) return 'A week ago'
    if (date === addDays(today, -30)) return 'A month ago'
    if (date < today && date.slice(5) === monthDay) return `On this day, ${date.slice(0, 4)}`
    return null
  }

  const memories = [
    ...journal.map((e) => ({ id: `j${e.id}`, kind: 'Journal', date: e.date, text: e.text })),
    ...vault.map((v) => ({
      id: `v${v.id}`,
      kind: 'Vault',
      date: dateKey(new Date(v.createdAt)),
      text: v.body ? `${v.title} — ${v.body}` : v.title,
    })),
  ]
    .map((m) => ({ ...m, when: whenLabel(m.date) }))
    .filter((m) => m.when)
    .slice(0, 5)

  return (
    <main className="page">
      <PageHeader title="Nightfall" subtitle="Close the book on today." art="moon-face" fallback="🌙" />

      <h2 className="section-title">Inner weather</h2>
      <MoodPicker value={day?.mood ?? ''} onChange={setMood} />

      <h2 className="section-title">Today in one line</h2>
      <textarea
        className="input"
        rows={2}
        placeholder="Survived. Mostly thrived."
        value={note}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={saveNote}
      />

      <h2 className="section-title">The tally</h2>
      <div className="card tally">
        <div>
          <div className="tally__num">{tasksDone}/{tasks.length}</div>
          <div className="tally__label">tasks done</div>
        </div>
        <div>
          <div className="tally__num">{logsToday.length}/{dueHabits.length}</div>
          <div className="tally__label">habits kept</div>
        </div>
        <div>
          <div className="tally__num">{entriesToday}</div>
          <div className="tally__label">pages written</div>
        </div>
      </div>

      <h2 className="section-title">The mosaic</h2>
      <div className="mosaic">
        {mosaic.map((k) => {
          const mood = moodById[moodByDay[k]]
          return (
            <span
              key={k}
              className={`mosaic__tile${mood ? ' has-mood' : ''}${k === today ? ' is-today' : ''}`}
              style={mood ? { background: mood.color } : undefined}
              title={mood ? mood.label : 'No weather recorded'}
            >
              {keyToDate(k).getDate()}
            </span>
          )
        })}
      </div>

      <h2 className="section-title">From the archives</h2>
      {memories.length === 0 ? (
        <p className="empty">Nothing from the archives yet. The past is still being written.</p>
      ) : (
        <div className="stack">
          {memories.map((m) => (
            <article key={m.id} className="card">
              <p className="card__meta">{m.when} · {m.kind}</p>
              <p className="card__body entry__text">{m.text}</p>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}