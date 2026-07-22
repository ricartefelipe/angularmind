import { Component, OnInit, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { WalletService } from './wallet.service'
import { formatCents } from '@/shared/utils/money'
import { LoadingBlockComponent } from '@/shared/ui/loading-block.component'
import { ErrorBannerComponent } from '@/shared/ui/error-banner.component'

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [RouterLink, LoadingBlockComponent, ErrorBannerComponent],
  template: `
    <h1>Dashboard</h1>
    <app-error-banner [message]="wallet.error()" />
    @if (wallet.loading() && wallet.balanceCents() === null) {
      <app-loading-block />
    } @else if (wallet.balanceCents() !== null) {
      <p class="balance">Saldo: {{ format(wallet.balanceCents()!) }}</p>
    }
    <p>
      <a routerLink="/transfers/pix">Fazer PIX</a> ·
      <a routerLink="/transactions">Ver extrato</a> ·
      <a routerLink="/beneficiaries">Favorecidos</a>
    </p>
  `,
  styles: [`.balance { font-size: 1.75rem; font-weight: 700; }`],
})
export class DashboardPage implements OnInit {
  readonly wallet = inject(WalletService)
  format = formatCents

  ngOnInit(): void {
    this.wallet.loadBalance()
  }
}
