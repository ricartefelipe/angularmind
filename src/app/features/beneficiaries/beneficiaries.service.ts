import { Injectable, inject, signal } from '@angular/core'
import { BeneficiariesApi } from './beneficiaries.api'
import type { Beneficiary } from './types'
import { ApiError } from '@/core/http/api-error'

@Injectable({ providedIn: 'root' })
export class BeneficiariesService {
  private readonly api = inject(BeneficiariesApi)
  readonly items = signal<Beneficiary[]>([])
  readonly loading = signal(false)
  readonly error = signal<string | null>(null)

  load(): void {
    this.loading.set(true)
    this.error.set(null)
    this.api.list().subscribe({
      next: (res) => {
        this.items.set(res.items)
        this.loading.set(false)
      },
      error: (err: unknown) => {
        this.loading.set(false)
        this.error.set(err instanceof ApiError ? err.message : 'Erro ao listar favorecidos')
      },
    })
  }

  create(name: string, pixKey: string): void {
    this.error.set(null)
    this.api.create({ name, pixKey }).subscribe({
      next: () => this.load(),
      error: (err: unknown) => {
        this.error.set(err instanceof ApiError ? err.message : 'Erro ao criar favorecido')
      },
    })
  }

  remove(id: string): void {
    this.error.set(null)
    this.api.remove(id).subscribe({
      next: () => this.load(),
      error: (err: unknown) => {
        this.error.set(err instanceof ApiError ? err.message : 'Erro ao remover favorecido')
      },
    })
  }
}
