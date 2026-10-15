import client from './client'

// Returns { reference, authorizationUrl }. Send the user to authorizationUrl to pay on Paystack.
export const initializePayment = (bookingId) =>
  client.post('/api/payments/initialize', { bookingId }).then((res) => res.data.data)

// Call this when Paystack sends the user back. Returns { payment, booking }
export const verifyPayment = (reference) =>
  client.get(`/api/payments/verify/${reference}`).then((res) => res.data.data)

// Host earnings. Returns { transactions, pagination }
export const getHostTransactions = ({ page = 1, limit = 20 } = {}) =>
  client.get('/api/payments/transactions', { params: { page, limit } }).then((res) => res.data.data)

// Fetches every page of the host's transactions (the API returns at most 100 per page).
// Used for totals like "Total earned".
export async function getAllHostTransactions() {
  const all = []
  let page = 1
  let totalPages = 1
  do {
    const { transactions, pagination } = await getHostTransactions({ page, limit: 100 })
    all.push(...transactions)
    totalPages = pagination?.totalPages ?? 1
    page += 1
  } while (page <= totalPages && page <= 20) // safety limit: 2,000 transactions
  return all
}
