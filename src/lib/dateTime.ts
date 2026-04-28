import { addDays, format, parseISO, set, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function toDateInputValue(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

export function todayIso() {
  return toDateInputValue(new Date())
}

export function addDaysIso(dateIso: string, amount: number) {
  return toDateInputValue(addDays(parseISO(dateIso), amount))
}

export function buildUpcomingDates(days: number) {
  return Array.from({ length: days }, (_, index) =>
    toDateInputValue(addDays(startOfDay(new Date()), index)),
  )
}

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(totalMinutes: number) {
  const safeMinutes = Math.max(0, totalMinutes)
  const hours = Math.floor(safeMinutes / 60)
  const minutes = safeMinutes % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function addMinutesToTime(time: string, minutesToAdd: number) {
  return minutesToTime(timeToMinutes(time) + minutesToAdd)
}

export function combineDateTime(dateIso: string, time: string) {
  const [hours, minutes] = time.split(':').map(Number)

  return set(parseISO(dateIso), {
    hours,
    minutes,
    seconds: 0,
    milliseconds: 0,
  })
}

export function isPastCalendarDay(dateIso: string) {
  return parseISO(dateIso) < startOfDay(new Date())
}

export function formatShortDate(dateIso: string) {
  return format(parseISO(dateIso), "EEE',' dd/MM", {
    locale: ptBR,
  })
}

export function formatLongDate(dateIso: string) {
  return format(parseISO(dateIso), "EEEE',' dd 'de' MMMM", {
    locale: ptBR,
  })
}

export function formatDateTimeLabel(dateIso: string, time: string) {
  return format(combineDateTime(dateIso, time), "dd/MM 'às' HH:mm", {
    locale: ptBR,
  })
}

export function formatTimestamp(dateTimeIso: string) {
  return format(parseISO(dateTimeIso), "dd/MM 'às' HH:mm", {
    locale: ptBR,
  })
}

export function getWeekday(dateIso: string) {
  return parseISO(dateIso).getDay()
}
