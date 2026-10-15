import { Text, View } from 'react-native'
import ChangePasswordForm from './ChangePasswordForm'
import ProfileForm from './ProfileForm'

// Profile + password, used on the host's "Profile & Settings" and the seeker's "My profile"
export default function AccountSettings({ title }) {
  return (
    <>
      <Text className="text-2xl font-semibold text-gray-900">{title}</Text>
      <View className="mt-8 gap-6">
        <View className="rounded-xl border border-gray-200 p-5">
          <Text className="mb-5 text-base font-medium text-gray-900">Profile</Text>
          <ProfileForm />
        </View>
        <View className="rounded-xl border border-gray-200 p-5">
          <Text className="mb-5 text-base font-medium text-gray-900">Password</Text>
          <ChangePasswordForm />
        </View>
      </View>
    </>
  )
}
