import { randomUUID } from 'node:crypto'

export function simulateDispatch() {
  return { message_id: 'mock-' + randomUUID(), simulated: true }
}
