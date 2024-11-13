import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
 username: string = '';
  password: string = '';

  constructor(private router: Router) {}

  login() {
    // Add your authentication logic here
    // if (this.username === 'admin' && this.password === 'admin') {
      this.router.navigate(['/payment-reconciliation']);
    // } else {
      // alert('Invalid credentials');
    // }
  }
}