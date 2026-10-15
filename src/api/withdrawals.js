import client from './client'

// Host payouts (money from bookings → the host's bank account)

// [{ name, code, currency }] — banks Paystack can send money to
export const getBanks = () =>
  client.get('/api/payments/withdrawals/banks').then((res) => res.data.data.banks)

// { availableBalance, currency }. Earnings become available 24 hours after a booking is completed.
export const getBalance = () =>
  client.get('/api/payments/withdrawals/balance').then((res) => res.data.data)

// { bankName, bankCode, accountName, accountLast4, verifiedAt } or null
export const getPayoutAccount = () =>
  client.get('/api/payments/withdrawals/account').then((res) => res.data.data.payoutAccount)

// Paystack checks the account number and returns the account name
export const savePayoutAccount = ({ bankCode, accountNumber }) =>
  client
    .put('/api/payments/withdrawals/account', { bankCode, accountNumber })
    .then((res) => res.data.data.payoutAccount)

// { withdrawals, availableBalance, currency, pagination }
export const getWithdrawals = ({ page = 1, limit = 20 } = {}) =>
  client.get('/api/payments/withdrawals', { params: { page, limit } }).then((res) => res.data.data)

export const requestWithdrawal = (amount) =>
  client.post('/api/payments/withdrawals', { amount }).then((res) => res.data.data.withdrawal)
