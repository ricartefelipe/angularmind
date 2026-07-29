import { Component, OnInit, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { WalletService } from './wallet.service'
import { AuthService } from '@/core/auth/auth.service'
import { formatCents } from '@/shared/utils/money'
import { LoadingBlockComponent } from '@/shared/ui/loading-block.component'
import { ErrorBannerComponent } from '@/shared/ui/error-banner.component'

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [RouterLink, LoadingBlockComponent, ErrorBannerComponent],
  template: `
    <section class="dash">
      <p class="eyebrow">Olá{{ firstName ? ', ' + firstName : '' }}</p>
      <h1>AngularMind</h1>
      <app-error-banner [message]="wallet.error()" />
      @if (wallet.loading() && wallet.balanceCents() === null) {
        <app-loading-block />
      } @else if (wallet.balanceCents() !== null) {
        <div class="balance-card">
          <span>Saldo disponível</span>
          <strong>{{ format(wallet.balanceCents()!) }}</strong>
        </div>
      }
      <h2>Movimentar</h2>
      <nav class="shortcuts">
        <a routerLink="/transfers/pix"><span>↗</span>PIX</a>
        <a routerLink="/transactions"><span>≡</span>Extrato</a>
        <a routerLink="/beneficiaries"><span>◎</span>Favorecidos</a>
      </nav>
    </section>
  `,
  styles: [
    `
      .dash { display: grid; gap: 1.25rem; }
      .eyebrow { margin: 0; color: var(--muted); font-size: 0.875rem; font-weight: 500; }
      h1 { margin: 0; font-size: clamp(1.8rem, 4vw, 2.4rem); color: var(--accent); }
      h2 { margin: 0.5rem 0 0; font-size: 1.35rem; }
      .balance-card {
        position: relative; overflow: hidden;
        display: grid; gap: 0.75rem;
        padding: clamp(1.5rem, 4vw, 2.5rem);
        border-radius: 22px;
        background: linear-gradient(145deg, var(--accent) 0%, var(--accent-hover) 55%, var(--hero-deep) 100%);
        color: #f4faf7;
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--gold) 35%, transparent),
          0 18px 50px color-mix(in srgb, var(--accent) 28%, transparent);
      }
      .balance-card::after {
        content: ''; position: absolute; width: 220px; height: 220px; right: -40px; top: -60px;
        border-radius: 50%;
        background: radial-gradient(circle, color-mix(in srgb, var(--gold) 55%, transparent), transparent 68%);
      }
      .balance-card span, .balance-card strong { position: relative; z-index: 1; }
      .balance-card span {
        font-size: 0.8125rem; letter-spacing: 0.08em; text-transform: uppercase;
        font-weight: 600; color: color-mix(in srgb, var(--gold) 80%, white);
      }
      .balance-card strong {
        font-family: var(--font-display); font-size: clamp(2.4rem, 7vw, 3.6rem);
        letter-spacing: -0.03em; line-height: 1; font-weight: 400;
      }
      .shortcuts {
        display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem;
      }
      .shortcuts a {
        display: flex; flex-direction: column; gap: 0.75rem;
        min-height: 120px; padding: 1rem;
        border: 1px solid var(--border); border-radius: 18px;
        background: var(--surface); color: var(--fg); text-decoration: none; font-weight: 600; font-size: 0.875rem;
        box-shadow: 0 1px 2px color-mix(in srgb, var(--accent) 10%, transparent);
        transition: transform 180ms var(--ease), box-shadow 180ms var(--ease);
      }
      .shortcuts a:hover { transform: translateY(-3px); box-shadow: var(--shadow); }
      .shortcuts a:first-child { background: linear-gradient(160deg, var(--gold-soft), var(--surface)); }
      .shortcuts span {
        width: 2rem; height: 2rem; display: inline-flex; align-items: center; justify-content: center;
        border-radius: 999px; background: var(--accent-soft); color: var(--accent);
      }
      @media (max-width: 640px) { .shortcuts { grid-template-columns: 1fr; } }
    `,
  ],
})
export class DashboardPage implements OnInit {
  readonly wallet = inject(WalletService)
  private readonly auth = inject(AuthService)
  format = formatCents

  get firstName(): string | undefined {
    return this.auth.user()?.name?.split(' ')[0]
  }

  ngOnInit(): void {
    this.wallet.loadBalance()
  }
}
