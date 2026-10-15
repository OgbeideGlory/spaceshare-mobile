import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { ArrowRight } from 'lucide-react-native'
import { COLORS } from '@/utils/colors'

// A titled section with an optional "View all →" link
export default function DashboardCard({ title, viewAllTo, children }) {
  return (
    <View>
      <View className="flex-row items-center justify-between rounded-md border border-gray-200 px-3 py-2.5">
        <Text className="text-sm font-medium text-gray-900">{title}</Text>
        {Boolean(viewAllTo) && (
          <Pressable
            onPress={() => router.navigate(viewAllTo)}
            className="flex-row items-center gap-1"
          >
            <Text className="text-xs text-primary">View all</Text>
            <ArrowRight size={14} color={COLORS.primary} />
          </Pressable>
        )}
      </View>
      <View className="mt-2">{children}</View>
    </View>
  )
}
