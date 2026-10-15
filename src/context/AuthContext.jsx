import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Toast from 'react-native-toast-message'
import * as authApi from '@/api/auth'
import { setOnLoginExpired } from '@/api/client'
import { selectRole } from '@/api/users'
import { withNormalizedRole } from '@/utils/normalizeRole'
import { registerForPush, unregisterPush } from '@/utils/pushNotifications'
import { clearToken, getToken, loadToken, saveToken } from '@/utils/tokenStorage'
import { AuthContext } from './authContextObject'

// The phone version of the web's AuthContext. Same functions; the differences:
// - the token is read from secure storage when the app starts (it's async, so isLoading starts true)
// - no "remember me" and no other browser tabs to watch
export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(null)
  // True while we read the saved token and check it's still valid
  const [isLoading, setIsLoading] = useState(true)
  // Set when the server couldn't be reached on start-up (we keep the token and let them retry)
  const [sessionError, setSessionError] = useState(null)
  // Email + password kept in memory (never saved) between "sign up" and "enter your code",
  // so we can sign the person in as soon as their email is verified
  const pendingSignIn = useRef(null)

  // Forget everything cached for the previous person, so the next one never sees it
  const resetCache = useCallback(() => {
    queryClient.cancelQueries()
    queryClient.clear()
  }, [queryClient])

  // Use the saved token (if any) to find out who is signed in
  const fetchSession = useCallback(async () => {
    const token = getToken() ?? (await loadToken())
    if (!token) {
      setIsLoading(false)
      return
    }
    try {
      const me = await authApi.getMe()
      setUser(withNormalizedRole(me))
    } catch (error) {
      if (error.response?.status === 401) {
        // The token has expired or was cancelled: sign out quietly
        await clearToken()
      } else {
        // Server asleep, offline, etc. Keep the token so they don't have to log in again.
        setSessionError(error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  // The "Try again" button when the server couldn't be reached
  const retrySession = useCallback(() => {
    setIsLoading(true)
    setSessionError(null)
    fetchSession()
  }, [fetchSession])

  // When any request says the login has expired, sign out here too.
  // The screens guarded by "signed in" close by themselves and the login screen shows.
  useEffect(() => {
    setOnLoginExpired(() => {
      resetCache()
      setUser(null)
      Toast.show({ type: 'info', text1: 'Your login has expired. Please log in again.' })
    })
    return () => setOnLoginExpired(() => {})
  }, [resetCache])

  // Throws the API error; a 403 means the email isn't verified yet.
  const login = useCallback(
    async (email, password) => {
      const result = await authApi.login({ email, password })
      const signedIn = withNormalizedRole(result.user)
      resetCache()
      await saveToken(result.token)
      setSessionError(null)
      setUser(signedIn)
      return signedIn
    },
    [resetCache],
  )

  // Creates the account. The API emails a 6-digit code and won't allow sign-in until it's entered,
  // so we don't sign in here; the "verify your email" screen does it after the code is accepted.
  const register = useCallback(async (details) => {
    const result = await authApi.register(details)
    pendingSignIn.current = { email: details.email, password: details.password }
    return result.user
  }, [])

  const rememberPendingSignIn = useCallback((email, password) => {
    pendingSignIn.current = { email, password }
  }, [])

  // Signs in with the remembered details, if they're for this email. Returns the user, or null.
  const completePendingSignIn = useCallback(
    async (email) => {
      const pending = pendingSignIn.current
      if (!pending || pending.email.toLowerCase() !== email.toLowerCase()) return null
      pendingSignIn.current = null
      return login(pending.email, pending.password)
    },
    [login],
  )

  // Google sign-in (phase 9). The API creates a customer account the first time someone uses it.
  // options.role: 'host' when they used Google on the "sign up as a host" screen.
  // Only a brand-new account is switched; an existing customer or host keeps their role.
  const loginWithGoogle = useCallback(
    async (idToken, { role } = {}) => {
      const result = await authApi.googleLogin(idToken)
      let signedIn = withNormalizedRole(result.user)
      resetCache()
      await saveToken(result.token)
      if (role && signedIn.role === 'customer' && role !== 'customer' && isBrandNew(signedIn)) {
        try {
          signedIn = withNormalizedRole(await selectRole(role))
        } catch {
          // Keep them signed in as a customer; they can become a host later
        }
      }
      setSessionError(null)
      setUser(signedIn)
      return signedIn
    },
    [resetCache],
  )

  // Once someone is signed in, ask for push notifications (does nothing while push is switched off)
  const userId = user?._id
  useEffect(() => {
    if (userId) registerForPush()
  }, [userId])

  // Tell the API first (it cancels the token on every device), then forget it here.
  // If the API call fails (e.g. no internet), the user is still signed out on this phone.
  const logout = useCallback(async () => {
    // Stop push notifications to this phone while we can still prove who we are
    await unregisterPush()
    const token = getToken()
    if (token) authApi.logout(token).catch(() => {})
    await clearToken()
    resetCache()
    setSessionError(null)
    setUser(null)
  }, [resetCache])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      sessionError,
      retrySession,
      login,
      register,
      rememberPendingSignIn,
      completePendingSignIn,
      loginWithGoogle,
      logout,
      setUser,
    }),
    [
      user,
      isLoading,
      sessionError,
      retrySession,
      login,
      register,
      rememberPendingSignIn,
      completePendingSignIn,
      loginWithGoogle,
      logout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// The API doesn't say whether Google just created the account, so we check it was made
// in the last two minutes. (Asked the backend to accept `role` on POST /api/auth/google instead.)
function isBrandNew(user) {
  return Boolean(user.createdAt) && Date.now() - new Date(user.createdAt).getTime() < 2 * 60 * 1000
}
