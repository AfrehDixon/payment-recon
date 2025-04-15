import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { AuthState } from '../../../state/apps/app.states';

interface Bank {
  BankCode: string;
  BankName: string;
  NrtActive: string;
  IsActive: string;
}

interface Merchant {
  _id: string;
  merchant_tradeName: string;
  email: string;
  phone: string;
  active: boolean;
}

interface Wallet {
  _id: string;
  walletId: string;
  merchantId: any;
  accountType: string;
  walletType: string;
  currency: string;
  confirmedBalance: number;
  availableBalance: number;
  unConfirmedBalance: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VerifyAccountResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    code: string;
    message: string;
    data: string;
  };
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  template: `
    <div class="min-h-screen p-6" style="margin-left: 200px;">
      <div class="max-w-7xl mx-auto space-y-6">
        <!-- Header -->
        <div class="bg-white rounded-lg p-6 shadow-sm">
          <h1 class="text-2xl font-bold text-gray-900">Transaction Management</h1>
          <p class="text-gray-500">Process credit and debit transactions</p>
        </div>

        <!-- Tab Navigation -->
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
          <div class="flex border-b">
            <button 
              [class.bg-blue-50]="activeTab === 'credit'"
              [class.text-blue-600]="activeTab === 'credit'"
              [class.border-blue-500]="activeTab === 'credit'"
              [class.border-b-2]="activeTab === 'credit'"
              [class.font-medium]="activeTab === 'credit'"
              class="flex-1 py-4 px-6 text-center focus:outline-none"
              (click)="setActiveTab('credit')"
            >
              Credit Merchant
            </button>
            <button
              [class.bg-blue-50]="activeTab === 'debit'"
              [class.text-blue-600]="activeTab === 'debit'"
              [class.border-blue-500]="activeTab === 'debit'"
              [class.border-b-2]="activeTab === 'debit'"
              [class.font-medium]="activeTab === 'debit'"
              class="flex-1 py-4 px-6 text-center focus:outline-none"
              (click)="setActiveTab('debit')"
            >
              Debit Merchant
            </button>
          </div>

          <!-- Credit Form -->
          <div *ngIf="activeTab === 'credit'" class="p-6">
            <form [formGroup]="creditForm" (ngSubmit)="submitCreditForm()">
              <!-- Error/Success Messages -->
              <div *ngIf="creditError" class="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
                {{ creditError }}
              </div>
              <div *ngIf="creditSuccess" class="mb-4 p-4 bg-green-50 text-green-600 rounded-md">
                {{ creditSuccess }}
              </div>

              <!-- Merchant Selection -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Select Merchant</label>
                <div class="relative">
                  <select
                    formControlName="merchantId"
                    class="block w-full py-3 px-4 pr-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none"
                    (change)="onMerchantChange('credit')"
                  >
                    <option value="" disabled>Select a merchant</option>
                    <option *ngFor="let merchant of merchants" [value]="merchant._id">
                      {{ merchant.merchant_tradeName }} ({{ merchant.email }})
                    </option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <i class="material-icons text-gray-400">arrow_drop_down</i>
                  </div>
                </div>
                <div *ngIf="creditForm.get('merchantId')?.invalid && creditForm.get('merchantId')?.touched" class="mt-1 text-red-500 text-sm">
                  <span *ngIf="creditForm.get('merchantId')?.errors?.['required']">Please select a merchant</span>
                </div>
              </div>

              <!-- Wallet Selection -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Select Wallet</label>
                <div class="relative">
                  <select
                    formControlName="walletId"
                    class="block w-full py-3 px-4 pr-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none"
                    [disabled]="loadingWallets || !creditForm.get('merchantId')?.value"
                  >
                    <option value="" disabled>{{ walletDropdownPlaceholder('credit') }}</option>
                    <option *ngFor="let wallet of creditWallets" [value]="wallet._id">
                      {{ formatWalletOption(wallet) }}
                    </option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <div *ngIf="loadingWallets" class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    <i *ngIf="!loadingWallets" class="material-icons text-gray-400">arrow_drop_down</i>
                  </div>
                </div>
                <div *ngIf="creditForm.get('walletId')?.invalid && creditForm.get('walletId')?.touched" class="mt-1 text-red-500 text-sm">
                  <span *ngIf="creditForm.get('walletId')?.errors?.['required']">Please select a wallet</span>
                </div>
              </div>

              <!-- Account Type Selection -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div 
                    *ngFor="let type of accountTypes" 
                    [class.bg-blue-50]="creditForm.get('account_type')?.value === type.value" 
                    [class.border-blue-500]="creditForm.get('account_type')?.value === type.value" 
                    class="border rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-all"
                    (click)="updateAccountType(type.value)"
                  >
                    <i class="material-icons block mx-auto mb-2">{{ type.icon }}</i>
                    <span>{{ type.label }}</span>
                  </div>
                </div>
              </div>

              <!-- Transaction Amount -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <div class="relative mt-1 rounded-md shadow-sm">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span class="text-gray-500">GHS</span>
                  </div>
                  <input
                    type="text"
                    formControlName="amount"
                    class="block w-full pl-12 pr-12 py-3 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div *ngIf="creditForm.get('amount')?.invalid && creditForm.get('amount')?.touched" class="mt-1 text-red-500 text-sm">
                  <span *ngIf="creditForm.get('amount')?.errors?.['required']">Amount is required</span>
                  <span *ngIf="creditForm.get('amount')?.errors?.['pattern']">Amount must be a valid number</span>
                </div>
              </div>

              <!-- Account Details Section -->
              <div class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Left Column -->
                <div class="space-y-6">
                  <!-- Account Number -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      {{ accountNumberLabel }}
                    </label>
                    <div class="relative">
                      <input
                        type="text"
                        formControlName="account_number"
                        class="block w-full py-3 px-4 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        [placeholder]="accountNumberPlaceholder"
                        (blur)="verifyAccountIfNeeded()"
                      />
                      <div *ngIf="accountVerifying" class="absolute right-3 top-3">
                        <div class="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                      </div>
                    </div>
                    <div *ngIf="creditForm.get('account_number')?.invalid && creditForm.get('account_number')?.touched" class="mt-1 text-red-500 text-sm">
                      <span *ngIf="creditForm.get('account_number')?.errors?.['required']">Account number is required</span>
                      <span *ngIf="creditForm.get('account_number')?.errors?.['pattern']">Invalid account number format</span>
                    </div>
                  </div>

                  <!-- Account Issuer (Bank or MoMo Provider) -->
                  <div *ngIf="showAccountIssuerField">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      {{ accountIssuerLabel }}
                    </label>
                    <select
                      formControlName="account_issuer"
                      class="block w-full py-3 px-4 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      (change)="onAccountIssuerChange()"
                    >
                      <option value="" disabled>Select {{ accountIssuerLabel }}</option>
                      <ng-container *ngIf="creditForm.get('account_type')?.value === 'bank'">
                        <option *ngFor="let bank of banks" [value]="bank.BankCode">{{ bank.BankName }}</option>
                      </ng-container>
                      <ng-container *ngIf="creditForm.get('account_type')?.value === 'momo'">
                        <option value="mtn">MTN Mobile Money</option>
                        <option value="vodafone">Vodafone Cash</option>
                        <option value="airteltigo">AirtelTigo Money</option>
                      </ng-container>
                    </select>
                    <div *ngIf="creditForm.get('account_issuer')?.invalid && creditForm.get('account_issuer')?.touched" class="mt-1 text-red-500 text-sm">
                      <span *ngIf="creditForm.get('account_issuer')?.errors?.['required']">{{ accountIssuerLabel }} is required</span>
                    </div>
                  </div>

                  <!-- Service Type for Bank transfers -->
                  <!-- <div *ngIf="creditForm.get('account_type')?.value === 'bank'">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                    <div class="grid grid-cols-2 gap-3">
                      <div 
                        *ngFor="let type of serviceTypes" 
                        [class.bg-blue-50]="creditForm.get('serviceType')?.value === type.value" 
                        [class.border-blue-500]="creditForm.get('serviceType')?.value === type.value" 
                        class="border rounded-lg p-3 text-center cursor-pointer hover:bg-gray-50 transition-all"
                        (click)="creditForm.patchValue({serviceType: type.value})"
                      >
                        <span class="font-medium">{{ type.label }}</span>
                        <p class="text-xs text-gray-500 mt-1">{{ type.description }}</p>
                      </div>
                    </div>
                  </div> -->
                </div>

                <!-- Right Column -->
                <div class="space-y-6">
                  <!-- Account Name -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                    <input
                      type="text"
                      formControlName="account_name"
                      class="block w-full py-3 px-4 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Account holder name"
                      [readonly]="accountNameReadOnly"
                    />
                    <div *ngIf="creditForm.get('account_name')?.invalid && creditForm.get('account_name')?.touched" class="mt-1 text-red-500 text-sm">
                      <span *ngIf="creditForm.get('account_name')?.errors?.['required']">Account name is required</span>
                      <span *ngIf="creditForm.get('account_name')?.errors?.['minlength']">Account name must be at least 2 characters</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Submit Button -->
              <div class="mt-8">
                <button
                  type="submit"
                  [disabled]="creditForm.invalid || isCreditSubmitting"
                  class="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span *ngIf="!isCreditSubmitting">Process Credit Transaction</span>
                  <span *ngIf="isCreditSubmitting" class="flex items-center justify-center">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                </button>
              </div>
            </form>
          </div>

          <!-- Debit Form -->
          <div *ngIf="activeTab === 'debit'" class="p-6">
            <form [formGroup]="debitForm" (ngSubmit)="submitDebitForm()">
              <!-- Error/Success Messages -->
              <div *ngIf="debitError" class="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
                {{ debitError }}
              </div>
              <div *ngIf="debitSuccess" class="mb-4 p-4 bg-green-50 text-green-600 rounded-md">
                {{ debitSuccess }}
              </div>

              <!-- Merchant Selection -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Select Merchant</label>
                <div class="relative">
                  <select
                    formControlName="merchantId"
                    class="block w-full py-3 px-4 pr-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none"
                    (change)="onMerchantChange('debit')"
                  >
                    <option value="" disabled>Select a merchant</option>
                    <option *ngFor="let merchant of merchants" [value]="merchant._id">
                      {{ merchant.merchant_tradeName }} ({{ merchant.email }})
                    </option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <i class="material-icons text-gray-400">arrow_drop_down</i>
                  </div>
                </div>
                <div *ngIf="debitForm.get('merchantId')?.invalid && debitForm.get('merchantId')?.touched" class="mt-1 text-red-500 text-sm">
                  <span *ngIf="debitForm.get('merchantId')?.errors?.['required']">Please select a merchant</span>
                </div>
              </div>

              <!-- Wallet Selection -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Select Wallet</label>
                <div class="relative">
                  <select
                    formControlName="walletId"
                    class="block w-full py-3 px-4 pr-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none"
                    [disabled]="loadingWallets || !debitForm.get('merchantId')?.value"
                  >
                    <option value="" disabled>{{ walletDropdownPlaceholder('debit') }}</option>
                    <option *ngFor="let wallet of debitWallets" [value]="wallet._id">
                      {{ formatWalletOption(wallet) }}
                    </option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <div *ngIf="loadingWallets" class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    <i *ngIf="!loadingWallets" class="material-icons text-gray-400">arrow_drop_down</i>
                  </div>
                </div>
                <div *ngIf="debitForm.get('walletId')?.invalid && debitForm.get('walletId')?.touched" class="mt-1 text-red-500 text-sm">
                  <span *ngIf="debitForm.get('walletId')?.errors?.['required']">Please select a wallet</span>
                </div>
              </div>

              <!-- Account Type Selection -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                <div class="grid grid-cols-2 gap-3">
                  <div 
                    *ngFor="let type of debitAccountTypes" 
                    [class.bg-blue-50]="debitForm.get('account_type')?.value === type.value" 
                    [class.border-blue-500]="debitForm.get('account_type')?.value === type.value" 
                    class="border rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-all"
                    (click)="updateDebitAccountType(type.value)"
                  >
                    <i class="material-icons block mx-auto mb-2">{{ type.icon }}</i>
                    <span>{{ type.label }}</span>
                  </div>
                </div>
              </div>

              <!-- Transaction Amount -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <div class="relative mt-1 rounded-md shadow-sm">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span class="text-gray-500">GHS</span>
                  </div>
                  <input
                    type="text"
                    formControlName="amount"
                    class="block w-full pl-12 pr-12 py-3 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div *ngIf="debitForm.get('amount')?.invalid && debitForm.get('amount')?.touched" class="mt-1 text-red-500 text-sm">
                  <span *ngIf="debitForm.get('amount')?.errors?.['required']">Amount is required</span>
                  <span *ngIf="debitForm.get('amount')?.errors?.['pattern']">Amount must be a valid number</span>
                </div>
              </div>

              <!-- Account Details Section -->
              <div class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Left Column -->
                <div>
                  <!-- Account Number -->
                  <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Account Number
                    </label>
                    <div class="relative">
                      <input
                        type="text"
                        formControlName="account_number"
                        class="block w-full py-3 px-4 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter account number"
                        (blur)="verifyDebitAccountIfNeeded()"
                      />
                      <div *ngIf="debitAccountVerifying" class="absolute right-3 top-3">
                        <div class="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                      </div>
                    </div>
                    <div *ngIf="debitForm.get('account_number')?.invalid && debitForm.get('account_number')?.touched" class="mt-1 text-red-500 text-sm">
                      <span *ngIf="debitForm.get('account_number')?.errors?.['required']">Account number is required</span>
                      <span *ngIf="debitForm.get('account_number')?.errors?.['pattern']">Account number must contain only digits</span>
                    </div>
                  </div>

                  <!-- Account Issuer -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      {{ debitForm.get('account_type')?.value === 'bank' ? 'Bank' : 'Mobile Money Provider' }}
                    </label>
                    <select
                      formControlName="account_issuer"
                      class="block w-full py-3 px-4 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      (change)="onDebitAccountIssuerChange()"
                    >
                      <option value="" disabled>Select {{ debitForm.get('account_type')?.value === 'bank' ? 'Bank' : 'Provider' }}</option>
                      <ng-container *ngIf="debitForm.get('account_type')?.value === 'bank'">
                        <option *ngFor="let bank of banks" [value]="bank.BankCode">{{ bank.BankName }}</option>
                      </ng-container>
                      <ng-container *ngIf="debitForm.get('account_type')?.value === 'momo'">
                        <option value="mtn">MTN Mobile Money</option>
                        <option value="vodafone">Vodafone Cash</option>
                        <option value="airteltigo">AirtelTigo Money</option>
                      </ng-container>
                    </select>
                    <div *ngIf="debitForm.get('account_issuer')?.invalid && debitForm.get('account_issuer')?.touched" class="mt-1 text-red-500 text-sm">
                      <span *ngIf="debitForm.get('account_issuer')?.errors?.['required']">This field is required</span>
                    </div>
                  </div>
                </div>

                <!-- Right Column -->
                <div>
                  <!-- Account Name -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                    <input
                      type="text"
                      formControlName="account_name"
                      class="block w-full py-3 px-4 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Account holder name"
                      [readonly]="debitAccountNameReadOnly"
                    />
                    <div *ngIf="debitForm.get('account_name')?.invalid && debitForm.get('account_name')?.touched" class="mt-1 text-red-500 text-sm">
                      <span *ngIf="debitForm.get('account_name')?.errors?.['required']">Account name is required</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Submit Button -->
              <div class="mt-8">
                <button
                  type="submit"
                  [disabled]="debitForm.invalid || isDebitSubmitting"
                  class="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span *ngIf="!isDebitSubmitting">Process Debit Transaction</span>
                  <span *ngIf="isDebitSubmitting" class="flex items-center justify-center">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./transactions.component.scss'],
})
export class CreditDebitComponent implements OnInit {
  activeTab = 'credit';
  creditForm!: FormGroup;
  debitForm!: FormGroup;
  banks: Bank[] = [];
  merchants: Merchant[] = [];
  
  // Wallet data
  wallets: Wallet[] = [];
  creditWallets: Wallet[] = [];
  debitWallets: Wallet[] = [];
  loadingWallets = false;
  
  accountVerifying = false;
  accountNameReadOnly = false;
  
  debitAccountVerifying = false;
  debitAccountNameReadOnly = false;
  
  creditError = '';
  creditSuccess = '';
  isCreditSubmitting = false;
  
  debitError = '';
  debitSuccess = '';
  isDebitSubmitting = false;

  // Constants for account types
  accountTypes = [
    { value: 'momo', label: 'Mobile Money', icon: 'smartphone' },
    { value: 'bank', label: 'Bank Account', icon: 'account_balance' },
    { value: 'btc', label: 'Bitcoin', icon: 'currency_bitcoin' },
    { value: 'trc20', label: 'USDT (TRC20)', icon: 'token' },
    { value: 'erc20', label: 'USDT (ERC20)', icon: 'currency_exchange' },
    { value: 'solana', label: 'Solana', icon: 'bolt' }
  ];
  
  debitAccountTypes = [
    { value: 'momo', label: 'Mobile Money', icon: 'smartphone' },
    { value: 'bank', label: 'Bank Account', icon: 'account_balance' }
  ];
  
  serviceTypes = [
    { value: 'GIP', label: 'GIP', description: 'Ghana Interbank Payment (Standard)' },
    { value: 'NRT', label: 'NRT', description: 'Near Real-Time (Faster)' }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private store: Store
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.fetchBanks();
    this.fetchMerchants();
  }

  initializeForms() {
    // Initialize Credit Form
    this.creditForm = this.fb.group({
      merchantId: ['', [Validators.required]],
      walletId: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      account_number: ['', [Validators.required]],
      account_name: ['', [Validators.required, Validators.minLength(2)]],
      account_issuer: ['', [Validators.required]],
      account_type: ['momo'],
    //   serviceType: ['GIP'],
    });

    // Initialize Debit Form
    this.debitForm = this.fb.group({
      walletId: ['', [Validators.required]],
      merchantId: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      account_type: ['momo', [Validators.required]],
      account_name: ['', [Validators.required]],
      account_number: ['', [Validators.required, Validators.pattern(/^\d+$/), Validators.minLength(10)]],
      account_issuer: ['', [Validators.required]]
    });

    // Update form validation when account type changes
    this.creditForm.get('account_type')?.valueChanges.subscribe(type => {
      this.updateCreditFormValidation(type);
    });
    
    this.debitForm.get('account_type')?.valueChanges.subscribe(type => {
      this.updateDebitFormValidation(type);
    });
  }

  private getHeaders(): HttpHeaders {
    const token = this.store.selectSnapshot(AuthState.token);
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.resetMessages();
  }

  resetMessages() {
    this.creditError = '';
    this.creditSuccess = '';
    this.debitError = '';
    this.debitSuccess = '';
  }

  fetchBanks() {
    this.http.get<any>('https://doronpay.com/api/hub/banks/get', {
      headers: this.getHeaders()
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.banks = response.data;
        } else {
          console.error('Failed to fetch banks:', response.message);
        }
      },
      error: (err) => {
        console.error('Error fetching banks:', err);
      }
    });
  }

  fetchMerchants() {
    this.http.get<any>('https://doronpay.com/api/merchants/get', {
      headers: this.getHeaders()
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.merchants = response.data.filter((merchant: Merchant) => merchant.active);
        } else {
          console.error('Failed to fetch merchants:', response.message);
        }
      },
      error: (err) => {
        console.error('Error fetching merchants:', err);
      }
    });
  }

  onMerchantChange(formType: 'credit' | 'debit') {
    // Reset wallet dropdown and clear any previous errors
    if (formType === 'credit') {
      this.creditForm.patchValue({ walletId: '' });
      this.creditWallets = [];
    } else {
      this.debitForm.patchValue({ walletId: '' });
      this.debitWallets = [];
    }
    
    const merchantId = formType === 'credit' 
      ? this.creditForm.get('merchantId')?.value 
      : this.debitForm.get('merchantId')?.value;
    
    if (merchantId) {
      this.fetchMerchantWallets(merchantId, formType);
    }
  }

  fetchMerchantWallets(merchantId: string, formType: 'credit' | 'debit') {
    this.loadingWallets = true;
    
    this.http.get<any>('https://doronpay.com/api/accounts/get', {
      headers: this.getHeaders()
    }).subscribe({
      next: (response) => {
        if (response.success) {
          // Filter wallets by merchant ID
          const merchantWallets = response.data.filter((wallet: Wallet) => 
            wallet.merchantId && wallet.merchantId._id === merchantId && wallet.active
          );
          
          this.wallets = merchantWallets;
          
          if (formType === 'credit') {
            this.creditWallets = merchantWallets;
          } else {
            this.debitWallets = merchantWallets;
          }
        } else {
          if (formType === 'credit') {
            this.creditError = 'Failed to load wallets: ' + (response.message || 'Unknown error');
          } else {
            this.debitError = 'Failed to load wallets: ' + (response.message || 'Unknown error');
          }
        }
        this.loadingWallets = false;
      },
      error: (err) => {
        if (formType === 'credit') {
          this.creditError = 'Error loading wallets';
        } else {
          this.debitError = 'Error loading wallets';
        }
        console.error('Error fetching wallets:', err);
        this.loadingWallets = false;
      }
    });
  }

  walletDropdownPlaceholder(formType: 'credit' | 'debit'): string {
    const form = formType === 'credit' ? this.creditForm : this.debitForm;
    const wallets = formType === 'credit' ? this.creditWallets : this.debitWallets;
    
    if (!form.get('merchantId')?.value) {
      return 'Select a merchant first';
    }
    
    if (this.loadingWallets) {
      return 'Loading wallets...';
    }
    
    if (wallets.length === 0) {
      return 'No wallets available';
    }
    
    return 'Select a wallet';
  }

  formatWalletOption(wallet: Wallet): string {
    return `${wallet.walletId} - ${wallet.walletType} (${wallet.currency}) - Balance: ${this.formatCurrency(wallet.availableBalance, wallet.currency)}`;
  }

  formatCurrency(amount: number, currency: string = 'GHS'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }

  updateAccountType(type: string) {
    this.creditForm.patchValue({ account_type: type, account_issuer: '' });
    this.accountNameReadOnly = false;
  }

  updateDebitAccountType(type: string) {
    this.debitForm.patchValue({ account_type: type, account_issuer: '' });
    this.debitAccountNameReadOnly = false;
  }

  get accountNumberLabel(): string {
    const type = this.creditForm.get('account_type')?.value;
    switch (type) {
      case 'momo': return 'Mobile Money Number';
      case 'bank': return 'Bank Account Number';
      case 'btc': return 'Bitcoin Address';
      case 'trc20': return 'USDT (TRC20) Address';
      case 'erc20': return 'USDT (ERC20) Address';
      case 'solana': return 'Solana Address';
      default: return 'Account Number';
    }
  }

  get accountNumberPlaceholder(): string {
    const type = this.creditForm.get('account_type')?.value;
    switch (type) {
      case 'momo': return 'Enter 10-digit mobile number';
      case 'bank': return 'Enter bank account number';
      case 'btc': return 'Enter Bitcoin wallet address';
      case 'trc20': return 'Enter USDT (TRC20) address';
      case 'erc20': return 'Enter USDT (ERC20) address';
      case 'solana': return 'Enter Solana address';
      default: return 'Enter account number';
    }
  }

  get accountIssuerLabel(): string {
    const type = this.creditForm.get('account_type')?.value;
    return type === 'bank' ? 'Bank' : 'Mobile Money Provider';
  }

  get showAccountIssuerField(): boolean {
    const type = this.creditForm.get('account_type')?.value;
    return type === 'bank' || type === 'momo';
  }

  updateCreditFormValidation(accountType: string) {
    const accountNumberControl = this.creditForm.get('account_number');
    
    // Reset validators
    if (accountNumberControl) {
      accountNumberControl.clearValidators();
      
      // Add base required validator
      accountNumberControl.addValidators(Validators.required);
      
      // Add specific validators based on account type
      switch (accountType) {
        case 'momo':
          accountNumberControl.addValidators(Validators.pattern(/^[0-9]{10}$/));
          break;
        case 'bank':
          accountNumberControl.addValidators(Validators.pattern(/^[0-9]{10,16}$/));
          break;
        case 'btc':
          accountNumberControl.addValidators(Validators.pattern(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/));
          break;
        case 'trc20':
          accountNumberControl.addValidators(Validators.pattern(/^T[A-Za-z1-9]{33}$/));
          break;
        case 'solana':
          accountNumberControl.addValidators(Validators.pattern(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/));
          break;
        case 'erc20':
          accountNumberControl.addValidators(Validators.pattern(/^0x[a-fA-F0-9]{40}$/));
          break;
      }
      
      // Update validators
      accountNumberControl.updateValueAndValidity();
    }

    // Reset account name and issuer fields
    this.creditForm.patchValue({
      account_name: '',
      account_issuer: ''
    });
  }

  updateDebitFormValidation(accountType: string) {
    const accountNumberControl = this.debitForm.get('account_number');
    
    // Reset validators
    if (accountNumberControl) {
      accountNumberControl.clearValidators();
      
      // Add base required validator
      accountNumberControl.addValidators([
        Validators.required,
        Validators.pattern(/^\d+$/),
        Validators.minLength(10)
      ]);
      
      // Update validators
      accountNumberControl.updateValueAndValidity();
    }

    // Reset account name and issuer fields
    this.debitForm.patchValue({
      account_name: '',
      account_issuer: ''
    });
  }

  onAccountIssuerChange() {
    // Reset account name when issuer changes (for verification)
    this.creditForm.patchValue({ account_name: '' });
    this.accountNameReadOnly = false;
    
    // Verify account if number is already entered
    if (this.creditForm.get('account_number')?.valid) {
      this.verifyAccountIfNeeded();
    }
  }

  onDebitAccountIssuerChange() {
    // Reset account name when issuer changes (for verification)
    this.debitForm.patchValue({ account_name: '' });
    this.debitAccountNameReadOnly = false;
    
    // Verify account if number is already entered
    if (this.debitForm.get('account_number')?.valid) {
      this.verifyDebitAccountIfNeeded();
    }
  }

  verifyAccountIfNeeded() {
    const accountType = this.creditForm.get('account_type')?.value;
    const accountNumber = this.creditForm.get('account_number')?.value;
    const accountIssuer = this.creditForm.get('account_issuer')?.value;
    
    // Only verify for bank and momo accounts when both number and issuer are provided
    if ((accountType === 'bank' || accountType === 'momo') && 
        accountNumber && 
        accountIssuer && 
        this.creditForm.get('account_number')?.valid) {
      
      this.accountVerifying = true;
      
      this.verifyAccount(accountNumber, accountIssuer, accountType)
        .then(response => {
          this.accountVerifying = false;
          
          if (response?.success && response?.data?.success) {
            // Set account name from verification response
            this.creditForm.patchValue({ account_name: response.data.data });
            this.accountNameReadOnly = true;
          } else {
            // Reset account name on failed verification
            this.creditForm.patchValue({ account_name: '' });
            this.accountNameReadOnly = false;
            this.creditError = 'Account verification failed: ' + (response?.data?.message || 'Unable to verify account');
            
            // Auto-clear error after 5 seconds
            setTimeout(() => {
              this.creditError = '';
            }, 5000);
          }
        })
        .catch(error => {
          this.accountVerifying = false;
          this.accountNameReadOnly = false;
          this.creditError = 'Account verification error: ' + error.message;
          
          // Auto-clear error after 5 seconds
          setTimeout(() => {
            this.creditError = '';
          }, 5000);
        });
    }
  }

  verifyDebitAccountIfNeeded() {
    const accountType = this.debitForm.get('account_type')?.value;
    const accountNumber = this.debitForm.get('account_number')?.value;
    const accountIssuer = this.debitForm.get('account_issuer')?.value;
    
    // Only verify for bank and momo accounts when both number and issuer are provided
    if ((accountType === 'bank' || accountType === 'momo') && 
        accountNumber && 
        accountIssuer && 
        this.debitForm.get('account_number')?.valid) {
      
      this.debitAccountVerifying = true;
      
      this.verifyAccount(accountNumber, accountIssuer, accountType)
        .then(response => {
          this.debitAccountVerifying = false;
          
          if (response?.success && response?.data?.success) {
            // Set account name from verification response
            this.debitForm.patchValue({ account_name: response.data.data });
            this.debitAccountNameReadOnly = true;
          } else {
            // Reset account name on failed verification
            this.debitForm.patchValue({ account_name: '' });
            this.debitAccountNameReadOnly = false;
            this.debitError = 'Account verification failed: ' + (response?.data?.message || 'Unable to verify account');
            
            // Auto-clear error after 5 seconds
            setTimeout(() => {
              this.debitError = '';
            }, 5000);
          }
        })
        .catch(error => {
          this.debitAccountVerifying = false;
          this.debitAccountNameReadOnly = false;
          this.debitError = 'Account verification error: ' + error.message;
          
          // Auto-clear error after 5 seconds
          setTimeout(() => {
            this.debitError = '';
          }, 5000);
        });
    }
  }

  async verifyAccount(number: string, bankCode: string, accountType: string) {
    try {
      return await this.http
        .get<VerifyAccountResponse>(
          `https://doronpay.com/api/transactions/nec?number=${number}&bankCode=${bankCode}&account_type=${accountType}`,
          { headers: this.getHeaders() }
        )
        .toPromise();
    } catch (error) {
      console.error('Account verification error:', error);
      throw error;
    }
  }

  async submitCreditForm() {
    if (this.creditForm.invalid) {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.creditForm);
      return;
    }
    
    this.isCreditSubmitting = true;
    this.creditError = '';
    this.creditSuccess = '';
    
    try {
      const response = await this.http
        .put<any>(
          'https://doronpay.com/api/accounts/deposit',
          this.creditForm.value,
          { headers: this.getHeaders() }
        )
        .toPromise();
      
      if (response?.success) {
        this.creditSuccess = 'Credit transaction processed successfully!';
        // Reset form but keep merchant ID
        const merchantId = this.creditForm.get('merchantId')?.value;
        this.initializeForms();
        this.creditForm.patchValue({ merchantId });
        // Refresh wallets for the merchant
        this.fetchMerchantWallets(merchantId, 'credit');
      } else {
        this.creditError = response?.message || 'Failed to process credit transaction';
      }
    } catch (error: any) {
      this.creditError = 'Error processing credit transaction: ' + (error.message || 'Unknown error');
      console.error('Credit transaction error:', error);
    } finally {
      this.isCreditSubmitting = false;
    }
  }

  async submitDebitForm() {
    if (this.debitForm.invalid) {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.debitForm);
      return;
    }
    
    this.isDebitSubmitting = true;
    this.debitError = '';
    this.debitSuccess = '';
    
    try {
      const response = await this.http
        .put<any>(
          'https://doronpay.com/api/accounts/debit',
          this.debitForm.value,
          { headers: this.getHeaders() }
        )
        .toPromise();
      
      if (response?.success) {
        this.debitSuccess = 'Debit transaction processed successfully!';
        // Reset form but keep merchant ID
        const merchantId = this.debitForm.get('merchantId')?.value;
        this.initializeForms();
        this.debitForm.patchValue({
          merchantId,
          account_type: 'momo'
        });
        // Refresh wallets for the merchant
        this.fetchMerchantWallets(merchantId, 'debit');
      } else {
        this.debitError = response?.message || 'Failed to process debit transaction';
      }
    } catch (error: any) {
      this.debitError = 'Error processing debit transaction: ' + (error.message || 'Unknown error');
      console.error('Debit transaction error:', error);
    } finally {
      this.isDebitSubmitting = false;
    }
  }

  // Helper method to mark all controls in a form group as touched
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}