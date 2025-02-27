// payout-recon.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PayoutReconciliationService } from '../payout-recon/payout-recon.component.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

interface ReconIssue {
  transactionId: string;
  transactionRef: string;
  issueType: 'MISSING_REVERSAL' | 'DOUBLE_REVERSAL' | 'AMOUNT_MISMATCH' | 'OTHER';
  description: string;
  _id: string;
  createdAt: Date;
}

interface ReconMetrics {
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
  issues?: ReconIssue[];
  lastUpdated?: Date;
  createdAt: Date;
}

interface Merchant {
  _id: string;
  merchant_tradeName?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  active: boolean;
  // Add other merchant fields as needed
}

@Component({
  selector: 'app-payout-recon',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './payout-recon.component.html',
  styleUrls: ['./payout-recon.component.scss']
})
export class PayoutReconciliationComponent implements OnInit {
  merchantsData: ReconMetrics[] = [];
  merchantsList: Merchant[] = [];
  selectedMetrics: ReconMetrics | null = null;
  selectedMerchantId: string = '';
  loading = true;
  error: string | null = null;
  showForm = false;
  reconForm: FormGroup;
  runningRecon = false;
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private reconService: PayoutReconciliationService,
    private router: Router
  ) {
    this.reconForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      merchantId: ['']
    });
  }

  ngOnInit(): void {
    this.loading = true;
    
    // Use forkJoin to fetch both merchants and reconciliation data in parallel
    forkJoin({
      merchants: this.reconService.getMerchants(),
      reconData: this.reconService.getReconSummary()
    }).subscribe({
      next: (results) => {
        if (results.merchants.success && results.merchants.data) {
          // Filter to only active merchants if needed
          this.merchantsList = results.merchants.data.filter(merchant => merchant.active !== false);
          
        }
        
        if (results.reconData.success && results.reconData.data) {
          this.merchantsData = results.reconData.data;
          
          // Set the first merchant as selected by default
          if (this.merchantsData.length > 0) {
            this.selectedMerchantId = this.merchantsData[0].merchantId;
            this.selectedMetrics = this.merchantsData[0];
          }
        } else {
          this.error = 'Failed to load reconciliation data';
        }
        
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load data';
        console.error(err);
        this.loading = false;
      }
    });
  }

  fetchSummary(): void {
    this.loading = true;
    this.reconService.getReconSummary().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.merchantsData = response.data;
          
          // Maintain selected merchant if possible
          if (this.selectedMerchantId) {
            const selectedMerchant = this.merchantsData.find(
              merchant => merchant.merchantId === this.selectedMerchantId
            );
            if (selectedMerchant) {
              this.selectedMetrics = selectedMerchant;
            } else if (this.merchantsData.length > 0) {
              // Default to first merchant if previously selected one is no longer available
              this.selectedMerchantId = this.merchantsData[0].merchantId;
              this.selectedMetrics = this.merchantsData[0];
            } else {
              this.selectedMerchantId = '';
              this.selectedMetrics = null;
            }
          }
          
          this.error = null;
        } else {
          this.error = 'Failed to load reconciliation data';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load reconciliation summary';
        console.error(err);
        this.loading = false;
      }
    });
  }

  onMerchantChange(): void {
    // Find the selected merchant's metrics
    this.selectedMetrics = this.merchantsData.find(
      merchant => merchant.merchantId === this.selectedMerchantId
    ) || null;
  }

  getMerchantName(id: string): string {
    const merchant = this.merchantsList.find(m => m._id === id);
    if (merchant) {
      if (merchant.merchant_tradeName) {
        return merchant.merchant_tradeName;
      } else if (merchant.contact_person) {
        return merchant.contact_person;
      } else if (merchant.email) {
        return merchant.email;
      }
    }
    return `Merchant ${id.substring(0, 8)}...`;
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    this.successMessage = '';
  }

  onSubmit(): void {
    if (this.reconForm.valid) {
      this.runningRecon = true;
      this.reconService.runManualReconciliation(this.reconForm.value).subscribe({
        next: () => {
          this.successMessage = 'Reconciliation process started successfully';
          this.runningRecon = false;
          // Refresh data after reconciliation
          setTimeout(() => this.fetchSummary(), 1000);
        },
        error: (err) => {
          this.error = 'Failed to start reconciliation process';
          console.error(err);
          this.runningRecon = false;
        }
      });
    }
  }

  viewTransactionDetails(transactionId: string): void {
    this.router.navigate(['/transactions', transactionId]);
  }
}