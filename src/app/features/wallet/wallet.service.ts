import { Injectable, inject, signal } from '@angular/core'
import { WalletApi } from './wallet.api'
import type { Transaction, TransactionType } from './types'
import { ApiError } from '@/core/http/api-error'

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly api = inject(WalletApi)

  readonly balanceCents = signal<number | null>(null)
  readonly transactions = signal<Transaction[]>([])
  readonly loading = signal(false)
  readonly error = signal<string | null>(null)

  loadBalance(): void {
    this.loading.set(true)
    this.error.set(null)
    this.api.getBalance().subscribe({
      next: (b) => {
        this.balanceCents.set(b.availableCents)
        this.loading.set(false)
      },
      error: (err: unknown) => {
        this.loading.set(false)
        this.error.set(err instanceof ApiError ? err.message : 'Erro ao carregar saldo')
      },
    })
  }

  loadTransactions(type: TransactionType | 'ALL' = 'ALL'): void {
    this.loading.set(true)
    this.error.set(null)
    this.api.getTransactions(type).subscribe({
      next: (res) => {
        this.transactions.set(res.items)
        this.loading.set(false)
      },
      error: (err: unknown) => {
        this.loading.set(false)
        this.error.set(err instanceof ApiError ? err.message : 'Erro ao carregar extrato')
      },
    })
  }
}
