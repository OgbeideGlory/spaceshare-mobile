import { Stack } from 'expo-router'

// The sign-in screens: login, register, verify-email, forgot-password, reset-password
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
