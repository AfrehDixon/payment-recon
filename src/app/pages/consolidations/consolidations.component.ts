import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Store } from '@ngxs/store';
import { AuthState } from '../../state/apps/app.states';
import * as XLSX from 'xlsx';

const BASE_URL = 'https://doronpay.com/api';

interface ChainLeg {
  chain: string;
  asset: string;
  address?: string;
  txid?: string;
  amountHuman?: string;
  amountBase?: string;
  decimals?: number;
  memo?: string;
  router?: string;
  vault?: string;
  confirmations?: number;
  observedAt?: string;
  meta?: Record<string, any>;
}

interface FeeBreakdown {
  networkFeeUsd?: number;
  protocolFeeUsd?: number;
  serviceFeeUsd?: number;
  totalFeeUsd?: number;
  raw?: Record<string, any>;
}

interface QuoteInfo {
  source?: 'THORNODE' | 'MIDGARD' | 'OKX' | 'INTERNAL' | 'OTHER';
  expectedOutBase?: string;
  minOutBase?: string;
  slippageBps?: number;
  expiry?: number;
  raw?: Record<string, any>;
}

interface Consolidation {
  _id: string;
  context?: {
    type?: 'SWEEP' | 'HEDGE' | 'PAYOUT' | 'REBALANCE';
    relatedTransactionId?: string;
    merchantId?: string;
    note?: string;
  };
  operator: string;
  status: string;
  direction?: string;
  inbound: ChainLeg;
  outbound?: ChainLeg;
  quote?: QuoteInfo;
  fees?: FeeBreakdown;
  lastPolledAt?: string;
  createdAt: string;
  updatedAt: string;
  lock?: boolean;
  lockBy?: string;
  lockAt?: string;
  errorMessage?: string;
  attempts?: number;
}

@Component({
  selector: 'app-consolidations',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './consolidations.component.html',
  styleUrls: ['./consolidations.component.scss'],
})
export class ConsolidationsComponent implements OnInit {
  consolidations: Consolidation[] = [];
  filteredConsolidations: Consolidation[] = [];
  loading = false;
  error: string | null = null;

  // Auth user data
  currentUser: any;

  // Bulk Selection
  selectedConsolidations: Set<string> = new Set();
  isAllSelected = false;
  isBulkProcessing = false;

  // Modal states
  showDetailsModal = false;
  showStatsModal = false;
  selectedConsolidation: Consolidation | null = null;
  statsData: any[] = [];

  // Filters and search
  searchTerm: string = '';
  operatorFilter: string = '';
  statusFilter: string = '';
  directionFilter: string = '';
  chainFilter: string = '';
  assetFilter: string = '';
  dateFrom: string = '';
  dateTo: string = '';

  // Pagination
  currentPage = 1;
  pageSize = 25;
  totalItems = 0;
  totalPages = 0;

  // Sort
  sortBy = 'createdAt';
  sortOrder = 'desc';

  // Filter options
  operators = ['THOR', 'BEP20', 'TRC20', 'SOLANA', 'OKX', 'INTERNAL'];
  statuses = [
    'PENDING_INBOUND',
    'OBSERVED', 
    'OUTBOUND_PENDING',
    'COMPLETED',
    'REFUNDED',
    'FAILED'
  ];
  chains = ['BTC', 'BSC', 'ETH', 'TRON', 'SOLANA', 'LTC', 'DOGE', 'AVAX', 'BASE', 'XRP', 'GAIA'];
  
  // Math utility for template
  Math = Math;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private store: Store
  ) {
    this.currentUser = this.store.selectSnapshot(AuthState.user);
  }

  ngOnInit(): void {
    this.currentUser = this.store.selectSnapshot(AuthState.user);
    this.loadConsolidations();
  }

  // Bulk Selection Methods
  toggleSelectAll(): void {
    if (this.isAllSelected) {
      this.selectedConsolidations.clear();
    } else {
      this.filteredConsolidations.forEach((consolidation) => {
        this.selectedConsolidations.add(consolidation._id);
      });
    }
    this.updateSelectAllState();
  }

  toggleConsolidationSelection(consolidationId: string): void {
    if (this.selectedConsolidations.has(consolidationId)) {
      this.selectedConsolidations.delete(consolidationId);
    } else {
      this.selectedConsolidations.add(consolidationId);
    }
    this.updateSelectAllState();
  }

  updateSelectAllState(): void {
    this.isAllSelected =
      this.filteredConsolidations.length > 0 &&
      this.filteredConsolidations.every((consolidation) =>
        this.selectedConsolidations.has(consolidation._id)
      );
  }

  getSelectedConsolidationsCount(): number {
    return this.selectedConsolidations.size;
  }

  getSelectedConsolidations(): Consolidation[] {
    return this.filteredConsolidations.filter((consolidation) =>
      this.selectedConsolidations.has(consolidation._id)
    );
  }

  isConsolidationSelected(consolidationId: string): boolean {
    return this.selectedConsolidations.has(consolidationId);
  }

  clearSelection(): void {
    this.selectedConsolidations.clear();
    this.updateSelectAllState();
  }

  // Export to Excel
  exportSelectedToExcel(): void {
    if (this.selectedConsolidations.size === 0) {
      alert('Please select at least one consolidation to export.');
      return;
    }

    const selectedData = this.getSelectedConsolidations();
    this.exportToExcel(selectedData, 'selected-consolidations');
  }

  exportAllToExcel(): void {
    if (this.filteredConsolidations.length === 0) {
      alert('No consolidations to export.');
      return;
    }
    this.exportToExcel(this.filteredConsolidations, 'all-consolidations');
  }

  private exportToExcel(data: Consolidation[], prefix: string): void {
    const excelData = data.map((consolidation) => ({
      'ID': consolidation._id,
      'Operator': consolidation.operator,
      'Status': consolidation.status,
      'Direction': consolidation.direction || '',
      'Context Type': consolidation.context?.type || '',
      'Context Note': consolidation.context?.note || '',
      'Inbound Chain': consolidation.inbound.chain,
      'Inbound Asset': consolidation.inbound.asset,
      'Inbound Amount': consolidation.inbound.amountHuman || '',
      'Inbound Address': consolidation.inbound.address || '',
      'Inbound TxID': consolidation.inbound.txid || '',
      'Inbound Confirmations': consolidation.inbound.confirmations || 0,
      'Outbound Chain': consolidation.outbound?.chain || '',
      'Outbound Asset': consolidation.outbound?.asset || '',
      'Outbound Amount': consolidation.outbound?.amountHuman || '',
      'Outbound Address': consolidation.outbound?.address || '',
      'Outbound TxID': consolidation.outbound?.txid || '',
      'Outbound Confirmations': consolidation.outbound?.confirmations || 0,
      'Quote Source': consolidation.quote?.source || '',
      'Expected Out': consolidation.quote?.expectedOutBase || '',
      'Min Out': consolidation.quote?.minOutBase || '',
      'Slippage BPS': consolidation.quote?.slippageBps || '',
      'Network Fee USD': consolidation.fees?.networkFeeUsd || 0,
      'Protocol Fee USD': consolidation.fees?.protocolFeeUsd || 0,
      'Service Fee USD': consolidation.fees?.serviceFeeUsd || 0,
      'Total Fee USD': consolidation.fees?.totalFeeUsd || 0,
      'Error Message': consolidation.errorMessage || '',
      'Attempts': consolidation.attempts || 0,
      'Locked': consolidation.lock ? 'Yes' : 'No',
      'Lock By': consolidation.lockBy || '',
      'Lock At': consolidation.lockAt ? this.formatDate(consolidation.lockAt) : '',
      'Last Polled': consolidation.lastPolledAt ? this.formatDate(consolidation.lastPolledAt) : '',
      'Created At': this.formatDate(consolidation.createdAt),
      'Updated At': this.formatDate(consolidation.updatedAt),
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();

    // Auto-size columns
    const range = XLSX.utils.decode_range(ws['!ref']!);
    const colWidths: { wch: number }[] = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxWidth = 10;
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellAddress];
        if (cell && cell.v) {
          const cellLength = cell.v.toString().length;
          maxWidth = Math.max(maxWidth, cellLength);
        }
      }
      colWidths.push({ wch: Math.min(maxWidth + 2, 50) });
    }
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Consolidations');

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `${prefix}-${dateStr}.xlsx`;

    XLSX.writeFile(wb, filename);

    alert(
      `Successfully exported ${excelData.length} consolidation${
        excelData.length !== 1 ? 's' : ''
      } to ${filename}`
    );
  }

  // Data Loading
  loadConsolidations(): void {
    this.loading = true;
    this.error = null;

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize,
      sortBy: this.sortBy,
      sortDir: this.sortOrder,
    };

    // Add filters
    if (this.operatorFilter) params.operator = this.operatorFilter;
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.directionFilter) params.direction = this.directionFilter;
    if (this.chainFilter) params.chain = this.chainFilter;
    if (this.assetFilter) params.asset = this.assetFilter;
    if (this.dateFrom) params.from = this.dateFrom;
    if (this.dateTo) params.to = this.dateTo;

    // Add search if provided
    if (this.searchTerm.trim()) {
      // Since the backend doesn't have a general search, we can search by ID, inboundTxId, or outboundTxId
      if (this.searchTerm.length === 24 && /^[0-9a-fA-F]{24}$/.test(this.searchTerm)) {
        params.id = this.searchTerm;
      } else {
        params.inboundTxId = this.searchTerm;
        // Note: The backend doesn't support OR queries for multiple tx searches in a single call
        // You might need to enhance the backend or implement client-side filtering
      }
    }

    const queryString = Object.keys(params)
      .map((key) => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');

    this.http.get<any>(`${BASE_URL}/consolidations/get?${queryString}`).subscribe({
      next: (response) => {
        if (response.success) {
          this.consolidations = response.data || [];
          this.filteredConsolidations = this.consolidations;

          if (response.meta) {
            this.totalItems = response.meta.total;
            this.totalPages = response.meta.pages;
          } else {
            this.totalItems = this.consolidations.length;
            this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          }

          this.updateSelectAllState();

          // Clear invalid selections
          const validIds = new Set(this.consolidations.map((c) => c._id));
          this.selectedConsolidations.forEach((id) => {
            if (!validIds.has(id)) {
              this.selectedConsolidations.delete(id);
            }
          });
        } else {
          this.error = response.message || 'Failed to load consolidations';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'An error occurred while loading consolidations';
        this.loading = false;
        console.error('Load consolidations error:', error);
      },
    });
  }

  // Load stats for dashboard
  loadStats(): void {
    this.http.get<any>(`${BASE_URL}/consolidations/stats`).subscribe({
      next: (response) => {
        if (response.success) {
          this.statsData = response.data || [];
          this.showStatsModal = true;
        } else {
          this.error = response.message || 'Failed to load stats';
        }
      },
      error: (error) => {
        this.error = 'An error occurred while loading stats';
        console.error('Load stats error:', error);
      },
    });
  }

  // Filtering and Search
  onFilterChange(): void {
    this.currentPage = 1;
    this.clearSelection();
    this.loadConsolidations();
  }

  onSearchChange(event: KeyboardEvent): void {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.searchTerm = searchTerm;
    this.currentPage = 1;
    this.clearSelection();
    
    // Debounce the search
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadConsolidations();
    }, 500);
  }
  private searchTimeout: any;

  // Pagination
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.clearSelection();
      this.loadConsolidations();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.clearSelection();
    this.loadConsolidations();
  }

  // Sorting
  changeSort(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'desc';
    }
    this.clearSelection();
    this.loadConsolidations();
  }

  // Modal Management
  openDetailsModal(consolidation: Consolidation): void {
    this.selectedConsolidation = consolidation;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedConsolidation = null;
  }

  closeStatsModal(): void {
    this.showStatsModal = false;
    this.statsData = [];
  }

  // Utility Methods
  formatCurrency(amount: number | string, currency: string = 'USD'): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return 'N/A';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(numAmount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatAmount(amount: string | undefined, decimals: number = 8): string {
    if (!amount) return 'N/A';
    
    // If it's a base amount, convert to human readable
    const numAmount = parseFloat(amount);
    if (decimals > 0 && numAmount > Math.pow(10, decimals - 1)) {
      return (numAmount / Math.pow(10, decimals)).toFixed(8);
    }
    return numAmount.toFixed(8);
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'PENDING_INBOUND': 'status-pending',
      'OBSERVED': 'status-observed',
      'OUTBOUND_PENDING': 'status-processing',
      'COMPLETED': 'status-completed',
      'REFUNDED': 'status-refunded',
      'FAILED': 'status-failed',
    };
    return statusClasses[status] || 'status-default';
  }

  getContextTypeClass(contextType: string): string {
    const contextClasses: { [key: string]: string } = {
      'SWEEP': 'context-sweep',
      'HEDGE': 'context-hedge', 
      'PAYOUT': 'context-payout',
      'REBALANCE': 'context-rebalance',
    };
    return contextClasses[contextType] || 'context-default';
  }

  getTotalFeeUsd(consolidation: Consolidation): number {
    return consolidation.fees?.totalFeeUsd || 0;
  }

  getConfirmationStatus(confirmations: number = 0, required: number = 1): string {
    if (confirmations >= required) return 'confirmed';
    if (confirmations > 0) return 'partial';
    return 'pending';
  }

  // Pagination Helper
  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(this.totalPages);
      }
    }

    return pages;
  }

  getQuoteExpiryDate(consolidation: any): string {
  if (consolidation?.quote?.expiry) {
    const date = new Date(consolidation.quote.expiry * 1000);
    return this.formatDate(date.toISOString());
  }
  return '';
}

  isNumber(value: any): value is number {
    return typeof value === 'number';
  }
}