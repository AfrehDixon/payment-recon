// merchant-statistics.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { DatePipe, CommonModule } from '@angular/common';

interface Merchant {
  _id: string;
  merchant_tradeName?: string;
  active: boolean;
  email?: string;
  createdAt: string;
}

// Define an index signature for the transaction types
interface TransactionTypes {
  CREDIT: TransactionTypeStats;
  DEBIT: TransactionTypeStats;
  TRANSFER: TransactionTypeStats;
  CHECKOUT: TransactionTypeStats;
  [key: string]: TransactionTypeStats; // Add index signature
}

interface MerchantStatistics {
  merchantId: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  initialBalance: number;
  finalBalance: number;
  totalCollected: number;
  totalPaidOut: number;
  netBalanceChange: number;
  expectedBalance: number;
  balanceDiscrepancy: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  totalAmount: number;
  successfulAmount: number;
  failedAmount: number;
  totalCharges: number;
  totalProfit: number;
  transactionTypes: TransactionTypes; // Use the new interface here
  operatorStats: Record<string, any>;
  successRate: number;
  calculatedAt: string;
}

interface TransactionTypeStats {
  count: number;
  amount: number;
  successful: number;
  failed: number;
}

@Component({
  selector: 'app-merchant-statistics',
  templateUrl: './merchant-statistics.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DatePipe, CommonModule],
  styleUrls: ['./merchant-statistics.component.scss'],
  providers: [DatePipe],
})
export class MerchantStatisticsComponent implements OnInit {
  // Statistics data
  statistics: MerchantStatistics | null = null;
  loading = false;
  error = '';
  filterForm: FormGroup;
  
  // Define these explicitly for type safety with the template
  periodControl: FormControl;
  dateControl: FormControl;
  
  // Transaction types array for the ngFor loop
  transactionTypes = ['CREDIT', 'DEBIT', 'TRANSFER', 'CHECKOUT'];

  // Merchant data
  merchants: Merchant[] = [];
  selectedMerchantId = '';
  loadingMerchants = false;
  merchantError = '';

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private datePipe: DatePipe
  ) {
    this.periodControl = new FormControl('daily');
    this.dateControl = new FormControl(new Date());
    
    this.filterForm = this.fb.group({
      period: this.periodControl,
      date: this.dateControl,
    });
  }

  ngOnInit(): void {
    // Load merchants on component initialization
    this.loadMerchants();

    // Subscribe to form changes to reload data when filters change
    this.filterForm.valueChanges.subscribe(() => {
      if (this.selectedMerchantId) {
        this.loadStatistics();
      }
    });
  }

  loadMerchants(): void {
    this.loadingMerchants = true;
    this.merchantError = '';

    this.http.get<any>('https://doronpay.com/api/merchants/get').subscribe({
      next: (response) => {
        if (response.success) {
          this.merchants = response.data.map((merchant: any) => ({
            _id: merchant._id,
            merchant_tradeName:
              merchant.merchant_tradeName || 'Unnamed Merchant',
            active: merchant.active,
            email: merchant.email,
            createdAt: merchant.createdAt,
          }));

          // Sort by active status and then by name
          this.merchants.sort((a, b) => {
            if (a.active !== b.active) {
              return a.active ? -1 : 1; // Active merchants first
            }
            return (a.merchant_tradeName || '').localeCompare(
              b.merchant_tradeName || ''
            );
          });

          this.loadingMerchants = false;

          // Set default merchant if available
          if (this.merchants.length > 0) {
            const activeMerchant = this.merchants.find((m) => m.active);
            this.selectedMerchantId = activeMerchant
              ? activeMerchant._id
              : this.merchants[0]._id;
            this.loadStatistics();
          }
        } else {
          this.merchantError = response.message || 'Failed to load merchants';
          this.loadingMerchants = false;
        }
      },
      error: (err) => {
        this.merchantError = 'Error connecting to merchant API';
        this.loadingMerchants = false;
        console.error('Error loading merchants:', err);
      },
    });
  }

  onMerchantChange(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    if (!this.selectedMerchantId) {
      this.error = 'Please select a merchant';
      return;
    }

    this.loading = true;
    this.error = '';

    const period = this.filterForm.get('period')?.value || 'daily';
    const date = this.filterForm.get('date')?.value;
    const formattedDate = this.datePipe.transform(date, 'yyyy-MM-dd');

    const url = `https://doronpay.com/api/merchants/${this.selectedMerchantId}/statistics?period=${period}&date=${formattedDate}`;

    this.http.get<MerchantStatistics>(url).subscribe({
      next: (data) => {
        this.statistics = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load merchant statistics';
        this.loading = false;
        console.error('Error loading statistics:', err);
      },
    });
  }

  // Helper methods to format values
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(value);
  }

  formatPercentage(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  getPeriodLabel(): string {
    const period = this.filterForm.get('period')?.value;
    const date = this.filterForm.get('date')?.value;

    if (period === 'daily') {
      return this.datePipe.transform(date, 'MMMM d, yyyy') || '';
    } else if (period === 'weekly') {
      return `Week of ${this.datePipe.transform(date, 'MMMM d, yyyy')}`;
    } else {
      return this.datePipe.transform(date, 'MMMM yyyy') || '';
    }
  }

  getMerchantName(id: string): string {
    const merchant = this.merchants.find((m) => m._id === id);
    return merchant
      ? merchant.merchant_tradeName || 'Unnamed Merchant'
      : 'Unknown Merchant';
  }
}