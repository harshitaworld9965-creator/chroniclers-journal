import { useState } from 'react'

// Shows /art/<name>.png, or the fallback emoji if the picture doesn't exist yet
export default function Art({ name, fallback = '✦', className = '', alt = '' }) {
  const [missing, setMissing] = useState(false)

  if (missing) {
    return (
      <span className={`art art--fallback ${className}`} aria-hidden="true">
        {fallback}
      </span>
    )
  }

  return (
    <img
      className={`art ${className}`}
      src={`/art/${name}.png`}
      alt={alt}
      draggable="false"
      onError={() => setMissing(true)}
    />
  )
}