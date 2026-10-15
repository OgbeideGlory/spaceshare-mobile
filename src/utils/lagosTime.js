import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

// Every SpaceShare space is in Nigeria, so booking times are always Lagos time (West Africa Time),
// even when the seeker's phone is set to London or New York.
//
// ⚠️ Different from the web app: the web uses dayjs's "timezone" plugin, but that plugin needs
// time-zone support (Intl) that the phone's JavaScript engine (Hermes) doesn't fully have, and every
// date came out as "Invalid Date". Lagos is always UTC+1 (Nigeria doesn't change its clocks), so we
// use a fixed +1 hour offset instead. Same functions, same results, and it works on every phone.
dayjs.extend(utc)

export const LAGOS = 'Africa/Lagos'
const LAGOS_OFFSET_MINUTES = 60 // UTC+1, all year

// A plain date like '2026-10-12' (no time)
const isPlainDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)

// '2026-10-12' + '10:00' as that clock time in Lagos.
// Read it as UTC, then take off Lagos's hour (10:00 in Lagos is 09:00 UTC). Doing the maths
// ourselves means the phone's own time zone can never change the answer.
const lagosWallTime = (date, time) =>
  dayjs
    .utc(`${date}T${time}:00`)
    .subtract(LAGOS_OFFSET_MINUTES, 'minute')
    .utcOffset(LAGOS_OFFSET_MINUTES)

// Any date (ISO string, Date, dayjs) shown in Lagos time.
// A plain '2026-10-12' is already a Lagos date, so it isn't shifted.
export function toLagos(value) {
  if (isPlainDate(value)) return lagosWallTime(value, '00:00')
  return dayjs(value).utcOffset(LAGOS_OFFSET_MINUTES)
}

export const lagosNow = () => dayjs().utcOffset(LAGOS_OFFSET_MINUTES)

// Today's date in Lagos: '2026-10-12'
export const lagosToday = () => lagosNow().format('YYYY-MM-DD')

// '2026-10-12' + '10:00' → 10am on that day in Lagos. '24:00' means midnight at the end of that day.
export function lagosDateTime(date, time) {
  if (time === '24:00') {
    const nextDay = dayjs(date).add(1, 'day').format('YYYY-MM-DD')
    return lagosWallTime(nextDay, '00:00')
  }
  return lagosWallTime(date, time)
}

export default dayjs
