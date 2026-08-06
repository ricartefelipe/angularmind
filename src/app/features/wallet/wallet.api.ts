import { Injectable, inject } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import type { TransactionFilters, TransactionsPage, WalletBalance } from './types'

@Injectable({ providedIn: 'root' })
export class WalletApi {
  private readonly http = inject(HttpClient)

  getBalance() {
    return this.http.get<WalletBalance>('/api/v1/wallet/balance')
  }

  listTransactions(filters: TransactionFilters) {
    let params = new HttpParams()
      .set('page', String(filters.page))
      .set('pageSize', String(filters.pageSize))
    if (filters.from) params = params.set('from', filters.from)
    if (filters.to) params = params.set('to', filters.to)
    if (filters.type !== 'ALL') params = params.set('type', filters.type)
    if (filters.q) params = params.set('q', filters.q)
    return this.http.get<TransactionsPage>('/api/v1/wallet/transactions', { params })
  }
}
