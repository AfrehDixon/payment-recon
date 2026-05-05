// admin-withdrawals.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import {
  Withdrawal,
  WithdrawalFilters,
  WithdrawalActionPayload
} from './admin-withdrawals.interface';
import { AdminWithdrawalsService } from './admin-withdrawals.service';

@Component({
  selector: 'app-admin-withdrawals',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-withdrawals.component.html',
  styleUrls: ['./admin-withdrawals.component.scss']
})
export class AdminWithdrawalsComponent implements OnInit, OnDestroy {
  // Data
  withdrawals: Withdrawal[] = [];
  selectedWithdrawal: Withdrawal | null = null;
  Math = Math;
  showRawData = false;
  
  // Forms
  filterForm!: FormGroup;
  actionForm!: FormGroup;
  
  // UI State
  loading = false;
  showFilters = false;
  showViewModal = false;
  showActionModal = false;
  actionInProgress = false;
  currentAction: 'retry' | 'cancel' | 'processing' | 'sent' | 'failed' | null = null;
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;
  pageSizeOptions = [10, 20, 50, 100];
  
  // Filters state
  statusOptions = ['PENDING', 'PROCESSING', 'APPROVED', 'SENT', 'COMPLETED', 'FAILED', 'CANCELLED'];
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
  
  // Status colors
  private statusColors: Record<string, string> = {
    'PENDING': 'status-pending',
    'PROCESSING': 'status-processing',
    'APPROVED': 'status-approved',
    'SENT': 'status-sent',
    'COMPLETED': 'status-completed',
    'FAILED': 'status-failed',
    'CANCELLED': 'status-cancelled'
  };
  
  // Valid currencies for formatting
  private validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'AUD', 'CNY', 'INR', 'BRL', 'GHS', 'NGN', 'ZAR'];
  
  // Computed properties for stats
  get totalWithdrawals(): number {
    return this.totalItems;
  }
  
  get totalVolume(): number {
    return this.withdrawals.reduce((sum, w) => sum + w.amount, 0);
  }
  
  get totalFees(): number {
    return this.withdrawals.reduce((sum, w) => sum + (w.feeAmount || 0), 0);
  }
  
  get pendingCount(): number {
    return this.withdrawals.filter(w => w.status === 'PENDING').length;
  }
  
  get processingCount(): number {
    return this.withdrawals.filter(w => w.status === 'PROCESSING').length;
  }
  
  get approvedCount(): number {
    return this.withdrawals.filter(w => w.status === 'APPROVED').length;
  }
  
  get sentCount(): number {
    return this.withdrawals.filter(w => w.status === 'SENT').length;
  }
  
  get completedCount(): number {
    return this.withdrawals.filter(w => w.status === 'COMPLETED').length;
  }
  
  get failedCount(): number {
    return this.withdrawals.filter(w => w.status === 'FAILED').length;
  }
  
  constructor(
    private fb: FormBuilder,
    private service: AdminWithdrawalsService
  ) {
    this.initFilterForm();
    this.initActionForm();
  }
  
  ngOnInit() {
    this.loadWithdrawals();
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
      assetWalletId: [''],
      network: [''],
      asset: [''],
      status: [''],
      destinationAddress: [''],
      dateRange: this.fb.group({
        from: [''],
        to: ['']
      })
    });
  }
  
  private initActionForm() {
    this.actionForm = this.fb.group({
      reason: ['', Validators.required],
      txHash: [''],
      refund: [false],
      metadata: this.fb.group({
        notes: ['']
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
        this.loadWithdrawals();
      });
  }
  
  loadWithdrawals() {
    this.loading = true;
    
    const formValue = this.filterForm.value;
    const filters: WithdrawalFilters = {
      page: this.currentPage,
      limit: this.pageSize
    };
    
    if (formValue.merchantId) filters.merchantId = formValue.merchantId;
    if (formValue.endCustomerId) filters.endCustomerId = formValue.endCustomerId;
    if (formValue.assetWalletId) filters.assetWalletId = formValue.assetWalletId;
    if (formValue.network) filters.network = formValue.network;
    if (formValue.asset) filters.asset = formValue.asset;
    if (formValue.status) filters.status = formValue.status;
    if (formValue.destinationAddress) filters.destinationAddress = formValue.destinationAddress;
    
    if (formValue.dateRange?.from) {
      filters.fromDate = new Date(formValue.dateRange.from).toISOString();
    }
    if (formValue.dateRange?.to) {
      filters.toDate = new Date(formValue.dateRange.to).toISOString();
    }
    
    this.service.listWithdrawals(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.withdrawals = response.data.items;
          this.totalItems = response.data.total;
          this.totalPages = response.data.pages;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading withdrawals:', error);
          this.loading = false;
        }
      });
  }
  
  viewWithdrawalDetails(withdrawal: Withdrawal) {
    this.selectedWithdrawal = withdrawal;
    this.showViewModal = true;
  }
  
  closeViewModal() {
    this.showViewModal = false;
    this.selectedWithdrawal = null;
  }
  
  openActionModal(action: 'retry' | 'cancel' | 'processing' | 'sent' | 'failed', withdrawal: Withdrawal) {
    this.currentAction = action;
    this.selectedWithdrawal = withdrawal;
    this.actionForm.reset({ 
      reason: '', 
      txHash: '', 
      refund: false, 
      metadata: { notes: '' } 
    });
    
    if (action === 'sent') {
      this.actionForm.get('txHash')?.setValidators([Validators.required]);
    } else {
      this.actionForm.get('txHash')?.clearValidators();
    }
    this.actionForm.get('txHash')?.updateValueAndValidity();
    
    this.showActionModal = true;
  }
  
  executeAction() {
    if (this.actionForm.invalid || !this.selectedWithdrawal || !this.currentAction) return;
    
    this.actionInProgress = true;
    
    const payload: WithdrawalActionPayload = {
      performedBy: this.currentAdmin,
      reason: this.actionForm.value.reason,
      metadata: {
        notes: this.actionForm.value.metadata.notes,
        action: this.currentAction
      }
    };
    
    if (this.currentAction === 'sent') {
      payload.txHash = this.actionForm.value.txHash;
    }
    
    if (this.currentAction === 'failed') {
      payload.refund = this.actionForm.value.refund;
    }
    
    let request;
    switch (this.currentAction) {
      case 'retry':
        request = this.service.retryWithdrawal(this.selectedWithdrawal._id, payload);
        break;
      case 'cancel':
        request = this.service.cancelWithdrawal(this.selectedWithdrawal._id, payload);
        break;
      case 'processing':
        request = this.service.markWithdrawalProcessing(this.selectedWithdrawal._id, payload);
        break;
      case 'sent':
        request = this.service.markWithdrawalSent(this.selectedWithdrawal._id, payload);
        break;
      case 'failed':
        request = this.service.markWithdrawalFailed(this.selectedWithdrawal._id, payload);
        break;
      default:
        return;
    }
    
    request.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadWithdrawals();
          this.actionInProgress = false;
          this.showActionModal = false;
          this.selectedWithdrawal = null;
          this.currentAction = null;
        },
        error: (error) => {
          console.error(`Error performing ${this.currentAction} action:`, error);
          this.actionInProgress = false;
        }
      });
  }
  
  cancelActionModal() {
    this.showActionModal = false;
    this.selectedWithdrawal = null;
    this.currentAction = null;
    this.actionForm.reset();
  }
  
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
  
  clearFilters() {
    this.filterForm.reset({
      merchantId: '',
      endCustomerId: '',
      assetWalletId: '',
      network: '',
      asset: '',
      status: '',
      destinationAddress: '',
      dateRange: { from: '', to: '' }
    });
    this.currentPage = 1;
    this.loadWithdrawals();
  }
  
  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadWithdrawals();
    }
  }
  
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadWithdrawals();
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadWithdrawals();
    }
  }
  
  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadWithdrawals();
  }
  
  // Helper methods
  getStatusClass(status: string): string {
    return this.statusColors[status] || 'status-unknown';
  }
  
  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'PENDING': 'fa-clock',
      'PROCESSING': 'fa-spinner',
      'APPROVED': 'fa-check-circle',
      'SENT': 'fa-paper-plane',
      'COMPLETED': 'fa-check-double',
      'FAILED': 'fa-times-circle',
      'CANCELLED': 'fa-ban'
    };
    return icons[status] || 'fa-question-circle';
  }
  
  getNetworkColor(network: string): string {
    return this.networkColors[network] || '#6c757d';
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
  
  canPerformAction(withdrawal: Withdrawal, action: string): boolean {
    switch (action) {
      case 'retry':
        return withdrawal.status === 'FAILED';
      case 'cancel':
        return withdrawal.status === 'PENDING';
      case 'processing':
        return withdrawal.status === 'PENDING' || withdrawal.status === 'APPROVED';
      case 'sent':
        return withdrawal.status === 'PROCESSING';
      case 'failed':
        return ['PENDING', 'PROCESSING', 'APPROVED'].includes(withdrawal.status);
      default:
        return false;
    }
  }
  
  getActionButtonLabel(action: string): string {
    const labels: Record<string, string> = {
      'retry': 'Retry',
      'cancel': 'Cancel',
      'processing': 'Mark Processing',
      'sent': 'Mark Sent',
      'failed': 'Mark Failed'
    };
    return labels[action] || action;
  }
  
  getActionModalTitle(): string {
    if (!this.currentAction || !this.selectedWithdrawal) return 'Action';
    const titles: Record<string, string> = {
      'retry': 'Retry Withdrawal',
      'cancel': 'Cancel Withdrawal',
      'processing': 'Mark as Processing',
      'sent': 'Mark as Sent',
      'failed': 'Mark as Failed'
    };
    return titles[this.currentAction];
  }
  
  getActionWarning(): string | null {
    if (!this.currentAction) return null;
    const warnings: Record<string, string> = {
      'retry': 'This will attempt to process the withdrawal again.',
      'cancel': 'This will cancel the withdrawal and release any locked funds.',
      'processing': 'This will mark the withdrawal as being processed.',
      'sent': 'This will mark the withdrawal as sent to the blockchain.',
      'failed': 'This will mark the withdrawal as failed. Funds may be refunded.'
    };
    return warnings[this.currentAction];
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