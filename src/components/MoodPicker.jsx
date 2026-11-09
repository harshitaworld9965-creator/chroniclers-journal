import { MOODS } from '../lib/moods'

export default function MoodPicker({ value, onChange }) {
  return (
    <div className="moods" role="radiogroup" aria-label="Mood">
      {MOODS.map((m) => (
        <button
          type="button"
          key={m.id}
          role="radio"
          aria-checked={value === m.id}
          className={`mood${value === m.id ? ' is-on' : ''}`}
          onClick={() => onChange(value === m.id ? '' : m.id)}
        >
          <span className="mood__emoji">{m.emoji}</span>
          {m.label}
        </button>
      ))}
    </div>
  )
}