import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleCheck } from 'lucide-react-native'
import { requestWithdrawal } from '@/api/withdrawals'
import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import Modal from '@/components/ui/Modal'
import { COLORS } from '@/utils/colors'
import { formatMoney } from '@/utils/formatCurrency'
import { getErrorMessage } from '@/utils/getErrorMessage'

// "Request payout"
export default function RequestPayoutModal({ open, onClose, available, account }) {
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState('')

  const mutation = useMutation({
    mutationFn: () => requestWithdrawal(Number(amount)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    },
  })

  function close() {
    mutation.reset()
    setAmount('')
    onClose()
  }

  // The most that can be withdrawn, rounded to kobo (2 decimal places)
  const maxAmount = Math.round(available * 100) / 100
  const value = Number(amount)
  const problem =
    amount === ''
      ? ''
      : !(value > 0)
        ? 'Enter an amount above ₦0'
        : value > maxAmount
          ? `You can withdraw up to ${formatMoney(maxAmount)}`
          : !/^\d+(\.\d{1,2})?$/.test(amount)
            ? 'Use at most 2 decimal places'
            : ''
  const result = mutation.data

  return (
    <Modal
      open={open}
      isWorking={mutation.isPending}
      onClose={close}
      title="Request payout"
      description={`Available to withdraw: ${formatMoney(available)}`}
    >
      {result ? (
        <View className="items-center">
          <CircleCheck size={44} color={COLORS.green600} />
          <Text className="mt-3 text-center text-base font-semibold text-gray-900">
            Payout of {formatMoney(result.amount)} requested
          </Text>
          <Text className="mt-1 text-center text-sm text-gray-700">
            {result.status === 'otp'
              ? 'It’s waiting for approval by SpaceShare. You’ll see the status update on this screen.'
              : result.status === 'success'
                ? `Sent to ${result.bankName} •••• ${result.accountLast4}.`
                : `Paystack is sending it to ${result.bankName} •••• ${result.accountLast4}. This usually takes a few minutes.`}
          </Text>
          <Button onPress={close} className="mt-6">
            Done
          </Button>
        </View>
      ) : (
        <View className="gap-4">
          <View>
            <Text className="mb-1.5 text-sm font-medium text-gray-900">Amount</Text>
            <View className="flex-row items-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5">
              <Text className="text-base font-semibold text-gray-900">₦</Text>
              <TextInput
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={(text) => setAmount(text.replace(/[^\d.]/g, ''))}
                accessibilityLabel="Amount"
                className="flex-1 p-0 text-base font-semibold text-gray-900"
              />
              <Pressable onPress={() => setAmount(maxAmount.toFixed(2))} hitSlop={6}>
                <Text className="text-xs font-medium text-primary">Withdraw all</Text>
              </Pressable>
            </View>
            {Boolean(problem) && <Text className="mt-1 text-xs text-red-600">{problem}</Text>}
          </View>
          <Text className="rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
            To: <Text className="font-bold">{account.bankName}</Text> •••• {account.accountLast4} (
            {account.accountName})
          </Text>
          <FormError message={mutation.error ? getErrorMessage(mutation.error) : ''} />
          <Button
            className="self-stretch"
            onPress={() => mutation.mutate()}
            disabled={Boolean(problem) || !(value > 0) || mutation.isPending}
          >
            {mutation.isPending ? 'Requesting…' : `Withdraw ${value > 0 ? formatMoney(value) : ''}`}
          </Button>
        </View>
      )}
    </Modal>
  )
}
