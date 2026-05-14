import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminTreasuryQuotesService } from './admin-treasury-quotes.service';
import { TreasuryQuote, ETreasuryQuotePurpose, ETreasuryQuoteStatus, ETreasuryQuoteProvider } from './admin-treasury-quotes.interface';

@Component({
  selector: 'app-admin-treasury-quotes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-treasury-quotes.component.html',
  styleUrls: ['./admin-treasury-quotes.component.scss']
})
export class AdminTreasuryQuotesComponent implements OnInit, OnDestroy {
  // Data
  quotes: TreasuryQuote[] = [];
  createdQuote: TreasuryQuote | null = null;
  externalQuote: any = null;
  searchedQuote: TreasuryQuote | null = null;
  selectedQuote: TreasuryQuote | null = null;
  
  // Forms
  createQuoteForm!: FormGroup;
  externalQuoteForm!: FormGroup;
  searchForm!: FormGroup;
  filterForm!: FormGroup;
  
  // UI State
  loading = false;
  loadingQuotes = false;
  loadingExternal = false;
  searching = false;
  showCreateModal = false;
  showExternalModal = false;
  showSearchResult = false;
  showDetailsModal = false;
  searchError = false;
  searchErrorMessage = '';
  
  // Pagination
  pagination = {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  };
  
  // Sort
  sortBy = 'createdAt';
  sortOrder = 'desc';
  
  // Options
  railOptions = ['CRYPTO', 'FIAT'];
  assetOptions = ['USDT', 'USDC', 'BTC', 'ETH', 'GHS', 'USD', 'EUR', 'GBP'];
  currencyOptions = ['GHS', 'USD', 'EUR', 'GBP', 'NGN', 'KES', 'UGX', 'TZS'];
  providerOptions = Object.values(ETreasuryQuoteProvider);
  purposeOptions = Object.values(ETreasuryQuotePurpose);
  statusOptions = Object.values(ETreasuryQuoteStatus);
  
  // Destroy subject
  private destroy$ = new Subject<void>();
  
  // Valid currencies for formatting
  private validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'AUD', 'CNY', 'INR', 'BRL', 'GHS', 'NGN', 'ZAR', 'KES', 'UGX', 'TZS'];
  
  // Expose Math to template
  Math = Math;
  
  constructor(
    private fb: FormBuilder,
    private service: AdminTreasuryQuotesService
  ) {
    this.initForms();
    this.initFilters();
  }
  
  ngOnInit() {
    this.loadQuotes();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private initForms() {
    // Create Quote Form
    this.createQuoteForm = this.fb.group({
      merchantId: [''],
      appId: [''],
      purpose: [''],
      sourceRail: ['CRYPTO', Validators.required],
      sourceAsset: ['USDT', Validators.required],
      sourceAmount: ['', [Validators.required, Validators.min(0.01)]],
      destinationRail: ['FIAT', Validators.required],
      destinationCurrency: ['GHS', Validators.required],
      treasuryRate: ['', [Validators.required, Validators.min(0)]],
      customerRate: [''],
      spread: [''],
      ttlSeconds: [300, [Validators.min(30), Validators.max(86400)]],
      metadata: this.fb.group({
        notes: ['']
      })
    });
    
    // External Quote Form
    this.externalQuoteForm = this.fb.group({
      merchantId: [''],
      appId: [''],
      provider: [ETreasuryQuoteProvider.BANK_FX_ENGINE],
      purpose: [''],
      sourceRail: ['CRYPTO', Validators.required],
      sourceAsset: ['USDT', Validators.required],
      sourceAmount: ['', [Validators.required, Validators.min(0.01)]],
      destinationRail: ['FIAT', Validators.required],
      destinationCurrency: ['GHS', Validators.required],
      ttlSeconds: [300, [Validators.min(30), Validators.max(86400)]],
      metadata: this.fb.group({
        notes: ['']
      })
    });
    
    // Search Form
    this.searchForm = this.fb.group({
      quoteRef: ['', Validators.required]
    });
  }
  
  private initFilters() {
    this.filterForm = this.fb.group({
      status: [''],
      quoteRef: [''],
      merchantId: [''],
      fromCurrency: [''],
      toCurrency: [''],
      provider: [''],
      externalProvider: [''],
      fromDate: [''],
      toDate: ['']
    });

    // Debounce filter changes
    this.filterForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.pagination.page = 1;
        this.loadQuotes();
      });
  }
  
  // Load quotes with filters
  loadQuotes() {
    this.loadingQuotes = true;
    
    const params: any = {
      page: this.pagination.page,
      limit: this.pagination.limit,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      ...this.filterForm.value
    };
    
    // Remove empty values
    Object.keys(params).forEach(key => {
      if (!params[key]) {
        delete params[key];
      }
    });
    
    this.service.listQuotes(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.quotes = response.data;
          this.pagination = response.pagination;
          this.loadingQuotes = false;
        },
        error: (error) => {
          console.error('Error loading quotes:', error);
          this.loadingQuotes = false;
        }
      });
  }
  
  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.pagination.pages) {
      this.pagination.page = page;
      this.loadQuotes();
    }
  }
  
  previousPage() {
    this.goToPage(this.pagination.page - 1);
  }
  
  nextPage() {
    this.goToPage(this.pagination.page + 1);
  }
  
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const totalPages = this.pagination.pages;
    const currentPage = this.pagination.page;
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(totalPages);
      }
    }
    
    return pages;
  }
  
  // Sort methods
  onSort(column: string) {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'desc';
    }
    this.loadQuotes();
  }
  
  getSortIcon(column: string): string {
    if (this.sortBy !== column) {
      return 'fa-sort';
    }
    return this.sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }
  
  // Reset filters
  resetFilters() {
    this.filterForm.reset({
      status: '',
      quoteRef: '',
      merchantId: '',
      fromCurrency: '',
      toCurrency: '',
      provider: '',
      externalProvider: '',
      fromDate: '',
      toDate: ''
    });
    this.pagination.page = 1;
    this.loadQuotes();
  }
  
  // Helper methods
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
  
  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }
  
  getTimeLeft(expiresAt: string): string {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return 'Expired';
    }
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours % 24}h left`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m left`;
    } else {
      return `${diffMins}m left`;
    }
  }
  
  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'ACTIVE': 'status-active',
      'EXPIRED': 'status-expired',
      'USED': 'status-used',
      'CANCELLED': 'status-cancelled'
    };
    return classes[status] || 'status-unknown';
  }
  
  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'ACTIVE': 'fa-check-circle',
      'EXPIRED': 'fa-hourglass-end',
      'USED': 'fa-check-double',
      'CANCELLED': 'fa-ban'
    };
    return icons[status] || 'fa-question-circle';
  }
  
  getSourceClass(source?: string): string {
    const classes: Record<string, string> = {
      'INTERNAL': 'source-internal',
      'BANK_EXTERNAL': 'source-bank',
      'CRYPTO_EXTERNAL': 'source-crypto'
    };
    return classes[source || ''] || 'source-unknown';
  }
  
  getSourceIcon(source?: string): string {
    const icons: Record<string, string> = {
      'INTERNAL': 'fa-building',
      'BANK_EXTERNAL': 'fa-university',
      'CRYPTO_EXTERNAL': 'fa-bitcoin'
    };
    return icons[source || ''] || 'fa-question-circle';
  }
  
  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // You can add a toast notification here
      console.log('Copied to clipboard:', text);
    });
  }
  
  // Calculate destination amount
  calculateDestinationAmount(): number {
    const sourceAmount = this.createQuoteForm.get('sourceAmount')?.value;
    const treasuryRate = this.createQuoteForm.get('treasuryRate')?.value;
    if (sourceAmount && treasuryRate) {
      return sourceAmount * treasuryRate;
    }
    return 0;
  }
  
  // Auto-calculate spread
  updateSpread() {
    const treasuryRate = this.createQuoteForm.get('treasuryRate')?.value;
    const customerRate = this.createQuoteForm.get('customerRate')?.value;
    
    if (treasuryRate && customerRate) {
      const spread = ((customerRate - treasuryRate) / treasuryRate) * 10000;
      this.createQuoteForm.patchValue({ spread: spread.toFixed(2) });
    }
  }
  
  // Modal methods
  openCreateModal() {
    this.createQuoteForm.reset({
      sourceRail: 'CRYPTO',
      sourceAsset: 'USDT',
      destinationRail: 'FIAT',
      destinationCurrency: 'GHS',
      ttlSeconds: 300,
      metadata: { notes: '' }
    });
    this.showCreateModal = true;
  }
  
  closeCreateModal() {
    this.showCreateModal = false;
    this.createdQuote = null;
  }
  
  openExternalModal() {
    this.externalQuoteForm.reset({
      provider: ETreasuryQuoteProvider.BANK_FX_ENGINE,
      sourceRail: 'CRYPTO',
      sourceAsset: 'USDT',
      destinationRail: 'FIAT',
      destinationCurrency: 'GHS',
      ttlSeconds: 300,
      metadata: { notes: '' }
    });
    this.showExternalModal = true;
    this.externalQuote = null;
  }
  
  closeExternalModal() {
    this.showExternalModal = false;
    this.externalQuote = null;
  }
  
  openDetailsModal(quote: TreasuryQuote) {
    this.selectedQuote = quote;
    this.showDetailsModal = true;
  }
  
  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedQuote = null;
  }
  
  // Create quote submission
  submitCreateQuote() {
    if (this.createQuoteForm.invalid) {
      this.createQuoteForm.markAllAsTouched();
      return;
    }
    
    this.loading = true;
    const payload = this.createQuoteForm.value;
    
    // Remove empty fields
    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || payload[key] === null) {
        delete payload[key];
      }
    });
    
    this.service.createQuote(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.createdQuote = response.data;
          this.loading = false;
          this.loadQuotes();
        },
        error: (error) => {
          console.error('Error creating quote:', error);
          this.loading = false;
        }
      });
  }
  
  // External quote submission
  submitExternalQuote() {
    if (this.externalQuoteForm.invalid) {
      this.externalQuoteForm.markAllAsTouched();
      return;
    }
    
    this.loadingExternal = true;
    const payload = this.externalQuoteForm.value;
    
    // Remove empty fields
    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || payload[key] === null) {
        delete payload[key];
      }
    });
    
    this.service.requestExternalQuote(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.externalQuote = response.data;
          this.loadingExternal = false;
          this.loadQuotes();
        },
        error: (error) => {
          console.error('Error requesting external quote:', error);
          this.loadingExternal = false;
        }
      });
  }
  
  // Search quote
  searchQuote() {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }
    
    this.searching = true;
    this.searchError = false;
    this.searchErrorMessage = '';
    this.showSearchResult = false;
    
    const quoteRef = this.searchForm.get('quoteRef')?.value;
    
    this.service.getQuoteByRef(quoteRef)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.searchedQuote = response.data;
          this.showSearchResult = true;
          this.searching = false;
        },
        error: (error) => {
          console.error('Error searching quote:', error);
          this.searchError = true;
          this.searchErrorMessage = error.error?.message || 'Quote not found';
          this.searching = false;
        }
      });
  }
  
  clearSearch() {
    this.searchForm.reset();
    this.showSearchResult = false;
    this.searchedQuote = null;
    this.searchError = false;
    this.searchErrorMessage = '';
  }
  
  resetCreateForm() {
    this.createQuoteForm.reset({
      sourceRail: 'CRYPTO',
      sourceAsset: 'USDT',
      destinationRail: 'FIAT',
      destinationCurrency: 'GHS',
      ttlSeconds: 300
    });
    this.createdQuote = null;
  }
}