import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from '../components/Shell.jsx'
import { api } from '../components/api.js'
import { Dashboard } from './Dashboard.jsx'
import { Analytics } from './Analytics.jsx'
import { Login } from './Login.jsx'
import '../styles/main.css'

function App() {
  const [user, setUser] = useState(undefined)
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    api('/auth/me', { signal: controller.signal }).then(({ user }) => setUser(user)).catch(error => {
      if (controller.signal.aborted) return
      if (error.status !== 401) setError('Não foi possível consultar a sessão. Recarregue a página.')
      setUser(null)
    })
    return () => controller.abort()
  }, [])

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' })
      setUser(null)
    } catch (error) {
      setError(error.message)
    }
  }

  if (user === undefined) return <p className="frame" role="status">Abrindo painel…</p>
  if (user === null) return <>
    {error && <p className="frame" role="alert">{error}</p>}
    <Routes>
      <Route path="/login" element={<Login onLogin={user => { setError(''); setUser(user) }} />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </>
  return <Shell onLogout={logout} error={error}>
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Shell>
}

createRoot(document.getElementById('root')).render(<BrowserRouter><App /></BrowserRouter>)
