import { useState } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleCheck, ScanLine } from 'lucide-react-native'
import { checkInBooking } from '@/api/bookings'
import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import Modal from '@/components/ui/Modal'
import TextField from '@/components/ui/TextField'
import { COLORS } from '@/utils/colors'
import { formatDateTime } from '@/utils/formatDate'
import { getErrorMessage } from '@/utils/getErrorMessage'
import QrScanner from './QrScanner'

const CODE_PATTERN = /^[A-Z0-9_-]{12}$/
// Every phone can scan (the web needs a browser that supports it). Not in the web preview.
const canScanQr = Platform.OS !== 'web'

// "Check in a guest": scan the guest's QR code, or type their booking code
export default function CheckInDialog({ open, onClose }) {
  const queryClient = useQueryClient()
  const [code, setCode] = useState('')
  // Changed for mobile: the camera opens first, because every phone can scan
  const [scanning, setScanning] = useState(canScanQr)

  const mutation = useMutation({
    mutationFn: checkInBooking,
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      if (booking?._id) queryClient.invalidateQueries({ queryKey: ['booking', booking._id] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    },
  })

  const submit = (value) => {
    const cleaned = value.trim().toUpperCase()
    setCode(cleaned)
    if (CODE_PATTERN.test(cleaned)) mutation.mutate(cleaned)
  }
  const handleScan = (text) => {
    setScanning(false)
    submit(text)
  }

  function close() {
    setCode('')
    setScanning(canScanQr)
    mutation.reset()
    onClose()
  }

  const booking = mutation.data
  const errorStatus = mutation.error?.response?.status
  const errorMessage =
    errorStatus === 404
      ? 'No booking with this code was found for your spaces.'
      : errorStatus === 409
        ? 'This booking can’t be checked in: it’s unpaid, cancelled, expired, or already checked in.'
        : mutation.error
          ? getErrorMessage(mutation.error)
          : ''

  return (
    <Modal
      open={open}
      isWorking={mutation.isPending}
      onClose={close}
      title="Check in a guest"
      description="Scan the QR code in the guest's confirmation, or ask them for their booking code."
    >
      {booking ? (
        <View className="items-center">
          <CircleCheck size={48} color={COLORS.green600} />
          <Text className="mt-3 text-lg font-semibold text-gray-900">Guest checked in</Text>
          <Text className="mt-1 text-sm text-gray-700">
            {booking.user?.name ?? 'Guest'} · {booking.workspace?.name ?? 'Your space'}
          </Text>
          <Text className="text-sm text-gray-600">{formatDateTime(booking.startTime)}</Text>
          <View className="mt-6 flex-row justify-center gap-3">
            <Button
              variant="outline"
              onPress={() => {
                setCode('')
                mutation.reset()
                setScanning(canScanQr)
              }}
            >
              Check in another
            </Button>
            <Button onPress={close}>Done</Button>
          </View>
        </View>
      ) : (
        <>
          {scanning ? (
            <QrScanner onScan={handleScan} />
          ) : (
            <View className="gap-4">
              <TextField
                label="Booking code"
                placeholder="e.g. A7Q9M2K4P6R8"
                value={code}
                onChangeText={(text) => setCode(text.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={12}
                onSubmitEditing={() => submit(code)}
                error={
                  code && !CODE_PATTERN.test(code) ? 'Booking codes are 12 letters and numbers' : ''
                }
              />
              <FormError message={errorMessage} />
              <Button
                className="self-stretch"
                onPress={() => submit(code)}
                disabled={mutation.isPending || !CODE_PATTERN.test(code)}
              >
                {mutation.isPending ? 'Checking in…' : 'Check in'}
              </Button>
            </View>
          )}
          {canScanQr && (
            <Pressable
              onPress={() => setScanning(!scanning)}
              className="mt-4 flex-row items-center justify-center gap-2"
            >
              <ScanLine size={16} color={COLORS.primary} />
              <Text className="text-sm font-medium text-primary">
                {scanning ? 'Type the code instead' : 'Scan QR code with camera'}
              </Text>
            </Pressable>
          )}
        </>
      )}
    </Modal>
  )
}
