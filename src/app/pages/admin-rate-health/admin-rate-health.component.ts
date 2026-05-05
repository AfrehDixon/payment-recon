// admin-rate-health.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AdminRateHealthService } from './admin-rate-health.service';
import { RateHealthMetric, HealthStats, RateHealthSummary } from './admin-rate-health.interface';

@Component({
  selector: 'app-admin-rate-health',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-rate-health.component.html',
  styleUrls: ['./admin-rate-health.component.scss']
})
export class AdminRateHealthComponent implements OnInit, OnDestroy {
  // Data
  metrics: RateHealthMetric[] = [];
  summary: RateHealthSummary | null = null;
  
  // UI State
  loading = true;
  error = false;
  lastUpdated: Date | null = null;
  selectedMetric: RateHealthMetric | null = null;
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
    private service: AdminRateHealthService
  ) {}
  
  ngOnInit() {
    this.loadRateHealth();
    this.startAutoRefresh();
  }
  
  ngOnDestroy() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadRateHealth() {
    this.loading = true;
    this.error = false;
    
    this.service.getRateHealth()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.metrics = response.data;
          this.calculateSummary();
          this.lastUpdated = new Date();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading rate health:', error);
          this.error = true;
          this.loading = false;
        }
      });
  }
  
  calculateSummary() {
    const upCount = this.metrics.filter(m => m.status === 'UP').length;
    const downCount = this.metrics.filter(m => m.status === 'DOWN').length;
    const degradedCount = this.metrics.filter(m => m.status === 'DEGRADED').length;
    const staleCount = this.metrics.filter(m => m.status === 'STALE').length;
    
    const ages = this.metrics.map(m => m.ageMs);
    const averageAgeMs = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;
    const oldestAgeMs = ages.length > 0 ? Math.max(...ages) : 0;
    const newestAgeMs = ages.length > 0 ? Math.min(...ages) : 0;
    
    let overallStatus: 'HEALTHY' | 'DEGRADED' | 'POOR' = 'HEALTHY';
    if (downCount > 0 || degradedCount > 2) {
      overallStatus = 'POOR';
    } else if (degradedCount > 0 || staleCount > 0) {
      overallStatus = 'DEGRADED';
    }
    
    this.summary = {
      totalSources: this.metrics.length,
      upCount,
      downCount,
      degradedCount,
      staleCount,
      averageAgeMs,
      oldestAgeMs,
      newestAgeMs,
      overallStatus
    };
  }
  
  startAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    
    this.autoRefreshInterval = setInterval(() => {
      if (this.autoRefreshEnabled && !this.loading) {
        console.log('Auto-refreshing rate health...');
        this.loadRateHealth();
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
    this.loadRateHealth();
  }
  
  viewMetricDetails(metric: RateHealthMetric) {
    this.selectedMetric = metric;
    this.showDetailsModal = true;
  }
  
  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedMetric = null;
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
        maximumFractionDigits: 8
      }).format(value) + ` ${currency}`;
    }
  }
  
  formatNumber(value: number, decimals: number = 2): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }
  
  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }
  
  formatAge(ageMs: number): string {
    const seconds = Math.floor(ageMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  }
  
  getAgeClass(ageMs: number): string {
    const hours = ageMs / (1000 * 60 * 60);
    if (hours < 1) return 'age-fresh';
    if (hours < 24) return 'age-moderate';
    if (hours < 48) return 'age-aging';
    return 'age-stale';
  }
  
  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'UP': 'status-up',
      'DOWN': 'status-down',
      'DEGRADED': 'status-degraded',
      'STALE': 'status-stale'
    };
    return classes[status] || 'status-unknown';
  }
  
  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'UP': 'fa-check-circle',
      'DOWN': 'fa-times-circle',
      'DEGRADED': 'fa-exclamation-triangle',
      'STALE': 'fa-clock'
    };
    return icons[status] || 'fa-question-circle';
  }
  
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'UP': 'Up',
      'DOWN': 'Down',
      'DEGRADED': 'Degraded',
      'STALE': 'Stale'
    };
    return labels[status] || status;
  }
  
  getOverallHealthClass(health: string): string {
    const classes: Record<string, string> = {
      'HEALTHY': 'health-healthy',
      'DEGRADED': 'health-degraded',
      'POOR': 'health-poor'
    };
    return classes[health] || 'health-unknown';
  }
  
  getOverallHealthStatus(): string {
    if (!this.summary) return 'Unknown';
    const labels: Record<string, string> = {
      'HEALTHY': 'System Healthy',
      'DEGRADED': 'System Degraded',
      'POOR': 'System Poor'
    };
    return labels[this.summary.overallStatus] || 'Unknown';
  }
  
  getProviderDisplay(provider: string | null): string {
    return provider || 'Unknown Provider';
  }
  
  getPairDisplay(pair: string | null): string {
    return pair || 'Unknown Pair';
  }
  
  // Stats
  getStats(): HealthStats[] {
    if (!this.summary) return [];
    
    return [
      { label: 'Total Sources', value: this.summary.totalSources, icon: 'fa-database', color: 'primary', suffix: ' sources' },
      { label: 'Up', value: this.summary.upCount, icon: 'fa-check-circle', color: 'success', suffix: ' sources' },
      { label: 'Down', value: this.summary.downCount, icon: 'fa-times-circle', color: 'danger', suffix: ' sources' },
      { label: 'Degraded', value: this.summary.degradedCount, icon: 'fa-exclamation-triangle', color: 'warning', suffix: ' sources' },
      { label: 'Stale', value: this.summary.staleCount, icon: 'fa-clock', color: 'info', suffix: ' sources' },
      { label: 'Avg Age', value: this.summary.averageAgeMs, icon: 'fa-hourglass-half', color: 'secondary', suffix: ' old' }
    ];
  }
  
  formatStatValue(stat: HealthStats): string {
    if (stat.label === 'Avg Age') {
      return this.formatAge(stat.value);
    }
    return stat.value.toString() + (stat.suffix || '');
  }
  
  getUptimePercentage(): number {
    if (!this.summary || this.summary.totalSources === 0) return 0;
    return (this.summary.upCount / this.summary.totalSources) * 100;
  }
}