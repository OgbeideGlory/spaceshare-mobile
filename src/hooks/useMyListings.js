import { useQuery } from '@tanstack/react-query'
import { getMyWorkspaces } from '@/api/workspaces'

// What the host sees on each listing card. The API's status, plus "paused" for live listings
// the host has stopped taking bookings for.
export function listingStatusOf(workspace) {
  if (workspace.status === 'approved')
    return workspace.isAvailable === false ? 'paused' : 'published'
  if (workspace.status === 'pending') return 'review'
  return workspace.status // 'changes_requested', 'rejected' or 'suspended'
}

// All the signed-in host's listings, whatever their status, each with a `listingStatus`
export function useMyListings() {
  const query = useQuery({ queryKey: ['workspaces', 'mine'], queryFn: getMyWorkspaces })
  const listings = (query.data ?? []).map((w) => ({ ...w, listingStatus: listingStatusOf(w) }))

  return { listings, isLoading: query.isLoading, error: query.error, refetch: query.refetch }
}
