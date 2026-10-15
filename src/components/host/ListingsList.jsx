import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Image } from 'expo-image'
import StatusBadge from '@/components/ui/StatusBadge'
import { sizedImage } from '@/components/workspace/imageUrl'
import { formatCurrency } from '@/utils/formatCurrency'
import EmptyCard from './EmptyCard'

const UNIT_SHORT = { hour: 'hr', day: 'day' }

// "Your listings": photo, name, price + area, status, Edit
export default function ListingsList({ listings }) {
  if (listings.length === 0) {
    return <EmptyCard title="No listings yet" text="Spaces you list will show here" />
  }

  return (
    <View className="gap-3">
      {listings.map((listing) => (
        <View key={listing._id} className="flex-row items-center gap-3">
          <View className="h-12 w-20 overflow-hidden rounded-sm bg-gray-200">
            {listing.images?.[0]?.url && (
              <Image
                source={sizedImage(listing.images[0].url, 300)}
                contentFit="cover"
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </View>
          <View className="flex-1">
            <Text numberOfLines={1} className="text-xs font-medium text-gray-900">
              {listing.name}
            </Text>
            <Text numberOfLines={1} className="text-[10px] text-gray-600">
              {formatCurrency(listing.pricing?.amount)}/
              {UNIT_SHORT[listing.pricing?.unit] ?? listing.pricing?.unit}
              {' - '}
              {[listing.city, listing.state].filter(Boolean).join(', ')}
            </Text>
          </View>
          <StatusBadge status={listing.status === 'pending' ? 'inReview' : listing.status} />
          <Pressable
            onPress={() =>
              router.push({ pathname: '/host/listings/[id]/edit', params: { id: listing._id } })
            }
            className="rounded-md bg-primary-light/60 px-3 py-1 active:bg-primary-light"
          >
            <Text className="text-xs text-primary">Edit</Text>
          </Pressable>
        </View>
      ))}
    </View>
  )
}
