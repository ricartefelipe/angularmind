import { Component, Input } from '@angular/core'

@Component({
  standalone: true,
  selector: 'app-error-banner',
  template: `
    @if (message) {
      <div class="error" role="alert" data-testid="error-banner">
        <p>{{ message }}</p>
        @if (correlationId) {
          <p class="correlation">{{ correlationId }}</p>
        }
        <ng-content />
      </div>
    }
  `,
  styles: [
    `
      .error {
        background: color-mix(in srgb, var(--danger) 12%, var(--surface));
        color: var(--danger);
        padding: 0.85rem 1rem;
        border-radius: var(--radius);
        border: 1px solid color-mix(in srgb, var(--danger) 35%, var(--border));
        display: grid;
        gap: 0.5rem;
      }
      .error p {
        margin: 0;
      }
      .correlation {
        font-size: 0.8rem;
        opacity: 0.85;
        word-break: break-all;
      }
    `,
  ],
})
export class ErrorBannerComponent {
  @Input() message: string | null = null
  @Input() correlationId: string | null | undefined = null
}
