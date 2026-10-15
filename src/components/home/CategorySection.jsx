import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Image } from 'expo-image'
import { ArrowRight, CircleCheck } from 'lucide-react-native'
import { COLORS } from '@/utils/colors'
import { CATEGORY_TYPES } from '@/utils/searchLinks'

const CATEGORIES = [
  {
    title: 'Work Spaces',
    description: 'Best for solo focus days, hybrid teams, quiet private offices',
    features: ['Ergonomic desks', 'Enterprise Wi-Fi', 'Coffee bar access'],
    image: require('../../../assets/images/category-workspace.jpg'),
    type: CATEGORY_TYPES.work,
    cardColour: 'bg-mint',
    checkColour: COLORS.green600,
  },
  {
    title: 'Meeting Spaces',
    description: 'Best for client pitches, team sprint offsites, board meetings',
    features: ['4K displays', 'Whiteboards', 'Video conferencing hardware'],
    image: require('../../../assets/images/category-meeting.jpg'),
    type: CATEGORY_TYPES.meeting,
    cardColour: 'bg-cream',
    checkColour: COLORS.primary,
  },
  {
    title: 'Content & Creative Studios',
    description: 'Best for podcasts, photography, video shoots, product staging',
    features: ['Soundproofing', 'Lighting grids', 'Audio interface, backdrops'],
    image: require('../../../assets/images/category-studio.jpg'),
    type: CATEGORY_TYPES.creative,
    cardColour: 'bg-lavender',
    checkColour: '#6366f1', // indigo-500
  },
]

export default function CategorySection() {
  return (
    <View className="px-4 py-12">
      <Text className="text-center text-2xl font-bold text-gray-800">
        Explore by <Text className="text-3xl text-primary">category</Text>
      </Text>
      <Text className="mt-2 text-center text-sm text-gray-500">
        Spaces designed for your goals. Whether you are working, meeting or creating.
      </Text>

      <View className="mt-10 gap-8">
        {CATEGORIES.map((category) => (
          <View key={category.title}>
            <Image
              source={category.image}
              contentFit="cover"
              accessibilityLabel={category.title}
              style={{ height: 176, borderRadius: 16, backgroundColor: COLORS.gray300 }}
            />
            {/* The text card overlaps the bottom of the photo */}
            <View className={`mx-3 -mt-12 rounded-xl p-5 shadow-sm ${category.cardColour}`}>
              <Text className="text-base font-semibold text-gray-900">{category.title}</Text>
              <Text className="mt-2 text-sm text-gray-500">{category.description}</Text>
              <View className="mt-3 gap-2">
                {category.features.map((feature) => (
                  <View key={feature} className="flex-row items-center gap-2">
                    <CircleCheck size={16} color={category.checkColour} />
                    <Text className="text-sm text-gray-700">{feature}</Text>
                  </View>
                ))}
              </View>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/search', params: { type: category.type } })
                }
                accessibilityRole="link"
                className="mt-5 flex-row items-center justify-center gap-1"
              >
                <Text className="text-sm font-medium text-primary">Book a space</Text>
                <ArrowRight size={14} color={COLORS.primary} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}
