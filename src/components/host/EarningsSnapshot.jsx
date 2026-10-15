import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { ArrowRight, ChevronRight, Wallet } from 'lucide-react-native'
import { COLORS } from '@/utils/colors'
import { formatCurrency } from '@/utils/formatCurrency'

// The "Earnings Snapshot" panel.
// The design shows a "Next payout" date, but payouts aren't scheduled: hosts request them on the
// Earnings screen. So we show the earnings still pending (not yet available to withdraw) instead.
export default function EarningsSnapshot({ total, pendingPayout }) {
  return (
    <View>
      <View className="flex-row items-center gap-3">
        <View className="size-10 items-center justify-center rounded-full bg-indigo-50">
          <Wallet size={18} color="#4f46e5" />
        </View>
        <Text className="text-sm font-medium text-gray-900">Earnings Snapshot</Text>
      </View>

      <View className="mt-4 rounded-md border-b-4 border-gray-100 bg-slate-50 px-3 py-5">
        <Text className="text-base text-gray-900">Total earned</Text>
        <Text className="mt-3 text-2xl font-semibold text-gray-900">{formatCurrency(total)}</Text>
      </View>

      <Pressable
        onPress={() => router.push('/host/earnings')}
        className="mt-5 flex-row items-center justify-between rounded-md border-b-4 border-gray-100 bg-slate-50 px-3 py-5 active:bg-slate-100"
      >
        <View>
          <Text className="text-base text-gray-900">Pending payout</Text>
          <Text className="mt-1 text-lg font-medium text-gray-900">
            {formatCurrency(pendingPayout)}
          </Text>
        </View>
        <ChevronRight size={18} color={COLORS.gray900} />
      </Pressable>

      <Pressable
        onPress={() => router.push('/host/earnings')}
        className="mt-6 flex-row items-center justify-end gap-1"
      >
        <Text className="text-sm text-primary">View Earnings</Text>
        <ArrowRight size={14} color={COLORS.primary} />
      </Pressable>
    </View>
  )
}
