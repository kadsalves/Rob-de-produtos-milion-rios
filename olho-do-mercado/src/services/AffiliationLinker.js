import { randomUUID } from 'node:crypto'
import { HttpError } from '../middleware/errors.js'

export async function trackableLink(database, config, userId, offer, scope = 'preview', channel = 'clipboard', copyId) {
  const destination = new URL(offer.destination_url)
  if (!['http:', 'https:'].includes(destination.protocol)) throw new HttpError(422, 'Link da oferta inválido.')
  for (const [key, value] of Object.entries({
    utm_source: 'olho_do_mercado', utm_medium: channel, utm_campaign: 'offer_' + offer.id,
    ...(copyId ? { utm_content: 'copy_' + copyId } : {})
  })) destination.searchParams.set(key, value)
  const { rows: [link] } = await database.query(
    `INSERT INTO affiliation_links (link_tracking_id,user_id,offer_id,scope,real_link)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (user_id,offer_id,scope) DO UPDATE SET real_link = excluded.real_link
     RETURNING link_tracking_id`,
    [randomUUID(), userId, offer.id, scope, destination.href])
  return {
    id: link.link_tracking_id,
    url: new URL('/api/r/' + link.link_tracking_id, config.publicUrl).href
  }
}
