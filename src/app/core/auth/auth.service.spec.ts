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
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AuthService, TokenStorage],
    })
    service = TestBed.inject(AuthService)
    http = TestBed.inject(HttpTestingController)
    storage = TestBed.inject(TokenStorage)
    storage.clear()
  })

  afterEach(() => http.verify())

  it('login grava token e user', () => {
    service.login('demo@vuemind.dev', 'demo123').subscribe()
    const req = http.expectOne('/api/v1/auth/login')
    req.flush({
      accessToken: 'mock-jwt-demo',
      user: { id: 'u1', name: 'Marion Demo', email: 'demo@vuemind.dev' },
    })
    expect(service.isAuthenticated()).toBe(true)
    expect(service.token()).toBe('mock-jwt-demo')
    expect(service.user()).toEqual({
      id: 'u1',
      name: 'Marion Demo',
      email: 'demo@vuemind.dev',
    })
    expect(storage.get()).toBe('mock-jwt-demo')
  })

  it('mantém sessão vazia quando login retorna 401', () => {
    let receivedError: HttpErrorResponse | undefined

    service.login('demo@vuemind.dev', 'senha-incorreta').subscribe({
      error: (error: HttpErrorResponse) => {
        receivedError = error
      },
    })

    const req = http.expectOne('/api/v1/auth/login')
    req.flush(
      { message: 'Credenciais inválidas' },
      { status: 401, statusText: 'Unauthorized' },
    )

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
