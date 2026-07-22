import { Component, Input } from '@angular/core'

@Component({
  standalone: true,
  selector: 'app-empty-state',
  template: `<p class="empty">{{ message }}</p>`,
  styles: [`.empty { opacity: 0.7; padding: 1.5rem 0; }`],
})
export class EmptyStateComponent {
  @Input() message = 'Nada por aqui.'
}
