// merchants.component.ts
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import API from '../../constants/api.constant';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngxs/store';
import { catchError, finalize, take, of } from 'rxjs';
import { RouterModule } from '@angular/router';
import { HasPermissionDirective } from '../../directives/permission.directive';
import { PermissionService } from '../../service/permissions.service';

interface Merchant {
  _id: string;
  merchant_tradeName?: string;
  email?: string;
  phone?: string;
  address?: string;
  lineOfBusiness?: string;
  active: boolean;
  balance?: number;
  type?: string;
  accountType?: string;
  autosettle?: boolean;
  createdAt: string;
  chargeType?: string;
  tierEnabled?: boolean;
  // Add charge-related fields
  disburse_gip_charge?: number;
  disburse_gip_cap?: number;
  disburse_nrt_charge?: number;
  disburse_momo_charge?: number;
  disburse_momo_cap?: number;
  disburse_min_cap?: number;
  momo_charge?: number;
  card_charge?: number;
  btc_charge?: number;
  momo_cap?: number;
  momo_min_charge?: number;
  momo_charge_cap?: number;
  location?: string;
  contact_person?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  contactPersonDesignation?: string;
  tierLevel?: number;
  operations?: string[];
    approvedDate?: string;
  onboardedBy?: string;
  registrationNumber?: string;
}

interface MerchantBalanceResponse {
  success: boolean;
  message: string;
  data: {
    accountType: string;
    walletType: string;
    currency: string;
    unConfirmedBalance: number;
    _id: string;
    merchantId: string;
    walletId: string;
    totalBalance: number;
    blockedBalance: number;
    confirmedBalance: number;
    balance: number;
    lastBalance: number;
    type: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    accountNumber: string;
    availableBalance: number;
  }[]; // <-- Make data an array
}

interface DepositRequest {
  merchantId: string;
  amount: number;
  account_type: string;
  account_name: string;
  account_number: string;
  account_issuer: string;
}

interface TransactionUpdateRequest {
  id: string;
  data: {
    status: string;
  };
}

interface TransactionUpdateResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface DepositResponse {
  success: boolean;
  message: string;
  data?: any; // Update this based on actual response
}

enum TransactionStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
}

interface ApproveRequest {
  id: string;
}

interface ApproveResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface MerchantCharges {
  accountType: string;
  chargeType: string;
  disburse_gip_charge: number;
  disburse_gip_cap: number;
  disburse_nrt_charge: number;
  disburse_momo_charge: number;
  disburse_momo_cap: number;
  disburse_min_cap: number;
  momo_charge: number;
  card_charge: number;
  btc_charge: number;
  momo_cap: number;
  momo_min_charge: number;
  momo_charge_cap: number;
}

interface Bank {
  _id: string;
  BankName: string;
  BankCode: string;
}

interface SettlementRequest {
  recipient_account_name: string;
  recipient_account_number: string;
  recipient_account_issuer: string;
  merchantId: string;
  description: string;
  amount: string | number;
}

interface OtpRequest {
  email: string; // Auth user email
}

interface OtpValidateRequest {
  email: string;  // Auth user email
  otp: string;
}
@Component({
  selector: 'app-merchants',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HasPermissionDirective],
  templateUrl: './merchants.component.html',
  styleUrls: ['./merchants.component.css'],
})
export class MerchantComponent implements OnInit {
  merchants: Merchant[] = [];
  filteredMerchants: Merchant[] = [];
  paginatedMerchants: Merchant[] = [];
  showTopUpModal = false;
  showDetailsModal = false;
  selectedMerchantId?: string;
  selectedMerchant: Merchant | null = null;
  topUpForm: FormGroup;
  isSubmitting = false;
  isLoading = false;
  error: string | null = null;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  searchTerm = '';
  merchantBalance: MerchantBalanceResponse['data'][0] | null = null;
  showBalanceModal = false;
  showStatusModal = false;
  selectedTransactionId: string | null = null;
  statusForm: FormGroup;
  showApproveModal = false;
  selectedMerchantForApproval: Merchant | null = null;
  showChargesModal = false;
  selectedMerchantForCharges: Merchant | null = null;
  chargesForm: FormGroup;
  success: string | null = null;

  showSettleModal = false;
  selectedMerchantForSettle: Merchant | null = null;
  banks: Bank[] = [];
  settleForm: FormGroup;

  showOtpModal = false;
  otpForm: FormGroup;
  pendingDepositData: DepositRequest | null = null;
  userEmail: string = '';

  showActionModal = false;
  selectedMerchantForAction: Merchant | null = null;

  constructor(
    private http: HttpClient,
    private store: Store,
    private fb: FormBuilder,
    private permissionService: PermissionService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.topUpForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      account_type: ['momo', Validators.required],
      account_name: ['', Validators.required],
      account_number: [
        '',
        [Validators.required, Validators.pattern('^[0-9]{10}$')],
      ],
      account_issuer: ['mtn', Validators.required],
    });
    this.statusForm = this.fb.group({
      status: ['', Validators.required],
    });
    this.chargesForm = this.fb.group({
      accountType: ['CLOSED'],
      chargeType: ['MERCHANT'],
      disburse_gip_charge: [1.2, [Validators.required, Validators.min(0)]],
      disburse_gip_cap: [12, [Validators.required, Validators.min(0)]],
      disburse_nrt_charge: [10, [Validators.required, Validators.min(0)]],
      disburse_momo_charge: [1, [Validators.required, Validators.min(0)]],
      disburse_momo_cap: [10, [Validators.required, Validators.min(0)]],
      disburse_min_cap: [1, [Validators.required, Validators.min(0)]],
      momo_charge: [1.5, [Validators.required, Validators.min(0)]],
      card_charge: [2, [Validators.required, Validators.min(0)]],
      btc_charge: [1, [Validators.required, Validators.min(0)]],
      momo_cap: [10, [Validators.required, Validators.min(0)]],
      momo_min_charge: [0.7, [Validators.required, Validators.min(0)]],
      momo_charge_cap: [0.5, [Validators.required, Validators.min(0)]],
    });
    this.settleForm = this.fb.group({
      recipient_account_name: ['', Validators.required],
      recipient_account_number: [
        '',
        [Validators.required],
      ],
      recipient_account_issuer: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      description: ['', Validators.required],
    });
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern('^[0-9]{5}$')]] // Changed to 5 digits based on example
    });

    // Get authenticated user's email (replace this with your actual auth implementation)
    this.userEmail = this.store.selectSnapshot(state => state.auth.user.email);
  }

  ngOnInit(): void {
    this.permissionService.getPermissions().subscribe(() => {
      // Now that permissions are loaded, trigger change detection
      this.changeDetectorRef.detectChanges();
    });
    this.getAllMerchants();
  }

  getAllMerchants(): void {
    this.isLoading = true;
    this.error = null;

    this.http
      .get<{ success: boolean; data: Merchant[] }>(`${API}/merchants/get`)
      .pipe(
        take(1),
        catchError((error) => {
          this.error = error.message || 'Failed to load merchants';
          return of({ success: false, data: [] });
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((response: any) => {
        if (response.success) {
          this.merchants = response.data;
          this.filteredMerchants = this.merchants;
          this.updatePagination();
        }
      });
  }

  loadBanks(): void {
    this.http
      .get<{ success: boolean; data: Bank[] }>(`${API}/hub/banks/get`)
      .pipe(take(1))
      .subscribe((response) => {
        if (response?.success) {
          this.banks = response.data;
        }
      });
  }

  openActionModal(merchant: Merchant): void {
    this.selectedMerchantForAction = merchant;
    this.showActionModal = true;
  }

  closeActionModal(): void {
    this.showActionModal = false;
    this.selectedMerchantForAction = null;
  }

  viewDetails(merchant: Merchant): void {
    this.closeActionModal();
    this.openDetailsModal(merchant);
  }

  openSettleModal(merchant: Merchant): void {
    this.closeActionModal();
    this.selectedMerchantForSettle = merchant;
    this.loadBanks();
    this.showSettleModal = true;
  }

  closeSettleModal(): void {
    this.showSettleModal = false;
    this.selectedMerchantForSettle = null;
    this.settleForm.reset();
  }

  verifyOtpAndTopUp(): void {
    if (!this.otpForm.valid || !this.pendingDepositData) return;
  
    const validateRequest: OtpValidateRequest = {
      email: this.userEmail,
      otp: this.otpForm.get('otp')?.value
    };
  
    this.isLoading = true;
    this.error = null;
  
    // First verify OTP
    this.http.post<{success: boolean; message: string}>(
      'https://lazypaygh.com/api/otp/validate', 
      validateRequest
    )
    .pipe(
      take(1),
      catchError(error => {
        console.log('OTP Validation Error:', error);  // Debug log
        this.isLoading = false;
        this.error = error.error?.message || 'Invalid OTP. Please try again.';
        return of(null);
      })
    )
    .subscribe((response) => {
      if (!response) {
        this.isLoading = false;
        return;
      }
  
      if (response.success) {
        // Proceed with deposit
        this.processDeposit();
      } else {
        this.isLoading = false;
        this.error = response.message || 'OTP validation failed. Please try again.';
      }
    });
  }
  
  // Update the requestOtp method to also handle errors better
  requestOtp(): void {
    if (!this.selectedMerchantId || !this.topUpForm.valid) return;
  
    const otpRequest: OtpRequest = {
      email: this.userEmail
    };
  
    this.isLoading = true;
    this.error = null;
  
    this.http.post<{success: boolean; message: string}>(
      'https://lazypaygh.com/api/otp/sendotp', 
      otpRequest
    )
    .pipe(
      take(1),
      catchError(error => {
        console.log('Send OTP Error:', error);  // Debug log
        this.isLoading = false;
        this.error = error.error?.message || 'Failed to send OTP. Please try again.';
        return of(null);
      })
    )
    .subscribe((response) => {
      this.isLoading = false;
  
      if (!response) {
        return;
      }
  
      if (response.success) {
        this.showOtpModal = true;
        this.error = null;
        this.pendingDepositData = {
          merchantId: this.selectedMerchantId!,
          amount: this.topUpForm.get('amount')?.value,
          account_type: this.topUpForm.get('account_type')?.value,
          account_name: this.topUpForm.get('account_name')?.value,
          account_number: this.topUpForm.get('account_number')?.value,
          account_issuer: this.topUpForm.get('account_issuer')?.value,
        };
      } else {
        this.error = response.message || 'Failed to send OTP. Please try again.';
      }
    });
  }

  toggleAutosettle(merchant: Merchant): void {
    const confirmMessage = merchant.autosettle ? 
      'Are you sure you want to disable auto-settlement?' : 
      'Are you sure you want to enable auto-settlement?';
  
    if (window.confirm(confirmMessage)) {
      this.isLoading = true;
      this.error = null;
  
      this.http.put<{success: boolean; message: string}>(
        `${API}/merchants/autosettle/toggle`,
        { merchantId: merchant._id }
      ).pipe(
        take(1),
        catchError(error => {
          this.error = error.error?.message || 'Failed to toggle auto-settlement';
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      ).subscribe(response => {
        if (response?.success) {
          this.getAllMerchants(); // Refresh the merchants list
        }
      });
    }
  }

  toggleMerchantTier(merchant: Merchant): void {
    const confirmMessage = merchant.tierEnabled ? 
      'Are you sure you want to disable merchant-tier?' : 
      'Are you sure you want to enable merchant-tier?';
  
    if (window.confirm(confirmMessage)) {
      this.isLoading = true;
      this.error = null;
      
      // Create the payload as expected by the backend
      const payload = {
        id: merchant._id,
        data: {
          tierEnabled: !merchant.tierEnabled
        }
      };
  
      this.http.put<{success: boolean; message: string}>(
        `${API}/merchants/update`,
        payload
      ).pipe(
        take(1),
        catchError(error => {
          this.error = error.error?.message || 'Failed to toggle merchant-tier';
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      ).subscribe(response => {
        if (response?.success) {
          this.success = `Successfully ${merchant.tierEnabled ? 'disabled' : 'enabled'} tier for ${merchant.merchant_tradeName}`;
          // Update the merchant object locally to reflect the change
          merchant.tierEnabled = !merchant.tierEnabled;
        }
      });
    }
  }

  private resetLoadingState(): void {
    this.isLoading = false;
    this.error = null;
  }

  private processDeposit(): void {
    if (!this.pendingDepositData) {
      this.isLoading = false;
      return;
    }
  
    this.http.put<DepositResponse>(`${API}/accounts/deposit`, this.pendingDepositData)
      .pipe(
        take(1),
        catchError(error => {
          console.log('Deposit Error:', error);  // Debug log
          this.isLoading = false;
          this.error = error.error?.message || 'Failed to process deposit';
          return of(null);
        })
      )
      .subscribe((response) => {
        this.isLoading = false;
        
        if (!response) {
          return;
        }
  
        if (response.success) {
          // Clear any previous errors
          this.error = null;
          this.closeOtpModal();
          this.closeTopUpModal();
          this.getAllMerchants();
        } else {
          this.error = response.message || 'Failed to process deposit';
        }
      });
  }

  closeOtpModal(): void {
    this.showOtpModal = false;
    this.otpForm.reset();
    this.pendingDepositData = null;
  }

  // Modify existing submitTopUp method
  submitTopUp(): void {
    if (this.topUpForm.valid && this.selectedMerchantId) {
      this.requestOtp();
    }
  }

  submitSettlement(): void {
    if (this.settleForm.valid && this.selectedMerchantForSettle) {
      this.isLoading = true;
  
      const settlementData: SettlementRequest = {
        ...this.settleForm.value,
        merchantId: this.selectedMerchantForSettle._id,
      };
  
      this.http
        .post<{ success: boolean; message: string; data: any }>(
          `${API}/transactions/settle`,
          settlementData
        )
        .pipe(
          take(1),
          catchError((error) => {
            this.error = error.error?.message || 'Settlement failed';
            return of(null);
          }),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((response) => {
          if (response?.success) {
            const successMessage = response.data?.message || 'Settlement successful';
            alert(successMessage); // Display the message
            this.closeSettleModal(); // Close the modal
            this.getAllMerchants(); // Refresh the merchants
          }
        });
    }
  }
  

  openChargesModal(merchant: Merchant): void {
    this.closeActionModal();

    this.selectedMerchantForCharges = merchant;
    // Pre-fill form with existing values if available
    const formValues = {
      accountType: merchant.accountType,
      chargeType: merchant.chargeType,
      disburse_gip_charge: merchant.disburse_gip_charge,
      disburse_gip_cap: merchant.disburse_gip_cap,
      disburse_nrt_charge: merchant.disburse_nrt_charge,
      disburse_momo_charge: merchant.disburse_momo_charge,
      disburse_momo_cap: merchant.disburse_momo_cap,
      disburse_min_cap: merchant.disburse_min_cap,
      momo_charge: merchant.momo_charge,
      card_charge: merchant.card_charge,
      btc_charge: merchant.btc_charge,
      momo_cap: merchant.momo_cap,
      momo_min_charge: merchant.momo_min_charge,
      momo_charge_cap: merchant.momo_charge_cap,
    };

    // Update the form with merged values
    this.chargesForm.patchValue(formValues);
    this.showChargesModal = true;
  }

  closeChargesModal(): void {
    this.showChargesModal = false;
    this.selectedMerchantForCharges = null;
    this.chargesForm.reset();
  }

  updateCharges(): void {
    if (this.chargesForm.valid && this.selectedMerchantForCharges) {
      this.isLoading = true;
      const chargesData = this.chargesForm.value;

      this.http
        .put(
          `${API}/merchants/charges/set/${this.selectedMerchantForCharges._id}`,
          chargesData
        )
        .pipe(
          take(1),
          catchError((error) => {
            if (error.error && error.error.message) {
              this.error = error.error.message;
            } else {
              this.error = 'Failed to update charges';
            }
            return of(null);
          }),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((response) => {
          if (response) {
            this.closeChargesModal();
            this.getAllMerchants();
          }
        });
    }
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(
      this.filteredMerchants.length / this.itemsPerPage
    );
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedMerchants = this.filteredMerchants.slice(
      startIndex,
      endIndex
    );
  }

  onSearch(event: any): void {
    const term = event.target.value.toLowerCase();
    this.filteredMerchants = this.merchants.filter(
      (merchant) =>
        merchant.merchant_tradeName?.toLowerCase().includes(term) ||
        merchant.email?.toLowerCase().includes(term) ||
        merchant.phone?.includes(term)
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  openApproveModal(merchant: Merchant): void {
    this.closeActionModal();

    this.selectedMerchantForApproval = merchant;
    this.showApproveModal = true;
  }

  closeApproveModal(): void {
    this.showApproveModal = false;
    this.selectedMerchantForApproval = null;
  }

  approveMerchant(): void {
    if (!this.selectedMerchantForApproval) return;

    this.isLoading = true;
    const approveData: ApproveRequest = {
      id: this.selectedMerchantForApproval._id,
    };

    this.http
      .put<ApproveResponse>(`${API}/merchants/approve`, approveData)
      .pipe(
        take(1),
        catchError((error) => {
          if (error.error && error.error.message) {
            this.error = error.error.message;
          } else {
            this.error = 'Failed to approve merchant';
          }
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((response: any) => {
        if (response?.success) {
          this.closeApproveModal();
          // Refresh merchant list
          this.getAllMerchants();
        }
      });
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  openStatusModal(merchantId: string): void {
    this.closeActionModal();

    this.selectedTransactionId = merchantId;
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.selectedTransactionId = null;
    this.statusForm.reset();
  }

  updateTransaction(): void {
    if (this.statusForm.valid && this.selectedTransactionId) {
      this.isLoading = true;
      this.error = null; // Reset any previous error

      const updateData: TransactionUpdateRequest = {
        id: this.selectedTransactionId,
        data: {
          status: this.statusForm.get('status')?.value,
        },
      };

      this.http
        .put<TransactionUpdateResponse>(
          `${API}/transactions/update`,
          updateData
        )
        .pipe(
          take(1),
          catchError((error) => {
            console.log('Error response:', error); // Debug log
            if (error.error && typeof error.error === 'object') {
              this.error = error.error.message;
            } else {
              this.error = 'Failed to update transaction';
            }
            return of(null);
          }),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((response: any) => {
          if (response?.success) {
            this.getAllMerchants();
            this.closeStatusModal();
          } else if (response) {
            // Handle unsuccessful response
            this.error = response.message || 'Update failed';
          }
        });
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  openDetailsModal(merchant: Merchant): void {
    this.closeActionModal();

    this.selectedMerchant = merchant;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedMerchant = null;
  }

  openTopUpModal(merchantId: string): void {
    this.closeActionModal();

    this.selectedMerchantId = merchantId;
    this.showTopUpModal = true;
  }

  closeTopUpModal(): void {
    this.showTopUpModal = false;
    this.topUpForm.reset();
  }

  // submitTopUp(): void {
  //   if (this.topUpForm.valid && this.selectedMerchantId) {
  //     const amount = this.topUpForm.get('amount')?.value;

  //     this.http
  //       .post(`${API}/transaction/merchant/topup`, {
  //         merchantId: this.selectedMerchantId,
  //         amount: amount,
  //       })
  //       .pipe(
  //         take(1),
  //         catchError((error) => {
  //           this.error = error.message || 'Top-up failed';
  //           return of({ success: false });
  //         })
  //       )
  //       .subscribe((response) => {
  //         if (response) {
  //           this.getAllMerchants();
  //           this.closeTopUpModal();
  //         }
  //       });
  //   }
  // }

  // submitTopUp(): void {
  //   if (this.topUpForm.valid && this.selectedMerchantId) {
  //     this.isSubmitting = true;

  //     const depositData: DepositRequest = {
  //       merchantId: this.selectedMerchantId,
  //       amount: this.topUpForm.get('amount')?.value,
  //       account_type: this.topUpForm.get('account_type')?.value,
  //       account_name: this.topUpForm.get('account_name')?.value,
  //       account_number: this.topUpForm.get('account_number')?.value,
  //       account_issuer: this.topUpForm.get('account_issuer')?.value,
  //     };

  //     this.http
  //       .put<DepositResponse>(`${API}/accounts/deposit`, depositData)
  //       .pipe(
  //         take(1),
  //         catchError((error) => {
  //           this.error = error.error?.message || 'Failed to process deposit';
  //           return of(null);
  //         }),
  //         finalize(() => {
  //           this.isSubmitting = false;
  //         })
  //       )
  //       .subscribe((response) => {
  //         if (response?.success) {
  //           // Success handling
  //           this.closeTopUpModal();
  //           // Optionally refresh merchants or show success message
  //           this.getAllMerchants();
  //         }
  //       });
  //   }
  // }

  checkBalance(merchantId: string): void {
    this.isLoading = true;
    this.error = null;

    this.http
      .get<MerchantBalanceResponse>(`${API}/accounts/merchant/${merchantId}`)
      .pipe(
        take(1),
        catchError((error) => {
          if (error.error && error.error.message) {
            this.error = error.error.message;
          } else {
            this.error = 'Failed to fetch balance';
          }
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((response) => {
        if (response && response.success) {
          this.merchantBalance = response.data[0]; // <-- Assign the first account
          this.showBalanceModal = true;
        } else {
          this.error = 'Failed to fetch balance information';
        }
      });
  }

  // Add close method
  closeBalanceModal(): void {
    this.closeActionModal();

    this.showBalanceModal = false;
    this.merchantBalance = null;
  }
}
