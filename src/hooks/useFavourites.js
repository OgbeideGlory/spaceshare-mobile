import { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import { addFavourite, getFavourites, removeFavourite } from '@/api/favourites'
import { ROLES } from '@/utils/constants'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { useAuth } from './useAuth'

const idOf = (fav) => fav.workspace?._id ?? fav.workspace

// Usage: const { canFavourite, isFavourite, toggleFavourite } = useFavourites()
//        canFavourite → false for hosts and admins (hide the heart for them)
//        isFavourite(workspace._id) → true / false
//        toggleFavourite(workspace._id) → adds or removes it (sends signed-out people to Log in)
export function useFavourites() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  // Only seekers save spaces. Visitors see the heart too, and get sent to log in.
  const isCustomer = user?.role === ROLES.CUSTOMER
  const canFavourite = !user || isCustomer
  // Spaces with a save/remove on its way to the API, so double taps are ignored
  const pendingIds = useRef(new Set())

  const { data: favourites = [] } = useQuery({
    queryKey: ['favourites'],
    queryFn: getFavourites,
    enabled: isCustomer, // only fetch for logged-in seekers
  })

  const favouriteIds = favourites.map(idOf)

  const mutation = useMutation({
    mutationFn: ({ workspaceId, add }) =>
      add ? addFavourite(workspaceId) : removeFavourite(workspaceId),
    // Show the change straight away, and remember the old list in case it fails
    onMutate: async ({ workspaceId, add }) => {
      await queryClient.cancelQueries({ queryKey: ['favourites'] })
      const previous = queryClient.getQueryData(['favourites'])
      queryClient.setQueryData(['favourites'], (old = []) =>
        add ? [...old, { workspace: workspaceId }] : old.filter((fav) => idOf(fav) !== workspaceId),
      )
      return { previous }
    },
    onSuccess: (_data, { add }) =>
      Toast.show({
        type: 'success',
        text1: add ? 'Saved to favourites' : 'Removed from favourites',
      }),
    // Put the old list back
    onError: (error, _vars, context) => {
      queryClient.setQueryData(['favourites'], context?.previous)
      Toast.show({ type: 'error', text1: getErrorMessage(error) })
    },
    onSettled: (_data, _error, { workspaceId }) => {
      pendingIds.current.delete(workspaceId)
      queryClient.invalidateQueries({ queryKey: ['favourites'] })
    },
  })

  function isFavourite(workspaceId) {
    return favouriteIds.includes(workspaceId)
  }

  function toggleFavourite(workspaceId) {
    if (!user) {
      router.push('/login')
      return
    }
    if (!isCustomer || pendingIds.current.has(workspaceId)) return
    pendingIds.current.add(workspaceId)
    mutation.mutate({ workspaceId, add: !isFavourite(workspaceId) })
  }

  return { canFavourite, isFavourite, toggleFavourite }
}
