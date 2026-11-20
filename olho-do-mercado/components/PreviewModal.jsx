import { useEffect, useRef, useState } from 'react'
import { angleName, api } from './api.js'
import { ProductImage } from './ProductImage.jsx'

export function PreviewModal({ data, offerId, onClose }) {
  const dialog = useRef(null)
  const tabList = useRef(null)
  const [index, setIndex] = useState(0)
  const [channel, setChannel] = useState('telegram')
  const [feedback, setFeedback] = useState('')
  const [sending, setSending] = useState(false)
  const copy = data.copies[index]

  useEffect(() => {
    const element = dialog.current
    element.showModal()
    return () => { if (element.open) element.close() }
  }, [])

  function selectTab(next) {
    setIndex(next)
    setFeedback('')
  }

  function tabKeys(event) {
    const last = data.copies.length - 1
    const next = {
      ArrowLeft: index ? index - 1 : last,
      ArrowRight: index === last ? 0 : index + 1,
      Home: 0, End: last
    }[event.key]
    if (next === undefined) return
    event.preventDefault()
    selectTab(next)
    tabList.current.children[next].focus()
  }

  async function copyPost() {
    try {
      await navigator.clipboard.writeText(copy.copy_text + '\n\n' + data.tracking_link)
      setFeedback('Copy e link copiados.')
    } catch {
      setFeedback('Não foi possível copiar automaticamente. Selecione o texto para copiar.')
    }
  }

  async function dispatch() {
    setSending(true)
    setFeedback('')
    try {
      await api('/dispatch', { body: { offer_id: offerId, copy_id: copy.id, channel } })
      setFeedback('Envio simulado e registrado no histórico.')
    } catch (error) {
      setFeedback(error.message)
    } finally {
      setSending(false)
    }
  }

  return <dialog ref={dialog} className="preview" aria-labelledby="preview-title"
    onCancel={event => { event.preventDefault(); onClose() }}>
    <div className="modal-head">
      <div><p className="eyebrow">Preparar publicação</p><h2 id="preview-title">{data.offer_title}</h2></div>
      <button className="secondary" aria-label="Fechar prévia" onClick={onClose}>×</button>
    </div>
    <div className="tabs" role="tablist" aria-label="Ângulos da copy" ref={tabList} onKeyDown={tabKeys}>
      {data.copies.map(({ id, angle }, i) => <button key={id} id={'tab-' + angle}
        role="tab" type="button" tabIndex={i === index ? 0 : -1} aria-controls="post-copy"
        aria-selected={index === i} onClick={() => selectTab(i)}>{angleName[angle]}</button>)}
    </div>
    <div id="post-copy" role="tabpanel" tabIndex={0} aria-labelledby={'tab-' + copy.angle}>
      <div className="post-preview">
        <ProductImage image={data.image_url} icon={data.icon} title={data.offer_title} />
        <div><p className="eyebrow">Prévia do post</p><p>{copy.copy_text}</p>
          <a href={data.tracking_link} target="_blank" rel="noreferrer">Abrir link rastreado</a>
        </div>
      </div>
    </div>
    <div className="modal-actions">
      <button className="primary" onClick={copyPost}>Copiar</button>
      <label><span className="sr-only">Canal</span><select value={channel} disabled={sending}
        onChange={event => setChannel(event.target.value)}>
        <option value="telegram">Telegram</option><option value="whatsapp">WhatsApp</option>
      </select></label>
      <button className="secondary" disabled={sending} onClick={dispatch}>{sending ? 'Registrando…' : 'Simular envio'}</button>
    </div>
    <p className="feedback" role="status">{feedback}</p>
  </dialog>
}
