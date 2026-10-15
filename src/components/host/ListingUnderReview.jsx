import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Image } from 'expo-image'
import { useQuery } from '@tanstack/react-query'
import { ImageOff, MapPin, Pencil, TriangleAlert } from 'lucide-react-native'
import { getManagedAvailability } from '@/api/availability'
import { AMENITIES, DAYS, timeLabel } from '@/components/listing/listingOptions'
import { sizedImage } from '@/components/workspace/imageUrl'
import { COLORS } from '@/utils/colors'
import { formatCurrency } from '@/utils/formatCurrency'
import { summariseOpeningHours } from '@/utils/openingHours'
import EmptyCard from './EmptyCard'

// Read-only grey box, like a disabled input
function ReadOnlyBox({ children, className = '', small = false }) {
  return (
    <View className={`rounded-md border border-gray-200 px-3 py-2.5 ${className}`}>
      <Text className={`${small ? 'text-xs' : 'text-sm'} text-gray-400`}>{children}</Text>
    </View>
  )
}

function Label({ children, hint }) {
  return (
    <View className="mb-2">
      <Text className="text-base font-medium text-gray-900">{children}</Text>
      {Boolean(hint) && <Text className="text-xs text-gray-400">{hint}</Text>}
    </View>
  )
}

// What the banner says for each status. Only "pending" has a design; the others follow its style.
function bannerFor(listing) {
  if (listing.status === 'changes_requested') {
    return {
      title: 'Changes requested',
      text:
        listing.requestedChanges ||
        'Our team asked for a few changes before this listing can go live.',
      pill: 'Action needed',
    }
  }
  if (listing.status === 'rejected') {
    return {
      title: 'Your listing wasn’t approved',
      text: listing.rejectionReason || 'Our team couldn’t approve this listing.',
      pill: 'Not approved',
    }
  }
  if (listing.status === 'suspended') {
    return {
      title: 'Your listing is suspended',
      text: listing.suspensionReason || 'Contact support to find out more.',
      pill: 'Suspended',
    }
  }
  return {
    title: 'Your Listing is under review',
    text: `${listing.name} is being checked by our team. We will notify you once it is approved. This usually takes 24 to 48 hours.`,
    pill: 'Review Pending',
  }
}

// The dashboard a host sees while their first listing is waiting for approval ("Space host Dashboard 2")
export default function ListingUnderReview({ listing }) {
  const photos = listing.images ?? []
  const banner = bannerFor(listing)
  const needsChanges = ['changes_requested', 'rejected'].includes(listing.status)
  const rulesQuery = useQuery({
    queryKey: ['availability', listing._id, 'manage'],
    queryFn: () => getManagedAvailability(listing._id),
  })
  const hours = summariseOpeningHours(rulesQuery.data)
  const openDays = DAYS.filter((day) => hours?.openDays?.includes(day.dayOfWeek))

  return (
    <View>
      <View className="gap-4">
        <View className="rounded-sm border border-orange-200 bg-orange-50 px-4 py-3">
          <View className="flex-row items-center gap-1.5">
            <TriangleAlert size={14} color={COLORS.white} fill="#facc15" />
            <Text className="text-base font-medium text-primary">{banner.title}</Text>
          </View>
          <Text className="mt-1 text-xs text-primary">{banner.text}</Text>
          {needsChanges && (
            <Pressable
              onPress={() =>
                router.push({ pathname: '/host/listings/[id]/edit', params: { id: listing._id } })
              }
              className="mt-2 flex-row items-center gap-1"
            >
              <Pencil size={12} color={COLORS.primary} />
              <Text className="text-xs font-medium text-primary underline">Edit and resubmit</Text>
            </Pressable>
          )}
        </View>
        <View className="flex-row items-center gap-2 self-start rounded-full border border-green-200 bg-green-50 px-4 py-2">
          {listing.status === 'pending' && <ActivityIndicator size="small" color="#15803d" />}
          <Text className="text-xs text-green-800">{banner.pill}</Text>
        </View>
      </View>

      <View className="mt-8 gap-8">
        {/* The listing as submitted */}
        <View className="gap-6">
          <View>
            <Text className="text-xl font-semibold text-gray-900">{listing.name}</Text>
            <View className="mt-1 flex-row items-center gap-1.5">
              <MapPin size={14} color={COLORS.gray800} />
              <Text className="flex-1 text-sm text-gray-800">
                {listing.location?.address}, {listing.city}
              </Text>
            </View>
          </View>

          <View>
            <View className="h-40 items-center justify-center overflow-hidden rounded-md bg-gray-300">
              {photos[0]?.url ? (
                <Image
                  source={sizedImage(photos[0].url, 800)}
                  accessibilityLabel="Cover"
                  contentFit="cover"
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <ImageOff color={COLORS.white} />
              )}
              <Text className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs">
                Cover Photo
              </Text>
            </View>
            {photos.length > 1 && (
              <View className="mt-3 flex-row gap-3">
                {photos.slice(1, 4).map((photo) => (
                  <Image
                    key={photo.publicId ?? photo.url}
                    source={sizedImage(photo.url, 300)}
                    contentFit="cover"
                    style={{ flex: 1, aspectRatio: 6 / 5, borderRadius: 6 }}
                  />
                ))}
              </View>
            )}
          </View>

          <View>
            <Label>Description</Label>
            <Text className="text-sm text-gray-400">{listing.description}</Text>
          </View>

          <View>
            <Label hint="What comes with the space?">Amenities</Label>
            <View className="flex-row flex-wrap gap-y-3 rounded-md border border-gray-200 p-4">
              {AMENITIES.map(({ value, icon: Icon }) => {
                const included = listing.amenities?.includes(value)
                return (
                  <View key={value} className="w-1/2 flex-row items-center gap-1.5 pr-2">
                    <Icon size={14} color={included ? COLORS.primary : COLORS.gray300} />
                    <Text
                      className={`flex-1 text-xs ${included ? 'text-gray-900' : 'text-gray-300'}`}
                    >
                      {value}
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1">
              <Label>Capacity</Label>
              <ReadOnlyBox>Up to {listing.capacity} people</ReadOnlyBox>
            </View>
            <View className="flex-1">
              <Label>Pricing</Label>
              <ReadOnlyBox>
                {formatCurrency(listing.pricing?.amount)} / {listing.pricing?.unit}
              </ReadOnlyBox>
            </View>
          </View>
        </View>

        {/* Empty bookings + earnings, and the opening hours */}
        <View className="gap-8">
          <View>
            <Text className="mb-3 text-sm font-medium text-gray-900">Upcoming bookings</Text>
            <EmptyCard
              title="No bookings yet"
              text="Once your listing is live, bookings will show here"
            />
          </View>
          <View>
            <Text className="mb-3 text-sm font-medium text-gray-900">Earnings Snapshot</Text>
            <EmptyCard
              value={formatCurrency(0)}
              text="Your earnings will appear here after your first booking"
            />
          </View>
          {hours && (
            <View>
              <Label>Availability</Label>
              <Text className="mb-1 text-xs text-gray-400">Opening Hours</Text>
              <View className="flex-row items-center gap-2">
                <ReadOnlyBox small className="flex-1">
                  {timeLabel(hours.openingTime)}
                </ReadOnlyBox>
                <Text className="text-xs text-gray-400">to</Text>
                <ReadOnlyBox small className="flex-1">
                  {timeLabel(hours.closingTime)}
                </ReadOnlyBox>
              </View>
              <Text className="mb-1 mt-4 text-xs text-gray-400">Opening Days</Text>
              <ReadOnlyBox small>{openDays.map((day) => day.short).join(', ')}</ReadOnlyBox>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
