import { useLiveQuery } from 'dexie-react-hooks'
import { db, dateKey } from '../db/db'
import { MOODS, moodById } from '../lib/moods'
import PageHeader from '../components/PageHeader'
import Heatmap from '../components/Heatmap'

const WEEKS = 18

function countBy(keys) {
  const out = {}
  for (const k of keys) out[k] = (out[k] || 0) + 1
  return out
}

const total = (obj) => Object.values(obj).reduce((a, b) => a + b, 0)

function Block({ title, line, children }) {
  return (
    <section>
      <h2 className="section-title">{title}</h2>
      <div className="card">
        {children}
        <div className="heatmap-legend">
          <span>{WEEKS} weeks ago</span>
          <span>Today</span>
        </div>
        {line && <p className="card__meta" style={{ marginTop: 8 }}>{line}</p>}
      </div>
    </section>
  )
}

export default function Stats() {
  const tasks = useLiveQuery(() => db.tasks.toArray()) ?? []
  const journal = useLiveQuery(() => db.journal.toArray()) ?? []
  const logs = useLiveQuery(() => db.habitLogs.toArray()) ?? []
  const days = useLiveQuery(() => db.days.toArray()) ?? []

  const taskCounts = countBy(
    tasks.filter((t) => t.done && t.completedAt).map((t) => dateKey(new Date(t.completedAt)))
  )
  const journalCounts = countBy(journal.map((e) => e.date))
  const habitCounts = countBy(logs.map((l) => l.date))
  const moodByDay = Object.fromEntries(days.filter((d) => d.mood).map((d) => [d.date, d.mood]))

  return (
    <main className="page">
      <PageHeader title="Heatmaps" subtitle="Proof that things happened." />

      <Block title="Tasks finished" line={`${total(taskCounts)} tasks conquered so far.`}>
        <Heatmap counts={taskCounts} weeks={WEEKS} label="Tasks finished per day" />
      </Block>

      <Block title="Habits kept" line={`${total(habitCounts)} rituals kept so far.`}>
        <Heatmap counts={habitCounts} weeks={WEEKS} label="Habits kept per day" />
      </Block>

      <Block title="Pages written" line={`${total(journalCounts)} journal pages so far.`}>
        <Heatmap counts={journalCounts} weeks={WEEKS} label="Journal entries per day" />
      </Block>

      <Block title="Inner weather">
        <Heatmap
          weeks={WEEKS}
          label="Mood per day"
          colorFor={(k) => moodById[moodByDay[k]]?.color}
        />
        <div className="chips" style={{ marginTop: 10 }}>
          {MOODS.map((m) => (
            <span key={m.id} className="card__meta">
              <span style={{ color: m.color }}>●</span> {m.emoji} {m.label}
            </span>
          ))}
        </div>
      </Block>
    </main>
  )
}