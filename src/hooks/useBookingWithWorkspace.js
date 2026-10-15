import { useQuery } from '@tanstack/react-query'
import { getBooking } from '@/api/bookings'
import { getWorkspace } from '@/api/workspaces'

// Loads one booking. If the API only sends the workspace's ID, loads the workspace too.
// options are passed to the booking's useQuery (e.g. { refetchInterval: 3000 }).
export function useBookingWithWorkspace(bookingId, options = {}) {
  const bookingQuery = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const booking = await getBooking(bookingId)
      // No booking in the answer: show the page's normal error instead of crashing
      if (!booking) throw new Error('We couldn’t find this booking.')
      return booking
    },
    ...options,
  })
  const rawWorkspace = bookingQuery.data?.workspace
  const workspaceId = typeof rawWorkspace === 'string' ? rawWorkspace : null

  const workspaceQuery = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => getWorkspace(workspaceId),
    enabled: Boolean(workspaceId),
    retry: false,
  })

  const booking = bookingQuery.data
    ? {
        ...bookingQuery.data,
        workspace: workspaceId ? (workspaceQuery.data ?? { _id: workspaceId }) : rawWorkspace,
      }
    : null

  return {
    booking,
    isLoading: bookingQuery.isLoading,
    isFetching: bookingQuery.isFetching,
    error: bookingQuery.error,
    refetch: bookingQuery.refetch,
  }
}
