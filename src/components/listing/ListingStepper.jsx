import { Text, View } from 'react-native'
import { STEPS } from './listingSchema'

// The 1–5 circles with labels. Steps up to the current one are orange.
export default function ListingStepper({ currentIndex }) {
  return (
    <View className="flex-row">
      {/* The grey line behind the circles, with the orange part on top */}
      <View className="absolute left-0 right-0 top-3.5 h-px bg-gray-300" />
      <View
        className="absolute left-0 top-3.5 h-px bg-primary"
        style={{ width: `${((currentIndex + 0.5) / STEPS.length) * 100}%` }}
      />

      {STEPS.map((step, index) => {
        const reached = index <= currentIndex
        return (
          <View
            key={step.label}
            accessibilityLabel={
              index === currentIndex ? `Step ${index + 1}: ${step.label}` : undefined
            }
            className="flex-1 items-center gap-1.5"
          >
            <View
              className={`size-7 items-center justify-center rounded-full ${reached ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <Text className={`text-sm ${reached ? 'text-white' : 'text-gray-700'}`}>
                {index + 1}
              </Text>
            </View>
            <Text
              className={`text-center text-[11px] leading-tight ${reached ? 'font-medium text-primary' : 'text-gray-700'}`}
            >
              {step.label}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
