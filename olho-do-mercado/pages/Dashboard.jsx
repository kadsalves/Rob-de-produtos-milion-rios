import { useCallback, useEffect, useState } from 'react'
import { api, money } from '../components/api.js'
import { ProductImage } from '../components/ProductImage.jsx'
import { PreviewModal } from '../components/PreviewModal.jsx'
import { useOfferUpdates } from '../components/useOfferUpdates.js'

export function Dashboard() {
  const [feed, setFeed] = useState(null)
  const [error, setError] = useState('')
  const [preparing, setPreparing] = useState(null)
  const [preview, setPreview] = useState(null)

  const refresh = useCallback((signal) => {
    setError('')
    api('/offers', { signal }).then(setFeed).catch(error => {
      if (!signal?.aborted) setError(error.message)
    })
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    refresh(controller.signal)
    return () => controller.abort()
  }, [refresh])
  useOfferUpdates(refresh)

  async function prepare(id) {
    setPreparing(id)
    setError('')
    try {
      const data = await api('/uses', { body: { offer_id: id } })
      setPreview({ offerId: id, data })
    } catch (error) {
      setError(error.message)
    } finally {
      setPreparing(null)
    }
  }

  return <>
    <section className="hero">
      <div>
        <p className="eyebrow">Painel de afiliados</p>
        <h1>Ofertas do dia</h1>
        <p>Escolha um produto, prepare a copy e compartilhe sua oferta.</p>
      </div>
      {feed?.demo && <span className="tag">Modo demonstração</span>}
    </section>
    <div className="section-header"><h2>Ofertas disponíveis</h2>
      {feed && <span>{feed.offers.length} {feed.offers.length === 1 ? 'oferta' : 'ofertas'}</span>}
    </div>
    {error && <p role="alert">{error}</p>}
    {!feed && !error && <p role="status">Carregando ofertas…</p>}
    {feed?.offers.length === 0 && <p>Nenhuma oferta disponível agora.</p>}
    <div className="grid card-grid">
      {feed?.offers.map(offer => <article className="offer-card" key={offer.id}>
        <ProductImage image={offer.image_url} icon={offer.icon} title={offer.title} />
        <div className="card-copy">
          <div className="card-meta"><span>{offer.marketplace} · {offer.category}</span>
            <span className="discount">−{offer.discount}%</span></div>
          <h3>{offer.title}</h3>
          <p className="price">{money(offer.price)}</p>
          <button className="primary" disabled={preparing !== null} onClick={() => prepare(offer.id)}>
            {preparing === offer.id ? 'Preparando…' : 'Usar Este'}
          </button>
        </div>
      </article>)}
    </div>
    {preview && <PreviewModal {...preview} onClose={() => setPreview(null)} />}
  </>
}
