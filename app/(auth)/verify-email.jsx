import { useEffect, useRef, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import { MailCheck } from 'lucide-react-native'
import { requestEmailVerification, verifyEmail } from '@/api/auth'
import AuthCard from '@/components/auth/AuthCard'
import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import Notice from '@/components/ui/Notice'
import TextField from '@/components/ui/TextField'
import { useAuth } from '@/hooks/useAuth'
import { COLORS } from '@/utils/colors'
import { getErrorMessage } from '@/utils/getErrorMessage'

const COOLDOWN_SECONDS = 60 // the API allows one code per minute

// "Enter your code". New accounts must verify their email with the 6-digit code before they can sign in.
// Opened after sign-up, or when someone tries to log in before verifying.
// Params: email, codeSent ('1' just sent / '0' couldn't send), sendCode ('1' = send a fresh code now)
export default function VerifyEmailScreen() {
  const { completePendingSignIn } = useAuth()
  const params = useLocalSearchParams()
  const email = params.email ?? ''
  const [otp, setOtp] = useState('')
  // After sign-up the code has just been sent, so start the resend countdown straight away
  const [cooldown, setCooldown] = useState(params.codeSent === '1' ? COOLDOWN_SECONDS : 0)
  const [notice, setNotice] = useState(
    params.codeSent === '0'
      ? 'Your account was created, but we couldn’t email your code. Send a new one below.'
      : '',
  )

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const sendMutation = useMutation({
    mutationFn: () => requestEmailVerification(email),
    onSuccess: () => {
      setCooldown(COOLDOWN_SECONDS)
      setNotice('We’ve sent you a new code.')
    },
  })

  // Coming from the login screen: their old code has probably expired, so send a fresh one once
  const sentOnArrival = useRef(false)
  useEffect(() => {
    if (params.sendCode === '1' && email && !sentOnArrival.current) {
      sentOnArrival.current = true
      sendMutation.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const verifyMutation = useMutation({
    mutationFn: () => verifyEmail({ email, otp }),
    onSuccess: async () => {
      // Sign straight in if we still have their details from sign-up or login.
      // Once signed in, the app moves them to their tabs by itself.
      try {
        if (await completePendingSignIn(email)) return
      } catch {
        // fall through to the login screen
      }
      router.replace({ pathname: '/login', params: { verifiedEmail: email } })
    },
  })

  if (!email) return <Redirect href="/login" />

  const canVerify = /^\d{6}$/.test(otp) && !verifyMutation.isPending

  return (
    <AuthCard>
      <View className="items-center">
        <MailCheck size={56} strokeWidth={1.5} color={COLORS.accent} />
      </View>
      <Text className="mt-4 text-center text-2xl font-bold text-primary">Verify your email</Text>
      <Text className="mt-3 text-center text-sm text-gray-700">
        Enter the 6-digit code we sent to <Text className="font-bold">{email}</Text>. It expires in
        10 minutes.
      </Text>

      <View className="mt-6 gap-4">
        {notice && !sendMutation.error ? <Notice message={notice} /> : null}
        <FormError
          message={
            sendMutation.error
              ? getErrorMessage(
                  sendMutation.error,
                  'We couldn’t send a code. Try again in a minute.',
                )
              : ''
          }
        />
        <TextField
          label="Verification code"
          type="number"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          placeholder="123456"
          maxLength={6}
          value={otp}
          onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, 6))}
          onSubmitEditing={() => canVerify && verifyMutation.mutate()}
        />
        <FormError
          message={
            verifyMutation.error
              ? getErrorMessage(verifyMutation.error, 'That code is wrong or has expired.')
              : ''
          }
        />
        <Button
          variant="accent"
          onPress={() => verifyMutation.mutate()}
          disabled={!canVerify}
          className="self-stretch"
        >
          {verifyMutation.isPending ? 'Verifying…' : 'Verify email'}
        </Button>
        <Pressable
          onPress={() => sendMutation.mutate()}
          disabled={cooldown > 0 || sendMutation.isPending}
          accessibilityRole="button"
        >
          <Text
            className={`text-center text-sm ${cooldown > 0 || sendMutation.isPending ? 'text-gray-400' : 'text-primary'}`}
          >
            {sendMutation.isPending
              ? 'Sending…'
              : cooldown > 0
                ? `Resend code in ${cooldown}s`
                : 'Resend code'}
          </Text>
        </Pressable>
      </View>

      <Text className="mt-6 text-center text-sm text-gray-600">
        Wrong email?{' '}
        <Text
          onPress={() => router.replace('/register')}
          accessibilityRole="link"
          className="text-primary"
        >
          Sign up again
        </Text>
      </Text>
    </AuthCard>
  )
}
