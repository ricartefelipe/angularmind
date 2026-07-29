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
        <a routerLink="/dashboard" class="brand">
          <span class="mark" aria-hidden="true"></span>
          AngularMind
        </a>
        <nav>
          <a routerLink="/dashboard" routerLinkActive="active">Início</a>
          <a routerLink="/transactions" routerLinkActive="active">Extrato</a>
          <a routerLink="/transfers/pix" routerLinkActive="active">PIX</a>
          <a routerLink="/beneficiaries" routerLinkActive="active">Favorecidos</a>
          <button type="button" (click)="logout()">Sair</button>
        </nav>
      </header>
      <main><router-outlet /></main>
    </div>
  `,
  styles: [
    `
      .shell { max-width: 880px; margin: 0 auto; padding: 0 1.25rem 4rem; }
      header {
        position: sticky; top: 0; z-index: 20;
        display: flex; justify-content: space-between; align-items: center;
        gap: 1rem; margin: 0 -1.25rem 1.75rem; padding: 0.85rem 1.25rem;
        flex-wrap: wrap;
        background: color-mix(in srgb, var(--surface) 86%, transparent);
        border-bottom: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
        backdrop-filter: blur(14px);
        animation: mind-rise 320ms var(--ease) both;
      }
      .brand {
        display: inline-flex; align-items: center; gap: 0.55rem;
        font-family: var(--font-display); font-size: 1.35rem;
        color: var(--accent); text-decoration: none;
      }
      .mark {
        width: 12px; height: 12px; border-radius: 999px;
        background: linear-gradient(135deg, var(--gold), var(--accent));
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--gold) 25%, transparent);
      }
      nav { display: flex; gap: 0.35rem; align-items: center; flex-wrap: wrap; }
      nav a {
        padding: 0.4rem 0.75rem; border-radius: 999px;
        color: var(--muted); text-decoration: none; font-size: 0.875rem; font-weight: 500;
      }
      nav a.active { color: var(--accent); background: var(--accent-soft); font-weight: 600; }
      button {
        background: transparent; border: none; border-radius: 999px;
        padding: 0.4rem 0.75rem; cursor: pointer; color: var(--muted); font-weight: 500;
      }
      button:hover { color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, transparent); }
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
