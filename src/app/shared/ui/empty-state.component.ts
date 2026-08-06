import { Component, Input } from '@angular/core'

@Component({
  standalone: true,
  selector: 'app-empty-state',
  template: `
    <div class="empty">
      <strong>{{ title }}</strong>
      @if (description) {
        <p>{{ description }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: [
    `
      .empty {
        display: grid;
        gap: 0.5rem;
        padding: 1.5rem;
        border: 1px dashed var(--border);
        border-radius: var(--radius);
        background: var(--surface);
        text-align: center;
        color: var(--muted);
      }
      .empty strong {
        color: var(--fg);
      }
      .empty p {
        margin: 0;
      }
    `,
  ],
})
export class EmptyStateComponent {
  @Input({ required: true }) title!: string
  @Input() description = ''
}
