// merchant-wallets.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

const BASE_URL = 'https://doronpay.com/api';

interface Merchant {
  _id: string;
  accountType: string;
  address: string;
  merchant_tradeName: string;
  type: string;
  active: boolean;
}

interface MerchantWallet {
  accountType: string;
  walletType: string;
  currency: string;
  unConfirmedBalance: number;
  _id: string;
  walletId: string;
  merchantId: {
    _id: string;
    merchant_tradeName: string;
email: string;
    phone: string;
  } | null;
  totalBalance: number;
  blockedBalance: number;
  confirmedBalance: number;
  balance: number;
  lastBalance: number;
  availableBalance: number;
  accountNumber: string;
  active: boolean;
}

interface BalanceActionRequest {
  merchantId: string;
  walletId: string;
  amount: number;
  reason?: string;
  transactionId?: string;
  externalTransactionId?: string;
}

@Component({
  selector: 'app-merchant-wallets',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './merchant-wallets.component.html',
  styleUrls: ['./merchant-wallets.component.scss']
})
export class MerchantWalletsComponent implements OnInit {
  wallets: MerchantWallet[] = [];
  merchants: Merchant[] = [];
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  
  // Forms
  addWalletForm: FormGroup;
  updateWalletForm: FormGroup;
  blockBalanceForm: FormGroup;
  unblockBalanceForm: FormGroup;
  consumeBlockedForm: FormGroup;
  
  // Modal states
  showAddWalletModal = false;
  showUpdateWalletModal = false;
  showBlockBalanceModal = false;
  showUnblockBalanceModal = false;
  showConsumeBlockedModal = false;
  
  selectedWallet: MerchantWallet | null = null;
  searchTerm: string = '';
  filteredWallets: MerchantWallet[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Action types for dropdown
  actionReasons = [
    'Manual block request',
    'Security hold',
    'Dispute resolution',
    'Fraud prevention',
    'Regulatory compliance',
    'Internal transfer',
    'Settlement pending',
    'Other'
  ];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.addWalletForm = this.fb.group({
      merchantId: ['', Validators.required],
      walletType: ['', Validators.required],
      currency: ['GHS', Validators.required],
      initialBalance: [0, [Validators.required, Validators.min(0)]]
    });

    this.updateWalletForm = this.fb.group({
      accountType: ['', Validators.required],
      walletType: ['', Validators.required],
      currency: ['', Validators.required],
      blockedBalance: [0, [Validators.required, Validators.min(0)]],
      confirmedBalance: [0, [Validators.required, Validators.min(0)]],
      availableBalance: [0, [Validators.required, Validators.min(0)]],
      active: [true, Validators.required],
      unConfirmedBalance: [0, [Validators.required, Validators.min(0)]]
    });

    this.blockBalanceForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      reason: ['Manual block request', Validators.required],
      transactionId: [''],
      externalTransactionId: ['']
    });

    this.unblockBalanceForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      reason: ['Manual unblock request', Validators.required],
      transactionId: [''],
      externalTransactionId: ['']
    });

    this.consumeBlockedForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      reason: ['Blocked funds consumed', Validators.required],
      externalTransactionId: ['']
    });
  }

  ngOnInit(): void {
    this.loadWallets();
    this.loadMerchants();
  }

  loadMerchants(): void {
    this.http.get<any>(`${BASE_URL}/merchants/get`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.merchants = response.data;
          }
        },
        error: (error) => {
          console.error('Error loading merchants:', error);
        }
      });
  }

  loadWallets(): void {
    this.loading = true;
    this.http.get<any>(`${BASE_URL}/accounts/get`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.wallets = response.data;
            this.filteredWallets = [...this.wallets];
          } else {
            this.error = 'Failed to load wallets';
          }
          this.loading = false;
        },
        error: (error) => {
          this.error = 'An error occurred while loading wallets';
          this.loading = false;
        }
      });
  }

  searchWallets(event: KeyboardEvent): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm = searchTerm;
    this.currentPage = 1; // Reset to first page when searching
    this.filterWallets();
  }

  filterWallets(): void {
    if (!this.searchTerm.trim()) {
      this.filteredWallets = [...this.wallets];
    } else {
      this.filteredWallets = this.wallets.filter(wallet => {
        return (
          wallet.accountNumber.toLowerCase().includes(this.searchTerm) ||
          wallet.walletType.toLowerCase().includes(this.searchTerm) ||
          wallet.currency.toLowerCase().includes(this.searchTerm) ||
          wallet.accountType.toLowerCase().includes(this.searchTerm) ||
          this.getMerchantName(wallet).toLowerCase().includes(this.searchTerm) ||
          this.getMerchantEmail(wallet).toLowerCase().includes(this.searchTerm)
        );
      });
    }
    this.sortWallets();
  }

  sortWallets(): void {
    if (this.sortColumn) {
      this.filteredWallets.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        switch (this.sortColumn) {
          case 'merchant':
            aValue = this.getMerchantName(a);
            bValue = this.getMerchantName(b);
            break;
          case 'availableBalance':
            aValue = a.availableBalance;
            bValue = b.availableBalance;
            break;
          case 'blockedBalance':
            aValue = a.blockedBalance;
            bValue = b.blockedBalance;
            break;
          default:
            aValue = a[this.sortColumn as keyof MerchantWallet];
            bValue = b[this.sortColumn as keyof MerchantWallet];
        }
        
        if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
  }

  sort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortWallets();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return 'bi bi-arrow-down-up';
    return this.sortDirection === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down';
  }

  get paginatedWallets(): MerchantWallet[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredWallets.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredWallets.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Modal open/close methods
  openAddWalletModal(): void {
    this.showAddWalletModal = true;
  }

  closeAddWalletModal(): void {
    this.showAddWalletModal = false;
    this.addWalletForm.reset({
      walletType: 'FIAT',
      currency: 'GHS',
      initialBalance: 0
    });
  }

  openUpdateWalletModal(wallet: MerchantWallet): void {
    this.selectedWallet = wallet;
    this.updateWalletForm.patchValue({
      accountType: wallet.accountType,
      walletType: wallet.walletType,
      currency: wallet.currency,
      blockedBalance: wallet.blockedBalance,
      confirmedBalance: wallet.confirmedBalance,
      availableBalance: wallet.availableBalance,
      unConfirmedBalance: wallet.unConfirmedBalance,
      active: wallet.active
    });
    this.showUpdateWalletModal = true;
  }

  closeUpdateWalletModal(): void {
    this.showUpdateWalletModal = false;
    this.selectedWallet = null;
    this.updateWalletForm.reset();
  }

  openBlockBalanceModal(wallet: MerchantWallet): void {
    this.selectedWallet = wallet;
    this.blockBalanceForm.reset({
      reason: 'Manual block request',
      transactionId: '',
      externalTransactionId: ''
    });
    this.showBlockBalanceModal = true;
  }

  closeBlockBalanceModal(): void {
    this.showBlockBalanceModal = false;
    this.selectedWallet = null;
    this.blockBalanceForm.reset();
  }

  openUnblockBalanceModal(wallet: MerchantWallet): void {
    this.selectedWallet = wallet;
    this.unblockBalanceForm.reset({
      reason: 'Manual unblock request',
      transactionId: '',
      externalTransactionId: ''
    });
    this.showUnblockBalanceModal = true;
  }

  closeUnblockBalanceModal(): void {
    this.showUnblockBalanceModal = false;
    this.selectedWallet = null;
    this.unblockBalanceForm.reset();
  }

  openConsumeBlockedModal(wallet: MerchantWallet): void {
    this.selectedWallet = wallet;
    this.consumeBlockedForm.reset({
      reason: 'Blocked funds consumed',
      externalTransactionId: ''
    });
    this.showConsumeBlockedModal = true;
  }

  closeConsumeBlockedModal(): void {
    this.showConsumeBlockedModal = false;
    this.selectedWallet = null;
    this.consumeBlockedForm.reset();
  }

  // Form submission methods
  submitAddWallet(): void {
    if (this.addWalletForm.valid) {
      this.loading = true;
      this.http.post(`${BASE_URL}/accounts/add`, this.addWalletForm.value)
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.loadWallets();
              this.closeAddWalletModal();
              this.showSuccess('Wallet added successfully');
            } else {
              this.error = response.message || 'Failed to add wallet';
            }
            this.loading = false;
          },
          error: (error) => {
            this.error = 'An error occurred while adding the wallet';
            this.loading = false;
          }
        });
    }
  }

  submitUpdateWallet(): void {
    if (this.updateWalletForm.valid && this.selectedWallet) {
      this.loading = true;
      
      const updateData = {
        id: this.selectedWallet._id,
        data: this.updateWalletForm.value
      };

      this.http.post(`${BASE_URL}/accounts/update`, updateData)
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.loadWallets();
              this.closeUpdateWalletModal();
              this.showSuccess('Wallet updated successfully');
            } else {
              this.error = response.message || 'Failed to update wallet';
            }
            this.loading = false;
          },
          error: (error) => {
            this.error = 'An error occurred while updating the wallet';
            this.loading = false;
          }
        });
    }
  }

  submitBlockBalance(): void {
    if (this.blockBalanceForm.valid && this.selectedWallet && this.selectedWallet.merchantId) {
      this.loading = true;
      
      const request: BalanceActionRequest = {
        merchantId: this.selectedWallet.merchantId._id,
        walletId: this.selectedWallet.walletId,
        amount: Number(this.blockBalanceForm.value.amount),
        reason: this.blockBalanceForm.value.reason,
        transactionId: this.blockBalanceForm.value.transactionId || undefined,
        externalTransactionId: this.blockBalanceForm.value.externalTransactionId || undefined
      };

      this.http.put(`${BASE_URL}/accounts/balance/block`, request)
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.loadWallets();
              this.closeBlockBalanceModal();
              this.showSuccess('Balance blocked successfully');
            } else {
              this.error = response.message || 'Failed to block balance';
            }
            this.loading = false;
          },
          error: (error) => {
            this.error = error.error?.message || 'An error occurred while blocking balance';
            this.loading = false;
          }
        });
    }
  }

  submitUnblockBalance(): void {
    if (this.unblockBalanceForm.valid && this.selectedWallet && this.selectedWallet.merchantId) {
      this.loading = true;
      
      const request: BalanceActionRequest = {
        merchantId: this.selectedWallet.merchantId._id,
        walletId: this.selectedWallet.walletId,
        amount: Number(this.unblockBalanceForm.value.amount),
        reason: this.unblockBalanceForm.value.reason,
        transactionId: this.unblockBalanceForm.value.transactionId || undefined,
        externalTransactionId: this.unblockBalanceForm.value.externalTransactionId || undefined
      };

      this.http.put(`${BASE_URL}/accounts/balance/unblock`, request)
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.loadWallets();
              this.closeUnblockBalanceModal();
              this.showSuccess('Balance unblocked successfully');
            } else {
              this.error = response.message || 'Failed to unblock balance';
            }
            this.loading = false;
          },
          error: (error) => {
            this.error = error.error?.message || 'An error occurred while unblocking balance';
            this.loading = false;
          }
        });
    }
  }

  submitConsumeBlocked(): void {
    if (this.consumeBlockedForm.valid && this.selectedWallet && this.selectedWallet.merchantId) {
      this.loading = true;
      
      const request = {
        merchantId: this.selectedWallet.merchantId._id,
        walletId: this.selectedWallet.walletId,
        amount: Number(this.consumeBlockedForm.value.amount),
        reason: this.consumeBlockedForm.value.reason,
        externalTransactionId: this.consumeBlockedForm.value.externalTransactionId || undefined
      };

      this.http.put(`${BASE_URL}/accounts/balance/consume-blocked`, request)
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.loadWallets();
              this.closeConsumeBlockedModal();
              this.showSuccess('Blocked funds consumed successfully');
            } else {
              this.error = response.message || 'Failed to consume blocked funds';
            }
            this.loading = false;
          },
          error: (error) => {
            this.error = error.error?.message || 'An error occurred while consuming blocked funds';
            this.loading = false;
          }
        });
    }
  }

  // Helper methods
  showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  formatAccountNumber(accountNumber: string): string {
    if (!accountNumber) return '';
    return accountNumber.replace(/(\d{4})/g, '$1 ').trim();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount);
  }

  getStatusClass(accountType: string): string {
    return accountType === 'CLOSED' ? 'status-closed' : 'status-active';
  }

  getMerchantName(wallet: MerchantWallet): string {
    return wallet.merchantId?.merchant_tradeName || 'Unknown Merchant';
  }

  getMerchantEmail(wallet: MerchantWallet): string {
    return wallet.merchantId?.email || 'No email provided';
  }

  canBlockBalance(wallet: MerchantWallet): boolean {
    return wallet.availableBalance > 0 && wallet.merchantId !== null;
  }

  canUnblockBalance(wallet: MerchantWallet): boolean {
    return wallet.blockedBalance > 0 && wallet.merchantId !== null;
  }

  canConsumeBlocked(wallet: MerchantWallet): boolean {
    return wallet.blockedBalance > 0 && wallet.merchantId !== null;
  }
}