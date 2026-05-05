// admin-recent-transactions.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AdminRecentTransactionsService } from './admin-recent-transactions.service';
import { RecentTransaction, TransactionStats } from './admin-recent-transactions.interface';

@Component({
  selector: 'app-admin-recent-transactions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-recent-transactions.component.html',
  styleUrls: ['./admin-recent-transactions.component.scss']
})
export class AdminRecentTransactionsComponent implements OnInit, OnDestroy {
  // Data
  transactions: RecentTransaction[] = [];
  
  // UI State
  loading = true;
  error = false;
  lastUpdated: Date | null = null;
  selectedTransaction: RecentTransaction | null = null;
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
  
  constructor(
    private service: AdminRecentTransactionsService
  ) {}
  
  ngOnInit() {
    this.loadTransactions();
    this.startAutoRefresh();
  }
  
  ngOnDestroy() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadTransactions() {
    this.loading = true;
    this.error = false;
    
    this.service.getRecentTransactions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.transactions = response.data;
          this.lastUpdated = new Date();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading recent transactions:', error);
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
        console.log('Auto-refreshing recent transactions...');
        this.loadTransactions();
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
    this.loadTransactions();
  }
  
  viewTransactionDetails(transaction: RecentTransaction) {
    this.selectedTransaction = transaction;
    this.showDetailsModal = true;
  }
  
  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedTransaction = null;
  }
  
  // Helper methods
  formatCurrency(value: number, currency: string = 'GHS'): string {
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
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value) + ` ${currency}`;
    }
  }
  
  formatNumber(value: number, decimals: number = 2): string {
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
  
  getTransactionTypeIcon(type: string): string {
    return type === 'CREDIT' ? 'fa-arrow-down' : 'fa-arrow-up';
  }
  
  getTransactionTypeClass(type: string): string {
    return type === 'CREDIT' ? 'success' : 'danger';
  }
  
  getTransactionTypeLabel(type: string): string {
    return type === 'CREDIT' ? 'Credit' : 'Debit';
  }
  
  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'PAID': 'status-paid',
      'FAILED': 'status-failed',
      'PENDING': 'status-pending',
      'PROCESSING': 'status-processing'
    };
    return classes[status] || 'status-unknown';
  }
  
  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'PAID': 'fa-check-circle',
      'FAILED': 'fa-times-circle',
      'PENDING': 'fa-clock',
      'PROCESSING': 'fa-spinner'
    };
    return icons[status] || 'fa-question-circle';
  }
  
  getStatusLabel(status: string): string {
    return status;
  }
  
  getAmountPrefix(type: string): string {
    return type === 'CREDIT' ? '+' : '-';
  }
  
  getAmountClass(type: string): string {
    return type === 'CREDIT' ? 'amount-positive' : 'amount-negative';
  }
  
  // Stats
  getTotalVolume(): number {
    return this.transactions.reduce((sum, t) => sum + t.actualAmount, 0);
  }
  
  getTotalCredits(): number {
    return this.transactions.filter(t => t.transaction_type === 'CREDIT').reduce((sum, t) => sum + t.actualAmount, 0);
  }
  
  getTotalDebits(): number {
    return this.transactions.filter(t => t.transaction_type === 'DEBIT').reduce((sum, t) => sum + t.actualAmount, 0);
  }
  
  getTotalFees(): number {
    return this.transactions.reduce((sum, t) => sum + (t.charges || 0), 0);
  }
  
  getTotalProfit(): number {
    return this.transactions.reduce((sum, t) => sum + (t.profitEarned || 0), 0);
  }
  
  getSuccessfulCount(): number {
    return this.transactions.filter(t => t.status === 'PAID').length;
  }
  
  getFailedCount(): number {
    return this.transactions.filter(t => t.status === 'FAILED').length;
  }
  
  getStats(): TransactionStats[] {
    return [
      { label: 'Total Transactions', value: this.transactions.length, icon: 'fa-list', color: 'primary' },
      { label: 'Total Volume', value: this.getTotalVolume(), icon: 'fa-chart-line', color: 'success', prefix: '₵' },
      { label: 'Total Credits', value: this.getTotalCredits(), icon: 'fa-arrow-down', color: 'success', prefix: '₵' },
      { label: 'Total Debits', value: this.getTotalDebits(), icon: 'fa-arrow-up', color: 'danger', prefix: '₵' },
      { label: 'Total Fees', value: this.getTotalFees(), icon: 'fa-percent', color: 'warning', prefix: '₵' },
      { label: 'Total Profit', value: this.getTotalProfit(), icon: 'fa-chart-simple', color: 'info', prefix: '₵' },
      { label: 'Successful', value: this.getSuccessfulCount(), icon: 'fa-check-circle', color: 'success' },
      { label: 'Failed', value: this.getFailedCount(), icon: 'fa-times-circle', color: 'danger' }
    ];
  }
  
  formatStatValue(stat: TransactionStats): string {
    if (stat.prefix) {
      return stat.prefix + this.formatNumber(stat.value);
    }
    return this.formatNumber(stat.value);
  }
}