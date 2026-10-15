import { Linking, Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Image } from 'expo-image'
import { sizedImage } from '@/components/workspace/imageUrl'
import { areaOf, directionsLink, timeUntil } from '@/utils/bookingHelpers'
import { formatAs, formatTime } from '@/utils/formatDate'

// The big green "Your next booking" card
export default function NextBookingCard({ booking }) {
  const { workspace } = booking
  const image = workspace?.images?.[0]?.url

  return (
    <View className="rounded-xl bg-accent p-4">
      <Text className="text-xs text-white">
        Your next booking {'   '}• {timeUntil(booking.startTime)}
      </Text>

      <View className="mt-4 flex-row items-center gap-3">
        <View className="size-14 overflow-hidden rounded-md bg-white/20">
          {Boolean(image) && (
            <Image
              source={sizedImage(image, 200)}
              contentFit="cover"
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </View>
        <View className="flex-1">
          <Text numberOfLines={1} className="text-base font-medium text-white">
            {workspace?.name ?? 'Your workspace'}
          </Text>
          <Text className="mt-1 text-[11px] text-white">
            {formatAs(booking.startTime, 'ddd D MMM')} {'  •  '}
            {formatTime(booking.startTime)} to {formatTime(booking.endTime)}
            {areaOf(workspace) ? `  •  ${areaOf(workspace)}` : ''}
          </Text>
        </View>
      </View>

      <View className="mt-5 flex-row gap-3">
        <Pressable
          onPress={() => router.push({ pathname: '/bookings/[id]', params: { id: booking._id } })}
          className="flex-1 rounded-md bg-white py-2 active:bg-gray-100"
        >
          <Text className="text-center text-xs text-gray-900">View details</Text>
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL(directionsLink(workspace))}
          className="flex-1 rounded-md border border-white/70 py-2 active:bg-white/10"
        >
          <Text className="text-center text-xs text-white">Get directions</Text>
        </Pressable>
      </View>
    </View>
  )
}
