import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { ChevronRight } from 'lucide-react-native'
import HostScreen from '@/components/host/HostScreen'
import { useAuth } from '@/hooks/useAuth'
import { COLORS } from '@/utils/colors'

// The rest of the host menu (on the web's phone layout it's the pop-up behind the "More" tab)
const LINKS = [
  { label: 'Earnings & Payouts', href: '/host/earnings' },
  { label: 'Profile & Settings', href: '/host/settings' },
]

export default function HostMoreScreen() {
  const { user, logout } = useAuth()

  return (
    <HostScreen showBack={false}>
      <Text className="text-2xl font-bold text-gray-900">More</Text>
      <Text className="mt-1 text-sm text-gray-600">Signed in as {user?.email}</Text>

      <View className="mt-6 rounded-lg bg-white py-1 shadow-lg">
        {LINKS.map((link) => (
          <Pressable
            key={link.label}
            onPress={() => router.push(link.href)}
            className="flex-row items-center justify-between px-4 py-2.5 active:bg-gray-50"
          >
            <Text className="text-sm text-gray-900">{link.label}</Text>
            <ChevronRight size={16} color={COLORS.gray400} />
          </Pressable>
        ))}
        <Pressable
          onPress={logout}
          accessibilityRole="button"
          className="px-4 py-2.5 active:bg-gray-50"
        >
          <Text className="text-sm text-gray-900">Log out</Text>
        </Pressable>
      </View>
    </HostScreen>
  )
}
