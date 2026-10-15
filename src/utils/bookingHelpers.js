import dayjs from 'dayjs'
import { isPaid } from './isPaid'
import { lagosNow, toLagos } from './lagosTime'

// "Today", "Tomorrow", "In 6 days", "In 3 hours"
export function timeUntil(date) {
  // Counted in Lagos days, so "Tomorrow" means tomorrow where the space is
  const start = toLagos(date)
  const now = lagosNow()
  if (start.isBefore(now)) return 'Now'
  const days = start.startOf('day').diff(now.startOf('day'), 'day')
  if (days === 0) {
    const hours = start.diff(now, 'hour')
    return hours <= 1 ? 'Within the hour' : `In ${hours} hours`
  }
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

// "Yaba, Lagos". Skips repeats like "Lagos, Lagos".
export function areaOf(workspace) {
  return [
    ...new Set([workspace?.neighborhood, workspace?.city, workspace?.state].filter(Boolean)),
  ].join(', ')
}

// A Google Maps directions link. The API stores coordinates as [longitude, latitude].
export function directionsLink(workspace) {
  const coordinates = workspace?.location?.coordinates
  if (coordinates?.length === 2) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coordinates[1]},${coordinates[0]}`
  }
  const address = [workspace?.location?.address, areaOf(workspace)].filter(Boolean).join(', ')
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
}

// Which tab a booking belongs in
export function bookingTab(booking) {
  if (['cancelled', 'expired', 'declined'].includes(booking.status)) return 'cancelled'
  // Never paid (or never accepted) and its time has run out: it will never happen
  const ranOut =
    dayjs(booking.endTime).isBefore(dayjs()) ||
    (booking.expiresAt && dayjs(booking.expiresAt).isBefore(dayjs()))
  if (['pending', 'requested'].includes(booking.status) && !isPaid(booking) && ranOut)
    return 'cancelled'
  if (booking.status === 'completed' || dayjs(booking.endTime).isBefore(dayjs())) return 'past'
  return 'upcoming'
}

// A booking (or a request the host hasn't answered) can be cancelled while it hasn't started yet
export function canCancel(booking) {
  return (
    ['requested', 'pending', 'confirmed'].includes(booking.status) &&
    dayjs(booking.startTime).isAfter(dayjs())
  )
}
