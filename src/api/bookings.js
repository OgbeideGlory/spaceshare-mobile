import client from './client'

// Customers get their own bookings; hosts get bookings for their workspaces.
// The API sends them all at once (no pages), sorted by start time.
export const getMyBookings = () => client.get('/api/bookings').then((res) => res.data.data.bookings)

export const getBooking = (id) =>
  client.get(`/api/bookings/${id}`).then((res) => res.data.data?.booking ?? null)

// body: { workspaceId, startTime, endTime, guestCount }. Times are ISO strings.
// Paid bookings start as "pending" and must be paid within 15 minutes.
// A 409 error means the slot is no longer free.
export const createBooking = (body) =>
  client.post('/api/bookings', body).then((res) => res.data.data.booking)

export const cancelBooking = (id) =>
  client.patch(`/api/bookings/${id}/cancel`).then((res) => res.data.data.booking)

// Host only, after the booking's end time
export const completeBooking = (id) =>
  client.patch(`/api/bookings/${id}/complete`).then((res) => res.data.data.booking)

// Host only. bookingCode is the 12-character code the guest shows (it's also inside their QR code).
export const checkInBooking = (bookingCode) =>
  client.post('/api/bookings/check-in', { bookingCode }).then((res) => res.data.data.booking)

// Host only, for spaces where guests request to book (bookingMode 'request')
export const acceptBooking = (id) =>
  client.patch(`/api/bookings/${id}/accept`).then((res) => res.data.data?.booking ?? res.data.data)
export const declineBooking = (id) =>
  client.patch(`/api/bookings/${id}/decline`).then((res) => res.data.data?.booking ?? res.data.data)
