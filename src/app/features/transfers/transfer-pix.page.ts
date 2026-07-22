import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BeneficiariesService } from '@/features/beneficiaries/beneficiaries.service'
import { WalletService } from '@/features/wallet/wallet.service'
import { formatCents, parseReaisToCents } from '@/shared/utils/money'
import { AppButtonComponent } from '@/shared/ui/app-button.component'
import { ErrorBannerComponent } from '@/shared/ui/error-banner.component'
import { LoadingBlockComponent } from '@/shared/ui/loading-block.component'
import { TransfersService } from './transfers.service'

type Step = 'form' | 'confirm' | 'receipt'

@Component({
  standalone: true,
  selector: 'app-transfer-pix-page',
  imports: [FormsModule, LoadingBlockComponent, ErrorBannerComponent, AppButtonComponent],
  template: `
    <h1>PIX</h1>
    <app-error-banner [message]="formError() || transfers.error()" />

    @if (step() === 'form') {
      <form (ngSubmit)="goConfirm()" class="stack">
        <label>
          Favorecido
          <select name="beneficiaryId" [(ngModel)]="beneficiaryId" required>
            <option value="">Selecione…</option>
            @for (beneficiary of beneficiaries.items(); track beneficiary.id) {
              <option [value]="beneficiary.id">
                {{ beneficiary.name }} — {{ beneficiary.pixKey }}
              </option>
            }
          </select>
        </label>
        <label>
          Valor (R$)
          <input name="amount" [(ngModel)]="amountReais" placeholder="10,50" required />
        </label>
        <app-button type="submit">Continuar</app-button>
      </form>
    }

    @if (step() === 'confirm') {
      <div class="stack">
        <p>Confirmar PIX de <strong>{{ format(amountCents()) }}</strong></p>
        <p>para {{ selectedName() }}</p>
        @if (transfers.loading()) {
          <app-loading-block />
        } @else {
          <button type="button" (click)="confirm()">Confirmar</button>
          <button type="button" (click)="step.set('form')">Voltar</button>
        }
      </div>
    }

    @if (step() === 'receipt' && transfers.lastTransfer(); as transfer) {
      <div class="stack">
        <h2>Comprovante</h2>
        <p>ID: {{ transfer.id }}</p>
        <p>Valor: {{ format(transfer.amountCents) }}</p>
        <p>Status: {{ transfer.status }}</p>
        <p>Em: {{ transfer.createdAt }}</p>
        <button type="button" (click)="again()">Nova transferência</button>
      </div>
    }
  `,
  styles: [
    `
      .stack {
        display: grid;
        gap: 0.75rem;
        max-width: 420px;
      }

      label {
        display: grid;
        gap: 0.25rem;
      }

      input,
      select {
        padding: 0.5rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
      }
    `,
  ],
})
export class TransferPixPage implements OnInit {
  readonly beneficiaries = inject(BeneficiariesService)
  readonly wallet = inject(WalletService)
  readonly transfers = inject(TransfersService)

  readonly step = signal<Step>('form')
  readonly formError = signal<string | null>(null)
  readonly amountCents = signal(0)

  beneficiaryId = ''
  amountReais = ''
  format = formatCents

  ngOnInit(): void {
    this.beneficiaries.load()
  }

  selectedName(): string {
    return this.beneficiaries.items().find((item) => item.id === this.beneficiaryId)?.name ?? ''
  }

  goConfirm(): void {
    this.formError.set(null)
    try {
      const cents = parseReaisToCents(this.amountReais)
      if (!this.beneficiaryId) {
        this.formError.set('Selecione um favorecido.')
        return
      }

      this.amountCents.set(cents)
      this.transfers.beginConfirm()
      this.step.set('confirm')
    } catch {
      this.formError.set('Valor inválido. Use formato como 10,50.')
    }
  }

  confirm(): void {
    this.transfers.confirmPix(this.beneficiaryId, this.amountCents(), () => {
      this.wallet.loadBalance()
      this.step.set('receipt')
    })
  }

  again(): void {
    this.transfers.reset()
    this.amountReais = ''
    this.beneficiaryId = ''
    this.step.set('form')
  }
}
