import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { AdminService } from '../../../service/admin.service';
import { MatDialog } from '@angular/material/dialog';
import { AlertComponent } from '../../../components/alert/alert.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { PermissionService } from '../../../service/permissions.service';
import { AdminLogin } from '../../../state/apps/app.actions';

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
    private router: Router,
    private permissionService: PermissionService
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
    
    // Check if already logged in
    const loginData = localStorage.getItem('PLOGIN');
    if (loginData) {
      try {
        const parsedData = JSON.parse(loginData);
        if (parsedData.token) {
          // Already logged in, redirect
          this.router.navigate(['/mechant']);
        }
      } catch (error) {
        console.error('Error parsing login data:', error);
      }
    }
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

  // In login.component.ts, modify the confirmOtp method:
  confirmOtp() {
    const form = this.formGroup;
    if (!form.get('otp')?.valid) return;
  
    const { email, password, otp } = form.value;
    this.loading = true;
  
    this.service.login({ email, password, otp }).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        
        // Extract permission names if they are objects
        let permissions = response.data.permissions;
        if (permissions && Array.isArray(permissions)) {
          // Check if permissions are objects with a name property
          if (permissions.length > 0 && typeof permissions[0] === 'object' && permissions[0].name) {
            // Map objects to just their name strings
            const permissionNames = permissions.map(p => p.name);
            
            // Create a copy of the response with the simplified permissions
            const modifiedResponse = {
              ...response,
              data: {
                ...response.data,
                permissions: permissionNames
              }
            };
            
            // Store the modified data in localStorage
            const loginData = {
              user: modifiedResponse.data,
              token: response.token,
              refreshToken: response.refreshToken
            };
            localStorage.setItem('PLOGIN', JSON.stringify(loginData));
            
            // Update permissions in permission service
            this.permissionService.setPermissions(permissionNames);
          } else {
            // If permissions are already strings, store as is
            const loginData = {
              user: response.data,
              token: response.token,
              refreshToken: response.refreshToken
            };
            localStorage.setItem('PLOGIN', JSON.stringify(loginData));
            
            // Update permissions in permission service
            this.permissionService.setPermissions(permissions);
          }
        }
        
        // Dispatch login action to NGXS store
        // Note: You might need to update the AdminLogin action to handle the modified data
        const loginData = {
          user: response.data,
          token: response.token,
          refreshToken: response.refreshToken
        };
        
        this.store.dispatch(new AdminLogin(loginData)).subscribe(() => {
          console.log('Login action dispatched successfully');
          
          // Force navigation directly here after action completes
          // Using a slight delay to ensure state updates complete
          setTimeout(() => {
            console.log('Forced navigation to /mechant route');
            // Use direct hash navigation to avoid any routing issues
            window.location.hash = '#/mechant';
          }, 100);
        });
      },
      error: (err) => {
        this.showError('Login failed: ' + err.message);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
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