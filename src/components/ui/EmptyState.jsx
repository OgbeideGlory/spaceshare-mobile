import { Text, View } from 'react-native'

// A grey box for "nothing here yet" messages
export default function EmptyState({ message, className = '' }) {
  return (
    <View className={`rounded-xl bg-gray-50 p-8 ${className}`}>
      <Text className="text-center text-base text-gray-600">{message}</Text>
    </View>
  )
}
