import { useState } from 'react'
import { Linking, Pressable, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Image } from 'expo-image'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import Toast from 'react-native-toast-message'
import {
  ArrowLeft,
  CalendarPlus,
  MapPin,
  Navigation,
  Phone,
  Star,
  Users,
} from 'lucide-react-native'
import { cancelBooking } from '@/api/bookings'
import { createReview, getWorkspaceReviews } from '@/api/reviews'
import AppScreen from '@/components/layout/AppScreen'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormError from '@/components/ui/FormError'
import LoadError from '@/components/ui/LoadError'
import Spinner from '@/components/ui/Spinner'
import StatusBadge from '@/components/ui/StatusBadge'
import TextareaField from '@/components/ui/TextareaField'
import { sizedImage } from '@/components/workspace/imageUrl'
import { useBookingWithWorkspace } from '@/hooks/useBookingWithWorkspace'
import { usePayBooking } from '@/hooks/usePayBooking'
import { areaOf, canCancel, directionsLink } from '@/utils/bookingHelpers'
import { googleCalendarLink } from '@/utils/calendarLinks'
import { COLORS } from '@/utils/colors'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatAs, formatDate, formatTime } from '@/utils/formatDate'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { canStillPay, isFinalising, isPaid } from '@/utils/isPaid'

// While a paid booking is being confirmed, check again every 3 seconds for about a minute
const POLL_EVERY_MS = 3000
const MAX_POLLS = 20

// Five tappable stars
function StarPicker({ value, onChange }) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Rating" className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          onPress={() => onChange(n)}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === n }}
          accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star
            size={28}
            color={n <= value ? COLORS.orange400 : COLORS.gray300}
            fill={n <= value ? COLORS.orange400 : 'transparent'}
          />
        </Pressable>
      ))}
    </View>
  )
}

const idOf = (value) => value?._id ?? value

function ReviewForm({ bookingId, workspaceId }) {
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  // Each booking can be reviewed once. The API has no "already reviewed" flag,
  // so look for this booking in the space's reviews (newest first, up to 100).
  const { data: reviewData, isLoading } = useQuery({
    queryKey: ['reviews', workspaceId, 'latest'],
    queryFn: () => getWorkspaceReviews(workspaceId, { limit: 100 }),
    enabled: Boolean(workspaceId),
  })
  const myReview = reviewData?.reviews?.find((r) => idOf(r.booking) === bookingId)

  const mutation = useMutation({
    mutationFn: () => createReview({ bookingId, rating, comment: comment.trim() || undefined }),
    onSuccess: () => {
      // Refresh the reviews and the space's rating
      queryClient.invalidateQueries({ queryKey: ['reviews', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] })
    },
  })
  // 409 here means this booking already has a review (e.g. posted on the website)
  const alreadyReviewed = Boolean(myReview) || mutation.error?.response?.status === 409

  if (mutation.isSuccess) {
    return (
      <Text className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
        Thanks! Your review has been posted.
      </Text>
    )
  }
  if (isLoading) return <Text className="text-sm text-gray-600">Loading…</Text>
  if (alreadyReviewed) {
    return (
      <Text className="rounded-lg bg-gray-50 p-4 text-sm text-gray-800">
        You&apos;ve already reviewed this booking
        {myReview ? ` (${myReview.rating} out of 5 stars)` : ''}. Thanks for sharing!
      </Text>
    )
  }
  return (
    <View className="gap-4">
      <StarPicker value={rating} onChange={setRating} />
      <TextareaField
        label="Comment (optional)"
        placeholder="What was the space like?"
        value={comment}
        onChangeText={setComment}
      />
      <FormError message={mutation.error ? getErrorMessage(mutation.error) : ''} />
      <Button onPress={() => mutation.mutate()} disabled={!rating || mutation.isPending}>
        {mutation.isPending ? 'Posting…' : 'Post review'}
      </Button>
    </View>
  )
}

function Detail({ label, children }) {
  return (
    <View className="w-1/2 p-2">
      <Text className="text-sm text-gray-600">{label}</Text>
      {children}
    </View>
  )
}

function LinkRow({ icon: Icon, onPress, children }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-2 py-1">
      <Icon size={16} color={COLORS.gray900} />
      <Text className="text-sm text-gray-900">{children}</Text>
    </Pressable>
  )
}

// One booking, from the seeker's side. Params: id, requestSent ('1' just after sending a request)
export default function BookingDetailsScreen() {
  const { id, requestSent, review } = useLocalSearchParams()
  const queryClient = useQueryClient()
  const { booking, isLoading, error, refetch } = useBookingWithWorkspace(id, {
    // Paid but not confirmed yet: keep checking until the API catches up
    refetchInterval: (query) =>
      isFinalising(query.state.data) && query.state.dataUpdateCount < MAX_POLLS
        ? POLL_EVERY_MS
        : false,
  })
  const [confirmCancel, setConfirmCancel] = useState(false)

  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(id),
    onSuccess: (cancelled) => {
      Toast.show({
        type: 'success',
        text1:
          cancelled?.paymentStatus === 'refund_pending'
            ? 'Booking cancelled. Your refund is being processed.'
            : 'Booking cancelled.',
      })
      setConfirmCancel(false)
      queryClient.invalidateQueries({ queryKey: ['booking', id] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: (err) => Toast.show({ type: 'error', text1: getErrorMessage(err) }),
  })
  // Pay from here (e.g. after the host accepts a request)
  const payMutation = usePayBooking()

  if (isLoading) {
    return (
      <AppScreen>
        <Spinner label="Loading booking…" />
      </AppScreen>
    )
  }
  if (error) {
    return (
      <AppScreen>
        <LoadError error={error} fallback="We couldn't load this booking." onRetry={refetch} />
      </AppScreen>
    )
  }

  const workspace = booking.workspace ?? {}
  const host = typeof booking.host === 'object' ? booking.host : null
  // Only offer "Pay" while the 15-minute hold is still running
  const isUnpaid = canStillPay(booking)
  const holdEnded = booking.status === 'pending' && !isPaid(booking) && !isUnpaid
  const isUpcoming =
    ['confirmed'].includes(booking.status) && dayjs(booking.endTime).isAfter(dayjs())
  const openSpace = () => router.push({ pathname: '/space/[id]', params: { id: workspace._id } })

  return (
    <AppScreen>
      <Pressable
        onPress={() => router.navigate('/bookings')}
        className="flex-row items-center gap-2 self-start"
      >
        <ArrowLeft size={16} color={COLORS.gray700} />
        <Text className="text-sm text-gray-700">My bookings</Text>
      </Pressable>

      <View className="mt-6">
        <View className="h-56 overflow-hidden rounded-xl bg-gray-200">
          {workspace.images?.[0]?.url && (
            <Image
              source={sizedImage(workspace.images[0].url, 1200)}
              contentFit="cover"
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </View>
        <View className="mt-5 flex-row flex-wrap items-center gap-3">
          <Text className="text-2xl font-semibold text-gray-900">
            {workspace.name ?? 'Your booking'}
          </Text>
          <StatusBadge
            status={booking.status}
            boxClassName={booking.status === 'pending' ? 'bg-amber-100' : undefined}
            textClassName={booking.status === 'pending' ? 'text-amber-700' : undefined}
          />
        </View>
        <View className="mt-1 flex-row items-center gap-1.5">
          <MapPin size={14} color={COLORS.gray700} />
          <Text className="flex-1 text-sm text-gray-700">
            {[workspace.location?.address, areaOf(workspace)].filter(Boolean).join(', ')}
          </Text>
        </View>

        {booking.status === 'requested' && (
          <Text className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            {requestSent === '1' ? 'Request sent! ' : ''}The host approves each booking for this
            space. They have until{' '}
            <Text className="font-bold">
              {formatAs(
                booking.expiresAt ?? dayjs(booking.createdAt).add(24, 'hour'),
                'ddd D MMM, h:mm A',
              )}
            </Text>{' '}
            to reply. Once they accept, you&apos;ll have 15 minutes to pay.
          </Text>
        )}
        {isFinalising(booking) && (
          <Text className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-800">
            Payment received. We&apos;re finalising your booking. This screen updates by itself.
          </Text>
        )}
        {holdEnded && (
          <Text className="mt-4 rounded-lg bg-gray-100 p-4 text-sm text-gray-800">
            The 15-minute hold ended before payment, so the time was released.{' '}
            <Text onPress={openSpace} className="font-medium underline">
              Book again
            </Text>
          </Text>
        )}
        {booking.status === 'declined' && (
          <Text className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            The host couldn&apos;t accept this request. You haven&apos;t been charged.{' '}
            <Text onPress={openSpace} className="font-medium underline">
              Try another time
            </Text>
          </Text>
        )}

        <View className="mt-6 flex-row flex-wrap rounded-xl bg-gray-50 p-2">
          <Detail label="Date">
            <Text className="text-sm font-medium text-gray-900">
              {formatDate(booking.startTime)}
            </Text>
          </Detail>
          <Detail label="Time">
            <Text className="text-sm font-medium text-gray-900">
              {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
            </Text>
          </Detail>
          <Detail label="Guests">
            <View className="flex-row items-center gap-1">
              <Users size={14} color={COLORS.gray900} />
              <Text className="text-sm font-medium text-gray-900">{booking.guestCount}</Text>
            </View>
          </Detail>
          <Detail label="Total">
            <Text className="text-sm font-medium text-gray-900">
              {formatCurrency(booking.amount)}
            </Text>
          </Detail>
        </View>

        {booking.status === 'completed' && (
          <View className="mt-8">
            <Text className="text-base font-medium text-gray-900">
              {review === '1' ? 'Leave a review' : 'How was it?'}
            </Text>
            <Text className="mb-4 text-sm text-gray-600">
              Your review helps other seekers choose.
            </Text>
            <ReviewForm bookingId={booking._id} workspaceId={workspace._id} />
          </View>
        )}
      </View>

      <View className="mt-8 gap-4">
        {isUnpaid && (
          <View className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <Text className="text-sm text-amber-900">
              This booking isn&apos;t paid yet. It&apos;s released if not paid within 15 minutes of
              booking.
            </Text>
            <Button
              className="mt-3 self-stretch"
              onPress={() => payMutation.mutate(id)}
              disabled={payMutation.isPending}
            >
              {payMutation.isPending
                ? 'Opening Paystack…'
                : `Pay ${formatCurrency(booking.amount)}`}
            </Button>
          </View>
        )}

        {booking.status === 'confirmed' && (
          <View className="items-center rounded-xl border border-gray-200 p-4">
            <Text className="text-sm text-gray-600">Booking code</Text>
            <Text style={{ letterSpacing: 3 }} className="mt-1 text-xl font-semibold text-accent">
              {booking.bookingCode}
            </Text>
            {Boolean(booking.qrCode) && (
              <Image
                source={booking.qrCode}
                accessibilityLabel={`QR code for booking ${booking.bookingCode}`}
                contentFit="contain"
                style={{ width: 160, height: 160, marginTop: 12 }}
              />
            )}
            <Text className="mt-2 text-xs text-gray-600">Show this at reception to check in.</Text>
            {Boolean(booking.checkedInAt) && (
              <Text className="mt-2 text-xs font-medium text-green-700">Checked in</Text>
            )}
          </View>
        )}

        <View className="gap-2 rounded-xl border border-gray-200 p-4">
          <LinkRow icon={Navigation} onPress={() => Linking.openURL(directionsLink(workspace))}>
            Get directions
          </LinkRow>
          {isUpcoming && (
            <LinkRow
              icon={CalendarPlus}
              onPress={() =>
                Linking.openURL(
                  googleCalendarLink({
                    title: `SpaceShare: ${workspace.name ?? 'Workspace booking'}`,
                    start: booking.startTime,
                    end: booking.endTime,
                    location: workspace.location?.address ?? '',
                    details: `Booking code: ${booking.bookingCode}`,
                  }),
                )
              }
            >
              Add to Google calendar
            </LinkRow>
          )}
          {Boolean(host?.phone) && (
            <LinkRow icon={Phone} onPress={() => Linking.openURL(`tel:${host.phone}`)}>
              Call host ({host.name})
            </LinkRow>
          )}
          {Boolean(workspace._id) && (
            <Text onPress={openSpace} className="py-1 text-sm text-primary">
              View the space
            </Text>
          )}
        </View>

        {canCancel(booking) && (
          <Pressable
            onPress={() => setConfirmCancel(true)}
            className="rounded-lg border border-red-200 py-2.5 active:bg-red-50"
          >
            <Text className="text-center text-sm text-red-600">Cancel booking</Text>
          </Pressable>
        )}
      </View>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this booking?"
        confirmLabel="Yes, cancel it"
        cancelLabel="Keep it"
        danger
        isWorking={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
        onClose={() => setConfirmCancel(false)}
      >
        {booking.paymentStatus === 'paid'
          ? 'Because you have paid, a refund will be requested. Our team processes refunds by hand, so it may take a few days.'
          : 'The time will be released for other guests.'}
      </ConfirmDialog>
    </AppScreen>
  )
}
