import { Linking, Pressable, Text, View } from 'react-native'
import { CircleCheck, Loader, MessageCircle, Phone } from 'lucide-react-native'
import { COLORS } from '@/utils/colors'
import { SUPPORT_HOURS, SUPPORT_PHONE, WHATSAPP_URL } from '@/utils/constants'

// The green "Status" box: how far along the host is, plus ways to get help
export default function ListingStatusPanel({ percent }) {
  const isComplete = percent >= 100

  return (
    <View className="rounded-lg bg-mint p-4">
      <Text className="text-lg font-semibold text-gray-900">Status</Text>

      <View className="mt-4 flex-row items-center justify-between rounded-lg bg-cream px-4 py-3">
        <Text className="text-sm text-primary">
          <Text className="font-bold">{percent}%</Text> Complete
        </Text>
        {isComplete ? (
          <CircleCheck size={18} color={COLORS.white} fill={COLORS.primary} />
        ) : (
          <Loader size={18} color={COLORS.primary} />
        )}
      </View>

      <View className="mt-4 rounded-lg bg-white p-4">
        <Text className="text-base font-medium text-gray-900">Stuck and need help?</Text>
        <Text className="mt-1 text-sm text-gray-600">
          Our team is ready to guide you every step of the way
        </Text>

        <View className="mt-3 border-t border-gray-200 pt-3">
          <View className="flex-row items-center gap-2">
            <Phone size={14} color={COLORS.primary} />
            <Text className="text-sm font-medium text-gray-900">Call Us</Text>
          </View>
          <View className="mt-1 flex-row justify-between gap-2">
            <Text
              onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE.replace(/ /g, '')}`)}
              className="text-xs text-primary underline"
            >
              {SUPPORT_PHONE}
            </Text>
            <Text className="text-xs text-primary">{SUPPORT_HOURS}</Text>
          </View>
        </View>

        <View className="mt-3 border-t border-gray-200 pt-3">
          <View className="flex-row items-center gap-2">
            <MessageCircle size={14} color={COLORS.primary} fill={COLORS.primary} />
            <Text className="text-sm font-medium text-gray-900">Live Chat</Text>
          </View>
          <Pressable
            onPress={() => Linking.openURL(WHATSAPP_URL)}
            className="mt-2 rounded-md bg-primary-light/60 py-2 active:bg-primary-light"
          >
            <Text className="text-center text-sm text-primary">Start Chat</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}
