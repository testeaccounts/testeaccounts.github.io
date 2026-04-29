import type { SalonState, ServiceItem, WeeklyScheduleDay } from '../types/domain'

export const DEFAULT_DATA_VERSION = 3

function createServices() {
  return [
    {
      id: 'mao-tradicional',
      name: 'Mão tradicional',
      category: 'manicure',
      description: '',
      durationMinutes: 60,
      price: 0,
      featured: true,
      accent: 'rose',
      active: true,
    },
    {
      id: 'pe-tradicional',
      name: 'Pé tradicional',
      category: 'pedicure',
      description: '',
      durationMinutes: 60,
      price: 0,
      featured: true,
      accent: 'sage',
      active: true,
    },
    {
      id: 'pe-e-mao-tradicional',
      name: 'Pé e mão tradicional',
      category: 'combo',
      description: '',
      durationMinutes: 120,
      price: 0,
      featured: true,
      accent: 'blue',
      active: true,
    },
  ] satisfies ServiceItem[]
}

function createWeeklySchedule() {
  return [
    {
      weekday: 0,
      label: 'Domingo',
      enabled: false,
      periods: [],
    },
    {
      weekday: 1,
      label: 'Segunda',
      enabled: true,
      periods: [{ start: '08:00', end: '18:00' }],
    },
    {
      weekday: 2,
      label: 'Terça',
      enabled: true,
      periods: [{ start: '08:00', end: '18:00' }],
    },
    {
      weekday: 3,
      label: 'Quarta',
      enabled: true,
      periods: [{ start: '08:00', end: '18:00' }],
    },
    {
      weekday: 4,
      label: 'Quinta',
      enabled: true,
      periods: [{ start: '08:00', end: '18:00' }],
    },
    {
      weekday: 5,
      label: 'Sexta',
      enabled: true,
      periods: [{ start: '08:00', end: '18:00' }],
    },
    {
      weekday: 6,
      label: 'Sábado',
      enabled: true,
      periods: [{ start: '08:00', end: '15:00' }],
    },
  ] satisfies WeeklyScheduleDay[]
}

export function createSeedState(): SalonState {
  return {
    services: createServices(),
    weeklySchedule: createWeeklySchedule(),
    blockedPeriods: [],
    slotLocks: [],
    appointments: [],
    notifications: [],
    settings: {
      dataVersion: DEFAULT_DATA_VERSION,
      salonName: 'Alissa Unhas',
      ownerName: 'Alissa',
      tagline: '',
      timezone: 'America/Sao_Paulo',
      bookingWindowDays: 14,
      slotIntervalMinutes: 30,
      reminderLeadMinutes: 180,
      publicPhone: '',
      adminWhatsapp: '',
      adminEmail: '',
      addressLabel: '',
      mapUrl: '',
      highlights: [],
      policies: [],
    },
  }
}
