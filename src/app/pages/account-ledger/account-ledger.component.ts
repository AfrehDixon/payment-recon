// account-ledger.component.ts (add these methods and update loadSummary)
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { 
  AccountLedgerEntry, 
  LedgerFilters,
  LedgerBalanceType,
  LedgerDirection,
  LedgerEntryType,
  LedgerSummary,
  SummaryGroup,
  SummaryDirection
} from './account-ledger.interface';
import { AccountLedgerService } from './account-ledger.service';

@Component({
  selector: 'app-account-ledger',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './account-ledger.component.html',
  styleUrls: ['./account-ledger.component.scss']
})
export class AccountLedgerComponent implements OnInit, OnDestroy {
  @Input() accountId?: string;
  @Input() walletId?: string;
  @Input() customerId?: string;
  @Input() embedded = false;

  // Data
  entries: AccountLedgerEntry[] = [];
  summary: LedgerSummary = [];
  selectedEntry: AccountLedgerEntry | null = null;

  // Processed summary data for display
  summaryTotals = {
    totalCredits: 0,
    totalDebits: 0,
    netChange: 0,
    totalEntries: 0,
    byCurrency: {} as Record<string, { credits: number; debits: number; net: number; count: number }>,
    byBalanceType: {} as Record<string, { credits: number; debits: number; net: number; count: number }>
  };

  // Enums for templates
  balanceTypes: LedgerBalanceType[] = ['CONFIRMED', 'UNCONFIRMED', 'BLOCKED', 'AVAILABLE'];
  directions: LedgerDirection[] = ['CREDIT', 'DEBIT'];
  entryTypes: LedgerEntryType[] = [
    'DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'FEE', 'REFUND', 
    'ADJUSTMENT', 'HOLD', 'RELEASE', 'FUNDING', 
    'SETTLEMENT', 'REVERSAL'
  ];

  // Forms
  filterForm!: FormGroup;
  
  // UI State
  loading = false;
  loadingSummary = false;
  showFilters = false;
  showDetailsModal = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 50;
  totalItems = 0;
  pageSizeOptions = [10, 25, 50, 100, 200];
  
  // Destroy subject
  private destroy$ = new Subject<void>();

  Math = Math;

  constructor(
    private fb: FormBuilder,
    private service: AccountLedgerService
  ) {
    this.initFilterForm();
  }

  ngOnInit() {
    this.loadEntries();
    this.loadSummary();
    this.setupFilterSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initFilterForm() {
    this.filterForm = this.fb.group({
      dateRange: this.fb.group({
        from: [''],
        to: ['']
      }),
      balanceType: [''],
      direction: [''],
      entryType: [''],
      transactionId: [''],
      externalTransactionId: [''],
      provider: [''],
      operator: [''],
      currency: [''],
      sortBy: ['createdAt'],
      sortDir: ['desc']
    });
  }

  private setupFilterSubscriptions() {
    ['transactionId', 'externalTransactionId', 'provider', 'operator', 'currency'].forEach(field => {
      this.filterForm.get(field)?.valueChanges
        .pipe(
          debounceTime(500),
          distinctUntilChanged(),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.currentPage = 1;
          this.loadEntries();
        });
    });

    ['balanceType', 'direction', 'entryType', 'sortBy', 'sortDir'].forEach(field => {
      this.filterForm.get(field)?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.currentPage = 1;
          this.loadEntries();
        });
    });

    this.filterForm.get('dateRange')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadEntries();
        this.loadSummary();
      });
  }

  loadEntries() {
    this.loading = true;
    
    const filters: LedgerFilters = {
      page: this.currentPage,
      limit: this.pageSize,
      ...this.buildFilters()
    };

    if (this.accountId) {
      filters.accountId = this.accountId;
    }

    const request = this.accountId 
      ? this.service.getAccountLedgerEntries(this.accountId, filters)
      : this.service.getLedgerEntries(filters);

    request.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.entries = response.data.items;
          this.totalItems = response.data.total;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading ledger entries:', error);
          this.loading = false;
        }
      });
  }

  loadSummary() {
    this.loadingSummary = true;
    
    const filters = this.buildSummaryFilters();

    const request = this.accountId
      ? this.service.getAccountLedgerSummary(this.accountId, filters)
      : this.service.getLedgerSummary(filters);

    request.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.summary = response.data;
          this.processSummaryData();
          this.loadingSummary = false;
        },
        error: (error) => {
          console.error('Error loading ledger summary:', error);
          this.loadingSummary = false;
          this.summary = [];
        }
      });
  }

  private processSummaryData() {
    // Reset totals
    this.summaryTotals = {
      totalCredits: 0,
      totalDebits: 0,
      netChange: 0,
      totalEntries: 0,
      byCurrency: {},
      byBalanceType: {}
    };

    this.summary.forEach(group => {
      const { balanceType, currency } = group._id;
      
      // Initialize currency tracking
      if (!this.summaryTotals.byCurrency[currency]) {
        this.summaryTotals.byCurrency[currency] = { credits: 0, debits: 0, net: 0, count: 0 };
      }
      
      // Initialize balance type tracking
      if (!this.summaryTotals.byBalanceType[balanceType]) {
        this.summaryTotals.byBalanceType[balanceType] = { credits: 0, debits: 0, net: 0, count: 0 };
      }

      // Process each direction
      group.byDirection.forEach(dir => {
        if (dir.direction === 'CREDIT') {
          this.summaryTotals.totalCredits += dir.totalAmount;
          this.summaryTotals.byCurrency[currency].credits += dir.totalAmount;
          this.summaryTotals.byBalanceType[balanceType].credits += dir.totalAmount;
        } else {
          this.summaryTotals.totalDebits += dir.totalAmount;
          this.summaryTotals.byCurrency[currency].debits += dir.totalAmount;
          this.summaryTotals.byBalanceType[balanceType].debits += dir.totalAmount;
        }
        
        this.summaryTotals.byCurrency[currency].count += dir.count;
        this.summaryTotals.byBalanceType[balanceType].count += dir.count;
        this.summaryTotals.totalEntries += dir.count;
      });

      // Calculate net for currency
      this.summaryTotals.byCurrency[currency].net = 
        this.summaryTotals.byCurrency[currency].credits - this.summaryTotals.byCurrency[currency].debits;
      
      // Calculate net for balance type
      this.summaryTotals.byBalanceType[balanceType].net = 
        this.summaryTotals.byBalanceType[balanceType].credits - this.summaryTotals.byBalanceType[balanceType].debits;
    });

    this.summaryTotals.netChange = this.summaryTotals.totalCredits - this.summaryTotals.totalDebits;
  }

  private buildFilters(): Partial<LedgerFilters> {
    const formValue = this.filterForm.value;
    const filters: Partial<LedgerFilters> = {};

    if (formValue.dateRange?.from) {
      filters.from = new Date(formValue.dateRange.from).toISOString();
    }
    if (formValue.dateRange?.to) {
      filters.to = new Date(formValue.dateRange.to).toISOString();
    }

    if (formValue.balanceType) filters.balanceType = formValue.balanceType;
    if (formValue.direction) filters.direction = formValue.direction;
    if (formValue.entryType) filters.entryType = formValue.entryType;
    if (formValue.transactionId) filters.transactionId = formValue.transactionId;
    if (formValue.externalTransactionId) filters.externalTransactionId = formValue.externalTransactionId;
    if (formValue.provider) filters.provider = formValue.provider;
    if (formValue.operator) filters.operator = formValue.operator;
    if (formValue.currency) filters.currency = formValue.currency;
    if (formValue.sortBy) filters.sortBy = formValue.sortBy;
    if (formValue.sortDir) filters.sortDir = formValue.sortDir;

    return filters;
  }

  private buildSummaryFilters(): Partial<LedgerFilters> {
    const formValue = this.filterForm.value;
    const filters: Partial<LedgerFilters> = {};

    if (formValue.dateRange?.from) {
      filters.from = new Date(formValue.dateRange.from).toISOString();
    }
    if (formValue.dateRange?.to) {
      filters.to = new Date(formValue.dateRange.to).toISOString();
    }

    if (!this.accountId) {
      if (formValue.balanceType) filters.balanceType = formValue.balanceType;
      if (formValue.direction) filters.direction = formValue.direction;
      if (formValue.entryType) filters.entryType = formValue.entryType;
      if (formValue.currency) filters.currency = formValue.currency;
      if (formValue.provider) filters.provider = formValue.provider;
      if (formValue.operator) filters.operator = formValue.operator;
    } else {
      if (formValue.balanceType) filters.balanceType = formValue.balanceType;
    }

    return filters;
  }

  viewEntryDetails(entry: AccountLedgerEntry) {
    this.selectedEntry = entry;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedEntry = null;
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  clearFilters() {
    this.filterForm.reset({
      dateRange: { from: '', to: '' },
      balanceType: '',
      direction: '',
      entryType: '',
      transactionId: '',
      externalTransactionId: '',
      provider: '',
      operator: '',
      currency: '',
      sortBy: 'createdAt',
      sortDir: 'desc'
    });
    this.currentPage = 1;
    this.loadEntries();
    this.loadSummary();
  }

  hasMetadata(entry: AccountLedgerEntry | null): boolean {
    return !!(entry?.meta && Object.keys(entry.meta).length > 0);
  }

  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadEntries();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadEntries();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadEntries();
    }
  }

  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadEntries();
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  // Helper methods
  getDirectionClass(direction: LedgerDirection): string {
    return direction === 'CREDIT' 
      ? 'text-green-600 bg-green-100' 
      : 'text-red-600 bg-red-100';
  }

  getEntryTypeClass(entryType: LedgerEntryType): string {
    const classes: Record<string, string> = {
      'DEPOSIT': 'bg-green-100 text-green-800',
      'WITHDRAWAL': 'bg-red-100 text-red-800',
      'TRANSFER': 'bg-blue-100 text-blue-800',
      'FEE': 'bg-orange-100 text-orange-800',
      'REFUND': 'bg-purple-100 text-purple-800',
      'ADJUSTMENT': 'bg-yellow-100 text-yellow-800',
      'HOLD': 'bg-pink-100 text-pink-800',
      'RELEASE': 'bg-indigo-100 text-indigo-800',
      'FUNDING': 'bg-teal-100 text-teal-800',
      'SETTLEMENT': 'bg-cyan-100 text-cyan-800',
      'REVERSAL': 'bg-amber-100 text-amber-800'
    };
    return classes[entryType] || 'bg-gray-100 text-gray-800';
  }

  // In account-ledger.component.ts, update the method to be more flexible
getBalanceTypeClass(balanceType: string): string {
  const classes: Record<string, string> = {
    'CONFIRMED': 'bg-emerald-100 text-emerald-800',
    'UNCONFIRMED': 'bg-amber-100 text-amber-800',
    'BLOCKED': 'bg-rose-100 text-rose-800',
    'AVAILABLE': 'bg-sky-100 text-sky-800'
  };
  return classes[balanceType] || 'bg-gray-100 text-gray-800';
}

  formatAmount(amount: number, direction?: LedgerDirection, currency: string = 'USD'): string {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(Math.abs(amount));
    
    if (direction) {
      return direction === 'CREDIT' ? `+${formatted}` : `-${formatted}`;
    }
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }

  formatAddress(address: string): string {
    if (!address) return '';
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  }

  // Get unique currencies from summary
  getSummaryCurrencies(): string[] {
    return Object.keys(this.summaryTotals.byCurrency);
  }

  // Get unique balance types from summary
  getSummaryBalanceTypes(): string[] {
    return Object.keys(this.summaryTotals.byBalanceType);
  }
}