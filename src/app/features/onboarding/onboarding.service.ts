import { Injectable, computed, inject, signal } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { OnboardingApi } from './onboarding.api'
import type { OnboardingStep } from './types'

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly api = inject(OnboardingApi)

  readonly steps = signal<OnboardingStep[]>([])
  readonly completed = signal(false)
  readonly loading = signal(false)
  readonly error = signal<Error | null>(null)

  readonly doneCount = computed(() => this.steps().filter((step) => step.done).length)

  async load(): Promise<void> {
    this.loading.set(true)
    this.error.set(null)
    try {
      const status = await firstValueFrom(this.api.getStatus())
      this.steps.set(status.steps)
      this.completed.set(status.completed)
    } catch (err) {
      this.error.set(err instanceof Error ? err : new Error('onboarding'))
    } finally {
      this.loading.set(false)
    }
  }
}
