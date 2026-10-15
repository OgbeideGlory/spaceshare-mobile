import {
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { X } from 'lucide-react-native'
import { COLORS } from '@/utils/colors'

// A pop-up window. Shown while `open` is true; the × or tapping outside closes it.
// Pass isWorking while a save is running so it can't be closed half-way through.
export default function Modal({ open, title, description, onClose, children, isWorking = false }) {
  const close = () => !isWorking && onClose()

  return (
    <RNModal visible={open} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <Pressable onPress={close} className="flex-1 justify-center bg-black/50 px-4">
          {/* Taps inside the box don't close it */}
          <Pressable onPress={() => {}} className="max-h-[90%] rounded-2xl bg-white">
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="p-6">
              <View className="flex-row items-start justify-between gap-4">
                <Text accessibilityRole="header" className="flex-1 text-2xl font-bold text-accent">
                  {title}
                </Text>
                <Pressable
                  onPress={close}
                  disabled={isWorking}
                  hitSlop={10}
                  accessibilityLabel="Close"
                  className={isWorking ? 'opacity-50' : ''}
                >
                  <X size={22} color={COLORS.gray800} />
                </Pressable>
              </View>
              {description ? (
                <Text className="mt-2 text-sm text-gray-700">{description}</Text>
              ) : null}
              <View className="mt-6">{children}</View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </RNModal>
  )
}
