import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { todayKey, addDays, formatDay } from '../lib/dates'
import PageHeader from '../components/PageHeader'
import Tabs from '../components/Tabs'
import Check from '../components/Check'
import Sheet from '../components/Sheet'

export default function Tasks() {
  const today = todayKey()
  const all = useLiveQuery(() => db.tasks.orderBy('order').toArray()) ?? []
  const [tab, setTab] = useState('today')
  const [editing, setEditing] = useState(null)

  const lists = {
    today: all.filter((t) => t.date && t.date <= today && (!t.done || t.date === today)),
    upcoming: all
      .filter((t) => t.date > today && !t.done)
      .sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order),
    someday: all.filter((t) => !t.date && !t.done),
    done: all
      .filter((t) => t.done)
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0)),
  }
  const list = lists[tab]
  const canMove = tab === 'today' || tab === 'someday'

  const toggle = (t) =>
    db.tasks.update(t.id, { done: !t.done, completedAt: t.done ? null : Date.now() })

  async function move(task, dir) {
    const i = list.findIndex((t) => t.id === task.id)
    const other = list[i + dir]
    if (!other) return
    await db.transaction('rw', db.tasks, async () => {
      await db.tasks.update(task.id, { order: other.order })
      await db.tasks.update(other.id, { order: task.order })
    })
  }

  function metaFor(t) {
    if (tab === 'today' && t.date < today) return { text: `From ${formatDay(t.date)}`, warn: true }
    if (tab === 'upcoming') return { text: formatDay(t.date) }
    if (tab === 'done' && t.completedAt) return { text: `Done ${formatDay(todayKeyFrom(t.completedAt))}` }
    return t.notes ? { text: t.notes } : null
  }

  return (
    <main className="page">
      <PageHeader title="Tasks" subtitle="The pending chaos." art="pug" fallback="🐶" />

      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: 'today', label: 'Today', count: lists.today.filter((t) => !t.done).length },
          { value: 'upcoming', label: 'Soon', count: lists.upcoming.length },
          { value: 'someday', label: 'Someday', count: lists.someday.length },
          { value: 'done', label: 'Done' },
        ]}
      />

      <button className="btn btn--primary btn--full add-btn" onClick={() => setEditing({})}>
        + New task
      </button>

      {list.length === 0 ? (
        <p className="empty">Nothing here. Enjoy it while it lasts.</p>
      ) : (
        <ul className="rows">
          {list.map((t, i) => {
            const meta = metaFor(t)
            return (
              <li key={t.id} className="row">
                <Check checked={t.done} onChange={() => toggle(t)} label={`Complete ${t.title}`} />
                <button className="row__main" onClick={() => setEditing(t)}>
                  <span className={`row__title${t.done ? ' is-done' : ''}`}>{t.title}</span>
                  {meta && (
                    <span className={`row__meta${meta.warn ? ' row__meta--warn' : ''}`}>
                      {meta.text}
                    </span>
                  )}
                </button>
                {canMove && (
                  <div className="row__actions">
                    <button className="icon-btn" aria-label="Move up" disabled={i === 0} onClick={() => move(t, -1)}>↑</button>
                    <button className="icon-btn" aria-label="Move down" disabled={i === list.length - 1} onClick={() => move(t, 1)}>↓</button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {editing && (
        <TaskSheet key={editing.id ?? 'new'} task={editing} onClose={() => setEditing(null)} />
      )}
    </main>
  )
}

function todayKeyFrom(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function TaskSheet({ task, onClose }) {
  const today = todayKey()
  const tomorrow = addDays(today, 1)
  const isNew = !task.id

  const [title, setTitle] = useState(task.title ?? '')
  const [notes, setNotes] = useState(task.notes ?? '')
  const [date, setDate] = useState(task.date ?? today)

  async function save() {
    if (!title.trim()) return
    const data = { title: title.trim(), notes: notes.trim(), date }
    if (isNew) {
      await db.tasks.add({ ...data, done: false, order: Date.now(), createdAt: Date.now() })
    } else {
      await db.tasks.update(task.id, data)
    }
    onClose()
  }

  async function remove() {
    await db.tasks.delete(task.id)
    onClose()
  }

  const chip = (on) => `chip${on ? ' is-on' : ''}`

  return (
    <Sheet title={isNew ? 'New task' : 'Edit task'} onClose={onClose}>
      <label className="field">
        <span>Task</span>
        <input className="input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>

      <label className="field">
        <span>Notes</span>
        <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      <div className="field">
        <span>When</span>
        <div className="chips">
          <button type="button" className={chip(date === today)} onClick={() => setDate(today)}>Today</button>
          <button type="button" className={chip(date === tomorrow)} onClick={() => setDate(tomorrow)}>Tomorrow</button>
          <button type="button" className={chip(date === '')} onClick={() => setDate('')}>Someday</button>
        </div>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="sheet__actions">
        {!isNew && <button className="btn btn--danger" onClick={remove}>Delete</button>}
        <button className="btn btn--primary" onClick={save}>Save</button>
      </div>
    </Sheet>
  )
}