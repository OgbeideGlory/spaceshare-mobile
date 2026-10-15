import { useQuery } from '@tanstack/react-query'
import { getOpeningHours } from '@/api/availability'

// A space's opening-hours rules (public). Shared by the space page, booking box and checkout.
export function useOpeningRules(workspaceId) {
  return useQuery({
    queryKey: ['availability', workspaceId, 'public'],
    queryFn: () => getOpeningHours(workspaceId),
    enabled: Boolean(workspaceId),
  })
}
