import { useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import { COLORS } from '@/utils/colors'

// What the web's input "type" means on a phone: which keyboard to show, and no capital letters
const TYPES = {
  email: { keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false },
  tel: { keyboardType: 'phone-pad' },
  number: { keyboardType: 'number-pad' },
  password: { secureTextEntry: true, autoCapitalize: 'none', autoCorrect: false },
}

// A text input with an optional label, icon and error message.
// With React Hook Form, use FormTextField instead (it connects this to the form).
export default function TextField({
  label,
  icon: Icon,
  type = 'text',
  error,
  rightSlot,
  className = '',
  onFocus,
  onBlur,
  ref,
  ...inputProps
}) {
  // Phones have no "focus-within", so we track focus ourselves to colour the border
  const [focused, setFocused] = useState(false)
  const border = error ? 'border-red-500' : focused ? 'border-accent' : 'border-gray-300'

  return (
    <View className={className}>
      {Boolean(label) && <Text className="mb-1.5 text-sm font-medium text-accent">{label}</Text>}
      <View
        className={`flex-row items-center gap-3 rounded-lg border bg-white px-3.5 py-3 ${border}`}
      >
        {Icon && <Icon size={18} color={COLORS.gray500} />}
        <TextInput
          ref={ref}
          accessibilityLabel={label ?? inputProps.placeholder}
          placeholderTextColor={COLORS.gray400}
          className="flex-1 p-0 text-sm text-gray-900"
          onFocus={(event) => {
            setFocused(true)
            onFocus?.(event)
          }}
          onBlur={(event) => {
            setFocused(false)
            onBlur?.(event)
          }}
          {...TYPES[type]}
          {...inputProps}
        />
        {rightSlot}
      </View>
      {Boolean(error) && <Text className="mt-1 text-xs text-red-600">{error}</Text>}
    </View>
  )
}
