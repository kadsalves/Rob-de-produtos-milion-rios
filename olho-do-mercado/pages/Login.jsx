import { useState } from 'react'
import { Brand } from '../components/Shell.jsx'
import { api } from '../components/api.js'

export function Login({ onLogin }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    const body = Object.fromEntries(new FormData(event.currentTarget))
    setError('')
    setBusy(true)
    try {
      const { user } = await api('/auth/login', { body })
      onLogin(user)
    } catch (error) {
      setError(error.message)
      setBusy(false)
    }
  }

  return <main className="login">
    <section className="login-card">
      <Brand />
      <h1>Acesse sua conta</h1>
      <form onSubmit={submit}>
        <label>E-mail<input type="email" name="email" required autoComplete="username" /></label>
        <label>Senha<input type="password" name="password" required autoComplete="current-password" /></label>
        {error && <p role="alert">{error}</p>}
        <button className="primary" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </section>
  </main>
}
