import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Image } from 'expo-image'
import { Heart, MapPin, Star } from 'lucide-react-native'
import Button from '@/components/ui/Button'
import UserAvatar from '@/components/ui/UserAvatar'
import { useFavourites } from '@/hooks/useFavourites'
import { areaOf } from '@/utils/bookingHelpers'
import { COLORS } from '@/utils/colors'
import { WORKSPACE_TYPES } from '@/utils/constants'
import { formatCurrency } from '@/utils/formatCurrency'
import { ratingOf } from '@/utils/ratingOf'
import { sizedImage } from './imageUrl'

// Badge colour for each workspace type (top-left of the photo, home page only)
const TYPE_BADGE_COLOURS = {
  studio: { box: 'bg-yellow-300', text: 'text-yellow-900' },
  meeting_room: { box: 'bg-purple-500', text: 'text-white' },
  workspace: { box: 'bg-primary', text: 'text-white' },
}

const UNIT_LABELS = { hour: 'Hour', day: 'Day' }

function getTypeLabel(type) {
  return WORKSPACE_TYPES.find((t) => t.value === type)?.label ?? type
}

// Shows one workspace. Used on the home page (variant="featured") and search results.
// slotParams: the date/time picked in search, passed on to the space screen's booking box.
export default function WorkspaceCard({ workspace, variant = 'search', slotParams }) {
  const { canFavourite, isFavourite, toggleFavourite } = useFavourites()
  const saved = isFavourite(workspace._id)
  const image = sizedImage(workspace.images?.[0]?.url, 800)
  const isFeatured = variant === 'featured'
  const rating = ratingOf(workspace)
  // The API sometimes includes the host's details, sometimes only their ID
  const host = typeof workspace.host === 'object' ? workspace.host : null
  const badge = TYPE_BADGE_COLOURS[workspace.type] ?? { box: 'bg-white', text: 'text-gray-800' }

  const openDetails = () =>
    router.push({ pathname: '/space/[id]', params: { id: workspace._id, ...slotParams } })

  return (
    <View className="flex-1 rounded-2xl bg-gray-100 p-2.5">
      <View className="h-44 overflow-hidden rounded-xl bg-gray-200">
        <Pressable onPress={openDetails} accessibilityLabel={workspace.name} className="flex-1">
          {Boolean(image) && (
            <Image
              source={image}
              contentFit="cover"
              transition={200}
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </Pressable>
        {isFeatured && (
          <View className={`absolute left-3 top-3 rounded-full px-2.5 py-1 ${badge.box}`}>
            <Text className={`text-xs font-medium ${badge.text}`}>
              {getTypeLabel(workspace.type)}
            </Text>
          </View>
        )}
        {/* Hosts and admins don't save spaces, so they don't get the heart */}
        {canFavourite && (
          <Pressable
            onPress={() => toggleFavourite(workspace._id)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              saved
                ? `Remove ${workspace.name} from favourites`
                : `Save ${workspace.name} to favourites`
            }
            className="absolute right-3 top-3 size-7 items-center justify-center rounded-full bg-white"
          >
            <Heart
              size={14}
              color={saved ? COLORS.red500 : COLORS.gray600}
              fill={saved ? COLORS.red500 : 'transparent'}
            />
          </Pressable>
        )}
      </View>

      <View className="mt-2.5 flex-1 rounded-xl bg-white p-3">
        <View className="flex-row items-start justify-between gap-3">
          <Text onPress={openDetails} className="flex-1 text-sm font-medium text-gray-900">
            {workspace.name}
          </Text>
          <Text className="text-sm font-semibold text-primary">
            {formatCurrency(workspace.pricing?.amount)}
            <Text className="text-xs font-normal text-gray-600">
              {' '}
              / {UNIT_LABELS[workspace.pricing?.unit] ?? workspace.pricing?.unit}
            </Text>
          </Text>
        </View>

        <View className="mt-1 flex-row items-center gap-1">
          <MapPin size={12} color={COLORS.primary} />
          <Text className="flex-1 text-xs text-gray-600" numberOfLines={1}>
            {areaOf(workspace)}
            {workspace.capacity ? ` • up to ${workspace.capacity} guests` : ''}
          </Text>
        </View>
        {rating && (
          <View className="mt-1 flex-row items-center gap-1">
            <Star size={12} color={COLORS.orange400} fill={COLORS.orange400} />
            <Text className="text-xs font-bold text-gray-700">{rating.average.toFixed(1)}</Text>
            {rating.count > 0 && <Text className="text-xs text-gray-600">({rating.count})</Text>}
          </View>
        )}

        {workspace.amenities?.length > 0 && (
          <View className="mt-3 flex-row flex-wrap gap-1.5">
            {workspace.amenities.slice(0, 4).map((amenity) => (
              <Text
                key={amenity}
                className="rounded-md bg-primary-light px-2 py-0.5 text-[11px] text-gray-800"
              >
                {amenity}
              </Text>
            ))}
          </View>
        )}

        <View className="mt-auto flex-row items-center justify-between gap-2 pt-4">
          {host ? (
            <View className="flex-1 flex-row items-center gap-2">
              <UserAvatar user={host} size={24} />
              <View className="flex-1">
                <Text numberOfLines={1} className="text-[11px] font-medium text-gray-900">
                  Hosted by {host.name?.split(' ')[0]} <Text className="text-blue-600">●</Text>
                </Text>
                <Text className="text-[11px] text-gray-700">Verified host</Text>
              </View>
            </View>
          ) : (
            <View />
          )}
          {isFeatured ? (
            <Button size="sm" onPress={openDetails}>
              Book Now
            </Button>
          ) : (
            workspace.isAvailable && (
              <View className="flex-row items-center gap-1 rounded-full bg-green-50 px-2 py-0.5">
                <View className="size-1.5 rounded-full bg-green-600" />
                <Text className="text-[10px] text-green-700">Available</Text>
              </View>
            )
          )}
        </View>
      </View>
    </View>
  )
}
