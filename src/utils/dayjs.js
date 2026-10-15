import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import '@/utils/lagosTime' // also sets up Lagos time (utc + timezone plugins)

// dayjs with the plugins we use, set up once.
// Import from here instead of 'dayjs' when you need dayjs(date).fromNow() → "2 hours ago"
dayjs.extend(relativeTime)

export default dayjs
