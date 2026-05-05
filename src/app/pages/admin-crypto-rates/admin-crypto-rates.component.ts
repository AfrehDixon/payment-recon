// admin-crypto-rates.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import {
  CryptoRate,
  CryptoRateFilters,
  RefreshRatesPayload
} from './admin-crypto-rates.interface';
import { AdminCryptoRatesService } from './admin-crypto-rates.service';

@Component({
  selector: 'app-admin-crypto-rates',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-crypto-rates.component.html',
  styleUrls: ['./admin-crypto-rates.component.scss']
})
export class AdminCryptoRatesComponent implements OnInit, OnDestroy {
  // Data
  rates: CryptoRate[] = [];
  selectedRate: CryptoRate | null = null;
  Math = Math;
  
  // Forms
  filterForm!: FormGroup;
  
  // UI State
  loading = false;
  refreshing = false;
  showFilters = false;
  showViewModal = false;
  showRefreshConfirmModal = false;
  refreshAllMode = false;
  refreshPairCode: string | null = null;
  
  // Pagination
  currentPage = 1;
  pageSize = 50;
  totalItems = 0;
  totalPages = 0;
  pageSizeOptions = [20, 50, 100, 200];
  
  // Filters state
  sourceOptions = ['KRAKEN', 'INTERNAL'];
  statusOptions = ['ACTIVE', 'STALE', 'ERROR'];
  
  // Auto-refresh interval
  private autoRefreshInterval: any;
  autoRefreshEnabled = false;
  autoRefreshSeconds = 30;
  
  // Destroy subject
  private destroy$ = new Subject<void>();
  
  // Current admin user (should come from auth service)
  currentAdmin = 'admin@doronpay.com';
  
  // Computed properties for stats
  get activeCount(): number {
    return this.rates.filter(r => r.status === 'ACTIVE').length;
  }

  get staleCount(): number {
    return this.rates.filter(r => r.status === 'STALE').length;
  }

  get errorCount(): number {
    return this.rates.filter(r => r.status === 'ERROR').length;
  }
  
  constructor(
    private fb: FormBuilder,
    private service: AdminCryptoRatesService
  ) {
    this.initFilterForm();
  }
  
  ngOnInit() {
    this.loadRates();
    this.setupFilterSubscriptions();
  }
  
  ngOnDestroy() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private initFilterForm() {
    this.filterForm = this.fb.group({
      pairCode: [''],
      baseAsset: [''],
      quoteAsset: [''],
      source: [''],
      status: ['']
    });
  }
  
  private setupFilterSubscriptions() {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadRates();
      });
  }
  
  loadRates() {
    this.loading = true;
    
    const filters: CryptoRateFilters = {
      ...this.filterForm.value,
      page: this.currentPage,
      limit: this.pageSize
    };
    
    // Remove empty values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof CryptoRateFilters] === '' || filters[key as keyof CryptoRateFilters] === undefined) {
        delete filters[key as keyof CryptoRateFilters];
      }
    });
    
    this.service.listRates(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.rates = response.data.items;
          this.totalItems = response.data.total;
          this.totalPages = response.data.pages;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading crypto rates:', error);
          this.loading = false;
        }
      });
  }
  
  viewRateDetails(rate: CryptoRate) {
    this.selectedRate = rate;
    this.showViewModal = true;
  }
  
  closeViewModal() {
    this.showViewModal = false;
    this.selectedRate = null;
  }
  
  confirmRefreshAll() {
    this.refreshAllMode = true;
    this.refreshPairCode = null;
    this.showRefreshConfirmModal = true;
  }
  
  confirmRefreshPair(pairCode: string) {
    this.refreshAllMode = false;
    this.refreshPairCode = pairCode;
    this.showRefreshConfirmModal = true;
  }
  
  executeRefresh() {
    this.showRefreshConfirmModal = false;
    this.refreshing = true;
    
    const payload: RefreshRatesPayload = {
      performedBy: this.currentAdmin,
      force: true
    };
    
    const request = this.refreshAllMode
      ? this.service.refreshAllRates(payload)
      : this.service.refreshRateByPairCode(this.refreshPairCode!, payload);
    
    request.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Refresh response:', response);
          this.loadRates();
          this.refreshing = false;
          this.refreshAllMode = false;
          this.refreshPairCode = null;
        },
        error: (error) => {
          console.error('Error refreshing rates:', error);
          this.refreshing = false;
        }
      });
  }
  
  cancelRefresh() {
    this.showRefreshConfirmModal = false;
    this.refreshAllMode = false;
    this.refreshPairCode = null;
  }
  
  toggleAutoRefresh() {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    
    if (this.autoRefreshEnabled) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }
  
  private startAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    
    this.autoRefreshInterval = setInterval(() => {
      if (!this.refreshing && !this.loading) {
        console.log('Auto-refreshing rates...');
        const payload: RefreshRatesPayload = {
          performedBy: 'system',
          force: false
        };
        
        this.service.refreshAllRates(payload)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadRates();
            },
            error: (error) => {
              console.error('Auto-refresh error:', error);
            }
          });
      }
    }, this.autoRefreshSeconds * 1000);
  }
  
  private stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }
  
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
  
  clearFilters() {
    this.filterForm.reset({
      pairCode: '',
      baseAsset: '',
      quoteAsset: '',
      source: '',
      status: ''
    });
    this.currentPage = 1;
    this.loadRates();
  }
  
  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadRates();
    }
  }
  
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadRates();
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadRates();
    }
  }
  
  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadRates();
  }
  
  // Helper methods
  calculateSpread(rate: CryptoRate): number {
    return rate.ask - rate.bid;
  }
  
  calculateSpreadBps(rate: CryptoRate): number {
    const spread = this.calculateSpread(rate);
    const mid = rate.mid;
    if (mid === 0) return 0;
    return (spread / mid) * 10000; // Convert to basis points
  }
  
  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'ACTIVE': 'status-active',
      'STALE': 'status-stale',
      'ERROR': 'status-error'
    };
    return classes[status] || 'status-unknown';
  }
  
  getSourceClass(source: string): string {
    return source === 'KRAKEN' ? 'source-kraken' : 'source-internal';
  }
  
  getTimeRemaining(expiresAt: string): string {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs} seconds`;
    
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  }
  
  getExpiryClass(expiresAt: string): string {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffSecs = (expiry.getTime() - now.getTime()) / 1000;
    
    if (diffSecs <= 0) return 'expired';
    if (diffSecs < 30) return 'expiring-soon';
    if (diffSecs < 60) return 'expiring';
    return 'valid';
  }
  
  formatNumber(value: number, decimals: number = 2): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }
  
// admin-crypto-rates.component.ts - Update the formatCurrency method

formatCurrency(value: number, currency: string = 'USD'): string {
  // List of valid ISO currency codes
  const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'AUD', 'CNY', 'INR', 'BRL', 'GHS', 'NGN', 'ZAR', 'KES', 'UGX', 'TZS'];
  
  // Check if currency is a valid ISO code
  const isValidCurrency = validCurrencies.includes(currency.toUpperCase());
  
  if (isValidCurrency) {
    // Use currency formatting for fiat currencies
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(value);
  } else {
    // For crypto tickers (USDT, USDC, BTC, ETH, etc.), just format as number with the ticker symbol
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(value) + ` ${currency}`;
  }
}
  
  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }
  
  getTimeSinceUpdate(fetchedAt: string): string {
    const fetched = new Date(fetchedAt);
    const now = new Date();
    const diffMs = now.getTime() - fetched.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs} seconds ago`;
    
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  
  getAgeClass(fetchedAt: string): string {
    const fetched = new Date(fetchedAt);
    const now = new Date();
    const diffMins = (now.getTime() - fetched.getTime()) / 60000;
    
    if (diffMins < 1) return 'age-fresh';
    if (diffMins < 5) return 'age-moderate';
    if (diffMins < 15) return 'age-aging';
    return 'age-stale';
  }
  
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}