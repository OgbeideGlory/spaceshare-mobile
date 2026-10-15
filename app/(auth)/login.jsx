import { useState } from 'react'
import { Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, Mail } from 'lucide-react-native'
import AuthScreen from '@/components/auth/AuthScreen'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import FormTextField from '@/components/ui/FormTextField'
import Notice from '@/components/ui/Notice'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { emailSchema } from '@/utils/validation'

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password'),
})

export default function LoginScreen() {
  const { login, rememberPendingSignIn } = useAuth()
  // Set when coming back from "verify your email"
  const { verifiedEmail } = useLocalSearchParams()
  const [formError, setFormError] = useState('')

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: verifiedEmail ?? '', password: '' },
  })

  // Once logged in, the app sends each role to its own tabs (see app/_layout.jsx)
  async function onSubmit({ email, password }) {
    setFormError('')
    try {
      await login(email, password)
    } catch (error) {
      // 403 with a "verify" message: email not verified yet (other 403s, e.g. a deactivated account, show as errors)
      const message = getErrorMessage(error, '')
      if (error.response?.status === 403 && /verif/i.test(message)) {
        // Email not verified yet: ask for the code, then sign them straight in
        rememberPendingSignIn(email, password)
        router.push({ pathname: '/verify-email', params: { email, sendCode: '1' } })
        return
      }
      setFormError(getErrorMessage(error))
    }
  }

  return (
    <AuthScreen>
      <Text className="text-3xl font-bold text-accent">Welcome Back</Text>
      <Text className="mt-1 text-sm text-gray-600">Log in to your account.</Text>

      <View className="mt-8 gap-5">
        {Boolean(verifiedEmail) && !formError && (
          <Notice message="Your email is verified. Log in to continue." />
        )}
        <FormError message={formError} />

        <FormTextField
          control={control}
          name="email"
          label="Email address:"
          type="email"
          icon={Mail}
          placeholder="You@example.com"
          autoComplete="email"
        />

        <FormTextField
          control={control}
          name="password"
          password
          label="Password:"
          placeholder="Enter your password"
          autoComplete="current-password"
          onSubmitEditing={handleSubmit(onSubmit)}
        />

        <Text
          onPress={() => router.push('/forgot-password')}
          accessibilityRole="link"
          className="self-start text-sm text-primary"
        >
          Forgot password?
        </Text>

        <Button
          variant="accent"
          icon={ArrowRight}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </View>

      {/* Only shows in a development build with the phone's Google client IDs (see PendingUpdates.md) */}
      <GoogleSignInButton onError={setFormError} />

      <Text className="mt-8 text-center text-sm text-gray-700">
        Don&apos;t have an account?{' '}
        <Text
          onPress={() => router.push('/register')}
          accessibilityRole="link"
          className="text-primary"
        >
          Sign up
        </Text>
      </Text>
    </AuthScreen>
  )
}
