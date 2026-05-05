// admin-recent-withdrawals.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AdminRecentWithdrawalsService } from './admin-recent-withdrawals.service';
import { RecentWithdrawal, WithdrawalStats } from './admin-recent-withdrawals.interface';

@Component({
  selector: 'app-admin-recent-withdrawals',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-recent-withdrawals.component.html',
  styleUrls: ['./admin-recent-withdrawals.component.scss']
})
export class AdminRecentWithdrawalsComponent implements OnInit, OnDestroy {
  // Data
  withdrawals: RecentWithdrawal[] = [];
  
  // UI State
  loading = true;
  error = false;
  lastUpdated: Date | null = null;
  selectedWithdrawal: RecentWithdrawal | null = null;
  showDetailsModal = false;
  
  // Auto-refresh
  private autoRefreshInterval: any;
  autoRefreshEnabled = true;
  autoRefreshSeconds = 30;
  
  // Destroy subject
  private destroy$ = new Subject<void>();
  
  Math = Math;
  
  // Valid currencies for formatting
  private validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'AUD', 'CNY', 'INR', 'BRL', 'GHS', 'NGN', 'ZAR'];
  
  // Network colors
  private networkColors: Record<string, string> = {
    'TRC20': '#e74c3c',
    'BEP20': '#f0b90b',
    'SOLANA': '#14f195',
    'POLYGON': '#8247e5',
    'ERC20': '#627eea',
    'BTC': '#f7931a',
    'ETH': '#627eea'
  };
  
  constructor(
    private service: AdminRecentWithdrawalsService
  ) {}
  
  ngOnInit() {
    this.loadWithdrawals();
    this.startAutoRefresh();
  }
  
  ngOnDestroy() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadWithdrawals() {
    this.loading = true;
    this.error = false;
    
    this.service.getRecentWithdrawals()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.withdrawals = response.data;
          this.lastUpdated = new Date();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading recent withdrawals:', error);
          this.error = true;
          this.loading = false;
        }
      });
  }
  
  startAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    
    this.autoRefreshInterval = setInterval(() => {
      if (this.autoRefreshEnabled && !this.loading) {
        console.log('Auto-refreshing recent withdrawals...');
        this.loadWithdrawals();
      }
    }, this.autoRefreshSeconds * 1000);
  }
  
  toggleAutoRefresh() {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    if (this.autoRefreshEnabled) {
      this.startAutoRefresh();
    }
  }
  
  refresh() {
    this.loadWithdrawals();
  }
  
  viewWithdrawalDetails(withdrawal: RecentWithdrawal) {
    this.selectedWithdrawal = withdrawal;
    this.showDetailsModal = true;
  }
  
  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedWithdrawal = null;
  }
  
  // Helper methods
  formatCurrency(value: number, currency: string = 'USD'): string {
    const isValidCurrency = this.validCurrencies.includes(currency.toUpperCase());
    
    if (isValidCurrency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    } else {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 8
      }).format(value) + ` ${currency}`;
    }
  }
  
  formatNumber(value: number, decimals: number = 4): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }
  
  formatAddress(address: string): string {
    if (!address) return '';
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  }
  
  formatDate(date: string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return d.toLocaleDateString();
  }
  
  getNetworkColor(network: string): string {
    return this.networkColors[network] || '#6c757d';
  }
  
  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'PENDING': 'status-pending',
      'PROCESSING': 'status-processing',
      'APPROVED': 'status-approved',
      'SENT': 'status-sent',
      'COMPLETED': 'status-completed',
      'FAILED': 'status-failed',
      'CANCELLED': 'status-cancelled'
    };
    return classes[status] || 'status-unknown';
  }
  
  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'PENDING': 'fa-clock',
      'PROCESSING': 'fa-spinner',
      'APPROVED': 'fa-check-circle',
      'SENT': 'fa-paper-plane',
      'COMPLETED': 'fa-check-double',
      'FAILED': 'fa-times-circle',
      'CANCELLED': 'fa-ban'
    };
    return icons[status] || 'fa-question-circle';
  }
  
  getStatusLabel(status: string): string {
    return status;
  }
  
  // Stats
  getTotalWithdrawals(): number {
    return this.withdrawals.length;
  }
  
  getTotalVolume(): number {
    return this.withdrawals.reduce((sum, w) => sum + w.amount, 0);
  }
  
  getTotalFees(): number {
    return this.withdrawals.reduce((sum, w) => sum + w.feeAmount, 0);
  }
  
  getPendingCount(): number {
    return this.withdrawals.filter(w => w.status === 'PENDING').length;
  }
  
  getProcessingCount(): number {
    return this.withdrawals.filter(w => w.status === 'PROCESSING').length;
  }
  
  getApprovedCount(): number {
    return this.withdrawals.filter(w => w.status === 'APPROVED').length;
  }
  
  getSentCount(): number {
    return this.withdrawals.filter(w => w.status === 'SENT').length;
  }
  
  getCompletedCount(): number {
    return this.withdrawals.filter(w => w.status === 'COMPLETED').length;
  }
  
  getFailedCount(): number {
    return this.withdrawals.filter(w => w.status === 'FAILED').length;
  }
  
  getUniqueNetworks(): string[] {
    return [...new Set(this.withdrawals.map(w => w.network))];
  }
  
  getUniqueAssets(): string[] {
    return [...new Set(this.withdrawals.map(w => w.asset))];
  }
  
  getStats(): WithdrawalStats[] {
    return [
      { label: 'Total Withdrawals', value: this.getTotalWithdrawals(), icon: 'fa-arrow-up', color: 'primary', suffix: ' withdrawals' },
      { label: 'Total Volume', value: this.getTotalVolume(), icon: 'fa-chart-line', color: 'success', prefix: '$' },
      { label: 'Total Fees', value: this.getTotalFees(), icon: 'fa-percent', color: 'warning', prefix: '$' },
      { label: 'Pending', value: this.getPendingCount(), icon: 'fa-clock', color: 'warning', suffix: ' withdrawals' },
      { label: 'Processing', value: this.getProcessingCount(), icon: 'fa-spinner', color: 'info', suffix: ' withdrawals' },
      { label: 'Approved', value: this.getApprovedCount(), icon: 'fa-check-circle', color: 'primary', suffix: ' withdrawals' },
      { label: 'Sent', value: this.getSentCount(), icon: 'fa-paper-plane', color: 'info', suffix: ' withdrawals' },
      { label: 'Failed', value: this.getFailedCount(), icon: 'fa-times-circle', color: 'danger', suffix: ' withdrawals' },
      { label: 'Unique Assets', value: this.getUniqueAssets().length, icon: 'fa-coins', color: 'secondary', suffix: ' assets' }
    ];
  }
  
  formatStatValue(stat: WithdrawalStats): string {
    if (stat.prefix === '$' && stat.value >= 1000) {
      if (stat.value >= 1000000) {
        return stat.prefix + (stat.value / 1000000).toFixed(1) + 'M' + (stat.suffix || '');
      }
      if (stat.value >= 1000) {
        return stat.prefix + (stat.value / 1000).toFixed(1) + 'K' + (stat.suffix || '');
      }
    }
    if (stat.prefix) {
      return stat.prefix + this.formatNumber(stat.value) + (stat.suffix || '');
    }
    return this.formatNumber(stat.value) + (stat.suffix || '');
  }
}