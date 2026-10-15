import { Text, View } from 'react-native'
import { Copyright } from 'lucide-react-native'
import { COLORS } from '@/utils/colors'
import Logo from './Logo'

// TODO: these pages don't exist on the website yet either; link them when they do
const FOOTER_LINKS = ['About', 'Contact', 'Help', 'Terms', 'Privacy']

const CURRENT_YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <View className="bg-white">
      <View className="items-center gap-6 px-4 py-10">
        <Logo />
        <View className="flex-row flex-wrap justify-center gap-x-8 gap-y-3">
          {FOOTER_LINKS.map((label) => (
            <Text key={label} className="text-sm text-gray-700">
              {label}
            </Text>
          ))}
        </View>
      </View>
      <View className="flex-row items-center justify-center gap-2 border-t border-gray-200 py-5">
        <Copyright size={16} color={COLORS.gray600} />
        <Text className="text-sm text-gray-600">
          {CURRENT_YEAR} SpaceShare. All rights reserved
        </Text>
      </View>
    </View>
  )
}
