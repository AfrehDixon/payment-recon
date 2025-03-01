import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { catchError, finalize } from 'rxjs/operators';
import { interval, Observable, of, Subscription } from 'rxjs';
import url from '../../constants/api.constant';
import { AdminService } from '../../service/admin.service';

const API_URL = url;

interface LogEntry {
  _id: string;
  timestamp: string;
  level: string;
  message: string;
  service: string;
  merchantId?: string;
  metadata?: any;
}

interface LogResponse {
  success: boolean;
  data: {
    logs: LogEntry[];
    pagination: {
      total: number;
      pages: number;
      page: number;
      limit: number;
    };
    filters: {
      services: string[];
      levels: string[];
    };
  };
}

interface ServiceResponse {
  success: boolean;
  data: string[];
}

interface DeleteLogsResponse {
  success: boolean;
  message: string;
  deletedCount: number;
}

interface Merchant {
    _id: string;
    merchant_tradeName: string;
    tierEnabled: boolean;
    tierLevel: number;
    active: boolean;
  }

@Component({
  selector: 'app-logs-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './logs-management.component.html',
  styleUrls: ['./logs-management.component.scss'],
  providers: [DatePipe]
})
export class LogsManagementComponent implements OnInit {
  // Filter form
  filterForm: FormGroup;
  
  // Delete logs form
  deleteForm: FormGroup;
  
  // Data
  logs: LogEntry[] = [];
  services: string[] = [];
  logLevels: string[] = [];

  filteredLogs: LogEntry[] = [];
  localSearchTerm: string = '';

  Math: any = Math;
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalLogs = 0;
  logsPerPage = 100;
  
  // UI state
  isLoading = false;
  isDeleting = false;
  error: string | null = null;
  success: string | null = null;
  showDeleteConfirm = false;
  expandedLogIds: Set<string> = new Set();

  merchants: Merchant[] = [];

  private pollingSubscription: Subscription | null = null;
  private pollingInterval = 1000; // 1 second in milliseconds
  isPollingEnabled = true; // Control polling state
  
  // Color mapping for log levels
  levelColors: { [key: string]: string } = {
    error: 'text-red-600 bg-red-100',
    warn: 'text-yellow-600 bg-yellow-100',
    info: 'text-blue-600 bg-blue-100',
    debug: 'text-green-600 bg-green-100',
    trace: 'text-purple-600 bg-purple-100'
  };
  
  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private datePipe: DatePipe,
    private tierService: AdminService
  ) {
    // Initialize filter form
    this.filterForm = this.fb.group({
      startDate: [''],
      endDate: [''],
      level: [''],
      service: [''],
      search: [''],
      merchantId: [''],
      limit: [100],
      sort: ['desc']
    });
    
    // Initialize delete form
    this.deleteForm = this.fb.group({
      olderThan: [this.formatDateForInput(new Date())],
      level: [''],
      confirmDelete: ['']
    });
  }
  
  ngOnInit(): void {
    this.fetchServices();
    this.fetchLogs();
    this.loadMerchants();
    this.filteredLogs = [...this.logs]; // Initialize filtered logs
    
    // Listen to filter changes
    this.filterForm.valueChanges.subscribe(() => {
      this.currentPage = 1; // Reset to first page on filter change
      this.fetchLogs();
    });
    
    // Start polling
    this.startPolling();
  }
  
  ngOnDestroy(): void {
    // Clean up polling subscription when component is destroyed
    this.stopPolling();
  }

   // Start the polling interval
   startPolling(): void {
    // Only start if not already polling
    if (!this.pollingSubscription && this.isPollingEnabled) {
      this.pollingSubscription = interval(this.pollingInterval).subscribe(() => {
        // Only fetch logs if not currently loading and polling is enabled
        if (!this.isLoading && this.isPollingEnabled) {
          this.fetchLogsSilently();
        }
      });
    }
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
  
  // A silent version of fetchLogs that doesn't show loading indicators
  fetchLogsSilently(): void {
    const formValues = this.filterForm.value;
    
    let params = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('limit', formValues.limit)
      .set('sort', formValues.sort);
    
    if (formValues.startDate) {
      params = params.set('startDate', new Date(formValues.startDate).toISOString());
    }
    
    if (formValues.endDate) {
      params = params.set('endDate', new Date(formValues.endDate).toISOString());
    }
    
    if (formValues.level) {
      params = params.set('level', formValues.level);
    }
    
    if (formValues.service) {
      params = params.set('service', formValues.service);
    }
    
    if (formValues.search && formValues.search.length >= 3) {
      params = params.set('search', formValues.search);
    }
    
    if (formValues.merchantId) {
      params = params.set('merchantId', formValues.merchantId);
    }
    
    this.http.get<LogResponse>(`${API_URL}/logs/get`, { params })
      .pipe(
        catchError(error => {
          // Silently handle errors during polling
          console.error('Error during logs polling:', error);
          return of(null);
        })
      )
      .subscribe(response => {
        if (response && response.success) {
          // Only update if there are new or different logs
          if (JSON.stringify(this.logs) !== JSON.stringify(response.data.logs)) {
            // Save expanded log IDs to restore after update
            const expandedIds = new Set(this.expandedLogIds);
            
            this.logs = response.data.logs;
            this.totalPages = response.data.pagination.pages;
            this.totalLogs = response.data.pagination.total;
            this.logLevels = response.data.filters.levels;
            
            // Restore expanded log IDs
            this.expandedLogIds = expandedIds;
            
            // Update filtered logs
            if (this.localSearchTerm && this.localSearchTerm.trim() !== '') {
              this.applyLocalFilter();
            } else {
              this.filteredLogs = [...this.logs];
            }
          }
        }
      });
  }

  applyLocalFilter(): void {
    if (!this.localSearchTerm || this.localSearchTerm.trim() === '') {
      this.filteredLogs = [...this.logs];
      return;
    }
    
    const searchTerm = this.localSearchTerm.toLowerCase().trim();
    
    this.filteredLogs = this.logs.filter(log => {
      return (
        log.message?.toLowerCase().includes(searchTerm) ||
        log.service?.toLowerCase().includes(searchTerm) ||
        log.level?.toLowerCase().includes(searchTerm) ||
        log.merchantId?.toLowerCase().includes(searchTerm) ||
        JSON.stringify(log.metadata)?.toLowerCase().includes(searchTerm)
      );
    });
  }
  
  clearLocalSearch(): void {
    this.localSearchTerm = '';
    this.filteredLogs = [...this.logs];
  }
  
  fetchLogs(): void {
    this.isLoading = true;
    this.error = null;
    
    const formValues = this.filterForm.value;
    
    let params = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('limit', formValues.limit)
      .set('sort', formValues.sort);
    
    if (formValues.startDate) {
      params = params.set('startDate', new Date(formValues.startDate).toISOString());
    }
    
    if (formValues.endDate) {
      params = params.set('endDate', new Date(formValues.endDate).toISOString());
    }
    
    if (formValues.level) {
      params = params.set('level', formValues.level);
    }
    
    if (formValues.service) {
      params = params.set('service', formValues.service);
    }
    
    if (formValues.search && formValues.search.length >= 3) {
      params = params.set('search', formValues.search);
    }
    
    if (formValues.merchantId) {
      params = params.set('merchantId', formValues.merchantId);
    }
    
    this.http.get<LogResponse>(`${API_URL}/logs/get`, { params })
      .pipe(
        catchError(error => {
          this.error = error.error?.message || 'Failed to fetch logs';
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(response => {
        if (response && response.success) {
          this.logs = response.data.logs;
          this.filteredLogs = [...this.logs]; // Update filteredLogs with the new data
          this.totalPages = response.data.pagination.pages;
          this.totalLogs = response.data.pagination.total;
          this.logLevels = response.data.filters.levels;
          
          // If there's an active local search, apply the filter to the new data
          if (this.localSearchTerm && this.localSearchTerm.trim() !== '') {
            this.applyLocalFilter();
          }
        }
      });
  }

  loadMerchants() {
    this.tierService.getMerchants()
      .subscribe({
        next: (response) => {
          this.merchants = response.data; // Assign the array of merchants
        },
        error: (error) => {
          this.error = 'Failed to load merchants.';
        }
      });
  }
  
  fetchServices(): void {
    this.http.get<ServiceResponse>(`${API_URL}/logs/services`)
      .pipe(
        catchError(error => {
          console.error('Error fetching services:', error);
          return of({ success: false, data: [] });
        })
      )
      .subscribe(response => {
        if (response && response.success) {
          this.services = response.data;
        }
      });
  }
  
  deleteLogs(): void {
    if (this.deleteForm.value.confirmDelete !== 'CONFIRM_DELETE') {
      this.error = 'Please type CONFIRM_DELETE to proceed with deletion';
      return;
    }
    
    this.isDeleting = true;
    this.error = null;
    this.success = null;
    
    const payload = {
      olderThan: new Date(this.deleteForm.value.olderThan).toISOString(),
      confirmDelete: this.deleteForm.value.confirmDelete,
      level: this.deleteForm.value.level || undefined
    };
    
    this.http.delete<DeleteLogsResponse>(`${API_URL}/logs/delete`, { body: payload })
      .pipe(
        catchError(error => {
          this.error = error.error?.message || 'Failed to delete logs';
          return of(null);
        }),
        finalize(() => {
          this.isDeleting = false;
          this.showDeleteConfirm = false;
        })
      )
      .subscribe(response => {
        if (response && response.success) {
          this.success = response.message;
          this.fetchLogs(); // Refresh logs after deletion
          this.deleteForm.patchValue({ confirmDelete: '' }); // Clear confirmation
        }
      });
  }
  
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.fetchLogs();
    }
  }
  
  resetFilters(): void {
    this.filterForm.reset({
      limit: 100,
      sort: 'desc'
    });
    this.currentPage = 1;
    this.fetchLogs();
  }
  
  toggleExpandLog(id: string): void {
    if (this.expandedLogIds.has(id)) {
      this.expandedLogIds.delete(id);
    } else {
      this.expandedLogIds.add(id);
    }
  }
  
  isLogExpanded(id: string): boolean {
    return this.expandedLogIds.has(id);
  }
  
  formatDate(date: string): string {
    return this.datePipe.transform(date, 'MMM d, y, h:mm:ss a') || date;
  }
  
  formatDateForInput(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }
  
  getLogLevelClass(level: string): string {
    return this.levelColors[level.toLowerCase()] || 'text-gray-600 bg-gray-100';
  }
  
  toggleDeleteConfirm(): void {
    this.showDeleteConfirm = !this.showDeleteConfirm;
    if (!this.showDeleteConfirm) {
      this.deleteForm.patchValue({ confirmDelete: '' });
    }
  }
  
  getPageArray(): number[] {
    // Always show first page, last page, current page, and 1 page before and after current
    const pages: number[] = [];
    
    // First page
    pages.push(1);
    
    // Pages around current
    for (let i = Math.max(2, this.currentPage - 1); i <= Math.min(this.totalPages - 1, this.currentPage + 1); i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }
    
    // Last page
    if (this.totalPages > 1) {
      pages.push(this.totalPages);
    }
    
    return [...new Set(pages)].sort((a, b) => a - b);
  }
  
  // Get JSON representation of metadata for display
  formatMetadata(metadata: any): string {
    if (!metadata) return '';
    try {
      return JSON.stringify(metadata, null, 2);
    } catch (e) {
      return String(metadata);
    }
  }
}