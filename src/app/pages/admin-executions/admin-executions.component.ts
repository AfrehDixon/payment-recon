// admin-executions.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import {
  Execution,
  ExecutionFilters,
  ReconcileExecutionPayload
} from './admin-executions.interface';
import { AdminExecutionsService } from './admin-executions.service';

@Component({
  selector: 'app-admin-executions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-executions.component.html',
  styleUrls: ['./admin-executions.component.scss']
})
export class AdminExecutionsComponent implements OnInit, OnDestroy {
  // Data
  executions: Execution[] = [];
  selectedExecution: Execution | null = null;
  Math = Math;
  
  // Forms
  filterForm!: FormGroup;
  reconcileForm!: FormGroup;
  
  // UI State
  loading = false;
  showFilters = false;
  showViewModal = false;
  showReconcileModal = false;
  reconcileInProgress = false;
  reconcileExecutionId: string | null = null;
  
  // Pagination
  currentPage = 1;
  pageSize = 50;
  totalItems = 0;
  totalPages = 0;
  pageSizeOptions = [20, 50, 100, 200];
  
  // Filters state
  sideOptions = ['BUY', 'SELL', 'SWAP'];
  statusOptions = ['PENDING', 'EXECUTED', 'FAILED', 'RECONCILED', 'SETTLED'];
  
  // Destroy subject
  private destroy$ = new Subject<void>();
  
  // Current admin user
  currentAdmin = 'admin@doronpay.com';
  
  // Valid currencies for formatting
  private validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'AUD', 'CNY', 'INR', 'BRL', 'GHS', 'NGN', 'ZAR', 'KES', 'UGX', 'TZS'];
  
  // Computed properties for stats
  get totalExecutions(): number {
    return this.totalItems;
  }
  
  get pendingCount(): number {
    return this.executions.filter(e => e.status === 'PENDING').length;
  }
  
  get executedCount(): number {
    return this.executions.filter(e => e.status === 'EXECUTED').length;
  }
  
  get reconciledCount(): number {
    return this.executions.filter(e => e.status === 'RECONCILED').length;
  }
  
  get settledCount(): number {
    return this.executions.filter(e => e.status === 'SETTLED').length;
  }
  
  get failedCount(): number {
    return this.executions.filter(e => e.status === 'FAILED').length;
  }
  
  constructor(
    private fb: FormBuilder,
    private service: AdminExecutionsService
  ) {
    this.initFilterForm();
    this.initReconcileForm();
  }
  
  ngOnInit() {
    this.loadExecutions();
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
      pairCode: [''],
      quoteRef: [''],
      executionRef: [''],
      side: [''],
      status: [''],
      dateRange: this.fb.group({
        from: [''],
        to: ['']
      })
    });
  }
  
  private initReconcileForm() {
    this.reconcileForm = this.fb.group({
      reason: [''],
      force: [false]
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
        this.loadExecutions();
      });
  }
  
  loadExecutions() {
    this.loading = true;
    
    const formValue = this.filterForm.value;
    const filters: ExecutionFilters = {
      page: this.currentPage,
      limit: this.pageSize
    };
    
    if (formValue.merchantId) filters.merchantId = formValue.merchantId;
    if (formValue.endCustomerId) filters.endCustomerId = formValue.endCustomerId;
    if (formValue.pairCode) filters.pairCode = formValue.pairCode;
    if (formValue.quoteRef) filters.quoteRef = formValue.quoteRef;
    if (formValue.executionRef) filters.executionRef = formValue.executionRef;
    if (formValue.status) filters.status = formValue.status;
    
    if (formValue.dateRange?.from) {
      filters.fromDate = new Date(formValue.dateRange.from).toISOString();
    }
    if (formValue.dateRange?.to) {
      filters.toDate = new Date(formValue.dateRange.to).toISOString();
    }
    
    this.service.listExecutions(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.executions = response.data.items;
          this.totalItems = response.data.total;
          this.totalPages = response.data.pages;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading executions:', error);
          this.loading = false;
        }
      });
  }
  
  viewExecutionDetails(execution: Execution) {
    this.selectedExecution = execution;
    this.showViewModal = true;
  }
  
  closeViewModal() {
    this.showViewModal = false;
    this.selectedExecution = null;
  }
  
  confirmReconcile(executionId: string) {
    this.reconcileExecutionId = executionId;
    this.reconcileForm.reset({ reason: '', force: false });
    this.showReconcileModal = true;
  }
  
  executeReconcile() {
    if (!this.reconcileExecutionId) return;
    
    this.reconcileInProgress = true;
    
    const payload: ReconcileExecutionPayload = {
      performedBy: this.currentAdmin,
      reason: this.reconcileForm.value.reason || 'Admin manual reconciliation',
      force: this.reconcileForm.value.force
    };
    
    this.service.reconcileExecution(this.reconcileExecutionId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadExecutions();
          this.reconcileInProgress = false;
          this.showReconcileModal = false;
          this.reconcileExecutionId = null;
        },
        error: (error) => {
          console.error('Error reconciling execution:', error);
          this.reconcileInProgress = false;
        }
      });
  }
  
  cancelReconcile() {
    this.showReconcileModal = false;
    this.reconcileExecutionId = null;
    this.reconcileForm.reset();
  }
  
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
  
  clearFilters() {
    this.filterForm.reset({
      merchantId: '',
      endCustomerId: '',
      pairCode: '',
      quoteRef: '',
      executionRef: '',
      side: '',
      status: '',
      dateRange: { from: '', to: '' }
    });
    this.currentPage = 1;
    this.loadExecutions();
  }
  
  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadExecutions();
    }
  }
  
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadExecutions();
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadExecutions();
    }
  }
  
  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadExecutions();
  }
  
  // Helper methods
  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'PENDING': 'status-pending',
      'EXECUTED': 'status-executed',
      'FAILED': 'status-failed',
      'RECONCILED': 'status-reconciled',
      'SETTLED': 'status-settled'
    };
    return classes[status] || 'status-unknown';
  }
  
  getSideClass(side: string): string {
    const classes: Record<string, string> = {
      'BUY': 'side-buy',
      'SELL': 'side-sell',
      'SWAP': 'side-swap'
    };
    return classes[side] || 'side-unknown';
  }
  
  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'PENDING': 'fa-clock',
      'EXECUTED': 'fa-check-circle',
      'FAILED': 'fa-times-circle',
      'RECONCILED': 'fa-handshake',
      'SETTLED': 'fa-check-double'
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
        maximumFractionDigits: 8
      }).format(value);
    } else {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
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
  
  formatAddress(address: string): string {
    if (!address) return '';
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  }
  
  canReconcile(execution: Execution): boolean {
    return execution.status === 'PENDING' || execution.status === 'EXECUTED';
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