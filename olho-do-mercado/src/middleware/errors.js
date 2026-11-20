export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export function errors(error, req, res, next) {
  if (res.headersSent) return next(error)
  const status = error.status >= 400 && error.status < 500 ? error.status : 500
  if (status === 500) console.error(error)
  const message = error instanceof HttpError ? error.message :
    status === 400 ? 'JSON inválido.' : status === 413 ? 'Solicitação grande demais.' : 'Erro interno.'
  res.status(status).json({ error: message })
}
