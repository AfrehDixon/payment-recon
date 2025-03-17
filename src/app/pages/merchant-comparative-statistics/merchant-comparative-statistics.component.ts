// merchant-comparative-statistics.component.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, FormBuilder } from '@angular/forms';
import Chart from 'chart.js/auto';

interface Merchant {
  _id: string;
  merchant_tradeName?: string;
  active: boolean;
  email?: string;
  createdAt: string;
}

interface TransactionTypeStats {
  count: number;
  amount: number;
  successful: number;
  failed: number;
}

interface OperatorStats {
  [key: string]: {
    count: number;
    successful: number;
    failed: number;
    amount: number;
  };
}

interface PeriodStatistics {
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
  transactionTypes: {
    CREDIT: TransactionTypeStats;
    DEBIT: TransactionTypeStats;
    TRANSFER: TransactionTypeStats;
    CHECKOUT: TransactionTypeStats;
    [key: string]: TransactionTypeStats;
  };
  operatorStats: OperatorStats;
  successRate: number;
  calculatedAt: string;
}

@Component({
  selector: 'app-merchant-comparative-statistics',
  templateUrl: './merchant-comparative-statistics.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePipe],
  styleUrls: ['./merchant-comparative-statistics.component.scss'],
  providers: [DatePipe]
})
export class MerchantComparativeStatisticsComponent implements OnInit, AfterViewInit {
  // Chart references
  @ViewChild('transactionVolume') volumeChartCanvas: ElementRef<HTMLCanvasElement> | null = null;
  @ViewChild('transactionSuccess') successChartCanvas: ElementRef<HTMLCanvasElement> | null = null;
  @ViewChild('revenueProfit') revenueChartCanvas: ElementRef<HTMLCanvasElement> | null = null;
  @ViewChild('paymentMethods') methodsChartCanvas: ElementRef<HTMLCanvasElement> | null = null;
  
  charts: Chart[] = [];

  // Statistics data
  statistics: PeriodStatistics[] = [];
  loading = false;
  error = '';
  filterForm: FormGroup;
  
  // Form controls
  periodControl: FormControl;
  countControl: FormControl;
  
  // Merchant data
  merchants: Merchant[] = [];
  selectedMerchantId = '';
  loadingMerchants = false;
  merchantError = '';

  // Tab control
  activeTab = 'overview';

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private datePipe: DatePipe
  ) {
    this.periodControl = new FormControl('monthly');
    this.countControl = new FormControl(3);
    
    this.filterForm = this.fb.group({
      period: this.periodControl,
      count: this.countControl,
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

  ngAfterViewInit(): void {
    if (this.statistics.length > 0) {
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

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    // Allow time for DOM to update before rendering charts
    setTimeout(() => {
      this.renderCharts();
    }, 0);
  }

  loadStatistics(): void {
    if (!this.selectedMerchantId) {
      this.error = 'Please select a merchant';
      return;
    }

    this.loading = true;
    this.error = '';

    const period = this.filterForm.get('period')?.value || 'monthly';
    const count = this.filterForm.get('count')?.value || 3;

    const url = `https://doronpay.com/api/${this.selectedMerchantId}/comparative-statistics?period=${period}&count=${count}`;

    this.http.get<PeriodStatistics[]>(url).subscribe({
      next: (data) => {
        this.statistics = data;
        this.loading = false;
        
        // Render charts after data is loaded
        setTimeout(() => this.renderCharts(), 0);
      },
      error: (err) => {
        this.error = 'Failed to load comparative statistics';
        this.loading = false;
        console.error('Error loading statistics:', err);
      },
    });
  }

  renderCharts(): void {
    // Clear existing charts
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];
    
    if (this.statistics.length === 0) return;

    // Render appropriate charts based on active tab
    switch(this.activeTab) {
      case 'overview':
        this.renderVolumeChart();
        this.renderSuccessRateChart();
        break;
      case 'revenue':
        this.renderRevenueChart();
        break;
      case 'payment-methods':
        this.renderPaymentMethodsChart();
        break;
    }
  }

  renderVolumeChart(): void {
    if (!this.volumeChartCanvas) return;
    const ctx = this.volumeChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Sort from oldest to newest
    const sortedStats = [...this.statistics].sort(
      (a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime()
    );
    
    // Prepare data
    const labels = sortedStats.map(stat => 
      this.formatPeriodLabel(stat.periodStart, stat.periodEnd)
    );
    
    const totalTransactions = sortedStats.map(stat => stat.totalTransactions);
    const successfulTransactions = sortedStats.map(stat => stat.successfulTransactions);
    const failedTransactions = sortedStats.map(stat => stat.failedTransactions);
    
    // Create chart
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Total Transactions',
            data: totalTransactions,
            backgroundColor: 'rgba(99, 102, 241, 0.7)',
            borderColor: 'rgb(99, 102, 241)',
            borderWidth: 1,
            order: 1
          },
          {
            label: 'Successful',
            data: successfulTransactions,
            backgroundColor: 'rgba(34, 197, 94, 0.7)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 1,
            order: 2
          },
          {
            label: 'Failed',
            data: failedTransactions,
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 1,
            order: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Transaction Volume by Period'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Transactions'
            }
          }
        }
      }
    });
    
    this.charts.push(chart);
  }

  renderSuccessRateChart(): void {
    if (!this.successChartCanvas) return;
    const ctx = this.successChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Sort from oldest to newest
    const sortedStats = [...this.statistics].sort(
      (a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime()
    );
    
    // Prepare data
    const labels = sortedStats.map(stat => 
      this.formatPeriodLabel(stat.periodStart, stat.periodEnd)
    );
    
    const successRates = sortedStats.map(stat => stat.successRate);
    const transactionVolumes = sortedStats.map(stat => stat.totalTransactions);
    
    // Calculate max volume for scaling bubbles
    const maxVolume = Math.max(...transactionVolumes);
    
    // Create chart
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Success Rate (%)',
            data: successRates,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Transaction Success Rate by Period'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const index = context.dataIndex;
                return [
                  `Success Rate: ${context.parsed.y.toFixed(1)}%`,
                  `Volume: ${transactionVolumes[index]} transactions`
                ];
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Success Rate (%)'
            }
          }
        }
      }
    });
    
    this.charts.push(chart);
  }

  renderRevenueChart(): void {
    if (!this.revenueChartCanvas) return;
    const ctx = this.revenueChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Sort from oldest to newest
    const sortedStats = [...this.statistics].sort(
      (a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime()
    );
    
    // Prepare data
    const labels = sortedStats.map(stat => 
      this.formatPeriodLabel(stat.periodStart, stat.periodEnd)
    );
    
    const successfulAmount = sortedStats.map(stat => stat.successfulAmount);
    const totalCharges = sortedStats.map(stat => stat.totalCharges);
    const totalProfit = sortedStats.map(stat => stat.totalProfit);
    
    // Create chart
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Processed Volume',
            data: successfulAmount,
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
            order: 1
          },
          {
            label: 'Charges',
            data: totalCharges,
            backgroundColor: 'rgba(124, 58, 237, 0.7)',
            borderColor: 'rgb(124, 58, 237)',
            borderWidth: 1,
            order: 2
          },
          {
            label: 'Profit',
            data: totalProfit,
            backgroundColor: 'rgba(34, 197, 94, 0.7)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 1,
            order: 3,
            type: 'line',
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Revenue Metrics by Period'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.dataset.label}: ${this.formatCurrency(context.parsed.y)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Amount'
            },
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
            title: {
              display: true,
              text: 'Profit'
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
    
    this.charts.push(chart);
  }

  renderPaymentMethodsChart(): void {
    if (!this.methodsChartCanvas) return;
    const ctx = this.methodsChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    if (this.statistics.length === 0) return;
    
    // Get the most recent period for payment methods analysis
    const latestPeriod = this.statistics.sort(
      (a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime()
    )[0];
    
    // Prepare data
    const operators = Object.keys(latestPeriod.operatorStats);
    const operatorAmounts = operators.map(op => latestPeriod.operatorStats[op].amount);
    const operatorSuccess = operators.map(op => 
      latestPeriod.operatorStats[op].successful / latestPeriod.operatorStats[op].count * 100 || 0
    );
    
    // Create chart
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: operators,
        datasets: [
          {
            label: 'Transaction Amount',
            data: operatorAmounts,
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
            yAxisID: 'y',
            order: 2
          },
          {
            label: 'Success Rate (%)',
            data: operatorSuccess,
            backgroundColor: 'rgba(34, 197, 94, 0.7)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 1,
            type: 'line',
            yAxisID: 'y1',
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Payment Methods Analysis (${this.formatPeriodLabel(latestPeriod.periodStart, latestPeriod.periodEnd)})`
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                if (context.dataset.label === 'Transaction Amount') {
                  return `Amount: ${this.formatCurrency(context.parsed.y)}`;
                } else {
                  return `Success Rate: ${context.parsed.y.toFixed(1)}%`;
                }
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            position: 'left',
            title: {
              display: true,
              text: 'Transaction Amount'
            },
            ticks: {
              callback: (value) => {
                return this.formatCurrency(value as number);
              }
            }
          },
          y1: {
            beginAtZero: true,
            max: 100,
            position: 'right',
            grid: {
              drawOnChartArea: false
            },
            title: {
              display: true,
              text: 'Success Rate (%)'
            }
          }
        }
      }
    });
    
    this.charts.push(chart);
  }

  // Helper methods
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  formatPeriodLabel(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const period = this.filterForm.get('period')?.value || 'monthly';
    
    if (period === 'monthly') {
      return this.datePipe.transform(startDate, 'MMM yyyy') || '';
    } else if (period === 'weekly') {
      return `Week of ${this.datePipe.transform(startDate, 'MMM d')}`;
    } else {
      return this.datePipe.transform(startDate, 'MMM d') || '';
    }
  }

  getMerchantName(id: string): string {
    const merchant = this.merchants.find((m) => m._id === id);
    return merchant
      ? merchant.merchant_tradeName || 'Unnamed Merchant'
      : 'Unknown Merchant';
  }

  getOverallTransactions(): number {
    if (this.statistics.length === 0) return 0;
    return this.statistics.reduce((sum, stat) => sum + stat.totalTransactions, 0);
  }

  getOverallSuccessRate(): number {
    if (this.statistics.length === 0) return 0;
    
    const totalSuccess = this.statistics.reduce((sum, stat) => sum + stat.successfulTransactions, 0);
    const totalTransactions = this.statistics.reduce((sum, stat) => sum + stat.totalTransactions, 0);
    
    return totalTransactions > 0 ? (totalSuccess / totalTransactions) * 100 : 0;
  }

  getOverallRevenue(): number {
    if (this.statistics.length === 0) return 0;
    return this.statistics.reduce((sum, stat) => sum + stat.totalCharges, 0);
  }

  getOverallProfit(): number {
    if (this.statistics.length === 0) return 0;
    return this.statistics.reduce((sum, stat) => sum + stat.totalProfit, 0);
  }

  // Get data for change indicators (comparing most recent to previous period)
  getChangeData(): any {
    if (this.statistics.length < 2) return {
      transactions: { value: 0, positive: true },
      successRate: { value: 0, positive: true },
      revenue: { value: 0, positive: true },
      profit: { value: 0, positive: true }
    };
    
    // Sort from newest to oldest
    const sortedStats = [...this.statistics].sort(
      (a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime()
    );
    
    const current = sortedStats[0];
    const previous = sortedStats[1];
    
    const transactionChange = previous.totalTransactions > 0 
      ? ((current.totalTransactions - previous.totalTransactions) / previous.totalTransactions) * 100 
      : 0;
    
    const successRateChange = current.successRate - previous.successRate;
    
    const revenueChange = previous.totalCharges > 0 
      ? ((current.totalCharges - previous.totalCharges) / previous.totalCharges) * 100 
      : 0;
    
    const profitChange = previous.totalProfit > 0 
      ? ((current.totalProfit - previous.totalProfit) / previous.totalProfit) * 100 
      : 0;
    
    return {
      transactions: {
        value: Math.abs(transactionChange),
        positive: transactionChange >= 0
      },
      successRate: {
        value: Math.abs(successRateChange),
        positive: successRateChange >= 0
      },
      revenue: {
        value: Math.abs(revenueChange),
        positive: revenueChange >= 0
      },
      profit: {
        value: Math.abs(profitChange),
        positive: profitChange >= 0
      }
    };
  }
}