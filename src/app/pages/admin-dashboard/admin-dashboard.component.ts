// admin-dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AdminDashboardService } from './admin-dashboard.service';
import { DashboardSummary, DashboardStats } from './admin-dashboard.interface';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  // Data
  summary: DashboardSummary | null = null;
  
  // UI State
  loading = true;
  error = false;
  lastUpdated: Date | null = null;
  
  // Auto-refresh
  private autoRefreshInterval: any;
  autoRefreshEnabled = true;
  autoRefreshSeconds = 60;
  
  // Destroy subject
  private destroy$ = new Subject<void>();
  
  Math = Math;
  
  // Valid currencies for formatting
  private validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'AUD', 'CNY', 'INR', 'BRL', 'GHS', 'NGN', 'ZAR'];
  
  constructor(
    private service: AdminDashboardService
  ) {}
  
  ngOnInit() {
    this.loadDashboard();
    this.startAutoRefresh();
  }
  
  ngOnDestroy() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadDashboard() {
    this.loading = true;
    this.error = false;
    
    this.service.getSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.summary = response.data;
          this.lastUpdated = new Date();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading dashboard:', error);
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
        console.log('Auto-refreshing dashboard...');
        this.loadDashboard();
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
    this.loadDashboard();
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
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value) + ` ${currency}`;
    }
  }
  
  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }
  
  formatCompactNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }
  
  getStatusClass(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower === 'paid' || statusLower === 'completed' || statusLower === 'success') {
      return 'status-success';
    }
    if (statusLower === 'initiated' || statusLower === 'pending') {
      return 'status-pending';
    }
    if (statusLower === 'failed') {
      return 'status-failed';
    }
    return 'status-default';
  }
  
  getStatusIcon(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower === 'paid' || statusLower === 'completed' || statusLower === 'success') {
      return 'fa-check-circle';
    }
    if (statusLower === 'initiated' || statusLower === 'pending') {
      return 'fa-clock';
    }
    if (statusLower === 'failed') {
      return 'fa-times-circle';
    }
    return 'fa-circle';
  }
  
  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }
  
  getRangeLabel(): string {
    if (!this.summary) return 'Today';
    const from = new Date(this.summary.range.from);
    const to = new Date(this.summary.range.to);
    return `${from.toLocaleDateString()} - ${to.toLocaleDateString()}`;
  }
  
  // Stats cards data based on actual API
  getMainStats(): DashboardStats[] {
    if (!this.summary) return [];
    
    return [
      {
        label: 'Total Volume',
        value: this.summary.today.volume,
        change: 0,
        icon: 'fa-chart-line',
        color: 'primary',
        prefix: 'GHS'
      },
      {
        label: 'Total Transactions',
        value: this.summary.totalTransactions,
        change: 0,
        icon: 'fa-exchange-alt',
        color: 'success',
        suffix: ' txns'
      },
      {
        label: 'Credits Volume',
        value: this.summary.credits.totalAmount,
        change: 0,
        icon: 'fa-arrow-down',
        color: 'info',
        prefix: 'GHS'
      },
      {
        label: 'Debits Volume',
        value: this.summary.debits.totalAmount,
        change: 0,
        icon: 'fa-arrow-up',
        color: 'warning',
        prefix: 'GHS'
      },
      {
        label: 'Total Profit',
        value: this.summary.today.profit,
        change: 0,
        icon: 'fa-chart-simple',
        color: 'success',
        prefix: 'GHS'
      },
      {
        label: 'Success Rate',
        value: (this.summary.statuses.PAID.count / this.summary.totalTransactions) * 100,
        change: 0,
        icon: 'fa-percent',
        color: 'primary',
        suffix: '%'
      }
    ];
  }
}