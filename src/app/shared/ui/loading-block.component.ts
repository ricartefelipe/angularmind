import { Component } from '@angular/core'

@Component({
  standalone: true,
  selector: 'app-loading-block',
  template: `<p class="loading">Carregando…</p>`,
  styles: [`.loading { opacity: 0.7; padding: 1rem 0; }`],
})
export class LoadingBlockComponent {}
