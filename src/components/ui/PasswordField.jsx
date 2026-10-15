import { useState } from 'react'
import { Pressable } from 'react-native'
import { Eye, EyeOff, Lock } from 'lucide-react-native'
import { COLORS } from '@/utils/colors'
import TextField from './TextField'

// A password input with a show/hide (eye) button
export default function PasswordField(props) {
  const [visible, setVisible] = useState(false)

  return (
    <TextField
      icon={Lock}
      type="password"
      secureTextEntry={!visible}
      rightSlot={
        <Pressable
          onPress={() => setVisible(!visible)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? (
            <Eye size={18} color={COLORS.gray500} />
          ) : (
            <EyeOff size={18} color={COLORS.gray500} />
          )}
        </Pressable>
      }
      {...props}
    />
  )
}
