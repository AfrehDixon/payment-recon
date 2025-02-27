import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { catchError, finalize } from 'rxjs/operators';
import { Observable, of, Subscription } from 'rxjs';
import url from '../../constants/api.constant';
import { NgLetDirective } from './ngDirective';

const API_URL = url;

interface LogEntry {
    _id: string;
    timestamp: string;
    level: string;
    message: string;
    service: string;
    merchantId?: string;
    metadata?: any;
  }
  
  interface TimelineDataset {
    level: string;
    data: number[];
  }
  
  interface ServiceStats {
    _id: string;
    count: number;
    errors: number;
  }
  
  interface SummaryResponse {
    success: boolean;
    data: {
      timeline: {
        labels: string[];
        datasets: TimelineDataset[];
      };
      services: ServiceStats[];
      recentErrors: LogEntry[];
    };
  }
  
  interface Merchant {
    _id: string;
    merchant_tradeName: string;
    active: boolean;
  }
  
  interface LevelTotals {
    [level: string]: number;
  }
  
  @Component({
    selector: 'app-logs-summary',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './logs-summary.component.html',
    styleUrls: ['./logs-summary.component.scss'],
    providers: [DatePipe]
  })
  export class LogsSummaryComponent implements OnInit {
    // Filter form
    filterForm: FormGroup;
    
    // Data
    timelineData: {labels: string[], datasets: TimelineDataset[]} | null = null;
    serviceStats: ServiceStats[] = [];
    recentErrors: LogEntry[] = [];
    merchants: Merchant[] = [];

    private pollingSubscription: Subscription | null = null;
    private pollingInterval = 30000; // 30 seconds by default
    
    // UI state
    isLoading = false;
    error: string | null = null;
    expandedErrorIds: Set<string> = new Set();
    
    // Level totals - pre-calculated
    levelTotals: LevelTotals = {};
    
    // Color mapping for log levels
    levelColors: { [key: string]: {bg: string, text: string, border: string, hover: string} } = {
        error: {bg: 'rgba(239, 68, 68, 0.2)', text: 'rgb(220, 38, 38)', border: 'rgb(239, 68, 68)', hover: 'rgba(239, 68, 68, 0.4)'},
        warn: {bg: 'rgba(245, 158, 11, 0.2)', text: 'rgb(217, 119, 6)', border: 'rgb(245, 158, 11)', hover: 'rgba(245, 158, 11, 0.4)'},
        info: {bg: 'rgba(59, 130, 246, 0.2)', text: 'rgb(37, 99, 235)', border: 'rgb(59, 130, 246)', hover: 'rgba(59, 130, 246, 0.4)'},
        debug: {bg: 'rgba(16, 185, 129, 0.2)', text: 'rgb(5, 150, 105)', border: 'rgb(16, 185, 129)', hover: 'rgba(16, 185, 129, 0.4)'},
        trace: {bg: 'rgba(139, 92, 246, 0.2)', text: 'rgb(124, 58, 237)', border: 'rgb(139, 92, 246)', hover: 'rgba(139, 92, 246, 0.4)'},
        http: {bg: 'rgba(79, 70, 229, 0.2)', text: 'rgb(67, 56, 202)', border: 'rgb(79, 70, 229)', hover: 'rgba(79, 70, 229, 0.4)'}
      };
    
    // Calculated datasets for charts
    totalLogsPerDay: number[] = [];
    highestLogCount = 0;
    totalLogCount = 0;
    errorCount = 0;
    
    // Make Math available to template
    Math = Math;
    
    constructor(
      private http: HttpClient,
      private fb: FormBuilder,
      private datePipe: DatePipe
    ) {
      // Initialize filter form
      this.filterForm = this.fb.group({
        days: [7],
        merchantId: ['']
      });
    }
    
    ngOnInit(): void {
      this.fetchMerchants();
      this.fetchSummary();
      
      // Listen to filter changes
      this.filterForm.valueChanges.subscribe(() => {
        this.fetchSummary();
      });
    }
    
    fetchMerchants(): void {
      this.http.get<{success: boolean, data: Merchant[]}>(`${API_URL}/merchants/get`)
        .pipe(
          catchError(error => {
            console.error('Error fetching merchants:', error);
            return of({success: false, data: []});
          })
        )
        .subscribe(response => {
          if (response && response.success) {
            this.merchants = response.data.filter(m => m.active);
          }
        });
    }
    
    fetchSummary(): void {
        this.isLoading = true;
        this.error = null;
        
        const { days, merchantId } = this.filterForm.value;
        
        let params = new HttpParams().set('days', days);
        
        if (merchantId) {
          params = params.set('merchantId', merchantId);
        }
        
        
        this.http.get<SummaryResponse>(`${API_URL}/logs/summary`, { params })
          .pipe(
            catchError(error => {
              this.error = error.error?.message || 'Failed to fetch log summary';
              return of(null);
            }),
            finalize(() => {
              this.isLoading = false;
            })
          )
          .subscribe(response => {
            if (response && response.success) {
              console.log('Raw response:', response); // Add this for debugging
              this.timelineData = response.data.timeline;
              this.serviceStats = response.data.services;
              this.recentErrors = response.data.recentErrors;
              
              // Calculate totals for each level
              this.calculateLevelTotals();
              
              // Calculate chart metrics
              if (this.timelineData && this.timelineData.datasets.length > 0) {
                this.calculateChartMetrics();
              }
            } else {
              this.error = 'Failed to load log summary data';
            }
          });
      }
    
    calculateLevelTotals(): void {
      if (!this.timelineData) return;
      
      this.levelTotals = {};
      
      for (const dataset of this.timelineData.datasets) {
        // Calculate total for this level
        const total = dataset.data.reduce((sum, count) => sum + count, 0);
        this.levelTotals[dataset.level] = total;
      }
    }
    
    calculateChartMetrics(): void {
      if (!this.timelineData) return;
      
      const { labels, datasets } = this.timelineData;
      
      // Calculate total logs per day
      this.totalLogsPerDay = labels.map((_, dayIndex) => {
        return datasets.reduce((sum, dataset) => sum + dataset.data[dayIndex], 0);
      });
      
      // Calculate highest log count for scaling
      this.highestLogCount = Math.max(...this.totalLogsPerDay);
      
      // Calculate total logs
      this.totalLogCount = this.totalLogsPerDay.reduce((sum, count) => sum + count, 0);
      
      // Calculate error count
      const errorDataset = datasets.find(d => d.level === 'error');
      this.errorCount = errorDataset ? errorDataset.data.reduce((sum, count) => sum + count, 0) : 0;
    }
    
    getLevelTotal(level: string): number {
      return this.levelTotals[level] || 0;
    }
    
    getLevelPercentage(level: string): string {
      const total = this.getLevelTotal(level);
      if (this.totalLogCount === 0) return '0%';
      return ((total / this.totalLogCount) * 100).toFixed(1) + '%';
    }
    
    getLevelDailyAverage(level: string): string {
      if (!this.timelineData || this.timelineData.labels.length === 0) return '0';
      const total = this.getLevelTotal(level);
      return (total / this.timelineData.labels.length).toFixed(1);
    }
    
    toggleErrorDetails(id: string): void {
      if (this.expandedErrorIds.has(id)) {
        this.expandedErrorIds.delete(id);
      } else {
        this.expandedErrorIds.add(id);
      }
    }
    
    isErrorExpanded(id: string): boolean {
      return this.expandedErrorIds.has(id);
    }
    
    formatDate(date: string): string {
      return this.datePipe.transform(date, 'MMM d, y, h:mm:ss a') || date;
    }
    
    formatShortDate(date: string): string {
      return this.datePipe.transform(date, 'MMM d') || date;
    }
    
    getMerchantName(id: string): string {
      const merchant = this.merchants.find(m => m._id === id);
      return merchant ? merchant.merchant_tradeName : 'Unknown Merchant';
    }
    
    getLogLevelClass(level: string): string {
        const levelMap: {[key: string]: string} = {
          'error': 'text-red-600 bg-red-100',
          'warn': 'text-yellow-600 bg-yellow-100',
          'info': 'text-blue-600 bg-blue-100',
          'debug': 'text-green-600 bg-green-100',
          'trace': 'text-purple-600 bg-purple-100',
          'http': 'text-indigo-600 bg-indigo-100'
        };
        
        return levelMap[level.toLowerCase()] || 'text-gray-600 bg-gray-100';
      }
      
    
    getChartAreaHeight(count: number): string {
      if (this.highestLogCount === 0) return '0%';
      const percentage = (count / this.highestLogCount) * 100;
      return `${percentage}%`;
    }
    
    // Get JSON representation of metadata for display
    formatMetadata(metadata: any): string {
      if (!metadata) return '';
      try {
        return JSON.stringify(metadata, null, 2);
      } catch (e) {
        return String(metadata);
      }
    }
    
    getServiceErrorPercentage(service: ServiceStats): number {
      if (service.count === 0) return 0;
      return (service.errors / service.count) * 100;
    }
  
    getErrorPercentageClass(percentage: number): string {
      if (percentage >= 50) return 'text-red-600';
      if (percentage >= 20) return 'text-yellow-600';
      return 'text-green-600';
    }
  }