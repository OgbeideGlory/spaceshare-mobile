import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CircleDollarSign,
  FileText,
  SquarePlus,
  Wallet,
} from 'lucide-react-native'
import DashboardCard from '@/components/host/DashboardCard'
import EarningsSnapshot from '@/components/host/EarningsSnapshot'
import HostScreen from '@/components/host/HostScreen'
import ListingsList from '@/components/host/ListingsList'
import ListingUnderReview from '@/components/host/ListingUnderReview'
import StatCard from '@/components/host/StatCard'
import UpcomingBookingsTable from '@/components/host/UpcomingBookingsTable'
import Button from '@/components/ui/Button'
import LoadError from '@/components/ui/LoadError'
import Spinner from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'
import { useHostDashboard } from '@/hooks/useHostDashboard'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function HostDashboardScreen() {
  const { user } = useAuth()
  const dashboard = useHostDashboard()
  const {
    upcomingBookings,
    earnings,
    liveListings,
    inReviewListings,
    listingToReview,
    hasActivity,
    listings,
    requestCount,
  } = dashboard
  const firstName = user?.name?.split(' ')[0]

  const header = (
    <View className="flex-row items-center justify-between gap-4">
      <View className="flex-1">
        <Text className="text-lg font-medium text-gray-900">
          {greeting()} {firstName}!
        </Text>
        <Text className="mt-0.5 text-xs text-gray-600">
          Here is your listing and where it stands.
        </Text>
      </View>
      <Button size="sm" icon={SquarePlus} onPress={() => router.push('/host/listings/new')}>
        Add new space
      </Button>
    </View>
  )

  function body() {
    if (dashboard.isLoading) return <Spinner label="Loading your dashboard…" />
    if (dashboard.error) {
      return (
        <LoadError
          error={dashboard.error}
          fallback="We couldn't load your dashboard."
          onRetry={dashboard.refetch}
          className="mt-8"
        />
      )
    }

    // A new host with nothing live yet, and no bookings or earnings: show the listing that's in
    // review (or came back with changes). Hosts with bookings or earnings always see their numbers.
    if (liveListings.length === 0 && listings.length > 0 && !hasActivity) {
      return (
        <View className="mt-6">
          <ListingUnderReview listing={listingToReview} />
        </View>
      )
    }

    const change = earnings.changeFromLastMonth
    const nextBooking = upcomingBookings[0]

    return (
      <>
        {requestCount > 0 && (
          <Pressable
            onPress={() =>
              router.navigate({ pathname: '/host/bookings', params: { tab: 'requests' } })
            }
            className="mt-6 flex-row items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 active:bg-amber-100"
          >
            <Text className="flex-1 text-sm text-amber-800">
              You have <Text className="font-bold">{requestCount}</Text> booking{' '}
              {requestCount === 1 ? 'request' : 'requests'} waiting for your answer.
            </Text>
            <Text className="text-sm font-medium text-amber-800">Review</Text>
          </Pressable>
        )}

        {/* The four number cards scroll sideways */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-4 mt-6"
          contentContainerClassName="gap-3 px-4 pb-2"
        >
          <StatCard
            icon={CalendarDays}
            iconBox="bg-sky-50"
            iconColor="#0284c7"
            label="Upcoming bookings"
            value={upcomingBookings.length}
            footer={nextBooking ? `Next: ${formatDate(nextBooking.startTime)}` : 'None yet'}
          />
          <StatCard
            icon={CircleDollarSign}
            iconBox="bg-green-50"
            iconColor="#16a34a"
            label="Earnings this month"
            value={formatCurrency(earnings.thisMonth)}
            footer={
              change === null ? (
                'Nothing to compare with yet'
              ) : (
                <View className="flex-row items-center gap-1">
                  {change >= 0 ? (
                    <ArrowUp size={12} color="#16a34a" />
                  ) : (
                    <ArrowDown size={12} color="#dc2626" />
                  )}
                  <Text className={`text-xs ${change >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {Math.abs(change)}%
                  </Text>
                  <Text className="text-xs text-gray-600">from last month</Text>
                </View>
              )
            }
          />
          <StatCard
            icon={FileText}
            iconBox="bg-purple-50"
            iconColor="#9333ea"
            label="Active listings"
            value={liveListings.length}
            footer={`${inReviewListings.length} in review`}
          />
          <StatCard
            icon={Wallet}
            iconBox="bg-yellow-50"
            iconColor="#ca8a04"
            label="Total earned"
            value={formatCurrency(earnings.total)}
            footer={`Pending payout: ${formatCurrency(earnings.pendingPayout)}`}
          />
        </ScrollView>

        <View className="mt-8 gap-8">
          <DashboardCard title="Upcoming bookings" viewAllTo="/host/bookings">
            <UpcomingBookingsTable bookings={upcomingBookings.slice(0, 3)} />
          </DashboardCard>
          <DashboardCard title="Your listings" viewAllTo="/host/spaces">
            <ListingsList listings={listings.slice(0, 3)} />
          </DashboardCard>
          <EarningsSnapshot total={earnings.total} pendingPayout={earnings.pendingPayout} />
        </View>
      </>
    )
  }

  return (
    <HostScreen showBack={false} onRefresh={dashboard.refetch}>
      {header}
      {body()}
    </HostScreen>
  )
}
