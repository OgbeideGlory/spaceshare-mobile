// Some newer endpoints aren't fully described in the API docs, so we accept the usual shapes:
// { data: [...] }, { data: { <key>: [...] } } or { data: { items: [...] } }, plus pagination wherever it is.
export function listFrom(body, ...keys) {
  const data = body?.data
  if (Array.isArray(data)) return { items: data, pagination: body.pagination ?? null }
  for (const key of [...keys, 'items', 'results', 'docs']) {
    if (Array.isArray(data?.[key]))
      return { items: data[key], pagination: data.pagination ?? body.pagination ?? null }
  }
  return { items: [], pagination: data?.pagination ?? body?.pagination ?? null }
}

// Pagination objects come as { totalPages } or { pages }
export const totalPagesOf = (pagination) => pagination?.totalPages ?? pagination?.pages ?? 1
