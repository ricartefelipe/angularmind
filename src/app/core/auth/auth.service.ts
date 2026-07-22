import { Injectable, computed, inject, signal } from '@angular/core'
import { tap } from 'rxjs'
import { AuthApi } from '@/features/auth/auth.api'
import type { LoginResponse, User } from '@/features/auth/types'
import { TokenStorage } from './token.storage'

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi)
  private readonly storage = inject(TokenStorage)

  readonly token = signal<string | null>(this.storage.get())
  readonly user = signal<User | null>(null)
  readonly isAuthenticated = computed(() => this.token() !== null)

  login(email: string, password: string) {
    return this.api.login({ email, password }).pipe(
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
