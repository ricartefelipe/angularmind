import { Component, Input } from '@angular/core'

@Component({
  standalone: true,
  selector: 'button[appButton]',
  template: `<ng-content />`,
  styles: [
    `
      :host {
        font: inherit;
        border-radius: 999px;
        padding: 0.55rem 1rem;
        cursor: pointer;
        font-weight: 600;
        border: 1px solid transparent;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      :host(.primary) {
        background: var(--accent);
        color: #fff;
      }
      :host(.secondary) {
        background: var(--surface);
        color: var(--fg);
        border-color: var(--border);
      }
      :host(.ghost) {
        background: transparent;
        color: var(--accent);
        border-color: transparent;
      }
      :host(:disabled) {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
  host: {
    '[class]': 'variant',
  },
})
export class AppButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'ghost' = 'primary'
}
