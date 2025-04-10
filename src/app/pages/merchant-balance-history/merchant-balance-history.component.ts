// merchant-balance-history.component.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { DatePipe, CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

interface Merchant {
  _id: string;
  merchant_tradeName?: string;
  active: boolean;
  email?: string;
  createdAt: string;
}

interface BalanceMovement {
  timestamp: string;
  balanceBefore: number;
  balanceAfter: number;
  amount: number;
  type: string;
  reference?: string;
  description?: string;
  runningBalance: number;
  transactionRef?: string;
  status: string;
}

interface MerchantBalanceHistory {
  merchantId: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  initialBalance: number;
  finalBalance: number;
  expectedFinalBalance: number;
  balanceDiscrepancy: number;
  totalCollected: number;
  totalPaidOut: number;
  netBalanceChange: number;
  movements: BalanceMovement[];
  calculatedAt: string;
}

@Component({
  selector: 'app-merchant-balance-history',
  templateUrl: './merchant-balance-history.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DatePipe, CommonModule],
  styleUrls: ['./merchant-balance-history.component.scss'],
  providers: [DatePipe],
})
export class MerchantBalanceHistoryComponent implements OnInit, AfterViewInit {
  // Chart reference
  @ViewChild('balanceChart') balanceChartCanvas: ElementRef<HTMLCanvasElement> | null = null;
  balanceChart: Chart | null = null;

  // Balance history data
  balanceHistory: MerchantBalanceHistory | null = null;
  loading = false;
  error = '';
  filterForm: FormGroup;
  
  // Form controls
  periodControl: FormControl;
  dateControl: FormControl;
  
  // Merchant data
  merchants: Merchant[] = [];
  selectedMerchantId = '';
  loadingMerchants = false;
  merchantError = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50, 100];

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
        this.loadBalanceHistory();
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.balanceHistory) {
      this.renderBalanceChart();
    }
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
            this.loadBalanceHistory();
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
    this.loadBalanceHistory();
    this.resetPagination();
  }

  loadBalanceHistory(): void {
    if (!this.selectedMerchantId) {
      this.error = 'Please select a merchant';
      return;
    }

    this.loading = true;
    this.error = '';

    const period = this.filterForm.get('period')?.value || 'daily';
    const date = this.filterForm.get('date')?.value;
    const formattedDate = this.datePipe.transform(date, 'yyyy-MM-dd');

    const url = `https://doronpay.com/api/merchants/${this.selectedMerchantId}/balance-history?period=${period}&date=${formattedDate}`;

    this.http.get<MerchantBalanceHistory>(url).subscribe({
      next: (data) => {
        this.balanceHistory = data;
        this.loading = false;
        this.resetPagination();
        
        // Render chart after data is loaded
        setTimeout(() => this.renderBalanceChart(), 0);
      },
      error: (err) => {
        this.error = 'Failed to load balance history';
        this.loading = false;
        console.error('Error loading balance history:', err);
      },
    });
  }

  resetPagination(): void {
    this.currentPage = 1;
  }

  get totalPages(): number {
    if (!this.balanceHistory) return 0;
    return Math.ceil(this.balanceHistory.movements.length / this.pageSize);
  }

  get paginatedMovements(): BalanceMovement[] {
    if (!this.balanceHistory) return [];
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.balanceHistory.movements.length);
    
    return this.balanceHistory.movements.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize = parseInt(target.value, 10);
    this.resetPagination();
  }

  renderBalanceChart(): void {
    if (!this.balanceHistory || !this.balanceChartCanvas) return;
    
    // Destroy existing chart if any
    if (this.balanceChart) {
      this.balanceChart.destroy();
    }
    
    const ctx = this.balanceChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Prepare data for chart
    let labels: string[] = [];
    let balanceData: number[] = [];
    
    if (this.balanceHistory.movements.length === 0) {
      // If no movements, just show initial and final balance
      labels = ['Initial', 'Final'];
      balanceData = [this.balanceHistory.initialBalance, this.balanceHistory.finalBalance];
    } else {
      // Sort movements by timestamp
      const sortedMovements = [...this.balanceHistory.movements].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      // Start with initial balance
      labels.push('Initial');
      balanceData.push(this.balanceHistory.initialBalance);
      
      // Add each movement
      sortedMovements.forEach(movement => {
        const date = new Date(movement.timestamp);
        const label = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        labels.push(label);
        balanceData.push(movement.balanceAfter);
      });
    }
    
    // Create chart
    this.balanceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Balance',
          data: balanceData,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          tension: 0.1,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `Balance: ${this.formatCurrency(context.parsed.y)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: (value) => {
                return this.formatCurrency(value as number);
              }
            }
          }
        }
      }
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

getPageNumber(index: number): number {
  if (this.totalPages <= 5) {
    // If we have 5 or fewer pages, just return the index + 1
    return index + 1;
  }
  
  if (this.currentPage <= 3) {
    // If we're near the start, show pages 1-5
    return index + 1;
  }
  
  if (this.currentPage >= this.totalPages - 2) {
    // If we're near the end, show the last 5 pages
    return this.totalPages - 4 + index;
  }
  
  // Otherwise, show current page in the middle
  return this.currentPage - 2 + index;
}

shouldShowPageButton(pageNumber: number): boolean {
  // For smaller page counts, show all pages
  if (this.totalPages <= 5) {
    return true;
  }
  
  // Always show the first page
  if (pageNumber === 1) {
    return true;
  }
  
  // Always show the last page
  if (pageNumber === this.totalPages) {
    return true;
  }
  
  // For larger page counts, implement a window approach
  if (this.currentPage <= 3) {
    // Near the start, show pages 1-5
    return pageNumber <= 5;
  }
  
  if (this.currentPage >= this.totalPages - 2) {
    // Near the end, show the last 5 pages
    return pageNumber >= this.totalPages - 4;
  }
  
  // Otherwise, show a window of 5 pages around the current page
  return pageNumber >= this.currentPage - 2 && pageNumber <= this.currentPage + 2;
}

// Ensure Math is available in the template
get Math(): any {
  return Math;
}
}