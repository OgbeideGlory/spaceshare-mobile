// Has this booking been paid for (or does it not need paying)?
// Use this everywhere we decide whether to show "Pay" buttons or the access pass.
export function isPaid(booking) {
  if (!booking) return false
  return (
    booking.paymentStatus === 'paid' ||
    booking.status === 'confirmed' ||
    booking.status === 'completed' ||
    (booking.paymentStatus === 'not_required' && booking.status === 'confirmed')
  )
}

// Paid, but our API hasn't confirmed the booking yet (Paystack's message is still on its way).
// Show "Finalising your booking…" and check again in a few seconds.
export const isFinalising = (booking) =>
  booking?.paymentStatus === 'paid' && ['pending', 'requested'].includes(booking.status)

// Still waiting for payment, and the 15-minute hold hasn't run out
export function canStillPay(booking) {
  if (!booking || isPaid(booking) || booking.status !== 'pending') return false
  return !booking.expiresAt || new Date(booking.expiresAt) > new Date()
}
