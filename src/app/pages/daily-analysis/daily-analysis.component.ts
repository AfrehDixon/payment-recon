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

interface TransactionStatisticsResponse {
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
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
}

@Component({
  selector: 'app-daily-analysis',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './daily-analysis.component.html',
  styleUrls: ['./daily-analysis.component.scss']
})
export class DailyStatisticsComponent implements OnInit {
  filterForm: FormGroup;
  merchants: Merchant[] = [];
  statistics: any = null;
  isLoading = false;
  error: string | null = null;
  success: string | null = null;
  
  // For easy access to specific stats sections
  transactionTypes: any = null;
  channelStats: any = null;
  currencyStats: any = null;
  operatorStats: any = null;
  paymentMethodStats: any = null;
  
  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private tierService: AdminService
  ) {
    this.filterForm = this.fb.group({
      date: [this.getTodayDate()],
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
  
  getTodayDate(): string {
    return new Date().toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  }
  
//   loadMerchants(): void {
//     this.http.get<{ merchants: Merchant[] }>(`${API_URL}/merchants/get`)
//       .pipe(
//         catchError(error => {
//           console.error('Error loading merchants:', error);
//           return of({ merchants: [] });
//         })
//       )
//       .subscribe(response => {
//         console.log('morad', response);
        
//         this.merchants = response.merchants;
//         console.log('morad', this.merchants);
        
//       });
//   }

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
    
    this.http.get<TransactionStatisticsResponse>(`${API_URL}/metrics/daily`, { params })
      .pipe(
        catchError(error => {
          this.error = error.error?.message || 'Failed to load statistics. Please try again.';
          return of(null);
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
        } else {
          this.error = 'Invalid response format from server';
        }
      });
  }
  
  // Helper function to format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount);
  }
  
  // Helper function to format date
  formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
  
  // Helper function to get a merchant name by ID
  getMerchantName(id: string): string {
    const merchant = this.merchants.find(m => m._id === id);
    return merchant ? merchant.merchant_tradeName : 'All Merchants';
  }
  
  // Helper to get percentage
  getPercentage(value: number, total: number): string {
    if (total === 0) return '0.0%';
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
}