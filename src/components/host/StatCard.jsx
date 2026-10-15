import { Text, View } from 'react-native'

// One of the four number cards at the top of the dashboard.
// iconBox / iconColor: the round icon's background class and colour, e.g. 'bg-sky-50' + '#0284c7'
export default function StatCard({ icon: Icon, iconBox, iconColor, label, value, footer }) {
  return (
    <View className="w-56 rounded-lg border border-gray-200 bg-white p-1.5 shadow-sm">
      <View className="flex-1 rounded-md border border-gray-100 p-3">
        <View className={`size-10 items-center justify-center rounded-full ${iconBox}`}>
          <Icon size={20} color={iconColor} />
        </View>
        <Text className="mt-3 text-sm text-gray-900">{label}</Text>
        <Text className="mt-1 text-2xl font-semibold text-gray-900">{value}</Text>
        <View className="mt-2">
          {typeof footer === 'string' ? (
            <Text className="text-xs text-gray-600">{footer}</Text>
          ) : (
            footer
          )}
        </View>
      </View>
    </View>
  )
}
