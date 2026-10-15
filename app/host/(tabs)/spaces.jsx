import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Image } from 'expo-image'
import { MapPin, Pencil, Plus, Users } from 'lucide-react-native'
import HostScreen from '@/components/host/HostScreen'
import { AMENITIES } from '@/components/listing/listingOptions'
import LoadError from '@/components/ui/LoadError'
import Spinner from '@/components/ui/Spinner'
import Tabs from '@/components/ui/Tabs'
import { sizedImage } from '@/components/workspace/imageUrl'
import { useMyListings } from '@/hooks/useMyListings'
import { areaOf } from '@/utils/bookingHelpers'
import { COLORS } from '@/utils/colors'
import { formatCurrency } from '@/utils/formatCurrency'

const STATUS_CHIPS = {
  published: { label: 'Published', dot: 'bg-green-600' },
  review: { label: 'Under review', dot: 'bg-indigo-500' },
  paused: { label: 'Paused', dot: 'bg-gray-400' },
  changes_requested: { label: 'Changes requested', dot: 'bg-amber-500' },
  rejected: { label: 'Not approved', dot: 'bg-red-500' },
  suspended: { label: 'Suspended', dot: 'bg-red-500' },
}
const UNIT_SHORT = { hour: 'hr', day: 'day' }
const amenityIcon = Object.fromEntries(AMENITIES.map((a) => [a.value, a.icon]))
const NEEDS_ACTION = ['changes_requested', 'rejected', 'suspended']

const editListing = (id) => router.push({ pathname: '/host/listings/[id]/edit', params: { id } })

function SpaceCard({ listing }) {
  const chip = STATUS_CHIPS[listing.listingStatus] ?? {
    label: listing.listingStatus,
    dot: 'bg-gray-400',
  }
  const note = listing.requestedChanges || listing.rejectionReason || listing.suspensionReason
  return (
    <View>
      <View className="h-48 overflow-hidden rounded-xl bg-gray-200">
        {Boolean(listing.images?.[0]?.url) && (
          <Image
            source={sizedImage(listing.images[0].url, 800)}
            contentFit="cover"
            style={{ width: '100%', height: '100%' }}
          />
        )}
        <View className="absolute right-3 top-3 flex-row items-center gap-1.5 rounded-md bg-white px-2 py-0.5">
          <View className={`size-2 rounded-full ${chip.dot}`} />
          <Text className="text-[11px] text-gray-800">{chip.label}</Text>
        </View>
      </View>
      <Text
        onPress={() => editListing(listing._id)}
        className="mt-4 text-base font-semibold text-gray-900"
      >
        {listing.name}
      </Text>
      <View className="mt-1 flex-row items-center gap-1">
        <MapPin size={12} color={COLORS.gray700} />
        <Text className="text-xs text-gray-700">{areaOf(listing)}</Text>
      </View>
      {Boolean(note) && listing.listingStatus !== 'published' && (
        <Text className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">{note}</Text>
      )}
      {listing.amenities?.length > 0 && (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {listing.amenities.slice(0, 2).map((amenity) => {
            const Icon = amenityIcon[amenity]
            return (
              <View
                key={amenity}
                className="flex-row items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1"
              >
                {Icon && <Icon size={12} color={COLORS.gray800} />}
                <Text className="text-[11px] text-gray-800">{amenity}</Text>
              </View>
            )
          })}
        </View>
      )}
      <View className="mt-4 flex-row items-center justify-between rounded-lg border border-gray-300 px-4 py-3">
        <Text className="text-lg font-semibold text-accent">
          {formatCurrency(listing.pricing?.amount)}
          <Text className="text-xs font-normal">
            {' '}
            / {UNIT_SHORT[listing.pricing?.unit] ?? listing.pricing?.unit}
          </Text>
        </Text>
        <View className="flex-row items-center gap-1.5">
          <Users size={16} color={COLORS.gray800} />
          <Text className="text-sm text-gray-800">{listing.capacity} guests</Text>
        </View>
      </View>
      <View className="mt-3 flex-row items-center justify-between gap-2">
        <Pressable
          onPress={() => editListing(listing._id)}
          className="flex-row items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 active:bg-gray-50"
        >
          <Pencil size={13} color="#166534" />
          <Text className="text-xs text-green-800">Edit Listing</Text>
        </Pressable>
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/host/listings/[id]/availability',
              params: { id: listing._id },
            })
          }
          className="flex-row items-center gap-1.5 rounded-md bg-green-700 px-2.5 py-1.5 active:bg-green-800"
        >
          <Pencil size={13} color={COLORS.white} />
          <Text className="text-xs text-white">Manage Availability</Text>
        </Pressable>
      </View>
    </View>
  )
}

// "My Space" tab
export default function MySpacesScreen() {
  const { listings, isLoading, error, refetch } = useMyListings()
  const [tab, setTab] = useState('all')

  const count = (status) => listings.filter((l) => l.listingStatus === status).length
  const tabs = [
    { key: 'all', label: 'All', count: listings.length },
    { key: 'published', label: 'Published', count: count('published') },
    { key: 'review', label: 'Under Review', count: count('review') },
    { key: 'paused', label: 'Paused', count: count('paused') },
  ]
  // Only show this tab when something is in it
  const needsAction = listings.filter((l) => NEEDS_ACTION.includes(l.listingStatus)).length
  if (needsAction > 0) tabs.push({ key: 'action', label: 'Needs action', count: needsAction })
  const visible =
    tab === 'all'
      ? listings
      : tab === 'action'
        ? listings.filter((l) => NEEDS_ACTION.includes(l.listingStatus))
        : listings.filter((l) => l.listingStatus === tab)

  return (
    <HostScreen showBack={false} onRefresh={refetch}>
      <View className="gap-4">
        <View>
          <Text className="text-2xl font-semibold text-gray-900">My Spaces</Text>
          <Text className="mt-2 text-sm text-gray-800">
            Manage your availability, rates and space details.
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/host/listings/new')}
          className="flex-row items-center gap-1.5 self-start rounded-md bg-green-700 px-5 py-2.5 active:bg-green-800"
        >
          <Plus size={16} color={COLORS.white} />
          <Text className="text-sm text-white">Add New Space</Text>
        </Pressable>
      </View>

      <View className="mt-8">
        <Tabs tabs={tabs} active={tab} onChange={setTab} label="Listing status" variant="pill" />
      </View>

      <View className="mt-8">
        {isLoading && <Spinner label="Loading your spaces…" />}
        {Boolean(error) && (
          <LoadError error={error} fallback="We couldn't load your spaces." onRetry={refetch} />
        )}
        {!isLoading && !error && visible.length === 0 && (
          <View className="rounded-xl bg-gray-50 p-10">
            <Text className="text-center text-base text-gray-600">
              {tab === 'all' ? (
                <>
                  You haven&apos;t listed a space yet.{' '}
                  <Text onPress={() => router.push('/host/listings/new')} className="text-primary">
                    List your first space
                  </Text>
                </>
              ) : (
                'No spaces here.'
              )}
            </Text>
          </View>
        )}
        <View className="gap-8">
          {visible.map((listing) => (
            <SpaceCard key={listing._id} listing={listing} />
          ))}
        </View>
      </View>
    </HostScreen>
  )
}
