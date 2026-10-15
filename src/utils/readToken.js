// Reads the token from a reset-password link (spaceshare://reset-password?token=…).
// Some email apps mangle links: "token=abc" arrives as "token=3Dabc" ("=3D" is how "=" is written
// inside raw emails). Our tokens are 64 hex characters, so drop a stray leading "3D" when that's the case.
// Pass the `token` route param: readToken(useLocalSearchParams().token)
export function readToken(value) {
  const token = String(value ?? '').trim()
  if (/^3D[0-9a-f]{64}$/i.test(token)) return token.slice(2)
  return token
}
