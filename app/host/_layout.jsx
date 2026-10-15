import { Stack } from 'expo-router'

// The host's area: the tabs, plus screens that open on top of them
// (booking details, settings, earnings, listings)
export default function HostLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
