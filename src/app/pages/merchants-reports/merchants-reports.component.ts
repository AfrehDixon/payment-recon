import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngxs/store';
import { AuthState } from '../../state/apps/app.states';
import * as XLSX from 'xlsx';
import { TransactionModalComponent } from '../../components/transactoin.modal';
import { ApiTransaction } from '../../types';

interface SearchFilters {
  phone: string;
  transactionRef: string;
  customerName: string;
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  merchantId: string;
  status: string;
  transaction_type: string;
}

interface ReportStats {
  count: number;
  actualAmount: number;
  amount: number;
  charges: number;
}

interface Transaction {
  _id: string;
  payment_account_name: string;
  payment_account_number: string;
  payment_account_issuer: string;
  payment_account_type: string;
  actualAmount: number;
  amount: number;
  charges: number;
  status: string;
  transaction_type: string;
  transactionRef: string;
  description: string;
  createdAt: string;
  merchantId: {
    merchant_tradeName: string;
    email: string;
  };
}

interface ReportResponse {
  success: boolean;
  message: string;
  data: {
    _id: null;
    count: number;
    actualAmount: number;
    amount: number;
    charges: number;
    transactions: Transaction[];
  };
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, TransactionModalComponent],
  template: `
    <div class="reports-container">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Transaction Reports</h1>
        <p class="text-gray-600">Generate and analyze transaction reports</p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          class="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total Transactions</p>
              <p class="text-2xl font-semibold text-gray-900">
                {{ reportStats.count || 0 }}
              </p>
            </div>
            <div class="p-3 bg-blue-100 rounded-lg">
              <i class="material-icons text-blue-600">receipt_long</i>
            </div>
          </div>
        </div>

        <div
          class="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total Amount</p>
              <p class="text-2xl font-semibold text-green-600">
                {{ formatCurrency(reportStats.amount || 0) }}
              </p>
            </div>
            <div class="p-3 bg-green-100 rounded-lg">
              <i class="material-icons text-green-600">payments</i>
            </div>
          </div>
        </div>

        <div
          class="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Net Amount</p>
              <p class="text-2xl font-semibold text-blue-600">
                {{ formatCurrency(reportStats.actualAmount || 0) }}
              </p>
            </div>
            <div class="p-3 bg-purple-100 rounded-lg">
              <i class="material-icons text-purple-600"
                >account_balance_wallet</i
              >
            </div>
          </div>
        </div>

        <div
          class="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total Charges</p>
              <p class="text-2xl font-semibold text-red-600">
                {{ formatCurrency(reportStats.charges || 0) }}
              </p>
            </div>
            <div class="p-3 bg-red-100 rounded-lg">
              <i class="material-icons text-red-600">payments</i>
            </div>
          </div>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="bg-white rounded-xl shadow-sm mb-8">
        <!-- Header -->
        <div class="px-6 py-2 border-b border-gray-100">
          <h3 class="text-xl font-semibold text-gray-900">Search & Filters</h3>
        </div>

        <div class="p-6">
          <!-- Quick Search Bar -->
          <div class="mb-3">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="relative">
                <div
                  class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                >
                  <i class="material-icons text-gray-400 text-xl">phone</i>
                </div>
                <input
                  type="text"
                  [(ngModel)]="searchFilters.phone"
                  placeholder="Search by phone number"
                  class="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-lg text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder-gray-400"
                />
              </div>

              <div class="relative">
                <div
                  class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                >
                  <i class="material-icons text-gray-400 text-xl">receipt</i>
                </div>
                <input
                  type="text"
                  [(ngModel)]="searchFilters.transactionRef"
                  placeholder="Search by transaction reference"
                  class="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-lg text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder-gray-400"
                />
              </div>

              <div class="relative">
                <div
                  class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                >
                  <i class="material-icons text-gray-400 text-xl">person</i>
                </div>
                <input
                  type="text"
                  [(ngModel)]="searchFilters.customerName"
                  placeholder="Search by customer name"
                  class="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-lg text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          <!-- Divider -->
          <div class="relative my-1 mb-2">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="px-4 py-1 bg-white text-base text-gray-500"
                >Advanced Filters</span
              >
            </div>
          </div>

          <!-- Advanced Filters -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Left Column -->
            <div class="space-y-1">
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-base font-semibold text-gray-900 mb-2"
                  >Date Range</label
                >
                <div class="grid grid-cols-2 gap-4">
                  <div class="relative">
                    <div
                      class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                    >
                      <i class="material-icons text-gray-400 text-xl"
                        >calendar_today</i
                      >
                    </div>
                    <input
                      type="date"
                      [(ngModel)]="filters.startDate"
                      [max]="filters.endDate"
                      class="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-lg text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>
                  <div class="relative">
                    <div
                      class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                    >
                      <i class="material-icons text-gray-400 text-xl"
                        >calendar_today</i
                      >
                    </div>
                    <input
                      type="date"
                      [(ngModel)]="filters.endDate"
                      [min]="filters.startDate"
                      class="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-lg text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column -->
            <div class="space-y-1">
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-base font-semibold text-gray-900 mb-2"
                  >Transaction Filters</label
                >
                <div class="grid grid-cols-2 gap-4">
                  <div class="relative">
                    <div
                      class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                    >
                      <i class="material-icons text-gray-400 text-xl">flag</i>
                    </div>
                    <select
                      [(ngModel)]="filters.status"
                      class="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-lg text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none"
                    >
                      <option value="">All Status</option>
                      <option value="PAID">Paid</option>
                      <option value="PENDING">Pending</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </div>
                  <div class="relative">
                    <div
                      class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                    >
                      <i class="material-icons text-gray-400 text-xl"
                        >sync_alt</i
                      >
                    </div>
                    <select
                      [(ngModel)]="filters.transaction_type"
                      class="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-lg text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none"
                    >
                      <option value="">All Types</option>
                      <option value="DEBIT">Debit</option>
                      <option value="CREDIT">Credit</option>
                      <option value="REVERSAL">Reversal</option>
                      
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div
            class="flex justify-end space-x-4 mt-1 pt-3 border-t border-gray-100"
          >
            <button
              (click)="generateReport()"
              [disabled]="loading"
              class="inline-flex items-center px-6 py-3.5 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <i class="material-icons text-xl mr-2">assessment</i>
              Generate Report
            </button>

            <button
              (click)="downloadReport()"
              [disabled]="!transactions.length"
              class="inline-flex items-center px-6 py-3.5 bg-green-600 text-white text-base font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <i class="material-icons text-xl mr-2">download</i>
              Download Excel
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-spinner" *ngIf="loading">
        <div class="spinner"></div>
      </div>

      <!-- Error Message -->
      <div class="error-message" *ngIf="error">{{ error }}</div>

      <!-- Results Table -->
      <div
        class="overflow-hidden bg-white rounded-xl shadow-sm"
        *ngIf="transactions.length > 0"
      >
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Merchant
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Customer
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Charges
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Net Amount
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Reference
                </th>
                <th
                  class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                *ngFor="let tx of paginatedTransactions"
                class="hover:bg-gray-50"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(tx.createdAt) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex flex-col">
                    <span class="text-sm font-medium text-gray-900">{{
                      tx.merchantId.merchant_tradeName
                    }}</span>
                    <span class="text-sm text-gray-500">{{
                      tx.merchantId.email
                    }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex flex-col">
                    <span class="text-sm font-medium text-gray-900">{{
                      tx.payment_account_name
                    }}</span>
                    <span class="text-sm text-gray-500">
                      {{ tx.payment_account_number }}
                      <span class="text-xs text-gray-400"
                        >({{ tx.payment_account_issuer }}
                        {{ tx.payment_account_type }})</span
                      >
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatCurrency(tx.amount) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                  {{ formatCurrency(tx.charges) }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium"
                >
                  {{ formatCurrency(tx.actualAmount) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    [ngClass]="{
                      'px-2 py-1 text-xs font-medium rounded-full': true,
                      'bg-blue-100 text-blue-800':
                        tx.transaction_type === 'CREDIT',
                      'bg-purple-100 text-purple-800':
                        tx.transaction_type === 'DEBIT'
                    }"
                  >
                    {{ tx.transaction_type }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    [ngClass]="{
                      'px-2 py-1 text-xs font-medium rounded-full': true,
                      'bg-green-100 text-green-800': tx.status === 'PAID',
                      'bg-yellow-100 text-yellow-800': tx.status === 'PENDING',
                      'bg-red-100 text-red-800': tx.status === 'FAILED'
                    }"
                  >
                    {{ tx.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex flex-col">
                    <span class="text-sm font-medium text-gray-900">{{
                      tx.transactionRef
                    }}</span>
                    <span class="text-sm text-gray-500">{{
                      tx.description
                    }}</span>
                  </div>
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                >
                  <button
                    (click)="viewTransactionDetails(tx)"
                    class="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <i class="material-icons text-base">visibility</i>
                    <span>View</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="bg-white px-6 py-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing <span class="font-medium">{{ startIndex + 1 }}</span> to
                <span class="font-medium">{{ endIndex }}</span> of
                <span class="font-medium">{{ transactions.length }}</span>
                entries
              </p>
            </div>
            <div class="flex items-center space-x-2">
              <button
                [disabled]="currentPage === 1"
                (click)="changePage(currentPage - 1)"
                class="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i class="material-icons text-lg">chevron_left</i>
              </button>

              <div class="flex space-x-1">
                <button
                  *ngFor="let page of visiblePages"
                  (click)="changePage(page)"
                  [class]="
                    page === currentPage
                      ? 'relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md bg-blue-50 text-blue-600 border-blue-500'
                      : 'relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'
                  "
                >
                  {{ page }}
                </button>
              </div>

              <button
                [disabled]="currentPage === totalPages"
                (click)="changePage(currentPage + 1)"
                class="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i class="material-icons text-lg">chevron_right</i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div class="no-data" *ngIf="!loading && !transactions.length && !error">
        <i class="material-icons">search_off</i>
        <p>No transactions found. Try adjusting your filters.</p>
      </div>
    </div>

    <app-transaction-modal
      *ngIf="showModal"
      [transaction]="selectedTransaction"
      (click)="closeTransactionModal()"
    >
    </app-transaction-modal>
  `,
  styleUrls: ['./merchants.reports.component.scss'],
})
export class ReportsComponent implements OnInit {
  selectedTransaction: ApiTransaction | null = null;
  showModal = false;
  // Add to your existing properties
  searchFilters: SearchFilters = {
    phone: '',
    transactionRef: '',
    customerName: '',
  };

  filters: ReportFilters = {
    startDate: '',
    endDate: '',
    merchantId: '',
    status: '',
    transaction_type: '',
  };

  reportStats: ReportStats = {
    count: 0,
    actualAmount: 0,
    amount: 0,
    charges: 0,
  };

  transactions: Transaction[] = [];
  loading = false;
  error = '';

  currentPage = 1;
  pageSize = 10;
  maxVisiblePages = 5;

  constructor(private http: HttpClient, private store: Store) {}

  closeTransactionModal(): void {
    this.showModal = false;
    this.selectedTransaction = null;
  }

  ngOnInit() {
    this.filters.merchantId = this.store.selectSnapshot(
      (state) => state.auth.user?.merchantId._id
    );

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    this.filters.endDate = today.toISOString().split('T')[0];
    this.filters.startDate = sevenDaysAgo.toISOString().split('T')[0];
  }

  // Modify your existing generateReport method to include search
  get filteredTransactions(): Transaction[] {
    return this.transactions.filter((tx) => {
      const phoneMatch =
        !this.searchFilters.phone ||
        tx.payment_account_number.includes(this.searchFilters.phone);

      const refMatch =
        !this.searchFilters.transactionRef ||
        tx.transactionRef
          .toLowerCase()
          .includes(this.searchFilters.transactionRef.toLowerCase());

      const nameMatch =
        !this.searchFilters.customerName ||
        tx.payment_account_name
          .toLowerCase()
          .includes(this.searchFilters.customerName.toLowerCase());

      return phoneMatch && refMatch && nameMatch;
    });
  }

  private getHeaders(): HttpHeaders {
    const token = this.store.selectSnapshot(AuthState.token);
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.transactions.length);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredTransactions.length / this.pageSize);
  }

  get paginatedTransactions(): Transaction[] {
    return this.filteredTransactions.slice(this.startIndex, this.endIndex);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    let start = Math.max(
      1,
      this.currentPage - Math.floor(this.maxVisiblePages / 2)
    );
    let end = Math.min(this.totalPages, start + this.maxVisiblePages - 1);

    // Adjust start if we're near the end
    start = Math.max(
      1,
      Math.min(start, this.totalPages - this.maxVisiblePages + 1)
    );

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  async generateReport() {
    if (!this.validateFilters()) return;

    this.loading = true;
    this.error = '';
    this.transactions = [];
    this.currentPage = 1;
    this.reportStats = {
      count: 0,
      actualAmount: 0,
      amount: 0,
      charges: 0,
    };

    try {
      const response = await this.http
        .post<ReportResponse>(
          'https://doronpay.com/api/transactions/reports',
          this.filters,
          { headers: this.getHeaders() }
        )
        .toPromise();

      if (response?.success) {
        this.transactions = response.data.transactions;
        this.reportStats = {
          count: response.data.count,
          actualAmount: response.data.actualAmount,
          amount: response.data.amount,
          charges: response.data.charges,
        };
      } else {
        if (response?.message?.includes('memory')) {
          this.error =
            'Too much data requested. Please try a shorter date range or add more filters.';
        } else {
          this.error = response?.message || 'Failed to generate report';
        }
      }
    } catch (err: any) {
      this.error =
        err?.error?.message || 'Failed to generate report. Please try again.';
      console.error('Report generation error:', err);
    } finally {
      this.loading = false;
    }
  }

  validateFilters(): boolean {
    if (!this.filters.startDate || !this.filters.endDate) {
      this.error = 'Please select both start and end dates';
      return false;
    }

    const start = new Date(this.filters.startDate);
    const end = new Date(this.filters.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Limit to 7 days to prevent memory issues
    if (diffDays > 7) {
      this.error =
        'Date range cannot exceed 7 days due to data size limitations';
      return false;
    }

    return true;
  }

  downloadReport() {
    if (!this.transactions.length) return;

    const worksheet = XLSX.utils.json_to_sheet(
      this.transactions.map((tx) => ({
        Date: this.formatDate(tx.createdAt),
        Merchant: tx.merchantId.merchant_tradeName,
        'Merchant Email': tx.merchantId.email,
        'Customer Name': tx.payment_account_name,
        'Customer Account': tx.payment_account_number,
        'Payment Method': `${tx.payment_account_issuer} ${tx.payment_account_type}`,
        Amount: tx.amount,
        Charges: tx.charges,
        'Net Amount': tx.actualAmount,
        Type: tx.transaction_type,
        Status: tx.status,
        Reference: tx.transactionRef,
        Description: tx.description,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    const fileName = `transactions_report_${this.formatDateForFile(
      new Date()
    )}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatDateForFile(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  }

  viewTransactionDetails(transaction: any) {
    // Here you can implement the logic to show the transaction details modal
    // For example:
    this.selectedTransaction = transaction;
    this.showModal = true;
  }
}
