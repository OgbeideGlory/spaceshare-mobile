import { useEffect, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { CircleAlert, CircleX } from 'lucide-react-native'
import { verifyPayment } from '@/api/payments'
import FinalisingNotice from '@/components/checkout/FinalisingNotice'
import AppScreen from '@/components/layout/AppScreen'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { COLORS } from '@/utils/colors'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { isFinalising, isPaid } from '@/utils/isPaid'

// While Paystack is still processing, ask again every 3 seconds for about a minute
const POLL_EVERY_MS = 3000
const MAX_POLLS = 20

// Only these mean the payment definitely didn't go through
const isFailed = (data) =>
  ['failed', 'abandoned'].includes(data?.payment?.status) ||
  data?.booking?.paymentStatus === 'failed'

// Paystack is still working on it (e.g. a bank transfer that hasn't landed yet)
const isProcessing = (data) =>
  data?.payment?.status === 'pending' && !isPaid(data?.booking) && !isFailed(data)

// Paystack sends the seeker back here: spaceshare://paystack/callback?reference=…
// (also opened by the payment screen when the in-app browser returns a reference).
// We ask our API whether the payment went through, then show the confirmation.
export default function PaymentCallbackScreen() {
  const params = useLocalSearchParams()
  const reference = params.reference ?? params.trxref

  const { data, isLoading, error } = useQuery({
    queryKey: ['payment', reference],
    queryFn: () => verifyPayment(reference),
    enabled: Boolean(reference),
    retry: 3, // Paystack can take a moment to confirm (the API answers 402 until it does)
    retryDelay: POLL_EVERY_MS,
    // Still processing, or paid but the booking isn't confirmed yet: keep checking
    refetchInterval: (query) =>
      (isProcessing(query.state.data) || isFinalising(query.state.data?.booking)) &&
      query.state.dataUpdateCount < MAX_POLLS
        ? POLL_EVERY_MS
        : false,
  })

  if (isLoading && reference) {
    return (
      <AppScreen>
        <Spinner label="Confirming your payment…" />
      </AppScreen>
    )
  }

  const rawBooking = data?.payment?.booking
  const bookingId =
    rawBooking?._id ?? (typeof rawBooking === 'string' ? rawBooking : null) ?? data?.booking?._id

  if (isFinalising(data?.booking)) {
    return (
      <AppScreen>
        <FinalisingNotice bookingId={bookingId} />
      </AppScreen>
    )
  }
  if (isPaid(data?.booking) && bookingId) {
    return <Redirect href={`/bookings/${bookingId}/confirmation`} />
  }
  if (isPaid(data?.booking)) {
    // Paid, but the API didn't tell us which booking: send them to their list
    return (
      <AppScreen>
        <View className="rounded-xl bg-gray-50 p-8">
          <Text className="text-center text-lg font-semibold text-gray-900">Payment received</Text>
          <Text className="mt-2 text-center text-sm text-gray-700">Your booking is confirmed.</Text>
          <Button href="/bookings" className="mt-6 self-center">
            My bookings
          </Button>
        </View>
      </AppScreen>
    )
  }
  if (isProcessing(data)) {
    return (
      <AppScreen>
        <StillProcessing bookingId={bookingId} />
      </AppScreen>
    )
  }

  const failed = isFailed(data)
  const holdEnded = ['expired', 'cancelled'].includes(data?.booking?.status)

  return (
    <AppScreen>
      <View className="items-center rounded-xl bg-gray-50 p-8">
        {failed ? (
          <CircleX size={40} color={COLORS.red500} />
        ) : (
          <CircleAlert size={40} color="#f59e0b" />
        )}
        <Text className="mt-3 text-center text-lg font-semibold text-gray-900">
          {failed ? 'Your payment wasn’t completed' : 'We couldn’t confirm your payment yet'}
        </Text>
        <Text className="mt-2 text-center text-sm text-gray-700">
          {!reference
            ? 'We couldn’t find a payment to check.'
            : failed
              ? holdEnded
                ? 'No money was taken. Your booking hold has ended, so please pick a time again.'
                : 'No money was taken. You can try again while your booking is still held.'
              : `${error ? `${getErrorMessage(error, 'Paystack hasn’t confirmed the payment.')} ` : ''}If money has left your account, your booking will be confirmed automatically. Check My bookings in a few minutes.`}
        </Text>
        <View className="mt-6 flex-row justify-center gap-3">
          {Boolean(bookingId) && !holdEnded && (
            <Button href={`/checkout/pay/${bookingId}`}>
              {failed ? 'Try again' : 'Back to payment'}
            </Button>
          )}
          <Button href="/bookings" variant="outline">
            My bookings
          </Button>
        </View>
      </View>
    </AppScreen>
  )
}

// "Waiting for Paystack…" while the screen keeps checking
function StillProcessing({ bookingId }) {
  const [tookTooLong, setTookTooLong] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setTookTooLong(true), POLL_EVERY_MS * MAX_POLLS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <View accessibilityLiveRegion="polite" className="rounded-xl bg-gray-50 p-8">
      {!tookTooLong && <ActivityIndicator size="large" color={COLORS.primary} />}
      <Text className="mt-3 text-center text-lg font-semibold text-gray-900">
        {tookTooLong ? 'Your payment is still processing' : 'Waiting for Paystack to confirm…'}
      </Text>
      <Text className="mt-2 text-center text-sm text-gray-700">
        {tookTooLong
          ? 'Some payments (like bank transfers) take a few minutes. We’ll confirm your booking as soon as Paystack does.'
          : 'This usually takes a few seconds. Please don’t pay again.'}
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
