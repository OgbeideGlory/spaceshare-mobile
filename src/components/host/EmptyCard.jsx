import { Text, View } from 'react-native'
import { CircleX } from 'lucide-react-native'
import { COLORS } from '@/utils/colors'

// Grey "No bookings yet" style box
export default function EmptyCard({ title, text, icon: Icon = CircleX, value }) {
  return (
    <View className="items-center rounded-md border border-gray-200 px-4 py-6">
      {value !== undefined ? (
        <Text className="text-xl font-semibold text-gray-900">{value}</Text>
      ) : (
        <View className="size-8 items-center justify-center rounded-full bg-gray-100">
          <Icon size={16} color={COLORS.gray400} />
        </View>
      )}
      {Boolean(title) && <Text className="mt-2 text-sm font-medium text-gray-900">{title}</Text>}
      <Text className="mt-1 text-center text-xs text-gray-600">{text}</Text>
    </View>
  )
}
