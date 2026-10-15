import { Text, View } from 'react-native'
import { CalendarCheck, LockKeyhole, Receipt, ShieldCheck } from 'lucide-react-native'
import { COLORS } from '@/utils/colors'

const ITEMS = [
  { icon: ShieldCheck, title: 'Verified Host', text: 'Every space is checked before it goes live' },
  {
    icon: Receipt,
    title: 'Clear Pricing',
    text: 'See the full payment upfront. No hidden charges',
  },
  {
    icon: CalendarCheck,
    title: 'Real Availability',
    text: 'Live calendar shows free spaces right now',
  },
  {
    icon: LockKeyhole,
    title: 'Secure Payments',
    text: 'Pay securely and safely inside SpaceShare',
  },
]

export default function TrustStrip() {
  return (
    <View className="flex-row flex-wrap justify-between gap-y-3 bg-cream px-4 py-6">
      {ITEMS.map(({ icon: Icon, title, text }) => (
        <View key={title} className="w-[48.5%] flex-row items-start gap-3 rounded-lg bg-white p-3">
          <View className="size-8 items-center justify-center rounded-full bg-primary-light">
            <Icon size={18} color={COLORS.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-gray-900">{title}</Text>
            <Text className="mt-0.5 text-xs text-gray-600">{text}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}
