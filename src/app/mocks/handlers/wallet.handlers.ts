import { http, HttpResponse } from 'msw'
import { getDb } from '../data/db'

export const walletHandlers = [
  http.get('*/api/v1/wallet/balance', () => {
    const db = getDb()
    return HttpResponse.json({ availableCents: db.availableCents, currency: 'BRL' })
  }),

  http.get('*/api/v1/wallet/transactions', ({ request }) => {
    const db = getDb()
    const url = new URL(request.url)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const type = url.searchParams.get('type')
    const items = db.transactions.filter((transaction) => {
      if (from && transaction.createdAt < from) return false
      if (to && transaction.createdAt > to) return false
      if (type && type !== 'ALL' && transaction.type !== type) return false
      return true
    })
    return HttpResponse.json({ items })
  }),
]
