import { Routes } from '@angular/router';
import { LoginComponent } from './pages/auth-layout.ts/login/login.component';
import { PaymentReconciliationComponent } from './pages/payment-reconcilation/payment-reconciliation.component';
import { AuthGuard } from './guard/auth.guard';

export const routes: Routes = [
  {
    path: 'auth/login',
    loadComponent: () => import('../../src/app/pages/auth-layout.ts/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'payment-reconciliation',
    loadComponent: () => import('../../src/app/pages/payment-reconcilation/payment-reconciliation.component')
      .then(m => m.PaymentReconciliationComponent),
    canActivate: [AuthGuard]
  },
    { path: '', redirectTo: 'auth/login', pathMatch: 'full' }
];
