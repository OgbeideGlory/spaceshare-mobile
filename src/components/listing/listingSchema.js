import { z } from 'zod'
import { lagosDateTime } from '@/utils/lagosTime'
import { AREAS, CITY_STATES } from '@/utils/constants'
import { DAYS } from './listingOptions'

// The five steps, and which form fields each one checks before moving on
export const STEPS = [
  {
    label: 'Basics',
    title: 'Fill your Space Details',
    subtitle:
      'Renters filter by location and amenities. The more accurate this is, the better your bookings.',
    fields: ['name', 'type', 'activities', 'description'],
  },
  {
    label: 'Details',
    title: 'Where is it? And what is inside?',
    subtitle:
      'Renters filter by location and amenities. The more accurate this is, the better your bookings.',
    fields: ['address', 'city', 'capacity', 'amenities', 'equipment'],
  },
  {
    label: 'Photos',
    title: 'Let your space do the talking',
    subtitle:
      "Seekers can't visit before they book. Clear photos build the trust that turns a scroll into a booking.",
    fields: [], // photos are checked separately (they're files, not form values)
  },
  {
    label: 'Pricing & Availability',
    title: 'Set your rate and opening hours',
    subtitle: 'You stay in control of what you earn and when your space is open.',
    fields: [
      'pricingUnit',
      'pricingAmount',
      'openingTime',
      'closingTime',
      'openDays',
      'blockedDates',
    ],
  },
  {
    label: 'Review',
    title: 'One last look before you go live.',
    subtitle:
      'Review your details before you publish. You can still edit after publishing. Just tap any section to make changes.',
    fields: ['agreedToTerms'],
  },
]

export const defaultListingValues = {
  name: '',
  type: '',
  activities: [],
  description: '',
  address: '',
  city: 'Lagos',
  neighborhood: '',
  capacity: 1,
  amenities: [],
  equipment: [],
  pricingUnit: 'hour',
  pricingAmount: undefined,
  openingTime: '08:00',
  closingTime: '19:00',
  openDays: [1, 2, 3, 4, 5], // Monday to Friday
  bookingMode: 'instant',
  blockedDates: [],
  agreedToTerms: false,
}

// The rules match what the API accepts (see Swagger: CreateWorkspaceRequest)
export const listingSchema = z
  .object({
    // Step 1
    name: z.string().trim().min(3, 'Name must be at least 3 characters').max(150),
    type: z.string().min(1, 'Choose a category'),
    activities: z.array(z.string()).min(1, 'Pick at least one activity'),
    description: z
      .string()
      .trim()
      .min(20, 'Describe your space in at least 20 characters')
      .max(2000, 'Keep it under 2,000 characters'),

    // Step 2
    address: z.string().trim().min(5, 'Enter the street address').max(300),
    city: z.string().min(1, 'Choose a city'),
    neighborhood: z.string(),
    capacity: z.number({ error: 'Enter a number' }).int().min(1, 'At least 1 person'),
    amenities: z.array(z.string()),
    equipment: z.array(z.string()).min(1, 'Pick the equipment included, or "No equipment"'),

    // Step 4
    pricingUnit: z.enum(['hour', 'day']),
    pricingAmount: z.number({ error: 'Enter your rate' }).min(0, "Rate can't be negative"),
    openingTime: z.string(),
    closingTime: z.string(),
    openDays: z.array(z.number()).min(1, 'Pick at least one day'),
    bookingMode: z.enum(['instant', 'request']),
    blockedDates: z.array(z.string()),

    // Step 5
    agreedToTerms: z.literal(true, { error: 'Please confirm before publishing' }),
  })
  // "19:00" > "08:00" works because the times are always HH:MM
  .refine((values) => values.closingTime > values.openingTime, {
    message: 'Closing time must be after opening time',
    path: ['closingTime'],
  })

// Turns the form values into the body for POST /api/workspaces
export function toWorkspacePayload(values, coordinates) {
  return {
    name: values.name.trim(),
    type: values.type,
    description: values.description.trim(),
    capacity: values.capacity,
    // TODO: the API has no separate "equipment" field yet, so equipment is saved as amenities
    amenities: [...values.amenities, ...values.equipment.filter((item) => item !== 'No equipment')],
    activities: values.activities,
    bookingMode: values.bookingMode, // 'instant' or 'request' (host approves each booking)
    pricing: { amount: values.pricingAmount, unit: values.pricingUnit },
    location: {
      type: 'Point',
      coordinates: [coordinates.longitude, coordinates.latitude], // the API wants longitude first
      address: values.address.trim(),
    },
    city: values.city,
    // The area seekers search by. The exact address stays hidden until a booking is confirmed.
    neighborhood: areaFor(values.city, values.neighborhood),
    state: CITY_STATES[values.city] ?? values.city,
    country: 'Nigeria',
  }
}

// The area only if it belongs to the chosen city (it could be left over from another city)
export function areaFor(city, neighborhood) {
  return AREAS[city]?.includes(neighborhood) ? neighborhood : undefined
}

// One opening-hours rule per open day, e.g. { type: 'recurring', dayOfWeek: 1, startTime: '08:00', endTime: '19:00' }
export function toAvailabilityRules(values) {
  return DAYS.filter((day) => values.openDays.includes(day.dayOfWeek)).map((day) => ({
    type: 'recurring',
    dayOfWeek: day.dayOfWeek,
    startTime: values.openingTime,
    endTime: values.closingTime,
  }))
}

// A blocked date ("2026-10-01") becomes a full day in Lagos time (where every space is)
export function toBlockedPeriod(date) {
  const start = lagosDateTime(date, '00:00')
  return {
    startDateTime: start.toISOString(),
    endDateTime: start.add(1, 'day').toISOString(),
    reason: 'Day off',
  }
}
