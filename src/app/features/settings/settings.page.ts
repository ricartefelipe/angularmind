import { Component, inject } from '@angular/core'
import { Router } from '@angular/router'
import { AuthService } from '@/core/auth/auth.service'
import { I18nService, type Locale } from '@/core/i18n/i18n.service'
import { ThemeService, type Theme } from '@/core/theme/theme.service'
import { AppButtonComponent } from '@/shared/ui/app-button.component'

@Component({
  standalone: true,
  selector: 'app-settings-page',
  imports: [AppButtonComponent],
  template: `
    <section class="page">
      <h1>{{ i18n.t('settings.title') }}</h1>

      <fieldset>
        <legend>{{ i18n.t('settings.theme') }}</legend>
        <button appButton
          [variant]="theme.theme() === 'light' ? 'primary' : 'secondary'"
          (click)="selectTheme('light')"
        >
          {{ i18n.t('settings.themeLight') }}
        </button>
        <button appButton
          [variant]="theme.theme() === 'dark' ? 'primary' : 'secondary'"
          (click)="selectTheme('dark')"
        >
          {{ i18n.t('settings.themeDark') }}
        </button>
      </fieldset>

      <fieldset>
        <legend>{{ i18n.t('settings.locale') }}</legend>
        <button appButton
          [variant]="i18n.locale() === 'pt-BR' ? 'primary' : 'secondary'"
          (click)="selectLocale('pt-BR')"
        >
          {{ i18n.t('settings.localePtBr') }}
        </button>
        <button appButton
          [variant]="i18n.locale() === 'en' ? 'primary' : 'secondary'"
          (click)="selectLocale('en')"
        >
          {{ i18n.t('settings.localeEn') }}
        </button>
      </fieldset>

      <fieldset>
        <legend>{{ i18n.t('nav.logout') }}</legend>
        <button appButton variant="secondary" data-testid="settings-logout" (click)="logout()">
          {{ i18n.t('settings.logout') }}
        </button>
      </fieldset>
    </section>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 1.25rem;
      }
      h1 {
        margin: 0;
        font-family: var(--font-display);
      }
      fieldset {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 1rem;
        margin: 0;
      }
      legend {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--muted);
        padding: 0 0.5rem;
      }
    `,
  ],
})
export class SettingsPage {
  readonly i18n = inject(I18nService)
  readonly theme = inject(ThemeService)
  private readonly auth = inject(AuthService)
  private readonly router = inject(Router)

  selectTheme(next: Theme): void {
    this.theme.setTheme(next)
  }

  selectLocale(next: Locale): void {
    this.i18n.setLocale(next)
  }

  logout(): void {
    this.auth.logout()
    void this.router.navigateByUrl('/login')
  }
}
