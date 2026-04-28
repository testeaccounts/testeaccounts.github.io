import { useEffect, useRef, useState } from 'react'
import type { User } from 'firebase/auth'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { createSeedState, DEFAULT_DATA_VERSION } from '../data/seed'
import { addMinutesToTime } from '../lib/dateTime'
import { firebaseAuth, firestoreDb } from '../lib/firebase'
import {
  buildCancelledNotifications,
  buildCreatedNotifications,
  buildRescheduledNotifications,
  cancelReminderNotifications,
  hydrateNotificationStatuses,
} from '../lib/notifications'
import {
  buildSlotTimes,
  getAvailableSlots,
  getServiceById,
  isSlotAvailable,
  sortAppointments,
} from '../lib/scheduling'
import type {
  ActionResult,
  AdminCredentials,
  AppointmentItem,
  BookingDraft,
  NotificationItem,
  SalonState,
  ServiceItem,
  SlotLockItem,
  WeeklyScheduleDay,
} from '../types/domain'

const seedState = createSeedState()
const salonDocRef = doc(firestoreDb, 'salon', 'config')
const servicesCollectionRef = collection(firestoreDb, 'services')
const blockedPeriodsCollectionRef = collection(firestoreDb, 'blockedPeriods')
const slotLocksCollectionRef = collection(firestoreDb, 'slotLocks')
const appointmentsCollectionRef = collection(firestoreDb, 'appointments')
const notificationsCollectionRef = collection(firestoreDb, 'notifications')

const LEGACY_SERVICE_IDS = new Set([
  'manicure-russa',
  'blindagem-flex',
  'spa-dos-pes',
  'pedicure-classica',
  'combo-executivo',
  'alongamento-gel',
])

const EMPTY_STATE: SalonState = {
  ...seedState,
  services: [],
  weeklySchedule: [],
  blockedPeriods: [],
  slotLocks: [],
  appointments: [],
  notifications: [],
}

function createId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
}

function createSlotLockId(date: string, time: string) {
  return `${date}_${time}`
}

function buildStateWithNotifications(state: SalonState) {
  return {
    ...state,
    notifications: hydrateNotificationStatuses(state.notifications),
    appointments: sortAppointments(state.appointments),
  }
}

function toTypedList<T>(items: unknown[]) {
  return items as T[]
}

async function replaceRemoteState(currentState: SalonState, nextState: SalonState) {
  const batch = writeBatch(firestoreDb)

  batch.set(salonDocRef, {
    settings: nextState.settings,
    weeklySchedule: nextState.weeklySchedule,
  })

  for (const service of currentState.services) {
    batch.delete(doc(servicesCollectionRef, service.id))
  }
  for (const block of currentState.blockedPeriods) {
    batch.delete(doc(blockedPeriodsCollectionRef, block.id))
  }
  for (const slotLock of currentState.slotLocks) {
    batch.delete(doc(slotLocksCollectionRef, slotLock.id))
  }
  for (const appointment of currentState.appointments) {
    batch.delete(doc(appointmentsCollectionRef, appointment.id))
  }
  for (const notification of currentState.notifications) {
    batch.delete(doc(notificationsCollectionRef, notification.id))
  }

  for (const service of nextState.services) {
    batch.set(doc(servicesCollectionRef, service.id), service)
  }
  for (const block of nextState.blockedPeriods) {
    batch.set(doc(blockedPeriodsCollectionRef, block.id), block)
  }
  for (const slotLock of nextState.slotLocks) {
    batch.set(doc(slotLocksCollectionRef, slotLock.id), slotLock)
  }
  for (const appointment of nextState.appointments) {
    batch.set(doc(appointmentsCollectionRef, appointment.id), appointment)
  }
  for (const notification of nextState.notifications) {
    batch.set(doc(notificationsCollectionRef, notification.id), notification)
  }

  await batch.commit()
}

async function bootstrapRemoteState() {
  const existingSalon = await getDoc(salonDocRef)

  if (existingSalon.exists()) {
    return
  }

  await replaceRemoteState(EMPTY_STATE, seedState)
}

async function syncRemoteSettingsVersion(currentState: SalonState) {
  const nextSeed = createSeedState()

  await setDoc(
    salonDocRef,
    {
      settings: {
        ...currentState.settings,
        dataVersion: DEFAULT_DATA_VERSION,
        tagline: currentState.settings.tagline || nextSeed.settings.tagline,
        addressLabel:
          currentState.settings.addressLabel || nextSeed.settings.addressLabel,
        mapUrl: currentState.settings.mapUrl || nextSeed.settings.mapUrl,
        highlights:
          currentState.settings.highlights?.length
            ? currentState.settings.highlights
            : nextSeed.settings.highlights,
        policies:
          currentState.settings.policies?.length
            ? currentState.settings.policies
            : nextSeed.settings.policies,
      },
    },
    { merge: true },
  )
}

function hasLegacyCatalog(state: SalonState) {
  return state.services.some((service) => LEGACY_SERVICE_IDS.has(service.id))
}

function isSeedVersionOutdated(state: SalonState) {
  return (state.settings.dataVersion ?? 0) < DEFAULT_DATA_VERSION
}

export interface SalonActions {
  createAppointment: (draft: BookingDraft) => Promise<ActionResult<AppointmentItem>>
  createManualAppointment: (
    draft: BookingDraft,
  ) => Promise<ActionResult<AppointmentItem>>
  updateAppointmentStatus: (
    appointmentId: string,
    status: AppointmentItem['status'],
  ) => Promise<ActionResult<AppointmentItem>>
  rescheduleAppointment: (
    appointmentId: string,
    date: string,
    startTime: string,
  ) => Promise<ActionResult<AppointmentItem>>
  upsertService: (
    values: Omit<ServiceItem, 'id'> & { id?: string },
  ) => Promise<ActionResult<ServiceItem>>
  toggleServiceActive: (serviceId: string) => Promise<ActionResult>
  updateWeeklySchedule: (days: WeeklyScheduleDay[]) => Promise<ActionResult>
  addBlockedPeriod: (values: {
    date: string
    start: string
    end: string
    allDay: boolean
    reason: string
  }) => Promise<ActionResult>
  removeBlockedPeriod: (blockId: string) => Promise<ActionResult>
  markNotificationSent: (notificationId: string) => Promise<ActionResult>
  resetDemoData: () => Promise<ActionResult>
}

function buildSlotLocksForAppointment(
  appointment: AppointmentItem,
  durationMinutes: number,
  slotIntervalMinutes: number,
) {
  return buildSlotTimes(
    appointment.startTime,
    durationMinutes,
    slotIntervalMinutes,
  ).map(
    (time) =>
      ({
        id: createSlotLockId(appointment.date, time),
        appointmentId: appointment.id,
        date: appointment.date,
        time,
        createdAt: appointment.createdAt,
      }) satisfies SlotLockItem,
  )
}

export function useSalonStore() {
  const [state, setState] = useState<SalonState>(EMPTY_STATE)
  const [loading, setLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false)
  const [adminUser, setAdminUser] = useState<User | null>(null)
  const [syncError, setSyncError] = useState('')
  const stateRef = useRef(state)
  const bootstrapAttemptedRef = useRef(false)
  const migrationAttemptedRef = useRef(false)
  const loadStateRef = useRef({
    config: false,
    services: false,
    blocks: false,
    slotLocks: false,
    appointments: false,
    notifications: false,
  })

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        setLoading(true)
      }
      setAdminUser(user)
      setAuthReady(true)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    let mounted = true

    function markLoaded(
      key: keyof typeof loadStateRef.current,
      needsAdmin = false,
    ) {
      loadStateRef.current[key] = true

      if (!mounted) {
        return
      }

      const publicReady =
        loadStateRef.current.config &&
        loadStateRef.current.services &&
        loadStateRef.current.blocks &&
        loadStateRef.current.slotLocks

      const adminReady = !adminUser
        ? true
        : loadStateRef.current.appointments && loadStateRef.current.notifications

      if (publicReady && adminReady) {
        setLoading(false)
      } else if (needsAdmin && !adminUser) {
        setLoading(false)
      }
    }

    if (adminUser) {
      loadStateRef.current.appointments = false
      loadStateRef.current.notifications = false
    } else {
      loadStateRef.current.appointments = true
      loadStateRef.current.notifications = true
    }

    const unsubscribers = [
      onSnapshot(
        salonDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as {
              settings: SalonState['settings']
              weeklySchedule: SalonState['weeklySchedule']
            }

            setState((current) => ({
              ...current,
              settings: data.settings,
              weeklySchedule: toTypedList(data.weeklySchedule),
            }))
          }

          markLoaded('config')
        },
        (error) => {
          setSyncError(error.message)
          markLoaded('config')
        },
      ),
      onSnapshot(
        servicesCollectionRef,
        (snapshot) => {
          setState((current) => ({
            ...current,
            services: snapshot.docs.map((item) => item.data() as ServiceItem),
          }))
          markLoaded('services')
        },
        (error) => {
          setSyncError(error.message)
          markLoaded('services')
        },
      ),
      onSnapshot(
        blockedPeriodsCollectionRef,
        (snapshot) => {
          setState((current) => ({
            ...current,
            blockedPeriods: snapshot.docs.map(
              (item) => item.data() as SalonState['blockedPeriods'][number],
            ),
          }))
          markLoaded('blocks')
        },
        (error) => {
          setSyncError(error.message)
          markLoaded('blocks')
        },
      ),
      onSnapshot(
        slotLocksCollectionRef,
        (snapshot) => {
          setState((current) => ({
            ...current,
            slotLocks: snapshot.docs.map((item) => item.data() as SlotLockItem),
          }))
          markLoaded('slotLocks')
        },
        (error) => {
          setSyncError(error.message)
          markLoaded('slotLocks')
        },
      ),
    ]

    if (adminUser) {
      unsubscribers.push(
        onSnapshot(
          appointmentsCollectionRef,
          (snapshot) => {
            setState((current) => ({
              ...current,
              appointments: snapshot.docs.map(
                (item) => item.data() as AppointmentItem,
              ),
            }))
            markLoaded('appointments', true)
          },
          (error) => {
            setSyncError(error.message)
            markLoaded('appointments', true)
          },
        ),
      )

      unsubscribers.push(
        onSnapshot(
          notificationsCollectionRef,
          (snapshot) => {
            setState((current) =>
              buildStateWithNotifications({
                ...current,
                notifications: snapshot.docs.map(
                  (item) => item.data() as NotificationItem,
                ),
              }),
            )
            markLoaded('notifications', true)
          },
          (error) => {
            setSyncError(error.message)
            markLoaded('notifications', true)
          },
        ),
      )
    }

    return () => {
      mounted = false
      for (const unsubscribe of unsubscribers) {
        unsubscribe()
      }
    }
  }, [adminUser])

  useEffect(() => {
    if (loading || bootstrapAttemptedRef.current || !adminUser) {
      return
    }

    const noRemoteBase =
      !state.services.length && !state.weeklySchedule.length && !state.blockedPeriods.length

    if (!noRemoteBase) {
      return
    }

    bootstrapAttemptedRef.current = true
    void bootstrapRemoteState().catch((error: Error) => {
      bootstrapAttemptedRef.current = false
      setSyncError(error.message)
    })
  }, [
    adminUser,
    loading,
    state.blockedPeriods.length,
    state.services.length,
    state.weeklySchedule.length,
  ])

  useEffect(() => {
    if (loading || migrationAttemptedRef.current || !adminUser) {
      return
    }

    const currentState = stateRef.current

    if (!currentState.services.length || !isSeedVersionOutdated(currentState)) {
      return
    }

    migrationAttemptedRef.current = true

    const migrationTask = hasLegacyCatalog(currentState)
      ? replaceRemoteState(currentState, createSeedState())
      : syncRemoteSettingsVersion(currentState)

    void migrationTask.catch((error: Error) => {
      migrationAttemptedRef.current = false
      setSyncError(error.message)
    })
  }, [adminUser, loading, state.services.length, state.settings.dataVersion])

  async function requireAdmin() {
    if (!firebaseAuth.currentUser) {
      return {
        ok: false,
        error: 'Entre com a conta da Alyssa para acessar essa ação.',
      } satisfies ActionResult
    }

    return { ok: true } satisfies ActionResult
  }

  async function createAppointmentWithOrigin(
    draft: BookingDraft,
    origin: AppointmentItem['origin'],
  ) {
    const currentState = stateRef.current
    const service = getServiceById(currentState, draft.serviceId)

    if (!service || !service.active) {
      return {
        ok: false,
        error: 'Escolha um serviço disponível para continuar.',
      } satisfies ActionResult<AppointmentItem>
    }

    if (!isSlotAvailable(currentState, draft.serviceId, draft.date, draft.startTime)) {
      return {
        ok: false,
        error: 'Esse horário acabou de ser ocupado. Escolha outro horário livre.',
      } satisfies ActionResult<AppointmentItem>
    }

    const createdAt = new Date().toISOString()
    const appointmentId = createId('appointment')
    const appointment: AppointmentItem = {
      id: appointmentId,
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
      origin,
      createdAt,
      updatedAt: createdAt,
    }

    const notifications = buildCreatedNotifications(
      appointment,
      service,
      currentState.settings,
    )
    const slotLocks = buildSlotLocksForAppointment(
      appointment,
      service.durationMinutes,
      currentState.settings.slotIntervalMinutes,
    )

    try {
      await runTransaction(firestoreDb, async (transaction) => {
        for (const slotLock of slotLocks) {
          const lockRef = doc(slotLocksCollectionRef, slotLock.id)
          const lockSnapshot = await transaction.get(lockRef)

          if (lockSnapshot.exists()) {
            throw new Error(
              'Esse horário acabou de ser ocupado. Escolha outro horário livre.',
            )
          }
        }

        transaction.set(doc(appointmentsCollectionRef, appointment.id), appointment)

        for (const slotLock of slotLocks) {
          transaction.set(doc(slotLocksCollectionRef, slotLock.id), slotLock)
        }

        for (const notification of notifications) {
          transaction.set(
            doc(notificationsCollectionRef, notification.id),
            notification,
          )
        }
      })

      return {
        ok: true,
        data: appointment,
      } satisfies ActionResult<AppointmentItem>
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar o agendamento.',
      } satisfies ActionResult<AppointmentItem>
    }
  }

  const actions: SalonActions = {
    createAppointment(draft) {
      return createAppointmentWithOrigin(draft, 'self-service')
    },
    async createManualAppointment(draft) {
      const adminCheck = await requireAdmin()

      if (!adminCheck.ok) {
        return adminCheck
      }

      return createAppointmentWithOrigin(draft, 'admin')
    },
    async updateAppointmentStatus(appointmentId, status) {
      const adminCheck = await requireAdmin()

      if (!adminCheck.ok) {
        return adminCheck
      }

      const currentState = stateRef.current
      const currentAppointment = currentState.appointments.find(
        (appointment) => appointment.id === appointmentId,
      )

      if (!currentAppointment) {
        return {
          ok: false,
          error: 'Agendamento não encontrado.',
        } satisfies ActionResult<AppointmentItem>
      }

      const service = getServiceById(currentState, currentAppointment.serviceId)

      if (!service) {
        return {
          ok: false,
          error: 'Serviço desse agendamento não foi encontrado.',
        } satisfies ActionResult<AppointmentItem>
      }

      const updatedAppointment = {
        ...currentAppointment,
        status,
        updatedAt: new Date().toISOString(),
      }

      try {
        await runTransaction(firestoreDb, async (transaction) => {
          transaction.set(
            doc(appointmentsCollectionRef, appointmentId),
            updatedAppointment,
          )

          if (status === 'cancelled') {
            const slotLocks = currentState.slotLocks.filter(
              (slotLock) => slotLock.appointmentId === appointmentId,
            )

            for (const slotLock of slotLocks) {
              transaction.delete(doc(slotLocksCollectionRef, slotLock.id))
            }

            const nextNotifications = [
              ...cancelReminderNotifications(currentState.notifications, appointmentId),
              ...buildCancelledNotifications(
                updatedAppointment,
                service,
                currentState.settings,
              ),
            ]

            for (const notification of nextNotifications.filter(
              (item) => item.appointmentId === appointmentId,
            )) {
              transaction.set(
                doc(notificationsCollectionRef, notification.id),
                notification,
              )
            }
          }
        })

        return {
          ok: true,
          data: updatedAppointment,
        } satisfies ActionResult<AppointmentItem>
      } catch (error) {
        return {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : 'Não foi possível atualizar esse agendamento.',
        } satisfies ActionResult<AppointmentItem>
      }
    },
    async rescheduleAppointment(appointmentId, date, startTime) {
      const adminCheck = await requireAdmin()

      if (!adminCheck.ok) {
        return adminCheck
      }

      const currentState = stateRef.current
      const currentAppointment = currentState.appointments.find(
        (appointment) => appointment.id === appointmentId,
      )

      if (!currentAppointment) {
        return {
          ok: false,
          error: 'Agendamento não encontrado.',
        } satisfies ActionResult<AppointmentItem>
      }

      const service = getServiceById(currentState, currentAppointment.serviceId)

      if (!service) {
        return {
          ok: false,
          error: 'Serviço desse agendamento não foi encontrado.',
        } satisfies ActionResult<AppointmentItem>
      }

      if (
        !isSlotAvailable(
          currentState,
          currentAppointment.serviceId,
          date,
          startTime,
          appointmentId,
        )
      ) {
        return {
          ok: false,
          error: 'Esse novo horário não está disponível.',
        } satisfies ActionResult<AppointmentItem>
      }

      const updatedAppointment: AppointmentItem = {
        ...currentAppointment,
        date,
        startTime,
        endTime: addMinutesToTime(startTime, service.durationMinutes),
        status: 'rescheduled',
        updatedAt: new Date().toISOString(),
      }

      const oldSlotLocks = currentState.slotLocks.filter(
        (slotLock) => slotLock.appointmentId === appointmentId,
      )
      const nextSlotLocks = buildSlotLocksForAppointment(
        updatedAppointment,
        service.durationMinutes,
        currentState.settings.slotIntervalMinutes,
      )

      try {
        await runTransaction(firestoreDb, async (transaction) => {
          for (const slotLock of nextSlotLocks) {
            const lockRef = doc(slotLocksCollectionRef, slotLock.id)
            const lockSnapshot = await transaction.get(lockRef)

            if (
              lockSnapshot.exists() &&
              lockSnapshot.data()?.appointmentId !== appointmentId
            ) {
              throw new Error('Esse novo horário não está disponível.')
            }
          }

          transaction.set(
            doc(appointmentsCollectionRef, appointmentId),
            updatedAppointment,
          )

          for (const slotLock of oldSlotLocks) {
            transaction.delete(doc(slotLocksCollectionRef, slotLock.id))
          }

          for (const slotLock of nextSlotLocks) {
            transaction.set(doc(slotLocksCollectionRef, slotLock.id), slotLock)
          }

          const nextNotifications = [
            ...cancelReminderNotifications(currentState.notifications, appointmentId),
            ...buildRescheduledNotifications(
              updatedAppointment,
              service,
              currentState.settings,
            ),
          ]

          for (const notification of nextNotifications.filter(
            (item) => item.appointmentId === appointmentId,
          )) {
            transaction.set(
              doc(notificationsCollectionRef, notification.id),
              notification,
            )
          }
        })

        return {
          ok: true,
          data: updatedAppointment,
        } satisfies ActionResult<AppointmentItem>
      } catch (error) {
        return {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : 'Não foi possível remarcar agora.',
        } satisfies ActionResult<AppointmentItem>
      }
    },
    async upsertService(values) {
      const adminCheck = await requireAdmin()

      if (!adminCheck.ok) {
        return adminCheck
      }

      const normalizedName = values.name.trim()

      if (!normalizedName) {
        return {
          ok: false,
          error: 'Informe um nome para o serviço.',
        } satisfies ActionResult<ServiceItem>
      }

      const service: ServiceItem = {
        ...values,
        id: values.id ?? createId('service'),
        name: normalizedName,
        description: values.description.trim(),
      }

      try {
        await setDoc(doc(servicesCollectionRef, service.id), service)

        return {
          ok: true,
          data: service,
        } satisfies ActionResult<ServiceItem>
      } catch (error) {
        return {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : 'Não foi possível salvar o serviço.',
        } satisfies ActionResult<ServiceItem>
      }
    },
    async toggleServiceActive(serviceId) {
      const adminCheck = await requireAdmin()

      if (!adminCheck.ok) {
        return adminCheck
      }

      const service = stateRef.current.services.find((item) => item.id === serviceId)

      if (!service) {
        return {
          ok: false,
          error: 'Serviço não encontrado.',
        } satisfies ActionResult
      }

      await updateDoc(doc(servicesCollectionRef, serviceId), {
        active: !service.active,
      })

      return { ok: true } satisfies ActionResult
    },
    async updateWeeklySchedule(days) {
      const adminCheck = await requireAdmin()

      if (!adminCheck.ok) {
        return adminCheck
      }

      await setDoc(
        salonDocRef,
        {
          settings: stateRef.current.settings,
          weeklySchedule: days.map((day) => ({
            ...day,
            periods: day.periods.filter(
              (period) => period.start.trim() && period.end.trim(),
            ),
          })),
        },
        { merge: true },
      )

      return { ok: true } satisfies ActionResult
    },
    async addBlockedPeriod(values) {
      const adminCheck = await requireAdmin()

      if (!adminCheck.ok) {
        return adminCheck
      }

      if (!values.date) {
        return {
          ok: false,
          error: 'Escolha a data do bloqueio.',
        } satisfies ActionResult
      }

      if (!values.reason.trim()) {
        return {
          ok: false,
          error: 'Descreva o motivo do bloqueio.',
        } satisfies ActionResult
      }

      if (
        !values.allDay &&
        (!values.start || !values.end || values.start >= values.end)
      ) {
        return {
          ok: false,
          error: 'Defina um intervalo válido para o bloqueio.',
        } satisfies ActionResult
      }

      const blockId = createId('block')

      await setDoc(doc(blockedPeriodsCollectionRef, blockId), {
        id: blockId,
        date: values.date,
        start: values.allDay ? '00:00' : values.start,
        end: values.allDay ? '23:59' : values.end,
        allDay: values.allDay,
        reason: values.reason.trim(),
      })

      return { ok: true } satisfies ActionResult
    },
    async removeBlockedPeriod(blockId) {
      const adminCheck = await requireAdmin()

      if (!adminCheck.ok) {
        return adminCheck
      }

      await deleteDoc(doc(blockedPeriodsCollectionRef, blockId))
      return { ok: true } satisfies ActionResult
    },
    async markNotificationSent(notificationId) {
      const adminCheck = await requireAdmin()

      if (!adminCheck.ok) {
        return adminCheck
      }

      await updateDoc(doc(notificationsCollectionRef, notificationId), {
        status: 'sent',
      })

      return { ok: true } satisfies ActionResult
    },
    async resetDemoData() {
      const adminCheck = await requireAdmin()

      if (!adminCheck.ok) {
        return adminCheck
      }

      await replaceRemoteState(stateRef.current, createSeedState())
      return { ok: true } satisfies ActionResult
    },
  }

  async function loginAdmin(credentials: AdminCredentials) {
    if (!credentials.email.trim() || !credentials.password.trim()) {
      return {
        ok: false,
        error: 'Informe e-mail e senha para entrar.',
      } satisfies ActionResult<User>
    }

    try {
      const result = await signInWithEmailAndPassword(
        firebaseAuth,
        credentials.email.trim(),
        credentials.password,
      )

      return {
        ok: true,
        data: result.user,
      } satisfies ActionResult<User>
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Não foi possível entrar com essa conta.',
      } satisfies ActionResult<User>
    }
  }

  async function logoutAdmin() {
    await signOut(firebaseAuth)
  }

  const visibleState = adminUser
    ? state
    : {
        ...state,
        appointments: [],
        notifications: [],
      }

  return {
    state: buildStateWithNotifications(visibleState),
    loading,
    authReady,
    adminUser,
    syncError,
    actions,
    loginAdmin,
    logoutAdmin,
    getAvailableSlots: (
      serviceId: string,
      date: string,
      ignoreAppointmentId?: string,
    ) => getAvailableSlots(stateRef.current, serviceId, date, ignoreAppointmentId),
  }
}
