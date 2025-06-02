import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { VaultEntry, VaultFilters, VaultService, VaultStatistics } from './vault-management.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-vault-management',
  templateUrl: './vault-management.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styleUrls: ['./vault-management.component.scss']
})
export class VaultManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data properties
  statistics: VaultStatistics | null = null;
  vaultEntries: VaultEntry[] = [];
  filteredEntries: VaultEntry[] = [];
  totalEntries = 0;
  hasMore = false;
  
  // UI state
  loading$: any;
  showStatistics = false;
  showActionsPanel = false;
  statisticsError = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  Math = Math; // For template access
  
  // Forms
  filterForm!: FormGroup;
  
  // Filter options
  purposeOptions = [
    { value: 'deposit', label: 'Deposit' },
    { value: 'withdrawal', label: 'Withdrawal' },
    { value: 'escrow', label: 'Escrow' },
    { value: 'fee_collection', label: 'Fee Collection' }
  ];
  
  networkOptions = [
    { value: 'BEP20', label: 'BEP20' },
    { value: 'SOLANA', label: 'Solana' }
  ];

  // Action states
  actionLoading = {
    cleanup: false,
    backup: false,
    deactivate: false
  };

  constructor(
    private vaultService: VaultService,
    private fb: FormBuilder
  ) {
    this.loading$ = this.vaultService.loading$;
    this.initializeFilterForm();
  }

  ngOnInit(): void {
    this.loadVaultEntries();
    this.setupFilterSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      isActive: [''],
      network: [''],
      purpose: ['']
    });
  }

  private setupFilterSubscription(): void {
    // Subscribe to search input changes with debounce
    this.filterForm.get('search')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });

    // Subscribe to dropdown changes
    ['isActive', 'network', 'purpose'].forEach(control => {
      this.filterForm.get(control)?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.applyFilters();
        });
    });
  }

  private applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredEntries = this.vaultEntries.filter(entry => {
      let matches = true;

      // Search text
      if (filters.search && filters.search.trim()) {
        const searchLower = filters.search.toLowerCase();
        matches = matches && (
          entry.transactionId.toLowerCase().includes(searchLower) ||
          entry.address.toLowerCase().includes(searchLower) ||
          entry.network.toLowerCase().includes(searchLower) ||
          entry.purpose.toLowerCase().includes(searchLower)
        );
      }

      // Status filter
      if (filters.isActive !== '') {
        matches = matches && entry.isActive === (filters.isActive === 'true');
      }

      // Network filter
      if (filters.network && filters.network !== '') {
        matches = matches && entry.network === filters.network;
      }

      // Purpose filter
      if (filters.purpose && filters.purpose !== '') {
        matches = matches && entry.purpose === filters.purpose;
      }

      return matches;
    });

    this.totalEntries = this.filteredEntries.length;
    this.currentPage = 1; // Reset to first page when filtering
  }

  get paginatedEntries(): VaultEntry[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredEntries.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.totalEntries / this.pageSize);
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  loadStatistics(): void {
    this.statisticsError = false;
    this.vaultService.getVaultStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          console.log('Statistics loaded from API:', stats);
          this.statistics = stats;
        },
        error: (error) => {
          console.error('Error loading statistics, calculating from entries:', error);
          // If statistics endpoint fails, calculate from entries data
          if (this.vaultEntries.length > 0) {
            this.calculateStatisticsFromEntries();
          } else {
            this.statisticsError = true;
          }
        }
      });
  }

  private calculateStatisticsFromEntries(): void {
    console.log('Calculating statistics from entries:', this.vaultEntries.length);
    
    if (this.vaultEntries.length === 0) {
      // Load entries first if not available
      this.loadVaultEntries();
      return;
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Calculate basic statistics
    const totalEntries = this.vaultEntries.length;
    const activeEntries = this.vaultEntries.filter(entry => entry.isActive).length;
    const expiredEntries = this.vaultEntries.filter(entry => 
      entry.expiresAt && new Date(entry.expiresAt) < now
    ).length;
    const recentActivity = this.vaultEntries.filter(entry => 
      new Date(entry.createdAt) > oneDayAgo
    ).length;

    // Calculate network breakdown
    const networkBreakdown: Record<string, number> = {};
    this.vaultEntries.forEach(entry => {
      networkBreakdown[entry.network] = (networkBreakdown[entry.network] || 0) + 1;
    });

    // Calculate purpose breakdown
    const purposeBreakdown: Record<string, number> = {};
    this.vaultEntries.forEach(entry => {
      purposeBreakdown[entry.purpose] = (purposeBreakdown[entry.purpose] || 0) + 1;
    });

    this.statistics = {
      totalEntries,
      activeEntries,
      expiredEntries,
      recentActivity,
      networkBreakdown,
      purposeBreakdown
    };

    console.log('Calculated statistics:', this.statistics);
  }

  loadVaultEntries(): void {
    const filters: VaultFilters = {
      limit: 1000 // Load all entries for client-side filtering
    };

    this.vaultService.listVaultEntries(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Vault entries loaded:', response);
          this.vaultEntries = response.entries;
          this.filteredEntries = [...this.vaultEntries];
          this.totalEntries = this.vaultEntries.length;
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error loading vault entries:', error);
        }
      });
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      isActive: '',
      network: '',
      purpose: ''
    });
    this.applyFilters();
  }

  toggleStatistics(): void {
    this.showStatistics = !this.showStatistics;
    if (this.showStatistics) {
      if (!this.statistics) {
        if (this.vaultEntries.length > 0) {
          // Calculate immediately if entries are already loaded
          this.calculateStatisticsFromEntries();
        } else {
          // Load entries first, which will trigger statistics calculation
          this.loadVaultEntries();
        }
      }
    }
  }

  refresh(): void {
    this.statistics = null; // Reset statistics
    this.statisticsError = false; // Reset error state
    this.loadVaultEntries();
  }

  // Actions
  async deactivateEntry(entry: VaultEntry): Promise<void> {
    if (!confirm(`Are you sure you want to deactivate the entry for transaction ${entry.transactionId}?`)) {
      return;
    }

    this.actionLoading.deactivate = true;
    
    try {
      const message = await this.vaultService.deactivateVaultEntry(entry.transactionId).toPromise();
      console.log(message);
      
      // Update the entry in the local array
      const index = this.vaultEntries.findIndex(e => e.transactionId === entry.transactionId);
      if (index > -1) {
        this.vaultEntries[index] = { ...this.vaultEntries[index], isActive: false };
        this.applyFilters(); // Reapply filters to update display
      }
      
      // Refresh statistics if shown
      if (this.showStatistics) {
        this.loadStatistics();
      }
      
    } catch (error) {
      console.error('Error deactivating entry:', error);
    } finally {
      this.actionLoading.deactivate = false;
    }
  }

  async cleanupExpiredEntries(): Promise<void> {
    if (!confirm('Are you sure you want to cleanup all expired entries? This action cannot be undone.')) {
      return;
    }

    this.actionLoading.cleanup = true;
    
    try {
      const result = await this.vaultService.cleanupExpiredEntries().toPromise();
      console.log(result?.message);
      
      // Refresh data
      this.loadVaultEntries();
      if (this.showStatistics) {
        this.loadStatistics();
      }
      
      // Close actions panel
      this.showActionsPanel = false;
      
    } catch (error) {
      console.error('Error cleaning up expired entries:', error);
    } finally {
      this.actionLoading.cleanup = false;
    }
  }

  async createBackup(): Promise<void> {
    if (!confirm('Create a backup of vault metadata?')) {
      return;
    }

    this.actionLoading.backup = true;
    
    try {
      const result = await this.vaultService.createBackup().toPromise();
      console.log(result?.message);
      
      // Close actions panel
      this.showActionsPanel = false;
      
    } catch (error) {
      console.error('Error creating backup:', error);
    } finally {
      this.actionLoading.backup = false;
    }
  }

  // Utility methods
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  getPurposeIcon(purpose: string): string {
    const icons: Record<string, string> = {
      deposit: '⬇️',
      withdrawal: '⬆️',
      escrow: '🔒',
      fee_collection: '💰'
    };
    return icons[purpose] || '📝';
  }

  getNetworkIcon(network: string): string {
    const icons: Record<string, string> = {
      BEP20: '🟡',
      SOLANA: '🟣'
    };
    return icons[network] || '🌐';
  }

  trackByTransactionId(index: number, entry: VaultEntry): string {
    return entry.transactionId;
  }
}