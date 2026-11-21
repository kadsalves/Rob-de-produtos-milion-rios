import { discount, money, prepareOffer, searchOffers } from './offers.mjs'

const get = id => document.getElementById(id)
const grid = get('offers')
const preview = get('preview')
const angles = Array.from(get('angles').querySelectorAll('button'))
const message = get('message')
const manual = get('manual')
let post
let copyValue
let revision = 0

function selectAngle(button) {
  revision++
  const text = post.copies[button.dataset.angle]
  get('offer-text').textContent = text
  copyValue = text + '\n\n' + post.link
  for (const angle of angles) angle.setAttribute('aria-pressed', String(button === angle))
  manual.hidden = true
  message.textContent = ''
}

function openPreview(offer) {
  post = prepareOffer(offer)
  get('product-title').textContent = offer.name
  get('offer-link').href = post.link
  selectAngle(angles[0])
  preview.showModal()
}

function renderOffers(query = '') {
  const offers = searchOffers(query)
  const cards = offers.map(offer => {
    const card = get('offer-template').content.cloneNode(true)
    card.querySelector('.marketplace').textContent = 'Shopee · ' + offer.category
    card.querySelector('.product-icon').textContent = offer.icon
    card.querySelector('.discount').textContent = '−' + discount(offer) + '%'
    card.querySelector('h3').textContent = offer.name
    card.querySelector('strong').textContent = money(offer.price)
    card.querySelector('s').textContent = money(offer.previous)
    card.querySelector('button').addEventListener('click', () => openPreview(offer))
    return card
  })
  grid.replaceChildren(...cards)
  get('empty').hidden = offers.length > 0
  get('count').textContent = offers.length + (offers.length === 1 ? ' oferta' : ' ofertas')
}

for (const button of angles) button.addEventListener('click', () => selectAngle(button))
get('search').addEventListener('input', event => renderOffers(event.currentTarget.value))
preview.addEventListener('close', () => { revision++ })
get('copy').addEventListener('click', async () => {
  const current = revision
  try {
    await navigator.clipboard.writeText(copyValue)
    if (current !== revision) return
    manual.hidden = true
    message.textContent = 'Texto e link copiados.'
  } catch {
    if (current !== revision) return
    manual.hidden = false
    const field = get('manual-text')
    field.value = copyValue
    field.focus()
    field.select()
    message.textContent = 'Selecione o texto abaixo e use a opção Copiar do navegador.'
  }
})
renderOffers()
