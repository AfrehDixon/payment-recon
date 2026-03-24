// credit-queue.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { 
  CreditQueueItem, 
  CreditQueueFilters,
  QueueActionPayload
} from './credit-queue.interface';
import { CreditQueueService } from './credit-queue.service';

@Component({
  selector: 'app-credit-queue',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './credit-queue.component.html',
  styleUrls: ['./credit-queue.component.scss']
})
export class CreditQueueComponent implements OnInit, OnDestroy {
  // Data
  items: CreditQueueItem[] = [];
  stats: any = null;
  selectedItem: CreditQueueItem | null = null;
  pagination: any = null;

  // Status types
  statuses: string[] = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'];

  // Forms
  filterForm!: FormGroup;
  actionForm!: FormGroup;
  
  // UI State
  loading = false;
  loadingStats = false;
  showFilters = false;
  showDetailsModal = false;
  showActionModal = false;
  actionModalTitle = '';
  currentAction: 'retry' | 'cancel' | 'requeue' | 'release-lock' | 'mark-completed' | 'mark-failed' | null = null;
  actionLoading = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 1;
  pageSizeOptions = [10, 20, 50, 100, 200];
  
  // Destroy subject
  private destroy$ = new Subject<void>();

  Math = Math;
Object: any;

  constructor(
    private fb: FormBuilder,
    private service: CreditQueueService
  ) {
    this.initFilterForm();
    this.initActionForm();
  }

  ngOnInit() {
    this.loadItems();
    this.loadStats();
    this.setupFilterSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initFilterForm() {
    this.filterForm = this.fb.group({
      status: [''],
      operator: [''],
      merchantId: [''],
      transactionRef: [''],
      externalTransactionId: [''],
      lockedOnly: [false]
    });
  }

  private initActionForm() {
    this.actionForm = this.fb.group({
      reason: ['']
    });
  }

  private setupFilterSubscriptions() {
    ['operator', 'merchantId', 'transactionRef', 'externalTransactionId'].forEach(field => {
      this.filterForm.get(field)?.valueChanges
        .pipe(
          debounceTime(500),
          distinctUntilChanged(),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.currentPage = 1;
          this.loadItems();
        });
    });

    ['status', 'lockedOnly'].forEach(field => {
      this.filterForm.get(field)?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.currentPage = 1;
          this.loadItems();
        });
    });
  }

  loadItems() {
    this.loading = true;
    
    const filters: CreditQueueFilters = {
      page: this.currentPage,
      limit: this.pageSize,
      ...this.buildFilters()
    };

    this.service.getQueueItems(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.items = response.data;
          this.pagination = response.pagination;
          this.totalItems = response.pagination.total;
          this.totalPages = response.pagination.pages;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading credit queue items:', error);
          this.loading = false;
        }
      });
  }

  loadStats() {
    this.loadingStats = true;
    
    this.service.getQueueStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.stats = response.data;
          this.loadingStats = false;
        },
        error: (error) => {
          console.error('Error loading queue stats:', error);
          this.loadingStats = false;
        }
      });
  }

  private buildFilters(): Partial<CreditQueueFilters> {
    const formValue = this.filterForm.value;
    const filters: Partial<CreditQueueFilters> = {};

    if (formValue.status) filters.status = formValue.status;
    if (formValue.operator) filters.operator = formValue.operator;
    if (formValue.merchantId) filters.merchantId = formValue.merchantId;
    if (formValue.transactionRef) filters.transactionRef = formValue.transactionRef;
    if (formValue.externalTransactionId) filters.externalTransactionId = formValue.externalTransactionId;
    if (formValue.lockedOnly) filters.lockedOnly = formValue.lockedOnly;

    return filters;
  }

  viewItemDetails(item: CreditQueueItem) {
    this.selectedItem = item;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedItem = null;
  }

  openActionModal(item: CreditQueueItem, action: 'retry' | 'cancel' | 'requeue' | 'release-lock' | 'mark-completed' | 'mark-failed') {
    this.selectedItem = item;
    this.currentAction = action;
    this.actionForm.reset({ reason: '' });
    
    switch(action) {
      case 'retry':
        this.actionModalTitle = 'Retry Queue Item';
        break;
      case 'cancel':
        this.actionModalTitle = 'Cancel Queue Item';
        break;
      case 'requeue':
        this.actionModalTitle = 'Requeue Item';
        break;
      case 'release-lock':
        this.actionModalTitle = 'Release Lock';
        break;
      case 'mark-completed':
        this.actionModalTitle = 'Force Mark as Completed';
        break;
      case 'mark-failed':
        this.actionModalTitle = 'Force Mark as Failed';
        break;
    }
    
    this.showActionModal = true;
  }

  closeActionModal() {
    this.showActionModal = false;
    this.selectedItem = null;
    this.currentAction = null;
    this.actionLoading = false;
    this.actionForm.reset();
  }

  executeAction() {
    if (!this.selectedItem || !this.currentAction) return;
    
    this.actionLoading = true;
    const payload: QueueActionPayload = { reason: this.actionForm.value.reason || '' };
    
    let request;
    switch(this.currentAction) {
      case 'retry':
        request = this.service.retryQueueItem(this.selectedItem._id, payload);
        break;
      case 'cancel':
        request = this.service.cancelQueueItem(this.selectedItem._id, payload);
        break;
      case 'requeue':
        request = this.service.requeueQueueItem(this.selectedItem._id, payload);
        break;
      case 'release-lock':
        request = this.service.releaseLock(this.selectedItem._id);
        break;
      case 'mark-completed':
        request = this.service.markCompleted(this.selectedItem._id, { reason: payload.reason || 'Force completed via admin' });
        break;
      case 'mark-failed':
        request = this.service.markFailed(this.selectedItem._id, { reason: payload.reason || 'Force failed via admin' });
        break;
      default:
        return;
    }
    
    request.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log(`Action ${this.currentAction} successful:`, response);
          this.closeActionModal();
          this.loadItems();
          this.loadStats();
        },
        error: (error) => {
          console.error(`Error executing ${this.currentAction}:`, error);
          this.actionLoading = false;
        }
      });
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  clearFilters() {
    this.filterForm.reset({
      status: '',
      operator: '',
      merchantId: '',
      transactionRef: '',
      externalTransactionId: '',
      lockedOnly: false
    });
    this.currentPage = 1;
    this.loadItems();
  }

  getTotalItems(): number {
    if (!this.stats?.byStatus) return 0;
    return Object.values(this.stats.byStatus).reduce((sum: number, count) => sum + (typeof count === 'number' ? count : 0), 0);
  }

  getStatusCount(status: string): number {
    return this.stats?.byStatus?.[status] || 0;
  }

  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadItems();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadItems();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadItems();
    }
  }

  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadItems();
  }

  // Helper methods
  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'PROCESSING': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'FAILED': 'bg-red-100 text-red-800',
      'CANCELLED': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  formatAddress(address: string): string {
    if (!address) return '';
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  }

  formatAmount(amount?: number, currency: string = 'GHS'): string {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(amount);
  }

  canRetry(item: CreditQueueItem): boolean {
    return item.status === 'FAILED';
  }

  canCancel(item: CreditQueueItem): boolean {
    return ['PENDING', 'PROCESSING'].includes(item.status);
  }

  canRequeue(item: CreditQueueItem): boolean {
    return ['FAILED', 'CANCELLED'].includes(item.status);
  }

  canReleaseLock(item: CreditQueueItem): boolean {
    return item.status === 'PROCESSING' && !!item.lockAcquiredAt;
  }

  canForceMark(item: CreditQueueItem): boolean {
    return ['PENDING', 'PROCESSING'].includes(item.status);
  }

  getErrorDisplay(item: CreditQueueItem): string {
    if (!item.lastError) return '-';
    return item.lastError.message;
  }

  getAttemptsDisplay(item: CreditQueueItem): string {
    return `${item.attempts}/${item.maxAttempts}`;
  }
}