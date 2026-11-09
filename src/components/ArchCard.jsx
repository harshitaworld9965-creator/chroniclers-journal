import { Link } from 'react-router-dom'
import Art from './Art'

export default function ArchCard({ to, title, subtitle, art, fallback }) {
  return (
    <Link to={to} className="arch-card">
      <Art name={art} fallback={fallback} className="arch-card__art" />
      <h3 className="arch-card__title">{title}</h3>
      <p className="arch-card__subtitle">{subtitle}</p>
    </Link>
  )
}