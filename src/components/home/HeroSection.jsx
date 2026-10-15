import { ImageBackground, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import HeroSearchForm from './HeroSearchForm'

export default function HeroSection() {
  return (
    <ImageBackground
      source={require('../../../assets/images/hero.jpg')}
      resizeMode="cover"
      className="overflow-hidden bg-gray-800"
    >
      {/* Dark overlay so the white text is readable on any photo */}
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />

      <View className="px-4 pb-8 pt-10">
        <Text className="text-center text-2xl font-bold leading-tight text-white">
          Book the right space for the work in front of you.
        </Text>
        <Text className="mt-3 text-center text-sm text-gray-200">
          Discover, compare, and instantly book vetted workspaces, meeting rooms, and creative
          studios by the hour or day.
        </Text>

        <View className="mt-6">
          <HeroSearchForm />
        </View>
      </View>
    </ImageBackground>
  )
}
