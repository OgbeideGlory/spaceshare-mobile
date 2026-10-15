import {
  Accessibility,
  AirVent,
  BatteryCharging,
  Briefcase,
  Camera,
  CircleParking,
  Clapperboard,
  Frame,
  Handshake,
  Mic,
  Music,
  Presentation,
  Projector,
  Shirt,
  Speaker,
  Sun,
  Toilet,
  Users,
  Video,
  Wifi,
} from 'lucide-react-native'

// Everything a host can pick from in the "List your space" flow.

export const CATEGORIES = [
  {
    value: 'workspace',
    label: 'Work Space',
    description: 'Desks, private offices, co-working',
    icon: Briefcase,
  },
  {
    value: 'studio',
    label: 'Content and Creative Studio',
    description: 'Photo, video, podcast, music, art recording',
    icon: Camera,
  },
  {
    value: 'meeting_room',
    label: 'Meeting Space',
    description: 'Boardroom, interview and training rooms',
    icon: Users,
  },
]

export const ACTIVITIES = [
  { value: 'Photoshoots', icon: Camera },
  { value: 'Video shoot', icon: Video },
  { value: 'Podcast & Audio', icon: Mic },
  { value: 'Client meeting', icon: Handshake },
  { value: 'Rehearsal', icon: Music },
  { value: 'Workshop', icon: Presentation },
  { value: 'Screening', icon: Clapperboard },
  { value: 'Exhibition', icon: Frame },
]

export const AMENITIES = [
  { value: 'Natural light', icon: Sun },
  { value: 'Backup power', icon: BatteryCharging },
  { value: 'Wheelchair access', icon: Accessibility },
  { value: 'Air conditioning', icon: AirVent },
  { value: 'Wi-Fi', icon: Wifi },
  { value: 'Parking space', icon: CircleParking },
  { value: 'Changing room', icon: Shirt },
  { value: 'Restroom', icon: Toilet },
  { value: 'Sound system', icon: Speaker },
  { value: 'TV / Projector', icon: Projector },
]

export const EQUIPMENT = ['Microphones', 'Backdrops', 'Props', 'Studio lights']
export const NO_EQUIPMENT = 'No equipment'

// The API counts days from Sunday = 0
export const DAYS = [
  { dayOfWeek: 0, short: 'Sun', label: 'Sunday' },
  { dayOfWeek: 1, short: 'Mon', label: 'Monday' },
  { dayOfWeek: 2, short: 'Tues', label: 'Tuesday' },
  { dayOfWeek: 3, short: 'Wed', label: 'Wednesday' },
  { dayOfWeek: 4, short: 'Thu', label: 'Thursday' },
  { dayOfWeek: 5, short: 'Fri', label: 'Friday' },
  { dayOfWeek: 6, short: 'Sat', label: 'Saturday' },
]

// Every half hour: { value: '08:30', label: '08:30AM' }. "24:00" means midnight at the end of the day.
function formatTimeLabel(value) {
  if (value === '24:00') return '12:00AM (midnight)'
  const [hours, minutes] = value.split(':').map(Number)
  const suffix = hours < 12 ? 'AM' : 'PM'
  const hours12 = hours % 12 === 0 ? 12 : hours % 12
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}${suffix}`
}

export const TIME_OPTIONS = Array.from({ length: 49 }, (_, i) => {
  const value = `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`
  return { value, label: formatTimeLabel(value) }
})

export const timeLabel = (value) => TIME_OPTIONS.find((t) => t.value === value)?.label ?? value

// Photo rules. The API allows 5 photos per listing.
export const MAX_PHOTOS = 5
export const MAX_PHOTO_SIZE_MB = 5
export const MIN_PHOTO_WIDTH = 1200
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
