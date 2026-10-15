import { useQuery } from '@tanstack/react-query'
import { getUnreadNotifications } from '@/api/notifications'
import { useAuth } from './useAuth'

// The signed-in user's unread notifications (for the bell's dot).
// The web gets new ones from a live stream, which phones don't have. Instead we check every minute
// while the app is open, and again whenever the app comes back to the front (see app/_layout.jsx).
export function useUnreadNotifications() {
  const { user } = useAuth()
  const { data = [] } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: getUnreadNotifications,
    enabled: Boolean(user),
    refetchInterval: 60 * 1000,
  })
  return data
}
