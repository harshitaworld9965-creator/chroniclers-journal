import { dateKey } from '../db/db'

export const todayKey = () => dateKey()

// "2026-11-09" → Date (local time)
export function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key, n) {
  const d = keyToDate(key)
  d.setDate(d.getDate() + n)
  return dateKey(d)
}

export function formatDay(
  key,
  options = { weekday: 'short', month: 'short', day: 'numeric' }
) {
  return keyToDate(key).toLocaleDateString('en-US', options)
}

export function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDateTime(ts) {
  return new Date(ts).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// "14:05" from a Date
export function timeKey(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// The last n day keys, oldest first, ending today
export function lastNDays(n, end = todayKey()) {
  const days = []
  for (let i = n - 1; i >= 0; i--) days.push(addDays(end, -i))
  return days
}

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

// Consecutive completed scheduled days, counting back from today.
// If today isn't done yet, it doesn't break the streak.
export function streak(doneKeys, days = ALL_DAYS) {
  const done = new Set(doneKeys)
  let count = 0
  let day = todayKey()

  for (let i = 0; i < 400; i++, day = addDays(day, -1)) {
    const scheduled = days.includes(keyToDate(day).getDay())
    if (!scheduled) continue
    if (done.has(day)) count++
    else if (i > 0) break
  }
  return count
}