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
  showCreatePanel = false;
  statisticsError = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  Math = Math; // For template access
  
  // Forms
  filterForm!: FormGroup;
  createForm!: FormGroup;
  
  // Filter options
  typeOptions = [
    { value: 'private_key', label: 'Private Key' },
    { value: 'mnemonic', label: 'Mnemonic' }
  ];
  
  networkOptions = [
    { value: 'BEP20', label: 'BEP20' },
    { value: 'SOLANA', label: 'Solana' },
    { value: 'ETHEREUM', label: 'Ethereum' },
    { value: 'BITCOIN', label: 'Bitcoin' },
    { value: 'TRC20', label: 'TRC20' }
  ];

  // Action states
  actionLoading = {
    cleanup: false,
    backup: false,
    deactivate: false,
    create: false,
    activate: false
  };

  constructor(
    private vaultService: VaultService,
    private fb: FormBuilder
  ) {
    this.loading$ = this.vaultService.loading$;
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadVaultEntries();
    this.setupFilterSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.filterForm = this.fb.group({
      search: [''],
      isActive: [''],
      network: [''],
      type: ['']
    });

    this.createForm = this.fb.group({
      identifier: [''],
      data: [''],
      type: ['private_key'],
      network: [''],
      expiresAt: [''],
      metadata: ['']
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
    ['isActive', 'network', 'type'].forEach(control => {
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
          (entry.identifier && entry.identifier.toLowerCase().includes(searchLower)) ||
          (entry.type && entry.type.toLowerCase().includes(searchLower)) ||
          (!!entry.network && entry.network.toLowerCase().includes(searchLower)) ||
          (!!entry.createdBy && entry.createdBy.toLowerCase().includes(searchLower))
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

      // Type filter
      if (filters.type && filters.type !== '') {
        matches = matches && entry.type === filters.type;
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
      if (entry.network) {
        networkBreakdown[entry.network] = (networkBreakdown[entry.network] || 0) + 1;
      }
    });

    // Calculate type breakdown
    const typeBreakdown: Record<string, number> = {};
    this.vaultEntries.forEach(entry => {
      typeBreakdown[entry.type] = (typeBreakdown[entry.type] || 0) + 1;
    });

    this.statistics = {
      totalEntries,
      activeEntries,
      expiredEntries,
      recentActivity,
      networkBreakdown,
      typeBreakdown
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
      type: ''
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

  // Create new entry
  async createEntry(): Promise<void> {
    if (!this.createForm.valid || !this.createForm.value.identifier || !this.createForm.value.data) {
      alert('Please fill in all required fields');
      return;
    }

    this.actionLoading.create = true;
    
    try {
      const formData = this.createForm.value;
      const payload = {
        identifier: formData.identifier,
        data: formData.data,
        type: formData.type,
        network: formData.network || undefined,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined,
        metadata: formData.metadata ? JSON.parse(formData.metadata) : undefined
      };

      const result = await this.vaultService.createVaultEntry(payload).toPromise();
      console.log('Entry created:', result);
      
      // Reset form and close panel
      this.createForm.reset({ type: 'private_key' });
      this.showCreatePanel = false;
      
      // Refresh data
      this.loadVaultEntries();
      if (this.showStatistics) {
        this.loadStatistics();
      }
      
    } catch (error) {
      console.error('Error creating entry:', error);
      alert('Error creating entry. Please try again.');
    } finally {
      this.actionLoading.create = false;
    }
  }

  async activateEntry(entry: VaultEntry): Promise<void> {
 if (!confirm(`Are you sure you want to deactivate the entry with identifier "${entry.identifier}"?`)) {
      return;
    }

    this.actionLoading.deactivate = true;

    this.actionLoading.activate = true;
    
    try {
      const message = await this.vaultService.activateVaultEntry(entry.identifier).toPromise();
      console.log(message);
      
      // Update the entry in the local array
      const index = this.vaultEntries.findIndex(e => e.identifier === entry.identifier);
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
  // Actions
  async deactivateEntry(entry: VaultEntry): Promise<void> {
    if (!confirm(`Are you sure you want to deactivate the entry with identifier "${entry.identifier}"?`)) {
      return;
    }

    this.actionLoading.deactivate = true;
    
    try {
      const message = await this.vaultService.deactivateVaultEntry(entry.identifier).toPromise();
      console.log(message);
      
      // Update the entry in the local array
      const index = this.vaultEntries.findIndex(e => e.identifier === entry.identifier);
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

  formatIdentifier(identifier: string): string {
    if (identifier.length > 20) {
      return `${identifier.slice(0, 8)}...${identifier.slice(-8)}`;
    }
    return identifier;
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      private_key: '🔑',
      mnemonic: '📝'
    };
    return icons[type] || '🔒';
  }

  getNetworkIcon(network: string): string {
    const icons: Record<string, string> = {
      BEP20: '🟡',
      SOLANA: '🟣',
      ETHEREUM: '💎',
      BITCOIN: '🟠'
    };
    return icons[network] || '🌐';
  }

  trackByIdentifier(index: number, entry: VaultEntry): string {
    return entry.identifier;
  }
}