// operator-switch.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import api from '../../constants/api.constant'
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
enum EPaymentAccountTypes {
  BANK = "bank",
  MOMO = "momo",
  CARD = "card",
//   WALLET = "wallet",
//   TOKEN = "token",
  BTC = "btc",
  TRC20 = "trc20",
  ERC20 = "erc20",
  SOLANA = "solana",
}

enum EOperator {
  DORON = "DORON",
  PEOPLESPAY = "PEOPLESPAY",
  FIDELITY = "FIDELITY",
  SOLANA = "SOLANA",
  GTCARD = "GTCARD", // GTBank card payment
  MOOLRE = "MOOLRE",
  PCARD = "PCARD", // Peoplespay Card payment
  TRC20 = "TRC20",
  ERC20 = "ERC20",
  GTB = "GTB",
  FAB = "FAB",
  BTC = "BTC",
  GIP = "GIP",
}

interface OperatorStats {
  operator: EOperator;
  successRate: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageResponseTime: number;
  isActive: boolean;
}

interface SwitchHistoryItem {
  _id: string;
  accountType: EPaymentAccountTypes;
  previousOperator: EOperator;
  newOperator: EOperator;
  reason: string;
  merchantId?: string;
  timestamp: Date;
  triggeredBy: string; // 'AUTO' or 'MANUAL'
}

@Component({
  selector: 'app-operator-switch',
  standalone: true,
  imports: [
    CommonModule,
    // HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './operator-switch.component.html',
  styleUrls: ['./operator-switch.component.scss']
})
export class OperatorSwitchComponent implements OnInit {
  apiUrl = api;
  accountTypes = Object.values(EPaymentAccountTypes);
  operators = Object.values(EOperator);
  
  // Selected filters
  selectedAccountType: EPaymentAccountTypes | null = null;
  merchantId: string = '';
  
  // Data
  thresholds: Record<string, any> = {};
  stats: Record<string, any> = {};
  history: SwitchHistoryItem[] = [];
  
  // UI state
  loading = true;
  error: string | null = null;
  serviceStatus: 'running' | 'stopped' | 'unknown' = 'unknown';
  runningAnalysis = false;
  showSwitchForm = false;
  showResetConfirm = false;
  
  // Forms
  switchForm: FormGroup;
  
  constructor(
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.switchForm = this.fb.group({
      accountType: ['', Validators.required],
      newOperator: ['', Validators.required],
      reason: ['Manual switch by administrator', [Validators.required, Validators.maxLength(500)]],
      merchantId: ['']
    });
  }

  ngOnInit(): void {
    this.loadThresholds();
    this.loadAllStats();
  }

  // API Calls
  loadThresholds(): void {
    this.http.get(`${this.apiUrl}/operator-switch/thresholds`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.thresholds = response.data;
        } else {
          this.error = response.message || 'Failed to load thresholds';
        }
      },
      error: (err) => {
        this.error = 'Failed to load thresholds';
        console.error(err);
      }
    });
  }

  loadAllStats(): void {
    this.loading = true;
    this.error = null;
    
    // Create an array of promises for each account type
    const promises = this.accountTypes.map(accountType => 
      this.http.get(`${this.apiUrl}/operator-switch/stats/${accountType}${this.merchantId ? `?merchantId=${this.merchantId}` : ''}`).toPromise()
    );
    
    // Wait for all promises to resolve
    Promise.all(promises)
      .then((results: any[]) => {
        results.forEach((response, index) => {
          if (response.success) {
            this.stats[this.accountTypes[index]] = response.data;
          }
        });
        this.loading = false;
      })
      .catch(err => {
        this.error = 'Failed to load operator stats';
        this.loading = false;
        console.error(err);
      });
  }

  loadAccountTypeStats(accountType: EPaymentAccountTypes): void {
    this.loading = true;
    this.error = null;
    
    this.http.get(`${this.apiUrl}/operator-switch/stats/${accountType}${this.merchantId ? `?merchantId=${this.merchantId}` : ''}`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.stats[accountType] = response.data;
          this.error = null;
        } else {
          this.error = response.message || 'Failed to load operator stats';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load operator stats';
        this.loading = false;
        console.error(err);
      }
    });
  }

  loadSwitchHistory(accountType: EPaymentAccountTypes): void {
    this.http.get(`${this.apiUrl}/operator-switch/history/${accountType}${this.merchantId ? `?merchantId=${this.merchantId}` : ''}`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.history = response.data;
        } else {
          if (!this.error) {
            this.error = response.message || 'Failed to load switch history';
          }
        }
      },
      error: (err) => {
        if (!this.error) {
          this.error = 'Failed to load switch history';
        }
        console.error(err);
      }
    });
  }

  runAnalysis(): void {
    this.runningAnalysis = true;
    this.http.post(`${this.apiUrl}/operator-switch/run-analysis`, {}).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Set a timeout to refresh the stats after a delay to allow analysis to complete
          setTimeout(() => {
            if (this.selectedAccountType) {
              this.loadAccountTypeStats(this.selectedAccountType);
            } else {
              this.loadAllStats();
            }
            this.runningAnalysis = false;
          }, 3000);
        } else {
          this.error = response.message || 'Failed to run analysis';
          this.runningAnalysis = false;
        }
      },
      error: (err) => {
        this.error = 'Failed to run analysis';
        this.runningAnalysis = false;
        console.error(err);
      }
    });
  }

  manualSwitch(): void {
    if (this.switchForm.valid) {
      const formValue = this.switchForm.value;
      
      this.http.post(`${this.apiUrl}/operator-switch/manual-switch`, {
        accountType: formValue.accountType,
        newOperator: formValue.newOperator,
        reason: formValue.reason,
        merchantId: formValue.merchantId || undefined
      }).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.showSwitchForm = false;
            if (this.selectedAccountType) {
              this.loadAccountTypeStats(this.selectedAccountType);
              this.loadSwitchHistory(this.selectedAccountType);
            } else {
              this.loadAllStats();
            }
          } else {
            this.error = response.message || 'Failed to switch operator';
          }
        },
        error: (err) => {
          this.error = 'Failed to switch operator';
          console.error(err);
        }
      });
    }
  }

  resetStats(): void {
    if (!this.selectedAccountType) return;
    
    // Now TypeScript knows selectedAccountType is not null
    this.http.post(`${this.apiUrl}/operator-switch/reset-stats`, {
      accountType: this.selectedAccountType,
      merchantId: this.merchantId || undefined
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.showResetConfirm = false;
          // Here also add a null check
          if (this.selectedAccountType) {
            this.loadAccountTypeStats(this.selectedAccountType);
          }
        } else {
          this.error = response.message || 'Failed to reset stats';
        }
      },
      error: (err) => {
        this.error = 'Failed to reset stats';
        console.error(err);
      }
    });
  }

  startService(): void {
    this.http.post(`${this.apiUrl}/operator-switch/start`, {}).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.serviceStatus = 'running';
          // Refresh stats after a delay
          setTimeout(() => {
            if (this.selectedAccountType) {
              this.loadAccountTypeStats(this.selectedAccountType);
            } else {
              this.loadAllStats();
            }
          }, 2000);
        } else {
          this.error = response.message || 'Failed to start service';
        }
      },
      error: (err) => {
        this.error = 'Failed to start service';
        console.error(err);
      }
    });
  }

  stopService(): void {
    this.http.post(`${this.apiUrl}/operator-switch/stop`, {}).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.serviceStatus = 'stopped';
        } else {
          this.error = response.message || 'Failed to stop service';
        }
      },
      error: (err) => {
        this.error = 'Failed to stop service';
        console.error(err);
      }
    });
  }

  // UI Actions
  selectAccountType(accountType: EPaymentAccountTypes | null): void {
    this.selectedAccountType = accountType;
    
    if (accountType) {
      this.loadAccountTypeStats(accountType);
      this.loadSwitchHistory(accountType);
    } else {
      this.loadAllStats();
      this.history = [];
    }
  }

  onMerchantFilterChange(): void {
    if (this.selectedAccountType) {
      this.loadAccountTypeStats(this.selectedAccountType);
      this.loadSwitchHistory(this.selectedAccountType);
    } else {
      this.loadAllStats();
    }
  }

  toggleSwitchForm(): void {
    this.showSwitchForm = !this.showSwitchForm;
    
    if (this.showSwitchForm) {
      let defaultOperator = '';
      
      // If we have a selected account type and it has a current operator, 
      // pre-select a different operator
      if (this.selectedAccountType && this.stats[this.selectedAccountType]?.stats?.currentOperator) {
        const currentOperator = this.stats[this.selectedAccountType].stats.currentOperator;
        const currentIndex = this.operators.indexOf(currentOperator);
        const nextIndex = (currentIndex + 1) % this.operators.length;
        defaultOperator = this.operators[nextIndex];
      }
      
      this.switchForm.patchValue({
        accountType: this.selectedAccountType || '',
        newOperator: defaultOperator,
        reason: 'Manual switch by administrator',
        merchantId: this.merchantId || ''
      });
    }
  }

  confirmResetStats(): void {
    this.showResetConfirm = true;
  }

  // Helper Methods
  getAccountTypeName(type: EPaymentAccountTypes): string {
    const names = {
      [EPaymentAccountTypes.BANK]: 'Bank Transfer',
      [EPaymentAccountTypes.MOMO]: 'Mobile Money',
      [EPaymentAccountTypes.CARD]: 'Card Payment',
    //   [EPaymentAccountTypes.WALLET]: 'Wallet',
    //   [EPaymentAccountTypes.TOKEN]: 'Token',
      [EPaymentAccountTypes.BTC]: 'Bitcoin',
      [EPaymentAccountTypes.TRC20]: 'TRC20',
      [EPaymentAccountTypes.ERC20]: 'ERC20',
      [EPaymentAccountTypes.SOLANA]: 'Solana',
    };
    return names[type] || type;
  }

  getOperatorName(operator: EOperator): string {
    const names = {
      [EOperator.DORON]: 'Doron',
      [EOperator.PEOPLESPAY]: 'PeoplesPay',
      [EOperator.FIDELITY]: 'Fidelity',
      [EOperator.SOLANA]: 'Solana Network',
      [EOperator.GTCARD]: 'GT Bank Card',
      [EOperator.MOOLRE]: 'Moolre',
      [EOperator.PCARD]: 'PeoplesPay Card',
      [EOperator.TRC20]: 'TRC20 Network',
      [EOperator.ERC20]: 'ERC20 Network',
      [EOperator.GTB]: 'GTBank',
      [EOperator.FAB]: 'First Atlantic Bank',
      [EOperator.BTC]: 'Bitcoin Network',
      [EOperator.GIP]: 'GIP',
    };
    return names[operator] || operator;
  }

  // Update the getSuccessRateClass method to handle failure rate instead of success rate
getSuccessRateClass(failureRate: number, threshold: number): string {
    if (failureRate === undefined || failureRate === null) return 'text-gray-500';
    
    if (failureRate <= threshold - 10) {
      return 'text-green-600';
    } else if (failureRate <= threshold) {
      return 'text-yellow-600';
    } else {
      return 'text-red-600';
    }
  }
  
  // Add new helper methods to display the data in a user-friendly way
  getDisplayFailureRate(stats: any): string {
    if (!stats || stats.failureRate === undefined || stats.failureRate === null) {
      return 'N/A';
    }
    return stats.failureRate.toFixed(1) + '%';
  }
  
  getDisplayTransactions(stats: any): number {
    if (!stats || !stats.totalTransactions) {
      return 0;
    }
    return stats.totalTransactions;
  }
  
  getDisplayLastSwitched(stats: any): string {
    if (!stats || !stats.lastSwitched) {
      return 'None';
    }
    return new Date(stats.lastSwitched).toLocaleString();
  }
  
  getDisplayThreshold(threshold: any): string {
    if (!threshold || threshold.failureRate === undefined) {
      return 'N/A';
    }
    return threshold.failureRate + '%';
  }
  
  getDisplayMinTransactions(threshold: any): number {
    if (!threshold || !threshold.minTransactions) {
      return 0;
    }
    return threshold.minTransactions;
  }
  
  getDisplayCooldownPeriod(threshold: any): string {
    if (!threshold || !threshold.cooldownMinutes) {
      return 'N/A';
    }
    return threshold.cooldownMinutes + ' minutes';
  }
  
  getDisplayTimeWindow(threshold: any): string {
    if (!threshold || !threshold.timeWindowMinutes) {
      return 'N/A';
    }
    return threshold.timeWindowMinutes + ' minutes';
  }
  
  // Modified method to check if operators exist in the response
  hasPreviousOperators(stats: any): boolean {
    return stats && 
           stats.previousOperators && 
           Array.isArray(stats.previousOperators) && 
           stats.previousOperators.length > 0;
  }
}