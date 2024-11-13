import { Routes } from '@angular/router';
import { LoginComponent } from './pages/auth-layout.ts/login/login.component';
import { PaymentReconciliationComponent } from './pages/payment-reconcilation/payment-reconciliation.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
    { path: 'payment-reconciliation', component: PaymentReconciliationComponent },
    { path: '', redirectTo: '/login', pathMatch: 'full' }
];
