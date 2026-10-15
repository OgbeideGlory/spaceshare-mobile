import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ArrowLeft, Check, CircleCheck, Heart, Info, MapPin, Star } from 'lucide-react-native'
import { getWorkspaceReviews } from '@/api/reviews'
import { getWorkspace } from '@/api/workspaces'
import AppHeader from '@/components/layout/AppHeader'
import { ACTIVITIES, AMENITIES } from '@/components/listing/listingOptions'
import Spinner from '@/components/ui/Spinner'
import UserAvatar from '@/components/ui/UserAvatar'
import BookingPanel from '@/components/workspace/BookingPanel'
import { AllPhotosButton, PhotoGallery } from '@/components/workspace/PhotoGallery'
import { useFavourites } from '@/hooks/useFavourites'
import { useOpeningRules } from '@/hooks/useOpeningRules'
import { slotFromParams } from '@/utils/bookingSlot'
import { COLORS } from '@/utils/colors'
import { formatDate } from '@/utils/formatDate'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { openingHoursText, summariseOpeningHours } from '@/utils/openingHours'
import { ratingOf } from '@/utils/ratingOf'

const SPACE_RULES = [
  { title: 'Check-in', text: 'Your booking reference and QR code arrive in your confirmation' },
  {
    title: 'No smoking. Leave the space as you found it',
    text: 'Hosts can charge for cleaning or damage',
  },
  {
    title: 'Cancellation',
    text: 'Cancel before your booking starts. Paid bookings are refunded by our team',
  },
  { title: 'Need help?', text: 'Contact the host after booking, or chat with SpaceShare support' },
]

const REVIEWS_SHOWN_FIRST = 5
const REVIEWS_PER_PAGE = 100 // the API's maximum, so one request usually gets them all

function Heading({ children }) {
  return <Text className="text-lg font-semibold text-gray-900">{children}</Text>
}

function Stars({ rating }) {
  return (
    <View className="flex-row" accessibilityLabel={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={12}
          color={n <= rating ? COLORS.orange400 : COLORS.gray300}
          fill={n <= rating ? COLORS.orange400 : 'transparent'}
        />
      ))}
    </View>
  )
}

// The newest reviews, with "Show more" (loading the next page from the API when needed)
function ReviewList({ reviewsQuery, reviews, total }) {
  const [shown, setShown] = useState(REVIEWS_SHOWN_FIRST)
  const { hasNextPage, fetchNextPage, isFetchingNextPage } = reviewsQuery
  const visible = reviews.slice(0, shown)
  const hasMore = reviews.length > shown || hasNextPage

  function showMore() {
    const next = shown + 10
    setShown(next)
    if (next > reviews.length && hasNextPage) fetchNextPage()
  }

  if (reviews.length === 0) {
    return <Text className="mt-2 text-sm text-gray-700">No reviews yet.</Text>
  }
  return (
    <>
      <View className="mt-3 gap-5">
        {visible.map((review) => {
          const reviewer = typeof review.user === 'object' ? review.user : null
          return (
            <View key={review._id} className="flex-row gap-3">
              <UserAvatar user={reviewer ?? { name: 'Guest' }} size={36} />
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-900">
                  {reviewer?.name ?? 'SpaceShare guest'}
                </Text>
                <View className="mt-0.5 flex-row items-center gap-2">
                  <Stars rating={review.rating} />
                  <Text className="text-xs text-gray-600">{formatDate(review.createdAt)}</Text>
                </View>
                {review.comment ? (
                  <Text className="mt-1.5 text-sm text-gray-700">{review.comment}</Text>
                ) : null}
              </View>
            </View>
          )
        })}
      </View>
      {hasMore && (
        <Pressable onPress={showMore} disabled={isFetchingNextPage} className="mt-4">
          <Text className="text-sm font-medium text-primary">
            {isFetchingNextPage ? 'Loading…' : `Show more reviews (${total - visible.length} more)`}
          </Text>
        </Pressable>
      )}
    </>
  )
}

function BackLink() {
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/search'))}
      accessibilityRole="link"
      className="flex-row items-center gap-2 self-start"
    >
      <ArrowLeft size={16} color={COLORS.gray800} />
      <Text className="text-sm text-gray-800">Back to Explore Spaces</Text>
    </Pressable>
  )
}

// The space details screen. Open for everyone; booking asks signed-out people to log in.
// Params: id, plus an optional slot (date, start, end, guests) from search.
export default function SpaceDetailsScreen() {
  const params = useLocalSearchParams()
  const { id } = params
  const { canFavourite, isFavourite, toggleFavourite } = useFavourites()

  const {
    data: workspace,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['workspace', id],
    queryFn: () => getWorkspace(id),
    retry: (count, err) => err?.response?.status !== 404 && count < 1,
  })
  // Reviews come newest first, a page at a time
  const reviewsQuery = useInfiniteQuery({
    queryKey: ['reviews', id, 'list'],
    queryFn: ({ pageParam }) =>
      getWorkspaceReviews(id, { page: pageParam, limit: REVIEWS_PER_PAGE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page = 1, totalPages = 1 } = lastPage?.pagination ?? {}
      return page < totalPages ? page + 1 : undefined
    },
  })

  // Public opening hours (the host's weekly rules)
  const { data: openingRules } = useOpeningRules(id)

  function body() {
    if (isLoading) return <Spinner label="Loading space…" />
    if (error) {
      const notFound = error.response?.status === 404
      return (
        <View className="py-10">
          <BackLink />
          <View className="mt-8 rounded-xl bg-gray-50 p-10">
            <Text className="text-center text-xl font-semibold text-gray-900">
              {notFound ? 'This space isn’t available' : 'Something went wrong'}
            </Text>
            <Text className="mt-2 text-center text-base text-gray-600">
              {notFound
                ? 'It may have been removed, or it’s not live yet.'
                : getErrorMessage(error)}
            </Text>
          </View>
        </View>
      )
    }

    // The space comes with its rating; if it doesn't, work it out from the reviews
    const reviews = reviewsQuery.data?.pages.flatMap((page) => page?.reviews ?? []) ?? []
    const totalReviews = reviewsQuery.data?.pages[0]?.pagination?.total ?? reviews.length
    const fromReviews = reviews.length
      ? {
          average: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
          count: totalReviews,
        }
      : null
    const ratingInfo = ratingOf(workspace) ?? fromReviews
    const rating = ratingInfo?.average ?? null
    const reviewCount = ratingInfo?.count ?? 0
    const host = typeof workspace.host === 'object' ? workspace.host : null
    const saved = isFavourite(workspace._id)
    const amenityIcons = Object.fromEntries(AMENITIES.map((a) => [a.value, a.icon]))
    // The exact address is hidden until a booking is confirmed, so this is usually the area
    const address = [workspace.location?.address, workspace.neighborhood, workspace.city]
      .filter(Boolean)
      .join(', ')
    const hoursText = openingHoursText(summariseOpeningHours(openingRules))
    const activityLabels = (workspace.activities ?? []).map(
      (value) => ACTIVITIES.find((a) => a.value === value)?.label ?? value,
    )

    return (
      <>
        <BackLink />

        <View className="mt-6 flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-2xl font-semibold text-gray-900">{workspace.name}</Text>
            <View className="mt-2 flex-row flex-wrap items-center gap-x-5 gap-y-1">
              {workspace.status === 'approved' && (
                <View className="flex-row items-center gap-1.5">
                  <CircleCheck size={14} color={COLORS.white} fill={COLORS.green600} />
                  <Text className="text-xs text-gray-800">Verified Space</Text>
                </View>
              )}
              {rating !== null && (
                <View className="flex-row items-center gap-1">
                  <Star size={14} color={COLORS.orange400} fill={COLORS.orange400} />
                  <Text className="text-xs font-bold text-gray-800">{rating.toFixed(1)}</Text>
                  <Text className="text-xs text-gray-600">
                    ({reviewCount} review{reviewCount === 1 ? '' : 's'})
                  </Text>
                </View>
              )}
              <View className="flex-row items-center gap-1">
                <MapPin size={14} color={COLORS.gray800} />
                <Text className="text-xs text-gray-800">{address}</Text>
              </View>
            </View>
          </View>
          {/* Only seekers save spaces, so hosts and admins don't see this */}
          {canFavourite && (
            <Pressable
              onPress={() => toggleFavourite(workspace._id)}
              accessibilityRole="button"
              accessibilityState={{ selected: saved }}
              className="flex-row items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5"
            >
              <Text className="text-sm text-gray-900">{saved ? 'Saved' : 'Save'}</Text>
              <Heart size={16} color={COLORS.red500} fill={saved ? COLORS.red500 : 'transparent'} />
            </Pressable>
          )}
        </View>

        <View className="mt-6">
          <PhotoGallery images={workspace.images} name={workspace.name} />
          <View className="mt-4 items-end">
            <AllPhotosButton images={workspace.images} name={workspace.name} />
          </View>
        </View>

        <View className="mt-8 gap-9">
          {host && (
            <View className="flex-row items-center gap-3">
              <UserAvatar user={host} size={40} />
              <View>
                <Text className="text-lg font-semibold text-gray-800">Hosted by: {host.name}</Text>
                {Boolean(host.createdAt) && (
                  <Text className="text-xs text-gray-600">
                    Joined in {dayjs(host.createdAt).year()}
                  </Text>
                )}
              </View>
            </View>
          )}

          <View>
            <Heading>About this place</Heading>
            <Text className="mt-2 text-sm text-gray-700">{workspace.description}</Text>
          </View>

          {workspace.amenities?.length > 0 && (
            <View>
              <Heading>Amenities & equipment</Heading>
              <View className="mt-3 flex-row flex-wrap gap-y-3">
                {workspace.amenities.map((amenity) => {
                  const Icon = amenityIcons[amenity] ?? Check
                  return (
                    <View key={amenity} className="w-1/2 flex-row items-center gap-2 pr-3">
                      <Icon size={16} color={COLORS.primary} />
                      <Text className="flex-1 text-sm text-gray-800">{amenity}</Text>
                    </View>
                  )
                })}
              </View>
            </View>
          )}

          {activityLabels.length > 0 && (
            <View>
              <Heading>Best for</Heading>
              <View className="mt-3 flex-row flex-wrap gap-2">
                {activityLabels.map((label) => (
                  <Text
                    key={label}
                    className="rounded-full bg-mint px-3 py-1 text-xs text-gray-800"
                  >
                    {label}
                  </Text>
                ))}
              </View>
            </View>
          )}

          <View>
            <Heading>Capacity</Heading>
            <Text className="mt-1 text-sm text-gray-700">Up to {workspace.capacity} people</Text>
          </View>

          {hoursText ? (
            <View>
              <Heading>Opening hours</Heading>
              <Text className="mt-1 text-sm text-gray-700">{hoursText}</Text>
            </View>
          ) : null}

          {workspace.bookingMode === 'request' && (
            <View>
              <Heading>Booking</Heading>
              <Text className="mt-1 text-sm text-gray-700">
                The host approves each request, usually within 24 hours. You only pay once they
                accept.
              </Text>
            </View>
          )}

          <View>
            <Heading>
              Reviews
              {totalReviews > 0 && <Text className="font-normal"> ({totalReviews})</Text>}
            </Heading>
            {reviewsQuery.isLoading ? (
              <Text className="mt-2 text-sm text-gray-600">Loading reviews…</Text>
            ) : reviewsQuery.error ? (
              <Text className="mt-2 text-sm text-gray-700">
                We couldn&apos;t load the reviews.{' '}
                <Text onPress={() => reviewsQuery.refetch()} className="font-medium text-primary">
                  Try again
                </Text>
              </Text>
            ) : (
              <ReviewList reviewsQuery={reviewsQuery} reviews={reviews} total={totalReviews} />
            )}
          </View>

          <View>
            <Heading>Space Rules</Heading>
            <View className="mt-3 gap-3">
              {SPACE_RULES.map((rule) => (
                <View key={rule.title} className="flex-row gap-2">
                  <Info size={16} color={COLORS.primary} style={{ marginTop: 2 }} />
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900">{rule.title}</Text>
                    <Text className="text-xs text-gray-600">{rule.text}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <BookingPanel workspace={workspace} initialSlot={slotFromParams(params)} />
        </View>
      </>
    )
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <AppHeader />
      <ScrollView contentContainerClassName="px-4 py-6">{body()}</ScrollView>
    </SafeAreaView>
  )
}
