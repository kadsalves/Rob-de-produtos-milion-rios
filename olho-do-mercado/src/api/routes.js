import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { session } from '../middleware/auth.js'
import { HttpError } from '../middleware/errors.js'
import { loginLimit } from '../middleware/rate-limit.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { demoIcon } from '../services/OfferMonitor.js'
import { createCopyGenerator } from '../services/CopyGenerator.js'
import { processImage } from '../services/ImageProcessor.js'
import { trackableLink } from '../services/AffiliationLinker.js'
import { simulateDispatch } from '../services/Dispatcher.js'
import { analytics } from '../services/Analytics.js'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function routes(database, config) {
  const router = Router()
  const auth = session(database, config)
  const copiesFor = createCopyGenerator(database, config)
  const dummyHash = hashPassword(randomUUID())

  async function findOffer(id) {
    if (typeof id !== 'string' || !uuid.test(id)) throw new HttpError(400, 'Identificador da oferta inválido.')
    const { rows: [offer] } = await database.query(
      'SELECT * FROM offers WHERE id=$1 AND (trending_until IS NULL OR trending_until > now())', [id])
    if (!offer) throw new HttpError(404, 'Oferta não encontrada.')
    return offer
  }

  router.get('/health', (req, res) => res.json({ status: 'ok' }))
  router.post('/auth/login', loginLimit(), async (req, res) => {
    const { email, password } = req.body || {}
    if (typeof email !== 'string' || email.length > 254 || typeof password !== 'string' || password.length > 128) {
      throw new HttpError(400, 'Preencha e-mail e senha válidos.')
    }
    const { rows: [user] } = await database.query(
      'SELECT id,email,plan,password_hash FROM users WHERE email=$1 AND active', [email.trim().toLowerCase()])
    const valid = await verifyPassword(password, user?.password_hash || await dummyHash)
    if (!user || !valid) throw new HttpError(401, 'E-mail ou senha inválidos.')
    auth.start(res, user.id)
    res.json({ user: { id: user.id, email: user.email, plan: user.plan } })
  })
  router.post('/auth/logout', (req, res) => {
    auth.end(res)
    res.sendStatus(204)
  })

  router.get('/r/:id', async (req, res) => {
    if (!uuid.test(req.params.id)) throw new HttpError(404, 'Link não encontrado.')
    const { rows: [link] } = await database.query(
      'UPDATE affiliation_links SET clicks=clicks+1 WHERE link_tracking_id=$1 RETURNING real_link', [req.params.id])
    if (!link) throw new HttpError(404, 'Link não encontrado.')
    res.redirect(302, link.real_link)
  })

  router.use(auth.require)
  router.get('/auth/me', (req, res) => res.json({ user: req.user }))
  router.get('/offers', async (req, res) => {
    const { rows } = await database.query(
      `SELECT id,title,price,discount,image_url,marketplace,category,demand_level,stock_level
       FROM offers WHERE trending_since <= now() AND (trending_until IS NULL OR trending_until > now())
       ORDER BY created_at DESC,id LIMIT 15`)
    res.json({ offers: rows.map(offer => ({ ...offer, icon: demoIcon(offer.title) })), demo: config.demo })
  })

  router.post('/uses', async (req, res) => {
    const offer = await findOffer(req.body?.offer_id)
    let copies
    try {
      copies = await copiesFor(offer)
    } catch (error) {
      console.error('Falha ao gerar copy:', error.message)
      throw new HttpError(502, 'Não foi possível gerar as copies agora. Tente novamente.')
    }
    const tracking = await trackableLink(database, config, req.user.id, offer)
    res.json({
      offer_title: offer.title, ...processImage(offer.image_url), copies,
      icon: demoIcon(offer.title), tracking_link: tracking.url
    })
  })

  router.post('/dispatch', async (req, res) => {
    const { offer_id, copy_id, channel } = req.body || {}
    if (typeof copy_id !== 'string' || !uuid.test(copy_id) || !['telegram', 'whatsapp'].includes(channel)) {
      throw new HttpError(400, 'Informe uma copy e um canal válido.')
    }
    const offer = await findOffer(offer_id)
    const { rows: [copy] } = await database.query(
      'SELECT id FROM offer_copies WHERE offer_id=$1 AND id=$2', [offer.id, copy_id])
    if (!copy) throw new HttpError(404, 'Copy não encontrada para esta oferta.')
    const id = randomUUID()
    const result = await database.transaction(async db => {
      const link = await trackableLink(db, config, req.user.id, offer, id, channel, copy_id)
      const dispatch = simulateDispatch()
      await db.query(
        `INSERT INTO user_dispatches (id,user_id,offer_id,copy_id,channel,link_tracking_id,message_id,simulated)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, req.user.id, offer.id, copy_id, channel, link.id, dispatch.message_id, dispatch.simulated])
      return { ...dispatch, tracking_link: link.url }
    })
    res.status(201).json({ success: true, ...result })
  })

  router.get('/analytics', async (req, res) => {
    const period = req.query.period ?? '30d'
    if (!['7d', '30d'].includes(period)) throw new HttpError(400, 'Selecione um período de 7 ou 30 dias.')
    res.json(await analytics(database, req.user.id, period))
  })

  return router
}
