import type { Routes } from '@angular/router'
import { authGuard } from './core/auth/auth.guard'
import { LoginPage } from './features/auth/login.page'

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/wallet/dashboard.page').then((module) => module.DashboardPage),
  },
]
