import { provideHttpClient } from '@angular/common/http'
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

  it('logout limpa sessão', () => {
    storage.set('mock-jwt-demo')
    service.logout()
    expect(service.isAuthenticated()).toBe(false)
    expect(service.user()).toBeNull()
    expect(storage.get()).toBeNull()
  })
})
