import dayjs from 'dayjs'
import { lagosDateTime, lagosNow } from './lagosTime'

// A "slot" is what the seeker wants to book: { date: '2026-10-12', start: '10:00', end: '12:00', guests: 2 }.
// It travels in the URL (?date=…&start=…&end=…&guests=…) from the space page to checkout,
// so it survives logging in and refreshing. Dates and times are Lagos time.

export const DURATION_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1} hour${i ? 's' : ''}`,
}))

export const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30, 50]

// Keeps the number of guests between 1 and what the space fits
export const clampGuests = (guests, capacity) =>
  Math.min(Math.max(1, guests || 1), capacity || Infinity)

// The guest numbers to offer for a space: the usual list up to its capacity, plus the capacity itself
export function guestOptionsFor(capacity) {
  if (!capacity) return GUEST_OPTIONS
  return [...new Set([...GUEST_OPTIONS.filter((n) => n <= capacity), capacity])]
}

export function defaultSlot() {
  return {
    date: lagosNow().add(1, 'day').format('YYYY-MM-DD'),
    start: '10:00',
    end: '12:00',
    guests: 1,
  }
}

// Checks for values typed or pasted into the URL.
// The format() check catches dates like 2026-02-31 that would roll over into March.
export const isValidDate = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') &&
  dayjs(value).isValid() &&
  dayjs(value).format('YYYY-MM-DD') === value
export const isValidTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/.test(value ?? '')
const isValidGuests = (value) => Number.isInteger(value) && value >= 1

// Reads the slot from route params, e.g. useLocalSearchParams() on the space screen.
// (The web reads them from the URL.) Anything missing or broken falls back to the default.
export function slotFromParams(params = {}) {
  const fallback = defaultSlot()
  const { date, start, end } = params
  const guests = Number(params.guests)
  return {
    date: isValidDate(date) ? date : fallback.date,
    start: isValidTime(start) && start !== '24:00' ? start : fallback.start,
    end: isValidTime(end) ? end : fallback.end,
    guests: isValidGuests(guests) ? guests : fallback.guests,
  }
}

// The slot as route params: router.push({ pathname: '/space/[id]', params: { id, ...slotToParams(slot) } })
export function slotToParams(slot) {
  return {
    date: slot.date,
    start: slot.start,
    end: slot.end,
    guests: String(slot.guests),
  }
}

// '2026-10-12' + '10:00' → that moment in Lagos. '24:00' means midnight at the end of that day.
export function toDateTime(date, time) {
  return lagosDateTime(date, time)
}

export const slotStart = (slot) => toDateTime(slot.date, slot.start)
export const slotEnd = (slot) => toDateTime(slot.date, slot.end)
export const slotHours = (slot) => slotEnd(slot).diff(slotStart(slot), 'minute') / 60

// End time after adding a number of hours to the start ('10:00' + 3 → '13:00'). null if it goes past midnight.
export function addHours(start, hours) {
  const [h, m] = start.split(':').map(Number)
  const total = h * 60 + m + hours * 60
  if (total > 24 * 60) return null
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// What's wrong with the slot, or '' if it's fine
export function slotProblem(slot) {
  if (!slot.date || !slot.start || !slot.end) return 'Pick a date and time'
  if (!isValidDate(slot.date)) return 'Pick a valid date'
  if (!isValidTime(slot.start) || !isValidTime(slot.end)) return 'Pick a valid start and end time'
  if (!isValidGuests(slot.guests)) return 'Pick how many people are coming'
  if (slotEnd(slot).diff(slotStart(slot), 'minute') <= 0)
    return 'End time must be after the start time'
  if (slotStart(slot).isBefore(dayjs())) return 'Pick a time in the future'
  return ''
}

// The price shown before booking. The API works out the real amount when the booking is made.
// Daily spaces are charged per started day.
export function estimatePrice(workspace, slot) {
  const rate = workspace?.pricing?.amount ?? 0
  const hours = Math.max(0, slotHours(slot))
  if (workspace?.pricing?.unit === 'day') {
    const days = Math.max(1, Math.ceil(hours / 24))
    return { rate, quantity: days, unitLabel: days === 1 ? 'day' : 'days', total: rate * days }
  }
  return { rate, quantity: hours, unitLabel: hours === 1 ? 'hour' : 'hours', total: rate * hours }
}
