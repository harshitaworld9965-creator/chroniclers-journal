export default function Check({ checked, onChange, children, label }) {
  return (
    <label className="check">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={onChange}
        aria-label={children ? undefined : label}
      />
      <span className="check__box" aria-hidden="true" />
      {children && (
        <span className={`check__label${checked ? ' is-done' : ''}`}>{children}</span>
      )}
    </label>
  )
}