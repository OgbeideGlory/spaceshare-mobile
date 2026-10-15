import dayjs from 'dayjs'
import * as Calendar from 'expo-calendar/legacy'

// Dates in the format calendars expect: 20261012T090000Z
const calendarDate = (date) =>
  dayjs(date)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')

// event: { title, start, end, location, details }
// Open it with Linking.openURL(googleCalendarLink(event))
export function googleCalendarLink(event) {
  const params = {
    action: 'TEMPLATE',
    text: event.title,
    dates: `${calendarDate(event.start)}/${calendarDate(event.end)}`,
    location: event.location ?? '',
    details: event.details ?? '',
  }
  const query = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')
  return `https://calendar.google.com/calendar/render?${query}`
}

// Opens the phone's own "New event" screen, filled in. Works with Apple and Google calendars.
// (The web downloads an .ics file instead.) Uses expo-calendar's older API, because the
// new one doesn't work in Expo Go yet. No calendar permission is needed for this.
export function addToPhoneCalendar(event) {
  return Calendar.createEventInCalendarAsync({
    title: event.title,
    startDate: new Date(event.start),
    endDate: new Date(event.end),
    location: event.location,
    notes: event.details,
  })
}
