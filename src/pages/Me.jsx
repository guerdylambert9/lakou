import React from 'react'
import { useApp, CUSTOMER } from '../lib/store.jsx'
import { useRouter } from '../lib/router.jsx'
import { money, price, splitLocal, joinLocal, googleCalendarUrl, isPast } from '../lib/logic.js'
import { fmtDay, fmtWhen } from '../lib/format.js'
import { Badge, Button, Empty, Icon, Section, Toggle } from '../components/ui.jsx'
import { PageHead } from '../components/Layout.jsx'

const STATUS_TONE = { confirmed: 'leaf', requested: 'gold', quoted: 'rose', declined: 'neutral', inquiry: 'indigo', placed: 'gold', ready: 'leaf', shipped: 'indigo', completed: 'neutral' }

export function StatusBadge({ status }) {
  const { t } = useApp()
  return <Badge tone={STATUS_TONE[status] || 'neutral'}>{t(`status_${status}`)}</Badge>
}

export default function Me() {
  const { t, lang, s, dispatch, shop, service, event, product, toast } = useApp()
  const { navigate } = useRouter()
  const recs = s.recommendations.filter((r) => r.customerId === 'you')
  const bookings = s.bookings.filter((b) => b.customerId === 'you')
  const orders = s.orders.filter((o) => o.customerId === 'you')
  const attending = s.attendance.filter((a) => a.customerId === 'you')
  const invites = s.invites.filter((i) => i.customerId === 'you')

  const acceptQuote = (b) => {
    dispatch({ type: 'booking/update', id: b.id, patch: { status: 'confirmed', start: b.quote.start, price: b.quote.price } })
    toast(t('bookingConfirmed'))
  }

  return (
    <div className="stack-24">
      <PageHead title={t('me')} sub={s.initialsOnly ? `${CUSTOMER.initials} · ${t('initialsOnly')}` : CUSTOMER.name} />

      {recs.length > 0 && (
        <Section title={t('fromReading')} id="me-recs">
          <div className="stack-12">
            {recs.map((r) => (
              <div key={r.id} className="card pad stack-8">
                <div className="row between wrap gap-8">
                  <p className="strong">{t('fromReadingBy', { who: r.from, d: fmtDay(lang, r.date) })}</p>
                  {r.status === 'new' ? <Badge tone="gold">{t('new')}</Badge> : <Badge tone="leaf">{t('added')}</Badge>}
                </div>
                <p className="muted">“{r.note}”</p>
                <p className="small">
                  {r.items.map((i) => `${i.qty} × ${product(i.productId)?.name}`).join(' · ')}
                  {r.services.length ? ` · ${r.services.map((id) => service(id)?.name).join(' · ')}` : ''}
                </p>
                {r.status === 'new' && (
                  <div>
                    <Button
                      size="sm"
                      icon="bag"
                      onClick={() => {
                        r.items.forEach((i) => dispatch({ type: 'cart/add', productId: i.productId, qty: i.qty }))
                        dispatch({ type: 'rec/update', id: r.id, patch: { status: 'added' } })
                        toast(t('addedAll'))
                        navigate('/cart')
                      }}
                    >
                      {t('addAll')}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title={t('bookings')} id="me-bookings">
        {bookings.length === 0 ? (
          <Empty icon="calendar" title={t('nothingYet')} />
        ) : (
          <div className="card list-card">
            {bookings.map((b) => {
              const sv = service(b.serviceId)
              const sh = shop(b.shopId)
              return (
                <div key={b.id} className="list-row static">
                  <div className="stack-4">
                    <p className="strong">
                      {sv.name} <span className="muted">· {sh.name}</span>
                    </p>
                    <p className="muted small">
                      {b.start ? fmtWhen(lang, b.start) : b.preferred ? t('preferred', { d: b.preferred.map((d) => fmtDay(lang, d)).join(', ') }) : t('privateInquiry')}
                      {b.format === 'video' ? ` · ${t('video')}` : ''}
                      {b.price ? ` · ${price(b.price)}` : ''}
                    </p>
                    {b.status === 'quoted' && b.quote && (
                      <div className="stack-8">
                        <p className="small">{t('quoteFor', { p: price(b.quote.price), d: fmtWhen(lang, b.quote.start) })}</p>
                        <div>
                          <Button size="sm" onClick={() => acceptQuote(b)}>
                            {t('acceptPay', { p: price(b.quote.price) })}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <StatusBadge status={b.status === 'confirmed' && b.start && isPast(b.start) ? 'completed' : b.status} />
                </div>
              )
            })}
          </div>
        )}
      </Section>

      <Section title={t('myCeremonies')} id="me-events">
        {attending.length + invites.length === 0 ? (
          <Empty icon="calendar" title={t('nothingYet')}>
            <Button variant="outline" onClick={() => navigate('/ceremonies')}>
              {t('ceremonies')}
            </Button>
          </Empty>
        ) : (
          <div className="card list-card">
            {attending.map((a) => {
              const e = event(a.eventId)
              return (
                <button key={a.id} type="button" className="list-row" onClick={() => dispatch({ type: 'set', patch: { sheet: { type: 'event', id: e.id } } })}>
                  <span className="stack-4">
                    <span className="strong">{e.title}</span>
                    <span className="muted small">
                      {fmtWhen(lang, e.start)} · {shop(e.shopId).name}
                    </span>
                  </span>
                  <Badge tone="leaf" icon="check">
                    {a.kind === 'ticket' ? t('ticketed') : t('going')}
                  </Badge>
                </button>
              )
            })}
            {invites.map((i) => {
              const e = event(i.eventId)
              return (
                <button key={i.id} type="button" className="list-row" onClick={() => dispatch({ type: 'set', patch: { sheet: { type: 'event', id: e.id } } })}>
                  <span className="stack-4">
                    <span className="strong">{e.title}</span>
                    <span className="muted small">
                      {fmtWhen(lang, e.start)} · {shop(e.shopId).name}
                    </span>
                  </span>
                  <Badge tone={i.status === 'approved' ? 'leaf' : 'gold'}>{i.status === 'approved' ? t('inviteApproved') : t('inviteRequested')}</Badge>
                </button>
              )
            })}
          </div>
        )}
      </Section>

      <Section title={t('orders')} id="me-orders">
        {orders.length === 0 ? (
          <Empty icon="bag" title={t('nothingYet')} />
        ) : (
          <div className="card list-card">
            {orders.map((o) => (
              <div key={o.id} className="list-row static">
                <div className="stack-4">
                  <p className="strong">
                    {shop(o.shopId).name} <span className="muted">· {o.id}</span>
                  </p>
                  <p className="muted small">
                    {o.lines.map((l) => `${l.qty} × ${l.name}`).join(' · ')} · {money(o.totals.total)}
                  </p>
                  {o.method === 'pickup' && o.status !== 'completed' && (
                    <p className="small">
                      {t('pickupCode')}: <strong className="num">{o.code}</strong>
                    </p>
                  )}
                </div>
                <StatusBadge status={o.status} />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={t('privacy')} id="me-privacy">
        <div className="card pad stack-12">
          <Toggle id="initials" checked={s.initialsOnly} onChange={(v) => dispatch({ type: 'set', patch: { initialsOnly: v } })} label={t('initialsOnly')} hint={s.initialsOnly ? CUSTOMER.initials : CUSTOMER.name} />
          <Toggle id="neutral" checked={s.neutralNotes} onChange={(v) => dispatch({ type: 'set', patch: { neutralNotes: v } })} label={t('neutralNotes')} hint={t('neutralPreview')} />
          <Toggle id="discreet-me" checked={s.discreet} onChange={(v) => dispatch({ type: 'set', patch: { discreet: v } })} label={t('discreet')} hint={t('discreetHint')} />
        </div>
      </Section>
    </div>
  )
}

export function BookingDone({ id }) {
  const { t, lang, s, shop, service } = useApp()
  const { navigate } = useRouter()
  const b = s.bookings.find((x) => x.id === id)
  if (!b) return <Empty title={t('nothingYet')} />
  const sv = service(b.serviceId)
  const sh = shop(b.shopId)
  const { ymd, hour } = splitLocal(b.start)
  const end = joinLocal(ymd, hour + (sv.duration || 30) / 60)
  return (
    <div className="stack-16 narrow">
      <div className="done-head">
        <span className="done-icon">
          <Icon name="check" size={26} />
        </span>
        <h1>{t('bookingConfirmed')}</h1>
        <p className="muted">{t('cancelPolicy')}</p>
      </div>
      <div className="card pad stack-8">
        <p className="strong">
          {sv.name} · {sv.kr}
        </p>
        <p>{sh.practitioner.title} {sh.practitioner.name} · {sh.name}</p>
        <p>
          <Icon name="clock" size={16} /> {fmtWhen(lang, b.start)} · {t('minutes', { n: sv.duration })}
        </p>
        <p>
          <Icon name={b.format === 'video' ? 'video' : 'pin'} size={16} /> {b.format === 'video' ? t('videoLinkNote') : sh.area}
        </p>
        <p className="row between">
          <span className="muted">{t('total')}</span>
          <strong className="num">{price(b.price)}</strong>
        </p>
      </div>
      <div className="row wrap gap-8">
        <a className="btn btn-outline btn-md" href={googleCalendarUrl({ title: `${sv.name} · ${sh.name}`, start: b.start, end, location: b.format === 'video' ? 'Video' : sh.area })} target="_blank" rel="noopener noreferrer">
          <Icon name="external" size={18} />
          <span>{t('addGoogle')}</span>
        </a>
        <button type="button" className="btn btn-ghost btn-md" onClick={() => navigate('/me')}>
          <span>{t('bookings')}</span>
        </button>
      </div>
    </div>
  )
}
