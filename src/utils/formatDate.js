import dayjs from 'dayjs'
import { toLagos } from './lagosTime'

// All times are shown in Lagos time, where the spaces are.
// Bad or missing values show as '' instead of "Invalid Date".
const format = (value, pattern) =>
  value && dayjs(value).isValid() ? toLagos(value).format(pattern) : ''

// formatDate('2026-10-12T10:00:00.000Z') → "Mon, 12 Oct 2026"
export const formatDate = (value) => format(value, 'ddd, D MMM YYYY')

// formatTime('2026-10-12T10:00:00.000Z') → "11:00 AM" (Lagos time)
export const formatTime = (value) => format(value, 'h:mm A')

// formatDateTime(...) → "Mon, 12 Oct 2026 · 11:00 AM"
export const formatDateTime = (value) => `${formatDate(value)} · ${formatTime(value)}`

// Any other pattern, e.g. formatAs(booking.startTime, 'ddd D MMM') → "Mon 12 Oct"
export const formatAs = (value, pattern) => format(value, pattern)
