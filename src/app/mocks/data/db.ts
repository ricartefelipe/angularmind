export type MockUser = {
  id: string
  name: string
  email: string
  password: string
}

export type Beneficiary = {
  id: string
  name: string
  pixKey: string
}

export type Transaction = {
  id: string
  type: 'PIX_OUT' | 'PIX_IN' | 'TED'
  amountCents: number
  description: string
  createdAt: string
  counterparty: string
}

export type Transfer = {
  id: string
  beneficiaryId: string
  amountCents: number
  status: 'COMPLETED'
  createdAt: string
}

export type Db = {
  user: MockUser
  availableCents: number
  beneficiaries: Beneficiary[]
  transactions: Transaction[]
  transfers: Transfer[]
  idempotency: Map<string, Transfer>
}

const seed = (): Db => ({
  user: {
    id: 'u1',
    name: 'Felipe Demo',
    email: 'demo@vuemind.dev',
    password: 'demo123',
  },
  availableCents: 250_000,
  beneficiaries: [
    { id: 'b1', name: 'Ana Silva', pixKey: 'ana@email.com' },
    { id: 'b2', name: 'Mercado Central', pixKey: '11222333000181' },
  ],
  transactions: [
    {
      id: 't1',
      type: 'PIX_IN',
      amountCents: 50_000,
      description: 'Recebido',
      createdAt: '2026-07-20T10:00:00.000Z',
      counterparty: 'Carlos',
    },
  ],
  transfers: [],
  idempotency: new Map(),
})

let db = seed()

export function getDb(): Db {
  return db
}

export function resetDb(): void {
  db = seed()
}
