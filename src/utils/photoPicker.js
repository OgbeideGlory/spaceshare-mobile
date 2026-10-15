import * as ImagePicker from 'expo-image-picker'

// Picking photos on the phone (the web uses <input type="file">).
// Every photo comes back as { uri, width, height, mimeType, fileSize, fileName }.

const OPTIONS = {
  mediaTypes: ['images'],
  // iPhones often store photos as HEIC, which the API doesn't take. "Compatible" plus a quality
  // setting makes the picker hand back a JPEG instead (and a smaller file, under the 5 MB limit).
  preferredAssetRepresentationMode:
    ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  quality: 0.85,
}

// Choose photos from the gallery. limit: how many more photos are allowed.
// Returns the picked photos ([] if they cancelled).
export async function pickPhotos({ limit = 1, square = false } = {}) {
  const result = await ImagePicker.launchImageLibraryAsync({
    ...OPTIONS,
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    // Cropping only works with one photo at a time
    ...(square && limit === 1 && { allowsEditing: true, aspect: [1, 1] }),
  })
  return result.canceled ? [] : result.assets
}

// Take a new photo with the camera. Returns [photo], or [] if they cancelled or said no.
export async function takePhoto() {
  const permission = await ImagePicker.requestCameraPermissionsAsync()
  if (!permission.granted) return []
  const result = await ImagePicker.launchCameraAsync(OPTIONS)
  return result.canceled ? [] : result.assets
}

// What FormData needs for a file on a phone: { uri, name, type } (on the web it's a File)
export function toUploadFile(photo, fallbackName = 'photo.jpg') {
  return {
    uri: photo.uri,
    name: photo.fileName ?? fallbackName,
    type: photo.mimeType ?? 'image/jpeg',
  }
}
