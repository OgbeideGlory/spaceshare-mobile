import { useEffect, useRef, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react-native'
import ListingLayout from '@/components/listing/ListingLayout'
import { defaultListingValues, listingSchema, STEPS } from '@/components/listing/listingSchema'
import ListingStepper from '@/components/listing/ListingStepper'
import PublishSuccessModal from '@/components/listing/PublishSuccessModal'
import BasicsStep from '@/components/listing/steps/BasicsStep'
import DetailsStep from '@/components/listing/steps/DetailsStep'
import PhotosStep from '@/components/listing/steps/PhotosStep'
import PricingStep from '@/components/listing/steps/PricingStep'
import ReviewStep from '@/components/listing/steps/ReviewStep'
import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import Spinner from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'
import { usePublishListing } from '@/hooks/usePublishListing'
import { COLORS } from '@/utils/colors'
import { forget, loadSaved, save } from '@/utils/draftStorage'

// The form (except photos) is saved on the phone as the host types,
// so closing the app doesn't lose their work. Each user gets their own draft.
// How far publishing got is saved too (under draftKey + ':progress'), so pressing Publish
// again carries on instead of creating the listing a second time.
const draftKeyFor = (user) => `spaceshare:listing-draft:${user?._id ?? 'guest'}`

// "% Complete" in the status panel, as in the Figma design
const PROGRESS = [10, 20, 40, 60, 100]

// "List your space". Reading the saved draft takes a moment on phones, so wait for it first.
export default function CreateListingScreen() {
  const { user } = useAuth()
  const draftKey = draftKeyFor(user)
  const [saved, setSaved] = useState(null) // { draft, progress } once loaded

  useEffect(() => {
    let cancelled = false
    Promise.all([loadSaved(draftKey), loadSaved(`${draftKey}:progress`)]).then(
      ([draft, progress]) => {
        if (!cancelled) setSaved({ draft, progress })
      },
    )
    return () => {
      cancelled = true
    }
  }, [draftKey])

  if (!saved) {
    return (
      <ListingLayout percent={PROGRESS[0]} onBack={() => router.back()}>
        <Spinner label="Loading your listing…" />
      </ListingLayout>
    )
  }
  return <CreateListingForm draftKey={draftKey} saved={saved} />
}

function CreateListingForm({ draftKey, saved }) {
  const progressKey = `${draftKey}:progress`
  const scrollRef = useRef(null)
  // How far an earlier publish got before the app was closed (null if it never started)
  const savedProgress = saved.progress
  // A listing that was already created goes straight to the Review step to finish publishing
  const [stepIndex, setStepIndex] = useState(savedProgress?.workspace ? STEPS.length - 1 : 0)
  const [photos, setPhotos] = useState([]) // picked photos; photos[0] is the cover
  const [photoError, setPhotoError] = useState('')
  const [formError, setFormError] = useState('')
  const [published, setPublished] = useState(null)
  const {
    publish,
    isPublishing,
    progress,
    error: publishError,
    isCreated,
    photosUploaded,
  } = usePublishListing({
    savedProgress,
    onSaveProgress: (done) => save(progressKey, done),
  })

  const form = useForm({
    resolver: zodResolver(listingSchema),
    // Re-check each field as the host changes it, so an error disappears once it's fixed.
    // (By default the form only re-checks after a full submit, which only happens at Publish.)
    mode: 'onChange',
    defaultValues: saved.draft
      ? { ...defaultListingValues, ...saved.draft, agreedToTerms: false }
      : defaultListingValues,
  })

  // Save the draft whenever a value changes
  useEffect(() => {
    return form.subscribe({
      formState: { values: true },
      callback: ({ values }) => save(draftKey, values),
    })
  }, [form, draftKey])

  const isLastStep = stepIndex === STEPS.length - 1
  const step = STEPS[stepIndex]

  // Photos are still needed unless they were uploaded already
  const needsPhotos = photos.length === 0 && !photosUploaded

  // Once the listing is created, its details have been sent and can't be changed here.
  // Only the photos can still be fixed, until they're uploaded.
  const canEditStep = (index) => !isCreated || (STEPS[index].label === 'Photos' && !photosUploaded)

  function goToStep(index) {
    setStepIndex(index)
    scrollRef.current?.scrollTo({ y: 0, animated: true })
  }

  async function handleContinue() {
    setFormError('')
    // Check only this step's fields before moving on
    const isValid = await form.trigger(step.fields)

    if (step.label === 'Photos' && needsPhotos) {
      setPhotoError('Add at least one photo. The first one becomes your cover.')
      return
    }
    if (!isValid) return

    if (isLastStep) {
      // e.g. the app was closed, which loses the picked photos
      if (needsPhotos) {
        setPhotoError('Add at least one photo. The first one becomes your cover.')
        goToStep(STEPS.findIndex((s) => s.label === 'Photos'))
        return
      }
      await form.handleSubmit(handlePublish, handleInvalid)()
    } else if (isCreated) {
      // The later steps can't be changed any more, so go back to Review
      goToStep(STEPS.length - 1)
    } else {
      goToStep(stepIndex + 1)
    }
  }

  async function handlePublish(values) {
    const workspace = await publish(values, photos)
    if (workspace) {
      forget(draftKey)
      forget(progressKey)
      setPublished(workspace)
    }
  }

  // A field on an earlier step is wrong (e.g. an old draft): go to that step and say so
  function handleInvalid(errors) {
    const badStep = STEPS.findIndex((s) => s.fields.some((field) => errors[field]))
    if (badStep === -1 || badStep === stepIndex) return // the error shows on this step
    setFormError('Some details need fixing. We’ve taken you to the step with the problem.')
    goToStep(badStep)
  }

  function handleBack() {
    if (isCreated) goToStep(STEPS.length - 1)
    else if (stepIndex === 0) router.back()
    else goToStep(stepIndex - 1)
  }

  const backDisabled = isPublishing || (isCreated && isLastStep)

  return (
    <ListingLayout
      percent={published ? 100 : PROGRESS[stepIndex]}
      onBack={handleBack}
      scrollRef={scrollRef}
    >
      <Text className="text-lg font-semibold text-gray-900">{step.title}</Text>
      <Text className="mt-2 text-sm text-gray-600">{step.subtitle}</Text>

      <Text className="mb-4 mt-6 text-base font-medium text-gray-900">
        Step {stepIndex + 1} of {STEPS.length} :
      </Text>
      <ListingStepper currentIndex={stepIndex} />

      <FormProvider {...form}>
        <View className="mt-10">
          {stepIndex === 0 && <BasicsStep />}
          {stepIndex === 1 && <DetailsStep />}
          {stepIndex === 2 && (
            <PhotosStep
              photos={photos}
              onChange={setPhotos}
              error={photoError}
              onError={setPhotoError}
            />
          )}
          {stepIndex === 3 && <PricingStep />}
          {stepIndex === 4 && (
            <ReviewStep
              photos={photos}
              photosUploaded={photosUploaded}
              onEditStep={goToStep}
              canEditStep={canEditStep}
            />
          )}

          <View className="mt-10 gap-4">
            {isCreated && !isPublishing && !publishError && !published && (
              <Text className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                Your listing has been created but isn&apos;t finished yet. Press Publish to finish
                the rest.
              </Text>
            )}
            <FormError message={publishError || formError} />
            <View className={`flex-row items-center gap-6 ${isLastStep ? '' : 'justify-center'}`}>
              <Pressable
                onPress={handleBack}
                disabled={backDisabled}
                className={`flex-row items-center gap-1.5 ${backDisabled ? 'opacity-40' : ''}`}
              >
                <ArrowLeft size={16} color={COLORS.gray900} />
                <Text className="text-sm font-medium text-gray-900">Back</Text>
              </Pressable>
              <Button
                onPress={handleContinue}
                disabled={isPublishing}
                className={`shadow-md ${isLastStep ? 'flex-1' : 'min-w-36'}`}
              >
                {isPublishing ? progress : isLastStep ? 'Publish Listing' : 'Save & Continue'}
              </Button>
            </View>
          </View>
        </View>
      </FormProvider>

      {published && <PublishSuccessModal listingName={published.name} />}
    </ListingLayout>
  )
}
