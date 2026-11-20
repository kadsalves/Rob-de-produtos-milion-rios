import { useEffect, useState } from 'react'
import { angleName, api, money } from '../components/api.js'
import { Chart } from '../components/Chart.jsx'

const percent = value => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%'
const date = value => new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo'
}).format(new Date(value))

export function Analytics() {
  const [period, setPeriod] = useState('30d')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    api('/analytics?period=' + period, { signal: controller.signal }).then(setData).catch(error => {
      if (!controller.signal.aborted) setError(error.message)
    })
    return () => controller.abort()
  }, [period])

  return <>
    <section className="hero">
      <div><p className="eyebrow">Desempenho</p><h1>Análises</h1><p>Acompanhe envios, cliques e conversões.</p></div>
      <label>Período <select value={period} onChange={event => {
        setData(null)
        setError('')
        setPeriod(event.target.value)
      }}><option value="30d">Últimos 30 dias</option><option value="7d">Últimos 7 dias</option></select></label>
    </section>
    {error && <p role="alert">{error}</p>}
    {!data && !error && <p role="status">Carregando desempenho…</p>}
    {data && <>
      <dl className="stats">{Object.entries({
        Envios: data.totals.dispatches, Cliques: data.totals.clicks,
        Conversões: data.totals.conversions, 'Comissão': money(data.totals.commission)
      }).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <div className="charts">
        <Chart title="Conversões por ângulo" data={data.charts.byAngle.map(({ label, value }) => ({
          label: angleName[label], value
        }))} />
        <Chart title="Cliques por hora de envio" data={data.charts.byHour} />
        <Chart title="ROI por marketplace" data={data.charts.byMarketplace} format={percent} />
      </div>
      <div className="section-header"><h2>Histórico de envios</h2></div>
      {data.history.length ? <div className="table-wrap"><table>
        <thead><tr>{['Oferta', 'Ângulo', 'Canal', 'Data', 'Cliques', 'Conversões', 'ROI'].map(key =>
          <th key={key} scope="col">{key}</th>)}</tr></thead>
        <tbody>{data.history.map(row => <tr key={row.id}>
          <td>{row.title}</td><td>{angleName[row.angle]}</td>
          <td>{row.channel === 'telegram' ? 'Telegram' : 'WhatsApp'}{row.simulated && ' (simulado)'}</td>
          <td>{date(row.sent_at)}</td><td>{row.clicks}</td><td>{row.conversions}</td>
          <td>{row.roi === null ? '—' : percent(row.roi)}</td>
        </tr>)}</tbody>
      </table></div> : <p>Nenhum envio registrado neste período.</p>}
    </>}
  </>
}
