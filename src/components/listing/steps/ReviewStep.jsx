import { Pressable, ScrollView, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { MapPin, Pencil } from 'lucide-react-native'
import Checkbox from '@/components/ui/Checkbox'
import { COLORS } from '@/utils/colors'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'
import { CATEGORIES, DAYS, timeLabel } from '../listingOptions'

// One "Basics" / "Details" / ... box with an Edit button
function ReviewSection({ title, extra, onEdit, children }) {
  return (
    <View className="rounded-lg bg-gray-50 p-4">
      <View className="flex-row items-center justify-between border-b border-gray-200 pb-2">
        <Text className="text-base font-medium text-gray-900">
          {title}
          {Boolean(extra) && (
            <Text className="text-sm font-normal text-gray-500">{`   ${extra}`}</Text>
          )}
        </Text>
        {onEdit && (
          <Pressable
            onPress={onEdit}
            className="flex-row items-center gap-1 rounded-full border border-gray-300 px-2.5 py-0.5 active:bg-white"
          >
            <Pencil size={12} color={COLORS.gray900} />
            <Text className="text-xs text-gray-900">Edit</Text>
          </Pressable>
        )}
      </View>
      <View className="mt-3">{children}</View>
    </View>
  )
}

// A "Label    Value" row
function Row({ label, children }) {
  return (
    <View className="flex-row gap-3 py-1.5">
      <Text className="w-24 text-sm text-gray-500">{label}</Text>
      <Text className="flex-1 text-sm text-gray-900">{children || '—'}</Text>
    </View>
  )
}

// canEditStep(stepIndex) is false for steps already sent to the API (edits wouldn't be saved).
// photosUploaded: the photos were already sent (e.g. before the app was closed)
export default function ReviewStep({ photos, photosUploaded, onEditStep, canEditStep }) {
  const { control } = useFormContext()
  const values = useWatch({ control })

  const category = CATEGORIES.find((c) => c.value === values.type)?.label
  const openDays = DAYS.filter((d) => values.openDays?.includes(d.dayOfWeek)).map((d) => d.short)
  const edit = (stepIndex) => (canEditStep(stepIndex) ? () => onEditStep(stepIndex) : undefined)

  return (
    <View className="gap-5">
      {/* Preview of the listing card */}
      <View className="items-center rounded-lg bg-gray-50 p-4">
        <View className="h-44 w-full overflow-hidden rounded-lg bg-gray-300">
          {photos[0] && (
            <Image
              source={photos[0].uri}
              accessibilityLabel="Cover photo"
              contentFit="cover"
              style={{ width: '100%', height: '100%' }}
            />
          )}
          <Text className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs">
            How Renters will see it
          </Text>
        </View>
        <Text className="mt-3 text-sm font-semibold text-gray-900">{values.name}</Text>
        <View className="flex-row items-center gap-1">
          <MapPin size={12} color={COLORS.gray600} />
          <Text className="text-xs text-gray-600">
            {values.address}, {values.city}
          </Text>
        </View>
      </View>

      <ReviewSection title="Basics" onEdit={edit(0)}>
        <Row label="Name">{values.name}</Row>
        <Row label="Category">{category}</Row>
        <Row label="Activities">{values.activities?.join(', ')}</Row>
        <Row label="Description">{values.description}</Row>
      </ReviewSection>

      <ReviewSection title="Details" onEdit={edit(1)}>
        <Row label="Location">
          {[values.address, values.neighborhood, values.city].filter(Boolean).join(', ')}
        </Row>
        <Row label="Capacity">{values.capacity} people</Row>
        <Row label="Amenities">{values.amenities?.join(', ')}</Row>
        <Row label="Equipment">{values.equipment?.join(', ')}</Row>
      </ReviewSection>

      <ReviewSection
        title="Photos"
        extra={
          photosUploaded && photos.length === 0
            ? 'Uploaded'
            : `${String(photos.length).padStart(2, '0')} Added`
        }
        onEdit={edit(2)}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-3"
        >
          {photos.map((photo, index) => (
            <Image
              key={photo.uri}
              source={photo.uri}
              accessibilityLabel={`Photo ${index + 1}`}
              contentFit="cover"
              style={{ width: 112, height: 80, borderRadius: 8 }}
            />
          ))}
        </ScrollView>
        {photos.length < 5 && !photosUploaded && (
          <Text className="mt-3 text-xs text-primary">
            Tip: listings with all 5 photos get more booking requests
          </Text>
        )}
      </ReviewSection>

      <ReviewSection title="Pricing and Availability" onEdit={edit(3)}>
        <Row label="Rate">
          {formatCurrency(values.pricingAmount)} per {values.pricingUnit}
        </Row>
        <Row label="Open Days">{openDays.join(', ')}</Row>
        <Row label="Hours">
          {timeLabel(values.openingTime)} - {timeLabel(values.closingTime)}
        </Row>
        <Row label="Bookings">
          {values.bookingMode === 'request' ? 'You approve each request' : 'Instant booking'}
        </Row>
        <Row label="Blocked Dates">{values.blockedDates?.map(formatDate).join(', ')}</Row>
      </ReviewSection>

      <Controller
        control={control}
        name="agreedToTerms"
        render={({ field, fieldState }) => (
          <View>
            {/* TODO: link "Host Terms" and "Service Standards" when the website has them */}
            <Checkbox
              checked={field.value === true}
              onChange={(checked) => field.onChange(checked)}
              label="I confirm this information is accurate and I agree to SpaceShare's Host Terms and Service Standards"
            />
            {fieldState.error && (
              <Text className="mt-1 text-xs text-red-600">{fieldState.error.message}</Text>
            )}
          </View>
        )}
      />
    </View>
  )
}
