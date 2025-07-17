import { CommonModule } from '@angular/common';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
} from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngxs/store';
import { AuthState } from '../../state/apps/app.states';

interface Settlement {
  _id: string;
  merchantId: [] | any;
  count: number;
  amountWithCharges: number;
  totalAmountWithoutCharges: number;
  totalCharges: number;
  amount: number;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  merchant?: {
    _id: string;
    merchant_tradeName: string;
  };
}

interface Merchant {
  _id: string;
  merchant_tradeName: string;
  email: string;
  phone: string;
  active: boolean;
}

@Component({
  selector: 'app-settlements',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen p-6" style="margin-left: 200px;">
      <div class="max-w-7xl mx-auto space-y-6">
        <!-- Header -->
        <div class="bg-white rounded-lg p-6 shadow-sm">
          <h1 class="text-2xl font-bold text-gray-900">Settlements Overview</h1>
          <p class="text-gray-500">Track and manage your settlements</p>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-lg p-6 shadow-sm">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Filters</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Date Range Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input 
                type="date" 
                [(ngModel)]="filterStartDate" 
                class="block w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input 
                type="date" 
                [(ngModel)]="filterEndDate" 
                class="block w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <!-- Merchant Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Merchant</label>
              <div class="relative">
                <select
                  [(ngModel)]="filterMerchantId"
                  class="block w-full py-2 px-3 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="">All Merchants</option>
                  <option *ngFor="let merchant of merchants" [value]="merchant._id">
                    {{ merchant.merchant_tradeName }}
                  </option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <i class="material-icons text-gray-400">arrow_drop_down</i>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Filter Actions -->
          <div class="flex justify-end mt-4 space-x-3">
            <button 
              (click)="resetFilters()"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
            <button 
              (click)="applyFilters()"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>

        <!-- Stats Grid -->
        <!-- <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <div class="flex items-center space-x-4">
              <div class="p-3 bg-blue-100 rounded-full">
                <i class="material-icons text-blue-600">account_balance</i>
              </div>
              <div>
                <p class="text-sm text-gray-500">Total Settlements</p>
                <p class="text-xl font-semibold">{{ filteredSettlements.length }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-sm">
            <div class="flex items-center space-x-4">
              <div class="p-3 bg-green-100 rounded-full">
                <i class="material-icons text-green-600">payments</i>
              </div>
              <div>
                <p class="text-sm text-gray-500">Total Amount</p>
                <p class="text-xl font-semibold">
                  {{ formatCurrency(getTotalAmount()) }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-sm">
            <div class="flex items-center space-x-4">
              <div class="p-3 bg-red-100 rounded-full">
                <i class="material-icons text-red-600">money_off</i>
              </div>
              <div>
                <p class="text-sm text-gray-500">Total Charges</p>
                <p class="text-xl font-semibold">
                  {{ formatCurrency(getTotalCharges()) }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-sm">
            <div class="flex items-center space-x-4">
              <div class="p-3 bg-purple-100 rounded-full">
                <i class="material-icons text-purple-600">receipt_long</i>
              </div>
              <div>
                <p class="text-sm text-gray-500">Total Transactions</p>
                <p class="text-xl font-semibold">
                  {{ getTotalTransactions() }}
                </p>
              </div>
            </div>
          </div>
        </div> -->

        <!-- Loading State -->
        <div class="flex justify-center items-center h-64" *ngIf="loading">
          <div
            class="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"
          ></div>
        </div>

        <!-- Error Message -->
        <div class="p-4 text-red-600 bg-red-50 rounded-lg" *ngIf="error">
          {{ error }}
        </div>

        <!-- Action Feedback -->
        <div class="p-4 text-green-600 bg-green-50 rounded-lg" *ngIf="successMessage">
          {{ successMessage }}
        </div>

        <!-- Settlements Table -->
        <div
          class="bg-white rounded-lg shadow-sm overflow-hidden"
          *ngIf="!loading && filteredSettlements.length > 0"
        >
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date Range
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Merchant
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Transactions
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
                    class="px-12 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    class="px-12 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr
                  *ngFor="let settlement of paginatedSettlements"
                  class="hover:bg-gray-50"
                >
                  <td class="px-6 py-4">
                    <div class="flex flex-col">
                      <span class="text-sm text-gray-900">{{
                        formatDate(settlement.startDate)
                      }}</span>
                      <span class="text-sm text-gray-500">to</span>
                      <span class="text-sm text-gray-900">{{
                        formatDate(settlement.endDate)
                      }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900">
                    {{ (settlement.merchantId.merchant_tradeName) }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900">
                    {{ settlement.count }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900">
                    {{ formatCurrency(settlement.amountWithCharges) }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900">
                    {{ formatCurrency(settlement.totalCharges) }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900">
                    {{ formatCurrency(settlement.totalAmountWithoutCharges) }}
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="px-3 py-1 text-sm font-medium rounded-full"
                      [class.bg-green-100]="settlement.status === 'Completed'"
                      [class.text-green-800]="settlement.status === 'Completed'"
                      [class.bg-yellow-100]="settlement.status === 'Pending'"
                      [class.text-yellow-800]="settlement.status === 'Pending'"
                      [class.bg-red-100]="settlement.status === 'Failed'"
                      [class.text-red-800]="settlement.status === 'Failed'"
                    >
                      {{ settlement.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex space-x-2">
                      <button
                        *ngIf="settlement.status !== 'CONFIRMED'"
                        (click)="confirmSettlement(settlement._id)"
                        class="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                        [disabled]="actionInProgress"
                      >
                        <span *ngIf="!actionInProgress || settlementIdInProgress !== settlement._id">Confirm</span>
                        <span *ngIf="actionInProgress && settlementIdInProgress === settlement._id">
                          <i class="material-icons animate-spin text-xs">refresh</i>
                        </span>
                      </button>
                      <button
                        *ngIf="settlement.status === 'CONFIRMED'"
                        (click)="unconfirmSettlement(settlement._id)"
                        class="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                        [disabled]="actionInProgress"
                      >
                        <span *ngIf="!actionInProgress || settlementIdInProgress !== settlement._id">Unconfirm</span>
                        <span *ngIf="actionInProgress && settlementIdInProgress === settlement._id">
                          <i class="material-icons animate-spin text-xs">refresh</i>
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="bg-gray-50 px-6 py-3 flex items-center justify-between">
            <button
              class="px-3 py-1 rounded-md bg-white text-gray-700 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="currentPage === 1"
              (click)="changePage(currentPage - 1)"
            >
              <i class="material-icons text-sm">chevron_left</i>
            </button>

            <span class="text-sm text-gray-700">
              Page {{ currentPage }} of {{ totalPages }}
            </span>

            <button
              class="px-3 py-1 rounded-md bg-white text-gray-700 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="currentPage === totalPages"
              (click)="changePage(currentPage + 1)"
            >
              <i class="material-icons text-sm">chevron_right</i>
            </button>
          </div>
        </div>

        <!-- No Data -->
        <div
          class="flex flex-col items-center justify-center h-64 bg-white rounded-lg"
          *ngIf="!loading && filteredSettlements.length === 0"
        >
          <i class="material-icons text-4xl text-gray-400"
            >account_balance_wallet_off</i
          >
          <p class="mt-2 text-gray-500">No settlements found</p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./settlements.component.scss'],
})
export class SettlementsComponent implements OnInit {
  settlements: Settlement[] = [];
  filteredSettlements: Settlement[] = [];
  merchants: Merchant[] = [];
  loading = false;
  error = '';
  successMessage = '';
  actionInProgress = false;
  settlementIdInProgress = '';

  // Filter states
  filterStartDate: string = '';
  filterEndDate: string = '';
  filterMerchantId: string = '';

  currentPage = 1;
  pageSize = 5;

  constructor(private http: HttpClient, private store: Store) {}

  ngOnInit() {
    this.fetchSettlements();
    this.fetchMerchants();
  }

  get paginatedSettlements(): Settlement[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredSettlements.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredSettlements.length / this.pageSize);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  private getHeaders(): HttpHeaders {
    const token = this.store.selectSnapshot(AuthState.token);
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  async fetchSettlements() {
    this.loading = true;
    this.error = '';

    try {
      const response = await this.http
        .get<any>(`https://doronpay.com/api/settlements/get`, {
          headers: this.getHeaders(),
        })
        .toPromise();

      if (response?.success) {
        this.settlements = response.data;
        this.filteredSettlements = [...this.settlements];
        this.currentPage = 1; // Reset to first page when new data is loaded
      } else {
        this.error = 'Failed to load settlements';
      }
    } catch (err) {
      this.error = 'Failed to load settlements';
      console.error('Settlement fetch error:', err);
    } finally {
      this.loading = false;
    }
  }

  async fetchMerchants() {
    try {
      const response = await this.http
        .get<any>(`https://doronpay.com/api/merchants/get`, {
          headers: this.getHeaders(),
        })
        .toPromise();

      if (response?.success) {
        this.merchants = response.data.filter((merchant: Merchant) => merchant.active);
      } else {
        console.error('Failed to load merchants');
      }
    } catch (err) {
      console.error('Merchant fetch error:', err);
    }
  }

  getMerchantName(merchantId: string): string {
    const merchant = this.merchants.find(m => m._id === merchantId);
    return merchant ? merchant.merchant_tradeName : 'Unknown Merchant';
  }

  applyFilters() {
    this.filteredSettlements = this.settlements.filter(settlement => {
      let matches = true;
      
      // Filter by start date
      if (this.filterStartDate) {
        const filterStart = new Date(this.filterStartDate);
        const settlementStart = new Date(settlement.startDate);
        if (settlementStart < filterStart) {
          matches = false;
        }
      }
      
      // Filter by end date
      if (matches && this.filterEndDate) {
        const filterEnd = new Date(this.filterEndDate);
        // Set time to end of day
        filterEnd.setHours(23, 59, 59, 999);
        const settlementEnd = new Date(settlement.endDate);
        if (settlementEnd > filterEnd) {
          matches = false;
        }
      }
      
      // Filter by merchant
      if (matches && this.filterMerchantId) {
        if (settlement.merchantId._id !== this.filterMerchantId) {
          matches = false;
        }
      }
      
      return matches;
    });
    
    // Reset pagination
    this.currentPage = 1;
  }

  resetFilters() {
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.filterMerchantId = '';
    this.filteredSettlements = [...this.settlements];
    this.currentPage = 1;
  }

  async confirmSettlement(id: string) {
    this.actionInProgress = true;
    this.settlementIdInProgress = id;
    this.error = '';
    this.successMessage = '';

    try {
      const response = await this.http
        .put<any>(
          `https://doronpay.com/api/settlements/confirm`,
          { id },
          { headers: this.getHeaders() }
        )
        .toPromise();

      if (response?.success) {
        this.successMessage = 'Settlement confirmed successfully';
        await this.fetchSettlements(); // Refresh data
        this.applyFilters(); // Re-apply current filters
      } else {
        this.error = response?.message || 'Failed to confirm settlement';
      }
    } catch (err) {
      this.error = 'Failed to confirm settlement';
      console.error('Confirm settlement error:', err);
    } finally {
      this.actionInProgress = false;
      this.settlementIdInProgress = '';
      
      // Auto-clear success message after 3 seconds
      if (this.successMessage) {
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      }
    }
  }

  async unconfirmSettlement(id: string) {
    this.actionInProgress = true;
    this.settlementIdInProgress = id;
    this.error = '';
    this.successMessage = '';

    try {
      const response = await this.http
        .put<any>(
          `https://doronpay.com/api/settlements/unconfirm`,
          { id },
          { headers: this.getHeaders() }
        )
        .toPromise();

      if (response?.success) {
        this.successMessage = 'Settlement unconfirmed successfully';
        await this.fetchSettlements(); // Refresh data
        this.applyFilters(); // Re-apply current filters
      } else {
        this.error = response?.message || 'Failed to unconfirm settlement';
      }
    } catch (err) {
      this.error = 'Failed to unconfirm settlement';
      console.error('Unconfirm settlement error:', err);
    } finally {
      this.actionInProgress = false;
      this.settlementIdInProgress = '';
      
      // Auto-clear success message after 3 seconds
      if (this.successMessage) {
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      }
    }
  }

  // Stats calculation methods
  getTotalAmount(): number {
    return this.filteredSettlements.reduce(
      (sum, settlement) => sum + settlement.amountWithCharges,
      0
    );
  }

  getTotalCharges(): number {
    return this.filteredSettlements.reduce(
      (sum, settlement) => sum + settlement.totalCharges,
      0
    );
  }

  getTotalTransactions(): number {
    return this.filteredSettlements.reduce(
      (sum, settlement) => sum + settlement.count,
      0
    );
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  }
}