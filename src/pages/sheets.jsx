import React, { useMemo, useState } from 'react'
import { useApp } from '../lib/store.jsx'
import { useRouter } from '../lib/router.jsx'
import { isSellable, price, openDays, slotsFor, hourLabel, newId, googleCalendarUrl, isPast } from '../lib/logic.js'
import { CATEGORY_LABELS } from '../i18n.js'
import { fmtDay, fmtRange, whoAt, joinDot, placeOf } from '../lib/format.js'
import { Badge, Button, Field, Icon, Segmented, Sheet, Stepper } from '../components/ui.jsx'
import { ProductArt } from '../components/Art.jsx'
import { ProductBadges, eventKindBadge, ShareButton } from '../components/cards.jsx'

export function ProductSheet({ id }) {
  const { t, lang, product, shop, dispatch, closeSheet, toast } = useApp()
  const { navigate } = useRouter()
  const [qty, setQty] = useState(1)
  const p = product(id)
  if (!p) return null
  const sh = shop(p.shopId)
  const sellable = isSellable(p)
  const add = () => {
    dispatch({ type: 'cart/add', productId: p.id, qty })
    toast(t('added'))
    closeSheet()
  }
  const availability =
    p.fulfillment === 'ship' ? t('shipsOrPickup') : p.fulfillment === 'pickup' ? t('pickupOnly') : p.sacred ? t('askInStore') : t('inStoreOnly')
  return (
    <Sheet
      open
      onClose={closeSheet}
      title={p.name}
      eyebrow={CATEGORY_LABELS[lang][p.category]}
      labelClose={t('close')}
      footer={
        sellable ? (
          <div className="row gap-12 between">
            <Stepper id="sheet-qty" value={qty} min={1} max={p.stock} onChange={setQty} label={t('qty')} />
            <Button size="lg" onClick={add} icon="bag" className="grow">
              {t('addToCart')} · {price(p.price * qty)}
            </Button>
          </div>
        ) : (
          <p className="notice">
            <Icon name="store" size={18} />
            <span>
              {p.sacred ? t('askInStore') : t('inStoreOnly')}
              {p.minAge ? ` · ${t('age21')}` : ''} · {sh.name}, {sh.area}
            </span>
          </p>
        )
      }
    >
      <div className="product-sheet">
        <ProductArt product={p} className="art-lg" />
        <div className="stack-12">
          <p className="muted">{p.kr}</p>
          {!p.sacred && <p className="price-lg">{price(p.price)}</p>}
          <p>{p.desc}</p>
          <div className="row wrap gap-6">
            <ProductBadges product={p} />
            <Badge tone="indigo" icon={p.fulfillment === 'ship' ? 'truck' : 'store'}>
              {availability}
            </Badge>
            {sellable && <span className="muted small">{t('inStock', { n: p.stock })}</span>}
          </div>
          <button
            type="button"
            className="shop-link"
            onClick={() => {
              closeSheet()
              navigate(`/shop/${sh.id}`)
            }}
          >
            <span>
              <strong>{sh.name}</strong>
              <span className="muted small block">{joinDot(whoAt(sh), sh.area)}</span>
            </span>
            <Icon name="chevron" />
          </button>
        </div>
      </div>
    </Sheet>
  )
}

export function ServiceSheet({ id }) {
  const { t, lang, service, shop, dispatch, closeSheet, toast, customerLabel } = useApp()
  const { navigate } = useRouter()
  const sv = service(id)
  const sh = sv ? shop(sv.shopId) : null
  const days = useMemo(() => (sh ? openDays(sh.hours) : []), [sh])
  const [format, setFormat] = useState(sv?.formats[0])
  const [day, setDay] = useState(days[0]?.ymd)
  const [slot, setSlot] = useState(null)
  const [picked, setPicked] = useState([])
  const [note, setNote] = useState('')
  const [ack, setAck] = useState(false)
  if (!sv) return null
  const slots = day ? slotsFor(sv, sh.hours, day) : []

  const book = () => {
    const bid = newId('B')
    dispatch({
      type: 'booking/add',
      booking: { id: bid, serviceId: sv.id, shopId: sh.id, customerId: 'you', customerName: customerLabel, start: slot, format, note, status: 'confirmed', price: sv.price },
    })
    closeSheet()
    toast(t('bookingConfirmed'))
    navigate(`/booking/${bid}`)
  }
  const request = () => {
    dispatch({
      type: 'booking/add',
      booking: {
        id: newId('B'),
        serviceId: sv.id,
        shopId: sh.id,
        customerId: 'you',
        customerName: customerLabel,
        preferred: sv.mode === 'request' ? picked : undefined,
        format: sv.formats[0],
        note,
        status: sv.mode === 'request' ? 'requested' : 'inquiry',
        price: null,
      },
    })
    closeSheet()
    toast(sv.mode === 'request' ? t('requestSent') : t('inquirySent'))
  }

  const fmtLabel = (f) => (f === 'video' ? t('video') : f === 'on_site' ? t('onSite') : t('inPerson'))
  const modeLabel = sv.mode === 'instant' ? t('instantBook') : sv.mode === 'request' ? t('byConsultation') : t('privateInquiry')

  let footer
  if (sv.mode === 'instant') {
    footer = (
      <Button block size="lg" disabled={!slot || !ack} onClick={book}>
        {t('confirmPay', { p: price(sv.price) })}
      </Button>
    )
  } else if (sv.mode === 'request') {
    footer = (
      <Button block size="lg" disabled={!picked.length} onClick={request} icon="send">
        {t('sendRequest')}
      </Button>
    )
  } else {
    footer = (
      <Button block size="lg" disabled={note.trim().length < 3} onClick={request} icon="lock">
        {t('sendInquiry')}
      </Button>
    )
  }

  return (
    <Sheet open onClose={closeSheet} title={`${sv.name} · ${sv.kr}`} eyebrow={`${sh.name} · ${modeLabel}`} labelClose={t('close')} footer={footer}>
      <div className="stack-16">
        <p>{sv.desc}</p>
        <p className="muted small">{joinDot(whoAt(sh) || sh.name, sv.duration ? t('minutes', { n: sv.duration }) : '', sv.price ? price(sv.price) : '')}</p>

        {sv.mode === 'instant' && sv.formats.length > 1 && (
          <Segmented id="format" label="Format" value={format} onChange={setFormat} options={sv.formats.map((f) => ({ value: f, label: fmtLabel(f), icon: f === 'video' ? 'video' : 'pin' }))} />
        )}

        {sv.mode !== 'private' && (
          <div className="stack-8">
            <p className="label">{sv.mode === 'instant' ? t('pickDate') : t('pickDates')}</p>
            <div className="day-strip" role="group" aria-label={t('pickDate')}>
              {days.map((d) => {
                const on = sv.mode === 'instant' ? day === d.ymd : picked.includes(d.ymd)
                return (
                  <button
                    key={d.ymd}
                    type="button"
                    className={`day ${on ? 'is-active' : ''}`}
                    aria-pressed={on}
                    onClick={() => {
                      if (sv.mode === 'instant') {
                        setDay(d.ymd)
                        setSlot(null)
                      } else {
                        setPicked((p) => (p.includes(d.ymd) ? p.filter((x) => x !== d.ymd) : p.length < 3 ? [...p, d.ymd] : p))
                      }
                    }}
                  >
                    {fmtDay(lang, d.ymd)}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {sv.mode === 'instant' && (
          <div className="stack-8">
            <p className="label">{t('pickTime')}</p>
            {slots.length === 0 ? (
              <p className="muted small">{t('noSlots')}</p>
            ) : (
              <div className="slots" role="group" aria-label={t('pickTime')}>
                {slots.map((sl) => (
                  <button key={sl.start} type="button" className={`slot ${slot === sl.start ? 'is-active' : ''}`} disabled={sl.taken} aria-pressed={slot === sl.start} onClick={() => setSlot(sl.start)}>
                    {hourLabel(sl.hour)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <Field label={t('privateNote')} htmlFor="svc-note" hint={t('privateNoteHint')}>
          <textarea id="svc-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>

        {sv.mode === 'instant' && (
          <label className="check" htmlFor="ack">
            <input id="ack" type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
            <span>{t('ack')}</span>
          </label>
        )}
      </div>
    </Sheet>
  )
}

export function EventSheet({ id }) {
  const { t, lang, s, event, shop, dispatch, closeSheet, toast, customerLabel } = useApp()
  const { navigate } = useRouter()
  const [showText, setShowText] = useState(false)
  const e = event(id)
  if (!e) return null
  const sh = shop(e.shopId)
  const past = isPast(e.end || e.start)
  const attending = s.attendance.find((a) => a.eventId === e.id && a.customerId === 'you')
  const invite = s.invites.find((i) => i.eventId === e.id && i.customerId === 'you')
  const going = e.going + s.attendance.filter((a) => a.eventId === e.id).length
  const left = Math.max(0, e.capacity - going)
  const where = placeOf(e, sh, t)
  const details = [e.title, fmtRange(lang, e.start, e.end), sh.name, where].filter(Boolean).join('\n')

  const attend = (kind) => {
    dispatch({ type: 'attend', entry: { id: newId('T'), eventId: e.id, customerId: 'you', kind } })
    toast(kind === 'ticket' ? t('ticketed') : t('going'))
  }
  const requestInvite = () => {
    dispatch({ type: 'invite/add', invite: { id: newId('I'), eventId: e.id, customerId: 'you', customerName: customerLabel, status: 'requested' } })
    toast(t('inviteRequested'))
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(details)
      toast(t('copied'))
    } catch {
      setShowText(true)
    }
  }

  const calendar = (
    <div className="row wrap gap-8">
      <a className="btn btn-outline btn-md" href={googleCalendarUrl({ title: e.title, start: e.start, end: e.end, details: e.desc, location: where })} target="_blank" rel="noopener noreferrer">
        <Icon name="external" size={18} />
        <span>{t('addGoogle')}</span>
      </a>
      <button type="button" className="btn btn-ghost btn-md" onClick={copy}>
        <Icon name="copy" size={18} />
        <span>{t('copyDetails')}</span>
      </button>
    </div>
  )

  let footer = null
  if (past) footer = <p className="notice">{t('past')}</p>
  else if (attending) footer = calendar
  else if (e.kind === 'invite') {
    footer = invite ? (
      <p className="notice">
        <Icon name="check" size={18} />
        <span>{invite.status === 'approved' ? t('inviteApproved') : t('inviteRequested')}</span>
      </p>
    ) : (
      <Button block size="lg" onClick={requestInvite} icon="send">
        {t('requestInvite')}
      </Button>
    )
  } else if (e.price > 0) {
    footer = (
      <Button block size="lg" onClick={() => attend('ticket')}>
        {t('getTicket', { p: price(e.price) })}
      </Button>
    )
  } else {
    footer = (
      <Button block size="lg" onClick={() => attend('going')} icon="check">
        {t('rsvp')}
      </Button>
    )
  }

  return (
    <Sheet open onClose={closeSheet} title={e.title} eyebrow={sh.name} labelClose={t('close')} footer={footer}>
      <div className="stack-16">
        <div className="row wrap gap-6">
          {eventKindBadge(e.kind, t)}
          {e.price > 0 && <Badge>{price(e.price)}</Badge>}
          {attending && (
            <Badge tone="leaf" icon="check">
              {attending.kind === 'ticket' ? t('ticketed') : t('going')}
            </Badge>
          )}
        </div>
        <p>{e.desc}</p>
        <dl className="facts">
          <dt>{t('when')}</dt>
          <dd>{fmtRange(lang, e.start, e.end)}</dd>
          <dt>{t('where')}</dt>
          <dd>{where}</dd>
          {e.dress && (
            <>
              <dt>{t('dress')}</dt>
              <dd>{e.dress}</dd>
            </>
          )}
          {e.bring && (
            <>
              <dt>{t('bring')}</dt>
              <dd>{e.bring}</dd>
            </>
          )}
        </dl>
        {!past && (
          <p className="muted small">
            {t('goingCount', { n: going })} · {t('spotsLeft', { n: left })}
          </p>
        )}
        {showText && <textarea className="copy-box" readOnly rows={4} value={details} onFocus={(ev) => ev.target.select()} autoFocus />}
        {!past && (
          <div>
            <ShareButton label={t('share')} text={`${e.title} · ${fmtRange(lang, e.start, e.end)} · ${sh.name}`} path={`/shop/${sh.id}`} />
          </div>
        )}
        <button
          type="button"
          className="shop-link"
          onClick={() => {
            closeSheet()
            navigate(`/shop/${sh.id}`)
          }}
        >
          <span>
            <strong>{sh.name}</strong>
            <span className="muted small block">{joinDot(whoAt(sh), sh.area)}</span>
          </span>
          <Icon name="chevron" />
        </button>
      </div>
    </Sheet>
  )
}
