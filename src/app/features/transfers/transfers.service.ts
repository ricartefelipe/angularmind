import { Injectable, inject, signal } from '@angular/core'
import { ApiError } from '@/core/http/api-error'
import { createIdempotencyKey } from '@/shared/utils/id'
import { TransfersApi } from './transfers.api'
import type { Transfer } from './types'

@Injectable({ providedIn: 'root' })
export class TransfersService {
  private readonly api = inject(TransfersApi)

  readonly lastTransfer = signal<Transfer | null>(null)
  readonly loading = signal(false)
  readonly error = signal<string | null>(null)

  private idempotencyKey: string | null = null

  /** Gera a chave uma vez ao entrar no step de confirmação — não a cada keystroke. */
  beginConfirm(): void {
    this.idempotencyKey = createIdempotencyKey()
    this.error.set(null)
  }

  confirmPix(beneficiaryId: string, amountCents: number, onDone?: () => void): void {
    if (!this.idempotencyKey) this.beginConfirm()

    this.loading.set(true)
    this.error.set(null)
    this.api.pix({ beneficiaryId, amountCents }, this.idempotencyKey!).subscribe({
      next: (transfer) => {
        this.lastTransfer.set(transfer)
        this.loading.set(false)
        this.idempotencyKey = null
        onDone?.()
      },
      error: (error: unknown) => {
        this.loading.set(false)
        this.error.set(error instanceof ApiError ? error.message : 'Erro no PIX')
      },
    })
  }

  reset(): void {
    this.lastTransfer.set(null)
    this.error.set(null)
    this.idempotencyKey = null
  }
}
