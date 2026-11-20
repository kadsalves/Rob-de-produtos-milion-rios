import { NavLink } from 'react-router-dom'

export function Brand() {
  return <div className="brand"><span className="eye" aria-hidden="true">◉</span><span>Olho do Mercado</span></div>
}

export function Shell({ children, onLogout, error }) {
  return <>
    <header className="topbar">
      <div className="frame bar-content">
        <Brand />
        <nav aria-label="Menu principal">
          <NavLink to="/dashboard">Ofertas</NavLink>
          <NavLink to="/analytics">Análises</NavLink>
        </nav>
        <button className="secondary logout" onClick={onLogout}>Sair</button>
      </div>
    </header>
    <main className="frame">{error && <p role="alert">{error}</p>}{children}</main>
  </>
}
