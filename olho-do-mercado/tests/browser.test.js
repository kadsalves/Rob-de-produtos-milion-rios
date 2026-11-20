import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chromium } from 'playwright-core'

test('Chromium: login, dashboard, cinco copies, clipboard, histórico e logout', { timeout: 60_000 }, async t => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXECUTABLE || undefined,
    ...(process.env.BROWSER_EXECUTABLE ? {} : { channel: 'chromium' })
  })
  t.after(() => browser.close())
  const base = process.env.TEST_WEB_URL || 'http://localhost:5173'
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await context.newPage()
  await page.goto(base + '/dashboard')
  await page.waitForURL('**/login')
  await page.getByLabel('E-mail').fill(process.env.DEMO_EMAIL || 'demo@olhodomercado.local')
  await page.getByLabel('Senha').fill(process.env.DEMO_PASSWORD || 'OlhoDemo2026!')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL('**/dashboard')
  const offers = page.getByRole('button', { name: 'Usar Este' })
  await offers.first().waitFor()
  assert.equal(await offers.count(), 12)
  await offers.first().click()
  const modal = page.getByRole('dialog')
  await modal.waitFor()
  assert.equal(await modal.getByRole('tab').count(), 5)
  await modal.getByRole('tab', { name: 'Barganha' }).click()
  const text = await modal.getByRole('tabpanel').locator('p').last().innerText()
  await modal.getByRole('button', { name: 'Copiar', exact: true }).click()
  await modal.getByText('Copy e link copiados.').waitFor()
  const clipboard = await page.evaluate(() => navigator.clipboard.readText())
  assert.equal(clipboard, text + '\n\n' + await modal.getByRole('link').getAttribute('href'))
  await modal.getByRole('button', { name: 'Simular envio' }).click()
  await modal.getByText('Envio simulado e registrado no histórico.').waitFor()
  await modal.getByRole('button', { name: 'Fechar prévia' }).click()
  await page.getByRole('link', { name: 'Análises' }).click()
  await page.getByRole('cell', { name: 'Telegram (simulado)' }).first().waitFor()
  await page.getByRole('button', { name: 'Sair' }).click()
  await page.waitForURL('**/login')
  await page.getByRole('button', { name: 'Entrar' }).waitFor()
})
