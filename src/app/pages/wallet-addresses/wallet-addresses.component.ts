// wallet-addresses.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { 
  WalletAddress, 
  WalletAddressFilters,
  WalletAddressSummary,
  Network,
  Asset,
  AddressState,
  LeaseKind 
} from './wallet-addresses.interface';
import { CommonModule } from '@angular/common';
import { WalletAddressesService } from './wallet-addresses.service';

@Component({
  selector: 'app-wallet-addresses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './wallet-addresses.component.html',
  styleUrls: ['./wallet-addresses.component.scss']
})
export class WalletAddressesComponent implements OnInit, OnDestroy {
  // Data arrays
  walletAddresses: WalletAddress[] = [];
  filteredAddresses: WalletAddress[] = [];
  summary: WalletAddressSummary | null = null;
  
  // Enums for templates
  networks: Network[] = ['BEP20', 'TRC20', 'SOLANA', 'POLYGON'];
  assets: Asset[] = ['USDT', 'USDC'];
  addressStates: AddressState[] = ['FRESH', 'WARM', 'ASSIGNED', 'COOLING', 'LOCKED', 'RETIRED'];
  leaseKinds: LeaseKind[] = ['NONE', 'TXN', 'DEPOSIT_INTENT', 'RECONCILER'];
  
  // Sort options
  sortOptions = [
    { value: '-updatedAt', label: 'Last Updated (Newest)' },
    { value: 'updatedAt', label: 'Last Updated (Oldest)' },
    { value: '-createdAt', label: 'Created (Newest)' },
    { value: 'createdAt', label: 'Created (Oldest)' },
    { value: '-currentBalance', label: 'Balance (High to Low)' },
    { value: 'currentBalance', label: 'Balance (Low to High)' }
  ];

  // Forms
  filterForm!: FormGroup;
  
  // UI State
  loading = false;
  loadingSummary = false;
  selectedAddress: WalletAddress | null = null;
  showDetailsModal = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 50;
  totalItems = 0;
  pageSizeOptions = [10, 25, 50, 100, 200];
  
  // Destroy subject for unsubscriptions
  private destroy$ = new Subject<void>();

  Math = Math;

  constructor(
    private fb: FormBuilder,
    private service: WalletAddressesService
  ) {
    this.initFilterForm();
  }

  ngOnInit() {
    this.loadWalletAddresses();
    this.loadSummary();
    this.setupFilterSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initFilterForm() {
    this.filterForm = this.fb.group({
      q: [''],
      network: [''],
      asset: [''],
      state: [''],
      isActive: [''],
      leaseKind: [''],
      leased: [''],
      hasTokens: [''],
      pendingConsolidation: [''],
      isSweepLocked: [''],
      minBalance: [''],
      maxBalance: [''],
      sort: ['-updatedAt']
    });
  }

  private setupFilterSubscriptions() {
    // Debounced search
    this.filterForm.get('q')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadWalletAddresses();
      });

    // Immediate filters
    ['network', 'asset', 'state', 'isActive', 'leaseKind', 'leased', 
     'hasTokens', 'pendingConsolidation', 'isSweepLocked', 'sort'].forEach(field => {
      this.filterForm.get(field)?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.currentPage = 1;
          this.loadWalletAddresses();
        });
    });

    // Balance range with debounce
    ['minBalance', 'maxBalance'].forEach(field => {
      this.filterForm.get(field)?.valueChanges
        .pipe(
          debounceTime(500),
          distinctUntilChanged(),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.currentPage = 1;
          this.loadWalletAddresses();
        });
    });
  }

  loadWalletAddresses() {
    this.loading = true;
    
    const filters: any = {
      page: this.currentPage,
      limit: this.pageSize,
      ...this.filterForm.value
    };

    // Remove empty filters
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value === '' || value === null || value === undefined) {
        delete filters[key];
      }
    });

    this.service.getWalletAddresses(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.walletAddresses = response.data.items;
          this.filteredAddresses = response.data.items;
          this.totalItems = response.data.total;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading wallet addresses:', error);
          this.loading = false;
        }
      });
  }

  loadSummary() {
    this.loadingSummary = true;
    
    const network = this.filterForm.get('network')?.value || undefined;
    const asset = this.filterForm.get('asset')?.value || undefined;
    
    this.service.getWalletSummary(network, asset)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.summary = response.data;
          this.loadingSummary = false;
        },
        error: (error) => {
          console.error('Error loading summary:', error);
          this.loadingSummary = false;
        }
      });
  }

  viewAddressDetails(address: WalletAddress) {
    this.selectedAddress = address;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedAddress = null;
  }

  clearFilters() {
    this.filterForm.reset({
      q: '',
      network: '',
      asset: '',
      state: '',
      isActive: '',
      leaseKind: '',
      leased: '',
      hasTokens: '',
      pendingConsolidation: '',
      isSweepLocked: '',
      minBalance: '',
      maxBalance: '',
      sort: '-updatedAt'
    });
    this.currentPage = 1;
    this.loadWalletAddresses();
    this.loadSummary();
  }

  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadWalletAddresses();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadWalletAddresses();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadWalletAddresses();
    }
  }

  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadWalletAddresses();
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  // Helper methods
  getStateClass(state: AddressState | undefined): string {
    if (!state) return 'bg-gray-100 text-gray-800';
    
    const classes = {
      'FRESH': 'bg-gray-100 text-gray-800',
      'WARM': 'bg-yellow-100 text-yellow-800',
      'ASSIGNED': 'bg-blue-100 text-blue-800',
      'COOLING': 'bg-orange-100 text-orange-800',
      'LOCKED': 'bg-red-100 text-red-800',
      'RETIRED': 'bg-gray-700 text-white'
    };
    return classes[state] || 'bg-gray-100 text-gray-800';
  }

  formatBalance(balance: number | undefined, asset?: string): string {
    if (balance === undefined || balance === null) return '0';
    return `${balance.toFixed(2)} ${asset || ''}`;
  }

  formatDate(date: string | undefined | null): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  }

  getLeaseBadgeClass(kind: LeaseKind | undefined): string {
    if (!kind) return 'bg-gray-100 text-gray-800';
    
    const classes = {
      'NONE': 'bg-gray-100 text-gray-800',
      'TXN': 'bg-purple-100 text-purple-800',
      'DEPOSIT_INTENT': 'bg-indigo-100 text-indigo-800',
      'RECONCILER': 'bg-pink-100 text-pink-800'
    };
    return classes[kind] || 'bg-gray-100 text-gray-800';
  }

  getNetworkIcon(network: Network | undefined): string {
    if (!network) return 'fas fa-wallet';
    
    const icons = {
      'BEP20': 'fab fa-btc',
      'TRC20': 'fab fa-btc',
      'SOLANA': 'fab fa-btc',
      'POLYGON': 'fab fa-btc'
    };
    return icons[network] || 'fas fa-wallet';
  }
}