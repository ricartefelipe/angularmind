import { Component, OnInit, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { I18nService } from '@/core/i18n/i18n.service'
import { OnboardingService } from '@/features/onboarding/onboarding.service'
import { ApiError } from '@/core/http/api-error'
import { AppButtonComponent } from '@/shared/ui/app-button.component'
import { EmptyStateComponent } from '@/shared/ui/empty-state.component'
import { ErrorBannerComponent } from '@/shared/ui/error-banner.component'
import { SkeletonComponent } from '@/shared/ui/skeleton.component'
import { formatCents } from '@/shared/utils/money'
import type { TransactionTypeFilter } from './types'
import { WalletService } from './wallet.service'

@Component({
  standalone: true,
  selector: 'app-transactions-page',
  imports: [
    FormsModule,
    SkeletonComponent,
    ErrorBannerComponent,
    EmptyStateComponent,
    AppButtonComponent,
  ],
  template: `
    <section class="transactions">
      <h1>{{ i18n.t('wallet.transactions') }}</h1>

      <form class="filters" (ngSubmit)="applyFilters()">
        <label>
          <span>{{ i18n.t('wallet.filters.from') }}</span>
          <input type="date" name="from" [ngModel]="wallet.filterFrom()" (ngModelChange)="wallet.filterFrom.set($event)" />
        </label>
        <label>
          <span>{{ i18n.t('wallet.filters.to') }}</span>
          <input type="date" name="to" [ngModel]="wallet.filterTo()" (ngModelChange)="wallet.filterTo.set($event)" />
        </label>
        <label>
          <span>{{ i18n.t('wallet.filters.type') }}</span>
          <select
            name="type"
            [ngModel]="wallet.filterType()"
            (ngModelChange)="wallet.filterType.set($event)"
          >
            @for (option of typeOptions; track option) {
              <option [value]="option">{{ i18n.t('wallet.types.' + option) }}</option>
            }
          </select>
        </label>
        <label class="grow">
          <span>{{ i18n.t('wallet.filters.q') }}</span>
          <input
            type="search"
            name="q"
            data-testid="transactions-search"
            [placeholder]="i18n.t('wallet.search')"
            [ngModel]="wallet.filterQ()"
            (ngModelChange)="wallet.filterQ.set($event)"
          />
        </label>
        <button appButton type="submit">{{ i18n.t('wallet.filters.apply') }}</button>
      </form>

      @if (
        wallet.transactionsLoading() ||
        (wallet.transactions() === null && !wallet.transactionsError())
      ) {
        <app-skeleton [lines]="5" />
      } @else if (wallet.transactionsError()) {
        <app-error-banner
          [message]="wallet.transactionsError()?.message || i18n.t('common.error')"
          [correlationId]="correlation(wallet.transactionsError())"
        >
          <button appButton variant="secondary" (click)="applyFilters()">{{ i18n.t('common.retry') }}</button>
        </app-error-banner>
      } @else if (wallet.transactions()?.length === 0) {
        <app-empty-state
          [title]="i18n.t('wallet.empty.title')"
          [description]="i18n.t('wallet.empty.description')"
        />
      } @else if (wallet.transactions()) {
        <ul data-testid="transactions-list">
          @for (transaction of wallet.transactions()!; track transaction.id) {
            <li>
              <div>
                <strong>{{ transaction.description }}</strong>
                <p>
                  {{ transaction.counterparty }} · {{ formatDate(transaction.createdAt) }}
                </p>
              </div>
              <span [class.credit]="transaction.type === 'PIX_IN'">
                {{ signed(transaction.amountCents, transaction.type === 'PIX_IN') }}
              </span>
            </li>
          }
        </ul>
        @if (wallet.hasMore()) {
          <button appButton
            variant="secondary"
            [disabled]="wallet.transactionsLoadingMore()"
            data-testid="transactions-load-more"
            (click)="wallet.loadMoreTransactions()"
          >
            {{ i18n.t('wallet.loadMore') }}
          </button>
        }
      }
    </section>
  `,
  styles: [
    `
      .transactions {
        display: grid;
        gap: 1.25rem;
      }
      h1 {
        margin: 0;
        font-family: var(--font-display);
      }
      .filters {
        display: flex;
        flex-wrap: wrap;
        align-items: end;
        gap: 0.75rem;
      }
      label {
        display: grid;
        gap: 0.25rem;
        font-size: 0.875rem;
        color: var(--muted);
      }
      .grow {
        flex: 1;
        min-width: 180px;
      }
      input,
      select {
        padding: 0.55rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--surface);
        color: var(--fg);
      }
      ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.5rem;
      }
      li {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 14px;
      }
      p {
        margin: 0.2rem 0 0;
        color: var(--muted);
        font-size: 0.875rem;
      }
      span {
        color: var(--danger);
        font-family: var(--font-display);
        white-space: nowrap;
      }
      .credit {
        color: #1f7a4d;
      }
    `,
  ],
})
export class TransactionsPage implements OnInit {
  readonly wallet = inject(WalletService)
  readonly onboarding = inject(OnboardingService)
  readonly i18n = inject(I18nService)
  readonly typeOptions: TransactionTypeFilter[] = ['ALL', 'PIX_OUT', 'PIX_IN', 'TED']

  ngOnInit(): void {
    void this.applyFilters()
  }

  async applyFilters(): Promise<void> {
    await this.wallet.loadTransactions()
    await this.onboarding.load()
  }

  formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.i18n.locale()).format(new Date(iso))
  }

  signed(cents: number, credit: boolean): string {
    const value = formatCents(cents, this.i18n.locale())
    return credit ? `+${value}` : `-${value}`
  }

  correlation(error: Error | null): string | undefined {
    return error instanceof ApiError ? error.correlationId : undefined
  }
}
