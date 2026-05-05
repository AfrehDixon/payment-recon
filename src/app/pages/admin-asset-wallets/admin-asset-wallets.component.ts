// admin-asset-wallets.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import {
  AssetWallet,
  AssetWalletFilters,
  UpdateAssetWalletStatusPayload
} from './admin-asset-wallets.interface';
import { AdminAssetWalletsService } from './admin-asset-wallets.service';

@Component({
  selector: 'app-admin-asset-wallets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-asset-wallets.component.html',
  styleUrls: ['./admin-asset-wallets.component.scss']
})
export class AdminAssetWalletsComponent implements OnInit, OnDestroy {
  // Data
  assetWallets: AssetWallet[] = [];
  selectedWallet: AssetWallet | null = null;
  Math = Math;
  
  // Forms
  filterForm!: FormGroup;
  statusForm!: FormGroup;
  
  // UI State
  loading = false;
  showFilters = false;
  showViewModal = false;
  showStatusModal = false;
  actionInProgress = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;
  pageSizeOptions = [10, 20, 50, 100];
  
  // Filters state
  statusOptions = ['ACTIVE', 'FROZEN', 'MAINTENANCE', 'CLOSED'];
  networkOptions = ['TRC20', 'BEP20', 'SOLANA', 'POLYGON', 'ERC20', 'BTC', 'ETH'];
  
  // Destroy subject
  private destroy$ = new Subject<void>();
  
  // Current admin user
  currentAdmin = 'admin@doronpay.com';
  
  // Valid currencies for formatting
  private validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'AUD', 'CNY', 'INR', 'BRL', 'GHS', 'NGN', 'ZAR'];
  
  // Asset and Network colors
  private assetColors: Record<string, string> = {
    'USDT': '#26a17b',
    'USDC': '#2775ca',
    'BTC': '#f7931a',
    'ETH': '#627eea',
    'DAI': '#f5ac37',
    'BUSD': '#f0b90b'
  };
  
  private networkColors: Record<string, string> = {
    'TRC20': '#e74c3c',
    'BEP20': '#f0b90b',
    'SOLANA': '#14f195',
    'POLYGON': '#8247e5',
    'ERC20': '#627eea',
    'BTC': '#f7931a',
    'ETH': '#627eea'
  };
  
  // Computed properties for stats
  get totalBalance(): number {
    return this.assetWallets.reduce((sum, w) => sum + w.ledgerBalance, 0);
  }
  
  get activeWalletsCount(): number {
    return this.assetWallets.filter(w => w.status === 'ACTIVE').length;
  }
  
  get totalDeposited(): number {
    return this.assetWallets.reduce((sum, w) => sum + w.totalDeposited, 0);
  }
  
  get totalWithdrawn(): number {
    return this.assetWallets.reduce((sum, w) => sum + w.totalWithdrawn, 0);
  }
  
  get getUniqueAssets(): string[] {
    return [...new Set(this.assetWallets.map(w => w.asset))];
  }
  
  get getUniqueNetworks(): string[] {
    return [...new Set(this.assetWallets.map(w => w.network))];
  }
  
  constructor(
    private fb: FormBuilder,
    private service: AdminAssetWalletsService
  ) {
    this.initFilterForm();
    this.initStatusForm();
  }
  
  ngOnInit() {
    this.loadAssetWallets();
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
      network: [''],
      asset: [''],
      status: [''],
      search: ['']
    });
  }
  
  private initStatusForm() {
    this.statusForm = this.fb.group({
      status: ['', Validators.required],
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
        this.loadAssetWallets();
      });
  }
  
  loadAssetWallets() {
    this.loading = true;
    
    const filters: AssetWalletFilters = {
      ...this.filterForm.value,
      page: this.currentPage,
      limit: this.pageSize
    };
    
    // Remove empty values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof AssetWalletFilters] === '' || filters[key as keyof AssetWalletFilters] === undefined) {
        delete filters[key as keyof AssetWalletFilters];
      }
    });
    
    this.service.listAssetWallets(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.assetWallets = response.data.items;
          this.totalItems = response.data.total;
          this.totalPages = response.data.pages;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading asset wallets:', error);
          this.loading = false;
        }
      });
  }
  
  viewWalletDetails(wallet: AssetWallet) {
    this.selectedWallet = wallet;
    this.showViewModal = true;
  }
  
  closeViewModal() {
    this.showViewModal = false;
    this.selectedWallet = null;
  }
  
  openStatusModal(wallet: AssetWallet) {
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
    const payload: UpdateAssetWalletStatusPayload = {
      status: this.statusForm.value.status,
      reason: this.statusForm.value.reason,
      performedBy: this.currentAdmin
    };
    
    this.service.updateAssetWalletStatus(this.selectedWallet._id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadAssetWallets();
          this.actionInProgress = false;
          this.showStatusModal = false;
          this.selectedWallet = null;
        },
        error: (error) => {
          console.error('Error updating asset wallet status:', error);
          this.actionInProgress = false;
        }
      });
  }
  
  cancelStatusModal() {
    this.showStatusModal = false;
    this.selectedWallet = null;
    this.statusForm.reset();
  }
  
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
  
  clearFilters() {
    this.filterForm.reset({
      merchantId: '',
      endCustomerId: '',
      custodyWalletId: '',
      network: '',
      asset: '',
      status: '',
      search: ''
    });
    this.currentPage = 1;
    this.loadAssetWallets();
  }
  
  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadAssetWallets();
    }
  }
  
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadAssetWallets();
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadAssetWallets();
    }
  }
  
  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadAssetWallets();
  }
  
  // Helper methods
  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'ACTIVE': 'status-active',
      'FROZEN': 'status-frozen',
      'MAINTENANCE': 'status-maintenance',
      'CLOSED': 'status-closed'
    };
    return classes[status] || 'status-unknown';
  }
  
  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'ACTIVE': 'fa-check-circle',
      'FROZEN': 'fa-snowflake',
      'MAINTENANCE': 'fa-tools',
      'CLOSED': 'fa-ban'
    };
    return icons[status] || 'fa-question-circle';
  }
  
  getAssetColor(asset: string): string {
    return this.assetColors[asset] || '#4CAF50';
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
        minimumFractionDigits: 2,
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