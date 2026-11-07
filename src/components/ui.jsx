import React, { useEffect, useRef } from 'react'

const PATHS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  store: 'M3.5 9 5 4h14l1.5 5M4 9h16v11H4zM9.5 20v-5.5h5V20',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  bag: 'M5 8h14l-1.2 12H6.2zM9 8V6.5a3 3 0 0 1 6 0V8',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  back: 'M15 5l-7 7 7 7',
  chevron: 'M9 5l7 7-7 7',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  video: 'M3 7h12v10H3zM15 10.5l6-3.5v10l-6-3.5',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  close: 'M6 6l12 12M18 6 6 18',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  swap: 'M7 8h12l-3-3M17 16H5l3 3',
  send: 'M4 12 20 4l-6 16-2.5-6.5z',
  inbox: 'M4 13l2.5-8h11L20 13v6H4zM4 13h5l1 2h4l1-2h5',
  list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  leaf: 'M5 19c0-8 6-14 15-14 0 9-6 15-14 15M5 19l7-7',
  copy: 'M8 8h11v12H8zM5 16V4h11',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z',
  truck: 'M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  tag: 'M3 12V4h8l9 9-8 8zM7.5 8.5h.01',
  people: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6 6 0 0 1 3.5 6',
  wallet: 'M4 7h15a1 1 0 0 1 1 1v11H4zM4 7l11-3v3M16 13h.01',
}

export function Icon({ name, size = 20, className = '', title }) {
  if (name === 'star') {
    return (
      <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden={title ? undefined : 'true'} role={title ? 'img' : undefined}>
        {title && <title>{title}</title>}
        <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9z" fill="currentColor" />
      </svg>
    )
  }
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      <path d={PATHS[name] || ''} />
    </svg>
  )
}

export function Button({ variant = 'primary', size = 'md', icon, iconRight, children, className = '', block, ...rest }) {
  return (
    <button type="button" className={`btn btn-${variant} btn-${size} ${block ? 'btn-block' : ''} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children && <span>{children}</span>}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 16 : 18} />}
    </button>
  )
}

export function Badge({ tone = 'neutral', icon, children }) {
  return (
    <span className={`badge badge-${tone}`}>
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  )
}

export function Chip({ active, onClick, children, id }) {
  return (
    <button type="button" id={id} className={`chip ${active ? 'is-active' : ''}`} aria-pressed={!!active} onClick={onClick}>
      {children}
    </button>
  )
}

export function Segmented({ options, value, onChange, label, id }) {
  return (
    <div className="segmented" role="group" aria-label={label} id={id}>
      {options.map((o) => (
        <button key={o.value} type="button" className={o.value === value ? 'is-active' : ''} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.icon && <Icon name={o.icon} size={16} />}
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ id, checked, onChange, label, hint, compact }) {
  return (
    <label className={`toggle ${compact ? 'compact' : ''}`} htmlFor={id}>
      {compact ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span className="toggle-text">
          <span className="toggle-label">{label}</span>
          {hint && <span className="toggle-hint">{hint}</span>}
        </span>
      )}
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" aria-hidden="true">
        <span className="toggle-thumb" />
      </span>
    </label>
  )
}

export function Stepper({ value, onChange, min = 1, max = 99, label = 'Quantity', id }) {
  return (
    <div className="stepper" role="group" aria-label={label} id={id}>
      <button type="button" aria-label="Decrease" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
        <Icon name="minus" size={16} />
      </button>
      <span className="stepper-value" aria-live="polite">
        {value}
      </span>
      <button type="button" aria-label="Increase" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
        <Icon name="plus" size={16} />
      </button>
    </div>
  )
}

export function Stars({ value, count }) {
  return (
    <span className="stars">
      <Icon name="star" size={14} />
      <strong>{value.toFixed(1)}</strong>
      {count != null && <span className="muted">({count})</span>}
    </span>
  )
}

export function Section({ title, action, children, id }) {
  return (
    <section className="section" aria-labelledby={id}>
      {(title || action) && (
        <div className="section-head">
          {title && <h2 id={id}>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Empty({ icon = 'sparkle', title, children }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={22} />
      </span>
      <p className="empty-title">{title}</p>
      {children}
    </div>
  )
}

export function Sheet({ open, onClose, title, eyebrow, children, footer, labelClose = 'Close' }) {
  const panel = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    panel.current?.focus()
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="sheet-layer">
      <div className="sheet-scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabIndex={-1} ref={panel}>
        <div className="sheet-head">
          <div className="sheet-titles">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2 id="sheet-title">{title}</h2>
          </div>
          <button type="button" className="icon-btn" aria-label={labelClose} onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function Toast({ toast, atTop }) {
  if (!toast) return null
  return (
    <div className={`toast ${atTop ? 'at-top' : ''}`} role="status" key={toast.id}>
      <Icon name="check" size={18} />
      <span>{toast.msg}</span>
    </div>
  )
}

export function Field({ label, htmlFor, hint, children }) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}
