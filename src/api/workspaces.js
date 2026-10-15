import { toUploadFile } from '@/utils/photoPicker'
import client from './client'
import { listFrom, totalPagesOf } from './listFrom'

// filters: { city, type, neighborhood, activity, q (text), minCapacity, priceUnit, minPrice, maxPrice,
//            startDateTime + endDateTime (only spaces free then), page, limit (max 100) }
// Only approved, available workspaces are returned. Public results hide the exact address.
export const searchWorkspaces = (filters = {}) =>
  client.get('/api/workspaces', { params: { limit: 100, ...filters } }).then((res) => res.data.data)

// Search, loading page after page (100 at a time) until every match is in, up to maxPages.
// filters are the API's own: city, type, neighborhood, minCapacity, minPrice, maxPrice, priceUnit…
export async function searchAllWorkspaces(filters = {}, { maxPages = 10 } = {}) {
  const all = []
  for (let page = 1; page <= maxPages; page++) {
    const res = await client.get('/api/workspaces', { params: { ...filters, page, limit: 100 } })
    const { items, pagination } = listFrom(res.data, 'workspaces')
    all.push(...items)
    if (page >= totalPagesOf(pagination) || items.length < 100) break
  }
  return all
}

export const getWorkspace = (id) => client.get(`/api/workspaces/${id}`).then((res) => res.data.data)

// Host only. New listings start with status "pending" until an admin approves them.
export const createWorkspace = (body) =>
  client.post('/api/workspaces', body).then((res) => res.data.data)

export const updateWorkspace = (id, body) =>
  client.put(`/api/workspaces/${id}`, body).then((res) => res.data.data)

export const deleteWorkspace = (id) =>
  client.delete(`/api/workspaces/${id}`).then((res) => res.data)

// files: an array of File objects (max 5 photos per listing in total).
// Works for pending, approved, rejected and changes_requested listings, but not suspended ones.
// Changing the photos of an approved listing sends it back to review.
// photos: picked with src/utils/photoPicker.js (phones send { uri, name, type }, not a File)
export const uploadWorkspaceImages = (id, photos) => {
  const formData = new FormData()
  photos.forEach((photo, i) => formData.append('images', toUploadFile(photo, `photo-${i + 1}.jpg`)))
  return client.post(`/api/workspaces/${id}/images`, formData).then((res) => res.data.data)
}

// Returns the workspace again, with the photos it has left
export const removeWorkspaceImage = (id, publicId) =>
  client.delete(`/api/workspaces/${id}/images`, { data: { publicId } }).then((res) => res.data.data)

// Host only: ALL the host's listings, whatever their status (pending, approved, changes_requested…)
export const getMyWorkspaces = () =>
  client
    .get('/api/workspaces/mine', { params: { limit: 100 } })
    .then((res) => listFrom(res.data, 'workspaces').items)
