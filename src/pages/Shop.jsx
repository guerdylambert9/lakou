import React, { useState } from 'react'
import { useApp } from '../lib/store.jsx'
import { hourLabel, isPast } from '../lib/logic.js'
import { dayLong } from '../i18n.js'
import { fmtDay } from '../lib/format.js'
import { Badge, Empty, Icon, Segmented, Stars } from '../components/ui.jsx'
import { ShopBanner } from '../components/Art.jsx'
import { EventCard, OpenBadge, ProductCard, ServiceRow } from '../components/cards.jsx'
import { useRouter } from '../lib/router.jsx'

export default function Shop({ id }) {
  const { t, lang, shop, s, reviews } = useApp()
  const router = useRouter()
  const [tab, setTab] = useState('services')
  const sh = shop(id)
  if (!sh) return <Empty icon="store" title={t('nothingYet')} />
  const products = s.products.filter((p) => p.shopId === sh.id)
  const services = s.services.filter((x) => x.shopId === sh.id)
  const events = s.events.filter((e) => e.shopId === sh.id).sort((a, b) => (a.start < b.start ? -1 : 1))
  const upcoming = events.filter((e) => !isPast(e.end || e.start))
  const shopReviews = reviews.filter((r) => r.shopId === sh.id)

  return (
    <div className="stack-16">
      <button type="button" className="back-btn" onClick={() => router.back('/shops')}>
        <Icon name="back" size={18} />
        {t('back')}
      </button>

      <div className="shop-hero card">
        <ShopBanner shop={sh} className="shop-hero-banner" />
        <div className="shop-hero-body">
          <h1>{sh.name}</h1>
          <p className="muted">
            {sh.practitioner.title} {sh.practitioner.name} · {sh.area}
          </p>
          <div className="row wrap gap-6">
            <OpenBadge shop={sh} />
            <Stars value={sh.rating} count={sh.reviewCount} />
            {sh.traditions.map((tr) => (
              <Badge key={tr} tone="indigo">
                {tr}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Segmented
        id="shop-tabs"
        label={sh.name}
        value={tab}
        onChange={setTab}
        options={[
          { value: 'services', label: t('services') },
          { value: 'supplies', label: t('products') },
          { value: 'ceremonies', label: `${t('ceremonies')}${upcoming.length ? ` (${upcoming.length})` : ''}` },
          { value: 'about', label: t('about') },
        ]}
      />

      {tab === 'services' && (
        <div className="card list-card">
          {services.map((sv) => (
            <ServiceRow key={sv.id} service={sv} />
          ))}
        </div>
      )}

      {tab === 'supplies' &&
        (products.length ? (
          <div className="grid-products">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} showShop={false} />
            ))}
          </div>
        ) : (
          <Empty icon="bag" title={t('nothingYet')} />
        ))}

      {tab === 'ceremonies' &&
        (events.length ? (
          <div className="grid-events">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        ) : (
          <Empty icon="calendar" title={t('nothingYet')} />
        ))}

      {tab === 'about' && (
        <div className="about-grid">
          <div className="card pad stack-12">
            <p className="eyebrow">{t('practitioner')}</p>
            <p className="strong">
              {sh.practitioner.title} {sh.practitioner.name}
            </p>
            <p>{sh.practitioner.bio}</p>
            <dl className="facts">
              <dt>{t('traditions')}</dt>
              <dd>{sh.traditions.join(', ')}</dd>
              <dt>{t('languages')}</dt>
              <dd>{sh.languages.join(', ')}</dd>
            </dl>
            <p className="eyebrow">{t('houseRules')}</p>
            <ul className="bullets">
              {sh.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div className="card pad stack-12">
            <p className="eyebrow">{t('hours')}</p>
            <table className="hours">
              <tbody>
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <tr key={d}>
                    <th scope="row">{dayLong(lang, d)}</th>
                    <td>{sh.hours[d] ? `${hourLabel(sh.hours[d][0])} – ${hourLabel(sh.hours[d][1])}` : t('closed')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card pad stack-12 about-reviews">
            <p className="eyebrow">
              {t('reviews')} · <Stars value={sh.rating} count={sh.reviewCount} />
            </p>
            {shopReviews.map((r) => (
              <div key={r.id} className="review">
                <p>“{r.text}”</p>
                <p className="muted small">
                  {r.author} · {fmtDay(lang, r.date)} · <Icon name="check" size={13} /> {r.verified === 'booking' ? t('verifiedBooking') : t('verifiedOrder')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
