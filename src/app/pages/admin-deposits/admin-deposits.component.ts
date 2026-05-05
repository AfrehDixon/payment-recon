// admin-deposits.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import {
  Deposit,
  DepositFilters,
  ReprocessDepositPayload
} from './admin-deposits.interface';
import { AdminDepositsService } from './admin-deposits.service';

@Component({
  selector: 'app-admin-deposits',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-deposits.component.html',
  styleUrls: ['./admin-deposits.component.scss']
})
export class AdminDepositsComponent implements OnInit, OnDestroy {
  // Data
  deposits: Deposit[] = [];
  selectedDeposit: Deposit | null = null;
  Math = Math;
  
  // Forms
  filterForm!: FormGroup;
  reprocessForm!: FormGroup;
  
  // UI State
  loading = false;
  showFilters = false;
  showViewModal = false;
  showReprocessModal = false;
  actionInProgress = false;
  showRawData: boolean = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;
  pageSizeOptions = [10, 20, 50, 100];
  
  // Filters state
  statusOptions = ['PENDING', 'CONFIRMED', 'FAILED', 'REPROCESSING', 'COMPLETED'];
  networkOptions = ['TRC20', 'BEP20', 'SOLANA', 'POLYGON', 'ERC20', 'BTC', 'ETH'];
  
  // Destroy subject
  private destroy$ = new Subject<void>();
  
  // Current admin user
  currentAdmin = 'admin@doronpay.com';
  
  // Network colors
  private networkColors: Record<string, string> = {
    'TRC20': '#e74c3c',
    'BEP20': '#f0b90b',
    'SOLANA': '#14f195',
    'POLYGON': '#8247e5',
    'ERC20': '#627eea',
    'BTC': '#f7931a',
    'ETH': '#627eea'
  };
  
  // Required confirmations by network
  private requiredConfirmations: Record<string, number> = {
    'POLYGON': 128,
    'ETHEREUM': 12,
    'BSC': 15,
    'TRON': 19,
    'SOLANA': 32,
    'BTC': 6,
    'TRC20': 19,
    'BEP20': 15,
    'ERC20': 12
  };
  
  // Status colors
  private statusColors: Record<string, string> = {
    'PENDING': 'status-pending',
    'CONFIRMED': 'status-confirmed',
    'FAILED': 'status-failed',
    'REPROCESSING': 'status-reprocessing',
    'COMPLETED': 'status-completed'
  };
  
  // Valid currencies for formatting
  private validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'AUD', 'CNY', 'INR', 'BRL', 'GHS', 'NGN', 'ZAR'];
  
  // Computed properties for stats
  get totalDeposits(): number {
    return this.totalItems;
  }
  
  get totalVolume(): number {
    return this.deposits.reduce((sum, d) => sum + d.amount, 0);
  }
  
  get pendingCount(): number {
    return this.deposits.filter(d => d.status === 'PENDING').length;
  }
  
  get confirmedCount(): number {
    return this.deposits.filter(d => d.status === 'CONFIRMED').length;
  }
  
  get failedCount(): number {
    return this.deposits.filter(d => d.status === 'FAILED').length;
  }
  
  get completedCount(): number {
    return this.deposits.filter(d => d.status === 'COMPLETED').length;
  }
  
  constructor(
    private fb: FormBuilder,
    private service: AdminDepositsService
  ) {
    this.initFilterForm();
    this.initReprocessForm();
  }
  
  ngOnInit() {
    this.loadDeposits();
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
      network: [''],
      asset: [''],
      status: [''],
      intentCode: [''],
      txHash: [''],
      dateRange: this.fb.group({
        from: [''],
        to: ['']
      })
    });
  }
  
  private initReprocessForm() {
    this.reprocessForm = this.fb.group({
      reason: ['', Validators.required]
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
        this.loadDeposits();
      });
  }
  
  loadDeposits() {
    this.loading = true;
    
    const formValue = this.filterForm.value;
    const filters: DepositFilters = {
      page: this.currentPage,
      limit: this.pageSize
    };
    
    if (formValue.merchantId) filters.merchantId = formValue.merchantId;
    if (formValue.endCustomerId) filters.endCustomerId = formValue.endCustomerId;
    if (formValue.network) filters.network = formValue.network;
    if (formValue.asset) filters.asset = formValue.asset;
    if (formValue.status) filters.status = formValue.status;
    if (formValue.intentCode) filters.intentCode = formValue.intentCode;
    if (formValue.txHash) filters.txHash = formValue.txHash;
    
    if (formValue.dateRange?.from) {
      filters.fromDate = new Date(formValue.dateRange.from).toISOString();
    }
    if (formValue.dateRange?.to) {
      filters.toDate = new Date(formValue.dateRange.to).toISOString();
    }
    
    this.service.listDeposits(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.deposits = response.data.items;
          this.totalItems = response.data.total;
          this.totalPages = response.data.pages;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading deposits:', error);
          this.loading = false;
        }
      });
  }
  
  viewDepositDetails(deposit: Deposit) {
    this.selectedDeposit = deposit;
    this.showViewModal = true;
  }
  
  closeViewModal() {
    this.showViewModal = false;
    this.selectedDeposit = null;
  }
  
  openReprocessModal(deposit: Deposit) {
    this.selectedDeposit = deposit;
    this.reprocessForm.reset({ reason: '' });
    this.showReprocessModal = true;
  }
  
  executeReprocess() {
    if (this.reprocessForm.invalid || !this.selectedDeposit) return;
    
    this.actionInProgress = true;
    
    const payload: ReprocessDepositPayload = {
      performedBy: this.currentAdmin,
      reason: this.reprocessForm.value.reason
    };
    
    this.service.reprocessDeposit(this.selectedDeposit._id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadDeposits();
          this.actionInProgress = false;
          this.showReprocessModal = false;
          this.selectedDeposit = null;
        },
        error: (error) => {
          console.error('Error reprocessing deposit:', error);
          this.actionInProgress = false;
        }
      });
  }
  
  cancelReprocess() {
    this.showReprocessModal = false;
    this.selectedDeposit = null;
    this.reprocessForm.reset();
  }
  
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
  
  clearFilters() {
    this.filterForm.reset({
      merchantId: '',
      endCustomerId: '',
      network: '',
      asset: '',
      status: '',
      intentCode: '',
      txHash: '',
      dateRange: { from: '', to: '' }
    });
    this.currentPage = 1;
    this.loadDeposits();
  }
  
  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadDeposits();
    }
  }
  
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadDeposits();
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadDeposits();
    }
  }
  
  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadDeposits();
  }
  
  // Helper methods
  getStatusClass(status: string): string {
    return this.statusColors[status] || 'status-unknown';
  }
  
  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'PENDING': 'fa-clock',
      'CONFIRMED': 'fa-check-circle',
      'FAILED': 'fa-times-circle',
      'REPROCESSING': 'fa-sync-alt',
      'COMPLETED': 'fa-check-double'
    };
    return icons[status] || 'fa-question-circle';
  }
  
  getNetworkColor(network: string): string {
    return this.networkColors[network] || '#6c757d';
  }
  
  getRequiredConfirmations(deposit: Deposit): number {
    return this.requiredConfirmations[deposit.network] || 12;
  }
  
  getConfirmationsProgress(deposit: Deposit): number {
    const required = this.getRequiredConfirmations(deposit);
    const progress = (deposit.confirmations / required) * 100;
    return Math.min(progress, 100);
  }
  
  getConfirmationsClass(deposit: Deposit): string {
    const progress = this.getConfirmationsProgress(deposit);
    if (progress >= 100) return 'complete';
    if (progress >= 66) return 'high';
    if (progress >= 33) return 'medium';
    return 'low';
  }
  
  getConfirmationsStatus(deposit: Deposit): string {
    const required = this.getRequiredConfirmations(deposit);
    if (deposit.confirmations >= required) {
      return 'Fully Confirmed';
    }
    return `${deposit.confirmations} / ${required}`;
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
  
  getIntentInfo(deposit: Deposit): string {
    return deposit.intentCode || deposit.intentId;
  }
  
  getErrorMessage(deposit: Deposit): string | null {
    return deposit.meta?.custody?.creditError?.message || null;
  }
  
  getErrorTime(deposit: Deposit): string | null {
    return deposit.meta?.custody?.creditError?.at || null;
  }
  
  canReprocess(deposit: Deposit): boolean {
    return deposit.status === 'FAILED' || 
           (deposit.meta?.custody?.creditError !== undefined);
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