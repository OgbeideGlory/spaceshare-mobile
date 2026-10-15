import client from './client'

// Returns { reviews, pagination }
export const getWorkspaceReviews = (workspaceId, { page = 1, limit = 20 } = {}) =>
  client
    .get(`/api/reviews/workspaces/${workspaceId}`, { params: { page, limit } })
    .then((res) => res.data.data)

// Only for completed bookings. body: { bookingId, rating (1-5), comment }
export const createReview = (body) => client.post('/api/reviews', body).then((res) => res.data.data)

export const deleteReview = (id) => client.delete(`/api/reviews/${id}`).then((res) => res.data)
