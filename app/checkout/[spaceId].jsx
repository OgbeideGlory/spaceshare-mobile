import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Image } from 'expo-image'
import { useMutation, useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { CalendarDays, Clock, MapPin, Users } from 'lucide-react-native'
import { createBooking, getMyBookings } from '@/api/bookings'
import { getWorkspace } from '@/api/workspaces'
import CheckoutSteps from '@/components/checkout/CheckoutSteps'
import SpaceRules from '@/components/checkout/SpaceRules'
import AppScreen from '@/components/layout/AppScreen'
import { TIME_OPTIONS, timeLabel } from '@/components/listing/listingOptions'
import DateField from '@/components/ui/DateField'
import FormError from '@/components/ui/FormError'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import AvailabilityStatus from '@/components/workspace/AvailabilityStatus'
import { sizedImage } from '@/components/workspace/imageUrl'
import { useOpeningRules } from '@/hooks/useOpeningRules'
import { useSlotAvailability } from '@/hooks/useSlotAvailability'
import { areaOf } from '@/utils/bookingHelpers'
import {
  clampGuests,
  estimatePrice,
  guestOptionsFor,
  slotEnd,
  slotFromParams,
  slotStart,
} from '@/utils/bookingSlot'
import { COLORS } from '@/utils/colors'
import { WORKSPACE_TYPES } from '@/utils/constants'
import { formatCurrency } from '@/utils/formatCurrency'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { canStillPay } from '@/utils/isPaid'
import { lagosToday } from '@/utils/lagosTime'
import { hoursOnDate, startTimeOptions } from '@/utils/openingHours'

const UNIT_SHORT = { hour: '/hr', day: '/day' }

// A row in the booking box: icon + a date/time/guest value you can tap to change
function Row({ icon: Icon, value }) {
  return (
    <View className="flex-row items-center gap-2 border-b border-gray-200 py-2.5">
      <Icon size={16} color={COLORS.gray600} />
      <Text className="flex-1 text-sm text-gray-900">{value}</Text>
    </View>
  )
}

// The seeker's own unpaid booking for exactly this space and time, if there is one.
// (e.g. they reserved it, went back, then pressed "Continue to payment" again)
async function findMyHold(workspaceId, startTime, endTime) {
  const bookings = await getMyBookings()
  return bookings.find(
    (b) =>
      canStillPay(b) &&
      (b.workspace?._id ?? b.workspace) === workspaceId &&
      new Date(b.startTime).getTime() === new Date(startTime).getTime() &&
      new Date(b.endTime).getTime() === new Date(endTime).getTime(),
  )
}

// Step 1 of 3: check the details, then reserve the slot.
// Params: spaceId, plus the slot (date, start, end, guests) from the space screen.
export default function CheckoutScreen() {
  const params = useLocalSearchParams()
  const workspaceId = params.spaceId
  const [chosen, setChosen] = useState(() => slotFromParams(params))

  const {
    data: workspace,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => getWorkspace(workspaceId),
  })
  // Never more guests than the space fits
  const slot = { ...chosen, guests: clampGuests(chosen.guests, workspace?.capacity) }
  const availability = useSlotAvailability(workspaceId, slot)
  const { data: openingRules } = useOpeningRules(workspaceId)
  const openHours = hoursOnDate(openingRules, slot.date) // undefined = unknown, null = closed

  // Creating the booking holds the slot for 15 minutes while the seeker pays
  const bookingMutation = useMutation({
    mutationFn: async () => {
      const startTime = slotStart(slot).toISOString()
      const endTime = slotEnd(slot).toISOString()
      try {
        return await createBooking({ workspaceId, startTime, endTime, guestCount: slot.guests })
      } catch (error) {
        // 409 = the time is taken. If it's taken by this seeker's own unpaid hold, carry on paying for it.
        if (error.response?.status === 409) {
          const myHold = await findMyHold(workspaceId, startTime, endTime).catch(() => null)
          if (myHold) return myHold
        }
        throw error
      }
    },
    onSuccess: (booking) =>
      // Request-to-book spaces: nothing to pay until the host accepts
      booking.status === 'requested'
        ? router.replace({
            pathname: '/bookings/[id]',
            params: { id: booking._id, requestSent: '1' },
          })
        : router.push({
            pathname: '/checkout/pay/[bookingId]',
            params: { bookingId: booking._id },
          }),
  })

  const updateSlot = (changes) => setChosen({ ...slot, ...changes })

  if (isLoading) {
    return (
      <AppScreen>
        <Spinner label="Loading…" />
      </AppScreen>
    )
  }
  if (error) {
    return (
      <AppScreen>
        <FormError message={getErrorMessage(error, 'This space could not be loaded.')} />
      </AppScreen>
    )
  }

  const price = estimatePrice(workspace, slot)
  const isRequest = workspace.bookingMode === 'request' // the host approves each booking
  const images = workspace.images ?? []
  const typeLabel = WORKSPACE_TYPES.find((t) => t.value === workspace.type)?.label
  // 409 = the time was just taken, or is outside opening hours. The API says which.
  const bookingError = bookingMutation.error
    ? getErrorMessage(
        bookingMutation.error,
        bookingMutation.error.response?.status === 409
          ? 'Sorry, this time is no longer free. Please pick another time.'
          : undefined,
      )
    : ''
  const canContinue = openHours !== null && availability.isAvailable && !bookingMutation.isPending

  const endOptions = TIME_OPTIONS.slice(1).filter(
    (t) =>
      !openHours || t.value === slot.end || (t.value > slot.start && t.value <= openHours.close),
  )
  const guestOptions = guestOptionsFor(workspace.capacity).map((n) => ({
    value: n,
    label: `${n} guest${n === 1 ? '' : 's'}`,
  }))

  return (
    <AppScreen>
      <CheckoutSteps current={0} backLabel="Back to Space" onBack={() => router.back()} />

      {/* What they're booking */}
      <View className="mt-8">
        <View className="h-56 overflow-hidden rounded-md bg-gray-200">
          {images[0] && (
            <Image
              source={sizedImage(images[0].url, 1200)}
              accessibilityLabel={workspace.name}
              contentFit="cover"
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </View>
        {images.length > 1 && (
          <View className="mt-3 flex-row gap-3">
            {images.slice(1, 4).map((image) => (
              <Image
                key={image.publicId ?? image.url}
                source={sizedImage(image.url, 400)}
                contentFit="cover"
                style={{ flex: 1, height: 80, borderRadius: 6 }}
              />
            ))}
          </View>
        )}

        {Boolean(typeLabel) && (
          <Text className="mt-5 self-start rounded-md bg-primary-light px-6 py-1 text-sm text-gray-900">
            {typeLabel}
          </Text>
        )}
        <Text className="mt-3 text-base font-semibold text-gray-900">{workspace.name}</Text>
        <View className="mt-2 flex-row items-center gap-1.5">
          <MapPin size={14} color={COLORS.gray800} />
          <Text className="flex-1 text-sm text-gray-800">
            {[workspace.location?.address, areaOf(workspace)].filter(Boolean).join(', ')}
          </Text>
        </View>
        <View className="mt-3 flex-row flex-wrap gap-2">
          <View className="flex-row items-center gap-1 rounded-md bg-primary-light/60 px-2 py-1">
            <Users size={12} color={COLORS.gray900} />
            <Text className="text-xs text-gray-900">Up to {workspace.capacity}</Text>
          </View>
          {workspace.amenities?.slice(0, 4).map((amenity) => (
            <Text key={amenity} className="rounded-md bg-primary-light/60 px-2 py-1 text-xs">
              {amenity}
            </Text>
          ))}
        </View>

        <Text className="mt-8 text-base font-medium text-gray-900">About this Space</Text>
        <Text className="mt-2 text-sm text-gray-700">{workspace.description}</Text>
      </View>

      {/* The booking box */}
      <View className="mt-10 gap-8">
        <View className="rounded-md border border-orange-200 p-4">
          <View className="flex-row justify-between">
            <Text className="text-lg font-semibold text-gray-900">
              {formatCurrency(workspace.pricing?.amount)}
            </Text>
            <Text className="text-lg text-gray-900">{UNIT_SHORT[workspace.pricing?.unit]}</Text>
          </View>

          <View className="mt-3">
            <DateField
              title="Date"
              value={slot.date}
              minDate={lagosToday()}
              onChange={(date) => date && updateSlot({ date })}
            >
              <Row icon={CalendarDays} value={dayjs(slot.date).format('DD/MM/YYYY')} />
            </DateField>
            {openHours !== undefined && (
              <Text className={`mt-1 text-xs ${openHours ? 'text-gray-600' : 'text-red-600'}`}>
                {openHours
                  ? `Open ${timeLabel(openHours.open)} – ${timeLabel(openHours.close)} on this day`
                  : 'Closed on this day. Please pick another date.'}
              </Text>
            )}
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Select
                  title="Start time"
                  value={slot.start}
                  options={startTimeOptions(openHours, slot.start)}
                  onChange={(start) => updateSlot({ start })}
                >
                  <Row icon={Clock} value={timeLabel(slot.start)} />
                </Select>
              </View>
              <View className="flex-1">
                <Select
                  title="End time"
                  value={slot.end}
                  options={endOptions}
                  onChange={(end) => updateSlot({ end })}
                >
                  <Row icon={Clock} value={timeLabel(slot.end)} />
                </Select>
              </View>
            </View>
            <Select
              title="Guests"
              value={slot.guests}
              options={guestOptions}
              onChange={(guests) => updateSlot({ guests })}
            >
              <Row icon={Users} value={`${slot.guests} guest${slot.guests === 1 ? '' : 's'}`} />
            </Select>
          </View>

          {openHours !== null && (
            <AvailabilityStatus availability={availability} className="mt-3" />
          )}

          <View className="mt-3 gap-1.5">
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-900">
                Rate × duration ({price.quantity} {price.unitLabel})
              </Text>
              <Text className="text-xs text-gray-900">{formatCurrency(price.total)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs font-semibold text-gray-900">Total Cost</Text>
              <Text className="text-xs font-semibold text-gray-900">
                {formatCurrency(price.total)}
              </Text>
            </View>
          </View>

          <View className="mt-4">
            <FormError message={bookingError} />
          </View>
          <Pressable
            onPress={() => bookingMutation.mutate()}
            disabled={!canContinue}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canContinue }}
            className={`mt-2 rounded-md bg-primary py-2.5 shadow-md active:bg-primary-dark ${canContinue ? '' : 'opacity-50'}`}
          >
            <Text className="text-center text-sm font-medium text-white">
              {isRequest
                ? bookingMutation.isPending
                  ? 'Sending your request…'
                  : 'Send booking request'
                : bookingMutation.isPending
                  ? 'Reserving your slot…'
                  : 'Continue to payment'}
            </Text>
          </Pressable>
          <Text className="mt-2 text-center text-xs text-gray-600">
            {isRequest
              ? 'The host approves each booking. They have 24 hours to reply, and you only pay once they accept.'
              : 'We’ll hold this time for 15 minutes while you pay.'}
          </Text>
        </View>

        <SpaceRules />
      </View>
    </AppScreen>
  )
}
