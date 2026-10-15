import { Linking } from 'react-native'

// The SpaceShare website, for things the app doesn't have (like the admin console)
export const WEB_URL = 'https://space-share-webapp.onrender.com'

// Opens a page of the website in the phone's browser, e.g. openWebPage('/admin/login')
export function openWebPage(path) {
  return Linking.openURL(`${WEB_URL}${path}`)
}
