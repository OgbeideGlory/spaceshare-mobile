import { Platform } from 'react-native'
import { router } from 'expo-router'
import Constants from 'expo-constants'
import { isRunningInExpoGo } from 'expo'
import { removePushToken, savePushToken } from '@/api/users'

// Push notifications: alerts on the phone when the app is closed (the web uses a live stream instead).
//
// ⚠️ Switched off for now. Turn PUSH_ENABLED on when all three are done (see PendingUpdates.md):
//   1. the backend saves push tokens (POST/DELETE /api/users/me/push-tokens) and sends pushes
//      through Expo's push service when it creates a notification
//   2. the project is linked to an Expo account with `npx eas-cli init` (that gives the projectId)
//   3. the app runs as a development build (Expo Go can't receive pushes since SDK 53)
export const PUSH_ENABLED = false

// expo-notifications only works outside Expo Go, so it's loaded only when it can be used
// (importing it in Expo Go shows a warning, and on Android its push functions throw an error)
const canUsePush = () => PUSH_ENABLED && Platform.OS !== 'web' && !isRunningInExpoGo()
const loadNotifications = () => require('expo-notifications')

let savedToken = null // the token we gave the backend, so we can remove it at logout
let tapListener = null

// Asks permission, gets this phone's Expo push token and gives it to the backend.
// Call after someone signs in. Does nothing (returns null) while push is switched off.
export async function registerForPush() {
  if (!canUsePush()) return null
  const Notifications = loadNotifications()
  try {
    // Show alerts even while the app is open
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    })
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      })
    }
    let { status } = await Notifications.getPermissionsAsync()
    if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync())
    if (status !== 'granted') return null // they said no: the in-app list still works

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
    await savePushToken({ token, platform: Platform.OS })
    savedToken = token

    // Tapping a notification opens the notifications list
    tapListener?.remove()
    tapListener = Notifications.addNotificationResponseReceivedListener(() =>
      router.push('/notifications'),
    )
    return token
  } catch {
    return null // push is a bonus: never stop someone using the app because of it
  }
}

// Tells the backend to stop sending pushes to this phone. Call before signing out.
export async function unregisterPush() {
  tapListener?.remove()
  tapListener = null
  if (!savedToken) return
  const token = savedToken
  savedToken = null
  await removePushToken(token).catch(() => {})
}
