import { Routes } from '@angular/router';
import { AuthGuard } from './guard/auth.guard';
import { MerchantTransactionsComponent } from './pages/merchants/merchant-transactions.component';
import { MerchantDetailsComponent } from './pages/merchants/mechant-details.component';
import { MerchantSettlementsComponent } from './pages/merchants/merchant-settlement.component';
import { ReportsComponent } from './pages/merchants-reports/merchants-reports.component';
import { MerchantWalletsComponent } from './pages/merchant-wallets/merchant-wallets.component';
import { HubDashboardComponent } from './pages/hub/hub-dashboard.component';
import { QueueDashboardComponent } from './pages/queues/queue-dashboard.component';
import { TransactionModalComponent } from './components/transactoin.modal';
import { TransactionDetailsComponent } from './pages/transactions/transaction-details.component';
import { SystemSettingsComponent } from './pages/system-settings/system-settings.component';
import { OperatorConfigComponent } from './pages/operator-config/operator-config.component';
import { ChargeConfigComponent } from './pages/charge-config/charge-config.component';

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
      {
        path: 'reports',
        component: ReportsComponent,
      },
      {
        path: 'wallets',
        component: MerchantWalletsComponent,
      },
      {
        path: 'hub',
        component: HubDashboardComponent,
      },
      {
        path: 'queues',
        component: QueueDashboardComponent,
      },
      {
        path: 'transactions',
        component: TransactionDetailsComponent,
      },
      {
        path: 'settings',
        component: SystemSettingsComponent,
      },
      {
        path: 'operator-config',
        component: OperatorConfigComponent,
      },
      {
        path: 'charge-config',
        component: ChargeConfigComponent,
      },
      // Add other child routes here
      { path: '', redirectTo: 'mechant', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'mechant' },
];