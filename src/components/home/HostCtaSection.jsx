import { ImageBackground, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { BlurView } from 'expo-blur'
import { ArrowRight, MessageCircle } from 'lucide-react-native'
import { LIST_SPACE_LINK } from '@/components/layout/siteLinks'
import Button from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { COLORS } from '@/utils/colors'
import { ROLES, WHATSAPP_URL } from '@/utils/constants'

export default function HostCtaSection() {
  const { user } = useAuth()

  // This banner invites people to become hosts, so signed-in seekers don't see it
  if (user?.role === ROLES.CUSTOMER) return null

  return (
    <ImageBackground
      source={require('../../../assets/images/hero.jpg')}
      resizeMode="cover"
      className="overflow-hidden bg-accent"
    >
      <View className="absolute inset-0 bg-accent/70" />

      <View className="px-4 py-12">
        {/* The blurred glass card (the web's bg-white/5 backdrop-blur-sm) */}
        <View className="items-center overflow-hidden rounded-2xl bg-white/5 px-6 py-8">
          <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
          <Text className="text-center text-xl font-bold text-white">
            Have an unused space? Earn from it.
          </Text>
          <Text className="mt-3 text-center text-sm text-gray-200">
            Let our professional team handle the heavy lifting while you focus on settling into your
            new space.
          </Text>
          <Button
            icon={ArrowRight}
            onPress={() => router.push(LIST_SPACE_LINK)}
            className="mt-6 self-center"
          >
            List Your Space
          </Button>
          <Pressable
            onPress={() => Linking.openURL(WHATSAPP_URL)}
            accessibilityRole="link"
            className="mt-4 flex-row items-center gap-2 border-b border-white pb-1"
          >
            <Text className="text-sm font-medium text-white">Chat on WhatsApp</Text>
            <MessageCircle size={18} color={COLORS.green400} />
          </Pressable>
        </View>
      </View>
    </ImageBackground>
  )
}
