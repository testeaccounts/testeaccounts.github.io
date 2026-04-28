import type {
  AppointmentItem,
  NotificationItem,
  NotificationKind,
  NotificationStatus,
  SalonSettings,
  ServiceItem,
} from '../types/domain'
import { combineDateTime, formatDateTimeLabel } from './dateTime'
import { formatServicePrice } from './format'

function createId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
}

function buildNotification(
  appointmentId: string,
  kind: NotificationKind,
  status: NotificationStatus,
  scheduledFor: string,
  channel: NotificationItem['channel'],
  recipient: string,
  title: string,
  message: string,
) {
  return {
    id: createId('notification'),
    appointmentId,
    kind,
    status,
    scheduledFor,
    channel,
    recipient,
    title,
    message,
    createdAt: new Date().toISOString(),
  } satisfies NotificationItem
}

function resolveStatus(scheduledFor: string): NotificationStatus {
  return new Date(scheduledFor) <= new Date() ? 'ready' : 'pending'
}

export function hydrateNotificationStatuses(notifications: NotificationItem[]) {
  let changed = false

  const next = notifications.map((notification) => {
    if (
      notification.status === 'pending' &&
      new Date(notification.scheduledFor) <= new Date()
    ) {
      changed = true
      return {
        ...notification,
        status: 'ready' as const,
      }
    }

    return notification
  })

  return changed ? next : notifications
}

export function cancelReminderNotifications(
  notifications: NotificationItem[],
  appointmentId: string,
) {
  let changed = false

  const next = notifications.map((notification) => {
    if (
      notification.appointmentId === appointmentId &&
      notification.kind === 'booking_reminder' &&
      (notification.status === 'pending' || notification.status === 'ready')
    ) {
      changed = true
      return {
        ...notification,
        status: 'cancelled' as const,
      }
    }

    return notification
  })

  return changed ? next : notifications
}

export function buildCreatedNotifications(
  appointment: AppointmentItem,
  service: ServiceItem,
  settings: SalonSettings,
) {
  const appointmentDateTime = combineDateTime(
    appointment.date,
    appointment.startTime,
  )
  const reminderDateTime = new Date(
    appointmentDateTime.getTime() - settings.reminderLeadMinutes * 60 * 1000,
  )
  const scheduledLabel = formatDateTimeLabel(
    appointment.date,
    appointment.startTime,
  )

  return hydrateNotificationStatuses([
    buildNotification(
      appointment.id,
      'booking_confirmation',
      'ready',
      new Date().toISOString(),
      'whatsapp',
      appointment.client.phone,
      'Confirmação de horário',
      `Oi, ${appointment.client.name}! Seu horário para ${service.name} foi confirmado para ${scheduledLabel}. Valor previsto: ${formatServicePrice(service.price)}.`,
    ),
    buildNotification(
      appointment.id,
      'booking_reminder',
      resolveStatus(reminderDateTime.toISOString()),
      reminderDateTime.toISOString(),
      'whatsapp',
      appointment.client.phone,
      'Lembrete de atendimento',
      `Passando para lembrar do seu atendimento de ${service.name} com a ${settings.ownerName} em ${scheduledLabel}.`,
    ),
    buildNotification(
      appointment.id,
      'new_booking_alert',
      'ready',
      new Date().toISOString(),
      'internal',
      settings.adminWhatsapp,
      'Novo agendamento recebido',
      `${appointment.client.name} acabou de agendar ${service.name} para ${scheduledLabel}.`,
    ),
  ])
}

export function buildCancelledNotifications(
  appointment: AppointmentItem,
  service: ServiceItem,
  settings: SalonSettings,
) {
  const scheduledLabel = formatDateTimeLabel(
    appointment.date,
    appointment.startTime,
  )

  return [
    buildNotification(
      appointment.id,
      'booking_cancelled',
      'ready',
      new Date().toISOString(),
      'whatsapp',
      appointment.client.phone,
      'Cancelamento do horário',
      `Seu horário de ${service.name}, marcado para ${scheduledLabel}, foi cancelado. Se quiser, podemos remarcar um novo horário.`,
    ),
    buildNotification(
      appointment.id,
      'booking_cancelled',
      'ready',
      new Date().toISOString(),
      'internal',
      settings.adminWhatsapp,
      'Agendamento cancelado',
      `${appointment.client.name} teve o agendamento de ${service.name} cancelado (${scheduledLabel}).`,
    ),
  ]
}

export function buildRescheduledNotifications(
  appointment: AppointmentItem,
  service: ServiceItem,
  settings: SalonSettings,
) {
  const appointmentDateTime = combineDateTime(
    appointment.date,
    appointment.startTime,
  )
  const reminderDateTime = new Date(
    appointmentDateTime.getTime() - settings.reminderLeadMinutes * 60 * 1000,
  )
  const scheduledLabel = formatDateTimeLabel(
    appointment.date,
    appointment.startTime,
  )

  return hydrateNotificationStatuses([
    buildNotification(
      appointment.id,
      'booking_rescheduled',
      'ready',
      new Date().toISOString(),
      'whatsapp',
      appointment.client.phone,
      'Horário remarcado',
      `Seu atendimento de ${service.name} foi remarcado para ${scheduledLabel}.`,
    ),
    buildNotification(
      appointment.id,
      'booking_reminder',
      resolveStatus(reminderDateTime.toISOString()),
      reminderDateTime.toISOString(),
      'whatsapp',
      appointment.client.phone,
      'Novo lembrete de atendimento',
      `Lembrete atualizado: ${service.name} com ${settings.ownerName} em ${scheduledLabel}.`,
    ),
    buildNotification(
      appointment.id,
      'booking_rescheduled',
      'ready',
      new Date().toISOString(),
      'internal',
      settings.adminWhatsapp,
      'Agendamento remarcado',
      `${appointment.client.name} ficou com o atendimento de ${service.name} reagendado para ${scheduledLabel}.`,
    ),
  ])
}
