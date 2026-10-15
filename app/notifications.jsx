import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CalendarCheck, CreditCard, Megaphone, Star, Trash2 } from 'lucide-react-native'
import {
  deleteNotification,
  getNotificationsPage,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notifications'
import HostTopBar from '@/components/host/HostTopBar'
import AppHeader from '@/components/layout/AppHeader'
import LoadError from '@/components/ui/LoadError'
import Spinner from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'
import { COLORS } from '@/utils/colors'
import { ROLES } from '@/utils/constants'
import dayjs from '@/utils/dayjs'

const TYPE_ICONS = {
  booking: CalendarCheck,
  payment: CreditCard,
  review: Star,
  admin: Megaphone,
  system: Bell,
}
const PAGE_SIZE = 20

// Notifications for any signed-in user (the web's NotificationsPage).
// Changed for mobile: more load as you scroll down, instead of page numbers.
export default function NotificationsScreen() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const query = useInfiniteQuery({
    queryKey: ['notifications', 'list'],
    queryFn: ({ pageParam }) => getNotificationsPage({ page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      (last.currentPage ?? 1) < (last.totalPages ?? 1) ? (last.currentPage ?? 1) + 1 : undefined,
  })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['notifications'] })

  const readOne = useMutation({ mutationFn: markNotificationRead, onSuccess: refresh })
  const readAll = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: refresh })
  const remove = useMutation({ mutationFn: deleteNotification, onSuccess: refresh })

  const pages = query.data?.pages ?? []
  const notifications = pages.flatMap((page) => page.notifications ?? [])
  const unreadCount = pages[0]?.unreadCount ?? 0

  const header = (
    <View className="mb-6 flex-row items-end justify-between gap-4">
      <View>
        <Text className="text-2xl font-semibold text-gray-900">Notifications</Text>
        {query.isSuccess && (
          <Text className="mt-1 text-sm text-gray-600">{unreadCount} unread</Text>
        )}
      </View>
      {unreadCount > 0 && (
        <Pressable onPress={() => readAll.mutate()} disabled={readAll.isPending} hitSlop={6}>
          <Text className="text-sm font-medium text-primary">Mark all as read</Text>
        </Pressable>
      )}
    </View>
  )

  function renderItem({ item: n, index }) {
    const Icon = TYPE_ICONS[n.type] ?? Bell
    return (
      <View
        className={`flex-row gap-3 border-gray-100 p-4 ${index > 0 ? 'border-t' : ''} ${n.isRead ? '' : 'bg-primary-light/30'}`}
      >
        <View className="size-9 items-center justify-center rounded-full bg-white shadow-sm">
          <Icon size={16} color={COLORS.accent} />
        </View>
        <Pressable
          onPress={() => !n.isRead && readOne.mutate(n._id)}
          accessibilityLabel={n.isRead ? n.title : `${n.title} (unread, mark as read)`}
          className="flex-1"
        >
          <Text className={`text-sm ${n.isRead ? 'text-gray-800' : 'font-semibold text-gray-900'}`}>
            {n.title}
          </Text>
          <Text className="text-sm text-gray-600">{n.message}</Text>
          <Text className="mt-1 text-xs text-gray-600">{dayjs(n.createdAt).fromNow()}</Text>
        </Pressable>
        <Pressable
          onPress={() => remove.mutate(n._id)}
          accessibilityLabel={`Delete "${n.title}"`}
          hitSlop={8}
          className="self-start rounded p-1"
        >
          <Trash2 size={16} color={COLORS.gray400} />
        </Pressable>
      </View>
    )
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      {user?.role === ROLES.HOST ? <HostTopBar /> : <AppHeader />}
      <FlatList
        data={notifications}
        keyExtractor={(n) => n._id}
        renderItem={renderItem}
        contentContainerClassName="px-4 pb-10 pt-6"
        ListHeaderComponent={header}
        ListEmptyComponent={
          query.isLoading ? (
            <Spinner label="Loading notifications…" />
          ) : query.error ? (
            <LoadError
              error={query.error}
              fallback="We couldn't load your notifications."
              onRetry={query.refetch}
            />
          ) : (
            <Text className="rounded-xl bg-gray-50 p-10 text-center text-sm text-gray-600">
              You&apos;re all caught up. Nothing here yet.
            </Text>
          )
        }
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        onEndReachedThreshold={0.4}
        ListFooterComponent={query.isFetchingNextPage ? <Spinner label="Loading more…" /> : null}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
      />
    </SafeAreaView>
  )
}
