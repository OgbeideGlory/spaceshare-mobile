import { Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import {
  BellRing,
  CalendarClock,
  Check,
  Mail,
  MessageCircle,
  Phone,
  Radio,
  UserSearch,
} from 'lucide-react-native'
import Button from '@/components/ui/Button'
import { COLORS } from '@/utils/colors'
import { SUPPORT_PHONE, WHATSAPP_URL } from '@/utils/constants'

const NEXT_STEPS = [
  { icon: UserSearch, text: 'We review your details and photos' },
  { icon: Mail, text: 'You get a notification with the result' },
  { icon: Radio, text: 'Once approved, your space goes live' },
]

// Little coloured squares around the tick: [position, colour]
const CONFETTI = [
  [{ top: 8, left: '22%' }, 'bg-green-500'],
  [{ top: 32, left: '14%' }, 'bg-orange-400'],
  [{ top: 64, left: '26%' }, 'bg-indigo-400'],
  [{ top: 96, left: '18%' }, 'bg-yellow-400'],
  [{ top: 16, right: '24%' }, 'bg-sky-400'],
  [{ top: 48, right: '16%' }, 'bg-green-600'],
  [{ top: 80, right: '26%' }, 'bg-orange-400'],
  [{ top: 112, right: '20%' }, 'bg-indigo-700'],
]

// The listing is already sent, so this can't be closed: the host picks where to go next.
// Leaving uses replace(), so Back doesn't return to the finished form.
export default function PublishSuccessModal({ listingName }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
      <View className="flex-1 justify-center bg-black/50 px-4 py-10">
        <View className="max-h-full rounded-2xl bg-white">
          <ScrollView contentContainerClassName="p-6">
            <View className="h-36 items-center justify-center">
              {CONFETTI.map(([position, colour], i) => (
                <View
                  key={i}
                  style={[{ position: 'absolute', transform: [{ rotate: '45deg' }] }, position]}
                  className={`size-2.5 rounded-sm ${colour}`}
                />
              ))}
              <View className="size-20 items-center justify-center rounded-full bg-green-100">
                <View className="size-12 items-center justify-center rounded-full bg-green-600">
                  <Check size={26} strokeWidth={3} color={COLORS.white} />
                </View>
              </View>
            </View>

            <Text className="mt-2 text-center text-xl font-semibold text-gray-900">
              Listing Submitted Successfully
            </Text>
            <Text className="mt-2 text-center text-sm text-gray-700">
              We have received your listing for {listingName}. Our team is checking it to make sure
              it is ready for space seekers. You will be notified as soon as it is approved.
            </Text>

            <View className="mt-6 flex-row items-center gap-3 self-center rounded-md border border-green-200 bg-green-50 px-4 py-3">
              <CalendarClock size={20} color="#15803d" />
              <Text className="text-xs text-gray-700">
                This usually takes <Text className="text-green-700">24 to 48 hours</Text>
              </Text>
            </View>

            <View className="mt-8 flex-row justify-center gap-3">
              <Button variant="outline" size="sm" onPress={() => router.replace('/host/spaces')}>
                View my Listing
              </Button>
              <Button size="sm" onPress={() => router.replace('/host')}>
                Go to Dashboard
              </Button>
            </View>

            <Text className="mt-10 text-center text-xl font-medium text-gray-900">
              What happens Next?
            </Text>
            <View className="mt-5 gap-3">
              {NEXT_STEPS.map(({ icon: Icon, text }) => (
                <View key={text} className="items-center gap-3 rounded-md bg-gray-50 px-6 py-6">
                  <View className="size-9 items-center justify-center rounded-full bg-green-100">
                    <Icon size={18} color="#15803d" />
                  </View>
                  <Text className="text-center text-sm text-gray-800">{text}</Text>
                </View>
              ))}
            </View>

            <View className="mt-6 gap-4 rounded-md bg-green-50 p-4">
              <View className="flex-row items-start gap-3">
                <BellRing size={20} color="#15803d" />
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-900">
                    Need immediate assistance?
                  </Text>
                  <Text className="text-xs text-gray-600">
                    Our support team is here to help you with any questions.
                  </Text>
                </View>
              </View>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => Linking.openURL(WHATSAPP_URL)}
                  className="flex-row items-center gap-1.5 rounded-md bg-primary-light px-3 py-2"
                >
                  <Text className="text-xs text-primary">Chat with us</Text>
                  <MessageCircle size={14} color={COLORS.primary} />
                </Pressable>
                <Pressable
                  onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE.replace(/ /g, '')}`)}
                  className="flex-row items-center gap-1.5 rounded-md bg-primary-light px-3 py-2"
                >
                  <Text className="text-xs text-primary">Call Support</Text>
                  <Phone size={14} color={COLORS.primary} />
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
