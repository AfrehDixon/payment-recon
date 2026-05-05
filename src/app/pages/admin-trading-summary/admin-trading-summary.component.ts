// admin-trading-summary.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AdminTradingSummaryService } from './admin-trading-summary.service';
import { TradingSummary, TradingStats, TradingByStatus, TopPair } from './admin-trading-summary.interface';

@Component({
  selector: 'app-admin-trading-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-trading-summary.component.html',
  styleUrls: ['./admin-trading-summary.component.scss']
})
export class AdminTradingSummaryComponent implements OnInit, OnDestroy {
  // Data
  summary: TradingSummary | null = null;
  
  // UI State
  loading = true;
  error = false;
  lastUpdated: Date | null = null;
  
  // Auto-refresh
  private autoRefreshInterval: any;
  autoRefreshEnabled = true;
  autoRefreshSeconds = 60;
  
  // Destroy subject
  private destroy$ = new Subject<void>();
  
  Math = Math;
  
  // Valid currencies for formatting
  private validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'AUD', 'CNY', 'INR', 'BRL', 'GHS', 'NGN', 'ZAR'];
  
  // Pair colors
  private pairColors: Record<string, string> = {
    'BTC_USDT': '#f7931a',
    'ETH_USDT': '#627eea',
    'USDT_GHS': '#26a17b',
    'BTC_GHS': '#f7931a',
    'ETH_GHS': '#627eea',
    'USDC_USDT': '#2775ca'
  };
  
  // Status colors
  private statusColors: Record<string, string> = {
    'COMPLETED': '#28a745',
    'PENDING': '#ffc107',
    'FAILED': '#dc3545',
    'PROCESSING': '#17a2b8'
  };
  
  constructor(
    private service: AdminTradingSummaryService
  ) {}
  
  ngOnInit() {
    this.loadTradingSummary();
    this.startAutoRefresh();
  }
  
  ngOnDestroy() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadTradingSummary() {
    this.loading = true;
    this.error = false;
    
    this.service.getTradingSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.summary = response.data;
          this.lastUpdated = new Date();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading trading summary:', error);
          this.error = true;
          this.loading = false;
        }
      });
  }
  
  startAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    
    this.autoRefreshInterval = setInterval(() => {
      if (this.autoRefreshEnabled && !this.loading) {
        console.log('Auto-refreshing trading summary...');
        this.loadTradingSummary();
      }
    }, this.autoRefreshSeconds * 1000);
  }
  
  toggleAutoRefresh() {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    if (this.autoRefreshEnabled) {
      this.startAutoRefresh();
    }
  }
  
  refresh() {
    this.loadTradingSummary();
  }
  
  // Helper methods
  formatCurrency(value: number, currency: string = 'USD'): string {
    const isValidCurrency = this.validCurrencies.includes(currency.toUpperCase());
    
    if (isValidCurrency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    } else {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value) + ` ${currency}`;
    }
  }
  
  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }
  
  formatCompactNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }
  
  getPairColor(pair: string): string {
    return this.pairColors[pair] || '#4CAF50';
  }
  
  getStatusColor(status: string): string {
    return this.statusColors[status] || '#6c757d';
  }
  
  getMaxPairVolume(): number {
    if (!this.summary?.topPairs.length) return 0;
    return Math.max(...this.summary.topPairs.map(p => p.totalAmount));
  }
  
  getRangeLabel(): string {
    if (!this.summary) return 'Today';
    const from = new Date(this.summary.range.from);
    const to = new Date(this.summary.range.to);
    return `${from.toLocaleDateString()} - ${to.toLocaleDateString()}`;
  }
  
  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }
  
  formatAddress(address: string): string {
    if (!address) return '';
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  }
  
  hasData(): boolean {
    if (!this.summary) return false;
    return this.summary.totals.totalCount > 0 || 
           this.summary.byStatus.length > 0 || 
           this.summary.topPairs.length > 0;
  }
  
  // Stats cards data
  getMainStats(): TradingStats[] {
    if (!this.summary) return [];
    
    return [
      {
        label: 'Total Trades',
        value: this.summary.totals.totalCount,
        icon: 'fa-exchange-alt',
        color: 'primary',
        suffix: ' trades'
      },
      {
        label: 'Total Volume',
        value: this.summary.totals.totalAmount,
        icon: 'fa-chart-line',
        color: 'success',
        prefix: '$'
      },
      {
        label: 'Total Profit',
        value: this.summary.totals.totalProfit,
        icon: 'fa-chart-simple',
        color: 'info',
        prefix: '$'
      }
    ];
  }
}