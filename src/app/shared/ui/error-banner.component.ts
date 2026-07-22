import { Component, Input } from '@angular/core'

@Component({
  standalone: true,
  selector: 'app-error-banner',
  template: `@if (message) { <p class="error" role="alert">{{ message }}</p> }`,
  styles: [`.error { background: #fdecea; color: var(--danger); padding: 0.75rem; border-radius: var(--radius); }`],
})
export class ErrorBannerComponent {
  @Input() message: string | null = null
}
