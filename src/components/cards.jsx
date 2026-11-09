import React from 'react'
import { useApp } from '../lib/store.jsx'
import { useRouter } from '../lib/router.jsx'
import { openStatus, hourLabel, isPast, price, isSellable } from '../lib/logic.js'
import { dayShort } from '../i18n.js'
import { fmtRange, whoAt, joinDot } from '../lib/format.js'
import { Badge, Icon, Stars, Button } from './ui.jsx'
import { ProductArt, ShopBanner, DateStub } from './Art.jsx'

const ARTIFACT = import.meta.env.MODE === 'artifact'

/**
 * Shares a page through the phone's share sheet (WhatsApp, Messages…), or falls back
 * to WhatsApp on computers. The link points at this page on the live site.
 */
export function ShareButton({ text, path, label }) {
  const url = ARTIFACT ? '' : window.location.origin + path
  const message = url ? `${text}\n${url}` : text
  const wa = `https://wa.me/?text=${encodeURIComponent(message)}`
  const onClick = (e) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      e.preventDefault()
      navigator.share({ text, url: url || undefined }).catch((err) => {
        if (err && err.name !== 'AbortError') window.open(wa, '_blank', 'noopener')
      })
    }
  }
  return (
    <a className="btn btn-outline btn-sm" href={wa} target="_blank" rel="noopener noreferrer" onClick={onClick}>
      <Icon name="send" size={16} />
      <span>{label}</span>
    </a>
  )
}

export function OpenBadge({ shop }) {
  const { t, lang } = useApp()
  if (shop.hoursPosted === false) return <Badge>{t('callFirst')}</Badge>
  const st = openStatus(shop.hours)
  if (st.open) return <Badge tone="leaf">{t('closesAt', { t: hourLabel(st.at) })}</Badge>
  if (st.dayOffset == null) return <Badge>{t('closed')}</Badge>
  const day = st.dayOffset === 0 ? t('today') : st.dayOffset === 1 ? t('tomorrow') : dayShort(lang, st.dow)
  return <Badge>{t('opensAt', { d: day, t: hourLabel(st.at) })}</Badge>
}

export function shopOffers(shopId, services) {
  const mine = services.filter((s) => s.shopId === shopId)
  return {
    readings: mine.some((s) => /reading|consult|konsiltasyon/i.test(s.name + s.kr)),
    baths: mine.some((s) => /bath|beny/i.test(s.name + s.kr)),
  }
}

export function ShopCard({ shop }) {
  const { t, s } = useApp()
  const { navigate } = useRouter()
  const offers = shopOffers(shop.id, s.services)
  return (
    <button type="button" className="card shop-card" onClick={() => navigate(`/shop/${shop.id}`)}>
      <ShopBanner shop={shop} className="shop-card-banner" />
      <span className="shop-card-body">
        <span className="shop-card-title">{shop.name}</span>
        <span className="muted small">{joinDot(shop.area, whoAt(shop))}</span>
        <span className="row wrap gap-6">
          <OpenBadge shop={shop} />
          {shop.rating != null && <Stars value={shop.rating} count={shop.reviewCount} />}
        </span>
        <span className="row wrap gap-6">
          {offers.readings && <Badge tone="indigo">{t('readings')}</Badge>}
          {offers.baths && <Badge tone="indigo">{t('baths')}</Badge>}
          {shop.ships && <Badge tone="indigo">{t('ships')}</Badge>}
          {shop.languages.includes('Kreyòl') ? <Badge>Kreyòl</Badge> : shop.languages[0] ? <Badge>{shop.languages[0]}</Badge> : null}
        </span>
      </span>
    </button>
  )
}

export function ProductBadges({ product }) {
  const { t } = useApp()
  if (product.sacred) return <Badge tone="gold">{t('askInStore')}</Badge>
  if (product.fulfillment === 'store')
    return (
      <Badge tone="amber">
        {t('inStoreOnly')}
        {product.minAge ? ` · ${t('age21')}` : ''}
      </Badge>
    )
  if (product.stock <= 0) return <Badge>{t('soldOut')}</Badge>
  if (product.fulfillment === 'pickup') return <Badge tone="amber">{t('pickupOnly')}</Badge>
  return null
}

export function ProductCard({ product, showShop = true }) {
  const { shop, openSheet } = useApp()
  const sh = shop(product.shopId)
  return (
    <button type="button" className="card product-card" onClick={() => openSheet('product', product.id)}>
      <span className="product-card-art">
        <ProductArt product={product} />
        <span className="product-card-flag">
          <ProductBadges product={product} />
        </span>
      </span>
      <span className="product-card-body">
        <span className="product-card-name">{product.name}</span>
        {showShop && <span className="muted small clamp-1">{sh.name}</span>}
        <span className="product-card-price">{product.sacred ? '—' : price(product.price)}</span>
      </span>
    </button>
  )
}

export function eventKindBadge(kind, t) {
  const map = { public: ['leaf', 'public'], invite: ['gold', 'invite'], virtual: ['indigo', 'virtual'], ticketed: ['rose', 'ticket'] }
  const [tone, key] = map[kind] || ['neutral', kind]
  return <Badge tone={tone}>{t(key)}</Badge>
}

export function EventCard({ event }) {
  const { t, lang, shop, openSheet, s } = useApp()
  const sh = shop(event.shopId)
  const past = isPast(event.end || event.start)
  const mine = s.attendance.some((a) => a.eventId === event.id) || s.invites.some((i) => i.eventId === event.id && i.customerId === 'you')
  return (
    <button type="button" className={`card event-card ${past ? 'is-past' : ''}`} onClick={() => openSheet('event', event.id)}>
      <DateStub start={event.start} lang={lang} muted={past} />
      <span className="event-card-body">
        <span className="event-card-title">{event.title}</span>
        <span className="muted small">{sh.name}</span>
        <span className="small">{fmtRange(lang, event.start, event.end)}</span>
        <span className="row wrap gap-6">
          {eventKindBadge(event.kind, t)}
          {event.price > 0 && <Badge>{price(event.price)}</Badge>}
          {past ? <Badge>{t('past')}</Badge> : <span className="muted small">{t('goingCount', { n: event.going })}</span>}
          {mine && (
            <Badge tone="leaf" icon="check">
              {t('going')}
            </Badge>
          )}
        </span>
      </span>
      <Icon name="chevron" className="muted" />
    </button>
  )
}

export function ServiceRow({ service }) {
  const { t, openSheet } = useApp()
  const formats = service.formats.map((f) => (f === 'video' ? t('video') : f === 'on_site' ? t('onSite') : t('inPerson'))).join(' · ')
  const action =
    service.mode === 'instant' ? (
      <Button size="sm" onClick={() => openSheet('service', service.id)}>
        {t('book')}
      </Button>
    ) : service.mode === 'request' ? (
      <Button size="sm" variant="outline" onClick={() => openSheet('service', service.id)}>
        {t('request')}
      </Button>
    ) : (
      <Button size="sm" variant="ghost" icon="lock" onClick={() => openSheet('service', service.id)}>
        {t('inquire')}
      </Button>
    )
  return (
    <div className="service-row">
      <div className="service-main">
        <p className="service-name">
          {service.name} <span className="muted">· {service.kr}</span>
        </p>
        <p className="muted small">
          {formats}
          {service.duration ? ` · ${t('minutes', { n: service.duration })}` : ''}
        </p>
        <p className="service-price">
          {service.mode === 'instant' ? price(service.price) : service.mode === 'request' ? t('priceAfterReading') : t('privateInquiry')}
        </p>
      </div>
      {action}
    </div>
  )
}

export function sellableNote(product, t) {
  if (isSellable(product)) return null
  if (product.sacred) return t('askInStore')
  if (product.fulfillment === 'store') return t('inStoreOnly')
  return t('soldOut')
}
