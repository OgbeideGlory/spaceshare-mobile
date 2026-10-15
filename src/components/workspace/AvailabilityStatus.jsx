import { ActivityIndicator, Text, View } from 'react-native'
import { CircleCheck, CircleX } from 'lucide-react-native'
import { COLORS } from '@/utils/colors'
import { getErrorMessage } from '@/utils/getErrorMessage'

// "Checking availability…" / "Available" / why it isn't / the check failed + Try again.
// `availability` comes from useSlotAvailability(). Used by the booking box and checkout.
export default function AvailabilityStatus({
  availability,
  availableText = 'Available',
  className = '',
}) {
  const { problem, isChecking, isAvailable, reason, error, retry } = availability
  return (
    <View accessibilityLiveRegion="polite" className={`min-h-5 gap-1 ${className}`}>
      {problem ? <Text className="text-sm text-red-600">{problem}</Text> : null}
      {isChecking && (
        <View className="flex-row items-center gap-1.5">
          <ActivityIndicator size="small" color={COLORS.gray600} />
          <Text className="text-sm text-gray-600">Checking availability…</Text>
        </View>
      )}
      {!isChecking && isAvailable && (
        <View className="flex-row items-center gap-1.5">
          <CircleCheck size={14} color="#15803d" />
          <Text className="text-sm text-green-700">{availableText}</Text>
        </View>
      )}
      {!isChecking && reason ? (
        <View className="flex-row items-center gap-1.5">
          <CircleX size={14} color={COLORS.red600} />
          <Text className="flex-1 text-sm text-red-600">{reason}</Text>
        </View>
      ) : null}
      {!isChecking && error && (
        <View className="flex-row items-center gap-1.5">
          <CircleX size={14} color={COLORS.red600} />
          <Text className="flex-1 text-sm text-red-600">
            {getErrorMessage(error, 'We couldn’t check if this time is free.')}{' '}
            <Text onPress={retry} className="font-medium text-primary underline">
              Try again
            </Text>
          </Text>
        </View>
      )}
    </View>
  )
}
