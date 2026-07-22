import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import type { CreatePixRequest, Transfer } from './types'

@Injectable({ providedIn: 'root' })
export class TransfersApi {
  private readonly http = inject(HttpClient)

  pix(body: CreatePixRequest, idempotencyKey: string) {
    const headers = new HttpHeaders({ 'Idempotency-Key': idempotencyKey })
    return this.http.post<Transfer>('/api/v1/transfers/pix', body, { headers })
  }
}
