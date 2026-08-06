import { Component, OnInit, computed, inject } from '@angular/core'
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'
import { AuthService } from '@/core/auth/auth.service'
import { I18nService } from '@/core/i18n/i18n.service'
import { NotificationsService } from '@/features/notifications/notifications.service'

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <header>
        <a routerLink="/dashboard" class="brand">
          <span class="mark" aria-hidden="true"></span>
          {{ i18n.t('app.name') }}
        </a>
        <nav aria-label="Principal">
          <a routerLink="/dashboard" routerLinkActive="active">{{ i18n.t('nav.dashboard') }}</a>
          <a routerLink="/transactions" routerLinkActive="active">{{ i18n.t('nav.transactions') }}</a>
          <a routerLink="/beneficiaries" routerLinkActive="active">{{ i18n.t('nav.beneficiaries') }}</a>
          <a routerLink="/transfers/pix" routerLinkActive="active">{{ i18n.t('nav.transferPix') }}</a>
          <a routerLink="/notifications" routerLinkActive="active" class="badge-link">
            {{ i18n.t('nav.notifications') }}
            @if (notifications.unreadCount() > 0) {
              <span class="badge" data-testid="notifications-badge">{{ notifications.unreadCount() }}</span>
            }
          </a>
          <a routerLink="/settings" routerLinkActive="active">{{ i18n.t('nav.settings') }}</a>
        </nav>
        <div class="user" data-testid="shell-user">
          <span class="avatar" aria-hidden="true">{{ initials() }}</span>
          <span class="username">{{ auth.user()?.name }}</span>
        </div>
      </header>
      <main><router-outlet /></main>
    </div>
  `,
  styles: [
    `
      .shell {
        max-width: 880px;
        margin: 0 auto;
        padding: 0 1.25rem 4rem;
      }
      header {
        position: sticky;
        top: 0;
        z-index: 20;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin: 0 -1.25rem 1.75rem;
        padding: 0.85rem 1.25rem;
        flex-wrap: wrap;
        background: color-mix(in srgb, var(--surface) 86%, transparent);
        border-bottom: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
        backdrop-filter: blur(14px);
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        font-family: var(--font-display);
        font-size: 1.35rem;
        color: var(--accent);
        text-decoration: none;
      }
      .mark {
        width: 12px;
        height: 12px;
        border-radius: 2px;
        clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        background: linear-gradient(135deg, var(--gold), var(--accent));
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--gold) 25%, transparent);
      }
      nav {
        display: flex;
        gap: 0.35rem;
        align-items: center;
        flex-wrap: wrap;
        flex: 1;
        justify-content: center;
      }
      nav a {
        padding: 0.4rem 0.75rem;
        border-radius: 999px;
        color: var(--muted);
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 500;
      }
      nav a.active {
        color: var(--accent);
        background: var(--accent-soft);
        font-weight: 600;
      }
      .badge-link {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
      }
      .badge {
        min-width: 1.25rem;
        height: 1.25rem;
        padding: 0 0.35rem;
        border-radius: 999px;
        background: var(--gold);
        color: #3a0010;
        font-size: 0.7rem;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .user {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }
      .avatar {
        width: 2rem;
        height: 2rem;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--accent-soft);
        color: var(--accent);
        font-size: 0.8rem;
        font-weight: 700;
      }
      .username {
        font-size: 0.875rem;
        font-weight: 500;
      }
      @media (max-width: 860px) {
        header {
          flex-direction: column;
          align-items: flex-start;
        }
        nav {
          width: 100%;
          justify-content: flex-start;
        }
      }
    `,
  ],
})
export class AppShellComponent implements OnInit {
  readonly auth = inject(AuthService)
  readonly i18n = inject(I18nService)
  readonly notifications = inject(NotificationsService)

  readonly initials = computed(() => {
    const name = this.auth.user()?.name?.trim() ?? ''
    if (!name) return '?'
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
  })

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      void this.notifications.load()
    }
  }
}
