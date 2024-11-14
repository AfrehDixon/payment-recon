import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { LoginComponent } from "./pages/auth-layout.ts/login/login.component";
import { PaymentReconciliationComponent } from "./pages/payment-reconcilation/payment-reconciliation.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatCardModule, LoginComponent, RouterOutlet, PaymentReconciliationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  
}
