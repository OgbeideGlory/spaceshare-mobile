import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Camera, Circle, CircleCheck, ImagePlus, Plus, Trash2 } from 'lucide-react-native'
import { COLORS } from '@/utils/colors'
import { pickPhotos, takePhoto } from '@/utils/photoPicker'
import { checkPhotos, isSamePhoto } from '../checkPhotos'
import { MAX_PHOTOS, MIN_PHOTO_WIDTH } from '../listingOptions'

const PHOTO_TIPS = [
  'The main space, in daylight',
  'Your gear and equipment',
  'The entrance and how guests arrive',
  'Restroom and changing area',
]

// Photos are picked with the phone's photo picker, so they're kept in the screen's state
// (not React Hook Form). photos[0] is the cover photo.
export default function PhotosStep({ photos, onChange, error, onError }) {
  const [tipsDone, setTipsDone] = useState([]) // just a checklist for the host; not saved
  const spaceLeft = MAX_PHOTOS - photos.length

  // Adds photos from the gallery (or the camera), checking each one like the web does
  async function addPhotos(fromCamera = false) {
    if (spaceLeft <= 0) return onError(`You can add up to ${MAX_PHOTOS} photos.`)
    const chosen = fromCamera ? await takePhoto() : await pickPhotos({ limit: spaceLeft })
    // Skip photos that are already added
    const fresh = chosen.filter((photo) => !photos.some((p) => isSamePhoto(p, photo)))
    if (fresh.length === 0) return
    // Add the photos that pass the checks, and say why any others were left out
    const { good, problems } = checkPhotos(fresh.slice(0, spaceLeft))
    onError(problems.join(' '))
    if (good.length) onChange([...photos, ...good])
  }

  function removePhoto(index) {
    onChange(photos.filter((_, i) => i !== index))
  }

  // Moves a photo to the front, so it becomes the cover
  function makeCover(index) {
    const reordered = [...photos]
    const [moved] = reordered.splice(index, 1)
    onChange([moved, ...reordered])
  }

  const [cover, ...others] = photos

  return (
    <View>
      {/* Cover photo */}
      <View className="h-48 overflow-hidden rounded-lg bg-gray-400">
        {cover ? (
          <>
            <Image
              source={cover.uri}
              accessibilityLabel="Cover photo"
              contentFit="cover"
              style={{ width: '100%', height: '100%' }}
            />
            <Pressable
              onPress={() => removePhoto(0)}
              accessibilityLabel="Remove cover photo"
              className="absolute right-4 top-4 size-8 items-center justify-center rounded-full bg-white"
            >
              <Trash2 size={16} color={COLORS.gray900} />
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={() => addPhotos()}
            accessibilityRole="button"
            accessibilityLabel="Add photos"
            className="flex-1 items-center justify-center gap-2 px-6"
          >
            <ImagePlus size={32} strokeWidth={1.5} color={COLORS.white} />
            <Text className="text-center text-sm text-white">
              JPG or PNG, at least {MIN_PHOTO_WIDTH}px wide.
            </Text>
          </Pressable>
        )}
        <Text className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs">
          Cover Photo
        </Text>
      </View>

      {/* The other photos: tap to make cover */}
      <View className="mt-4 flex-row flex-wrap gap-3">
        {others.map((photo, i) => {
          const index = i + 1 // position in the full photos list
          return (
            <View
              key={photo.uri}
              style={{ width: '31%', aspectRatio: 6 / 5 }}
              className="overflow-hidden rounded-lg bg-gray-400"
            >
              <Pressable
                onPress={() => makeCover(index)}
                accessibilityLabel={`Make photo ${index + 1} the cover`}
                className="flex-1"
              >
                <Image
                  source={photo.uri}
                  contentFit="cover"
                  style={{ width: '100%', height: '100%' }}
                />
              </Pressable>
              <Pressable
                onPress={() => removePhoto(index)}
                accessibilityLabel={`Remove photo ${index + 1}`}
                className="absolute right-1.5 top-1.5 size-7 items-center justify-center rounded-full bg-white/90"
              >
                <Trash2 size={14} color={COLORS.gray900} />
              </Pressable>
            </View>
          )
        })}

        {cover && spaceLeft > 0 && (
          <Pressable
            onPress={() => addPhotos()}
            style={{ width: '31%', aspectRatio: 6 / 5 }}
            className="items-center justify-center gap-1 rounded-lg bg-gray-400 px-1 active:bg-gray-500"
          >
            <Plus size={22} color={COLORS.white} />
            <Text className="text-center text-xs text-white">Add up to {MAX_PHOTOS} photos</Text>
          </Pressable>
        )}
      </View>

      {/* Changed for mobile: hosts can take photos with the camera too */}
      {spaceLeft > 0 && (
        <Pressable
          onPress={() => addPhotos(true)}
          className="mt-4 flex-row items-center gap-2 self-start rounded-md border border-gray-300 px-3 py-2 active:bg-gray-50"
        >
          <Camera size={16} color={COLORS.gray900} />
          <Text className="text-sm text-gray-900">Take a photo</Text>
        </Pressable>
      )}

      {Boolean(error) && <Text className="mt-3 text-sm text-red-600">{error}</Text>}
      <Text className="mt-4 text-sm text-primary">Tap any photo to make it your cover</Text>

      <View className="mt-8">
        <Text className="text-base font-medium text-gray-900">Shots that win bookings</Text>
        <View className="mt-3 gap-2">
          {PHOTO_TIPS.map((tip) => {
            const done = tipsDone.includes(tip)
            return (
              <Pressable
                key={tip}
                onPress={() =>
                  setTipsDone(done ? tipsDone.filter((t) => t !== tip) : [...tipsDone, tip])
                }
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done }}
                className="flex-row items-center gap-2"
              >
                {done ? (
                  <CircleCheck size={18} color={COLORS.green600} />
                ) : (
                  <Circle size={18} color={COLORS.gray800} />
                )}
                <Text className="text-sm text-gray-800">{tip}</Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    </View>
  )
}
