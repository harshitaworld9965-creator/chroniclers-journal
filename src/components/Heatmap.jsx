import { addDays, keyToDate, todayKey, formatDay } from '../lib/dates'

// counts: { '2026-11-09': 3, ... }
// colorFor (optional): (dayKey, count) => a CSS colour
export default function Heatmap({ counts = {}, weeks = 18, colorFor, label }) {
  const today = todayKey()

  // Start on a Sunday so each column is one week
  const roughStart = addDays(today, -(weeks * 7 - 1))
  const start = addDays(roughStart, -keyToDate(roughStart).getDay())

  const days = []
  for (let k = start; k <= today; k = addDays(k, 1)) days.push(k)

  const max = Math.max(1, ...Object.values(counts))

  return (
    <div className="heatmap" role="img" aria-label={label}>
      {days.map((k) => {
        const c = counts[k] || 0
        const bg = colorFor
          ? colorFor(k, c)
          : c > 0
            ? `rgba(110, 31, 43, ${0.25 + 0.75 * (c / max)})`
            : undefined

        return (
          <span
            key={k}
            className="heatmap__cell"
            style={bg ? { background: bg } : undefined}
            title={`${formatDay(k)}: ${c}`}
          />
        )
      })}
    </div>
  )
}