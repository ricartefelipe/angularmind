import { Component, inject } from '@angular/core'
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'
import { AuthService } from '@/core/auth/auth.service'

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <header>
        <strong>AngularMind</strong>
        <nav>
          <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/transactions" routerLinkActive="active">Extrato</a>
          <a routerLink="/beneficiaries" routerLinkActive="active">Favorecidos</a>
          <a routerLink="/transfers/pix" routerLinkActive="active">PIX</a>
          <button type="button" (click)="logout()">Sair</button>
        </nav>
      </header>
      <main><router-outlet /></main>
    </div>
  `,
  styles: [
    `
      .shell { max-width: 960px; margin: 0 auto; padding: 1rem; }
      header {
        display: flex; justify-content: space-between; align-items: center;
        gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;
      }
      nav { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
      a.active { font-weight: 700; }
      button {
        background: transparent; border: 1px solid var(--border);
        border-radius: var(--radius); padding: 0.35rem 0.75rem; cursor: pointer;
      }
    `,
  ],
})
export class AppShellComponent {
  private readonly auth = inject(AuthService)
  private readonly router = inject(Router)

  logout(): void {
    this.auth.logout()
    void this.router.navigateByUrl('/login')
  }
}
