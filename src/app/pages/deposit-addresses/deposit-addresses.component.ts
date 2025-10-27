import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { AuthState } from '../../state/apps/app.states';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

interface DepositAddress {
  _id?: string;
  address: string;
  index: number;
  status: 'FRESH' | 'ASSIGNED' | 'WARM' | 'LOCKED' | 'RETIRED';
  openTransactionId: string | null;
  currentBalance: number;
  pendingConsolidation: boolean;
  minConsolidateUsd: number;
  createdAt?: Date;
  updatedAt?: Date;
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

@Component({
  selector: 'app-deposit-addresses',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './deposit-addresses.component.html',
  styleUrls: ['./deposit-addresses.component.scss']
})
export class DepositAddressesComponent implements OnInit, OnDestroy {
  depositAddresses: DepositAddress[] = [];
  loading = false;
  error: string | null = null;
  hasSearched = false;

  // Filter properties
  filterForm: FormGroup;

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

  // Response data
  operator: string = '';
  chain: string = '';
  currency: string = '';

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
      merchantId: ['']
    });
  }

  ngOnInit(): void {
    // Don't load data automatically - wait for operator selection
    // Subscribe to token changes for when token refreshes
    this.tokenSubscription = this.store.select(AuthState.token).subscribe(() => {
      // If we've already searched and have an operator selected, reload
      if (this.hasSearched && this.filterForm.get('operator')?.value) {
        this.loadDepositAddresses();
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
      limit: this.pageSize
    };

    // Add optional filters if they have values
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
    this.hasSearched = true;
    
    const params = this.buildQueryParams();

    this.http.get<DepositAddressResponse>(
      'https://doronpay.com/api/transactions/deposit-addresses',
      { 
        headers: this.getHeaders(),
        params: params
      }
    ).subscribe({
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
        this.error = error.error?.message || 'Failed to load deposit addresses';
        this.loading = false;
      }
    });
  }

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
      merchantId: ''
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
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize';
    
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
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
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
      let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
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
}