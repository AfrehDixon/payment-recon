// issues-list.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PayoutReconciliationService } from '../../pages/payout-recon/payout-recon.component.service';
import { CommonModule } from '@angular/common';

interface Issue {
  _id: string;
  merchantId: string;
  totalPayouts: number;
  failedPayouts: number;
  pendingPayouts: number;
  successfulPayouts: number;
  correctReversals: number;
  missingReversals: number;
  doubleReversals: number;
  excessReversalAmount: number;
  insufficientReversalAmount: number;
  issues: {
    transactionId: string;
    transactionRef: string;
    issueType: 'MISSING_REVERSAL' | 'DOUBLE_REVERSAL' | 'AMOUNT_MISMATCH' | 'OTHER';
    description: string;
    _id: string;
    createdAt: string;
  };
  lastUpdated: string;
  createdAt: string;
  __v: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface MerchantInfo {
  _id: string;
  merchant_tradeName?: string;
  contact_person?: string;
  email?: string;
}

@Component({
  selector: 'app-issues-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './issues-list.component.html',
  styleUrls: ['./issues-list.component.scss']
})
export class IssuesListComponent implements OnInit {
  issues: Issue[] = [];
  merchantsList: MerchantInfo[] = [];
  loading = true;
  error: string | null = null;
  pagination: Pagination = {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  };

  Math: any = Math;
  
  filterForm: FormGroup;
  issueTypes = [
    { value: '', label: 'All Issues' },
    { value: 'MISSING_REVERSAL', label: 'Missing Reversal' },
    { value: 'DOUBLE_REVERSAL', label: 'Double Reversal' },
    { value: 'AMOUNT_MISMATCH', label: 'Amount Mismatch' },
    { value: 'OTHER', label: 'Other Issues' }
  ];

  constructor(
    private fb: FormBuilder,
    private reconService: PayoutReconciliationService
  ) {
    this.filterForm = this.fb.group({
      merchantId: [''],
      issueType: ['']
    });
  }

  ngOnInit(): void {
    // Load merchants first
    this.loadMerchants();
    
    // Then load issues
    this.loadIssues();
    
    // Subscribe to form changes to auto-filter
    this.filterForm.valueChanges.subscribe(() => {
      // Reset to first page when filter changes
      this.pagination.page = 1;
      this.loadIssues();
    });
  }

  loadMerchants(): void {
    this.reconService.getMerchants().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.merchantsList = response.data;
        }
      },
      error: (err) => {
        console.error('Failed to load merchants:', err);
      }
    });
  }

  loadIssues(): void {
    this.loading = true;
    
    const filters = {
      ...this.filterForm.value,
      page: this.pagination.page,
      limit: this.pagination.limit
    };
    
    // Remove empty filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === '') {
        delete filters[key];
      }
    });
    
    this.reconService.getIssuesList(filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.issues = response.data.issues;
          this.pagination = response.data.pagination;
          this.error = null;
        } else {
          this.error = response.message || 'Failed to load issues';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load issues list';
        console.error(err);
        this.loading = false;
      }
    });
  }

  changePage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.pagination.pages) {
      this.pagination.page = newPage;
      this.loadIssues();
    }
  }

  getFormattedDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  }

  getMerchantName(merchantId: string): string {
    if (!merchantId) return 'Unknown Merchant';
    
    const merchant = this.merchantsList.find(m => m._id === merchantId);
    if (merchant) {
      if (merchant.merchant_tradeName) {
        return merchant.merchant_tradeName;
      } else if (merchant.contact_person) {
        return merchant.contact_person;
      } else if (merchant.email) {
        return merchant.email;
      }
    }
    return merchantId.substring(0, 8) + '...';
  }

  getIssueTypeLabel(type: string): string {
    const issueType = this.issueTypes.find(t => t.value === type);
    return issueType ? issueType.label : type.replace('_', ' ');
  }

  // Helper method to generate an array for pagination
  getPageArray(): number[] {
    const pages = [];
    const maxPages = Math.min(5, this.pagination.pages);
    let startPage = Math.max(1, this.pagination.page - 2);
    
    // Adjust start page if we're near the end
    if (this.pagination.page > this.pagination.pages - 2) {
      startPage = Math.max(1, this.pagination.pages - 4);
    }
    
    const endPage = Math.min(startPage + maxPages - 1, this.pagination.pages);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}