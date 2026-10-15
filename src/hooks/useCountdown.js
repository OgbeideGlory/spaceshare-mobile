import { useEffect, useState } from 'react'
import dayjs from 'dayjs'

// Counts down to a time, e.g. the end of the 15-minute payment hold.
// Returns { seconds, label: "12:41" }, or null when there's no time to count to.
export function useCountdown(until) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  if (!until) return null
  const seconds = Math.max(0, dayjs(until).diff(now, 'second'))
  return { seconds, label: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` }
}
