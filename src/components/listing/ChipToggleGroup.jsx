import { Pressable, Text, View } from 'react-native'
import { COLORS } from '@/utils/colors'

// A group of pill buttons the host can switch on and off (activities, amenities, days).
// value: the array of selected values. onChange: called with the new array.
// options: [{ value, label?, icon? }]
// columns: 2 → two per row (like the web's grid-cols-2); leave out to wrap naturally.
export default function ChipToggleGroup({
  options,
  value = [],
  onChange,
  label,
  columns,
  className = '',
}) {
  function toggle(optionValue) {
    onChange(
      value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue],
    )
  }

  return (
    <View
      accessibilityLabel={label}
      className={`flex-row flex-wrap ${columns ? 'justify-between gap-y-3' : 'gap-2'} ${className}`}
    >
      {options.map((option) => {
        const Icon = option.icon
        const selected = value.includes(option.value)
        return (
          <Pressable
            key={option.value}
            onPress={() => toggle(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={`flex-row items-center justify-center gap-1.5 rounded-full border px-2.5 py-2 ${columns ? 'w-[48%]' : ''} ${selected ? 'border-primary bg-primary' : 'border-gray-300 bg-white'}`}
          >
            {Icon && <Icon size={14} color={selected ? COLORS.white : COLORS.primary} />}
            <Text
              numberOfLines={1}
              className={`text-xs ${selected ? 'text-white' : 'text-gray-800'}`}
            >
              {option.label ?? option.value}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
