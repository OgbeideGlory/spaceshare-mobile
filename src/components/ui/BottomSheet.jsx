import { Modal, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import { COLORS } from '@/utils/colors'

// A panel that slides up from the bottom of the screen (the phone version of a pop-up).
// Usage: <BottomSheet open={open} onClose={() => setOpen(false)} title="Where?">…</BottomSheet>
export default function BottomSheet({ open, onClose, title, children }) {
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      {/* Tapping the dark area above the panel closes it */}
      <Pressable onPress={onClose} accessibilityLabel="Close" className="flex-1 bg-black/40" />
      <View
        className="max-h-[75%] rounded-t-2xl bg-white px-4 pt-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-base font-semibold text-gray-900">{title}</Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close">
            <X size={22} color={COLORS.gray600} />
          </Pressable>
        </View>
        {children}
      </View>
    </Modal>
  )
}
