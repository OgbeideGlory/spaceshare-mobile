import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import dayjs from 'dayjs'
import { ShieldCheck } from 'lucide-react-native'
import { timeLabel } from '@/components/listing/listingOptions'
import DateField from '@/components/ui/DateField'
import Select from '@/components/ui/Select'
import { useAuth } from '@/hooks/useAuth'
import { useOpeningRules } from '@/hooks/useOpeningRules'
import { useSlotAvailability } from '@/hooks/useSlotAvailability'
import {
  addHours,
  clampGuests,
  DURATION_OPTIONS,
  estimatePrice,
  guestOptionsFor,
  slotHours,
  slotToParams,
} from '@/utils/bookingSlot'
import { COLORS } from '@/utils/colors'
import { ROLES } from '@/utils/constants'
import { formatCurrency } from '@/utils/formatCurrency'
import { lagosToday } from '@/utils/lagosTime'
import { hoursOnDate, startTimeOptions } from '@/utils/openingHours'
import AvailabilityStatus from './AvailabilityStatus'

const UNIT_SHORT = { hour: 'Hr', day: 'Day' }
const ROLE_NAMES = {
  [ROLES.HOST]: 'a host',
  [ROLES.ADMIN]: 'an admin',
  [ROLES.SUPER_ADMIN]: 'an admin',
}

// A labelled box in the booking panel (DATE, START TIME, ...)
function Box({ label, value }) {
  return (
    <View className="rounded-sm border border-gray-200 bg-white px-3 py-2.5">
      <Text className="text-[11px] uppercase tracking-wide text-gray-700">{label}</Text>
      <Text className="mt-1 text-base font-medium text-gray-900">{value}</Text>
    </View>
  )
}

// The price + date/time box on the space screen.
// initialSlot: from the route params (e.g. the date picked in search). The web keeps it in the URL.
export default function BookingPanel({ workspace, initialSlot }) {
  const { user } = useAuth()
  const [chosen, setChosen] = useState(initialSlot)
  // Never more guests than the space fits
  const slot = { ...chosen, guests: clampGuests(chosen.guests, workspace.capacity) }
  const hours = slotHours(slot)
  const availability = useSlotAvailability(workspace._id, slot)
  const price = estimatePrice(workspace, slot)
  // Only offer times when the space is open that day (undefined = hours unknown, so offer all)
  const { data: openingRules } = useOpeningRules(workspace._id)
  const openHours = hoursOnDate(openingRules, slot.date)
  const isClosed = openHours === null

  const updateSlot = (changes) => setChosen({ ...slot, ...changes })

  function handleBook() {
    if (!user) {
      router.push('/login')
      return
    }
    router.push({
      pathname: '/checkout/[spaceId]',
      params: { spaceId: workspace._id, ...slotToParams(slot) },
    })
  }

  // Only seekers book. Hosts and admins see the box, but can't use it.
  const isOtherRole = Boolean(user) && user.role !== ROLES.CUSTOMER
  const guestOptions = guestOptionsFor(workspace.capacity).map((n) => ({
    value: n,
    label: `${n} ${n === 1 ? 'Person' : 'Persons'}`,
  }))

  // Would the booking (at its current length) still fit if it started at this time?
  // Start times where it wouldn't are greyed out, instead of quietly making the booking shorter.
  function fitsFrom(start) {
    if (hours <= 0) return true // the slot is already broken; don't hide anything
    const end = addHours(start, hours)
    return Boolean(end) && (!openHours || end <= openHours.close)
  }
  const startOptions = startTimeOptions(openHours, slot.start).map((t) => ({
    ...t,
    disabled: t.value !== slot.start && !fitsFrom(t.value),
  }))
  const durationOptions = [
    // Keep an odd length (e.g. 2.5 hours) selectable if it came from search
    ...(!DURATION_OPTIONS.some((d) => d.value === hours) && hours > 0
      ? [{ value: hours, label: `${hours} hours` }]
      : []),
    ...DURATION_OPTIONS.map((d) => {
      const end = addHours(slot.start, d.value)
      return { ...d, disabled: !end || Boolean(openHours && end > openHours.close) }
    }),
  ]
  const canBook = !isOtherRole && !isClosed && availability.isAvailable

  return (
    <View className="rounded-xl border border-orange-100 bg-cream p-4">
      <Text className="text-2xl font-semibold text-gray-900">
        {formatCurrency(workspace.pricing?.amount)}
        <Text className="text-sm font-normal">
          {' '}
          / {UNIT_SHORT[workspace.pricing?.unit] ?? workspace.pricing?.unit}
        </Text>
      </Text>

      <View className="mt-5 gap-2.5">
        <DateField
          title="Date"
          value={slot.date}
          minDate={lagosToday()}
          onChange={(date) => date && updateSlot({ date })}
        >
          <Box label="Date" value={dayjs(slot.date).format('DD/MM/YYYY')} />
        </DateField>
        {openHours !== undefined && (
          <Text className={`text-xs ${isClosed ? 'text-red-600' : 'text-gray-600'}`}>
            {isClosed
              ? 'Closed on this day. Please pick another date.'
              : `Open ${timeLabel(openHours.open)} – ${timeLabel(openHours.close)} on this day`}
          </Text>
        )}
        <View className="flex-row gap-2.5">
          <View className="flex-1">
            <Select
              title="Start time"
              value={slot.start}
              options={startOptions}
              onChange={(start) =>
                updateSlot({
                  start,
                  // Keep the same length (1 hour if the old times didn't make sense)
                  end: addHours(start, hours > 0 ? hours : 1) ?? '24:00',
                })
              }
            >
              <Box label="Start time" value={timeLabel(slot.start)} />
            </Select>
          </View>
          <View className="flex-1">
            <Select
              title="Duration"
              value={hours}
              options={durationOptions}
              onChange={(value) => updateSlot({ end: addHours(slot.start, value) ?? '24:00' })}
            >
              <Box
                label="Duration"
                value={durationOptions.find((d) => d.value === hours)?.label ?? `${hours} hours`}
              />
            </Select>
          </View>
        </View>
        <Select
          title="People"
          value={slot.guests}
          options={guestOptions}
          onChange={(guests) => updateSlot({ guests })}
        >
          <Box
            label="People"
            value={`${slot.guests} ${slot.guests === 1 ? 'Person' : 'Persons'}`}
          />
        </Select>
      </View>

      {/* Is this time free? On a closed day the note under the date already says so */}
      {!isClosed && (
        <AvailabilityStatus
          availability={availability}
          availableText="Available for this time"
          className="mt-4"
        />
      )}

      <View className="mt-4 gap-2">
        <View className="flex-row justify-between">
          <Text className="text-sm text-gray-800">
            {formatCurrency(price.rate)} × {price.quantity} {price.unitLabel} =
          </Text>
          <Text className="text-sm font-semibold text-gray-800">{formatCurrency(price.total)}</Text>
        </View>
        {/* No service fee line: guests pay the booking amount; SpaceShare's fee comes out of the host's share */}
        <View className="flex-row justify-between border-t border-gray-300 pt-4">
          <Text className="font-semibold text-gray-900">Total</Text>
          <Text className="font-semibold text-gray-900">{formatCurrency(price.total)}</Text>
        </View>
      </View>

      <Pressable
        onPress={handleBook}
        disabled={!canBook}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canBook }}
        className={`mt-6 rounded-md bg-primary py-2.5 shadow-md active:bg-primary-dark ${canBook ? '' : 'opacity-50'}`}
      >
        <Text className="text-center text-sm font-medium text-white">
          {workspace.bookingMode === 'request' ? 'Request to book' : 'Book this space'}
        </Text>
      </Pressable>
      {workspace.bookingMode === 'request' && (
        <Text className="mt-2 text-center text-xs text-gray-600">
          The host approves each request. You won&apos;t be charged until they accept.
        </Text>
      )}

      {!user && (
        <View className="mt-4 flex-row gap-2 rounded-md border border-orange-100 bg-primary-light/40 p-3">
          <ShieldCheck size={18} color={COLORS.primary} />
          <Text className="flex-1 text-xs text-primary">
            You have to sign up or log in to book. We verify every seeker to keep hosts and spaces
            safe.
          </Text>
        </View>
      )}
      {isOtherRole && (
        <Text className="mt-4 rounded-md bg-gray-100 p-3 text-xs text-gray-700">
          You&apos;re signed in as {ROLE_NAMES[user.role] ?? 'a non-guest account'}. Only guest
          accounts can book spaces, so please log in with a guest account to book.
        </Text>
      )}
    </View>
  )
}
