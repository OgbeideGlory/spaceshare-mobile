import { Text, View } from 'react-native'

// A heading + small grey hint above each section of the form
export default function SectionLabel({ title, hint }) {
  return (
    <View className="mb-3">
      <Text accessibilityRole="header" className="text-base font-medium text-gray-900">
        {title}
      </Text>
      {Boolean(hint) && <Text className="mt-0.5 text-xs text-gray-600">{hint}</Text>}
    </View>
  )
}
