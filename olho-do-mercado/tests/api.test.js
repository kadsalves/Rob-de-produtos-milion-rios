import assert from 'node:assert/strict'
import { once } from 'node:events'
import { test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { createApp } from '../src/app.js'
import { openDatabase } from '../src/models/database.js'
import { createUser } from '../src/models/users.js'
import { seedDemoOffers } from '../src/services/OfferMonitor.js'
import { settings } from '../src/utils/config.js'

test('API: autenticação, ofertas, copies, dois canais, rastreamento e isolamento', async t => {
  const config = settings({ LOCAL_DB_PATH: 'memory://' })
  const database = await openDatabase(config)
  t.after(() => database.close())
  await createUser(database, 'teste@local.test', 'SenhaLocal2026!')
  await createUser(database, 'outra@local.test', 'SenhaLocal2026!')
  await seedDemoOffers(database)
  const server = createApp(database, config).listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(async () => {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  })
  const base = 'http://127.0.0.1:' + server.address().port
  const request = (path, { cookie, body, origin, ...options } = {}) => fetch(base + '/api' + path, {
    ...options,
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(origin ? { Origin: origin } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { method: 'POST', body: JSON.stringify(body) } : {})
  })
  const login = (email, password = 'SenhaLocal2026!') => request('/auth/login', { body: { email, password } })

  assert.equal((await request('/offers')).status, 401)
  assert.equal((await login('teste@local.test', 'errada')).status, 401)
  assert.equal((await request('/auth/logout', { method: 'POST', origin: 'https://external.test' })).status, 403)
  const authenticated = await login('TESTE@local.test')
  assert.equal(authenticated.status, 200)
  const session = authenticated.headers.get('set-cookie')
  assert.match(session, /HttpOnly/i)
  const cookie = session.split(';')[0]
  const { offers } = await (await request('/offers', { cookie })).json()
  assert.equal(offers.length, 12)
  const offer = offers[0]
  const body = { offer_id: offer.id }
  const [view, repeated] = await Promise.all([
    request('/uses', { cookie, body }).then(res => res.json()),
    request('/uses', { cookie, body }).then(res => res.json())
  ])
  assert.equal(view.tracking_link, repeated.tracking_link)
  assert.deepEqual(view.copies, repeated.copies)
  assert.deepEqual(view.copies.map(copy => copy.angle), ['emocional', 'fomo', 'barganha', 'social', 'cta'])

  const dispatchBody = { offer_id: offer.id, copy_id: view.copies[2].id }
  assert.equal((await request('/dispatch', { cookie, body: { ...dispatchBody, channel: 'outro' } })).status, 400)
  assert.equal((await request('/dispatch', {
    cookie, body: { ...dispatchBody, copy_id: randomUUID(), channel: 'telegram' }
  })).status, 404)
  for (const channel of ['telegram', 'whatsapp']) {
    const dispatch = await request('/dispatch', { cookie, body: { ...dispatchBody, channel } })
    assert.equal(dispatch.status, 201)
    const result = await dispatch.json()
    assert.equal(result.simulated, true)
    const redirect = await fetch(base + new URL(result.tracking_link).pathname, { redirect: 'manual' })
    assert.equal(redirect.status, 302)
    assert.equal(new URL(redirect.headers.get('location')).searchParams.get('utm_medium'), channel)
  }
  const response = await request('/analytics?period=7d', { cookie })
  assert.equal(response.status, 200)
  const analysis = await response.json()
  assert.equal(analysis.totals.dispatches, 2)
  assert.equal(analysis.totals.clicks, 2)
  assert.ok(analysis.history.every(row => row.roi === null))
  await database.query('UPDATE user_dispatches SET investment=10, commission=15 WHERE id=$1', [analysis.history[0].id])
  const withRoi = await request('/analytics', { cookie }).then(response => response.json())
  assert.equal(withRoi.history[0].roi, 50)
  assert.equal(withRoi.charts.byMarketplace[0].value, 50)
  const otherCookie = (await login('outra@local.test')).headers.get('set-cookie').split(';')[0]
  const other = await request('/analytics', { cookie: otherCookie }).then(response => response.json())
  assert.equal(other.totals.dispatches, 0)
  const logout = await request('/auth/logout', { cookie, method: 'POST' })
  assert.equal(logout.status, 204)
  assert.match(logout.headers.get('set-cookie'), /^olho_session=;/)
})
