import { Injectable, inject } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { map } from 'rxjs'
import {
  normalizeTransactionsPage,
  normalizeWalletBalance,
} from './normalize-wallet'
import type { TransactionFilters, TransactionsPage, WalletBalance } from './types'

@Injectable({ providedIn: 'root' })
export class WalletApi {
  private readonly http = inject(HttpClient)

  getBalance() {
    return this.http
      .get<Partial<WalletBalance>>('/api/v1/wallet/balance')
      .pipe(map((raw) => normalizeWalletBalance(raw)))
  }

  listTransactions(filters: TransactionFilters) {
    let params = new HttpParams()
      .set('page', String(filters.page))
      .set('pageSize', String(filters.pageSize))
    if (filters.from) params = params.set('from', filters.from)
    if (filters.to) params = params.set('to', filters.to)
    if (filters.type !== 'ALL') params = params.set('type', filters.type)
    if (filters.q) params = params.set('q', filters.q)
    return this.http
      .get<Partial<TransactionsPage>>('/api/v1/wallet/transactions', { params })
      .pipe(map((raw) => normalizeTransactionsPage(raw, filters.page, filters.pageSize)))
  }
}
