import { useState } from 'react'
import { View } from 'react-native'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Toast from 'react-native-toast-message'
import { changePassword } from '@/api/auth'
import PasswordRequirements from '@/components/auth/PasswordRequirements'
import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import FormTextField from '@/components/ui/FormTextField'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { replaceToken } from '@/utils/tokenStorage'
import { passwordSchema } from '@/utils/validation'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: 'Choose a password different from your current one',
    path: ['newPassword'],
  })

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' }

// Change password. The API signs out every other device and returns a new token for this one.
export default function ChangePasswordForm() {
  const [formError, setFormError] = useState('')
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: EMPTY })
  const newPassword = useWatch({ control, name: 'newPassword' }) ?? ''

  async function onSubmit({ currentPassword, newPassword }) {
    setFormError('')
    try {
      const { token } = await changePassword({ currentPassword, newPassword })
      await replaceToken(token)
      reset(EMPTY)
      Toast.show({
        type: 'success',
        text1: 'Password changed. Other devices have been signed out.',
      })
    } catch (error) {
      setFormError(getErrorMessage(error))
    }
  }

  return (
    <View className="gap-4">
      <FormTextField
        control={control}
        name="currentPassword"
        password
        label="Current password"
        autoComplete="current-password"
      />
      <FormTextField
        control={control}
        name="newPassword"
        password
        label="New password"
        autoComplete="new-password"
      />
      <FormTextField
        control={control}
        name="confirmPassword"
        password
        label="Confirm new password"
        autoComplete="new-password"
      />
      {newPassword ? <PasswordRequirements password={newPassword} /> : null}
      <FormError message={formError} />
      <Button onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Change password'}
      </Button>
    </View>
  )
}
