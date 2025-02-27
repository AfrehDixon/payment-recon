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

interface DailyBreakdown {
  [date: string]: {
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    totalAmount: number;
    successRate?: number;
  }
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
    dailyBreakdown?: DailyBreakdown;
    weeklyBreakdown?: {
      [week: string]: {
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
  selector: 'app-monthly-analysis',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './monthly-analysis.component.html',
  styleUrls: ['./monthly-analysis.component.scss']
})
export class MonthlyStatisticsComponent implements OnInit {
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
  weeklyBreakdown: any = null;
  
  // For the calendar view
  calendarDays: any[] = [];
  calendarWeeks: any[] = [];
  
  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private tierService: AdminService,
  ) {
    this.filterForm = this.fb.group({
      date: [this.getCurrentMonthStartDate()],
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
  
  getCurrentMonthStartDate(): string {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
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
    
    this.http.get<ApiResponse>(`${API_URL}/metrics/monthly`, { params })
      .pipe(
        catchError(error => {
          this.error = error.error?.message || 'Failed to load monthly statistics. Please try again.';
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
          this.weeklyBreakdown = this.statistics.weeklyBreakdown;
          
          // Generate calendar view data if daily breakdown exists
          if (this.dailyBreakdown) {
            this.generateCalendarData();
          }
          
          console.log('Monthly Statistics loaded:', this.statistics);
        } else {
          this.error = 'Failed to load monthly statistics data';
          console.error('API Error:', response);
        }
      });
  }
  
  generateCalendarData(): void {
    if (!this.dailyBreakdown || !this.statistics.periodStart) return;
    
    const startDate = new Date(this.statistics.periodStart);
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    
    // Get the first day of the month
    const firstDay = new Date(year, month, 1);
    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of the week of the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Calculate padding days before the first day of the month
    const paddingDaysBefore = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Adjust for Monday as first day
    
    // Generate calendar days array
    this.calendarDays = [];
    
    // Add padding days before
    for (let i = 0; i < paddingDaysBefore; i++) {
      const paddingDate = new Date(year, month, -paddingDaysBefore + i + 1);
      this.calendarDays.push({
        date: paddingDate,
        day: paddingDate.getDate(),
        isCurrentMonth: false,
        stats: null
      });
    }
    
    // Add days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDate = new Date(year, month, i);
      const dateString = currentDate.toISOString().split('T')[0];
      
      this.calendarDays.push({
        date: currentDate,
        day: i,
        isCurrentMonth: true,
        dateString: dateString,
        stats: this.dailyBreakdown[dateString] || null
      });
    }
    
    // Calculate padding days after the last day of the month
    const totalCells = Math.ceil(this.calendarDays.length / 7) * 7;
    const paddingDaysAfter = totalCells - this.calendarDays.length;
    
    // Add padding days after
    for (let i = 1; i <= paddingDaysAfter; i++) {
      const paddingDate = new Date(year, month + 1, i);
      this.calendarDays.push({
        date: paddingDate,
        day: paddingDate.getDate(),
        isCurrentMonth: false,
        stats: null
      });
    }
    
    // Group days into weeks
    this.calendarWeeks = [];
    for (let i = 0; i < this.calendarDays.length; i += 7) {
      this.calendarWeeks.push(this.calendarDays.slice(i, i + 7));
    }
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
  
  // Sort keys (for displaying dates in order)
  getSortedKeys(obj: any): string[] {
    return obj ? Object.keys(obj).sort() : [];
  }
  
  // Get color based on value (for heatmap)
  getHeatmapColor(value: number, max: number): string {
    if (!value || !max) return 'bg-gray-100';
    
    const ratio = value / max;
    if (ratio < 0.2) return 'bg-blue-100';
    if (ratio < 0.4) return 'bg-blue-200';
    if (ratio < 0.6) return 'bg-blue-300';
    if (ratio < 0.8) return 'bg-blue-400';
    return 'bg-blue-500';
  }
  
  // Get transaction success color
  getSuccessRateColor(rate: number): string {
    if (rate === undefined || rate === null) return 'bg-gray-100';
    
    if (rate < 30) return 'bg-red-500';
    if (rate < 50) return 'bg-red-300';
    if (rate < 70) return 'bg-yellow-300';
    if (rate < 90) return 'bg-green-300';
    return 'bg-green-500';
  }
  
  // Get month name and year
  getMonthName(): string {
    if (!this.statistics || !this.statistics.periodStart) return 'Current Month';
    
    const date = new Date(this.statistics.periodStart);
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }
  
  // Calculate average transaction amount
  getAverageTransactionAmount(): number {
    if (!this.statistics || this.statistics.totalTransactions === 0) return 0;
    return this.statistics.totalAmount / this.statistics.totalTransactions;
  }
  
  // Check if value exists
  exists(value: any): boolean {
    return value !== undefined && value !== null;
  }
  
  // Get days with highest transactions
  getTopDays(limit: number = 5): any[] {
    if (!this.dailyBreakdown) return [];
    
    return Object.entries(this.dailyBreakdown)
      .map(([date, stats]: [string, any]) => ({ date, ...(typeof stats === 'object' ? stats : {}) }))
      .sort((a, b) => b.totalTransactions - a.totalTransactions)
      .slice(0, limit);
  }
  
  // Get day of week name
  getDayOfWeek(day: number): string {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[day];
  }
}