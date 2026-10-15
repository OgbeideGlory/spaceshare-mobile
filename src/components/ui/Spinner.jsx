import { ActivityIndicator, Text, View } from 'react-native'
import { COLORS } from '@/utils/colors'

export default function Spinner({ label = 'Loading…' }) {
  return (
    <View accessibilityRole="progressbar" className="items-center justify-center gap-3 py-16">
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text className="text-sm text-gray-500">{label}</Text>
    </View>
  )
}
