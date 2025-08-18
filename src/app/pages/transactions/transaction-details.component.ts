import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TransactionService } from './transaction.service';
import { Transaction } from './transaction.interface';

@Component({
  selector: 'app-transaction-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './transaction-details.component.html',
  styleUrls: ['./transaction-details.component.scss']
})
export class TransactionDetailsComponent {
  searchForm: FormGroup;
  statusForm: FormGroup;
  transactions: (Transaction & { showDetails?: boolean; showJsonData?: boolean })[] = [];
  filteredTransactions: (Transaction & { showDetails?: boolean; showJsonData?: boolean })[] = [];
  loading = false;
  error: string | null = null;
  
  // Date filter properties
  dateFilterEnabled = false;
  startDate: string = '';
  endDate: string = '';
  
  // Modal visibility controls
  showStatusModal = false;
  showReverseModal = false;
  showCompleteModal = false;
  
  // Selected transaction for actions
  selectedTransaction: (Transaction & { showDetails?: boolean; showJsonData?: boolean }) | null = null;

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService
  ) {
    this.searchForm = this.fb.group({
      transactionId: ['', [Validators.required]]
    });
    
    this.statusForm = this.fb.group({
      status: ['', Validators.required]
    });
    
    // Initialize with today's date and 7 days ago
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    this.endDate = today.toISOString().split('T')[0];
    this.startDate = sevenDaysAgo.toISOString().split('T')[0];
  }

  searchTransaction() {
    if (this.searchForm.invalid || this.loading) return;

    const id = this.searchForm.get('transactionId')?.value;
    this.loading = true;
    this.error = null;
    this.transactions = [];
    this.filteredTransactions = [];

    this.transactionService.getTransactionById(id).subscribe({
      next: (response) => {
        if (response.data && response.data.length > 0) {
          this.transactions = response.data.map(tx => ({
            ...tx,
            showDetails: false,
            showJsonData: false
          }));
          
          // Apply date filters if enabled
          this.applyDateFilter();
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
  
  toggleDateFilter() {
    this.dateFilterEnabled = !this.dateFilterEnabled;
    this.applyDateFilter();
  }
  
  applyDateFilter() {
    if (!this.dateFilterEnabled || !this.transactions.length) {
      this.filteredTransactions = [...this.transactions];
      return;
    }
    
    const start = this.startDate ? new Date(this.startDate) : null;
    const end = this.endDate ? new Date(this.endDate) : null;
    
    // Add one day to end date to include the full day
    if (end) {
      end.setDate(end.getDate() + 1);
    }
    
    this.filteredTransactions = this.transactions.filter(tx => {
      const txDate = new Date(tx.createdAt);
      return (!start || txDate >= start) && (!end || txDate < end);
    });
  }
  
  onDateFilterChange() {
    this.applyDateFilter();
  }
  
  resetFilters() {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    this.endDate = today.toISOString().split('T')[0];
    this.startDate = sevenDaysAgo.toISOString().split('T')[0];
    
    this.applyDateFilter();
  }

  toggleDetails(transaction: Transaction & { showDetails?: boolean; showJsonData?: boolean }) {
    transaction.showDetails = !transaction.showDetails;
    // Close JSON view when closing details
    if (!transaction.showDetails && transaction.showJsonData) {
      transaction.showJsonData = false;
    }
  }

  // JSON data handling
  toggleJsonView(transaction: Transaction & { showDetails?: boolean; showJsonData?: boolean }) {
    transaction.showJsonData = !transaction.showJsonData;
  }

  getFormattedJsonData(transaction: Transaction & { showDetails?: boolean; showJsonData?: boolean }): string {
    // Create a filtered copy of the transaction to display non-UI fields
    const displayData = { ...transaction };
    
    // Remove UI-specific properties
    delete (displayData as any).showDetails;
    delete displayData.showJsonData;
    
    // Format with indentation for readability
    return JSON.stringify(displayData, null, 2);
  }

  // MODAL HANDLING
  openStatusModal(transaction: Transaction & { showDetails?: boolean; showJsonData?: boolean }) {
    this.selectedTransaction = transaction;
    this.statusForm.patchValue({ status: transaction.status });
    this.showStatusModal = true;
  }

  closeStatusModal() {
    this.showStatusModal = false;
    this.selectedTransaction = null;
    this.statusForm.reset();
  }

  openReverseModal(transaction: Transaction & { showDetails?: boolean; showJsonData?: boolean }) {
    this.selectedTransaction = transaction;
    this.showReverseModal = true;
  }

  closeReverseModal() {
    this.showReverseModal = false;
    this.selectedTransaction = null;
  }

  openCompleteModal(transaction: Transaction & { showDetails?: boolean; showJsonData?: boolean }) {
    this.selectedTransaction = transaction;
    this.showCompleteModal = true;
  }

  closeCompleteModal() {
    this.showCompleteModal = false;
    this.selectedTransaction = null;
  }

  // ACTION HANDLERS
  updateTransaction() {
    if (this.statusForm.invalid || !this.selectedTransaction) return;
    
    this.loading = true;
    this.error = null;
    
    const updateData = {
      id: this.selectedTransaction._id,
      data: {
        status: this.statusForm.get('status')?.value
      }
    };
    
    this.transactionService.updateTransaction(updateData).subscribe({
      next: (response) => {
        if (response.success) {
          // Update the transaction in the list
          if (this.selectedTransaction) {
            this.selectedTransaction.status = updateData.data.status;
          }
          this.closeStatusModal();
        } else {
          this.error = response.message || 'Failed to update status';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to update transaction status';
        this.loading = false;
      }
    });
  }

  reverseTransaction() {
    if (!this.selectedTransaction) return;
    
    this.loading = true;
    this.error = null;
    
    const reverseData = {
      transactionRef: this.selectedTransaction.transactionRef,
      amount: this.selectedTransaction.amount,
      description: 'Reversal transaction'
    };
    
    this.transactionService.reverseTransaction(reverseData).subscribe({
      next: (response) => {
        if (response.success) {
          // Refresh the search to get updated transaction
          this.searchTransaction();
          this.closeReverseModal();
        } else {
          this.error = response.message || 'Failed to reverse transaction';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to reverse transaction';
        this.loading = false;
      }
    });
  }

  completeTransaction() {
    if (!this.selectedTransaction) return;
    
    this.loading = true;
    this.error = null;
    
    const completeData = {
      id: this.selectedTransaction._id,
      status: 'PAID'
    };
    
    this.transactionService.completeTransaction(completeData).subscribe({
      next: (response) => {
        if (response.success) {
          if (this.selectedTransaction) {
            this.selectedTransaction.status = completeData.status;
          }
          // Refresh the search to get updated transaction
          this.searchTransaction();
          this.closeCompleteModal();
        } else {
          this.error = response.message || 'Failed to complete transaction';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to complete transaction';
        this.loading = false;
      }
    });
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
    // Use filtered transactions for calculations
    return this.filteredTransactions.reduce((sum, tx) => sum + (tx[field] || 0), 0);
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
  
  canReverse(transaction: Transaction): boolean {
    return transaction.description === 'Reversal transaction';
  }
  
  canComplete(transaction: Transaction): boolean {
    return transaction.status !== 'COMPLETED';
  }
}