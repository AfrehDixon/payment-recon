import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngxs/store';
import { AuthState } from '../../state/apps/app.states';
import * as XLSX from 'xlsx';
import { TransactionModalComponent } from '../../components/transactoin.modal';
import { ApiTransaction } from '../../types';
import { ErrorStateMatcher } from '@angular/material/core';

interface SearchFilters {
  phone: string;
  transactionRef: string;
  customerName: string;
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  status: string;
  merchantId: string;
  operator: string;
  transaction_type: string;
  page: number;
  limit: number;
}

enum EOperator {
  DORON = 'DORON',
  PEOPLESPAY = 'PEOPLESPAY',
  FIDELITY = 'FIDELITY',
  SOLANA = 'SOLANA',
  GTCARD = 'GTCARD',
  MOOLRE = 'MOOLRE',
  PCARD = 'PCARD',
  TRC20 = 'TRC20',
  ERC20 = 'ERC20',
  GTB = 'GTB',
  FAB = 'FAB',
  BTC = 'BTC',
  GIP = 'GIP',
  WIGAL = 'WIGAL',
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
  recipient_account_name: string;
  recipient_account_number: string;
  recipient_account_issuer: string;
  recipient_account_type: string;
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
  merchantId: any;
  customerId: any;
  walletType?: string;
  balanceBeforeCredit?: number;
  balanceAfterCredit?: number;
  balanceBeforeDebit?: number;
  balanceAfterDebit?: number;
  operator?: string;
  creditOperator?: string;
  externalTransactionId: string;
  profitEarned: number;
  callbackResponse?: {
    PartnerTransId: string;
  };
  transaction?: {
    PartnerTransId: string;
  };
  payload?: {
    account_number: string;
    account_name: string;
    externalTransactionId: string;
  };
  reason?: string;
  transactionErrors: {
    message: string;
  };
}

// Updated interface to handle both old and new API response formats
interface ReportResponse {
  success: boolean;
  message: string;
  data: {
    // Old format
    _id?: null;
    count?: number;
    actualAmount?: number;
    amount?: number;
    charges?: number;
    transactions: Transaction[];

    // New format
    pagination?: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
    totals?: {
      _id: null;
      totalActualAmount: number;
      totalAmount: number;
      totalCharges: number;
    };
  };
}

interface AnalyticsStats {
  totalCount: number;
  successfulCount: number;
  failedCount: number;
  pendingCount: number;
  growthRate: number;
  totalAmount: number;
  netAmount: number;
  charges: number;
}

const paymentIssuerImages: { [key: string]: string } = {
  mtn: 'assets/images/mtn.png',
  vodafone: 'assets/images/vodafone.jpg',
  airteltigo: 'assets/images/download.png',
  btc: 'assets/images/bitcoin.svg',
  usdt: 'assets/images/usdt.svg',
  doron: 'assets/images/doron.png',
};

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, TransactionModalComponent],
  template: `
    <div class="p-6 max-w-7xl mx-auto; reports-container">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Transaction Reports</h1>
        <p class="text-gray-600 mt-1">
          Track and analyze your financial activity
        </p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          class="bg-white rounded-2xl p-6 border-sm hover:border-md transition-border border border-gray-100"
        >
          <p class="text-blue-600 mb-2 text-sm font-medium">
            Total Transactions
          </p>
          <p class="text-2xl font-bold text-gray-900">
            {{ reportStats.count }}
          </p>
          <div
            class="mt-2 text-sm"
            [ngClass]="{
              'text-green-600': analytics.growthRate > 0,
              'text-red-600': analytics.growthRate < 0
            }"
          >
            <span>{{ analytics.growthRate }}% vs last month</span>
          </div>
        </div>

        <div
          class="bg-white rounded-2xl p-6 border-sm hover:border-md transition-border border border-gray-100"
        >
          <p class="text-green-600 mb-2 text-sm font-medium">Total Amount</p>
          <p class="text-2xl font-bold text-gray-900">
            {{ formatCurrency(reportStats.amount, 'FIAT') }}
          </p>
          <div
            class="mt-2 text-green-600 text-sm"
            *ngIf="reportStats.count > 0"
          >
            <span
              >{{
                reportStats.amount / reportStats.count | currency : 'GHS'
              }}
              avg/tx</span
            >
          </div>
        </div>

        <div
          class="bg-white rounded-2xl p-6 border-sm hover:border-md transition-border border border-gray-100"
        >
          <p class="text-indigo-600 mb-2 text-sm font-medium">Net Amount</p>
          <p class="text-2xl font-bold text-gray-900">
            {{ formatCurrency(reportStats.actualAmount, 'FIAT') }}
          </p>
          <div
            class="mt-2 text-indigo-600 text-sm"
            *ngIf="reportStats.amount > 0"
          >
            <span
              >{{
                ((reportStats.actualAmount / reportStats.amount) * 100).toFixed(
                  1
                )
              }}% of total</span
            >
          </div>
        </div>

        <div
          class="bg-white rounded-2xl p-6 border-sm hover:border-md transition-border border border-gray-100"
        >
          <p class="text-red-600 mb-2 text-sm font-medium">Total Charges</p>
          <p class="text-2xl font-bold text-gray-900">
            {{ formatCurrency(reportStats.charges, 'FIAT') }}
          </p>
          <div class="mt-2 text-red-600 text-sm" *ngIf="reportStats.amount > 0">
            <span
              >{{
                ((reportStats.charges / reportStats.amount) * 100).toFixed(1)
              }}% fee rate</span
            >
          </div>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="bg-white rounded-2xl border-sm border border-gray-100 mb-8">
        <div class="p-6 border-b border-gray-100">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <!-- Phone Search -->
            <div class="relative">
              <i
                class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                >phone</i
              >
              <input
                [(ngModel)]="searchFilters.phone"
                (ngModelChange)="onFilterChange()"
                type="text"
                placeholder="Search by phone number"
                class="pl-10 w-full h-12 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <!-- Transaction Reference -->
            <div class="relative">
              <i
                class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                >receipt</i
              >
              <input
                [(ngModel)]="searchFilters.transactionRef"
                (ngModelChange)="onFilterChange()"
                type="text"
                placeholder="Search by transaction reference"
                class="pl-10 w-full h-12 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <!-- Customer Name -->
            <div class="relative">
              <i
                class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                >person</i
              >
              <input
                [(ngModel)]="searchFilters.customerName"
                (ngModelChange)="onFilterChange()"
                type="text"
                placeholder="Search by customer name"
                class="pl-10 w-full h-12 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <!-- Advanced Filters -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="bg-gray-50 p-4 rounded-xl">
              <label class="block text-sm font-medium text-gray-900 mb-3"
                >Date Range</label
              >
              <div class="grid grid-cols-2 gap-4">
                <div class="relative">
                  <i
                    class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >calendar_today</i
                  >
                  <input
                    type="date"
                    [(ngModel)]="filters.startDate"
                    [max]="filters.endDate"
                    class="pl-10 w-full h-12 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div class="relative">
                  <i
                    class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >calendar_today</i
                  >
                  <input
                    type="date"
                    [(ngModel)]="filters.endDate"
                    [min]="filters.startDate"
                    class="pl-10 w-full h-12 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            </div>

            <div class="bg-gray-50 p-4 rounded-xl">
              <label class="block text-sm font-medium text-gray-900 mb-3"
                >Transaction Filters</label
              >
              <div class="grid grid-cols-2 gap-4">
                <div class="relative">
                  <i
                    class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >flag</i
                  >
                  <select
                    [(ngModel)]="filters.status"
                    (ngModelChange)="onFilterChange()"
                    class="pl-10 w-full h-12 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 appearance-none"
                  >
                    <option value="">All Status</option>
                    <option value="PAID">Paid</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
                <div class="relative">
                  <i
                    class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >sync_alt</i
                  >
                  <select
                    [(ngModel)]="filters.transaction_type"
                    (ngModelChange)="onFilterChange()"
                    class="pl-10 w-full h-12 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 appearance-none"
                  >
                    <option value="">All Types</option>
                    <option value="DEBIT">Debit</option>
                    <option value="CREDIT">Credit</option>
                    <option value="REVERSAL">Reversal</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Merchant Select -->
            <div class="bg-gray-50 p-4 rounded-xl">
              <label class="block text-sm font-medium text-gray-900 mb-3"
                >Merchant</label
              >
              <div class="relative">
                <i
                  class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >store</i
                >
                <select
                  [(ngModel)]="filters.merchantId"
                  (ngModelChange)="onFilterChange()"
                  class="pl-10 w-full h-12 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 appearance-none"
                >
                  <option value="">All Merchants</option>
                  <option
                    *ngFor="let merchant of merchants"
                    [value]="merchant._id"
                  >
                    {{ merchant.merchant_tradeName || merchant.email }}
                  </option>
                </select>
              </div>
            </div>

            <div class="bg-gray-50 p-4 rounded-xl">
              <label class="block text-sm font-medium text-gray-900 mb-3"
                >Operator</label
              >
              <div class="relative">
                <i
                  class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >settings</i
                >
                <select
                  [(ngModel)]="filters.operator"
                  (ngModelChange)="onFilterChange()"
                  class="pl-10 w-full h-12 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 appearance-none"
                >
                  <option value="">All Operators</option>
                  <option *ngFor="let operator of operators" [value]="operator">
                    {{ operator }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end gap-4">
            <button
              (click)="generateReport()"
              [disabled]="loading"
              class="inline-flex items-center px-6 h-12 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i class="material-icons mr-2">assessment</i>
              Generate Report
            </button>

            <button
              (click)="downloadReport()"
              [disabled]="displayedTransactions.length === 0"
              class="inline-flex items-center px-6 h-12 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i class="material-icons mr-2">download</i>
              Download Excel
            </button>
          </div>
        </div>

        <!-- Results Table -->
        <div class="overflow-x-auto" *ngIf="displayedTransactions.length > 0">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th
                  *ngFor="
                    let header of [
                      'Date',
                      'Merchant',
                      'Customer',
                      'Amount',
                      'Charges',
                      'Net Amount',
                      'Type',
                      'Status',
                      'Operator',
                      'Account Issuer',
                      'Ext. Tx ID',
                      'Profit',
                      'Reference',
                      'Actions'
                    ]
                  "
                  class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                *ngFor="let tx of paginatedTransactions"
                class="hover:bg-gray-50"
              >
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ formatDate(tx.createdAt) }}
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ getMerchantDisplayName(tx) }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ getMerchantEmail(tx) }}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{
                      tx.transaction_type === 'DEBIT'
                        ? getSafeValue(tx.recipient_account_name)
                        : getSafeValue(tx.payment_account_name)
                    }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{
                      tx.transaction_type === 'DEBIT'
                        ? getSafeValue(tx.recipient_account_number)
                        : getSafeValue(tx.payment_account_number)
                    }}
                    <span
                      *ngIf="getAccountIssuer(tx) || getAccountType(tx)"
                      class="text-xs text-gray-400"
                    >
                      ({{ getSafeValue(getAccountIssuer(tx)) }}
                      {{ getSafeValue(getAccountType(tx)) }})
                    </span>
                    <img
                      *ngIf="getSafeImage(getAccountIssuer(tx))"
                      [src]="getSafeImage(getAccountIssuer(tx))"
                      [alt]="getAccountIssuer(tx)"
                      class="w-6 h-6 inline-block ml-2"
                    />
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ formatCurrency(tx.amount, tx.walletType || 'FIAT') }}
                </td>
                <td class="px-6 py-4 text-sm text-red-600">
                  {{ formatCurrency(tx.charges, tx.walletType || 'FIAT') }}
                </td>
                <td class="px-6 py-4 text-sm font-medium text-green-600">
                  {{ formatCurrency(tx.actualAmount, tx.walletType || 'FIAT') }}
                </td>
                <td class="px-6 py-4">
                  <span
                    [ngClass]="{
                      'px-3 py-1 text-xs font-medium rounded-full': true,
                      'bg-blue-100 text-blue-800':
                        tx.transaction_type === 'CREDIT',
                      'bg-purple-100 text-purple-800':
                        tx.transaction_type === 'DEBIT',
                      'bg-yellow-100 text-green-800':
                        tx.transaction_type === 'TRANSFER'
                    }"
                  >
                    {{ tx.transaction_type }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span
                    [ngClass]="{
                      'px-3 py-1 text-xs font-medium rounded-full': true,
                      'bg-green-100 text-green-800': [
                        'PAID',
                        'COMPLETED',
                        'CONFIRMED',
                        'DEBIT_SUCCESS',
                        'CREDIT_SUCCESS',
                        'APPROVED',
                        'CONSOLIDATED'
                      ].includes(tx.status),
                      'bg-yellow-100 text-yellow-800': [
                        'PENDING',
                        'INITIATED',
                        'QUEUED',
                        'UNCONFIRMED',
                        'PROCESSING',
                        'DEBIT_PENDING',
                        'CREDIT_PENDING',
                        'PENDING_APPROVAL',
                        'DETECTED',
                        'PARTIAL'
                      ].includes(tx.status),
                      'bg-red-100 text-red-800': [
                        'FAILED',
                        'TIMEOUT',
                        'EXPIRED',
                        'DEBIT_FAILED',
                        'CREDIT_FAILED',
                        'REJECTED'
                      ].includes(tx.status),
                      'bg-blue-100 text-blue-800': tx.status === 'OVERPAID',
                      'bg-gray-100 text-gray-800':
                        tx.status === 'TIMEOUT' || !tx.status
                    }"
                  >
                    {{ tx.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ tx.operator || tx.creditOperator || 'N/A' }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ getAccountIssuer(tx) }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ tx.externalTransactionId || 'N/A' }}
                </td>
                <td class="px-6 py-4 text-sm text-green-600">
                  {{ tx.profitEarned | currency : 'GHS' }}
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ tx.transactionRef }}
                  </div>
                  <div class="text-sm text-gray-500">{{ tx.description }}</div>
                </td>
                <td class="px-6 py-4">
                  <button
                    (click)="viewTransactionDetails(tx)"
                    class="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    <i class="material-icons text-base mr-1">visibility</i>
                  </button>
                  <button
                    (click)="viewTransactionJson(tx)"
                    class="inline-flex items-center px-3 py-1.5 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
                    title="View JSON Data"
                  >
                    <i class="material-icons text-base mr-1">code</i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          class="px-6 py-4 border-t border-gray-100"
          *ngIf="displayedTransactions.length > 0"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">
              Showing {{ startIndex + 1 }} to {{ endIndex }} of
              {{ displayedTransactions.length }} entries
            </span>
            <div class="flex items-center gap-2">
              <button
                [disabled]="currentPage === 1"
                (click)="changePage(currentPage - 1)"
                class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <i class="material-icons">chevron_left</i>
              </button>
              <div class="flex gap-1">
                <button
                  *ngFor="let page of visiblePages"
                  (click)="changePage(page)"
                  [class]="
                    page === currentPage
                      ? 'px-4 py-2 rounded-lg bg-blue-50 text-blue-600'
                      : 'px-4 py-2 rounded-lg hover:bg-gray-100'
                  "
                >
                  {{ page }}
                </button>
              </div>
              <button
                [disabled]="currentPage === totalPages"
                (click)="changePage(currentPage + 1)"
                class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <i class="material-icons">chevron_right</i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="flex justify-center items-center py-12" *ngIf="loading">
        <div
          class="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"
        ></div>
      </div>

      <!-- Error Message -->
      <div class="bg-red-50 text-red-600 p-4 rounded-xl" *ngIf="error">
        {{ error }}
      </div>

      <!-- No Results -->
      <div
        class="text-center py-12"
        *ngIf="!loading && displayedTransactions.length === 0 && !error"
      >
        <i class="material-icons text-4xl text-gray-400 mb-2">search_off</i>
        <p class="text-gray-600">
          No transactions found. Try adjusting your filters.
        </p>
      </div>
    </div>

    <!-- JSON Data Modal -->
    <div
      *ngIf="showJsonModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      (click)="closeJsonModal()"
    >
      <div
        class="bg-white rounded-2xl shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col"
        (click)="$event.stopPropagation()"
      >
        <div
          class="flex items-center justify-between p-6 border-b border-gray-200"
        >
          <div>
            <h2 class="text-xl font-semibold text-gray-900">
              Transaction JSON Data
            </h2>
            <p class="text-sm text-gray-500 mt-1">
              Reference: {{ selectedJsonData?.transactionRef }}
            </p>
          </div>
          <div class="flex gap-2">
            <button
              (click)="copyJsonToClipboard()"
              class="inline-flex items-center px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
              title="Copy JSON to Clipboard"
            >
              <i class="material-icons text-base mr-1">content_copy</i>
              Copy
            </button>
            <button
              (click)="closeJsonModal()"
              class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <i class="material-icons">close</i>
            </button>
          </div>
        </div>
        <div class="flex-1 overflow-auto p-6">
          <div class="bg-gray-50 rounded-lg p-4">
            <pre
              class="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed"
              >{{ formatJson(selectedJsonData) }}</pre
            >
          </div>
        </div>
        <div class="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            (click)="closeJsonModal()"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
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
  merchants: any[] = [];
  operators = Object.values(EOperator);

  selectedJsonData: any = null;
  showJsonModal = false;

  searchFilters: SearchFilters = {
    phone: '',
    transactionRef: '',
    customerName: '',
  };

  filters: ReportFilters = {
    startDate: '',
    endDate: '',
    status: '',
    transaction_type: '',
    limit: 100,
    merchantId: '',
    operator: '',
    page: 1,
  };

  reportStats: ReportStats = {
    count: 0,
    actualAmount: 0,
    amount: 0,
    charges: 0,
  };

  // Store all transactions and filtered separately
  allTransactions: Transaction[] = [];
  displayedTransactions: Transaction[] = [];
  loading = false;
  error = '';

  currentPage = 1;
  pageSize = 5;
  maxVisiblePages = 5;

  analytics: AnalyticsStats = {
    totalCount: 0,
    successfulCount: 0,
    failedCount: 0,
    pendingCount: 0,
    growthRate: 0,
    totalAmount: 0,
    netAmount: 0,
    charges: 0,
  };

  constructor(private http: HttpClient, private store: Store) {}

  ngOnInit() {
    this.fetchMerchants();

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    this.filters.endDate = today.toISOString().split('T')[0];
    this.filters.startDate = sevenDaysAgo.toISOString().split('T')[0];
  }

  // Separate method to apply filters
  private applyFilters(): void {
    let filtered = [...this.allTransactions];

    // Apply status filter
    if (this.filters.status) {
      filtered = filtered.filter((tx) => tx.status === this.filters.status);
    }

    // Apply operator filter
    if (this.filters.operator) {
      filtered = filtered.filter(
        (tx) =>
          tx.operator === this.filters.operator ||
          tx.creditOperator === this.filters.operator
      );
    }

    // Apply transaction type filter
    if (this.filters.transaction_type) {
      filtered = filtered.filter(
        (tx) => tx.transaction_type === this.filters.transaction_type
      );
    }

    // Apply merchant filter - handle both old and new format
    if (this.filters.merchantId) {
      filtered = filtered.filter((tx) => {
        // Handle old format (merchantId object)
        if (
          tx.merchantId &&
          typeof tx.merchantId === 'object' &&
          tx.merchantId._id
        ) {
          return tx.merchantId._id === this.filters.merchantId;
        }
        // Handle new format (customerId string)
        if (tx.customerId && typeof tx.customerId === 'string') {
          return tx.customerId === this.filters.merchantId;
        }
        // Handle customerId object
        if (
          tx.customerId &&
          typeof tx.customerId === 'object' &&
          tx.customerId._id
        ) {
          return tx.customerId._id === this.filters.merchantId;
        }
        return false;
      });
    }

    // Apply search filters
    if (this.searchFilters.phone) {
      filtered = filtered.filter(
        (tx) =>
          tx.payment_account_number?.includes(this.searchFilters.phone) ||
          tx.recipient_account_number?.includes(this.searchFilters.phone)
      );
    }

    if (this.searchFilters.transactionRef) {
      filtered = filtered.filter((tx) =>
        tx.transactionRef
          ?.toLowerCase()
          .includes(this.searchFilters.transactionRef.toLowerCase())
      );
    }

    if (this.searchFilters.customerName) {
      filtered = filtered.filter(
        (tx) =>
          tx.payment_account_name
            ?.toLowerCase()
            .includes(this.searchFilters.customerName.toLowerCase()) ||
          tx.recipient_account_name
            ?.toLowerCase()
            .includes(this.searchFilters.customerName.toLowerCase())
      );
    }

    this.displayedTransactions = filtered;
    this.updateAnalytics();
    this.currentPage = 1; // Reset to first page
  }

  private updateAnalytics(): void {
    const filtered = this.displayedTransactions;

    this.analytics = {
      totalCount: filtered.length,
      successfulCount: filtered.filter((tx) => tx.status === 'PAID').length,
      failedCount: filtered.filter((tx) => tx.status === 'FAILED').length,
      pendingCount: filtered.filter((tx) => tx.status === 'PENDING').length,
      totalAmount: filtered.reduce((sum, tx) => sum + (tx.amount || 0), 0),
      netAmount: filtered.reduce((sum, tx) => sum + (tx.actualAmount || 0), 0),
      charges: filtered.reduce((sum, tx) => sum + (tx.charges || 0), 0),
      growthRate: 0, // Calculate if needed
    };

    // Only update reportStats from filtered data if we're using client-side filtering
    // Keep API totals for stats cards when available
    if (!this.hasApiTotals) {
      this.reportStats = {
        count: this.analytics.totalCount,
        amount: this.analytics.totalAmount,
        actualAmount: this.analytics.netAmount,
        charges: this.analytics.charges,
      };
    }
  }

  private hasApiTotals = false;

  onFilterChange(): void {
    this.applyFilters();
  }

  // Pagination getters
  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(
      this.startIndex + this.pageSize,
      this.displayedTransactions.length
    );
  }

  get totalPages(): number {
    return Math.ceil(this.displayedTransactions.length / this.pageSize);
  }

  get paginatedTransactions(): Transaction[] {
    return this.displayedTransactions.slice(this.startIndex, this.endIndex);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    let start = Math.max(
      1,
      this.currentPage - Math.floor(this.maxVisiblePages / 2)
    );
    let end = Math.min(this.totalPages, start + this.maxVisiblePages - 1);

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

  async fetchMerchants() {
    try {
      const response = await this.http
        .get<any>('https://doronpay.com/api/merchants/get', {
          headers: this.getHeaders(),
        })
        .toPromise();

      if (response?.success) {
        this.merchants = response.data;
      }
    } catch (err) {
      console.error('Error fetching merchants:', err);
    }
  }

  private getHeaders(): HttpHeaders {
    const token = this.store.selectSnapshot(AuthState.token);
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  async generateReport() {
    if (!this.validateFilters()) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.allTransactions = [];
    this.displayedTransactions = [];
    this.hasApiTotals = false;

    try {
      const response = await this.http
        .post<ReportResponse>(
          'https://doronpay.com/api/transactions/reports',
          this.filters,
          { headers: this.getHeaders() }
        )
        .toPromise();

      if (response?.success && response.data) {
        this.allTransactions = response.data.transactions || [];

        // Check if it's the new API format (has pagination and totals)
        if (response.data.totals && response.data.pagination) {
          // New API format
          this.hasApiTotals = true;
          this.reportStats = {
            count: response.data.pagination.total,
            actualAmount: response.data.totals.totalActualAmount,
            amount: response.data.totals.totalAmount,
            charges: response.data.totals.totalCharges,
          };
        } else if (response.data.count !== undefined) {
          // Old API format
          this.hasApiTotals = true;
          this.reportStats = {
            count: response.data.count,
            actualAmount: response.data.actualAmount || 0,
            amount: response.data.amount || 0,
            charges: response.data.charges || 0,
          };
        }

        // Apply initial filters
        this.applyFilters();
      } else {
        this.error = response?.message || 'Failed to generate report';
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
    return true;
  }

  downloadReport() {
    if (!this.displayedTransactions.length) return;

    const worksheet = XLSX.utils.json_to_sheet(
      this.displayedTransactions.map((tx) => ({
        Date: this.formatDate(tx.createdAt),
        Merchant: this.getMerchantDisplayName(tx),
        'Merchant Email': this.getMerchantEmail(tx),
        'Customer Name': tx.payment_account_name,
        'Customer Account': tx.payment_account_number,
        'Payment Method': `${this.getAccountIssuer(tx)} ${this.getAccountType(
          tx
        )}`,
        Amount: tx.amount,
        Charges: tx.charges,
        'Net Amount': tx.actualAmount,
        Type: tx.transaction_type,
        Status: tx.status,
        Operator: tx.operator || tx.creditOperator,
        'External Transaction ID': tx.payload?.externalTransactionId,
        'Account Name': tx.payload?.account_name,
        'Account Number': tx.payload?.account_number,
        Profit: tx.profitEarned,
        Reference: tx.transactionRef,
        'Transaction Errors': tx.transactionErrors?.message,
        Reason: tx.reason,
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

  // Helper methods to handle both old and new data formats
  getMerchantDisplayName(tx: Transaction): string {
    // Handle old format with merchantId object
    if (tx.merchantId && typeof tx.merchantId === 'object') {
      return tx.merchantId.merchant_tradeName || 'Unknown';
    }

    // Handle customerId object
    if (tx.customerId && typeof tx.customerId === 'object') {
      return tx.customerId.merchant_tradeName || 'Unknown';
    }

    // Handle customerId string - lookup in merchants array
    if (tx.customerId && typeof tx.customerId === 'string') {
      const merchant = this.merchants.find((m) => m._id === tx.customerId);
      return merchant?.merchant_tradeName || 'Unknown';
    }

    return 'Unknown';
  }

  getMerchantEmail(tx: Transaction): string {
    // Handle old format with merchantId object
    if (tx.merchantId && typeof tx.merchantId === 'object') {
      return tx.merchantId.email || '';
    }

    // Handle customerId object
    if (tx.customerId && typeof tx.customerId === 'object') {
      return tx.customerId.email || '';
    }

    // Handle customerId string - lookup in merchants array
    if (tx.customerId && typeof tx.customerId === 'string') {
      const merchant = this.merchants.find((m) => m._id === tx.customerId);
      return merchant?.email || tx.customerId;
    }

    return '';
  }

  getAccountIssuer(tx: Transaction): string {
    return tx.transaction_type === 'DEBIT'
      ? tx.recipient_account_issuer
      : tx.payment_account_issuer || 'N/A';
  }

  getAccountType(tx: Transaction): string {
    return tx.transaction_type === 'DEBIT'
      ? tx.recipient_account_type
      : tx.payment_account_type || 'N/A';
  }

  getSafeValue(value: any, fallback: string = 'N/A'): string {
    return value !== null && value !== undefined ? value.toString() : fallback;
  }

  getSafeImage(issuer: string | undefined): string | null {
    if (!issuer) return null;
    const key = issuer.toLowerCase();
    return paymentIssuerImages[key] || null;
  }

  formatCurrency(
    amount: number | undefined,
    walletType: string | undefined
  ): string {
    if (amount === undefined || amount === null) return 'N/A';
    const currency = walletType === 'FIAT' ? 'GHS' : 'USD';
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: currency,
    }).format(amount);
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

  formatJson(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }

  copyJsonToClipboard(): void {
    if (this.selectedJsonData) {
      const jsonText = this.formatJson(this.selectedJsonData);
      navigator.clipboard
        .writeText(jsonText)
        .then(() => {
          console.log('JSON copied to clipboard');
        })
        .catch((err) => {
          console.error('Failed to copy JSON: ', err);
        });
    }
  }

  viewTransactionJson(transaction: any): void {
    this.selectedJsonData = transaction;
    this.showJsonModal = true;
  }

  closeJsonModal(): void {
    this.showJsonModal = false;
    this.selectedJsonData = null;
  }

  viewTransactionDetails(transaction: any) {
    this.selectedTransaction = transaction;
    this.showModal = true;
  }

  closeTransactionModal(): void {
    this.showModal = false;
    this.selectedTransaction = null;
  }
}
