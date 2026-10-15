import '../global.css'
import { useEffect } from 'react'
import { AppState, Platform, Text, View } from 'react-native'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import NetInfo from '@react-native-community/netinfo'
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query'
import Toast from 'react-native-toast-message'
import Button from '@/components/ui/Button'
import { AuthProvider } from '@/context/AuthContext'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/utils/constants'
import { isAdmin } from '@/utils/dashboardFor'

// Keep the splash screen up until we know whether someone is signed in
SplashScreen.preventAutoHideAsync()

// The same settings as the web app (src/main.jsx)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry once when the server is unreachable or errors (e.g. Render waking up),
      // but not for 4xx answers like 404 or 403: asking again won't change them
      retry: (failureCount, error) => {
        const status = error?.response?.status
        if (status >= 400 && status < 500) return false
        return failureCount < 1
      },
    },
  },
})

// Phones have no browser "online" event: ask NetInfo instead,
// so requests wait while the phone is offline and carry on when it's back.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(Boolean(state.isConnected))),
)

// Refresh data when the app comes back to the front (the phone version of "window focus")
function useRefreshOnAppFocus() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (Platform.OS !== 'web') focusManager.setFocused(status === 'active')
    })
    return () => subscription.remove()
  }, [])
}

// Signed in, but the server couldn't be reached to check: let them retry instead of logging them out
function CantReachServer({ onRetry }) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <View className="w-full rounded-xl bg-gray-50 p-8">
        <Text className="text-center text-lg font-semibold text-gray-900">
          We couldn&apos;t reach SpaceShare
        </Text>
        <Text className="mt-2 text-center text-sm text-gray-600">
          The server may be waking up. This can take up to a minute.
        </Text>
        <Button onPress={onRetry} className="mt-5 self-center">
          Try again
        </Button>
      </View>
    </View>
  )
}

// Which screens each person can open. When someone signs in or out, the guards change
// and Expo Router moves them to a screen they're allowed on (app/index.jsx picks which).
function RootNavigator() {
  const { user, isLoading, sessionError, retrySession } = useAuth()

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync()
  }, [isLoading])

  if (isLoading) return null
  if (!user && sessionError) return <CantReachServer onRetry={retrySession} />

  const role = user?.role
  // Anyone signed in who isn't a host or admin is a seeker (like the web's fallback).
  // Signed-out visitors use the seeker tabs too: they can browse, and log in to book.
  const isSeeker = !user || (role !== ROLES.HOST && !isAdmin(role))
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={isSeeker}>
        <Stack.Screen name="(seeker)" />
      </Stack.Protected>
      <Stack.Protected guard={role === ROLES.HOST}>
        <Stack.Screen name="host" />
      </Stack.Protected>
      <Stack.Protected guard={isAdmin(role)}>
        <Stack.Screen name="admin" />
      </Stack.Protected>
      {/* Booking and paying: signed-in seekers only */}
      <Stack.Protected guard={Boolean(user) && isSeeker}>
        <Stack.Screen name="checkout/[spaceId]" />
        <Stack.Screen name="checkout/pay/[bookingId]" />
        <Stack.Screen name="paystack/callback" />
        <Stack.Screen name="bookings/[id]/index" />
        <Stack.Screen name="bookings/[id]/confirmation" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(user)}>
        <Stack.Screen name="notifications" />
      </Stack.Protected>
      {/* Open to everyone */}
      <Stack.Screen name="search" />
      <Stack.Screen name="space/[id]" />
    </Stack>
  )
}

export default function RootLayout() {
  useRefreshOnAppFocus()

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootNavigator />
          <Toast />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}
