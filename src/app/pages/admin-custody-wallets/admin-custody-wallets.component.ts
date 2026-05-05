// admin-custody-wallets.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import {
  CustodyWallet,
  WalletFilters,
  UpdateWalletStatusPayload,
  UpdateWalletLimitsPayload
} from './admin-custody-wallets.interface';
import { AdminCustodyWalletsService } from './admin-custody-wallets.service';

@Component({
  selector: 'app-admin-custody-wallets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-custody-wallets.component.html',
  styleUrls: ['./admin-custody-wallets.component.scss']
})
export class AdminCustodyWalletsComponent implements OnInit, OnDestroy {
  // Data
  wallets: CustodyWallet[] = [];
  selectedWallet: CustodyWallet | null = null;
  Math = Math;
  
  // Forms
  filterForm!: FormGroup;
  statusForm!: FormGroup;
  limitsForm!: FormGroup;
  
  // UI State
  loading = false;
  showFilters = false;
  showViewModal = false;
  showStatusModal = false;
  showLimitsModal = false;
  actionInProgress = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;
  pageSizeOptions = [10, 20, 50, 100];
  
  // Filters state
  statusOptions = ['ACTIVE', 'FROZEN', 'CLOSED', 'MAINTENANCE'];
  custodyModeOptions = ['SEGREGATED', 'OMNIBUS'];
  
  // Destroy subject
  private destroy$ = new Subject<void>();
  
  // Current admin user
  currentAdmin = 'admin@doronpay.com';
  
  // Computed properties for stats
  get activeWalletsCount(): number {
    return this.wallets.filter(w => w.status === 'ACTIVE').length;
  }

  get segregatedWalletsCount(): number {
    return this.wallets.filter(w => w.custodyMode === 'SEGREGATED').length;
  }

  get omnibusWalletsCount(): number {
    return this.wallets.filter(w => w.custodyMode === 'OMNIBUS').length;
  }
  
  constructor(
    private fb: FormBuilder,
    private service: AdminCustodyWalletsService
  ) {
    this.initFilterForm();
    this.initStatusForm();
    this.initLimitsForm();
  }
  
  ngOnInit() {
    this.loadWallets();
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
      status: [''],
      custodyMode: [''],
      search: ['']
    });
  }
  
  private initStatusForm() {
    this.statusForm = this.fb.group({
      status: ['', Validators.required],
      reason: ['', Validators.required]
    });
  }
  
  private initLimitsForm() {
    this.limitsForm = this.fb.group({
      dailyLimit: [null],
      monthlyLimit: [null],
      perTransactionLimit: [null],
      reason: ['']
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
        this.loadWallets();
      });
  }
  
  loadWallets() {
    this.loading = true;
    
    const filters: WalletFilters = {
      ...this.filterForm.value,
      page: this.currentPage,
      limit: this.pageSize
    };
    
    // Remove empty values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof WalletFilters] === '' || filters[key as keyof WalletFilters] === undefined) {
        delete filters[key as keyof WalletFilters];
      }
    });
    
    this.service.listWallets(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.wallets = response.data.items;
          this.totalItems = response.data.total;
          this.totalPages = response.data.pages;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading wallets:', error);
          this.loading = false;
        }
      });
  }
  
  viewWalletDetails(wallet: CustodyWallet) {
    this.selectedWallet = wallet;
    this.showViewModal = true;
  }
  
  closeViewModal() {
    this.showViewModal = false;
    this.selectedWallet = null;
  }
  
  openStatusModal(wallet: CustodyWallet) {
    this.selectedWallet = wallet;
    this.statusForm.patchValue({
      status: wallet.status,
      reason: ''
    });
    this.showStatusModal = true;
  }
  
  updateStatus() {
    if (this.statusForm.invalid || !this.selectedWallet) return;
    
    this.actionInProgress = true;
    const payload: UpdateWalletStatusPayload = {
      status: this.statusForm.value.status,
      reason: this.statusForm.value.reason,
      performedBy: this.currentAdmin
    };
    
    this.service.updateWalletStatus(this.selectedWallet._id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadWallets();
          this.actionInProgress = false;
          this.showStatusModal = false;
          this.selectedWallet = null;
        },
        error: (error) => {
          console.error('Error updating wallet status:', error);
          this.actionInProgress = false;
        }
      });
  }
  
  openLimitsModal(wallet: CustodyWallet) {
    this.selectedWallet = wallet;
    this.limitsForm.patchValue({
      reason: ''
    });
    this.showLimitsModal = true;
  }
  
  updateLimits() {
    if (!this.selectedWallet) return;
    
    this.actionInProgress = true;
    const payload: UpdateWalletLimitsPayload = {
      dailyLimit: this.limitsForm.value.dailyLimit,
      monthlyLimit: this.limitsForm.value.monthlyLimit,
      perTransactionLimit: this.limitsForm.value.perTransactionLimit,
      performedBy: this.currentAdmin,
      reason: this.limitsForm.value.reason
    };
    
    this.service.updateWalletLimits(this.selectedWallet._id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadWallets();
          this.actionInProgress = false;
          this.showLimitsModal = false;
          this.selectedWallet = null;
        },
        error: (error) => {
          console.error('Error updating wallet limits:', error);
          this.actionInProgress = false;
        }
      });
  }
  
  cancelStatusModal() {
    this.showStatusModal = false;
    this.selectedWallet = null;
    this.statusForm.reset();
  }
  
  cancelLimitsModal() {
    this.showLimitsModal = false;
    this.selectedWallet = null;
    this.limitsForm.reset();
  }
  
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
  
  clearFilters() {
    this.filterForm.reset({
      merchantId: '',
      endCustomerId: '',
      status: '',
      custodyMode: '',
      search: ''
    });
    this.currentPage = 1;
    this.loadWallets();
  }
  
  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadWallets();
    }
  }
  
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadWallets();
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadWallets();
    }
  }
  
  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadWallets();
  }
  
  // Helper methods
  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'ACTIVE': 'status-active',
      'FROZEN': 'status-frozen',
      'CLOSED': 'status-closed',
      'MAINTENANCE': 'status-maintenance'
    };
    return classes[status] || 'status-unknown';
  }
  
  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'ACTIVE': 'fa-check-circle',
      'FROZEN': 'fa-snowflake',
      'CLOSED': 'fa-ban',
      'MAINTENANCE': 'fa-tools'
    };
    return icons[status] || 'fa-question-circle';
  }
  
  getCustodyModeClass(mode: string): string {
    const classes: Record<string, string> = {
      'SEGREGATED': 'mode-segregated',
      'OMNIBUS': 'mode-omnibus'
    };
    return classes[mode] || 'mode-unknown';
  }
  
  getCustodyModeIcon(mode: string): string {
    const icons: Record<string, string> = {
      'SEGREGATED': 'fa-layer-group',
      'OMNIBUS': 'fa-users'
    };
    return icons[mode] || 'fa-wallet';
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