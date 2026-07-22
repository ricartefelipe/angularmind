import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { TransfersService } from './transfers.service'

describe('TransfersService', () => {
  let service: TransfersService
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), TransfersService],
    })
    service = TestBed.inject(TransfersService)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('reutiliza a chave criada ao entrar na confirmação', () => {
    service.beginConfirm()
    service.confirmPix('beneficiary-1', 1050)

    const firstRequest = http.expectOne('/api/v1/transfers/pix')
    const idempotencyKey = firstRequest.request.headers.get('Idempotency-Key')
    expect(idempotencyKey).toBeTruthy()
    firstRequest.flush(
      {
        code: 'INSUFFICIENT_FUNDS',
        message: 'Saldo insuficiente para completar essa transferência.',
        correlationId: 'correlation-1',
      },
      { status: 409, statusText: 'Conflict' },
    )

    service.confirmPix('beneficiary-1', 1050)
    const retryRequest = http.expectOne('/api/v1/transfers/pix')
    expect(retryRequest.request.headers.get('Idempotency-Key')).toBe(idempotencyKey)
    retryRequest.flush({
      id: 'transfer-1',
      beneficiaryId: 'beneficiary-1',
      amountCents: 1050,
      status: 'COMPLETED',
      createdAt: '2026-07-22T12:00:00.000Z',
    })
  })
})
