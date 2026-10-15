import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Menu, X } from 'lucide-react-native'
import Button from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { COLORS } from '@/utils/colors'
import { ROLES } from '@/utils/constants'
import Logo from './Logo'
import { CATEGORY_LINKS, LIST_SPACE_LINK } from './siteLinks'

// The home page's top bar (the phone layout of the web's Navbar):
// logo, "Explore spaces", and a menu button that opens the links underneath.
export default function Navbar() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  // Links that change depending on whether someone is logged in (hosts don't see this page)
  const accountLinks = user
    ? [{ label: 'My bookings', href: '/bookings' }]
    : [
        { label: 'Login', href: '/login' },
        { label: 'Sign Up', href: '/register' },
      ]
  const links = [...CATEGORY_LINKS, ...accountLinks]

  function go(href) {
    setMenuOpen(false)
    router.push(href)
  }

  return (
    <View className="border-b border-gray-100 bg-white">
      <View className="flex-row items-center justify-between gap-4 px-4 py-3">
        <Logo />
        <View className="flex-row items-center gap-3">
          <Button size="sm" onPress={() => router.push('/search')}>
            Explore spaces
          </Button>
          <Pressable
            onPress={() => setMenuOpen(!menuOpen)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={menuOpen ? 'Close menu' : 'Open menu'}
            accessibilityState={{ expanded: menuOpen }}
          >
            {menuOpen ? (
              <X size={26} color={COLORS.primary} />
            ) : (
              <Menu size={26} color={COLORS.primary} />
            )}
          </Pressable>
        </View>
      </View>

      {menuOpen && (
        <View className="border-t border-gray-100 px-4 py-2">
          {links.map((link) => (
            <Pressable key={link.label} onPress={() => go(link.href)} className="py-3">
              <Text className="text-base text-gray-700">{link.label}</Text>
            </Pressable>
          ))}
          {/* "List your spaces" is for visitors (they sign up as a host). Seekers never see it. */}
          {user?.role !== ROLES.CUSTOMER && (
            <Pressable onPress={() => go(LIST_SPACE_LINK)} className="py-3">
              <Text className="text-base font-medium text-primary">List your spaces</Text>
            </Pressable>
          )}
          {user && (
            <Pressable
              onPress={() => {
                setMenuOpen(false)
                logout()
              }}
              className="py-3"
            >
              <Text className="text-base text-gray-700">Log out</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  )
}
