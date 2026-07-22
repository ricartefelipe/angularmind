import { Component, Input } from '@angular/core'

@Component({
  standalone: true,
  selector: 'app-button',
  template: `<button [type]="type" [disabled]="disabled"><ng-content /></button>`,
  styles: [
    `
      button {
        background: var(--accent);
        color: white;
        border: 0;
        border-radius: var(--radius);
        padding: 0.6rem 1rem;
        cursor: pointer;
      }
      button:disabled { opacity: 0.5; cursor: not-allowed; }
    `,
  ],
})
export class AppButtonComponent {
  @Input() type: 'button' | 'submit' = 'button'
  @Input() disabled = false
}
