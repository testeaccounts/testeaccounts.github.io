import { HashRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { PortfolioCarousel } from './components/PortfolioCarousel'
import { AdminAccess } from './features/admin/AdminAccess'
import { BookingFlow } from './features/booking/BookingFlow'
import { useSalonStore } from './hooks/useSalonStore'

function AppShell() {
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
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <div className="page-frame">
      <header className="topbar">
        <NavLink to="/" className="brand-lockup" aria-label="Ir para agendamento">
          <span className="brand-mark">AU</span>
          <span className="brand-name">{state.settings.salonName}</span>
        </NavLink>

        {isAdminRoute ? (
          <nav className="nav-pills" aria-label="Navegacao">
            <NavLink to="/" className="nav-pill">
              Cliente
            </NavLink>
          </nav>
        ) : null}
      </header>

      <main className="route-frame">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <BookingFlow
                  state={state}
                  actions={actions}
                  getAvailableSlots={getAvailableSlots}
                />
                <PortfolioCarousel />
              </>
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
  )
}

function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  )
}

export default App
