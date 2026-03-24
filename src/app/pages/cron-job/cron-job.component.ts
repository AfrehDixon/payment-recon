// cron-job.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, interval } from 'rxjs';
import { 
  CronJob,
  CronJobConfigUpdate
} from './cron-job.interface';
import { CronJobService } from './cron-job.service';

@Component({
  selector: 'app-cron-jobs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cron-job.component.html',
  styleUrls: ['./cron-job.component.scss']
})
export class CronJobComponent implements OnInit, OnDestroy {
  // Data
  jobs: CronJob[] = [];
  selectedJob: CronJob | null = null;
  filteredJobs: CronJob[] = [];

  // Computed properties for stats
  get totalJobs(): number {
    return this.jobs.length;
  }

  get runningJobs(): number {
    return this.jobs.filter(job => job.running).length;
  }

  get stoppedJobs(): number {
    return this.jobs.filter(job => !job.running).length;
  }

  // Forms
  filterForm!: FormGroup;
  configForm!: FormGroup;
  
  // UI State
  loading = false;
  showFilters = false;
  showConfigModal = false;
  showDetailsModal = false;
  actionLoading = false;
  filterText = '';
  statusFilter = 'all';
  
  // Refresh interval (30 seconds)
  private refreshInterval: any;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private service: CronJobService
  ) {
    this.initFilterForm();
    this.initConfigForm();
  }

  ngOnInit() {
    this.loadJobs();
    this.setupAutoRefresh();
    this.setupFilterSubscriptions();
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initFilterForm() {
    this.filterForm = this.fb.group({
      search: [''],
      status: ['all']
    });
  }

  private initConfigForm() {
    this.configForm = this.fb.group({
      enabled: [true],
      autoStart: [true],
      autoRestartOnFailure: [false],
      allowManualRun: [true]
    });
  }

  private setupAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.loadJobs(true);
    }, 30000); // Refresh every 30 seconds
  }

  private setupFilterSubscriptions() {
    this.filterForm.get('search')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.filterText = value;
        this.applyFilters();
      });

    this.filterForm.get('status')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.statusFilter = value;
        this.applyFilters();
      });
  }

  loadJobs(silent: boolean = false) {
    if (!silent) this.loading = true;
    
    this.service.getCronJobs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.jobs = response.data;
          this.applyFilters();
          if (!silent) this.loading = false;
        },
        error: (error) => {
          console.error('Error loading cron jobs:', error);
          if (!silent) this.loading = false;
        }
      });
  }

  applyFilters() {
    let filtered = [...this.jobs];
    
    // Apply status filter
    if (this.statusFilter !== 'all') {
      if (this.statusFilter === 'running') {
        filtered = filtered.filter(job => job.running);
      } else if (this.statusFilter === 'idle') {
        filtered = filtered.filter(job => !job.running);
      }
    }
    
    // Apply search filter
    if (this.filterText) {
      const searchLower = this.filterText.toLowerCase();
      filtered = filtered.filter(job => 
        job.name.toLowerCase().includes(searchLower) ||
        (job.description?.toLowerCase().includes(searchLower)) ||
        job.runtimeStatus?.toLowerCase().includes(searchLower)
      );
    }
    
    this.filteredJobs = filtered;
  }

  clearFilters() {
    this.filterForm.reset({
      search: '',
      status: 'all'
    });
    this.filterText = '';
    this.statusFilter = 'all';
    this.applyFilters();
  }

  viewJobDetails(job: CronJob) {
    this.selectedJob = job;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedJob = null;
  }

  openConfigModal(job: CronJob) {
    this.selectedJob = job;
    this.configForm.reset({
      enabled: job.enabled,
      autoStart: job.autoStart,
      autoRestartOnFailure: job.autoRestartOnFailure,
      allowManualRun: job.allowManualRun
    });
    this.showConfigModal = true;
  }

  closeConfigModal() {
    this.showConfigModal = false;
    this.selectedJob = null;
    this.configForm.reset();
  }

  saveConfig() {
    if (!this.selectedJob) return;
    
    this.actionLoading = true;
    const config: CronJobConfigUpdate = {
      enabled: this.configForm.value.enabled,
      autoStart: this.configForm.value.autoStart,
      autoRestartOnFailure: this.configForm.value.autoRestartOnFailure,
      allowManualRun: this.configForm.value.allowManualRun,
      updatedBy: 'admin'
    };
    
    this.service.updateConfig(this.selectedJob.name, config)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Config updated:', response);
          this.closeConfigModal();
          this.loadJobs();
          this.actionLoading = false;
        },
        error: (error) => {
          console.error('Error updating config:', error);
          this.actionLoading = false;
        }
      });
  }

  startJob(job: CronJob) {
    if (!confirm(`Are you sure you want to start "${job.name}"?`)) return;
    
    this.actionLoading = true;
    this.service.startJob(job.name, 'admin')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Job start requested:', response);
          this.loadJobs();
          this.actionLoading = false;
        },
        error: (error) => {
          console.error('Error starting job:', error);
          this.actionLoading = false;
        }
      });
  }

  stopJob(job: CronJob) {
    if (!confirm(`Are you sure you want to stop "${job.name}"?`)) return;
    
    this.actionLoading = true;
    this.service.stopJob(job.name, 'admin')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Job stop requested:', response);
          this.loadJobs();
          this.actionLoading = false;
        },
        error: (error) => {
          console.error('Error stopping job:', error);
          this.actionLoading = false;
        }
      });
  }

  restartJob(job: CronJob) {
    if (!confirm(`Are you sure you want to restart "${job.name}"?`)) return;
    
    this.actionLoading = true;
    this.service.restartJob(job.name, 'admin')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Job restart requested:', response);
          this.loadJobs();
          this.actionLoading = false;
        },
        error: (error) => {
          console.error('Error restarting job:', error);
          this.actionLoading = false;
        }
      });
  }

  // Helper methods
  getStatusClass(job: CronJob): string {
    if (job.running) {
      return 'status-running';
    }
    if (job.runtimeStatus === 'error') {
      return 'status-error';
    }
    return 'status-stopped';
  }

  getStatusText(job: CronJob): string {
    if (job.running) {
      return 'Running';
    }
    if (job.runtimeStatus === 'error') {
      return 'Error';
    }
    return 'Stopped';
  }

  getStatusIcon(job: CronJob): string {
    if (job.running) {
      return 'fas fa-play-circle';
    }
    if (job.runtimeStatus === 'error') {
      return 'fas fa-exclamation-circle';
    }
    return 'fas fa-stop-circle';
  }

  formatDate(date: string | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  formatAddress(address: string | null): string {
    if (!address) return 'N/A';
    if (address.length <= 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-10)}`;
  }

  getControlCommandDisplay(command: string | null): string {
    if (!command) return '-';
    const commands: Record<string, string> = {
      'start': 'Start Requested',
      'stop': 'Stop Requested',
      'restart': 'Restart Requested'
    };
    return commands[command] || command;
  }

  isActionDisabled(job: CronJob): boolean {
    return !!job.controlCommand || this.actionLoading;
  }

  canStart(job: CronJob): boolean {
    return !job.running && job.allowManualRun && !job.controlCommand;
  }

  canStop(job: CronJob): boolean {
    return job.running && !job.controlCommand;
  }

  canRestart(job: CronJob): boolean {
    return !job.controlCommand;
  }

  canConfigure(job: CronJob): boolean {
    return !job.controlCommand;
  }
}