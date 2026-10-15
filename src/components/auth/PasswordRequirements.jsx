import { Text, View } from 'react-native'
import { Check } from 'lucide-react-native'
import { COLORS } from '@/utils/colors'
import { PASSWORD_RULES } from '@/utils/validation'

// The checklist under a new password. Each rule turns green as the user types.
export default function PasswordRequirements({ password = '' }) {
  return (
    <View className="rounded-lg bg-accent/15 p-4">
      <Text className="text-sm font-medium text-accent">Password requirements</Text>
      <View className="mt-2 gap-1.5">
        {PASSWORD_RULES.map((rule) => {
          const passed = rule.test(password)
          return (
            <View key={rule.label} className="flex-row items-center gap-2">
              <Check size={14} color={passed ? COLORS.green600 : COLORS.gray400} />
              <Text className={`text-xs ${passed ? 'text-green-700' : 'text-gray-600'}`}>
                {rule.label}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
