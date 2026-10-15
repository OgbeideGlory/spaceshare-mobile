import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import dayjs from 'dayjs'
import { Briefcase, CalendarDays, ChevronDown, Clock, MapPin, Users } from 'lucide-react-native'
import DateField from '@/components/ui/DateField'
import Select from '@/components/ui/Select'
import { DURATION_OPTIONS, GUEST_OPTIONS } from '@/utils/bookingSlot'
import { COLORS } from '@/utils/colors'
import { CITIES } from '@/utils/constants'
import { CATEGORY_TYPES } from '@/utils/searchLinks'

const SPACE_TYPES = [
  { value: '', label: 'Any space' },
  { value: CATEGORY_TYPES.work, label: 'Work' },
  { value: CATEGORY_TYPES.meeting, label: 'Meet' },
  { value: CATEGORY_TYPES.creative, label: 'Create' },
]
const CITY_OPTIONS = [
  { value: '', label: 'Anywhere in Nigeria' },
  ...CITIES.map((city) => ({ value: city, label: `${city}, Nigeria` })),
]
const PEOPLE_OPTIONS = GUEST_OPTIONS.map((n) => ({
  value: n,
  label: `${n} ${n === 1 ? 'person' : 'people'}`,
}))

const labelOf = (options, value) => options.find((o) => o.value === value)?.label ?? ''

// A label + icon + value in the orange-tinted search bar
function Field({ label, icon: Icon, value, chevron = true, muted = false }) {
  return (
    <View>
      <Text className="text-xs font-medium text-primary">{label}</Text>
      <View className="mt-1.5 flex-row items-center gap-2 rounded-md border border-gray-300 bg-white px-2.5 py-2">
        <Icon size={14} color={COLORS.gray700} />
        <Text
          numberOfLines={1}
          className={`flex-1 text-xs ${muted ? 'text-gray-400' : 'text-gray-900'}`}
        >
          {value}
        </Text>
        {chevron && <ChevronDown size={14} color={COLORS.gray700} />}
      </View>
    </View>
  )
}

// The "What space / Where / When / Duration / People" bar. Searches when Search is pressed.
export default function SearchBar({ filters, onSearch }) {
  const [values, setValues] = useState({
    type: filters.type,
    city: filters.city, // '' = anywhere in Nigeria
    date: filters.date,
    duration: filters.duration,
    people: filters.people,
  })
  const update = (key) => (value) => setValues({ ...values, [key]: value })

  return (
    // Two columns, like the web's grid-cols-2
    <View className="flex-row flex-wrap items-end justify-between gap-y-3 rounded-sm bg-cream px-3 py-3">
      <View className="w-[48%]">
        <Select
          title="What space do you want?"
          value={values.type}
          options={SPACE_TYPES}
          onChange={update('type')}
        >
          <Field
            label="What space do you want?"
            icon={Briefcase}
            value={labelOf(SPACE_TYPES, values.type)}
          />
        </Select>
      </View>
      <View className="w-[48%]">
        <Select title="Where?" value={values.city} options={CITY_OPTIONS} onChange={update('city')}>
          <Field label="Where?" icon={MapPin} value={labelOf(CITY_OPTIONS, values.city)} />
        </Select>
      </View>
      <View className="w-[48%]">
        <DateField
          title="When?"
          value={values.date}
          onChange={update('date')}
          minDate={dayjs().format('YYYY-MM-DD')}
        >
          <Field
            label="When?"
            icon={CalendarDays}
            chevron={false}
            muted={!values.date}
            value={values.date ? dayjs(values.date).format('DD/MM/YYYY') : 'dd/mm/yyyy'}
          />
        </DateField>
      </View>
      <View className="w-[48%]">
        <Select
          title="Duration"
          value={values.duration}
          options={DURATION_OPTIONS}
          onChange={update('duration')}
        >
          <Field label="Duration" icon={Clock} value={labelOf(DURATION_OPTIONS, values.duration)} />
        </Select>
      </View>
      <View className="w-[48%]">
        <Select
          title="People"
          value={values.people}
          options={PEOPLE_OPTIONS}
          onChange={update('people')}
        >
          <Field label="People" icon={Users} value={labelOf(PEOPLE_OPTIONS, values.people)} />
        </Select>
      </View>
      <Pressable
        onPress={() => onSearch(values)}
        accessibilityRole="button"
        className="rounded-md border border-primary px-4 py-2 active:bg-primary"
      >
        <Text className="text-sm text-primary">Search</Text>
      </Pressable>
    </View>
  )
}
