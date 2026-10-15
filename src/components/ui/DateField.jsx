import { useState } from 'react'
import { Platform, Pressable, TextInput } from 'react-native'
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import dayjs from 'dayjs'
import Button from './Button'
import BottomSheet from './BottomSheet'

// Picks a date. value and onChange use 'YYYY-MM-DD' text, like the web's <input type="date">.
// You draw what the closed field looks like (children). minDate: the earliest date allowed.
// Android shows its own calendar pop-up; iPhone shows a calendar in a bottom sheet.
export default function DateField({
  value,
  onChange,
  minDate,
  title = 'Pick a date',
  className = '',
  children,
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(null) // the date tapped on iPhone, saved when Done is pressed
  // The date the picker opens on: the chosen one, or today.
  // Never hand the native picker a broken date: that crashes the app.
  const currentDate = () => (value && dayjs(value).isValid() ? dayjs(value).toDate() : new Date())
  const minimumDate = minDate && dayjs(minDate).isValid() ? dayjs(minDate).toDate() : undefined
  const save = (date) => onChange(dayjs(date).format('YYYY-MM-DD'))

  // The web preview has no date picker: type the date instead (only a full date is used)
  if (Platform.OS === 'web') {
    return (
      <TextInput
        defaultValue={value}
        onChangeText={(text) => /^\d{4}-\d{2}-\d{2}$/.test(text) && onChange(text)}
        placeholder="YYYY-MM-DD"
        accessibilityLabel={title}
        className={className}
      />
    )
  }

  function openPicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: currentDate(),
        mode: 'date',
        minimumDate,
        onValueChange: (_event, date) => save(date),
      })
    } else {
      setDraft(currentDate())
      setOpen(true)
    }
  }

  return (
    <>
      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={title}
        className={className}
      >
        {children}
      </Pressable>
      {Platform.OS === 'ios' && (
        <BottomSheet open={open} onClose={() => setOpen(false)} title={title}>
          <DateTimePicker
            value={draft ?? currentDate()}
            mode="date"
            display="inline"
            minimumDate={minimumDate}
            accentColor="#e2692c"
            themeVariant="light"
            onValueChange={(_event, date) => setDraft(date)}
          />
          <Button
            variant="accent"
            className="mt-2 self-stretch"
            onPress={() => {
              save(draft ?? currentDate())
              setOpen(false)
            }}
          >
            Done
          </Button>
        </BottomSheet>
      )}
    </>
  )
}
