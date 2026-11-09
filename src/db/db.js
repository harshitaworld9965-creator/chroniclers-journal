import Dexie from 'dexie'

/* ============================================
   THE DATABASE
   Everything lives on your phone in IndexedDB.
   ============================================ */
export const db = new Dexie('chroniclers-journal')

db.version(1).stores({
  // { id, title, notes, date, done, order, createdAt, completedAt }
  tasks: '++id, date, createdAt, order',

  // { id, text, date, createdAt, updatedAt, mood, tags: [] }
  journal: '++id, date, createdAt, *tags',

  // { id, name, emoji, days: [0-6], createdAt, archived }
  habits: '++id, createdAt',

  // { id, habitId, date }  ← one row = "done on this day"
  habitLogs: '++id, &[habitId+date], habitId, date',

  // { id, title, dueAt, repeat, done, notified }
  reminders: '++id, dueAt',

  // { id, title, why, targetDate, createdAt, status }
  goals: '++id, createdAt, targetDate',

  // { id, goalId, title, done, order }
  milestones: '++id, goalId, order',

  // { id, type, title, body, url, tags: [], favorite, createdAt }
  vault: '++id, type, createdAt, *tags',

  // { date, mood, note }  ← one row per day, for Nightfall + heatmaps
  days: '&date',
})

/* ============================================
   HELPERS
   ============================================ */

// Today's date as "2026-11-09" in YOUR timezone
export function dateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Ask the browser not to delete our data when space runs low
if (navigator.storage?.persist) {
  navigator.storage.persist()
}

// Lets you poke at the database from the browser console while developing
if (import.meta.env.DEV) {
  window.db = db
}