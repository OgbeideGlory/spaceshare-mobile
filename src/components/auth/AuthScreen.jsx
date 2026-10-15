import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Logo from '@/components/layout/Logo'

// The Log in and Sign up layout. On the web it's half photo, half form,
// but the photo is hidden on phones, so this is the phone version: logo, then the form.
export default function AuthScreen({ children }) {
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="grow justify-center px-6 py-10"
        >
          <View className="mb-10">
            <Logo />
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
