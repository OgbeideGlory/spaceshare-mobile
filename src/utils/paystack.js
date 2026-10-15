import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'

// Where Paystack should send the seeker back to: spaceshare://paystack/callback
// (in Expo Go it's an exp://… address; createURL works out the right one).
// ⚠️ The backend still sends every payment back to the website, so for now the in-app browser
// doesn't close by itself: the seeker closes it, and the app checks the booking. See PendingUpdates.md, B1.
export const PAYSTACK_RETURN_URL = Linking.createURL('paystack/callback')

// Opens Paystack's payment page in an in-app browser. Card details never touch our app.
// Returns the payment reference if Paystack sent the seeker back to the app,
// or null if they closed the browser (then check the booking to see if they paid).
export async function openPaystack(authorizationUrl) {
  const result = await WebBrowser.openAuthSessionAsync(authorizationUrl, PAYSTACK_RETURN_URL)
  if (result.type !== 'success') return null
  const { queryParams } = Linking.parse(result.url)
  return queryParams?.reference ?? queryParams?.trxref ?? null
}
