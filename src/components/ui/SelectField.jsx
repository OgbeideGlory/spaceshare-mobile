import { Text, View } from 'react-native'
import { ChevronDown } from 'lucide-react-native'
import { COLORS } from '@/utils/colors'
import Select from './Select'

// A drop-down that looks like a text box, with an optional label and error message.
// options: [{ value: 'Lagos', label: 'Lagos' }, ...]. Opens a bottom sheet to choose.
export default function SelectField({
  label,
  accessibilityLabel,
  error,
  options,
  value,
  onChange,
  placeholder = 'Choose…',
  searchable = false,
  className = '',
}) {
  const chosen = options.find((o) => o.value === value)
  return (
    <View className={className}>
      {Boolean(label) && <Text className="mb-1.5 text-sm font-medium text-gray-900">{label}</Text>}
      <Select
        title={label ?? accessibilityLabel}
        value={value}
        options={options}
        onChange={onChange}
        searchable={searchable}
      >
        <View
          className={`flex-row items-center justify-between rounded-lg border bg-white py-3 pl-3.5 pr-3 ${error ? 'border-red-500' : 'border-gray-300'}`}
        >
          <Text
            numberOfLines={1}
            className={`flex-1 text-sm ${chosen ? 'text-gray-900' : 'text-gray-400'}`}
          >
            {chosen?.label ?? placeholder}
          </Text>
          <ChevronDown size={18} color={COLORS.gray600} />
        </View>
      </Select>
      {Boolean(error) && <Text className="mt-1 text-xs text-red-600">{error}</Text>}
    </View>
  )
}
