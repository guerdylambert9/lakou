// Pure business logic: money, cart totals, shop hours, booking slots, calendar links.
// No React in here, so it is easy to test (see logic.test.js).

export const TAX_RATE = 0.07 // sample: Florida 6% plus a 1% county surtax
export const SHIPPING_FLAT = 7.95
export const COMMISSION = { product: 0.1, service: 0.15, ticket: 0.05 }
export const SHOP_TZ = 'America/New_York'

export const round2 = (n) => Math.round(n * 100) / 100

/** "$9", "$9.50", "$1,284" — cents only when needed. */
export function price(n) {
  const v = round2(n)
  const s = Number.isInteger(v) ? v.toLocaleString('en-US') : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return '$' + s
}

/** Always two decimals, for totals: "$27.82". */
export function money(n) {
  return '$' + round2(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ---------- products & cart ----------

/** Can this product be bought in the app? */
export function isSellable(p) {
  return !!p && p.fulfillment !== 'store' && !p.sacred && p.stock > 0
}

export function cartLines(cart, products) {
  return cart
    .map((c) => ({ ...c, product: products.find((p) => p.id === c.productId) }))
    .filter((l) => l.product)
}

/** Groups cart lines by shop, keeping the order shops first appear in. */
export function groupByShop(lines) {
  const groups = []
  for (const l of lines) {
    let g = groups.find((x) => x.shopId === l.product.shopId)
    if (!g) groups.push((g = { shopId: l.product.shopId, lines: [] }))
    g.lines.push(l)
  }
  return groups
}

export const canShip = (lines) => lines.every((l) => l.product.fulfillment === 'ship')

export function shopTotals(lines, method) {
  const subtotal = round2(lines.reduce((s, l) => s + l.product.price * l.qty, 0))
  const shipping = method === 'ship' ? SHIPPING_FLAT : 0
  const tax = round2(subtotal * TAX_RATE)
  return { subtotal, shipping, tax, total: round2(subtotal + shipping + tax) }
}

export function cartTotals(groups, methods) {
  return groups.reduce(
    (acc, g) => {
      const t = shopTotals(g.lines, methodFor(g, methods))
      return {
        subtotal: round2(acc.subtotal + t.subtotal),
        shipping: round2(acc.shipping + t.shipping),
        tax: round2(acc.tax + t.tax),
        total: round2(acc.total + t.total),
      }
    },
    { subtotal: 0, shipping: 0, tax: 0, total: 0 },
  )
}

/** Shipping is only allowed when every item in the shop's group can ship. */
export function methodFor(group, methods) {
  const wanted = methods[group.shopId] || 'pickup'
  return wanted === 'ship' && canShip(group.lines) ? 'ship' : 'pickup'
}

/** What the shop keeps after the platform commission. */
export function payout(amount, kind = 'product') {
  return round2(amount * (1 - COMMISSION[kind]))
}

// ---------- ids & codes ----------

export function hash(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0
  return h
}

export const pickupCode = (seed) => String(1000 + (hash(seed) % 9000))

let counter = 0
/** Short readable ids like "A-23817"; unique within a session. */
export function newId(prefix) {
  counter += 1
  return `${prefix}-${(Math.floor(Date.now() / 1000) % 80000) + 10000 + counter}`
}

// ---------- time in the shops' time zone ----------

/** Current wall-clock parts in South Florida, whatever the viewer's time zone. */
export function shopNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SHOP_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  }).formatToParts(date)
  const get = (t) => parts.find((p) => p.type === t)?.value
  const ymd = `${get('year')}-${get('month')}-${get('day')}`
  return { ymd, dow: dowOf(ymd), hour: Number(get('hour')) + Number(get('minute')) / 60 }
}

/** Day of week (0 = Sunday) of a YYYY-MM-DD date. */
export function dowOf(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

export function addDays(ymd, n) {
  const [y, m, d] = ymd.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return t.toISOString().slice(0, 10)
}

/** 10 -> "10 AM", 19.5 -> "7:30 PM". */
export function hourLabel(h) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  const suffix = hh >= 12 && hh < 24 ? 'PM' : 'AM'
  const h12 = hh % 12 === 0 ? 12 : hh % 12
  return mm ? `${h12}:${String(mm).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`
}

/** "2026-11-01T19:00" -> { ymd, hour } */
export function splitLocal(s) {
  const [ymd, t = '00:00'] = s.split('T')
  const [h, m] = t.split(':').map(Number)
  return { ymd, hour: h + m / 60 }
}

export function joinLocal(ymd, hour) {
  const hh = Math.floor(hour)
  const mm = Math.round((hour - hh) * 60)
  return `${ymd}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

/** Is the shop open right now, and when does that change? */
export function openStatus(hours, now = shopNow()) {
  const today = hours[now.dow]
  if (today && now.hour >= today[0] && now.hour < today[1]) return { open: true, at: today[1] }
  if (today && now.hour < today[0]) return { open: false, dayOffset: 0, at: today[0] }
  for (let i = 1; i <= 7; i++) {
    const h = hours[(now.dow + i) % 7]
    if (h) return { open: false, dayOffset: i, at: h[0], dow: (now.dow + i) % 7 }
  }
  return { open: false, dayOffset: null }
}

/** The next `count` days (starting today) on which the shop is open. */
export function openDays(hours, now = shopNow(), count = 8) {
  const days = []
  for (let i = 0; days.length < count && i < 30; i++) {
    const ymd = addDays(now.ymd, i)
    const h = hours[dowOf(ymd)]
    if (h) days.push({ ymd, dow: dowOf(ymd), hours: h })
  }
  return days
}

/**
 * Start times for a service on one day, every 30 minutes, ending early enough
 * to finish before closing. Same-day slots need one hour of notice. A few slots
 * are marked taken (deterministically) so the calendar looks lived-in.
 */
export function slotsFor(service, hours, ymd, now = shopNow()) {
  const h = hours[dowOf(ymd)]
  if (!h) return []
  const dur = (service.duration || 30) / 60
  const out = []
  for (let t = h[0]; t + dur <= h[1] + 1e-9; t += 0.5) {
    if (ymd === now.ymd && t < now.hour + 1) continue
    if (ymd < now.ymd) continue
    out.push({ start: joinLocal(ymd, t), hour: t, taken: hash(`${service.id}|${ymd}|${t}`) % 4 === 0 })
  }
  return out
}

/** Google Calendar "add event" link (opens in a new tab; no download needed). */
export function googleCalendarUrl({ title, start, end, details = '', location = '' }) {
  const fmt = (s) => s.replace(/[-:]/g, '') + '00'
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmt(start)}/${fmt(end || start)}`,
    ctz: SHOP_TZ,
    details,
    location,
  })
  return `https://calendar.google.com/calendar/render?${q.toString()}`
}

export const isPast = (endOrStart, now = shopNow()) => {
  const { ymd, hour } = splitLocal(endOrStart)
  return ymd < now.ymd || (ymd === now.ymd && hour < now.hour)
}
