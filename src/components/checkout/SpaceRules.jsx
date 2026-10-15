import { Text, View } from 'react-native'

const RULES = [
  'No smoking',
  'Leave the space as you found it',
  'Extra time is billed at the same rate',
  'Cancel any time before your booking starts',
]

export default function SpaceRules() {
  return (
    <View>
      <Text className="text-base font-medium text-gray-900">Space Rules</Text>
      <View className="mt-3 gap-2">
        {RULES.map((rule) => (
          <View key={rule} className="flex-row items-center gap-2">
            <View className="size-3 rounded-full bg-primary" />
            <Text className="text-sm text-gray-800">{rule}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
