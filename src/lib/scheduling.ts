import type {
  AppointmentItem,
  AppointmentStatus,
  SalonState,
  SlotOption,
  TimeRange,
} from '../types/domain'
import {
  addMinutesToTime,
  combineDateTime,
  getWeekday,
  isPastCalendarDay,
  timeToMinutes,
} from './dateTime'

export const blockingStatuses: AppointmentStatus[] = [
  'pending',
  'confirmed',
  'rescheduled',
]

export function isBlockingStatus(status: AppointmentStatus) {
  return blockingStatuses.includes(status)
}

export function rangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
) {
  return timeToMinutes(startA) < timeToMinutes(endB) &&
    timeToMinutes(endA) > timeToMinutes(startB)
}

export function getServiceById(state: SalonState, serviceId: string) {
  return state.services.find((service) => service.id === serviceId)
}

function getScheduleMinutes(periods: TimeRange[]) {
  return periods.reduce(
    (total, period) => total + Math.max(0, timeToMinutes(period.end) - timeToMinutes(period.start)),
    0,
  )
}

export function getAvailableSlots(
  state: SalonState,
  serviceId: string,
  date: string,
  ignoreAppointmentId?: string,
) {
  const service = getServiceById(state, serviceId)

  if (!service || !service.active || isPastCalendarDay(date)) {
    return [] satisfies SlotOption[]
  }

  const daySchedule = state.weeklySchedule.find(
    (item) => item.weekday === getWeekday(date),
  )

  if (!daySchedule?.enabled || !daySchedule.periods.length) {
    return [] satisfies SlotOption[]
  }

  const dayBlocks = state.blockedPeriods.filter((block) => block.date === date)

  if (dayBlocks.some((block) => block.allDay)) {
    return [] satisfies SlotOption[]
  }

  const dayAppointments = state.appointments.filter(
    (appointment) =>
      appointment.date === date &&
      appointment.id !== ignoreAppointmentId &&
      isBlockingStatus(appointment.status),
  )

  const slots: SlotOption[] = []

  for (const period of daySchedule.periods) {
    for (
      let cursor = timeToMinutes(period.start);
      cursor + service.durationMinutes <= timeToMinutes(period.end);
      cursor += state.settings.slotIntervalMinutes
    ) {
      const startTime = `${String(Math.floor(cursor / 60)).padStart(2, '0')}:${String(cursor % 60).padStart(2, '0')}`
      const endTime = addMinutesToTime(startTime, service.durationMinutes)

      const blockedByPeriod = dayBlocks.some((block) =>
        rangesOverlap(startTime, endTime, block.start, block.end),
      )

      const blockedByAppointment = dayAppointments.some((appointment) =>
        rangesOverlap(
          startTime,
          endTime,
          appointment.startTime,
          appointment.endTime,
        ),
      )

      if (!blockedByPeriod && !blockedByAppointment) {
        slots.push({
          startTime,
          endTime,
          label: `${startTime} - ${endTime}`,
        })
      }
    }
  }

  return slots
}

export function isSlotAvailable(
  state: SalonState,
  serviceId: string,
  date: string,
  startTime: string,
  ignoreAppointmentId?: string,
) {
  return getAvailableSlots(state, serviceId, date, ignoreAppointmentId).some(
    (slot) => slot.startTime === startTime,
  )
}

export function sortAppointments(appointments: AppointmentItem[]) {
  return [...appointments].sort(
    (left, right) =>
      combineDateTime(left.date, left.startTime).getTime() -
      combineDateTime(right.date, right.startTime).getTime(),
  )
}

export function getUpcomingAppointments(state: SalonState, limit = 6) {
  const now = new Date()

  return sortAppointments(
    state.appointments.filter(
      (appointment) =>
        isBlockingStatus(appointment.status) &&
        combineDateTime(appointment.date, appointment.startTime) >= now,
    ),
  ).slice(0, limit)
}

export function calculateDayOccupancy(state: SalonState, date: string) {
  const daySchedule = state.weeklySchedule.find(
    (item) => item.weekday === getWeekday(date),
  )

  if (!daySchedule?.enabled || !daySchedule.periods.length) {
    return 0
  }

  const scheduleMinutes = getScheduleMinutes(daySchedule.periods)
  const reservedMinutes = state.appointments
    .filter(
      (appointment) =>
        appointment.date === date && isBlockingStatus(appointment.status),
    )
    .reduce(
      (total, appointment) =>
        total + (timeToMinutes(appointment.endTime) - timeToMinutes(appointment.startTime)),
      0,
    )

  if (!scheduleMinutes) {
    return 0
  }

  return Math.min(100, Math.round((reservedMinutes / scheduleMinutes) * 100))
}

export function calculateProjectedRevenue(state: SalonState, fromDate?: string) {
  return state.appointments
    .filter(
      (appointment) =>
        appointment.status !== 'cancelled' &&
        (!fromDate || appointment.date >= fromDate),
    )
    .reduce((total, appointment) => {
      const service = getServiceById(state, appointment.serviceId)
      return total + (service?.price ?? 0)
    }, 0)
}

export function getUniqueClients(state: SalonState) {
  const uniqueMap = new Map<
    string,
    { name: string; phone: string; email?: string; lastVisit: string; appointments: number }
  >()

  for (const appointment of sortAppointments(state.appointments)) {
    const key = appointment.client.phone
    const current = uniqueMap.get(key)

    if (!current) {
      uniqueMap.set(key, {
        name: appointment.client.name,
        phone: appointment.client.phone,
        email: appointment.client.email,
        lastVisit: `${appointment.date}T${appointment.startTime}:00`,
        appointments: 1,
      })
      continue
    }

    uniqueMap.set(key, {
      ...current,
      name: appointment.client.name,
      email: appointment.client.email || current.email,
      lastVisit: `${appointment.date}T${appointment.startTime}:00`,
      appointments: current.appointments + 1,
    })
  }

  return [...uniqueMap.values()].sort(
    (left, right) =>
      new Date(right.lastVisit).getTime() - new Date(left.lastVisit).getTime(),
  )
}
