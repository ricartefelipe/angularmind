import { Injectable, inject, signal } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { BeneficiariesApi } from './beneficiaries.api'
import type { Beneficiary, CreateBeneficiaryRequest } from './types'

@Injectable({ providedIn: 'root' })
export class BeneficiariesService {
  private readonly api = inject(BeneficiariesApi)

  readonly items = signal<Beneficiary[] | null>(null)
  readonly loading = signal(false)
  readonly mutating = signal(false)
  readonly error = signal<Error | null>(null)
  readonly mutateError = signal<Error | null>(null)

  async load(): Promise<void> {
    this.loading.set(true)
    this.error.set(null)
    try {
      const response = await firstValueFrom(this.api.list())
      this.items.set(response.items)
    } catch (err) {
      this.error.set(err instanceof Error ? err : new Error('beneficiaries'))
      this.items.set(null)
    } finally {
      this.loading.set(false)
    }
  }

  async create(payload: CreateBeneficiaryRequest): Promise<void> {
    this.mutating.set(true)
    this.mutateError.set(null)
    try {
      const created = await firstValueFrom(this.api.create(payload))
      this.items.set([...(this.items() ?? []), created])
    } catch (err) {
      this.mutateError.set(err instanceof Error ? err : new Error('create'))
      throw err
    } finally {
      this.mutating.set(false)
    }
  }

  async remove(id: string): Promise<void> {
    this.mutating.set(true)
    this.mutateError.set(null)
    try {
      await firstValueFrom(this.api.remove(id))
      this.items.set((this.items() ?? []).filter((item) => item.id !== id))
    } catch (err) {
      this.mutateError.set(err instanceof Error ? err : new Error('remove'))
      throw err
    } finally {
      this.mutating.set(false)
    }
  }
}
