import { Text, View } from 'react-native'
import Svg, { Rect } from 'react-native-svg'

// The SpaceShare logo: two overlapping squares + the name.
// Swap the SVG for the real logo file from Figma when the designers export it.
// large: the bigger version.
export default function Logo({ showName = true, large = false }) {
  const iconSize = large ? 44 : 28
  return (
    <View
      accessible
      accessibilityLabel="SpaceShare"
      className={`flex-row items-center ${large ? 'gap-3' : 'gap-2'}`}
    >
      <Svg width={iconSize} height={iconSize} viewBox="0 0 28 28" fill="none">
        <Rect x="2" y="2" width="16" height="16" rx="3" stroke="#1f2937" strokeWidth="2.5" />
        <Rect x="10" y="10" width="16" height="16" rx="3" stroke="#e2692c" strokeWidth="2.5" />
      </Svg>
      {showName && (
        <Text className={`font-semibold text-gray-900 ${large ? 'text-2xl' : 'text-sm'}`}>
          SpaceShare
        </Text>
      )}
    </View>
  )
}
