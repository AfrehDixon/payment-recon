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
  otp: string = '';
  validatedData: any;
  validatedToken: any;
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

  ngOnInit(): void {}

  login() {
    const form = this.formGroup;
    if (!form.get('email')?.valid || !form.get('password')?.valid) return;
    const { email, password } = form.value;
    this.loading = true;
    this.service.login({ email, password }).subscribe({
      next: (response: { data: { email: any; }; token: any; }) => {
        this.validatedData = response.data;
        this.validatedEmail = this.validatedData.email;
        this.validatedToken = response.token;
        this.buttonOperation = 'Log In';
        this.triggerOtp = true;
        this.service.sendotp({ email: response.data.email }).subscribe();
      },
      error: (err: Error) => {
        this.dialog.open(AlertComponent, {
          data: { title: 'Login Failed', message: (err as Error)?.message },
        });
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  confirmOtp() {
    const form = this.formGroup;
    if (!form.get('otp')?.valid) return;
    const { otp } = form.value;
    this.loading = true;
    
    this.service.validate({ email: this.validatedEmail, otp }).subscribe({
      next: () => {
        this.store.dispatch(
          new AdminLogin({
            user: this.validatedData,
            token: this.validatedToken,
          })
        ).subscribe(() => {
          this.router.navigate(['/payment-reconciliation']);
          
        });
      },
      error: (err: { message: any; }) => {
        this.loading = false;
        this.dialog.open(AlertComponent, {
          data: { title: 'Oops!', message: err.message },
        });
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  ngOnDestroy(): void {}
}