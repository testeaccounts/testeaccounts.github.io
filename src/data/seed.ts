import { addDays } from 'date-fns'
import { buildCreatedNotifications } from '../lib/notifications'
import { addMinutesToTime, toDateInputValue } from '../lib/dateTime'
import { buildSlotTimes } from '../lib/scheduling'
import type {
  AppointmentItem,
  SalonState,
  ServiceItem,
  SlotLockItem,
  WeeklyScheduleDay,
} from '../types/domain'

export const DEFAULT_DATA_VERSION = 2

function createId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
}

function createServices() {
  return [
    {
      id: 'pe-e-mao-tradicional',
      name: 'Pé e mão tradicional',
      category: 'combo',
      description:
        'Atendimento completo com esmaltação tradicional para mãos e pés, focado em unhas naturais.',
      durationMinutes: 120,
      price: 0,
      featured: true,
      accent: 'rose',
      active: true,
    },
    {
      id: 'mao-tradicional',
      name: 'Mão tradicional',
      category: 'manicure',
      description:
        'Cutilagem e esmaltação tradicional com secagem rápida e acabamento duradouro.',
      durationMinutes: 60,
      price: 0,
      featured: true,
      accent: 'wine',
      active: true,
    },
    {
      id: 'pe-tradicional',
      name: 'Pé tradicional',
      category: 'pedicure',
      description:
        'Pedicure tradicional para quem quer pés bem cuidados com atendimento somente com hora marcada.',
      durationMinutes: 60,
      price: 0,
      featured: true,
      accent: 'pearl',
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

function createAppointments(services: ServiceItem[]) {
  const peEMao = services.find((service) => service.id === 'pe-e-mao-tradicional')!
  const mao = services.find((service) => service.id === 'mao-tradicional')!
  const pe = services.find((service) => service.id === 'pe-tradicional')!

  const firstDate = toDateInputValue(addDays(new Date(), 1))
  const secondDate = toDateInputValue(addDays(new Date(), 2))
  const thirdDate = toDateInputValue(addDays(new Date(), 4))

  return [
    {
      id: createId('appointment'),
      serviceId: peEMao.id,
      date: firstDate,
      startTime: '08:00',
      endTime: addMinutesToTime('08:00', peEMao.durationMinutes),
      status: 'confirmed',
      client: {
        name: 'Camila Rocha',
        phone: '11987654321',
      },
      notes: 'Prefere vermelho clássico.',
      origin: 'self-service',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: createId('appointment'),
      serviceId: mao.id,
      date: secondDate,
      startTime: '13:00',
      endTime: addMinutesToTime('13:00', mao.durationMinutes),
      status: 'confirmed',
      client: {
        name: 'Juliana Costa',
        phone: '11995554433',
      },
      notes: 'Esmaltação tradicional.',
      origin: 'self-service',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: createId('appointment'),
      serviceId: pe.id,
      date: thirdDate,
      startTime: '10:00',
      endTime: addMinutesToTime('10:00', pe.durationMinutes),
      status: 'confirmed',
      client: {
        name: 'Patricia Lima',
        phone: '21981234567',
      },
      notes: 'Primeiro atendimento.',
      origin: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ] satisfies AppointmentItem[]
}

export function createSeedState(): SalonState {
  const services = createServices()
  const appointments = createAppointments(services)

  const settings = {
    dataVersion: DEFAULT_DATA_VERSION,
    salonName: 'Alyssa Unhas',
    ownerName: 'Alyssa',
    tagline: 'Especialista em unhas naturais e esmaltação tradicional.',
    timezone: 'America/Sao_Paulo',
    bookingWindowDays: 14,
    slotIntervalMinutes: 30,
    reminderLeadMinutes: 180,
    publicPhone: '',
    adminWhatsapp: '',
    adminEmail: 'alyssaunhas@email.com',
    addressLabel:
      'Rua Armando S. Oliveira, 191, Santa Fé do Sul - SP, 15775-000',
    mapUrl:
      'https://www.google.com/maps/place/R.+Armando+S+Oliveira,+191,+Santa+F%C3%A9+do+Sul+-+SP,+15775-000/@-20.1942,-50.9242,17z/data=!4m6!3m5!1s0x9499c6cbd05ea76b:0xef088a0eb390be97!8m2!3d-20.1941214!4d-50.924224!16s%2Fg%2F11c5j55rh7?hl=pt-BR&entry=ttu&g_ep=EgoyMDI2MDQyMi4wIKXMDSoASAFQAw%3D%3D',
    highlights: [
      'Especialista em unhas naturais.',
      'Secagem rápida e esmaltação duradoura.',
      'Esmaltação tradicional.',
      'Não atendo a domicílio.',
    ],
    policies: [
      'Atendimento somente com hora marcada.',
      'Não atendo a domicílio.',
      'Especialista em unhas naturais, sem gel e sem alongamento.',
    ],
  }

  const slotLocks: SlotLockItem[] = appointments.flatMap((appointment) => {
    const service = services.find((item) => item.id === appointment.serviceId)

    if (!service) {
      return []
    }

    return buildSlotTimes(
      appointment.startTime,
      service.durationMinutes,
      settings.slotIntervalMinutes,
    ).map((time) => ({
      id: `${appointment.date}_${time}`,
      appointmentId: appointment.id,
      date: appointment.date,
      time,
      createdAt: appointment.createdAt,
    }))
  })

  return {
    services,
    weeklySchedule: createWeeklySchedule(),
    blockedPeriods: [
      {
        id: createId('block'),
        date: toDateInputValue(addDays(new Date(), 3)),
        start: '12:00',
        end: '14:00',
        allDay: false,
        reason: 'Pausa do almoço',
      },
      {
        id: createId('block'),
        date: toDateInputValue(addDays(new Date(), 6)),
        start: '00:00',
        end: '23:59',
        allDay: true,
        reason: 'Agenda fechada',
      },
    ],
    slotLocks,
    appointments,
    notifications: appointments.flatMap((appointment) => {
      const service = services.find((item) => item.id === appointment.serviceId)!
      return buildCreatedNotifications(appointment, service, settings)
    }),
    settings,
  }
}
