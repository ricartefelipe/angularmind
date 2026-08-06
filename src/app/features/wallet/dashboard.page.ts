import { Component, OnInit, inject, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { AuthService } from '@/core/auth/auth.service'
import { I18nService } from '@/core/i18n/i18n.service'
import { NotificationsService } from '@/features/notifications/notifications.service'
import { OnboardingService } from '@/features/onboarding/onboarding.service'
import { ApiError } from '@/core/http/api-error'
import { AppButtonComponent } from '@/shared/ui/app-button.component'
import { ErrorBannerComponent } from '@/shared/ui/error-banner.component'
import { SkeletonComponent } from '@/shared/ui/skeleton.component'
import { formatCents } from '@/shared/utils/money'
import type { Transaction } from './types'
import { WalletService } from './wallet.service'

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [RouterLink, SkeletonComponent, ErrorBannerComponent, AppButtonComponent],
  template: `
    <section class="dash">
      <header>
        <p class="eyebrow">
          {{ i18n.t('wallet.greeting') }}{{ firstName ? ', ' + firstName : '' }}
        </p>
        <h1>{{ i18n.t('app.name') }}</h1>
      </header>

      @if (wallet.balanceLoading() || (wallet.balance() === null && !wallet.balanceError())) {
        <app-skeleton />
      } @else if (wallet.balanceError()) {
        <app-error-banner [message]="i18n.t('common.error')" [correlationId]="correlation(wallet.balanceError())">
          <button appButton variant="secondary" (click)="wallet.loadBalance()">{{ i18n.t('common.retry') }}</button>
        </app-error-banner>
      } @else if (wallet.balance()) {
        @if (wallet.balance(); as balance) {
        <div class="balance-card" data-testid="balance-card">
          <div class="primary">
            <span>{{ i18n.t('wallet.balance') }}</span>
            <strong data-testid="available-balance">{{ format(balance.availableCents, balance.currency) }}</strong>
          </div>
          <div class="meta">
            <div>
              <span>{{ i18n.t('wallet.blocked') }}</span>
              <p data-testid="blocked-balance">{{ format(balance.blockedCents, balance.currency) }}</p>
            </div>
            <div>
              <span>{{ i18n.t('wallet.dailySpent') }}</span>
              <p>{{ format(balance.dailySpentCents, balance.currency) }}</p>
            </div>
          </div>
          <div class="limit" data-testid="daily-limit-bar">
            <div class="limit-head">
              <span>{{ i18n.t('wallet.dailyLimit') }}</span>
              <span>
                {{ format(balance.dailySpentCents, balance.currency) }} /
                {{ format(balance.dailyLimitCents, balance.currency) }}
              </span>
            </div>
            <div
              class="track"
              role="progressbar"
              [attr.aria-valuenow]="limitPercent(balance.dailySpentCents, balance.dailyLimitCents)"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                class="fill"
                [style.width.%]="limitPercent(balance.dailySpentCents, balance.dailyLimitCents)"
              ></div>
            </div>
          </div>
        </div>
        }
      }

      @if (!onboarding.completed() || onboarding.steps().length) {
        <section class="onboarding" data-testid="onboarding-checklist">
          <header class="onboarding-head">
            <h2>
              {{
                onboarding.completed()
                  ? i18n.t('wallet.onboardingComplete')
                  : i18n.t('wallet.onboardingTitle')
              }}
            </h2>
            <span data-testid="onboarding-progress">
              {{ onboarding.doneCount() }}/{{ onboarding.steps().length }}
            </span>
          </header>
          <ul>
            @for (step of onboarding.steps(); track step.id) {
              <li
                [class.done]="step.done"
                [attr.data-testid]="'onboarding-step-' + step.id"
              >
                <span aria-hidden="true">{{ step.done ? '✓' : '○' }}</span>
                {{ i18n.t('wallet.onboarding.' + step.id) }}
              </li>
            }
          </ul>
        </section>
      }

      <div class="actions">
        <h2>{{ i18n.t('wallet.shortcutsTitle') }}</h2>
        <nav class="shortcuts">
          <a routerLink="/transfers/pix" class="primary-shortcut">
            <span aria-hidden="true">↗</span>
            {{ i18n.t('nav.transferPix') }}
          </a>
          <a routerLink="/beneficiaries">
            <span aria-hidden="true">◎</span>
            {{ i18n.t('nav.beneficiaries') }}
          </a>
          <a routerLink="/transactions">
            <span aria-hidden="true">≡</span>
            {{ i18n.t('nav.transactions') }}
          </a>
        </nav>
      </div>

      <section class="recent">
        <h2>{{ i18n.t('wallet.recentTitle') }}</h2>
        @if (recentLoading()) {
          <app-skeleton [lines]="4" />
        } @else {
          <ul data-testid="recent-transactions">
            @for (tx of recent(); track tx.id) {
              <li>
                <div>
                  <strong>{{ tx.description }}</strong>
                  <p>{{ tx.counterparty }}</p>
                </div>
                <span [class.credit]="tx.type === 'PIX_IN'">
                  {{ tx.type === 'PIX_IN' ? '+' : '-' }}{{ format(tx.amountCents) }}
                </span>
              </li>
            }
          </ul>
        }
      </section>
    </section>
  `,
  styles: [
    `
      .dash {
        display: grid;
        gap: 1.25rem;
      }
      .eyebrow {
        margin: 0;
        color: var(--muted);
        font-size: 0.875rem;
        font-weight: 500;
      }
      h1 {
        margin: 0;
        font-size: clamp(1.8rem, 4vw, 2.4rem);
        color: var(--accent);
      }
      h2 {
        margin: 0;
        font-size: 1.35rem;
      }
      .balance-card {
        position: relative;
        overflow: hidden;
        display: grid;
        gap: 1rem;
        padding: clamp(1.5rem, 4vw, 2.5rem);
        border-radius: 22px;
        background: linear-gradient(145deg, var(--accent) 0%, var(--accent-hover) 55%, var(--hero-deep) 100%);
        color: #f4faf7;
        box-shadow:
          0 0 0 1px color-mix(in srgb, var(--gold) 35%, transparent),
          0 18px 50px color-mix(in srgb, var(--accent) 28%, transparent);
      }
      .balance-card::after {
        content: '';
        position: absolute;
        width: 220px;
        height: 220px;
        right: -40px;
        top: -60px;
        border-radius: 50%;
        background: radial-gradient(circle, color-mix(in srgb, var(--gold) 55%, transparent), transparent 68%);
      }
      .primary,
      .meta,
      .limit {
        position: relative;
        z-index: 1;
      }
      .primary span,
      .meta span {
        display: block;
        font-size: 0.8125rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-weight: 600;
        color: color-mix(in srgb, var(--gold) 80%, white);
        margin-bottom: 0.35rem;
      }
      .primary strong {
        font-family: var(--font-display);
        font-size: clamp(2.4rem, 7vw, 3.6rem);
        letter-spacing: -0.03em;
        line-height: 1;
        font-weight: 400;
      }
      .meta {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
        font-size: 0.875rem;
      }
      .meta p {
        margin: 0;
      }
      .limit-head {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
      }
      .track {
        height: 0.55rem;
        border-radius: 999px;
        background: color-mix(in srgb, white 22%, transparent);
        overflow: hidden;
      }
      .fill {
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--gold), white);
        transition: width 180ms var(--ease);
      }
      .onboarding {
        display: grid;
        gap: 0.75rem;
        padding: 1rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 18px;
      }
      .onboarding-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 0.75rem;
      }
      .onboarding ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.5rem;
      }
      .onboarding li {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--muted);
        font-size: 0.875rem;
      }
      .onboarding li.done {
        color: #1f7a4d;
      }
      .actions,
      .recent {
        display: grid;
        gap: 0.75rem;
      }
      .shortcuts {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
      }
      .shortcuts a {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        min-height: 120px;
        padding: 1rem;
        border: 1px solid var(--border);
        border-radius: 18px;
        background: var(--surface);
        color: var(--fg);
        text-decoration: none;
        font-weight: 600;
        font-size: 0.875rem;
        transition: transform 180ms var(--ease), box-shadow 180ms var(--ease);
      }
      .shortcuts a:hover {
        transform: translateY(-3px);
        box-shadow: var(--shadow);
      }
      .primary-shortcut {
        background: linear-gradient(160deg, var(--gold-soft), var(--surface));
      }
      .shortcuts span {
        width: 2rem;
        height: 2rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent);
      }
      .recent ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.5rem;
      }
      .recent li {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.85rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 14px;
      }
      .recent p {
        margin: 0.2rem 0 0;
        color: var(--muted);
        font-size: 0.875rem;
      }
      .recent span {
        color: var(--danger);
        font-family: var(--font-display);
        white-space: nowrap;
      }
      .recent .credit {
        color: #1f7a4d;
      }
      @media (max-width: 640px) {
        .shortcuts {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class DashboardPage implements OnInit {
  readonly wallet = inject(WalletService)
  readonly onboarding = inject(OnboardingService)
  readonly notifications = inject(NotificationsService)
  readonly i18n = inject(I18nService)
  private readonly auth = inject(AuthService)

  readonly recent = signal<Transaction[]>([])
  readonly recentLoading = signal(false)

  get firstName(): string | undefined {
    return this.auth.user()?.name?.split(' ')[0]
  }

  ngOnInit(): void {
    void this.hydrate()
  }

  format(cents: number, currency = 'BRL'): string {
    return formatCents(cents, this.i18n.locale(), currency)
  }

  limitPercent(spent: number, limit: number): number {
    if (limit <= 0) return 0
    return Math.min(100, Math.round((spent / limit) * 100))
  }

  correlation(error: Error | null): string | undefined {
    return error instanceof ApiError ? error.correlationId : undefined
  }

  private async hydrate(): Promise<void> {
    await Promise.all([
      this.wallet.loadBalance(),
      this.onboarding.load(),
      this.notifications.load(),
    ])
    this.recentLoading.set(true)
    try {
      this.recent.set(await this.wallet.loadRecentTransactions(5))
      await this.onboarding.load()
    } finally {
      this.recentLoading.set(false)
    }
  }
}
