import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core'
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'
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
        <div class="user-menu" data-user-menu>
          <button
            type="button"
            class="user"
            data-testid="shell-user"
            [attr.aria-expanded]="menuOpen()"
            aria-haspopup="menu"
            [attr.aria-label]="i18n.t('account.menu')"
            (click)="toggleMenu($event)"
          >
            <span class="avatar" aria-hidden="true">{{ initials() }}</span>
            <span class="username">{{ auth.user()?.name }}</span>
          </button>
          @if (menuOpen()) {
            <div class="menu" role="menu" data-testid="shell-user-menu">
              <div class="menu-profile" role="none">
                <p class="menu-label">{{ i18n.t('account.profile') }}</p>
                <p class="menu-name">{{ auth.user()?.name }}</p>
                <p class="menu-email">{{ auth.user()?.email }}</p>
              </div>
              <button
                type="button"
                class="menu-item"
                role="menuitem"
                data-testid="shell-account-settings"
                (click)="goSettings()"
              >
                {{ i18n.t('account.settings') }}
              </button>
              <button
                type="button"
                class="menu-item danger"
                role="menuitem"
                data-testid="shell-logout"
                (click)="logout()"
              >
                {{ i18n.t('account.logout') }}
              </button>
            </div>
          }
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
      .user-menu {
        position: relative;
      }
      .user {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        border: 0;
        background: transparent;
        padding: 0.25rem 0.4rem;
        border-radius: 999px;
        cursor: pointer;
        font: inherit;
        color: inherit;
      }
      .user:hover,
      .user[aria-expanded='true'] {
        background: color-mix(in srgb, var(--accent) 10%, transparent);
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
      .menu {
        position: absolute;
        top: calc(100% + 0.4rem);
        right: 0;
        z-index: 30;
        min-width: 14rem;
        display: grid;
        gap: 0.25rem;
        padding: 0.5rem;
        border-radius: 0.85rem;
        border: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
        background: var(--surface);
        box-shadow: 0 12px 32px color-mix(in srgb, #000 18%, transparent);
      }
      .menu-profile {
        padding: 0.55rem 0.65rem 0.7rem;
        margin-bottom: 0.25rem;
        border-bottom: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
      }
      .menu-label {
        margin: 0;
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--muted);
      }
      .menu-name {
        margin: 0.35rem 0 0;
        font-size: 0.875rem;
        font-weight: 600;
      }
      .menu-email {
        margin: 0.15rem 0 0;
        font-size: 0.8rem;
        color: var(--muted);
        word-break: break-all;
      }
      .menu-item {
        width: 100%;
        text-align: left;
        border: 0;
        background: transparent;
        border-radius: 0.55rem;
        padding: 0.55rem 0.65rem;
        font: inherit;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        color: inherit;
      }
      .menu-item:hover {
        background: color-mix(in srgb, var(--accent) 10%, transparent);
      }
      .menu-item.danger {
        color: #b42318;
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
        .user-menu {
          align-self: flex-end;
        }
      }
    `,
  ],
})
export class AppShellComponent implements OnInit {
  readonly auth = inject(AuthService)
  readonly i18n = inject(I18nService)
  readonly notifications = inject(NotificationsService)
  private readonly router = inject(Router)

  readonly menuOpen = signal(false)

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

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation()
    this.menuOpen.update((open) => !open)
  }

  closeMenu(): void {
    this.menuOpen.set(false)
  }

  goSettings(): void {
    this.closeMenu()
    void this.router.navigateByUrl('/settings')
  }

  logout(): void {
    this.closeMenu()
    this.auth.logout()
    void this.router.navigateByUrl('/login')
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen()) return
    const target = event.target as HTMLElement | null
    if (target?.closest('[data-user-menu]')) return
    this.closeMenu()
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu()
  }
}
