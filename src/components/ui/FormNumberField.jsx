import { useController } from 'react-hook-form'
import TextField from './TextField'

// A number box connected to React Hook Form. The form gets a number (or undefined when it's empty),
// like the web's register('price', { valueAsNumber: true }).
export default function FormNumberField({ control, name, ...props }) {
  const {
    field: { ref, value, onChange, onBlur },
    fieldState,
  } = useController({ control, name })

  return (
    <TextField
      ref={ref}
      type="number"
      value={Number.isFinite(value) ? String(value) : ''}
      onChangeText={(text) => {
        const digits = text.replace(/[^\d.]/g, '')
        onChange(digits === '' ? undefined : Number(digits))
      }}
      onBlur={onBlur}
      error={fieldState.error?.message}
      {...props}
    />
  )
}
