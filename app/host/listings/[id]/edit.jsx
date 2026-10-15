import { useState } from 'react'
import { Pressable, Switch, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Image } from 'expo-image'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Toast from 'react-native-toast-message'
import { ArrowLeft, ImagePlus, MapPin, Trash2 } from 'lucide-react-native'
import { removeWorkspaceImage, updateWorkspace, uploadWorkspaceImages } from '@/api/workspaces'
import HostScreen from '@/components/host/HostScreen'
import { checkPhotos } from '@/components/listing/checkPhotos'
import ChipToggleGroup from '@/components/listing/ChipToggleGroup'
import {
  ACTIVITIES,
  AMENITIES,
  CATEGORIES,
  EQUIPMENT,
  MAX_PHOTOS,
} from '@/components/listing/listingOptions'
import { areaFor } from '@/components/listing/listingSchema'
import SectionLabel from '@/components/listing/SectionLabel'
import SelectableRow from '@/components/listing/SelectableRow'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormError from '@/components/ui/FormError'
import FormNumberField from '@/components/ui/FormNumberField'
import FormTextField from '@/components/ui/FormTextField'
import SelectField from '@/components/ui/SelectField'
import Spinner from '@/components/ui/Spinner'
import StatusBadge from '@/components/ui/StatusBadge'
import TextareaField from '@/components/ui/TextareaField'
import { sizedImage } from '@/components/workspace/imageUrl'
import { useMyListings } from '@/hooks/useMyListings'
import { COLORS } from '@/utils/colors'
import { AREAS, CITIES, CITY_STATES } from '@/utils/constants'
import { findCoordinates } from '@/utils/geocode'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { pickPhotos } from '@/utils/photoPicker'

const editSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(150),
  type: z.string().min(1, 'Choose a category'),
  description: z.string().trim().min(20, 'Describe your space in at least 20 characters').max(2000),
  capacity: z.number({ error: 'Enter a number' }).int().min(1, 'At least 1 person'),
  pricingAmount: z.number({ error: 'Enter your rate' }).min(0),
  pricingUnit: z.enum(['hour', 'day']),
  address: z.string().trim().min(5, 'Enter the street address').max(300),
  city: z.string().min(1),
  neighborhood: z.string(),
  activities: z.array(z.string()).min(1, 'Pick at least one activity'),
  bookingMode: z.enum(['instant', 'request']),
  amenities: z.array(z.string()),
  isAvailable: z.boolean(),
})

const AMENITY_OPTIONS = [...AMENITIES, ...EQUIPMENT.map((value) => ({ value }))]

function Card({ title, hint, children }) {
  return (
    <View className="rounded-xl border border-gray-200 p-5">
      <SectionLabel title={title} hint={hint} />
      {children}
    </View>
  )
}

function BackToSpaces() {
  return (
    <Pressable
      onPress={() => router.navigate('/host/spaces')}
      className="flex-row items-center gap-2 self-start"
    >
      <ArrowLeft size={16} color={COLORS.gray700} />
      <Text className="text-sm text-gray-700">Back to My Spaces</Text>
    </Pressable>
  )
}

// Edit listing (the web has no Figma design for it either: same style as "List your space")
export default function EditListingScreen() {
  const { id } = useLocalSearchParams()
  const { listings, isLoading } = useMyListings()
  const listing = listings.find((l) => l._id === id)

  if (isLoading) {
    return (
      <HostScreen>
        <Spinner label="Loading listing…" />
      </HostScreen>
    )
  }
  if (!listing) {
    return (
      <HostScreen>
        <View className="items-center rounded-xl bg-gray-50 p-10">
          <Text className="text-lg font-semibold text-gray-900">
            We can&apos;t find this listing
          </Text>
          <Text className="mt-2 text-sm text-gray-600">It may have been deleted.</Text>
          <View className="mt-6">
            <BackToSpaces />
          </View>
        </View>
      </HostScreen>
    )
  }
  // key: start the form fresh if the listing changes
  return <EditListingForm key={listing._id} listing={listing} />
}

// Shown above the form when the listing came back from review or is suspended
function ReviewNotice({ listing }) {
  if (!['changes_requested', 'rejected', 'suspended'].includes(listing.status)) return null
  const message =
    listing.status === 'changes_requested'
      ? listing.requestedChanges
      : listing.status === 'rejected'
        ? listing.rejectionReason
        : listing.suspensionReason
  return (
    <View className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <Text className="text-sm font-medium text-amber-900">
        {listing.status === 'changes_requested'
          ? 'Our team asked for changes'
          : listing.status === 'rejected'
            ? 'This listing wasn’t approved'
            : 'This listing is suspended'}
      </Text>
      {Boolean(message) && <Text className="mt-1 text-sm text-amber-900">{message}</Text>}
      {listing.status !== 'suspended' && (
        <Text className="mt-2 text-xs text-amber-900">
          Make the changes below and save. Your listing goes back to our team for review.
        </Text>
      )}
    </View>
  )
}

function EditListingForm({ listing }) {
  const queryClient = useQueryClient()
  // The photos come from the listing itself, so they always match what the server has
  const images = listing.images ?? []
  const [formError, setFormError] = useState('')
  const [photoError, setPhotoError] = useState('')
  // A photo change waiting for the host to confirm it: { add: [photos] } or { removePublicId }
  const [pendingPhotoChange, setPendingPhotoChange] = useState(null)
  // Photos can be changed unless the listing is suspended. Changing them on a live listing
  // sends it back to review (the API does this), so we warn the host first.
  const canEditPhotos = listing.status !== 'suspended'
  const isApproved = listing.status === 'approved'

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: listing.name ?? '',
      type: listing.type ?? '',
      description: listing.description ?? '',
      capacity: listing.capacity ?? 1,
      pricingAmount: listing.pricing?.amount,
      pricingUnit: listing.pricing?.unit ?? 'hour',
      address: listing.location?.address ?? '',
      city: listing.city ?? 'Lagos',
      neighborhood: listing.neighborhood ?? '',
      activities: listing.activities ?? [],
      bookingMode: listing.bookingMode ?? 'instant',
      amenities: listing.amenities ?? [],
      isAvailable: listing.isAvailable !== false,
    },
  })

  const city = useWatch({ control, name: 'city' })

  async function onSubmit(values) {
    setFormError('')
    try {
      // Only look up new map coordinates if the address changed (or the listing has none yet)
      const addressChanged =
        values.address !== listing.location?.address || values.city !== listing.city
      const hasCoordinates = listing.location?.coordinates?.length === 2
      const coordinates =
        addressChanged || !hasCoordinates
          ? await findCoordinates(values.address, values.city)
          : {
              longitude: listing.location?.coordinates?.[0],
              latitude: listing.location?.coordinates?.[1],
            }

      await updateWorkspace(listing._id, {
        name: values.name.trim(),
        type: values.type,
        description: values.description.trim(),
        capacity: values.capacity,
        pricing: { amount: values.pricingAmount, unit: values.pricingUnit },
        amenities: values.amenities,
        activities: values.activities,
        bookingMode: values.bookingMode,
        location: {
          type: 'Point',
          coordinates: [coordinates.longitude, coordinates.latitude],
          address: values.address.trim(),
        },
        city: values.city,
        neighborhood: areaFor(values.city, values.neighborhood) ?? null,
        state: CITY_STATES[values.city] ?? values.city,
        country: 'Nigeria',
        ...(isApproved && { isAvailable: values.isAvailable }),
      })
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      // The saved values become the form's new starting point, so "Save changes" turns off again
      reset(values)
      Toast.show({ type: 'success', text1: 'Listing updated' })
    } catch (error) {
      setFormError(getErrorMessage(error))
    }
  }

  // Both calls return the workspace with its photos as the server now has them
  const photoMutation = useMutation({
    mutationFn: ({ add, removePublicId }) =>
      removePublicId
        ? removeWorkspaceImage(listing._id, removePublicId)
        : uploadWorkspaceImages(listing._id, add),
    onSuccess: (updated) => {
      // Show the new photos straight away, then reload the listing (its status may have changed)
      if (updated?.images) {
        queryClient.setQueryData(['workspaces', 'mine'], (old) =>
          old?.map((w) => (w._id === listing._id ? { ...w, images: updated.images } : w)),
        )
      }
      return queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
    onError: (error) => Toast.show({ type: 'error', text1: getErrorMessage(error) }),
    onSettled: () => setPendingPhotoChange(null),
  })

  // Live listings go back to review when photos change, so ask the host first
  function changePhotos(change) {
    if (isApproved) setPendingPhotoChange(change)
    else photoMutation.mutate(change)
  }

  async function handleAddPhotos() {
    const chosen = await pickPhotos({ limit: MAX_PHOTOS - images.length })
    if (chosen.length === 0) return
    // Upload the photos that pass the checks, and say why any others were left out
    const { good, problems } = checkPhotos(chosen)
    setPhotoError(problems.join(' '))
    if (good.length) changePhotos({ add: good })
  }

  const pricingUnits = [
    { value: 'hour', label: 'Per hour' },
    { value: 'day', label: 'Per day' },
  ]

  return (
    <HostScreen>
      <BackToSpaces />
      <View className="mt-4 gap-3">
        <View>
          <Text className="text-2xl font-semibold text-gray-900">Edit listing</Text>
          <View className="mt-1 flex-row flex-wrap items-center gap-2">
            <Text className="text-sm text-gray-600">{listing.name}</Text>
            <StatusBadge status={listing.status === 'pending' ? 'inReview' : listing.status} />
          </View>
        </View>
        <Button
          variant="outline"
          size="sm"
          onPress={() =>
            router.push({
              pathname: '/host/listings/[id]/availability',
              params: { id: listing._id },
            })
          }
        >
          Manage availability
        </Button>
      </View>

      <ReviewNotice listing={listing} />

      <View className="mt-8 gap-6">
        {isApproved && (
          <Card title="Bookings" hint="Pause your space to stop new bookings without deleting it">
            <Controller
              control={control}
              name="isAvailable"
              render={({ field }) => (
                <View className="flex-row items-center justify-between gap-4 rounded-lg bg-gray-50 px-4 py-3">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900">
                      {field.value ? 'Accepting bookings' : 'Paused'}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {field.value
                        ? 'Guests can find and book this space.'
                        : 'Hidden from search; existing bookings stay.'}
                    </Text>
                  </View>
                  <Switch
                    value={field.value}
                    onValueChange={field.onChange}
                    trackColor={{ true: '#15803d', false: COLORS.gray300 }}
                    accessibilityLabel="Accepting bookings"
                  />
                </View>
              )}
            />
          </Card>
        )}

        <Card title="Basics">
          <View className="gap-5">
            <FormTextField control={control} name="name" label="Space name" />
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <View className="gap-3">
                  {CATEGORIES.map((c) => (
                    <SelectableRow
                      key={c.value}
                      title={c.label}
                      description={c.description}
                      icon={c.icon}
                      tinted
                      selected={field.value === c.value}
                      onSelect={() => field.onChange(c.value)}
                    />
                  ))}
                </View>
              )}
            />
            <Controller
              control={control}
              name="description"
              render={({ field, fieldState }) => (
                <TextareaField
                  label="Description"
                  numberOfLines={4}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />
          </View>
        </Card>

        <Card title="Activities" hint="Seekers search by activities">
          <Controller
            control={control}
            name="activities"
            render={({ field }) => (
              <ChipToggleGroup
                label="Activities"
                options={ACTIVITIES}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.activities && (
            <Text className="mt-2 text-xs text-red-600">{errors.activities.message}</Text>
          )}
        </Card>

        <Card title="Location">
          <View className="gap-3">
            <FormTextField
              control={control}
              name="address"
              icon={MapPin}
              accessibilityLabel="Street address"
            />
            <Controller
              control={control}
              name="city"
              render={({ field }) => (
                <SelectField
                  accessibilityLabel="City"
                  options={CITIES.map((c) => ({ value: c, label: c }))}
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value)
                    setValue('neighborhood', '', { shouldDirty: true })
                  }}
                />
              )}
            />
            <Controller
              control={control}
              name="neighborhood"
              render={({ field }) => (
                <SelectField
                  accessibilityLabel="Area"
                  options={[
                    { value: '', label: 'Area (optional)' },
                    ...(AREAS[city] ?? []).map((area) => ({ value: area, label: area })),
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </View>
        </Card>

        <Card title="How should bookings work?">
          <Controller
            control={control}
            name="bookingMode"
            render={({ field }) => (
              <View className="gap-3">
                <SelectableRow
                  title="Instant Booking"
                  description="Seekers book open slot straight away"
                  selected={field.value === 'instant'}
                  onSelect={() => field.onChange('instant')}
                />
                <SelectableRow
                  title="Approve each request"
                  description="You approve every booking before it is confirmed"
                  selected={field.value === 'request'}
                  onSelect={() => field.onChange('request')}
                />
              </View>
            )}
          />
        </Card>

        <Card title="Capacity and price">
          <View className="gap-4">
            <FormNumberField control={control} name="capacity" label="People, maximum" />
            <FormNumberField control={control} name="pricingAmount" label="Rate (₦)" />
            <Controller
              control={control}
              name="pricingUnit"
              render={({ field }) => (
                <SelectField
                  label="Charged"
                  options={pricingUnits}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </View>
        </Card>

        <Card title="Amenities and equipment">
          <Controller
            control={control}
            name="amenities"
            render={({ field }) => (
              <ChipToggleGroup
                label="Amenities"
                options={AMENITY_OPTIONS}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </Card>

        <FormError message={formError} />
        <View className="items-end">
          <Button
            onPress={handleSubmit(onSubmit, () =>
              // A field failed validation: say so, in case it's one without its own message on screen
              setFormError('Some details need fixing. Check the fields above.'),
            )}
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
        </View>
      </View>

      <View className="mt-10 rounded-xl border border-gray-200 p-5">
        <SectionLabel
          title="Photos"
          hint={
            canEditPhotos
              ? `Up to ${MAX_PHOTOS} photos. The first one is the cover.${isApproved ? ' Changing photos sends the listing back for review.' : ''}`
              : 'Photos can’t be changed while a listing is suspended.'
          }
        />
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {images.map((image, index) => (
            <View
              key={image.publicId ?? image.url}
              style={{ width: '48%', aspectRatio: 4 / 3 }}
              className="overflow-hidden rounded-lg bg-gray-200"
            >
              <Image
                source={sizedImage(image.url, 600)}
                accessibilityLabel={`Photo ${index + 1}`}
                contentFit="cover"
                style={{ width: '100%', height: '100%' }}
              />
              {index === 0 && (
                <Text className="absolute bottom-2 left-2 rounded-full bg-white px-2 py-0.5 text-xs">
                  Cover
                </Text>
              )}
              {canEditPhotos && Boolean(image.publicId) && (
                <Pressable
                  onPress={() => changePhotos({ removePublicId: image.publicId })}
                  disabled={photoMutation.isPending}
                  accessibilityLabel={`Remove photo ${index + 1}`}
                  className="absolute right-2 top-2 size-7 items-center justify-center rounded-full bg-white/90"
                >
                  <Trash2 size={14} color={COLORS.gray900} />
                </Pressable>
              )}
            </View>
          ))}
          {canEditPhotos && images.length < MAX_PHOTOS && (
            <Pressable
              onPress={handleAddPhotos}
              disabled={photoMutation.isPending}
              style={{ width: '48%', aspectRatio: 4 / 3 }}
              className={`items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 ${photoMutation.isPending ? 'opacity-60' : ''}`}
            >
              <ImagePlus size={22} color={COLORS.gray500} />
              <Text className="text-sm text-gray-500">
                {photoMutation.isPending ? 'Saving photos…' : 'Add photos'}
              </Text>
            </Pressable>
          )}
        </View>
        {Boolean(photoError) && <Text className="mt-3 text-sm text-red-600">{photoError}</Text>}
      </View>

      <ConfirmDialog
        open={Boolean(pendingPhotoChange)}
        title="Send your listing back for review?"
        confirmLabel={pendingPhotoChange?.add ? 'Upload photos' : 'Remove photo'}
        cancelLabel="Go back"
        isWorking={photoMutation.isPending}
        onConfirm={() => photoMutation.mutate(pendingPhotoChange)}
        onClose={() => setPendingPhotoChange(null)}
      >
        Changing photos sends your live listing back to our team for review. It stays hidden from
        search until it&apos;s approved again.
      </ConfirmDialog>
    </HostScreen>
  )
}
