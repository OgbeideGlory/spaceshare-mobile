// PLACEHOLDER: Jerry replaces this whole file with the real screen later.
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Button from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export default function MoreScreen() {
  const { user, logout } = useAuth()
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-2xl font-bold text-gray-900">More</Text>
        <Text className="mt-2 text-center text-base text-gray-600">
          Coming soon. Jerry is building this screen.
        </Text>
        {user ? (
          <Button variant="outline" onPress={logout} className="mt-6 self-center">
            Log out ({user.email})
          </Button>
        ) : (
          <Button variant="accent" href="/login" className="mt-6 self-center">
            Log in
          </Button>
        )}
      </View>
    </SafeAreaView>
  )
}
