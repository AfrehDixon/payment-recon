// admin-trading-pairs.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import {
  TradingPair,
  CreatePairPayload,
  UpdatePairPayload,
  PairFilters
} from './admin-trading.interface';
import { AdminTradingService } from './admin-trading.service';

@Component({
  selector: 'app-admin-trading-pairs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-trading-pairs.component.html',
  styleUrls: ['./admin-trading-pairs.component.scss']
})
export class AdminTradingPairsComponent implements OnInit, OnDestroy {
  // Data
  pairs: TradingPair[] = [];
  selectedPair: TradingPair | null = null;
  viewingPair: TradingPair | null = null;
  Math = Math;
  
  // Forms
  filterForm!: FormGroup;
  pairForm!: FormGroup;
  
  // UI State
  loading = false;
  showFilters = false;
  showCreateModal = false;
  showEditModal = false;
  showViewModal = false;
  showConfirmModal = false;
  confirmAction: 'enable' | 'disable' | null = null;
  pendingPair: TradingPair | null = null;
  actionInProgress = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;
  pageSizeOptions = [10, 20, 50, 100];
  
  // Filters state
  statusOptions = ['ACTIVE', 'DISABLED'];
  pricingSourceOptions = ['KRAKEN', 'INTERNAL'];
  
  // Destroy subject
  private destroy$ = new Subject<void>();
  
  // Current admin user (should come from auth service)
  currentAdmin = 'admin@doronpay.com';
  
  constructor(
    private fb: FormBuilder,
    private service: AdminTradingService
  ) {
    this.initFilterForm();
    this.initPairForm();
  }
  
  ngOnInit() {
    this.loadPairs();
    this.setupFilterSubscriptions();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private initFilterForm() {
    this.filterForm = this.fb.group({
      baseAsset: [''],
      quoteAsset: [''],
      status: [''],
      pricingSource: ['']
    });
  }
  
  private initPairForm() {
    this.pairForm = this.fb.group({
      baseAsset: ['', [Validators.required, Validators.maxLength(10)]],
      quoteAsset: ['', [Validators.required, Validators.maxLength(10)]],
      minTradeAmount: [0.01, [Validators.min(0)]],
      maxTradeAmount: [null],
      pricePrecision: [8, [Validators.min(0), Validators.max(18)]],
      amountPrecision: [8, [Validators.min(0), Validators.max(18)]],
      feeBps: [25, [Validators.min(0)]],
      metadata: this.fb.group({
        pricingSource: ['KRAKEN', Validators.required],
        krakenPair: [''],
        buySpreadBps: [50, [Validators.min(0)]],
        sellSpreadBps: [50, [Validators.min(0)]],
        swapSpreadBps: [100, [Validators.min(0)]]
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
        this.loadPairs();
      });
  }
  
  loadPairs() {
    this.loading = true;
    
    const filters: PairFilters = {
      ...this.filterForm.value,
      page: this.currentPage,
      limit: this.pageSize
    };
    
    // Remove empty values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof PairFilters] === '' || filters[key as keyof PairFilters] === undefined) {
        delete filters[key as keyof PairFilters];
      }
    });
    
    this.service.listPairs(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.pairs = response.data.items;
          this.totalItems = response.data.total;
          this.totalPages = response.data.pages;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading trading pairs:', error);
          this.loading = false;
        }
      });
  }
  
  viewPairDetails(pair: TradingPair) {
    this.viewingPair = pair;
    this.showViewModal = true;
  }
  
  createPair() {
    if (this.pairForm.invalid) {
      this.pairForm.markAllAsTouched();
      return;
    }
    
    this.actionInProgress = true;
    const payload: CreatePairPayload = this.pairForm.value;
    
    this.service.createPair(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.closeCreateModal();
          this.loadPairs();
          this.actionInProgress = false;
        },
        error: (error) => {
          console.error('Error creating pair:', error);
          this.actionInProgress = false;
        }
      });
  }
  
  updatePair() {
    if (this.pairForm.invalid || !this.selectedPair) {
      return;
    }
    
    this.actionInProgress = true;
    const payload: UpdatePairPayload = this.pairForm.value;
    
    this.service.updatePair(this.selectedPair._id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.closeEditModal();
          this.loadPairs();
          this.actionInProgress = false;
        },
        error: (error) => {
          console.error('Error updating pair:', error);
          this.actionInProgress = false;
        }
      });
  }
  
  confirmToggleStatus(pair: TradingPair) {
    this.pendingPair = pair;
    this.confirmAction = pair.status === 'ACTIVE' ? 'disable' : 'enable';
    this.showConfirmModal = true;
  }
  
  executeStatusToggle() {
    if (!this.pendingPair || !this.confirmAction) return;
    
    this.actionInProgress = true;
    this.showConfirmModal = false;
    
    const payload = {
      performedBy: this.currentAdmin,
      reason: `Admin ${this.confirmAction}d pair`
    };
    
    const action = this.confirmAction === 'enable' 
      ? this.service.enablePair(this.pendingPair._id, payload)
      : this.service.disablePair(this.pendingPair._id, payload);
    
    action.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadPairs();
          this.actionInProgress = false;
          this.pendingPair = null;
          this.confirmAction = null;
        },
        error: (error) => {
          console.error(`Error ${this.confirmAction}ing pair:`, error);
          this.actionInProgress = false;
        }
      });
  }
  
  cancelConfirm() {
    this.showConfirmModal = false;
    this.pendingPair = null;
    this.confirmAction = null;
  }
  
  openCreateModal() {
    this.pairForm.reset({
      baseAsset: '',
      quoteAsset: '',
      minTradeAmount: 0.01,
      maxTradeAmount: null,
      pricePrecision: 8,
      amountPrecision: 8,
      feeBps: 25,
      metadata: {
        pricingSource: 'KRAKEN',
        krakenPair: '',
        buySpreadBps: 50,
        sellSpreadBps: 50,
        swapSpreadBps: 100
      }
    });
    this.showCreateModal = true;
  }
  
  openEditModal(pair: TradingPair) {
    this.selectedPair = pair;
    this.pairForm.patchValue({
      minTradeAmount: pair.minTradeAmount,
      maxTradeAmount: pair.maxTradeAmount,
      pricePrecision: pair.pricePrecision,
      amountPrecision: pair.amountPrecision,
      feeBps: pair.feeBps,
      status: pair.status,
      metadata: pair.metadata
    });
    this.showEditModal = true;
  }
  
  closeCreateModal() {
    this.showCreateModal = false;
    this.pairForm.reset();
  }
  
  closeEditModal() {
    this.showEditModal = false;
    this.selectedPair = null;
    this.pairForm.reset();
  }
  
  closeViewModal() {
    this.showViewModal = false;
    this.viewingPair = null;
  }
  
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
  
  clearFilters() {
    this.filterForm.reset({
      baseAsset: '',
      quoteAsset: '',
      status: '',
      pricingSource: ''
    });
    this.currentPage = 1;
    this.loadPairs();
  }
  
  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPairs();
    }
  }
  
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPairs();
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadPairs();
    }
  }
  
  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadPairs();
  }
  
  // Helper methods
  getStatusClass(status: string): string {
    return status === 'ACTIVE' 
      ? 'status-active' 
      : 'status-disabled';
  }
  
  getPricingSourceClass(source: string): string {
    return source === 'KRAKEN' 
      ? 'source-kraken' 
      : 'source-internal';
  }
  
  formatNumber(value: number | null, decimals: number = 2): string {
    if (value === null) return '∞';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }
  
  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }
  
  getPairSymbol(pair: TradingPair): string {
    return pair.pairCode || `${pair.baseAsset}/${pair.quoteAsset}`;
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