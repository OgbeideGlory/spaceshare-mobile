import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { formatCurrency } from '@/utils/formatCurrency'

// Rounds the top of the scale up to a tidy number (e.g. 37,400 → 40,000)
function niceMax(value) {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const steps = [1, 2, 2.5, 5, 10]
  return magnitude * steps.find((s) => s * magnitude >= value)
}
const shortNaira = (n) =>
  n >= 1_000_000 ? `₦${n / 1_000_000}m` : n >= 1000 ? `₦${n / 1000}k` : `₦${n}`

// Horizontal bars: one per month. data: [{ label: 'Jan', value: 120000 }]
// One series, so no legend. Tap a bar to see its exact amount (the web shows it on hover).
export default function RevenueChart({ data, title = 'Revenue' }) {
  const [active, setActive] = useState(null)
  const max = niceMax(Math.max(...data.map((d) => d.value), 0))
  const ticks = Array.from({ length: 5 }, (_, i) => (max / 4) * i)
  const percent = (value) => `${(value / max) * 100}%`

  return (
    <View accessibilityLabel={`${title} per month`} className="rounded-sm bg-white p-4">
      <View>
        {/* Grid lines */}
        <View className="absolute bottom-0 left-10 right-0 top-0" pointerEvents="none">
          {ticks.map((tick) => (
            <View
              key={tick}
              style={{ left: percent(tick) }}
              className="absolute bottom-0 top-0 border-l border-dashed border-gray-200"
            />
          ))}
        </View>
        <View className="gap-3">
          {data.map((d, i) => (
            <View key={d.label} className="flex-row items-center gap-2">
              <Text className="w-8 text-right text-xs text-gray-600">{d.label}</Text>
              <View className="h-7 flex-1">
                <Pressable
                  onPress={() => setActive(active === i ? null : i)}
                  accessibilityRole="button"
                  accessibilityLabel={`${d.label}: ${formatCurrency(d.value)}`}
                  style={{ width: d.value > 0 ? `${Math.max((d.value / max) * 100, 0.8)}%` : 0 }}
                  className="h-full rounded-r bg-primary active:opacity-85"
                />
              </View>
            </View>
          ))}
        </View>
        {/* The amount for the tapped bar */}
        {active !== null && (
          <Text
            style={{ top: active * 40 - 30, left: 40 }}
            className="absolute rounded-md bg-gray-900 px-2 py-1 text-xs text-white"
          >
            {data[active].label}: {formatCurrency(data[active].value)}
          </Text>
        )}
        {/* The scale along the bottom */}
        <View className="ml-10 mt-2 h-4">
          {ticks.map((tick, i) => (
            <Text
              key={tick}
              style={{ left: percent(tick), transform: [{ translateX: i === 0 ? 0 : -14 }] }}
              className="absolute text-[11px] text-gray-500"
            >
              {shortNaira(tick)}
            </Text>
          ))}
        </View>
      </View>
    </View>
  )
}
