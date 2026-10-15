import client from './client'
import { listFrom } from './listFrom'

// Returns { available, reason, conflict, ... }. startDateTime/endDateTime are ISO strings.
export const checkAvailability = (workspaceId, { startDateTime, endDateTime }) =>
  client
    .get(`/api/workspaces/${workspaceId}/availability/check`, {
      params: { startDateTime, endDateTime },
    })
    .then((res) => res.data.data ?? res.data)

// Host only. body: { type: 'recurring', dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }
// or { type: 'specific_date', date: '2026-10-12', startTime, endTime }. dayOfWeek 0 = Sunday.
// Note: this endpoint returns the rule directly, not inside `data`
export const createAvailability = (workspaceId, body) =>
  client
    .post(`/api/workspaces/${workspaceId}/availability`, body)
    .then((res) => res.data.data ?? res.data)

// Host only. Changes one rule; body has the same shape as createAvailability's.
// Like create, this endpoint returns the rule directly, not inside `data`
export const updateAvailability = (workspaceId, availabilityId, body) =>
  client
    .put(`/api/workspaces/${workspaceId}/availability/${availabilityId}`, body)
    .then((res) => res.data.data ?? res.data)

export const deleteAvailability = (workspaceId, availabilityId) =>
  client
    .delete(`/api/workspaces/${workspaceId}/availability/${availabilityId}`)
    .then((res) => res.data)

// Host only. Blocks a time range (e.g. maintenance). body: { startDateTime, endDateTime, reason }
// Note: this endpoint also returns the blocked period directly, not inside `data`
export const createBlockedPeriod = (workspaceId, body) =>
  client
    .post(`/api/workspaces/${workspaceId}/blocked-periods`, body)
    .then((res) => res.data.data ?? res.data)

export const cancelBlockedPeriod = (workspaceId, blockedPeriodId) =>
  client
    .patch(`/api/workspaces/${workspaceId}/blocked-periods/${blockedPeriodId}/cancel`)
    .then((res) => res.data.data)

// Public: active opening hours of an approved workspace
export const getOpeningHours = (workspaceId) =>
  client
    .get(`/api/workspaces/${workspaceId}/availability`)
    .then((res) => listFrom(res.data, 'availability', 'rules').items)

// Host only: every rule (active and inactive) for their workspace
export const getManagedAvailability = (workspaceId) =>
  client
    .get(`/api/workspaces/${workspaceId}/availability/manage`)
    .then((res) => listFrom(res.data, 'availability', 'rules').items)

// Host only: blocked periods, including cancelled ones
export const getBlockedPeriods = (workspaceId) =>
  client
    .get(`/api/workspaces/${workspaceId}/blocked-periods`)
    .then((res) => listFrom(res.data, 'blockedPeriods', 'periods').items)
