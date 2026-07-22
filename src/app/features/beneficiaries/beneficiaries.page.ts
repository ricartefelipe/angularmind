import { Component, OnInit, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BeneficiariesService } from './beneficiaries.service'
import { LoadingBlockComponent } from '@/shared/ui/loading-block.component'
import { ErrorBannerComponent } from '@/shared/ui/error-banner.component'
import { EmptyStateComponent } from '@/shared/ui/empty-state.component'
import { AppButtonComponent } from '@/shared/ui/app-button.component'

@Component({
  standalone: true,
  selector: 'app-beneficiaries-page',
  imports: [
    FormsModule,
    LoadingBlockComponent,
    ErrorBannerComponent,
    EmptyStateComponent,
    AppButtonComponent,
  ],
  template: `
    <h1>Favorecidos</h1>
    <app-error-banner [message]="svc.error()" />
    <form (ngSubmit)="add()" class="form">
      <input name="name" [(ngModel)]="name" placeholder="Nome" required />
      <input name="pixKey" [(ngModel)]="pixKey" placeholder="Chave PIX" required />
      <app-button type="submit">Adicionar</app-button>
    </form>
    @if (svc.loading()) {
      <app-loading-block />
    } @else if (svc.items().length === 0) {
      <app-empty-state message="Nenhum favorecido cadastrado." />
    } @else {
      <ul>
        @for (b of svc.items(); track b.id) {
          <li>
            {{ b.name }} — {{ b.pixKey }}
            <button type="button" (click)="svc.remove(b.id)">Remover</button>
          </li>
        }
      </ul>
    }
  `,
  styles: [
    `
      .form { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
      input { padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius); }
    `,
  ],
})
export class BeneficiariesPage implements OnInit {
  readonly svc = inject(BeneficiariesService)
  name = ''
  pixKey = ''

  ngOnInit(): void {
    this.svc.load()
  }

  add(): void {
    this.svc.create(this.name, this.pixKey)
    this.name = ''
    this.pixKey = ''
  }
}
