import { useState, useTransition } from 'react'
import { CalendarDays, CheckCircle2, Clock3, Phone } from 'lucide-react'
import { buildUpcomingDates, formatLongDate, formatShortDate } from '../../lib/dateTime'
import { formatDuration, formatPhoneDisplay, formatServicePrice } from '../../lib/format'
import { getServiceById } from '../../lib/scheduling'
import { validateBookingForm } from '../../lib/validators'
import type { SalonActions } from '../../hooks/useSalonStore'
import type { BookingFormValues, SalonState, SlotOption } from '../../types/domain'

interface BookingFlowProps {
  state: SalonState
  actions: SalonActions
  getAvailableSlots: (
    serviceId: string,
    date: string,
    ignoreAppointmentId?: string,
  ) => SlotOption[]
}

const initialForm: BookingFormValues = {
  name: '',
  phone: '',
  email: '',
  notes: '',
}

export function BookingFlow({
  state,
  actions,
  getAvailableSlots,
}: BookingFlowProps) {
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [formValues, setFormValues] = useState(initialForm)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof BookingFormValues, string>>
  >({})
  const [feedback, setFeedback] = useState<{
    type: 'idle' | 'error' | 'success'
    message: string
  }>({
    type: 'idle',
    message: '',
  })
  const [hasConfirmation, setHasConfirmation] = useState(false)
  const [confirmationModal, setConfirmationModal] = useState<{
    show: boolean
    date: string
    time: string
  }>({ show: false, date: '', time: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSelectingDate, startDateTransition] = useTransition()

  const setupWebNotificationReminder = async (date: string, time: string) => {
    if (!('Notification' in window)) {
      console.log('Este navegador não suporta notificações.')
      return
    }

    if (Notification.permission === 'granted') {
      scheduleNotification(date, time)
    } else if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          scheduleNotification(date, time)
        }
      } catch (error) {
        console.log('Erro ao pedir permissão de notificação:', error)
      }
    }
  }

  const scheduleNotification = (date: string, time: string) => {
    const appointmentDateTime = new Date(`${date}T${time}`)
    const reminderTime = new Date(appointmentDateTime.getTime() - 180 * 60 * 1000) // 180 minutes before

    if (reminderTime > new Date()) {
      const delay = reminderTime.getTime() - Date.now()
      setTimeout(() => {
        new Notification('Lembrete de agendamento', {
          body: `Seu horário é às ${time} hoje.`,
          icon: '/favicon.ico', // assuming there's a favicon
        })
      }, delay)
    }
  }

  const activeServices = state.services.filter((service) => service.active)
  const upcomingDates = buildUpcomingDates(state.settings.bookingWindowDays)
  const selectedService = getServiceById(state, selectedServiceId)
  const nextAvailableDate = selectedServiceId
    ? upcomingDates.find((date) => getAvailableSlots(selectedServiceId, date).length > 0)
    : ''
  const effectiveDate =
    selectedServiceId &&
    selectedDate &&
    getAvailableSlots(selectedServiceId, selectedDate).length > 0
      ? selectedDate
      : nextAvailableDate ?? ''
  const availableSlots =
    selectedServiceId && effectiveDate
      ? getAvailableSlots(selectedServiceId, effectiveDate)
      : []
  const effectiveTime = availableSlots.some((slot) => slot.startTime === selectedTime)
    ? selectedTime
    : ''

  function clearFeedback() {
    setFeedback({
      type: 'idle',
      message: '',
    })
    setHasConfirmation(false)
  }

  function handleSelectService(serviceId: string) {
    startDateTransition(() => {
      setSelectedServiceId(serviceId)
      setSelectedDate('')
      setSelectedTime('')
      clearFeedback()
    })
  }

  function handleSelectDate(date: string) {
    startDateTransition(() => {
      setSelectedDate(date)
      setSelectedTime('')
      clearFeedback()
    })
  }

  async function handleSubmit() {
    const nextErrors = validateBookingForm(formValues)
    setFieldErrors(nextErrors)

    if (!selectedServiceId || !effectiveDate || !effectiveTime) {
      setFeedback({
        type: 'error',
        message: 'Escolha um serviço, uma data e um horário disponível.',
      })
      return
    }

    if (Object.keys(nextErrors).length > 0) {
      setFeedback({
        type: 'error',
        message: 'Revise seus dados para confirmar o agendamento.',
      })
      return
    }

    setIsSubmitting(true)
    setFeedback({
      type: 'idle',
      message: '',
    })

    const result = await actions.createAppointment({
      serviceId: selectedServiceId,
      date: effectiveDate,
      startTime: effectiveTime,
      name: formValues.name.trim(),
      phone: formValues.phone.replace(/\D/g, ''),
      email: formValues.email.trim(),
      notes: formValues.notes.trim(),
    })

    setIsSubmitting(false)

    if (!result.ok) {
      setFeedback({
        type: 'error',
        message: result.error ?? 'Não foi possível concluir o agendamento.',
      })
      return
    }

    setHasConfirmation(true)
    setConfirmationModal({ show: true, date: effectiveDate, time: effectiveTime })
    setFeedback({
      type: 'success',
      message: 'Agendamento confirmado. A confirmação apareceu no fluxo do sistema.',
    })
    setFormValues(initialForm)
    setFieldErrors({})

    // Setup web notification reminder
    setupWebNotificationReminder(effectiveDate, effectiveTime)
  }

  if (!state.weeklySchedule.length && !activeServices.length) {
    return (
      <section className="empty-state">
        <CalendarDays size={18} />
        Carregando agenda...
      </section>
    )
  }

  return (
    <div className="booking-layout">
      <section className="page-intro">
        <span className="eyebrow">Hora marcada</span>
        <h1>Agende seu horário</h1>
      </section>

      <section className="step-card">
        <div className="step-head">
          <span className="step-index">1</span>
          <div>
            <h2>Serviço</h2>
            <p>Escolha o atendimento.</p>
          </div>
        </div>

        {activeServices.length ? (
          <div className="services-grid">
            {activeServices.map((service) => {
              const isActive = service.id === selectedServiceId

              return (
                <button
                  key={service.id}
                  type="button"
                  className={`service-card accent-${service.accent} ${
                    isActive ? 'selected' : ''
                  }`}
                  onClick={() => handleSelectService(service.id)}
                >
                  <h3>{service.name}</h3>
                  {service.description ? <p>{service.description}</p> : null}
                  <div className="service-meta">
                    <span>
                      <Clock3 size={16} />
                      {formatDuration(service.durationMinutes)}
                    </span>
                    <strong>{formatServicePrice(service.price)}</strong>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="empty-state compact">
            Alissa ainda não liberou serviços para agendamento.
          </div>
        )}
      </section>

      <section className="step-card">
        <div className="step-head">
          <span className="step-index">2</span>
          <div>
            <h2>Data</h2>
            <p>Apenas dias com horários livres ficam ativos.</p>
          </div>
        </div>

        {!selectedServiceId ? (
          <div className="empty-state compact">
            Selecione um serviço para ver as datas.
          </div>
        ) : (
          <>
            <div className="date-strip">
              {upcomingDates.map((date) => {
                const hasSlots = getAvailableSlots(selectedServiceId, date).length > 0

                return (
                  <button
                    key={date}
                    type="button"
                    className={`date-chip ${
                      effectiveDate === date ? 'selected' : ''
                    } ${!hasSlots ? 'disabled' : ''}`}
                    onClick={() => handleSelectDate(date)}
                    disabled={!hasSlots}
                  >
                    <span>{formatShortDate(date)}</span>
                    <small>{hasSlots ? 'Disponível' : 'Sem horário'}</small>
                  </button>
                )
              })}
            </div>

            {!nextAvailableDate ? (
              <p className="helper-line">Nenhuma data disponível na janela atual.</p>
            ) : null}
          </>
        )}
      </section>

      <section className="step-card">
        <div className="step-head">
          <span className="step-index">3</span>
          <div>
            <h2>Horário</h2>
            <p>Os horários respeitam a janela definida pela Alissa.</p>
          </div>
        </div>

        {!effectiveDate ? (
          <div className="empty-state compact">
            Escolha uma data para ver horários.
          </div>
        ) : (
          <>
            <div className="section-highlight">
              <strong>{formatLongDate(effectiveDate)}</strong>
              <span>{selectedService?.name}</span>
            </div>

            {isSelectingDate ? (
              <div className="empty-state compact">Atualizando horários...</div>
            ) : availableSlots.length ? (
              <div className="slot-grid">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.startTime}
                    type="button"
                    className={`slot-button ${
                      effectiveTime === slot.startTime ? 'selected' : ''
                    }`}
                    onClick={() => {
                      setSelectedTime(slot.startTime)
                      clearFeedback()
                    }}
                  >
                    <strong>{slot.startTime}</strong>
                    <span>até {slot.endTime}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state compact">Nenhum horário livre nessa data.</div>
            )}
          </>
        )}
      </section>

      <section className="step-card">
        <div className="step-head">
          <span className="step-index">4</span>
          <div>
            <h2>Seus dados</h2>
            <p>Nome e WhatsApp são obrigatórios.</p>
          </div>
        </div>

        <div className="form-grid">
          <label className="input-shell">
            <span>Nome</span>
            <input
              type="text"
              value={formValues.name}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            {fieldErrors.name ? <small>{fieldErrors.name}</small> : null}
          </label>

          <label className="input-shell">
            <span>WhatsApp</span>
            <input
              type="tel"
              value={formatPhoneDisplay(formValues.phone)}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
            />
            {fieldErrors.phone ? <small>{fieldErrors.phone}</small> : null}
          </label>

          <label className="input-shell">
            <span>E-mail opcional</span>
            <input
              type="email"
              value={formValues.email}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
            {fieldErrors.email ? <small>{fieldErrors.email}</small> : null}
          </label>

          <label className="input-shell full">
            <span>Detalhes opcionais</span>
            <textarea
              rows={3}
              value={formValues.notes}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
            />
          </label>
        </div>
      </section>

      <section className="step-card">
        <div className="step-head">
          <span className="step-index">5</span>
          <div>
            <h2>Confirmar</h2>
            <p>Confira antes de reservar.</p>
          </div>
        </div>

        <div className="summary-card flat">
          <div className="summary-row">
            <span>Serviço</span>
            <strong>{selectedService?.name ?? 'Selecione'}</strong>
          </div>
          <div className="summary-row">
            <span>Data</span>
            <strong>{effectiveDate ? formatLongDate(effectiveDate) : 'Selecione'}</strong>
          </div>
          <div className="summary-row">
            <span>Horário</span>
            <strong>{effectiveTime || 'Selecione'}</strong>
          </div>
        </div>

        {feedback.type !== 'idle' ? (
          <div className={`notice ${feedback.type}`}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <Phone size={18} />}
            <span>{feedback.message}</span>
          </div>
        ) : null}

        <div className="actions-row">
          <button
            type="button"
            className="primary-button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Confirmando...' : 'Confirmar agendamento'}
          </button>
        </div>

        {hasConfirmation ? (
          <button
            type="button"
            className="ghost-button"
            onClick={() => {
              setSelectedServiceId('')
              setSelectedDate('')
              setSelectedTime('')
              setHasConfirmation(false)
              clearFeedback()
            }}
          >
            Fazer novo agendamento
          </button>
        ) : null}
      </section>

      {confirmationModal.show && (
        <div className="modal-overlay" onClick={() => setConfirmationModal({ show: false, date: '', time: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Agendamento Confirmado!</h3>
            <p>Seu agendamento foi feito para o dia {formatLongDate(confirmationModal.date)} às {confirmationModal.time}.</p>
            {'Notification' in window && Notification.permission === 'default' && (
              <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                Podemos te lembrar antes do seu horário?
              </p>
            )}
            <button
              type="button"
              className="primary-button"
              onClick={() => setConfirmationModal({ show: false, date: '', time: '' })}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
