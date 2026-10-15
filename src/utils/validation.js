import { z } from 'zod'

// Shared form rules, so every form checks things the same way.

export const emailSchema = z.email('Enter a valid email address')

// The four rules shown on the "Create a new password" screen
export const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { label: 'One uppercase letter', test: (value) => /[A-Z]/.test(value) },
  { label: 'One number', test: (value) => /\d/.test(value) },
  { label: 'One special character', test: (value) => /[^A-Za-z0-9]/.test(value) },
]

export const passwordSchema = z
  .string()
  .refine((value) => PASSWORD_RULES.every((rule) => rule.test(value)), {
    message: "Password doesn't meet all the requirements",
  })
