import { useState } from 'react'
import { Linking, Pressable, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Image } from 'expo-image'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import Toast from 'react-native-toast-message'
import {
  ArrowLeft,
  CalendarDays,
  CircleCheck,
  Mail,
  MapPin,
  Phone,
  ScanLine,
  Users,
} from 'lucide-react-native'
import { completeBooking } from '@/api/bookings'
import CheckInDialog from '@/components/host/CheckInDialog'
import HostScreen from '@/components/host/HostScreen'
import RequestActions from '@/components/host/RequestActions'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import LoadError from '@/components/ui/LoadError'
import Spinner from '@/components/ui/Spinner'
import StatusBadge from '@/components/ui/StatusBadge'
import UserAvatar from '@/components/ui/UserAvatar'
import { sizedImage } from '@/components/workspace/imageUrl'
import { useBookingWithWorkspace } from '@/hooks/useBookingWithWorkspace'
import { areaOf } from '@/utils/bookingHelpers'
import { COLORS } from '@/utils/colors'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatAs, formatDateTime, formatTime } from '@/utils/formatDate'
import { getErrorMessage } from '@/utils/getErrorMessage'

const PAYMENT_LABELS = {
  not_required: 'Free booking',
  pending: 'Awaiting payment',
  paid: 'Paid',
  failed: 'Payment failed',
  refund_pending: 'Refund pending',
  refunded: 'Refunded',
}

function Row({ label, children, last }) {
  return (
    <View
      className={`flex-row justify-between gap-4 py-2.5 ${last ? '' : 'border-b border-gray-100'}`}
    >
      <Text className="text-sm text-gray-600">{label}</Text>
      <Text className="flex-1 text-right text-sm text-gray-900">{children}</Text>
    </View>
  )
}

// Host's view of one booking. Opened from "View" in Booking Management or the dashboard.
export default function HostBookingDetailsScreen() {
  const { id } = useLocalSearchParams()
  const queryClient = useQueryClient()
  const { booking, isLoading, error, refetch } = useBookingWithWorkspace(id)
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [confirmComplete, setConfirmComplete] = useState(false)

  const completeMutation = useMutation({
    mutationFn: () => completeBooking(id),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Booking marked as completed' })
      setConfirmComplete(false)
      queryClient.invalidateQueries({ queryKey: ['booking', id] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      // Completing a booking changes the earnings and balance too
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] })
    },
    onError: (err) => Toast.show({ type: 'error', text1: getErrorMessage(err) }),
  })

  if (isLoading) {
    return (
      <HostScreen>
        <Spinner label="Loading booking…" />
      </HostScreen>
    )
  }
  if (error) {
    return (
      <HostScreen>
        <LoadError error={error} fallback="We couldn't load this booking." onRetry={refetch} />
      </HostScreen>
    )
  }

  const guest = typeof booking.user === 'object' ? booking.user : null
  const workspace = booking.workspace ?? {}
  const hasEnded = dayjs(booking.endTime).isBefore(dayjs())
  const canCheckIn = booking.status === 'confirmed' && !booking.checkedInAt
  const canComplete = booking.status === 'confirmed' && hasEnded

  const rows = [
    ['Rate', `${formatCurrency(booking.unitPrice)} / ${booking.priceUnit}`],
    ['Amount', formatCurrency(booking.amount)],
    ['Payment', PAYMENT_LABELS[booking.paymentStatus] ?? booking.paymentStatus],
    ['Booked on', formatDateTime(booking.createdAt)],
    booking.cancelledAt && ['Cancelled', formatDateTime(booking.cancelledAt)],
    booking.cancellationReason && ['Reason', booking.cancellationReason],
    booking.completedAt && ['Completed', formatDateTime(booking.completedAt)],
  ].filter(Boolean)

  return (
    <HostScreen onRefresh={refetch}>
      <Pressable
        onPress={() => router.navigate('/host/bookings')}
        className="flex-row items-center gap-2 self-start"
      >
        <ArrowLeft size={16} color={COLORS.gray700} />
        <Text className="text-sm text-gray-700">Back to bookings</Text>
      </Pressable>

      <View className="mt-4 gap-4">
        <View>
          <Text className="text-2xl font-semibold text-gray-900">Booking details</Text>
          <View className="mt-1 flex-row flex-wrap items-center gap-2">
            <StatusBadge status={booking.status} />
            {Boolean(booking.checkedInAt) && (
              <View className="flex-row items-center gap-1">
                <CircleCheck size={14} color="#15803d" />
                <Text className="text-sm text-green-700">
                  Checked in {formatDateTime(booking.checkedInAt)}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View className="flex-row flex-wrap gap-3">
          <RequestActions booking={booking} />
          {canCheckIn && (
            <Button variant="accent" size="sm" icon={ScanLine} onPress={() => setCheckInOpen(true)}>
              Check in guest
            </Button>
          )}
          {canComplete && (
            <Button size="sm" onPress={() => setConfirmComplete(true)}>
              Mark as completed
            </Button>
          )}
        </View>
      </View>

      {booking.status === 'requested' && (
        <Text className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          This guest is asking to book your space. Please reply by{' '}
          <Text className="font-bold">
            {formatDateTime(booking.expiresAt ?? dayjs(booking.createdAt).add(24, 'hour'))}
          </Text>
          , or the request expires.
          {booking.paymentStatus !== 'not_required' &&
            ' If you accept, they have 15 minutes to pay before the booking is confirmed.'}
        </Text>
      )}

      <View className="mt-8 gap-6">
        <View className="rounded-xl border border-gray-200 p-5">
          <Text className="text-base font-medium text-gray-900">Guest</Text>
          <View className="mt-4 flex-row items-center gap-3">
            <UserAvatar user={guest} size={48} />
            <View>
              <Text className="text-base font-medium text-gray-900">{guest?.name ?? 'Guest'}</Text>
              <View className="flex-row items-center gap-1">
                <Users size={14} color={COLORS.gray600} />
                <Text className="text-sm text-gray-600">
                  {booking.guestCount} {booking.guestCount === 1 ? 'person' : 'people'}
                </Text>
              </View>
            </View>
          </View>
          {Boolean(guest?.email) && (
            <Pressable
              onPress={() => Linking.openURL(`mailto:${guest.email}`)}
              className="mt-4 flex-row items-center gap-2"
            >
              <Mail size={14} color={COLORS.primary} />
              <Text className="text-sm text-primary">{guest.email}</Text>
            </Pressable>
          )}
          {Boolean(guest?.phone) && (
            <Pressable
              onPress={() => Linking.openURL(`tel:${guest.phone}`)}
              className="mt-2 flex-row items-center gap-2"
            >
              <Phone size={14} color={COLORS.primary} />
              <Text className="text-sm text-primary">{guest.phone}</Text>
            </Pressable>
          )}
        </View>

        <View className="rounded-xl border border-gray-200 p-5">
          <Text className="text-base font-medium text-gray-900">Space</Text>
          <View className="mt-4 flex-row items-center gap-3">
            <View className="h-14 w-20 overflow-hidden rounded-md bg-gray-200">
              {workspace.images?.[0]?.url && (
                <Image
                  source={sizedImage(workspace.images[0].url, 300)}
                  contentFit="cover"
                  style={{ width: '100%', height: '100%' }}
                />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-900">
                {workspace.name ?? 'Your space'}
              </Text>
              <View className="flex-row items-center gap-1">
                <MapPin size={14} color={COLORS.gray600} />
                <Text className="text-sm text-gray-600">{areaOf(workspace)}</Text>
              </View>
            </View>
          </View>
          <View className="mt-4 flex-row items-center gap-2">
            <CalendarDays size={14} color={COLORS.gray800} />
            <Text className="flex-1 text-sm text-gray-800">
              {formatAs(booking.startTime, 'ddd, D MMM YYYY')}, {formatTime(booking.startTime)} –{' '}
              {formatTime(booking.endTime)}
            </Text>
          </View>
        </View>

        <View className="rounded-xl border border-gray-200 p-5">
          <Text className="text-base font-medium text-gray-900">Payment</Text>
          <View className="mt-2">
            {rows.map(([label, value], i) => (
              <Row key={label} label={label} last={i === rows.length - 1}>
                {value}
              </Row>
            ))}
          </View>
          <Text className="mt-3 text-xs text-gray-500">
            Your earnings from this booking become available to withdraw 24 hours after it&apos;s
            completed.
          </Text>
        </View>
      </View>

      <CheckInDialog
        open={checkInOpen}
        onClose={() => {
          setCheckInOpen(false)
          queryClient.invalidateQueries({ queryKey: ['booking', id] })
        }}
      />
      <ConfirmDialog
        open={confirmComplete}
        title="Mark this booking as completed?"
        confirmLabel="Mark completed"
        isWorking={completeMutation.isPending}
        onConfirm={() => completeMutation.mutate()}
        onClose={() => setConfirmComplete(false)}
      >
        Do this once the guest has used the space. Your earnings become available to withdraw 24
        hours later.
      </ConfirmDialog>
    </HostScreen>
  )
}
