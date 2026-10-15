// Search filters (copied from the web app; the web keeps them in the URL, mobile keeps them in state).
//
// Most filters are sent to the API (see toApiFilters). A few are checked again here on the phone,
// for what the API can't do in one request: several areas at once, a capacity range's upper limit,
// and amenities (the API has no amenity filter).

export const CAPACITY_RANGES = [
  { key: '1-5', label: '1 - 5 people', min: 1, max: 5 },
  { key: '6-10', label: '6 - 10 people', min: 6, max: 10 },
  { key: '11-20', label: '11 - 20 people', min: 11, max: 20 },
  { key: '21+', label: '21 + people', min: 21, max: Infinity },
]

// The filters before the seeker picks anything. On mobile, filters live in the screen's state
// (not the URL like the web), e.g. const [filters, setFilters] = useState(DEFAULT_FILTERS)
export const DEFAULT_FILTERS = {
  // search bar
  type: '',
  city: '',
  date: '',
  duration: 2,
  people: 1,
  // filter panel
  areas: [],
  capacity: [],
  amenities: [],
  minPrice: null,
  maxPrice: null,
  // 'hour' or 'day' when the seeker picked one (home "Preferred Rate" or the filter panel),
  // '' when they didn't. When picked, only spaces charged that way are shown.
  priceUnit: '',
}

// How many filter-panel filters are switched on (the number next to "Filters")
export function countActiveFilters(filters) {
  return (
    filters.areas.length +
    filters.capacity.length +
    filters.amenities.length +
    (filters.minPrice !== null || filters.maxPrice !== null ? 1 : 0) +
    (filters.priceUnit ? 1 : 0)
  )
}

// Filters from route params, e.g. a home page category: router.push({ pathname: '/search', params: { type: 'studio' } })
export function filtersFromParams(params = {}) {
  return {
    ...DEFAULT_FILTERS,
    type: params.type ?? '',
    city: params.city ?? '',
    date: params.date ?? '',
    priceUnit: ['hour', 'day'].includes(params.priceUnit) ? params.priceUnit : '',
  }
}

// The same filters with the filter panel cleared (the search bar stays as it is)
export function withoutFilters(filters) {
  const { type, city, date, duration, people } = filters
  return { ...DEFAULT_FILTERS, type, city, date, duration, people }
}

// The filters the API understands, e.g. { city: 'Lagos', neighborhood: 'Yaba', minCapacity: 6 }
export function toApiFilters(filters) {
  const api = {}
  if (filters.type) api.type = filters.type
  if (filters.city) api.city = filters.city
  // The API takes one area. With several picked, they're matched in the browser instead.
  if (filters.areas.length === 1) api.neighborhood = filters.areas[0]

  // Smallest number of people the space must fit: the guests in the search bar,
  // or the lowest capacity range ticked, whichever is bigger
  const rangeMins = CAPACITY_RANGES.filter((r) => filters.capacity.includes(r.key)).map(
    (r) => r.min,
  )
  const minCapacity = Math.max(filters.people, rangeMins.length ? Math.min(...rangeMins) : 1)
  if (minCapacity > 1) api.minCapacity = minCapacity

  // The API reads a price range in this unit (it assumes per hour if we don't say)
  if (filters.priceUnit) api.priceUnit = filters.priceUnit
  if (filters.minPrice !== null || filters.maxPrice !== null) {
    api.priceUnit = filters.priceUnit || 'hour'
    if (filters.minPrice !== null) api.minPrice = filters.minPrice
    if (filters.maxPrice !== null) api.maxPrice = filters.maxPrice
  }
  return api
}

export function applyFilters(workspaces, filters) {
  return workspaces.filter((workspace) => {
    const capacity = workspace.capacity ?? 0
    const price = workspace.pricing?.amount ?? 0
    // The API hides exact addresses in search results, so areas match on the neighbourhood
    const place = [
      workspace.neighborhood,
      workspace.location?.address,
      workspace.city,
      workspace.state,
    ]
      .join(' ')
      .toLowerCase()
    const amenities = workspace.amenities ?? []

    if (capacity < filters.people) return false
    if (filters.areas.length && !filters.areas.some((area) => place.includes(area.toLowerCase())))
      return false
    if (
      filters.capacity.length &&
      !CAPACITY_RANGES.filter((r) => filters.capacity.includes(r.key)).some(
        (r) => capacity >= r.min && capacity <= r.max,
      )
    )
      return false
    if (!filters.amenities.every((amenity) => amenities.includes(amenity))) return false
    // "Hourly" / "Daily" picked: only spaces charged that way
    if (filters.priceUnit && workspace.pricing?.unit !== filters.priceUnit) return false
    // Price is filtered by the API. Double-check only spaces charged in the same unit
    // (the API may convert daily rates to hourly, so others are left to it).
    if (workspace.pricing?.unit === (filters.priceUnit || 'hour')) {
      if (filters.minPrice !== null && price < filters.minPrice) return false
      if (filters.maxPrice !== null && price > filters.maxPrice) return false
    }
    return true
  })
}
