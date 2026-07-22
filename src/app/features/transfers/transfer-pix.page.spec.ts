import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { TransferPixPage } from './transfer-pix.page'

describe('TransferPixPage', () => {
  let page: TransferPixPage
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
    page = TestBed.runInInjectionContext(() => new TransferPixPage())
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('percorre formulário, confirmação e comprovante', () => {
    page.beneficiaries.items.set([
      { id: 'beneficiary-1', name: 'Ana', pixKey: 'ana@example.com' },
    ])
    page.beneficiaryId = 'beneficiary-1'
    page.amountReais = '10,50'

    page.goConfirm()

    expect(page.amountCents()).toBe(1050)
    expect(page.selectedName()).toBe('Ana')
    expect(page.step()).toBe('confirm')

    page.confirm()
    http.expectOne('/api/v1/transfers/pix').flush({
      id: 'transfer-1',
      beneficiaryId: 'beneficiary-1',
      amountCents: 1050,
      status: 'COMPLETED',
      createdAt: '2026-07-22T12:00:00.000Z',
    })
    http.expectOne('/api/v1/wallet/balance').flush({ availableCents: 98_950 })
    expect(page.step()).toBe('receipt')

    page.again()
    expect(page.step()).toBe('form')
    expect(page.beneficiaryId).toBe('')
    expect(page.amountReais).toBe('')
  })

  it('mantém o formulário quando os dados são inválidos', () => {
    page.amountReais = '-10'

    page.goConfirm()

    expect(page.step()).toBe('form')
    expect(page.formError()).toBe('Valor inválido. Use formato como 10,50.')
  })
})
