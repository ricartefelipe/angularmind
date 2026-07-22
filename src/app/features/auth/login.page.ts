import { Component, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { AuthService } from '@/core/auth/auth.service'
import { ApiError } from '@/core/http/api-error'

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [FormsModule],
  template: `
    <section class="login">
      <h1>AngularMind</h1>
      <p>Carteira digital de estudo</p>
      <form (ngSubmit)="submit()">
        <label>Email <input name="email" [(ngModel)]="email" type="email" required /></label>
        <label>Senha <input name="password" [(ngModel)]="password" type="password" required /></label>
        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
        <button type="submit" [disabled]="loading()">Entrar</button>
      </form>
    </section>
  `,
  styles: `
    .login {
      max-width: 360px;
      margin: 4rem auto;
      display: grid;
      gap: 1rem;
    }

    form,
    label {
      display: grid;
      gap: 0.5rem;
    }

    .error {
      color: #b00020;
    }
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService)
  private readonly router = inject(Router)

  email = 'demo@vuemind.dev'
  password = 'demo123'
  readonly loading = signal(false)
  readonly error = signal<string | null>(null)

  submit(): void {
    this.loading.set(true)
    this.error.set(null)

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false)
        void this.router.navigateByUrl('/dashboard')
      },
      error: (error: unknown) => {
        this.loading.set(false)
        this.error.set(error instanceof ApiError ? error.message : 'Falha no login')
      },
    })
  }
}
