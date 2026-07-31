import { Injectable, computed, inject, signal } from '@angular/core'
import { defer, from, map, switchMap, tap, throwError } from 'rxjs'
import { environment } from '../../../environments/environment'
import { AuthApi } from '@/features/auth/auth.api'
import type { LoginResponse, User } from '@/features/auth/types'
import { ApiError } from '../http/api-error'
import { loginTotalRecall, totalRecallSession } from '@/shared/totalrecall'
import { TokenStorage } from './token.storage'

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi)
  private readonly storage = inject(TokenStorage)

  readonly token = signal<string | null>(this.storage.get())
  readonly user = signal<User | null>(null)
  readonly isAuthenticated = computed(() => this.token() !== null)

  login(email: string, password: string) {
    const response$ = environment.enableMsw
      ? this.api.login({ email, password })
      : defer(() => from(loginTotalRecall(email, password, 'angularmind'))).pipe(
          switchMap((result) => {
            if (!result) {
              return throwError(
                () =>
                  new ApiError(
                    503,
                    'TOTALRECALL_UNAVAILABLE',
                    'Não foi possível validar o acesso. Tente novamente.',
                    '',
                  ),
              )
            }
            if (!result.valid) {
              return throwError(
                () => new ApiError(401, 'INVALID_CREDENTIALS', 'Email ou senha inválidos.', ''),
              )
            }
            return [totalRecallSession(result)]
          }),
          map((result) => result as LoginResponse),
        )

    return response$.pipe(
      tap((response: LoginResponse) => {
        this.storage.set(response.accessToken)
        this.token.set(response.accessToken)
        this.user.set(response.user)
      }),
    )
  }

  logout(): void {
    this.storage.clear()
    this.token.set(null)
    this.user.set(null)
  }
}
