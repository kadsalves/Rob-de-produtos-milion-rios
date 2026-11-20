export async function analytics(database, userId, period) {
  const days = period === '7d' ? 7 : 30
  const { rows } = await database.query(
    `SELECT d.id,d.sent_at,d.channel,d.simulated,d.investment,d.commission,
       o.title,o.marketplace,c.angle,l.clicks,l.conversions
     FROM user_dispatches d JOIN offers o ON o.id=d.offer_id
     JOIN offer_copies c ON c.id=d.copy_id JOIN affiliation_links l ON l.link_tracking_id=d.link_tracking_id
     WHERE d.user_id=$1 AND d.sent_at >= now() - ($2::int * interval '1 day')
     ORDER BY d.sent_at DESC,d.id`, [userId, days])
  const formatHour = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', hour: '2-digit', hourCycle: 'h23'
  })
  const byAngle = new Map()
  const byHour = new Map()
  const marketplaces = new Map()
  let clicks = 0
  let conversions = 0
  let commission = 0

  for (const dispatch of rows) {
    clicks += dispatch.clicks
    conversions += dispatch.conversions
    commission += Number(dispatch.commission)
    byAngle.set(dispatch.angle, (byAngle.get(dispatch.angle) || 0) + dispatch.conversions)
    const hour = formatHour.format(new Date(dispatch.sent_at)) + 'h'
    byHour.set(hour, (byHour.get(hour) || 0) + dispatch.clicks)
    const totals = marketplaces.get(dispatch.marketplace) || { commission: 0, investment: 0 }
    if (dispatch.investment !== null) {
      totals.commission += Number(dispatch.commission)
      totals.investment += Number(dispatch.investment)
    }
    marketplaces.set(dispatch.marketplace, totals)
  }
  const series = map => Array.from(map, ([label, value]) => ({ label, value }))
  return {
    period,
    totals: { dispatches: rows.length, clicks, conversions, commission },
    charts: {
      byAngle: series(byAngle),
      byHour: series(byHour).sort((a, b) => a.label.localeCompare(b.label)),
      byMarketplace: Array.from(marketplaces, ([label, { investment, commission }]) => ({
        label, value: investment > 0 ? ((commission - investment) / investment) * 100 : null
      }))
    },
    history: rows.slice(0, 30).map(row => ({
      ...row,
      roi: Number(row.investment) > 0 ? ((Number(row.commission) - Number(row.investment)) / Number(row.investment)) * 100 : null
    }))
  }
}
