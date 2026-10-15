import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import { Image } from 'expo-image'
import { useMutation } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
  CalendarDays,
  Clock,
  CreditCard,
  Landmark,
  Lock,
  Mail,
  Phone,
  Smartphone,
  User,
  Users,
} from 'lucide-react-native'
import { cancelBooking } from '@/api/bookings'
import { initializePayment } from '@/api/payments'
import CheckoutSteps from '@/components/checkout/CheckoutSteps'
import FinalisingNotice from '@/components/checkout/FinalisingNotice'
import AppScreen from '@/components/layout/AppScreen'
import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import Notice from '@/components/ui/Notice'
import Spinner from '@/components/ui/Spinner'
import { sizedImage } from '@/components/workspace/imageUrl'
import { useAuth } from '@/hooks/useAuth'
import { useBookingWithWorkspace } from '@/hooks/useBookingWithWorkspace'
import { useCountdown } from '@/hooks/useCountdown'
import { slotToParams } from '@/utils/bookingSlot'
import { COLORS } from '@/utils/colors'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatAs, formatTime } from '@/utils/formatDate'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { isFinalising, isPaid } from '@/utils/isPaid'
import { toLagos } from '@/utils/lagosTime'
import { openPaystack } from '@/utils/paystack'

// While a paid booking is being confirmed, check again every 3 seconds for about a minute
const POLL_EVERY_MS = 3000
const MAX_POLLS = 20
// After the Paystack browser closes, keep checking for this long before saying "not paid yet"
const CHECK_AFTER_BROWSER_MS = 20 * 1000

// What Paystack's page lets the seeker pay with
const PAYSTACK_METHODS = [
  { icon: CreditCard, label: 'Card', text: 'Visa, Mastercard, Verve' },
  { icon: Landmark, label: 'Bank Transfer', text: 'Pay from any Nigerian bank' },
  { icon: Smartphone, label: 'USSD', text: 'Pay with a USSD code on your phone' },
]

function Chip({ icon: Icon, children }) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-md bg-primary-light/60 px-2.5 py-1">
      <Icon size={12} color={COLORS.gray800} />
      <Text className="text-xs text-gray-800">{children}</Text>
    </View>
  )
}

function ReadOnlyField({ icon: Icon, label, value }) {
  return (
    <View
      accessibilityLabel={label}
      className="flex-row items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
    >
      <Icon size={14} color={COLORS.gray600} />
      <Text numberOfLines={1} className="flex-1 text-sm text-gray-800">
        {value || '—'}
      </Text>
    </View>
  )
}

// The booking's times as checkout step 1's params, in Lagos time
function slotFromBooking(booking) {
  const start = toLagos(booking.startTime)
  const end = toLagos(booking.endTime)
  return slotToParams({
    date: start.format('YYYY-MM-DD'),
    start: start.format('HH:mm'),
    end: end.isSame(start, 'day') ? end.format('HH:mm') : '24:00',
    guests: booking.guestCount ?? 1,
  })
}

// Step 2 of 3: check the summary and pay on Paystack (in an in-app browser)
export default function CheckoutPaymentScreen() {
  const { bookingId } = useLocalSearchParams()
  const { user } = useAuth()
  // true while we check the booking after the Paystack browser closes
  const [checkingPayment, setCheckingPayment] = useState(false)
  // true when that check ended and the booking still isn't paid
  const [notPaidYet, setNotPaidYet] = useState(false)

  const { booking, isLoading, isFetching, error, refetch } = useBookingWithWorkspace(bookingId, {
    refetchInterval: (query) => {
      const data = query.state.data
      // Paid but not confirmed yet: keep checking until the API catches up
      if (isFinalising(data) && query.state.dataUpdateCount < MAX_POLLS) return POLL_EVERY_MS
      // Just back from Paystack: check until the payment shows up
      if (checkingPayment && !isPaid(data)) return POLL_EVERY_MS
      return false
    },
  })
  const countdown = useCountdown(booking?.expiresAt)
  const timeIsUp = booking?.status === 'pending' && countdown?.seconds === 0

  // When the 15 minutes run out, ask the API what happened (they may have just paid)
  useEffect(() => {
    if (timeIsUp) refetch()
  }, [timeIsUp, refetch])

  // Stop the after-browser check after a while
  useEffect(() => {
    if (!checkingPayment) return
    const timer = setTimeout(() => {
      setCheckingPayment(false)
      setNotPaidYet(true)
    }, CHECK_AFTER_BROWSER_MS)
    return () => clearTimeout(timer)
  }, [checkingPayment])

  const payMutation = useMutation({
    mutationFn: async () => {
      const { authorizationUrl } = await initializePayment(bookingId)
      return openPaystack(authorizationUrl)
    },
    onSuccess: (reference) => {
      if (reference) {
        // Paystack sent them back to the app: confirm the payment with our API
        router.replace({ pathname: '/paystack/callback', params: { reference } })
        return
      }
      // They closed the browser. Did they pay? Check the booking.
      setNotPaidYet(false)
      setCheckingPayment(true)
      refetch()
    },
  })

  // "Edit booking" and "Back to Booking": release this hold, then go back to step 1 with the same
  // times. Without releasing it, the seeker's own hold would block the time they want.
  const editMutation = useMutation({
    mutationFn: () => cancelBooking(bookingId),
    onSettled: () =>
      router.dismissTo({
        pathname: '/checkout/[spaceId]',
        params: { spaceId: booking.workspace._id, ...slotFromBooking(booking) },
      }),
  })

  if (isLoading) {
    return (
      <AppScreen>
        <Spinner label="Loading your booking…" />
      </AppScreen>
    )
  }
  if (error) {
    return (
      <AppScreen>
        <FormError message={getErrorMessage(error, 'This booking could not be loaded.')} />
      </AppScreen>
    )
  }

  // Paid, and our API is still confirming the booking
  if (isFinalising(booking)) {
    return (
      <AppScreen>
        <FinalisingNotice bookingId={bookingId} />
      </AppScreen>
    )
  }

  // Paid (just now, or they came back after paying)
  if (isPaid(booking)) return <Redirect href={`/bookings/${bookingId}/confirmation`} />

  const workspace = booking.workspace ?? {}

  // A request the host hasn't answered yet: nothing to pay
  if (booking.status === 'requested') return <Redirect href={`/bookings/${bookingId}`} />

  // Time's up: wait for the API's answer, then trust it
  if (timeIsUp && isFetching) {
    return (
      <AppScreen>
        <Spinner label="Checking your booking…" />
      </AppScreen>
    )
  }
  const holdExpired = booking.status === 'expired' || timeIsUp

  if (holdExpired || ['cancelled', 'declined'].includes(booking.status)) {
    return (
      <AppScreen>
        <View className="rounded-xl bg-gray-50 p-8">
          <Text className="text-center text-lg font-semibold text-gray-900">
            {booking.status === 'declined'
              ? 'The host declined this request'
              : booking.status === 'cancelled'
                ? 'This booking was cancelled'
                : 'Your 15-minute hold has ended'}
          </Text>
          <Text className="mt-2 text-center text-sm text-gray-600">
            The time was released so others can book it. You can pick it again if it&apos;s still
            free.
          </Text>
          <Button
            className="mt-6 self-center"
            onPress={() =>
              router.replace({
                pathname: '/checkout/[spaceId]',
                params: { spaceId: workspace._id, ...slotFromBooking(booking) },
              })
            }
          >
            Choose a time again
          </Button>
        </View>
      </AppScreen>
    )
  }

  const hours = dayjs(booking.endTime).diff(dayjs(booking.startTime), 'minute') / 60
  const quantity = booking.priceUnit === 'day' ? Math.max(1, Math.ceil(hours / 24)) : hours
  const payError = payMutation.error
    ? getErrorMessage(payMutation.error, 'We couldn’t start the payment. Please try again.')
    : ''
  const payBusy = payMutation.isPending || checkingPayment

  return (
    <AppScreen>
      <CheckoutSteps
        current={1}
        onBack={() => editMutation.mutate()}
        backDisabled={editMutation.isPending}
        backLabel={editMutation.isPending ? 'Releasing this time…' : 'Back to Booking'}
      />

      {countdown && (
        <Text
          accessibilityRole="timer"
          className="mt-6 rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-800"
        >
          We&apos;re holding this time for you. Complete payment within{' '}
          <Text className="font-bold">{countdown.label}</Text>.
        </Text>
      )}

      <View className="mt-8 gap-10">
        {/* Booking summary */}
        <View className="gap-4">
          <View className="h-36 overflow-hidden rounded-md bg-gray-200">
            {workspace.images?.[0] && (
              <Image
                source={sizedImage(workspace.images[0].url, 800)}
                contentFit="cover"
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </View>
          <View>
            <Text className="text-base font-semibold text-gray-900">
              {workspace.name ?? 'Your workspace'}
            </Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              <Chip icon={CalendarDays}>{formatAs(booking.startTime, 'D MMM, YYYY')}</Chip>
              <Chip icon={Clock}>
                {formatTime(booking.startTime)} to {formatTime(booking.endTime)}
              </Chip>
              <Chip icon={Users}>
                {booking.guestCount} Guest{booking.guestCount === 1 ? '' : 's'}
              </Chip>
            </View>
            <Pressable
              onPress={() => editMutation.mutate()}
              disabled={editMutation.isPending}
              className="mt-3 self-start"
            >
              <Text className="text-sm text-gray-600 underline">
                {editMutation.isPending ? 'Releasing this time…' : 'Edit Booking'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View>
          <Text className="text-base font-medium text-gray-900">Your Details</Text>
          <View className="mt-3 gap-3">
            <ReadOnlyField icon={User} label="Full name" value={user?.name} />
            <ReadOnlyField icon={Phone} label="Phone number" value={user?.phone} />
            <ReadOnlyField icon={Mail} label="Email address" value={user?.email} />
          </View>
          <Text className="mt-2 text-xs text-gray-600">
            Your receipt and access details go here.{' '}
            <Text onPress={() => router.push('/profile')} className="text-primary">
              Edit profile
            </Text>
          </Text>
        </View>

        <View>
          <Text className="text-base font-medium text-gray-900">Payment Method</Text>
          <Text className="mt-1 text-xs text-gray-600">
            You&apos;ll choose one on Paystack&apos;s secure page.
          </Text>
          <View className="mt-3 gap-2">
            {PAYSTACK_METHODS.map(({ icon: Icon, label, text }) => (
              <View
                key={label}
                className="flex-row items-center gap-3 rounded-md border border-gray-300 px-3 py-2.5"
              >
                <Icon size={18} color={COLORS.gray700} />
                <View>
                  <Text className="text-sm font-medium text-gray-900">{label}</Text>
                  <Text className="text-xs text-gray-600">{text}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Price summary + pay */}
        <View>
          <Text className="text-center text-base font-medium text-gray-900">Price Summary</Text>
          <View className="mt-4 gap-2">
            <View className="flex-row justify-between gap-3">
              <Text className="flex-1 text-sm text-gray-900">
                Rate × duration ({formatCurrency(booking.unitPrice)} × {quantity}{' '}
                {booking.priceUnit === 'day' ? 'day' : 'hr'})
              </Text>
              <Text className="text-sm text-gray-900">{formatCurrency(booking.amount)}</Text>
            </View>
            <View className="flex-row justify-between border-t border-gray-200 pt-2">
              <Text className="text-sm font-semibold text-gray-900">Total Cost</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {formatCurrency(booking.amount)}
              </Text>
            </View>
          </View>

          <View className="mt-6 gap-3">
            <FormError message={payError} />
            {notPaidYet && (
              <Text className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                We haven&apos;t received your payment yet. If you paid, it can take a few minutes to
                show: check My bookings shortly, and please don&apos;t pay twice. Otherwise, tap Pay
                to try again.
              </Text>
            )}
            {checkingPayment && <Notice message="Checking your payment…" />}
          </View>
          <Pressable
            onPress={() => payMutation.mutate()}
            disabled={payBusy}
            accessibilityRole="button"
            accessibilityState={{ disabled: payBusy }}
            className={`mt-3 rounded-md bg-primary py-3 shadow-md active:bg-primary-dark ${payBusy ? 'opacity-60' : ''}`}
          >
            <Text className="text-center text-sm font-medium text-white">
              {payMutation.isPending
                ? 'Opening Paystack…'
                : checkingPayment
                  ? 'Checking your payment…'
                  : `Pay ${formatCurrency(booking.amount)}`}
            </Text>
          </Pressable>
          <View className="mt-3 flex-row items-center justify-center gap-1.5">
            <Lock size={12} color={COLORS.gray600} />
            <Text className="text-xs text-gray-600">
              Your payment is secured and encrypted by Paystack
            </Text>
          </View>
          <Text className="mt-1 text-center text-xs text-gray-600">
            By paying, you agree to SpaceShare&apos;s terms.
          </Text>
        </View>
      </View>
    </AppScreen>
  )
}
