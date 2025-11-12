import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
} from '@angular/common/http';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Store } from '@ngxs/store';
import { AuthState } from '../../state/apps/app.states';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

interface DepositAddress {
  _id?: string;
  address: string;
  index: number;
  derivationPath?: string;
  status: 'FRESH' | 'ASSIGNED' | 'WARM' | 'LOCKED' | 'RETIRED';
  currentBalance: number;
  pendingConsolidation: boolean;
  trxDust?: number;
  minTrxDustNeeded?: number;
  minConsolidateUsd: number;
  maxAddressAgeHours?: number;
  reuseCount?: number;
  totalReceived?: number;
  lastTrxSweepAmount?: number;
  lastTrxSweepStatus?: string;
  consolidationAttempts?: number;
  createdAt?: string;
  updatedAt?: string;
  lastUsedAt?: string;
  addressLocked?: boolean;
  openTransactionId: string | null;
  reservedAmount?: number;
  reservationExpiresAt?: string;
  retiredAt?: string;
  retiredReason?: string;
  consolidationError?: any;
  assignedToMerchantId?: string | null;
  __v?: number;
}

interface DepositAddressResponse {
  success: boolean;
  operator: string;
  chain: string;
  currency: string;
  page: number;
  pageSize: number;
  total: number;
  items: DepositAddress[];
}

interface BulkRetireResponse {
  success: boolean;
  message: string;
  retiredCount?: number;
  affectedAddresses?: string[];
  dryRun?: boolean;
}

interface StatusUpdateResponse {
  success: boolean;
  message: string;
  address?: string;
  previousStatus?: string;
  newStatus?: string;
}

@Component({
  selector: 'app-deposit-addresses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './deposit-addresses.component.html',
  styleUrls: ['./deposit-addresses.component.scss'],
})
export class DepositAddressesComponent implements OnInit, OnDestroy {
  depositAddresses: DepositAddress[] = [];
  loading = false;
  error: string | null = null;
  success: string | null = null;
  hasSearched = false;

  // Filter properties
  filterForm: FormGroup;
  bulkRetireForm: FormGroup;
  statusUpdateForm: FormGroup;

  // Pagination properties
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;
  pageSizeOptions = [10, 20, 50, 100, 200];

  // Operator options
  operatorOptions = ['TRC20', 'BEP20', 'SOLANA'];

  // Status options
  statusOptions = ['FRESH', 'ASSIGNED', 'WARM', 'LOCKED', 'RETIRED'];
  statusUpdateOptions = ['FRESH', 'ASSIGNED', 'WARM', 'LOCKED', 'RETIRED'];

  // Response data
  operator: string = '';
  chain: string = '';
  currency: string = '';

  // Modal states
  showBulkRetireModal = false;
  showStatusUpdateModal = false;
  selectedAddress: DepositAddress | null = null;
  bulkRetireLoading = false;
  statusUpdateLoading = false;

  // Token subscription
  private tokenSubscription: Subscription | null = null;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private store: Store
  ) {
    this.filterForm = this.fb.group({
      operator: ['', Validators.required],
      status: [''],
      onlyOpen: [false],
      pendingConsolidation: [false],
      includeRetired: [false],
      address: [''],
      merchantId: [''],
    });

    this.bulkRetireForm = this.fb.group({
      operator: ['', Validators.required],
      onlyUnused: [true],
      includeStatuses: [[]],
      excludeStatuses: [[]],
      address: [''],
      merchantId: [''],
      dryRun: [false],
    });

    this.statusUpdateForm = this.fb.group({
      status: ['', Validators.required],
      pendingConsolidation: [false],
      minConsolidateUsd: [0],
      currentBalance: [0],
      // openTransactionId: [''],
      // assignedToMerchantId: [''],
      reason: [''],
    });
  }

  ngOnInit(): void {
    this.tokenSubscription = this.store
      .select(AuthState.token)
      .subscribe(() => {
        if (this.hasSearched && this.filterForm.get('operator')?.value) {
          this.loadDepositAddresses();
        }
      });

    // Sync operator from filter form to bulk retire form
    this.filterForm.get('operator')?.valueChanges.subscribe((operator) => {
      if (operator) {
        this.bulkRetireForm.patchValue({ operator });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.tokenSubscription) {
      this.tokenSubscription.unsubscribe();
    }
  }

  private getHeaders(): HttpHeaders {
    const token = this.store.selectSnapshot(AuthState.token);
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  buildQueryParams(): any {
    const formValue = this.filterForm.value;
    const params: any = {
      operator: formValue.operator,
      page: this.currentPage,
      limit: this.pageSize,
    };

    if (formValue.status) {
      params.status = formValue.status;
    }
    if (formValue.onlyOpen) {
      params.onlyOpen = formValue.onlyOpen;
    }
    if (formValue.pendingConsolidation) {
      params.pendingConsolidation = formValue.pendingConsolidation;
    }
    if (formValue.includeRetired) {
      params.includeRetired = formValue.includeRetired;
    }
    if (formValue.address) {
      params.address = formValue.address;
    }
    if (formValue.merchantId) {
      params.merchantId = formValue.merchantId;
    }

    return params;
  }

  loadDepositAddresses(): void {
    if (this.filterForm.invalid) {
      this.error = 'Please select an operator first';
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;
    this.hasSearched = true;

    const params = this.buildQueryParams();

    this.http
      .get<DepositAddressResponse>(
        'https://doronpay.com/api/transactions/deposit-addresses',
        {
          headers: this.getHeaders(),
          params: params,
        }
      )
      .subscribe({
        next: (response) => {
          console.log('API Response:', response);
          if (response.success) {
            this.depositAddresses = response.items;
            this.totalItems = response.total;
            this.totalPages = Math.ceil(this.totalItems / this.pageSize);
            this.currentPage = response.page;
            this.pageSize = response.pageSize;
            this.operator = response.operator;
            this.chain = response.chain;
            this.currency = response.currency;
          } else {
            this.error = 'Failed to load deposit addresses';
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('API Error:', error);
          this.error =
            error.error?.message || 'Failed to load deposit addresses';
          this.loading = false;
        },
      });
  }

  // Bulk Retire Methods
  openBulkRetireModal(): void {
    if (!this.filterForm.get('operator')?.value) {
      this.error = 'Please select an operator first';
      return;
    }
    this.bulkRetireForm.patchValue({
      operator: this.filterForm.get('operator')?.value,
      onlyUnused: true,
      dryRun: false,
    });
    this.showBulkRetireModal = true;
    this.error = null;
    this.success = null;
  }

  closeBulkRetireModal(): void {
    this.showBulkRetireModal = false;
    this.bulkRetireForm.reset({
      onlyUnused: true,
      dryRun: false,
    });
  }

  onBulkRetireSubmit(): void {
    if (this.bulkRetireForm.invalid) {
      return;
    }

    this.bulkRetireLoading = true;
    this.error = null;
    this.success = null;

    const params = this.bulkRetireForm.value;

    this.http
      .post<BulkRetireResponse>(
        'https://doronpay.com/api/transactions/deposit-addresses/retire-all',
        {},
        {
          headers: this.getHeaders(),
          params: params,
        }
      )
      .subscribe({
        next: (response) => {
          this.bulkRetireLoading = false;
          if (response.success) {
            if (response.dryRun) {
              this.success = `Dry run: ${response.retiredCount} addresses would be retired`;
            } else {
              this.success = `Successfully retired ${response.retiredCount} addresses`;
              this.loadDepositAddresses(); // Refresh the list
            }
            this.closeBulkRetireModal();
          } else {
            this.error = response.message || 'Failed to retire addresses';
          }
        },
        error: (error) => {
          this.bulkRetireLoading = false;
          console.error('Bulk retire error:', error);
          this.error = error.error?.message || 'Failed to retire addresses';
        },
      });
  }

  // Status Update Methods
  openStatusUpdateModal(address: DepositAddress): void {
    this.selectedAddress = address;
    this.statusUpdateForm.patchValue({
      status: address.status,
      pendingConsolidation: address.pendingConsolidation,
      minConsolidateUsd: address.minConsolidateUsd,
      currentBalance: address.currentBalance,
      openTransactionId: address.openTransactionId || '',
      assignedToMerchantId: address.assignedToMerchantId || '',
      reason: '',
    });
    this.showStatusUpdateModal = true;
    this.error = null;
    this.success = null;
  }

  closeStatusUpdateModal(): void {
    this.showStatusUpdateModal = false;
    this.selectedAddress = null;
    this.statusUpdateForm.reset({
      status: '',
      pendingConsolidation: false,
      minConsolidateUsd: 0,
      currentBalance: 0,
      openTransactionId: '',
      assignedToMerchantId: '',
      reason: '',
    });
  }

  // Format date for display
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  }

  // Check if address is expired
  isAddressExpired(address: DepositAddress): boolean {
    if (!address.lastUsedAt || !address.maxAddressAgeHours) return false;

    const lastUsed = new Date(address.lastUsedAt);
    const expiryTime = new Date(
      lastUsed.getTime() + address.maxAddressAgeHours * 60 * 60 * 1000
    );
    return new Date() > expiryTime;
  }

  // Get time until expiry
  getTimeUntilExpiry(address: DepositAddress): string {
    if (!address.lastUsedAt || !address.maxAddressAgeHours) return 'N/A';

    const lastUsed = new Date(address.lastUsedAt);
    const expiryTime = new Date(
      lastUsed.getTime() + address.maxAddressAgeHours * 60 * 60 * 1000
    );
    const now = new Date();
    const diffMs = expiryTime.getTime() - now.getTime();

    if (diffMs <= 0) return 'Expired';

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
    return `${diffHours}h`;
  }

  // Check if reservation is active
  isReservationActive(address: DepositAddress): boolean {
    if (!address.reservationExpiresAt) return false;
    return new Date() < new Date(address.reservationExpiresAt);
  }

  // Get consolidation error message
  getConsolidationErrorMessage(address: DepositAddress): string {
    if (!address.consolidationError) return '';
    return address.consolidationError.message || 'Unknown error';
  }

  // Format balance with appropriate decimals
  formatBalance(balance: number | null | undefined, currency?: string): string {
    // Guard against undefined/null/NaN balance to avoid calling toFixed on invalid values
    if (balance == null || typeof balance !== 'number' || isNaN(balance)) {
      return '0';
    }

    if (currency === 'USDT') {
      return balance.toFixed(6);
    }
    if (currency === 'SOL') {
      return balance.toFixed(9);
    }
    if (currency === 'BNB' || currency === 'TRX') {
      return balance.toFixed(6);
    }
    return balance.toString();
  }

  onStatusUpdateSubmit(): void {
    if (this.statusUpdateForm.invalid || !this.selectedAddress) {
      return;
    }

    this.statusUpdateLoading = true;
    this.error = null;
    this.success = null;

    // Build payload but omit empty strings / null / undefined so backend validation won't fail
    const raw = this.statusUpdateForm.value;
    const payload: any = {};
    Object.keys(raw).forEach((key) => {
      const val = raw[key];
      if (val === '' || val === null || val === undefined) return;
      payload[key] = val;
    });

    const params = {
      operator: this.filterForm.get('operator')?.value,
      includeRetired: true, // Allow updating retired addresses
    };

    this.http
      .put<StatusUpdateResponse>(
        `https://doronpay.com/api/transactions/deposit-addresses/${this.selectedAddress.address}/status`,
        payload,
        {
          headers: this.getHeaders(),
          params: params,
        }
      )
      .subscribe({
        next: (response) => {
          this.statusUpdateLoading = false;
          if (response.success) {
            this.success = `Successfully updated status for address ${this.selectedAddress?.address}`;
            this.loadDepositAddresses(); // Refresh the list
            this.closeStatusUpdateModal();
          } else {
            this.error = response.message || 'Failed to update address status';
          }
        },
        error: (error) => {
          this.statusUpdateLoading = false;
          console.error('Status update error:', error);
          this.error =
            error.error?.message || 'Failed to update address status';
        },
      });
  }

  // Helper methods for template
  onStatusCheckboxChange(
    status: string,
    event: any,
    field: 'includeStatuses' | 'excludeStatuses'
  ): void {
    const currentValues = this.bulkRetireForm.get(field)?.value || [];
    if (event.target.checked) {
      this.bulkRetireForm.patchValue({
        [field]: [...currentValues, status],
      });
    } else {
      this.bulkRetireForm.patchValue({
        [field]: currentValues.filter((s: string) => s !== status),
      });
    }
  }

  // Existing methods remain the same...
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.loadDepositAddresses();
  }

  changePage(delta: number): void {
    this.goToPage(this.currentPage + delta);
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (select && select.value) {
      this.changePageSize(parseInt(select.value, 10));
    }
  }

  changePageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadDepositAddresses();
  }

  onFilterSubmit(): void {
    this.currentPage = 1;
    this.loadDepositAddresses();
  }

  resetFilters(): void {
    this.filterForm.reset({
      operator: '',
      status: '',
      onlyOpen: false,
      pendingConsolidation: false,
      includeRetired: false,
      address: '',
      merchantId: '',
    });
    this.currentPage = 1;
    this.hasSearched = false;
    this.depositAddresses = [];
    this.totalItems = 0;
    this.operator = '';
    this.chain = '';
    this.currency = '';
  }

  getStatusBadgeClass(status: string): string {
    const baseClasses =
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize';

    switch (status) {
      case 'FRESH':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'ASSIGNED':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'WARM':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'LOCKED':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'RETIRED':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }

  getOperatorBadgeClass(operator: string): string {
    const baseClasses =
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

    switch (operator) {
      case 'TRC20':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'BEP20':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'SOLANA':
        return `${baseClasses} bg-indigo-100 text-indigo-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }

  minValue(a: number, b: number): number {
    return Math.min(a, b);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    if (this.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(
        1,
        this.currentPage - Math.floor(maxPagesToShow / 2)
      );
      let endPage = startPage + maxPagesToShow - 1;

      if (endPage > this.totalPages) {
        endPage = this.totalPages;
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // You can add a toast notification here if needed
      console.log('Address copied to clipboard');
    });
  }

  // Helper to check if we should show the table
  shouldShowTable(): boolean {
    return this.hasSearched && !this.loading;
  }

  // Clear messages
  clearMessages(): void {
    this.error = null;
    this.success = null;
  }
}
