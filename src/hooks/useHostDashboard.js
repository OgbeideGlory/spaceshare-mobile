import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { getMyBookings } from '@/api/bookings'
import { getAllHostTransactions } from '@/api/payments'
import { getMyWorkspaces } from '@/api/workspaces'

// Transactions that count as money earned (refunded ones don't)
const EARNED_STATUSES = ['pending', 'completed']
const sumHostAmount = (transactions) =>
  transactions.reduce((total, t) => total + (t.hostAmount ?? 0), 0)

// Loads everything the host dashboard needs and works out the numbers.
export function useHostDashboard() {
  const bookingsQuery = useQuery({ queryKey: ['bookings', 'mine'], queryFn: getMyBookings })
  const transactionsQuery = useQuery({
    queryKey: ['transactions', 'all'],
    queryFn: getAllHostTransactions,
  })
  const workspacesQuery = useQuery({ queryKey: ['workspaces', 'mine'], queryFn: getMyWorkspaces })

  const bookings = bookingsQuery.data ?? []
  const allTransactions = transactionsQuery.data ?? []
  const transactions = allTransactions.filter((t) => EARNED_STATUSES.includes(t.status))
  const now = dayjs()

  // Bookings that haven't ended yet and are still happening (or waiting for the host), soonest first
  const upcomingBookings = bookings
    .filter(
      (b) =>
        ['requested', 'pending', 'confirmed'].includes(b.status) && dayjs(b.endTime).isAfter(now),
    )
    .sort((a, b) => dayjs(a.startTime).diff(dayjs(b.startTime)))

  // Earnings
  const thisMonth = sumHostAmount(
    transactions.filter((t) => dayjs(t.createdAt).isSame(now, 'month')),
  )
  const lastMonth = sumHostAmount(
    transactions.filter((t) => dayjs(t.createdAt).isSame(now.subtract(1, 'month'), 'month')),
  )
  const earnings = {
    thisMonth,
    // null when there's nothing to compare with
    changeFromLastMonth:
      lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null,
    total: sumHostAmount(transactions),
    pendingPayout: sumHostAmount(transactions.filter((t) => t.status === 'pending')),
  }

  // Listings: live ones are approved; the rest are waiting for (or came back from) review
  const myListings = workspacesQuery.data ?? []
  const liveListings = myListings.filter((w) => w.status === 'approved')
  const inReviewListings = myListings.filter((w) => w.status === 'pending')
  // The listing to show a host with nothing live yet. One that needs the host's action
  // (changes requested or not approved) comes before one that's just waiting for review.
  const listingToReview =
    myListings.find((w) => ['changes_requested', 'rejected'].includes(w.status)) ??
    inReviewListings[0] ??
    myListings[0] ??
    null
  // Has the host ever had a booking or a payment? (Then they always get the full dashboard.)
  const hasActivity = bookings.length > 0 || allTransactions.length > 0
  const requestCount = bookings.filter((b) => b.status === 'requested').length

  return {
    isLoading: bookingsQuery.isLoading || transactionsQuery.isLoading || workspacesQuery.isLoading,
    error: bookingsQuery.error || transactionsQuery.error || workspacesQuery.error,
    refetch: () => {
      bookingsQuery.refetch()
      transactionsQuery.refetch()
      workspacesQuery.refetch()
    },
    upcomingBookings,
    earnings,
    liveListings,
    inReviewListings,
    listingToReview,
    hasActivity,
    listings: myListings,
    requestCount,
  }
}
