import { useState } from 'react'
import { Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check } from 'lucide-react-native'
import { resetPassword } from '@/api/auth'
import AuthCard from '@/components/auth/AuthCard'
import PasswordRequirements from '@/components/auth/PasswordRequirements'
import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import FormTextField from '@/components/ui/FormTextField'
import { COLORS } from '@/utils/colors'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { readToken } from '@/utils/readToken'
import { passwordSchema } from '@/utils/validation'

const resetSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

// The link in the reset email opens this screen: spaceshare://reset-password?token=...
// (Email links open the website until the backend sets up app links: PendingUpdates.md, W2.)
export default function ResetPasswordScreen() {
  const token = readToken(useLocalSearchParams().token)
  const [isDone, setIsDone] = useState(false)
  const [formError, setFormError] = useState('')

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const password = useWatch({ control, name: 'password' }) ?? ''

  async function onSubmit({ password }) {
    setFormError('')
    try {
      await resetPassword({ token, password })
      setIsDone(true)
    } catch (error) {
      setFormError(getErrorMessage(error, 'This reset link is invalid or has expired.'))
    }
  }

  // Opened without a token
  if (!token) {
    return (
      <AuthCard>
        <Text className="text-center text-2xl font-bold text-accent">
          This link isn&apos;t valid
        </Text>
        <Text className="mt-3 text-center text-sm text-gray-700">
          Password reset links can only be used once and expire after 1 hour.
        </Text>
        <Button
          variant="accent"
          onPress={() => router.replace('/forgot-password')}
          className="mt-8 self-center"
        >
          Get a new link
        </Button>
      </AuthCard>
    )
  }

  // The "Success page" from the design
  if (isDone) {
    return (
      <AuthCard>
        <View className="size-28 items-center justify-center self-center rounded-full bg-white shadow-md">
          <Check size={64} strokeWidth={3} color={COLORS.green600} />
        </View>
        <Text className="mt-6 text-center text-xl font-bold text-accent">
          Password reset successfully
        </Text>
        <Text className="mt-3 text-center text-sm text-gray-700">
          Your password has been updated. You can now log in with your new password.
        </Text>
        <Button
          variant="accent"
          onPress={() => router.replace('/login')}
          className="mt-8 self-center"
        >
          Back to Log in
        </Button>
      </AuthCard>
    )
  }

  return (
    <AuthCard>
      <Text className="text-center text-2xl font-bold text-accent">Create a new password</Text>
      <Text className="mt-2 text-center text-sm text-gray-700">
        Your new password must be different from previously used passwords.
      </Text>

      <View className="mt-8 gap-4">
        <FormError message={formError} />
        {formError ? (
          <Text
            onPress={() => router.replace('/forgot-password')}
            accessibilityRole="link"
            className="-mt-2 text-sm text-primary"
          >
            Request a new reset link
          </Text>
        ) : null}

        <FormTextField
          control={control}
          name="password"
          password
          label="New password"
          placeholder="New password"
          autoComplete="new-password"
        />
        <FormTextField
          control={control}
          name="confirmPassword"
          password
          placeholder="Confirm password"
          autoComplete="new-password"
        />
        <PasswordRequirements password={password} />

        <Button variant="accent" onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Reset password'}
        </Button>
      </View>
    </AuthCard>
  )
}
