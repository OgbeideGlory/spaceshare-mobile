import { useState } from 'react'
import { Text, View } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleCheck } from 'lucide-react-native'
import { getBanks, savePayoutAccount } from '@/api/withdrawals'
import Button from '@/components/ui/Button'
import FormError from '@/components/ui/FormError'
import Modal from '@/components/ui/Modal'
import SelectField from '@/components/ui/SelectField'
import TextField from '@/components/ui/TextField'
import { COLORS } from '@/utils/colors'
import { getErrorMessage } from '@/utils/getErrorMessage'

// Add or change the bank account payouts go to.
// Paystack checks the account and returns the account holder's name.
export default function PayoutAccountModal({ open, onClose, onSaved }) {
  const queryClient = useQueryClient()
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')

  const banksQuery = useQuery({
    queryKey: ['banks'],
    queryFn: getBanks,
    enabled: open,
    staleTime: Infinity,
  })
  const mutation = useMutation({
    mutationFn: () => savePayoutAccount({ bankCode, accountNumber }),
    onSuccess: (account) => {
      queryClient.setQueryData(['payoutAccount'], account)
      onSaved?.(account)
    },
  })

  function close() {
    mutation.reset()
    setAccountNumber('')
    onClose()
  }

  const isValid = Boolean(bankCode) && /^\d{10}$/.test(accountNumber)
  const saved = mutation.data

  return (
    <Modal
      open={open}
      isWorking={mutation.isPending}
      onClose={close}
      title="Payout account"
      description="Where your earnings are paid. We check the account with Paystack."
    >
      {saved ? (
        <View className="items-center">
          <CircleCheck size={44} color={COLORS.green600} />
          <Text className="mt-3 text-base font-semibold text-gray-900">{saved.accountName}</Text>
          <Text className="text-sm text-gray-700">
            {saved.bankName} •••• {saved.accountLast4}
          </Text>
          <Button onPress={close} className="mt-6">
            Done
          </Button>
        </View>
      ) : (
        <View className="gap-4">
          {/* Changed for mobile: the bank list has a search box (it's long) */}
          <SelectField
            label="Bank"
            searchable
            value={bankCode}
            onChange={setBankCode}
            placeholder={banksQuery.isLoading ? 'Loading banks…' : 'Choose your bank'}
            options={(banksQuery.data ?? []).map((bank) => ({
              value: bank.code,
              label: bank.name,
            }))}
          />
          {Boolean(banksQuery.error) && (
            <FormError
              message={getErrorMessage(banksQuery.error, 'We couldn’t load the bank list.')}
            />
          )}
          <TextField
            label="Account number"
            type="number"
            placeholder="10-digit account number"
            value={accountNumber}
            onChangeText={(text) => setAccountNumber(text.replace(/\D/g, '').slice(0, 10))}
            error={
              accountNumber && accountNumber.length !== 10 ? 'Account numbers have 10 digits' : ''
            }
          />
          <FormError message={mutation.error ? getErrorMessage(mutation.error) : ''} />
          <Button
            className="self-stretch"
            onPress={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
          >
            {mutation.isPending ? 'Checking account…' : 'Save account'}
          </Button>
          <Text className="text-center text-xs text-gray-500">
            SpaceShare doesn&apos;t store your full account number.
          </Text>
        </View>
      )}
    </Modal>
  )
}
