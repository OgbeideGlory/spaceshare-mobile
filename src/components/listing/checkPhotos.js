import { MAX_PHOTO_SIZE_MB, MIN_PHOTO_WIDTH, PHOTO_TYPES } from './listingOptions'

// Photo checks shared by "List your space" and "Edit listing".
// A photo here is what expo-image-picker gives back: { uri, width, height, mimeType, fileSize, fileName }.
// (The web version had to open each file to read its width. The picker tells us directly.)

// A name to show in messages (the picker doesn't always give one)
const nameOf = (photo) => photo.fileName || 'This photo'

// Checks one photo. Returns '' when it's fine, or a message saying what's wrong.
function checkPhoto(photo) {
  if (photo.mimeType && !PHOTO_TYPES.includes(photo.mimeType)) {
    return `${nameOf(photo)} isn't a JPG, PNG or WEBP image.`
  }
  if (photo.fileSize && photo.fileSize > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
    return `${nameOf(photo)} is bigger than ${MAX_PHOTO_SIZE_MB} MB.`
  }
  if (photo.width < MIN_PHOTO_WIDTH) {
    return `${nameOf(photo)} is too small. Photos must be at least ${MIN_PHOTO_WIDTH}px wide.`
  }
  return ''
}

// Checks every picked photo. Returns the good ones, plus a message for each one left out.
export function checkPhotos(photos) {
  const good = []
  const problems = []
  for (const photo of photos) {
    const problem = checkPhoto(photo)
    if (problem) problems.push(problem)
    else good.push(photo)
  }
  return { good, problems }
}

// True when two picked photos are the same one. The picker gives a new file address (uri) each
// time, so we also compare the gallery's own ID for the photo (assetId) when there is one.
export const isSamePhoto = (a, b) =>
  a.uri === b.uri || (Boolean(a.assetId) && a.assetId === b.assetId)
