// admin-addresses.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import {
  CustodyAddress,
  AddressFilters,
  AddressActionPayload
} from './admin-addresses.interface';
import { AdminAddressesService } from './admin-addresses.service';

@Component({
  selector: 'app-admin-addresses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-addresses.component.html',
  styleUrls: ['./admin-addresses.component.scss']
})
export class AdminAddressesComponent implements OnInit, OnDestroy {
  // Data
  addresses: CustodyAddress[] = [];
  selectedAddress: CustodyAddress | null = null;
  Math = Math;
  
  // Forms
  filterForm!: FormGroup;
  actionForm!: FormGroup;
  
  // UI State
  loading = false;
  showFilters = false;
  showViewModal = false;
  showActionModal = false;
  actionInProgress = false;
  currentAction: 'lock' | 'unlock' | 'retire' | 'unretire' | 'sweep' | null = null;
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;
  pageSizeOptions = [10, 20, 50, 100];
  
  // Filters state
  stateOptions = ['ASSIGNED', 'WARM', 'RETIRED', 'LOCKED'];
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
  
  // State colors
  private stateColors: Record<string, string> = {
    'ASSIGNED': 'state-assigned',
    'WARM': 'state-warm',
    'RETIRED': 'state-retired',
    'LOCKED': 'state-locked'
  };
  
  // Computed properties for stats
  get assignedCount(): number {
    return this.addresses.filter(a => a.state === 'ASSIGNED').length;
  }
  
  get warmCount(): number {
    return this.addresses.filter(a => a.state === 'WARM').length;
  }
  
  get retiredCount(): number {
    return this.addresses.filter(a => a.state === 'RETIRED').length;
  }
  
  get lockedCount(): number {
    return this.addresses.filter(a => a.addressLocked).length;
  }
  
  get addressesWithBalance(): number {
    return this.addresses.filter(a => a.currentBalance > 0).length;
  }
  
  constructor(
    private fb: FormBuilder,
    private service: AdminAddressesService
  ) {
    this.initFilterForm();
    this.initActionForm();
  }
  
  ngOnInit() {
    this.loadAddresses();
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
      custodyWalletId: [''],
      assetWalletId: [''],
      network: [''],
      asset: [''],
      state: [''],
      search: ['']
    });
  }
  
  private initActionForm() {
    this.actionForm = this.fb.group({
      reason: ['', Validators.required],
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
        this.loadAddresses();
      });
  }
  
  loadAddresses() {
    this.loading = true;
    
    const filters: AddressFilters = {
      ...this.filterForm.value,
      page: this.currentPage,
      limit: this.pageSize
    };
    
    // Remove empty values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof AddressFilters] === '' || filters[key as keyof AddressFilters] === undefined) {
        delete filters[key as keyof AddressFilters];
      }
    });
    
    this.service.listAddresses(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.addresses = response.data.items;
          this.totalItems = response.data.total;
          this.totalPages = response.data.pages;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading addresses:', error);
          this.loading = false;
        }
      });
  }
  
  viewAddressDetails(address: CustodyAddress) {
    this.selectedAddress = address;
    this.showViewModal = true;
  }
  
  closeViewModal() {
    this.showViewModal = false;
    this.selectedAddress = null;
  }
  
  openActionModal(action: 'lock' | 'unlock' | 'retire' | 'unretire' | 'sweep', address: CustodyAddress) {
    this.currentAction = action;
    this.selectedAddress = address;
    this.actionForm.reset({ reason: '', metadata: { notes: '' } });
    this.showActionModal = true;
  }
  
  executeAction() {
    if (this.actionForm.invalid || !this.selectedAddress || !this.currentAction) return;
    
    this.actionInProgress = true;
    
    const payload: AddressActionPayload = {
      reason: this.actionForm.value.reason,
      performedBy: this.currentAdmin,
      metadata: {
        notes: this.actionForm.value.metadata.notes,
        action: this.currentAction
      }
    };
    
    let request;
    switch (this.currentAction) {
      case 'lock':
        request = this.service.lockAddress(this.selectedAddress._id, payload);
        break;
      case 'unlock':
        request = this.service.unlockAddress(this.selectedAddress._id, payload);
        break;
      case 'retire':
        request = this.service.retireAddress(this.selectedAddress._id, payload);
        break;
      case 'unretire':
        request = this.service.unretireAddress(this.selectedAddress._id, payload);
        break;
      case 'sweep':
        request = this.service.forceSweepAddress(this.selectedAddress._id, payload);
        break;
      default:
        return;
    }
    
    request.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadAddresses();
          this.actionInProgress = false;
          this.showActionModal = false;
          this.selectedAddress = null;
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
    this.selectedAddress = null;
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
      custodyWalletId: '',
      assetWalletId: '',
      network: '',
      asset: '',
      state: '',
      search: ''
    });
    this.currentPage = 1;
    this.loadAddresses();
  }
  
  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadAddresses();
    }
  }
  
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadAddresses();
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadAddresses();
    }
  }
  
  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadAddresses();
  }
  
  // Helper methods
  getStateClass(state: string): string {
    return this.stateColors[state] || 'state-unknown';
  }
  
  getStateIcon(state: string): string {
    const icons: Record<string, string> = {
      'ASSIGNED': 'fa-check-circle',
      'WARM': 'fa-fire',
      'RETIRED': 'fa-flag-checkered',
      'LOCKED': 'fa-lock'
    };
    return icons[state] || 'fa-question-circle';
  }
  
  getNetworkColor(network: string): string {
    return this.networkColors[network] || '#6c757d';
  }
  
  formatCurrency(value: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
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
  
  canPerformAction(address: CustodyAddress, action: string): boolean {
    switch (action) {
      case 'lock':
        return !address.addressLocked && address.state !== 'RETIRED';
      case 'unlock':
        return address.addressLocked;
      case 'retire':
        return address.state !== 'RETIRED';
      case 'unretire':
        return address.state === 'RETIRED';
      case 'sweep':
        return address.currentBalance > 0 && address.state !== 'RETIRED';
      default:
        return false;
    }
  }
  
  getActionButtonLabel(action: string): string {
    const labels: Record<string, string> = {
      'lock': 'Lock',
      'unlock': 'Unlock',
      'retire': 'Retire',
      'unretire': 'Unretire',
      'sweep': 'Force Sweep'
    };
    return labels[action] || action;
  }
  
  getActionModalTitle(): string {
    if (!this.currentAction || !this.selectedAddress) return 'Action';
    const titles: Record<string, string> = {
      'lock': 'Lock Address',
      'unlock': 'Unlock Address',
      'retire': 'Retire Address',
      'unretire': 'Unretire Address',
      'sweep': 'Force Sweep Address'
    };
    return titles[this.currentAction];
  }
  
  getActionWarning(): string | null {
    if (!this.currentAction) return null;
    const warnings: Record<string, string> = {
      'lock': 'Locking this address will prevent all transactions.',
      'unlock': 'Unlocking will restore normal operation of this address.',
      'retire': 'Retiring this address will mark it as inactive for future use.',
      'unretire': 'Unretiring will reactivate this address.',
      'sweep': 'Force sweep will move all funds from this address to the vault. This action cannot be undone.'
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