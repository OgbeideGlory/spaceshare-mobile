import client from './client'

// Returns { user, token }
export const login = ({ email, password }) =>
  client
    .post('/api/auth/login', { email, password }, { skipAuthRedirect: true })
    .then((res) => res.data.data)

// role is 'customer' (default) or 'host'. Returns { user } (no token, so log in afterwards)
export const register = ({ name, email, phone, password, role }) =>
  client
    .post('/api/auth/register', { name, email, phone, password, role }, { skipAuthRedirect: true })
    .then((res) => res.data.data)

// Returns the logged-in user
// The app handles a 401 here itself (AuthContext), so no automatic redirect
export const getMe = () =>
  client.get('/api/auth/me', { skipAuthRedirect: true }).then((res) => res.data.data.user)

export const forgotPassword = (email) =>
  client
    .post('/api/auth/forgot-password', { email }, { skipAuthRedirect: true })
    .then((res) => res.data)

export const resetPassword = (body) =>
  client.post('/api/auth/reset-password', body, { skipAuthRedirect: true }).then((res) => res.data)

// body: { currentPassword, newPassword }. Returns { token }: a NEW login token.
// The API signs out every other session, so the new token must be saved straight away.
export const changePassword = (body) =>
  client
    // A wrong current password also returns 401, which must not sign the user out
    .patch('/api/auth/change-password', body, { skipAuthRedirect: true })
    .then((res) => res.data.data)

// Signs the user out on every device (the API cancels all their tokens)
// The token is passed in because the app clears its saved copy straight away
export const logout = (token) =>
  client
    .post('/api/auth/logout', null, {
      headers: { Authorization: `Bearer ${token}` },
      skipAuthRedirect: true,
    })
    .then((res) => res.data)

// Sends a 6-digit code to the user's email (valid for 10 minutes)
export const requestEmailVerification = (email) =>
  client
    .post('/api/auth/email-verification/request', { email }, { skipAuthRedirect: true })
    .then((res) => res.data)

export const verifyEmail = ({ email, otp }) =>
  client
    .post('/api/auth/email-verification/verify', { email, otp }, { skipAuthRedirect: true })
    .then((res) => res.data)

// idToken comes from Google's sign-in button. Returns { user, token }
export const googleLogin = (idToken) =>
  client
    .post('/api/auth/google', { idToken }, { skipAuthRedirect: true })
    .then((res) => res.data.data)
