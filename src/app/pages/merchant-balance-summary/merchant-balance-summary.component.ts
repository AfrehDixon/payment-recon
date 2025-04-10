// merchant-balance-summary.component.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';

interface Merchant {
  _id: string;
  merchant_tradeName?: string;
  active: boolean;
  email?: string;
  createdAt: string;
}

interface BalanceTrendItem {
  date: string;
  collected: number;
  paidOut: number;
  netChange: number;
  endBalance: number;
}

interface MerchantBalanceSummary {
  merchantId: string;
  currentBalance: {
    confirmed: number;
    unconfirmed: number;
    total: number;
  };
  last30Days: {
    totalCollected: number;
    totalPaidOut: number;
    netChange: number;
  };
  balanceTrend: BalanceTrendItem[];
  calculatedAt: string;
}

@Component({
  selector: 'app-merchant-balance-summary',
  templateUrl: './merchant-balance-summary.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  styleUrls: ['./merchant-balance-summary.component.scss'],
  providers: [DatePipe]
})
export class MerchantBalanceSummaryComponent implements OnInit, AfterViewInit {
  // Chart references
  @ViewChild('balanceTrendChart') balanceTrendCanvas: ElementRef<HTMLCanvasElement> | null = null;
  @ViewChild('transactionChart') transactionCanvas: ElementRef<HTMLCanvasElement> | null = null;
  balanceTrendChart: Chart | null = null;
  transactionChart: Chart | null = null;

  // Balance summary data
  balanceSummary: MerchantBalanceSummary | null = null;
  loading = false;
  error = '';
  
  // Merchant data
  merchants: Merchant[] = [];
  selectedMerchantId = '';
  loadingMerchants = false;
  merchantError = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 15, 20, 30];

  constructor(
    private http: HttpClient,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    // Load merchants on component initialization
    this.loadMerchants();
  }

  ngAfterViewInit(): void {
    if (this.balanceSummary) {
      this.renderCharts();
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
            this.loadBalanceSummary();
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
    this.loadBalanceSummary();
    this.resetPagination();
  }

  loadBalanceSummary(): void {
    if (!this.selectedMerchantId) {
      this.error = 'Please select a merchant';
      return;
    }

    this.loading = true;
    this.error = '';

    const url = `https://doronpay.com/api/merchants/${this.selectedMerchantId}/balance-summary`;

    this.http.get<MerchantBalanceSummary>(url).subscribe({
      next: (data) => {
        this.balanceSummary = data;
        this.loading = false;
        
        // Render charts after data is loaded
        setTimeout(() => this.renderCharts(), 0);
      },
      error: (err) => {
        this.error = 'Failed to load balance summary';
        this.loading = false;
        console.error('Error loading balance summary:', err);
      },
    });
  }

  renderCharts(): void {
    this.renderBalanceTrendChart();
    this.renderTransactionChart();
  }

  renderBalanceTrendChart(): void {
    if (!this.balanceSummary || !this.balanceTrendCanvas) return;
    
    // Destroy existing chart if any
    if (this.balanceTrendChart) {
      this.balanceTrendChart.destroy();
    }
    
    const ctx = this.balanceTrendCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Format data for chart
    const labels = this.balanceSummary.balanceTrend.map(item => 
      this.datePipe.transform(item.date, 'MMM d') || ''
    );
    
    const balanceData = this.balanceSummary.balanceTrend.map(item => 
      item.endBalance
    );
    
    // Create chart
    this.balanceTrendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'End of Day Balance',
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
          },
          title: {
            display: true,
            text: 'Balance Trend (Last 30 Days)'
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

  renderTransactionChart(): void {
    if (!this.balanceSummary || !this.transactionCanvas) return;
    
    // Destroy existing chart if any
    if (this.transactionChart) {
      this.transactionChart.destroy();
    }
    
    const ctx = this.transactionCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Format data for chart
    const labels = this.balanceSummary.balanceTrend.map(item => 
      this.datePipe.transform(item.date, 'MMM d') || ''
    );
    
    const collectedData = this.balanceSummary.balanceTrend.map(item => item.collected);
    const paidOutData = this.balanceSummary.balanceTrend.map(item => item.paidOut);
    const netChangeData = this.balanceSummary.balanceTrend.map(item => item.netChange);
    
    // Create chart
    this.transactionChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Collected',
            data: collectedData,
            backgroundColor: 'rgba(34, 197, 94, 0.7)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 1
          },
          {
            label: 'Paid Out',
            data: paidOutData,
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 1
          },
          {
            type: 'line',
            label: 'Net Change',
            data: netChangeData,
            backgroundColor: 'rgba(59, 130, 246, 0.3)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 2,
            fill: false,
            tension: 0.1,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.dataset.label}: ${this.formatCurrency(context.parsed.y)}`;
              }
            }
          },
          title: {
            display: true,
            text: 'Transactions & Net Change (Last 30 Days)'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                return this.formatCurrency(value as number);
              }
            }
          },
          y1: {
            position: 'right',
            beginAtZero: true,
            grid: {
              drawOnChartArea: false
            },
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

  // Pagination methods
  resetPagination(): void {
    this.currentPage = 1;
  }

  get totalPages(): number {
    if (!this.balanceSummary) return 0;
    return Math.ceil(this.balanceSummary.balanceTrend.length / this.pageSize);
  }

  get paginatedBalanceTrend(): BalanceTrendItem[] {
    if (!this.balanceSummary) return [];
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.balanceSummary.balanceTrend.length);
    
    return this.balanceSummary.balanceTrend.slice(startIndex, endIndex);
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

  getMerchantName(id: string): string {
    const merchant = this.merchants.find((m) => m._id === id);
    return merchant
      ? merchant.merchant_tradeName || 'Unnamed Merchant'
      : 'Unknown Merchant';
  }
}