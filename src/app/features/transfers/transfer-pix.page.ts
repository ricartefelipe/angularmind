import { Component, OnInit, ElementRef, ViewChild, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import QRCode from 'qrcode'
import { I18nService } from '@/core/i18n/i18n.service'
import { ApiError } from '@/core/http/api-error'
import { BeneficiariesService } from '@/features/beneficiaries/beneficiaries.service'
import type { PixKeyType } from '@/features/beneficiaries/types'
import { NotificationsService } from '@/features/notifications/notifications.service'
import { OnboardingService } from '@/features/onboarding/onboarding.service'
import { WalletService } from '@/features/wallet/wallet.service'
import { AppButtonComponent } from '@/shared/ui/app-button.component'
import { ErrorBannerComponent } from '@/shared/ui/error-banner.component'
import { formatCents, parseReaisToCents } from '@/shared/utils/money'
import { isValidPixKey } from '@/shared/utils/pixKey'
import { TransfersService } from './transfers.service'
import type { PixDestination } from './types'

@Component({
  standalone: true,
  selector: 'app-transfer-pix-page',
  imports: [FormsModule, RouterLink, AppButtonComponent, ErrorBannerComponent],
  template: `
    <section class="page">
      <h1>{{ i18n.t('transfers.pix') }}</h1>

      @if (transfers.error() && transfers.step() === 'confirm') {
        <app-error-banner
          [message]="errorMessage()"
          [correlationId]="correlation(transfers.error())"
        />
      }

      @if (transfers.step() === 'destination') {
        <form class="stack" data-testid="pix-destination" (ngSubmit)="submitDestination()">
          <h2>{{ i18n.t('transfers.steps.destination') }}</h2>
          <label for="pix-beneficiary">{{ i18n.t('transfers.form.beneficiary') }}</label>
          <select
            id="pix-beneficiary"
            name="beneficiaryId"
            data-testid="pix-beneficiary"
            [(ngModel)]="beneficiaryId"
            (ngModelChange)="pixKey = ''"
          >
            <option value="">{{ i18n.t('transfers.form.chooseBeneficiary') }}</option>
            @for (item of beneficiaries.items() ?? []; track item.id) {
              <option [value]="item.id">{{ item.name }} — {{ item.pixKey }}</option>
            }
          </select>

          <p class="muted">{{ i18n.t('transfers.form.orKey') }}</p>

          <label for="pix-key-type">{{ i18n.t('transfers.form.pixKeyType') }}</label>
          <select
            id="pix-key-type"
            name="pixKeyType"
            [(ngModel)]="pixKeyType"
            [disabled]="!!beneficiaryId"
          >
            @for (type of pixKeyTypes; track type) {
              <option [value]="type">{{ i18n.t('beneficiaries.types.' + type) }}</option>
            }
          </select>

          <label for="pix-key">{{ i18n.t('transfers.form.pixKey') }}</label>
          <input
            id="pix-key"
            name="pixKey"
            [(ngModel)]="pixKey"
            [disabled]="!!beneficiaryId"
            (ngModelChange)="beneficiaryId = ''"
          />

          @if (destinationError()) {
            <p class="field-error">{{ destinationError() }}</p>
          }
          <button appButton type="submit" data-testid="pix-destination-continue">
            {{ i18n.t('transfers.form.continue') }}
          </button>
        </form>

        <section class="qr" data-testid="pix-qr-section">
          <h2>{{ i18n.t('transfers.qr.title') }}</h2>
          <label for="qr-amount">{{ i18n.t('transfers.qr.amount') }}</label>
          <input id="qr-amount" name="qrAmount" [(ngModel)]="qrAmount" />
          @if (qrAmountError()) {
            <p class="field-error">{{ qrAmountError() }}</p>
          }
          <label for="qr-key">{{ i18n.t('transfers.qr.pixKey') }}</label>
          <input id="qr-key" name="qrKey" [(ngModel)]="qrKey" />
          <button appButton
            [disabled]="transfers.loading()"
            data-testid="pix-qr-generate"
            (click)="generateQr()"
          >
            {{ i18n.t('transfers.qr.generate') }}
          </button>
          @if (transfers.error() && transfers.step() !== 'confirm') {
            <app-error-banner
              [message]="transfers.error()?.message || i18n.t('common.error')"
              [correlationId]="correlation(transfers.error())"
            />
          }
          @if (transfers.qrPayload()) {
            <div class="qr-result">
              <canvas #qrCanvas data-testid="pix-qr-canvas"></canvas>
              <p data-testid="pix-qr-payload">
                <strong>{{ i18n.t('transfers.qr.payload') }}:</strong>
                {{ transfers.qrPayload() }}
              </p>
            </div>
          }
        </section>
      }

      @if (transfers.step() === 'amount') {
        <form class="stack" data-testid="pix-amount" (ngSubmit)="submitAmount()">
          <h2>{{ i18n.t('transfers.steps.amount') }}</h2>
          <label for="pix-amount">{{ i18n.t('transfers.form.amount') }}</label>
          <input id="pix-amount" name="amount" [(ngModel)]="amountReais" />
          @if (amountError()) {
            <p class="field-error">{{ amountError() }}</p>
          }
          <div class="actions">
            <button appButton variant="secondary" type="button" (click)="transfers.backFromAmount()">
              {{ i18n.t('common.back') }}
            </button>
            <button appButton type="submit" data-testid="pix-amount-continue">
              {{ i18n.t('transfers.form.continue') }}
            </button>
          </div>
        </form>
      }

      @if (transfers.step() === 'schedule') {
        <form class="stack" data-testid="pix-schedule" (ngSubmit)="submitSchedule()">
          <h2>{{ i18n.t('transfers.steps.schedule') }}</h2>
          <label for="pix-schedule-input">{{ i18n.t('transfers.form.scheduleOptional') }}</label>
          <input
            id="pix-schedule-input"
            name="scheduledLocal"
            type="datetime-local"
            data-testid="pix-schedule-input"
            [(ngModel)]="scheduledLocal"
          />
          <p class="muted">{{ i18n.t('transfers.form.scheduleHint') }}</p>
          <div class="actions">
            <button appButton variant="secondary" type="button" (click)="transfers.backFromSchedule()">
              {{ i18n.t('common.back') }}
            </button>
            <button appButton
              variant="secondary"
              type="button"
              data-testid="pix-skip-schedule"
              (click)="transfers.skipSchedule()"
            >
              {{ i18n.t('transfers.form.skipSchedule') }}
            </button>
            <button appButton type="submit" data-testid="pix-schedule-continue">
              {{
                scheduledLocal
                  ? i18n.t('transfers.form.scheduleContinue')
                  : i18n.t('transfers.form.continue')
              }}
            </button>
          </div>
        </form>
      }

      @if (transfers.step() === 'confirm' && transfers.draft(); as draft) {
        <div class="card" data-testid="pix-confirm">
          <h2>{{ i18n.t('transfers.steps.confirm') }}</h2>
          <p>
            <strong>{{ i18n.t('transfers.confirm.to') }}:</strong>
            {{ destinationLabel(draft.beneficiaryId, draft.pixKey) }}
          </p>
          <p>
            <strong>{{ i18n.t('transfers.confirm.amount') }}:</strong>
            {{ format(draft.amountCents) }}
          </p>
          <p>
            <strong>{{ i18n.t('transfers.confirm.when') }}:</strong>
            {{
              draft.scheduledFor
                ? formatDateTime(draft.scheduledFor)
                : i18n.t('transfers.confirm.now')
            }}
          </p>
          <div class="actions">
            <button appButton
              variant="secondary"
              [disabled]="transfers.loading()"
              (click)="transfers.backToForm()"
            >
              {{ i18n.t('common.back') }}
            </button>
            <button appButton
              [disabled]="transfers.loading()"
              data-testid="pix-confirm-submit"
              (click)="onConfirm()"
            >
              {{
                transfers.error()
                  ? i18n.t('transfers.confirm.retry')
                  : i18n.t('transfers.confirm.submit')
              }}
            </button>
          </div>
        </div>
      }

      @if (transfers.step() === 'receipt' && transfers.lastReceipt(); as receipt) {
        <div class="card" data-testid="pix-receipt">
          <h2>{{ i18n.t('transfers.receipt.title') }}</h2>
          <p>
            <strong>{{ i18n.t('transfers.receipt.id') }}:</strong>
            {{ receipt.id }}
          </p>
          <p>
            <strong>{{ i18n.t('transfers.confirm.to') }}:</strong>
            {{ destinationLabel(receipt.beneficiaryId, receipt.pixKey) }}
          </p>
          <p>
            <strong>{{ i18n.t('transfers.confirm.amount') }}:</strong>
            {{ format(receipt.amountCents) }}
          </p>
          <p>
            <strong>{{ i18n.t('transfers.receipt.status') }}:</strong>
            {{ i18n.t('transfers.status.' + receipt.status) }}
          </p>
          <p>
            <strong>{{ i18n.t('transfers.receipt.endToEnd') }}:</strong>
            <span data-testid="pix-end-to-end">{{ receipt.endToEndId }}</span>
          </p>
          <p>
            <strong>{{ i18n.t('transfers.receipt.when') }}:</strong>
            {{ formatDateTime(receipt.createdAt) }}
          </p>
          @if (receipt.scheduledFor) {
            <p>
              <strong>{{ i18n.t('transfers.receipt.scheduledFor') }}:</strong>
              {{ formatDateTime(receipt.scheduledFor) }}
            </p>
          }
          <p>
            <strong>{{ i18n.t('transfers.receipt.correlationId') }}:</strong>
            {{ receipt.correlationId }}
          </p>
          <div class="actions">
            <button appButton variant="secondary" (click)="again()">
              {{ i18n.t('transfers.receipt.again') }}
            </button>
            <a routerLink="/transactions">
              <button appButton type="button">{{ i18n.t('nav.transactions') }}</button>
            </a>
          </div>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 1.25rem;
      }
      h1,
      h2 {
        margin: 0;
        font-family: var(--font-display);
      }
      .stack,
      .card,
      .qr {
        display: grid;
        gap: 0.65rem;
        max-width: 480px;
      }
      .card,
      .qr {
        padding: 1rem;
        border-radius: 16px;
        background: var(--surface);
        border: 1px solid var(--border);
      }
      .qr {
        border-style: dashed;
        background: color-mix(in srgb, var(--gold-soft) 45%, var(--surface));
      }
      label {
        font-size: 0.875rem;
        color: var(--muted);
      }
      input,
      select {
        padding: 0.55rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--surface);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 0.75rem;
      }
      .muted {
        margin: 0;
        color: var(--muted);
        font-size: 0.875rem;
      }
      .field-error {
        margin: 0;
        color: var(--danger);
        font-size: 0.85rem;
      }
      .qr-result p {
        margin: 0;
        font-size: 0.85rem;
        word-break: break-all;
        color: var(--muted);
      }
      a {
        text-decoration: none;
      }
    `,
  ],
})
export class TransferPixPage implements OnInit {
  @ViewChild('qrCanvas') qrCanvas?: ElementRef<HTMLCanvasElement>

  readonly transfers = inject(TransfersService)
  readonly beneficiaries = inject(BeneficiariesService)
  readonly wallet = inject(WalletService)
  readonly onboarding = inject(OnboardingService)
  readonly notifications = inject(NotificationsService)
  readonly i18n = inject(I18nService)

  readonly pixKeyTypes: PixKeyType[] = ['EMAIL', 'CPF', 'PHONE', 'RANDOM']
  readonly destinationError = signal('')
  readonly amountError = signal('')
  readonly qrAmountError = signal('')

  beneficiaryId = ''
  pixKey = ''
  pixKeyType: PixKeyType = 'EMAIL'
  amountReais = ''
  scheduledLocal = ''
  qrAmount = '10,00'
  qrKey = 'demo@vuemind.dev'

  ngOnInit(): void {
    this.transfers.reset()
    if (this.beneficiaries.items() === null) {
      void this.beneficiaries.load()
    }
  }

  submitDestination(): void {
    const hasBeneficiary = Boolean(this.beneficiaryId)
    const hasKey = Boolean(this.pixKey.trim())
    if (hasBeneficiary === hasKey) {
      this.destinationError.set(
        hasBeneficiary
          ? this.i18n.t('transfers.validation.xor')
          : this.i18n.t('transfers.validation.beneficiary'),
      )
      return
    }
    if (hasKey && !isValidPixKey(this.pixKeyType, this.pixKey.trim())) {
      this.destinationError.set(this.i18n.t('transfers.validation.pixKey'))
      return
    }
    this.destinationError.set('')
    const payload: PixDestination = hasBeneficiary
      ? { mode: 'beneficiary', beneficiaryId: this.beneficiaryId }
      : { mode: 'key', pixKey: this.pixKey.trim(), pixKeyType: this.pixKeyType }
    this.transfers.setDestination(payload)
  }

  submitAmount(): void {
    this.amountError.set('')
    try {
      const cents = parseReaisToCents(this.amountReais)
      if (cents <= 0) throw new Error('INVALID_MONEY')
      this.transfers.setAmount(cents)
    } catch {
      this.amountError.set(this.i18n.t('transfers.validation.amount'))
    }
  }

  submitSchedule(): void {
    if (!this.scheduledLocal) {
      this.transfers.skipSchedule()
      return
    }
    this.transfers.setSchedule(new Date(this.scheduledLocal).toISOString())
  }

  async onConfirm(): Promise<void> {
    await this.transfers.confirmPix()
    if (this.transfers.step() === 'receipt') {
      await Promise.all([
        this.wallet.loadBalance(),
        this.onboarding.load(),
        this.notifications.load(),
      ])
    }
  }

  again(): void {
    this.transfers.reset()
    this.beneficiaryId = ''
    this.pixKey = ''
    this.pixKeyType = 'EMAIL'
    this.amountReais = ''
    this.scheduledLocal = ''
  }

  async generateQr(): Promise<void> {
    this.qrAmountError.set('')
    try {
      const cents = parseReaisToCents(this.qrAmount)
      if (cents <= 0) throw new Error('INVALID_MONEY')
      await this.transfers.loadQrPayload(cents, this.qrKey.trim())
      const payload = this.transfers.qrPayload()
      if (payload && this.qrCanvas) {
        await QRCode.toCanvas(this.qrCanvas.nativeElement, payload, { width: 180, margin: 1 })
      }
    } catch {
      this.qrAmountError.set(this.i18n.t('transfers.validation.amount'))
    }
  }

  destinationLabel(beneficiaryId?: string, pixKey?: string): string {
    if (beneficiaryId) {
      return (
        (this.beneficiaries.items() ?? []).find((item) => item.id === beneficiaryId)?.name ??
        beneficiaryId
      )
    }
    return pixKey ?? ''
  }

  format(cents: number): string {
    return formatCents(cents, this.i18n.locale())
  }

  formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString(this.i18n.locale())
  }

  errorMessage(): string {
    const err = this.transfers.error()
    if (err instanceof ApiError) {
      switch (err.code) {
        case 'INSUFFICIENT_FUNDS':
          return this.i18n.t('transfers.errors.insufficientFunds')
        case 'DAILY_LIMIT_EXCEEDED':
          return this.i18n.t('transfers.errors.dailyLimitExceeded')
        case 'INVALID_PIX_KEY':
          return this.i18n.t('transfers.errors.invalidPixKey')
        default:
          return err.message || this.i18n.t('common.error')
      }
    }
    return err?.message || this.i18n.t('common.error')
  }

  correlation(error: Error | null): string | undefined {
    return error instanceof ApiError ? error.correlationId : undefined
  }
}
