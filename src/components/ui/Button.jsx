import { Pressable, Text } from 'react-native'
import { router } from 'expo-router'
import { COLORS } from '@/utils/colors'

const VARIANTS = {
  primary: { box: 'bg-primary active:bg-primary-dark', text: 'text-white', icon: COLORS.white },
  outline: {
    box: 'border border-primary active:bg-primary-light',
    text: 'text-primary',
    icon: COLORS.primary,
  },
  accent: { box: 'bg-accent active:bg-accent-dark', text: 'text-white', icon: COLORS.white },
}

const SIZES = {
  sm: { box: 'px-3 py-1.5', text: 'text-sm' },
  md: { box: 'px-4 py-2.5', text: 'text-sm' },
  lg: { box: 'px-6 py-3', text: 'text-base' },
}

// Usage:
//   <Button onPress={save}>Save</Button>
//   <Button href="/login" variant="accent">Back to Log in</Button>   ← goes to that screen
//   <Button icon={ArrowRight} disabled={isSubmitting}>Log in</Button> ← icon after the text
// Like the web's inline buttons, it's only as wide as its text. Add className="self-stretch" for full width.
export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  onPress,
  icon: Icon,
  disabled = false,
  className = '',
  children,
}) {
  const look = VARIANTS[variant]
  const space = SIZES[size]

  return (
    <Pressable
      onPress={href ? () => router.push(href) : onPress}
      disabled={disabled}
      accessibilityRole={href ? 'link' : 'button'}
      accessibilityState={{ disabled }}
      className={`flex-row items-center justify-center gap-2 self-start rounded-lg ${look.box} ${space.box} ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      <Text className={`font-medium ${look.text} ${space.text}`}>{children}</Text>
      {Icon && <Icon size={16} color={look.icon} />}
    </Pressable>
  )
}
