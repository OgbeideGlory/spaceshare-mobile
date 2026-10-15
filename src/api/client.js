import axios from 'axios'
import { clearToken, getToken } from '@/utils/tokenStorage'

// The one Axios instance the whole app uses.
// Phones have no proxy (and no CORS problems), so we call the API's full address.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://space-share-p3on.onrender.com'

const client = axios.create({
  baseURL: API_URL,
  // Render's free server can take ~50 seconds to wake up, so don't give up before then
  timeout: 60000,
})

// What to do when the login expires. AuthContext sets this (it signs out and shows the login screen).
let onLoginExpired = () => {}
export function setOnLoginExpired(callback) {
  onLoginExpired = callback
}

// Before every request: attach the login token if we have one
client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// After every response: if the login has expired (401), sign out.
// skipAuthRedirect: for requests where 401 means "wrong password", not "login expired".
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const sentToken = error.config?.headers?.Authorization?.replace('Bearer ', '')
    // Only if the token that failed is still the one we have (not an old request from before a re-login)
    const isCurrentLogin = Boolean(sentToken) && sentToken === getToken()
    if (error.response?.status === 401 && isCurrentLogin && !error.config?.skipAuthRedirect) {
      await clearToken()
      onLoginExpired()
    }
    return Promise.reject(error)
  },
)

export default client
