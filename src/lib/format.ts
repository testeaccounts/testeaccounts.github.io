function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

export function formatCurrencyBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatServicePrice(value: number) {
  return value > 0 ? formatCurrencyBRL(value) : 'Sob consulta'
}

export function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, '0')}`
}

export function formatPhoneDisplay(value: string) {
  const digits = digitsOnly(value).slice(0, 11)

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (!parts.length) {
    return 'AL'
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function ensureWhatsappNumber(phone: string) {
  const digits = digitsOnly(phone)

  if (!digits) {
    return ''
  }

  return digits.startsWith('55') ? digits : `55${digits}`
}

export function createWhatsAppLink(phone: string, message: string) {
  const recipient = ensureWhatsappNumber(phone)

  if (!recipient) {
    return ''
  }

  return `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`
}
