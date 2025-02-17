import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TransactionService } from './transaction.service';
import { Transaction } from './transaction.interface';

@Component({
  selector: 'app-transaction-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transaction-details.component.html',
  styleUrls: ['./transaction-details.component.scss']
})
export class TransactionDetailsComponent {
  searchForm: FormGroup;
  transactions: (Transaction & { showDetails?: boolean })[] = [];
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
    this.transactions = [];

    this.transactionService.getTransactionById(id).subscribe({
      next: (response) => {
        if (response.data && response.data.length > 0) {
          this.transactions = response.data.map(tx => ({
            ...tx,
            showDetails: false
          }));
        } else {
          this.error = 'No transactions found';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to fetch transaction';
        this.loading = false;
      }
    });
  }

  toggleDetails(transaction: Transaction & { showDetails?: boolean }) {
    transaction.showDetails = !transaction.showDetails;
  }

  getStatusClass(status: string): string {
    const baseClasses = 'px-3 py-1 text-sm font-medium rounded-full';
    return `${baseClasses} ${
      status === 'PAID' ? 'bg-green-100 text-green-800' :
      status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
      'bg-red-100 text-red-800'
    }`;
  }

  calculateTotal(field: keyof Pick<Transaction, 'amount' | 'charges' | 'actualAmount'>): number {
    return this.transactions.reduce((sum, tx) => sum + (tx[field] || 0), 0);
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