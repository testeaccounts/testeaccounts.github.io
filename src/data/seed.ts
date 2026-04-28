import { addDays } from 'date-fns'
import { buildCreatedNotifications } from '../lib/notifications'
import { addMinutesToTime, toDateInputValue } from '../lib/dateTime'
import type {
  AppointmentItem,
  SalonState,
  ServiceItem,
  WeeklyScheduleDay,
} from '../types/domain'

function createId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
}

function createServices() {
  return [
    {
      id: 'manicure-russa',
      name: 'Manicure russa premium',
      category: 'manicure',
      description:
        'Cutilagem detalhada, esmaltação cuidadosa e acabamento impecável para quem quer unhas sempre alinhadas.',
      durationMinutes: 75,
      price: 68,
      featured: true,
      accent: 'rose',
      active: true,
    },
    {
      id: 'blindagem',
      name: 'Blindagem fortalecedora',
      category: 'spa',
      description:
        'Camada protetora para reduzir quebras e manter brilho por mais tempo.',
      durationMinutes: 90,
      price: 88,
      featured: true,
      accent: 'champagne',
      active: true,
    },
    {
      id: 'alongamento-gel',
      name: 'Alongamento em gel',
      category: 'alongamento',
      description:
        'Estrutura completa com curvatura e acabamento profissional para uma transformação completa.',
      durationMinutes: 150,
      price: 185,
      featured: true,
      accent: 'wine',
      active: true,
    },
    {
      id: 'manutencao-gel',
      name: 'Manutenção de gel',
      category: 'alongamento',
      description:
        'Correção de crescimento, nivelamento e renovação da esmaltação.',
      durationMinutes: 120,
      price: 138,
      featured: false,
      accent: 'sand',
      active: true,
    },
    {
      id: 'spa-maos-pes',
      name: 'Spa mãos e pés',
      category: 'combo',
      description:
        'Sessão relaxante com hidratação e finalização elegante para um momento de autocuidado completo.',
      durationMinutes: 110,
      price: 120,
      featured: false,
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
      periods: [
        { start: '09:00', end: '12:00' },
        { start: '13:30', end: '18:30' },
      ],
    },
    {
      weekday: 2,
      label: 'Terça',
      enabled: true,
      periods: [
        { start: '09:00', end: '12:00' },
        { start: '13:30', end: '18:30' },
      ],
    },
    {
      weekday: 3,
      label: 'Quarta',
      enabled: true,
      periods: [
        { start: '09:00', end: '12:00' },
        { start: '13:30', end: '18:30' },
      ],
    },
    {
      weekday: 4,
      label: 'Quinta',
      enabled: true,
      periods: [
        { start: '09:00', end: '12:00' },
        { start: '13:30', end: '18:30' },
      ],
    },
    {
      weekday: 5,
      label: 'Sexta',
      enabled: true,
      periods: [
        { start: '09:00', end: '12:00' },
        { start: '13:30', end: '18:30' },
      ],
    },
    {
      weekday: 6,
      label: 'Sábado',
      enabled: true,
      periods: [{ start: '08:30', end: '14:00' }],
    },
  ] satisfies WeeklyScheduleDay[]
}

function createAppointments(services: ServiceItem[]) {
  const manicure = services.find((service) => service.id === 'manicure-russa')!
  const blindagem = services.find((service) => service.id === 'blindagem')!
  const alongamento = services.find((service) => service.id === 'alongamento-gel')!

  const firstDate = toDateInputValue(addDays(new Date(), 1))
  const secondDate = toDateInputValue(addDays(new Date(), 2))
  const thirdDate = toDateInputValue(addDays(new Date(), 4))

  return [
    {
      id: createId('appointment'),
      serviceId: manicure.id,
      date: firstDate,
      startTime: '09:00',
      endTime: addMinutesToTime('09:00', manicure.durationMinutes),
      status: 'confirmed',
      client: {
        name: 'Camila Rocha',
        phone: '11987654321',
        email: 'camila@email.com',
      },
      notes: 'Prefere esmalte nude.',
      origin: 'self-service',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: createId('appointment'),
      serviceId: blindagem.id,
      date: secondDate,
      startTime: '13:30',
      endTime: addMinutesToTime('13:30', blindagem.durationMinutes),
      status: 'pending',
      client: {
        name: 'Juliana Costa',
        phone: '11995554433',
      },
      notes: '',
      origin: 'self-service',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: createId('appointment'),
      serviceId: alongamento.id,
      date: thirdDate,
      startTime: '10:00',
      endTime: addMinutesToTime('10:00', alongamento.durationMinutes),
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
    salonName: 'Alyssa Unhas',
    ownerName: 'Alyssa',
    timezone: 'America/Sao_Paulo',
    bookingWindowDays: 14,
    slotIntervalMinutes: 30,
    reminderLeadMinutes: 180,
    publicPhone: '11940028922',
    adminWhatsapp: '11940028922',
    adminEmail: 'alyssaunhas@email.com',
    policies: [
      'Tolerância de 10 minutos para atrasos.',
      'Remarcações podem ser feitas sem custo com antecedência.',
      'Horários bloqueados não aparecem para a cliente.',
    ],
  }

  return {
    services,
    weeklySchedule: createWeeklySchedule(),
    blockedPeriods: [
      {
        id: createId('block'),
        date: toDateInputValue(addDays(new Date(), 3)),
        start: '13:30',
        end: '16:00',
        allDay: false,
        reason: 'Curso de atualização',
      },
      {
        id: createId('block'),
        date: toDateInputValue(addDays(new Date(), 6)),
        start: '00:00',
        end: '23:59',
        allDay: true,
        reason: 'Dia de descanso',
      },
    ],
    appointments,
    notifications: appointments.flatMap((appointment) => {
      const service = services.find((item) => item.id === appointment.serviceId)!
      return buildCreatedNotifications(appointment, service, settings)
    }),
    settings,
  }
}
