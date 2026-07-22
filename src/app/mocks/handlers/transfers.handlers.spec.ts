import { executePix } from './transfers.handlers'
import { getDb, resetDb } from '../data/db'

describe('executePix', () => {
  beforeEach(() => resetDb())

  it('debita saldo e registra PIX_OUT', () => {
    const db = getDb()
    const before = db.availableCents
    const transfer = executePix(db, {
      beneficiaryId: 'b1',
      amountCents: 1_000,
      idempotencyKey: 'k1',
    })
    expect(transfer.status).toBe('COMPLETED')
    expect(db.availableCents).toBe(before - 1_000)
    expect(db.transactions[0].type).toBe('PIX_OUT')
  })

  it('rejeita saldo insuficiente', () => {
    const db = getDb()
    expect(() =>
      executePix(db, {
        beneficiaryId: 'b1',
        amountCents: db.availableCents + 1,
        idempotencyKey: 'k2',
      }),
    ).toThrowError('INSUFFICIENT_FUNDS')
  })

  it('é idempotente para a mesma chave', () => {
    const db = getDb()
    const a = executePix(db, {
      beneficiaryId: 'b1',
      amountCents: 500,
      idempotencyKey: 'same',
    })
    const balance = db.availableCents
    const b = executePix(db, {
      beneficiaryId: 'b1',
      amountCents: 500,
      idempotencyKey: 'same',
    })
    expect(b.id).toBe(a.id)
    expect(db.availableCents).toBe(balance)
  })
})
