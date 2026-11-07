import React, { useMemo, useState } from 'react'
import { useApp } from '../lib/store.jsx'
import { useRouter } from '../lib/router.jsx'
import { OWNER_SHOP_ID } from '../data/seed.js'
import { CATEGORY_LABELS } from '../i18n.js'
import { money, price, payout, shopNow, splitLocal, isPast, openDays, slotsFor, hourLabel, newId, isSellable } from '../lib/logic.js'
import { fmtDay, fmtWhen, fmtRelDay, fmtRange } from '../lib/format.js'
import { Badge, Button, Empty, Field, Icon, Section, Segmented, Sheet, Stepper, Toggle } from '../components/ui.jsx'
import { ProductArt } from '../components/Art.jsx'
import { ProductBadges, eventKindBadge } from '../components/cards.jsx'
import { StatusBadge } from '../pages/Me.jsx'
import { PageHead } from '../components/Layout.jsx'

function useOwnerData() {
  const app = useApp()
  const { s } = app
  const shop = app.shop(OWNER_SHOP_ID)
  const orders = s.orders.filter((o) => o.shopId === shop.id)
  const bookings = s.bookings.filter((b) => b.shopId === shop.id)
  const events = s.events.filter((e) => e.shopId === shop.id)
  const invites = s.invites.filter((i) => events.some((e) => e.id === i.eventId))
  return { ...app, shop, orders, bookings, events, invites }
}

/** Shows a customer the way the shop sees them: the demo customer follows the privacy toggle. */
function who(entry, app) {
  if (entry.customerId === 'you') return app.customerLabel
  return entry.customerName
}

// ---------- action rows shared by Today and Inbox ----------

function OrderRow({ o }) {
  const app = useApp()
  const { t, dispatch, toast } = app
  const next = o.status === 'placed' ? (o.method === 'ship' ? 'shipped' : 'ready') : o.status === 'ready' ? 'completed' : null
  const label = o.status === 'placed' ? (o.method === 'ship' ? t('markShipped') : t('prepare')) : t('complete')
  return (
    <div className="list-row static">
      <div className="stack-4">
        <p className="strong">{t('orderFrom', { id: o.id, who: who(o, app) })}</p>
        <p className="muted small">
          {o.lines.map((l) => `${l.qty} × ${l.name}`).join(' · ')}
        </p>
        <p className="small">
          <Icon name={o.method === 'ship' ? 'truck' : 'store'} size={14} /> {o.method === 'ship' ? t('shipToMe') : t('pickupAt')}
          {o.discreet ? ` · ${t('discreet')}` : ''} · {money(o.totals.subtotal)} → {t('youReceive', { p: money(payout(o.totals.subtotal, 'product')) })}
        </p>
      </div>
      <div className="row-actions">
        <StatusBadge status={o.status} />
        {next && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              dispatch({ type: 'order/update', id: o.id, patch: { status: next } })
              toast(t(`status_${next}`))
            }}
          >
            {label}
          </Button>
        )}
      </div>
    </div>
  )
}

function RequestRow({ b }) {
  const app = useApp()
  const { t, lang, service, dispatch, toast, openSheet } = app
  const sv = service(b.serviceId)
  const isInquiry = b.status === 'inquiry'
  return (
    <div className="list-row static">
      <div className="stack-4">
        <p className="strong">{isInquiry ? t('inquiryFrom', { who: who(b, app) }) : t('requestFrom', { svc: `${sv.name} · ${sv.kr}`, who: who(b, app) })}</p>
        {b.preferred && <p className="muted small">{t('preferred', { d: b.preferred.map((d) => fmtDay(lang, d)).join(', ') })}</p>}
        {b.note && <p className="small">{t('customerNote', { n: b.note })}</p>}
        {b.status === 'quoted' && b.quote && <p className="small">{t('quoteFor', { p: price(b.quote.price), d: fmtWhen(lang, b.quote.start) })}</p>}
      </div>
      <div className="row-actions">
        {b.status === 'requested' ? (
          <>
            <Button size="sm" onClick={() => openSheet('quote', b.id)}>
              {t('sendQuote')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                dispatch({ type: 'booking/update', id: b.id, patch: { status: 'declined' } })
                toast(t('status_declined'))
              }}
            >
              {t('decline')}
            </Button>
          </>
        ) : isInquiry ? (
          <Badge tone="indigo" icon="lock">
            {t('privateInquiry')}
          </Badge>
        ) : (
          <StatusBadge status={b.status} />
        )}
      </div>
    </div>
  )
}

function InviteRow({ i }) {
  const app = useApp()
  const { t, event, dispatch, toast } = app
  const e = event(i.eventId)
  return (
    <div className="list-row static">
      <div className="stack-4">
        <p className="strong">{t('inviteFrom', { who: who(i, app) })}</p>
        <p className="muted small">{e.title}</p>
      </div>
      <div className="row-actions">
        {i.status === 'requested' ? (
          <>
            <Button
              size="sm"
              onClick={() => {
                dispatch({ type: 'invite/update', id: i.id, patch: { status: 'approved' } })
                toast(t('approved'))
              }}
            >
              {t('approve')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'invite/update', id: i.id, patch: { status: 'declined' } })}>
              {t('decline')}
            </Button>
          </>
        ) : (
          <Badge tone={i.status === 'approved' ? 'leaf' : 'neutral'}>{i.status === 'approved' ? t('approved') : t('status_declined')}</Badge>
        )}
      </div>
    </div>
  )
}

// ---------- Today ----------

export function OwnerToday() {
  const d = useOwnerData()
  const { t, lang, shop, orders, bookings, events, invites, openSheet, s } = d
  const now = shopNow()
  const needs = [
    ...bookings.filter((b) => b.status === 'requested' || b.status === 'inquiry').map((b) => ({ kind: 'req', b })),
    ...invites.filter((i) => i.status === 'requested').map((i) => ({ kind: 'inv', i })),
    ...orders.filter((o) => o.status === 'placed').map((o) => ({ kind: 'ord', o })),
  ]
  const upcoming = bookings
    .filter((b) => b.status === 'confirmed' && b.start && !isPast(b.start))
    .sort((a, b) => (a.start < b.start ? -1 : 1))
    .slice(0, 5)
  // Sample weekly figures plus anything the demo adds this session.
  const live = orders.filter((o) => o.customerId === 'you').reduce((n, o) => n + o.totals.subtotal, 0)
  const sales = 1186 + live
  const liveBookings = bookings.filter((b) => b.status === 'confirmed' && b.start && !isPast(b.start))
  const bookedCount = 6 + liveBookings.length
  const bookedValue = 340 + liveBookings.reduce((n, b) => n + (b.price || 0), 0)
  const gede = events.find((e) => e.id === 'e1')
  const gedeGoing = gede ? gede.going + s.attendance.filter((a) => a.eventId === 'e1').length : 0

  return (
    <div className="stack-24">
      <PageHead
        title={t('hello', { name: `${shop.practitioner.title} ${shop.practitioner.name.split(' ')[0]}` })}
        sub={shop.name}
        action={
          <Button icon="sparkle" onClick={() => openSheet('recommend', shop.id)}>
            {t('recommend')}
          </Button>
        }
      />

      <div className="kpis">
        <div className="kpi">
          <p className="kpi-label">{t('salesWeek')}</p>
          <p className="kpi-value">{price(Math.round(sales))}</p>
          <p className="muted small">{t('youReceive', { p: price(Math.round(payout(sales, 'product'))) })}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">{t('bookingsWeek')}</p>
          <p className="kpi-value">{bookedCount}</p>
          <p className="muted small">{t('youReceive', { p: price(Math.round(payout(bookedValue, 'service'))) })}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">{t('rsvpsFor', { e: 'Fèt Gede' })}</p>
          <p className="kpi-value">{gedeGoing}</p>
          <p className="muted small">/ {gede?.capacity}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">{t('nextPayout')}</p>
          <p className="kpi-value">{price(Math.round(payout(sales, 'product') * 0.82))}</p>
          <p className="muted small">Stripe Connect</p>
        </div>
      </div>
      <p className="muted small kpi-note">{t('sample')}</p>

      <Section title={t('needsReply')} id="needs">
        {needs.length === 0 ? (
          <Empty icon="check" title={t('allCaughtUp')} />
        ) : (
          <div className="card list-card">
            {needs.map((n) =>
              n.kind === 'req' ? <RequestRow key={n.b.id} b={n.b} /> : n.kind === 'inv' ? <InviteRow key={n.i.id} i={n.i} /> : <OrderRow key={n.o.id} o={n.o} />,
            )}
          </div>
        )}
      </Section>

      <Section title={t('schedule')} id="schedule">
        {upcoming.length === 0 ? (
          <Empty icon="calendar" title={t('nothingYet')} />
        ) : (
          <div className="card list-card">
            {upcoming.map((b) => {
              const sv = d.service(b.serviceId)
              const { ymd, hour } = splitLocal(b.start)
              return (
                <div key={b.id} className="list-row static nowrap">
                  <div className="when">
                    <span className="strong">{hourLabel(hour)}</span>
                    <span className="muted small">{fmtRelDay(lang, ymd, now.ymd, t)}</span>
                  </div>
                  <div className="stack-4 grow">
                    <p className="strong">
                      {sv.name} · {sv.kr}
                    </p>
                    <p className="muted small">
                      {who(b, d)} · {b.format === 'video' ? t('video') : t('inPerson')}
                      {b.note ? ` · ${t('customerNote', { n: b.note })}` : ''}
                    </p>
                  </div>
                  <span className="num small">{price(b.price)}</span>
                </div>
              )
            })}
          </div>
        )}
      </Section>
    </div>
  )
}

// ---------- Inbox ----------

export function OwnerInbox() {
  const d = useOwnerData()
  const { t, lang, orders, bookings, invites } = d
  const [tab, setTab] = useState('requests')
  const requests = bookings.filter((b) => ['requested', 'inquiry', 'quoted'].includes(b.status))
  const confirmed = bookings.filter((b) => b.status === 'confirmed' || b.status === 'completed').sort((a, b) => (a.start < b.start ? 1 : -1))
  return (
    <div className="stack-16">
      <PageHead title={t('ownerInbox')} sub={d.shop.name} />
      <Segmented
        id="inbox-tabs"
        label={t('ownerInbox')}
        value={tab}
        onChange={setTab}
        options={[
          { value: 'requests', label: `${t('requests')} (${requests.length + invites.filter((i) => i.status === 'requested').length})` },
          { value: 'orders', label: `${t('orders')} (${orders.filter((o) => o.status !== 'completed').length})` },
          { value: 'bookings', label: t('bookings') },
        ]}
      />
      {tab === 'requests' && (
        <div className="card list-card">
          {requests.length + invites.length === 0 && <Empty icon="inbox" title={t('noRequests')} />}
          {requests.map((b) => (
            <RequestRow key={b.id} b={b} />
          ))}
          {invites.map((i) => (
            <InviteRow key={i.id} i={i} />
          ))}
        </div>
      )}
      {tab === 'orders' && (
        <div className="card list-card">
          {orders.map((o) => (
            <OrderRow key={o.id} o={o} />
          ))}
        </div>
      )}
      {tab === 'bookings' && (
        <div className="card list-card">
          {confirmed.map((b) => {
            const sv = d.service(b.serviceId)
            return (
              <div key={b.id} className="list-row static">
                <div className="stack-4">
                  <p className="strong">
                    {sv.name} · {who(b, d)}
                  </p>
                  <p className="muted small">
                    {fmtWhen(lang, b.start)} · {b.format === 'video' ? t('video') : t('inPerson')} · {price(b.price)} → {t('youReceive', { p: money(payout(b.price, 'service')) })}
                  </p>
                </div>
                <StatusBadge status={isPast(b.start) ? 'completed' : b.status} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------- Ceremonies ----------

const BLANK_EVENT = { title: '', kind: 'public', date: '', start: '19:00', end: '22:00', price: 0, capacity: 60, dress: '', bring: '', desc: '' }

export function OwnerEvents() {
  const d = useOwnerData()
  const { t, lang, events, dispatch, toast, s, shop } = d
  const days = useMemo(() => openDays([...Array(7)].map(() => [0, 24]), shopNow(), 21), [])
  const [f, setF] = useState({ ...BLANK_EVENT, date: days[2]?.ymd })
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const valid = f.title.trim().length > 2 && f.date && f.start
  const publish = (e) => {
    e.preventDefault()
    if (!valid) return
    const priced = f.kind === 'ticketed' || f.kind === 'virtual'
    dispatch({
      type: 'event/add',
      event: {
        id: newId('E'),
        shopId: shop.id,
        title: f.title.trim(),
        kind: f.kind,
        start: `${f.date}T${f.start}`,
        end: `${f.date}T${f.end || f.start}`,
        place: f.kind === 'virtual' ? '' : f.kind === 'invite' ? 'Shared with invited guests' : `${shop.name}, ${shop.area}`,
        price: priced ? Number(f.price) || 0 : 0,
        capacity: Number(f.capacity) || 0,
        going: 0,
        dress: f.dress.trim(),
        bring: f.bring.trim(),
        desc: f.desc.trim() || f.title.trim(),
      },
    })
    toast(t('published'))
    setF({ ...BLANK_EVENT, date: days[2]?.ymd })
  }
  const sorted = [...events].sort((a, b) => (a.start < b.start ? -1 : 1))
  return (
    <div className="owner-events">
      <div className="stack-16">
        <PageHead title={t('yourCeremonies')} sub={shop.name} />
        <div className="card list-card">
          {sorted.map((e) => {
            const going = e.going + s.attendance.filter((a) => a.eventId === e.id).length
            const reqs = s.invites.filter((i) => i.eventId === e.id && i.status === 'requested').length
            return (
              <div key={e.id} className="list-row static">
                <div className="stack-4">
                  <p className="strong">{e.title}</p>
                  <p className="muted small">{fmtRange(lang, e.start, e.end)}</p>
                  <div className="row wrap gap-6">
                    {eventKindBadge(e.kind, t)}
                    {e.price > 0 && <Badge>{price(e.price)}</Badge>}
                    <span className="muted small">
                      {t('goingTo', { n: going })} / {e.capacity}
                    </span>
                    {reqs > 0 && <Badge tone="gold">{t('requests')} · {reqs}</Badge>}
                  </div>
                </div>
                {isPast(e.end || e.start) && <Badge>{t('past')}</Badge>}
              </div>
            )
          })}
        </div>
      </div>

      <form className="card pad stack-12" onSubmit={publish} aria-labelledby="post-title">
        <h2 id="post-title" className="h3">
          {t('postCeremony')}
        </h2>
        <Field label={t('title')} htmlFor="ev-title">
          <input id="ev-title" value={f.title} onChange={set('title')} placeholder="Sèvis pou Bawon" required />
        </Field>
        <Field label={t('type')} htmlFor="ev-kind">
          <select id="ev-kind" value={f.kind} onChange={set('kind')}>
            <option value="public">{t('public')}</option>
            <option value="invite">{t('invite')}</option>
            <option value="virtual">{t('virtual')}</option>
            <option value="ticketed">{t('ticket')}</option>
          </select>
        </Field>
        <div className="grid-2">
          <Field label={t('date')} htmlFor="ev-date">
            <select id="ev-date" value={f.date} onChange={set('date')}>
              {days.map((dd) => (
                <option key={dd.ymd} value={dd.ymd}>
                  {fmtDay(lang, dd.ymd)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('capacity')} htmlFor="ev-cap">
            <input id="ev-cap" type="number" min="1" inputMode="numeric" value={f.capacity} onChange={set('capacity')} />
          </Field>
          <Field label={t('start')} htmlFor="ev-start">
            <input id="ev-start" type="time" value={f.start} onChange={set('start')} />
          </Field>
          <Field label={t('end')} htmlFor="ev-end">
            <input id="ev-end" type="time" value={f.end} onChange={set('end')} />
          </Field>
        </div>
        {(f.kind === 'ticketed' || f.kind === 'virtual') && (
          <Field label={`${t('price')} ($)`} htmlFor="ev-price">
            <input id="ev-price" type="number" min="0" step="1" inputMode="decimal" value={f.price} onChange={set('price')} />
          </Field>
        )}
        <Field label={t('notesDress')} htmlFor="ev-dress">
          <input id="ev-dress" value={f.dress} onChange={set('dress')} placeholder="White" />
        </Field>
        <Field label={t('notesBring')} htmlFor="ev-bring">
          <input id="ev-bring" value={f.bring} onChange={set('bring')} />
        </Field>
        <Field label={t('description')} htmlFor="ev-desc">
          <textarea id="ev-desc" rows={3} value={f.desc} onChange={set('desc')} />
        </Field>
        <Button type="submit" block size="lg" disabled={!valid} icon="send">
          {t('publish')}
        </Button>
      </form>
    </div>
  )
}

// ---------- Catalog ----------

const BLANK_PRODUCT = { name: '', category: 'candles', price: '', stock: 10, fulfillment: 'ship', age: false, sacred: false }

export function OwnerCatalog() {
  const d = useOwnerData()
  const { t, lang, s, dispatch, toast, shop } = d
  const products = s.products.filter((p) => p.shopId === shop.id)
  const services = s.services.filter((x) => x.shopId === shop.id)
  const [f, setF] = useState(BLANK_PRODUCT)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const valid = f.name.trim().length > 2 && (f.sacred || Number(f.price) > 0)
  const add = (e) => {
    e.preventDefault()
    if (!valid) return
    const colors = { candles: '#6B3FA0', waters: '#7FB7A4', herbs: '#3E8E4E', images: '#2A6E9E', flags: '#1D5FA8', clothing: '#EDE8DC', kits: '#4A2470', offerings: '#C9A227' }
    const arts = { candles: 'candle', waters: 'bottle', herbs: 'herbs', images: 'image', flags: 'flag', clothing: 'dress', kits: 'kit', offerings: 'bottle' }
    dispatch({
      type: 'product/add',
      product: {
        id: newId('p'),
        shopId: shop.id,
        name: f.name.trim(),
        kr: '',
        category: f.category,
        price: f.sacred ? 0 : Number(f.price),
        color: colors[f.category],
        art: arts[f.category],
        stock: Number(f.stock) || 0,
        fulfillment: f.sacred ? 'store' : f.age ? 'store' : f.fulfillment,
        minAge: f.age ? 21 : undefined,
        sacred: f.sacred || undefined,
        desc: '',
      },
    })
    toast(t('productAdded'))
    setF(BLANK_PRODUCT)
  }
  return (
    <div className="stack-24">
      <PageHead title={t('ownerCatalog')} sub={shop.name} />

      <Section title={t('services')} id="cat-services">
        <div className="card list-card">
          {services.map((sv) => (
            <div key={sv.id} className="list-row static">
              <div className="stack-4">
                <p className="strong">
                  {sv.name} · {sv.kr}
                </p>
                <p className="muted small">
                  {sv.duration ? t('minutes', { n: sv.duration }) : ''}
                  {sv.price ? ` · ${price(sv.price)} → ${t('youReceive', { p: money(payout(sv.price, 'service')) })}` : ''}
                </p>
              </div>
              <label className="sr-only" htmlFor={`mode-${sv.id}`}>
                {t('bookingMode')}
              </label>
              <select
                id={`mode-${sv.id}`}
                className="select-sm"
                value={sv.mode}
                onChange={(e) => {
                  const mode = e.target.value
                  dispatch({ type: 'service/update', id: sv.id, patch: { mode, price: mode === 'instant' ? sv.price || 50 : sv.price } })
                }}
              >
                <option value="instant">{t('m_instant')}</option>
                <option value="request">{t('m_request')}</option>
                <option value="private">{t('m_private')}</option>
              </select>
            </div>
          ))}
        </div>
      </Section>

      <div className="owner-catalog">
        <Section title={t('products')} id="cat-products">
          <div className="card list-card">
            {products.map((p) => (
              <div key={p.id} className="list-row static nowrap">
                <ProductArt product={p} className="art-thumb" />
                <div className="stack-4 grow">
                  <p className="strong">{p.name}</p>
                  <p className="muted small">
                    {CATEGORY_LABELS[lang][p.category]}
                    {p.sacred ? '' : ` · ${price(p.price)}`} · {t('stock')} {p.stock}
                  </p>
                  <ProductBadges product={p} />
                </div>
                {!p.sacred && p.fulfillment !== 'store' && (
                  <Toggle
                    compact
                    id={`stock-${p.id}`}
                    checked={p.stock > 0}
                    onChange={(v) => dispatch({ type: 'product/update', id: p.id, patch: { stock: v ? Math.max(1, p.stock || 10) : 0 } })}
                    label={`${t('inStockToggle')}: ${p.name}`}
                  />
                )}
              </div>
            ))}
          </div>
        </Section>

        <form className="card pad stack-12" onSubmit={add} aria-labelledby="add-title">
          <h2 id="add-title" className="h3">
            {t('addProduct')}
          </h2>
          <Field label={t('name')} htmlFor="pr-name">
            <input id="pr-name" value={f.name} onChange={set('name')} placeholder="7-day candle, black" required />
          </Field>
          <div className="grid-2">
            <Field label={t('category')} htmlFor="pr-cat">
              <select id="pr-cat" value={f.category} onChange={set('category')}>
                {Object.entries(CATEGORY_LABELS[lang]).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={`${t('price')} ($)`} htmlFor="pr-price">
              <input id="pr-price" type="number" min="0" step="0.5" inputMode="decimal" value={f.price} onChange={set('price')} disabled={f.sacred} />
            </Field>
            <Field label={t('stock')} htmlFor="pr-stock">
              <input id="pr-stock" type="number" min="0" inputMode="numeric" value={f.stock} onChange={set('stock')} />
            </Field>
            <Field label={t('fulfillment')} htmlFor="pr-ful">
              <select id="pr-ful" value={f.fulfillment} onChange={set('fulfillment')} disabled={f.sacred || f.age}>
                <option value="ship">{t('f_ship')}</option>
                <option value="pickup">{t('f_pickup')}</option>
                <option value="store">{t('f_store')}</option>
              </select>
            </Field>
          </div>
          <label className="check" htmlFor="pr-age">
            <input id="pr-age" type="checkbox" checked={f.age} onChange={set('age')} />
            <span>
              {t('ageGate')} · {t('inStoreOnly')}
            </span>
          </label>
          <label className="check" htmlFor="pr-sacred">
            <input id="pr-sacred" type="checkbox" checked={f.sacred} onChange={set('sacred')} />
            <span>{t('sacredItem')}</span>
          </label>
          <Button type="submit" block disabled={!valid} icon="plus">
            {t('save')}
          </Button>
        </form>
      </div>
    </div>
  )
}

// ---------- owner sheets ----------

export function RecommendSheet() {
  const { t, s, dispatch, closeSheet, toast, customerLabel, shop: getShop } = useApp()
  const shop = getShop(OWNER_SHOP_ID)
  const readers = useMemo(() => {
    const seen = new Map()
    seen.set('you', `${t('demoCustomer')} · ${customerLabel}`)
    for (const b of s.bookings) if (b.shopId === shop.id && b.customerId !== 'you' && b.serviceId === 's1') seen.set(b.customerId, b.customerName)
    return [...seen.entries()]
  }, [s.bookings, shop.id, t, customerLabel])
  const items = s.products.filter((p) => p.shopId === shop.id && isSellable(p))
  const services = s.services.filter((x) => x.shopId === shop.id && x.mode === 'instant')
  const [to, setTo] = useState('you')
  const [qty, setQty] = useState({})
  const [svc, setSvc] = useState([])
  const [note, setNote] = useState('')
  const chosen = Object.entries(qty).filter(([, n]) => n > 0)
  const send = () => {
    dispatch({
      type: 'rec/add',
      rec: {
        id: newId('R'),
        shopId: shop.id,
        customerId: to,
        from: `${shop.practitioner.title} ${shop.practitioner.name}`,
        date: shopNow().ymd,
        note: note.trim() || '—',
        items: chosen.map(([productId, n]) => ({ productId, qty: n })),
        services: svc,
        status: 'new',
      },
    })
    closeSheet()
    toast(t('recommendSent', { who: readers.find(([id]) => id === to)?.[1] }))
  }
  return (
    <Sheet
      open
      onClose={closeSheet}
      title={t('recommend')}
      eyebrow={shop.name}
      labelClose={t('close')}
      footer={
        <Button block size="lg" icon="send" disabled={!chosen.length && !svc.length} onClick={send}>
          {t('send')}
        </Button>
      }
    >
      <div className="stack-16">
        <Field label={t('recommendTo')} htmlFor="rec-to">
          <select id="rec-to" value={to} onChange={(e) => setTo(e.target.value)}>
            {readers.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <div className="stack-8">
          <p className="label">{t('items')}</p>
          <div className="card list-card flat">
            {items.map((p) => (
              <div key={p.id} className="list-row static">
                <ProductArt product={p} className="art-thumb" />
                <div className="grow">
                  <p className="strong small">{p.name}</p>
                  <p className="muted small">{price(p.price)}</p>
                </div>
                <Stepper id={`rq-${p.id}`} value={qty[p.id] || 0} min={0} max={p.stock} label={t('qty')} onChange={(n) => setQty((q) => ({ ...q, [p.id]: n }))} />
              </div>
            ))}
          </div>
        </div>
        <div className="stack-8">
          <p className="label">{t('services')}</p>
          {services.map((sv) => (
            <label key={sv.id} className="check" htmlFor={`rs-${sv.id}`}>
              <input id={`rs-${sv.id}`} type="checkbox" checked={svc.includes(sv.id)} onChange={(e) => setSvc((x) => (e.target.checked ? [...x, sv.id] : x.filter((y) => y !== sv.id)))} />
              <span>
                {sv.name} · {sv.kr} · {price(sv.price)}
              </span>
            </label>
          ))}
        </div>
        <Field label={t('recommendNote')} htmlFor="rec-note">
          <textarea id="rec-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Sheet>
  )
}

export function QuoteSheet({ id }) {
  const { t, lang, s, service, shop, dispatch, closeSheet, toast } = useApp()
  const b = s.bookings.find((x) => x.id === id)
  const sv = b ? service(b.serviceId) : null
  const sh = b ? shop(b.shopId) : null
  const days = useMemo(() => (sh ? openDays(sh.hours) : []), [sh])
  const [amount, setAmount] = useState(120)
  const [day, setDay] = useState(b?.preferred?.[0] || days[0]?.ymd)
  const [slot, setSlot] = useState(null)
  if (!b) return null
  const slots = day ? slotsFor(sv, sh.hours, day).filter((x) => !x.taken) : []
  const send = () => {
    dispatch({ type: 'booking/update', id: b.id, patch: { status: 'quoted', quote: { price: Number(amount), start: slot } } })
    closeSheet()
    toast(t('status_quoted'))
  }
  return (
    <Sheet
      open
      onClose={closeSheet}
      title={t('sendQuote')}
      eyebrow={`${sv.name} · ${sv.kr}`}
      labelClose={t('close')}
      footer={
        <Button block size="lg" icon="send" disabled={!slot || !(Number(amount) > 0)} onClick={send}>
          {t('sendQuote')} · {price(Number(amount) || 0)}
        </Button>
      }
    >
      <div className="stack-16">
        {b.note && <p className="muted">{t('customerNote', { n: b.note })}</p>}
        <Field label={t('quotePrice')} htmlFor="q-price">
          <input id="q-price" type="number" min="1" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <div className="stack-8">
          <p className="label">{t('quoteDate')}</p>
          <div className="day-strip">
            {days.map((dd) => (
              <button
                key={dd.ymd}
                type="button"
                className={`day ${day === dd.ymd ? 'is-active' : ''} ${b.preferred?.includes(dd.ymd) ? 'is-preferred' : ''}`}
                aria-pressed={day === dd.ymd}
                onClick={() => {
                  setDay(dd.ymd)
                  setSlot(null)
                }}
              >
                {fmtDay(lang, dd.ymd)}
              </button>
            ))}
          </div>
          <div className="slots">
            {slots.map((sl) => (
              <button key={sl.start} type="button" className={`slot ${slot === sl.start ? 'is-active' : ''}`} aria-pressed={slot === sl.start} onClick={() => setSlot(sl.start)}>
                {hourLabel(sl.hour)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  )
}
