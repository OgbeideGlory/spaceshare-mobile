import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Logo from '@/components/layout/Logo'

// A centred card on a dark teal background (the web shows a photo behind it when it has one).
// Used by Verify email, Forgot password, Create new password and the success screens.
export default function AuthCard({ children }) {
  return (
    <SafeAreaView className="flex-1 bg-accent">
      <View className="absolute inset-0 bg-black/30" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="grow items-center px-4 py-8"
        >
          <View className="rounded-lg bg-white/90 px-3 py-1.5">
            <Logo />
          </View>
          <View className="my-auto w-full rounded-xl bg-gray-100 px-6 py-10 shadow-xl">
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
