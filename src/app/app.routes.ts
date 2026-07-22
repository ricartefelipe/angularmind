import type { Routes } from '@angular/router'
import { authGuard } from './core/auth/auth.guard'
import { LoginPage } from './features/auth/login.page'
import { AppShellComponent } from './shared/ui/app-shell.component'

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/wallet/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/wallet/transactions.page').then((m) => m.TransactionsPage),
      },
      {
        path: 'beneficiaries',
        loadComponent: () =>
          import('./features/beneficiaries/beneficiaries.page').then((m) => m.BeneficiariesPage),
      },
      {
        path: 'transfers/pix',
        loadComponent: () =>
          import('./features/transfers/transfer-pix.page').then((m) => m.TransferPixPage),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
]
