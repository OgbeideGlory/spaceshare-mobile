import client from './client'

export const getMyProfile = () => client.get('/api/users/me').then((res) => res.data.data.user)

// To change the avatar, pass a FormData with name/phone/avatar fields instead of a plain object
export const updateMyProfile = (body) =>
  client.patch('/api/users/me', body).then((res) => res.data.data.user)

// 'customer' or 'host'. Returns the updated user.
export const selectRole = (role) =>
  client.patch('/api/users/me/role', { role }).then((res) => res.data.data.user)

// Push notifications (phones only). ⚠️ The backend doesn't have these endpoints yet:
// they're the ones we've asked for (see PendingUpdates.md). Until then PUSH_ENABLED stays false.
// platform: 'ios' or 'android'
export const savePushToken = ({ token, platform }) =>
  client.post('/api/users/me/push-tokens', { token, platform }).then((res) => res.data)

export const removePushToken = (token) =>
  client.delete('/api/users/me/push-tokens', { data: { token } }).then((res) => res.data)
