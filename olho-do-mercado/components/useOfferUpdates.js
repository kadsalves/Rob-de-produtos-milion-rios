import { useEffect } from 'react'

export function useOfferUpdates(onUpdate) {
  useEffect(() => {
    const endpoint = import.meta.env.VITE_OFFERS_WS_URL
    if (!endpoint) return
    const socket = new WebSocket(endpoint)
    const event = message => {
      if (message.data === 'offers.updated') onUpdate()
    }
    socket.addEventListener('message', event)
    return () => {
      socket.removeEventListener('message', event)
      socket.close()
    }
  }, [onUpdate])
}
