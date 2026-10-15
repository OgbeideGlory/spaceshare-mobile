import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Landmark } from 'lucide-react-native'
import { getAllHostTransactions } from '@/api/payments'
import { getBalance, getPayoutAccount, getWithdrawals } from '@/api/withdrawals'
import HostScreen from '@/components/host/HostScreen'
import PayoutAccountModal from '@/components/host/PayoutAccountModal'
import RequestPayoutModal from '@/components/host/RequestPayoutModal'
import RevenueChart from '@/components/host/RevenueChart'
import LoadError from '@/components/ui/LoadError'
import Spinner from '@/components/ui/Spinner'
import StatusBadge from '@/components/ui/StatusBadge'
import { COLORS } from '@/utils/colors'
import { formatCurrency, formatMoney } from '@/utils/formatCurrency'
import { formatAs } from '@/utils/formatDate'

const sum = (items, key) => items.reduce((total, item) => total + (item[key] ?? 0), 0)
const isRefund = (t) => ['refund_pending', 'refunded'].includes(t.status)

const TRANSACTION_STATUS = {
  pending: { label: 'Pending', className: 'text-red-600' },
  completed: { label: 'Completed', className: 'text-green-700' },
  refund_pending: { label: 'Refund pending', className: 'text-amber-700' },
  refunded: { label: 'Refunded', className: 'text-gray-600' },
}

function StatCard({ label, value, children }) {
  return (
    <View className="rounded-md bg-white p-3">
      <Text className="text-sm text-gray-900">{label}</Text>
      <Text className="mt-1 text-2xl font-semibold text-gray-900">{value}</Text>
      {children}
    </View>
  )
}

// A small "couldn't load" line with a Try again link, for one part of the screen
function InlineError({ what, onRetry }) {
  return (
    <Text className="mt-2 text-sm text-red-600">
      We couldn&apos;t load {what}.{' '}
      <Text onPress={() => onRetry()} className="font-medium text-primary">
        Try again
      </Text>
    </Text>
  )
}

function BreakdownRow({ label, value, total }) {
  return (
    <View
      className={`flex-row justify-between ${total ? 'mt-2 border-t border-gray-100 pt-4' : ''}`}
    >
      <Text className={`text-sm text-gray-900 ${total ? 'font-semibold' : ''}`}>{label}</Text>
      <Text className={`text-sm text-gray-900 ${total ? 'font-semibold' : ''}`}>{value}</Text>
    </View>
  )
}

// "Earnings & Payouts" (opened from More, the dashboard and the earnings snapshot)
export default function EarningsScreen() {
  const [accountOpen, setAccountOpen] = useState(false)
  const [payoutOpen, setPayoutOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const transactionsQuery = useQuery({
    queryKey: ['transactions', 'all'],
    queryFn: getAllHostTransactions,
  })
  const balanceQuery = useQuery({ queryKey: ['balance'], queryFn: getBalance })
  const withdrawalsQuery = useQuery({
    queryKey: ['withdrawals'],
    queryFn: () => getWithdrawals({ limit: 100 }),
  })
  const accountQuery = useQuery({ queryKey: ['payoutAccount'], queryFn: getPayoutAccount })

  const refreshAll = () => {
    transactionsQuery.refetch()
    balanceQuery.refetch()
    withdrawalsQuery.refetch()
    accountQuery.refetch()
  }

  if (transactionsQuery.isLoading) {
    return (
      <HostScreen>
        <Spinner label="Loading your earnings…" />
      </HostScreen>
    )
  }
  if (transactionsQuery.error) {
    return (
      <HostScreen>
        <LoadError
          error={transactionsQuery.error}
          fallback="We couldn't load your earnings."
          onRetry={transactionsQuery.refetch}
        />
      </HostScreen>
    )
  }

  const transactions = transactionsQuery.data ?? []
  const earned = transactions.filter((t) => !isRefund(t))
  const withdrawals = withdrawalsQuery.data?.withdrawals ?? []
  const available = balanceQuery.data?.availableBalance ?? 0
  const account = accountQuery.data
  // Only when the account has loaded do we know whether the host has one.
  // (A failed load doesn't mean "no account".)
  const accountKnown = accountQuery.isSuccess

  // Breakdown: gross includes refunded bookings, which are then taken off as refunds
  const gross = sum(transactions, 'grossAmount')
  const refunds = sum(transactions.filter(isRefund), 'grossAmount')
  const fees = sum(earned, 'platformFee')
  const net = sum(earned, 'hostAmount')
  const feeLabel =
    earned[0]?.platformFeeType === 'percentage' &&
    earned.every((t) => t.platformFeeValue === earned[0].platformFeeValue)
      ? ` (${earned[0].platformFeeValue}%)`
      : ''

  // Last 6 months of earnings for the chart
  const months = Array.from({ length: 6 }, (_, i) => dayjs().subtract(5 - i, 'month'))
  const chartData = months.map((month) => ({
    label: month.format('MMM'),
    value: sum(
      earned.filter((t) => dayjs(t.createdAt).isSame(month, 'month')),
      'hostAmount',
    ),
  }))

  function handleRequestPayout() {
    if (!accountKnown) return
    // A bank account is needed first
    if (!account) setAccountOpen(true)
    else setPayoutOpen(true)
  }

  const sortedTransactions = [...transactions].sort((a, b) =>
    dayjs(b.createdAt).diff(dayjs(a.createdAt)),
  )
  const visibleTransactions = showAll ? sortedTransactions : sortedTransactions.slice(0, 10)
  const canRequest = available > 0 && accountKnown

  return (
    <HostScreen onRefresh={refreshAll}>
      <View className="rounded-lg bg-green-50/60 p-4">
        <Text className="text-2xl font-semibold text-gray-900">Earnings</Text>
        <Text className="mt-2 text-sm text-gray-800">
          Track your revenue, booking performance and available balance
        </Text>

        <View className="mt-8 gap-3">
          <StatCard label="Total Earnings" value={formatCurrency(net)} />
          <StatCard
            label="Available Balance"
            value={balanceQuery.isLoading ? '…' : balanceQuery.error ? '—' : formatMoney(available)}
          >
            {Boolean(balanceQuery.error) && (
              <InlineError what="your balance" onRetry={balanceQuery.refetch} />
            )}
            <Pressable
              onPress={handleRequestPayout}
              disabled={!canRequest}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canRequest }}
              className={`mt-2 self-start rounded-md bg-primary px-4 py-1.5 shadow active:bg-primary-dark ${canRequest ? '' : 'opacity-50'}`}
            >
              <Text className="text-sm text-white">Request payout</Text>
            </Pressable>
          </StatCard>
          <StatCard
            label="Pending Earnings"
            value={formatCurrency(
              sum(
                transactions.filter((t) => t.status === 'pending'),
                'hostAmount',
              ),
            )}
          />
          <StatCard
            label="Total Paid out"
            value={
              withdrawalsQuery.isLoading
                ? '…'
                : withdrawalsQuery.error
                  ? '—'
                  : formatMoney(
                      sum(
                        withdrawals.filter((w) => w.status === 'success'),
                        'amount',
                      ),
                    )
            }
          >
            {Boolean(withdrawalsQuery.error) && (
              <InlineError what="your payouts" onRetry={withdrawalsQuery.refetch} />
            )}
          </StatCard>
        </View>
        <Text className="mt-2 text-xs text-gray-600">
          Earnings become available to withdraw 24 hours after a booking is completed.
        </Text>

        <Text className="mt-8 text-base font-semibold text-gray-900">Revenue</Text>
        <View className="mt-2">
          <RevenueChart data={chartData} title="Earnings" />
        </View>

        <View className="mt-8 rounded-md bg-white p-4">
          <Text className="text-sm font-semibold text-gray-900">Breakdown</Text>
          <View className="mt-3 gap-2">
            <BreakdownRow label="Gross booking revenue" value={formatCurrency(gross)} />
            <BreakdownRow label={`Platform fees${feeLabel}`} value={formatCurrency(fees)} />
            <BreakdownRow label="Refunds" value={formatCurrency(refunds)} />
            <BreakdownRow total label="Net Earnings" value={formatCurrency(net)} />
          </View>
        </View>

        {/* Payout account + history */}
        <View className="mt-8 rounded-md bg-white p-4">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-sm font-semibold text-gray-900">Payout account</Text>
            {accountKnown && (
              <Pressable onPress={() => setAccountOpen(true)} hitSlop={6}>
                <Text className="text-sm font-medium text-primary">
                  {account ? 'Change' : 'Add account'}
                </Text>
              </Pressable>
            )}
          </View>
          {accountQuery.isLoading ? (
            <Text className="mt-3 text-sm text-gray-600">Loading your payout account…</Text>
          ) : accountQuery.error ? (
            <InlineError what="your payout account" onRetry={accountQuery.refetch} />
          ) : account ? (
            <View className="mt-3 flex-row items-center gap-3">
              <Landmark size={18} color={COLORS.accent} />
              <Text className="flex-1 text-sm text-gray-800">
                <Text className="font-bold">{account.accountName}</Text> · {account.bankName} ••••{' '}
                {account.accountLast4}
              </Text>
            </View>
          ) : (
            <Text className="mt-3 text-sm text-gray-600">
              Add the bank account you want your earnings paid into.
            </Text>
          )}

          {/* The web shows a table; on phones each payout is a row */}
          {withdrawals.length > 0 && (
            <View className="mt-6">
              <Text className="text-sm font-semibold text-gray-900">Payout history</Text>
              {withdrawals.map((w) => (
                <View key={w._id} className="mt-2 border-t border-gray-100 pt-2.5">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="text-sm font-medium text-gray-900">
                      {formatMoney(w.amount)}
                    </Text>
                    <StatusBadge kind="payment" status={w.status} />
                  </View>
                  <Text className="mt-0.5 text-xs text-gray-600">
                    {formatAs(w.createdAt, 'YYYY-MM-DD')} · {w.bankName} •••• {w.accountLast4}
                  </Text>
                  {/* The web shows why a payout failed on hover; here it's written underneath */}
                  {Boolean(w.failureReason) && (
                    <Text className="mt-0.5 text-xs text-red-600">{w.failureReason}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="mt-8 rounded-md bg-white p-4">
          <Text className="text-base font-semibold text-gray-900">Transactions</Text>
          {transactions.length === 0 ? (
            <Text className="mt-3 text-sm text-gray-600">
              Earnings from your bookings will show here.
            </Text>
          ) : (
            <View className="mt-3">
              {/* The web shows a table; on phones each transaction is a row */}
              {visibleTransactions.map((t, i) => {
                const booking = typeof t.booking === 'object' ? t.booking : null
                const status = TRANSACTION_STATUS[t.status] ?? { label: t.status, className: '' }
                return (
                  <View key={t._id} className={`py-2.5 ${i > 0 ? 'border-t border-gray-200' : ''}`}>
                    <View className="flex-row items-center justify-between gap-3">
                      <Text numberOfLines={1} className="flex-1 text-sm text-gray-900">
                        {booking?.workspace?.name ?? '—'}
                      </Text>
                      <Text
                        className={`rounded-md bg-gray-100 px-3 py-1 text-xs ${status.className}`}
                      >
                        {status.label}
                      </Text>
                    </View>
                    <Text className="mt-0.5 text-xs text-gray-600">
                      {formatAs(t.createdAt, 'YYYY-MM-DD')} ·{' '}
                      {booking?.bookingCode ?? `#${String(booking?._id ?? t.booking).slice(-6)}`}
                    </Text>
                    <Text className="mt-0.5 text-xs text-gray-700">
                      Gross {formatCurrency(t.grossAmount)} · Fee {formatCurrency(t.platformFee)} ·{' '}
                      <Text className="font-semibold text-gray-900">
                        Net {formatCurrency(t.hostAmount)}
                      </Text>
                    </Text>
                  </View>
                )
              })}
              {transactions.length > 10 && (
                <Pressable onPress={() => setShowAll(!showAll)} className="mt-3 self-start">
                  <Text className="text-sm text-primary">
                    {showAll ? 'Show fewer' : `Show all ${transactions.length}`}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>

      <PayoutAccountModal open={accountOpen} onClose={() => setAccountOpen(false)} />
      {account && (
        <RequestPayoutModal
          open={payoutOpen}
          onClose={() => setPayoutOpen(false)}
          available={available}
          account={account}
        />
      )}
    </HostScreen>
  )
}
