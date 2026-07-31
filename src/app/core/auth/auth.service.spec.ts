import { HttpErrorResponse, provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { AuthService } from './auth.service'
import { TokenStorage } from './token.storage'

describe('AuthService', () => {
  let service: AuthService
  let http: HttpTestingController
  let storage: TokenStorage

  beforeEach(() => {
    // Limpa sessionStorage ANTES de criar AuthService — o signal `token`
    // é inicializado com storage.get() no construtor.
    sessionStorage.clear()
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AuthService, TokenStorage],
    })
    storage = TestBed.inject(TokenStorage)
    storage.clear()
    service = TestBed.inject(AuthService)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('login grava a sessão emitida após validar no TotalRecall', async () => {
    spyOn(window, 'fetch').and.returnValue(
      Promise.resolve({
        json: async () => ({
          valid: true,
          profile: { id: 'u1', name: 'Felipe Demo', email: 'demo@vuemind.dev' },
          system: { slug: 'angularmind', name: 'AngularMind' },
          systems: [],
          expiresAt: '2026-08-01T12:00:00.000Z',
        }),
      } as Response),
    )

    await new Promise<void>((resolve, reject) => {
      service.login('demo@vuemind.dev', 'demo123').subscribe({
        next: () => resolve(),
        error: reject,
      })
    })

    expect(service.isAuthenticated()).toBe(true)
    expect(service.token()).toBe('totalrecall:u1')
    expect(service.user()).toEqual({
      id: 'u1',
      name: 'Felipe Demo',
      email: 'demo@vuemind.dev',
    })
    expect(storage.get()).toBe('totalrecall:u1')
  })

  it('mantém sessão vazia quando TotalRecall rejeita a senha', async () => {
    let receivedError: HttpErrorResponse | undefined

    spyOn(window, 'fetch').and.returnValue(
      Promise.resolve({
        json: async () => ({ valid: false, reason: 'invalid_credentials' }),
      } as Response),
    )

    await new Promise<void>((resolve) => {
      service.login('demo@vuemind.dev', 'senha-incorreta').subscribe({
        error: (error: HttpErrorResponse) => {
          receivedError = error
          resolve()
        },
      })
    })

    expect(receivedError?.status).toBe(401)
    expect(service.isAuthenticated()).toBe(false)
    expect(service.token()).toBeNull()
    expect(service.user()).toBeNull()
    expect(storage.get()).toBeNull()
  })

  it('logout limpa sessão', () => {
    storage.set('mock-jwt-demo')
    service.logout()
    expect(service.isAuthenticated()).toBe(false)
    expect(service.user()).toBeNull()
    expect(storage.get()).toBeNull()
  })
})
