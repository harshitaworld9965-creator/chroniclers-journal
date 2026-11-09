import { useMemo } from 'react'
import './TornPaper.css'

// A "random" number generator that always gives the same numbers
// for the same seed, so the torn edge doesn't change on every render.
function seededRandom(seed) {
  return function () {
    const x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
  }
}

// Builds a clip-path polygon with jagged top and bottom edges
function makeTornEdge(seed, teeth = 36, depth = 7) {
  const rand = seededRandom(seed)
  const top = []
  const bottom = []

  for (let i = 0; i <= teeth; i++) {
    const x = (i / teeth) * 100
    top.push(`${x}% ${(rand() * depth).toFixed(1)}px`)
    bottom.push(`${x}% calc(100% - ${(rand() * depth).toFixed(1)}px)`)
  }

  // go along the top left→right, then the bottom right→left
  return `polygon(${[...top, ...bottom.reverse()].join(', ')})`
}

export default function TornPaper({
  children,
  seed = 1,
  tape = 'left', // 'left' | 'right' | 'none'
  className = '',
}) {
  const paperEdge = useMemo(() => makeTornEdge(seed), [seed])
  const fiberEdge = useMemo(() => makeTornEdge(seed + 50, 60, 9), [seed])

  return (
    <div className={`torn ${className}`}>
      {tape !== 'none' && (
        <span className={`torn__tape torn__tape--${tape}`} aria-hidden="true" />
      )}

      <div className="torn__fiber" style={{ clipPath: fiberEdge }} aria-hidden="true" />

      <div className="torn__paper" style={{ clipPath: paperEdge }}>
        {children}
      </div>
    </div>
  )
}