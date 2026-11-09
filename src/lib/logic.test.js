import { describe, it, expect } from 'vitest'
import {
  price, money, isSellable, cartLines, groupByShop, shopTotals, cartTotals, methodFor, payout,
  openStatus, openDays, slotsFor, hourLabel, googleCalendarUrl, dowOf, addDays, isPast,
} from './logic.js'
import { PRODUCTS, SHOPS, SERVICES } from '../data/seed.js'

const ginen = SHOPS.find((s) => s.id === 'ginen')
const reading = SERVICES.find((s) => s.id === 's1')
const bath = SERVICES.find((s) => s.id === 's2')

describe('money', () => {
  it('drops cents only when they are zero', () => {
    expect(price(9)).toBe('$9')
    expect(price(9.5)).toBe('$9.50')
    expect(price(1284)).toBe('$1,284')
    expect(money(27.8)).toBe('$27.80')
  })
})

describe('what can be bought online', () => {
  it('blocks in-store, sacred and sold-out items', () => {
    expect(isSellable(PRODUCTS.find((p) => p.id === 'p1'))).toBe(true)
    expect(isSellable(PRODUCTS.find((p) => p.id === 'p6'))).toBe(false) // kleren, 21+, in store only
    expect(isSellable(PRODUCTS.find((p) => p.id === 'p8'))).toBe(false) // sacred
    expect(isSellable({ ...PRODUCTS[0], stock: 0 })).toBe(false)
  })
})

describe('cart totals', () => {
  const cart = [
    { productId: 'p1', qty: 2 }, // $18, ginen
    { productId: 'p13', qty: 1 }, // $15 fresh leaves, fey-vet, pickup only
    { productId: 'p14', qty: 1 }, // $6, fey-vet
  ]
  const groups = groupByShop(cartLines(cart, PRODUCTS))

  it('groups lines by shop in order', () => {
    expect(groups.map((g) => g.shopId)).toEqual(['ginen', 'fey-vet'])
  })

  it('adds flat shipping and 7% tax per shop', () => {
    expect(shopTotals(groups[0].lines, 'ship')).toEqual({ subtotal: 18, shipping: 7.95, tax: 1.26, total: 27.21 })
    expect(shopTotals(groups[0].lines, 'pickup').shipping).toBe(0)
  })

  it('falls back to pickup when an item cannot ship', () => {
    expect(methodFor(groups[1], { 'fey-vet': 'ship' })).toBe('pickup')
    expect(methodFor(groups[0], { ginen: 'ship' })).toBe('ship')
  })

  it('sums every shop', () => {
    const t = cartTotals(groups, { ginen: 'ship', 'fey-vet': 'ship' })
    expect(t.subtotal).toBe(39)
    expect(t.shipping).toBe(7.95)
    expect(t.total).toBe(round(39 + 7.95 + 1.26 + 1.47))
  })
})

describe('payouts', () => {
  it('keeps 90% of product sales and 85% of bookings', () => {
    expect(payout(100, 'product')).toBe(90)
    expect(payout(40, 'service')).toBe(34)
  })
})

describe('shop hours', () => {
  it('knows the day of week', () => {
    expect(dowOf('2026-10-22')).toBe(4) // Thursday
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
  })

  it('is open on Thursday afternoon and closed on Sunday', () => {
    expect(openStatus(ginen.hours, { ymd: '2026-10-22', dow: 4, hour: 15 })).toEqual({ open: true, at: 19 })
    const sunday = openStatus(ginen.hours, { ymd: '2026-10-25', dow: 0, hour: 12 })
    expect(sunday.open).toBe(false)
    expect(sunday.dayOffset).toBe(1)
    expect(sunday.at).toBe(10)
  })

  it('lists only open days', () => {
    const days = openDays(ginen.hours, { ymd: '2026-10-24', dow: 6, hour: 9 }, 3)
    expect(days.map((d) => d.ymd)).toEqual(['2026-10-24', '2026-10-26', '2026-10-27'])
  })

  it('labels hours', () => {
    expect(hourLabel(10)).toBe('10 AM')
    expect(hourLabel(19.5)).toBe('7:30 PM')
    expect(hourLabel(12)).toBe('12 PM')
  })
})

describe('booking slots', () => {
  const now = { ymd: '2026-10-22', dow: 4, hour: 15.2 }

  it('needs an hour of notice today', () => {
    const slots = slotsFor(reading, ginen.hours, '2026-10-22', now)
    expect(slots[0].hour).toBe(16.5)
  })

  it('ends early enough to finish before closing', () => {
    const slots = slotsFor(bath, ginen.hours, '2026-10-23', now) // Friday, closes at 8 PM
    const last = slots[slots.length - 1]
    expect(last.hour + bath.duration / 60).toBeLessThanOrEqual(20)
  })

  it('has no slots on a closed day or in the past', () => {
    expect(slotsFor(reading, ginen.hours, '2026-10-25', now)).toEqual([])
    expect(slotsFor(reading, ginen.hours, '2026-10-21', now)).toEqual([])
  })
})

describe('calendar', () => {
  it('builds a Google Calendar link in shop time', () => {
    const url = googleCalendarUrl({ title: 'Fèt Gede', start: '2026-11-01T19:00', end: '2026-11-01T23:00' })
    expect(url).toContain('dates=20261101T190000%2F20261101T230000')
    expect(url).toContain('ctz=America%2FNew_York')
  })

  it('knows past events', () => {
    expect(isPast('2026-11-01T23:00', { ymd: '2026-11-02', hour: 9 })).toBe(true)
    expect(isPast('2026-11-01T23:00', { ymd: '2026-10-22', hour: 9 })).toBe(false)
  })
})

function round(n) {
  return Math.round(n * 100) / 100
}

describe('relative sample dates', () => {
  it('finds the next weekday after today', async () => {
    const { nextWeekday } = await import('./logic.js')
    expect(nextWeekday('2026-10-26', 5)).toBe('2026-10-30') // Monday -> Friday
    expect(nextWeekday('2026-10-30', 5)).toBe('2026-11-06') // Friday -> next Friday
    expect(nextWeekday('2026-10-31', 0)).toBe('2026-11-01') // Saturday -> Sunday
  })
})
