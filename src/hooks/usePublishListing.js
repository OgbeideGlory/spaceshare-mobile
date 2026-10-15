import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { createAvailability, createBlockedPeriod } from '@/api/availability'
import { createWorkspace, uploadWorkspaceImages } from '@/api/workspaces'
import {
  toAvailabilityRules,
  toBlockedPeriod,
  toWorkspacePayload,
} from '@/components/listing/listingSchema'
import { findCoordinates } from '@/utils/geocode'
import { getErrorMessage } from '@/utils/getErrorMessage'

// What has been sent to the API so far (a function, so every publish gets its own new lists)
const nothingDone = () => ({ workspace: null, photos: false, rules: [], blocked: [] })

// Publishing a listing takes several API calls, in this order:
//   1. create the workspace   2. upload photos   3. save opening hours   4. save blocked dates
// If one fails, pressing "Publish" again carries on from where it stopped,
// so we never create the same listing twice.
// savedProgress / onSaveProgress let the page keep that progress in the browser,
// so it also carries on after the app is closed and opened again.
export function usePublishListing({ savedProgress, onSaveProgress } = {}) {
  const queryClient = useQueryClient()
  const [isPublishing, setIsPublishing] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  // A ref (not state) because it must survive re-renders without causing them
  // rules / blocked keep the created items (with their IDs) so they can be edited later
  const done = useRef({ ...nothingDone(), ...savedProgress })
  // Also a ref, so a double click can't start two publishes before the page re-renders
  const publishingRef = useRef(false)
  const [isCreated, setIsCreated] = useState(Boolean(savedProgress?.workspace)) // workspace exists
  const [photosUploaded, setPhotosUploaded] = useState(Boolean(savedProgress?.photos))

  // Remember what's done so far (called after every step that succeeds)
  const saveProgress = () => onSaveProgress?.(done.current)

  async function publish(values, photos) {
    if (publishingRef.current) return null // already publishing
    publishingRef.current = true
    setIsPublishing(true)
    setError('')
    try {
      let workspace = done.current.workspace
      if (!workspace) {
        setProgress('Creating your listing…')
        const coordinates = await findCoordinates(values.address, values.city)
        workspace = await createWorkspace(toWorkspacePayload(values, coordinates))
        done.current.workspace = workspace
        saveProgress()
        setIsCreated(true)
      }

      if (!done.current.photos) {
        setProgress('Uploading photos…')
        // The upload response is the workspace again, now with its image URLs
        const withImages = await uploadWorkspaceImages(workspace._id, photos)
        if (withImages?.images) workspace = { ...workspace, images: withImages.images }
        done.current.workspace = workspace
        done.current.photos = true
        saveProgress()
        setPhotosUploaded(true)
      }

      setProgress('Saving opening hours…')
      for (const rule of toAvailabilityRules(values)) {
        if (done.current.rules.some((r) => r.dayOfWeek === rule.dayOfWeek)) continue
        const created = await createAvailability(workspace._id, rule)
        done.current.rules.push({ ...rule, _id: created?._id })
        saveProgress()
      }

      // Dates that have already passed can't be blocked any more (e.g. a draft from last week)
      const today = dayjs().format('YYYY-MM-DD')
      for (const date of values.blockedDates.filter((d) => d >= today)) {
        if (done.current.blocked.some((b) => b.date === date)) continue
        const created = await createBlockedPeriod(workspace._id, toBlockedPeriod(date))
        done.current.blocked.push({ date, _id: created?._id })
        saveProgress()
      }

      // So the dashboard and My Spaces show the new listing straight away
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      return workspace
    } catch (err) {
      const saved = done.current.workspace
        ? ' Your listing was saved; press Publish again to finish the rest.'
        : ''
      setError(getErrorMessage(err) + saved)
      return null
    } finally {
      publishingRef.current = false
      setIsPublishing(false)
      setProgress('')
    }
  }

  // isCreated / photosUploaded let the form stop the host editing details already sent
  return { publish, isPublishing, progress, error, isCreated, photosUploaded }
}
