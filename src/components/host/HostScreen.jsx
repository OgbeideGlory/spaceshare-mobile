import { RefreshControl, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import HostTopBar from './HostTopBar'

// Frame for every host screen (the web's HostLayout on phones): the top bar, then the content.
// showBack: false on the tab screens. onRefresh: pull down to reload.
export default function HostScreen({ children, showBack = true, onRefresh }) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <HostTopBar showBack={showBack} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-4 pb-10"
        refreshControl={
          onRefresh ? <RefreshControl refreshing={false} onRefresh={onRefresh} /> : undefined
        }
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  )
}
