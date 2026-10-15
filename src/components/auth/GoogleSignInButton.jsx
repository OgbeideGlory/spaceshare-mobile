import { useState } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import { isRunningInExpoGo } from 'expo'
import Svg, { Path } from 'react-native-svg'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/utils/getErrorMessage'

// Google's client IDs. They're public by design, so they're fine in EXPO_PUBLIC_ variables.
// The phone ones come from the same Google Cloud project as the web one (see PendingUpdates.md).
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
const ANDROID_READY = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_READY === 'true'

// Native Google sign-in needs a development build (Expo Go doesn't include it) and the phone's
// client ID. Until then the button simply doesn't show, so the screens look like the web without it.
const canUseGoogle = () =>
  !isRunningInExpoGo() &&
  Boolean(WEB_CLIENT_ID) &&
  (Platform.OS === 'ios' ? Boolean(IOS_CLIENT_ID) : Platform.OS === 'android' && ANDROID_READY)

function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <Path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </Svg>
  )
}

// "Continue with Google" (the web's GoogleSignInButton, using the phone's own Google sign-in).
// role: 'host' when used on "sign up as a host". onError(message) shows a problem on the screen.
export default function GoogleSignInButton({ role, onError }) {
  const { loginWithGoogle } = useAuth()
  const [busy, setBusy] = useState(false)

  if (!canUseGoogle()) return null

  async function signIn() {
    // Only loaded when it can work (see canUseGoogle)
    const { GoogleSignin, isSuccessResponse } = require('@react-native-google-signin/google-signin')
    setBusy(true)
    onError?.('')
    try {
      GoogleSignin.configure({ webClientId: WEB_CLIENT_ID, iosClientId: IOS_CLIENT_ID })
      if (Platform.OS === 'android') await GoogleSignin.hasPlayServices()
      const response = await GoogleSignin.signIn()
      if (!isSuccessResponse(response)) return // they closed Google's window
      const idToken = response.data?.idToken
      if (!idToken) throw new Error('Google didn’t send a sign-in token. Please try again.')
      // The backend checks the token and signs them in (it creates a seeker account the first time)
      await loginWithGoogle(idToken, { role })
    } catch (error) {
      onError?.(getErrorMessage(error, 'Google sign-in didn’t work. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <View>
      <View className="my-6 flex-row items-center gap-4">
        <View className="h-px flex-1 bg-gray-400" />
        <Text className="text-sm text-gray-600">or</Text>
        <View className="h-px flex-1 bg-gray-400" />
      </View>
      <Pressable
        onPress={signIn}
        disabled={busy}
        accessibilityRole="button"
        className={`flex-row items-center justify-center gap-2 rounded-sm border border-gray-300 bg-white py-3 active:bg-gray-50 ${busy ? 'opacity-60' : ''}`}
      >
        <GoogleIcon />
        <Text className="text-sm text-gray-800">
          {busy ? 'Signing in…' : 'Continue with Google'}
        </Text>
      </Pressable>
    </View>
  )
}
