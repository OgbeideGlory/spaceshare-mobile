import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { ArrowRight } from 'lucide-react-native'
import StatusBadge from '@/components/ui/StatusBadge'
import UserAvatar from '@/components/ui/UserAvatar'
import { COLORS } from '@/utils/colors'
import { formatDate, formatTime } from '@/utils/formatDate'
import EmptyCard from './EmptyCard'

// The dashboard's "Upcoming bookings" (the web's phone layout: one small card per booking).
// Every card opens the booking, where requests can be accepted or declined.
export default function UpcomingBookingsTable({ bookings }) {
  if (bookings.length === 0) {
    return (
      <EmptyCard
        title="No bookings yet"
        text="Once your listing is live, bookings will show here"
      />
    )
  }

  return (
    <View className="gap-2">
      {bookings.map((booking) => (
        <Pressable
          key={booking._id}
          onPress={() =>
            router.push({ pathname: '/host/bookings/[id]', params: { id: booking._id } })
          }
          className="flex-row items-center gap-3 rounded-md border border-gray-200 px-3 py-3 active:bg-gray-50"
        >
          <UserAvatar user={booking.user} size={32} />
          <View className="flex-1">
            {/* user/workspace may be a full object or just an ID, depending on the API */}
            <Text numberOfLines={1} className="text-sm text-gray-900">
              {booking.user?.name ?? 'Guest'}
            </Text>
            {Boolean(booking.workspace?.name) && (
              <Text numberOfLines={1} className="text-xs text-gray-500">
                {booking.workspace.name}
              </Text>
            )}
            <Text className="text-xs text-gray-500">
              {formatDate(booking.startTime)}, {formatTime(booking.startTime)}
            </Text>
          </View>
          <StatusBadge status={booking.status} className="px-2" />
          <ArrowRight size={14} color={COLORS.primary} />
        </Pressable>
      ))}
    </View>
  )
}
