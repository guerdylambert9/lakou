import React from 'react'
import { useApp } from '../lib/store.jsx'
import { useRouter } from '../lib/router.jsx'
import { Icon, Segmented } from './ui.jsx'
import { Wordmark } from './Art.jsx'

function useNavItems() {
  const { t, s, cartCount, shop } = useApp()
  const ownerShop = shop('ginen')
  const pending =
    s.orders.filter((o) => o.shopId === ownerShop.id && o.status === 'placed').length +
    s.bookings.filter((b) => b.shopId === ownerShop.id && (b.status === 'requested' || b.status === 'inquiry')).length +
    s.invites.filter((i) => s.events.find((e) => e.id === i.eventId)?.shopId === ownerShop.id && i.status === 'requested').length
  if (s.mode === 'owner') {
    return [
      { to: '/owner', icon: 'home', label: t('ownerToday') },
      { to: '/owner/inbox', icon: 'inbox', label: t('ownerInbox'), short: t('ownerInboxShort'), count: pending },
      { to: '/owner/ceremonies', icon: 'calendar', label: t('ownerEvents') },
      { to: '/owner/catalog', icon: 'list', label: t('ownerCatalog') },
      { to: '/owner/join', icon: 'sparkle', label: t('join') },
    ]
  }
  return [
    { to: '/', icon: 'home', label: t('home') },
    { to: '/shops', icon: 'store', label: t('shops') },
    { to: '/ceremonies', icon: 'calendar', label: t('ceremonies') },
    { to: '/cart', icon: 'bag', label: t('cart'), count: cartCount, mobileOnly: true },
    { to: '/me', icon: 'user', label: t('me') },
  ]
}

function isActive(item, path) {
  if (item.to === '/' || item.to === '/owner') return path === item.to
  return path === item.to || path.startsWith(item.to + '/') || (item.to === '/shops' && path.startsWith('/shop/'))
}

export function TopBar() {
  const { t, s, dispatch, cartCount } = useApp()
  const { path, navigate } = useRouter()
  const items = useNavItems()
  const owner = s.mode === 'owner'
  const switchMode = () => {
    const mode = owner ? 'customer' : 'owner'
    dispatch({ type: 'set', patch: { mode, sheet: null } })
    navigate(mode === 'owner' ? '/owner' : '/')
  }
  return (
    <header className="topbar">
      <div className="topbar-in">
        <button type="button" className="brand" onClick={() => navigate(owner ? '/owner' : '/')} aria-label="Lakou home">
          <Wordmark sub={owner ? t('forShops') : null} />
        </button>
        <nav className="topnav" aria-label="Main">
          {items
            .filter((i) => !i.mobileOnly)
            .map((i) => (
              <button key={i.to} type="button" className={`topnav-link ${isActive(i, path) ? 'is-active' : ''}`} aria-current={isActive(i, path) ? 'page' : undefined} onClick={() => navigate(i.to)}>
                {i.label}
                {i.count > 0 && <span className="count">{i.count}</span>}
              </button>
            ))}
        </nav>
        <div className="topbar-tools">
          <Segmented
            id="lang"
            label="Language"
            value={s.lang}
            onChange={(lang) => dispatch({ type: 'set', patch: { lang } })}
            options={[
              { value: 'en', label: 'EN' },
              { value: 'kr', label: 'KR' },
            ]}
          />
          {!owner && (
            <button type="button" className="icon-btn on-sign cart-btn" aria-label={`${t('cart')} (${cartCount})`} onClick={() => navigate('/cart')}>
              <Icon name="bag" />
              {cartCount > 0 && <span className="count">{cartCount}</span>}
            </button>
          )}
          <button type="button" className="mode-btn" onClick={switchMode}>
            <Icon name="swap" size={18} />
            <span>{owner ? t('customerView') : t('ownerView')}</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export function TabBar() {
  const { path, navigate } = useRouter()
  const items = useNavItems()
  return (
    <nav className="tabbar" aria-label="Tabs">
      <div className="tabbar-in" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((i) => (
          <button key={i.to} type="button" className={`tab ${isActive(i, path) ? 'is-active' : ''}`} aria-current={isActive(i, path) ? 'page' : undefined} onClick={() => navigate(i.to)}>
            <span className="tab-icon">
              <Icon name={i.icon} size={22} />
              {i.count > 0 && <span className="count">{i.count}</span>}
            </span>
            <span className="tab-label">{i.short || i.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

export function Footer() {
  const { t, dispatch } = useApp()
  return (
    <footer className="foot">
      <div className="container foot-in">
        <p>
          <strong>{t('sample')}</strong> · {t('krDraft')}
        </p>
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            dispatch({ type: 'reset' })
            dispatch({ type: 'toast', msg: t('resetDone') })
          }}
        >
          {t('resetDemo')}
        </button>
      </div>
    </footer>
  )
}

export function PageHead({ title, sub, back, action }) {
  const { t } = useApp()
  const router = useRouter()
  return (
    <div className="pagehead">
      {back && (
        <button type="button" className="back-btn" onClick={() => router.back(back)}>
          <Icon name="back" size={18} />
          {t('back')}
        </button>
      )}
      <div className="pagehead-row">
        <div>
          <h1>{title}</h1>
          {sub && <p className="muted">{sub}</p>}
        </div>
        {action}
      </div>
    </div>
  )
}
