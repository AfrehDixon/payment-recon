import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import url from '../../constants/api.constant';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../service/admin.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const API_URL = url;

interface Merchant {
  _id: string;
  merchant_tradeName: string;
  tierEnabled: boolean;
  tierLevel: number;
  active: boolean;
}

interface ComparativePeriod {
  period: string;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  totalAmount: number;
  successfulAmount: number;
  failedAmount: number;
  successRate: number;
  totalCharges: number;
  totalProfit: number;
}

interface ApiResponse {
  success: boolean;
  data: ComparativePeriod[];
}

@Component({
  selector: 'app-comparative-analysis',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './comparative-analysis.component.html',
  styleUrls: ['./comparative-analysis.component.scss'],
})
export class ComparativeStatisticsComponent implements OnInit {
  filterForm: FormGroup;
  merchants: Merchant[] = [];
  comparativeData: any = null;
  periods: ComparativePeriod[] = [];
  metrics: any = null;
  isLoading = false;
  error: string | null = null;

  // Charts data
  transactionsChartData: any = null;
  volumeChartData: any = null;
  successRateChartData: any = null;
  profitChartData: any = null;

  maxTransactions: number = 0;
  maxAmount: number = 0;
  maxProfit: number = 0;
  maxCharges: number = 0;

  // Selected period for detailed view
  selectedPeriodIndex: number = -1;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private tierService: AdminService
  ) {
    this.filterForm = this.fb.group({
      period: ['weekly'],
      count: [6],
      merchantId: [''],
    });
  }

  ngOnInit(): void {
    this.loadMerchants();
    this.fetchComparativeData();

    // Listen for form changes to refresh data
    this.filterForm.valueChanges.subscribe(() => {
      this.fetchComparativeData();
    });
  }

  loadMerchants() {
    this.tierService.getMerchants().subscribe({
      next: (response) => {
        this.merchants = response.data; // Assign the array of merchants
      },
      error: (error) => {
        this.error = 'Failed to load merchants.';
      },
    });
  }

  calculateMaxValues(): void {
    if (!this.periods || this.periods.length === 0) return;

    this.maxTransactions = Math.max(
      ...this.periods.map((p) => p.totalTransactions)
    );
    this.maxAmount = Math.max(...this.periods.map((p) => p.totalAmount));
    this.maxProfit = Math.max(...this.periods.map((p) => p.totalProfit));
    this.maxCharges = Math.max(...this.periods.map((p) => p.totalCharges));
  }

  // Master bar style function
  getBarHeight(value: number, maxValue: number): string {
    if (maxValue <= 0) return '5%'; // Minimum height for visibility
    const percentage = (value / maxValue) * 100;
    return `${Math.max(5, percentage)}%`;
  }

  // Transaction bar styles
  getTransactionBarStyles(value: number, index: number, totalItems: number): { [key: string]: string } {
    const maxValue = this.maxTransactions > 0 ? this.maxTransactions : 1;
    return {
      height: `${Math.max(5, (value / maxValue) * 100)}%`,
      width: `calc(${100 / totalItems}% - 4px)`
    };
  }

  // Amount bar styles
  getAmountBarStyles(value: number, index: number, totalItems: number): { [key: string]: string } {
    const maxValue = this.maxAmount > 0 ? this.maxAmount : 1;
    return {
      height: `${Math.max(5, (value / maxValue) * 100)}%`,
      width: `calc(${100 / totalItems}% - 4px)`
    };
  }

  // Profit bar styles
  getProfitBarStyles(value: number, index: number, totalItems: number): { [key: string]: string } {
    const maxValue = this.maxProfit > 0 ? this.maxProfit : 1;
    return {
      height: `${Math.max(5, (value / maxValue) * 100)}%`,
      width: `calc(${100 / totalItems}% - 4px)`
    };
  }

  // Charges bar styles
  getChargesBarStyles(value: number, index: number, totalItems: number): { [key: string]: string } {
    const maxValue = this.maxCharges > 0 ? this.maxCharges : 1;
    return {
      height: `${Math.max(5, (value / maxValue) * 100)}%`,
      width: `calc(${100 / totalItems}% - 4px)`
    };
  }

  fetchComparativeData(): void {
    this.isLoading = true;
    this.error = null;
    this.selectedPeriodIndex = -1;

    const { period, count, merchantId } = this.filterForm.value;
    let params: any = { period, count };

    if (merchantId) params.merchantId = merchantId;

    this.http.get<ApiResponse>(`${API_URL}/metrics/comparative`, { params })
      .pipe(
        catchError(error => {
          this.error = error.error?.message || 'Failed to load comparative statistics. Please try again.';
          return of(null as unknown as ApiResponse);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(response => {
        if (response && response.success) {
          // Process data to ensure format consistency
          this.periods = response.data.map(period => ({
            ...period,
            // Format percentage values to 1 decimal place
            successRate: parseFloat(period.successRate.toFixed(1))
          }));
          
          this.calculateMaxValues();
          this.prepareChartData();
          console.log('Comparative Statistics loaded:', this.periods);
        } else {
          this.error = 'Failed to load comparative statistics data';
          console.error('API Error:', response);
        }
      });
  }

  prepareChartData(): void {
    if (!this.periods || this.periods.length === 0) return;

    // Labels for all charts (period names)
    const labels = this.periods.map((period) =>
      this.formatPeriodLabel(period.period)
    );

    // Transactions chart data
    this.transactionsChartData = {
      labels,
      datasets: [
        {
          name: 'Total',
          data: this.periods.map((period) => period.totalTransactions),
        },
        {
          name: 'Successful',
          data: this.periods.map((period) => period.successfulTransactions),
        },
        {
          name: 'Failed',
          data: this.periods.map((period) => period.failedTransactions),
        },
      ],
    };

    // Volume chart data
    this.volumeChartData = {
      labels,
      datasets: [
        {
          name: 'Total Volume',
          data: this.periods.map((period) => period.totalAmount),
        },
        {
          name: 'Successful Volume',
          data: this.periods.map((period) => period.successfulAmount),
        },
      ],
    };

    // Success Rate chart data
    this.successRateChartData = {
      labels,
      datasets: [
        {
          name: 'Success Rate (%)',
          data: this.periods.map((period) => period.successRate),
        },
      ],
    };

    // Profit chart data
    this.profitChartData = {
      labels,
      datasets: [
        {
          name: 'Total Charges',
          data: this.periods.map((period) => period.totalCharges),
        },
        {
          name: 'Total Profit',
          data: this.periods.map((period) => period.totalProfit),
        },
      ],
    };
  }

  // Helper to format period label based on period type
  formatPeriodLabel(periodStr: string): string {
    const period = this.filterForm.value.period;

    try {
      const date = new Date(periodStr);

      switch (period) {
        case 'daily':
          return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
          });
        case 'weekly':
          return `Week of ${date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
          })}`;
        case 'monthly':
          return date.toLocaleDateString('en-GB', {
            month: 'long',
            year: 'numeric',
          });
        default:
          return periodStr;
      }
    } catch {
      return periodStr;
    }
  }

  // Helper function to format currency
  formatCurrency(amount: number): string {
    if (amount === undefined || amount === null) return 'GHS 0.00';
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  // Helper function to format date
  formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  // Helper function to get a merchant name by ID
  getMerchantName(id: string): string {
    const merchant = this.merchants.find((m) => m._id === id);
    return merchant ? merchant.merchant_tradeName : 'All Merchants';
  }

  // Helper to get percentage
  getPercentage(value: number, total: number): string {
    if (!total || total === 0) return '0.0%';
    return ((value / total) * 100).toFixed(1) + '%';
  }

  // Helper to format percentage change
  formatPercentageChange(current: number, previous: number): string {
    if (previous === 0) return current > 0 ? '+∞%' : '0%';

    const change = ((current - previous) / previous) * 100;
    return (change > 0 ? '+' : '') + change.toFixed(1) + '%';
  }

  // Format percentage to 1 decimal place
  formatPercentage(value: number): string {
    return value.toFixed(1) + '%';
  }

  // Get trend indicator class
  getTrendClass(current: number, previous: number): string {
    if (current === previous) return 'text-gray-500';
    return current > previous ? 'text-green-500' : 'text-red-500';
  }

  // Get trend icon
  getTrendIcon(current: number, previous: number): string {
    if (current === previous) return 'fas fa-minus';
    return current > previous ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
  }

  // Helper to get relative change between periods
  getPercentChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  // Set selected period for detailed view
  selectPeriod(index: number): void {
    this.selectedPeriodIndex = index;
  }

  // Get period based on selected filter
  getPeriodLabel(): string {
    switch (this.filterForm.value.period) {
      case 'daily':
        return 'Days';
      case 'weekly':
        return 'Weeks';
      case 'monthly':
        return 'Months';
      default:
        return 'Periods';
    }
  }

  // Get the highest value from an array of numbers
  getMaxValue(arr: number[]): number {
    return Math.max(...arr);
  }
}