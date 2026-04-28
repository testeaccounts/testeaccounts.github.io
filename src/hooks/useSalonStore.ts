import { useEffect, useEffectEvent, useState } from 'react'
import { createSeedState } from '../data/seed'
import { addMinutesToTime } from '../lib/dateTime'
import {
  buildCancelledNotifications,
  buildCreatedNotifications,
  buildRescheduledNotifications,
  cancelReminderNotifications,
  hydrateNotificationStatuses,
} from '../lib/notifications'
import { getAvailableSlots, getServiceById, isSlotAvailable, sortAppointments } from '../lib/scheduling'
import type {
  ActionResult,
  AppointmentItem,
  BookingDraft,
  NotificationItem,
  SalonState,
  ServiceItem,
  WeeklyScheduleDay,
} from '../types/domain'

const STORAGE_KEY = 'alyssa-unhas::salon-state::v1'

function createId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
}

function readState() {
  const fallback = createSeedState()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return fallback
    }

    return hydrateState(JSON.parse(raw) as SalonState)
  } catch {
    return fallback
  }
}

function hydrateState(state: SalonState) {
  return {
    ...state,
    notifications: hydrateNotificationStatuses(state.notifications),
    appointments: sortAppointments(state.appointments),
  }
}

function persistState(state: SalonState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function buildNextState(state: SalonState, notifications: NotificationItem[]) {
  const hydratedNotifications = hydrateNotificationStatuses(notifications)

  return {
    ...state,
    notifications: hydratedNotifications,
    appointments: sortAppointments(state.appointments),
  }
}

export interface SalonActions {
  createAppointment: (draft: BookingDraft) => ActionResult<AppointmentItem>
  updateAppointmentStatus: (
    appointmentId: string,
    status: AppointmentItem['status'],
  ) => ActionResult<AppointmentItem>
  rescheduleAppointment: (
    appointmentId: string,
    date: string,
    startTime: string,
  ) => ActionResult<AppointmentItem>
  upsertService: (
    values: Omit<ServiceItem, 'id'> & { id?: string },
  ) => ActionResult<ServiceItem>
  toggleServiceActive: (serviceId: string) => void
  updateWeeklySchedule: (days: WeeklyScheduleDay[]) => void
  addBlockedPeriod: (values: {
    date: string
    start: string
    end: string
    allDay: boolean
    reason: string
  }) => ActionResult
  removeBlockedPeriod: (blockId: string) => void
  markNotificationSent: (notificationId: string) => void
  resetDemoData: () => void
}

export function useSalonStore() {
  const [state, setState] = useState<SalonState>(() => readState())

  useEffect(() => {
    persistState(state)
  }, [state])

  const syncNotifications = useEffectEvent(() => {
    setState((current) => {
      const nextNotifications = hydrateNotificationStatuses(current.notifications)

      if (nextNotifications === current.notifications) {
        return current
      }

      return {
        ...current,
        notifications: nextNotifications,
      }
    })
  })

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      syncNotifications()
    }, 60_000)

    return () => window.clearInterval(intervalId)
  }, [])

  const actions: SalonActions = {
    createAppointment(draft) {
      let result: ActionResult<AppointmentItem> = {
        ok: false,
        error: 'Não foi possível salvar o agendamento.',
      }

      setState((current) => {
        const service = getServiceById(current, draft.serviceId)

        if (!service || !service.active) {
          result = {
            ok: false,
            error: 'Escolha um serviço disponível para continuar.',
          }
          return current
        }

        if (!isSlotAvailable(current, draft.serviceId, draft.date, draft.startTime)) {
          result = {
            ok: false,
            error:
              'Esse horário acabou de ser ocupado. Escolha outro horário livre.',
          }
          return current
        }

        const appointment: AppointmentItem = {
          id: createId('appointment'),
          serviceId: draft.serviceId,
          date: draft.date,
          startTime: draft.startTime,
          endTime: addMinutesToTime(draft.startTime, service.durationMinutes),
          status: 'confirmed',
          client: {
            name: draft.name.trim(),
            phone: draft.phone,
            email: draft.email.trim(),
          },
          notes: draft.notes.trim(),
          origin: 'self-service',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        const notifications = [
          ...current.notifications,
          ...buildCreatedNotifications(appointment, service, current.settings),
        ]

        result = {
          ok: true,
          data: appointment,
        }

        return buildNextState(
          {
            ...current,
            appointments: [...current.appointments, appointment],
          },
          notifications,
        )
      })

      return result
    },
    updateAppointmentStatus(appointmentId, status) {
      let result: ActionResult<AppointmentItem> = {
        ok: false,
        error: 'Agendamento não encontrado.',
      }

      setState((current) => {
        const currentAppointment = current.appointments.find(
          (appointment) => appointment.id === appointmentId,
        )

        if (!currentAppointment) {
          return current
        }

        const service = getServiceById(current, currentAppointment.serviceId)

        if (!service) {
          result = {
            ok: false,
            error: 'Serviço desse agendamento não foi encontrado.',
          }
          return current
        }

        const updatedAppointment = {
          ...currentAppointment,
          status,
          updatedAt: new Date().toISOString(),
        }

        let notifications = current.notifications

        if (status === 'cancelled') {
          notifications = cancelReminderNotifications(notifications, appointmentId)
          notifications = [
            ...notifications,
            ...buildCancelledNotifications(
              updatedAppointment,
              service,
              current.settings,
            ),
          ]
        }

        result = {
          ok: true,
          data: updatedAppointment,
        }

        return buildNextState(
          {
            ...current,
            appointments: current.appointments.map((appointment) =>
              appointment.id === appointmentId ? updatedAppointment : appointment,
            ),
          },
          notifications,
        )
      })

      return result
    },
    rescheduleAppointment(appointmentId, date, startTime) {
      let result: ActionResult<AppointmentItem> = {
        ok: false,
        error: 'Não foi possível reagendar agora.',
      }

      setState((current) => {
        const currentAppointment = current.appointments.find(
          (appointment) => appointment.id === appointmentId,
        )

        if (!currentAppointment) {
          result = {
            ok: false,
            error: 'Agendamento não encontrado.',
          }
          return current
        }

        const service = getServiceById(current, currentAppointment.serviceId)

        if (!service) {
          result = {
            ok: false,
            error: 'Serviço desse agendamento não foi encontrado.',
          }
          return current
        }

        if (
          !isSlotAvailable(
            current,
            currentAppointment.serviceId,
            date,
            startTime,
            appointmentId,
          )
        ) {
          result = {
            ok: false,
            error: 'Esse novo horário não está disponível.',
          }
          return current
        }

        const updatedAppointment = {
          ...currentAppointment,
          date,
          startTime,
          endTime: addMinutesToTime(startTime, service.durationMinutes),
          status: 'rescheduled' as const,
          updatedAt: new Date().toISOString(),
        }

        let notifications = cancelReminderNotifications(
          current.notifications,
          appointmentId,
        )

        notifications = [
          ...notifications,
          ...buildRescheduledNotifications(
            updatedAppointment,
            service,
            current.settings,
          ),
        ]

        result = {
          ok: true,
          data: updatedAppointment,
        }

        return buildNextState(
          {
            ...current,
            appointments: current.appointments.map((appointment) =>
              appointment.id === appointmentId ? updatedAppointment : appointment,
            ),
          },
          notifications,
        )
      })

      return result
    },
    upsertService(values) {
      let result: ActionResult<ServiceItem> = {
        ok: false,
        error: 'Não foi possível salvar o serviço.',
      }

      setState((current) => {
        const normalizedName = values.name.trim()

        if (!normalizedName) {
          result = {
            ok: false,
            error: 'Informe um nome para o serviço.',
          }
          return current
        }

        const service: ServiceItem = {
          ...values,
          id: values.id ?? createId('service'),
          name: normalizedName,
          description: values.description.trim(),
        }

        const alreadyExists = current.services.some((item) => item.id === service.id)

        result = {
          ok: true,
          data: service,
        }

        return {
          ...current,
          services: alreadyExists
            ? current.services.map((item) => (item.id === service.id ? service : item))
            : [...current.services, service],
        }
      })

      return result
    },
    toggleServiceActive(serviceId) {
      setState((current) => ({
        ...current,
        services: current.services.map((service) =>
          service.id === serviceId
            ? {
                ...service,
                active: !service.active,
              }
            : service,
        ),
      }))
    },
    updateWeeklySchedule(days) {
      setState((current) => ({
        ...current,
        weeklySchedule: days.map((day) => ({
          ...day,
          periods: day.periods.filter(
            (period) => period.start.trim() && period.end.trim(),
          ),
        })),
      }))
    },
    addBlockedPeriod(values) {
      if (!values.date) {
        return {
          ok: false,
          error: 'Escolha a data do bloqueio.',
        }
      }

      if (!values.reason.trim()) {
        return {
          ok: false,
          error: 'Descreva o motivo do bloqueio.',
        }
      }

      if (!values.allDay && (!values.start || !values.end || values.start >= values.end)) {
        return {
          ok: false,
          error: 'Defina um intervalo válido para o bloqueio.',
        }
      }

      setState((current) => ({
        ...current,
        blockedPeriods: [
          ...current.blockedPeriods,
          {
            id: createId('block'),
            date: values.date,
            start: values.allDay ? '00:00' : values.start,
            end: values.allDay ? '23:59' : values.end,
            allDay: values.allDay,
            reason: values.reason.trim(),
          },
        ],
      }))

      return { ok: true }
    },
    removeBlockedPeriod(blockId) {
      setState((current) => ({
        ...current,
        blockedPeriods: current.blockedPeriods.filter((block) => block.id !== blockId),
      }))
    },
    markNotificationSent(notificationId) {
      setState((current) => ({
        ...current,
        notifications: current.notifications.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                status: 'sent',
              }
            : notification,
        ),
      }))
    },
    resetDemoData() {
      setState(createSeedState())
    },
  }

  return {
    state,
    actions,
    getAvailableSlots: (
      serviceId: string,
      date: string,
      ignoreAppointmentId?: string,
    ) => getAvailableSlots(state, serviceId, date, ignoreAppointmentId),
  }
}
