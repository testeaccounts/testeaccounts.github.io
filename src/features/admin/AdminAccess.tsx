import { useState } from 'react'
import { LockKeyhole, LogOut, ShieldCheck } from 'lucide-react'
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
      setFeedback(
        result.error ??
          'Não foi possível autenticar a Alyssa agora. Confira e-mail, senha e o provedor de login no Firebase.',
      )
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
          <span className="eyebrow">Painel da Alyssa</span>
          <h1>Conectando com o Firebase</h1>
          <p>Carregando autenticação e os dados da agenda em tempo real.</p>
        </div>
      </section>
    )
  }

  if (!adminUser) {
    return (
      <section className="panel-card">
        <div className="page-intro">
          <span className="eyebrow">Painel protegido</span>
          <h1>Entre com a senha da Alyssa</h1>
          <p>
            O painel administrativo agora usa Firebase Auth. Entre com e-mail e
            senha para liberar agenda, clientes, bloqueios e notificações.
          </p>
        </div>

        <div className="summary-card">
          <label className="input-shell">
            <span>E-mail do admin</span>
            <input
              type="email"
              placeholder="alyssa@email.com"
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
              placeholder="Digite sua senha"
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

          <div className="actions-row wrap">
            <button
              type="button"
              className="primary-button"
              onClick={() => void handleLogin()}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Entrando...' : 'Entrar no painel'}
            </button>
          </div>

          <div className="bullet-list">
            <span className="mini-note">
              Dica: ative o provedor Email/Password no Firebase Authentication e
              crie a usuária da Alyssa no console.
            </span>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div className="admin-layout">
      <section className="panel-card">
        <div className="appointment-top">
          <div>
            <span className="eyebrow">Acesso liberado</span>
            <h2>Bem-vinda, Alyssa</h2>
            <p>{adminUser.email}</p>
          </div>

          <div className="actions-row wrap">
            <div className="panel-chip">
              <ShieldCheck size={16} />
              Firebase Auth ativo
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
