// merchant-transactions.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, take, of } from 'rxjs';
import API from '../../constants/api.constant';

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

@Component({
  selector: 'app-merchant-transactions',
  standalone: true,
  imports: [CommonModule],
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

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-spinner">
        <div class="spinner"></div>
      </div>

      <!-- Error Message -->
      <div *ngIf="error" class="error-message">
        {{ error }}
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
                <button
                  class="icon-btn"
                  (click)="openReverseModal(transaction)"
                  title="Reverse Transaction"
                  [disabled]="transaction.status !== 'PAID'"
                >
                  <i class="fas fa-undo"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination Controls -->
        <div class="pagination-container">
          <div class="pagination-info">
            Showing {{ startIndex + 1 }} to {{ endIndex }} of
            {{ transactions.length }} entries
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
  paginatedTransactions: Transaction[] = [];
  isLoading = false;
  error: string | null = null;
  merchantId: string | null = null;

  showReverseModal = false;
  selectedTransaction: Transaction | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  startIndex = 0;
  endIndex = 0;
  pageNumbers: number[] = [];

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    this.merchantId = this.route.snapshot.paramMap.get('id');
    if (this.merchantId) {
      this.getTransactions();
    }
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
          this.updatePagination();
        }
      });
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

  updatePagination(): void {
    this.totalPages = Math.ceil(this.transactions.length / this.itemsPerPage);
    this.pageNumbers = this.getPageNumbers();
    this.startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.endIndex = Math.min(
      this.startIndex + this.itemsPerPage,
      this.transactions.length
    );
    this.paginatedTransactions = this.transactions.slice(
      this.startIndex,
      this.endIndex
    );
  }

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
