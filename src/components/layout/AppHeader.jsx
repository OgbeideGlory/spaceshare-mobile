import { useState } from 'react'
import { Linking, Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { ArrowLeft, Menu, X } from 'lucide-react-native'
import UserAvatar from '@/components/ui/UserAvatar'
import { useAuth } from '@/hooks/useAuth'
import { COLORS } from '@/utils/colors'
import { ROLES, WHATSAPP_URL } from '@/utils/constants'
import Logo from './Logo'
import { CATEGORY_LINKS, LIST_SPACE_LINK } from './siteLinks'

// The phone menu for visitors (the "Centre Nav" frame in Figma)
const GUEST_LINKS = [
  ...CATEGORY_LINKS,
  { label: 'List a Space', href: LIST_SPACE_LINK },
  { label: 'Help', url: WHATSAPP_URL, bold: true },
  { label: 'Log In', href: '/login', bold: true },
  { label: 'Sign Up', href: '/register', bold: true, primary: true },
]

// Signed-in people: their own pages (they're also in the tabs)
const CUSTOMER_LINKS = [
  { label: 'My bookings', href: '/bookings' },
  { label: 'Saved spaces', href: '/saved' },
  { label: 'My profile', href: '/profile' },
  { label: 'Notifications', href: '/notifications' },
]
const HOST_LINKS = [{ label: 'Host dashboard', href: '/host' }]

// Header for search, space details and checkout (the phone layout of the web's AppHeader).
// Changed for mobile: a back arrow before the logo, because phones have no browser Back button.
// showBack: false on the main tab screens (there's nothing to go back to)
export default function AppHeader({ showBack = true }) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const links = !user ? GUEST_LINKS : user.role === ROLES.HOST ? HOST_LINKS : CUSTOMER_LINKS

  function choose(link) {
    setMenuOpen(false)
    if (link.url) Linking.openURL(link.url)
    else router.push(link.href)
  }

  return (
    <View className="z-10 border-b border-gray-200 bg-white">
      <View className="flex-row items-center justify-between gap-4 px-4 py-4">
        <View className="flex-row items-center gap-3">
          {showBack && (
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={22} color={COLORS.gray800} />
            </Pressable>
          )}
          <Logo showName={!user} />
        </View>

        <Pressable
          onPress={() => setMenuOpen(!menuOpen)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={user ? 'Account menu' : menuOpen ? 'Close menu' : 'Open menu'}
          accessibilityState={{ expanded: menuOpen }}
          className={user ? '' : 'rounded-md bg-primary-light/50 p-1'}
        >
          {user ? (
            <UserAvatar user={user} size={32} />
          ) : menuOpen ? (
            <X size={24} color={COLORS.primary} />
          ) : (
            <Menu size={24} color={COLORS.primary} />
          )}
        </Pressable>
      </View>

      {menuOpen && (
        <View className="absolute right-4 top-full w-48 rounded-md bg-white px-4 py-2 shadow-lg">
          {links.map((link, i) => (
            <Pressable
              key={link.label}
              onPress={() => choose(link)}
              className={`py-2.5 ${i > 0 ? 'border-t border-gray-200' : ''}`}
            >
              <Text
                className={`text-sm ${link.bold ? 'font-medium' : ''} ${link.primary ? 'text-primary' : 'text-gray-900'}`}
              >
                {link.label}
              </Text>
            </Pressable>
          ))}
          {user && (
            <Pressable
              onPress={() => {
                setMenuOpen(false)
                logout()
              }}
              className="border-t border-gray-200 py-2.5"
            >
              <Text className="text-sm text-gray-900">Log out</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  )
}
