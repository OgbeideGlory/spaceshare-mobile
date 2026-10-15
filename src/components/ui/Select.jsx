import { useState } from 'react'
import { FlatList, Pressable, Text, TextInput, View } from 'react-native'
import { Check, Search } from 'lucide-react-native'
import { COLORS } from '@/utils/colors'
import BottomSheet from './BottomSheet'

// A drop-down. Phones have no <select>, so tapping it opens a list in a bottom sheet.
// You draw what the closed field looks like (children); this handles the list.
// options: [{ value, label, disabled? }]
// searchable: adds a search box at the top (for long lists, like banks)
// Usage:
//   <Select title="Where?" value={city} options={CITY_OPTIONS} onChange={setCity}>
//     <Text>{cityLabel}</Text>
//   </Select>
export default function Select({
  title,
  value,
  options,
  onChange,
  searchable = false,
  className = '',
  children,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const shown = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options

  function close() {
    setOpen(false)
    setQuery('')
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={title}
        className={className}
      >
        {children}
      </Pressable>
      <BottomSheet open={open} onClose={close} title={title}>
        {searchable && (
          <View className="mb-2 flex-row items-center gap-2 rounded-md border border-gray-300 px-3 py-2">
            <Search size={16} color={COLORS.gray500} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search"
              placeholderTextColor={COLORS.gray400}
              accessibilityLabel={`Search ${title ?? ''}`}
              autoCorrect={false}
              className="flex-1 p-0 text-base text-gray-900"
            />
          </View>
        )}
        <FlatList
          data={shown}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text className="py-4 text-center text-sm text-gray-500">No matches</Text>
          }
          keyExtractor={(option) => String(option.value)}
          renderItem={({ item }) => {
            const selected = item.value === value
            return (
              <Pressable
                disabled={item.disabled}
                onPress={() => {
                  onChange(item.value)
                  close()
                }}
                accessibilityState={{ selected, disabled: item.disabled }}
                className="flex-row items-center justify-between border-b border-gray-100 py-3.5"
              >
                <Text
                  className={`text-base ${item.disabled ? 'text-gray-300' : selected ? 'font-medium text-primary' : 'text-gray-900'}`}
                >
                  {item.label}
                </Text>
                {selected && <Check size={18} color={COLORS.primary} />}
              </Pressable>
            )
          }}
        />
      </BottomSheet>
    </>
  )
}
