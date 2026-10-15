import AccountSettings from '@/components/account/AccountSettings'
import SignInPrompt from '@/components/auth/SignInPrompt'
import AppScreen from '@/components/layout/AppScreen'
import Button from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

// "My profile": name, phone, photo and password (the web's ProfilePage).
// Changed for mobile: Log out is here too (on the web it's in the header menu).
export default function ProfileScreen() {
  const { user, logout } = useAuth()
  if (!user) {
    return <SignInPrompt title="Profile" text="Log in or create an account to book spaces." />
  }
  return (
    <AppScreen showBack={false}>
      <AccountSettings title="My profile" />
      <Button variant="outline" onPress={logout} className="mt-8 self-stretch">
        Log out
      </Button>
    </AppScreen>
  )
}
