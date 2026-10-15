import client from './client'

export const getNotifications = () => client.get('/api/notifications').then((res) => res.data.data)

export const getUnreadNotifications = () =>
  client.get('/api/notifications/unread').then((res) => res.data.data)

export const markNotificationRead = (id) =>
  client.patch(`/api/notifications/${id}/read`).then((res) => res.data)

export const markAllNotificationsRead = () =>
  client.patch('/api/notifications/read-all').then((res) => res.data)

export const deleteNotification = (id) =>
  client.delete(`/api/notifications/${id}`).then((res) => res.data)

// One page of notifications plus counts: { notifications, unreadCount, total, totalPages, currentPage }
export const getNotificationsPage = ({ page = 1, limit = 20 } = {}) =>
  client.get('/api/notifications', { params: { page, limit } }).then((res) => ({
    notifications: res.data.data,
    unreadCount: res.data.unreadCount,
    total: res.data.total,
    totalPages: res.data.totalPages,
    currentPage: res.data.currentPage,
  }))

// A 60-second token for opening the live notifications stream (the browser can't send login headers there)
export const getStreamToken = () =>
  client
    .post('/api/notifications/stream-token')
    .then((res) => res.data.data?.token ?? res.data.token)
