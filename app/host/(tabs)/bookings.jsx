import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Image } from 'expo-image'
import dayjs from 'dayjs'
import { CalendarDays, CircleCheck, Clock, ScanLine, Search } from 'lucide-react-native'
import CheckInDialog from '@/components/host/CheckInDialog'
import HostScreen from '@/components/host/HostScreen'
import RequestActions from '@/components/host/RequestActions'
import Button from '@/components/ui/Button'
import DateField from '@/components/ui/DateField'
import LoadError from '@/components/ui/LoadError'
import Spinner from '@/components/ui/Spinner'
import StatusBadge from '@/components/ui/StatusBadge'
import UserAvatar from '@/components/ui/UserAvatar'
import { sizedImage } from '@/components/workspace/imageUrl'
import { useBookingsList } from '@/hooks/useBookingsList'
import { areaOf } from '@/utils/bookingHelpers'
import { COLORS } from '@/utils/colors'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatAs, formatTime } from '@/utils/formatDate'

const TAB_STATUSES = ['all', 'requested', 'pending', 'confirmed', 'completed']
const TAB_LABELS = { requested: 'Requests', pending: 'Awaiting payment' }
const hoursOf = (b) =>
  Math.round((dayjs(b.endTime).diff(dayjs(b.startTime), 'minute') / 60) * 10) / 10

function StatCard({ icon: Icon, iconBox, iconColor, label, value, footer }) {
  return (
    <View className="flex-row gap-3 rounded-lg border border-gray-300 p-3">
      <View className={`size-10 items-center justify-center rounded-full ${iconBox}`}>
        <Icon size={18} color={iconColor} />
      </View>
      <View>
        <Text className="text-base font-medium text-gray-900">{label}</Text>
        <Text className="text-2xl font-semibold text-gray-900">{value}</Text>
        <Text className="text-xs text-gray-700">{footer}</Text>
      </View>
    </View>
  )
}

// One booking. The web shows a wide table; on phones each booking is a card with the same details.
function BookingCard({ booking: b }) {
  return (
    <View className="gap-3 border-t border-gray-100 py-4">
      <View className="flex-row items-center gap-2">
        <UserAvatar user={typeof b.user === 'object' ? b.user : null} size={28} />
        <View className="flex-1">
          <Text className="text-sm text-gray-900">{b.user?.name ?? 'Guest'}</Text>
          {Boolean(b.user?.email) && <Text className="text-xs text-gray-600">{b.user.email}</Text>}
        </View>
        <View className="items-end">
          <StatusBadge status={b.status} className="rounded-lg px-4 py-1.5" />
          {Boolean(b.checkedInAt) && (
            <Text className="mt-1 text-[10px] text-green-700">Checked in</Text>
          )}
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <View className="h-8 w-14 overflow-hidden rounded bg-gray-200">
          {b.workspace?.images?.[0]?.url && (
            <Image
              source={sizedImage(b.workspace.images[0].url, 200)}
              contentFit="cover"
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </View>
        <View className="flex-1">
          <Text numberOfLines={1} className="text-sm text-gray-900">
            {b.workspace?.name ?? '—'}
          </Text>
          <Text className="text-xs text-gray-600">{areaOf(b.workspace)}</Text>
        </View>
        <Text className="text-sm text-gray-900">{formatCurrency(b.amount)}</Text>
      </View>

      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Text className="text-xs text-gray-800">
          {formatAs(b.startTime, 'MMM D, YYYY')} · {formatTime(b.startTime)} -{' '}
          {formatTime(b.endTime)} ({hoursOf(b)} hours)
        </Text>
        <View className="ml-auto flex-row items-center gap-2">
          <RequestActions booking={b} />
          <Pressable
            onPress={() => router.push({ pathname: '/host/bookings/[id]', params: { id: b._id } })}
            className="rounded-md border border-gray-300 px-3 py-1 active:bg-gray-50"
          >
            <Text className="text-xs text-gray-900">View</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const dateText = (value) => (value ? dayjs(value).format('DD/MM/YYYY') : 'dd/mm/yyyy')

// "Bookings" tab ("Space Host Booking Management" in Figma)
export default function HostBookingsScreen() {
  const { bookings, isLoading, error, refetch } = useBookingsList()
  // The dashboard's "booking requests" banner opens this tab on Requests (tab=requests)
  const params = useLocalSearchParams()
  const [tab, setTab] = useState(params.tab === 'requests' ? 'requested' : 'all')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [checkInOpen, setCheckInOpen] = useState(false)

  // Opened again from the banner while this tab was already open: switch to Requests
  const [lastTabParam, setLastTabParam] = useState(params.tab)
  if (params.tab !== lastTabParam) {
    setLastTabParam(params.tab)
    if (params.tab === 'requests') setTab('requested')
  }

  const count = (status) => bookings.filter((b) => b.status === status).length
  const query = search.trim().toLowerCase()

  const visible = bookings
    .filter((b) => tab === 'all' || b.status === tab)
    .filter((b) => {
      if (!query) return true
      const text = [
        b.user?.name,
        b.user?.email,
        b.workspace?.name,
        formatAs(b.startTime, 'MMM D, YYYY'),
      ]
        .join(' ')
        .toLowerCase()
      return text.includes(query)
    })
    .filter((b) => !from || !dayjs(b.startTime).isBefore(dayjs(from).startOf('day')))
    .filter((b) => !to || !dayjs(b.startTime).isAfter(dayjs(to).endOf('day')))
    .sort((a, b) => dayjs(b.startTime).diff(dayjs(a.startTime)))

  return (
    <HostScreen showBack={false} onRefresh={refetch}>
      <View className="gap-4 rounded-sm border border-gray-300 px-4 py-3">
        <View>
          <Text className="text-2xl font-semibold text-gray-900">Booking Management</Text>
          <Text className="mt-1 text-sm text-gray-700">
            View and manage your space bookings, track status and keep everything organized.
          </Text>
        </View>
        <Button variant="accent" size="sm" icon={ScanLine} onPress={() => setCheckInOpen(true)}>
          Check in a guest
        </Button>
      </View>

      <View className="mt-6 gap-3">
        <StatCard
          icon={CalendarDays}
          iconBox="bg-sky-50"
          iconColor="#0284c7"
          label="Total Bookings"
          value={bookings.length}
          footer="All time"
        />
        <StatCard
          icon={Clock}
          iconBox="bg-orange-50"
          iconColor="#f97316"
          label="Pending"
          value={count('pending')}
          footer="Awaiting payment"
        />
        <StatCard
          icon={CircleCheck}
          iconBox="bg-green-50"
          iconColor="#16a34a"
          label="Confirmed"
          value={count('confirmed')}
          footer="Active bookings"
        />
        <StatCard
          icon={CircleCheck}
          iconBox="bg-purple-50"
          iconColor="#9333ea"
          label="Completed"
          value={count('completed')}
          footer="Past bookings"
        />
      </View>

      <View className="mt-6 gap-4">
        <View
          accessibilityRole="tablist"
          accessibilityLabel="Booking status"
          className="flex-row flex-wrap gap-x-4 gap-y-2"
        >
          {TAB_STATUSES.map((key) => (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === key }}
            >
              <Text
                className={`text-sm ${tab === key ? 'font-medium text-blue-600' : 'text-gray-600'}`}
              >
                {key === 'all'
                  ? 'All'
                  : `${TAB_LABELS[key] ?? `${key[0].toUpperCase()}${key.slice(1)}`} (${count(key)})`}
              </Text>
            </Pressable>
          ))}
        </View>
        <View className="flex-row items-center gap-2 rounded-md border border-gray-300 px-3 py-2">
          <Search size={18} color={COLORS.gray700} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by guest name, space or date…"
            placeholderTextColor={COLORS.gray400}
            accessibilityLabel="Search bookings"
            className="flex-1 p-0 text-sm text-gray-900"
          />
        </View>
        <View className="flex-row items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5">
          <CalendarDays size={16} color={COLORS.gray700} />
          <DateField title="From date" value={from} onChange={setFrom} className="flex-1">
            <Text className={`text-sm ${from ? 'text-gray-900' : 'text-gray-400'}`}>
              {dateText(from)}
            </Text>
          </DateField>
          <Text className="text-sm text-gray-900">–</Text>
          <DateField title="To date" value={to} onChange={setTo} className="flex-1">
            <Text className={`text-sm ${to ? 'text-gray-900' : 'text-gray-400'}`}>
              {dateText(to)}
            </Text>
          </DateField>
          {Boolean(from || to) && (
            <Pressable
              onPress={() => {
                setFrom('')
                setTo('')
              }}
              hitSlop={8}
            >
              <Text className="text-xs text-primary">Clear</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View className="mt-6">
        {isLoading && <Spinner label="Loading bookings…" />}
        {Boolean(error) && (
          <LoadError error={error} fallback="We couldn't load your bookings." onRetry={refetch} />
        )}
        {!isLoading && !error && visible.length === 0 && (
          <Text className="rounded-lg bg-gray-50 p-10 text-center text-sm text-gray-600">
            {bookings.length
              ? 'No bookings match these filters.'
              : 'No bookings yet. They’ll show here once guests book your spaces.'}
          </Text>
        )}
        {visible.map((b) => (
          <BookingCard key={b._id} booking={b} />
        ))}
      </View>

      <CheckInDialog open={checkInOpen} onClose={() => setCheckInOpen(false)} />
    </HostScreen>
  )
}
