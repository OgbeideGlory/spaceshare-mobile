import { Modal, Pressable, Text, View } from 'react-native'

// A pop-up asking the user to confirm something (e.g. cancelling a booking).
// Shown while `open` is true. The cancel button or tapping outside closes it (not while isWorking).
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Go back',
  onConfirm,
  onClose,
  isWorking = false,
  danger = false,
}) {
  const close = () => !isWorking && onClose()

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
      <Pressable onPress={close} className="flex-1 items-center justify-center bg-black/50 px-4">
        {/* Taps inside the box don't close it */}
        <Pressable onPress={() => {}} className="w-full rounded-xl bg-white p-6">
          <Text accessibilityRole="header" className="text-lg font-semibold text-gray-900">
            {title}
          </Text>
          <Text className="mt-2 text-sm text-gray-600">{children}</Text>
          <View className="mt-6 flex-row justify-end gap-3">
            <Pressable
              onPress={close}
              disabled={isWorking}
              className="rounded-lg border border-gray-300 px-4 py-2"
            >
              <Text className="text-sm text-gray-900">{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={isWorking}
              className={`rounded-lg px-4 py-2 ${danger ? 'bg-red-600' : 'bg-primary'} ${isWorking ? 'opacity-60' : ''}`}
            >
              <Text className="text-sm text-white">
                {isWorking ? 'Please wait…' : confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
