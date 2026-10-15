import { Text, View } from 'react-native'
import { Image } from 'expo-image'

// The user's profile photo, or their initials if they haven't added one.
// size: the box size in pixels (the web uses classes like size-9 = 36px)
export default function UserAvatar({ user, size = 36 }) {
  const box = { width: size, height: size, borderRadius: size / 2 }
  if (user?.avatar?.url) {
    return <Image source={user.avatar.url} style={box} contentFit="cover" />
  }
  const initials = (user?.name ?? '?')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <View style={box} className="items-center justify-center bg-accent">
      <Text style={{ fontSize: Math.max(9, size * 0.33) }} className="font-semibold text-white">
        {initials}
      </Text>
    </View>
  )
}
