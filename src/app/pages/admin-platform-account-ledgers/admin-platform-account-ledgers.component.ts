// admin-platform-account-ledgers.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import {
  PlatformAccountLedger,
  PlatformAccountLedgerFilters,
  EPlatformAccountCode,
  EPlatformAccountCategory,
  EPlatformAccountLedgerEntryType,
  EPlatformAccountLedgerDirection
} from './admin-platform-account-ledgers.interface';
import { AdminPlatformAccountLedgersService } from './admin-platform-account-ledgers.service';

@Component({
  selector: 'app-admin-platform-account-ledgers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-platform-account-ledgers.component.html',
  styleUrls: ['./admin-platform-account-ledgers.component.scss']
})
export class AdminPlatformAccountLedgersComponent implements OnInit, OnDestroy {
  // Data
  ledgers: PlatformAccountLedger[] = [];
  selectedLedger: PlatformAccountLedger | null = null;
  Math = Math;
  
  // Forms
  filterForm!: FormGroup;
  
  // UI State
  loading = false;
  showFilters = false;
  showViewModal = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;
  pageSizeOptions = [10, 20, 50, 100];
  
  // Filters state
  accountCodeOptions = Object.values(EPlatformAccountCode);
  accountCategoryOptions = Object.values(EPlatformAccountCategory);
  entryTypeOptions = Object.values(EPlatformAccountLedgerEntryType);
  directionOptions = Object.values(EPlatformAccountLedgerDirection);
  currencyOptions = ['GHS', 'USD', 'EUR', 'GBP', 'NGN', 'KES', 'UGX', 'TZS'];
  
  // Sort options
  sortOptions = [
    { value: 'createdAt', label: 'Created Date' },
    { value: 'amount', label: 'Amount' },
    { value: 'balanceBefore', label: 'Balance Before' },
    { value: 'balanceAfter', label: 'Balance After' }
  ];
  sortOrderOptions = [
    { value: 'desc', label: 'Descending' },
    { value: 'asc', label: 'Ascending' }
  ];
  
  // Computed properties for stats
  get totalEntries(): number {
    return this.totalItems;
  }
  
  get totalCreditVolume(): number {
    return this.ledgers.filter(l => l.direction === 'CREDIT').reduce((sum, l) => sum + l.amount, 0);
  }
  
  get totalDebitVolume(): number {
    return this.ledgers.filter(l => l.direction === 'DEBIT').reduce((sum, l) => sum + l.amount, 0);
  }
  
  get uniqueAccounts(): number {
    return new Set(this.ledgers.map(l => l.platformAccountId?._id)).size;
  }
  
  // Destroy subject
  private destroy$ = new Subject<void>();
  
  // Valid currencies for formatting
  private validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'AUD', 'CNY', 'INR', 'BRL', 'GHS', 'NGN', 'ZAR', 'KES', 'UGX', 'TZS'];
  
  // Entry type colors
  private entryTypeColors: Record<string, string> = {
    'FEE_REVENUE_CREDIT': 'type-fee-revenue',
    'MANUAL_ADJUSTMENT': 'type-manual',
    'TRANSACTION_FEE': 'type-fee',
    'VAT_REMITTANCE': 'type-vat',
    'SETTLEMENT': 'type-settlement',
    'DISBURSEMENT': 'type-disbursement'
  };
  
  constructor(
    private fb: FormBuilder,
    private service: AdminPlatformAccountLedgersService
  ) {
    this.initFilterForm();
  }
  
  ngOnInit() {
    this.loadLedgers();
    this.setupFilterSubscriptions();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private initFilterForm() {
    this.filterForm = this.fb.group({
      platformAccountId: [''],
      accountCode: [''],
      accountCategory: [''],
      entryType: [''],
      direction: [''],
      currency: [''],
      transactionId: [''],
      merchantId: [''],
      reference: [''],
      dateRange: this.fb.group({
        from: [''],
        to: ['']
      }),
      sortBy: ['createdAt'],
      sortOrder: ['desc']
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
        this.loadLedgers();
      });
  }
  
  loadLedgers() {
    this.loading = true;
    
    const formValue = this.filterForm.value;
    const filters: PlatformAccountLedgerFilters = {
      page: this.currentPage,
      limit: this.pageSize,
      sortBy: formValue.sortBy,
      sortOrder: formValue.sortOrder
    };
    
    if (formValue.platformAccountId) filters.platformAccountId = formValue.platformAccountId;
    if (formValue.accountCode) filters.accountCode = formValue.accountCode;
    if (formValue.accountCategory) filters.accountCategory = formValue.accountCategory;
    if (formValue.entryType) filters.entryType = formValue.entryType;
    if (formValue.direction) filters.direction = formValue.direction;
    if (formValue.currency) filters.currency = formValue.currency;
    if (formValue.transactionId) filters.transactionId = formValue.transactionId;
    if (formValue.merchantId) filters.merchantId = formValue.merchantId;
    if (formValue.reference) filters.reference = formValue.reference;
    
    if (formValue.dateRange?.from) {
      filters.fromDate = new Date(formValue.dateRange.from).toISOString();
    }
    if (formValue.dateRange?.to) {
      filters.toDate = new Date(formValue.dateRange.to).toISOString();
    }
    
    this.service.listLedgers(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.ledgers = response.data;
          this.totalItems = response.pagination.total;
          this.totalPages = response.pagination.pages;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading ledger entries:', error);
          this.loading = false;
        }
      });
  }
  
  viewLedgerDetails(ledger: PlatformAccountLedger) {
    this.selectedLedger = ledger;
    this.showViewModal = true;
  }
  
  closeViewModal() {
    this.showViewModal = false;
    this.selectedLedger = null;
  }
  
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
  
  clearFilters() {
    this.filterForm.reset({
      platformAccountId: '',
      accountCode: '',
      accountCategory: '',
      entryType: '',
      direction: '',
      currency: '',
      transactionId: '',
      merchantId: '',
      reference: '',
      dateRange: { from: '', to: '' },
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    this.currentPage = 1;
    this.loadLedgers();
  }
  
  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadLedgers();
    }
  }
  
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadLedgers();
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadLedgers();
    }
  }
  
  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadLedgers();
  }
  
  // Helper methods
  getDirectionClass(direction: string): string {
    return direction === 'CREDIT' ? 'direction-credit' : 'direction-debit';
  }
  
  getDirectionIcon(direction: string): string {
    return direction === 'CREDIT' ? 'fa-arrow-up' : 'fa-arrow-down';
  }
  
  getEntryTypeClass(entryType: string): string {
    return this.entryTypeColors[entryType] || 'type-unknown';
  }
  
  getEntryTypeLabel(entryType: string): string {
    const labels: Record<string, string> = {
      'FEE_REVENUE_CREDIT': 'Fee Revenue Credit',
      'MANUAL_ADJUSTMENT': 'Manual Adjustment',
      'TRANSACTION_FEE': 'Transaction Fee',
      'VAT_REMITTANCE': 'VAT Remittance',
      'SETTLEMENT': 'Settlement',
      'DISBURSEMENT': 'Disbursement'
    };
    return labels[entryType] || entryType;
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
  
  formatNumber(value: number, decimals: number = 2): string {
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