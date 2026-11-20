export function Chart({ title, data, format = value => String(value) }) {
  const max = Math.max(1, ...data.map(({ value }) => Math.abs(value || 0)))
  return <article className="chart">
    <h2>{title}</h2>
    {!data.length && <p>Sem dados neste período.</p>}
    {data.length > 0 && <ul>
      {data.map(({ label, value }) => <li key={label}>
        <span>{label}</span><strong>{value === null ? 'Sem investimento' : format(value)}</strong>
        {value !== null && <progress aria-label={label} value={Math.abs(value)} max={max} />}
      </li>)}
    </ul>}
  </article>
}
