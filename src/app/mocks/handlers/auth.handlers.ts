import { http, HttpResponse } from 'msw'
import { getDb } from '../data/db'
import { createCorrelationId } from '@/shared/utils/id'
import type { ApiErrorBody } from '@/shared/types/api'

const MOCK_TOKEN = 'mock-jwt-demo'

export const authHandlers = [
  http.post('*/api/v1/auth/login', async ({ request }) => {
    const correlationId = request.headers.get('X-Correlation-Id') ?? createCorrelationId()
    const { email, password } = (await request.json()) as { email: string; password: string }
    const db = getDb()

    if (email !== db.user.email || password !== db.user.password) {
      const error: ApiErrorBody = {
        code: 'INVALID_CREDENTIALS',
        message: 'Email ou senha inválidos.',
        correlationId,
      }
      return HttpResponse.json(error, { status: 401 })
    }
    return HttpResponse.json({
      accessToken: MOCK_TOKEN,
      user: { id: db.user.id, name: db.user.name, email: db.user.email },
    })
  }),
]
