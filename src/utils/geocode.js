// Finds map coordinates for an address using OpenStreetMap's free Nominatim service.
// We use fetch here (not our API client) so the user's login token is never sent to OpenStreetMap.
// TODO: switch to Google's Geocoding API once we have a Maps key.

// Rough centre of each city, used if the exact address can't be found
const CITY_CENTRES = {
  Lagos: { latitude: 6.5244, longitude: 3.3792 },
  Abuja: { latitude: 9.0765, longitude: 7.3986 },
  'Port Harcourt': { latitude: 4.8156, longitude: 7.0498 },
  Ibadan: { latitude: 7.3775, longitude: 3.947 },
}

async function lookUp(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ng&q=${encodeURIComponent(query)}`
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) return null
  const [result] = await response.json()
  return result ? { latitude: Number(result.lat), longitude: Number(result.lon) } : null
}

// Returns { latitude, longitude, isApproximate }.
// isApproximate is true when we fell back to the city centre.
export async function findCoordinates(address, city) {
  try {
    const exact = await lookUp(`${address}, ${city}, Nigeria`)
    if (exact) return { ...exact, isApproximate: false }
  } catch {
    // network problem: fall through to the city centre
  }
  const centre = CITY_CENTRES[city] ?? CITY_CENTRES.Lagos
  return { ...centre, isApproximate: true }
}
