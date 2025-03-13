import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
})
export class LoginComponent implements OnInit, OnDestroy {
  formGroup: FormGroup;
  loading: boolean = false;
  resendLoading: boolean = false;
  triggerOtp: boolean = false;
  validatedEmail: string = '';
  buttonOperation: string = 'Send Otp';
  showPassword: boolean = false;
  otpSent: boolean = false;
  cooldownActive: boolean = false;
  cooldownTime: number = 60; // seconds
  private cooldownSubscription?: Subscription;

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

  ngOnInit(): void {
    // Initialize any necessary data or state here
    this.formGroup.reset();
    
    // Set otp control as not required initially
    this.formGroup.get('otp')?.clearValidators();
    this.formGroup.get('otp')?.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    // Clean up any subscriptions
    if (this.cooldownSubscription) {
      this.cooldownSubscription.unsubscribe();
    }
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
        this.otpSent = true;
        
        // Add validators to OTP field when we need it
        this.formGroup.get('otp')?.setValidators([Validators.required]);
        this.formGroup.get('otp')?.updateValueAndValidity();
        
        // Start cooldown for resend button
        this.startCooldown();
      },
      error: (err) => {
        this.showError('Failed to send OTP: ' + err.message);
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  togglePasswordVisibility(event: Event): void {
    // Prevent form submission if button is inside form
    event.preventDefault();

    // Toggle password visibility
    this.showPassword = !this.showPassword;

    // Get the password input element
    const passwordInput = document.getElementById(
      'password'
    ) as HTMLInputElement;

    // Maintain focus on the input field for better UX
    if (passwordInput) {
      const cursorPosition = passwordInput.selectionStart;
      passwordInput.focus();
      // Wait for next tick to set cursor position
      setTimeout(() => {
        passwordInput.setSelectionRange(cursorPosition, cursorPosition);
      }, 0);
    }
  }

  confirmOtp() {
    const form = this.formGroup;
    if (!form.get('otp')?.valid) return;

    const { email, password, otp } = form.value;
    this.loading = true;

    this.service.login({ email, password, otp }).subscribe({
      next: (response) => {
        this.store
          .dispatch(
            new AdminLogin({
              user: response.data,
              token: response.token,
            })
          )
          .subscribe(() => {
            this.router.navigate(['/mechant']);
          });
      },
      error: (err) => {
        this.showError('Login failed: ' + err.message);
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  resendOtp() {
    if (this.cooldownActive || this.resendLoading) return;
    
    this.resendLoading = true;
    const { email } = this.formGroup.value;

    this.service.sendotp({ email }).subscribe({
      next: () => {
        this.otpSent = true;
        // Reset OTP field
        this.formGroup.get('otp')?.setValue(null);
        
        // Start cooldown timer
        this.startCooldown();
        
        // Show success message temporarily
        setTimeout(() => {
          this.otpSent = false;
        }, 3000);
      },
      error: (err) => {
        this.showError('Failed to resend OTP: ' + err.message);
      },
      complete: () => {
        this.resendLoading = false;
      },
    });
  }

  private startCooldown() {
    // Clean up any existing subscription
    if (this.cooldownSubscription) {
      this.cooldownSubscription.unsubscribe();
    }
    
    // Initialize cooldown
    this.cooldownActive = true;
    this.cooldownTime = 60;
    
    // Create interval to update cooldown timer every second
    this.cooldownSubscription = interval(1000).subscribe(() => {
      this.cooldownTime--;
      
      if (this.cooldownTime <= 0) {
        this.cooldownActive = false;
        this.cooldownSubscription?.unsubscribe();
      }
    });
  }

  private showError(message: string): void {
    this.dialog.open(AlertComponent, {
      data: { title: 'Error', message },
    });
    this.loading = false;
    this.resendLoading = false;
  }
}