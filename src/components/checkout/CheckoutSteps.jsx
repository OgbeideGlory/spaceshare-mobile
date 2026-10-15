import { Pressable, Text, View } from 'react-native'
import { ArrowLeft } from 'lucide-react-native'
import { COLORS } from '@/utils/colors'

const STEPS = ['Booking', 'Payment', 'Confirmation']

// "← Back   ① Booking —— ② Payment —— ③ Confirmation"
// onBack: what Back does (leave it out to hide Back)
export default function CheckoutSteps({ current, backLabel, onBack, backDisabled }) {
  return (
    <View className="gap-4">
      {onBack && (
        <Pressable
          onPress={onBack}
          disabled={backDisabled}
          accessibilityRole="button"
          className={`flex-row items-center gap-2 self-start ${backDisabled ? 'opacity-60' : ''}`}
        >
          <ArrowLeft size={16} color={COLORS.gray700} />
          <Text className="text-sm text-gray-700">{backLabel}</Text>
        </Pressable>
      )}
      <View className="flex-row items-center gap-2">
        {STEPS.map((step, index) => {
          const reached = index <= current
          const isLast = index === STEPS.length - 1
          return (
            <View
              key={step}
              accessibilityLabel={index === current ? `Step ${index + 1}: ${step}` : undefined}
              className={`flex-row items-center gap-2 ${isLast ? '' : 'flex-1'}`}
            >
              <View
                className={`size-5 items-center justify-center rounded-full border ${reached ? 'border-primary bg-primary' : 'border-gray-400'}`}
              >
                <Text className={`text-[11px] ${reached ? 'text-white' : 'text-gray-700'}`}>
                  {index + 1}
                </Text>
              </View>
              <Text className={`text-xs ${reached ? 'text-gray-900' : 'text-gray-600'}`}>
                {step}
              </Text>
              {!isLast && <View className="mx-2 h-px flex-1 bg-gray-300" />}
            </View>
          )
        })}
      </View>
    </View>
  )
}
