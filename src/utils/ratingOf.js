// The API's search results now include rating data. The exact field names aren't documented,
// so this accepts the common shapes: { rating: { average, count } }, { averageRating, reviewCount }, or { rating: 4.5 }.
// Returns { average, count }, or null when there are no ratings yet.
export function ratingOf(workspace) {
  const rating = workspace?.rating
  const average =
    rating?.average ?? workspace?.averageRating ?? (typeof rating === 'number' ? rating : null)
  const count = rating?.count ?? workspace?.reviewCount ?? workspace?.ratingCount ?? 0
  if (!average) return null
  return { average: Number(average), count }
}
