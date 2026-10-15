import { Text } from 'react-native'

// A red box for errors that belong to the whole form (e.g. "Invalid credentials")
export default function FormError({ message }) {
  if (!message) return null
  return (
    <Text accessibilityRole="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </Text>
  )
}
