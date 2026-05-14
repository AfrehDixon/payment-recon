// admin-crypto-remittances.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import {
  CryptoRemittance,
  CryptoRemittanceFilters,
  CryptoRemittanceSummary
} from './admin-crypto-remittances.interface';
import { AdminCryptoRemittancesService } from './admin-crypto-remittances.service';

@Component({
  selector: 'app-admin-crypto-remittances',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-crypto-remittances.component.html',
  styleUrls: ['./admin-crypto-remittances.component.scss']
})
export class AdminCryptoRemittancesComponent implements OnInit, OnDestroy {
  // Data
  remittances: CryptoRemittance[] = [];
  summary: CryptoRemittanceSummary | null = null;
  selectedRemittance: CryptoRemittance | null = null;
  Math = Math;
  
  // Forms
  filterForm!: FormGroup;
  
  // UI State
  loading = false;
  loadingSummary = false;
  showFilters = false;
  showViewModal = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;
  pageSizeOptions = [10, 20, 50, 100];
  
  // Filters state
  statusOptions = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'];
  assetOptions = ['USDT', 'USDC', 'BTC', 'ETH'];
  networkOptions = ['TRC20', 'BEP20', 'SOLANA', 'POLYGON', 'ERC20'];
  payoutTypeOptions = ['MOMO', 'BANK', 'WALLET'];
  payoutProviderOptions = ['MTN', 'VODAFONE', 'AIRTELTIGO', 'GTB', 'PEOPLESPAY'];
  
  // Destroy subject
  private destroy$ = new Subject<void>();
  
  // Valid currencies for formatting
  private validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'AUD', 'CNY', 'INR', 'BRL', 'GHS', 'NGN', 'ZAR', 'KES', 'UGX', 'TZS'];
  
  // Status colors
  private statusColors: Record<string, string> = {
    'PENDING': 'status-pending',
    'PROCESSING': 'status-processing',
    'COMPLETED': 'status-completed',
    'FAILED': 'status-failed',
    'CANCELLED': 'status-cancelled'
  };
  
  // Rail colors
  private railColors: Record<string, string> = {
    'CRYPTO': 'rail-crypto',
    'FIAT': 'rail-fiat'
  };
  
  // Computed properties for stats
  get totalRemittances(): number {
    return this.summary?.totals.count || 0;
  }
  
  get totalSourceVolume(): number {
    return this.summary?.totals.sourceAmount || 0;
  }
  
  get totalDestinationVolume(): number {
    return this.summary?.totals.destinationAmount || 0;
  }
  
  get failedCount(): number {
    return this.summary?.byStatus.find(s => s._id === 'FAILED')?.count || 0;
  }
  
  get completedCount(): number {
    return this.summary?.byStatus.find(s => s._id === 'COMPLETED')?.count || 0;
  }
  
  get pendingCount(): number {
    return this.summary?.byStatus.find(s => s._id === 'PENDING')?.count || 0;
  }
  
  constructor(
    private fb: FormBuilder,
    private service: AdminCryptoRemittancesService
  ) {
    this.initFilterForm();
  }
  
  ngOnInit() {
    this.loadRemittances();
    this.loadSummary();
    this.setupFilterSubscriptions();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private initFilterForm() {
    this.filterForm = this.fb.group({
      merchantId: [''],
      externalReference: [''],
      status: [''],
      fromDate: [''],
      toDate: ['']
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
        this.loadRemittances();
        this.loadSummary();
      });
  }
  
  loadRemittances() {
    this.loading = true;
    
    const formValue = this.filterForm.value;
    const filters: CryptoRemittanceFilters = {
      page: this.currentPage,
      limit: this.pageSize
    };
    
    if (formValue.merchantId) filters.merchantId = formValue.merchantId;
    if (formValue.externalReference) filters.externalReference = formValue.externalReference;
    if (formValue.status) filters.status = formValue.status;
    
    if (formValue.fromDate) {
      filters.fromDate = new Date(formValue.fromDate).toISOString();
    }
    if (formValue.toDate) {
      filters.toDate = new Date(formValue.toDate).toISOString();
    }
    
    this.service.listRemittances(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.remittances = response.data;
          this.totalItems = response.pagination.total;
          this.totalPages = response.pagination.pages;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading remittances:', error);
          this.loading = false;
        }
      });
  }
  
  loadSummary() {
    this.loadingSummary = true;
    
    const formValue = this.filterForm.value;
    const filters: Partial<CryptoRemittanceFilters> = {};
    
    if (formValue.merchantId) filters.merchantId = formValue.merchantId;
    if (formValue.fromDate) filters.fromDate = new Date(formValue.fromDate).toISOString();
    if (formValue.toDate) filters.toDate = new Date(formValue.toDate).toISOString();
    
    this.service.getRemittanceSummary(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.summary = response.data;
          this.loadingSummary = false;
        },
        error: (error) => {
          console.error('Error loading remittance summary:', error);
          this.loadingSummary = false;
        }
      });
  }
  
  viewRemittanceDetails(remittance: CryptoRemittance) {
    this.selectedRemittance = remittance;
    this.showViewModal = true;
  }
  
  closeViewModal() {
    this.showViewModal = false;
    this.selectedRemittance = null;
  }
  
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
  
  clearFilters() {
    this.filterForm.reset({
      merchantId: '',
      externalReference: '',
      status: '',
      fromDate: '',
      toDate: ''
    });
    this.currentPage = 1;
    this.loadRemittances();
    this.loadSummary();
  }
  
  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadRemittances();
    }
  }
  
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadRemittances();
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadRemittances();
    }
  }
  
  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadRemittances();
  }
  
  // Helper methods
  getStatusClass(status: string): string {
    return this.statusColors[status] || 'status-unknown';
  }
  
  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'PENDING': 'fa-clock',
      'PROCESSING': 'fa-spinner',
      'COMPLETED': 'fa-check-circle',
      'FAILED': 'fa-times-circle',
      'CANCELLED': 'fa-ban'
    };
    return icons[status] || 'fa-question-circle';
  }
  
  getRailClass(rail: string): string {
    return this.railColors[rail] || 'rail-unknown';
  }
  
  getRailIcon(rail: string): string {
    return rail === 'CRYPTO' ? 'fa-bitcoin' : 'fa-money-bill-wave';
  }
  
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
  
  formatNumber(value: number, decimals: number = 4): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }
  
  formatAddress(address: string): string {
    if (!address) return '';
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  }
  
  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
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