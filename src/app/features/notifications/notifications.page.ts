import { Component, OnInit, inject } from '@angular/core'
import { I18nService } from '@/core/i18n/i18n.service'
import { ApiError } from '@/core/http/api-error'
import { AppButtonComponent } from '@/shared/ui/app-button.component'
import { EmptyStateComponent } from '@/shared/ui/empty-state.component'
import { ErrorBannerComponent } from '@/shared/ui/error-banner.component'
import { SkeletonComponent } from '@/shared/ui/skeleton.component'
import { NotificationsService } from './notifications.service'

@Component({
  standalone: true,
  selector: 'app-notifications-page',
  imports: [AppButtonComponent, EmptyStateComponent, ErrorBannerComponent, SkeletonComponent],
  template: `
    <section class="page">
      <header>
        <h1>{{ i18n.t('notifications.title') }}</h1>
        @if (notifications.unreadCount() > 0) {
          <button appButton
            variant="secondary"
            [disabled]="notifications.mutating()"
            data-testid="notifications-read-all"
            (click)="notifications.markAllRead()"
          >
            {{ i18n.t('notifications.markAllRead') }}
          </button>
        }
      </header>

      @if (notifications.mutateError(); as err) {
        <app-error-banner
          [message]="err.message || i18n.t('common.error')"
          [correlationId]="correlation(err)"
        />
      }

      @if (notifications.loading() || (notifications.items() === null && !notifications.error())) {
        <app-skeleton [lines]="4" />
      } @else if (notifications.error()) {
        <app-error-banner
          [message]="notifications.error()?.message || i18n.t('common.error')"
          [correlationId]="correlation(notifications.error())"
        >
          <button appButton variant="secondary" (click)="notifications.load()">
            {{ i18n.t('common.retry') }}
          </button>
        </app-error-banner>
      } @else if (notifications.items()?.length === 0) {
        <app-empty-state
          [title]="i18n.t('notifications.empty.title')"
          [description]="i18n.t('notifications.empty.description')"
        />
      } @else if (notifications.items()) {
        <ul data-testid="notifications-list">
          @for (item of notifications.items()!; track item.id) {
            <li [class.unread]="!item.read" [attr.data-testid]="'notification-' + item.id">
              <div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.body }}</p>
                <time>{{ formatDate(item.createdAt) }}</time>
              </div>
              @if (!item.read) {
                <button appButton
                  variant="ghost"
                  [disabled]="notifications.mutating()"
                  data-testid="notification-mark-read"
                  (click)="notifications.markRead(item.id)"
                >
                  {{ i18n.t('notifications.markRead') }}
                </button>
              }
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 1.25rem;
      }
      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
      }
      h1 {
        margin: 0;
        font-family: var(--font-display);
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
        gap: 0.75rem;
        padding: 1rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 14px;
      }
      li.unread {
        border-color: color-mix(in srgb, var(--gold) 50%, var(--border));
        background: color-mix(in srgb, var(--gold-soft) 55%, var(--surface));
      }
      p {
        margin: 0.35rem 0;
      }
      time {
        font-size: 0.875rem;
        color: var(--muted);
      }
    `,
  ],
})
export class NotificationsPage implements OnInit {
  readonly notifications = inject(NotificationsService)
  readonly i18n = inject(I18nService)

  ngOnInit(): void {
    void this.notifications.load()
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString(this.i18n.locale())
  }

  correlation(error: Error | null): string | undefined {
    return error instanceof ApiError ? error.correlationId : undefined
  }
}
