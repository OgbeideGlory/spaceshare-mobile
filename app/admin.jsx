import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MonitorSmartphone } from 'lucide-react-native'
import Logo from '@/components/layout/Logo'
import Button from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { COLORS } from '@/utils/colors'
import { openWebPage } from '@/utils/webApp'

// The admin console stays on the web, so admins who sign in on the app see this instead
export default function AdminNotice() {
  const { user, logout } = useAuth()

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 px-6">
        <View className="mt-10">
          <Logo />
        </View>
        <View className="my-auto items-center rounded-xl bg-white px-6 py-10">
          <MonitorSmartphone size={56} strokeWidth={1.5} color={COLORS.accent} />
          <Text className="mt-4 text-center text-2xl font-bold text-primary">
            Please use the admin console on the web
          </Text>
          <Text className="mt-3 text-center text-sm text-gray-700">
            Hi {user?.name ?? 'there'}, the SpaceShare app is for seekers and hosts. Admin work is
            done on the website.
          </Text>
          <Button
            variant="accent"
            onPress={() => openWebPage('/admin/login')}
            className="mt-8 self-stretch"
          >
            Open the admin console
          </Button>
          <Button variant="outline" onPress={logout} className="mt-3 self-stretch">
            Log out
          </Button>
        </View>
      </View>
    </SafeAreaView>
  )
}
