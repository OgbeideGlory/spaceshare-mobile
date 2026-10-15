import { useState } from 'react'
import { Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, Mail, Phone, User } from 'lucide-react-native'
import AuthScreen from '@/components/auth/AuthScreen'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import PasswordRequirements from '@/components/auth/PasswordRequirements'
import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import FormTextField from '@/components/ui/FormTextField'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/utils/constants'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { emailSchema, passwordSchema } from '@/utils/validation'

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name'),
    email: emailSchema,
    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d\s-]{7,20}$/, 'Enter a valid phone number'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export default function RegisterScreen() {
  const { register: registerUser } = useAuth()
  const [formError, setFormError] = useState('')

  // /register?role=host signs up a host
  const isHost = useLocalSearchParams().role === ROLES.HOST

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '' },
  })

  const password = useWatch({ control, name: 'password' }) ?? ''

  async function onSubmit({ name, email, phone, password }) {
    setFormError('')
    try {
      const role = isHost ? ROLES.HOST : ROLES.CUSTOMER
      await registerUser({ name, email, phone, password, role })
      // The API has emailed a 6-digit code; the account can't sign in until it's entered
      router.push({ pathname: '/verify-email', params: { email, codeSent: '1' } })
    } catch (error) {
      if (error.response?.status === 503) {
        // The account exists, but the code email couldn't be sent: let them ask for a new one
        router.push({ pathname: '/verify-email', params: { email, codeSent: '0' } })
        return
      }
      setFormError(getErrorMessage(error))
    }
  }

  return (
    <AuthScreen>
      <Text className="text-3xl font-bold text-accent">Create your account</Text>
      <Text className="mt-1 text-sm text-gray-600">
        {isHost
          ? 'Join SpaceShare and start earning from your space'
          : 'Join SpaceShare and find your next workspace'}
      </Text>
      <Text className="mt-2 text-sm text-gray-500">
        {isHost ? 'Looking to book a space instead? ' : 'Have a space to list? '}
        <Text
          onPress={() => router.setParams({ role: isHost ? '' : ROLES.HOST })}
          accessibilityRole="link"
          className="font-semibold text-primary"
        >
          {isHost ? 'Sign up as a seeker' : 'Sign up as a host'}
        </Text>
      </Text>

      <View className="mt-8 gap-4">
        <FormError message={formError} />

        <FormTextField
          control={control}
          name="name"
          icon={User}
          placeholder="Full name"
          autoComplete="name"
          autoCapitalize="words"
        />
        <FormTextField
          control={control}
          name="email"
          type="email"
          icon={Mail}
          placeholder="Email address"
          autoComplete="email"
        />
        <FormTextField
          control={control}
          name="phone"
          type="tel"
          icon={Phone}
          placeholder="Phone number"
          autoComplete="tel"
        />
        <FormTextField
          control={control}
          name="password"
          password
          placeholder="Password"
          autoComplete="new-password"
        />
        {password ? <PasswordRequirements password={password} /> : null}
        <FormTextField
          control={control}
          name="confirmPassword"
          password
          placeholder="Confirm password"
          autoComplete="new-password"
        />

        <View className="pt-1">
          <Button
            variant="accent"
            icon={ArrowRight}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account…' : 'Create Account'}
          </Button>
        </View>

        {/* TODO: link these to the real Terms and Conditions (the website doesn't have the page yet) */}
        <Text className="text-center text-xs text-gray-600">
          By creating an account, you agree to our{' '}
          <Text className="text-primary">Terms of service</Text> and{' '}
          <Text className="text-primary">conditions</Text>
        </Text>
      </View>

      {/* Only shows in a development build with the phone's Google client IDs (see PendingUpdates.md) */}
      <GoogleSignInButton role={isHost ? ROLES.HOST : undefined} onError={setFormError} />

      <Text className="mt-8 text-center text-sm text-gray-700">
        Already have an account?{' '}
        <Text
          onPress={() => router.dismissTo('/login')}
          accessibilityRole="link"
          className="text-primary"
        >
          Log in
        </Text>
      </Text>
    </AuthScreen>
  )
}
