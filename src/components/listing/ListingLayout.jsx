import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeft, Menu, X } from 'lucide-react-native'
import Logo from '@/components/layout/Logo'
import { CATEGORY_LINKS } from '@/components/layout/siteLinks'
import { useAuth } from '@/hooks/useAuth'
import { COLORS } from '@/utils/colors'
import ListingStatusPanel from './ListingStatusPanel'

const MENU_LINKS = [...CATEGORY_LINKS, { label: 'Host dashboard', href: '/host' }]

// Screen frame for "List your space" (the web's phone layout): logo + menu, a back arrow,
// the step content, and the status panel at the bottom.
// scrollRef: lets the screen scroll back to the top when the step changes.
export default function ListingLayout({ percent, onBack, scrollRef, children }) {
  const { logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="z-10 flex-row items-center justify-between px-5 py-5">
        <Logo />
        <Pressable
          onPress={() => setMenuOpen(!menuOpen)}
          hitSlop={8}
          accessibilityLabel={menuOpen ? 'Close menu' : 'Open menu'}
          accessibilityState={{ expanded: menuOpen }}
          className="rounded-md bg-primary-light/50 p-1"
        >
          {menuOpen ? (
            <X size={24} color={COLORS.primary} />
          ) : (
            <Menu size={24} color={COLORS.primary} />
          )}
        </Pressable>

        {/* Phone menu (the "Centre Nav" frame in Figma) */}
        {menuOpen && (
          <View className="absolute right-5 top-16 w-44 rounded-md bg-white px-4 py-2 shadow-lg">
            {MENU_LINKS.map((link, i) => (
              <Pressable
                key={link.label}
                onPress={() => {
                  setMenuOpen(false)
                  router.push(link.href)
                }}
                className={`py-2.5 ${i > 0 ? 'border-t border-gray-200' : ''}`}
              >
                <Text className="text-sm text-gray-900">{link.label}</Text>
              </Pressable>
            ))}
            <Pressable onPress={logout} className="border-t border-gray-200 py-2.5">
              <Text className="text-sm font-medium text-gray-900">Log out</Text>
            </Pressable>
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="px-5 pb-12"
        >
          <Pressable
            onPress={onBack}
            hitSlop={10}
            accessibilityLabel="Go back"
            className="mb-6 self-start"
          >
            <ArrowLeft size={22} color={COLORS.gray900} />
          </Pressable>
          {children}
          <View className="mt-12">
            <ListingStatusPanel percent={percent} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
