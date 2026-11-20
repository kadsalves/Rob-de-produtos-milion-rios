export async function api(path, { body, ...options } = {}) {
  const response = await fetch('/api' + path, {
    ...options,
    ...(body !== undefined ? {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    } : {})
  })
  if (response.status === 204) return null
  const result = await response.json()
  if (!response.ok) {
    const error = new Error(result.error || 'Não foi possível concluir a operação.')
    error.status = response.status
    throw error
  }
  return result
}

export const money = value => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL'
}).format(value)

export const angleName = {
  emocional: 'Emocional', fomo: 'Urgência', barganha: 'Barganha', social: 'Prova social', cta: 'CTA curto'
}
