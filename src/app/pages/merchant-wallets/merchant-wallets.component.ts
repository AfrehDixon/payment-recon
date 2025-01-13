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
  addWalletForm: FormGroup;
  updateWalletForm: FormGroup;
  showAddWalletModal = false;
  showUpdateWalletModal = false;
  selectedWallet: MerchantWallet | null = null;
  searchTerm: string = '';
  filteredWallets: MerchantWallet[] = [];

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
        // balance: [0, [Validators.required, Validators.min(0)]],
        blockedBalance: [0, [Validators.required, Validators.min(0)]],
        confirmedBalance: [0, [Validators.required, Validators.min(0)]],
        availableBalance: [0, [Validators.required, Validators.min(0)]],
        active: [true, Validators.required],
        unConfirmedBalance: [0, [Validators.required, Validators.min(0)]]
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
          } else {
            this.error = 'Failed to load merchants';
          }
        },
        error: (error) => {
          this.error = 'An error occurred while loading merchants';
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
            this.filteredWallets = this.wallets; // Initialize filtered wallets
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
    this.filterWallets();
  }

  filterWallets(): void {
    if (!this.searchTerm.trim()) {
      this.filteredWallets = this.wallets;
      return;
    }

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
    //   balance: wallet.balance,
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

  submitAddWallet(): void {
    if (this.addWalletForm.valid) {
      this.loading = true;
      this.http.post(`${BASE_URL}/accounts/add`, this.addWalletForm.value)
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.loadWallets();
              this.closeAddWalletModal();
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
}