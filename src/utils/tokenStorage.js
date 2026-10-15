import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

// Where the login token is kept: the phone's encrypted storage (expo-secure-store).
// Phone apps stay signed in, so there's no "remember me" like on the web.
// (The token itself still expires when the API says so, about 24 hours.)
//
// Reading secure storage is slow and async, so we also keep a copy in memory.
// That lets getToken() stay instant, like on the web (the API client calls it before every request).
// The app must call loadToken() once on start-up, before deciding where to send the user.

export const TOKEN_KEY = 'token'

// The web preview (npx expo start --web) has no secure storage, so it uses the browser's.
// Phones always use SecureStore.
const storage =
  Platform.OS === 'web'
    ? {
        getItemAsync: async (key) => localStorage.getItem(key),
        setItemAsync: async (key, value) => localStorage.setItem(key, value),
        deleteItemAsync: async (key) => localStorage.removeItem(key),
      }
    : SecureStore

let currentToken = null

// Reads the saved token into memory. Call once when the app starts.
export async function loadToken() {
  try {
    currentToken = await storage.getItemAsync(TOKEN_KEY)
  } catch {
    // Storage can't be read (rare). Treat it as signed out.
    currentToken = null
  }
  return currentToken
}

export function getToken() {
  return currentToken
}

export async function saveToken(token) {
  // Never save a missing token (it would be sent as "Bearer undefined")
  if (!token) throw new Error('The server didn’t send a login token. Please try again.')
  currentToken = token
  await storage.setItemAsync(TOKEN_KEY, token)
}

export async function clearToken() {
  currentToken = null
  await storage.deleteItemAsync(TOKEN_KEY)
}

// Swap in a new token (e.g. after a password change)
export const replaceToken = saveToken
