import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, MailCheck } from 'lucide-react-native'
import { forgotPassword } from '@/api/auth'
import AuthCard from '@/components/auth/AuthCard'
import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import FormTextField from '@/components/ui/FormTextField'
import { COLORS } from '@/utils/colors'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { emailSchema } from '@/utils/validation'

const forgotSchema = z.object({ email: emailSchema })

export default function ForgotPasswordScreen() {
  const [sentTo, setSentTo] = useState('') // the email we sent the link to
  const [formError, setFormError] = useState('')

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({ resolver: zodResolver(forgotSchema), defaultValues: { email: '' } })

  async function onSubmit({ email }) {
    setFormError('')
    try {
      await forgotPassword(email)
      setSentTo(email)
    } catch (error) {
      setFormError(getErrorMessage(error))
    }
  }

  // After sending: the API replies the same way whether or not the account exists,
  // so we don't say "we found your account"
  if (sentTo) {
    return (
      <AuthCard>
        <View className="items-center">
          <MailCheck size={64} strokeWidth={1.5} color={COLORS.accent} />
        </View>
        <Text className="mt-4 text-center text-2xl font-bold text-primary">Check your email</Text>
        <Text className="mt-3 text-center text-sm text-gray-700">
          If a SpaceShare account uses <Text className="font-bold">{sentTo}</Text>, we&apos;ve sent
          a link to reset your password. The link expires in 1 hour.
        </Text>
        <Button
          variant="accent"
          onPress={() => router.dismissTo('/login')}
          className="mt-8 self-center"
        >
          Back to Log in
        </Button>
        <Pressable onPress={() => setSentTo('')} accessibilityRole="button" className="mt-4">
          <Text className="text-center text-sm text-primary">Use a different email</Text>
        </Pressable>
      </AuthCard>
    )
  }

  return (
    <AuthCard>
      <View className="items-center">
        <Mail size={64} strokeWidth={1.5} color={COLORS.accent} />
      </View>
      <Text className="mt-4 text-center text-2xl font-bold text-primary">
        Forgot your password?
      </Text>
      <Text className="mt-3 text-center text-sm text-gray-700">
        Enter the email address associated with your SpaceShare account and we&apos;ll send you a
        link to reset your password.
      </Text>

      <View className="mt-8 gap-4">
        <FormError message={formError} />
        <FormTextField
          control={control}
          name="email"
          label="Email address:"
          type="email"
          icon={Mail}
          placeholder="name@company.com"
          autoComplete="email"
          onSubmitEditing={handleSubmit(onSubmit)}
        />
        <Button
          variant="accent"
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="mt-2 self-center"
        >
          {isSubmitting ? 'Sending…' : 'Send Reset Link'}
        </Button>
      </View>

      <Text className="mt-8 text-center text-sm text-gray-700">
        Remember your password?{' '}
        <Text
          onPress={() => router.dismissTo('/login')}
          accessibilityRole="link"
          className="text-primary"
        >
          Log in
        </Text>
      </Text>
    </AuthCard>
  )
}
