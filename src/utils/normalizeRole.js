import { ROLES } from './constants'

// The API docs spell the roles customer / host / admin / superAdmin, but accounts created
// in other ways may come back as e.g. "superadmin" or "super_admin". Map them all to one spelling
// so every role check in the app works.
const ROLE_BY_KEY = {
  customer: ROLES.CUSTOMER,
  host: ROLES.HOST,
  admin: ROLES.ADMIN,
  superadmin: ROLES.SUPER_ADMIN,
}

export function normalizeRole(role) {
  if (!role) return role
  const key = String(role)
    .toLowerCase()
    .replace(/[\s_-]/g, '')
  return ROLE_BY_KEY[key] ?? role
}

// Also makes sure `_id` is set (some responses use `id`), so "is this me?" checks always work
export const withNormalizedRole = (user) =>
  user ? { ...user, _id: user._id ?? user.id, role: normalizeRole(user.role) } : user
