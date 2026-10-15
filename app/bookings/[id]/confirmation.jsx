import { Linking, Pressable, Text, View } from 'react-native'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path } from 'react-native-svg'
import Toast from 'react-native-toast-message'
import {
  CalendarDays,
  CalendarPlus,
  Download,
  List,
  LockKeyhole,
  MapPin,
  Phone,
  ScanLine,
  Ticket,
  User,
  UserCheck,
  Zap,
} from 'lucide-react-native'
import CheckoutSteps from '@/components/checkout/CheckoutSteps'
import FinalisingNotice from '@/components/checkout/FinalisingNotice'
import AppScreen from '@/components/layout/AppScreen'
import FormError from '@/components/ui/FormError'
import Spinner from '@/components/ui/Spinner'
import StatusBadge from '@/components/ui/StatusBadge'
import UserAvatar from '@/components/ui/UserAvatar'
import { sizedImage } from '@/components/workspace/imageUrl'
import { useBookingWithWorkspace } from '@/hooks/useBookingWithWorkspace'
import { areaOf } from '@/utils/bookingHelpers'
import { addToPhoneCalendar, googleCalendarLink } from '@/utils/calendarLinks'
import { COLORS } from '@/utils/colors'
import { formatDate, formatTime } from '@/utils/formatDate'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { isFinalising, isPaid } from '@/utils/isPaid'
import { shareReceipt } from '@/utils/receiptPdf'

// While a paid booking is being confirmed, check again every 3 seconds for about a minute
const POLL_EVERY_MS = 3000
const MAX_POLLS = 20

// Coloured confetti around the big tick: [position, colour]
const CONFETTI = [
  [{ top: '8%', left: '18%' }, 'bg-pink-500'],
  [{ top: '22%', left: '10%' }, 'bg-indigo-500'],
  [{ top: '45%', left: '14%' }, 'bg-orange-400'],
  [{ top: '70%', left: '20%' }, 'bg-red-500'],
  [{ top: '12%', right: '18%' }, 'bg-sky-400'],
  [{ top: '30%', right: '10%' }, 'bg-purple-500'],
  [{ top: '55%', right: '14%' }, 'bg-yellow-400'],
  [{ top: '78%', right: '22%' }, 'bg-green-500'],
]

function PassCard({ icon: Icon, title, children }) {
  return (
    <View className="rounded-lg bg-accent/20 p-3">
      <View className="flex-row items-center gap-2">
        <Icon size={16} color={COLORS.gray900} />
        <Text className="text-xs text-gray-900">{title}</Text>
      </View>
      <View className="mt-3">{children}</View>
    </View>
  )
}

function QuickAction({ icon: Icon, onPress, children, first }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`flex-row items-center gap-3 py-3 ${first ? '' : 'border-t border-gray-200'}`}
    >
      <Icon size={18} color={COLORS.gray900} />
      <Text className="text-sm text-gray-900">{children}</Text>
    </Pressable>
  )
}

// Show a message if something on the phone (calendar, share sheet) didn't work
const tryOrToast = (action) => async () => {
  try {
    await action()
  } catch {
    Toast.show({ type: 'error', text1: 'Sorry, that didn’t work on this phone.' })
  }
}

// Step 3 of 3: "Booking confirmed" with the digital access pass
export default function BookingConfirmationScreen() {
  const { id } = useLocalSearchParams()
  const { booking, isLoading, error } = useBookingWithWorkspace(id, {
    // Paid but not confirmed yet: keep checking until the API catches up
    refetchInterval: (query) =>
      isFinalising(query.state.data) && query.state.dataUpdateCount < MAX_POLLS
        ? POLL_EVERY_MS
        : false,
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
        <FinalisingNotice bookingId={id} />
      </AppScreen>
    )
  }

  // The access pass is only for paid, confirmed bookings. Anything else (unpaid, cancelled,
  // waiting for the host…) goes to the booking's own screen, which explains what's happening.
  if (!isPaid(booking) || !['confirmed', 'completed'].includes(booking.status)) {
    return <Redirect href={`/bookings/${id}`} />
  }

  const workspace = booking.workspace ?? {}
  const host = typeof booking.host === 'object' ? booking.host : null
  const place = [workspace.location?.address, areaOf(workspace)].filter(Boolean).join(', ')
  const calendarEvent = {
    title: `SpaceShare: ${workspace.name ?? 'Workspace booking'}`,
    start: booking.startTime,
    end: booking.endTime,
    location: place,
    details: `Booking reference: ${booking.bookingCode}. Show this code or your QR code at reception.`,
  }

  return (
    <AppScreen>
      <CheckoutSteps current={2} />

      <View className="mt-8 gap-6">
        {/* Workspace photo */}
        <View className="h-48 overflow-hidden rounded-xl bg-gray-300">
          {workspace.images?.[0] && (
            <Image
              source={sizedImage(workspace.images[0].url, 800)}
              contentFit="cover"
              style={{ width: '100%', height: '100%' }}
            />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <View className="absolute bottom-4 left-4">
            <Text className="text-base font-medium text-white">{workspace.name}</Text>
            <View className="mt-1 flex-row items-center gap-1">
              <MapPin size={12} color={COLORS.white} />
              <Text className="text-xs text-white">{areaOf(workspace)}</Text>
            </View>
          </View>
        </View>

        <View className="gap-5">
          <View>
            <View className="h-44 items-center justify-center" accessible={false}>
              {CONFETTI.map(([position, colour], i) => (
                <View
                  key={i}
                  style={[{ position: 'absolute', transform: [{ rotate: '45deg' }] }, position]}
                  className={`size-2 rounded-sm ${colour}`}
                />
              ))}
              <View className="size-36 items-center justify-center rounded-full border-8 border-gray-200 bg-green-400">
                <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    stroke="#ffffff"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            </View>
            <Text className="mt-2 text-center text-xl text-gray-900">
              Booking {booking.status === 'completed' ? 'completed' : 'confirmed'}
            </Text>
            <Text className="mt-1 text-center text-sm text-gray-800">
              Your space is all set. Here&apos;s your digital access pass and everything you need
              for a smooth arrival.
            </Text>
          </View>

          <View className="flex-row gap-4 rounded-lg bg-accent/20 px-5 py-5">
            <View className="flex-1 border-r border-gray-400/50 pr-4">
              <Text className="text-xs text-gray-700">Booking ID</Text>
              <Text className="mt-1 text-base font-semibold text-gray-900">
                {booking.bookingCode}
              </Text>
              <View className="mt-2">
                <StatusBadge status={booking.status} />
              </View>
            </View>
            <View className="flex-1 flex-row gap-2">
              <CalendarDays size={18} color={COLORS.gray700} />
              <View className="flex-1">
                <Text className="text-xs text-gray-700">Date & Time</Text>
                <Text className="mt-1 text-sm text-gray-900">{formatDate(booking.startTime)}</Text>
                <Text className="text-sm text-gray-900">
                  {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                </Text>
              </View>
            </View>
          </View>

          <View className="rounded-xl border border-gray-200 p-4">
            <View className="flex-row items-start gap-3">
              <LockKeyhole size={20} color={COLORS.gray900} style={{ marginTop: 2 }} />
              <View className="flex-1">
                <Text className="text-base text-gray-900">Your Digital Access Pass</Text>
                <Text className="text-xs text-gray-700">
                  Use this code or QR code for check-in at the workspace
                </Text>
              </View>
            </View>
            <View className="mt-4 gap-3">
              <PassCard icon={ScanLine} title="QR code">
                {booking.qrCode ? (
                  <Image
                    source={booking.qrCode}
                    accessibilityLabel={`QR code for booking ${booking.bookingCode}`}
                    contentFit="contain"
                    style={{
                      width: 160,
                      height: 160,
                      alignSelf: 'center',
                      backgroundColor: COLORS.white,
                      borderRadius: 4,
                    }}
                  />
                ) : (
                  <Text className="text-xs text-gray-900">Your QR code will appear here.</Text>
                )}
                <Text className="mt-2 text-center text-xs font-medium text-gray-900">
                  Scan at front desk
                </Text>
                <Text className="text-center text-[11px] text-gray-700">For quick check-in</Text>
              </PassCard>
              {/* TODO: the design shows a door PIN. The API has no door PINs, so we show the booking code. */}
              <PassCard icon={Ticket} title="Booking code">
                <Text
                  style={{ letterSpacing: 3.6 }}
                  className="text-lg font-semibold text-gray-900"
                >
                  {booking.bookingCode}
                </Text>
                <Text className="mt-3 text-[11px] text-gray-700">
                  Give this code at reception if you can&apos;t scan the QR code.
                </Text>
              </PassCard>
              <PassCard icon={UserCheck} title="Entry">
                <Text className="text-xs text-gray-800">
                  Show your QR code or booking code when you arrive. If you&apos;re meeting the
                  host, they&apos;ll be at reception to get you in.
                </Text>
              </PassCard>
            </View>
          </View>
        </View>

        {/* Host + quick actions */}
        {host && (
          <View className="rounded-xl border border-gray-200 p-5">
            <View className="flex-row items-center gap-2">
              <User size={16} color={COLORS.gray900} />
              <Text className="text-sm text-gray-900">Host Contact</Text>
            </View>
            <View className="mt-4 flex-row items-center gap-3">
              <UserAvatar user={host} size={48} />
              <View>
                <Text className="text-sm font-medium text-gray-900">{host.name}</Text>
                <Text className="text-xs text-gray-600">Host</Text>
              </View>
            </View>
            {Boolean(host.phone) && (
              <Pressable
                onPress={() => Linking.openURL(`tel:${host.phone}`)}
                className="mt-4 flex-row items-center justify-center gap-2 rounded-md bg-accent py-2.5 active:bg-accent-dark"
              >
                <Phone size={16} color={COLORS.white} />
                <Text className="text-sm text-white">Call host</Text>
              </Pressable>
            )}
          </View>
        )}

        <View className="rounded-xl border border-gray-200 p-5">
          <View className="flex-row items-center gap-2">
            <Zap size={18} color={COLORS.accent} />
            <Text className="text-base font-medium text-accent">Quick Actions</Text>
          </View>
          <View className="mt-2">
            <QuickAction
              first
              icon={CalendarPlus}
              onPress={tryOrToast(() => addToPhoneCalendar(calendarEvent))}
            >
              Add to my calendar
            </QuickAction>
            <QuickAction
              icon={CalendarPlus}
              onPress={() => Linking.openURL(googleCalendarLink(calendarEvent))}
            >
              Add to Google calendar
            </QuickAction>
            <QuickAction icon={Download} onPress={tryOrToast(() => shareReceipt(booking))}>
              Download PDF receipt / Access Pass
            </QuickAction>
            <QuickAction icon={List} onPress={() => router.navigate('/bookings')}>
              View in my bookings
            </QuickAction>
          </View>
        </View>
      </View>
    </AppScreen>
  )
}
