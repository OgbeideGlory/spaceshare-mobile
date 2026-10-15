import { useQueries, useQuery } from '@tanstack/react-query'
import { getMyBookings } from '@/api/bookings'
import { getMyWorkspaces, getWorkspace } from '@/api/workspaces'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/utils/constants'

// The signed-in user's bookings (customers: their own; hosts: bookings for their spaces).
// Sometimes `booking.workspace` is only an ID; for those, the workspace is looked up so the
// name and photo can be shown. Hosts' own listings are loaded in one go (and shared with
// My Spaces); anything still missing is loaded one by one. TanStack Query caches them all.
export function useBookingsList() {
  const { user } = useAuth()
  const isHost = user?.role === ROLES.HOST
  const bookingsQuery = useQuery({ queryKey: ['bookings', 'mine'], queryFn: getMyBookings })
  const myWorkspacesQuery = useQuery({
    queryKey: ['workspaces', 'mine'],
    queryFn: getMyWorkspaces,
    enabled: isHost,
  })
  const bookings = bookingsQuery.data ?? []

  // The host's own listings, by ID
  const workspacesById = Object.fromEntries((myWorkspacesQuery.data ?? []).map((w) => [w._id, w]))

  // Workspace IDs we still need to load one by one. For hosts, wait until their listings
  // have loaded (or failed) so we don't fetch ones we're about to get anyway.
  const waitForMine = isHost && myWorkspacesQuery.isLoading
  const missingIds = waitForMine
    ? []
    : [
        ...new Set(
          bookings
            .map((b) => b.workspace)
            .filter((w) => typeof w === 'string' && !workspacesById[w]),
        ),
      ]
  const workspaceQueries = useQueries({
    queries: missingIds.map((id) => ({
      queryKey: ['workspace', id],
      queryFn: () => getWorkspace(id),
      retry: false, // a workspace that's no longer listed returns 404
    })),
  })
  missingIds.forEach((id, i) => {
    if (workspaceQueries[i].data) workspacesById[id] = workspaceQueries[i].data
  })

  return {
    bookings: bookings.map((booking) =>
      typeof booking.workspace === 'string'
        ? { ...booking, workspace: workspacesById[booking.workspace] ?? { _id: booking.workspace } }
        : booking,
    ),
    isLoading: bookingsQuery.isLoading,
    error: bookingsQuery.error,
    refetch: bookingsQuery.refetch,
  }
}
