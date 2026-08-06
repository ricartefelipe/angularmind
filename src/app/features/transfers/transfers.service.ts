import { Injectable, inject, signal } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { createIdempotencyKey } from '@/shared/utils/id'
import { TransfersApi } from './transfers.api'
import type { CreatePixInput, PixDestination, PixTransfer, TransferStep } from './types'

@Injectable({ providedIn: 'root' })
export class TransfersService {
  private readonly api = inject(TransfersApi)

  readonly step = signal<TransferStep>('destination')
  readonly destination = signal<PixDestination | null>(null)
  readonly amountCents = signal<number | null>(null)
  readonly scheduledFor = signal('')
  readonly draft = signal<CreatePixInput | null>(null)
  readonly lastReceipt = signal<PixTransfer | null>(null)
  readonly qrPayload = signal<string | null>(null)
  readonly loading = signal(false)
  readonly error = signal<Error | null>(null)

  private idempotencyKey: string | null = null

  setDestination(next: PixDestination): void {
    this.destination.set(next)
    this.error.set(null)
    this.step.set('amount')
  }

  setAmount(cents: number): void {
    this.amountCents.set(cents)
    this.error.set(null)
    this.step.set('schedule')
  }

  setSchedule(iso: string): void {
    this.scheduledFor.set(iso)
    this.error.set(null)
    this.goToConfirm()
  }

  skipSchedule(): void {
    this.scheduledFor.set('')
    this.error.set(null)
    this.goToConfirm()
  }

  goToConfirm(): void {
    const destination = this.destination()
    const amountCents = this.amountCents()
    if (!destination || amountCents === null) return
    const base: CreatePixInput = { amountCents }
    if (destination.mode === 'beneficiary') {
      base.beneficiaryId = destination.beneficiaryId
    } else {
      base.pixKey = destination.pixKey
      base.pixKeyType = destination.pixKeyType
    }
    if (this.scheduledFor()) {
      base.scheduledFor = this.scheduledFor()
    }
    this.draft.set(base)
    if (!this.idempotencyKey) {
      this.idempotencyKey = createIdempotencyKey()
    }
    this.step.set('confirm')
  }

  backFromAmount(): void {
    this.step.set('destination')
    this.error.set(null)
  }

  backFromSchedule(): void {
    this.step.set('amount')
    this.error.set(null)
  }

  backToForm(): void {
    this.step.set('schedule')
    this.error.set(null)
  }

  async confirmPix(): Promise<void> {
    const draft = this.draft()
    if (!draft || !this.idempotencyKey) return
    this.loading.set(true)
    this.error.set(null)
    try {
      this.lastReceipt.set(await firstValueFrom(this.api.createPix(draft, this.idempotencyKey)))
      this.step.set('receipt')
    } catch (err) {
      this.error.set(err instanceof Error ? err : new Error('pix'))
    } finally {
      this.loading.set(false)
    }
  }

  async loadQrPayload(cents: number, pixKey: string): Promise<void> {
    this.loading.set(true)
    this.error.set(null)
    try {
      const response = await firstValueFrom(this.api.getQrPayload(cents, pixKey))
      this.qrPayload.set(response.payload)
    } catch (err) {
      this.error.set(err instanceof Error ? err : new Error('qr'))
      this.qrPayload.set(null)
    } finally {
      this.loading.set(false)
    }
  }

  reset(): void {
    this.step.set('destination')
    this.destination.set(null)
    this.amountCents.set(null)
    this.scheduledFor.set('')
    this.draft.set(null)
    this.idempotencyKey = null
    this.lastReceipt.set(null)
    this.qrPayload.set(null)
    this.error.set(null)
    this.loading.set(false)
  }
}
