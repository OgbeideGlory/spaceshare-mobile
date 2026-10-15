// Photos are stored on Cloudinary, which can resize them on the fly.
// sizedImage(url, 800) asks for an 800px-wide, auto-compressed copy (much smaller to download).
// Other URLs are returned unchanged.
export function sizedImage(url, width = 800) {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url
  return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`)
}
