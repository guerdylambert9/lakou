import React, { useMemo, useState } from 'react'
import { useApp } from '../lib/store.jsx'
import { useRouter } from '../lib/router.jsx'
import { isPast, shopNow, price } from '../lib/logic.js'
import { CATEGORY_LABELS } from '../i18n.js'
import { fmtDay } from '../lib/format.js'
import { Button, Chip, Empty, Icon, Section } from '../components/ui.jsx'
import { EventCard, ProductCard, ShopCard } from '../components/cards.jsx'

const CATEGORIES = ['candles', 'waters', 'herbs', 'images', 'flags', 'clothing', 'kits', 'offerings']
const byStart = (a, b) => (a.start < b.start ? -1 : 1)

function GedeHero() {
  const { t, openSheet } = useApp()
  const { navigate } = useRouter()
  return (
    <section className="gede" aria-labelledby="gede-title">
      <div className="gede-in">
        <p className="gede-eyebrow">{t('gedeEyebrow')}</p>
        <h1 id="gede-title" className="gede-title">
          Fèt Gede
        </h1>
        <p className="gede-text">{t('gedeText')}</p>
        <div className="row wrap gap-8">
          <Button variant="gold" onClick={() => openSheet('product', 'p3')}>
            {t('gedeShop')}
          </Button>
          <Button variant="on-dark" onClick={() => navigate('/ceremonies')}>
            {t('gedeEvents')}
          </Button>
        </div>
      </div>
    </section>
  )
}

function RecommendationCard({ rec }) {
  const { t, lang, product, service, dispatch, toast, openSheet } = useApp()
  const { navigate } = useRouter()
  const items = rec.items.map((i) => ({ ...i, p: product(i.productId) })).filter((i) => i.p)
  const svcs = rec.services.map(service).filter(Boolean)
  const addAll = () => {
    items.forEach((i) => dispatch({ type: 'cart/add', productId: i.productId, qty: i.qty }))
    dispatch({ type: 'rec/update', id: rec.id, patch: { status: 'added' } })
    toast(t('addedAll'))
    navigate('/cart')
  }
  return (
    <div className="card rec-card">
      <div className="rec-head">
        <span className="rec-icon">
          <Icon name="sparkle" />
        </span>
        <div>
          <p className="rec-title">{t('fromReading')}</p>
          <p className="muted small">{t('fromReadingBy', { who: rec.from, d: fmtDay(lang, rec.date) })}</p>
        </div>
      </div>
      <p className="rec-note">“{rec.note}”</p>
      <ul className="rec-list">
        {items.map((i) => (
          <li key={i.productId}>
            <span>
              {i.qty} × {i.p.name}
            </span>
            <span>{price(i.p.price * i.qty)}</span>
          </li>
        ))}
        {svcs.map((sv) => (
          <li key={sv.id}>
            <span>
              {sv.name} · {sv.kr}
            </span>
            <span>{price(sv.price)}</span>
          </li>
        ))}
      </ul>
      <div className="row wrap gap-8">
        <Button onClick={addAll} icon="bag">
          {t('addAll')}
        </Button>
        {svcs[0] && (
          <Button variant="outline" onClick={() => openSheet('service', svcs[0].id)}>
            {t('book')} · {svcs[0].name}
          </Button>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const { t, lang, s, shops, openSheet } = useApp()
  const { navigate } = useRouter()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const now = shopNow()
  const showGede = now.ymd <= '2026-11-02'
  const recs = s.recommendations.filter((r) => r.customerId === 'you' && r.status === 'new')
  const upcoming = s.events.filter((e) => !isPast(e.end || e.start)).sort(byStart).slice(0, 3)
  const products = s.products.filter((p) => cat === 'all' || p.category === cat).slice(0, 8)

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return null
    const has = (str) => (str || '').toLowerCase().includes(term)
    return {
      shops: shops.filter((sh) => has(sh.name) || has(sh.area) || sh.traditions.some(has) || has(sh.practitioner.name)),
      products: s.products.filter((p) => has(p.name) || has(p.kr) || has(CATEGORY_LABELS.en[p.category]) || has(CATEGORY_LABELS.kr[p.category])),
      services: s.services.filter((sv) => has(sv.name) || has(sv.kr)),
    }
  }, [q, shops, s.products, s.services])

  return (
    <div className="stack-24">
      {showGede && <GedeHero />}

      <div className="search">
        <Icon name="search" />
        <label htmlFor="home-search" className="sr-only">
          {t('search')}
        </label>
        <input id="home-search" type="search" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      </div>

      {results ? (
        <Section title={t('searchResults', { q: q.trim() })} id="results">
          {results.shops.length + results.products.length + results.services.length === 0 ? (
            <Empty icon="search" title={t('noResults', { q: q.trim() })} />
          ) : (
            <div className="stack-16">
              {results.shops.length > 0 && (
                <div className="grid-shops">
                  {results.shops.map((sh) => (
                    <ShopCard key={sh.id} shop={sh} />
                  ))}
                </div>
              )}
              {results.services.length > 0 && (
                <div className="card list-card">
                  {results.services.map((sv) => (
                    <button key={sv.id} type="button" className="list-row" onClick={() => openSheet('service', sv.id)}>
                      <span>
                        <strong>{sv.name}</strong> <span className="muted">· {sv.kr}</span>
                        <span className="muted small block">{shops.find((x) => x.id === sv.shopId).name}</span>
                      </span>
                      <Icon name="chevron" className="muted" />
                    </button>
                  ))}
                </div>
              )}
              {results.products.length > 0 && (
                <div className="grid-products">
                  {results.products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </div>
          )}
        </Section>
      ) : (
        <>
          {recs.map((r) => (
            <RecommendationCard key={r.id} rec={r} />
          ))}

          <Section
            title={t('shopsNear')}
            id="near"
            action={
              <button type="button" className="link-btn" onClick={() => navigate('/shops')}>
                {t('seeAll')}
              </button>
            }
          >
            <div className="grid-shops">
              {shops.slice(0, 3).map((sh) => (
                <ShopCard key={sh.id} shop={sh} />
              ))}
            </div>
          </Section>

          <Section
            title={t('upcoming')}
            id="upcoming"
            action={
              <button type="button" className="link-btn" onClick={() => navigate('/ceremonies')}>
                {t('seeAll')}
              </button>
            }
          >
            <div className="grid-events">
              {upcoming.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </Section>

          <Section title={t('supplies')} id="supplies">
            <div className="chips" role="group" aria-label={t('supplies')}>
              <Chip active={cat === 'all'} onClick={() => setCat('all')}>
                {t('all')}
              </Chip>
              {CATEGORIES.map((c) => (
                <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
                  {CATEGORY_LABELS[lang][c]}
                </Chip>
              ))}
            </div>
            <div className="grid-products">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  )
}
