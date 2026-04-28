import { useDeferredValue, useState } from 'react'
import {
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  Scissors,
  ShieldBan,
} from 'lucide-react'
import { buildUpcomingDates, formatLongDate, todayIso } from '../../lib/dateTime'
import { formatDuration, formatPhoneDisplay, formatServicePrice } from '../../lib/format'
import { getServiceById, sortAppointments } from '../../lib/scheduling'
import type { SalonActions } from '../../hooks/useSalonStore'
import type { BookingDraft, SalonState, ServiceCategory, WeeklyScheduleDay } from '../../types/domain'

interface AdminDashboardProps {
  state: SalonState
  actions: SalonActions
  getAvailableSlots: (
    serviceId: string,
    date: string,
    ignoreAppointmentId?: string,
  ) => {
    startTime: string
    endTime: string
    label: string
  }[]
}

type AdminTab = 'agenda' | 'services' | 'hours' | 'blocks'

const tabItems: { id: AdminTab; label: string; icon: typeof CalendarClock }[] = [
  { id: 'agenda', label: 'Agenda', icon: CalendarClock },
  { id: 'services', label: 'Serviços', icon: Scissors },
  { id: 'hours', label: 'Horários', icon: CalendarRange },
  { id: 'blocks', label: 'Bloqueios', icon: ShieldBan },
]

const emptyServiceForm = {
  id: '',
  name: '',
  category: 'manicure' as ServiceCategory,
  description: '',
  durationMinutes: '60',
  price: '0',
  featured: true,
  accent: 'rose',
  active: true,
}

function createManualDraft(): BookingDraft {
  return {
    serviceId: '',
    date: todayIso(),
    startTime: '',
    name: '',
    phone: '',
    email: '',
    notes: '',
  }
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    rescheduled: 'Remarcado',
    cancelled: 'Cancelado',
  }

  return labels[status] ?? status
}

export function AdminDashboard({
  state,
  actions,
  getAvailableSlots,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('agenda')
  const [agendaDate, setAgendaDate] = useState(todayIso())
  const [searchQuery, setSearchQuery] = useState('')
  const deferredQuery = useDeferredValue(searchQuery)
  const [serviceForm, setServiceForm] = useState(emptyServiceForm)
  const [scheduleDraft, setScheduleDraft] = useState<WeeklyScheduleDay[]>([])
  const [blockForm, setBlockForm] = useState({
    date: todayIso(),
    start: '09:00',
    end: '12:00',
    allDay: false,
    reason: '',
  })
  const [manualDraft, setManualDraft] = useState<BookingDraft>(createManualDraft)
  const [rescheduleDraft, setRescheduleDraft] = useState<{
    appointmentId: string
    date: string
    startTime: string
  } | null>(null)
  const [feedback, setFeedback] = useState({
    tone: 'idle' as 'idle' | 'success' | 'error',
    message: '',
  })
  const [isBusy, setIsBusy] = useState(false)

  const datesWindow = buildUpcomingDates(state.settings.bookingWindowDays)
  const activeServices = state.services.filter((service) => service.active)
  const editableSchedule = scheduleDraft.length ? scheduleDraft : state.weeklySchedule
  const filteredAppointments = sortAppointments(state.appointments).filter((appointment) => {
    if (appointment.date !== agendaDate) {
      return false
    }

    if (!deferredQuery.trim()) {
      return true
    }

    const service = getServiceById(state, appointment.serviceId)
    const haystack = [
      appointment.client.name,
      appointment.client.phone,
      statusLabel(appointment.status),
      service?.name ?? '',
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(deferredQuery.toLowerCase())
  })

  const manualSlots =
    manualDraft.serviceId && manualDraft.date
      ? getAvailableSlots(manualDraft.serviceId, manualDraft.date)
      : []

  const activeRescheduleSlots =
    rescheduleDraft &&
    getAvailableSlots(
      state.appointments.find(
        (appointment) => appointment.id === rescheduleDraft.appointmentId,
      )?.serviceId ?? '',
      rescheduleDraft.date,
      rescheduleDraft.appointmentId,
    )

  function setSuccess(message: string) {
    setFeedback({
      tone: 'success',
      message,
    })
  }

  function setError(message: string) {
    setFeedback({
      tone: 'error',
      message,
    })
  }

  function resetServiceForm() {
    setServiceForm(emptyServiceForm)
  }

  async function handleServiceSubmit() {
    setIsBusy(true)
    const result = await actions.upsertService({
      id: serviceForm.id || undefined,
      name: serviceForm.name,
      category: serviceForm.category,
      description: serviceForm.description,
      durationMinutes: Number(serviceForm.durationMinutes),
      price: Number(serviceForm.price),
      featured: serviceForm.featured,
      accent: serviceForm.accent,
      active: serviceForm.active,
    })
    setIsBusy(false)

    if (!result.ok) {
      setError(result.error ?? 'Não foi possível salvar o serviço.')
      return
    }

    setSuccess(serviceForm.id ? 'Serviço atualizado.' : 'Serviço cadastrado.')
    resetServiceForm()
  }

  async function handleScheduleSave() {
    setIsBusy(true)
    const result = await actions.updateWeeklySchedule(editableSchedule)
    setIsBusy(false)

    if (!result.ok) {
      setError(result.error ?? 'Não foi possível salvar os horários.')
      return
    }

    setSuccess('Horários atualizados.')
  }

  async function handleBlockSubmit() {
    setIsBusy(true)
    const result = await actions.addBlockedPeriod(blockForm)
    setIsBusy(false)

    if (!result.ok) {
      setError(result.error ?? 'Não foi possível salvar o bloqueio.')
      return
    }

    setSuccess('Bloqueio adicionado.')
    setBlockForm({
      date: todayIso(),
      start: '09:00',
      end: '12:00',
      allDay: false,
      reason: '',
    })
  }

  async function handleManualAppointmentSubmit() {
    if (
      !manualDraft.serviceId ||
      !manualDraft.date ||
      !manualDraft.startTime ||
      !manualDraft.name.trim() ||
      !manualDraft.phone.trim()
    ) {
      setError('Preencha serviço, data, horário, nome e WhatsApp.')
      return
    }

    setIsBusy(true)
    const result = await actions.createManualAppointment({
      ...manualDraft,
      phone: manualDraft.phone.replace(/\D/g, ''),
    })
    setIsBusy(false)

    if (!result.ok) {
      setError(result.error ?? 'Não foi possível criar o agendamento.')
      return
    }

    setSuccess('Agendamento registrado.')
    setManualDraft(createManualDraft())
  }

  async function handleRescheduleSubmit() {
    if (!rescheduleDraft?.startTime) {
      setError('Escolha um novo horário.')
      return
    }

    setIsBusy(true)
    const result = await actions.rescheduleAppointment(
      rescheduleDraft.appointmentId,
      rescheduleDraft.date,
      rescheduleDraft.startTime,
    )
    setIsBusy(false)

    if (!result.ok) {
      setError(result.error ?? 'Não foi possível remarcar.')
      return
    }

    setSuccess('Agendamento remarcado.')
    setRescheduleDraft(null)
  }

  function updateScheduleDay(
    dayIndex: number,
    updater: (day: WeeklyScheduleDay) => WeeklyScheduleDay,
  ) {
    setScheduleDraft((current) => {
      const source = current.length ? current : state.weeklySchedule

      return source.map((day, index) => (index === dayIndex ? updater(day) : day))
    })
  }

  return (
    <div className="admin-layout">
      <section className="page-intro">
        <span className="eyebrow">Painel da Alyssa</span>
        <h1>Agenda e horários</h1>
      </section>

      {feedback.tone !== 'idle' ? (
        <div className={`notice ${feedback.tone}`}>
          <CheckCircle2 size={18} />
          <span>{feedback.message}</span>
        </div>
      ) : null}

      <div className="admin-tabs">
        {tabItems.map((tab) => {
          const Icon = tab.icon

          return (
            <button
              key={tab.id}
              type="button"
              className={`admin-tab ${activeTab === tab.id ? 'selected' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'agenda' ? (
        <section className="panel-card">
          <div className="panel-head">
            <div>
              <h2>Agenda</h2>
              <p>Agendamentos confirmados e novos horários manuais.</p>
            </div>
          </div>

          <div className="form-panel">
            <h3>Novo agendamento</h3>
            <div className="form-grid">
              <label className="input-shell">
                <span>Serviço</span>
                <select
                  value={manualDraft.serviceId}
                  onChange={(event) =>
                    setManualDraft((current) => ({
                      ...current,
                      serviceId: event.target.value,
                      startTime: '',
                    }))
                  }
                >
                  <option value="">Selecione</option>
                  {activeServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="input-shell">
                <span>Data</span>
                <input
                  type="date"
                  value={manualDraft.date}
                  onChange={(event) =>
                    setManualDraft((current) => ({
                      ...current,
                      date: event.target.value,
                      startTime: '',
                    }))
                  }
                />
              </label>

              <label className="input-shell">
                <span>Nome</span>
                <input
                  type="text"
                  value={manualDraft.name}
                  onChange={(event) =>
                    setManualDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="input-shell">
                <span>WhatsApp</span>
                <input
                  type="tel"
                  value={formatPhoneDisplay(manualDraft.phone)}
                  onChange={(event) =>
                    setManualDraft((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="input-shell">
                <span>E-mail opcional</span>
                <input
                  type="email"
                  value={manualDraft.email}
                  onChange={(event) =>
                    setManualDraft((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="input-shell full">
                <span>Detalhes opcionais</span>
                <textarea
                  rows={3}
                  value={manualDraft.notes}
                  onChange={(event) =>
                    setManualDraft((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            {manualSlots.length ? (
              <div className="slot-grid compact">
                {manualSlots.map((slot) => (
                  <button
                    key={slot.startTime}
                    type="button"
                    className={`slot-button ${
                      manualDraft.startTime === slot.startTime ? 'selected' : ''
                    }`}
                    onClick={() =>
                      setManualDraft((current) => ({
                        ...current,
                        startTime: slot.startTime,
                      }))
                    }
                  >
                    <strong>{slot.startTime}</strong>
                    <span>{slot.endTime}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state compact">
                Escolha serviço e data para ver horários livres.
              </div>
            )}

            <div className="actions-row">
              <button
                type="button"
                className="primary-button"
                onClick={() => void handleManualAppointmentSubmit()}
                disabled={isBusy}
              >
                {isBusy ? 'Salvando...' : 'Salvar agendamento'}
              </button>
            </div>
          </div>

          <div className="filters-row">
            <label className="input-shell">
              <span>Data</span>
              <input
                type="date"
                value={agendaDate}
                min={datesWindow[0]}
                max={datesWindow[datesWindow.length - 1]}
                onChange={(event) => setAgendaDate(event.target.value)}
              />
            </label>

            <label className="input-shell">
              <span>Buscar</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
          </div>

          <div className="list-stack">
            {filteredAppointments.length ? (
              filteredAppointments.map((appointment) => {
                const service = getServiceById(state, appointment.serviceId)
                const isEditing = rescheduleDraft?.appointmentId === appointment.id

                return (
                  <article key={appointment.id} className="appointment-card">
                    <div className="appointment-top">
                      <div>
                        <strong>{appointment.client.name}</strong>
                        <p>
                          {appointment.startTime} - {appointment.endTime} -{' '}
                          {service?.name ?? 'Serviço'}
                        </p>
                      </div>
                      <span className={`status-pill ${appointment.status}`}>
                        {statusLabel(appointment.status)}
                      </span>
                    </div>

                    <div className="detail-grid">
                      <span>WhatsApp: {formatPhoneDisplay(appointment.client.phone)}</span>
                      <span>Duração: {formatDuration(service?.durationMinutes ?? 0)}</span>
                      {appointment.client.email ? (
                        <span>E-mail: {appointment.client.email}</span>
                      ) : null}
                      {appointment.notes ? <span>Detalhes: {appointment.notes}</span> : null}
                    </div>

                    <div className="actions-row wrap">
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={async () => {
                          setIsBusy(true)
                          const result = await actions.updateAppointmentStatus(
                            appointment.id,
                            'confirmed',
                          )
                          setIsBusy(false)

                          if (!result.ok) {
                            setError(result.error ?? 'Não foi possível confirmar.')
                            return
                          }

                          setSuccess('Agendamento confirmado.')
                        }}
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() =>
                          setRescheduleDraft({
                            appointmentId: appointment.id,
                            date: appointment.date,
                            startTime: '',
                          })
                        }
                      >
                        Remarcar
                      </button>
                      <button
                        type="button"
                        className="ghost-button danger"
                        onClick={async () => {
                          setIsBusy(true)
                          const result = await actions.updateAppointmentStatus(
                            appointment.id,
                            'cancelled',
                          )
                          setIsBusy(false)

                          if (!result.ok) {
                            setError(result.error ?? 'Não foi possível cancelar.')
                            return
                          }

                          setSuccess('Agendamento cancelado.')
                        }}
                      >
                        Cancelar
                      </button>
                    </div>

                    {isEditing ? (
                      <div className="reschedule-box">
                        <label className="input-shell">
                          <span>Nova data</span>
                          <input
                            type="date"
                            value={rescheduleDraft.date}
                            onChange={(event) =>
                              setRescheduleDraft((current) =>
                                current
                                  ? {
                                      ...current,
                                      date: event.target.value,
                                      startTime: '',
                                    }
                                  : current,
                              )
                            }
                          />
                        </label>

                        <div className="slot-grid compact">
                          {activeRescheduleSlots?.map((slot) => (
                            <button
                              key={slot.startTime}
                              type="button"
                              className={`slot-button ${
                                rescheduleDraft.startTime === slot.startTime
                                  ? 'selected'
                                  : ''
                              }`}
                              onClick={() =>
                                setRescheduleDraft((current) =>
                                  current
                                    ? {
                                        ...current,
                                        startTime: slot.startTime,
                                      }
                                    : current,
                                )
                              }
                            >
                              <strong>{slot.startTime}</strong>
                              <span>{slot.endTime}</span>
                            </button>
                          ))}
                        </div>

                        <div className="actions-row wrap">
                          <button
                            type="button"
                            className="primary-button"
                            onClick={() => void handleRescheduleSubmit()}
                            disabled={isBusy}
                          >
                            Salvar remarcação
                          </button>
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => setRescheduleDraft(null)}
                          >
                            Fechar
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                )
              })
            ) : (
              <div className="empty-state">Nenhum agendamento para esta data.</div>
            )}
          </div>
        </section>
      ) : null}

      {activeTab === 'services' ? (
        <section className="panel-card">
          <div className="panel-head">
            <div>
              <h2>Serviços</h2>
              <p>Somente serviços ativos aparecem para a cliente.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="input-shell">
              <span>Nome</span>
              <input
                type="text"
                value={serviceForm.name}
                onChange={(event) =>
                  setServiceForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>

            <label className="input-shell">
              <span>Categoria</span>
              <select
                value={serviceForm.category}
                onChange={(event) =>
                  setServiceForm((current) => ({
                    ...current,
                    category: event.target.value as ServiceCategory,
                  }))
                }
              >
                <option value="manicure">Manicure</option>
                <option value="pedicure">Pedicure</option>
                <option value="combo">Combo</option>
              </select>
            </label>

            <label className="input-shell">
              <span>Duração em minutos</span>
              <input
                type="number"
                min="30"
                step="15"
                value={serviceForm.durationMinutes}
                onChange={(event) =>
                  setServiceForm((current) => ({
                    ...current,
                    durationMinutes: event.target.value,
                  }))
                }
              />
            </label>

            <label className="input-shell">
              <span>Valor</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={serviceForm.price}
                onChange={(event) =>
                  setServiceForm((current) => ({
                    ...current,
                    price: event.target.value,
                  }))
                }
              />
            </label>

            <label className="input-shell full">
              <span>Descrição opcional</span>
              <textarea
                rows={3}
                value={serviceForm.description}
                onChange={(event) =>
                  setServiceForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </label>

            <label className="toggle-line">
              <input
                type="checkbox"
                checked={serviceForm.active}
                onChange={(event) =>
                  setServiceForm((current) => ({
                    ...current,
                    active: event.target.checked,
                  }))
                }
              />
              <span>Ativo para cliente</span>
            </label>
          </div>

          <div className="actions-row wrap">
            <button
              type="button"
              className="primary-button"
              onClick={() => void handleServiceSubmit()}
              disabled={isBusy}
            >
              {serviceForm.id ? 'Atualizar serviço' : 'Cadastrar serviço'}
            </button>
            <button type="button" className="ghost-button" onClick={resetServiceForm}>
              Limpar
            </button>
          </div>

          <div className="list-stack">
            {state.services.length ? (
              state.services.map((service) => (
                <article key={service.id} className="list-item">
                  <div>
                    <strong>{service.name}</strong>
                    <p>
                      {formatDuration(service.durationMinutes)} -{' '}
                      {formatServicePrice(service.price)} -{' '}
                      {service.active ? 'Ativo' : 'Oculto'}
                    </p>
                  </div>

                  <div className="actions-row wrap">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() =>
                        setServiceForm({
                          id: service.id,
                          name: service.name,
                          category: service.category,
                          description: service.description,
                          durationMinutes: String(service.durationMinutes),
                          price: String(service.price),
                          featured: service.featured,
                          accent: service.accent,
                          active: service.active,
                        })
                      }
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={async () => {
                        setIsBusy(true)
                        const result = await actions.toggleServiceActive(service.id)
                        setIsBusy(false)

                        if (!result.ok) {
                          setError(result.error ?? 'Não foi possível atualizar.')
                          return
                        }

                        setSuccess('Serviço atualizado.')
                      }}
                    >
                      {service.active ? 'Ocultar' : 'Ativar'}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">Nenhum serviço cadastrado.</div>
            )}
          </div>
        </section>
      ) : null}

      {activeTab === 'hours' ? (
        <section className="panel-card">
          <div className="panel-head">
            <div>
              <h2>Horários</h2>
              <p>Defina o horário mínimo e máximo de cada dia.</p>
            </div>
          </div>

          <div className="list-stack">
            {editableSchedule.map((day, dayIndex) => {
              const period = day.periods[0] ?? { start: '08:00', end: '18:00' }

              return (
                <article key={day.weekday} className="schedule-card">
                  <div className="schedule-top">
                    <div>
                      <strong>{day.label}</strong>
                      <p>{day.enabled ? `${period.start} até ${period.end}` : 'Fechado'}</p>
                    </div>
                    <label className="toggle-line">
                      <input
                        type="checkbox"
                        checked={day.enabled}
                        onChange={(event) =>
                          updateScheduleDay(dayIndex, (current) => ({
                            ...current,
                            enabled: event.target.checked,
                            periods: event.target.checked
                              ? [current.periods[0] ?? { start: '08:00', end: '18:00' }]
                              : [],
                          }))
                        }
                      />
                      <span>{day.enabled ? 'Aberto' : 'Fechado'}</span>
                    </label>
                  </div>

                  {day.enabled ? (
                    <div className="schedule-periods">
                      <label className="input-shell">
                        <span>Início</span>
                        <input
                          type="time"
                          value={period.start}
                          onChange={(event) =>
                            updateScheduleDay(dayIndex, (current) => ({
                              ...current,
                              periods: [
                                {
                                  start: event.target.value,
                                  end: current.periods[0]?.end ?? '18:00',
                                },
                              ],
                            }))
                          }
                        />
                      </label>

                      <label className="input-shell">
                        <span>Fim</span>
                        <input
                          type="time"
                          value={period.end}
                          onChange={(event) =>
                            updateScheduleDay(dayIndex, (current) => ({
                              ...current,
                              periods: [
                                {
                                  start: current.periods[0]?.start ?? '08:00',
                                  end: event.target.value,
                                },
                              ],
                            }))
                          }
                        />
                      </label>
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>

          <div className="actions-row">
            <button
              type="button"
              className="primary-button"
              onClick={() => void handleScheduleSave()}
              disabled={isBusy}
            >
              Salvar horários
            </button>
          </div>
        </section>
      ) : null}

      {activeTab === 'blocks' ? (
        <section className="panel-card">
          <div className="panel-head">
            <div>
              <h2>Bloqueios</h2>
              <p>Datas ou intervalos que não devem aparecer para cliente.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="input-shell">
              <span>Data</span>
              <input
                type="date"
                value={blockForm.date}
                onChange={(event) =>
                  setBlockForm((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
              />
            </label>

            <label className="input-shell">
              <span>Início</span>
              <input
                type="time"
                value={blockForm.start}
                onChange={(event) =>
                  setBlockForm((current) => ({
                    ...current,
                    start: event.target.value,
                  }))
                }
                disabled={blockForm.allDay}
              />
            </label>

            <label className="input-shell">
              <span>Fim</span>
              <input
                type="time"
                value={blockForm.end}
                onChange={(event) =>
                  setBlockForm((current) => ({
                    ...current,
                    end: event.target.value,
                  }))
                }
                disabled={blockForm.allDay}
              />
            </label>

            <label className="input-shell">
              <span>Motivo</span>
              <input
                type="text"
                value={blockForm.reason}
                onChange={(event) =>
                  setBlockForm((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
              />
            </label>

            <label className="toggle-line">
              <input
                type="checkbox"
                checked={blockForm.allDay}
                onChange={(event) =>
                  setBlockForm((current) => ({
                    ...current,
                    allDay: event.target.checked,
                  }))
                }
              />
              <span>Bloquear o dia inteiro</span>
            </label>
          </div>

          <div className="actions-row">
            <button
              type="button"
              className="primary-button"
              onClick={() => void handleBlockSubmit()}
              disabled={isBusy}
            >
              Adicionar bloqueio
            </button>
          </div>

          <div className="list-stack">
            {state.blockedPeriods.length ? (
              state.blockedPeriods.map((block) => (
                <article key={block.id} className="list-item">
                  <div>
                    <strong>{block.reason}</strong>
                    <p>
                      {formatLongDate(block.date)} -{' '}
                      {block.allDay ? 'Dia inteiro' : `${block.start} até ${block.end}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="ghost-button danger"
                    onClick={async () => {
                      setIsBusy(true)
                      const result = await actions.removeBlockedPeriod(block.id)
                      setIsBusy(false)

                      if (!result.ok) {
                        setError(result.error ?? 'Não foi possível remover.')
                        return
                      }

                      setSuccess('Bloqueio removido.')
                    }}
                  >
                    Remover
                  </button>
                </article>
              ))
            ) : (
              <div className="empty-state">Nenhum bloqueio cadastrado.</div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  )
}
