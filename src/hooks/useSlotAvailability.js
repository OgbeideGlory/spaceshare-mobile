import { useQuery } from '@tanstack/react-query'
import { checkAvailability } from '@/api/availability'
import { slotEnd, slotProblem, slotStart } from '@/utils/bookingSlot'

// Asks the API whether a workspace is free for the chosen slot.
// Returns { problem, isChecking, isAvailable, reason, error, retry }.
export function useSlotAvailability(workspaceId, slot) {
  const problem = slotProblem(slot) // e.g. end before start: no need to ask the API
  // A broken slot has no real times (toISOString would crash), so only work them out when it's fine
  const startDateTime = problem ? '' : slotStart(slot).toISOString()
  const endDateTime = problem ? '' : slotEnd(slot).toISOString()

  const query = useQuery({
    queryKey: ['availability', workspaceId, startDateTime, endDateTime],
    queryFn: () => checkAvailability(workspaceId, { startDateTime, endDateTime }),
    enabled: Boolean(workspaceId) && !problem,
    staleTime: 30 * 1000, // slots can be taken quickly, so don't trust old answers for long
  })

  return {
    problem,
    isChecking: !problem && query.isFetching,
    isAvailable: !problem && query.data?.available === true,
    // The API explains why a slot isn't available (closed that day, already booked…)
    reason:
      query.data?.available === false ? (query.data.reason ?? 'This time is not available') : '',
    // The check itself failed (e.g. no internet). Show it with a "Try again" button.
    error: problem ? null : query.error,
    retry: () => query.refetch(),
  }
}
