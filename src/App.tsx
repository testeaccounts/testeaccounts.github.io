import { BellRing, CalendarClock, MapPin, Sparkles } from 'lucide-react'
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import { PortfolioCarousel } from './components/PortfolioCarousel'
import { AdminAccess } from './features/admin/AdminAccess'
import { BookingFlow } from './features/booking/BookingFlow'
import { useSalonStore } from './hooks/useSalonStore'
import { buildUpcomingDates, combineDateTime, formatLongDate, todayIso } from './lib/dateTime'
import { calculateDayOccupancy } from './lib/scheduling'

function App() {
  const {
    state,
    actions,
    getAvailableSlots,
    loading,
    authReady,
    adminUser,
    syncError,
    loginAdmin,
    logoutAdmin,
  } = useSalonStore()

  const activeServices = state.services.filter((service) => service.active)
  const bookingDates = buildUpcomingDates(state.settings.bookingWindowDays)
  const occupancyToday = calculateDayOccupancy(state, todayIso())
  const nextBookableOption = activeServices
    .flatMap((service) =>
      bookingDates.flatMap((date) => {
        const nextSlot = getAvailableSlots(service.id, date)[0]

        return nextSlot
          ? [
              {
                serviceName: service.name,
                date,
                startTime: nextSlot.startTime,
              },
            ]
          : []
      }),
    )
    .sort(
      (left, right) =>
        combineDateTime(left.date, left.startTime).getTime() -
        combineDateTime(right.date, right.startTime).getTime(),
    )[0]

  return (
    <HashRouter>
      <div className="page-frame">
        <header className="topbar">
          <div className="brand-lockup">
            <span className="brand-mark">AU</span>
            <div>
              <span className="brand-name">{state.settings.salonName}</span>
              <p>Especialista em unhas naturais e esmaltação tradicional.</p>
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
            <span className="eyebrow">Atendimento somente com hora marcada</span>
            <h1>Agende pé, mão ou pé e mão em poucos toques no celular.</h1>
            <p>
              {state.settings.tagline} Veja horários realmente livres, escolha a
              melhor data e confirme o atendimento sem depender de conversa manual.
            </p>
          </div>

          <div className="hero-stack">
            <article className="highlight-card">
              <div className="icon-badge">
                <CalendarClock size={18} />
              </div>
              <span>Próximo horário livre</span>
              <strong>
                {nextBookableOption
                  ? `${nextBookableOption.startTime} • ${nextBookableOption.serviceName}`
                  : 'Agenda em atualização'}
              </strong>
              <p>
                {nextBookableOption
                  ? formatLongDate(nextBookableOption.date)
                  : 'Entre no fluxo de agendamento para consultar as próximas vagas.'}
              </p>
            </article>

            <div className="stat-grid">
              <article className="stat-card">
                <span>Serviços ativos</span>
                <strong>{activeServices.length}</strong>
              </article>
              <article className="stat-card">
                <span>Janela aberta</span>
                <strong>{state.settings.bookingWindowDays} dias</strong>
              </article>
              <article className="stat-card">
                <span>Ocupação hoje</span>
                <strong>{occupancyToday}%</strong>
              </article>
            </div>
          </div>
        </section>

        <section className="support-grid">
          <article className="panel-card compact-panel">
            <div className="panel-chip">
              <Sparkles size={16} />
              Diferenciais
            </div>
            <ul className="highlight-list">
              {state.settings.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </article>

          <article className="panel-card compact-panel">
            <div className="panel-chip">
              <BellRing size={16} />
              Regras rápidas
            </div>
            <ul className="policy-list">
              {state.settings.policies.map((policy) => (
                <li key={policy}>{policy}</li>
              ))}
            </ul>
          </article>

          <article className="panel-card compact-panel map-card">
            <div className="panel-chip">
              <MapPin size={16} />
              Endereço
            </div>
            <strong>{state.settings.addressLabel}</strong>
            <p>Santa Fé do Sul - SP</p>
            {state.settings.mapUrl ? (
              <a
                className="primary-button full-width"
                href={state.settings.mapUrl}
                target="_blank"
                rel="noreferrer"
              >
                Abrir localização
              </a>
            ) : null}
          </article>
        </section>

        <PortfolioCarousel />

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
                <AdminAccess
                  state={state}
                  actions={actions}
                  loading={loading}
                  authReady={authReady}
                  adminUser={adminUser}
                  syncError={syncError}
                  loginAdmin={loginAdmin}
                  logoutAdmin={logoutAdmin}
                  getAvailableSlots={getAvailableSlots}
                />
              }
            />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}

export default App
