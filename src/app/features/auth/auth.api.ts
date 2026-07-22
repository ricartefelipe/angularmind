import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import type { Observable } from 'rxjs'
import type { LoginRequest, LoginResponse } from './types'

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient)

  login(body: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/v1/auth/login', body)
  }
}
