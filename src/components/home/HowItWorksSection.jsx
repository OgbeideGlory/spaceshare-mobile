import { Text, View } from 'react-native'
import { Crop, KeyRound, MapPin, Receipt } from 'lucide-react-native'
import { COLORS } from '@/utils/colors'

const STEPS = [
  { number: '01', icon: MapPin, title: 'Search', text: 'Filter by activities, location and time' },
  { number: '02', icon: Crop, title: 'Compare', text: 'Prices, photos, and real availability' },
  { number: '03', icon: Receipt, title: 'Book', text: 'Reserve instantly with secure payment' },
  { number: '04', icon: KeyRound, title: 'Access', text: 'Smart lock entry. No front desk.' },
]

export default function HowItWorksSection() {
  return (
    <View className="gap-8 bg-blush px-4 py-12">
      <View>
        <Text className="text-center text-2xl font-bold text-gray-800">How it</Text>
        <Text className="text-center text-3xl font-bold text-primary">works</Text>
        <Text className="mt-3 text-center text-sm text-gray-500">
          Go from search to space in just a few steps
        </Text>
      </View>

      <View className="gap-4">
        {STEPS.map(({ number, icon: Icon, title, text }) => (
          <View
            key={number}
            className="flex-row items-center justify-between gap-4 rounded-xl border border-primary/15 bg-primary-light/40 p-5"
          >
            <View className="flex-1">
              <View className="size-9 items-center justify-center rounded-lg bg-white/70">
                <Icon size={18} color={COLORS.primary} />
              </View>
              <Text className="mt-3 text-base font-semibold text-gray-900">{title}</Text>
              <Text className="mt-1 text-sm text-gray-500">{text}</Text>
            </View>
            <Text className="text-4xl font-semibold text-primary" accessible={false}>
              {number}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}
