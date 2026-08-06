import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { I18nService } from '@/core/i18n/i18n.service'
import { OnboardingService } from '@/features/onboarding/onboarding.service'
import { ApiError } from '@/core/http/api-error'
import { AppButtonComponent } from '@/shared/ui/app-button.component'
import { EmptyStateComponent } from '@/shared/ui/empty-state.component'
import { ErrorBannerComponent } from '@/shared/ui/error-banner.component'
import { SkeletonComponent } from '@/shared/ui/skeleton.component'
import { isValidPixKey } from '@/shared/utils/pixKey'
import { BeneficiariesService } from './beneficiaries.service'
import type { PixKeyType } from './types'

@Component({
  standalone: true,
  selector: 'app-beneficiaries-page',
  imports: [
    FormsModule,
    AppButtonComponent,
    ErrorBannerComponent,
    EmptyStateComponent,
    SkeletonComponent,
  ],
  template: `
    <section class="page">
      <h1>{{ i18n.t('beneficiaries.title') }}</h1>

      <form class="form" data-testid="beneficiary-form" (ngSubmit)="onCreate()">
        <label for="beneficiary-name">{{ i18n.t('beneficiaries.form.name') }}</label>
        <input id="beneficiary-name" name="name" [(ngModel)]="name" />
        @if (nameError()) {
          <p class="field-error">{{ nameError() }}</p>
        }

        <label for="beneficiary-type">{{ i18n.t('beneficiaries.form.pixKeyType') }}</label>
        <select id="beneficiary-type" name="type" data-testid="beneficiary-type" [(ngModel)]="pixKeyType">
          @for (type of pixKeyTypes; track type) {
            <option [value]="type">{{ i18n.t('beneficiaries.types.' + type) }}</option>
          }
        </select>

        <label for="beneficiary-pix">{{ i18n.t('beneficiaries.form.pixKey') }}</label>
        <input id="beneficiary-pix" name="pixKey" [(ngModel)]="pixKey" />
        @if (pixKeyError()) {
          <p class="field-error">{{ pixKeyError() }}</p>
        }

        <button appButton type="submit" [disabled]="beneficiaries.mutating()" data-testid="beneficiary-submit">
          {{ i18n.t('beneficiaries.form.submit') }}
        </button>
      </form>

      @if (beneficiaries.mutateError(); as err) {
        <app-error-banner
          [message]="err.message || i18n.t('common.error')"
          [correlationId]="correlation(err)"
        />
      }

      @if (beneficiaries.loading() || (beneficiaries.items() === null && !beneficiaries.error())) {
        <app-skeleton [lines]="4" />
      } @else if (beneficiaries.error()) {
        <app-error-banner
          [message]="beneficiaries.error()?.message || i18n.t('common.error')"
          [correlationId]="correlation(beneficiaries.error())"
        >
          <button appButton variant="secondary" (click)="beneficiaries.load()">{{ i18n.t('common.retry') }}</button>
        </app-error-banner>
      } @else if (beneficiaries.items()?.length === 0) {
        <app-empty-state
          [title]="i18n.t('beneficiaries.empty.title')"
          [description]="i18n.t('beneficiaries.empty.description')"
        />
      } @else if (beneficiaries.items()) {
        <ul data-testid="beneficiary-list">
          @for (item of beneficiaries.items()!; track item.id) {
            <li>
              <div>
                <strong>{{ item.name }}</strong>
                <p>{{ item.pixKeyType }} · {{ item.pixKey }}</p>
              </div>
              <button appButton
                variant="ghost"
                [disabled]="beneficiaries.mutating()"
                (click)="onRemove(item.id)"
              >
                {{ i18n.t('beneficiaries.remove') }}
              </button>
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
      h1 {
        margin: 0;
        font-family: var(--font-display);
      }
      .form {
        display: grid;
        gap: 0.5rem;
        max-width: 420px;
      }
      label {
        font-size: 0.875rem;
        color: var(--muted);
      }
      input,
      select {
        padding: 0.55rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--surface);
      }
      .field-error {
        margin: 0;
        color: var(--danger);
        font-size: 0.85rem;
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
        border: 1px solid var(--border);
        border-radius: 14px;
        background: var(--surface);
      }
      p {
        margin: 0.25rem 0 0;
        color: var(--muted);
        font-size: 0.875rem;
      }
    `,
  ],
})
export class BeneficiariesPage implements OnInit {
  readonly beneficiaries = inject(BeneficiariesService)
  readonly onboarding = inject(OnboardingService)
  readonly i18n = inject(I18nService)

  readonly pixKeyTypes: PixKeyType[] = ['EMAIL', 'CPF', 'PHONE', 'RANDOM']
  readonly nameError = signal('')
  readonly pixKeyError = signal('')

  name = ''
  pixKey = ''
  pixKeyType: PixKeyType = 'EMAIL'

  ngOnInit(): void {
    void this.beneficiaries.load()
  }

  async onCreate(): Promise<void> {
    this.nameError.set(this.name.trim() ? '' : this.i18n.t('beneficiaries.validation.name'))
    if (!this.pixKey.trim()) {
      this.pixKeyError.set(this.i18n.t('beneficiaries.validation.pixKey'))
    } else if (!isValidPixKey(this.pixKeyType, this.pixKey.trim())) {
      this.pixKeyError.set(this.i18n.t('beneficiaries.validation.pixKeyInvalid'))
    } else {
      this.pixKeyError.set('')
    }
    if (this.nameError() || this.pixKeyError()) return

    try {
      await this.beneficiaries.create({
        name: this.name.trim(),
        pixKey: this.pixKey.trim(),
        pixKeyType: this.pixKeyType,
      })
      this.name = ''
      this.pixKey = ''
      this.pixKeyType = 'EMAIL'
      await this.onboarding.load()
    } catch {
    }
  }

  async onRemove(id: string): Promise<void> {
    try {
      await this.beneficiaries.remove(id)
    } catch {
    }
  }

  correlation(error: Error | null): string | undefined {
    return error instanceof ApiError ? error.correlationId : undefined
  }
}
