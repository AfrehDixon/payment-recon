// payment-links.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Store } from '@ngxs/store';
import { AuthState } from '../../state/apps/app.states';

interface PaymentLink {
  linkId: string;
  merchantName: string;
  amount: number;
  currency: string;
  description: string;
  accountName: string;
  status: string;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: PaymentLink[];
}

@Component({
  selector: 'app-payment-links',
  templateUrl: './payment-links.component.html',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./payment-links.component.scss'],
})
export class PaymentLinksComponent implements OnInit {
  paymentLinks: PaymentLink[] = [];
  isLoading: boolean = true;
  error: string | null = null;

  constructor(private http: HttpClient,private store: Store) {}

  ngOnInit(): void {
    this.fetchPaymentLinks();
  }

  fetchPaymentLinks(): void {
    this.isLoading = true;
    this.http
      .get<ApiResponse>(
        'https://doronpay.com/api/transactions/payment-links/get', {
            headers: this.getHeaders(),
        }
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.paymentLinks = response.data;
          } else {
            this.error = response.message || 'Failed to fetch payment links';
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.error =
            'An error occurred while fetching payment links. Please try again later.';
          this.isLoading = false;
          console.error('Error fetching payment links:', err);
        },
      });
  }

  private getHeaders(): HttpHeaders {
      const token = this.store.selectSnapshot(AuthState.token);
      return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

  refreshLinks(): void {
    this.error = null;
    this.fetchPaymentLinks();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusClass(status: string): string {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  }
}
