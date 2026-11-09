import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, dateKey } from '../db/db'
import { formatDateTime, timeKey } from '../lib/dates'
import {
  isNative,
  upcomingTimes,
  scheduleReminder,
  cancelReminder,
  ensurePermission,
  getStatus,
  reconcileAll,
  openExactAlarmSettings,
  sendTestNotification,
} from '../lib/notify'
import PageHeader from '../components/PageHeader'
import Sheet from '../components/Sheet'

function repeatLabel(r) {
  if (r.repeat === 'daily') return 'Every day'
  if (r.repeat === 'weekly') {
    return `Every ${new Date(r.dueAt).toLocaleDateString('en-US', { weekday: 'long' })}`
  }
  return 'Once'
}

export default function Reminders() {
  const reminders = useLiveQuery(() => db.reminders.toArray()) ?? []
  const [editing, setEditing] = useState(null)

  const now = Date.now()
  const withNext = reminders.map((r) => ({ ...r, next: upcomingTimes(r, now)[0] }))
  const upcoming = withNext.filter((r) => r.next).sort((a, b) => a.next - b.next)
  const finished = withNext.filter((r) => !r.next)

  return (
    <main className="page">
      <PageHeader title="Reminders" subtitle="So you don’t forget again." art="bell" fallback="🔔" />

      <Diagnostics />

      <button className="btn btn--primary btn--full add-btn" onClick={() => setEditing({})}>
        + New reminder
      </button>

      {upcoming.length === 0 && <p className="empty">Nothing to remember. Or so you think.</p>}

      {upcoming.length > 0 && (
        <ul className="rows">
          {upcoming.map((r) => (
            <li key={r.id} className="row">
              <button className="row__main" onClick={() => setEditing(r)}>
                <span className="row__title">{r.title}</span>
                <span className="row__meta">
                  {formatDateTime(r.next)} · {repeatLabel(r)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {finished.length > 0 && (
        <>
          <h2 className="section-title">Bygones</h2>
          <ul className="rows">
            {finished.map((r) => (
              <li key={r.id} className="row">
                <button className="row__main" onClick={() => setEditing(r)}>
                  <span className="row__title is-done">{r.title}</span>
                  <span className="row__meta">
                    {r.done ? 'Done' : `Rang ${formatDateTime(r.dueAt)}`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {editing && (
        <ReminderSheet key={editing.id ?? 'new'} reminder={editing} onClose={() => setEditing(null)} />
      )}
    </main>
  )
}

function Diagnostics() {
  const [status, setStatus] = useState(null)
  const [testSent, setTestSent] = useState(false)

  const refresh = () => getStatus().then(setStatus)

  useEffect(() => {
    getStatus().then(setStatus)
  }, [])

  if (!status) return null

  if (!status.native) {
    return (
      <p className="notice">
        You’re in the browser. Reminders are saved, but they only ring as real
        notifications in the Android app.
      </p>
    )
  }

  return (
    <section className="card add-btn">
      <h3 className="card__title">Behind the curtain</h3>
      <dl className="diag">
        <dt>Notifications</dt>
        <dd>{status.permission}</dd>
        <dt>Exact alarms</dt>
        <dd>{status.exact}</dd>
        <dt>Queued with Android</dt>
        <dd>{status.pending}</dd>
      </dl>
      <div className="chips">
        <button className="chip" onClick={async () => { await reconcileAll(); refresh() }}>
          Re-sync
        </button>
        <button className="chip" onClick={async () => { await sendTestNotification(60); setTestSent(true); refresh() }}>
          {testSent ? 'Test set for 1 min ✓' : 'Test in 1 minute'}
        </button>
        {status.exact !== 'granted' && status.exact !== 'unknown' && (
          <button className="chip" onClick={openExactAlarmSettings}>Allow exact alarms</button>
        )}
      </div>
    </section>
  )
}

function nextHour() {
  const d = new Date()
  d.setHours(d.getHours() + 1, 0, 0, 0)
  return d
}

function ReminderSheet({ reminder, onClose }) {
  const isNew = !reminder.id
  const start = reminder.dueAt ? new Date(reminder.dueAt) : nextHour()

  const [title, setTitle] = useState(reminder.title ?? '')
  const [note, setNote] = useState(reminder.note ?? '')
  const [date, setDate] = useState(dateKey(start))
  const [time, setTime] = useState(timeKey(start))
  const [repeat, setRepeat] = useState(reminder.repeat ?? 'none')
  const [error, setError] = useState('')

  async function save() {
    if (!title.trim()) return setError('Give it a name first.')
    const dueAt = new Date(`${date}T${time}`).getTime()
    if (repeat === 'none' && dueAt <= Date.now()) {
      return setError('That moment has already passed. Pick a time in the future.')
    }

    const data = { title: title.trim(), note: note.trim(), dueAt, repeat, done: false }
    let id = reminder.id
    if (isNew) id = await db.reminders.add({ ...data, createdAt: Date.now() })
    else await db.reminders.update(id, data)

    await ensurePermission()
    await scheduleReminder({ ...data, id }, { keepSnooze: false })
    onClose()
  }

  async function remove() {
    await cancelReminder(reminder.id)
    await db.reminders.delete(reminder.id)
    onClose()
  }

  const chip = (on) => `chip${on ? ' is-on' : ''}`

  return (
    <Sheet title={isNew ? 'New reminder' : 'Edit reminder'} onClose={onClose}>
      {error && <p className="form-error">{error}</p>}

      <label className="field">
        <span>Remind me to…</span>
        <input className="input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>

      <label className="field">
        <span>Note</span>
        <input className="input" placeholder="Optional" value={note} onChange={(e) => setNote(e.target.value)} />
      </label>

      <div className="field">
        <span>{repeat === 'none' ? 'When' : 'Starting'}</span>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>

      <div className="field">
        <span>Repeat</span>
        <div className="chips">
          <button type="button" className={chip(repeat === 'none')} onClick={() => setRepeat('none')}>Once</button>
          <button type="button" className={chip(repeat === 'daily')} onClick={() => setRepeat('daily')}>Daily</button>
          <button type="button" className={chip(repeat === 'weekly')} onClick={() => setRepeat('weekly')}>Weekly</button>
        </div>
      </div>

      {!isNative && (
        <p className="summary-line">Saved here now; it will ring once you’re in the Android app.</p>
      )}

      <div className="sheet__actions">
        {!isNew && <button className="btn btn--danger" onClick={remove}>Delete</button>}
        <button className="btn btn--primary" onClick={save}>Save</button>
      </div>
    </Sheet>
  )
}