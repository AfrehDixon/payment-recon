import { Routes } from '@angular/router';
import { AuthGuard } from './guard/auth.guard';
import { MerchantTransactionsComponent } from './pages/merchants/merchant-transactions.component';
import { MerchantDetailsComponent } from './pages/merchants/mechant-details.component';
import { MerchantSettlementsComponent } from './pages/merchants/merchant-settlement.component';

export const routes: Routes = [
  {
    path: 'auth/login',
    loadComponent: () =>
      import('../../src/app/pages/auth-layout.ts/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('../app/pages/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'payment-reconciliation',
        loadComponent: () =>
          import(
            '../../src/app/pages/payment-reconcilation/payment-reconciliation.component'
          ).then((m) => m.PaymentReconciliationComponent),
      },
      {
        path: 'mechant',
        loadComponent: () =>
          import('./pages/merchants/merchants.component').then(
            (m) => m.MerchantComponent
          ),
      },
      {
        path: 'admins',
        loadComponent: () =>
          import('./pages/admin-management/admin-management.component').then(
            (m) => m.AdminManagementComponent
          ),
      },
      {
        path: 'merchants/transactions/:id',
        component: MerchantTransactionsComponent,
      },
      {
        path: 'merchants/details/:id',
        component: MerchantDetailsComponent,
      },
      {
        path: 'merchants/settlements/:id',
        component: MerchantSettlementsComponent,
      },
      // Add other child routes here
      { path: '', redirectTo: 'payment-reconciliation', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'payment-reconciliation' },
];