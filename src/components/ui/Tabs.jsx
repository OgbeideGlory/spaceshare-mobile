import { Pressable, Text, View } from 'react-native'

// A row of tabs with optional counts. tabs: [{ key, label, count }]
// variant 'underline' (default) or 'pill'
export default function Tabs({ tabs, active, onChange, label, variant = 'underline' }) {
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={label}
      className={`flex-row flex-wrap ${variant === 'underline' ? 'gap-x-6 gap-y-2 border-b border-gray-200' : 'gap-3'}`}
    >
      {tabs.map((tab) => {
        const selected = tab.key === active
        const box =
          variant === 'pill'
            ? `rounded-lg border px-4 py-2 ${selected ? 'border-green-200 bg-green-100' : 'border-gray-300'}`
            : `-mb-px flex-row items-center gap-2 border-b-2 pb-2 ${selected ? 'border-accent' : 'border-transparent'}`
        const text =
          variant === 'pill'
            ? `text-sm font-medium ${selected ? 'text-gray-900' : 'text-gray-800'}`
            : `text-sm ${selected ? 'font-medium text-accent' : 'text-gray-700'}`
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className={box}
          >
            <Text className={text}>
              {tab.label}
              {variant === 'pill' && tab.count !== undefined ? ` (${tab.count})` : ''}
            </Text>
            {variant !== 'pill' && tab.count !== undefined && (
              <Text
                className={`rounded-full border px-2 text-xs ${selected ? 'border-green-200 bg-green-50' : 'border-gray-300'}`}
              >
                {tab.count}
              </Text>
            )}
          </Pressable>
        )
      })}
    </View>
  )
}
