import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import type { CreatePixInput, PixTransfer, QrPayloadResponse } from './types'

@Injectable({ providedIn: 'root' })
export class TransfersApi {
  private readonly http = inject(HttpClient)

  createPix(body: CreatePixInput, idempotencyKey: string) {
    const headers = new HttpHeaders({ 'Idempotency-Key': idempotencyKey })
    return this.http.post<PixTransfer>('/api/v1/transfers/pix', body, { headers })
  }

  getById(id: string) {
    return this.http.get<PixTransfer>(`/api/v1/transfers/${id}`)
  }

  getQrPayload(amountCents: number, pixKey: string) {
    const params = new HttpParams()
      .set('amountCents', String(amountCents))
      .set('pixKey', pixKey)
    return this.http.get<QrPayloadResponse>('/api/v1/transfers/pix/qr-payload', { params })
  }
}
