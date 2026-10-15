import { useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import { COLORS } from '@/utils/colors'

// A multi-line text box with a label, error message and optional hint (e.g. a character count)
export default function TextareaField({ label, error, hint, className = '', ...inputProps }) {
  const [focused, setFocused] = useState(false)
  const border = error ? 'border-red-500' : focused ? 'border-accent' : 'border-gray-300'

  return (
    <View className={className}>
      {Boolean(label) && <Text className="mb-1.5 text-sm font-medium text-gray-900">{label}</Text>}
      <TextInput
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        accessibilityLabel={label}
        placeholderTextColor={COLORS.gray400}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`min-h-20 rounded-lg border bg-white px-3.5 py-3 text-sm text-gray-900 ${border}`}
        {...inputProps}
      />
      {Boolean(error || hint) && (
        <View className="mt-1 flex-row justify-between gap-4">
          {error ? <Text className="text-xs text-red-600">{error}</Text> : <View />}
          {hint ? <Text className="text-xs text-gray-500">{hint}</Text> : null}
        </View>
      )}
    </View>
  )
}
