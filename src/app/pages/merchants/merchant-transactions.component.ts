// merchant-transactions.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, take, of } from 'rxjs';
import API from '../../constants/api.constant';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

interface Transaction {
  _id: string;
  transactionRef: string;
  status: string;
  transaction_type: string;
  amount: number;
  actualAmount: number;
  charges: number;
  payment_account_name: string;
  payment_account_number: string;
  payment_account_issuer: string;
  payment_account_type: string;
  recipient_account_name: string;
  recipient_account_number: string;
  recipient_account_type: string;
  description: string;
  createdAt: string;
  customerId: {
    merchant_tradeName: string;
  };
}

interface TransactionUpdateRequest {
  id: string;
  data: {
    status: string;
  };
}

interface TransactionUpdateResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface ReverseRequest {
  transactionRef: string;
  amount: string | number;
  description: string;
}

interface ReverseResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface Filters {
  startDate: string;
  endDate: string;
  phone: string;
  name: string;
  ref: string;
}

@Component({
  selector: 'app-merchant-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="transactions-container">
      <!-- Header Section -->
      <div class="header-section">
        <div class="header-content">
          <h1 class="page-title">Merchant Transactions</h1>
          <button class="back-btn" (click)="goBack()">
            <i class="fas fa-arrow-left"></i> Back to Merchants
          </button>
        </div>
        <p class="merchant-name" *ngIf="transactions.length > 0">
          {{ transactions[0].customerId.merchant_tradeName }}
        </p>
      </div>
      <!-- Filters Section -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-item">
            <label>Start Date</label>
            <input
              type="date"
              [(ngModel)]="filters.startDate"
              (change)="applyFilters()"
            />
          </div>
          <div class="filter-item">
            <label>End Date</label>
            <input
              type="date"
              [(ngModel)]="filters.endDate"
              (change)="applyFilters()"
            />
          </div>
          <div class="filter-item">
            <label>Phone Number</label>
            <input
              type="text"
              [(ngModel)]="filters.phone"
              (input)="applyFilters()"
              placeholder="Search by phone number"
            />
          </div>
          <div class="filter-item">
            <label>Name</label>
            <input
              type="text"
              [(ngModel)]="filters.name"
              (input)="applyFilters()"
              placeholder="Search by name"
            />
          </div>
          <div class="filter-item">
            <label>Reference</label>
            <input
              type="text"
              [(ngModel)]="filters.ref"
              (input)="applyFilters()"
              placeholder="Search by transaction reference"
            />
          </div>
          <div class="filter-actions">
            <button class="clear-btn" (click)="clearFilters()">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-spinner">
        <div class="spinner"></div>
      </div>

      <!-- Error Message -->
      <div *ngIf="error" class="error-message">
        {{ error }}
      </div>

      <div class="modal" *ngIf="showStatusModal">
        <div class="modal-content">
          <h2 class="modal-title">Update Transaction Status</h2>

          <form [formGroup]="statusForm" (ngSubmit)="updateTransaction()">
            <div class="form-group">
              <label>Select Status</label>
              <select formControlName="status" class="form-input">
                <option value="">Select a status...</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
              <div
                class="error-message"
                *ngIf="
                  statusForm.get('status')?.invalid &&
                  statusForm.get('status')?.touched
                "
              >
                <span *ngIf="statusForm.get('status')?.errors?.['required']"
                  >Status is required</span
                >
              </div>
            </div>

            <!-- Error Message -->
            <div class="error-message" *ngIf="error">
              {{ error }}
            </div>

            <div class="modal-actions">
              <button
                type="button"
                class="modal-btn cancel"
                (click)="closeStatusModal()"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="modal-btn submit"
                [disabled]="statusForm.invalid || isLoading"
              >
                {{ isLoading ? 'Updating...' : 'Update Status' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Transactions Table -->
      <div
        class="table-container"
        *ngIf="!isLoading && transactions.length > 0"
      >
        <table class="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Reference</th>
              <th>Description</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Charges</th>
              <th>Total</th>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let transaction of paginatedTransactions">
              <td>{{ transaction.createdAt | date : 'medium' }}</td>
              <td>{{ transaction.transactionRef }}</td>
              <td>{{ transaction.description }}</td>
              <td>{{ transaction.transaction_type }}</td>
              <td>₵ {{ transaction.actualAmount | number : '1.2-2' }}</td>
              <td>₵ {{ transaction.charges | number : '1.2-2' }}</td>
              <td>₵ {{ transaction.amount | number : '1.2-2' }}</td>
              <td>
                <div class="account-info">
                  <span class="name">{{
                    transaction.payment_account_name
                  }}</span>
                  <span class="details">
                    {{ transaction.payment_account_number }}
                    ({{ transaction.payment_account_issuer | uppercase }})
                  </span>
                </div>
              </td>
              <td>
                <div class="account-info">
                  <span class="name">{{
                    transaction.recipient_account_name
                  }}</span>
                  <span class="details">
                    {{ transaction.recipient_account_number }}
                    ({{ transaction.recipient_account_type | uppercase }})
                  </span>
                </div>
              </td>
              <td>
                <span
                  [class]="'status-badge ' + transaction.status.toLowerCase()"
                >
                  {{ transaction.status }}
                </span>
              </td>
              <td>
                <div class="action-icons">
                  <button
                    class="icon-btn"
                    (click)="openReverseModal(transaction)"
                    title="Reverse Transaction"
                    [disabled]="transaction.status !== 'PAID'"
                  >
                    <i class="fas fa-undo"></i>
                  </button>
                  <button
                    class="icon-btn"
                    (click)="openStatusModal(transaction._id)"
                    title="Update Transaction Status"
                  >
                    <i class="fas fa-sync-alt"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination Controls -->
        <div class="pagination-container">
          <div class="pagination-info">
            Showing {{ startIndex + 1 }} to {{ endIndex }} of
            {{ filteredTransactions.length }} entries
          </div>
          <div class="pagination-controls">
            <button
              class="pagination-btn"
              [disabled]="currentPage === 1"
              (click)="changePage(currentPage - 1)"
            >
              Previous
            </button>
            <div class="pagination-pages">
              <button
                *ngFor="let page of pageNumbers"
                class="page-btn"
                [class.active]="page === currentPage"
                (click)="changePage(page)"
              >
                {{ page }}
              </button>
            </div>
            <button
              class="pagination-btn"
              [disabled]="currentPage === totalPages"
              (click)="changePage(currentPage + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <!-- No Transactions Message -->
      <div *ngIf="!isLoading && transactions.length === 0" class="no-data">
        No transactions found for this merchant.
      </div>
      <div class="modal" *ngIf="showReverseModal">
        <div class="modal-content">
          <h2 class="modal-title">Reverse Transaction</h2>

          <div class="transaction-details">
            <div class="detail-item">
              <label>Reference:</label>
              <span>{{ selectedTransaction?.transactionRef }}</span>
            </div>
            <div class="detail-item">
              <label>Amount:</label>
              <span
                >₵ {{ selectedTransaction?.amount | number : '1.2-2' }}</span
              >
            </div>
            <div class="detail-item">
              <label>Original Date:</label>
              <span>{{
                selectedTransaction?.createdAt | date : 'medium'
              }}</span>
            </div>
          </div>

          <div class="warning-message">
            Are you sure you want to reverse this transaction? This action
            cannot be undone.
          </div>

          <!-- Error Message -->
          <div class="error-message" *ngIf="error">
            {{ error }}
          </div>

          <div class="modal-actions">
            <button
              type="button"
              class="modal-btn cancel"
              (click)="closeReverseModal()"
              [disabled]="isLoading"
            >
              Cancel
            </button>
            <button
              type="button"
              class="modal-btn confirm"
              (click)="reverseTransaction()"
              [disabled]="isLoading"
            >
              {{ isLoading ? 'Processing...' : 'Confirm Reversal' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .transactions-container {
        padding: 24px;
        background-color: #f8f9fa;
        min-height: 100vh;
        margin-left: 200px;
      }

      .header-section {
        margin-bottom: 32px;
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .merchant-name {
        color: #6b7280;
        font-size: 16px;
        margin: 0;
      }

      .filters-section {
        background: white;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 24px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .filters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        align-items: end;
      }

      .filter-item {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .action-icons {
        display: flex;
        gap: 4px;
        justify-content: flex-start;
      }

      .form-group {
        margin-bottom: 20px;
      }

      .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #495057;
      }

      .form-input {
        width: 100%;
        padding: 10px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-size: 14px;
        transition: border-color 0.2s;
      }

      .form-input:focus {
        border-color: #007bff;
        outline: none;
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
      }

      select.form-input {
        background-color: white;
        cursor: pointer;
      }

      .error-message {
        color: #dc3545;
        font-size: 12px;
        margin-top: 4px;
      }

      .modal-btn.submit {
        min-width: 100px;
      }

      .modal-btn.submit:disabled {
        background-color: #6c757d;
        cursor: not-allowed;
      }

      .filter-item label {
        font-size: 14px;
        font-weight: 500;
        color: #374151;
      }

      .filter-item input {
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        transition: all 0.2s;
      }

      .filter-item input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }

      .filter-actions {
        display: flex;
        justify-content: flex-end;
      }

      .clear-btn {
        padding: 8px 16px;
        background-color: #f3f4f6;
        border: none;
        border-radius: 6px;
        color: #374151;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .clear-btn:hover {
        background-color: #e5e7eb;
      }

      .modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }

      .modal-content {
        background: white;
        border-radius: 8px;
        padding: 24px;
        width: 100%;
        max-width: 500px;
        position: relative;
        margin: 20px;
      }

      .modal-title {
        font-size: 20px;
        font-weight: 600;
        color: #1a1a1a;
        margin-bottom: 16px;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 24px;
      }

      .modal-btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
      }

      .modal-btn.cancel {
        background-color: #e5e7eb;
        color: #374151;
      }

      .modal-btn.cancel:hover:not(:disabled) {
        background-color: #d1d5db;
      }

      .modal-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .page-title {
        font-size: 24px;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0;
      }

      .back-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background-color: #fff;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .back-btn:hover {
        background-color: #f8f9fa;
      }

      .icon-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        background-color: transparent;
      }

      .icon-btn i {
        font-size: 16px;
        color: #6b7280;
        transition: color 0.2s ease;
      }

      .icon-btn:hover:not(:disabled) {
        background-color: #f3f4f6;
      }

      .icon-btn:hover:not(:disabled) i {
        color: #dc2626;
      }

      .icon-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Tooltip */
      .icon-btn:hover:not(:disabled)::before {
        content: attr(title);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        padding: 4px 8px;
        background-color: #1f2937;
        color: white;
        font-size: 12px;
        border-radius: 4px;
        white-space: nowrap;
        pointer-events: none;
        margin-bottom: 4px;
      }

      .icon-btn:hover:not(:disabled)::after {
        content: '';
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        border-width: 4px;
        border-style: solid;
        border-color: #1f2937 transparent transparent transparent;
        margin-bottom: 0px;
      }

      .transaction-details {
        background-color: #f9fafb;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 16px;
      }

      .detail-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .detail-item:last-child {
        margin-bottom: 0;
      }

      .detail-item label {
        color: #6b7280;
        font-weight: 500;
      }

      .warning-message {
        padding: 12px 16px;
        background-color: #fff5f5;
        color: #dc2626;
        border-radius: 6px;
        margin-bottom: 16px;
        font-size: 14px;
      }

      .modal-btn.confirm {
        background-color: #dc2626;
        color: white;
      }

      .modal-btn.confirm:hover:not(:disabled) {
        background-color: #b91c1c;
      }

      .table-container {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        overflow: hidden;
      }

      .transactions-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
      }

      .transactions-table th {
        background-color: #f8f9fa;
        padding: 12px 16px;
        text-align: left;
        font-weight: 600;
        color: #495057;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid #dee2e6;
      }

      .transactions-table td {
        padding: 16px;
        border-bottom: 1px solid #dee2e6;
        font-size: 14px;
      }

      .account-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .account-info .name {
        font-weight: 500;
      }

      .account-info .details {
        color: #6b7280;
        font-size: 13px;
      }

      .status-badge {
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
      }

      .status-badge.paid {
        background-color: #d1fae5;
        color: #065f46;
      }

      .status-badge.pending {
        background-color: #fef3c7;
        color: #92400e;
      }

      .status-badge.failed {
        background-color: #fee2e2;
        color: #991b1b;
      }

      .loading-spinner {
        display: flex;
        justify-content: center;
        padding: 40px 0;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .error-message {
        background-color: #fee2e2;
        color: #991b1b;
        padding: 12px 16px;
        border-radius: 6px;
        margin-bottom: 16px;
      }

      .no-data {
        text-align: center;
        padding: 40px;
        background: white;
        border-radius: 8px;
        color: #6b7280;
      }

      .pagination-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-top: 1px solid #dee2e6;
      }

      .pagination-info {
        color: #6b7280;
        font-size: 14px;
      }

      .pagination-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .pagination-pages {
        display: flex;
        gap: 4px;
      }

      .pagination-btn,
      .page-btn {
        padding: 6px 12px;
        border: 1px solid #dee2e6;
        background-color: #fff;
        color: #374151;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .pagination-btn:hover:not(:disabled),
      .page-btn:hover:not(.active) {
        background-color: #f3f4f6;
      }

      .pagination-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .page-btn.active {
        background-color: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }
    `,
  ],
})
export class MerchantTransactionsComponent implements OnInit {
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  paginatedTransactions: Transaction[] = [];
  isLoading = false;
  error: string | null = null;
  merchantId: string | null = null;
  statusForm: FormGroup;
  selectedTransactionId: string | null = null;
  showStatusModal = false;

  showReverseModal = false;
  selectedTransaction: Transaction | null = null;

  filters: Filters = {
    startDate: '',
    endDate: '',
    phone: '',
    name: '',
    ref: '',
  };

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  startIndex = 0;
  endIndex = 0;
  pageNumbers: number[] = [];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.statusForm = this.fb.group({
      status: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.merchantId = this.route.snapshot.paramMap.get('id');
    if (this.merchantId) {
      this.getTransactions();
    }
  }

  applyFilters(): void {
    this.filteredTransactions = this.transactions.filter((transaction) => {
      // Date Range Filter
      let matchesDateRange = true;
      if (this.filters.startDate || this.filters.endDate) {
        const transactionDate = new Date(transaction.createdAt);
        // Remove time portion from dates for accurate comparison
        transactionDate.setHours(0, 0, 0, 0);

        if (this.filters.startDate) {
          const startDate = new Date(this.filters.startDate);
          startDate.setHours(0, 0, 0, 0);
          matchesDateRange = matchesDateRange && transactionDate >= startDate;
        }

        if (this.filters.endDate) {
          const endDate = new Date(this.filters.endDate);
          endDate.setHours(0, 0, 0, 0);
          matchesDateRange = matchesDateRange && transactionDate <= endDate;
        }
      }

      // Phone Number Filter
      const matchesPhone =
        !this.filters.phone ||
        (transaction.payment_account_number &&
          transaction.payment_account_number.includes(this.filters.phone)) ||
        (transaction.recipient_account_number &&
          transaction.recipient_account_number.includes(this.filters.phone));

          // Transaction Ref Filter
          const matchesRef =
          !this.filters.ref ||
          transaction.transactionRef.includes(this.filters.ref);

      // Name Filter - Case insensitive search
      const searchName = this.filters.name.toLowerCase();
      const matchesName =
        !this.filters.name ||
        (transaction.payment_account_name &&
          transaction.payment_account_name
            .toLowerCase()
            .includes(searchName)) ||
        (transaction.recipient_account_name &&
          transaction.recipient_account_name
            .toLowerCase()
            .includes(searchName));

      return matchesDateRange && matchesPhone && matchesName && matchesRef;
    });

    // Reset pagination to first page and update display
    this.currentPage = 1;
    this.updatePagination();

    // Update pagination info to show filtered results count
    this.startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.endIndex = Math.min(
      this.startIndex + this.itemsPerPage,
      this.filteredTransactions.length
    );
  }

  updateTransaction(): void {
    if (this.statusForm.valid && this.selectedTransactionId) {
      this.isLoading = true;
      this.error = null;

      const updateData: TransactionUpdateRequest = {
        id: this.selectedTransactionId,
        data: {
          status: this.statusForm.get('status')?.value,
        },
      };

      this.http
        .put<TransactionUpdateResponse>(
          `${API}/transactions/update`,
          updateData
        )
        .pipe(
          take(1),
          catchError((error) => {
            console.error('Error response:', error);
            this.error =
              error.error?.message || 'Failed to update transaction status';
            return of(null);
          }),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((response) => {
          if (response?.success) {
            // Refresh the transaction list
            this.getTransactions();
            this.closeStatusModal();
          } else if (response) {
            this.error = response.message || 'Failed to update status';
          }
        });
    }
  }

  openStatusModal(transactionId: string): void {
    this.selectedTransactionId = transactionId;
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.selectedTransactionId = null;
    this.statusForm.reset();
  }

  clearFilters(): void {
    this.filters = {
      startDate: '',
      endDate: '',
      phone: '',
      name: '',
      ref: ''
    };
    this.filteredTransactions = [...this.transactions];
    this.currentPage = 1;
    this.updatePagination();
  }

  getTransactions(): void {
    this.isLoading = true;
    this.error = null;

    this.http
      .get<any>(`${API}/transactions/get/customer/${this.merchantId}`)
      .pipe(
        take(1),
        catchError((error) => {
          console.log('Error:', error);
          if (error.error && error.error.message) {
            this.error = error.error.message;
          } else {
            this.error = 'Failed to fetch transactions';
          }
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((response) => {
        if (response?.success) {
          this.transactions = response.data;
          this.filteredTransactions = [...this.transactions];
          this.updatePagination();
        }
      });
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(
      this.filteredTransactions.length / this.itemsPerPage
    );
    this.pageNumbers = this.getPageNumbers();
    this.startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.endIndex = Math.min(
      this.startIndex + this.itemsPerPage,
      this.filteredTransactions.length
    );
    this.paginatedTransactions = this.filteredTransactions.slice(
      this.startIndex,
      this.endIndex
    );
  }

  openReverseModal(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.showReverseModal = true;
  }

  closeReverseModal(): void {
    this.showReverseModal = false;
    this.selectedTransaction = null;
  }

  reverseTransaction(): void {
    if (!this.selectedTransaction) return;

    this.isLoading = true;
    const reverseData: ReverseRequest = {
      transactionRef: this.selectedTransaction.transactionRef,
      amount: this.selectedTransaction.amount,
      description: 'Reversal transaction',
    };

    this.http
      .put<ReverseResponse>(`${API}/transactions/reverse`, reverseData)
      .pipe(
        take(1),
        catchError((error) => {
          console.log('Error:', error);
          if (error.error && error.error.message) {
            this.error = error.error.message;
          } else {
            this.error = 'Failed to reverse transaction';
          }
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((response) => {
        if (response?.success) {
          this.closeReverseModal();
          // Refresh transactions list
          this.getTransactions();
        }
      });
  }

  // updatePagination(): void {
  //   this.totalPages = Math.ceil(this.transactions.length / this.itemsPerPage);
  //   this.pageNumbers = this.getPageNumbers();
  //   this.startIndex = (this.currentPage - 1) * this.itemsPerPage;
  //   this.endIndex = Math.min(
  //     this.startIndex + this.itemsPerPage,
  //     this.transactions.length
  //   );
  //   this.paginatedTransactions = this.transactions.slice(
  //     this.startIndex,
  //     this.endIndex
  //   );
  // }

  getPageNumbers(): number[] {
    const pageNumbers: number[] = [];
    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(this.totalPages, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  goBack(): void {
    window.history.back();
  }
}
