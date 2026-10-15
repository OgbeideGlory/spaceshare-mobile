import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { ArrowLeft, Bell, ChevronDown } from 'lucide-react-native'
import UserAvatar from '@/components/ui/UserAvatar'
import { useAuth } from '@/hooks/useAuth'
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications'
import { COLORS } from '@/utils/colors'

// The bar at the top of every host screen: Back, notifications, and the account menu.
// showBack: false on the tab screens (there's nothing to go back to).
export default function HostTopBar({ showBack = true }) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const unread = useUnreadNotifications()

  function go(href) {
    setMenuOpen(false)
    router.push(href)
  }

  return (
    <View className="z-10 flex-row items-center justify-between px-4 py-5">
      {showBack ? (
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/host'))}
          className="flex-row items-center gap-1.5"
        >
          <ArrowLeft size={16} color={COLORS.gray900} />
          <Text className="text-sm font-medium text-gray-900">Back</Text>
        </Pressable>
      ) : (
        <View />
      )}

      <View className="flex-row items-center gap-4">
        <Pressable
          onPress={() => go('/notifications')}
          hitSlop={8}
          accessibilityLabel={`Notifications${unread.length ? ` (${unread.length} unread)` : ''}`}
        >
          <Bell size={20} color={COLORS.gray800} />
          {unread.length > 0 && (
            <View className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary" />
          )}
        </Pressable>

        <Pressable
          onPress={() => setMenuOpen(!menuOpen)}
          accessibilityRole="button"
          accessibilityLabel="Account menu"
          accessibilityState={{ expanded: menuOpen }}
          className="flex-row items-center gap-2"
        >
          <UserAvatar user={user} size={36} />
          <Text numberOfLines={1} className="max-w-28 text-xs font-medium text-gray-900">
            {user?.name}
          </Text>
          <ChevronDown size={16} color={COLORS.gray900} />
        </Pressable>
      </View>

      {menuOpen && (
        <View className="absolute right-4 top-16 w-44 rounded-md bg-white py-1 shadow-lg">
          <Pressable onPress={() => go('/host/settings')} className="px-4 py-2">
            <Text className="text-sm text-gray-900">Profile & Settings</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setMenuOpen(false)
              logout()
            }}
            className="px-4 py-2"
          >
            <Text className="text-sm text-gray-900">Log out</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}
