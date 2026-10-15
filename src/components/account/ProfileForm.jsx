import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Toast from 'react-native-toast-message'
import { BadgeCheck, Camera, Mail, Phone, User } from 'lucide-react-native'
import { updateMyProfile } from '@/api/users'
import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import FormTextField from '@/components/ui/FormTextField'
import TextField from '@/components/ui/TextField'
import UserAvatar from '@/components/ui/UserAvatar'
import { useAuth } from '@/hooks/useAuth'
import { COLORS } from '@/utils/colors'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { pickPhotos, toUploadFile } from '@/utils/photoPicker'

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{7,20}$/, 'Enter a valid phone number'),
})
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Name, phone and profile photo. Email is shown but can't be changed here.
export default function ProfileForm() {
  const { user, setUser } = useAuth()
  // A new photo the user picked: { uri, mimeType, fileSize, fileName } from expo-image-picker
  const [avatar, setAvatar] = useState(null)
  const [formError, setFormError] = useState('')

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '' },
  })

  async function pickPhoto() {
    // square: lets them crop it square first
    const [photo] = await pickPhotos({ limit: 1, square: true })
    if (!photo) return
    if (photo.mimeType && !AVATAR_TYPES.includes(photo.mimeType)) {
      return setFormError('Use a JPG, PNG or WEBP image.')
    }
    if (photo.fileSize > 5 * 1024 * 1024) return setFormError('The photo must be 5 MB or smaller.')
    setFormError('')
    setAvatar(photo)
  }

  async function onSubmit({ name, phone }) {
    setFormError('')
    try {
      // With a new photo, the API needs a multipart form; otherwise plain JSON is fine.
      let body = { name, phone }
      if (avatar) {
        body = new FormData()
        body.append('name', name)
        body.append('phone', phone)
        body.append('avatar', toUploadFile(avatar, 'avatar.jpg'))
      }
      const updated = await updateMyProfile(body)
      setUser({ ...user, ...updated })
      setAvatar(null)
      Toast.show({ type: 'success', text1: 'Profile updated' })
    } catch (error) {
      setFormError(getErrorMessage(error))
    }
  }

  return (
    <View className="gap-5">
      <View className="flex-row items-center gap-4">
        {avatar ? (
          <Image
            source={avatar.uri}
            accessibilityLabel="New profile photo"
            contentFit="cover"
            style={{ width: 64, height: 64, borderRadius: 32 }}
          />
        ) : (
          <UserAvatar user={user} size={64} />
        )}
        <Pressable
          onPress={pickPhoto}
          accessibilityRole="button"
          className="flex-row items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 active:bg-gray-50"
        >
          <Camera size={16} color={COLORS.gray900} />
          <Text className="text-sm text-gray-900">Change photo</Text>
        </Pressable>
      </View>

      <FormTextField
        control={control}
        name="name"
        label="Full name"
        icon={User}
        autoComplete="name"
        autoCapitalize="words"
      />
      <FormTextField
        control={control}
        name="phone"
        label="Phone number"
        icon={Phone}
        type="tel"
        autoComplete="tel"
      />
      <View>
        <TextField label="Email address" icon={Mail} value={user?.email ?? ''} editable={false} />
        {user?.emailVerified === false ? (
          <Text className="mt-1 text-xs text-amber-700">Not verified.</Text>
        ) : user?.emailVerified ? (
          <View className="mt-1 flex-row items-center gap-1">
            <BadgeCheck size={14} color="#15803d" />
            <Text className="text-xs text-green-700">Verified</Text>
          </View>
        ) : null}
      </View>

      <FormError message={formError} />
      <Button onPress={handleSubmit(onSubmit)} disabled={isSubmitting || (!isDirty && !avatar)}>
        {isSubmitting ? 'Saving…' : 'Save changes'}
      </Button>
    </View>
  )
}
