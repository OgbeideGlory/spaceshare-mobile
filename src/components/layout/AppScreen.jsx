import { RefreshControl, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppHeader from './AppHeader'

// Frame for search, space details, checkout and the seeker's own screens (the web's AppLayout):
// the header, then the content in a scrolling area.
// showBack: false on the main tab screens. onRefresh: pull down to reload (e.g. refetch).
export default function AppScreen({ children, showBack = true, onRefresh, refreshing = false }) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <AppHeader showBack={showBack} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-4 pb-10 pt-6"
        refreshControl={
          onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
        }
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  )
}
