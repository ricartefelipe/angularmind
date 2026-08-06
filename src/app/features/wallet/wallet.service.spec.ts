import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { WalletService } from './wallet.service'

describe('WalletService', () => {
  let service: WalletService
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), WalletService],
    })
    service = TestBed.inject(WalletService)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('carrega saldo com bloqueado e limites', async () => {
    const promise = service.loadBalance()
    http.expectOne('/api/v1/wallet/balance').flush({
      availableCents: 250_000,
      blockedCents: 10_000,
      dailyLimitCents: 500_000,
      dailySpentCents: 20_000,
      currency: 'BRL',
    })
    await promise
    expect(service.balanceCents()).toBe(250_000)
    expect(service.blockedCents()).toBe(10_000)
    expect(service.dailyLimitCents()).toBe(500_000)
  })

  it('pagina extrato com busca', async () => {
    service.filterQ.set('mercado')
    const first = service.loadTransactions()
    const req = http.expectOne((request) => request.url === '/api/v1/wallet/transactions')
    expect(req.request.params.get('q')).toBe('mercado')
    expect(req.request.params.get('page')).toBe('1')
    req.flush({
      items: [
        {
          id: 't1',
          type: 'PIX_OUT',
          amountCents: 5000,
          description: 'Pagamento mercado',
          createdAt: '2026-07-20T10:00:00.000Z',
          counterparty: 'Mercado Central',
        },
      ],
      page: 1,
      pageSize: 20,
      total: 2,
    })
    await first
    expect(service.hasMore()).toBeTrue()

    const more = service.loadMoreTransactions()
    const moreReq = http.expectOne((request) => request.url === '/api/v1/wallet/transactions')
    expect(moreReq.request.params.get('page')).toBe('2')
    moreReq.flush({
      items: [
        {
          id: 't2',
          type: 'PIX_OUT',
          amountCents: 1000,
          description: 'Extra',
          createdAt: '2026-07-21T10:00:00.000Z',
          counterparty: 'Loja',
        },
      ],
      page: 2,
      pageSize: 20,
      total: 2,
    })
    await more
    expect(service.transactions()?.length).toBe(2)
    expect(service.hasMore()).toBeFalse()
  })
})
