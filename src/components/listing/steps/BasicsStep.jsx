import { Text, View } from 'react-native'
import { Controller, useFormContext } from 'react-hook-form'
import { Building2 } from 'lucide-react-native'
import FormTextField from '@/components/ui/FormTextField'
import TextareaField from '@/components/ui/TextareaField'
import ChipToggleGroup from '../ChipToggleGroup'
import { ACTIVITIES, CATEGORIES } from '../listingOptions'
import SectionLabel from '../SectionLabel'
import SelectableRow from '../SelectableRow'

export default function BasicsStep() {
  const {
    control,
    formState: { errors },
  } = useFormContext()

  return (
    <View className="gap-8">
      <View>
        <SectionLabel title="Space Name" />
        <FormTextField control={control} name="name" icon={Building2} placeholder="Gold Studios" />
      </View>

      <View>
        <SectionLabel title="Space Category" />
        {/* Only one category can be picked */}
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <View className="gap-4">
              {CATEGORIES.map((category) => (
                <SelectableRow
                  key={category.value}
                  title={category.label}
                  description={category.description}
                  icon={category.icon}
                  tinted
                  selected={field.value === category.value}
                  onSelect={() => field.onChange(category.value)}
                />
              ))}
            </View>
          )}
        />
        {errors.type && <Text className="mt-2 text-xs text-red-600">{errors.type.message}</Text>}
      </View>

      <View>
        <SectionLabel
          title="Select Activities"
          hint="Seekers search by activities. Select all that fits your space"
        />
        <Controller
          control={control}
          name="activities"
          render={({ field }) => (
            <ChipToggleGroup
              label="Activities"
              options={ACTIVITIES}
              value={field.value}
              onChange={field.onChange}
              columns={2}
              className="rounded-lg border border-gray-200 bg-mint p-3"
            />
          )}
        />
        {errors.activities && (
          <Text className="mt-2 text-xs text-red-600">{errors.activities.message}</Text>
        )}
      </View>

      <View>
        <SectionLabel title="Short Description" />
        <Controller
          control={control}
          name="description"
          render={({ field, fieldState }) => (
            <TextareaField
              placeholder="E.g A bright, spacious and comfortable studio for photoshoots, content creation, and small production"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
      </View>
    </View>
  )
}
