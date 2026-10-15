import { useEffect, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import Button from '@/components/ui/Button'
import { COLORS } from '@/utils/colors'

// How long we keep checking before saying "this is taking longer than usual"
const GIVE_UP_AFTER_MS = 60 * 1000

// Shown when the payment went through but our API hasn't confirmed the booking yet.
// The screen using this keeps re-checking the booking in the background (refetchInterval).
export default function FinalisingNotice({ bookingId }) {
  const [tookTooLong, setTookTooLong] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setTookTooLong(true), GIVE_UP_AFTER_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <View accessibilityLiveRegion="polite" className="rounded-xl bg-gray-50 p-8">
      {!tookTooLong && <ActivityIndicator size="large" color={COLORS.primary} />}
      <Text className="mt-3 text-center text-lg font-semibold text-gray-900">
        {tookTooLong ? 'This is taking longer than usual' : 'Finalising your booking…'}
      </Text>
      <Text className="mt-2 text-center text-sm text-gray-700">
        {tookTooLong
          ? 'Your payment was received. Your booking will be confirmed shortly, and we’ll send you a notification when it is.'
          : 'Your payment was received. We’re confirming your booking. This usually takes a few seconds.'}
      </Text>
      {tookTooLong && (
        <Button
          href={bookingId ? `/bookings/${bookingId}` : '/bookings'}
          className="mt-6 self-center"
        >
          View my booking
        </Button>
      )}
    </View>
  )
}
