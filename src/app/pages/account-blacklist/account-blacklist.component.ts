// account-blacklist.component.ts (updated)
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { AuthState } from '../../state/apps/app.states';

interface AccountBlacklist {
  _id: string;
  accountNumber: string;
  accountType: string;
  accountIssuer?: string;
  accountName?: string;
  maskedNumber?: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
  expiresAt: string | null;
  notes?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: AccountBlacklist[];
}

// Enum for account issuers
export enum EAccountIssuer {
  MTN = 'mtn',
  VODAFONE = 'vodafone',
  AIRTELTIGO = 'airteltigo',
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  CARD = 'card',
  TRC20 = 'trc20',
  BTC = 'btc',
  SOLANA = 'solana',
  ERC20 = 'erc20',
  BANKTRF = 'banktrf',
  BANKTRFNRT = 'banktrfnrt',
  MOMO = 'momo'
}

@Component({
  selector: 'app-account-blacklist',
  templateUrl: './account-blacklist.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  styleUrls: ['./account-blacklist.component.scss']
})
export class AccountBlacklistComponent implements OnInit {
  accounts: AccountBlacklist[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  searchTerm: string = '';
  selectedSeverity: 'all' | 'low' | 'medium' | 'high' = 'all';
  selectedType: string = 'all';
  accountTypes = ['MOMO', 'BANK', 'CARD', 'WALLET', 'BTC', 'TRC20', 'SOLANA', 'ERC20'];
  severityLevels = ['low', 'medium', 'high'];
  accountIssuers = Object.values(EAccountIssuer);
  filteredAccounts: AccountBlacklist[] = [];

  // Modal related properties
  showModal: boolean = false;
  accountForm: FormGroup;
  isSubmitting: boolean = false;
  formError: string | null = null;
  isEditMode: boolean = false;
  currentAccountId: string | null = null;

  constructor(
    private http: HttpClient,
    private store: Store,
    private fb: FormBuilder
  ) {
    this.accountForm = this.fb.group({
      accountNumber: ['', [Validators.required, Validators.minLength(4)]],
      accountType: ['', Validators.required],
      accountIssuer: [''],
      accountName: [''],
      reason: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
      severity: ['medium', Validators.required],
      expiresAt: [null],
      notes: ['', Validators.maxLength(1000)]
    });
  }

  ngOnInit(): void {
    this.isLoading = false;
  }


  fetchAllBlacklistedAccounts(): void {
    this.isLoading = true;
    
    this.http
      .get<ApiResponse>(
        'https://doronpay.com/api/blacklist/accounts/all',  
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.accounts = response.data;
          } else {
            this.error = response.message || 'Failed to fetch blacklisted accounts';
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'An error occurred while fetching blacklisted accounts. Please try again later.';
          this.isLoading = false;
          console.error('Error fetching blacklisted accounts:', err);
        },
      });
      
  }

  private getHeaders(): HttpHeaders {
    const token = this.store.selectSnapshot(AuthState.token);
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  searchAccounts(): void {
    if (!this.searchTerm) {
      this.error = "Please enter an account number to search";
      return;
    }
  
    this.isLoading = true;
    this.error = null;
    
    this.http
      .get<{success: boolean, message: string, data: any}>(
        `https://doronpay.com/api/blacklist/account?accountNumber=${this.searchTerm}`,
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: (response) => {
          console.log('Search response:', response);
          
          if (response.success) {
            // Check if data contains blacklisted flag
            if (response.data && response.data.blacklisted === true) {
              // Format coming from checkAccountBlacklist endpoint
              const account: AccountBlacklist = {
                _id: 'temp_' + new Date().getTime(),
                accountNumber: response.data.accountNumber,
                accountType: response.data.accountType,
                accountIssuer: response.data.accountIssuer,
                maskedNumber: response.data.accountNumber,
                reason: response.data.reason,
                severity: response.data.severity as 'low' | 'medium' | 'high',
                createdAt: response.data.since,
                expiresAt: response.data.expires,
                notes: ''
              };
              
              console.log('Formatted account:', account);
              this.accounts = [account];
              this.filteredAccounts = this.accounts;  // Set directly
              console.log('Filtered accounts:', this.filteredAccounts);
            } else {
              this.accounts = [];
              this.filteredAccounts = [];
            }
          } else {
            this.error = response.message || 'Failed to fetch blacklisted accounts';
            this.accounts = [];
            this.filteredAccounts = [];
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'An error occurred while fetching blacklisted accounts. Please try again later.';
          this.isLoading = false;
          this.accounts = [];
          this.filteredAccounts = [];
          console.error('Error fetching blacklisted accounts:', err);
        },
      });
  }
  
  // Update the refreshAccounts method
  refreshAccounts(): void {
    if (this.searchTerm) {
      this.searchAccounts();
    } else {
      this.error = null;
      this.accounts = [];
    }
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'No expiry';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getSeverityClass(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  }

  // Modal handling methods
  openAddModal(): void {
    this.isEditMode = false;
    this.currentAccountId = null;
    this.resetForm();
    this.showModal = true;
  }

  openEditModal(account: AccountBlacklist): void {
    this.isEditMode = true;
    this.currentAccountId = account._id;
    
    // Patch form with account data
    this.accountForm.patchValue({
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      accountIssuer: account.accountIssuer || '',
      accountName: account.accountName || '',
      reason: account.reason,
      severity: account.severity,
      expiresAt: account.expiresAt,
      notes: account.notes || ''
    });
    
    // Disable account number and type fields in edit mode
    this.accountForm.get('accountNumber')?.disable();
    this.accountForm.get('accountType')?.disable();
    
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.formError = null;
  }

  resetForm(): void {
    this.accountForm.reset({
      severity: 'medium'
    });
    
    // Enable all fields for add mode
    this.accountForm.get('accountNumber')?.enable();
    this.accountForm.get('accountType')?.enable();
  }

  onSubmit(): void {
    if (this.accountForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.accountForm.controls).forEach(key => {
        this.accountForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    const formData = {...this.accountForm.value};
    
    // If in edit mode, we need to re-enable disabled fields to get their values
    if (this.isEditMode && this.currentAccountId) {
      formData.accountNumber = this.accountForm.get('accountNumber')?.value;
      formData.accountType = this.accountForm.get('accountType')?.value;
      
      this.http
        .put<{success: boolean, message: string, data?: AccountBlacklist}>(
          `https://doronpay.com/api/blacklist/account/${this.currentAccountId}`,
          formData,
          { headers: this.getHeaders() }
        )
        .subscribe({
          next: (response) => {
            this.isSubmitting = false;
            if (response.success) {
              // Update account in the list
              if (response.data) {
                const index = this.accounts.findIndex(a => a._id === this.currentAccountId);
                if (index >= 0) {
                  this.accounts[index] = response.data;
                }
              } else {
                // If no data returned, refresh the list
                this.fetchAllBlacklistedAccounts();
              }
              this.closeModal();
              alert('Account blacklist entry updated successfully');
            } else {
              this.formError = response.message || 'Failed to update account blacklist entry';
            }
          },
          error: (err) => {
            this.isSubmitting = false;
            this.formError = 'An error occurred while updating the account blacklist entry';
            console.error('Error updating account blacklist entry:', err);
          }
        });
    } else {
      // Add new blacklist entry
      this.http
        .post<{success: boolean, message: string, data?: AccountBlacklist}>(
          'https://doronpay.com/api/blacklist/account',
          formData,
          { headers: this.getHeaders() }
        )
        .subscribe({
          next: (response) => {
            this.isSubmitting = false;
            if (response.success) {
              // Add the new account to the list
              if (response.data) {
                this.accounts.unshift(response.data);
              } else {
                // If no data returned, refresh the list
                this.fetchAllBlacklistedAccounts();
              }
              this.closeModal();
              alert('Account added to blacklist successfully');
            } else {
              this.formError = response.message || 'Failed to add account to blacklist';
            }
          },
          error: (err) => {
            this.isSubmitting = false;
            this.formError = 'An error occurred while adding the account to blacklist';
            console.error('Error adding account to blacklist:', err);
          }
        });
    }
  }

  deleteEntry(id: string): void {
    if (confirm('Are you sure you want to remove this account from the blacklist?')) {
      this.http
        .delete<{success: boolean, message: string}>(
          `https://doronpay.com/api/blacklist/account/${id}`,
          { headers: this.getHeaders() }
        )
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.accounts = this.accounts.filter(account => account._id !== id);
              alert('Account removed from blacklist successfully');
            } else {
              alert(response.message || 'Failed to remove account from blacklist');
            }
          },
          error: (err) => {
            alert('An error occurred while removing the account from blacklist');
            console.error('Error removing account from blacklist:', err);
          }
        });
    }
  }
  
  // Helper method to show relevant account issuers based on selected account type
  getFilteredAccountIssuers(): string[] {
    const accountType = this.accountForm.get('accountType')?.value;
    
    if (!accountType) return this.accountIssuers;
    
    switch(accountType) {
      case 'MOMO':
        return [EAccountIssuer.MTN, EAccountIssuer.VODAFONE, EAccountIssuer.AIRTELTIGO, EAccountIssuer.MOMO];
      case 'CARD':
        return [EAccountIssuer.VISA, EAccountIssuer.MASTERCARD, EAccountIssuer.CARD];
      case 'BANK':
        return [EAccountIssuer.BANKTRF, EAccountIssuer.BANKTRFNRT];
      case 'BTC':
        return [EAccountIssuer.BTC];
      case 'TRC20':
        return [EAccountIssuer.TRC20];
      case 'SOLANA':
        return [EAccountIssuer.SOLANA];
      case 'ERC20':
        return [EAccountIssuer.ERC20];
      default:
        return this.accountIssuers;
    }
  }
}