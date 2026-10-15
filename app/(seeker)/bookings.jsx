import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Toast from 'react-native-toast-message'
import { Search } from 'lucide-react-native'
import { cancelBooking } from '@/api/bookings'
import SignInPrompt from '@/components/auth/SignInPrompt'
import AppScreen from '@/components/layout/AppScreen'
import AccessDetailsCard from '@/components/seeker/AccessDetailsCard'
import BookingRow from '@/components/seeker/BookingRow'
import NextBookingCard from '@/components/seeker/NextBookingCard'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import LoadError from '@/components/ui/LoadError'
import Spinner from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'
import { useMyBookings } from '@/hooks/useMyBookings'
import { usePayBooking } from '@/hooks/usePayBooking'
import { getErrorMessage } from '@/utils/getErrorMessage'

const TABS = [
  { key: 'upcoming', label: 'Upcoming', empty: 'No upcoming bookings yet.' },
  { key: 'past', label: 'Past', empty: "Bookings you've been to will show here." },
  { key: 'cancelled', label: 'Canceled', empty: 'No cancelled bookings.' },
]

// The seeker dashboard ("Space seeker dashboard" in Figma)
function MyBookings() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const bookings = useMyBookings()
  const [activeKey, setActiveKey] = useState('upcoming')
  const [bookingToCancel, setBookingToCancel] = useState(null)
  const pay = usePayBooking()

  const activeTab = TABS.find((t) => t.key === activeKey)
  const lists = { upcoming: bookings.upcoming, past: bookings.past, cancelled: bookings.cancelled }

  const cancelMutation = useMutation({
    mutationFn: (booking) => cancelBooking(booking._id),
    onSuccess: (cancelled) => {
      Toast.show({
        type: 'success',
        text1:
          cancelled?.paymentStatus === 'refund_pending'
            ? 'Booking cancelled. Your refund is being processed.'
            : 'Booking cancelled.',
      })
      setBookingToCancel(null)
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: (error) => Toast.show({ type: 'error', text1: getErrorMessage(error) }),
  })

  const firstName = user?.name?.split(' ')[0]
  const isPaid = bookingToCancel?.paymentStatus === 'paid'

  return (
    // Pull down to refresh (phones have no browser Reload)
    <AppScreen showBack={false} onRefresh={bookings.refetch} refreshing={false}>
      <View className="flex-row items-end justify-between gap-4">
        <View className="flex-1">
          <Text className="text-2xl font-semibold text-primary">Hi, {firstName}</Text>
          <Text className="mt-1 text-xs text-gray-900">Your bookings in one place.</Text>
        </View>
        <Button variant="accent" size="sm" icon={Search} onPress={() => router.push('/search')}>
          Find a space
        </Button>
      </View>

      {bookings.isLoading && <Spinner label="Loading your bookings…" />}

      {Boolean(bookings.error) && (
        <LoadError
          error={bookings.error}
          fallback="We couldn't load your bookings."
          onRetry={bookings.refetch}
          className="mt-8"
        />
      )}

      {!bookings.isLoading && !bookings.error && (
        <>
          {bookings.nextBooking ? (
            <View className="mt-6 gap-5">
              <NextBookingCard booking={bookings.nextBooking} />
              <AccessDetailsCard booking={bookings.nextBooking} />
            </View>
          ) : (
            <View className="mt-6 rounded-xl bg-accent p-6">
              <Text className="text-lg font-medium text-white">No upcoming bookings</Text>
              <Text className="mt-1 text-sm text-white/80">
                Find a desk, meeting room or studio and book it in minutes.
              </Text>
              <Pressable
                onPress={() => router.push('/search')}
                className="mt-5 self-start rounded-md bg-white px-5 py-2.5 active:bg-gray-100"
              >
                <Text className="text-sm text-gray-900">Explore spaces</Text>
              </Pressable>
            </View>
          )}

          {/* Counts */}
          <View className="mt-5 flex-row gap-2">
            {TABS.map((tab) => (
              <View key={tab.key} className="flex-1 rounded-md bg-gray-200 px-3 py-2">
                <Text className="text-xs text-gray-700">{tab.label}</Text>
                <Text className="text-sm font-medium text-accent">{lists[tab.key].length}</Text>
              </View>
            ))}
          </View>

          <Text className="mt-8 text-xl font-semibold text-primary">My bookings</Text>
          <View
            accessibilityRole="tablist"
            accessibilityLabel="Bookings"
            className="mt-4 flex-row gap-6 border-b border-gray-300"
          >
            {TABS.map((tab) => {
              const selected = activeKey === tab.key
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveKey(tab.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  className={`-mb-px border-b-2 pb-2 ${selected ? 'border-primary' : 'border-transparent'}`}
                >
                  <Text className={`text-xs ${selected ? 'text-accent' : 'text-gray-600'}`}>
                    {tab.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <View className="mt-4">
            {lists[activeKey].length === 0 ? (
              <Text className="rounded-md border border-gray-200 px-4 py-10 text-center text-sm text-gray-600">
                {activeTab.empty}
              </Text>
            ) : (
              <View className="rounded-md border border-gray-200">
                {lists[activeKey].map((booking, i) => (
                  <BookingRow
                    key={booking._id}
                    first={i === 0}
                    booking={booking}
                    onCancel={setBookingToCancel}
                    onPay={(b) => pay.mutate(b._id)}
                    isPaying={pay.isPending && pay.variables === booking._id}
                  />
                ))}
              </View>
            )}
          </View>
        </>
      )}

      <ConfirmDialog
        open={Boolean(bookingToCancel)}
        title="Cancel this booking?"
        confirmLabel="Yes, cancel it"
        cancelLabel="Keep it"
        danger
        isWorking={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate(bookingToCancel)}
        onClose={() => setBookingToCancel(null)}
      >
        {bookingToCancel?.workspace?.name} will be released for other guests.
        {isPaid
          ? ' Because you have paid, a refund will be requested. Our team processes refunds by hand, so it may take a few days.'
          : ''}
      </ConfirmDialog>
    </AppScreen>
  )
}

export default function MyBookingsScreen() {
  const { user } = useAuth()
  if (!user) {
    return <SignInPrompt title="My bookings" text="Log in to see the spaces you've booked." />
  }
  return <MyBookings />
}
