import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TransactionService } from './transaction.service';
import { Transaction } from './transaction.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-transaction-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transaction-details.component.html',
  styleUrls: ['./transaction-details.component.scss']
})
export class TransactionDetailsComponent {
  searchForm: FormGroup;
  transaction: Transaction | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService
  ) {
    this.searchForm = this.fb.group({
      transactionId: ['', [Validators.required]]
    });
  }

  searchTransaction() {
    if (this.searchForm.invalid || this.loading) return;

    const id = this.searchForm.get('transactionId')?.value;
    this.loading = true;
    this.error = null;
    this.transaction = null;

    this.transactionService.getTransactionById(id).subscribe({
      next: (response) => {
        if (response.data && response.data.length > 0) {
          this.transaction = response.data[0];
        } else {
          this.error = 'No transaction found';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to fetch transaction';
        this.loading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status.toUpperCase()) {
      case 'PAID':
        return 'status-success';
      case 'PENDING':
        return 'status-pending';
      case 'FAILED':
        return 'status-failed';
      default:
        return 'status-default';
    }
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }
}