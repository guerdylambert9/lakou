import { dayShort, monthShort } from '../i18n.js'
import { dowOf, hourLabel, splitLocal, addDays } from './logic.js'

/** "Sun, Nov 1" in English, "Dim 1 Nov" in Kreyòl. */
export function fmtDay(lang, ymd) {
  const [, m, d] = ymd.split('-').map(Number)
  const dow = dayShort(lang, dowOf(ymd))
  return lang === 'kr' ? `${dow} ${d} ${monthShort(lang, m - 1)}` : `${dow}, ${monthShort(lang, m - 1)} ${d}`
}

/** "Sun, Nov 1 · 7 PM" */
export function fmtWhen(lang, start) {
  const { ymd, hour } = splitLocal(start)
  return `${fmtDay(lang, ymd)} · ${hourLabel(hour)}`
}

/** "Sun, Nov 1 · 7 PM – 11 PM" (end may fall after midnight) */
export function fmtRange(lang, start, end) {
  const a = splitLocal(start)
  if (!end) return fmtWhen(lang, start)
  const b = splitLocal(end)
  return `${fmtDay(lang, a.ymd)} · ${hourLabel(a.hour)} – ${hourLabel(b.hour)}`
}

/** Short relative day word for owner schedules: "Today", "Tomorrow" or the date. */
export function fmtRelDay(lang, ymd, todayYmd, t) {
  if (ymd === todayYmd) return capital(t('today'))
  if (ymd === addDays(todayYmd, 1)) return capital(t('tomorrow'))
  return fmtDay(lang, ymd)
}

export const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1)

/** "Manbo Evelyne D." — empty when the shop hasn't named its practitioner. */
export const whoAt = (sh) => `${sh.practitioner.title || ''} ${sh.practitioner.name || ''}`.trim()

/** Joins the parts that exist: "Little Haiti · Manbo Evelyne D." */
export const joinDot = (...parts) => parts.filter(Boolean).join(' · ')

/** Where an event happens, worded for the viewer. */
export function placeOf(e, sh, t) {
  if (e.kind === 'virtual') return t('onlineLink')
  if (e.kind === 'invite') return t('sharedWithGuests')
  return e.place || `${sh.name}, ${sh.area}`
}
