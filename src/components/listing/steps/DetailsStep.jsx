import { Pressable, Text, TextInput, View } from 'react-native'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { MapPin, Minus, Plus } from 'lucide-react-native'
import FormTextField from '@/components/ui/FormTextField'
import SelectField from '@/components/ui/SelectField'
import { AREAS, CITIES } from '@/utils/constants'
import { COLORS } from '@/utils/colors'
import ChipToggleGroup from '../ChipToggleGroup'
import { AMENITIES, EQUIPMENT, NO_EQUIPMENT } from '../listingOptions'
import SectionLabel from '../SectionLabel'
import SelectableRow from '../SelectableRow'

// The "+ 55 −" box for capacity
function CapacityStepper({ value, onChange }) {
  const hasNumber = Number.isFinite(value)
  // What the + and − buttons count from when the box is empty
  const count = hasNumber ? value : 0

  return (
    <View className="flex-row items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2">
      <View className="flex-row items-center rounded-md border border-gray-300 px-1.5 py-1">
        <Pressable
          onPress={() => onChange(count + 1)}
          accessibilityLabel="Add one person"
          hitSlop={6}
          className="size-6 items-center justify-center rounded"
        >
          <Plus size={14} color={COLORS.gray700} />
        </Pressable>
        <TextInput
          keyboardType="number-pad"
          value={hasNumber ? String(value) : ''} // an empty box shows empty, so it matches the form value
          onChangeText={(text) => {
            const digits = text.replace(/\D/g, '')
            onChange(digits === '' ? undefined : Number(digits))
          }}
          accessibilityLabel="Maximum number of people"
          className="w-12 p-0 text-center text-sm text-gray-900"
        />
        <Pressable
          onPress={() => onChange(Math.max(1, count - 1))}
          accessibilityLabel="Remove one person"
          hitSlop={6}
          className="size-6 items-center justify-center rounded"
        >
          <Minus size={14} color={COLORS.gray700} />
        </Pressable>
      </View>
      <Text className="text-sm font-medium text-gray-900">People, Maximum</Text>
    </View>
  )
}

export default function DetailsStep() {
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext()
  const city = useWatch({ control, name: 'city' })

  return (
    <View className="gap-8">
      <View>
        <SectionLabel
          title="Location"
          hint="Your exact address stays private until a booking is confirmed"
        />
        <View className="gap-3">
          <FormTextField
            control={control}
            name="address"
            icon={MapPin}
            placeholder="E.g 14 Marina Close, GRA Ikeja"
            accessibilityLabel="Street address"
          />
          <Controller
            control={control}
            name="city"
            render={({ field, fieldState }) => (
              <SelectField
                accessibilityLabel="City"
                options={CITIES.map((c) => ({ value: c, label: c }))}
                value={field.value}
                onChange={(value) => {
                  field.onChange(value)
                  // The old area belongs to the old city
                  setValue('neighborhood', '')
                }}
                error={fieldState.error?.message}
              />
            )}
          />
          {/* Seekers search by area; the street address is only shown after they book */}
          <Controller
            control={control}
            name="neighborhood"
            render={({ field }) => (
              <SelectField
                accessibilityLabel="Area"
                options={[
                  { value: '', label: 'Area (optional)' },
                  ...(AREAS[city] ?? []).map((area) => ({ value: area, label: area })),
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </View>
      </View>

      <View>
        <SectionLabel title="Capacity" hint="How many people fit comfortably?" />
        <Controller
          control={control}
          name="capacity"
          render={({ field }) => <CapacityStepper value={field.value} onChange={field.onChange} />}
        />
        {errors.capacity && (
          <Text className="mt-2 text-xs text-red-600">{errors.capacity.message}</Text>
        )}
      </View>

      <View>
        <SectionLabel title="Amenities" hint="What comes with the space?" />
        <Controller
          control={control}
          name="amenities"
          render={({ field }) => (
            <ChipToggleGroup
              label="Amenities"
              options={AMENITIES}
              value={field.value}
              onChange={field.onChange}
              columns={2}
              className="rounded-lg border border-gray-200 bg-mint p-3"
            />
          )}
        />
      </View>

      <View>
        <SectionLabel title="Equipments Included" hint="Equipment available for use" />
        <Controller
          control={control}
          name="equipment"
          render={({ field }) => {
            // "No equipment" can't be picked together with anything else
            function toggle(item) {
              if (item === NO_EQUIPMENT) {
                field.onChange(field.value.includes(NO_EQUIPMENT) ? [] : [NO_EQUIPMENT])
                return
              }
              const withoutNone = field.value.filter((v) => v !== NO_EQUIPMENT)
              field.onChange(
                withoutNone.includes(item)
                  ? withoutNone.filter((v) => v !== item)
                  : [...withoutNone, item],
              )
            }
            return (
              <View className="gap-2">
                {[...EQUIPMENT, NO_EQUIPMENT].map((item) => (
                  <SelectableRow
                    key={item}
                    title={item}
                    selected={field.value.includes(item)}
                    onSelect={() => toggle(item)}
                  />
                ))}
              </View>
            )
          }}
        />
        {errors.equipment && (
          <Text className="mt-2 text-xs text-red-600">{errors.equipment.message}</Text>
        )}
      </View>
    </View>
  )
}
