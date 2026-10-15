import { Tabs } from 'expo-router'
import { CalendarDays, House, Landmark, LayoutGrid } from 'lucide-react-native'
import { COLORS } from '@/utils/colors'

// The host's bottom tabs, like the web's phone tab bar (components/host/HostMobileTabBar.jsx):
// the first three sections, plus "More" for Earnings, Settings and Log out
export default function HostTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <House size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color }) => <CalendarDays size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="spaces"
        options={{
          title: 'My Space',
          tabBarIcon: ({ color }) => <Landmark size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => <LayoutGrid size={20} color={color} />,
        }}
      />
    </Tabs>
  )
}
