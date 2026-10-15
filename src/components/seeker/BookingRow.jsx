import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Image } from 'expo-image'
import StatusBadge from '@/components/ui/StatusBadge'
import { sizedImage } from '@/components/workspace/imageUrl'
import { areaOf, canCancel } from '@/utils/bookingHelpers'
import { formatAs, formatTime } from '@/utils/formatDate'
import { canStillPay } from '@/utils/isPaid'

function Action({ onPress, primary, disabled, children }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`rounded-md border px-2.5 py-1.5 ${primary ? 'border-primary bg-primary active:bg-primary-dark' : 'border-gray-300 active:bg-gray-50'} ${disabled ? 'opacity-60' : ''}`}
    >
      <Text className={`text-[11px] ${primary ? 'text-white' : 'text-gray-900'}`}>{children}</Text>
    </Pressable>
  )
}

// One booking in the "My bookings" list
export default function BookingRow({ booking, onCancel, onPay, isPaying, first }) {
  const { workspace } = booking
  const image = workspace?.images?.[0]?.url
  // Only while the 15-minute hold is still running
  const isUnpaid = canStillPay(booking)
  const openDetails = (params = {}) =>
    router.push({ pathname: '/bookings/[id]', params: { id: booking._id, ...params } })

  return (
    <View className={`gap-3 px-3 py-4 ${first ? '' : 'border-t border-gray-200'}`}>
      <View className="flex-row items-center gap-3">
        <View className="size-10 overflow-hidden rounded-sm bg-gray-200">
          {Boolean(image) && (
            <Image
              source={sizedImage(image, 200)}
              contentFit="cover"
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </View>
        <View className="flex-1">
          <Text numberOfLines={1} className="text-[11px] text-gray-700">
            <Text onPress={() => openDetails()} className="font-medium text-gray-900">
              {workspace?.name ?? 'Workspace'}
            </Text>
            {areaOf(workspace) ? ` • ${areaOf(workspace)}` : ''}
          </Text>
          <Text className="mt-0.5 text-[11px] text-gray-800">
            {formatAs(booking.startTime, 'ddd D MMM')} • {formatTime(booking.startTime)} to{' '}
            {formatTime(booking.endTime)}
            {booking.bookingCode ? ` • ${booking.bookingCode}` : ''}
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap items-center gap-2">
        <StatusBadge
          status={booking.status}
          className="rounded-full"
          boxClassName={booking.status === 'pending' ? 'bg-amber-100' : undefined}
          textClassName={booking.status === 'pending' ? 'text-amber-700' : undefined}
        />
        <View className="ml-auto flex-row flex-wrap justify-end gap-2">
          {isUnpaid && (
            <Action primary onPress={() => onPay(booking)} disabled={isPaying}>
              {isPaying ? 'Opening…' : 'Complete payment'}
            </Action>
          )}
          <Action onPress={() => openDetails()}>View details</Action>
          {canCancel(booking) && <Action onPress={() => onCancel(booking)}>Cancel</Action>}
          {booking.status === 'completed' && (
            <Action onPress={() => openDetails({ review: '1' })}>Leave a review</Action>
          )}
        </View>
      </View>
    </View>
  )
}
