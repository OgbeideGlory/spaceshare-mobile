import { Text, View } from 'react-native'

// Coloured label for a booking, listing or payment status.
// Booking "pending" means waiting for payment (the API holds the slot for 15 minutes).
// Booking "requested" means the host hasn't accepted yet (spaces where hosts approve each request).
const STYLES = {
  // bookings
  requested: { label: 'Awaiting host', box: 'bg-amber-50', text: 'text-amber-700' },
  pending: { label: 'Awaiting payment', box: 'bg-indigo-50', text: 'text-indigo-600' },
  confirmed: { label: 'Confirmed', box: 'bg-green-50', text: 'text-green-700' },
  completed: { label: 'Completed', box: 'bg-gray-100', text: 'text-gray-700' },
  cancelled: { label: 'Cancelled', box: 'bg-red-50', text: 'text-red-600' },
  expired: { label: 'Expired', box: 'bg-gray-100', text: 'text-gray-500' },
  declined: { label: 'Declined', box: 'bg-red-50', text: 'text-red-600' },
  // listings
  approved: { label: 'Live', box: 'border border-green-500 bg-green-50', text: 'text-green-700' },
  inReview: { label: 'In review', box: 'bg-indigo-50', text: 'text-indigo-600' },
  rejected: { label: 'Rejected', box: 'bg-red-50', text: 'text-red-600' },
  changes_requested: { label: 'Changes requested', box: 'bg-amber-50', text: 'text-amber-700' },
  suspended: { label: 'Suspended', box: 'bg-gray-100', text: 'text-gray-600' },
}

// Payments, earnings and host payouts use some of the same words with other meanings
// (e.g. "pending"), so they have their own list: <StatusBadge kind="payment" status="otp" />
const PAYMENT_STYLES = {
  success: { label: 'Paid', box: 'bg-green-50', text: 'text-green-700' },
  completed: { label: 'Completed', box: 'bg-green-50', text: 'text-green-700' },
  pending: { label: 'Pending', box: 'bg-gray-100', text: 'text-gray-700' },
  processing: { label: 'Processing', box: 'bg-gray-100', text: 'text-gray-700' },
  otp: { label: 'Needs approval code', box: 'bg-amber-50', text: 'text-amber-700' },
  failed: { label: 'Failed', box: 'bg-red-50', text: 'text-red-600' },
  reversed: { label: 'Reversed', box: 'bg-red-50', text: 'text-red-600' },
  abandoned: { label: 'Abandoned', box: 'bg-red-50', text: 'text-red-600' },
  rejected: { label: 'Rejected', box: 'bg-red-50', text: 'text-red-600' },
  blocked: { label: 'Blocked', box: 'bg-red-50', text: 'text-red-600' },
  refund_pending: { label: 'Refund to process', box: 'bg-amber-50', text: 'text-amber-700' },
  refunded: { label: 'Refunded', box: 'bg-gray-100', text: 'text-gray-600' },
}

// className: extra classes added to the box (e.g. "rounded-full").
// boxClassName / textClassName: replace the colours (e.g. amber for "pending" on the booking page).
export default function StatusBadge({
  status,
  kind = 'booking',
  className = '',
  boxClassName,
  textClassName,
}) {
  const styles = kind === 'payment' ? PAYMENT_STYLES : STYLES
  const style = styles[status] ?? { label: status, box: 'bg-gray-100', text: 'text-gray-700' }
  return (
    <View className={`self-start rounded-md px-2.5 py-1 ${boxClassName ?? style.box} ${className}`}>
      <Text numberOfLines={1} className={`text-xs ${textClassName ?? style.text}`}>
        {style.label}
      </Text>
    </View>
  )
}
