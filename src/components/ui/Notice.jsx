import { Text } from 'react-native'

// A green box for good news, e.g. "Your email is verified. Log in to continue."
export default function Notice({ message }) {
  if (!message) return null
  return <Text className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{message}</Text>
}
