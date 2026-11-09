import { Link } from 'react-router-dom'
import Art from './Art'

export default function PageHeader({ title, subtitle, art, fallback }) {
  return (
    <header className="page-header">
      <Link to="/" className="back-link">← Home</Link>
      <div className="page-header__row">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="italic-note">{subtitle}</p>}
        </div>
        {art && <Art name={art} fallback={fallback} className="page-header__art" />}
      </div>
    </header>
  )
}