// admin-recent-trades.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AdminRecentTradesService } from './admin-recent-trades.service';
import { RecentTrade, TradeStats } from './admin-recent-trades.interface';

@Component({
  selector: 'app-admin-recent-trades',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-recent-trades.component.html',
  styleUrls: ['./admin-recent-trades.component.scss']
})
export class AdminRecentTradesComponent implements OnInit, OnDestroy {
  // Data
  trades: RecentTrade[] = [];
  
  // UI State
  loading = true;
  error = false;
  lastUpdated: Date | null = null;
  selectedTrade: RecentTrade | null = null;
  showDetailsModal = false;
  
  // Auto-refresh
  private autoRefreshInterval: any;
  autoRefreshEnabled = true;
  autoRefreshSeconds = 60;
  
  // Destroy subject
  private destroy$ = new Subject<void>();
  
  Math = Math;
  
  // Valid currencies for formatting
  private validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'AUD', 'CNY', 'INR', 'BRL', 'GHS', 'NGN', 'ZAR'];
  
  constructor(
    private service: AdminRecentTradesService
  ) {}
  
  ngOnInit() {
    this.loadTrades();
    this.startAutoRefresh();
  }
  
  ngOnDestroy() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadTrades() {
    this.loading = true;
    this.error = false;
    
    this.service.getRecentTrades()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.trades = response.data;
          this.lastUpdated = new Date();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading recent trades:', error);
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
        console.log('Auto-refreshing recent trades...');
        this.loadTrades();
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
    this.loadTrades();
  }
  
  viewTradeDetails(trade: RecentTrade) {
    this.selectedTrade = trade;
    this.showDetailsModal = true;
  }
  
  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedTrade = null;
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
        minimumFractionDigits: 4,
        maximumFractionDigits: 8
      }).format(value) + ` ${currency}`;
    }
  }
  
  formatNumber(value: number, decimals: number = 2): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }
  
  formatDate(date: string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return d.toLocaleDateString();
  }
  
  getStatusClass(status: string): string {
    return status === 'ACTIVE' ? 'status-active' : 'status-inactive';
  }
  
  getStatusIcon(status: string): string {
    return status === 'ACTIVE' ? 'fa-check-circle' : 'fa-pause-circle';
  }
  
  getPricingSourceClass(source: string): string {
    return source === 'KRAKEN' ? 'source-kraken' : 'source-internal';
  }
  
  getSpreadClass(bps: number): string {
    if (bps <= 30) return 'spread-low';
    if (bps <= 70) return 'spread-medium';
    return 'spread-high';
  }
  
  // Stats
  getTotalPairs(): number {
    return this.trades.length;
  }
  
  getActivePairs(): number {
    return this.trades.filter(t => t.status === 'ACTIVE').length;
  }
  
  getAverageFee(): number {
    if (this.trades.length === 0) return 0;
    const totalFee = this.trades.reduce((sum, t) => sum + t.feeBps, 0);
    return totalFee / this.trades.length;
  }
  
  getAverageBuySpread(): number {
    if (this.trades.length === 0) return 0;
    const totalSpread = this.trades.reduce((sum, t) => sum + t.metadata.buySpreadBps, 0);
    return totalSpread / this.trades.length;
  }
  
  getAverageSellSpread(): number {
    if (this.trades.length === 0) return 0;
    const totalSpread = this.trades.reduce((sum, t) => sum + t.metadata.sellSpreadBps, 0);
    return totalSpread / this.trades.length;
  }
  
  getAverageSwapSpread(): number {
    if (this.trades.length === 0) return 0;
    const totalSpread = this.trades.reduce((sum, t) => sum + t.metadata.swapSpreadBps, 0);
    return totalSpread / this.trades.length;
  }
  
  getKrakenPairsCount(): number {
    return this.trades.filter(t => t.metadata.pricingSource === 'KRAKEN').length;
  }
  
  getInternalPairsCount(): number {
    return this.trades.filter(t => t.metadata.pricingSource === 'INTERNAL').length;
  }
  
  getStats(): TradeStats[] {
    return [
      { label: 'Total Pairs', value: this.getTotalPairs(), icon: 'fa-chart-simple', color: 'primary', suffix: ' pairs' },
      { label: 'Active Pairs', value: this.getActivePairs(), icon: 'fa-check-circle', color: 'success', suffix: ' pairs' },
      { label: 'Avg. Fee', value: this.getAverageFee(), icon: 'fa-percent', color: 'warning', suffix: ' bps' },
      { label: 'Avg. Buy Spread', value: this.getAverageBuySpread(), icon: 'fa-arrow-down', color: 'info', suffix: ' bps' },
      { label: 'Avg. Sell Spread', value: this.getAverageSellSpread(), icon: 'fa-arrow-up', color: 'danger', suffix: ' bps' },
      { label: 'Avg. Swap Spread', value: this.getAverageSwapSpread(), icon: 'fa-exchange-alt', color: 'secondary', suffix: ' bps' },
      { label: 'Kraken Pairs', value: this.getKrakenPairsCount(), icon: 'fa-dragon', color: 'primary', suffix: ' pairs' },
      { label: 'Internal Pairs', value: this.getInternalPairsCount(), icon: 'fa-server', color: 'info', suffix: ' pairs' }
    ];
  }
  
  formatStatValue(stat: TradeStats): string {
    if (stat.suffix === ' bps') {
      return stat.value.toFixed(1) + stat.suffix;
    }
    return this.formatNumber(stat.value) + (stat.suffix || '');
  }
}