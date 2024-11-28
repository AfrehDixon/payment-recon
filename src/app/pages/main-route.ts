import { Routes } from '@angular/router';
import { PaymentReconciliationComponent } from './payment-reconcilation/payment-reconciliation.component';
import { MerchantComponent  } from './merchants/merchants.component';
// import { ReconComponent } from './recon/recon.component';
// import { OtherComponent } from './other/other.component';

export const mainRoutes: Routes = [
    { path: 'payment-reconciliation', component: PaymentReconciliationComponent },
  {path: 'mechant' , component :MerchantComponent },

  // { path: 'other', component: OtherComponent },
  { path: '', redirectTo: '/payment-reconciliation', pathMatch: 'full' },
  { path: '**', redirectTo: '/payment-reconciliation' },
];
