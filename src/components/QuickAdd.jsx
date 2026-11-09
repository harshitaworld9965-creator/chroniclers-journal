import { useState } from 'react'
import Sheet from './Sheet'
import Tabs from './Tabs'
import { db } from '../db/db'
import { todayKey } from '../lib/dates'

const KINDS = [
  { value: 'task', label: 'Task', placeholder: 'What needs doing today?' },
  { value: 'thought', label: 'Thought', placeholder: 'What’s on your mind?' },
  { value: 'treasure', label: 'Treasure', placeholder: 'A memory, idea or little discovery…' },
]

export default function QuickAdd({ open, onClose }) {
  const [kind, setKind] = useState('task')
  const [text, setText] = useState('')

  if (!open) return null
  const current = KINDS.find((k) => k.value === kind)

  async function save() {
    const value = text.trim()
    if (!value) return
    const now = Date.now()

    if (kind === 'task') {
      await db.tasks.add({ title: value, notes: '', date: todayKey(), done: false, order: now, createdAt: now })
    } else if (kind === 'thought') {
      await db.journal.add({ text: value, date: todayKey(), createdAt: now, updatedAt: now, mood: '', tags: [] })
    } else {
      await db.vault.add({ type: 'memory', title: value, body: '', url: '', tags: [], favorite: false, createdAt: now })
    }

    setText('')
    onClose()
  }

  return (
    <Sheet title="Quick capture" onClose={onClose}>
      <Tabs value={kind} onChange={setKind} options={KINDS} />
      <label className="field">
        <span>{current.label}</span>
        <textarea
          className="input"
          rows={3}
          autoFocus
          placeholder={current.placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <button className="btn btn--primary btn--full" onClick={save}>
        Seal it
      </button>
    </Sheet>
  )
}