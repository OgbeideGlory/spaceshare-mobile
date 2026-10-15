import { ROLES } from './constants'

const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPER_ADMIN]
export const isAdmin = (role) => ADMIN_ROLES.includes(role)

// Each role's dashboard: where they land after logging in
export function dashboardFor(role) {
  if (role === ROLES.HOST) return '/host'
  if (role === ROLES.CUSTOMER) return '/bookings'
  if (isAdmin(role)) return '/admin'
  return '/'
}

// Which part of the app a page belongs to
function areaOf(pathname) {
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/host')) return 'host'
  return 'customer'
}
const areaForRole = (role) => (isAdmin(role) ? 'admin' : role === ROLES.HOST ? 'host' : 'customer')

// Where to send someone after login. If they were sent to /login from another page
// (e.g. "Book this space"), go back there, but only if that page is for their role.
// Otherwise someone could land on another role's page and be bounced away.
export function afterLoginPath(role, from) {
  const dashboard = dashboardFor(role)
  if (!from?.pathname) return dashboard
  if (areaOf(from.pathname) !== areaForRole(role)) return dashboard
  // Hosts and admins only go back to pages in their own area; seekers can return to public pages too
  return `${from.pathname}${from.search ?? ''}`
}
