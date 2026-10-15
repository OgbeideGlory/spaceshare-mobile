import { Redirect } from 'expo-router'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/utils/constants'
import { isAdmin } from '@/utils/dashboardFor'

// The start screen: sends each person to their own area (like the web's dashboardFor).
// Signed-out visitors start on the landing page (Explore), like the website.
export default function Start() {
  const { user } = useAuth()

  if (!user) return <Redirect href="/explore" />
  if (user.role === ROLES.HOST) return <Redirect href="/host" />
  if (isAdmin(user.role)) return <Redirect href="/admin" />
  return <Redirect href="/explore" />
}
