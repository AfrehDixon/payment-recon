// admin-platform-accounts.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import {
  PlatformAccount,
  PlatformAccountFilters,
  EPlatformAccountCode,
  EPlatformAccountCategory,
  EPlatformAccountStatus,
  EPlatformAccountLedgerDirection,
  CreatePlatformAccountPayload,
  UpdatePlatformAccountPayload,
  ManualAdjustmentPayload,
  VatRemittancePayload
} from './admin-platform-accounts.interface';
import { AdminPlatformAccountsService } from './admin-platform-accounts.service';

@Component({
  selector: 'app-admin-platform-accounts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-platform-accounts.component.html',
  styleUrls: ['./admin-platform-accounts.component.scss']
})
export class AdminPlatformAccountsComponent implements OnInit, OnDestroy {
  // Data
  accounts: PlatformAccount[] = [];
  selectedAccount: PlatformAccount | null = null;
  adjustmentResult: any = null;
  Math = Math;
  
  // Toast message
  toastMessage: string | null = null;
  toastType: 'success' | 'error' = 'success';
  
  // Forms
  filterForm!: FormGroup;
  createAccountForm!: FormGroup;
  updateAccountForm!: FormGroup;
  adjustmentForm!: FormGroup;
  vatForm!: FormGroup;
  seedForm!: FormGroup;
  
  // UI State
  loading = false;
  showFilters = false;
  showCreateModal = false;
  showEditModal = false;
  showViewModal = false;
  showAdjustmentModal = false;
  showVatModal = false;
  showSeedModal = false;
  actionInProgress = false;
  adjustmentSuccess = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;
  pageSizeOptions = [10, 20, 50, 100];
  
  // Filters state
  codeOptions = Object.values(EPlatformAccountCode);
  categoryOptions = Object.values(EPlatformAccountCategory);
  statusOptions = Object.values(EPlatformAccountStatus);
  currencyOptions = ['GHS', 'USD', 'EUR', 'GBP', 'NGN', 'KES', 'UGX', 'TZS'];
  directionOptions = Object.values(EPlatformAccountLedgerDirection);
  
  // Sort options
  sortOptions = [
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Updated Date' },
    { value: 'balance', label: 'Balance' },
    { value: 'code', label: 'Code' },
    { value: 'currency', label: 'Currency' }
  ];
  sortOrderOptions = [
    { value: 'desc', label: 'Descending' },
    { value: 'asc', label: 'Ascending' }
  ];
  
  // Computed properties for stats
  get activeAccountsCount(): number {
    return this.accounts.filter(a => a.status === 'ACTIVE').length;
  }

  get suspendedAccountsCount(): number {
    return this.accounts.filter(a => a.status === 'SUSPENDED').length;
  }

  get totalBalance(): number {
    return this.accounts.reduce((sum, a) => sum + a.balance, 0);
  }
  
  get totalCredits(): number {
    return this.accounts.reduce((sum, a) => sum + a.totalCredits, 0);
  }
  
  get totalDebits(): number {
    return this.accounts.reduce((sum, a) => sum + a.totalDebits, 0);
  }
  
  // Destroy subject
  private destroy$ = new Subject<void>();
  
  // Current admin user
  currentAdmin = 'admin@doronpay.com';
  
  // Valid currencies for formatting
  private validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'AUD', 'CNY', 'INR', 'BRL', 'GHS', 'NGN', 'ZAR', 'KES', 'UGX', 'TZS'];
  
  // Category colors
  private categoryColors: Record<string, string> = {
    'ASSET': 'category-asset',
    'LIABILITY': 'category-liability',
    'EQUITY': 'category-equity',
    'REVENUE': 'category-revenue',
    'EXPENSE': 'category-expense'
  };
  
  constructor(
    private fb: FormBuilder,
    private service: AdminPlatformAccountsService
  ) {
    this.initForms();
  }
  
  ngOnInit() {
    this.loadAccounts();
    this.setupFilterSubscriptions();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private showToast(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = null;
    }, 5000);
  }
  
  private initForms() {
    // Filter Form
    this.filterForm = this.fb.group({
      code: [''],
      category: [''],
      currency: [''],
      status: [''],
      sortBy: ['createdAt'],
      sortOrder: ['desc']
    });
    
    // Create Account Form
    this.createAccountForm = this.fb.group({
      code: ['', Validators.required],
      category: ['', Validators.required],
      name: ['', [Validators.required, Validators.maxLength(150)]],
      description: ['', Validators.maxLength(500)],
      currency: ['GHS', Validators.required],
      settlementAccount: this.fb.group({
        type: [''],
        accountName: [''],
        accountNumber: [''],
        issuer: [''],
        currency: ['']
      }),
      metadata: this.fb.group({
        notes: ['']
      })
    });
    
    // Update Account Form
    this.updateAccountForm = this.fb.group({
      name: ['', Validators.maxLength(150)],
      description: ['', Validators.maxLength(500)],
      status: [''],
      settlementAccount: this.fb.group({
        type: [''],
        accountName: [''],
        accountNumber: [''],
        issuer: [''],
        currency: ['']
      }),
      metadata: this.fb.group({
        notes: ['']
      })
    });
    
    // Manual Adjustment Form
    this.adjustmentForm = this.fb.group({
      accountCode: ['', Validators.required],
      currency: ['GHS', Validators.required],
      direction: ['CREDIT', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      reference: ['', Validators.maxLength(120)],
      description: ['Manual platform account adjustment', Validators.maxLength(500)],
      idempotencyKey: [''],
      metadata: this.fb.group({
        notes: ['']
      })
    });
    
    // VAT Remittance Form
    this.vatForm = this.fb.group({
      currency: ['GHS', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      reference: ['', [Validators.required, Validators.maxLength(120)]],
      description: ['VAT remittance to tax authority', Validators.maxLength(500)],
      idempotencyKey: [''],
      metadata: this.fb.group({
        notes: ['']
      })
    });
    
    // Seed Defaults Form
    this.seedForm = this.fb.group({
      currency: ['GHS', Validators.required],
      createdBy: ['']
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
        this.loadAccounts();
      });
  }
  
  loadAccounts() {
    this.loading = true;
    
    const formValue = this.filterForm.value;
    const filters: PlatformAccountFilters = {
      page: this.currentPage,
      limit: this.pageSize,
      sortBy: formValue.sortBy,
      sortOrder: formValue.sortOrder
    };
    
    if (formValue.code) filters.code = formValue.code;
    if (formValue.category) filters.category = formValue.category;
    if (formValue.currency) filters.currency = formValue.currency;
    if (formValue.status) filters.status = formValue.status;
    
    this.service.listAccounts(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.accounts = response.data;
          this.totalItems = response.pagination.total;
          this.totalPages = response.pagination.pages;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading platform accounts:', error);
          this.showToast('Failed to load accounts', 'error');
          this.loading = false;
        }
      });
  }
  
  viewAccountDetails(account: PlatformAccount) {
    this.selectedAccount = account;
    this.showViewModal = true;
  }
  
  closeViewModal() {
    this.showViewModal = false;
    this.selectedAccount = null;
  }
  
  openEditModal(account: PlatformAccount) {
    this.selectedAccount = account;
    this.updateAccountForm.patchValue({
      name: account.name,
      description: account.description || '',
      status: account.status,
      settlementAccount: account.settlementAccount || {
        type: '',
        accountName: '',
        accountNumber: '',
        issuer: '',
        currency: ''
      },
      metadata: { notes: account.metadata?.notes || '' }
    });
    this.showEditModal = true;
  }
  
  closeEditModal() {
    this.showEditModal = false;
    this.selectedAccount = null;
    this.updateAccountForm.reset();
  }
  
  updateAccount() {
    if (this.updateAccountForm.invalid || !this.selectedAccount) return;
    
    this.actionInProgress = true;
    const payload: UpdatePlatformAccountPayload = this.updateAccountForm.value;
    
    // Remove empty values
    Object.keys(payload).forEach(key => {
      if (payload[key as keyof UpdatePlatformAccountPayload] === '' || payload[key as keyof UpdatePlatformAccountPayload] === null) {
        delete payload[key as keyof UpdatePlatformAccountPayload];
      }
    });
    
    this.service.updateAccount(this.selectedAccount._id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadAccounts();
          this.actionInProgress = false;
          this.closeEditModal();
          this.showToast('Account updated successfully', 'success');
        },
        error: (error) => {
          console.error('Error updating account:', error);
          this.showToast('Failed to update account', 'error');
          this.actionInProgress = false;
        }
      });
  }
  
  openCreateModal() {
    this.createAccountForm.reset({
      currency: 'GHS',
      settlementAccount: {
        type: '',
        accountName: '',
        accountNumber: '',
        issuer: '',
        currency: ''
      },
      metadata: { notes: '' }
    });
    this.showCreateModal = true;
  }
  
  closeCreateModal() {
    this.showCreateModal = false;
    this.createAccountForm.reset();
  }
  
  createAccount() {
    if (this.createAccountForm.invalid) return;
    
    this.actionInProgress = true;
    const payload: CreatePlatformAccountPayload = this.createAccountForm.value;
    
    this.service.createAccount(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadAccounts();
          this.actionInProgress = false;
          this.closeCreateModal();
          this.showToast('Account created successfully', 'success');
        },
        error: (error) => {
          console.error('Error creating account:', error);
          this.showToast('Failed to create account', 'error');
          this.actionInProgress = false;
        }
      });
  }
  
  openAdjustmentModal() {
    this.adjustmentForm.reset({
      currency: 'GHS',
      direction: 'CREDIT',
      description: 'Manual platform account adjustment',
      metadata: { notes: '' }
    });
    this.adjustmentSuccess = false;
    this.adjustmentResult = null;
    this.showAdjustmentModal = true;
  }
  
  closeAdjustmentModal() {
    this.showAdjustmentModal = false;
    this.adjustmentForm.reset();
    this.adjustmentResult = null;
    this.adjustmentSuccess = false;
  }
  
  submitAdjustment() {
    if (this.adjustmentForm.invalid) return;
    
    this.actionInProgress = true;
    const payload: ManualAdjustmentPayload = this.adjustmentForm.value;
    
    this.service.manualAdjustment(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.adjustmentResult = response.data;
          this.adjustmentSuccess = true;
          this.actionInProgress = false;
          this.loadAccounts();
          this.showToast('Adjustment completed successfully', 'success');
        },
        error: (error) => {
          console.error('Error performing adjustment:', error);
          this.showToast('Failed to process adjustment', 'error');
          this.actionInProgress = false;
        }
      });
  }
  
  openVatModal() {
    this.vatForm.reset({
      currency: 'GHS',
      description: 'VAT remittance to tax authority',
      metadata: { notes: '' }
    });
    this.showVatModal = true;
  }
  
  closeVatModal() {
    this.showVatModal = false;
    this.vatForm.reset();
  }
  
  submitVatRemittance() {
    if (this.vatForm.invalid) return;
    
    this.actionInProgress = true;
    const payload: VatRemittancePayload = this.vatForm.value;
    
    this.service.vatRemittance(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadAccounts();
          this.actionInProgress = false;
          this.closeVatModal();
          this.showToast('VAT remittance processed successfully', 'success');
        },
        error: (error) => {
          console.error('Error processing VAT remittance:', error);
          this.showToast('Failed to process VAT remittance', 'error');
          this.actionInProgress = false;
        }
      });
  }
  
  openSeedModal() {
    this.seedForm.reset({ currency: 'GHS', createdBy: this.currentAdmin });
    this.showSeedModal = true;
  }
  
  closeSeedModal() {
    this.showSeedModal = false;
    this.seedForm.reset();
  }
  
  seedDefaults() {
    if (this.seedForm.invalid) return;
    
    this.actionInProgress = true;
    const payload = this.seedForm.value;
    
    this.service.seedDefaults(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadAccounts();
          this.actionInProgress = false;
          this.closeSeedModal();
          this.showToast('Default accounts seeded successfully', 'success');
        },
        error: (error) => {
          console.error('Error seeding defaults:', error);
          this.showToast('Failed to seed default accounts', 'error');
          this.actionInProgress = false;
        }
      });
  }
  
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
  
  clearFilters() {
    this.filterForm.reset({
      code: '',
      category: '',
      currency: '',
      status: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    this.currentPage = 1;
    this.loadAccounts();
  }
  
  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadAccounts();
    }
  }
  
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadAccounts();
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadAccounts();
    }
  }
  
  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadAccounts();
  }
  
  // Helper methods
  getCategoryClass(category: string): string {
    return this.categoryColors[category] || 'category-unknown';
  }
  
  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'ACTIVE': 'status-active',
      'SUSPENDED': 'status-suspended',
      'CLOSED': 'status-closed'
    };
    return classes[status] || 'status-unknown';
  }
  
  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'ACTIVE': 'fa-check-circle',
      'SUSPENDED': 'fa-exclamation-triangle',
      'CLOSED': 'fa-ban'
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
    return new Date(date).toLocaleString();
  }
  
  getBalanceClass(balance: number): string {
    if (balance > 0) return 'balance-positive';
    if (balance < 0) return 'balance-negative';
    return 'balance-zero';
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