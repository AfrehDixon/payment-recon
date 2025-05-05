import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { LoginComponent } from "./pages/auth-layout.ts/login/login.component";
import { PaymentReconciliationComponent } from "./pages/payment-reconcilation/payment-reconciliation.component";
import { Select, Store } from '@ngxs/store';
import { AutoLogin } from './state/apps/app.actions';
import { InactivityTimeoutService } from './service/interactivity-timeout.service';
import { AuthState } from './state/apps/app.states';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatCardModule, LoginComponent, RouterOutlet, PaymentReconciliationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  @Select(AuthState.user) user$!: Observable<any>;

  constructor(private store: Store,     private inactivityService: InactivityTimeoutService  ) {}

  ngOnInit() {
    this.store.dispatch(new AutoLogin());

    this.user$.subscribe(user => {
      if (user) {
        // Start monitoring for inactivity only when user is logged in
        this.inactivityService.startMonitoring();
      } else {
        // Stop monitoring when user is not logged in
        this.inactivityService.stopMonitoring();
      }
    });
  }
  
}
