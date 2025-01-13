import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { AdminService } from '../../../service/admin.service';
import { AdminLogin } from '../../../auth/auth.action';
import { MatDialog } from '@angular/material/dialog';
import { AlertComponent } from '../../../components/alert/alert.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule
  ]
})
export class LoginComponent implements OnInit {
  formGroup: FormGroup;
  loading: boolean = false;
  triggerOtp: boolean = false;
  validatedEmail: string = '';
  buttonOperation: string = 'Send Otp';

  constructor(
    private service: AdminService,
    private store: Store,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.formGroup = this.fb.group({
      email: [null, [Validators.required, Validators.email]],
      password: [null, Validators.required],
      otp: [null, Validators.required],
    });
  }
  ngOnInit() {
    this.store.select(state => state.auth).subscribe(
      authState => console.log('Current auth state:', authState)
    );
  }

  login() {
    const form = this.formGroup;
    if (!form.get('email')?.valid || !form.get('password')?.valid) return;
    
    const { email, password } = form.value;
    this.loading = true;
    
    this.service.sendotp({ email }).subscribe({
      next: () => {
        this.validatedEmail = email;
        this.buttonOperation = 'Log In';
        this.triggerOtp = true;
      },
      error: (err) => {
        this.showError('Failed to send OTP: ' + err.message);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  confirmOtp() {
    const form = this.formGroup;
    if (!form.get('otp')?.valid) return;
    
    const { email, password, otp } = form.value;
    this.loading = true;

    this.service.login({ email, password, otp }).subscribe({
      next: (response) => {
        this.store.dispatch(
          new AdminLogin({
            user: response.data,
            token: response.token
          })
        ).subscribe(() => {
          this.router.navigate(['/payment-reconciliation']);
        });
      },
      error: (err) => {
        this.showError('Login failed: ' + err.message);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  private showError(message: string): void {
    this.dialog.open(AlertComponent, {
      data: { title: 'Error', message }
    });
    this.loading = false;
  }
}