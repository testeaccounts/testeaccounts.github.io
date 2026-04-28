export type ServiceCategory =
  | 'manicure'
  | 'alongamento'
  | 'spa'
  | 'pedicure'
  | 'combo'

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'rescheduled'
  | 'cancelled'

export type NotificationChannel = 'whatsapp' | 'email' | 'internal'

export type NotificationKind =
  | 'booking_confirmation'
  | 'booking_reminder'
  | 'booking_cancelled'
  | 'booking_rescheduled'
  | 'new_booking_alert'

export type NotificationStatus = 'pending' | 'ready' | 'sent' | 'cancelled'

export interface TimeRange {
  start: string
  end: string
}

export interface ServiceItem {
  id: string
  name: string
  category: ServiceCategory
  description: string
  durationMinutes: number
  price: number
  featured: boolean
  accent: string
  active: boolean
}

export interface WeeklyScheduleDay {
  weekday: number
  label: string
  enabled: boolean
  periods: TimeRange[]
}

export interface AvailabilityBlock {
  id: string
  date: string
  start: string
  end: string
  allDay: boolean
  reason: string
}

export interface CustomerProfile {
  name: string
  phone: string
  email?: string
}

export interface AppointmentItem {
  id: string
  serviceId: string
  date: string
  startTime: string
  endTime: string
  status: AppointmentStatus
  client: CustomerProfile
  notes: string
  origin: 'self-service' | 'admin'
  createdAt: string
  updatedAt: string
}

export interface SlotLockItem {
  id: string
  appointmentId: string
  date: string
  time: string
  createdAt: string
}

export interface NotificationItem {
  id: string
  appointmentId: string
  channel: NotificationChannel
  kind: NotificationKind
  recipient: string
  title: string
  message: string
  scheduledFor: string
  status: NotificationStatus
  createdAt: string
}

export interface SalonSettings {
  salonName: string
  ownerName: string
  timezone: string
  bookingWindowDays: number
  slotIntervalMinutes: number
  reminderLeadMinutes: number
  publicPhone: string
  adminWhatsapp: string
  adminEmail: string
  policies: string[]
}

export interface SalonState {
  services: ServiceItem[]
  weeklySchedule: WeeklyScheduleDay[]
  blockedPeriods: AvailabilityBlock[]
  slotLocks: SlotLockItem[]
  appointments: AppointmentItem[]
  notifications: NotificationItem[]
  settings: SalonSettings
}

export interface BookingFormValues {
  name: string
  phone: string
  email: string
  notes: string
}

export interface BookingDraft extends BookingFormValues {
  serviceId: string
  date: string
  startTime: string
}

export interface SlotOption {
  startTime: string
  endTime: string
  label: string
}

export interface ActionResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

export interface AdminCredentials {
  email: string
  password: string
}
