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
      <div class="login__brand">
        <p class="login__eyebrow">Angular · Carteira</p>
        <h1>AngularMind</h1>
        <p>Sua carteira digital — saldo, PIX e favorecidos em um fluxo limpo.</p>
      </div>
      <div class="login__panel">
        <form (ngSubmit)="submit()">
          <label>Email <input name="email" [(ngModel)]="email" type="email" required /></label>
          <label>Senha <input name="password" [(ngModel)]="password" type="password" required /></label>
          @if (error()) {
            <p class="error">{{ error() }}</p>
          }
          <button type="submit" [disabled]="loading()">
            {{ loading() ? 'Entrando…' : 'Entrar na carteira' }}
          </button>
        </form>
      </div>
    </section>
  `,
  styles: `
    .login {
      position: relative;
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      overflow: hidden;
      background: radial-gradient(ellipse at 20% 20%, var(--login-mist), var(--login-ink) 55%);
      color: #f7faf8;
    }
    .login::before {
      content: '';
      position: absolute;
      inset: -20%;
      background:
        radial-gradient(circle at 70% 30%, color-mix(in srgb, var(--login-gold) 28%, transparent), transparent 42%),
        radial-gradient(circle at 15% 80%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 45%);
      pointer-events: none;
    }
    .login__brand, .login__panel {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: clamp(2rem, 6vw, 5rem);
    }
    .login__panel {
      background: color-mix(in srgb, var(--login-ink) 55%, transparent);
      border-left: 1px solid color-mix(in srgb, var(--login-gold) 28%, transparent);
      backdrop-filter: blur(18px);
    }
    .login__eyebrow {
      margin: 0 0 0.75rem;
      font-size: 0.8125rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--login-gold);
      font-weight: 600;
    }
    h1 {
      margin: 0 0 1rem;
      font-size: clamp(2.75rem, 6vw, 4.5rem);
      color: #f7faf8;
    }
    .login__brand > p:last-child {
      margin: 0;
      max-width: 28ch;
      font-size: 1.125rem;
      line-height: 1.55;
      color: color-mix(in srgb, #f7faf8 78%, transparent);
    }
    form, label { display: grid; gap: 0.5rem; max-width: 380px; }
    label { font-size: 0.875rem; color: color-mix(in srgb, #f7faf8 70%, transparent); }
    input {
      min-height: 2.85rem;
      padding: 0.75rem 0.9rem;
      border-radius: var(--radius);
      border: 1px solid color-mix(in srgb, var(--login-gold) 35%, transparent);
      background: color-mix(in srgb, var(--login-ink) 70%, transparent);
      color: #f7faf8;
    }
    button {
      margin-top: 0.5rem;
      min-height: 3rem;
      border: none;
      border-radius: 999px;
      background: linear-gradient(135deg, var(--login-gold), var(--cta-end));
      color: #3a0010;
      font-weight: 600;
      cursor: pointer;
    }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .error { color: #ffb4a8; }
    @media (max-width: 860px) {
      .login { grid-template-columns: 1fr; }
      .login__panel {
        border-left: none;
        border-top: 1px solid color-mix(in srgb, var(--login-gold) 28%, transparent);
      }
    }
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService)
  private readonly router = inject(Router)

  email = ''
  password = ''
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
