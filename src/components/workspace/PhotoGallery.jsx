import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { ArrowRight, ImageOff, X } from 'lucide-react-native'
import { COLORS } from '@/utils/colors'
import { sizedImage } from './imageUrl'

// One big photo + two small ones underneath (the web's phone layout)
export function PhotoGallery({ images = [], name }) {
  const [main, ...others] = images

  if (!main) {
    return (
      <View className="h-60 items-center justify-center rounded-xl bg-gray-200">
        <ImageOff size={32} color={COLORS.gray400} />
      </View>
    )
  }

  return (
    <View className="gap-3">
      <Image
        source={sizedImage(main.url, 1600)}
        accessibilityLabel={name}
        contentFit="cover"
        transition={200}
        style={{ height: 240, borderRadius: 12 }}
      />
      {others.length > 0 && (
        <View className="flex-row gap-3">
          {others.slice(0, 2).map((image, i) => (
            <Image
              key={image.publicId ?? image.url}
              source={sizedImage(image.url, 800)}
              accessibilityLabel={`${name}, photo ${i + 2}`}
              contentFit="cover"
              transition={200}
              style={{ flex: 1, height: 112, borderRadius: 12 }}
            />
          ))}
        </View>
      )}
    </View>
  )
}

// "View all photos" and the full-screen list it opens
export function AllPhotosButton({ images = [], name }) {
  const [open, setOpen] = useState(false)

  if (images.length < 2) return null

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-2 rounded-md bg-primary-light/70 px-6 py-2"
      >
        <Text className="text-sm text-primary">View all photos</Text>
        <ArrowRight size={14} color={COLORS.primary} />
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaProvider>
          <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center justify-between px-4 py-3">
              <Text className="flex-1 text-base font-medium text-gray-900" numberOfLines={1}>
                {name} · {images.length} photos
              </Text>
              <Pressable
                onPress={() => setOpen(false)}
                hitSlop={10}
                accessibilityLabel="Close photos"
              >
                <X size={22} color={COLORS.gray800} />
              </Pressable>
            </View>
            <ScrollView contentContainerClassName="gap-3 px-4 pb-8">
              {images.map((image, i) => (
                <Image
                  key={image.publicId ?? image.url}
                  source={sizedImage(image.url, 1200)}
                  accessibilityLabel={`${name}, photo ${i + 1}`}
                  contentFit="cover"
                  transition={200}
                  style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 8 }}
                />
              ))}
            </ScrollView>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </>
  )
}
