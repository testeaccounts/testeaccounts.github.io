import { BellRing, CalendarClock, Sparkles } from 'lucide-react'
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import { BookingFlow } from './features/booking/BookingFlow'
import { AdminDashboard } from './features/admin/AdminDashboard'
import { useSalonStore } from './hooks/useSalonStore'
import { formatLongDate, todayIso } from './lib/dateTime'
import { formatCurrencyBRL } from './lib/format'
import {
  calculateDayOccupancy,
  calculateProjectedRevenue,
  getUpcomingAppointments,
} from './lib/scheduling'

function App() {
  const { state, actions, getAvailableSlots } = useSalonStore()
  const upcomingAppointments = getUpcomingAppointments(state, 1)
  const nextAppointment = upcomingAppointments[0]
  const nextAppointmentService = nextAppointment
    ? state.services.find((service) => service.id === nextAppointment.serviceId)
    : null
  const readyNotifications = state.notifications.filter(
    (notification) => notification.status === 'ready',
  ).length
  const occupancyToday = calculateDayOccupancy(state, todayIso())
  const projectedRevenue = calculateProjectedRevenue(state, todayIso())

  return (
    <HashRouter>
      <div className="page-frame">
        <header className="topbar">
          <div className="brand-lockup">
            <span className="brand-mark">AU</span>
            <div>
              <span className="brand-name">{state.settings.salonName}</span>
              <p>Autoatendimento e gestão da agenda em um só lugar.</p>
            </div>
          </div>

          <nav className="nav-pills">
            <NavLink
              to="/"
              end
              className={({ isActive }) => (isActive ? 'nav-pill active' : 'nav-pill')}
            >
              Cliente
            </NavLink>
            <NavLink
              to="/admin"
              className={({ isActive }) => (isActive ? 'nav-pill active' : 'nav-pill')}
            >
              Alyssa
            </NavLink>
          </nav>
        </header>

        <section className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow">Sistema completo para manicure</span>
            <h1>A cliente agenda sozinha. A Alyssa gerencia sem confusão.</h1>
            <p>
              Fluxo mobile-first, regras de conflito por duração, painel
              administrativo e uma central de notificações pronta para integração
              com WhatsApp ou e-mail.
            </p>
          </div>

          <div className="hero-stack">
            <article className="highlight-card">
              <div className="icon-badge">
                <CalendarClock size={18} />
              </div>
              <span>Próximo atendimento</span>
              <strong>
                {nextAppointment
                  ? `${nextAppointment.client.name} • ${nextAppointment.startTime}`
                  : 'Agenda pronta para receber reservas'}
              </strong>
              <p>
                {nextAppointment && nextAppointmentService
                  ? `${nextAppointmentService.name} em ${formatLongDate(nextAppointment.date)}`
                  : 'Nenhum atendimento futuro cadastrado ainda.'}
              </p>
            </article>

            <div className="stat-grid">
              <article className="stat-card">
                <span>Ocupação hoje</span>
                <strong>{occupancyToday}%</strong>
              </article>
              <article className="stat-card">
                <span>Receita projetada</span>
                <strong>{formatCurrencyBRL(projectedRevenue)}</strong>
              </article>
              <article className="stat-card">
                <span>Notificações prontas</span>
                <strong>{readyNotifications}</strong>
              </article>
            </div>
          </div>
        </section>

        <section className="shell-grid">
          <aside className="side-panel">
            <div className="panel-chip">
              <Sparkles size={16} />
              Jornada principal
            </div>

            <ol className="journey-list">
              <li>Escolher serviço</li>
              <li>Selecionar data</li>
              <li>Selecionar horário</li>
              <li>Informar dados</li>
              <li>Confirmar agendamento</li>
            </ol>

            <div className="policy-card">
              <div className="panel-chip">
                <BellRing size={16} />
                Políticas
              </div>
              <ul className="policy-list">
                {state.settings.policies.map((policy) => (
                  <li key={policy}>{policy}</li>
                ))}
              </ul>
            </div>
          </aside>

          <main className="route-frame">
            <Routes>
              <Route
                path="/"
                element={
                  <BookingFlow
                    state={state}
                    actions={actions}
                    getAvailableSlots={getAvailableSlots}
                  />
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminDashboard
                    state={state}
                    actions={actions}
                    getAvailableSlots={getAvailableSlots}
                  />
                }
              />
            </Routes>
          </main>
        </section>
      </div>
    </HashRouter>
  )
}

export default App
