// admin-custody-summary.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AdminCustodySummaryService } from './admin-custody-summary.service';
import { CustodySummary, BalanceByAsset } from './admin-custody-summary.interface';

@Component({
  selector: 'app-admin-custody-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-custody-summary.component.html',
  styleUrls: ['./admin-custody-summary.component.scss']
})
export class AdminCustodySummaryComponent implements OnInit, OnDestroy {
  // Data
  summary: CustodySummary | null = null;
  
  // UI State
  loading = true;
  error = false;
  lastUpdated: Date | null = null;
  selectedAsset: BalanceByAsset | null = null;
  showAssetModal = false;
  
  // Auto-refresh
  private autoRefreshInterval: any;
  autoRefreshEnabled = true;
  autoRefreshSeconds = 60;
  
  // Destroy subject
  private destroy$ = new Subject<void>();
  
  Math = Math;
  
  // Valid currencies for formatting
  private validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'AUD', 'CNY', 'INR', 'BRL', 'GHS', 'NGN', 'ZAR'];
  
  // Asset colors for charts
  private assetColors: Record<string, string> = {
    'USDT': '#26a17b',
    'USDC': '#2775ca',
    'BTC': '#f7931a',
    'ETH': '#627eea',
    'DAI': '#f5ac37',
    'BUSD': '#f0b90b'
  };
  
  constructor(
    private service: AdminCustodySummaryService
  ) {}
  
  ngOnInit() {
    this.loadCustodySummary();
    this.startAutoRefresh();
  }
  
  ngOnDestroy() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadCustodySummary() {
    this.loading = true;
    this.error = false;
    
    this.service.getCustodySummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.summary = response.data;
          this.lastUpdated = new Date();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading custody summary:', error);
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
        console.log('Auto-refreshing custody summary...');
        this.loadCustodySummary();
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
    this.loadCustodySummary();
  }
  
  viewAssetDetails(asset: BalanceByAsset) {
    this.selectedAsset = asset;
    this.showAssetModal = true;
  }
  
  closeAssetModal() {
    this.showAssetModal = false;
    this.selectedAsset = null;
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
  
  getAssetColor(asset: string): string {
    return this.assetColors[asset] || '#4CAF50';
  }
  
  getTotalValue(): number {
    if (!this.summary) return 0;
    return this.summary.balancesByAsset.reduce((sum, asset) => sum + asset.totalAvailable, 0);
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
}