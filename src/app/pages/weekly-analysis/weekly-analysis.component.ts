import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import url from '../../constants/api.constant';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../service/admin.service';

const API_URL = url;

interface Merchant {
  _id: string;
  merchant_tradeName: string;
  tierEnabled: boolean;
  tierLevel: number;
  active: boolean;
}

interface TransactionTypeStats {
  count: number;
  amount: number;
  successful: number;
  failed: number;
}

interface ChannelStats {
  count: number;
  successful: number;
  failed: number;
}

interface CurrencyStats {
  count: number;
  successful: number;
  failed: number;
  amount: number;
  _id: string;
}

interface OperatorStats {
  count: number;
  successful: number;
  failed: number;
  amount: number;
  _id: string;
}

interface PaymentMethodStats {
  count: number;
  successful: number;
  failed: number;
  amount: number;
  _id: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    _id: string;
    merchantId: string | null;
    period: string;
    periodStart: string;
    periodEnd: string;
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
    transactionTypes: {
      CREDIT: TransactionTypeStats;
      DEBIT: TransactionTypeStats;
      TRANSFER: TransactionTypeStats;
      CHECKOUT: TransactionTypeStats;
    };
    channelStats: {
      API: ChannelStats;
      CHECKOUT: ChannelStats;
    };
    currencyStats: {
      [currency: string]: CurrencyStats;
    };
    operatorStats: {
      [operator: string]: OperatorStats;
    };
    paymentMethodStats: {
      [method: string]: PaymentMethodStats;
    };
    dailyBreakdown?: {
      [date: string]: {
        totalTransactions: number;
        successfulTransactions: number;
        failedTransactions: number;
        totalAmount: number;
      }
    };
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
}

@Component({
  selector: 'app-weekly-analysis',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './weekly-analysis.component.html',
  styleUrls: ['./weekly-analysis.component.scss']
})
export class WeeklyStatisticsComponent implements OnInit {
  filterForm: FormGroup;
  merchants: Merchant[] = [];
  statistics: any = null;
  isLoading = false;
  error: string | null = null;
  success: string | null = null;
  
  transactionTypes: any = null;
  channelStats: any = null;
  currencyStats: any = null;
  operatorStats: any = null;
  paymentMethodStats: any = null;
  dailyBreakdown: any = null;
  chartData: any = { labels: [], datasets: [] };
  
  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private tierService: AdminService
  ) {
    this.filterForm = this.fb.group({
      date: [this.getCurrentWeekStartDate()],
      merchantId: ['']
    });
  }
  
  ngOnInit(): void {
    this.loadMerchants();
    this.fetchStatistics();
    
    // Listen for form changes to refresh data
    this.filterForm.valueChanges.subscribe(() => {
      this.fetchStatistics();
    });
  }
  
  getCurrentWeekStartDate(): string {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  }
  
  loadMerchants() {
    this.tierService.getMerchants()
      .subscribe({
        next: (response) => {
          this.merchants = response.data; // Assign the array of merchants
        },
        error: (error) => {
          this.error = 'Failed to load merchants.';
        }
      });
  }
  
  fetchStatistics(): void {
    this.isLoading = true;
    this.error = null;
    
    const { date, merchantId } = this.filterForm.value;
    let params: any = {};
    
    if (date) params.date = date;
    if (merchantId) params.merchantId = merchantId;
    
    this.http.get<ApiResponse>(`${API_URL}/metrics/weekly`, { params })
      .pipe(
        catchError(error => {
          this.error = error.error?.message || 'Failed to load weekly statistics. Please try again.';
          return of(null as unknown as ApiResponse);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(response => {
        if (response && response.success) {
          this.statistics = response.data;
          
          // Extract specific stat sections for easier access in template
          this.transactionTypes = this.statistics.transactionTypes;
          this.channelStats = this.statistics.channelStats;
          this.currencyStats = this.statistics.currencyStats;
          this.operatorStats = this.statistics.operatorStats;
          this.paymentMethodStats = this.statistics.paymentMethodStats;
          this.dailyBreakdown = this.statistics.dailyBreakdown;
          
          // Prepare chart data if daily breakdown exists
          if (this.dailyBreakdown) {
            this.prepareChartData();
          }
          
          console.log('Weekly Statistics loaded:', this.statistics);
        } else {
          this.error = 'Failed to load weekly statistics data';
          console.error('API Error:', response);
        }
      });
  }
  
  prepareChartData(): void {
    if (!this.dailyBreakdown) return;
    
    const dates = Object.keys(this.dailyBreakdown).sort();
    const transactions = [];
    const amounts = [];
    const successRates = [];
    
    for (const date of dates) {
      const data = this.dailyBreakdown[date];
      transactions.push(data.totalTransactions);
      amounts.push(data.totalAmount);
      
      // Calculate success rate for each day
      const successRate = data.totalTransactions > 0 
        ? (data.successfulTransactions / data.totalTransactions * 100).toFixed(1)
        : 0;
      successRates.push(successRate);
    }
    
    this.chartData = {
      labels: dates.map(date => this.formatDateShort(date)),
      datasets: [
        {
          name: 'Transactions',
          data: transactions
        },
        {
          name: 'Amount (GHS)',
          data: amounts
        },
        {
          name: 'Success Rate (%)',
          data: successRates
        }
      ]
    };
  }
  
  // Helper function to format currency
  formatCurrency(amount: number): string {
    if (amount === undefined || amount === null) return 'GHS 0.00';
    return new Intl.NumberFormat('en-GH', { 
      style: 'currency', 
      currency: 'GHS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
  
  // Helper function to format date
  formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
  
  // Helper function to format date (short version)
  formatDateShort(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric'
    });
  }
  
  // Helper function to get a merchant name by ID
  getMerchantName(id: string): string {
    const merchant = this.merchants.find(m => m._id === id);
    return merchant ? merchant.merchant_tradeName : 'All Merchants';
  }
  
  // Helper to get percentage
  getPercentage(value: number, total: number): string {
    if (!total || total === 0) return '0.0%';
    return ((value / total) * 100).toFixed(1) + '%';
  }
  
  // Helper to get object keys
  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }
  
  // Calculate average transaction amount
  getAverageTransactionAmount(): number {
    if (!this.statistics || this.statistics.totalTransactions === 0) return 0;
    return this.statistics.totalAmount / this.statistics.totalTransactions;
  }
  
  // Get the week range string (e.g., "Feb 10 - Feb 16, 2025")
  getWeekRangeString(): string {
    if (!this.statistics || !this.statistics.periodStart || !this.statistics.periodEnd) {
      return 'Current Week';
    }
    
    const startDate = new Date(this.statistics.periodStart);
    const endDate = new Date(this.statistics.periodEnd);
    
    return `${startDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
  
  // Check if value exists
  exists(value: any): boolean {
    return value !== undefined && value !== null;
  }
  
  // Get day of week from date string
  getDayOfWeek(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { weekday: 'long' });
  }
  
  // Get week number
  getWeekNumber(dateString: string): number {
    const date = new Date(dateString);
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}