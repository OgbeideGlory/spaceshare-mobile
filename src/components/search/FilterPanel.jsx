import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { ArrowRight, ChevronDown, ChevronUp, Search } from 'lucide-react-native'
import { AMENITIES, EQUIPMENT } from '@/components/listing/listingOptions'
import Checkbox from '@/components/ui/Checkbox'
import { COLORS } from '@/utils/colors'
import { AREAS } from '@/utils/constants'
import { CAPACITY_RANGES, countActiveFilters, withoutFilters } from './searchFilters'

const AMENITY_OPTIONS = [...AMENITIES.map((a) => a.value), ...EQUIPMENT]

function Section({ title, children }) {
  return (
    <View accessibilityLabel={title} className="rounded-sm bg-gray-50 px-3 py-4">
      <Text className="mb-3 text-sm font-medium text-gray-900">{title}</Text>
      {children}
    </View>
  )
}

// A list of tick boxes. Shows the first few, with "Show more" for the rest.
function CheckboxList({ options, selected, onChange, initiallyShown = 4 }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? options : options.slice(0, initiallyShown)

  function toggle(value) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  }

  return (
    <>
      <View className="gap-0.5">
        {visible.map((option) => (
          <Checkbox
            key={option.value}
            label={option.label}
            checked={selected.includes(option.value)}
            onChange={() => toggle(option.value)}
          />
        ))}
      </View>
      {options.length > initiallyShown && (
        <Pressable
          onPress={() => setShowAll(!showAll)}
          className="ml-5 mt-3 flex-row items-center gap-1"
        >
          <Text className="text-xs text-primary">{showAll ? 'Show less' : 'Show more'}</Text>
          {showAll ? (
            <ChevronUp size={12} color={COLORS.primary} />
          ) : (
            <ChevronDown size={12} color={COLORS.primary} />
          )}
        </Pressable>
      )}
    </>
  )
}

// The filter panel. On the web it changes the URL; here it calls setFilters with the new filters.
export default function FilterPanel({ filters, setFilters }) {
  const [areaQuery, setAreaQuery] = useState('')
  const [price, setPrice] = useState({
    min: filters.minPrice === null ? '' : String(filters.minPrice),
    max: filters.maxPrice === null ? '' : String(filters.maxPrice),
  })
  const update = (key) => (value) => setFilters({ ...filters, [key]: value })

  // No city picked ("Anywhere in Nigeria"): offer every area we know
  const areas = (AREAS[filters.city] ?? Object.values(AREAS).flat())
    .filter((area) => area.toLowerCase().includes(areaQuery.toLowerCase()))
    .map((area) => ({ value: area, label: area }))

  const toNumber = (text) => (text === '' ? null : Number(text))
  function applyPrice() {
    setFilters({ ...filters, minPrice: toNumber(price.min), maxPrice: toNumber(price.max) })
  }

  const activeCount = countActiveFilters(filters)

  return (
    <View className="gap-6">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="text-lg font-semibold text-gray-900">Filters</Text>
          {activeCount > 0 && (
            <View className="size-5 items-center justify-center rounded-full bg-primary-light">
              <Text className="text-xs text-primary">{activeCount}</Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={() => {
            setPrice({ min: '', max: '' })
            setFilters(withoutFilters(filters))
          }}
          className="flex-row items-center gap-1"
        >
          <Text className="text-xs text-primary">Reset All</Text>
          <ArrowRight size={12} color={COLORS.primary} />
        </Pressable>
      </View>

      <Section title="Locations">
        <View className="mb-3 flex-row items-center gap-2 rounded-md border border-gray-300 bg-white px-2.5 py-2">
          <Search size={14} color={COLORS.gray500} />
          <TextInput
            value={areaQuery}
            onChangeText={setAreaQuery}
            placeholder="Search locations"
            placeholderTextColor={COLORS.gray400}
            accessibilityLabel="Search locations"
            className="flex-1 p-0 text-xs text-gray-900"
          />
        </View>
        <CheckboxList options={areas} selected={filters.areas} onChange={update('areas')} />
      </Section>

      <Section title="Capacity">
        <CheckboxList
          options={CAPACITY_RANGES.map((r) => ({ value: r.key, label: r.label }))}
          selected={filters.capacity}
          onChange={update('capacity')}
        />
      </Section>

      <Section title="Amenities / Equipment">
        <CheckboxList
          options={AMENITY_OPTIONS.map((a) => ({ value: a, label: a }))}
          selected={filters.amenities}
          onChange={update('amenities')}
          initiallyShown={6}
        />
      </Section>

      <Section title="Price Range">
        <View className="-mt-1 mb-3 flex-row gap-2">
          {[
            { value: 'hour', label: 'Per hour' },
            { value: 'day', label: 'Per day' },
          ].map((unit) => {
            const picked = filters.priceUnit === unit.value
            return (
              <Pressable
                key={unit.value}
                accessibilityRole="button"
                accessibilityState={{ selected: picked }}
                // Picks 'hour' or 'day'. Tapping the one already picked switches it off again.
                onPress={() => update('priceUnit')(picked ? '' : unit.value)}
                className={`rounded-full border px-3 py-1 ${picked ? 'border-primary bg-primary-light' : 'border-gray-300 bg-white'}`}
              >
                <Text className={`text-xs ${picked ? 'text-primary' : 'text-gray-700'}`}>
                  {unit.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
        <View className="flex-row items-center gap-3">
          {['min', 'max'].map((key, i) => (
            <View
              key={key}
              className="flex-1 flex-row items-center rounded-md border border-primary bg-white px-2 py-1.5"
            >
              <Text className="text-sm">₦</Text>
              <TextInput
                keyboardType="number-pad"
                value={price[key]}
                placeholder={i === 0 ? '10000' : '50000'}
                placeholderTextColor={COLORS.gray400}
                accessibilityLabel={i === 0 ? 'Minimum price' : 'Maximum price'}
                onChangeText={(text) => setPrice({ ...price, [key]: text.replace(/\D/g, '') })}
                onBlur={applyPrice}
                onSubmitEditing={applyPrice}
                returnKeyType="done"
                className="flex-1 p-0 text-sm text-gray-900"
              />
            </View>
          ))}
        </View>
      </Section>
    </View>
  )
}
