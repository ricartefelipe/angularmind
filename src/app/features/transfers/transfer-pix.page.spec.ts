import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { TransferPixPage } from './transfer-pix.page'

describe('TransferPixPage', () => {
  let page: TransferPixPage
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
    page = TestBed.runInInjectionContext(() => new TransferPixPage())
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('percorre destino, valor, agendar, confirmação e comprovante', async () => {
    page.beneficiaries.items.set([
      { id: 'beneficiary-1', name: 'Ana', pixKey: 'ana@example.com', pixKeyType: 'EMAIL' },
    ])
    page.beneficiaryId = 'beneficiary-1'
    page.submitDestination()
    expect(page.transfers.step()).toBe('amount')

    page.amountReais = '10,50'
    page.submitAmount()
    expect(page.transfers.step()).toBe('schedule')

    page.transfers.skipSchedule()
    expect(page.transfers.step()).toBe('confirm')

    const confirm = page.transfers.confirmPix()
    http.expectOne('/api/v1/transfers/pix').flush({
      id: 'transfer-1',
      beneficiaryId: 'beneficiary-1',
      amountCents: 1050,
      status: 'COMPLETED',
      createdAt: '2026-07-22T12:00:00.000Z',
      endToEndId: 'E2E123',
      correlationId: 'correlation-1',
    })
    await confirm
    expect(page.transfers.step()).toBe('receipt')
    expect(page.transfers.lastReceipt()?.endToEndId).toBe('E2E123')

    page.again()
    expect(page.transfers.step()).toBe('destination')
    expect(page.beneficiaryId).toBe('')
  })

  it('mantém o step de valor quando o valor é inválido', () => {
    page.transfers.setDestination({ mode: 'beneficiary', beneficiaryId: 'b1' })
    page.amountReais = '-10'
    page.submitAmount()
    expect(page.transfers.step()).toBe('amount')
    expect(page.amountError()).toBeTruthy()
  })
})
