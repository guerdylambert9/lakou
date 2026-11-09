import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import { SHOPS, PRODUCTS, SERVICES, EVENTS, REVIEWS, OWNER_SHOP_ID } from '../data/seed.js'
import { translate } from '../i18n.js'
import { shopNow, openDays, joinLocal, shopTotals, pickupCode, addDays, nextWeekday } from './logic.js'

// App state for the prototype. In production each slice maps to a database table
// (see the brief's data model); here it lives in memory and in this browser only.

const STORAGE_KEY = 'lakou-demo-v2'

/** Gives events with a relative `when` real dates, counted from today. */
function datedEvents(today) {
  return EVENTS.map((e) => {
    if (!e.when) return e
    const { when, ...rest } = e
    const ymd = addDays(nextWeekday(today, when.dow, 1), 7 * when.weeks)
    return { ...rest, start: joinLocal(ymd, when.start), end: joinLocal(ymd, when.end) }
  })
}

/**
 * During a visit the sample shop can take the owner's own shop name, so they see
 * their shop in the app. It lives only in this browser and "Reset demo" clears it.
 */
function personalize(shop, demo) {
  if (!demo || shop.id !== OWNER_SHOP_ID) return shop
  return {
    ...shop,
    name: demo.name || shop.name,
    area: demo.area || shop.area,
    practitioner: { title: demo.person ? demo.title : '', name: demo.person || '', bio: '' },
    personalized: true,
  }
}

/** The demo customer. "Initials only" controls what shops see. */
export const CUSTOMER = { id: 'you', name: 'Anne Joseph', initials: 'A. J.' }

function line(productId, qty) {
  const p = PRODUCTS.find((x) => x.id === productId)
  return { productId, name: p.name, price: p.price, qty }
}

function seedOrder(id, shopId, customerName, lines, method, status, createdAt, customerId = 'other') {
  const totals = shopTotals(lines.map((l) => ({ product: { price: l.price }, qty: l.qty })), method)
  return { id, shopId, customerId, customerName, lines, method, discreet: true, totals, status, createdAt, code: pickupCode(id) }
}

function initialState() {
  const now = shopNow()
  const ginen = SHOPS.find((s) => s.id === OWNER_SHOP_ID)
  const next = openDays(ginen.hours, now, 5).filter((d) => d.ymd > now.ymd)
  const d1 = next[0].ymd
  const d2 = next[1].ymd
  const readingDay = addDays(now.ymd, -3)
  return {
    v: 2,
    lang: 'en',
    mode: 'customer',
    demoShop: null,
    products: PRODUCTS,
    services: SERVICES,
    events: datedEvents(now.ymd),
    cart: [],
    methods: {},
    discreet: true,
    initialsOnly: true,
    neutralNotes: true,
    orders: [
      seedOrder('A-1042', 'ginen', 'M. J.', [line('p3', 1), line('p1', 2)], 'pickup', 'placed', now.ymd),
      seedOrder('A-1041', 'ginen', 'R. P.', [line('p4', 1), line('p5', 1)], 'ship', 'placed', now.ymd),
      seedOrder('A-1038', 'ginen', 'Anonymous', [line('p2', 3)], 'pickup', 'ready', now.ymd),
      seedOrder('A-0991', 'etwal', CUSTOMER.initials, [line('p12', 2)], 'ship', 'completed', '2026-10-05', 'you'),
    ],
    bookings: [
      { id: 'B-280', serviceId: 's1', shopId: 'ginen', customerId: 'you', customerName: CUSTOMER.initials, start: joinLocal(readingDay, 15), format: 'in_person', status: 'completed', price: 40 },
      { id: 'B-301', serviceId: 's1', shopId: 'ginen', customerId: 'c3', customerName: 'S. L.', start: joinLocal(d1, 14), format: 'in_person', status: 'confirmed', price: 40 },
      { id: 'B-302', serviceId: 's1', shopId: 'ginen', customerId: 'c4', customerName: 'D. A.', start: joinLocal(d2, 11), format: 'video', status: 'confirmed', price: 40 },
      { id: 'B-303', serviceId: 's2', shopId: 'ginen', customerId: 'c5', customerName: 'K. M.', start: joinLocal(d2, 15), format: 'in_person', status: 'confirmed', price: 85 },
      { id: 'B-304', serviceId: 's3', shopId: 'ginen', customerId: 'c6', customerName: 'R. P.', preferred: [d1, d2], note: 'After my reading last week.', status: 'requested', price: null },
      { id: 'B-305', serviceId: 's4', shopId: 'ginen', customerId: 'c7', customerName: 'Anonymous', note: 'I would like to talk about kanzo next year.', status: 'inquiry', price: null },
    ],
    invites: [{ id: 'I-12', eventId: 'e6', customerId: 'c8', customerName: 'J. B.', status: 'requested' }],
    attendance: [],
    recommendations: [
      {
        id: 'R-1',
        shopId: 'ginen',
        customerId: 'you',
        date: readingDay,
        note: 'From our reading: the items we talked about, and a bath when you are ready.',
        items: [
          { productId: 'p3', qty: 1 },
          { productId: 'p1', qty: 2 },
        ],
        services: ['s2'],
        status: 'new',
      },
    ],
    toast: null,
    sheet: null,
  }
}

function load() {
  const fresh = initialState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return fresh
    const saved = JSON.parse(raw)
    if (saved.v !== fresh.v) return fresh
    return { ...fresh, ...saved, toast: null, sheet: null }
  } catch {
    return fresh
  }
}

function save(state) {
  try {
    const { toast, sheet, ...rest } = state
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
  } catch {
    /* storage can be unavailable (private mode, previews); the demo still works */
  }
}

const upd = (list, id, patch) => list.map((x) => (x.id === id ? { ...x, ...patch } : x))

function reducer(s, a) {
  switch (a.type) {
    case 'set':
      return { ...s, ...a.patch }
    case 'cart/add': {
      const existing = s.cart.find((c) => c.productId === a.productId)
      const cart = existing
        ? s.cart.map((c) => (c.productId === a.productId ? { ...c, qty: c.qty + a.qty } : c))
        : [...s.cart, { productId: a.productId, qty: a.qty }]
      return { ...s, cart }
    }
    case 'cart/qty':
      return {
        ...s,
        cart: a.qty <= 0 ? s.cart.filter((c) => c.productId !== a.productId) : s.cart.map((c) => (c.productId === a.productId ? { ...c, qty: a.qty } : c)),
      }
    case 'cart/method':
      return { ...s, methods: { ...s.methods, [a.shopId]: a.method } }
    case 'order/place': {
      const sold = {}
      for (const o of a.orders) for (const l of o.lines) sold[l.productId] = (sold[l.productId] || 0) + l.qty
      const products = s.products.map((p) => (sold[p.id] ? { ...p, stock: Math.max(0, p.stock - sold[p.id]) } : p))
      return { ...s, orders: [...a.orders, ...s.orders], cart: [], products }
    }
    case 'order/update':
      return { ...s, orders: upd(s.orders, a.id, a.patch) }
    case 'booking/add':
      return { ...s, bookings: [a.booking, ...s.bookings] }
    case 'booking/update':
      return { ...s, bookings: upd(s.bookings, a.id, a.patch) }
    case 'invite/add':
      return { ...s, invites: [a.invite, ...s.invites] }
    case 'invite/update':
      return { ...s, invites: upd(s.invites, a.id, a.patch) }
    case 'attend':
      return { ...s, attendance: [a.entry, ...s.attendance] }
    case 'event/add':
      return { ...s, events: [...s.events, a.event] }
    case 'product/add':
      return { ...s, products: [a.product, ...s.products] }
    case 'product/update':
      return { ...s, products: upd(s.products, a.id, a.patch) }
    case 'service/update':
      return { ...s, services: upd(s.services, a.id, a.patch) }
    case 'rec/add':
      return { ...s, recommendations: [a.rec, ...s.recommendations] }
    case 'rec/update':
      return { ...s, recommendations: upd(s.recommendations, a.id, a.patch) }
    case 'toast':
      return { ...s, toast: { msg: a.msg, id: Date.now() } }
    case 'reset':
      return { ...initialState(), lang: s.lang, mode: s.mode }
    default:
      return s
  }
}

const AppCtx = createContext(null)

export function AppProvider({ children }) {
  const [s, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    save(s)
  }, [s])

  useEffect(() => {
    if (!s.toast) return undefined
    const t = setTimeout(() => dispatch({ type: 'set', patch: { toast: null } }), 2800)
    return () => clearTimeout(t)
  }, [s.toast])

  const t = useCallback((key, vars) => translate(s.lang, key, vars), [s.lang])

  const value = useMemo(() => {
    const shops = SHOPS.map((x) => personalize(x, s.demoShop))
    const shop = (id) => shops.find((x) => x.id === id)
    const product = (id) => s.products.find((x) => x.id === id)
    const service = (id) => s.services.find((x) => x.id === id)
    const event = (id) => s.events.find((x) => x.id === id)
    return {
      s,
      dispatch,
      t,
      lang: s.lang,
      shops,
      reviews: REVIEWS,
      shop,
      product,
      service,
      event,
      customerLabel: s.initialsOnly ? CUSTOMER.initials : CUSTOMER.name,
      toast: (msg) => dispatch({ type: 'toast', msg }),
      openSheet: (type, id, extra) => dispatch({ type: 'set', patch: { sheet: { type, id, ...extra } } }),
      closeSheet: () => dispatch({ type: 'set', patch: { sheet: null } }),
      cartCount: s.cart.reduce((n, c) => n + c.qty, 0),
    }
  }, [s, t])

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export const useApp = () => useContext(AppCtx)
