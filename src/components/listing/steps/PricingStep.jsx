import { Pressable, Text, TextInput, View } from 'react-native'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import dayjs from 'dayjs'
import { CalendarDays, X } from 'lucide-react-native'
import DateField from '@/components/ui/DateField'
import SelectField from '@/components/ui/SelectField'
import { COLORS } from '@/utils/colors'
import { formatDate } from '@/utils/formatDate'
import ChipToggleGroup from '../ChipToggleGroup'
import { DAYS, TIME_OPTIONS } from '../listingOptions'
import SectionLabel from '../SectionLabel'
import SelectableRow from '../SelectableRow'

const RATE_OPTIONS = [
  { value: 'hour', label: 'Hourly', suffix: 'Per Hour' },
  { value: 'day', label: 'Daily', suffix: 'Per Day' },
]

export default function PricingStep() {
  const {
    control,
    formState: { errors },
  } = useFormContext()
  const pricingUnit = useWatch({ control, name: 'pricingUnit' })
  const suffix = RATE_OPTIONS.find((option) => option.value === pricingUnit)?.suffix

  return (
    <View className="gap-8">
      <View>
        <SectionLabel title="Your rate" hint="How do you want to charge?" />
        <Controller
          control={control}
          name="pricingUnit"
          render={({ field }) => (
            <View
              accessibilityRole="radiogroup"
              accessibilityLabel="Rate"
              className="flex-row rounded-lg bg-gray-200 p-0.5"
            >
              {RATE_OPTIONS.map((option) => {
                const picked = field.value === option.value
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => field.onChange(option.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: picked }}
                    className={`flex-1 rounded-md py-2 ${picked ? 'border border-accent bg-white' : ''}`}
                  >
                    <Text
                      className={`text-center text-sm ${picked ? 'font-semibold text-accent' : 'text-gray-600'}`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          )}
        />
        <Controller
          control={control}
          name="pricingAmount"
          render={({ field, fieldState }) => (
            <>
              <View
                className={`mt-3 flex-row items-center gap-2 rounded-lg border bg-white px-3 py-2.5 ${fieldState.error ? 'border-red-500' : 'border-accent'}`}
              >
                <Text className="text-base font-semibold text-gray-900">₦</Text>
                <TextInput
                  keyboardType="number-pad"
                  placeholder="15,000"
                  placeholderTextColor={COLORS.gray400}
                  accessibilityLabel="Rate in naira"
                  value={Number.isFinite(field.value) ? String(field.value) : ''}
                  onChangeText={(text) => {
                    const digits = text.replace(/\D/g, '')
                    field.onChange(digits === '' ? undefined : Number(digits))
                  }}
                  onBlur={field.onBlur}
                  className="flex-1 p-0 text-base font-semibold text-gray-900"
                />
                <Text className="text-xs text-gray-700">{suffix}</Text>
              </View>
              {fieldState.error && (
                <Text className="mt-1 text-xs text-red-600">{fieldState.error.message}</Text>
              )}
            </>
          )}
        />
      </View>

      <View>
        <SectionLabel
          title="When are you open for booking?"
          hint="Only these days and hours can be booked"
        />
        <Text className="mb-1.5 text-sm font-medium text-primary">Opening hours</Text>
        <View className="flex-row items-center gap-3">
          <Controller
            control={control}
            name="openingTime"
            render={({ field }) => (
              <SelectField
                accessibilityLabel="Opening time"
                options={TIME_OPTIONS.slice(0, -1)}
                value={field.value}
                onChange={field.onChange}
                className="flex-1"
              />
            )}
          />
          <Text className="text-sm text-gray-900">to</Text>
          <Controller
            control={control}
            name="closingTime"
            render={({ field }) => (
              <SelectField
                accessibilityLabel="Closing time"
                options={TIME_OPTIONS.slice(1)}
                value={field.value}
                onChange={field.onChange}
                className="flex-1"
              />
            )}
          />
        </View>
        {errors.closingTime && (
          <Text className="mt-1 text-xs text-red-600">{errors.closingTime.message}</Text>
        )}

        <Text className="mb-1.5 mt-4 text-sm font-medium text-primary">Days</Text>
        <Controller
          control={control}
          name="openDays"
          render={({ field }) => (
            <ChipToggleGroup
              label="Open days"
              options={DAYS.map((day) => ({ value: day.dayOfWeek, label: day.short }))}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {errors.openDays && (
          <Text className="mt-1 text-xs text-red-600">{errors.openDays.message}</Text>
        )}
      </View>

      <View>
        <SectionLabel title="How should bookings work?" />
        <Controller
          control={control}
          name="bookingMode"
          render={({ field }) => (
            <View className="gap-4">
              <SelectableRow
                title="Instant Booking"
                description="Seekers book open slot straight away"
                selected={field.value === 'instant'}
                onSelect={() => field.onChange('instant')}
              />
              <SelectableRow
                title="Approve each request"
                description="You approve every booking before it is confirmed"
                selected={field.value === 'request'}
                onSelect={() => field.onChange('request')}
              />
            </View>
          )}
        />
      </View>

      <View>
        <SectionLabel title="Need a day off?" hint="Block dates when your space is unavailable" />
        <Controller
          control={control}
          name="blockedDates"
          render={({ field }) => (
            <>
              <DateField
                title="Add a blocked date"
                value=""
                minDate={dayjs().format('YYYY-MM-DD')}
                onChange={(date) => {
                  if (date && !field.value.includes(date))
                    field.onChange([...field.value, date].sort())
                }}
              >
                <View className="flex-row items-center justify-between rounded-lg border border-accent bg-white px-3 py-2.5">
                  <Text className="text-sm text-gray-400">Add a blocked date</Text>
                  <CalendarDays size={16} color={COLORS.gray600} />
                </View>
              </DateField>
              {field.value.length > 0 && (
                <View className="mt-2 flex-row flex-wrap gap-2">
                  {field.value.map((date) => (
                    <View
                      key={date}
                      className="flex-row items-center gap-1 rounded-full bg-gray-200 py-1 pl-2.5 pr-1.5"
                    >
                      <Text className="text-xs text-gray-900">{formatDate(date)}</Text>
                      <Pressable
                        onPress={() => field.onChange(field.value.filter((d) => d !== date))}
                        accessibilityLabel={`Unblock ${formatDate(date)}`}
                        hitSlop={6}
                        className="rounded-full p-0.5"
                      >
                        <X size={12} color={COLORS.gray800} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        />
        <Text className="mt-2 text-xs text-primary">Renters can&apos;t book blocked dates.</Text>
      </View>
    </View>
  )
}
