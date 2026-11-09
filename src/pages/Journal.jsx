import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { todayKey, formatDay, formatTime, formatDateTime } from '../lib/dates'
import { moodById } from '../lib/moods'
import PageHeader from '../components/PageHeader'
import Sheet from '../components/Sheet'
import MoodPicker from '../components/MoodPicker'

const LONG = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }

export default function Journal() {
  const entries = useLiveQuery(() => db.journal.orderBy('createdAt').reverse().toArray()) ?? []
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)

  const q = query.trim().toLowerCase()
  const shown = q
    ? entries.filter(
        (e) =>
          e.text.toLowerCase().includes(q) ||
          e.tags?.some((t) => t.includes(q)) ||
          formatDay(e.date, LONG).toLowerCase().includes(q)
      )
    : entries

  // Group entries by day
  const groups = []
  for (const e of shown) {
    const last = groups[groups.length - 1]
    if (last && last.date === e.date) last.items.push(e)
    else groups.push({ date: e.date, items: [e] })
  }

  return (
    <main className="page">
      <PageHeader title="Journal" subtitle="Thoughts, feelings & 3 AM ideas." art="inkwell" fallback="🪶" />

      <button className="btn btn--primary btn--full add-btn" onClick={() => setEditing({})}>
        + Write something
      </button>

      <input
        className="input search"
        type="search"
        placeholder="Search words, #tags or dates…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {groups.length === 0 && (
        <p className="empty">{q ? 'No pages match that.' : 'The first page is always the hardest.'}</p>
      )}

      {groups.map((g) => (
        <section key={g.date}>
          <h2 className="section-title">{formatDay(g.date, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
          <div className="stack">
            {g.items.map((e) => {
              const mood = moodById[e.mood]
              return (
                <button key={e.id} className="card entry" onClick={() => setEditing(e)}>
                  <span className="entry__head">
                    <span className="card__meta">
                      {formatTime(e.createdAt)}
                      {e.updatedAt - e.createdAt > 60_000 && ' · edited'}
                    </span>
                    {mood && <span className="entry__mood" title={mood.label}>{mood.emoji}</span>}
                  </span>
                  <span className="card__body entry__text">{e.text}</span>
                  {e.tags?.length > 0 && (
                    <span className="chips entry__tags">
                      {e.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </section>
      ))}

      {editing && (
        <EntrySheet key={editing.id ?? 'new'} entry={editing} onClose={() => setEditing(null)} />
      )}
    </main>
  )
}

function EntrySheet({ entry, onClose }) {
  const isNew = !entry.id
  const [text, setText] = useState(entry.text ?? '')
  const [mood, setMood] = useState(entry.mood ?? '')
  const [tags, setTags] = useState((entry.tags ?? []).join(', '))

  async function save() {
    if (!text.trim()) return
    const now = Date.now()
    const data = {
      text: text.trim(),
      mood,
      tags: tags
        .split(',')
        .map((t) => t.trim().replace(/^#/, '').toLowerCase())
        .filter(Boolean),
      updatedAt: now,
    }
    if (isNew) await db.journal.add({ ...data, date: todayKey(), createdAt: now })
    else await db.journal.update(entry.id, data)
    onClose()
  }

  async function remove() {
    await db.journal.delete(entry.id)
    onClose()
  }

  return (
    <Sheet title={isNew ? 'A new page' : 'Edit page'} onClose={onClose}>
      {!isNew && <p className="summary-line">Written {formatDateTime(entry.createdAt)}</p>}

      <label className="field">
        <span>Dear diary…</span>
        <textarea className="input" rows={8} autoFocus value={text} onChange={(e) => setText(e.target.value)} />
      </label>

      <div className="field">
        <span>Weather inside</span>
        <MoodPicker value={mood} onChange={setMood} />
      </div>

      <label className="field">
        <span>Tags</span>
        <input className="input" placeholder="work, dreams, cat" value={tags} onChange={(e) => setTags(e.target.value)} />
      </label>

      <div className="sheet__actions">
        {!isNew && <button className="btn btn--danger" onClick={remove}>Delete</button>}
        <button className="btn btn--primary" onClick={save}>Save</button>
      </div>
    </Sheet>
  )
}