// admin-quotes.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import {
  Quote,
  QuoteFilters,
  ExpireQuotePayload
} from './admin-quotes.interface';
import { AdminQuotesService } from './admin-quotes.service';

@Component({
  selector: 'app-admin-quotes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-quotes.component.html',
  styleUrls: ['./admin-quotes.component.scss']
})
export class AdminQuotesComponent implements OnInit, OnDestroy {
  // Data
  quotes: Quote[] = [];
  selectedQuote: Quote | null = null;
  Math = Math;
  
  // Forms
  filterForm!: FormGroup;
  
  // UI State
  loading = false;
  showFilters = false;
  showViewModal = false;
  showExpireModal = false;
  expireInProgress = false;
  expireQuoteId: string | null = null;
  
  // Pagination
  currentPage = 1;
  pageSize = 50;
  totalItems = 0;
  totalPages = 0;
  pageSizeOptions = [20, 50, 100, 200];
  
  // Filters state
  sideOptions = ['BUY', 'SELL', 'SWAP'];
  statusOptions = ['PENDING', 'EXECUTED', 'EXPIRED', 'CANCELLED', 'REJECTED'];
  
  // Destroy subject
  private destroy$ = new Subject<void>();
  
  // Current admin user
  currentAdmin = 'admin@doronpay.com';
  
  // Valid currencies for formatting
  private validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'AUD', 'CNY', 'INR', 'BRL', 'GHS', 'NGN', 'ZAR', 'KES', 'UGX', 'TZS'];
  
  // Computed properties for stats
  get totalQuotes(): number {
    return this.totalItems;
  }
  
  get pendingCount(): number {
    return this.quotes.filter(q => q.status === 'PENDING').length;
  }
  
  get executedCount(): number {
    return this.quotes.filter(q => q.status === 'EXECUTED').length;
  }
  
  get expiredCount(): number {
    return this.quotes.filter(q => q.status === 'EXPIRED').length;
  }
  
  constructor(
    private fb: FormBuilder,
    private service: AdminQuotesService
  ) {
    this.initFilterForm();
  }
  
  ngOnInit() {
    this.loadQuotes();
    this.setupFilterSubscriptions();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private initFilterForm() {
    this.filterForm = this.fb.group({
      merchantId: [''],
      endCustomerId: [''],
      pairCode: [''],
      side: [''],
      status: [''],
      dateRange: this.fb.group({
        from: [''],
        to: ['']
      })
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
        this.loadQuotes();
      });
  }
  
  loadQuotes() {
    this.loading = true;
    
    const formValue = this.filterForm.value;
    const filters: QuoteFilters = {
      page: this.currentPage,
      limit: this.pageSize
    };
    
    if (formValue.merchantId) filters.merchantId = formValue.merchantId;
    if (formValue.endCustomerId) filters.endCustomerId = formValue.endCustomerId;
    if (formValue.pairCode) filters.pairCode = formValue.pairCode;
    if (formValue.side) filters.side = formValue.side;
    if (formValue.status) filters.status = formValue.status;
    
    if (formValue.dateRange?.from) {
      filters.fromDate = new Date(formValue.dateRange.from).toISOString();
    }
    if (formValue.dateRange?.to) {
      filters.toDate = new Date(formValue.dateRange.to).toISOString();
    }
    
    this.service.listQuotes(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.quotes = response.data.items;
          this.totalItems = response.data.total;
          this.totalPages = response.data.pages;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading quotes:', error);
          this.loading = false;
        }
      });
  }
  
  viewQuoteDetails(quote: Quote) {
    this.selectedQuote = quote;
    this.showViewModal = true;
  }
  
  closeViewModal() {
    this.showViewModal = false;
    this.selectedQuote = null;
  }
  
  confirmExpireQuote(quoteId: string) {
    this.expireQuoteId = quoteId;
    this.showExpireModal = true;
  }
  
  executeExpireQuote() {
    if (!this.expireQuoteId) return;
    
    this.expireInProgress = true;
    
    const payload: ExpireQuotePayload = {
      performedBy: this.currentAdmin,
      reason: 'Admin manually expired quote'
    };
    
    this.service.expireQuote(this.expireQuoteId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadQuotes();
          this.expireInProgress = false;
          this.showExpireModal = false;
          this.expireQuoteId = null;
        },
        error: (error) => {
          console.error('Error expiring quote:', error);
          this.expireInProgress = false;
        }
      });
  }
  
  cancelExpire() {
    this.showExpireModal = false;
    this.expireQuoteId = null;
  }
  
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
  
  clearFilters() {
    this.filterForm.reset({
      merchantId: '',
      endCustomerId: '',
      pairCode: '',
      side: '',
      status: '',
      dateRange: { from: '', to: '' }
    });
    this.currentPage = 1;
    this.loadQuotes();
  }
  
  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadQuotes();
    }
  }
  
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadQuotes();
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadQuotes();
    }
  }
  
  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadQuotes();
  }
  
  // Helper methods
  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'PENDING': 'status-pending',
      'EXECUTED': 'status-executed',
      'EXPIRED': 'status-expired',
      'CANCELLED': 'status-cancelled',
      'REJECTED': 'status-rejected'
    };
    return classes[status] || 'status-unknown';
  }
  
  getSideClass(side: string): string {
    const classes: Record<string, string> = {
      'BUY': 'side-buy',
      'SELL': 'side-sell',
      'SWAP': 'side-swap'
    };
    return classes[side] || 'side-unknown';
  }
  
  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'PENDING': 'fa-clock',
      'EXECUTED': 'fa-check-circle',
      'EXPIRED': 'fa-hourglass-end',
      'CANCELLED': 'fa-ban',
      'REJECTED': 'fa-times-circle'
    };
    return icons[status] || 'fa-question-circle';
  }
  
  formatCurrency(value: number, currency: string = 'USD'): string {
    const isValidCurrency = this.validCurrencies.includes(currency.toUpperCase());
    
    if (isValidCurrency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 8
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
  
  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }
  
  formatAddress(address: string): string {
    if (!address) return '';
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
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
    if (diffSecs < 60) return 'expiring-soon';
    return 'valid';
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