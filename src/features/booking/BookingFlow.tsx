import { useState, useTransition } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Phone,
  Sparkles,
} from 'lucide-react'
import { buildUpcomingDates, formatLongDate, formatShortDate } from '../../lib/dateTime'
import { formatCurrencyBRL, formatDuration, formatPhoneDisplay } from '../../lib/format'
import { getServiceById } from '../../lib/scheduling'
import { validateBookingForm } from '../../lib/validators'
import type { SalonActions } from '../../hooks/useSalonStore'
import type {
  BookingFormValues,
  SalonState,
  SlotOption,
} from '../../types/domain'

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
  const [confirmationId, setConfirmationId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSelectingDate, startDateTransition] = useTransition()

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

  function handleSelectService(serviceId: string) {
    startDateTransition(() => {
      setSelectedServiceId(serviceId)
      setSelectedTime('')
      setFeedback({
        type: 'idle',
        message: '',
      })
    })
  }

  function handleSelectDate(date: string) {
    startDateTransition(() => {
      setSelectedDate(date)
      setSelectedTime('')
      setFeedback({
        type: 'idle',
        message: '',
      })
    })
  }

  async function handleSubmit() {
    const nextErrors = validateBookingForm(formValues)
    setFieldErrors(nextErrors)

    if (!selectedServiceId || !effectiveDate || !effectiveTime) {
      setFeedback({
        type: 'error',
        message:
          'Escolha um serviço, uma data e um horário disponível antes de confirmar.',
      })
      return
    }

    if (Object.keys(nextErrors).length > 0) {
      setFeedback({
        type: 'error',
        message: 'Revise os dados da cliente para concluir o agendamento.',
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

    if (!result.ok || !result.data) {
      setFeedback({
        type: 'error',
        message:
          result.error ??
          'Não foi possível concluir o agendamento. Tente novamente.',
      })
      return
    }

    setConfirmationId(result.data.id)
    setFeedback({
      type: 'success',
      message:
        'Horário confirmado com sucesso. Os dados foram gravados no Firebase e o lembrete ficou preparado na central de notificações.',
    })
    setFormValues(initialForm)
    setFieldErrors({})
  }

  return (
    <div className="booking-layout">
      <section className="page-intro">
        <span className="eyebrow">Autoatendimento</span>
        <h1>Marque seu horário em poucos passos</h1>
        <p>
          Escolha o serviço, veja horários realmente livres e confirme o seu
          atendimento sem depender de conversa manual.
        </p>
      </section>

      <section className="step-card">
        <div className="step-head">
          <span className="step-index">1</span>
          <div>
            <h2>Escolha o serviço</h2>
            <p>Veja duração, faixa de preço e o foco de cada atendimento.</p>
          </div>
        </div>

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
                <div className="service-card-top">
                  <span className="service-pill">
                    {service.featured ? 'Mais pedido' : 'Disponível'}
                  </span>
                  <ChevronRight size={18} />
                </div>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <div className="service-meta">
                  <span>
                    <Clock3 size={16} />
                    {formatDuration(service.durationMinutes)}
                  </span>
                  <strong>{formatCurrencyBRL(service.price)}</strong>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="step-card">
        <div className="step-head">
          <span className="step-index">2</span>
          <div>
            <h2>Escolha a data</h2>
            <p>
              Os horários abaixo já respeitam funcionamento, bloqueios e tempo
              total do serviço.
            </p>
          </div>
        </div>

        {!selectedServiceId ? (
          <div className="empty-state compact">
            <Sparkles size={18} />
            Selecione um serviço para liberar o calendário.
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
                    <small>{hasSlots ? 'com horário' : 'indisponível'}</small>
                  </button>
                )
              })}
            </div>

            {nextAvailableDate ? (
              <p className="helper-line">
                Próxima data com vagas: <strong>{formatLongDate(nextAvailableDate)}</strong>
              </p>
            ) : (
              <p className="helper-line">
                Não há vagas na janela atual. Ajuste o funcionamento pelo painel
                da Alyssa para liberar novas datas.
              </p>
            )}
          </>
        )}
      </section>

      <section className="step-card">
        <div className="step-head">
          <span className="step-index">3</span>
          <div>
            <h2>Escolha o horário</h2>
            <p>
              Cada botão já representa um início possível sem sobrepor outro
              atendimento.
            </p>
          </div>
        </div>

        {!effectiveDate ? (
          <div className="empty-state compact">
            <CalendarDays size={18} />
            Escolha a data para ver os horários livres.
          </div>
        ) : (
          <>
            <div className="section-highlight">
              <strong>{formatLongDate(effectiveDate)}</strong>
              <span>{selectedService ? selectedService.name : 'Serviço não selecionado'}</span>
            </div>

            {isSelectingDate ? (
              <div className="empty-state compact">Atualizando disponibilidade...</div>
            ) : availableSlots.length ? (
              <div className="slot-grid">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.startTime}
                    type="button"
                    className={`slot-button ${
                      effectiveTime === slot.startTime ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedTime(slot.startTime)}
                  >
                    <strong>{slot.startTime}</strong>
                    <span>até {slot.endTime}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state compact">
                Nenhum horário livre nessa data para a duração desse serviço.
              </div>
            )}
          </>
        )}
      </section>

      <section className="step-card">
        <div className="step-head">
          <span className="step-index">4</span>
          <div>
            <h2>Informe seus dados</h2>
            <p>Nome e telefone são obrigatórios para confirmar e lembrar do horário.</p>
          </div>
        </div>

        <div className="form-grid">
          <label className="input-shell">
            <span>Nome da cliente</span>
            <input
              type="text"
              placeholder="Ex.: Ana Souza"
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
              placeholder="(11) 99999-9999"
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
              placeholder="voce@email.com"
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
            <span>Observações</span>
            <textarea
              rows={4}
              placeholder="Conte preferências de cor, sensibilidade ou qualquer detalhe importante."
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
            <h2>Revise e confirme</h2>
            <p>O resumo abaixo mostra exatamente o horário que será reservado.</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-row">
            <span>Serviço</span>
            <strong>{selectedService?.name ?? 'Selecione um serviço'}</strong>
          </div>
          <div className="summary-row">
            <span>Data</span>
            <strong>{effectiveDate ? formatLongDate(effectiveDate) : 'Escolha uma data'}</strong>
          </div>
          <div className="summary-row">
            <span>Horário</span>
            <strong>{effectiveTime || 'Escolha um horário'}</strong>
          </div>
          <div className="summary-row">
            <span>Investimento</span>
            <strong>
              {selectedService ? formatCurrencyBRL(selectedService.price) : '--'}
            </strong>
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
            {isSubmitting ? 'Confirmando horário...' : 'Confirmar agendamento'}
          </button>
          <Link className="ghost-button" to="/admin">
            Abrir painel da Alyssa
          </Link>
        </div>

        {confirmationId ? (
          <div className="confirmation-card">
            <div>
              <strong>Agendamento concluído</strong>
              <p>
                Código interno <code>{confirmationId.slice(0, 12)}</code> gerado para
                acompanhamento no painel.
              </p>
            </div>
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                setSelectedServiceId('')
                setSelectedDate('')
                setSelectedTime('')
                setConfirmationId('')
                setFeedback({
                  type: 'idle',
                  message: '',
                })
              }}
            >
              Fazer novo agendamento
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}
