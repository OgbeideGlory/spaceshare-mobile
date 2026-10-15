import { useController } from 'react-hook-form'
import PasswordField from './PasswordField'
import TextField from './TextField'

// A TextField connected to React Hook Form. Phones have no register(), so this does the wiring.
// Usage: <FormTextField control={control} name="email" type="email" placeholder="Email address" />
//        <FormTextField control={control} name="password" password placeholder="Password" />
export default function FormTextField({ control, name, password = false, ...props }) {
  const {
    field: { ref, value, onChange, onBlur },
    fieldState,
  } = useController({ control, name })
  const Field = password ? PasswordField : TextField

  return (
    <Field
      ref={ref}
      value={value ?? ''}
      onChangeText={onChange}
      onBlur={onBlur}
      error={fieldState.error?.message}
      {...props}
    />
  )
}
