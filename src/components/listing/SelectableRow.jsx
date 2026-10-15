import { Pressable, Text, View } from 'react-native'
import { Check } from 'lucide-react-native'
import { COLORS } from '@/utils/colors'

// A full-width row with a square tick box on the right (category cards, equipment list, booking mode).
export default function SelectableRow({
  title,
  description,
  icon: Icon,
  selected,
  onSelect,
  disabled = false,
  badge,
  tinted = false,
}) {
  return (
    <Pressable
      onPress={onSelect}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      className={`flex-row items-center gap-4 rounded-lg border px-4 py-3 ${tinted ? 'bg-blush' : 'bg-white'} ${selected ? 'border-primary' : 'border-gray-200'} ${disabled ? 'opacity-60' : ''}`}
    >
      {Icon && <Icon size={20} color={COLORS.primary} />}
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-medium text-gray-900">{title}</Text>
          {Boolean(badge) && (
            <Text className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] text-gray-600">
              {badge}
            </Text>
          )}
        </View>
        {Boolean(description) && (
          <Text className="mt-0.5 text-xs text-gray-600">{description}</Text>
        )}
      </View>
      <View
        className={`size-4 items-center justify-center rounded-sm border border-primary ${selected ? 'bg-primary' : ''}`}
      >
        {selected && <Check size={12} strokeWidth={3} color={COLORS.white} />}
      </View>
    </Pressable>
  )
}
