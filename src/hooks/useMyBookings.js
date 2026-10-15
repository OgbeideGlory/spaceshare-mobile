import dayjs from 'dayjs'
import { bookingTab } from '@/utils/bookingHelpers'
import { useBookingsList } from './useBookingsList'

// The customer's bookings sorted into Upcoming / Past / Cancelled
export function useMyBookings() {
  const { bookings, isLoading, error, refetch } = useBookingsList()

  const byStart = (a, b) => dayjs(a.startTime).diff(dayjs(b.startTime))
  const upcoming = bookings.filter((b) => bookingTab(b) === 'upcoming').sort(byStart)
  const past = bookings.filter((b) => bookingTab(b) === 'past').sort((a, b) => byStart(b, a))
  const cancelled = bookings
    .filter((b) => bookingTab(b) === 'cancelled')
    .sort((a, b) => byStart(b, a))

  return {
    isLoading,
    error,
    refetch,
    upcoming,
    past,
    cancelled,
    // The next confirmed booking gets the big green card
    nextBooking: upcoming.find((b) => b.status === 'confirmed') ?? null,
  }
}
