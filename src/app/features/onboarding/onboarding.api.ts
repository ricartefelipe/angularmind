import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import type { OnboardingStatus } from './types'

@Injectable({ providedIn: 'root' })
export class OnboardingApi {
  private readonly http = inject(HttpClient)

  getStatus() {
    return this.http.get<OnboardingStatus>('/api/v1/me/onboarding')
  }
}
