import { Component, OnInit } from '@angular/core';
import { NgxsModule, Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { AuthState } from '../../state/apps/app.states';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

interface App {
  _id: string;
  name: string;
  apikey: string;
  ussdShortCode: string;
  ussdPaymentCallbackUrl: string;
  operations: string[];
  cardTransactionCharge: number;
  momoTransactionCharge: number;
  btcTransactionCharge: number;
  ussdEnabled: boolean;
  mode: string;
  createdAt: string;
  merchantId: {
    merchant_tradeName: string;
  };
}

interface SearchFilters {
  name?: string;
  mode?: string;
  operations?: string[];
  ussdEnabled?: boolean;
}

interface Balance {
  totalBalance: number;
  balance: number;
  confirmedBalance: number;
  accountNumber: string;
  blockedBalance: number;
}

interface WalletAccount {
  accountType: string;
  walletType: string;
  currency: string;
  blockedBalance: number;
  unConfirmedBalance: number;
  merchantId: string;
  walletId: string;
  totalBalance: number;
  balance: number;
  lastBalance: number;
  type: string;
  active: boolean;
  confirmedBalance: number;
  accountNumber: string;
  availableBalance: number;
  id: string;
}

@Component({
  selector: 'app-hub-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, AsyncPipe, NgxsModule, FormsModule, ReactiveFormsModule],
  templateUrl: './hub-dashboard.component.html',
  styleUrls: ['./hub-dashboard.component.scss']
})
export class HubDashboardComponent implements OnInit {
  @Select(AuthState.user) user$!: Observable<any>;
  @Select(AuthState.token) token$!: Observable<string>;
  
  merchantId: string = '';
  apps: App[] = [];
  balance: WalletAccount | null = null;
  loading = false;
  error = '';
  showCreateModal = false;
  newAppName = '';
  merchantname: string= '';
  showUpdateModal = false;
  updateForm: FormGroup;
  currentAppId: string = '';
  isKeyVisible: { [key: string]: boolean } = {};
  searchTerm: string = '';
  filteredApps: App[] = [];

  constructor(
    private http: HttpClient,
    private store: Store,
    private router: Router,
    private fb: FormBuilder,
  ) {
    this.updateForm = this.fb.group({
      name: [''],
      ussdShortCode: [''],
      ussdPaymentCallbackUrl: ['', Validators.pattern(/^https?:\/\/.+/)],
      ussdEnabled: [false]
    });
  }

  ngOnInit() {
    this.store.select(AuthState.user).subscribe(user => {
      if (user?.merchantId?._id) {
        this.merchantId = user.merchantId._id;
        this.fetchApps(this.merchantId);
        // this.fetchBalance(this.merchantId);
        this.merchantname = user.merchantId.merchant_tradeName;
      }
    });
    this.apps.forEach(app => {
      this.isKeyVisible[app._id] = false;
    });
    this.filteredApps = this.apps;
  }

  toggleKeyVisibility(appId: string) {
    this.isKeyVisible[appId] = !this.isKeyVisible[appId];
    
    // Automatically hide after 30 seconds
    if (this.isKeyVisible[appId]) {
      setTimeout(() => {
        this.isKeyVisible[appId] = false;
      }, 30000);
    }
  }

  searchApps(event: KeyboardEvent): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm = searchTerm;
    this.filterApps();
  }

  filterApps(): void {
    if (!this.searchTerm.trim()) {
      this.filteredApps = this.apps;
      return;
    }

    this.filteredApps = this.apps.filter(app => {
      return (
        app.name.toLowerCase().includes(this.searchTerm) ||
        app.mode.toLowerCase().includes(this.searchTerm) ||
        app.operations.some(op => op.toLowerCase().includes(this.searchTerm)) ||
        app.ussdShortCode?.toLowerCase().includes(this.searchTerm) || 
        app.merchantId?.merchant_tradeName?.toLowerCase().includes(this.searchTerm)
      );
    });
  }

  fetchApps(merchantId: string) {
    this.loading = true;
    this.http.get<any>(`https://doronpay.com/api/hub/get`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.apps = response.data;
          this.filteredApps = this.apps; // Update filtered apps too
          this.apps.forEach(app => {
            this.isKeyVisible[app._id] = false;
          });
        }
        this.loading = false;
      },
      error: (err) => {
        alert('Failed to fetch apps');
        this.loading = false;
      }
    });
  }

  // fetchBalance(merchantId: string) {
  //   this.http.get<any>(`https://doronpay.com/api/accounts/merchant/${merchantId}`, {
  //     headers: this.getHeaders()
  //   }).subscribe({
  //     next: (response) => {
  //       if (response.success && response.data) {
  //         this.balance = response.data;
  //       }
  //     },
  //     error: (err) => {
  //       alert('Failed to fetch balance');
  //     }
  //   });
  // }

  generateNewKey(appId: string, merchantId: string) {
    if (!merchantId) {
      alert('Merchant ID not found');
      return;
    }

    if (confirm('Are you sure you want to generate a new API key? The old key will stop working immediately.')) {
      this.loading = true;
      this.http.post<any>('https://doronpay.com/api/hub/generatekey', {
        appId,
        merchantId
      }, { headers: this.getHeaders() }).subscribe({
        next: (response) => {
          if (response.success) {
            alert('New API key generated successfully');
            this.fetchApps(merchantId);
          } else {
            alert(response.message || 'Failed to generate new key');
          }
          this.loading = false;
        },
        error: (err) => {
          alert('Failed to generate new key');
          this.loading = false;
        }
      });
    }
  }

  createNewApp() {
    if (!this.newAppName.trim()) {
      alert('Please enter an app name');
      return;
    }

    this.loading = true;
    this.http.post<any>('https://doronpay.com/api/hub/new', {
      merchantId: this.merchantId,
      name: this.newAppName.trim()
    }, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        if (response.success) {
          alert('App created successfully');
          this.newAppName = '';
          this.showCreateModal = false;
          this.fetchApps(this.merchantId);
        } else {
          alert(response.message || 'Failed to create app');
        }
        this.loading = false;
      },
      error: (err) => {
        alert('Failed to create app');
        this.loading = false;
      }
    });
  }

  viewTransactions(appId: string) {
    this.router.navigate(['/transactions', appId]);
  }

  private getHeaders(): HttpHeaders {
    const token = this.store.selectSnapshot(AuthState.token);
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatAccountNumber(number: string): string {
    return number.replace(/(\d{4})/g, '$1 ').trim();
  }

  openUpdateModal(app: App) {
    this.currentAppId = app._id;
    this.updateForm.patchValue({
      name: app.name,
      ussdShortCode: app.ussdShortCode || '',
      ussdPaymentCallbackUrl: app.ussdPaymentCallbackUrl || '',
      ussdEnabled: app.ussdEnabled || false
    });
    this.showUpdateModal = true;
  }

  closeModal(event: MouseEvent) {
    if ((event.target as HTMLElement).className === 'modal-overlay') {
      this.showUpdateModal = false;
    }
  }

  updateWalletDetails() {
    if (this.updateForm.invalid) return;

    const payload = {
      id: this.currentAppId,
      data: this.updateForm.value
    };

    this.loading = true;
    this.http.put('https://doronpay.com/api/hub/update', payload, {
      headers: this.getHeaders()
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.showUpdateModal = false;
          this.fetchApps(this.merchantId);
          alert('Wallet settings updated successfully');
        } else {
          alert(response.message || 'Failed to update wallet settings');
        }
        this.loading = false;
      },
      error: (err) => {
        alert('Failed to update wallet settings');
        this.loading = false;
      }
    });
  }

  copyApiKey(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // You could show a toast notification here
      alert('API key copied to clipboard');
    });
  }
}


