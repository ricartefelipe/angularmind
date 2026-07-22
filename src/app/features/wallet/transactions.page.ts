import { Component, OnInit, inject, signal } from '@angular/core'
import { WalletService } from './wallet.service'
import { formatCents } from '@/shared/utils/money'
import type { TransactionType } from './types'
import { LoadingBlockComponent } from '@/shared/ui/loading-block.component'
import { ErrorBannerComponent } from '@/shared/ui/error-banner.component'
import { EmptyStateComponent } from '@/shared/ui/empty-state.component'

@Component({
  standalone: true,
  selector: 'app-transactions-page',
  imports: [LoadingBlockComponent, ErrorBannerComponent, EmptyStateComponent],
  template: `
    <h1>Extrato</h1>
    <label>
      Tipo
      <select [value]="type()" (change)="onType($event)">
        <option value="ALL">Todos</option>
        <option value="PIX_OUT">PIX saída</option>
        <option value="PIX_IN">PIX entrada</option>
        <option value="TED">TED</option>
      </select>
    </label>
    <app-error-banner [message]="wallet.error()" />
    @if (wallet.loading()) {
      <app-loading-block />
    } @else if (wallet.transactions().length === 0) {
      <app-empty-state message="Nenhuma movimentação neste filtro." />
    } @else {
      <ul>
        @for (tx of wallet.transactions(); track tx.id) {
          <li>
            <strong>{{ tx.type }}</strong> — {{ format(tx.amountCents) }}
            <br />{{ tx.description }} · {{ tx.counterparty }}
          </li>
        }
      </ul>
    }
  `,
})
export class TransactionsPage implements OnInit {
  readonly wallet = inject(WalletService)
  readonly type = signal<TransactionType | 'ALL'>('ALL')
  format = formatCents

  ngOnInit(): void {
    this.wallet.loadTransactions(this.type())
  }

  onType(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as TransactionType | 'ALL'
    this.type.set(value)
    this.wallet.loadTransactions(value)
  }
}
