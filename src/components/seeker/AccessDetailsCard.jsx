import { useState } from 'react'
import { Linking, Pressable, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useQuery } from '@tanstack/react-query'
import { KeyRound, QrCode } from 'lucide-react-native'
import { getBooking } from '@/api/bookings'
import { COLORS } from '@/utils/colors'

// "Access details": what the guest shows when they arrive
export default function AccessDetailsCard({ booking }) {
  const [showQr, setShowQr] = useState(false)
  // Booking lists don't include the QR image, so load the single booking when it's asked for
  const { data: fullBooking, isLoading: qrLoading } = useQuery({
    queryKey: ['booking', booking._id],
    queryFn: () => getBooking(booking._id),
    enabled: showQr && !booking.qrCode,
  })
  const qrCode = booking.qrCode ?? fullBooking?.qrCode
  // TODO: the API has no messaging. We show the host's phone when the booking includes it.
  const host = typeof booking.host === 'object' ? booking.host : null

  return (
    <View className="rounded-xl border border-gray-200 p-5">
      <View className="flex-row items-center gap-3">
        <KeyRound size={20} color={COLORS.accent} />
        <Text className="text-sm text-gray-900">Access details</Text>
      </View>

      <Text className="mt-5 text-xs text-gray-600">Booking reference</Text>
      <Text className="mt-1 text-base font-semibold text-accent">{booking.bookingCode ?? '—'}</Text>

      <Text className="mt-5 text-xs text-gray-600">Check in</Text>
      <Text className="mt-1 text-xs text-gray-800">
        Show your reference or QR code at reception
      </Text>

      {Boolean(booking.bookingCode) && (
        <View className="mt-3">
          <Pressable
            onPress={() => setShowQr(!showQr)}
            accessibilityState={{ expanded: showQr }}
            className="flex-row items-center gap-2 self-start"
          >
            <QrCode size={16} color={COLORS.primary} />
            <Text className="text-xs font-medium text-primary">
              {showQr ? 'Hide QR code' : 'Show QR code'}
            </Text>
          </Pressable>
          {showQr && qrLoading && (
            <Text className="mt-3 text-xs text-gray-600">Loading QR code…</Text>
          )}
          {showQr && qrCode && (
            <Image
              source={qrCode}
              accessibilityLabel={`QR code for booking ${booking.bookingCode}`}
              contentFit="contain"
              style={{ width: 144, height: 144, marginTop: 12 }}
            />
          )}
        </View>
      )}

      {Boolean(host?.phone) && (
        <Text
          onPress={() => Linking.openURL(`tel:${host.phone}`)}
          className="mt-5 text-xs font-medium text-gray-900"
        >
          Call host ({host.name})
        </Text>
      )}
    </View>
  )
}
