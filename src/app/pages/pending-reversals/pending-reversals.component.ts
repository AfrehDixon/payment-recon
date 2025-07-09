import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { AuthState } from '../../state/apps/app.states';

const BASE_URL = 'https://doronpay.com/api';

enum EOperator {
  DORON = "DORON",
  PEOPLESPAY = "PEOPLESPAY",
  FIDELITY = "FIDELITY",
  SOLANA = "SOLANA",
  GTCARD = "GTCARD",
  MOOLRE = "MOOLRE",
  PCARD = "PCARD",
  TRC20 = "TRC20",
  ERC20 = "ERC20",
  GTB = "GTB",
  FAB = "FAB",
  BTC = "BTC",
  GIP = "GIP",
  BEP20 = "BEP20",
}

interface Merchant {
  _id: string;
  merchant_tradeName?: string;
  name?: string;
  email?: string;
  phone?: string;
  active: boolean;
}

interface TransactionData {
  _id: string;
  transactionRef: string;
  walletType: string;
  operator: string;
  channel: string;
  merchantId: string;
  payment_account_name: string;
  payment_account_number: string;
  payment_account_issuer: string;
  payment_account_type: string;
  actualAmount: number;
  amount: number;
  charges: number;
  profitEarned: number;
  recipient_account_name: string;
  recipient_account_number: string;
  recipient_account_issuer: string;
  recipient_account_type: string;
  transaction_type: string;
  status: string;
  description: string;
  reason?: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

interface PendingReversal {
  _id: string;
  reversalId: string;
  originalTransactionId: {
    reason: string;
  };
  originalTransactionRef: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'FAILED';
  reversalTransactionData: {
    reversalTransactionId: string;
    transaction_type: string;
    originalTransactionStatus: string;
    transactionRef: string;
    description: string;
    reason: string;
    recipient_account_issuer: string;
    recipient_account_number: string;
    recipient_account_name: string;
    payment_account_number: string;
    payment_account_issuer: string;
    recipient_account_type: string;
    payment_account_name: string;
    payment_account_type: string;
    merchantId: string;
    operator: string;
    amount: number;
    actualAmount: number;
    currency: string;
    channel: string;
    charges: number;
  };
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  processedTransactionId?: string;
  processedAt?: string;
  processingError?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    functionName: string;
    environment: string;
    instanceId: string;
    autoReversalConfig: any;
  };
}

@Component({
  selector: 'app-pending-reversals',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './pending-reversals.component.html',
  styleUrls: ['./pending-reversals.component.scss']
})
export class PendingReversalsComponent implements OnInit {
  reversals: PendingReversal[] = [];
  filteredReversals: PendingReversal[] = [];
  merchants: Merchant[] = [];
  loading = false;
  error: string | null = null;
  
  // Auth user data
  currentUser: any;
  
  // Bulk Selection
  selectedReversals: Set<string> = new Set();
  isAllSelected = false;
  isBulkProcessing = false;
  bulkProcessProgress = 0;
  bulkProcessTotal = 0;
  showBulkConfirm = false;
  
  // Transaction verification
  verifyingTransaction = false;
  verifiedTransaction: TransactionData | null = null;
  transactionVerificationError: string | null = null;
  
  // Forms
  createReversalForm: FormGroup;
  reviewForm: FormGroup;
  processForm: FormGroup;
  bulkReviewForm: FormGroup;
  
  // Modal states
  showCreateReversalModal = false;
  showReviewModal = false;
  showProcessModal = false;
  showDetailsModal = false;
  showBulkReviewModal = false;
  selectedReversal: PendingReversal | null = null;
  
  // Filters and search
  searchTerm: string = '';
  statusFilter: string = '';
  merchantFilter: string = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  
  // Sort
  sortBy = 'createdAt';
  sortOrder = 'desc';

  // Operators enum for dropdown
  operators = Object.values(EOperator);
  
  // Math utility for template
  Math = Math;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private store: Store
  ) {
    // Get current user from auth state
    this.currentUser = this.store.selectSnapshot(AuthState.user);
    
    this.createReversalForm = this.fb.group({
      originalTransactionRef: ['', Validators.required],
    });

    this.reviewForm = this.fb.group({
      action: ['', Validators.required],
      reviewedBy: [this.currentUser?.name || this.currentUser?._id],
      rejectionReason: [''],
      notes: ['']
    });

    this.processForm = this.fb.group({
      processedBy: [this.currentUser?.name || this.currentUser?._id]
    });

    // Bulk review form
    this.bulkReviewForm = this.fb.group({
      action: ['APPROVE', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Ensure currentUser is loaded from state
    this.currentUser = this.store.selectSnapshot(AuthState.user);
    this.loadReversals();
    this.loadMerchants();
  }

  // Bulk Selection Methods
  toggleSelectAll(): void {
    if (this.isAllSelected) {
      this.selectedReversals.clear();
    } else {
      this.getSelectableReversals().forEach(reversal => {
        this.selectedReversals.add(reversal.reversalId);
      });
    }
    this.updateSelectAllState();
  }

  toggleReversalSelection(reversalId: string): void {
    if (this.selectedReversals.has(reversalId)) {
      this.selectedReversals.delete(reversalId);
    } else {
      this.selectedReversals.add(reversalId);
    }
    this.updateSelectAllState();
  }

  updateSelectAllState(): void {
    const selectableReversals = this.getSelectableReversals();
    this.isAllSelected = selectableReversals.length > 0 && 
      selectableReversals.every(reversal => this.selectedReversals.has(reversal.reversalId));
  }

  getSelectableReversals(): PendingReversal[] {
    return this.filteredReversals.filter(reversal => this.canReview(reversal));
  }

  getSelectedReversalsCount(): number {
    return this.selectedReversals.size;
  }

  getSelectedReversals(): PendingReversal[] {
    return this.filteredReversals.filter(reversal => this.selectedReversals.has(reversal.reversalId));
  }

  isReversalSelected(reversalId: string): boolean {
    return this.selectedReversals.has(reversalId);
  }

  clearSelection(): void {
    this.selectedReversals.clear();
    this.updateSelectAllState();
  }

  // Bulk Operations
  openBulkReviewModal(): void {
    if (this.selectedReversals.size === 0) return;
    this.showBulkReviewModal = true;
    this.bulkReviewForm.reset({
      action: 'APPROVE',
      notes: ''
    });
  }

  closeBulkReviewModal(): void {
    this.showBulkReviewModal = false;
    this.bulkReviewForm.reset();
  }

  async submitBulkReview(): Promise<void> {
    if (!this.bulkReviewForm.valid || this.selectedReversals.size === 0) return;

    this.isBulkProcessing = true;
    this.bulkProcessProgress = 0;
    this.bulkProcessTotal = this.selectedReversals.size;
    
    const formValue = this.bulkReviewForm.value;
    const selectedReversals = this.getSelectedReversals();
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < selectedReversals.length; i++) {
      const reversal = selectedReversals[i];
      
      try {
        const reviewData = {
          action: formValue.action,
          reviewedBy: this.currentUser?._id || this.currentUser?.name || 'UNKNOWN_USER',
          notes: formValue.notes
        };

        const response = await this.http.put<any>(
          `${BASE_URL}/reversals/pending/${reversal.reversalId}/review`, 
          reviewData
        ).toPromise();

        if (response.success) {
          successCount++;
          
          // If approved, also process the reversal
          if (formValue.action === 'APPROVE') {
            try {
              const processData = {
                processedBy: this.currentUser?._id || this.currentUser?.name || 'UNKNOWN_USER'
              };
              
              await this.http.post<any>(
                `${BASE_URL}/reversals/pending/${reversal.reversalId}/process`, 
                processData
              ).toPromise();
            } catch (processError) {
              console.error(`Failed to process reversal ${reversal.reversalId}:`, processError);
              // Don't count this as an error since the approval succeeded
            }
          }
        } else {
          errorCount++;
          errors.push(`${reversal.reversalId}: ${response.message || 'Unknown error'}`);
        }
      } catch (error: any) {
        errorCount++;
        errors.push(`${reversal.reversalId}: ${error.message || 'Network error'}`);
      }

      this.bulkProcessProgress = i + 1;
    }

    this.isBulkProcessing = false;
    
    // Show results
    if (successCount > 0) {
      const action = formValue.action === 'APPROVE' ? 'approved and processed' : 'reviewed';
      alert(`Successfully ${action} ${successCount} reversal${successCount !== 1 ? 's' : ''}${errorCount > 0 ? `. ${errorCount} failed.` : '.'}`);
    }
    
    if (errorCount > 0 && errors.length > 0) {
      console.error('Bulk operation errors:', errors);
      if (successCount === 0) {
        this.error = `Failed to process reversals: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`;
      }
    }

    // Refresh data and clear selection
    this.loadReversals();
    this.clearSelection();
    this.closeBulkReviewModal();
  }

  // Existing methods remain the same...
  loadMerchants(): void {
    this.http.get<any>(`${BASE_URL}/merchants/get`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.merchants = response.data.filter((merchant: Merchant) => merchant.active);
          } else {
            this.error = 'Failed to load merchants';
          }
        },
        error: (error) => {
          this.error = 'An error occurred while loading merchants';
        }
      });
  }

  verifyTransaction(): void {
    const transactionRef = this.createReversalForm.get('originalTransactionRef')?.value;
    
    if (!transactionRef || !transactionRef.trim()) {
      this.transactionVerificationError = 'Please enter a transaction reference';
      return;
    }

    this.verifyingTransaction = true;
    this.transactionVerificationError = null;
    this.verifiedTransaction = null;

    this.http.get<any>(`${BASE_URL}/transactions/get/${transactionRef.trim()}`)
      .subscribe({
        next: (response) => {
          this.verifyingTransaction = false;
          
          if (response.success && response.data && response.data.length > 0) {
            this.verifiedTransaction = response.data[0];
            this.transactionVerificationError = null;
            
            if (this.verifiedTransaction) {
              this.populateFormWithTransactionData(this.verifiedTransaction);
            }
          } else {
            this.transactionVerificationError = 'Transaction not found or no data available';
            this.verifiedTransaction = null;
          }
        },
        error: (error) => {
          this.verifyingTransaction = false;
          this.transactionVerificationError = 'Failed to verify transaction. Please check the reference and try again.';
          this.verifiedTransaction = null;
          console.error('Transaction verification error:', error);
        }
      });
  }

  populateFormWithTransactionData(transaction: TransactionData): void {
    const reversalData = this.createReversalForm.get('reversalTransactionData') as FormGroup;
    
    if (reversalData) {
      reversalData.patchValue({
        merchantId: transaction.merchantId,
        operator: transaction.operator,
        amount: transaction.amount,
        actualAmount: transaction.actualAmount,
        currency: transaction.currency,
        channel: transaction.channel,
        charges: transaction.charges,
        recipient_account_issuer: transaction.recipient_account_issuer,
        recipient_account_number: transaction.recipient_account_number,
        recipient_account_name: transaction.recipient_account_name,
        payment_account_number: transaction.payment_account_number,
        payment_account_issuer: transaction.payment_account_issuer,
        recipient_account_type: transaction.recipient_account_type,
        payment_account_name: transaction.payment_account_name,
        payment_account_type: transaction.payment_account_type,
        description: `Reversal for transaction ${transaction.transactionRef}`,
        reason: transaction.reason || 'Transaction failed'
      });
    }
  }

  resetTransactionVerification(): void {
    this.verifiedTransaction = null;
    this.transactionVerificationError = null;
    
    const currentRef = this.createReversalForm.get('originalTransactionRef')?.value;
    this.createReversalForm.reset();
    this.createReversalForm.patchValue({
      originalTransactionRef: currentRef,
      createdBy: this.currentUser?.name || this.currentUser?._id
    });
  }

  loadReversals(): void {
    this.loading = true;
    const params: any = {
      page: this.currentPage,  
      limit: this.pageSize,   
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };

    if (this.statusFilter) {
      params.status = this.statusFilter;
    }

    if (this.merchantFilter) {
      params.merchantId = this.merchantFilter;
    }

    if (this.searchTerm.trim()) {
      params.search = this.searchTerm;
    }

    const queryString = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');

    this.http.get<any>(`${BASE_URL}/reversals/pending?${queryString}`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.reversals = response.data.reversals || response.data;
            this.filteredReversals = this.reversals;
            
            if (response.data.pagination) {
              this.totalItems = response.data.pagination.total;
              this.totalPages = response.data.pagination.pages;
            } else {
              this.totalItems = this.reversals.length;
              this.totalPages = Math.ceil(this.totalItems / this.pageSize);
            }
            
            // Update selection state after loading
            this.updateSelectAllState();
            
            // Clear invalid selections
            const validIds = new Set(this.reversals.map(r => r.reversalId));
            this.selectedReversals.forEach(id => {
              if (!validIds.has(id)) {
                this.selectedReversals.delete(id);
              }
            });
          } else {
            this.error = response.message || 'Failed to load reversals';
          }
          this.loading = false;
        },
        error: (error) => {
          this.error = 'An error occurred while loading reversals';
          this.loading = false;
        }
      });
  }

  // Rest of the existing methods remain unchanged...
  searchReversals(event: KeyboardEvent): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm = searchTerm;
    this.filterReversals();
  }

  filterReversals(): void {
    let filtered = [...this.reversals];

    if (this.searchTerm.trim()) {
      filtered = filtered.filter(reversal => {
        const merchantName = this.getMerchantName(reversal.reversalTransactionData.merchantId);
        return (
          reversal.reversalId.toLowerCase().includes(this.searchTerm) ||
          reversal.originalTransactionRef.toLowerCase().includes(this.searchTerm) ||
          reversal.reversalTransactionData.merchantId.toLowerCase().includes(this.searchTerm) ||
          merchantName.toLowerCase().includes(this.searchTerm) ||
          reversal.reversalTransactionData.reason.toLowerCase().includes(this.searchTerm) ||
          reversal.reversalTransactionData.description.toLowerCase().includes(this.searchTerm)
        );
      });
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.filteredReversals = filtered.slice(startIndex, startIndex + this.pageSize);
    
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);

    this.filteredReversals = filtered;
    this.updateSelectAllState();
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.clearSelection();
    this.loadReversals();
  }

  onMerchantFilterChange(): void {
    this.currentPage = 1;
    this.clearSelection();
    this.loadReversals();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.clearSelection();
      this.loadReversals();
    }
  }

  changeSort(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'desc';
    }
    this.clearSelection();
    this.loadReversals();
  }

  // Modal methods
  openCreateReversalModal(): void {
    this.showCreateReversalModal = true;
    this.verifiedTransaction = null;
    this.transactionVerificationError = null;
  }

  closeCreateReversalModal(): void {
    this.showCreateReversalModal = false;
    this.createReversalForm.reset();
    this.verifiedTransaction = null;
    this.transactionVerificationError = null;
  }

  openReviewModal(reversal: PendingReversal): void {
    this.selectedReversal = reversal;
    this.reviewForm.reset({
      action: '',
      rejectionReason: '',
      notes: ''
    });
    this.showReviewModal = true;
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.selectedReversal = null;
    this.reviewForm.reset({
      action: '',
      rejectionReason: '',
      notes: ''
    });
  }

  openProcessModal(reversal: PendingReversal): void {
    this.selectedReversal = reversal;
    this.showProcessModal = true;
  }

  closeProcessModal(): void {
    this.showProcessModal = false;
    this.selectedReversal = null;
  }

  openDetailsModal(reversal: PendingReversal): void {
    this.selectedReversal = reversal;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedReversal = null;
  }

  // Form submissions
  submitCreateReversal(): void {
    if (this.createReversalForm.valid && this.verifiedTransaction) {
      this.loading = true;
      this.http.post(`${BASE_URL}/reversals/pending`, this.createReversalForm.value)
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.loadReversals();
              this.closeCreateReversalModal();
            } else {
              this.error = response.message || 'Failed to create reversal';
            }
            this.loading = false;
          },
          error: (error) => {
            this.error = 'An error occurred while creating the reversal';
            this.loading = false;
          }
        });
    }
  }

  isNumber(value: any): value is number {
    return typeof value === 'number';
  }

  submitReview(): void {
    if (this.reviewForm.valid && this.selectedReversal) {
      this.loading = true;

      const action = this.reviewForm.value.action;
      const reviewData: any = {
        ...this.reviewForm.value,
        reviewedBy: this.currentUser?._id || this.currentUser?.name || 'UNKNOWN_USER'
      };
      // Ensure rejectionReason is included only when action is 'REJECT'
      if (action !== 'REJECT') {
        delete reviewData.rejectionReason;
      } else {
        reviewData.rejectionReason = this.reviewForm.value.rejectionReason;
      }
      // Only include notes if not empty or whitespace
      if (!this.reviewForm.value.notes || !this.reviewForm.value.notes.trim()) {
        delete reviewData.notes;
      }

      this.http.put(`${BASE_URL}/reversals/pending/${this.selectedReversal.reversalId}/review`, reviewData)
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.loadReversals();
              this.closeReviewModal();
            } else {
              this.error = response.message || 'Failed to review reversal';
            }
            this.loading = false;
          },
          error: (error) => {
            this.error = 'An error occurred while reviewing the reversal';
            this.loading = false;
          }
        });
    }
  }

  submitProcess(): void {
    if (this.selectedReversal) {
      this.loading = true;
      
      const processData = {
        processedBy: this.currentUser?._id || this.currentUser?.name || 'UNKNOWN_USER'
      };
      
      this.http.post(`${BASE_URL}/reversals/pending/${this.selectedReversal.reversalId}/process`, processData)
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.loadReversals();
              this.closeProcessModal();
            } else {
              this.error = response.message || 'Failed to process reversal';
            }
            this.loading = false;
          },
          error: (error) => {
            this.error = 'An error occurred while processing the reversal';
            this.loading = false;
          }
        });
    }
  }

  // Utility methods
  formatCurrency(amount: number, currency: string = 'GHS'): string {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'PENDING': 'status-pending',
      'UNDER_REVIEW': 'status-under-review',
      'APPROVED': 'status-approved',
      'REJECTED': 'status-rejected',
      'PROCESSED': 'status-processed',
      'FAILED': 'status-failed'
    };
    return statusClasses[status] || 'status-default';
  }

  canReview(reversal: PendingReversal): boolean {
    return ['PENDING', 'UNDER_REVIEW'].includes(reversal.status);
  }

  canProcess(reversal: PendingReversal): boolean {
    return reversal.status === 'APPROVED';
  }

  getActionButtons(reversal: PendingReversal): string[] {
    const actions = ['view'];
    
    if (this.canReview(reversal)) {
      actions.push('review');
    }
    
    if (this.canProcess(reversal)) {
      actions.push('process');
    }
    
    return actions;
  }

  onReviewActionChange(): void {
    const action = this.reviewForm.get('action')?.value;
    const rejectionReasonControl = this.reviewForm.get('rejectionReason');
    
    if (action === 'REJECT') {
      rejectionReasonControl?.setValidators([Validators.required]);
    } else {
      rejectionReasonControl?.clearValidators();
    }
    rejectionReasonControl?.updateValueAndValidity();
  }

  getMerchantName(merchantId: string): string {
    const merchant = this.merchants.find(m => m._id === merchantId);
    return merchant?.merchant_tradeName || merchant?.name || 'Unknown Merchant';
  }

  getMerchantDisplayName(merchant: Merchant): string {
    return merchant.merchant_tradeName || merchant.name || `Merchant ${merchant._id}`;
  }

  // Pagination methods
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

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.clearSelection();
    this.loadReversals();
  }
}