import { Text, View } from 'react-native'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { getFavourites } from '@/api/favourites'
import SignInPrompt from '@/components/auth/SignInPrompt'
import AppScreen from '@/components/layout/AppScreen'
import LoadError from '@/components/ui/LoadError'
import Spinner from '@/components/ui/Spinner'
import WorkspaceCard from '@/components/workspace/WorkspaceCard'
import { useAuth } from '@/hooks/useAuth'

// "Saved spaces": every space the seeker hearted
function SavedSpaces() {
  const {
    data = [],
    isLoading,
    error,
    refetch,
  } = useQuery({ queryKey: ['favourites'], queryFn: getFavourites })
  // Each favourite should include the full workspace; skip any that don't (e.g. a deleted space)
  const workspaces = data.map((fav) => fav.workspace).filter((w) => typeof w === 'object' && w?._id)

  return (
    <AppScreen showBack={false} onRefresh={refetch} refreshing={false}>
      <Text className="text-2xl font-semibold text-primary">Saved spaces</Text>
      <Text className="mt-1 text-sm text-gray-700">
        Spaces you&apos;ve saved with the heart button.
      </Text>
      <View className="mt-8">
        {isLoading && <Spinner label="Loading saved spaces…" />}
        {Boolean(error) && (
          <LoadError
            error={error}
            fallback="We couldn't load your saved spaces."
            onRetry={refetch}
          />
        )}
        {!isLoading && !error && workspaces.length === 0 && (
          <View className="rounded-xl bg-gray-50 p-10">
            <Text className="text-center text-base text-gray-600">
              Nothing saved yet. Tap the heart on any space to save it.{' '}
              <Text onPress={() => router.push('/search')} className="text-primary">
                Explore spaces
              </Text>
            </Text>
          </View>
        )}
        {workspaces.length > 0 && (
          <View className="gap-4">
            {workspaces.map((workspace) => (
              <WorkspaceCard key={workspace._id} workspace={workspace} />
            ))}
          </View>
        )}
      </View>
    </AppScreen>
  )
}

export default function SavedScreen() {
  const { user } = useAuth()
  if (!user) {
    return (
      <SignInPrompt title="Saved spaces" text="Log in to save spaces and find them here later." />
    )
  }
  return <SavedSpaces />
}
