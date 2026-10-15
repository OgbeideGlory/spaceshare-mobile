import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import dayjs from 'dayjs'
import { Briefcase, CalendarDays, MapPin, Search } from 'lucide-react-native'
import Button from '@/components/ui/Button'
import DateField from '@/components/ui/DateField'
import Select from '@/components/ui/Select'
import { COLORS } from '@/utils/colors'
import { CITIES } from '@/utils/constants'
import { CATEGORY_TYPES } from '@/utils/searchLinks'

const INTENTS = [
  { label: 'Work', value: CATEGORY_TYPES.work },
  { label: 'Meet', value: CATEGORY_TYPES.meeting },
  { label: 'Create', value: CATEGORY_TYPES.creative },
]
const CITY_OPTIONS = CITIES.map((city) => ({ value: city, label: `${city}, Nigeria` }))
const RATES = [
  { value: 'hour', label: 'Hourly' },
  { value: 'day', label: 'Daily' },
]

// A label + icon + value, styled the same way for each field
function Field({ label, icon: Icon, children }) {
  return (
    <View>
      <Text className="text-xs font-medium text-primary">{label}</Text>
      <View className="mt-1 flex-row items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5">
        <Icon size={16} color={COLORS.gray500} />
        {children}
      </View>
    </View>
  )
}

const valueText = 'flex-1 text-sm text-gray-900'

// The "Fill your preferences" search box on the home page.
// It doesn't search by itself; it opens the Search screen with these choices.
export default function HeroSearchForm() {
  const [type, setType] = useState(INTENTS[0].value)
  const [city, setCity] = useState(CITIES[0])
  const [date, setDate] = useState('')
  // '' = no preference. 'hour' / 'day' = only show spaces charged that way.
  const [priceUnit, setPriceUnit] = useState('')

  function handleSubmit() {
    const params = { type, city }
    if (priceUnit) params.priceUnit = priceUnit
    if (date) params.date = date
    router.push({ pathname: '/search', params })
  }

  return (
    <View className="rounded-xl bg-white p-4 shadow-lg">
      <Text className="mb-3 text-sm font-medium text-gray-900">Fill your preferences</Text>

      {/* Two columns, like the web's grid-cols-2 */}
      <View className="flex-row flex-wrap justify-between gap-y-3">
        <View className="w-[48%]">
          <Select title="Intent" value={type} options={INTENTS} onChange={setType}>
            <Field label="Intent" icon={Briefcase}>
              <Text className={valueText}>{INTENTS.find((i) => i.value === type)?.label}</Text>
            </Field>
          </Select>
        </View>
        <View className="w-[48%]">
          <Select title="Location" value={city} options={CITY_OPTIONS} onChange={setCity}>
            <Field label="Location" icon={MapPin}>
              <Text numberOfLines={1} className={valueText}>
                {city}, Nigeria
              </Text>
            </Field>
          </Select>
        </View>
        <View className="w-[48%]">
          <DateField
            title="Date"
            value={date}
            onChange={setDate}
            minDate={dayjs().format('YYYY-MM-DD')}
          >
            <Field label="Date" icon={CalendarDays}>
              <Text className={date ? valueText : 'flex-1 text-sm text-gray-400'}>
                {date ? dayjs(date).format('DD/MM/YYYY') : 'dd/mm/yyyy'}
              </Text>
            </Field>
          </DateField>
        </View>

        {/* Hourly / Daily switch */}
        <View className="w-[48%]">
          <Text className="text-xs font-medium text-primary">Preferred Rate</Text>
          <View
            accessibilityRole="radiogroup"
            className="mt-1 flex-row rounded-full bg-gray-100 p-1"
          >
            {RATES.map((option) => {
              const picked = priceUnit === option.value
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: picked }}
                  // Tapping the one already picked switches it off (no preference)
                  onPress={() => setPriceUnit(picked ? '' : option.value)}
                  className={`flex-1 rounded-full py-1.5 ${picked ? 'border border-accent bg-white' : ''}`}
                >
                  <Text
                    className={`text-center text-sm ${picked ? 'font-medium text-gray-900' : 'text-gray-600'}`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <Button
          variant="accent"
          icon={Search}
          onPress={handleSubmit}
          className="w-full max-w-60 self-center"
        >
          Find Spaces
        </Button>
      </View>
    </View>
  )
}
