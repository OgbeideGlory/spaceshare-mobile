import { useMutation } from '@tanstack/react-query'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import { initializePayment } from '@/api/payments'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { openPaystack } from '@/utils/paystack'

// Pays for an unpaid booking from a list or the booking screen.
// Opens Paystack; afterwards goes to the Paystack return screen (if Paystack came back to the app)
// or to the payment screen, which checks whether they paid.
// Usage: const pay = usePayBooking(); pay.mutate(bookingId); pay.isPending / pay.variables
export function usePayBooking() {
  return useMutation({
    mutationFn: async (bookingId) =>
      openPaystack((await initializePayment(bookingId)).authorizationUrl),
    onSuccess: (reference, bookingId) =>
      reference
        ? router.push({ pathname: '/paystack/callback', params: { reference } })
        : router.push({ pathname: '/checkout/pay/[bookingId]', params: { bookingId } }),
    onError: (error) => Toast.show({ type: 'error', text1: getErrorMessage(error) }),
  })
}
