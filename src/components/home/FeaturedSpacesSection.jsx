import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react-native'
import { searchWorkspaces } from '@/api/workspaces'
import EmptyState from '@/components/ui/EmptyState'
import LoadError from '@/components/ui/LoadError'
import WorkspaceCard from '@/components/workspace/WorkspaceCard'
import { COLORS } from '@/utils/colors'

const CARD_WIDTH = 288 // w-72
const GAP = 16

// Grey boxes shown while the workspaces load
function CardSkeleton() {
  return <View style={{ width: CARD_WIDTH }} className="h-96 rounded-2xl bg-gray-100" />
}

export default function FeaturedSpacesSection() {
  const {
    data: workspaces = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['workspaces', 'featured'],
    queryFn: () => searchWorkspaces(),
  })

  // TODO: the API has no "featured" flag yet, so we show the first three approved spaces
  const featured = workspaces.slice(0, 3)

  return (
    <View className="py-12">
      <View className="px-4">
        <Text className="text-sm text-gray-500">Hand-picked spaces with verified availability</Text>
        <Text className="mt-1 text-2xl font-bold text-primary">Featured Spaces</Text>
      </View>

      <View className="mt-8">
        {isLoading && (
          <View className="flex-row gap-4 overflow-hidden px-4">
            <CardSkeleton />
            <CardSkeleton />
          </View>
        )}

        {Boolean(error) && (
          <LoadError
            error={error}
            fallback="We couldn't load spaces."
            onRetry={refetch}
            className="mx-4"
          />
        )}

        {!isLoading && !error && featured.length === 0 && (
          <EmptyState message="New spaces are being added. Check back soon!" className="mx-4" />
        )}

        {featured.length > 0 && (
          // Swipe sideways, one card at a time
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + GAP}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 16, gap: GAP }}
          >
            {featured.map((workspace) => (
              <View key={workspace._id} style={{ width: CARD_WIDTH }}>
                <WorkspaceCard workspace={workspace} variant="featured" />
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <Pressable
        onPress={() => router.push('/search')}
        accessibilityRole="link"
        className="mt-6 flex-row items-center gap-1 px-4"
      >
        <Text className="text-sm font-medium text-primary">View All Spaces</Text>
        <ArrowRight size={14} color={COLORS.primary} />
      </Pressable>
    </View>
  )
}
