import { Injectable, inject } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import type { Balance, TransactionsResponse, TransactionType } from './types'

@Injectable({ providedIn: 'root' })
export class WalletApi {
  private readonly http = inject(HttpClient)

  getBalance() {
    return this.http.get<Balance>('/api/v1/wallet/balance')
  }

  getTransactions(type?: TransactionType | 'ALL') {
    let params = new HttpParams()
    if (type && type !== 'ALL') params = params.set('type', type)
    return this.http.get<TransactionsResponse>('/api/v1/wallet/transactions', { params })
  }
}
