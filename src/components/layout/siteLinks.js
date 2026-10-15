import { CATEGORY_TYPES } from '@/utils/searchLinks'

// Links shared by the home navbar and the header's phone menu.
// Each link is something router.push() understands.
export const CATEGORY_LINKS = [
  { label: 'Workspaces', href: { pathname: '/search', params: { type: CATEGORY_TYPES.work } } },
  {
    label: 'Meeting Space',
    href: { pathname: '/search', params: { type: CATEGORY_TYPES.meeting } },
  },
  {
    label: 'Creative Studio',
    href: { pathname: '/search', params: { type: CATEGORY_TYPES.creative } },
  },
]

export const LIST_SPACE_LINK = { pathname: '/register', params: { role: 'host' } }
