// Turns any API error into a message we can show the user.
// The backend sends errors as { success: false, error: { message: "..." } }
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response) {
    if (error.response.status === 429) {
      return 'Too many attempts. Please wait a few minutes and try again.'
    }
    return error.response.data?.error?.message || error.response.data?.message || fallback
  }
  // The request never got an answer (no internet, server asleep, or it took too long)
  if (error?.isAxiosError) {
    return error.code === 'ECONNABORTED'
      ? 'The server is taking too long to answer. It may be waking up, so please try again.'
      : 'We couldn’t reach SpaceShare. Check your internet connection and try again.'
  }
  // Errors from our own code (e.g. "This account doesn't have access here.")
  return error?.message || fallback
}
