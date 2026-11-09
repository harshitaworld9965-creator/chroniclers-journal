import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, dateKey } from '../db/db'
import { formatDay } from '../lib/dates'
import PageHeader from '../components/PageHeader'
import Sheet from '../components/Sheet'

const TYPES = [
  { id: 'memory', label: 'Memory', emoji: '🌙' },
  { id: 'idea', label: 'Idea', emoji: '💡' },
  { id: 'link', label: 'Link', emoji: '🔗' },
  { id: 'discovery', label: 'Discovery', emoji: '🔍' },
]
const typeById = Object.fromEntries(TYPES.map((t) => [t.id, t]))

function prettyUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default function Vault() {
  const items = useLiveQuery(() => db.vault.orderBy('createdAt').reverse().toArray()) ?? []
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)

  const q = query.trim().toLowerCase()
  const shown = items.filter((it) => {
    if (filter === 'fav' && !it.favorite) return false
    if (filter !== 'all' && filter !== 'fav' && it.type !== filter) return false
    if (!q) return true
    return [it.title, it.body, it.url, ...(it.tags ?? [])].some((s) => s?.toLowerCase().includes(q))
  })

  const chip = (on) => `chip${on ? ' is-on' : ''}`

  return (
    <main className="page">
      <PageHeader title="Vault" subtitle="Ideas, links, references & other treasures." art="chest" fallback="🗝️" />

      <button className="btn btn--primary btn--full add-btn" onClick={() => setEditing({})}>
        + Keep something
      </button>

      <input
        className="input search"
        type="search"
        placeholder="Search the vault…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="chips add-btn">
        <button className={chip(filter === 'all')} onClick={() => setFilter('all')}>All</button>
        {TYPES.map((t) => (
          <button key={t.id} className={chip(filter === t.id)} onClick={() => setFilter(t.id)}>
            {t.emoji} {t.label}
          </button>
        ))}
        <button className={chip(filter === 'fav')} onClick={() => setFilter('fav')}>★ Favourites</button>
      </div>

      {shown.length === 0 && <p className="empty">The chest is empty. For now.</p>}

      <div className="stack">
        {shown.map((it) => {
          const type = typeById[it.type] ?? TYPES[0]
          return (
            <article key={it.id} className="card">
              <div className="card__top">
                <span className="card__meta">
                  {type.emoji} {type.label} ·{' '}
                  {formatDay(dateKey(new Date(it.createdAt)), { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <button
                  className={`icon-btn star${it.favorite ? ' is-on' : ''}`}
                  aria-pressed={!!it.favorite}
                  aria-label="Favourite"
                  onClick={() => db.vault.update(it.id, { favorite: !it.favorite })}
                >
                  {it.favorite ? '★' : '☆'}
                </button>
              </div>

              <button className="row__main vault__open" onClick={() => setEditing(it)}>
                <span className="card__title">{it.title}</span>
                {it.body && <span className="card__body entry__text">{it.body}</span>}
              </button>

              {it.url && (
                <a className="vault__link" href={it.url} target="_blank" rel="noreferrer">
                  {prettyUrl(it.url)} ↗
                </a>
              )}

              {it.tags?.length > 0 && (
                <div className="chips entry__tags">
                  {it.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
                </div>
              )}
            </article>
          )
        })}
      </div>

      {editing && (
        <VaultSheet key={editing.id ?? 'new'} item={editing} onClose={() => setEditing(null)} />
      )}
    </main>
  )
}

function VaultSheet({ item, onClose }) {
  const isNew = !item.id
  const [type, setType] = useState(item.type ?? 'memory')
  const [title, setTitle] = useState(item.title ?? '')
  const [body, setBody] = useState(item.body ?? '')
  const [url, setUrl] = useState(item.url ?? '')
  const [tags, setTags] = useState((item.tags ?? []).join(', '))
  const [favorite, setFavorite] = useState(!!item.favorite)

  async function save() {
    if (!title.trim()) return
    let cleanUrl = url.trim()
    if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) cleanUrl = `https://${cleanUrl}`

    const data = {
      type,
      title: title.trim(),
      body: body.trim(),
      url: cleanUrl,
      favorite,
      tags: tags
        .split(',')
        .map((t) => t.trim().replace(/^#/, '').toLowerCase())
        .filter(Boolean),
    }
    if (isNew) await db.vault.add({ ...data, createdAt: Date.now() })
    else await db.vault.update(item.id, data)
    onClose()
  }

  async function remove() {
    await db.vault.delete(item.id)
    onClose()
  }

  return (
    <Sheet title={isNew ? 'Into the vault' : 'Edit treasure'} onClose={onClose}>
      <div className="field">
        <span>Kind</span>
        <div className="chips">
          {TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`chip${type === t.id ? ' is-on' : ''}`}
              onClick={() => setType(t.id)}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span>Title</span>
        <input className="input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>

      <label className="field">
        <span>Details</span>
        <textarea className="input" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
      </label>

      <label className="field">
        <span>Link</span>
        <input className="input" type="url" placeholder="Optional" value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>

      <label className="field">
        <span>Tags</span>
        <input className="input" placeholder="books, design" value={tags} onChange={(e) => setTags(e.target.value)} />
      </label>

      <button
        type="button"
        className={`chip${favorite ? ' is-on' : ''}`}
        style={{ marginBottom: 14 }}
        onClick={() => setFavorite((f) => !f)}
      >
        {favorite ? '★ Favourite' : '☆ Mark as favourite'}
      </button>

      <div className="sheet__actions">
        {!isNew && <button className="btn btn--danger" onClick={remove}>Delete</button>}
        <button className="btn btn--primary" onClick={save}>Save</button>
      </div>
    </Sheet>
  )
}