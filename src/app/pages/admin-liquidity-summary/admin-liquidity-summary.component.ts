// admin-liquidity-summary.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AdminLiquiditySummaryService } from './admin-liquidity-summary.service';
import { LiquiditySummary, LiquidityStats } from './admin-liquidity-summary.interface';

@Component({
  selector: 'app-admin-liquidity-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-liquidity-summary.component.html',
  styleUrls: ['./admin-liquidity-summary.component.scss']
})
export class AdminLiquiditySummaryComponent implements OnInit, OnDestroy {
  // Data
  summary: LiquiditySummary | null = null;
  
  // UI State
  loading = true;
  error = false;
  lastUpdated: Date | null = null;
  selectedItem: any = null;
  showDetailModal = false;
  
  // Auto-refresh
  private autoRefreshInterval: any;
  autoRefreshEnabled = true;
  autoRefreshSeconds = 60;
  
  // Destroy subject
  private destroy$ = new Subject<void>();
  
  Math = Math;
  
  // Valid currencies for formatting
  private validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'AUD', 'CNY', 'INR', 'BRL', 'GHS', 'NGN', 'ZAR'];
  
  // Provider colors
  private providerColors: Record<string, string> = {
    'KRAKEN': '#f7931a',
    'BINANCE': '#f0b90b',
    'COINBASE': '#2775ca',
    'CUSTODY': '#26a17b'
  };
  
  // Asset colors
  private assetColors: Record<string, string> = {
    'USDT': '#26a17b',
    'USDC': '#2775ca',
    'BTC': '#f7931a',
    'ETH': '#627eea',
    'DAI': '#f5ac37',
    'BUSD': '#f0b90b',
    'GHS': '#2c5f2d'
  };
  
  constructor(
    private service: AdminLiquiditySummaryService
  ) {}
  
  ngOnInit() {
    this.loadLiquiditySummary();
    this.startAutoRefresh();
  }
  
  ngOnDestroy() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadLiquiditySummary() {
    this.loading = true;
    this.error = false;
    
    this.service.getLiquiditySummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.summary = response.data;
          this.lastUpdated = new Date();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading liquidity summary:', error);
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
        console.log('Auto-refreshing liquidity summary...');
        this.loadLiquiditySummary();
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
    this.loadLiquiditySummary();
  }
  
  viewDetails(item: any, type: string) {
    this.selectedItem = { ...item, type };
    this.showDetailModal = true;
  }
  
  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedItem = null;
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
  
  getProviderColor(provider: string): string {
    return this.providerColors[provider] || '#6c757d';
  }
  
  getAssetColor(asset: string): string {
    return this.assetColors[asset] || '#4CAF50';
  }
  
  getAvailableRatio(total: number, available: number): number {
    if (total === 0) return 0;
    return (available / total) * 100;
  }
  
  getLockedRatio(total: number, locked: number): number {
    if (total === 0) return 0;
    return (locked / total) * 100;
  }
  
  getTotalLiquidity(): number {
    if (!this.summary) return 0;
    return this.summary.byProvider.reduce((sum, p) => sum + p.totalBalance, 0);
  }
  
  getTotalAvailable(): number {
    if (!this.summary) return 0;
    return this.summary.byProvider.reduce((sum, p) => sum + p.availableBalance, 0);
  }
  
  getTotalLocked(): number {
    if (!this.summary) return 0;
    return this.summary.byProvider.reduce((sum, p) => sum + p.lockedBalance, 0);
  }
  
  getOverallUtilizationRate(): number {
    const total = this.getTotalLiquidity();
    const locked = this.getTotalLocked();
    if (total === 0) return 0;
    return (locked / total) * 100;
  }
  
  getAvailableRate(): number {
    const total = this.getTotalLiquidity();
    const available = this.getTotalAvailable();
    if (total === 0) return 0;
    return (available / total) * 100;
  }
  
  getUtilizationClass(rate: number): string {
    if (rate >= 80) return 'critical';
    if (rate >= 60) return 'high';
    if (rate >= 30) return 'medium';
    return 'low';
  }
  
  getUtilizationLabel(rate: number): string {
    if (rate >= 80) return 'Critical';
    if (rate >= 60) return 'High';
    if (rate >= 30) return 'Medium';
    return 'Low';
  }
  
  hasData(): boolean {
    if (!this.summary) return false;
    return this.getTotalLiquidity() > 0;
  }
  
  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }
  
  // Stats cards data
  getMainStats(): LiquidityStats[] {
    if (!this.summary) return [];
    
    return [
      {
        label: 'Total Liquidity',
        value: this.getTotalLiquidity(),
        icon: 'fa-water',
        color: 'primary',
        prefix: '$',
        subtext: 'Total value locked'
      },
      {
        label: 'Available Liquidity',
        value: this.getTotalAvailable(),
        icon: 'fa-check-circle',
        color: 'success',
        prefix: '$',
        subtext: 'Ready for use'
      },
      {
        label: 'Locked Liquidity',
        value: this.getTotalLocked(),
        icon: 'fa-lock',
        color: 'warning',
        prefix: '$',
        subtext: 'Currently in use'
      },
      {
        label: 'Utilization Rate',
        value: this.getOverallUtilizationRate(),
        icon: 'fa-percent',
        color: 'info',
        suffix: '%',
        subtext: 'Of total liquidity'
      },
      {
        label: 'Available Rate',
        value: this.getAvailableRate(),
        icon: 'fa-chart-line',
        color: 'secondary',
        suffix: '%',
        subtext: 'Available vs Total'
      }
    ];
  }
  
  getProviderStats(): LiquidityStats[] {
    if (!this.summary || this.summary.byProvider.length === 0) return [];
    
    return this.summary.byProvider.map(provider => ({
      label: provider._id || 'Unknown Provider',
      value: provider.totalBalance,
      icon: 'fa-building',
      color: 'primary',
      prefix: '$',
      subtext: `${this.formatNumber(provider.availableBalance)} available`
    }));
  }
}