import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { formatDay } from '../lib/dates'
import PageHeader from '../components/PageHeader'
import Tabs from '../components/Tabs'
import Check from '../components/Check'
import Sheet from '../components/Sheet'

export default function Goals() {
  const goals = useLiveQuery(() => db.goals.orderBy('createdAt').reverse().toArray()) ?? []
  const milestones = useLiveQuery(() => db.milestones.orderBy('order').toArray()) ?? []
  const [tab, setTab] = useState('active')
  const [editing, setEditing] = useState(null)

  const shown = goals.filter((g) => (tab === 'active') === (g.status !== 'achieved'))

  return (
    <main className="page">
      <PageHeader title="Goals" subtitle="Longer plots and side quests." art="compass" fallback="🧭" />

      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: 'active', label: 'In progress' },
          { value: 'achieved', label: 'Achieved' },
        ]}
      />

      <button className="btn btn--primary btn--full add-btn" onClick={() => setEditing({})}>
        + New goal
      </button>

      {shown.length === 0 && (
        <p className="empty">
          {tab === 'active' ? 'No quests yet. The map is wide open.' : 'Nothing conquered yet. Soon.'}
        </p>
      )}

      <div className="stack">
        {shown.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            milestones={milestones.filter((m) => m.goalId === g.id)}
            onEdit={() => setEditing(g)}
          />
        ))}
      </div>

      {editing && (
        <GoalSheet key={editing.id ?? 'new'} goal={editing} onClose={() => setEditing(null)} />
      )}
    </main>
  )
}

function GoalCard({ goal, milestones, onEdit }) {
  const [draft, setDraft] = useState('')
  const done = milestones.filter((m) => m.done).length
  const pct = milestones.length ? Math.round((done / milestones.length) * 100) : 0

  async function addMilestone(e) {
    e.preventDefault()
    const title = draft.trim()
    if (!title) return
    await db.milestones.add({ goalId: goal.id, title, done: false, order: Date.now() })
    setDraft('')
  }

  return (
    <article className="card">
      <div className="card__top">
        <button className="row__main" onClick={onEdit}>
          <span className="card__title">{goal.title}</span>
          {goal.why && <span className="card__meta">{goal.why}</span>}
        </button>
        <span className="streak">{pct}%</span>
      </div>

      <div className="progress">
        <div className="progress__bar" style={{ width: `${pct}%` }} />
      </div>
      <p className="card__meta">
        {done} of {milestones.length} milestones
        {goal.targetDate &&
          ` · by ${formatDay(goal.targetDate, { month: 'short', day: 'numeric', year: 'numeric' })}`}
      </p>

      <ul className="milestones">
        {milestones.map((m) => (
          <li key={m.id} className="milestone">
            <Check checked={m.done} onChange={() => db.milestones.update(m.id, { done: !m.done })}>
              {m.title}
            </Check>
            <button className="icon-btn" aria-label={`Delete ${m.title}`} onClick={() => db.milestones.delete(m.id)}>
              ×
            </button>
          </li>
        ))}
      </ul>

      <form className="inline-add" onSubmit={addMilestone}>
        <input
          className="input"
          placeholder="Add a milestone…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="btn btn--ghost" type="submit">Add</button>
      </form>

      {pct === 100 && goal.status !== 'achieved' && (
        <button
          className="btn btn--primary btn--full"
          style={{ marginTop: 12 }}
          onClick={() => db.goals.update(goal.id, { status: 'achieved', achievedAt: Date.now() })}
        >
          Mark as achieved ✦
        </button>
      )}
    </article>
  )
}

function GoalSheet({ goal, onClose }) {
  const isNew = !goal.id
  const [title, setTitle] = useState(goal.title ?? '')
  const [why, setWhy] = useState(goal.why ?? '')
  const [targetDate, setTargetDate] = useState(goal.targetDate ?? '')

  async function save() {
    if (!title.trim()) return
    const data = { title: title.trim(), why: why.trim(), targetDate }
    if (isNew) await db.goals.add({ ...data, createdAt: Date.now(), status: 'active' })
    else await db.goals.update(goal.id, data)
    onClose()
  }

  async function toggleStatus() {
    const achieved = goal.status === 'achieved'
    await db.goals.update(goal.id, {
      status: achieved ? 'active' : 'achieved',
      achievedAt: achieved ? null : Date.now(),
    })
    onClose()
  }

  async function remove() {
    await db.transaction('rw', db.goals, db.milestones, async () => {
      await db.milestones.where('goalId').equals(goal.id).delete()
      await db.goals.delete(goal.id)
    })
    onClose()
  }

  return (
    <Sheet title={isNew ? 'New goal' : 'Edit goal'} onClose={onClose}>
      <label className="field">
        <span>The goal</span>
        <input className="input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>

      <label className="field">
        <span>Why it matters</span>
        <textarea className="input" rows={2} value={why} onChange={(e) => setWhy(e.target.value)} />
      </label>

      <label className="field">
        <span>Target date</span>
        <input className="input" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
      </label>

      <div className="sheet__actions">
        {!isNew && <button className="btn btn--danger" onClick={remove}>Delete</button>}
        {!isNew && (
          <button className="btn btn--ghost" onClick={toggleStatus}>
            {goal.status === 'achieved' ? 'Reopen' : 'Achieved'}
          </button>
        )}
        <button className="btn btn--primary" onClick={save}>Save</button>
      </div>
    </Sheet>
  )
}