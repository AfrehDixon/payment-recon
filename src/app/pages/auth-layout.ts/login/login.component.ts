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
    MatInputModule,
  ],
})
export class LoginComponent implements OnInit {
  formGroup: FormGroup;
  loading: boolean = false;
  triggerOtp: boolean = false;
  validatedEmail: string = '';
  buttonOperation: string = 'Send Otp';
  showPassword: boolean = false;

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

  private showError(message: string): void {
    this.dialog.open(AlertComponent, {
      data: { title: 'Error', message },
    });
    this.loading = false;
  }
}
