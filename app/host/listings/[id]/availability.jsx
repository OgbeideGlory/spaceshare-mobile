import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Toast from 'react-native-toast-message'
import { ArrowLeft, CalendarDays, X } from 'lucide-react-native'
import {
  cancelBlockedPeriod,
  createAvailability,
  createBlockedPeriod,
  deleteAvailability,
  getBlockedPeriods,
  getManagedAvailability,
  updateAvailability,
} from '@/api/availability'
import HostScreen from '@/components/host/HostScreen'
import ChipToggleGroup from '@/components/listing/ChipToggleGroup'
import { DAYS, TIME_OPTIONS, timeLabel } from '@/components/listing/listingOptions'
import { toBlockedPeriod } from '@/components/listing/listingSchema'
import SectionLabel from '@/components/listing/SectionLabel'
import Button from '@/components/ui/Button'
import DateField from '@/components/ui/DateField'
import LoadError from '@/components/ui/LoadError'
import SelectField from '@/components/ui/SelectField'
import Spinner from '@/components/ui/Spinner'
import { useMyListings } from '@/hooks/useMyListings'
import { COLORS } from '@/utils/colors'
import { formatDate } from '@/utils/formatDate'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { lagosToday, toLagos } from '@/utils/lagosTime'
import { isActive, summariseOpeningHours } from '@/utils/openingHours'

// A blocked period from the API as a day chip: { date: '2026-10-01', _id }. Cancelled ones are left out.
function toBlockedDay(period) {
  return { date: toLagos(period.startDateTime).format('YYYY-MM-DD'), _id: period._id }
}
const isStillBlocked = (period) => period.status !== 'cancelled' && !period.cancelledAt

// The weekly opening-hours rules that are switched on
const weeklyRules = (rules) => rules.filter((r) => r.type === 'recurring' && isActive(r))

function BackToSpaces() {
  return (
    <Pressable
      onPress={() => router.navigate('/host/spaces')}
      className="flex-row items-center gap-2 self-start"
    >
      <ArrowLeft size={16} color={COLORS.gray700} />
      <Text className="text-sm text-gray-700">Back to My Spaces</Text>
    </Pressable>
  )
}

// Manage availability: opening hours + blocked dates for one listing
export default function ListingAvailabilityScreen() {
  const { id } = useLocalSearchParams()
  const { listings, isLoading } = useMyListings()
  const listing = listings.find((l) => l._id === id)

  const rulesQuery = useQuery({
    queryKey: ['availability', id, 'manage'],
    queryFn: () => getManagedAvailability(id),
  })
  const blockedQuery = useQuery({
    queryKey: ['availability', id, 'blocked'],
    queryFn: () => getBlockedPeriods(id),
  })

  function body() {
    if (isLoading || rulesQuery.isLoading || blockedQuery.isLoading) {
      return <Spinner label="Loading listing…" />
    }
    if (rulesQuery.error || blockedQuery.error) {
      return (
        <LoadError
          error={rulesQuery.error || blockedQuery.error}
          fallback="We couldn't load this listing's availability."
          onRetry={() => {
            rulesQuery.refetch()
            blockedQuery.refetch()
          }}
        />
      )
    }
    if (!listing) {
      return (
        <View className="items-center rounded-xl bg-gray-50 p-10">
          <Text className="text-lg font-semibold text-gray-900">
            We can&apos;t find this listing
          </Text>
          <View className="mt-4">
            <BackToSpaces />
          </View>
        </View>
      )
    }
    return (
      <AvailabilityEditor
        key={listing._id}
        listing={listing}
        rules={rulesQuery.data}
        blockedPeriods={blockedQuery.data}
      />
    )
  }

  return <HostScreen>{body()}</HostScreen>
}

function AvailabilityEditor({ listing, rules, blockedPeriods }) {
  const queryClient = useQueryClient()
  const hours = summariseOpeningHours(rules)
  const [openDays, setOpenDays] = useState(hours?.openDays ?? [1, 2, 3, 4, 5])
  const [openingTime, setOpeningTime] = useState(hours?.openingTime ?? '08:00')
  const [closingTime, setClosingTime] = useState(hours?.closingTime ?? '19:00')
  const [blocked, setBlocked] = useState(() =>
    blockedPeriods
      .filter(isStillBlocked)
      .map(toBlockedDay)
      .sort((a, b) => a.date.localeCompare(b.date)),
  )

  // Save the opening hours. We load the rules that are saved right now (an earlier save may
  // have stopped half way), then: change the hours of days that stay open, add the newly
  // opened days, and only at the end remove the days that are now closed.
  // That way, if something fails part way, the listing never ends up with no opening hours.
  const hoursMutation = useMutation({
    mutationFn: async () => {
      const saved = weeklyRules(await getManagedAvailability(listing._id))
      for (const day of DAYS.filter((d) => openDays.includes(d.dayOfWeek))) {
        const rule = {
          type: 'recurring',
          dayOfWeek: day.dayOfWeek,
          startTime: openingTime,
          endTime: closingTime,
        }
        // A day could have more than one rule; we keep the first and remove the others
        const [existing, ...extras] = saved.filter((r) => r.dayOfWeek === day.dayOfWeek)
        if (existing) await updateAvailability(listing._id, existing._id, rule)
        else await createAvailability(listing._id, rule)
        for (const extra of extras) await deleteAvailability(listing._id, extra._id)
      }
      for (const rule of saved.filter((r) => !openDays.includes(r.dayOfWeek))) {
        await deleteAvailability(listing._id, rule._id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', listing._id] })
      Toast.show({ type: 'success', text1: 'Opening hours saved' })
    },
    onError: (error) => {
      // Some rules may have changed before the error, so reload what's really saved
      queryClient.invalidateQueries({ queryKey: ['availability', listing._id] })
      Toast.show({ type: 'error', text1: getErrorMessage(error) })
    },
  })

  const blockMutation = useMutation({
    mutationFn: async ({ add, remove }) => {
      if (add) {
        const saved = await createBlockedPeriod(listing._id, toBlockedPeriod(add))
        return [...blocked, { date: add, _id: saved?._id }].sort((a, b) =>
          a.date.localeCompare(b.date),
        )
      }
      if (remove._id) await cancelBlockedPeriod(listing._id, remove._id)
      return blocked.filter((b) => b.date !== remove.date)
    },
    onSuccess: (next) => {
      setBlocked(next)
      queryClient.invalidateQueries({ queryKey: ['availability', listing._id] })
    },
    onError: (error) => Toast.show({ type: 'error', text1: getErrorMessage(error) }),
  })

  const timeError = closingTime <= openingTime ? 'Closing time must be after opening time' : ''

  // The form sets the same hours for every open day. If the saved days have different hours
  // (e.g. shorter on Saturday), warn the host that saving will make them all the same.
  const savedWeekly = weeklyRules(rules)
  const hasDifferentHours = new Set(savedWeekly.map((r) => `${r.startTime}-${r.endTime}`)).size > 1

  return (
    <>
      <BackToSpaces />
      <Text className="mt-4 text-2xl font-semibold text-gray-900">Manage availability</Text>
      <Text className="mt-1 text-sm text-gray-600">{listing.name}</Text>

      <View className="mt-8 gap-6">
        <View className="rounded-xl border border-gray-200 p-5">
          <SectionLabel title="Opening hours" hint="Only these days and hours can be booked" />
          <View className="flex-row items-center gap-3">
            <SelectField
              accessibilityLabel="Opening time"
              options={TIME_OPTIONS.slice(0, -1)}
              value={openingTime}
              onChange={setOpeningTime}
              className="flex-1"
            />
            <Text className="text-sm text-gray-900">to</Text>
            <SelectField
              accessibilityLabel="Closing time"
              options={TIME_OPTIONS.slice(1)}
              value={closingTime}
              onChange={setClosingTime}
              className="flex-1"
            />
          </View>
          {Boolean(timeError) && <Text className="mt-1 text-xs text-red-600">{timeError}</Text>}
          <Text className="mb-1.5 mt-4 text-sm font-medium text-primary">Days</Text>
          <ChipToggleGroup
            label="Open days"
            options={DAYS.map((d) => ({ value: d.dayOfWeek, label: d.short }))}
            value={openDays}
            onChange={setOpenDays}
          />
          {hasDifferentHours && (
            <View className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <Text className="text-xs font-medium text-amber-900">
                Your days have different hours right now:
              </Text>
              {DAYS.filter((d) => savedWeekly.some((r) => r.dayOfWeek === d.dayOfWeek)).map((d) => (
                <Text key={d.dayOfWeek} className="mt-1 text-xs text-amber-900">
                  {d.short}:{' '}
                  {savedWeekly
                    .filter((r) => r.dayOfWeek === d.dayOfWeek)
                    .map((r) => `${timeLabel(r.startTime)} – ${timeLabel(r.endTime)}`)
                    .join(', ')}
                </Text>
              ))}
              <Text className="mt-1 text-xs text-amber-900">
                Saving gives every open day the hours chosen above.
              </Text>
            </View>
          )}
          <View className="mt-5 items-end">
            <Button
              onPress={() => hoursMutation.mutate()}
              disabled={hoursMutation.isPending || Boolean(timeError) || openDays.length === 0}
            >
              {hoursMutation.isPending ? 'Saving…' : 'Save opening hours'}
            </Button>
          </View>
        </View>

        <View className="rounded-xl border border-gray-200 p-5">
          <SectionLabel
            title="Blocked dates"
            hint="Days your space is unavailable. Guests can't book them."
          />
          <DateField
            title="Add a blocked date"
            value=""
            minDate={lagosToday()}
            onChange={(date) => {
              if (date && !blocked.some((b) => b.date === date)) blockMutation.mutate({ add: date })
            }}
          >
            <View
              className={`flex-row items-center justify-between rounded-lg border border-gray-300 px-3 py-2.5 ${blockMutation.isPending ? 'opacity-60' : ''}`}
            >
              <Text className="text-sm text-gray-400">
                {blockMutation.isPending ? 'Saving…' : 'Add a blocked date'}
              </Text>
              <CalendarDays size={16} color={COLORS.gray600} />
            </View>
          </DateField>
          {blocked.length > 0 ? (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {blocked.map((b) => (
                <View
                  key={b.date}
                  className="flex-row items-center gap-1 rounded-full bg-gray-200 py-1 pl-3 pr-1.5"
                >
                  <Text className="text-xs text-gray-900">{formatDate(b.date)}</Text>
                  <Pressable
                    onPress={() => blockMutation.mutate({ remove: b })}
                    disabled={blockMutation.isPending}
                    accessibilityLabel={`Unblock ${formatDate(b.date)}`}
                    hitSlop={6}
                    className="rounded-full p-0.5"
                  >
                    <X size={12} color={COLORS.gray800} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <Text className="mt-3 text-xs text-gray-500">No blocked dates.</Text>
          )}
        </View>
      </View>
    </>
  )
}
