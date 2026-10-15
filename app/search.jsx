import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ArrowRight, SlidersHorizontal } from 'lucide-react-native'
import { searchAllWorkspaces } from '@/api/workspaces'
import AppHeader from '@/components/layout/AppHeader'
import FilterPanel from '@/components/search/FilterPanel'
import SearchBar from '@/components/search/SearchBar'
import {
  applyFilters,
  countActiveFilters,
  filtersFromParams,
  toApiFilters,
} from '@/components/search/searchFilters'
import EmptyState from '@/components/ui/EmptyState'
import LoadError from '@/components/ui/LoadError'
import WorkspaceCard from '@/components/workspace/WorkspaceCard'
import { addHours, slotToParams } from '@/utils/bookingSlot'
import { COLORS } from '@/utils/colors'

const FIRST_PAGE = 9

const HEADING_BY_TYPE = {
  workspace: 'Spaces for work',
  meeting_room: 'Spaces for meetings',
  studio: 'Spaces for creating',
}

// Search results. Opened with optional params (type, city, date, priceUnit), e.g. from a home page category.
// The web keeps filters in the URL; here they live in this screen's state.
export default function SearchScreen() {
  const params = useLocalSearchParams()
  const [filters, setFilters] = useState(() => filtersFromParams(params))
  const [showAll, setShowAll] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // The API does most of the filtering; applyFilters() handles what it can't (see searchFilters.js)
  const apiFilters = toApiFilters(filters)
  const {
    data = [],
    isLoading,
    isPlaceholderData,
    error,
    refetch,
  } = useQuery({
    queryKey: ['workspaces', 'search', apiFilters],
    queryFn: () => searchAllWorkspaces(apiFilters),
    staleTime: 60 * 1000, // going back to a search within a minute doesn't load it again
    placeholderData: keepPreviousData, // keep showing the old results while new ones load
  })
  const results = applyFilters(data, filters)
  const visible = showAll ? results : results.slice(0, FIRST_PAGE)

  function handleSearch(values) {
    setFilters({ ...filters, ...values })
    setShowAll(false)
  }

  // If the seeker picked a date, carry it to the space screen so the booking box is filled in
  const slotParams = filters.date
    ? slotToParams({
        date: filters.date,
        start: '10:00',
        end: addHours('10:00', filters.duration) ?? '24:00',
        guests: filters.people,
      })
    : undefined

  const activeCount = countActiveFilters(filters)
  const heading = `${HEADING_BY_TYPE[filters.type] ?? 'Spaces'} in ${filters.city || 'Nigeria'}`

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <AppHeader />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-4 pb-10 pt-6">
        <SearchBar filters={filters} onSearch={handleSearch} />

        <View className="mt-8">
          {/* Filters open from a button (the web shows them on the left on big screens) */}
          <Pressable
            onPress={() => setFiltersOpen(!filtersOpen)}
            accessibilityState={{ expanded: filtersOpen }}
            className="mb-4 flex-row items-center justify-between rounded-md border border-gray-300 px-4 py-2.5"
          >
            <View className="flex-row items-center gap-2">
              <SlidersHorizontal size={16} color={COLORS.gray900} />
              <Text className="text-sm text-gray-900">
                Filters {activeCount > 0 ? `(${activeCount})` : ''}
              </Text>
            </View>
            <Text className="text-sm text-primary">{filtersOpen ? 'Hide' : 'Show'}</Text>
          </Pressable>
          {filtersOpen && (
            <View className="mb-8">
              {/* key: start fresh when the city changes (its areas list changes) */}
              <FilterPanel key={filters.city} filters={filters} setFilters={setFilters} />
            </View>
          )}

          <View accessibilityLiveRegion="polite">
            <Text className="text-xl font-semibold text-gray-900">{heading}</Text>
            {!isLoading && !error && (
              <Text className="mt-1 text-sm text-gray-700">
                {results.length} result{results.length === 1 ? '' : 's'}
                {isPlaceholderData && <Text className="text-gray-600"> · Updating…</Text>}
              </Text>
            )}

            {isLoading && (
              <View className="mt-6 gap-4">
                {[1, 2, 3].map((i) => (
                  <View key={i} className="h-80 rounded-2xl bg-gray-100" />
                ))}
              </View>
            )}

            {Boolean(error) && (
              <LoadError
                error={error}
                fallback="We couldn't load spaces."
                onRetry={refetch}
                className="mt-6"
              />
            )}

            {!isLoading && !error && results.length === 0 && (
              <EmptyState
                className="mt-6"
                message={`No spaces match your search. ${activeCount > 0 ? 'Try removing a filter.' : 'Try another city or type of space.'}`}
              />
            )}

            {visible.length > 0 && (
              <View className="mt-6 gap-4">
                {visible.map((workspace) => (
                  <WorkspaceCard
                    key={workspace._id}
                    workspace={workspace}
                    slotParams={slotParams}
                  />
                ))}
              </View>
            )}

            {!showAll && results.length > FIRST_PAGE && (
              <Pressable
                onPress={() => setShowAll(true)}
                className="mt-8 flex-row items-center gap-2 self-center rounded-md bg-primary-light/70 px-6 py-2.5"
              >
                <Text className="text-sm text-primary">Show all {results.length} spaces</Text>
                <ArrowRight size={14} color={COLORS.primary} />
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
