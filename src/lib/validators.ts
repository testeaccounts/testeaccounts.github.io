import type { BookingFormValues } from '../types/domain'

export function normalizePhone(value: string) {
  return value.replace(/\D/g, '')
}

export function isValidPhone(value: string) {
  const digits = normalizePhone(value)
  return digits.length >= 10 && digits.length <= 13
}

export function isValidEmail(value: string) {
  if (!value.trim()) {
    return true
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function validateBookingForm(values: BookingFormValues) {
  const errors: Partial<Record<keyof BookingFormValues, string>> = {}

  if (!values.name.trim()) {
    errors.name = 'Informe o nome da cliente.'
  }

  if (!isValidPhone(values.phone)) {
    errors.phone = 'Informe um WhatsApp com DDD válido.'
  }

  if (!isValidEmail(values.email)) {
    errors.email = 'Digite um e-mail válido ou deixe em branco.'
  }

  return errors
}
