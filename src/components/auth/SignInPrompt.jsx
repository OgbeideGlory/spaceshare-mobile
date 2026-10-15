import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Button from '@/components/ui/Button'

// Shown on the seeker tabs that need an account (Bookings, Saved, Profile) to signed-out visitors
export default function SignInPrompt({ title, text }) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-1 px-6">
        <Text className="mt-6 text-2xl font-bold text-gray-900">{title}</Text>
        <View className="mt-6 rounded-xl bg-gray-50 p-6">
          <Text className="text-sm text-gray-600">{text}</Text>
          <View className="mt-5 flex-row gap-3">
            <Button variant="accent" href="/login">
              Log In
            </Button>
            <Button variant="outline" href="/register">
              Sign Up
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}
