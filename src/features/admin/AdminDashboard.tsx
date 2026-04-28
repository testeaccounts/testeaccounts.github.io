import { useDeferredValue, useState } from 'react'
import {
  BellRing,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  Copy,
  LayoutGrid,
  ListFilter,
  Scissors,
  ShieldBan,
  Users,
} from 'lucide-react'
import { buildUpcomingDates, formatLongDate, formatTimestamp, todayIso } from '../../lib/dateTime'
import {
  createWhatsAppLink,
  formatCurrencyBRL,
  formatDuration,
  formatPhoneDisplay,
} from '../../lib/format'
import {
  calculateDayOccupancy,
  calculateProjectedRevenue,
  getServiceById,
  getUniqueClients,
  getUpcomingAppointments,
} from '../../lib/scheduling'
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

type AdminTab =
  | 'overview'
  | 'agenda'
  | 'services'
  | 'hours'
  | 'blocks'
  | 'clients'
  | 'notifications'

const tabItems: { id: AdminTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'overview', label: 'Visão geral', icon: LayoutGrid },
  { id: 'agenda', label: 'Agenda', icon: CalendarClock },
  { id: 'services', label: 'Serviços', icon: Scissors },
  { id: 'hours', label: 'Funcionamento', icon: CalendarRange },
  { id: 'blocks', label: 'Bloqueios', icon: ShieldBan },
  { id: 'clients', label: 'Clientes', icon: Users },
  { id: 'notifications', label: 'Notificações', icon: BellRing },
]

const emptyServiceForm = {
  id: '',
  name: '',
  category: 'manicure' as ServiceCategory,
  description: '',
  durationMinutes: '75',
  price: '68',
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

export function AdminDashboard({
  state,
  actions,
  getAvailableSlots,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [agendaDate, setAgendaDate] = useState(todayIso())
  const [searchQuery, setSearchQuery] = useState('')
  const deferredQuery = useDeferredValue(searchQuery)
  const [serviceForm, setServiceForm] = useState(emptyServiceForm)
  const [scheduleDraft, setScheduleDraft] = useState<WeeklyScheduleDay[]>(
    state.weeklySchedule,
  )
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

  const today = todayIso()
  const readyNotifications = state.notifications.filter(
    (notification) => notification.status === 'ready',
  )
  const upcomingAppointments = getUpcomingAppointments(state, 5)
  const occupancyToday = calculateDayOccupancy(state, today)
  const projectedRevenue = calculateProjectedRevenue(state, today)
  const clients = getUniqueClients(state)
  const datesWindow = buildUpcomingDates(state.settings.bookingWindowDays)

  const filteredAppointments = state.appointments.filter((appointment) => {
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
      appointment.status,
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

    setSuccess(
      serviceForm.id ? 'Serviço atualizado com sucesso.' : 'Novo serviço cadastrado.',
    )
    resetServiceForm()
  }

  async function handleScheduleSave() {
    setIsBusy(true)
    const result = await actions.updateWeeklySchedule(scheduleDraft)
    setIsBusy(false)

    if (!result.ok) {
      setError(result.error ?? 'Não foi possível salvar o funcionamento.')
      return
    }

    setSuccess('Funcionamento semanal atualizado no Firebase.')
  }

  async function handleBlockSubmit() {
    setIsBusy(true)
    const result = await actions.addBlockedPeriod(blockForm)
    setIsBusy(false)

    if (!result.ok) {
      setError(result.error ?? 'Não foi possível salvar o bloqueio.')
      return
    }

    setSuccess('Bloqueio adicionado à agenda.')
    setBlockForm({
      date: todayIso(),
      start: '09:00',
      end: '12:00',
      allDay: false,
      reason: '',
    })
  }

  async function handleRescheduleSubmit() {
    if (!rescheduleDraft?.startTime) {
      setError('Escolha um novo horário para concluir a remarcação.')
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
      setError(result.error ?? 'Não foi possível remarcar esse agendamento.')
      return
    }

    setSuccess('Agendamento remarcado com sucesso.')
    setRescheduleDraft(null)
  }

  async function handleManualAppointmentSubmit() {
    if (
      !manualDraft.serviceId ||
      !manualDraft.date ||
      !manualDraft.startTime ||
      !manualDraft.name.trim() ||
      !manualDraft.phone.trim()
    ) {
      setError('Preencha serviço, data, horário, nome e telefone da cliente.')
      return
    }

    setIsBusy(true)
    const result = await actions.createManualAppointment({
      ...manualDraft,
      phone: manualDraft.phone.replace(/\D/g, ''),
    })
    setIsBusy(false)

    if (!result.ok) {
      setError(result.error ?? 'Não foi possível criar o horário manual.')
      return
    }

    setSuccess('Horário manual da cliente registrado com sucesso.')
    setManualDraft(createManualDraft())
  }

  async function copyMessage(message: string) {
    try {
      await navigator.clipboard.writeText(message)
      setSuccess('Mensagem copiada para a área de transferência.')
    } catch {
      setError('Não consegui copiar a mensagem automaticamente.')
    }
  }

  return (
    <div className="admin-layout">
      <section className="page-intro">
        <span className="eyebrow">Painel da Alyssa</span>
        <h1>Gestão clara da agenda, serviços e notificações</h1>
        <p>
          Tudo o que a Alyssa precisa para evitar conflito de horários e responder
          clientes com mais rapidez.
        </p>
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

      {activeTab === 'overview' ? (
        <div className="dashboard-grid">
          <article className="metric-card">
            <span>Ocupação hoje</span>
            <strong>{occupancyToday}%</strong>
            <p>Baseado nos horários já reservados e no funcionamento do dia.</p>
          </article>
          <article className="metric-card">
            <span>Receita projetada</span>
            <strong>{formatCurrencyBRL(projectedRevenue)}</strong>
            <p>Somatório dos atendimentos ativos a partir de hoje.</p>
          </article>
          <article className="metric-card">
            <span>Clientes cadastradas</span>
            <strong>{clients.length}</strong>
            <p>Quantidade derivada dos agendamentos registrados.</p>
          </article>
          <article className="metric-card">
            <span>Notificações prontas</span>
            <strong>{readyNotifications.length}</strong>
            <p>Central com confirmações, lembretes e alertas para enviar.</p>
          </article>

          <article className="panel-card wide">
            <div className="panel-head">
              <div>
                <h2>Próximos atendimentos</h2>
                <p>Visão rápida do que já está chegando na agenda.</p>
              </div>
            </div>

            <div className="list-stack">
              {upcomingAppointments.map((appointment) => {
                const service = getServiceById(state, appointment.serviceId)

                return (
                  <div key={appointment.id} className="list-item appointment-row">
                    <div>
                      <strong>{appointment.client.name}</strong>
                      <p>
                        {service?.name ?? 'Serviço'} • {formatLongDate(appointment.date)} •{' '}
                        {appointment.startTime}
                      </p>
                    </div>
                    <span className={`status-pill ${appointment.status}`}>
                      {appointment.status}
                    </span>
                  </div>
                )
              })}
            </div>
          </article>

          <article className="panel-card wide">
            <div className="panel-head">
              <div>
                <h2>Regras ativas no banco</h2>
                <p>Como o sistema está operando agora com Firebase.</p>
              </div>
            </div>
            <ul className="bullet-list">
              <li>Serviços, horários, bloqueios e agenda são lidos do Firestore.</li>
              <li>O painel da Alyssa abre só após autenticação com senha.</li>
              <li>Agendamentos criam bloqueios de slots no banco para evitar conflito.</li>
              <li>Confirmações e lembretes ficam registrados na coleção de notificações.</li>
            </ul>
          </article>
        </div>
      ) : null}

      {activeTab === 'agenda' ? (
        <div className="panel-card">
          <div className="panel-head">
            <div>
              <h2>Agenda do dia</h2>
              <p>Confirme, cancele, remarque ou cadastre um horário manual da cliente.</p>
            </div>
          </div>

          <div className="summary-card">
            <h3>Novo horário manual</h3>
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
                  {state.services
                    .filter((service) => service.active)
                    .map((service) => (
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
                <span>Nome da cliente</span>
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
                <span>E-mail</span>
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
                <span>Observações</span>
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
                Nenhum horário livre para o serviço e data escolhidos.
              </div>
            )}

            <div className="actions-row wrap">
              <button
                type="button"
                className="primary-button"
                onClick={() => void handleManualAppointmentSubmit()}
                disabled={isBusy}
              >
                {isBusy ? 'Salvando...' : 'Salvar horário da cliente'}
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
              <span>Buscar cliente ou serviço</span>
              <input
                type="search"
                placeholder="Nome, telefone ou serviço"
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
                          {appointment.startTime} • {service?.name ?? 'Serviço'} •{' '}
                          {formatCurrencyBRL(service?.price ?? 0)}
                        </p>
                      </div>
                      <span className={`status-pill ${appointment.status}`}>
                        {appointment.status}
                      </span>
                    </div>

                    <div className="detail-grid">
                      <span>WhatsApp: {formatPhoneDisplay(appointment.client.phone)}</span>
                      <span>Duração: {formatDuration(service?.durationMinutes ?? 0)}</span>
                      <span>Origem: {appointment.origin}</span>
                      <span>Observações: {appointment.notes || 'Sem observações'}</span>
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
                        <div className="filters-row">
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
                        </div>

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
                            {isBusy ? 'Salvando...' : 'Salvar nova data'}
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
              <div className="empty-state">
                <ListFilter size={18} />
                Nenhum agendamento encontrado para a data escolhida.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === 'services' ? (
        <div className="panel-card">
          <div className="panel-head">
            <div>
              <h2>Serviços</h2>
              <p>Cadastre preços, duração e destaque os serviços mais vendidos.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="input-shell">
              <span>Nome do serviço</span>
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
                <option value="alongamento">Alongamento</option>
                <option value="spa">Spa</option>
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
              <span>Preço</span>
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
              <span>Descrição</span>
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
          </div>

          <div className="actions-row wrap">
            <button
              type="button"
              className="primary-button"
              onClick={() => void handleServiceSubmit()}
              disabled={isBusy}
            >
              {isBusy
                ? 'Salvando...'
                : serviceForm.id
                  ? 'Atualizar serviço'
                  : 'Cadastrar serviço'}
            </button>
            <button type="button" className="ghost-button" onClick={resetServiceForm}>
              Limpar formulário
            </button>
          </div>

          <div className="list-stack">
            {state.services.map((service) => (
              <article key={service.id} className="list-item">
                <div>
                  <strong>{service.name}</strong>
                  <p>
                    {formatDuration(service.durationMinutes)} •{' '}
                    {formatCurrencyBRL(service.price)} •{' '}
                    {service.active ? 'visível para cliente' : 'oculto'}
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
                        setError(result.error ?? 'Não foi possível atualizar o serviço.')
                        return
                      }

                      setSuccess('Visibilidade do serviço atualizada.')
                    }}
                  >
                    {service.active ? 'Ocultar' : 'Reativar'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === 'hours' ? (
        <div className="panel-card">
          <div className="panel-head">
            <div>
              <h2>Funcionamento</h2>
              <p>Defina dias úteis e janelas de atendimento por turno.</p>
            </div>
          </div>

          <div className="list-stack">
            {scheduleDraft.map((day, dayIndex) => (
              <article key={day.weekday} className="schedule-card">
                <div className="schedule-top">
                  <div>
                    <strong>{day.label}</strong>
                    <p>{day.enabled ? 'Aberto para agendamento' : 'Fechado'}</p>
                  </div>
                  <label className="toggle-line">
                    <input
                      type="checkbox"
                      checked={day.enabled}
                      onChange={(event) =>
                        setScheduleDraft((current) =>
                          current.map((item, index) =>
                            index === dayIndex
                              ? {
                                  ...item,
                                  enabled: event.target.checked,
                                }
                              : item,
                          ),
                        )
                      }
                    />
                    <span>{day.enabled ? 'Ativo' : 'Fechado'}</span>
                  </label>
                </div>

                <div className="schedule-periods">
                  {[0, 1].map((periodIndex) => {
                    const period = day.periods[periodIndex] ?? { start: '', end: '' }

                    return (
                      <div key={periodIndex} className="schedule-period">
                        <label className="input-shell">
                          <span>Início</span>
                          <input
                            type="time"
                            value={period.start}
                            onChange={(event) =>
                              setScheduleDraft((current) =>
                                current.map((item, index) =>
                                  index === dayIndex
                                    ? {
                                        ...item,
                                        periods: [0, 1].map((targetIndex) =>
                                          targetIndex === periodIndex
                                            ? {
                                                start: event.target.value,
                                                end:
                                                  item.periods[targetIndex]?.end ?? '',
                                              }
                                            : item.periods[targetIndex] ?? {
                                                start: '',
                                                end: '',
                                              },
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                        </label>

                        <label className="input-shell">
                          <span>Fim</span>
                          <input
                            type="time"
                            value={period.end}
                            onChange={(event) =>
                              setScheduleDraft((current) =>
                                current.map((item, index) =>
                                  index === dayIndex
                                    ? {
                                        ...item,
                                        periods: [0, 1].map((targetIndex) =>
                                          targetIndex === periodIndex
                                            ? {
                                                start:
                                                  item.periods[targetIndex]?.start ?? '',
                                                end: event.target.value,
                                              }
                                            : item.periods[targetIndex] ?? {
                                                start: '',
                                                end: '',
                                              },
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                        </label>
                      </div>
                    )
                  })}
                </div>
              </article>
            ))}
          </div>

          <div className="actions-row">
            <button
              type="button"
              className="primary-button"
              onClick={() => void handleScheduleSave()}
              disabled={isBusy}
            >
              {isBusy ? 'Salvando...' : 'Salvar funcionamento'}
            </button>
          </div>
        </div>
      ) : null}

      {activeTab === 'blocks' ? (
        <div className="panel-card">
          <div className="panel-head">
            <div>
              <h2>Bloqueios de horário</h2>
              <p>Use para cursos, folgas, pausas longas ou datas indisponíveis.</p>
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
              {isBusy ? 'Salvando...' : 'Adicionar bloqueio'}
            </button>
          </div>

          <div className="list-stack">
            {state.blockedPeriods.map((block) => (
              <article key={block.id} className="list-item">
                <div>
                  <strong>{block.reason}</strong>
                  <p>
                    {formatLongDate(block.date)} •{' '}
                    {block.allDay ? 'dia inteiro' : `${block.start} até ${block.end}`}
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
                      setError(result.error ?? 'Não foi possível remover o bloqueio.')
                      return
                    }

                    setSuccess('Bloqueio removido.')
                  }}
                >
                  Remover
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === 'clients' ? (
        <div className="panel-card">
          <div className="panel-head">
            <div>
              <h2>Clientes</h2>
              <p>Base montada a partir dos agendamentos já registrados.</p>
            </div>
          </div>

          <div className="list-stack">
            {clients.map((client) => (
              <article key={client.phone} className="list-item">
                <div>
                  <strong>{client.name}</strong>
                  <p>
                    {formatPhoneDisplay(client.phone)} • {client.appointments} agendamento(s)
                  </p>
                </div>
                <span className="mini-note">
                  Último registro: {formatTimestamp(client.lastVisit)}
                </span>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === 'notifications' ? (
        <div className="panel-card">
          <div className="panel-head">
            <div>
              <h2>Central de notificações</h2>
              <p>
                Preparada para WhatsApp, e-mail ou disparo interno. Aqui você já
                consegue revisar e marcar o que foi enviado.
              </p>
            </div>
          </div>

          <div className="list-stack">
            {state.notifications
              .slice()
              .sort(
                (left, right) =>
                  new Date(right.scheduledFor).getTime() -
                  new Date(left.scheduledFor).getTime(),
              )
              .map((notification) => (
                <article key={notification.id} className="notification-card">
                  <div className="appointment-top">
                    <div>
                      <strong>{notification.title}</strong>
                      <p>
                        {notification.channel} • {formatTimestamp(notification.scheduledFor)}
                      </p>
                    </div>
                    <span className={`status-pill ${notification.status}`}>
                      {notification.status}
                    </span>
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  <div className="actions-row wrap">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => void copyMessage(notification.message)}
                    >
                      <Copy size={16} />
                      Copiar
                    </button>
                    {notification.channel === 'whatsapp' ? (
                      <a
                        className="ghost-button"
                        href={createWhatsAppLink(
                          notification.recipient,
                          notification.message,
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Abrir WhatsApp
                      </a>
                    ) : null}
                    {notification.status !== 'sent' ? (
                      <button
                        type="button"
                        className="primary-button"
                        onClick={async () => {
                          setIsBusy(true)
                          const result = await actions.markNotificationSent(
                            notification.id,
                          )
                          setIsBusy(false)

                          if (!result.ok) {
                            setError(result.error ?? 'Não foi possível atualizar.')
                            return
                          }

                          setSuccess('Notificação marcada como enviada.')
                        }}
                      >
                        Marcar como enviada
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
