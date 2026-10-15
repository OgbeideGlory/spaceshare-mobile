import { useState } from 'react'
import { View } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Toast from 'react-native-toast-message'
import { Check, X } from 'lucide-react-native'
import { acceptBooking, declineBooking } from '@/api/bookings'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { getErrorMessage } from '@/utils/getErrorMessage'

// Accept / Decline buttons for a booking request (spaces where the host approves each booking).
// Only shows for bookings with status "requested".
export default function RequestActions({ booking, size = 'sm' }) {
  const queryClient = useQueryClient()
  const [confirmDecline, setConfirmDecline] = useState(false)

  // Reload the booking lists, this booking's screen, and the earnings numbers it affects
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] })
    queryClient.invalidateQueries({ queryKey: ['booking', booking._id] })
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    queryClient.invalidateQueries({ queryKey: ['balance'] })
    queryClient.invalidateQueries({ queryKey: ['withdrawals'] })
  }

  const acceptMutation = useMutation({
    mutationFn: () => acceptBooking(booking._id),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Request accepted. The guest has 15 minutes to pay.' })
      refresh()
    },
    onError: (error) =>
      Toast.show({
        type: 'error',
        text1:
          error.response?.status === 409
            ? 'This time is no longer free, so the request can’t be accepted.'
            : getErrorMessage(error),
      }),
  })

  const declineMutation = useMutation({
    mutationFn: () => declineBooking(booking._id),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Request declined. We’ve let the guest know.' })
      setConfirmDecline(false)
      refresh()
    },
    onError: (error) => Toast.show({ type: 'error', text1: getErrorMessage(error) }),
  })

  if (booking.status !== 'requested') return null
  const isWorking = acceptMutation.isPending || declineMutation.isPending

  return (
    <View className="flex-row flex-wrap justify-end gap-2">
      <Button
        size={size}
        variant="accent"
        icon={Check}
        onPress={() => acceptMutation.mutate()}
        disabled={isWorking}
      >
        {acceptMutation.isPending ? 'Accepting…' : 'Accept'}
      </Button>
      <Button
        size={size}
        variant="outline"
        icon={X}
        onPress={() => setConfirmDecline(true)}
        disabled={isWorking}
      >
        Decline
      </Button>

      <ConfirmDialog
        open={confirmDecline}
        title="Decline this request?"
        confirmLabel="Decline request"
        cancelLabel="Go back"
        danger
        isWorking={declineMutation.isPending}
        onConfirm={() => declineMutation.mutate()}
        onClose={() => setConfirmDecline(false)}
      >
        {booking.user?.name ?? 'The guest'} will be told you can&apos;t host them at this time.
      </ConfirmDialog>
    </View>
  )
}
