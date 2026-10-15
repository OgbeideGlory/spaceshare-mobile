import dayjs from 'dayjs'
import { toLagos } from '@/utils/lagosTime'
import { DAYS, TIME_OPTIONS, timeLabel } from '@/components/listing/listingOptions'

// The API marks rules as status 'active' / 'inactive'
export const isActive = (rule) => rule.status !== 'inactive' && rule.isActive !== false

// Turns the API's weekly rules ([{ type: 'recurring', dayOfWeek: 1, startTime: '08:00', endTime: '19:00' }, …])
// into the simple shape our forms use: { openingTime, closingTime, openDays: [1, 2, …] }.
// Returns null when there are no weekly rules.
export function summariseOpeningHours(rules = []) {
  const weekly = rules.filter((r) => r.type === 'recurring' && isActive(r))
  if (weekly.length === 0) return null
  const starts = weekly.map((r) => r.startTime).sort()
  const ends = weekly.map((r) => r.endTime).sort()
  return {
    openingTime: starts[0],
    closingTime: ends[ends.length - 1],
    openDays: [...new Set(weekly.map((r) => r.dayOfWeek))].sort(),
  }
}

// "Mon, Tues, Wed · 08:00AM – 07:00PM"
export function openingHoursText(hours) {
  if (!hours) return ''
  const days = DAYS.filter((d) => hours.openDays.includes(d.dayOfWeek)).map((d) => d.short)
  return `${days.join(', ')} · ${timeLabel(hours.openingTime)} – ${timeLabel(hours.closingTime)}`
}

// When the space is open on one date ('2026-10-12'): { open: '09:00', close: '17:00' }.
// A rule for that exact date wins over the weekly rule. null = closed that day.
// undefined = we don't know (no rules loaded), so don't limit anything.
export function hoursOnDate(rules, date) {
  const active = (rules ?? []).filter(isActive)
  if (active.length === 0) return undefined
  const forDate = active.filter(
    (r) => r.type === 'specific_date' && toLagos(r.date).format('YYYY-MM-DD') === date,
  )
  const weekday = dayjs(date).day()
  const todays = forDate.length
    ? forDate
    : active.filter((r) => r.type === 'recurring' && r.dayOfWeek === weekday)
  if (todays.length === 0) return null
  return {
    open: todays.map((r) => r.startTime).sort()[0],
    // The latest closing time (slice(-1)[0] is the last item; works on every phone)
    close: todays
      .map((r) => r.endTime)
      .sort()
      .slice(-1)[0],
  }
}

// The start times someone can pick on that date (every half hour while the space is open).
// Always keeps `current` so a time that came from the URL still shows.
export function startTimeOptions(hours, current) {
  const all = TIME_OPTIONS.slice(0, -1)
  if (!hours) return all
  return all.filter((t) => (t.value >= hours.open && t.value < hours.close) || t.value === current)
}
