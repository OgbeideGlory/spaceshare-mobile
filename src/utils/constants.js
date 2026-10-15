// These must match the values the backend uses (see Swagger)

export const ROLES = {
  CUSTOMER: 'customer',
  HOST: 'host',
  ADMIN: 'admin',
  SUPER_ADMIN: 'superAdmin',
}

export const BOOKING_STATUS = {
  REQUESTED: 'requested', // waiting for the host to accept (request-to-book spaces, 24 hours)
  PENDING: 'pending', // created, waiting for payment (15 minutes)
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired', // not paid in time
  DECLINED: 'declined', // the host said no to the request
}

export const PAYMENT_STATUS = {
  NOT_REQUIRED: 'not_required',
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUND_PENDING: 'refund_pending',
  REFUNDED: 'refunded',
}

export const PRICE_UNITS = [
  { value: 'hour', label: 'Per hour' },
  { value: 'day', label: 'Per day' },
]

// The three space categories (the API's `type` field accepts any text, so we keep the list here).
// Agree these values with the backend + design teams.
export const WORKSPACE_TYPES = [
  { value: 'workspace', label: 'Work Space' },
  { value: 'studio', label: 'Content & Creative Studio' },
  { value: 'meeting_room', label: 'Meeting Space' },
]

export const CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan']

// The state each city is in (the API needs both)
export const CITY_STATES = {
  Lagos: 'Lagos',
  Abuja: 'FCT',
  'Port Harcourt': 'Rivers',
  Ibadan: 'Oyo',
}

// TODO: replace with SpaceShare's real support line
export const SUPPORT_PHONE = '+234 1234 5678'
export const SUPPORT_HOURS = '8AM - 6PM'

// TODO: replace with SpaceShare's real WhatsApp number (format: country code + number, no "+")
export const WHATSAPP_URL = 'https://wa.me/2340000000000'

// Neighbourhoods for the search "Locations" filter.
// The API has no area field, so we match these against each workspace's street address.
export const AREAS = {
  Lagos: [
    'Lekki',
    'Victoria Island',
    'Ikeja',
    'Yaba',
    'Ikoyi',
    'Surulere',
    'Ajah',
    'Maryland',
    'Gbagada',
  ],
  Abuja: ['Wuse', 'Garki', 'Maitama', 'Asokoro', 'Gwarinpa', 'Jabi'],
  'Port Harcourt': ['GRA', 'Trans Amadi', 'Rumuola', 'D-Line'],
  Ibadan: ['Bodija', 'Ring Road', 'Dugbe', 'Challenge'],
}

// How a space takes bookings
export const BOOKING_MODES = { INSTANT: 'instant', REQUEST: 'request' }
