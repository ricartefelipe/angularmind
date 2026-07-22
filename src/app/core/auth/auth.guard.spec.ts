import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router'
import { AuthService } from './auth.service'
import { authGuard } from './auth.guard'
import { TokenStorage } from './token.storage'

describe('authGuard', () => {
  it('redireciona para /login quando não autenticado', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        AuthService,
        TokenStorage,
      ],
    })

    const storage = TestBed.inject(TokenStorage)
    const router = TestBed.inject(Router)
    storage.clear()

    const result = TestBed.runInInjectionContext(() =>
      authGuard(new ActivatedRouteSnapshot(), {} as RouterStateSnapshot),
    )

    expect(result instanceof UrlTree).toBe(true)
    expect(router.serializeUrl(result as UrlTree)).toBe('/login')
  })
})
