import AsyncStorage from '@react-native-async-storage/async-storage'

// Saves small bits of data on the phone (the web uses localStorage).
// Used to keep a half-finished listing, so closing the app doesn't lose the host's work.
// All three never throw: if storage fails, things just aren't saved.

export async function loadSaved(key) {
  try {
    const text = await AsyncStorage.getItem(key)
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

export async function save(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or blocked: it just won't be saved
  }
}

export async function forget(key) {
  try {
    await AsyncStorage.removeItem(key)
  } catch {
    // nothing to remove
  }
}
