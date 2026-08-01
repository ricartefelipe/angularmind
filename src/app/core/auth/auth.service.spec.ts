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

  it('login grava a sessão emitida pela API nativa', async () => {
    const pending = new Promise<void>((resolve, reject) => {
      service.login('demo@vuemind.dev', 'demo123').subscribe({
        next: () => resolve(),
        error: reject,
      })
    })

    const req = http.expectOne('/api/v1/auth/login')
    expect(req.request.method).toBe('POST')
    req.flush({
      accessToken: 'mock-jwt-demo',
      user: { id: 'u1', name: 'Felipe Demo', email: 'demo@vuemind.dev' },
    })

    await pending

    expect(service.isAuthenticated()).toBe(true)
    expect(service.token()).toBe('mock-jwt-demo')
    expect(service.user()).toEqual({
      id: 'u1',
      name: 'Felipe Demo',
      email: 'demo@vuemind.dev',
    })
    expect(storage.get()).toBe('mock-jwt-demo')
  })

  it('mantém sessão vazia quando a API rejeita a senha', async () => {
    let receivedError: HttpErrorResponse | undefined

    const pending = new Promise<void>((resolve) => {
      service.login('demo@vuemind.dev', 'senha-incorreta').subscribe({
        error: (error: HttpErrorResponse) => {
          receivedError = error
          resolve()
        },
      })
    })

    const req = http.expectOne('/api/v1/auth/login')
    req.flush(
      { code: 'INVALID_CREDENTIALS', message: 'Email ou senha inválidos.' },
      { status: 401, statusText: 'Unauthorized' },
    )

    await pending

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
