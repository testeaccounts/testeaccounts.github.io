import { useState } from 'react'
import { LockKeyhole, LogOut } from 'lucide-react'
import type { User } from 'firebase/auth'
import type { SalonActions } from '../../hooks/useSalonStore'
import type { ActionResult, AdminCredentials, SalonState, SlotOption } from '../../types/domain'
import { AdminDashboard } from './AdminDashboard'

interface AdminAccessProps {
  authReady: boolean
  adminUser: User | null
  loading: boolean
  syncError: string
  state: SalonState
  actions: SalonActions
  loginAdmin: (credentials: AdminCredentials) => Promise<ActionResult<User>>
  logoutAdmin: () => Promise<void>
  getAvailableSlots: (
    serviceId: string,
    date: string,
    ignoreAppointmentId?: string,
  ) => SlotOption[]
}

export function AdminAccess({
  authReady,
  adminUser,
  loading,
  syncError,
  state,
  actions,
  loginAdmin,
  logoutAdmin,
  getAvailableSlots,
}: AdminAccessProps) {
  const [credentials, setCredentials] = useState({
    email: state.settings.adminEmail,
    password: '',
  })
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleLogin() {
    setIsSubmitting(true)
    setFeedback('')

    const result = await loginAdmin(credentials)

    setIsSubmitting(false)

    if (!result.ok) {
      setFeedback(result.error ?? 'Não foi possível entrar.')
      return
    }

    setCredentials((current) => ({
      ...current,
      password: '',
    }))
  }

  if (!authReady || loading) {
    return (
      <section className="panel-card">
        <div className="page-intro">
          <span className="eyebrow">Painel da Alissa</span>
          <h1>Carregando agenda</h1>
        </div>
      </section>
    )
  }

  if (!adminUser) {
    return (
      <section className="panel-card">
        <div className="page-intro">
          <span className="eyebrow">Painel da Alissa</span>
          <h1>Acesso admin</h1>
        </div>

        <div className="form-panel">
          <label className="input-shell">
            <span>E-mail</span>
            <input
              type="email"
              value={credentials.email}
              onChange={(event) =>
                setCredentials((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
          </label>

          <label className="input-shell">
            <span>Senha</span>
            <input
              type="password"
              value={credentials.password}
              onChange={(event) =>
                setCredentials((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleLogin()
                }
              }}
            />
          </label>

          {feedback || syncError ? (
            <div className="notice error">
              <LockKeyhole size={18} />
              <span>{feedback || syncError}</span>
            </div>
          ) : null}

          <div className="actions-row">
            <button
              type="button"
              className="primary-button"
              onClick={() => void handleLogin()}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div className="admin-layout">
      <section className="panel-card slim-panel">
        <div className="appointment-top">
          <div>
            <span className="eyebrow">Acesso liberado</span>
            <h2>Alissa</h2>
            <p>{adminUser.email}</p>
          </div>

          <button
            type="button"
            className="ghost-button"
            onClick={() => void logoutAdmin()}
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </section>

      <AdminDashboard
        state={state}
        actions={actions}
        getAvailableSlots={getAvailableSlots}
      />
    </div>
  )
}
