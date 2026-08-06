import { normalizeTransactionsPage, normalizeWalletBalance } from './normalize-wallet'

describe('normalize wallet', () => {
  it('preenche campos de saldo ausentes com zero', () => {
    expect(normalizeWalletBalance({ availableCents: 250_000, currency: 'BRL' })).toEqual({
      availableCents: 250_000,
      blockedCents: 0,
      dailyLimitCents: 0,
      dailySpentCents: 0,
      currency: 'BRL',
    })
  })

  it('normaliza extrato parcial sem page/total', () => {
    const page = normalizeTransactionsPage(
      {
        items: [
          {
            id: 't1',
            type: 'PIX_IN',
            amountCents: 50000,
            description: 'Recebido',
            createdAt: '2026-07-20T10:00:00.000Z',
            counterparty: 'Carlos',
          },
        ],
      },
      1,
      5,
    )
    expect(page.page).toBe(1)
    expect(page.pageSize).toBe(5)
    expect(page.total).toBe(1)
    expect(page.items[0]?.amountCents).toBe(50_000)
  })
})
