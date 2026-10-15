import { Pressable, Text, View } from 'react-native'
import { getErrorMessage } from '@/utils/getErrorMessage'

// "We couldn't load …" with a Try again button
export default function LoadError({ error, fallback, onRetry, className = '' }) {
  return (
    <View className={`rounded-xl bg-gray-50 p-8 ${className}`}>
      <Text className="text-center text-base text-gray-600">
        {getErrorMessage(error, fallback)}
      </Text>
      {onRetry && (
        <Pressable onPress={onRetry} accessibilityRole="button" className="mt-3">
          <Text className="text-center text-sm font-medium text-primary">Try again</Text>
        </Pressable>
      )}
    </View>
  )
}
