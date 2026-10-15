import AccountSettings from '@/components/account/AccountSettings'
import HostScreen from '@/components/host/HostScreen'

// "Profile & Settings" for hosts (the same forms as the seeker's profile)
export default function HostSettingsScreen() {
  return (
    <HostScreen>
      <AccountSettings title="Profile & Settings" />
    </HostScreen>
  )
}
