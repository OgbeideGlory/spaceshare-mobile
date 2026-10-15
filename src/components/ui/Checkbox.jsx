import { Pressable, Text, View } from 'react-native'
import { Check } from 'lucide-react-native'

// A tick box with a label. The colour matches the web's (accent-green-700).
export default function Checkbox({ label, checked, onChange }) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      className="flex-row items-center gap-2 py-1"
    >
      <View
        className={`size-4 items-center justify-center rounded-sm border ${checked ? 'border-green-700 bg-green-700' : 'border-gray-400 bg-white'}`}
      >
        {checked && <Check size={12} strokeWidth={3} color="#ffffff" />}
      </View>
      <Text className="flex-1 text-sm text-gray-800">{label}</Text>
    </Pressable>
  )
}
