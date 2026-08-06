import { Injectable, computed, inject, signal } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { ApiError } from '@/core/http/api-error'
import { WalletApi } from './wallet.api'
import type { Transaction, TransactionTypeFilter, WalletBalance } from './types'

const DEFAULT_PAGE_SIZE = 20

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly api = inject(WalletApi)

  readonly balance = signal<WalletBalance | null>(null)
  readonly balanceLoading = signal(false)
  readonly balanceError = signal<Error | null>(null)

  readonly transactions = signal<Transaction[] | null>(null)
  readonly transactionsLoading = signal(false)
  readonly transactionsLoadingMore = signal(false)
  readonly transactionsError = signal<Error | null>(null)
  readonly page = signal(1)
  readonly pageSize = signal(DEFAULT_PAGE_SIZE)
  readonly total = signal(0)

  readonly filterFrom = signal('')
  readonly filterTo = signal('')
  readonly filterType = signal<TransactionTypeFilter>('ALL')
  readonly filterQ = signal('')

  readonly balanceCents = computed(() => this.balance()?.availableCents ?? null)
  readonly blockedCents = computed(() => this.balance()?.blockedCents ?? null)
  readonly dailyLimitCents = computed(() => this.balance()?.dailyLimitCents ?? null)
  readonly dailySpentCents = computed(() => this.balance()?.dailySpentCents ?? null)
  readonly currency = computed(() => this.balance()?.currency ?? 'BRL')
  readonly hasMore = computed(() => (this.transactions()?.length ?? 0) < this.total())
  readonly loading = computed(() => this.balanceLoading())
  readonly error = computed(() => this.balanceError()?.message ?? null)

  async loadBalance(): Promise<void> {
    this.balanceLoading.set(true)
    this.balanceError.set(null)
    try {
      this.balance.set(await firstValueFrom(this.api.getBalance()))
    } catch (err) {
      this.balanceError.set(err instanceof Error ? err : new Error('balance'))
    } finally {
      this.balanceLoading.set(false)
    }
  }

  async loadTransactions(): Promise<void> {
    this.transactionsLoading.set(true)
    this.transactionsError.set(null)
    this.page.set(1)
    try {
      const response = await firstValueFrom(
        this.api.listTransactions({
          from: this.filterFrom(),
          to: this.filterTo(),
          type: this.filterType(),
          q: this.filterQ(),
          page: 1,
          pageSize: this.pageSize(),
        }),
      )
      this.transactions.set(response.items)
      this.page.set(response.page)
      this.pageSize.set(response.pageSize)
      this.total.set(response.total)
    } catch (err) {
      this.transactionsError.set(err instanceof Error ? err : new Error('transactions'))
      this.transactions.set(null)
    } finally {
      this.transactionsLoading.set(false)
    }
  }

  async loadMoreTransactions(): Promise<void> {
    if (!this.hasMore() || this.transactionsLoadingMore()) return
    this.transactionsLoadingMore.set(true)
    this.transactionsError.set(null)
    try {
      const nextPage = this.page() + 1
      const response = await firstValueFrom(
        this.api.listTransactions({
          from: this.filterFrom(),
          to: this.filterTo(),
          type: this.filterType(),
          q: this.filterQ(),
          page: nextPage,
          pageSize: this.pageSize(),
        }),
      )
      this.transactions.set([...(this.transactions() ?? []), ...response.items])
      this.page.set(response.page)
      this.pageSize.set(response.pageSize)
      this.total.set(response.total)
    } catch (err) {
      this.transactionsError.set(err instanceof Error ? err : new Error('transactions'))
    } finally {
      this.transactionsLoadingMore.set(false)
    }
  }

  async loadRecentTransactions(limit = 5): Promise<Transaction[]> {
    const response = await firstValueFrom(
      this.api.listTransactions({
        from: '',
        to: '',
        type: 'ALL',
        q: '',
        page: 1,
        pageSize: limit,
      }),
    )
    return response.items
  }

  correlationFrom(error: Error | null): string | undefined {
    return error instanceof ApiError ? error.correlationId : undefined
  }
}
