import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QueueItem, QueueStats } from './queue.interface';
import { debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { QueueService } from './queue.service';
import { CommonModule } from '@angular/common';
import { interval, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-queue-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './queue-dashboard.component.html',
  styleUrls: ['./queue-dashboard.component.scss']
})
export class QueueDashboardComponent implements OnInit, OnDestroy {
  queueStats: QueueStats[] = [];
  filterForm!: FormGroup;
  selectedItem: QueueItem | null = null;
  loading = {
    items: false,
    stats: false,
    details: false
  };
  allItems: QueueItem[] = []; // Store all items
  queueItems: QueueItem[] = [];
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  error: string | null = null;
  private destroy$ = new Subject<void>();

    private pollingSubscription: Subscription | null = null;
    private pollingInterval = 1000; // 1 second in milliseconds
    isPollingEnabled = true; // Control polling state

  constructor(
    private queueService: QueueService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  private initializeForm() {
    this.filterForm = this.fb.group({
      processed: [null],
      processorType: [''],
      internalStatus: [''],
      processorStatus: [''],
      transactionRef: [''],
      fromDate: [null],
      toDate: [null]
    });
  }

  ngOnInit() {
    this.setupFilterSubscription();
    this.loadInitialData();

    this.startPolling();
  }
  private updateDisplayedItems() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.queueItems = this.allItems.slice(start, end);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    
    this.currentPage = page;
    this.updateDisplayedItems();
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newSize = parseInt(target.value, 10);
    
    if (newSize !== this.pageSize) {
      this.pageSize = newSize;
      this.currentPage = 1;
      this.totalPages = Math.ceil(this.totalItems / this.pageSize);
      this.updateDisplayedItems();
    }
  }

  get startIndex(): number {
    return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize - 1, this.totalItems);
  }

  private setupFilterSubscription() {
    this.filterForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged((prev, curr) => {
        // Only compare non-pagination fields
        const prevFilters = { ...prev };
        const currFilters = { ...curr };
        delete prevFilters.page;
        delete prevFilters.limit;
        delete currFilters.page;
        delete currFilters.limit;
        return JSON.stringify(prevFilters) === JSON.stringify(currFilters);
      }),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1; // Reset to first page when filters change
      this.loadQueueItems();
    });
  }
  


  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopPolling();

  }

  startPolling(): void {
    // Only start if not already polling
    if (!this.pollingSubscription && this.isPollingEnabled) {
      this.pollingSubscription = interval(this.pollingInterval).subscribe(() => {
        // Only fetch logs if not currently loading and polling is enabled
        if (!this.isLoading() && this.isPollingEnabled) {
          this.loadQueueItemsSilently();
        }
      });
    }
  }

  loadQueueItemsSilently() {
    if (this.loading.items) return;
    
    // Avoid showing loading indicator for silent refresh
    // this.loading.items = true;
    this.error = null;
  
    const filters = { ...this.filterForm.value };
    delete filters.page;
    delete filters.limit;
  
    this.queueService.getQueueItems(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response?.data?.items) {
            // Log to check if we're getting new data
            console.log('New data received from poll:', response.data.items.length);
            
            // Check if data has actually changed
            const currentDataStr = JSON.stringify(this.allItems);
            const newDataStr = JSON.stringify(response.data.items);
            
            if (currentDataStr !== newDataStr) {
              console.log('Data has changed, updating view');
              this.allItems = response.data.items;
              this.totalItems = this.allItems.length;
              this.totalPages = Math.ceil(this.totalItems / this.pageSize);
              this.updateDisplayedItems();
            } else {
              console.log('No data changes detected');
            }
          } else {
            this.resetPaginationState();
          }
        },
        error: (error) => {
          console.error('Error during silent poll:', error);
          // Don't show error in UI for silent refresh
          // this.error = error.message;
          // this.resetPaginationState();
        }
      });
  }
    
    // Stop the polling interval
    stopPolling(): void {
      if (this.pollingSubscription) {
        this.pollingSubscription.unsubscribe();
        this.pollingSubscription = null;
      }
    }
    
    // Toggle polling on/off
    togglePolling(): void {
      this.isPollingEnabled = !this.isPollingEnabled;
      
      if (this.isPollingEnabled) {
        this.startPolling();  
      } else {
        this.stopPolling();
      }
    }
    

  private loadInitialData() {
    this.loadQueueStats();
    this.loadQueueItems();
  }

  loadQueueItems() {
    if (this.loading.items) return;
    
    this.loading.items = true;
    this.error = null;

    const filters = { ...this.filterForm.value };
    delete filters.page;
    delete filters.limit;

    this.queueService.getQueueItems(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response?.data?.items) {
            this.allItems = response.data.items;
            this.totalItems = this.allItems.length;
            this.totalPages = Math.ceil(this.totalItems / this.pageSize);
            this.updateDisplayedItems();
          } else {
            this.resetPaginationState();
          }
          this.loading.items = false;
        },
        error: (error) => {
          this.error = error.message;
          this.loading.items = false;
          this.resetPaginationState();
        }
      });
  }
  
  private resetPaginationState() {
    this.allItems = [];
    this.queueItems = [];
    this.totalItems = 0;
    this.totalPages = 0;
    this.currentPage = 1;
  }

  loadQueueStats() {
    if (this.loading.stats) return;

    this.loading.stats = true;
    this.queueService.getQueueStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.queueStats = response.data;
          this.loading.stats = false;
        },
        error: (error) => {
          this.error = error.message;
          this.loading.stats = false;
          this.queueStats = [];
        }
      });
  }

  viewItemDetails(id: string) {
    if (this.loading.details) return;

    this.loading.details = true;
    this.queueService.getQueueItemById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.selectedItem = response.data;
          this.loading.details = false;
        },
        error: (error) => {
          this.error = error.message;
          this.loading.details = false;
          this.selectedItem = null;
        }
      });
  }

  // New helper methods
  getStatusClass(status: string | null): string {
    if (!status) return 'status-unknown';
    
    switch (status.toUpperCase()) {
      case 'PAID':
        return 'status-paid';
      case 'INITIATED':
        return 'status-initiated';
      case 'FAILED':
        return 'status-failed';
      default:
        return 'status-unknown';
    }
  }

  closeModal(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-overlay')) {
      this.selectedItem = null;
    }
  }

  clearError() {
    this.error = null;
  }

  retryLoad() {
    this.error = null;
    this.loadInitialData();
  }

  // Helper methods for null checks
  getTransactionAmount(item: QueueItem): string {
    if (!item.transactionId?.actualAmount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GHS'
    }).format(item.transactionId.actualAmount);
  }

  getFormattedDate(date: string | null): string {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  }

  getTransactionType(item: QueueItem): string {
    return item.transactionId?.transaction_type || 'N/A';
  }

  isLoading(): boolean {
    return this.loading.items || this.loading.stats || this.loading.details;
  }
}